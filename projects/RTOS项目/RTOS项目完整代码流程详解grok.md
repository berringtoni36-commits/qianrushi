# RTOS 油烟机项目：完整代码流程走读

> 目标：按程序真实执行顺序，把代码从 `main` 一路跟到各任务、中断、驱动。  
> 以源码为准。关键路径会贴代码并说明「下一步调谁」。

---

## 0. 代码运行总图（先看这个）

> 下面这张是**整份工程的总调用/运行图**。  
> 符号约定：`→` 函数调用；`⇒` 写数据；`⇐` 读数据；`⚡` 中断；`⏸` 阻塞等待。  
> 建议：先通读总图建立全局，再按目录进各章抠细节。

### 0.1 总览：从上电到“永远并行”

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║                         整机代码生命周期（一张图看完）                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

【阶段A：上电，还没进 main】
  复位向量 (startup_stm32f10x_*.s)
      → 设 MSP / 拷贝 .data / 清 .bss
      → SystemInit()                    // USER/system_stm32f10x.c 配时钟(~72MHz)
      → main()

【阶段B：main 里顺序执行，调度器未开 —— 单线程】
  main()  ──────────────────────────────────────────────┐
    │                                                   │
    ├─① Hardware_Init()     所有外设 ready（见 0.2）      │
    ├─② System_Init()       g_systemState + 锁/信号量    │
    ├─③ StartTask_Create()  只创建 StartTask 一个任务     │
    └─④ vTaskStartScheduler()  ─────────────────────────┘
              │ 此后 main 的 while(1) 正常到不了
              ▼
【阶段C：StartTask 一次性启动业务（临界区内）】
  StartTask()
      taskENTER_CRITICAL()
      ├─ xTaskCreate(KeyScanTask)         pri=4  10ms
      ├─ xTaskCreate(SensorTask)          pri=3  500ms
      ├─ xTaskCreate(WindSpeedTask)       pri=3  100ms
      ├─ xTaskCreate(MotorControlTask)    pri=5  50ms
      ├─ xTaskCreate(UIDisplayTask)       pri=1  200ms
      ├─ xTaskCreate(AntiBackflowTask)    pri=2  100ms
      ├─ xTaskCreate(SpeedCalcTask)       pri=6  事件驱动
      ├─ xTaskCreate(iap_task)            pri=7  [仅 ifopen=1]
      ├─ TIM4_init(4, 14399)              // 约1ms，必须在信号量创建后
      taskEXIT_CRITICAL()
      └─ vTaskDelete(自己)                // StartTask 消失

【阶段D：永久运行 —— 多任务 + 中断抢占】
  FreeRTOS 按优先级切换下面这些 while(1) / ISR（见 0.3 ~ 0.6）
```

优先级（数字越大越高）：

```text
iap(7) > SpeedCalc(6) > Motor(5) > Key(4) > Sensor(3)=Wind(3) > AntiBF(2) > UI(1)
```

---

### 0.2 Hardware_Init 调用展开图

```text
Hardware_Init()   【USER/main.c】
 │
 ├─ NVIC_PriorityGroupConfig(Group_4)
 │     // 4位抢占；配合 FreeRTOS：FromISR 的中断抢占优先级必须 ≥3
 │     // 本工程：DMA=4, TIM4=5, TIM2=6
 │
 ├─ delay_init()                    → SYSTEM/delay
 │
 ├─ TIM1_dead_pwm_init(999,71,0,100) → BSP/MOTOR/motor.c
 │     ├─ 开 TIM1 时钟
 │     ├─ PA8=CH1, PB13=CH1N, PA2=H桥使能(推挽)
 │     ├─ 时基：1kHz PWM；BDTR 死区 dtg=100
 │     ├─ TIM_OC1Init + Preload
 │     ├─ TIM_CtrlPWMOutputs(ENABLE)
 │     └─ TIM_Cmd(ENABLE)
 │
 ├─ motor_init()
 │     ├─ motor_dir(stright) → 关双通道后开 CH1N
 │     ├─ motor_stop()       → 关 CH1/CH1N + PA2=0
 │     └─ motor_start()      → PA2=1（使能桥；通道等以后 pwm_set 再开）
 │
 ├─ TIM2_encode_init(0xFFFF, 0)     → BSP/MOTOR/motor.c
 │     ├─ PA0/PA1 编码器输入
 │     ├─ EncoderMode_TI12（4倍频）
 │     ├─ 更新中断 pri=6 → 以后 TIM2_IRQHandler 改 overflow
 │     └─ TIM_Cmd(ENABLE)  // 硬件开始计脉冲
 │
 ├─ Beep_Init(&bep, GPIOB, Pin_15)  → BSP/BEEP
 ├─ Key_Init()                      → BSP/KEY  (PB1, PB12 上拉 + 状态机结构清零)
 ├─ MQ2_Init()                      → BSP/MQ2  (PA4, ADC1_CH4 校准)
 ├─ PID_Init(&g_speedPID, 14, 1.65, 0, 1000, 0)  → BSP/PID
 ├─ WindSpeed_Init()                → BSP/WIND (算法状态清零)
 ├─ LCD_Init()                      → BSP/LCD (+SPI)
 ├─ uart_init(115200)               → SYSTEM/usart (须靠后，注释：否则影响电机)
 │     └─ 使能 USART_DMAReq_Rx（为 IAP 准备）
 │
 ├─ [ifopen] MYDMA_Config(DMA1_CH5, &USART1->DR, receive_buff@0x20004000, buff_size)
 │     └─ TC 中断 pri=4 → 以后 DMA1_Channel5_IRQHandler
 │
 └─ Show_Str("Init Complete!") → delay_ms(500)
```

---

### 0.3 System_Init + 共享数据中心图

```text
System_Init()
 ├─ g_systemState 全部默认值
 │     currentMode = STANDBY
 │     speedLevel  = LOW
 │     motorRunning= 0
 │     gasThreshold= GAS_THRESHOLD_NORMAL(100)
 │     其余温湿度/气体/PWM/RPM/标志/计时 = 0
 │
 ├─ g_dataMutex          = xSemaphoreCreateMutex()     // 保护 g_systemState
 ├─ g_speedCalcSemaphore = xSemaphoreCreateBinary()  // TIM4 → SpeedCalc
 └─ [ifopen] g_iapSemaphore = xSemaphoreCreateBinary() // DMA → iap_task


                    ┌─────────────────────────────────────────┐
                    │           g_systemState（公共面板）        │
                    │  currentMode / speedLevel / motorRunning │
                    │  temperature / humidity / gasConcentration│
                    │  windSpeedPWM / actualRPM / targetRPM    │
                    │  cookingEventActive / antiBackflowActive │
                    │  gasThreshold / autoModeCounter / ...    │
                    └───────────────┬─────────────────────────┘
                                    │ g_dataMutex 保护关键读写
         ┌──────────────┬───────────┼───────────┬──────────────┐
         │写             │写          │写          │写             │写
    SensorTask     WindSpeedTask  Key相关   AntiBackflow  Motor(部分)
    T/H/Gas        PWM/cooking   模式档位开关  防回流标志   actualRPM等
         │              │           │           │              │
         └──────────────┴───────────┴───────────┴──────┬───────┘
                                                       │读
                                    Motor / UI / Wind / AntiBF


  另两个全局（不在结构体里）：
    overflow  ⚡TIM2_IRQHandler 写
    speed     SpeedCalcTask 写  →  MotorControlTask / PID 读
```

---

### 0.4 运行期总图：八任务 + 三中断怎么缠在一起

```text
                         ╔════════ 硬件世界 ════════╗
                         ║ 按键PB1/PB12  蜂鸣器PB15  ║
                         ║ DHT11@PC14   MQ2@PA4     ║
                         ║ 编码器PA0/1  电机PWM     ║
                         ║ 串口USART1   LCD/SPI     ║
                         ╚══════════╤═══════════════╝
                                    │
     ⚡TIM2_IRQHandler               │              ⚡TIM4_IRQHandler (≈1ms)
     (溢出) overflow++/--           │              Give(g_speedCalcSemaphore)
                                    │                       │
                                    │                       ▼ ⏸Take
                                    │              ┌─────────────────┐
                                    │              │ SpeedCalcTask   │ pri6
                                    │              │ get_encoder_value
                                    │              │ get_speed → speed
                                    │              └────────┬────────┘
                                    │                       │ speed
                                    │                       ▼
 ┌──────────────┐ 10ms     ┌────────┴────────┐ 50ms   ┌──────────────┐
 │ KeyScanTask  │          │ MotorControlTask│        │UIDisplayTask │ 200ms
 │ Key_Scan     │──改模式──▶│ switch(mode)    │        │ Show_Str 读状态│
 │ SwitchMode/  │──改档位──▶│ STANDBY stop    │        └──────────────┘
 │ Speed/Toggle │──开关机──▶│ MANUAL  PID     │
 └──────┬───────┘          │ AUTO  三态机     │
        │                  │ ANTI   PID(若激活)│
        ▼                  └────────┬─────────┘
   Beep / motor_start/stop          │ motor_pwm_set
                                    ▼
                              TIM1 CCR + 方向通道 → H桥 → 电机


 ┌──────────────┐ 500ms         ┌──────────────┐ 100ms
 │ SensorTask   │               │ WindSpeedTask│
 │ DHT_Read_Data│⇒ T,H          │ 读 T/H/Gas   │
 │ MQ2_GetGas.. │⇒ Gas          │ WindSpeed_Update
 └──────────────┘               │ ⇒ windSpeedPWM
                                │ ⇒ cookingEventActive
                                └───────┬────────┘
                                        │ 自动模式用
                                        ▼
                               Motor AUTO: GetPWMCompare


 ┌──────────────────┐ 100ms
 │ AntiBackflowTask │  仅 MODE_ANTI_BACKFLOW
 │ gas 与阈值比较    │⇒ antiBackflowActive / motor_start|stop
 └────────┬─────────┘
          └──────────▶ Motor ANTI 分支做 PID


 [ifopen=1]
  串口字节 → DMA1_CH5 → receive_buff
       ⚡DMA1_Channel5_IRQHandler → Give(g_iapSemaphore)
       ⏸iap_task Take → CRC32 → 写 Flash → iap_load_app
```

---

### 0.5 每条任务的完整调用树（运行时）

#### A. KeyScanTask（10ms）

```text
KeyScanTask
 └─ while(1)
      ├─ Key_Scan()
      │    ├─ Key_StateMachine(&g_key1)   // PB1
      │    └─ Key_StateMachine(&g_key2)   // PB12
      │         状态: IDLE→DEBOUNCE(30ms)→PRESSED→LONG_PRESS→RELEASE
      │         事件: NONE / SHORT / LONG / LONG_PRESSING / RELEASE
      │
      ├─ Key1 事件
      │    SHORT → System_SwitchMode()
      │              Take(mutex)
      │              STANDBY→MANUAL→AUTO→ANTI→STANDBY
      │              非AUTO: motorRunning=0, motor_stop()
      │              Give(mutex)
      │            Buzzer_Beep(100) → Beep_on/off
      │    LONG_PRESSING → Beep_on
      │    RELEASE → Beep_off
      │
      ├─ Key2 事件
      │    SHORT → System_SwitchSpeedLevel()  // LOW↔HIGH
      │    LONG  → System_ToggleMotor()
      │              运行中: stop + 强制 STANDBY
      │              停止时: start + 强制 MANUAL
      │    LONG_PRESSING / RELEASE → 蜂鸣器
      │
      └─ delay_ms(10)
```

#### B. SensorTask（500ms）

```text
SensorTask
 └─ while(1)
      ├─ DHT_Read_Data(&temp,&humi, GPIOC, Pin14, &dht)
      │    ├─ DHT11_Start  拉低≥18ms 再拉高
      │    ├─ DHT11_Read   改输入
      │    ├─ 等应答
      │    ├─ ×5 DHT_Read_Byte → BUF[0..4]
      │    └─ 校验通过 ⇒ *humi=BUF[0], *temp=BUF[2]
      ├─ Take(mutex) ⇒ temperature, humidity  Give
      │
      ├─ MQ2_GetGasConcentration()
      │    └─ ×10 MQ2_GetAdcValue(ADC1_CH4) → 均值→电压→RS→浓度公式
      ├─ Take(mutex) ⇒ gasConcentration  Give
      └─ delay_ms(500)
```

#### C. WindSpeedTask（100ms）

```text
WindSpeedTask
 └─ while(1)
      ├─ Take 读 temperature/humidity/gasConcentration  Give
      ├─ WindSpeed_Update(T,H,G)
      │    ├─ 归一化 f_T/f_H/f_G
      │    ├─ fusion = 0.2f_T + 0.2f_H + 0.6f_G
      │    ├─ pwmValue = 20 + 80*fusion
      │    └─ cooking: T>26 && H>50 && G>100
      ├─ Take ⇒ windSpeedPWM, cookingEventActive  Give
      └─ delay_ms(100)
```

#### D. SpeedCalcTask（事件）+ 测速中断

```text
⚡TIM2_IRQHandler
 └─ 更新中断: 按 DIR 做 overflow++ 或 overflow--

⚡TIM4_IRQHandler (≈1ms)
 └─ GiveFromISR(g_speedCalcSemaphore) → 可能 portYIELD_FROM_ISR

SpeedCalcTask
 └─ while(1)
      ├─ ⏸ Take(g_speedCalcSemaphore)     // 被 TIM4 唤醒
      ├─ get_encoder_value()
      │    └─ TIM2->CNT + overflow*65536
      └─ speed = get_speed(enc, 50)
           sp_count 到 50 算一次样本（≈50ms）
           10 点去极值平均 + 一阶低通
           ⇒ 全局 speed
```

#### E. MotorControlTask（50ms）——模式心脏

```text
MotorControlTask
 └─ while(1)
      ├─ Take ⇒ actualRPM = speed  Give
      └─ switch(currentMode)

         ├─ STANDBY
         │    motor_stop(); motorRunning=0;
         │    清自动计时; g_autoModeState=STARTUP
         │
         ├─ MANUAL
         │    motor_start()（若未运行）
         │    targetRPM = WindSpeed_GetTargetRPM(level)  // 190/220
         │    PID_SetTarget(&g_speedPID, target)
         │    pidOut = PID_Calculate(&g_speedPID, speed)
         │         error=target-actual; 积分限幅; P+I+D; 输出限幅0~1000
         │    motor_pwm_set(pidOut)
         │         ├─ motor_dir(正/反)  开 CH1N 或 CH1
         │         └─ motor_speed(ccr) TIM_SetCompare1
         │
         ├─ AUTO  ★内部再 switch(g_autoModeState)
         │    ├─ STARTUP
         │    │    motor_start; motor_pwm_set(PWM_MIN*10)
         │    │    autoModeCounter+=50
         │    │    cooking? → COOKING
         │    │    ≥60s无cooking? → STANDBY+stop
         │    ├─ COOKING
         │    │    motor_pwm_set(WindSpeed_GetPWMCompare(1000))  // 算法PWM，非PID
         │    │    cooking灭? → DELAY_OFF
         │    │    ≥60s? → STANDBY
         │    └─ DELAY_OFF
         │         仍 GetPWMCompare 输出
         │         再cooking? → COOKING
         │         ≥10s? → STANDBY
         │
         └─ ANTI_BACKFLOW
              if (antiBackflowActive && motorRunning)
                  同 MANUAL：档位RPM + PID + motor_pwm_set

      delay_ms(50)
```

#### F. AntiBackflowTask（100ms）

```text
AntiBackflowTask
 └─ while(1)
      ├─ 若 mode==ANTI_BACKFLOW
      │    gas>=gasThreshold ?
      │      是且 gas<HIGH(2000):
      │         antiBackflowActive=1; motorRunning=1; motor_start()
      │         gasThreshold = HIGH          // 抬高防抖
      │      否且 gas<NORMAL(100):
      │         清标志; motor_stop(); threshold=NORMAL
      └─ 非防回流模式: 复位标志与 threshold
      delay_ms(100)
```

#### G. UIDisplayTask（200ms）

```text
UIDisplayTask
 ├─ LCD_Clear(WHITE) 一次
 └─ while(1)
      sprintf + Show_Str:
        Mode / Level / WIND% / RPM / Auto状态 / AMCnt / CECnt
      delay_ms(200)
```

#### H. iap_task（ifopen=1，事件）

```text
⚡DMA1_Channel5_IRQHandler
 └─ TC5: GiveFromISR(g_iapSemaphore)

iap_task
 └─ while(1)
      ⏸ Take(g_iapSemaphore)
      GetReceivedDataLength() = buff_size - CNDTR
      CRC32_VerifyFirmware(receive_buff, len)
        失败 → 清缓冲, MYDMA_Enable, 擦APP页
        成功 → firmwareLen=len-4
              检查向量 → FLASH_ErasePage
              iap_write_appbin(0x0800F000, ...)  // 拼halfword+STMFLASH_Write
              再检查 Flash 向量 → iap_load_app
                   关中断/DMA/USART → MSR_MSP → 跳复位向量
```

---

### 0.6 三条主数据高速公路（跨任务）

```text
① 感知决策链
  DHT11/MQ2
    → SensorTask ⇒ T/H/Gas
    → WindSpeedTask ⇒ windSpeedPWM + cookingEventActive
    → Motor(AUTO) 用 cooking / GetPWMCompare
    → UI 显示 WIND%

② 速度闭环链（手动 / 防回流调速）
  编码器 → TIM2(+overflow)
    → ⚡TIM4 1ms Give 信号量
    → SpeedCalcTask ⇒ speed
    → Motor: PID(target, speed) → motor_pwm_set → TIM1 → 电机
    → 编码器再反馈

③ 人机控制链
  按键 → Key_Scan 状态机 → KeyScanTask
    → SwitchMode / SwitchSpeedLevel / ToggleMotor
    → 改 g_systemState
    → Motor 下周期 switch 换行为
    → UI 显示 Mode/Level
```

---

### 0.7 一张“时间片”想象图（并行长什么样）

```text
时间 →  0ms    1ms    10ms   50ms   100ms  200ms  500ms
        │      │      │      │      │      │      │
TIM4    ⚡      ⚡      ⚡...   （一直 1ms 一次踢 SpeedCalc）
Speed   算     算     算...
Key                   扫一次
Motor                        控一次
Wind/AntiBF                        各一次
UI                                       刷一次
Sensor                                         采一次

任意时刻按键/DMA 到来：更高优先级任务或 ISR 抢占当前任务。
```

---

### 0.8 怎么用这张总图深入学习

| 你想搞懂 | 在总图看 | 正文细读 |
|----------|----------|----------|
| 程序怎么启动 | 0.1 阶段A~C | 第 2~6 章 |
| 每个外设谁 Init | 0.2 | 第 4 章 |
| 数据存在哪、谁读写 | 0.3 | 第 5 章 |
| 任务之间如何协作 | 0.4 / 0.6 | 第 7、16 章 |
| 某一个 while(1) 调谁 | 0.5 对应树 | 第 8~15 章 |
| 闭环怎么转起来 | 0.6 ② | 第 11~12 章 |
| 自动/防回流分支 | 0.5 E/F | 第 12~13 章 |

**阅读建议**：先把 **0.1 + 0.4 + 0.6** 在脑子里过成动画，再进后面章节对源码。

---

## 目录

0. [代码运行总图（先看这个）](#0-代码运行总图先看这个)
1. [先记住总调用链](#1-先记住总调用链)
2. [第 0 步：上电到 main](#2-第-0-步上电到-main)
3. [第 1 步：main 四行在干什么](#3-第-1-步main-四行在干什么)
4. [第 2 步：Hardware_Init —— 硬件怎么 ready](#4-第-2-步hardware_init--硬件怎么-ready)
5. [第 3 步：System_Init —— 状态和信号量](#5-第-3-步system_init--状态和信号量)
6. [第 4 步：StartTask —— 创建所有业务任务](#6-第-4-步starttask--创建所有业务任务)
7. [第 5 步：调度器跑起来之后，代码怎么并行](#7-第-5-步调度器跑起来之后代码怎么并行)
8. [任务① KeyScanTask 完整流程](#8-任务-keyscantask-完整流程)
9. [任务② SensorTask 完整流程](#9-任务-sensortask-完整流程)
10. [任务③ WindSpeedTask 完整流程](#10-任务-windspeedtask-完整流程)
11. [任务④ SpeedCalcTask + 测速中断 完整流程](#11-任务-speedcalctask--测速中断-完整流程)
12. [任务⑤ MotorControlTask 完整流程（四种模式）](#12-任务-motorcontroltask-完整流程四种模式)
13. [任务⑥ AntiBackflowTask 完整流程](#13-任务-antibackflowtask-完整流程)
14. [任务⑦ UIDisplayTask 完整流程](#14-任务-uidisplaytask-完整流程)
15. [任务⑧ iap_task 完整流程（ifopen=1）](#15-任务-iap_task-完整流程ifopen1)
16. [三条最重要的跨任务数据流](#16-三条最重要的跨任务数据流)
17. [用一个场景把全部代码串一遍](#17-用一个场景把全部代码串一遍)
18. [源码索引](#18-源码索引)

---

## 1. 先记住总调用链

（精简版；**更细的总图见上方第 0 章**。）

```text
复位 → SystemInit → main
  → Hardware_Init → System_Init → StartTask_Create → vTaskStartScheduler
       → StartTask 创建各任务 + TIM4_init + 自删
       → 此后并行：Key / Sensor / Wind / Motor / AntiBF / UI / SpeedCalc /(IAP)
```

共享数据：

```text
g_systemState     // 模式、档位、温湿度、气体、PWM、RPM、标志…
speed             // SpeedCalcTask 写，Motor 读
overflow          // TIM2 中断写
```

同步：

- `g_dataMutex` → 保护 `g_systemState`
- `g_speedCalcSemaphore` → TIM4 中断 ⇒ SpeedCalcTask
- `g_iapSemaphore` → DMA 中断 ⇒ iap_task（`ifopen=1`）

---

## 2. 第 0 步：上电到 main

文件：`CORE/startup_stm32f10x_*.s` → `USER/system_stm32f10x.c` → `USER/main.c`

```text
上电/复位
  → 取复位向量，设栈
  → 调 SystemInit()     // 配置系统时钟（本工程按 72MHz 理解）
  → 进入 main()
```

你平时跟业务，从 `main` 开始就够。

---

## 3. 第 1 步：main 四行在干什么

文件：`USER/main.c`

```c
int main(void)
{
    Hardware_Init();       // ① 电机/编码器/按键/传感器/PID/LCD/串口就绪，裸机上下文，无任务
    System_Init();         // ② 默认待机模式；g_dataMutex + g_speedCalcSemaphore 创建完毕
    StartTask_Create();    // ③ 就绪队列里有一个 StartTask，还没跑
    vTaskStartScheduler(); // ④ FreeRTOS 开始调度 → StartTask 真正执行；正常情况不返回

    while(1) { }           // 只有调度器启动失败（堆不够）才到这
}
```

---

## 4. 第 2 步：Hardware_Init —— 硬件怎么 ready

文件：`USER/main.c` → 再跳进各个 `BSP/*`

```c
static void Hardware_Init(void)
{
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_4);  // 分组4：只要抢占优先级
    delay_init();                                    // 延时（配合 OS tick）

    TIM1_dead_pwm_init(1000-1, 72-1, 0, 100);        // TIM1 1kHz 互补PWM+死区
    motor_init();                                    // 方向/停/使能 H 桥

    TIM2_encode_init(0xFFFF, 0);                     // TIM2 编码器

    Beep_Init(&bep, GPIOB, GPIO_Pin_15);
    Key_Init();                                      // PB1、PB12
    MQ2_Init();                                      // PA4 ADC

    PID_Init(&g_speedPID, 14.0f, 1.65f, 0.0f, 1000.0f, 0.0f);
    WindSpeed_Init();
    LCD_Init();

    uart_init(115200);   // 必须靠后，注释写会影响电机

#if ifopen
    MYDMA_Config(DMA1_Channel5, (u32)&USART1->DR,
                 (u32)receive_buff, buff_size);
#endif

    Show_Str(0, 0, BLUE, WHITE, "Init Complete! ", 16, 0);
    delay_ms(500);
}
```

### 4.1 每一行实际调到哪里

```text
delay_init()
  → SYSTEM/delay/delay.c

TIM1_dead_pwm_init(arr=999, psc=71, ccr=0, dtg=100)
  → BSP/MOTOR/motor.c
  → 开 TIM1 时钟
  → PA8=CH1, PB13=CH1N, PA2=H桥使能脚
  → PWM1 + 死区 BDTR
  → 频率 = 72MHz/(71+1)/(999+1) = 1kHz

motor_init()
  → motor_dir(stright) → 关双通道后开 CH1N（正转）
  → motor_stop()       → 关通道 + PA2=0
  → motor_start()      → PA2=1（使能桥，通道仍由后续 pwm_set 打开）

TIM2_encode_init(0xFFFF, 0)
  → PA0/PA1 编码器模式 TI12（4倍频）
  → 开更新中断，优先级 6（后面 TIM2_IRQHandler 改 overflow）

Beep_Init / Key_Init / MQ2_Init / PID_Init / WindSpeed_Init / LCD_Init / uart_init
  → 各自 BSP 或 SYSTEM，只做“能用”，业务还没开始循环
```

### 4.2 中断优先级为什么这样配（和后面 FromISR 有关）

`main.c` 注释 + `FreeRTOSConfig.h`：

- FreeRTOS 可管理的最高中断优先级阈值：`configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY = 3`
- **数值 ≥ 3** 的抢占优先级才能调用 `xSemaphoreGiveFromISR`
- 工程实际：
  - DMA1_CH5 = **4**
  - TIM4 = **5**
  - TIM2 = **6**（只改 `overflow`，不调 FreeRTOS API）

到这里：**硬件 ready，但没有任何业务 while 在跑。**

---

## 5. 第 3 步：System_Init —— 状态和信号量

文件：`APP_TASK/app_tasks.c`

```c
void System_Init(void)
{
    g_systemState.currentMode = MODE_STANDBY;   // 默认待机
    g_systemState.speedLevel  = SPEED_LOW;
    g_systemState.motorRunning = 0;
    g_systemState.temperature = 0;
    g_systemState.humidity = 0;
    g_systemState.gasConcentration = 0.0f;
    g_systemState.windSpeedPWM = 0.0f;
    g_systemState.actualRPM = 0.0f;
    g_systemState.targetRPM = 0;
    g_systemState.cookingEventActive = 0;
    g_systemState.antiBackflowActive = 0;
    g_systemState.gasThreshold = GAS_THRESHOLD_NORMAL;  // 100.0f
    g_systemState.autoModeCounter = 0;
    g_systemState.cookingEventCounter = 0;

    g_dataMutex = xSemaphoreCreateMutex();
    g_speedCalcSemaphore = xSemaphoreCreateBinary();
#if ifopen
    g_iapSemaphore = xSemaphoreCreateBinary();
#endif
}
```

`SystemState_t` 定义在 `APP_TASK/app_tasks.h`，后面所有任务读写的“公共面板”就是它。

谁写谁读（跟代码时用）：

| 字段 | 写 | 读 |
|------|----|----|
| currentMode / speedLevel / motorRunning | Key 相关函数、Motor、AntiBF、ToggleMotor | Motor、AntiBF、UI |
| temperature / humidity / gasConcentration | SensorTask | WindSpeed、AntiBF |
| windSpeedPWM / cookingEventActive | WindSpeedTask | Motor(自动)、UI |
| actualRPM | MotorControlTask（从 speed 拷贝） | UI |
| targetRPM | MotorControlTask | （UI 未单独显示） |
| antiBackflowActive / gasThreshold | AntiBackflowTask | Motor(防回流) |
| autoModeCounter / cookingEventCounter | MotorControlTask(自动) | UI |

---

## 6. 第 4 步：StartTask —— 创建所有业务任务

```c
void StartTask_Create(void)
{
    xTaskCreate(StartTask, "StartTask",
                TASK_START_STK_SIZE, NULL,
                TASK_START_PRIORITY, &xStartTaskHandle);
}
```

调度器启动后，**第一个真正跑的业务入口**是 `StartTask`：

```c
void StartTask(void *pvParameters)
{
    taskENTER_CRITICAL();   // 创建期间关调度，避免半初始化

    xTaskCreate(KeyScanTask,      ...);  // 优先级 4，栈 64
    xTaskCreate(SensorTask,       ...);  // 3, 128
    xTaskCreate(WindSpeedTask,    ...);  // 3, 64
    xTaskCreate(MotorControlTask, ...);  // 5, 256
    xTaskCreate(UIDisplayTask,    ...);  // 1, 256
    xTaskCreate(AntiBackflowTask, ...);  // 2, 64
    xTaskCreate(SpeedCalcTask,    ...);  // 6, 128
#if ifopen
    xTaskCreate(iap_task,         ...);  // 7, 256
#endif

    /* 信号量已在 System_Init 创建好，现在才能开 TIM4 */
    TIM4_init(5-1, 14400-1);   // ≈1ms 中断，给 SpeedCalc 发信号量

    taskEXIT_CRITICAL();
    vTaskDelete(xStartTaskHandle);  // 启动任务完成使命，删除自己
}
```

### 为什么 TIM4 必须放在这里？

```text
TIM4 一使能 → 马上可能进 TIM4_IRQHandler
  → xSemaphoreGiveFromISR(g_speedCalcSemaphore, ...)
若信号量还是 NULL → HardFault
所以顺序必须是：
  System_Init 建信号量 → StartTask 建 SpeedCalcTask → 再 TIM4_init
```

### 任务优先级（数值越大越高）

```text
iap_task(7) > SpeedCalc(6) > Motor(5) > Key(4)
 > Sensor(3)=Wind(3) > AntiBF(2) > UI(1)=Start(1)
```

---

## 7. 第 5 步：调度器跑起来之后，代码怎么并行

从这一刻起，**没有单一 main 循环**，而是多个 `while(1)` 被 FreeRTOS 按优先级切换。

每个任务的“节奏”：

| 任务 | 阻塞/延时方式 | 周期或触发 |
|------|---------------|------------|
| KeyScanTask | `delay_ms(10)` | 10ms |
| SensorTask | `delay_ms(500)` | 500ms |
| WindSpeedTask | `delay_ms(100)` | 100ms |
| MotorControlTask | `delay_ms(50)` | 50ms |
| AntiBackflowTask | `delay_ms(100)` | 100ms |
| UIDisplayTask | `delay_ms(200)` | 200ms |
| SpeedCalcTask | `xSemaphoreTake(..., portMAX_DELAY)` | TIM4 每 1ms 给一次 |
| iap_task | `xSemaphoreTake(g_iapSemaphore, ...)` | DMA 收完给一次 |

下面按**代码路径**把每个任务从第一行跟到底。

---

## 8. 任务 KeyScanTask 完整流程

文件：`APP_TASK/app_tasks.c` → `BSP/KEY/key.c` →（事件处理）`System_Switch*` → `BSP/MOTOR` / `BSP/BEEP`

### 8.1 任务本体

```c
void KeyScanTask(void *pvParameters)
{
    KeyEvent_t key1Event, key2Event;
    while (1)
    {
        Key_Scan();                         // ① 推进两个按键状态机

        key1Event = Key1_GetEvent();        // ② 取 KEY1 事件
        if (key1Event == KEY_EVENT_SHORT_PRESS) {
            System_SwitchMode();            // 切模式
            Buzzer_Beep(100, &bep);
            Key1_ClearEvent();
        } else if (key1Event == KEY_EVENT_LONG_PRESSING) {
            Beep_on(&bep);
        } else if (key1Event == KEY_EVENT_RELEASE) {
            Beep_off(&bep);
            Key1_ClearEvent();
        }

        key2Event = Key2_GetEvent();        // ③ 取 KEY2 事件
        if (key2Event == KEY_EVENT_SHORT_PRESS) {
            System_SwitchSpeedLevel();      // 切档位
            Buzzer_Beep(100, &bep);
            Key2_ClearEvent();
        } else if (key2Event == KEY_EVENT_LONG_PRESS) {
            System_ToggleMotor();           // 长按开关风机
        } else if (key2Event == KEY_EVENT_LONG_PRESSING) {
            Beep_on(&bep);
        } else if (key2Event == KEY_EVENT_RELEASE) {
            Beep_off(&bep);
            Key2_ClearEvent();
        }

        delay_ms(10);                       // ④ 10ms 后再扫
    }
}
```

### 8.2 Key_Scan 往下走

```c
void Key_Scan(void)
{
    Key_StateMachine(&g_key1);  // PB1
    Key_StateMachine(&g_key2);  // PB12
}
```

`Key_StateMachine` 状态迁移（代码逻辑）：

```text
IDLE
  读到按下 → DEBOUNCE，记录 pressStartTick

DEBOUNCE（等满 30ms）
  仍按下 → PRESSED，重记时间
  已松开 → 判为抖动，回 IDLE

PRESSED
  一直按住且超过 1000ms → LONG_PRESS，event=LONG_PRESS，longPressTriggered=1
  中途松开且没触发长按 → event=SHORT_PRESS，回 IDLE

LONG_PRESS
  仍按住 → 每周期 event=LONG_PRESSING（给蜂鸣器持续响）
  松开 → event=RELEASE，回 IDLE
```

计时用 `xTaskGetTickCount()`，不靠 `delay` 堵死状态机。

### 8.3 短按 KEY1 → System_SwitchMode

```c
void System_SwitchMode(void)
{
    xSemaphoreTake(g_dataMutex, portMAX_DELAY);

    switch (g_systemState.currentMode) {
        case MODE_STANDBY:       currentMode = MODE_MANUAL; break;
        case MODE_MANUAL:        currentMode = MODE_AUTO;
                                 g_autoModeState = AUTO_STATE_STARTUP; break;
        case MODE_AUTO:          currentMode = MODE_ANTI_BACKFLOW; break;
        case MODE_ANTI_BACKFLOW: currentMode = MODE_STANDBY; break;
    }

    if (currentMode != MODE_AUTO) {
        motorRunning = 0;
        motor_stop();           // → BSP/MOTOR：关 PWM 通道 + PA2=0
    }

    xSemaphoreGive(g_dataMutex);
}
```

调用链：

```text
KeyScanTask
 → Key_Scan → Key_StateMachine
 → Key1_GetEvent == SHORT
 → System_SwitchMode
      → 改 g_systemState.currentMode
      → 可能 motor_stop()
 → Buzzer_Beep → Beep_on/delay/Beep_off
```

之后真正“按新模式转电机”的是 **MotorControlTask**（第 12 节），按键任务自己不调 PID。

### 8.4 短按 KEY2 → 切档位

```c
void System_SwitchSpeedLevel(void)
{
    Take mutex;
    SPEED_LOW ↔ SPEED_HIGH;
    Give mutex;
}
```

目标 RPM 要到 Motor 里才变成数字：

```text
WindSpeed_GetTargetRPM(LOW)  = 190
WindSpeed_GetTargetRPM(HIGH) = 220
```

### 8.5 长按 KEY2 → System_ToggleMotor

```c
void System_ToggleMotor(void)
{
    Take mutex;
    if (motorRunning) {
        motor_stop();
        motorRunning = 0;
        currentMode = MODE_STANDBY;   // 强制待机，防止 Motor 任务又拉起来
        Show_Str(..., "Motor Stopped");
    } else {
        motor_start();                // 只拉高 PA2 使能
        motorRunning = 1;
        currentMode = MODE_MANUAL;    // 强制手动，让 Motor 任务走 PID
        Show_Str(..., "Motor Started");
    }
    Give mutex;
}
```

---

## 9. 任务 SensorTask 完整流程

文件：`APP_TASK/app_tasks.c` → `BSP/DHT11/dht11.c` + `BSP/MQ2/mq2.c`

```c
void SensorTask(void *pvParameters)
{
    u8 temp, humi;
    float gasValue;
    u8 ret;

    while (1)
    {
        /* -------- DHT11 -------- */
        ret = DHT_Read_Data(&temp, &humi, GPIOC, GPIO_Pin_14, &dht);
        if (ret == 1) {
            xSemaphoreTake(g_dataMutex, portMAX_DELAY);
            g_systemState.temperature = temp;
            g_systemState.humidity = humi;
            xSemaphoreGive(g_dataMutex);
        }

        /* -------- MQ2 -------- */
        gasValue = MQ2_GetGasConcentration();
        xSemaphoreTake(g_dataMutex, portMAX_DELAY);
        g_systemState.gasConcentration = gasValue;
        xSemaphoreGive(g_dataMutex);

        delay_ms(500);
    }
}
```

为什么温湿度和气体**分两次加锁**？代码注释：一把锁占太久更容易优先级反转。

### 9.1 DHT_Read_Data 往下

```text
DHT_Read_Data(temp*, humi*, PC14, &dht)
  → 填 io->port / io->pin
  → DHT11_Start(io)
       推挽输出，拉低 ≥18ms，拉高 ~30us
  → DHT11_Read(io)
       改成浮空输入
  → 检测从机应答（低→高）
  → for i=0..4: BUF[i] = DHT_Read_Byte(io)
       每位：等低电平结束 → delay 30us 采样 → 1/0 拼字节
  → sum = BUF[0]+BUF[1]+BUF[2]+BUF[3]
  → 若 BUF[4]==(u8)sum:
       *humi=BUF[0]; *temp=BUF[2]; return 1
     否则 return 0
```

### 9.2 MQ2_GetGasConcentration 往下

```text
MQ2_GetGasConcentration()
  → 循环 10 次 MQ2_GetAdcValue()
       ADC_RegularChannelConfig(ADC1, CH4, ...)
       软件触发 → 等 EOC → 读 DR
  → 均值 adc_avg
  → 电压 = adc * 3.3/4096
  → RS = (5-V)/V * 0.5
  → concentration = pow(11.5428*2/RS, 0.6549)*100
  → return
```

**写完后谁读？** → 下一个周期的 `WindSpeedTask`、`AntiBackflowTask`。

---

## 10. 任务 WindSpeedTask 完整流程

文件：`APP_TASK/app_tasks.c` → `BSP/WIND/wind_speed.c`

```c
void WindSpeedTask(void *pvParameters)
{
    u8 temp, humidity;
    float gas;

    while (1)
    {
        /* ① 读传感器结果 */
        xSemaphoreTake(g_dataMutex, portMAX_DELAY);
        temp = g_systemState.temperature;
        humidity = g_systemState.humidity;
        gas = g_systemState.gasConcentration;
        xSemaphoreGive(g_dataMutex);

        /* ② 算法（不持锁，避免算太久占着互斥量） */
        WindSpeed_Update(temp, humidity, gas);

        /* ③ 写回结果 */
        xSemaphoreTake(g_dataMutex, portMAX_DELAY);
        g_systemState.windSpeedPWM = WindSpeed_GetPWM();
        g_systemState.cookingEventActive = WindSpeed_IsCookingEvent();
        xSemaphoreGive(g_dataMutex);

        delay_ms(100);
    }
}
```

### 10.1 WindSpeed_Update 代码逻辑

```c
void WindSpeed_Update(u8 temp, u8 humidity, float gas)
{
    // 归一化到 0~1
    f_T = constrain( (temp-20)/(35-20) );
    f_H = constrain( (humidity-40)/(75-40) );
    f_G = constrain( (gas-80)/(450-80) );

    // 加权：气体 0.6，温湿度各 0.2
    fusion = 0.2*f_T + 0.2*f_H + 0.6*f_G;

    // 映射成 PWM 百分比 20%~100%
    pwmValue = 20 + (100-20)*fusion;

    // Cooking Event
    if (temp>26 && humidity>50 && gas>100)
        isCookingEvent = 1;
    else
        isCookingEvent = 0;
}
```

自动模式里真正给定时器比较值：

```c
u16 WindSpeed_GetPWMCompare(u16 maxCompare)  // maxCompare 一般 1000
{
    return (u16)(pwmValue * maxCompare / 100.0f);
}
```

**写完后谁读？**

- `MotorControlTask` 自动模式：用 `cookingEventActive` + `GetPWMCompare`
- `UIDisplayTask`：显示 `windSpeedPWM`

---

## 11. 任务 SpeedCalcTask + 测速中断 完整流程

这是**中断通知任务**的典型写法，必须和 TIM2/TIM4 一起看。

### 11.1 硬件侧谁在跑

```text
编码器 A/B → TIM2 硬件计数（4倍频）
TIM2 溢出 → TIM2_IRQHandler 改 overflow
TIM4 每 1ms → TIM4_IRQHandler Give 信号量
SpeedCalcTask 被唤醒 → 算 speed
```

### 11.2 TIM2_IRQHandler

文件：`APP_TASK/app_tasks.c`

```c
void TIM2_IRQHandler(void)
{
    if (TIM_GetITStatus(TIM2, TIM_IT_Update) != RESET) {
        TIM_ClearITPendingBit(TIM2, TIM_IT_Update);
        if (TIM_GetDirection(TIM2))
            overflow--;   // 向下计
        else
            overflow++;   // 向上计
    }
}
```

### 11.3 TIM4_IRQHandler

```c
void TIM4_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    if (TIM_GetITStatus(TIM4, TIM_IT_Update) != RESET) {
        TIM_ClearITPendingBit(TIM4, TIM_IT_Update);
        xSemaphoreGiveFromISR(g_speedCalcSemaphore, &xHigherPriorityTaskWoken);
        portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
    }
}
```

ISR **不算转速**，只通知。

### 11.4 SpeedCalcTask

```c
void SpeedCalcTask(void *pvParameters)
{
    int encoderCount;
    while (1)
    {
        if (xSemaphoreTake(g_speedCalcSemaphore, portMAX_DELAY) == pdTRUE)
        {
            encoderCount = get_encoder_value();  // TIM2 CNT + overflow*65536
            speed = get_speed(encoderCount, 50); // 内部按 50ms 语义采样+滤波
        }
    }
}
```

### 11.5 get_encoder_value / get_speed（BSP/MOTOR/motor.c）

```c
int get_encoder_value(void)
{
    return TIM_GetCounter(TIM2) + (overflow * 65536);
}
```

```text
get_speed(encode_value, ms=50):
  每次被调用 sp_count++
  当 sp_count == 50（约 50 次 × 1ms 调用 ≈ 50ms）:
      Δcount = now - old
      单次转速样本 =
        Δcount * (1000/ms) * 60 / 30 / (11*4)
        // 30=减速比, 11线, 4倍频
      放入 speed_arr[k++]
      满 10 个样本:
          排序，去掉两端，中间 6 点平均
          一阶低通: speed = 0.48*平均 + 0.52*上次speed
  return speed   // 全局 volatile float speed
```

**写完后谁读？**

- `MotorControlTask`：`PID_Calculate(..., speed)`，并 `actualRPM = speed`
- 不经过 `g_dataMutex` 保护 `speed` 本身（工程现状：单写多读的 float）

---

## 12. 任务 MotorControlTask 完整流程（四种模式）

文件：`APP_TASK/app_tasks.c` → `BSP/PID/pid.c` + `BSP/MOTOR/motor.c` + `BSP/WIND`

这是业务心脏：读模式，决定停转 / PID / 自动状态机。

```c
void MotorControlTask(void *pvParameters)
{
    float pidOutput;
    while (1)
    {
        u16 pwmCompare = 0;

        /* 把测速结果镜像进状态，给 UI 用 */
        xSemaphoreTake(g_dataMutex, portMAX_DELAY);
        g_systemState.actualRPM = speed;
        xSemaphoreGive(g_dataMutex);

        switch (g_systemState.currentMode)
        {
            case MODE_STANDBY:      /* 见下 */
            case MODE_MANUAL:       /* 见下 */
            case MODE_AUTO:         /* 见下 */
            case MODE_ANTI_BACKFLOW:/* 见下 */
        }
        delay_ms(50);
    }
}
```

### 12.1 MODE_STANDBY

```c
motor_stop();
g_systemState.motorRunning = 0;
g_systemState.autoModeCounter = 0;
g_systemState.cookingEventCounter = 0;
g_autoModeState = AUTO_STATE_STARTUP;
```

调用链：

```text
motor_stop()
  → TIM_CCxCmd 关 CH1
  → TIM_CCxNCmd 关 CH1N
  → io_reset_bit(PA2)  // 禁 H 桥
```

注意：Sensor/WindSpeed **仍在跑**，只是电机停。

### 12.2 MODE_MANUAL（PID 闭环完整路径）

```c
if (motorRunning == 0) {
    motor_start();      // PA2=1
    motorRunning = 1;
}
if (motorRunning) {
    targetRPM = WindSpeed_GetTargetRPM(speedLevel);  // 190 或 220
    PID_SetTarget(&g_speedPID, (float)targetRPM);
    pidOutput = PID_Calculate(&g_speedPID, speed);
    motor_pwm_set(pidOutput);
}
```

#### PID_Calculate 往下（位置式）

```c
float PID_Calculate(PID_TypeDef *pid, float actual)
{
    pid->actual = actual;
    pid->error = pid->target - pid->actual;
    pid->integral += pid->error;
    // 积分限幅 ±integral_max（Init 时 = out_max/2）
    p = Kp*error;  i = Ki*integral;  d = Kd*(error-last_error);
    output = p+i+d;
    // 输出限幅 [0, 1000]
    last_error = error;
    return output;
}
```

本工程 Init：`Kp=14, Ki=1.65, Kd=0, out=[0,1000]`。

#### motor_pwm_set 往下

```c
void motor_pwm_set(float para)
{
    int val = (int)para;
    if (val >= 0) {
        motor_dir(stright);   // 只开 CH1N
        motor_speed(val);     // TIM_SetCompare1(TIM1, ccr) 且 ccr≤1000
    } else {
        motor_dir(invert);    // 只开 CH1
        motor_speed(-val);
    }
}
```

**手动模式完整闭环调用链（背这个）：**

```text
TIM2 计数 + TIM2_IRQHandler(overflow)
 → TIM4_IRQHandler Give 信号量
 → SpeedCalcTask: get_encoder_value → get_speed → speed
 → MotorControlTask:
      WindSpeed_GetTargetRPM → PID_SetTarget
      PID_Calculate(g_speedPID, speed)
      motor_pwm_set → motor_dir + motor_speed → TIM1 CCR
 → H 桥 → 电机转速变化 → 编码器再反馈
```

### 12.3 MODE_AUTO（内部三态）

静态变量 `g_autoModeState`：`STARTUP / COOKING / DELAY_OFF`。

#### AUTO_STATE_STARTUP

```c
if (!motorRunning) { motorRunning=1; motor_start(); }
motor_pwm_set(PWM_MIN * 10);     // 最小风速意涵的占空比
autoModeCounter += 50;           // 本任务 50ms 一次

if (cookingEventActive)
    g_autoModeState = AUTO_STATE_COOKING;
else if (autoModeCounter >= 60000) {   // 60s 无 cooking
    currentMode = MODE_STANDBY;
    motor_stop(); motorRunning=0;
}
```

#### AUTO_STATE_COOKING

```c
pwmCompare = WindSpeed_GetPWMCompare(MAXCCR);  // 算法 PWM% → CCR
motor_pwm_set(pwmCompare);
cookingEventCounter += 50;

if (!cookingEventActive)
    → DELAY_OFF, counter=0
else if (counter >= 60000)   // cooking 持续超过 60s
    → STANDBY 停机
```

#### AUTO_STATE_DELAY_OFF

```c
仍按 GetPWMCompare 输出
cookingEventCounter += 50
若又 cooking → 回 COOKING
若满 10s 无 cooking → STANDBY 停机
```

**自动 vs 手动关键差别：**

| | 手动 | 自动 COOKING |
|--|------|--------------|
| 转速来源 | 档位 RPM + **PID** | 风速算法 **PWM% 直接映射 CCR** |
| 反馈 | 用 speed 闭环 | 本段不走 PID 目标 RPM |

### 12.4 MODE_ANTI_BACKFLOW

```c
if (antiBackflowActive && motorRunning) {
    targetRPM = WindSpeed_GetTargetRPM(speedLevel);
    PID_SetTarget(...);
    pidOutput = PID_Calculate(..., speed);
    motor_pwm_set(pidOutput);
}
```

启停不在这里做，在 `AntiBackflowTask`。这里只负责“已经允许转的时候用 PID 稳速”。

---

## 13. 任务 AntiBackflowTask 完整流程

文件：`APP_TASK/app_tasks.c`

```c
void AntiBackflowTask(void *pvParameters)
{
    u8 isDetected = 0;
    while (1)
    {
        if (g_systemState.currentMode == MODE_ANTI_BACKFLOW)
        {
            isDetected = (gasConcentration >= gasThreshold) ? 1 : 0;

            if (isDetected) {
                if (gasConcentration < GAS_THRESHOLD_HIGH) {  // 2000
                    antiBackflowActive = 1;
                    motorRunning = 1;
                    motor_start();
                    gasThreshold = GAS_THRESHOLD_HIGH;       // 抬高阈值，防抖
                }
            }
            else if (gasConcentration < GAS_THRESHOLD_NORMAL) { // 100
                antiBackflowActive = 0;
                motorRunning = 0;
                motor_stop();
                gasThreshold = GAS_THRESHOLD_NORMAL;
            }
        }
        else {
            antiBackflowActive = 0;
            gasThreshold = GAS_THRESHOLD_NORMAL;
        }
        delay_ms(100);
    }
}
```

和 Motor 的配合：

```text
AntiBackflowTask:  gas 超阈 → motor_start + antiBackflowActive=1
MotorControlTask:  看到标志 → PID + motor_pwm_set
AntiBackflowTask:  gas 回落 → motor_stop + 清标志
MotorControlTask:  条件不满足，不再给 PWM
```

---

## 14. 任务 UIDisplayTask 完整流程

```c
void UIDisplayTask(void *pvParameters)
{
    char dispBuf[32];
    LCD_Clear(WHITE);

    while (1)
    {
        sprintf(dispBuf, "Mode:%s", ModeNames[currentMode]);
        Show_Str(0, 20, ...);

        sprintf(dispBuf, "Level:%s", SpeedLevelNames[speedLevel]);
        Show_Str(0, 40, ...);

        sprintf(dispBuf, "WIND:%.1f%%  ", windSpeedPWM);
        Show_Str(0, 60, ...);

        sprintf(dispBuf, "RPM:%.0f    ", actualRPM);
        Show_Str(0, 80, ...);

        sprintf(dispBuf, "Auto:%s", AutoStateNames[g_autoModeState]);
        Show_Str(0, 100, ...);

        sprintf(dispBuf, "AMCnt:%ds  ", autoModeCounter/1000);
        Show_Str(0, 120, ...);

        sprintf(dispBuf, "CECnt:%ds  ", cookingEventCounter/1000);
        Show_Str(0, 140, ...);

        delay_ms(200);
    }
}
```

调用链：

```text
UIDisplayTask → sprintf → Show_Str
  → GUI 字模描点 → LCD_DrawPoint / SPI 写屏
```

只读状态，**不改控制逻辑**。

---

## 15. 任务 iap_task 完整流程（ifopen=1）

默认 `SYSTEM/sys/sys.h` 里 `ifopen=0`，相关代码不编译。打开后链路如下。

### 15.1 初始化时多出来的

```text
Hardware_Init:
  MYDMA_Config(DMA1_CH5, &USART1->DR, receive_buff, buff_size)
  // receive_buff 固定在 0x20004000

System_Init:
  g_iapSemaphore = xSemaphoreCreateBinary()

StartTask:
  xTaskCreate(iap_task, 优先级7)
```

### 15.2 接收完成中断

```c
void DMA1_Channel5_IRQHandler(void)
{
    if (DMA_GetITStatus(DMA1_IT_TC5)) {
        DMA_ClearITPendingBit(DMA1_IT_TC5);
        xSemaphoreGiveFromISR(g_iapSemaphore, &xHigherPriorityTaskWoken);
        portYIELD_FROM_ISR(...);
    }
}
```

### 15.3 iap_task 本体流程

```text
while(1):
  Take(g_iapSemaphore)                    // 阻塞等 DMA 收完
  receivedLength = GetReceivedDataLength()
      // = buff_size - DMA_GetCurrDataCounter(CH5)

  if (receive_buff[0] 有数据):
      CRC32_VerifyFirmware(buff, len)
        失败:
          提示 CRC32 Error
          memset 缓冲
          MYDMA_Enable 再开收
          FLASH_ErasePage(FLASH_APP1_ADDR)
        成功:
          firmwareLen = len - 4           // 去掉末尾 CRC
          检查 RAM 中复位向量是否像 0x08xxxxxx
            是:
              擦 APP
              iap_write_appbin(0x0800F000, buff, firmwareLen)
              再检查 Flash 中向量
                合法 → iap_load_app(0x0800F000)
            否:
              清缓冲 + 重开 DMA
```

### 15.4 CRC / 写 Flash / 跳转 往下

```text
PC: tools/add_crc32.py
  zlib.crc32(bin) → 附加 4 字节小端 → xxx_crc.bin 串口发出

CRC32_VerifyFirmware:
  calculated = CRC32_Calculate(data, len-4)
  received = 末尾4字节小端拼 u32
  return calculated==received

iap_write_appbin:
  字节流两两拼 halfword
  满 512 halfword → STMFLASH_Write 一块(1024字节)
  尾巴再写一次

iap_load_app(appxaddr):
  关中断、关 DMA/USART
  检查栈顶字是否在 SRAM 特征范围
  MSR_MSP(栈顶)
  跳转 *(appxaddr+4) 复位向量
```

---

## 16. 三条最重要的跨任务数据流

把“单任务流程”合成系统，只记这三条就够。

### 流 A：环境感知 → 风速决策

```text
DHT11/MQ2 硬件
 → SensorTask 写 temperature/humidity/gasConcentration
 → WindSpeedTask 读 → WindSpeed_Update
 → 写 windSpeedPWM、cookingEventActive
 → Motor 自动模式 / UI 使用
```

### 流 B：速度闭环（手动/防回流调速）

```text
编码器
 → TIM2 + overflow
 → TIM4 1ms Give
 → SpeedCalcTask 写 speed
 → MotorControlTask PID → motor_pwm_set → TIM1
 → 电机 → 编码器
```

### 流 C：人操作改行为

```text
按键 GPIO
 → Key_Scan 状态机
 → KeyScanTask
 → System_SwitchMode / SwitchSpeedLevel / ToggleMotor
 → 改 currentMode / speedLevel / motorRunning
 → MotorControlTask 下周期 switch 走不同分支
 → UI 显示变化
```

---

## 17. 用一个场景把全部代码串一遍

**场景：上电 → 切到手动 → 高档运行 → 再切自动等 cooking**

### 阶段 1：上电

```text
main
 → Hardware_Init（TIM1/TIM2/Key/MQ2/PID/Wind/LCD/UART…）
 → System_Init（STANDBY，建锁和信号量）
 → StartTask_Create
 → vTaskStartScheduler
 → StartTask 创建 7 个任务 + TIM4_init + 自杀
```

此时各任务都在跑，但：

```text
MotorControlTask: mode=STANDBY → 每 50ms motor_stop()
SensorTask: 每 500ms 更新 T/H/G
WindSpeedTask: 每 100ms 更新 PWM% 和 cooking 标志（电机不用）
SpeedCalcTask: 在算 speed（可能接近 0）
UI: 显示 Standby
```

### 阶段 2：KEY1 短按进入手动

```text
KeyScanTask 10ms 周期扫到 SHORT
 → System_SwitchMode: STANDBY→MANUAL，motor_stop 一次
 → 蜂鸣
下一拍 MotorControlTask:
 → motor_start
 → target=190 (LOW)
 → PID(speed) → motor_pwm_set → 电机转
```

### 阶段 3：KEY2 短按切高档

```text
System_SwitchSpeedLevel: LOW→HIGH
Motor 下周期:
 → target=220
 → PID 输出变大 → CCR 变大 → 转速爬升
SpeedCalc 持续更新 speed
UI 显示 Level:HIGH、RPM 变化
```

### 阶段 4：再 KEY1 进入自动

```text
System_SwitchMode: MANUAL→AUTO，g_autoModeState=STARTUP
（切模式时因为是 AUTO，不会在 SwitchMode 里 stop）
Motor:
 → STARTUP: 小 PWM，autoModeCounter 累加
Sensor + WindSpeed 继续更新
若 T>26 且 H>50 且 G>100:
 → cookingEventActive=1
 → Motor 进入 COOKING: GetPWMCompare → motor_pwm_set
cooking 结束 → DELAY_OFF 10s → 可能回 STANDBY
```

整条链路里，**你不需要先记住所有驱动细节**；先会跟：

`main → Init → StartTask → 各 while(1) → 谁写 g_systemState / speed → Motor 怎么用`

驱动函数只在调用链落到那一层时再展开（本文第 8~15 节已经按调用顺序展开了）。

---

## 18. 源码索引

| 流程卡在这 | 打开这个文件 |
|------------|--------------|
| main / Hardware_Init | `USER/main.c` |
| 全部任务、模式切换、三个 ISR | `APP_TASK/app_tasks.c` |
| 模式/优先级/SystemState 定义 | `APP_TASK/app_tasks.h` |
| PWM/编码器/测速/TIM4 | `BSP/MOTOR/motor.c` |
| PID | `BSP/PID/pid.c` |
| 风速与 Cooking / 档位 RPM | `BSP/WIND/wind_speed.c` |
| 按键状态机 | `BSP/KEY/key.c` |
| DHT11 | `BSP/DHT11/dht11.c` |
| MQ2 ADC | `BSP/MQ2/mq2.c` |
| 蜂鸣器 | `BSP/BEEP/beep.c` |
| LCD 显示字符串 | `BSP/LCD/GUI.c` 的 `Show_Str` |
| DMA | `BSP/DMA/dma.c` |
| IAP 写/跳 | `BSP/IAP/iap.c` |
| CRC | `BSP/CRC32/crc32.c` |
| ifopen / DEBUG 开关 | `SYSTEM/sys/sys.h` |
| 串口 | `SYSTEM/usart/usart.c` |
| PC 追加 CRC | `tools/add_crc32.py` |
| 系统调用中断优先级阈值 | `FreeRTOS/include/FreeRTOSConfig.h` |

---

## 一句话收束

```text
main 只负责 Init + 启动调度器；
StartTask 只负责创建任务和打开 TIM4；
真正长期跑的是各任务的 while(1)：
  按键改模式，
  传感器写环境量，
  风速算法写 PWM/事件，
  测速中断唤醒算 speed，
  电机任务按模式调用 PID 或算法 PWM 去改 TIM1，
  UI 只读显示，
  （可选）DMA 收完固件后 iap_task 校验写入并跳转。
```

跟代码时按本文 **第 3→6→8~15→17** 的顺序走一遍，就是完整代码流程。
