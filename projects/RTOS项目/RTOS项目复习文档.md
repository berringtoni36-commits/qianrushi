---
title: "RTOS项目复习文档"
tags: [tech]
created: 2026-07-11
type: permanent
summary: "RTOS项目复习文档的结构化项目笔记。"
---
# RTOS项目复习文档

> 简洁高效，结构清晰，复习时快速查阅
> 创建时间：2026-06-20
> 最后更新：2026-07-08

---

## 目录

- [[#建立项目全局地图]]
  - [[#项目目录结构]]
  - [[#main.c 启动流程]]
  - [[#三层架构]]
  - [[#系统数据流]]
- [[#裸机驱动逐个掌握]]
  - [[#GPIO + 蜂鸣器 + 按键]]
  - [[#DHT11温湿度驱动]]
  - [[#MQ2 + ADC采集]]
  - [[#LCD + SPI显示]]
  - [[#TIM1 PWM + 有刷直流电机]]
  - [[#TIM2编码器测速]]
- [[#PID闭环调速]]
  - [[#核心知识点]]
  - [[#PID公式]]
  - [[#三个参数的作用]]
  - [[#闭环数据流]]
  - [[#函数清单]]
  - [[#关键代码]]
  - [[#输出范围和 PWM 的关系]]
  - [[#为什么需要积分限幅]]
  - [[#PID 常见问题]]
- [[#FreeRTOS移植 + 应用层任务框架]]
  - [[#3分钟速查版]]
  - [[#先抓主线：定位、痛点、模型]]
  - [[#文件地图：先知道看哪里]]
  - [[#启动链路：main 到 StartTask]]
  - [[#任务目录：状态、优先级、栈]]
  - [[#启动任务：System_Init 和 StartTask]]
  - [[#任务运行模型：周期任务、事件任务、任务职责]]
  - [[#状态协作：g_systemState 和 g_dataMutex]]
  - [[#电机控制主线：四种模式怎么动]]
  - [[#风速计算算法与 Cooking Event]]
  - [[#中断通知链路：TIM4/DMA 到任务]]
  - [[#移植底层：FreeRTOSConfig、SVC、SysTick、PendSV]]
- [[#Bootloader/IAP固件升级]]
  - [[#核心概念]]
  - [[#总体流程图]]
  - [[#Flash分区]]
  - [[#固件升级流程]]
  - [[#关键代码：按学习顺序复习]]
  - [[#CRC32校验原理]]
  - [[#面试问答索引]]
  - [[#知识链]]
- [[#调试能力专项训练]]
  - [[#外设不工作排查清单]]
  - [[#HardFault排查方法]]
  - [[#RTOS调试技巧]]
  - [[#波形调试要点]]
- [[#综合复现]]
  - [[#重写顺序]]
  - [[#最终掌握的技能清单]]
- [[#附录A：项目高频面试点]]
  - [[#项目架构与任务通信]]
  - [[#外设驱动与控制算法]]
  - [[#FreeRTOS 内核机制]]
  - [[#C语言与内存基础]]
  - [[#中断、可靠性与固件升级]]

---

## 建立项目全局地图

### 项目目录结构

```
CORE/               → CMSIS核心文件 + 启动汇编（官方提供）
STM32F10x_FWLib/    → STM32标准库（官方提供，不用改）
FreeRTOS/           → FreeRTOS内核 + 移植层（官方提供，不用改）
SYSTEM/             → 串口、延时驱动（官方提供）
BSP/                → 硬件驱动（你写的，每个外设独立.c/.h）
APP_TASK/           → 应用层任务（你写的，业务逻辑核心）
USER/               → Keil工程 + main.c + 中断处理
OBJ/                → 编译输出（不要手动改）
tools/              → Python脚本 + 固件bin
```

**你写的文件（面试重点）**：

```
BSP/MOTOR/motor.c/.h         → TIM1死区互补PWM + H桥驱动
BSP/PID/pid.c/.h             → 位置式PID控制器（Kp/Ki/Kd）
BSP/WIND/wind_speed.c/.h     → 多传感器融合风速算法
BSP/DHT11/dht11.c/.h         → DHT11温湿度（单总线模拟）
BSP/MQ2/mq2.c/.h             → MQ2气体传感器（ADC采集）
BSP/KEY/key.c/.h             → 按键状态机（消抖+长短按）
BSP/LCD/lcd.c/.h             → LCD显示驱动
APP_TASK/app_tasks.c/.h      → 8个FreeRTOS任务 + 系统状态中枢
USER/main.c                  → 硬件初始化顺序 + 启动调度器
```

---

### main.c 启动流程
![[projects/RTOS项目/assets/main-startup-flow.svg]]


**Hardware_Init 初始化顺序**（顺序很重要）：
```
NVIC分组4 → delay → TIM1 PWM → TIM2编码器 → 蜂鸣器 → 按键
→ MQ2 → PID → 风速算法 → LCD → 串口(必须最后) → DMA
```
> **为什么串口必须最后初始化？** 串口初始化会影响电机转动（GPIO复用冲突）

**StartTask 存在的原因**：
- TIM4中断需要在任务和信号量都创建好之后才能初始化
- TIM4在 `StartTask()` 任务函数内部初始化（不是在 Hardware_Init 里）
- 如果在 Hardware_Init() 中初始化TIM4，中断会立刻触发
- 此时信号量还没创建（是野指针）→ HardFault → 死机

---

### 三层架构
![[projects/RTOS项目/assets/three-layer-architecture.svg]]


**改代码该找谁**：
- 改业务逻辑（如自动模式转速）→ APP_TASK
- 改硬件驱动（如换了新电机）→ BSP
- **真实案例**：风速算法从固定PWM改为温度+湿度+气体融合计算 → 只改 `APP_TASK/app_tasks.c` + `BSP/WIND/`，电机驱动完全不用动

---

### 系统数据流
![[projects/RTOS项目/assets/system-data-flow.svg]]


**g_systemState 关键字段**：
```c
typedef struct {
    WorkMode_t currentMode;     // 当前模式（待机/手动/自动/防回流）
    SpeedLevel_t speedLevel;    // 档位（LOW/HIGH）
    u8 motorRunning;            // 电机运行状态 0/1
    u8 temperature;             // 温度（DHT11采集）
    u8 humidity;                // 湿度（DHT11采集）
    float gasConcentration;     // 气体浓度（MQ2采集）
    float windSpeedPWM;         // 风速算法计算的PWM百分比
    float actualRPM;            // 编码器实测转速
    u16 targetRPM;              // 目标转速（由档位决定）
    u8 cookingEventActive;      // 烹饪事件标志
    u8 antiBackflowActive;      // 防回流激活标志
    float gasThreshold;         // 当前气体阈值
    u32 autoModeCounter;        // 自动模式计时器
    u32 cookingEventCounter;    // 烹饪事件计时器
} SystemState_t;
```

**核心思想**：
- 所有任务通过 g_systemState 共享数据
- 用互斥量 g_dataMutex 保护，一次只能一个任务访问
- 任务间松耦合，改一个任务不影响其他任务

---

## 裸机驱动逐个掌握

### GPIO + 蜂鸣器 + 按键

---

#### GPIO基础

**是什么**：
- GPIO = MCU与外部设备交互的"手"
- Port = Pin的集合（GPIOA有Pin0~Pin15）
- 时钟 = 外设的电源开关

**核心代码**：
```c
void io_set(gpioled port, u16 pin, GPIOMode_TypeDef mode)
{
    // 1. 开时钟（必须！不开=断电=不工作）
    if(port==GPIOA) RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    // ...
    // 2. 配置引脚
    GPIO_InitStructure.GPIO_Pin = pin;
    GPIO_InitStructure.GPIO_Mode = mode;        // 输入IPU / 输出Out_PP
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    // 3. 写入硬件寄存器（这行才真正生效）
    GPIO_Init(port, &GPIO_InitStructure);
}
```

**输入vs输出**：
- 输出模式（Out_PP）：MCU主动控制电平 → LED、蜂鸣器
- 输入模式（IPU）：MCU读取外部信号 → 按键
- 上拉输入：内部接上拉电阻，松开=高电平，按下=低电平

---

#### 蜂鸣器封装

**为什么封装**：
- 不用记引脚号：`Beep_on(&bep)` 比 `io_set_bit(GPIOB, GPIO_Pin_15)` 直观
- 换引脚只改一个地方：改Beep_Init，不用改所有调用处

**核心设计**：
```c
// 结构体 = "通讯录卡片"
typedef struct{
    gpioled port;
    uint16_t pin;
} led_d;

// 初始化 = "存号码到通讯录"
void Beep_Init(led_d *io, gpioled port, u16 pin)
{
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);  // 开时钟
    io->port = port;    // 存到结构体
    io->pin = pin;
    Beep_config(io);    // 配置GPIO + 默认关闭
}

// 控制函数 = "打电话"
void Beep_on(led_d *io)  { GPIO_SetBits(io->port, io->pin); }   // 高电平=响
void Beep_off(led_d *io) { GPIO_ResetBits(io->port, io->pin); } // 低电平=静音

// 定时响 = "响指定时间后自动关闭"
void Buzzer_Beep(u16 duration_ms, led_d *io)
{
    Beep_on(io);
    delay_ms(duration_ms);
    Beep_off(io);  // 自动关闭
}
```

**关键细节**：
- 用指针传参（`led_d *io`）→ 函数内修改能影响面的结构体
- Beep_config最后调用Beep_off → 防止上电时GPIO状态不确定导致乱响

---

#### 按键状态机
![[projects/RTOS项目/assets/gpio-key-state-machine.svg]]

**为什么需要状态机**：
- 问题1：按键按下瞬间会抖动（电平跳动），需要消抖
- 问题2：用delay_ms(30)消抖会阻塞主循环
- 解决：状态机每次只检查一下，不阻塞



**四个状态**：
```
IDLE（空闲）→ DEBOUNCE（消抖30ms）→ PRESSED（按下）→ LONG_PRESS（长按）
```

| 状态 | 做什么 | 转移条件 |
|------|--------|---------|
| IDLE | 等待按键按下 | 检测到低电平 → DEBOUNCE |
| DEBOUNCE | 等30ms确认 | 30ms后还按着 → PRESSED；松开了 → IDLE（是抖动） |
| PRESSED | 等松手或判断长按 | 松手 → 短按事件；超过1秒 → 长按事件 |
| LONG_PRESS | 持续长按 | 松手 → 释放事件，回IDLE |

**状态 vs 事件**：
- 状态：持续的（保安在哪个位置）
- 事件：瞬间的（保安发现了什么）
- 用事件触发动作（只触发一次），用状态判断逻辑
- 错误：用状态触发 → 一直触发；正确：用事件触发 → 只触发一次

**核心代码**：
```c
switch (key->state)
{
    case KEY_STATE_IDLE:
        if (keyPressed) {
            key->state = KEY_STATE_DEBOUNCE;
            key->pressStartTick = currentTick;  // 记录按下时刻
        }
        break;
        
    case KEY_STATE_DEBOUNCE:
        if (elapsedTime >= 30ms) {
            if (keyPressed) {
                key->state = KEY_STATE_PRESSED;
                key->pressStartTick = currentTick;  // 重新记录，用于判断长按
            } else {
                key->state = KEY_STATE_IDLE;  // 是抖动
            }
        }
        break;
        
    case KEY_STATE_PRESSED:
        if (keyPressed) {
            if (elapsedTime > 1000ms) {
                key->event = KEY_EVENT_LONG_PRESS;  // 长按事件
                key->longPressTriggered = 1;
            }
        } else {
            if (!key->longPressTriggered) {
                key->event = KEY_EVENT_SHORT_PRESS;  // 短按事件
            }
            key->state = KEY_STATE_IDLE;
            key->longPressTriggered = 0;
        }
        break;
}
```

**关键变量**：
- `longPressTriggered`：防止长按重复触发 + 防止松手误触发短按
- `readPin`函数指针：让同一个状态机处理不同按键（绑定不同读取函数）

---

**常见错误**：

| 错误 | 后果 | 正确做法 |
|------|------|---------|
| 忘记开时钟 | 外设不工作，配置白写 | 初始化第一步先开时钟 |
| 输入模式用SetBits | 引脚电平不受控 | 输入模式用Read读取 |
| 用状态触发动作 | 一直触发，切100次模式 | 用事件触发动作 |
| 消抖时间太短（1ms） | 抖动被误检测 | 消抖设30ms |
| 没有longPressTriggered | 长按重复触发+松手误触发短按 | 用变量标记 |


---

### DHT11温湿度驱动

---

#### DHT11是什么

**是什么**：
- 温湿度传感器（温度+湿度一体）
- 使用单总线协议（One-Wire）：只用一根数据线双向通信
- 便宜（几块钱），精度够用（温度±2℃，湿度±5%RH）
- 项目中用于检测厨房环境，自动调节风速

**为什么用单总线**：
- 没有标准硬件外设支持（不像UART、SPI、I2C有专用控制器）
- 必须用GPIO手动模拟时序（软件实现协议）




**项目中的使用方式**：
- SensorTask 每隔一段时间调用 `DHT11_Read_Data()` 读取温湿度
- 读到的温度、湿度写入 `g_systemState`
- WindSpeedTask 读取这些值，计算风速PWM

---

#### 通信流程

**完整时序**：
![[projects/RTOS项目/assets/dht11-timing.svg]]



**详细步骤**：

| 步骤 | DATA 电平变化 | 控制方 | 作用 |
|---|---|---|---|
| 起始信号 | MCU 拉低约 20ms → 拉高约 30us | MCU | 通知 DHT11 准备开始通信 |
| 应答信号 | 拉低约 80us → 拉高约 80us | DHT11 | 表示传感器已经响应 |
| 发送 1bit | 先拉低约 50us → 再拉高一段时间 | DHT11 | 高电平持续时间决定该 bit 是 0 还是 1 |
| 判定位值 | MCU 延时约 30us 后读取 DATA | MCU | 读到低电平 = 0；读到高电平 = 1 |
| 数据校验 | 前 4 字节求和，与第 5 字节比较 | MCU | 校验通过才使用温湿度数据，失败则丢弃 |


**单 bit 判定图**：
![[projects/RTOS项目/assets/dht11-bit-decision.svg]]



> 记忆：每个 bit 都先低电平约 50us，真正区分 0/1 的是后面的高电平宽度。MCU 延时约 30us 采样：低电平读 0，高电平读 1。

**数据格式（40 位 = 5 字节）**：

| 顺序 | 缓冲区 | 含义 | 示例值 | 解释 |
|---:|---|---|---:|---|
| 1 | `BUF[0]` | 湿度整数 | `65` | 湿度 = `65%RH` |
| 2 | `BUF[1]` | 湿度小数 | `0` | DHT11 一般为 `0` |
| 3 | `BUF[2]` | 温度整数 | `25` | 温度 = `25℃` |
| 4 | `BUF[3]` | 温度小数 | `0` | DHT11 一般为 `0` |
| 5 | `BUF[4]` | 校验和 | `90` | 前 4 字节求和后取低 8 位 |

> 校验公式：`BUF[4] == (BUF[0] + BUF[1] + BUF[2] + BUF[3]) & 0xFF`。例如：`65 + 0 + 25 + 0 = 90`，所以本次数据有效。

---

#### DHT11 核心代码
![[projects/RTOS项目/assets/dht11-read-flow.svg]]

**起始信号**：
```c
void DHT11_Start(led_d *io)
{
    chushi(io);                          // 开时钟
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;  // 输出模式
    GPIO_Init(io->port, &GPIO_InitStructure);
    
    GPIO_ResetBits(io->port, io->pin);   // 拉低
    delay_ms(20);                        // 保持20ms（起始信号）
    GPIO_SetBits(io->port, io->pin);     // 拉高
    delay_us(30);                        // 保持30μs
    GPIO_ResetBits(io->port, io->pin);   // 拉低
}
```

**读取1个字节**：
```c
u8 DHT_Read_Byte(led_d *io)
{
    u8 ReadDat = 0;
    for(i = 0; i < 8; i++)  // 读8位
    {
        while(readpin(io) == 0);  // 等待低电平结束（每位开头的50μs低电平）
        delay_us(30);             // 等30μs（关键！在0和1的分界点采样）
        temp = 0;
        if(readpin(io) == 1) temp = 1;  // 高电平=1，低电平=0
        while(readpin(io) == 1);  // 等待高电平结束
        ReadDat <<= 1;            // 左移1位（给下一位腾位置）
        ReadDat |= temp;          // 存入当前位（LSB先传）
    }
    return ReadDat;
}
```

**主函数**：
```c
u8 DHT_Read_Data(u8 *temp, u8 *humi, gpioled port, u16 pin, led_d *io)
{
    io->port = port;
    io->pin = pin;
    
    DHT11_Start(io);      // 发起始信号
    DHT11_Read(io);       // 切换到输入模式
    delay_us(20);
    
    if(readpin(io) == 0)  // DHT11应答了（拉低=应答）
    {
        // 等待应答信号结束...
        for(i = 0; i < 5; i++)
            BUF[i] = DHT_Read_Byte(io);  // 读5个字节
        
        sum = BUF[0] + BUF[1] + BUF[2] + BUF[3];
        if(BUF[4] == (u8)sum)  // 校验通过
        {
            *humi = BUF[0];  // 湿度
            *temp = BUF[2];  // 温度
            return 1;        // 成功
        }
    }
    return 0;  // 失败
}
```

**读取失败怎么处理**（项目中的做法）：
- SensorTask 调用 `DHT11_Read_Data()`，返回值判断成功/失败
- 失败时保留上一次的有效数据，不覆盖 g_systemState
- 不会因为一次读取失败导致系统异常

---

#### DHT11 关键细节

**为什么delay_us(30)是关键**：
- "0"的高电平持续26~28μs
- "1"的高电平持续70μs
- 等30μs后判断：还是高电平=1，已经低电平=0
- 30μs恰好在两者之间，是最佳采样点

**为什么要切换GPIO模式**：
- 输出模式：MCU控制引脚电平（发起始信号）
- 输入模式：MCU读取引脚电平（接收DHT11数据）
- 同一根线，不同时间做不同的事（半双工）

**为什么要校验**：
- 单总线没有时钟线，时序全靠延时，容易被干扰
- 40位数据只要有1位出错，整个温湿度值就错了
- 校验失败 → 数据不可信 → 丢弃，等下次读取

**为什么是LSB先传**：
- `ReadDat <<= 1; ReadDat |= temp;` 每次新读的位放在最低位
- 先读到的字节先传，每字节内部低位先传
- 这是DHT11的协议规定，不是SPI/I2C那种MSB先传

---

**常见错误**：

| 错误 | 后果 | 正确做法 |
|------|------|---------|
| 起始信号太短（5ms） | DHT11检测不到，不会应答 | 起始信号要20ms |
| 判断电平时间不对 | 误读0/1 | delay_us(30)是最佳判断点 |
| 删除校验 | 可能使用错误数据 | 必须校验 |
| 左移操作位置错误 | 数据错乱 | 先读再移（先<<再\|） |
| 读取失败不处理 | 系统用错误数据运行 | 失败时保留上次有效值 |
| 不切回输出模式 | 下次读取时起始信号发不出 | 每次读取前重新初始化GPIO |

---

### MQ2 + ADC采集

---

#### MQ2是什么
![[projects/RTOS项目/assets/mq2-adc-sampling-flow.svg]]

**是什么**：
- 气体传感器，能检测烟雾、可燃气体等
- 有两个输出：AO（模拟输出）和 DO（数字输出）
- 项目中只用 AO：输出连续变化的模拟电压，能精确反映气体浓度
- DO 只有高低两种状态，无法量化，项目不用

**项目接线**：
- MQ2 AO 引脚 → PA4 → ADC1 Channel 4

**项目中的使用方式**：


- SensorTask 每 500ms 调用 `MQ2_GetGasConcentration()` 读取气体浓度
- 读到的浓度写入 `g_systemState.gasConcentration`
- WindSpeedTask 读取浓度参与风速计算
- AntiBackflowTask 读取浓度判断是否触发防回流

---

#### ADC原理
![[projects/RTOS项目/assets/adc-conversion-principle.svg]]

**ADC 是什么**：
- ADC = 模数转换器，把模拟电压变成数字
- 心智模型：一把尺子，把 0~3.3V 分成 4096 份（12bit）
- 测量电压占了几格，输出 0~4095


**关键公式**：
```
Voltage = ADC值 / 4096 × 3.3V
ADC值 = Voltage / 3.3 × 4096
```

**ADC 初始化 5 步（MQ2_Init）**：
![[projects/RTOS项目/assets/adc-init-flow.svg]]

**为什么 PA4 必须设为模拟输入？**
- 如果不是 AIN 模式，引脚内部的上下拉或数字输入结构会干扰模拟信号
- ADC 读出来的电压不准确

---

#### MQ2 核心代码

**读取一次 ADC（MQ2_GetAdcValue）**：
```c
u16 MQ2_GetAdcValue(void)
{
    u16 adc_value;

    // 1. 选通道4，采样时间239.5周期
    ADC_RegularChannelConfig(ADC1, ADC_Channel_4, 1, ADC_SampleTime_239Cycles5);
    // 2. 软件触发开始转换
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    // 3. 等待转换完成（EOC=1表示End Of Conversion）
    while (!ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC));
    // 4. 读取结果（0~4095）
    adc_value = ADC_GetConversionValue(ADC1);

    return adc_value;
}
```

**换算浓度（MQ2_GetGasConcentration）**：
```c
float MQ2_GetGasConcentration(void)
{
    // 1. 10次采样取平均（间隔100us，压低噪声）
    for (i = 0; i < 10; i++) {
        sum += MQ2_GetAdcValue();
        delay_us(100);
    }
    adc_avg = sum / 10;

    // 2. 数字 → 电压
    tmep = (float)adc_avg * (3.3 / 4096);

    // 3. 电压 → 气体浓度（MQ2数据手册公式，不用死记）
    RS = (5 - tmep) / tmep * 0.5;
    gas_concentration = pow(11.5428 * 2 / RS, 0.6549f) * 100;

    return gas_concentration;
}
```

**SensorTask 中的调用（含互斥量保护）**：
```c
gasValue = MQ2_GetGasConcentration();
xSemaphoreTake(g_dataMutex, portMAX_DELAY);
g_systemState.gasConcentration = gasValue;
xSemaphoreGive(g_dataMutex);
```

---

#### MQ2 关键细节

**为什么 10 次采样取平均？**
- 单次 ADC 采样容易受噪声干扰，数值会抖动
- 多次采样取平均可以压低短期波动，让结果更稳定
- 每次间隔 100us，避免连续读到同一瞬间

**ADC 校准要每次都做吗？**
- 不需要。校准是为了消除 ADC 内部工艺偏差
- 这个偏差在一次上电期间是稳定的，初始化时做一次就够了

**不等 EOC 标志位直接读会怎样？**
- 可能读到上一次转换的残留值、转换中的中间状态或不稳定值
- 结果不可信，必须等 EOC=1 再读

**传感器数据抖动是已知风险点（开发文档）**：
- 可增加滑动平均或限幅滤波来进一步稳定数据

---

#### MQ2 常见问题

| 问题 | 答案 |
|------|------|
| MQ2 为什么用 AO 不用 DO？ | AO 输出连续模拟电压能量化浓度；DO 只有高低两种状态，无法量化 |
| ADC 把什么变成了什么？ | ADC 把模拟电压变成数字（0~4095）；软件再把数字换算成电压和浓度 |
| 为什么要 10 次采样取平均？ | 压低单次采样的噪声和抖动，让结果更稳定 |
| 为什么 PA4 必须设为模拟输入？ | 否则引脚内部数字电路会污染模拟信号，ADC 读数不准 |
| 不等 EOC 直接读会怎样？ | 可能读到残留值或中间状态，结果不可信 |
| ADC 校准要每次都做吗？ | 不需要，初始化时做一次就够了 |
| 为什么写 g_systemState 要用互斥量？ | 多任务同时读写会导致数据不一致，互斥量保证同一时间只有一个任务访问 |

> **面试高频考点详见 rtos项目高频面试点.md**（8.1 为什么使用互斥量、8.2 为什么不采用队列）
---
### LCD + SPI显示

---

#### LCD和SPI是什么

**是什么**：
- LCD = 液晶显示屏，显示运行状态（模式、温度、风速、转速）
- SPI = 高速同步全双工通信协议，MCU 通过 SPI 发数据给 LCD
- 项目使用 ST7735S 芯片的 128x160 TFT 彩屏

**项目接线**：
- SDA -> PA7（MOSI 数据线）
- SCK -> PA5（时钟线）
- A0/DC -> PB7（命令/数据选择）
- RESET -> PB8（复位）
- CS -> PB9（片选）
- LED -> PB6（背光）
- MISO/PA6 虽然初始化了但没用到，LCD 只接收不发送

**调用链**：
![[projects/RTOS项目/assets/lcd-spi-display-flow.svg]]


---

#### SPI 通信原理

**四根线**：
- **SCK**：时钟，主机产生，每跳一次传 1 位
- **MOSI**：主机发、从机收（本项目只用这条）
- **MISO**：从机发、主机收（LCD 不需要，没用）
- **CS**：拉低 = 选中，拉高 = 忽略

**通信原理**：主机写 1 字节 -> 移位寄存器通过 MOSI 逐位传给从机，SCK 同步

**CPOL 和 CPHA（面试高频考点 8.13）**：
- CPOL=0：空闲时 SCK 低电平
- CPHA=0：第一个边沿（上升沿）采样
- 本项目：`SPI_CPOL_Low` + `SPI_CPHA_1Edge`
- 主从双方必须一致，否则采样错位

---

#### LCD 核心代码

**写命令 vs 写数据（唯一区别是 DC）**：
```c
void LCD_WR_REG(u8 data)   // 写命令
{
    LCD_CS_CLR;             // CS拉低=选中
    LCD_RS_CLR;             // DC=0=命令
    SPI_WriteByte(SPI1, data);
    LCD_CS_SET;             // CS拉高=结束
}

void LCD_WR_DATA(u8 data)  // 写数据
{
    LCD_CS_CLR;
    LCD_RS_SET;             // DC=1=数据
    SPI_WriteByte(SPI1, data);
    LCD_CS_SET;
}
```

**SPI 底层发送**：
```c
u8 SPI_WriteByte(SPI_TypeDef* SPIx, u8 Byte)
{
    while((SPIx->STATR & SPI_I2S_FLAG_TXE) == RESET);  // 等发送区空
    SPIx->DATAR = Byte;                                 // 写入，硬件自动发
    while((SPIx->STATR & SPI_I2S_FLAG_RXNE) == RESET); // 等完成
    return SPIx->DR;
}
```

**UIDisplayTask 套路**：
```c
void UIDisplayTask(void *pvParameters)
{
    char dispBuf[32];
    LCD_Clear(WHITE);
    while (1)
    {
        sprintf(dispBuf, "Mode:%s", ModeNames[g_systemState.currentMode]);
        Show_Str(0, 20, BLUE, WHITE, (u8*)dispBuf, 16, 0);
        // ... Level、WIND、RPM 同理，y坐标递增20
        delay_ms(200);  // 200ms刷新
    }
}
```

---

#### LCD 关键细节

**LCD 为什么区分命令和数据？**
- 命令（DC=0）：控制行为（清屏、设光标、设方向）
- 数据（DC=1）：显示内容（像素颜色、字符）

**LCD_Init 做了什么？**
- SPI初始化 -> GPIO初始化 -> 硬件复位 -> 发ST7735S配置命令（厂家给的，抄就行）

**UIDisplayTask 优先级为什么最低？**
- LCD 显示不紧急，200ms刷新够用；电机控制需要实时响应

**函数掌握分级**：
- 必须会：`LCD_Init()`、`Show_Str()`、`LCD_Clear()`
- 知道存在：`LCD_WR_REG()`、`LCD_WR_DATA()`、`SPI_WriteByte()`
- 不用管：`LCD_SetWindows()`、ST7735S 寄存器配置

---

#### LCD 常见问题

| 问题 | 答案 |
|------|------|
| SPI 四根线？ | SCK 时钟、MOSI 主发从收、MISO 从发主收、CS 片选 |
| WR_REG 和 WR_DATA 区别？ | DC 电平：命令=0，数据=1 |
| MISO 为什么没用？ | LCD 只接收不发送，不需要回传 |
| CPOL/CPHA？ | CPOL 决定空闲电平，CPHA 决定采样边沿。本项目 CPOL=0, CPHA=0 |
| 显示一行文字的套路？ | sprintf 拼字符串 -> Show_Str，换不同 y 坐标 |
| 为什么不深入看驱动代码？ | 厂家驱动当黑盒用，会调 Show_Str 就行 |

> **面试高频考点详见 rtos项目高频面试点.md**（8.13 SPI 通信原理及工作模式）

---
### TIM1 PWM + 有刷直流电机
![[projects/RTOS项目/assets/tim1-hbridge-pwm.svg]]

> 面试高频考点详见 rtos项目高频面试点.md（8.8 直流有刷电机驱动原理、8.14 编写PWM驱动的步骤）

**核心知识点**：

1. **PWM 控制转速**：快速开-关电源，占空比越大 → 平均电压越高 → 电机越快
2. **H 桥**：4 个 MOS 管，对角管导通决定电流方向（正转/反转）
3. **死区时间**：同侧上下管切换时插入"都断开"的空白，防止短路烧管
4. **TIM1 高级定时器**：互补输出（CH1/CH1N 自动反相）+ 硬件死区 + MOE 主输出使能
5. **安全设计**：初始化 CCR=0 不转，速度由运行时任务决定

**H 桥电路图**：
![[projects/RTOS项目/assets/hbridge-circuit.svg]]
![[projects/RTOS项目/assets/h-bridge-motor-driver.svg]]


**PWM 波形生成原理**：
![[projects/RTOS项目/assets/pwm-wave-principle.svg]]


**互补输出 + 死区**：
![[projects/RTOS项目/assets/complementary-deadtime.svg]]


**关键公式**：
```
    PWM频率 = 72MHz / (PSC+1) / (ARR+1)
    本项目：72MHz / 72 / 1000 = 1kHz

    占空比 = CCR / (ARR+1)
    本项目 ARR=999，所以 占空比 = CCR / 1000

    平均电压 = 电源电压 × 占空比
    例：12V × 50% = 6V

    死区时间 = DTG × (1 / 死区时钟)
    死区时钟 = 定时器时钟 / CKD = 72MHz / 4 = 18MHz
    本项目：100 / 18MHz ≈ 5.6μs
```

**motor.c 函数清单**：

| 函数 | 作用 | 级别 |
|------|------|:---:|
| `TIM1_dead_pwm_init(arr,psc,ccr,dtg)` | 配置 TIM1 PWM 频率、占空比、死区、互补输出 | ⭐ |
| `motor_init()` | 初始化电机状态：正转→停止→使能H桥 | 📝 |
| `motor_start()` | PA2 拉高，H桥使能 | 📝 |
| `motor_stop()` | 关CH1 + 关CH1N + PA2拉低（三重保护） | 📝 |
| `motor_dir(para)` | 切方向：先全关再开一个通道 | 📝 |
| `motor_speed(ccr)` | 写 CCR1，直接改占空比 | 📝 |
| `motor_pwm_set(val)` | 上层接口：自动判断正负→切方向+调速度 | 📝 |

**TIM1_dead_pwm_init 六步配置**：
```c
void TIM1_dead_pwm_init(u16 arr, u16 psc, u16 ccr, u16 dtg)
{
    // ① 开时钟（TIM1 在 APB2 总线上）
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_TIM1, ENABLE);

    // ② 配引脚
    io_set(GPIOA, GPIO_Pin_8,  GPIO_Mode_AF_PP);  // PA8 = CH1（复用推挽）
    io_set(GPIOB, GPIO_Pin_13, GPIO_Mode_AF_PP);  // PB13 = CH1N（互补输出）
    io_set(GPIOA, GPIO_Pin_2,  GPIO_Mode_Out_PP); // PA2 = 普通GPIO，控制H桥使能

    // ③ 时基单元（决定 PWM 频率）
    // ARR=999, PSC=71 → 72MHz / 72 / 1000 = 1kHz

    // ④ 输出比较（决定占空比 + 互补输出）
    // PWM模式1, CH1 + CH1N 使能, CCR = 初始占空比（传0）

    // ⑤ BDTR（死区时间）
    // DTG=100, 本项目未用刹车功能

    // ⑥ 使能输出
    TIM_CtrlPWMOutputs(TIM1, ENABLE);  // MOE=1，高级定时器特有
    TIM_Cmd(TIM1, ENABLE);             // 计数器开始跑
}
```

**motor_stop 三重保护**：
```c
void motor_stop(void) {
    TIM_CCxCmd(TIM1, TIM_Channel_1, TIM_CCx_Disable);    // 关 CH1
    TIM_CCxNCmd(TIM1, TIM_Channel_1, TIM_CCxN_Disable);  // 关 CH1N
    io_reset_bit(GPIOA, GPIO_Pin_2);  // PA2 = 0，H桥断电
}
```
为什么三重：关通道 = 切断信号源，拉低 PA2 = 切断电源。只拉低 PA2 不够——如果 PA2 被意外拉高，PWM 还在输出，电机会突然启动。

**motor_dir 方向控制**：
```c
void motor_dir(direction para) {
    // 先全关两个通道（确保切换干净）
    TIM_CCxCmd(TIM1, TIM_Channel_1, TIM_CCx_Disable);
    TIM_CCxNCmd(TIM1, TIM_Channel_1, TIM_CCxN_Disable);

    if (para == stright)
        TIM_CCxNCmd(..., TIM_CCxN_Enable);  // 正转：开 CH1N（PB13）
    else
        TIM_CCxCmd(..., TIM_CCx_Enable);    // 反转：开 CH1（PA8）
}
```
为什么先全关：不先关可能短暂两路同时输出 → H 桥冲突 → 电机抖动甚至短路。

**motor.c 模块调用关系**：
![[projects/RTOS项目/assets/motor-module-flow.svg]]


**常见问题排查**：

| 现象 | 原因 | 排查 |
|------|------|------|
| 电机完全不转 | MOE 未使能 / CCR=0 / PA2 未拉高 | 检查 `TIM_CtrlPWMOutputs`、CCR 值、PA2 电平 |
| 只能正转不能反转 | `motor_dir()` 只开了一个通道 | 检查 CH1 和 CH1N 是否都有 Enable/Disable |
| 切方向时电机抖动 | 没有先全关再开 / 死区时间不对 | 检查 `motor_dir()` 是否先 Disable 再 Enable |
| 改了 CCR 但速度不变 | CCR 超出 ARR 被限幅 | 检查 `motor_speed()` 里的 `if(ccr<=1000)` |

**学习过程中的易错点**：

1. **MOE 位最容易忘**：配了所有 PWM 参数但没调 `TIM_CtrlPWMOutputs(TIM1, ENABLE)`，PWM 不会从引脚输出
2. **PA2 不是 TIM1 的引脚**：它是普通 GPIO，用来控制 H 桥驱动芯片的使能端，和 CH1/CH1N 的作用完全不同
3. **互补输出 ≠ 两个独立通道**：CH1N 是硬件自动生成的 CH1 反相波形，不需要单独配置占空比
4. **先全关再开方向**：`motor_dir()` 里必须先 Disable 两个通道再 Enable 目标通道，否则可能短路
5. **motor_stop 做三件事不是多余的**：只拉低 PA2 不够安全，通道还在输出 PWM，一旦 PA2 被意外拉高电机就会启动
6. **CCR=0 时电机不转是正常的**：初始化时 CCR=0 是安全设计，速度由运行时的任务根据模式和 PID 决定

---



### TIM2编码器测速
![[projects/RTOS项目/assets/speed-calc-flow.svg]]

**核心知识点**：

- PWM 是控制量，不代表电机真实转速；编码器测速提供实际 RPM，给 PID 做闭环反馈
- 编码器 A/B 相接到 `PA0/TIM2_CH1`、`PA1/TIM2_CH2`
- `TIM2` 配置成编码器模式后，负责硬件计数和方向判断
- `TIM4` 提供固定测速周期，中断里只释放信号量，不直接算速度
- `SpeedCalcTask` 被信号量唤醒后读取编码器计数，并调用 `get_speed()` 计算 RPM
- `overflow` 用于处理 TIM2 16 位计数器溢出，保证计数连续

> 面试高频考点详见 `rtos项目高频面试点.md`（8.9 编码器测速原理、8.10 PID、8.18 二值信号量、8.28 ISR 与任务通信）。

**关键公式和参数**：

```text
连续累计计数 = TIM_GetCounter(TIM2) + overflow * 65536

delta = now_value - old_value

RPM = delta * (1000 / ms) * 60 / 30 / (11 * 4)
```

| 参数 | 快速记忆 |
|---|---|
| `65536` | 16 位计数器共有 65536 个状态，不是 65535 |
| `11` | 编码器线数 |
| `4` | 四倍频 |
| `30` | 减速比，不除会让输出轴 RPM 偏大约 30 倍 |
| `ms=50` | 速度换算使用的采样窗口 |

**函数清单**：

| 函数 / 中断 | 作用 | 级别 |
|---|---|:---:|
| `TIM2_encode_init()` | 初始化 TIM2 编码器模式，接收 A/B 相 | ⭐ |
| `TIM4_init()` | 初始化固定测速节拍 | 📝 |
| `TIM4_IRQHandler()` | TIM4 到时间后释放测速信号量 | ⭐ |
| `SpeedCalcTask()` | 等待信号量，计算实际转速 | ⭐ |
| `get_encoder_value()` | 读取 TIM2 计数，并叠加 `overflow` | ⭐ |
| `TIM2_IRQHandler()` | 处理 TIM2 溢出，更新 `overflow` | ⭐ |
| `TIM_GetDirection()` | 读取 TIM2 当前计数方向 | 📝 |
| `get_speed()` | 计数差转 RPM，并做滤波 | ⭐ |

**关键代码**：

```c
/* A/B 相接 PA0、PA1，TIM2 使用 TI1 + TI2 编码器模式 */
io_set(GPIOA, GPIO_Pin_0, GPIO_Mode_IPD);   // TIM2_CH1 / A相
io_set(GPIOA, GPIO_Pin_1, GPIO_Mode_IPD);   // TIM2_CH2 / B相
TIM_EncoderInterfaceConfig(TIM2, TIM_EncoderMode_TI12,
                           TIM_ICPolarity_Rising,
                           TIM_ICPolarity_Rising);
```

```c
/* TIM2 溢出处理：正转 overflow++，反转 overflow-- */
if (TIM_GetDirection(TIM2))
    overflow--;
else
    overflow++;
```

```c
/* 连续累计计数 */
buffer = TIM_GetCounter(TIM2) + (overflow * 65536);
```

```c
/* TIM4 中断只通知，不直接算速度 */
xSemaphoreGiveFromISR(g_speedCalcSemaphore, &xHigherPriorityTaskWoken);
```

```c
/* 速度任务中计算 RPM */
encoderCount = get_encoder_value();
speed = get_speed(encoderCount, 50);
```

**测速调用关系**：



**溢出难点**：

```text
已知：
TIM2_CNT = 65530
old_value = 65530
overflow = 0
电机正转

过程：
65530 -> 65535 -> 0 -> 2
从 65535 跳到 0 时，TIM2_IRQHandler 里 overflow++

连续计数：
get_encoder_value = 2 + 1 * 65536 = 65538
delta = 65538 - 65530 = 8
```

如果不处理 `overflow`：

```text
2 - 65530 = -65528
```

明明电机正转，速度却会变成巨大异常值。

**三个难点总结**：

1. **溢出处理**：正转溢出 `overflow++`，反转溢出 `overflow--`，总计数用 `TIM_GetCounter(TIM2) + overflow * 65536`。
2. **固定周期**：RPM 依赖固定时间窗口内的计数差，所以 TIM4 负责稳定通知，不能在 `while(1)` 里随便算。
3. **中断不干重活**：`TIM4_IRQHandler()` 只释放信号量，`get_speed()` 的换算、排序、滤波放到 `SpeedCalcTask`。

**常见问题排查**：

| 现象 | 原因 | 排查 |
|---|---|---|
| RPM 突然跳大 | 溢出处理错误 / 采样周期不稳定 | `overflow`、TIM4 周期、`get_speed(encoderCount, 50)` |
| RPM 偏大约 30 倍 | 没除减速比 | 检查公式里的 `/ 30` |
| 反转时计数异常 | 溢出方向处理错 | 检查 `TIM_GetDirection(TIM2)` 和 `overflow++/--` |
| RPM 抖动明显 | 毛刺或单次采样异常 | 检查输入滤波、去极值平均、低通滤波 |
| 系统实时性变差 | ISR 里做了复杂计算 | TIM4 中断只通知，速度计算放任务里 |

**学习过程中的易错点**：

1. **TIM2 不是计时器节拍**：这里 TIM2 主要是编码器模式，用来数脉冲和判断方向
2. **TIM4 不参与计数**：TIM4 只负责固定周期通知 `SpeedCalcTask`
3. **`65536` 不是 `65535`**：16 位最大值是 65535，但状态数量是 65536
4. **`overflow` 不在 RPM 公式里**：它先在 `get_encoder_value()` 里把计数拼连续
5. **`30` 是减速比**：不除以 30，输出轴 RPM 会偏大约 30 倍
6. **中断不直接算速度**：ISR 只释放信号量，复杂计算放任务中

**最可能追问**：

| 追问 | 回答要点 |
|---|---|
| TIM2 和 TIM4 分别干什么？ | TIM2 数脉冲并判断方向；TIM4 提供固定测速周期并通知任务 |
| 为什么测速周期要固定？ | RPM 依赖固定时间内的计数差，周期不准速度就会偏 |
| TIM2 溢出怎么办？ | 用 `overflow++/--` 记录溢出，再乘 `65536` 拼连续计数 |
| 为什么不在 TIM4 中断里直接算速度？ | 中断要短，复杂计算放到任务里，ISR 只释放信号量 |
| `11 * 4` 和 `30` 是什么？ | `11` 是线数，`4` 是四倍频，`30` 是减速比 |

---

## PID闭环调速
![[projects/RTOS项目/assets/encoder-pid-loop_animated.svg]]

### 核心知识点
- 固定 PWM 只能控制电机输入的平均电压，不能保证固定转速；负载、风阻、电源电压和电机差异都会让实际 RPM 偏离目标 RPM。
- PID 闭环调速的核心是：编码器提供实际转速，PID 计算 `targetRPM - actualRPM`，再动态修正 TIM1 PWM 占空比。
- 本项目中目标转速来自档位：低档 `190 RPM`，高档 `220 RPM`。
- 实际转速来自 2.6 节的 TIM2 编码器测速链路：`TIM2` 计数，`TIM4` 固定周期通知，`SpeedCalcTask` 调用 `get_speed()` 得到 `speed`。
- PID 输出不是 RPM，而是 PWM 控制量，最终作为 `TIM1` 的 CCR 比较值写入定时器。
- 当前参数为 `Kp=14.0`、`Ki=1.65`、`Kd=0.0`，实际更接近 PI 控制：P 负责快速靠近目标，I 负责消除静差，D 暂不使用。
- 手动模式和防回流模式会使用 PID 稳速；自动模式 Cooking 阶段主要使用风速融合算法输出 PWM。

> 面试高频考点详见 `rtos项目高频面试点.md`（8.10 PID 算法、8.9 编码器测速原理）。

### PID公式
```text
error = target - actual
integral = integral + error

p_out = Kp * error
i_out = Ki * integral
d_out = Kd * (error - last_error)

output = p_out + i_out + d_out
last_error = error
```

### 三个参数的作用
- **Kp**：比例项，放大当前误差。误差越大，PWM 调节量越大，负责让电机快速向目标转速靠近。太小会“推不动”，太大容易超调和震荡。
- **Ki**：积分项，累加历史误差。用于消除静态误差，例如目标 220 RPM，但长期稳定在 210 RPM 时，I 项会继续补偿 PWM。太大容易积分饱和和严重超调。
- **Kd**：微分项，观察误差变化速度。可以提前抑制控制量，减少超调，但对编码器测速噪声敏感。本项目 `Kd=0.0`，暂时不启用。

**调参记忆**：

```text
先调 Kp，让电机能接近目标；
再调 Ki，把最后的静态误差补掉；
Kd 最后考虑，本项目为了避免放大测速噪声，设为 0。
```

| 参数 | 过小现象 | 过大现象 | 本项目取值 |
|---|---|---|---|
| `Kp` | 响应慢、速度上不去 | 超调、震荡 | `14.0` |
| `Ki` | 静差消除慢，长期差一点 | 积分饱和、PWM 打满、超调 | `1.65` |
| `Kd` | 抑制超调能力弱 | 放大测速噪声，PWM 抖动 | `0.0` |

### 闭环数据流
![[projects/RTOS项目/assets/pid-closed-loop-flow.svg]]


**闭环一句话**：

```text
目标转速来自档位，实际转速来自编码器，PID 根据误差算出 PWM 控制量，TIM1 执行 PWM，电机转速变化后再由编码器反馈回来。
```

### 函数清单

| 函数 / 任务 | 作用 | 级别 |
|---|---|:---:|
| `PID_TypeDef` | 保存 Kp/Ki/Kd、目标值、实际值、误差、积分、输出限幅等 PID 状态 | ⭐ |
| `PID_Init()` | 初始化 PID 参数、输出限幅和积分限幅 | ⭐ |
| `PID_SetTarget()` | 设置目标转速 | 📝 |
| `PID_Calculate()` | 根据目标转速和实际转速计算 PWM 控制量 | ⭐ |
| `PID_Reset()` | 清空误差、积分和输出，防止历史状态影响下次启动 | 📝 |
| `MotorControlTask()` | 在手动模式和防回流模式下串起目标、反馈、PID、PWM | ⭐ |
| `SpeedCalcTask()` | 由 TIM4 信号量唤醒，更新实际转速 `speed` | ⭐ |
| `get_speed()` | 把编码器计数变化换算为 RPM，并做滤波 | ⭐ |
| `WindSpeed_GetTargetRPM()` | 根据档位返回目标 RPM | 📝 |
| `motor_pwm_set()` | 将 PID 输出转换为电机方向和 PWM 设置 | ⭐ |
| `motor_speed()` | 写 TIM1 CCR，真正改变 PWM 占空比 | ⭐ |

### 关键代码
```c
/* PID 初始化：Kp=14.0，Ki=1.65，Kd=0，输出限幅 0~1000 */
PID_Init(&g_speedPID, 14.0f, 1.65f, 0.0f, 1000.0f, 0.0f);
```

```c
/* 手动模式闭环调速核心 */
g_systemState.targetRPM = WindSpeed_GetTargetRPM(g_systemState.speedLevel);
PID_SetTarget(&g_speedPID, (float)g_systemState.targetRPM);
pidOutput = PID_Calculate(&g_speedPID, speed);
motor_pwm_set(pidOutput);
```

```c
/* 防回流模式触发后，也按当前档位进行 PID 稳速 */
g_systemState.targetRPM = WindSpeed_GetTargetRPM(g_systemState.speedLevel);
PID_SetTarget(&g_speedPID, (float)g_systemState.targetRPM);
pidOutput = PID_Calculate(&g_speedPID, speed);
motor_pwm_set(pidOutput);
```

```c
/* PID 核心：误差、积分、三项输出、限幅 */
pid->error = pid->target - pid->actual;
pid->integral += pid->error;

if (pid->integral > pid->integral_max)
{
    pid->integral = pid->integral_max;
}
else if (pid->integral < -pid->integral_max)
{
    pid->integral = -pid->integral_max;
}

p_out = pid->Kp * pid->error;
i_out = pid->Ki * pid->integral;
d_out = pid->Kd * (pid->error - pid->last_error);

pid->output = p_out + i_out + d_out;
```

```c
/* 输出限幅：PID 输出最终要落到 PWM 比较值范围内 */
if (pid->output > pid->output_max)
{
    pid->output = pid->output_max;
}
else if (pid->output < pid->output_min)
{
    pid->output = pid->output_min;
}
```

```c
/* PID 输出执行到电机驱动 */
void motor_pwm_set(float para)
{
    int val = (int)para;

    if (val >= 0)
    {
        motor_dir(stright);
        motor_speed(val);
    }
    else
    {
        motor_dir(invert);
        motor_speed(-val);
    }
}
```

```c
/* 真正写 TIM1 比较值，改变 PWM 占空比 */
void motor_speed(u16 ccr)
{
    if(ccr<=1000)
    {
        TIM_SetCompare1(TIM1,ccr);
    }
}
```

### 输出范围和 PWM 的关系

```text
TIM1_dead_pwm_init(1000-1, 72-1, 0, 100)
```

TIM1 的自动重装载值约为 `999`，一个 PWM 周期约分成 `1000` 份。因此 PID 输出限幅 `0~1000` 对应 PWM 比较值范围：

| PID输出 / CCR | 含义 |
|---|---|
| `0` | 接近 0% 占空比 |
| `500` | 接近 50% 占空比 |
| `1000` | 接近 100% 占空比 |

注意：`0~1000` 不是 RPM 范围，而是 PWM 控制量范围。

### 为什么需要积分限幅

如果电机长期达不到目标，例如目标 `220 RPM`，实际长期只有 `150 RPM`：

```text
error = 220 - 150 = 70
integral += 70
```

积分会不断累加。若不限制，负载恢复后 PID 仍可能因为积分过大而长时间输出很高 PWM，造成超调和震荡。

本项目中：

```text
output_max = 1000
integral_max = output_max / 2 = 500
```

### PID 常见问题
- **固定 PWM 为什么不够？**  
  PWM 只是控制量，不是实际转速。负载、风阻、电源电压变化都会让同一个 PWM 对应不同 RPM，所以必须用编码器反馈形成闭环。

- **为什么 `error = target - actual` 不能写反？**  
  如果写成 `actual - target`，实际速度偏低时误差为负，PID 会减小 PWM，控制方向完全反了。

- **为什么 `error = 0` 时 PID 输出可能不是 0？**  
  电机维持目标转速需要持续能量。积分项会保留一部分历史补偿，形成类似“基础油门”的输出。

- **为什么本项目 `Kd=0`？**  
  D 项对误差变化速度敏感，也容易放大编码器测速噪声。本项目转速目标较低，P+I 已能满足稳速需求，所以暂时关闭 D。

- **PID 输出为什么要限幅到 `0~1000`？**  
  因为最终输出要写入 TIM1 PWM 比较值，范围必须和 PWM 定时器配置匹配，不能超过硬件可表达范围。

- **速度反馈为什么要滤波？**  
  编码器测速有毛刺或采样误差时，单次异常 RPM 会让 PID 错误调节 PWM。滤波后反馈更平滑，闭环更稳定。

- **目标升高后实际速度不上去怎么办？**  
  优先确认编码器反馈和 PWM 输出正常，再看 `Kp` 是否太小。开发文档中的调试经验也强调：先保证比例项能推动实际值接近目标，再调积分项。

---

## FreeRTOS移植 + 应用层任务框架

### 3分钟速查版
![[projects/RTOS项目/assets/boot-vs-freertos-startup.svg]]

复习时先背这几条，能说顺就算抓住第4阶段主线。

```text
为什么用 FreeRTOS：
本项目任务多、周期不同、实时性不同。裸机 while(1) 容易被耗时函数阻塞，
FreeRTOS 把功能拆成任务，用优先级、延时阻塞和信号量通知来调度。

启动主线：
main()
  -> Hardware_Init()
  -> System_Init()
  -> StartTask_Create()
  -> vTaskStartScheduler()
  -> StartTask 创建业务任务和 TIM4
  -> StartTask 删除自己

任务协作：
各任务围绕 g_systemState 读写最新状态。
g_dataMutex 保护 g_systemState。
g_speedCalcSemaphore 负责 TIM4 中断通知 SpeedCalcTask。

两类任务：
周期任务：while(1) { 做业务; delay_ms(周期); }
事件任务：while(1) { 等信号量; 被唤醒后处理; }

中断原则：
TIM4/DMA 中断只清标志、释放信号量、必要时请求任务切换。
复杂处理放到任务里，不能在 ISR 里做长耗时逻辑。

底层三件套：
SVC 启动第一个任务。
SysTick 提供 1ms 系统节拍。
PendSV 负责任务切换。
```

面试时最稳的一段话：

```text
本项目使用 FreeRTOS，是因为按键、电机控制、传感器采集、显示、测速和 IAP 升级的周期不同。
如果都放在裸机 while(1) 里，耗时任务会阻塞其他功能。
所以我把功能拆成多个任务：按键 10ms、电机 50ms、风速 100ms、显示 200ms、传感器 500ms。
任务之间通过 g_systemState 共享最新状态，并用 g_dataMutex 保护。
TIM4 测速和 DMA 接收这种中断事件，则通过二值信号量通知任务处理，ISR 只做快速通知。
底层由 SVC 启动第一个任务，SysTick 提供系统节拍，PendSV 完成任务切换。
```

最容易说错的点：

| 易错说法 | 正确说法 |
|---|---|
| FreeRTOS 解决多进程问题 | STM32 里主要说多任务调度 |
| `SystemState_t` 是全局变量 | `SystemState_t` 是类型，`g_systemState` 才是全局变量 |
| 信号量保存状态 | 信号量负责通知，状态存在 `g_systemState` |
| TIM4 通知风速计算 | TIM4 通知 `SpeedCalcTask` 做速度计算 |
| 待机模式判断 cooking event | 待机只停机，自动模式才判断 cooking event |

---

### 先抓主线：定位、痛点、模型

#### 本阶段定位

本阶段不是单独背 FreeRTOS API，而是理解这个项目为什么要把业务拆成任务，以及这些任务如何围绕 `g_systemState` 协作。

原计划里的“FreeRTOS移植和任务框架”与“应用层业务逻辑”已经合并学习。原因是：任务框架就是应用层业务的骨架，应用层业务也是 FreeRTOS 存在的理由。只看 RTOS 会变成背 `xTaskCreate()`；只看业务又会不理解为什么要分任务、为什么要用互斥量和信号量。

> 面试高频考点详见 `rtos项目高频面试点.md`：8.1、8.2、8.4、8.5、8.7、8.15、8.16、8.18、8.24、8.28、8.29。

#### 一句话总览

```text
main() 完成硬件初始化和系统状态初始化
  -> 创建 StartTask
  -> 启动 FreeRTOS 调度器
  -> StartTask 创建所有业务任务和 TIM4 中断源
  -> 各任务围绕 g_systemState 协作
  -> TIM4/DMA 中断通过二值信号量通知任务处理事件
```

#### 为什么要用 FreeRTOS

本项目同时包含按键、电机控制、传感器采集、风速计算、LCD 显示、编码器测速和 IAP 升级。它们的执行周期不同：

| 功能 | 周期 / 触发方式 | 实时性 |
|---|---:|---|
| `KeyScanTask` | 10ms | 按键要灵敏 |
| `MotorControlTask` | 50ms | 电机闭环要稳定 |
| `WindSpeedTask` | 100ms | 风速决策中等实时 |
| `UIDisplayTask` | 200ms | 显示晚一点可以接受 |
| `SensorTask` | 500ms | 传感器采集较慢 |
| `SpeedCalcTask` | TIM4 信号量触发 | 测速周期要稳定 |
| `iap_task` | DMA 信号量触发 | 固件接收完成后处理 |

如果全部塞进裸机 `while(1)`，某个耗时函数会拖慢后面的功能。例如 DHT11 读取慢了，电机控制会晚；LCD 刷新慢了，按键扫描会不灵敏；IAP 写 Flash 时，其他逻辑可能被阻塞。

FreeRTOS 解决的核心痛点：

```text
不同功能周期不同、实时性不同，如果放在一个 while(1) 里排队执行，会互相阻塞。
FreeRTOS 把功能拆成独立任务，再通过优先级、延时阻塞和信号量通知进行调度。
```

#### 心智模型

可以把项目想成一个后厨：

| 项目概念                | 后厨类比   | 项目中的例子                  |
| ------------------- | ------ | ----------------------- |
| FreeRTOS 调度器        | 后厨调度员  | 决定哪个任务获得 CPU            |
| 任务 Task             | 不同岗位厨师 | 按键师傅、电机师傅、传感器师傅         |
| 优先级                 | 事情紧急程度 | 测速和电机控制比 UI 更紧急         |
| `delay_ms()` / 阻塞等待 | 厨师暂时休息 | 周期任务主动让出 CPU            |
| 二值信号量               | 通知铃    | TIM4 通知 `SpeedCalcTask` |
| 互斥量                 | 公共白板钥匙 | `g_dataMutex` 保护共享状态    |
| `g_systemState`     | 公共白板   | 记录模式、温湿度、RPM、PWM 等最新状态  |

易混点：

```text
信号量：通知“有事发生了”，例如 TIM4 到点、DMA 接收完成。
互斥量：保护“共享数据不能同时被多任务读写”。
g_systemState：真正保存系统状态的全局变量。
```

### 文件地图：先知道看哪里

| 文件                                      | 作用            | 本阶段关注点                              |
| --------------------------------------- | ------------- | ----------------------------------- |
| `USER/main.c`                           | 系统入口          | `Hardware_Init()`、`main()` 启动主线     |
| `APP_TASK/app_tasks.h`                  | 任务系统目录        | 模式、状态结构体、任务优先级、栈大小                  |
| `APP_TASK/app_tasks.c`                  | 任务框架和业务核心     | `System_Init()`、`StartTask()`、各业务任务 |
| `FreeRTOS/include/FreeRTOSConfig.h`     | FreeRTOS 裁剪配置 | 系统节拍、堆大小、中断优先级边界                    |
| `USER/stm32f10x_it.c`                   | 中断模板文件        | 注释掉 SVC/PendSV/SysTick              |
| `FreeRTOS/portable/RVDS/ARM_CM3/port.c` | Cortex-M3 移植层 | SVC、SysTick、PendSV 的底层作用            |

如果只抓两个核心文件：

```text
USER/main.c              -> 系统怎么启动
APP_TASK/app_tasks.c     -> 任务怎么协作
```

`APP_TASK/app_tasks.h` 是旁边必须带着看的“任务目录”。

### 启动链路：main 到 StartTask
![[projects/RTOS项目/assets/freertos-startup_animated.svg]]

```c
int main(void)
{
    Hardware_Init();
    System_Init();
    StartTask_Create();
    vTaskStartScheduler();

    while(1)
    {
    }
}
```

逐句理解：

| 调用                      | 作用                                             |
| ----------------------- | ---------------------------------------------- |
| `Hardware_Init()`       | 初始化任务未来要用的硬件资源，如 TIM1、TIM2、按键、MQ2、LCD、UART、DMA |
| `System_Init()`         | 初始化 `g_systemState`，创建互斥量和二值信号量                |
| `StartTask_Create()`    | 先只创建启动任务 `StartTask`                           |
| `vTaskStartScheduler()` | 启动 FreeRTOS 调度器，正常不会返回                         |
| `while(1)`              | 兜底。若执行到这里，通常说明调度器启动失败，如堆内存不足                   |

`Hardware_Init()` 必须放在 `vTaskStartScheduler()` 前面，因为任务一旦运行，就会调用电机、按键、传感器、LCD、DMA 等驱动。如果硬件还没初始化，轻则读不到数据，重则 HardFault 或中断异常。

#### Hardware_Init 中的 FreeRTOS 关键点

```c
NVIC_PriorityGroupConfig(NVIC_PriorityGroup_4);
```

这行和 FreeRTOS 中断优先级最相关。`NVIC_PriorityGroup_4` 表示 4 位抢占优先级、0 位子优先级。凡是在中断里调用 `FromISR` API 的中断，如 TIM4、DMA，都必须满足 `FreeRTOSConfig.h` 中的中断优先级限制。

面试表达：

```text
FreeRTOS 移植时必须正确配置 NVIC 优先级分组，并保证调用 FreeRTOS API 的中断优先级不能高于 configMAX_SYSCALL_INTERRUPT_PRIORITY。
```

### 任务目录：状态、优先级、栈

#### 工作模式

```c
typedef enum {
    MODE_STANDBY = 0,
    MODE_MANUAL,
    MODE_AUTO,
    MODE_ANTI_BACKFLOW
} WorkMode_t;
```

| 模式                   | 含义  | 电机控制主线                      |
| -------------------- | --- | --------------------------- |
| `MODE_STANDBY`       | 待机  | 停机、清计时、复位自动状态机              |
| `MODE_MANUAL`        | 手动  | 档位 -> 目标 RPM -> PID -> PWM  |
| `MODE_AUTO`          | 自动  | 传感器 + cooking event + 三段状态机 |
| `MODE_ANTI_BACKFLOW` | 防回流 | 气体异常保护，激活后 PID 调速           |

#### 系统状态中心

```c
typedef struct {
    WorkMode_t currentMode;
    SpeedLevel_t speedLevel;
    u8 motorRunning;
    u8 temperature;
    u8 humidity;
    float gasConcentration;
    float windSpeedPWM;
    float actualRPM;
    u16 targetRPM;
    u8 cookingEventActive;
    u8 antiBackflowActive;
    float gasThreshold;
    u32 autoModeCounter;
    u32 cookingEventCounter;
} SystemState_t;
```

注意：

```text
SystemState_t 是结构体类型。
g_systemState 才是真正的全局状态变量。
```

`g_systemState` 相当于项目的全局状态中心，保存模式、档位、传感器数据、转速、PWM 等最新状态。多个任务会读写它，所以需要 `g_dataMutex` 互斥保护。

#### 任务优先级和栈

优先级设计原则：

```text
不是“功能看起来重要”就优先级高，而是越需要及时响应、执行越短的任务越适合高优先级。
```

不用背一串 `#define`，复习时记住相对顺序即可：

| 任务                             | 优先级 | 原因             |
| ------------------------------ | --: | -------------- |
| `iap_task`                     |   7 | DMA 收完固件后要及时响应 |
| `SpeedCalcTask`                |   6 | 编码器测速周期要稳定     |
| `MotorControlTask`             |   5 | 电机闭环控制影响稳定性    |
| `KeyScanTask`                  |   4 | 按键需要及时响应       |
| `SensorTask` / `WindSpeedTask` |   3 | 采集和算法中等实时性     |
| `AntiBackflowTask`             |   2 | 保护逻辑周期检测       |
| `UIDisplayTask`                |   1 | 显示晚一点可接受       |

任务栈大小单位是“字”，不是字节。STM32F103 是 32 位，所以：

```text
64 word  = 64 * 4 = 256 字节
256 word = 256 * 4 = 1024 字节
```

> 面试高频考点详见 `rtos项目高频面试点.md`：8.4、8.29。

### 启动任务：System_Init 和 StartTask

#### System_Init：准备公共白板和通知铃

```c
void System_Init(void)
{
    /* 初始化 g_systemState：待机、低档、电机停止、数据清零、阈值NORMAL */

    g_dataMutex = xSemaphoreCreateMutex();
    g_speedCalcSemaphore = xSemaphoreCreateBinary();
    /* IAP 打开时还会创建 g_iapSemaphore */
}
```

核心作用：

```text
1. 把系统默认状态设为：待机、低档、电机停止、数据清零。
2. 创建 g_dataMutex，保护 g_systemState。
3. 创建 g_speedCalcSemaphore，让 TIM4 中断通知 SpeedCalcTask。
4. IAP 打开时还会创建 g_iapSemaphore，让 DMA 中断通知 iap_task。
```

#### StartTask：启动阶段任务

```c
void StartTask(void *pvParameters)
{
    taskENTER_CRITICAL();

    xTaskCreate(KeyScanTask, "KeyScan", TASK_KEY_STK_SIZE, NULL,
                TASK_KEY_PRIORITY, &xKeyScanTaskHandle);  // 保留一个任务创建模板

    /* 其他业务任务同样创建：Sensor / Wind / Motor / UI / AntiBF / SpeedCalc / IAP */

    TIM4_init(5-1, 14400-1);

    taskEXIT_CRITICAL();

    vTaskDelete(xStartTaskHandle);
}
```

关键理解：

```text
StartTask 是启动阶段的总管，不是长期业务任务。
它进入临界区集中创建任务，避免创建到一半被其他任务抢占。
任务和信号量准备好以后，才初始化 TIM4。
创建完成后删除自己，不保留无意义的常驻任务。
```

为什么 `TIM4_init()` 放在 `SpeedCalcTask` 创建之后：

```text
TIM4 中断里会调用 xSemaphoreGiveFromISR(g_speedCalcSemaphore)。
如果 TIM4 在 g_speedCalcSemaphore 或 SpeedCalcTask 创建前就触发，中断可能访问未初始化的信号量句柄，导致异常或 HardFault。
```

### 任务运行模型：周期任务、事件任务、任务职责

#### 周期任务模板

```c
while (1)
{
    /* 做一次业务 */
    delay_ms(period);
}
```

周期任务必须主动延时或阻塞，否则高优先级任务会长期占用 CPU，导致低优先级任务饥饿。

#### 事件触发任务模板

```c
while (1)
{
    xSemaphoreTake(g_xxxSemaphore, portMAX_DELAY);
    /* 被中断通知后执行一次处理 */
}
```

事件触发任务平时阻塞，不占 CPU。中断来了释放信号量，任务被唤醒再处理。

#### 各任务职责

| 任务                 | 周期 / 触发  | 读什么           | 写什么                                                | 作用             |
| ------------------ | -------- | ------------- | -------------------------------------------------- | -------------- |
| `KeyScanTask`      | 10ms     | 按键事件          | `currentMode`、`speedLevel`、`motorRunning`          | 模式切换、档位切换、强制启停 |
| `SensorTask`       | 500ms    | DHT11、MQ2     | `temperature`、`humidity`、`gasConcentration`        | 采集环境数据         |
| `WindSpeedTask`    | 100ms    | 温度、湿度、气体浓度    | `windSpeedPWM`、`cookingEventActive`                | 风速融合和烹饪事件判断    |
| `MotorControlTask` | 50ms     | 模式、档位、转速、事件标志 | `motorRunning`、`targetRPM`、计时器                     | 真正控制电机         |
| `UIDisplayTask`    | 200ms    | 系统状态          | 无控制输出                                              | LCD 显示         |
| `AntiBackflowTask` | 100ms    | 气体浓度、阈值       | `antiBackflowActive`、`gasThreshold`、`motorRunning` | 防回流滞回控制        |
| `SpeedCalcTask`    | TIM4 信号量 | 编码器计数         | 全局 `speed`，间接更新 `actualRPM`                        | 计算实际转速         |
| `iap_task`         | DMA 信号量  | 固件缓冲区         | Flash / 跳转状态                                       | 固件升级           |

#### 各任务核心代码速查

完整代码看 `APP_TASK/app_tasks.c`。下面是核心片段，省略提示音、调试输出和重复判断。复习时只抓四件事：任务周期、读什么、写什么、为什么要 `delay` 或等信号量。

| 任务                 | 周期 / 触发  | 核心作用                             |
| ------------------ | -------- | -------------------------------- |
| `KeyScanTask`      | 10ms     | 按键改变模式、档位、启停                     |
| `SensorTask`       | 500ms    | 采集温湿度和气体浓度，写入系统状态                |
| `WindSpeedTask`    | 100ms    | 计算风速 PWM，判断 `cookingEventActive` |
| `MotorControlTask` | 50ms     | 根据模式控制电机、PID、PWM                 |
| `UIDisplayTask`    | 200ms    | 读取系统状态并刷新 LCD                    |
| `AntiBackflowTask` | 100ms    | 防回流检测，使用高低阈值滞回                   |
| `SpeedCalcTask`    | TIM4 信号量 | 定时读取编码器并计算转速                     |
| `iap_task`         | DMA 信号量  | 校验并写入升级固件                        |

**1. KeyScanTask：按键入口**

```c
while (1)
{
    Key_Scan();                         // 先扫描，更新按键状态

    key1Event = Key1_GetEvent();
    if (key1Event == KEY_EVENT_SHORT_PRESS)
        System_SwitchMode();            // Key1短按：切换工作模式

    key2Event = Key2_GetEvent();
    if (key2Event == KEY_EVENT_SHORT_PRESS)
        System_SwitchSpeedLevel();      // Key2短按：切换风速档位
    else if (key2Event == KEY_EVENT_LONG_PRESS)
        System_ToggleMotor();           // Key2长按：强制启停电机

    delay_ms(10);                       // 主动让出CPU，形成10ms扫描周期
}
```

记忆：`Key1` 切模式，`Key2` 切档位，`Key2` 长按强制启停。

**2. SensorTask：采集任务**

```c
while (1)
{
    ret = DHT_Read_Data(&temp, &humi, GPIOC, GPIO_Pin_14, &dht);
    if (ret == 1 && xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
    {
        g_systemState.temperature = temp;       // 写共享状态，必须在锁内
        g_systemState.humidity = humi;
        xSemaphoreGive(g_dataMutex);            // 写完立即释放，减少占锁时间
    }

    gasValue = MQ2_GetGasConcentration();       // MQ2采集气体浓度
    if (xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
    {
        g_systemState.gasConcentration = gasValue; // 更新公共状态
        xSemaphoreGive(g_dataMutex);
    }

    delay_ms(500);                              // 传感器不需要高频采集
}
```

记忆：传感器任务只负责把 DHT11 / MQ2 的结果写进 `g_systemState`。

**3. WindSpeedTask：风速算法任务**

```c
while (1)
{
    if (xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
    {
        temp = g_systemState.temperature;       // 复制输入快照
        humidity = g_systemState.humidity;
        gas = g_systemState.gasConcentration;
        xSemaphoreGive(g_dataMutex);            // 算法计算前释放锁
    }

    WindSpeed_Update(temp, humidity, gas);       // 锁外计算，避免长期占用互斥量

    if (xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
    {
        g_systemState.windSpeedPWM = WindSpeed_GetPWM();                 // 写回算法输出
        g_systemState.cookingEventActive = WindSpeed_IsCookingEvent();   // 写回烹饪事件
        xSemaphoreGive(g_dataMutex);
    }

    delay_ms(100);                              // 风速算法100ms更新一次
}
```

记忆：先加锁复制输入，锁外计算，再加锁写回结果。

**4. MotorControlTask：电机控制主任务**

```c
while (1)
{
    g_systemState.actualRPM = speed;            // speed由测速任务更新，这里同步到系统状态

    switch (g_systemState.currentMode)          // 电机行为由当前模式决定
    {
        case MODE_STANDBY:
            motor_stop();                       // 待机模式必须停机
            g_systemState.motorRunning = 0;
            g_autoModeState = AUTO_STATE_STARTUP; // 退出自动模式时复位状态机
            break;

        case MODE_MANUAL:
            motor_start();
            g_systemState.targetRPM =
                WindSpeed_GetTargetRPM(g_systemState.speedLevel); // 档位转换为目标转速
            PID_SetTarget(&g_speedPID, g_systemState.targetRPM);   // 设置PID目标值
            pidOutput = PID_Calculate(&g_speedPID, speed);         // 用实际转速做闭环计算
            motor_pwm_set(pidOutput);                              // PID输出最终变成PWM
            break;

        case MODE_AUTO:
            /* STARTUP -> COOKING -> DELAY_OFF */ // 自动模式内部三段状态机
            break;

        case MODE_ANTI_BACKFLOW:
            if (g_systemState.antiBackflowActive) // 防回流任务激活后才调速
            {
                PID_SetTarget(&g_speedPID,
                    WindSpeed_GetTargetRPM(g_systemState.speedLevel));
                motor_pwm_set(PID_Calculate(&g_speedPID, speed));
            }
            break;
    }

    delay_ms(50);                               // 电机控制周期50ms
}
```

记忆：真正碰电机输出的是 `MotorControlTask`，模式决定控制策略。

自动模式单独记三段：

```text
STARTUP   -> 低速启动，等待 cooking event；等不到就回待机
COOKING   -> 有 cooking event，根据风速算法调 PWM
DELAY_OFF -> 事件消失后延时关闭；事件回来就回 COOKING
```

**5. UIDisplayTask：显示任务**

```c
while (1)
{
    sprintf(dispBuf, "Mode:%s", ModeNames[g_systemState.currentMode]); // 显示当前模式
    Show_Str(0, 20, BLUE, WHITE, (u8*)dispBuf, 16, 0);

    sprintf(dispBuf, "Level:%s", SpeedLevelNames[g_systemState.speedLevel]); // 显示档位
    Show_Str(0, 40, BLUE, WHITE, (u8*)dispBuf, 16, 0);

    sprintf(dispBuf, "WIND:%.1f%%", g_systemState.windSpeedPWM); // 显示风速算法输出
    Show_Str(0, 60, BLUE, WHITE, (u8*)dispBuf, 16, 0);

    sprintf(dispBuf, "RPM:%.0f", g_systemState.actualRPM);       // 显示测速结果
    Show_Str(0, 80, BLUE, WHITE, (u8*)dispBuf, 16, 0);

    delay_ms(200);                                               // 显示刷新不需要太快
}
```

记忆：UI 只显示，不参与控制，所以优先级最低。

**6. AntiBackflowTask：防回流任务**

```c
while (1)
{
    if (g_systemState.currentMode == MODE_ANTI_BACKFLOW)
    {
        isDetected =
            g_systemState.gasConcentration >= g_systemState.gasThreshold; // 用当前阈值判断

        if (isDetected)
        {
            g_systemState.antiBackflowActive = 1;
            g_systemState.motorRunning = 1;
            motor_start();
            g_systemState.gasThreshold = GAS_THRESHOLD_HIGH;      // 抬高阈值，防止频繁启停
        }
        else if (g_systemState.gasConcentration < GAS_THRESHOLD_NORMAL)
        {
            g_systemState.antiBackflowActive = 0;
            g_systemState.motorRunning = 0;
            motor_stop();
            g_systemState.gasThreshold = GAS_THRESHOLD_NORMAL;    // 降回普通阈值，等待下次触发
        }
    }

    delay_ms(100);                                               // 防回流100ms检测一次
}
```

记忆：超过阈值启动后，把阈值抬高；低于普通阈值再关闭，避免频繁开关。

**7. SpeedCalcTask + TIM4_IRQHandler：测速通知链**

```c
void TIM4_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE; // 记录是否唤醒了更高优先级任务

    TIM_ClearITPendingBit(TIM4, TIM_IT_Update);    // 先清中断标志
    xSemaphoreGiveFromISR(g_speedCalcSemaphore,
                          &xHigherPriorityTaskWoken); // ISR里用FromISR版本释放信号量
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);      // 必要时退出中断后立刻切换任务
}
```

```c
while (1)
{
    if (xSemaphoreTake(g_speedCalcSemaphore, portMAX_DELAY) == pdTRUE) // 平时阻塞等待TIM4通知
    {
        encoderCount = get_encoder_value();       // 读取编码器计数
        speed = get_speed(encoderCount, 50);      // 按50ms采样周期换算转速
    }
}
```

记忆：TIM4 中断不算速度，只释放信号量；`SpeedCalcTask` 被唤醒后再计算。

**8. iap_task + DMA1_Channel5_IRQHandler：升级通知链**

```c
void DMA1_Channel5_IRQHandler(void)
{
    DMA_ClearITPendingBit(DMA1_IT_TC5);                  // 清DMA传输完成标志
    xSemaphoreGiveFromISR(g_iapSemaphore, &xHigherPriorityTaskWoken); // 通知IAP任务
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);         // 必要时触发任务切换
}
```

```c
while (1)
{
    xSemaphoreTake(g_iapSemaphore, portMAX_DELAY);        // 等DMA接收完成

    receivedLength = GetReceivedDataLength();             // 统计收到的固件长度
    if (CRC32_VerifyFirmware(receive_buff, receivedLength))
    {
        firmwareLen = receivedLength - 4;                 // 去掉末尾4字节CRC
        FLASH_ErasePage(FLASH_APP1_ADDR);                 // 写入前先擦除APP区
        iap_write_appbin(FLASH_APP1_ADDR, receive_buff, firmwareLen); // 写新固件
        iap_load_app(FLASH_APP1_ADDR);                    // 校验写入后跳转APP
    }
}
```

记忆：DMA 只通知接收完成；校验、擦除、写 Flash、跳转都放在 `iap_task`。

> 面试高频考点详见 rtos项目高频面试点.md：8.1、8.2、8.18、8.28、8.29。

### 状态协作：g_systemState 和 g_dataMutex

#### 共享状态的数据流
![[projects/RTOS项目/assets/system-state-data-flow.svg]]
![[projects/RTOS项目/assets/state-sharing_animated.svg]]


核心思想：

```text
任务之间不是乱传一堆参数，而是围绕 g_systemState 共享最新状态。
读写共享状态时用 g_dataMutex 保护。
耗时计算尽量放在锁外，只在读写状态时短时间加锁。
```

#### g_dataMutex：为什么要加锁

典型代码：

```c
if (xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
{
    g_systemState.temperature = temp;
    g_systemState.humidity = humi;
    xSemaphoreGive(g_dataMutex);
}
```

原因：

```text
g_systemState 是多个任务共享的全局状态。
如果 SensorTask 写温湿度时没有互斥量保护，WindSpeedTask 或 UIDisplayTask 可能读到一半新数据、一半旧数据。
这种问题不一定崩溃，而是表现为风速偶尔跳变、显示偶尔异常，很难调试。
```

为什么不用队列传所有状态：

```text
本项目关注的是“最新状态”，不是历史消息。
多个任务需要读写同一个状态结构体。
互斥量 + 全局变量内存开销小，结构也直观。
队列适合传递一条条历史消息，但如果每个字段都建队列，会增加内存和设计复杂度。
```

> 面试高频考点详见 `rtos项目高频面试点.md`：8.1、8.2、8.16。

#### WindSpeedTask 的加锁方式

```c
if (xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
{
    temp = g_systemState.temperature;
    humidity = g_systemState.humidity;
    gas = g_systemState.gasConcentration;
    xSemaphoreGive(g_dataMutex);
}

WindSpeed_Update(temp, humidity, gas);

if (xSemaphoreTake(g_dataMutex, portMAX_DELAY) == pdTRUE)
{
    g_systemState.windSpeedPWM = WindSpeed_GetPWM();
    g_systemState.cookingEventActive = WindSpeed_IsCookingEvent();
    xSemaphoreGive(g_dataMutex);
}
```

关键点：

```text
拿锁时只复制输入或写回结果。
WindSpeed_Update() 这种计算放在锁外。
这样可以缩短互斥量持有时间，减少其他任务等待，也降低优先级反转风险。
```

### 电机控制主线：四种模式怎么动

#### MotorControlTask 模式梳理

`MotorControlTask` 本质只回答一个问题：

```text
当前是什么模式？电机该怎么动？
```

| 模式                   | 目标              | 动作                                           |
| -------------------- | --------------- | -------------------------------------------- |
| `MODE_STANDBY`       | 电机必须停           | `motor_stop()`，`motorRunning=0`，清计时器，自动状态机复位 |
| `MODE_MANUAL`        | 用户按 LOW/HIGH 控速 | 档位 -> 目标 RPM -> PID -> PWM                   |
| `MODE_AUTO`          | 根据环境自动控制        | STARTUP / COOKING / DELAY_OFF 三段状态机          |
| `MODE_ANTI_BACKFLOW` | 气体异常保护          | `AntiBackflowTask` 判断是否激活，激活后电机任务按档位 PID 调速  |

易混点：

```text
待机模式只停机，不判断 cooking event。
自动模式才判断 cookingEventActive。
防回流是否启动主要由 AntiBackflowTask 判断，MotorControlTask 负责激活后的调速执行。
```

#### 手动模式

```c
g_systemState.targetRPM = WindSpeed_GetTargetRPM(g_systemState.speedLevel);
PID_SetTarget(&g_speedPID, (float)g_systemState.targetRPM);
pidOutput = PID_Calculate(&g_speedPID, speed);
motor_pwm_set(pidOutput);
```

一句话：

```text
手动模式 = 用户选 LOW/HIGH 档位 -> 转成目标 RPM -> PID 根据实际 speed 调 PWM。
```

#### 自动模式三段状态机

```text
STARTUP：
低速运行，等待 cooking event。
检测到 cooking event -> 进入 COOKING。
60 秒没检测到 -> 回待机。

COOKING：
根据 WindSpeedTask 输出的 PWM 控制电机。
cooking event 消失 -> 进入 DELAY_OFF。
持续超时 -> 回待机。

DELAY_OFF：
继续运行 10 秒。
期间再次检测到 cooking event -> 回 COOKING。
10 秒结束仍没有 -> 回待机。
```

#### 防回流模式

防回流使用高低阈值形成滞回控制：

```text
浓度超过启动阈值 -> 开风机
浓度低于正常阈值 -> 关风机
浓度在中间区间 -> 保持当前状态
```

如果只用一个固定阈值，气体浓度在阈值附近上下抖动时，风机会反复开关。滞回控制可以避免电机频繁启停。

### 风速计算算法与 Cooking Event

`WindSpeedTask` 不直接控制电机，只给自动模式提供两个结果：

| 输出 | 写到哪里 | 谁使用 |
|---|---|---|
| `windSpeedPWM` | `g_systemState.windSpeedPWM` | `MotorControlTask` 在自动模式下转成 PWM 比较值 |
| `cookingEventActive` | `g_systemState.cookingEventActive` | 自动模式状态机判断是否进入 / 退出 COOKING |

#### 主线

```text
SensorTask 写入温度/湿度/气体浓度
  -> WindSpeedTask 调 WindSpeed_Update()
  -> 得到 windSpeedPWM + cookingEventActive
  -> MotorControlTask 的自动模式使用这两个结果
```

#### 算法一句话

```text
归一化 -> 加权融合 -> 映射成 PWM。
```

```text
f_T = (T - TEMP_BASE) / (TEMP_MAX - TEMP_BASE)
f_H = (H - HUMIDITY_BASE) / (HUMIDITY_MAX - HUMIDITY_BASE)
f_G = (G - GAS_BASE) / (GAS_MAX - GAS_BASE)

F = 0.2*f_T + 0.2*f_H + 0.6*f_G

PWM = PWM_MIN + (PWM_MAX - PWM_MIN) * F
```

关键参数：温度权重 `0.2`，湿度权重 `0.2`，气体浓度权重 `0.6`；PWM 限幅 `20% ~ 100%`。气体浓度权重最高，因为 MQ2 对烟雾和异味最直接。

#### 风速算法核心代码

```c
g_windSpeedData.f_T = Constrain((temp - TEMP_BASE) / (TEMP_MAX - TEMP_BASE), 0.0f, 1.0f);
g_windSpeedData.f_H = Constrain((humidity - HUMIDITY_BASE) / (HUMIDITY_MAX - HUMIDITY_BASE), 0.0f, 1.0f);
g_windSpeedData.f_G = Constrain((gas - GAS_BASE) / (GAS_MAX - GAS_BASE), 0.0f, 1.0f);

g_windSpeedData.fusionValue = WEIGHT_TEMP * g_windSpeedData.f_T +
                              WEIGHT_HUMIDITY * g_windSpeedData.f_H +
                              WEIGHT_GAS * g_windSpeedData.f_G; // 三路传感器融合

g_windSpeedData.pwmValue =
    PWM_MIN + (PWM_MAX - PWM_MIN) * g_windSpeedData.fusionValue; // 融合值映射成PWM百分比
```

#### Cooking Event 判定

```c
if ((temp > COOKING_TEMP_THRESHOLD) &&
    ((humidity > COOKING_HUMIDITY_THRESHOLD) && (gas > COOKING_GAS_THRESHOLD)))
{
    g_windSpeedData.isCookingEvent = 1;
}
else
{
    g_windSpeedData.isCookingEvent = 0;
}
```

```text
温度 > 26 && 湿度 > 50 && 气体浓度 > 100
满足 -> cookingEventActive = 1
否则 -> cookingEventActive = 0
```

Cooking Event 只判断“是否进入/保持烹饪状态”，PWM 大小由融合算法决定。

```c
if (g_systemState.cookingEventActive)
{
    g_autoModeState = AUTO_STATE_COOKING; // STARTUP 阶段检测到烹饪事件
}
```

```c
pwmCompare = WindSpeed_GetPWMCompare(MAXCCR);
motor_pwm_set(pwmCompare);                // COOKING 阶段按风速算法输出控制电机
```

```c
if (!g_systemState.cookingEventActive)
{
    g_autoModeState = AUTO_STATE_DELAY_OFF; // 事件消失后进入延时关闭
}
```

#### 记忆重点

```text
有 cooking event -> 自动模式进入 COOKING
COOKING 阶段 -> WindSpeed_GetPWMCompare(MAXCCR) -> motor_pwm_set()
cooking event 消失 -> 进入 DELAY_OFF
```

代码注意点：

```text
temp 和 humidity 是整数，当前归一化表达式有整数除法风险。
后续优化可改成 (float)(temp - TEMP_BASE) / (TEMP_MAX - TEMP_BASE)。
```

| 易混点                      | 正确理解                                               |
| ------------------------ | -------------------------------------------------- |
| `WindSpeedTask` 直接控制电机   | 不直接控制，只写 `windSpeedPWM` 和 `cookingEventActive`     |
| `windSpeedPWM` 就是定时器 CCR | 不是，它是百分比；`WindSpeed_GetPWMCompare(MAXCCR)` 才转成 CCR |
| Cooking Event 决定 PWM 大小  | 不决定 PWM 大小，只决定是否进入 / 保持自动烹饪状态                      |
| 手动模式也用风速融合 PWM           | 手动模式主要用档位目标 RPM + PID；自动模式才用融合 PWM                 |

### 中断通知链路：TIM4/DMA 到任务
![[projects/RTOS项目/assets/isr-task-handoff_animated.svg]]

#### SpeedCalcTask 与 TIM4 中断

```c
void SpeedCalcTask(void *pvParameters)
{
    int encoderCount;

    while (1)
    {
        if (xSemaphoreTake(g_speedCalcSemaphore, portMAX_DELAY) == pdTRUE)
        {
            encoderCount = get_encoder_value();
            speed = get_speed(encoderCount, 50);
        }
    }
}
```

`SpeedCalcTask` 不自己 `delay_ms(50)`，而是等待 TIM4 信号量。原因是测速依赖固定采样周期，用 TIM4 硬件定时器触发比普通任务延时更稳定。

```c
void TIM4_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    if (TIM_GetITStatus(TIM4, TIM_IT_Update) != RESET)
    {
        TIM_ClearITPendingBit(TIM4, TIM_IT_Update);
        xSemaphoreGiveFromISR(g_speedCalcSemaphore, &xHigherPriorityTaskWoken);
        portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
    }
}
```

中断里只做：

```text
1. 判断中断标志
2. 清除中断标志
3. 用 xSemaphoreGiveFromISR() 释放信号量
4. 必要时 portYIELD_FROM_ISR() 请求任务切换
```

核心原则：

```text
ISR 负责通知，任务负责处理。
```

DMA/IAP 也是同样模式：

```text
DMA1_Channel5_IRQHandler
  -> 清 DMA 中断标志
  -> xSemaphoreGiveFromISR(g_iapSemaphore)
  -> iap_task 被唤醒
  -> 在任务上下文里做 CRC32、Flash 擦写、APP 跳转
```

> 面试高频考点详见 `rtos项目高频面试点.md`：8.18、8.28。

### 移植底层：FreeRTOSConfig、SVC、SysTick、PendSV
![[projects/RTOS项目/assets/freertos-porting-steps.svg]]

#### FreeRTOSConfig.h 关键配置

```c
#define configUSE_PREEMPTION                  1
#define configTICK_RATE_HZ                    (1000)
#define configMAX_PRIORITIES                  (32)
#define configTOTAL_HEAP_SIZE                 ((size_t)(10*1024))
#define configUSE_MUTEXES                     1
#define configUSE_COUNTING_SEMAPHORES         1
```

| 配置 | 含义 |
|---|---|
| `configUSE_PREEMPTION=1` | 使用抢占式调度 |
| `configTICK_RATE_HZ=1000` | 1ms 一个系统节拍 |
| `configMAX_PRIORITIES=32` | 最大 32 个优先级 |
| `configTOTAL_HEAP_SIZE=10*1024` | FreeRTOS 堆大小 10KB |
| `configUSE_MUTEXES=1` | 启用互斥量 |
| `configUSE_COUNTING_SEMAPHORES=1` | 启用计数信号量 |

中断优先级边界：

```c
#define configLIBRARY_LOWEST_INTERRUPT_PRIORITY        15
#define configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY   3
```

凡是在 ISR 里调用 FreeRTOS `FromISR` API 的中断，优先级必须在 FreeRTOS 允许范围内。优先级数字越小，逻辑优先级越高；不能让调用 FreeRTOS API 的中断高过 `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY` 的边界。

#### SVC / SysTick / PendSV
![[projects/RTOS项目/assets/context-switch_animated.svg]]

最简记忆：

```text
SVC：启动第一个任务。
SysTick：提供 1ms 系统节拍。
PendSV：负责任务切换。
```

稍微展开：

| 异常 | 作用 | 项目理解 |
|---|---|---|
| `SVC` | 启动第一个任务 | `vTaskStartScheduler()` 后让 CPU 进入任务上下文 |
| `SysTick` | 提供系统节拍 | 让 `delay_ms()` / `vTaskDelay()` 的时间往前走，到期任务重新就绪 |
| `PendSV` | 上下文切换 | 保存当前任务现场，选择下一个任务，恢复新任务现场 |

`USER/stm32f10x_it.c` 中要注释掉同名函数：

```c
//void SVC_Handler(void)
//{
//}

//void PendSV_Handler(void)
//{
//}

//void SysTick_Handler(void)
//{
//}
```

原因：

```text
FreeRTOS 移植层已经接管 SVC、PendSV、SysTick。
如果用户文件里也定义同名函数，会重复定义或抢走 FreeRTOS 的异常入口。
```

`port.c` 中的职责：

```text
vPortSVCHandler()       -> 恢复第一个任务上下文
xPortSysTickHandler()   -> 增加 tick，必要时触发 PendSV
xPortPendSVHandler()    -> 保存旧任务现场，切换 TCB，恢复新任务现场
```

> 面试高频考点详见 `rtos项目高频面试点.md`：8.5、8.7、8.15。

---

## Bootloader/IAP固件升级

### 核心概念
![[projects/RTOS项目/assets/iap-power-recovery_animated.svg]]
- **Bootloader**：上电后先运行的引导程序，负责接收新固件、校验完整性、写入 APP 区，并跳转到 APP。
- **APP**：真正的业务程序，负责油烟机的电机控制、传感器采集、LCD 显示、PID 调速等功能。
- **IAP**：In Application Programming，在应用编程。项目中体现为通过 USART + DMA 接收 `APP_crc.bin`，校验通过后更新 Flash 中的 APP。

> 面试高频考点详见 `rtos项目高频面试点.md`：8.6 Bootloader 与 STM32 上电启动流程、8.30 升级断电恢复。

### 总体流程图
![[projects/RTOS项目/assets/iap-upgrade-flow.svg]]

一句话主线：
```text
先接收完整固件到 RAM，再做 CRC32 校验；校验成功才擦写 APP 区，最后设置 MSP 并跳转 APP。
```

### Flash分区
![[projects/RTOS项目/assets/flash-ram-layout.svg]]
```text
Flash:
0x08000000  Bootloader 区
            负责升级流程、CRC 校验、写 Flash、跳转 APP

0x0800F000  FLASH_APP1_ADDR
            APP 区，存放真正的业务程序

RAM:
0x20004000  receive_buff
            串口 + DMA 接收固件的临时缓冲区
```


复习重点：
- `receive_buff` 是 RAM 中的临时接收区，不是最终运行区。
- `FLASH_APP1_ADDR` 是 Flash 中 APP 的起始地址。
- Bootloader、APP、接收缓冲区不能互相覆盖。

### 固件升级流程
```text
PC端:
APP.bin
  -> add_crc32.py 计算 CRC32
  -> 生成 [APP正文][4字节CRC32] 的 APP_crc.bin

STM32端:
串口 USART1 接收固件
  -> DMA1_Channel5 自动搬到 receive_buff
  -> DMA完成中断释放 g_iapSemaphore
  -> iap_task 被唤醒
  -> CRC32_VerifyFirmware(receive_buff, receivedLength)
  -> 校验成功后 firmwareLen = receivedLength - 4
  -> iap_write_appbin(FLASH_APP1_ADDR, receive_buff, firmwareLen)
  -> iap_load_app(FLASH_APP1_ADDR)
```

### 关键代码：按学习顺序复习

#### PC端追加CRC32
文件：`tools/add_crc32.py`

```python
def calculate_crc32(data):
    # 与 STM32 端 CRC32_Calculate() 保持一致，得到 32 位无符号 CRC。
    return zlib.crc32(data) & 0xFFFFFFFF

# 读取原始 APP.bin。
with open(input_file, 'rb') as f:
    firmware_data = f.read()

# 对 APP 正文计算 CRC32。
crc_value = calculate_crc32(firmware_data)

# '<I' 表示小端序 32 位无符号整数，必须和 STM32 端解析方式一致。
crc_bytes = struct.pack('<I', crc_value)

# 最终发送给 STM32 的格式：[APP正文][4字节CRC32]。
output_data = firmware_data + crc_bytes
```

#### RAM中固定接收缓冲区
文件：`APP_TASK/app_tasks.c:75`，`SYSTEM/sys/sys.h:31-32`

```c
/* 固件接收缓冲区固定到 0x20004000，避免和 Bootloader 自己的 RAM 区重叠。 */
u8 receive_buff[buff_size] __attribute__ ((at(0X20004000)));

/* buff_size 要能容纳 APP 正文 + 末尾 4 字节 CRC32。 */
#define buff_size 3692
```

#### USART + DMA接收固件
文件：`USER/main.c:80`，`BSP/DMA/dma.c:28-33`

```c
/* 从 USART1->DR 固定读取数据，依次写入 receive_buff。 */
MYDMA_Config(DMA1_Channel5, (u32)&USART1->DR, (u32)receive_buff, buff_size);

/* 外设地址：USART1->DR，每个新字节都从同一个寄存器读。 */
DMA_InitStructure.DMA_PeripheralBaseAddr = cpar;

/* 内存地址：receive_buff，固件字节要依次放进数组。 */
DMA_InitStructure.DMA_MemoryBaseAddr = cmar;

/* 方向是外设到内存，也就是 USART1->DR -> receive_buff。 */
DMA_InitStructure.DMA_DIR = DMA_DIR_PeripheralSRC;

/* 最多接收 buff_size 字节。 */
DMA_InitStructure.DMA_BufferSize = cndtr;

/* 串口数据寄存器地址不变。 */
DMA_InitStructure.DMA_PeripheralInc = DMA_PeripheralInc_Disable;

/* RAM 数组地址递增：receive_buff[0]、[1]、[2]... */
DMA_InitStructure.DMA_MemoryInc = DMA_MemoryInc_Enable;
```

图示记忆：
```text
USART1->DR 固定入口
    |
    | DMA每次从同一个外设地址取1字节
    v
receive_buff[0] -> receive_buff[1] -> receive_buff[2] -> ...
```

#### DMA中断只通知IAP任务
文件：`APP_TASK/app_tasks.c:127-129`，`APP_TASK/app_tasks.c:667-682`

```c
/* 创建 IAP 二值信号量。 */
g_iapSemaphore = xSemaphoreCreateBinary();

void DMA1_Channel5_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    /* 判断 DMA1 Channel5 是否传输完成。 */
    if (DMA_GetITStatus(DMA1_IT_TC5))
    {
        /* 清除 DMA 中断标志，避免重复进中断。 */
        DMA_ClearITPendingBit(DMA1_IT_TC5);

        /* 中断里必须用 FromISR 版本 API，只通知 iap_task。 */
        xSemaphoreGiveFromISR(g_iapSemaphore, &xHigherPriorityTaskWoken);
    }

    /* 如果被唤醒任务优先级更高，请求一次上下文切换。 */
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
```

#### iap_task等待通知并开始处理
文件：`APP_TASK/app_tasks.c:577-595`

```c
void iap_task(void *pvParameters)
{
    uint16_t receivedLength;
    u32 firmwareLen;

    while (1)
    {
        /* 平时阻塞等待，不轮询 receive_buff，不浪费 CPU。 */
        xSemaphoreTake(g_iapSemaphore, portMAX_DELAY);

        /* DMA 完成后，计算本次实际接收到多少字节。 */
        receivedLength = GetReceivedDataLength();

        /* 简单判断缓冲区是否有固件数据。 */
        if (receive_buff[0])
        {
            /* 固件格式：[APP正文][4字节CRC32]，先校验再写 Flash。 */
            if (CRC32_VerifyFirmware(receive_buff, receivedLength) == 0)
            {
                /* CRC 失败：清 RAM，重开 DMA，等待重传。安全原则：不擦 APP 区。 */
            }
            else
            {
                /* CRC 成功后才进入擦写 APP 区流程。 */
            }
        }
    }
}
```

#### 计算DMA已接收长度
文件：`BSP/DMA/dma.c:64-67`

```c
uint16_t GetReceivedDataLength(void)
{
    /* 已接收长度 = 总长度 - DMA 当前剩余未接收长度。 */
    return buff_size - DMA_GetCurrDataCounter(DMA1_Channel5);
}
```

#### CRC32校验：前面正文重新算，末尾4字节拿来比
文件：`BSP/CRC32/crc32.c:63-81`，`BSP/CRC32/crc32.c:91-125`

```c
u32 CRC32_Calculate(u8 *data, u32 length)
{
    u32 crc = 0xFFFFFFFF;  /* 标准 CRC32 初始值。 */
    u32 i;

    for (i = 0; i < length; i++)
    {
        /* 每个 APP 正文字节都要参与计算，得到整段固件的“指纹”。 */
        crc = crc32_table[(crc ^ data[i]) & 0xFF] ^ (crc >> 8);
    }

    return crc ^ 0xFFFFFFFF;  /* 标准 CRC32 最终异或。 */
}

u8 CRC32_VerifyFirmware(u8 *data, u32 totalLength)
{
    u32 firmwareLen;
    u32 calculatedCRC;
    u32 receivedCRC;

    /* 至少要有 4 字节 CRC，否则不是合法固件包。 */
    if (totalLength <= 4)
    {
        return 0;
    }

    /* APP 正文长度 = 总长度 - 末尾 4 字节 CRC。 */
    firmwareLen = totalLength - 4;

    /* calculatedCRC：STM32 对 APP 正文重新计算出来的 CRC。 */
    calculatedCRC = CRC32_Calculate(data, firmwareLen);

    /* receivedCRC：PC 端追加在末尾的 CRC，按小端序拼回 32 位数。 */
    receivedCRC = (u32)data[firmwareLen] |
                  ((u32)data[firmwareLen + 1] << 8) |
                  ((u32)data[firmwareLen + 2] << 16) |
                  ((u32)data[firmwareLen + 3] << 24);

    /* 两个 CRC 相等，说明固件完整性校验通过。 */
    return (calculatedCRC == receivedCRC) ? 1 : 0;
}
```

CRC数据格式：
```text
receive_buff:
+---------------------------+------------------+
| APP 正文 firmwareLen 字节     |     CRC32 4 字节     |
+---------------------------+------------------+
0                           firmwareLen        totalLength
```

#### CRC成功后写入Flash APP区
文件：`APP_TASK/app_tasks.c:612-622`，`BSP/IAP/iap.c:19-39`

```c
/* 末尾 4 字节 CRC 不属于 APP 正文，不能写进 APP 区。 */
firmwareLen = receivedLength - 4;

/* receive_buff + 4 存的是待升级 APP 的 Reset_Handler 地址。
 * 正常 Flash 程序入口应该形如 0x080xxxxx。
 */
if (((*(vu32 *)(0X20004000 + 4)) & 0xFF000000) == 0x08000000)
{
    /* 校验成功且入口看起来合法后，才擦写 APP 区。 */
    FLASH_ErasePage(FLASH_APP1_ADDR);

    /* 从 RAM 的 receive_buff 写入 Flash APP 区，只写 APP 正文。 */
    iap_write_appbin(FLASH_APP1_ADDR, receive_buff, firmwareLen);
}
```

```c
void iap_write_appbin(u32 appxaddr, u8 *appbuf, u32 appsize)
{
    u16 t;
    u16 i = 0;
    u16 temp;
    u32 fwaddr = appxaddr;  /* 当前要写入的 Flash 地址。 */
    u8 *dfu = appbuf;       /* 当前要读取的 RAM 固件地址。 */

    for (t = 0; t < appsize; t += 2)
    {
        /* STM32F1 Flash 按半字写入：2字节 -> 1个 u16。 */
        temp = (u16)dfu[1] << 8;
        temp += (u16)dfu[0];
        dfu += 2;

        /* 先放进半字缓冲区。 */
        iapbuf[i++] = temp;

        if (i == 512)
        {
            i = 0;

            /* 512个半字 = 1024字节 = C8T6 一个 Flash 页。 */
            STMFLASH_Write(fwaddr, iapbuf, 512);
            fwaddr += 1024;
        }
    }

    /* 最后一段不足 1 页，也要写进去。 */
    if (i)
    {
        STMFLASH_Write(fwaddr, iapbuf, i);
    }
}
```

#### 写完后设置MSP并跳转APP
文件：`APP_TASK/app_tasks.c:630-636`，`BSP/IAP/iap.c:44-60`

```c
/* 写入 Flash 后，再检查 APP 区的 Reset_Handler 是否像 Flash 入口。 */
if (((*(vu32 *)(FLASH_APP1_ADDR + 4)) & 0xFF000000) == 0x08000000)
{
    iap_load_app(FLASH_APP1_ADDR);
}
```

```c
void iap_load_app(u32 appxaddr)
{
    /* 跳转前关闭中断和升级相关外设，避免 Bootloader 状态影响 APP。 */
    __disable_irq();
    DMA_Cmd(DMA1_Channel5, DISABLE);
    USART_Cmd(USART1, DISABLE);
    DMA_ClearITPendingBit(DMA1_IT_TC5);
    USART_ClearITPendingBit(USART1, USART_IT_RXNE);

    /* APP 起始地址 + 0 存的是初始 MSP，应该是 SRAM 地址 0x200xxxxx。 */
    if (((*(vu32 *)appxaddr) & 0x2FFE0000) == 0x20000000)
    {
        /* APP 起始地址 + 4 存的是 Reset_Handler。 */
        jump2app = (iapfun)*(vu32 *)(appxaddr + 4);

        /* 先切换到 APP 自己的栈，再跳转 APP。 */
        MSR_MSP(*(vu32 *)appxaddr);
        jump2app();
    }
}
```

APP向量表记忆：
```text
FLASH_APP1_ADDR + 0  -> APP 初始 MSP 栈顶
FLASH_APP1_ADDR + 4  -> APP Reset_Handler
FLASH_APP1_ADDR + 8  -> 其他中断向量
```

### CRC32校验原理
- PC 端 `tools/add_crc32.py` 对原始 `APP.bin` 计算 CRC32，并以小端序追加到文件末尾。
- STM32 端收到的数据格式是 `[APP正文][4字节CRC32]`。
- `calculatedCRC`：STM32 对 APP 正文重新计算出的 CRC。
- `receivedCRC`：从固件末尾 4 字节拆出来的、PC 端提前算好的 CRC。
- 两者相等，说明固件大概率没有丢字节、错字节或长度截断。
- PC 端和 STM32 端必须保持 CRC 计算规则、字节序、参与计算的数据范围一致。

> 面试高频考点详见 `rtos项目高频面试点.md`。CRC32 是完整性校验，不是加密；它能发现传输错误，但不能防止恶意篡改。

### 面试问答索引
本阶段常见问题已经同步到 `rtos项目高频面试点.md`，标题带【已更新】：

```text
8.6   Bootloader 与 STM32 上电启动流程
8.6.1 本项目 IAP 固件升级完整流程
8.6.2 为什么固件先放 RAM 而不是直接写 Flash
8.6.3 为什么 DMA 外设地址不递增、内存地址递增
8.6.4 为什么 DMA 中断只通知 iap_task
8.6.5 calculatedCRC 和 receivedCRC 分别来自哪里
8.6.6 为什么 CRC 失败不能擦 APP 区
8.6.7 为什么 iap_write_appbin() 传 firmwareLen
8.6.8 为什么跳转 APP 前必须设置 MSP
8.6.9 为什么检查 APP 入口地址是否合法
8.6.10 PC端和STM32端 CRC 协议必须保持哪些一致
8.30  固件升级断电恢复
```

### 知识链
```text
Bootloader/IAP
  -> STM32 启动流程与向量表
  -> USART + DMA 接收
  -> CRC32 完整性校验
  -> Flash 擦写机制
  -> APP 跳转 MSP / Reset_Handler
  -> A/B 分区、升级标志、断电回滚
```

---

## 调试能力专项训练

### 外设不工作排查清单
> TODO：待补充外设不工作时的系统化排查清单。

### HardFault排查方法
> TODO：待补充 HardFault 定位流程、堆栈回溯和常见触发原因。

### RTOS调试技巧
> TODO：待补充任务状态、栈余量、优先级和阻塞点排查方法。

### 波形调试要点
> TODO：待补充 PWM、编码器、DHT11 单总线、USART/DMA 等波形观察重点。

---

## 综合复现

### 重写顺序
> TODO：待补充从裸机驱动到 FreeRTOS 任务框架的重写路线。

### 最终掌握的技能清单
> TODO：待补充最终能力清单，用于复盘是否能独立复现项目。

---

## 附录A：项目高频面试点

### 项目架构与任务通信

#### 为什么在RTOS的多任务间通信中，使用互斥量加全局变量的形式？

答：因为如果不使用互斥量的话，会导致结构体成员可能在写入一半时被其他任务抢占，导致读取到不一致的数据。因此，使用互斥量是为了保护共享数据，防止多个任务同时读写造成数据混乱。

#### 那请你说一下为什么不采用队列的方式来进行任务间通信呢？

答：因为本项目中的数据模型需要共享最新状态，而不是历史数据；需要多读多写，关注的是最新值，用互斥量最为合适。且用互斥量加全局变量内存开销比较小，仅需一个结构体；而使用队列内存开销大，需要定义多个队列缓冲区。

#### 请你说一下移植RTOS内核时需要对哪些文件进行修改？

答：移植RTOS时需要对以下文件进行修改：内核裁剪文件 FreeRTOSConfig.h（主要修改中断配置、主频配置以及内存分配等）、port.c文件（主要修改延时函数为RTOS的延时函数及 配置SysTick 定时器）、stm32f10x_it.c 文件（因为移植进来的RTOS文件已经实 现了PendSV异常函数、SVC异常函数及SysTick异常函数，因此需要将该文件 的这些函数注释掉，防止引起重复定义的报错）。

#### 裸机系统与RTOS系统的核心差异是什么？

答：裸机系统通常采用前后台架构，主程序在一个无限循环中顺序执行任务（后 台），而外部事件通过中断服务函数（前台）响应。这种模式下，所有任务共享 同一个CPU时间，任务的实时性依赖于主循环的周期和中断的优先级，难以处 理复杂的多任务并发，且随着功能增加，主循环的响应延迟可能变得不可控，代 码的模块化和维护性也较差。  RTOS 则引入了内核调度器，支持多任务并发执行，每个任务拥有独立的栈 空间和优先级，由内核根据调度算法（如抢占式或时间片轮转）动态分配CPU使 用权。这使得开发者可以将复杂系统拆分为多个独立任务，并通过信号量、消息 队列等机制实现任务间同步和通信。RTOS的核心优势在于处理多事件、多任务 的复杂嵌入式应用时，提升了系统的实时响应能力、资源利用率和代码可维护性。

#### RTOS 中消息队列的发送与接收过程，如何处理队列满/空的异常情况？

答：在RTOS中，消息队列通常作为环形缓冲区结合任务等待列表实现。发送消 息时，任务会调用队列发送API，若队列未满，系统将消息复制到队列中并检查 是否有任务在等待接收该队列的消息，若有则唤醒优先级最高的等待任务；若队 列已满，发送任务的行为取决于其指定的等待超时时间：如果超时时间不为 0， 任务将被挂起到该队列的等待发送列表中，让出CPU直到队列有空位或超时时 间到达，若超时时间到仍无空位则返回超时错误，若在此期间队列空出则被唤醒 并完成发送。接收消息的过程与之对称，当队列为空时，接收任务同样可以选择 阻塞等待或有数据到达时被唤醒，或者在超时后返回错误。这种机制使得任务间 能够高效同步，同时避免了轮询造成的CPU资源浪费。

### 外设驱动与控制算法

#### 请你说一下直流有刷电机的驱动原理？

答：直流有刷电机的驱动硬件核心是H桥电路，而从嵌入式软件的角度来看，我们通过控制H桥上四个开关管的导通状态来实现方向与速度的精确管理。方向控制由软件直接操作两个GPIO完成：通过切换两组对角开关管的导通组合，改变流过电机的电流方向，从而控制电机正转或反转；同时，软件必须通过逻辑互锁或配置定时器的死区时间，确保同一桥臂的上下管不会同时导通，防止短路。
速度调节则采用单极性PWM调制。以正转为例，软件将一个开关管（如高端）设为常开，另一个对角管由定时器输出的PWM波驱动。通过动态更新定时器的比较寄存器来改变PWM占空比，即可调节电机两端的平均电压，实现线性调速。当PWM管关断时，电机电感产生的反电动势通过常开管和另一侧桥臂的续流二极管形成回路，确保电流连续。在FreeRTOS任务中，软件根据控制指令实时计算并更新PWM参数，并可能结合电流采样实现闭环稳速，从而完成精准、安全的电机驱动。

#### 请你说一下编码器测速的原理？

答：编码器测速的核心原理是将电机的旋转位移转换为脉冲信号，通过测量脉冲的频率或周期来计算出转速。主要利用MCU的定时器资源进行脉冲采集与解算。在实际应用中，最常见的做法是使用霍尔传感器，它输出两路相位相差90度的正交脉冲信号（通常称为A相和B相）。我们将这两路信号接入MCU的定时器输入引脚，并配置定时器为编码器接口模式。在此模式下，硬件会自动根据两路脉冲的相位关系判断旋转方向，并在每个边沿（上升沿和下降沿）进行计数，从而实现4倍频，提高测量精度。
软件层面通过在固定时间窗口内捕获定时器的脉冲计数值来计算转速；并结合定时器的输入捕获和溢出中断来协同工作。在FreeRTOS任务中，我们定期读取定时器的计数值并进行清零或差分运算，经过滤波和单位换算后，即可得到实时的电机转速，用于后续的闭环PID控制。

#### 请你说一下什么是PID算法，各个参数分别解决什么问题？

答：PID算法即比例-积分-微分控制，是一种基于反馈的闭环控制算法。它通过计算目标值（期望转速）与实际值（编码器测得的当前转速）之间的误差，并将误差的比例、积分和微分项进行线性组合，生成控制量（如PWM占空比）来驱动执行器，从而使系统快速、准确、稳定地达到目标值。
比例（P）参数直接放大当前误差，其作用是迅速响应偏差，让系统向目标靠拢。P越大响应越快，但过大会导致超调和震荡，且单独使用无法消除静差。积分（I）参数对历史误差进行累积，主要解决稳态误差问题，确保系统最终能精确到达目标值；但积分过强会引起积分饱和和超调，需要配合限幅或抗积分饱和机制。微分（D）参数根据误差变化率提前施加修正，起到预测和阻尼作用，能有效抑制超调、提高系统稳定性。

#### 请你说一下DHT11单总线协议

答：DHT11单总线协议采用一根数据线与MCU连接，总线空闲时由上拉电阻保持高电平。通信由主机发起，整个过程需严格遵循时序：主机首先拉低总线至少18ms（通常18-30ms）以启动传输，然后释放总线并延时20-40us，随后检测从机响应。从机接收到起始信号后，拉低总线约80us作为应答，再拉高80us准备输出数据。
数据传输时，每一位都以50us低电平开始，随后高电平的持续时间决定了该位的值：若高电平持续26-28us，表示“0”；若持续70us左右，则表示“1”。所有数据共40位，依次输出湿度整数部分（8位）、湿度小数部分（8位）、温度整数部分（8位）、温度小数部分（8位）和校验和（8位），校验和为前四个字节之和的低8位。接收完成后，主机需再次拉低总线并释放，以备下次通信。

#### 请说一下SPI的通信原理以及工作模式

答：SPI是串行外围设备接口，是一种高速的同步、全双工通信 总线，仅支持一主多从；一般使用四根线进行通信：SCLK、MOSI、MISO及片 选线CS。
其通信原理是：主机和从机都有一个串行移位寄存器，主机通过向它的SPI 串行寄存器写入一个字节来发起一次传输。寄存器通过MOSI信号线将字节传送 给从机，从机也将自己的移位寄存器中的内容通过MISO信号线返回给主机。这 样，两个移位寄存器中的内容就被交换。
工作模式：其工作模式有四种，通过CPHA（时钟相位）、CPOL（时钟极性） 来决定。如果CPOL=0，串行同步时钟的空闲状态为低电平；如果CPOL=1，串 行同步时钟的空闲状态为高电平。时钟相位（CPHA）能够配置用于选择两种不 同的传输协议之一进行数据传输。如果CPHA=0，在串行同步时钟的第一个跳变 沿（上升或下降）数据被采样；如果CPHA=1，在串行同步时钟的第二个跳变沿 （上升或下降）数据被采样。SPI主模块和与之通信的外设备时钟相位和极性应 该一致。

#### 说一下编写PWM驱动的步骤

答：PWM是脉冲宽度调制，就是能控制脉冲的宽度。占空比是 高电平的持续时间占整个周期的比例。PWM的驱动代码如下：首先应该看手册 确定想用哪个定时器通道输出PWM波，因为定时器有四个通道可输出PWM波。 确定GPIO口以后，打开定时器和GPIO口的时钟，然后配置IO口的输出为推 挽输出，以及配置IO口速度，初始化IO口；接下来，配置定时器的重装值和预 分频值、计数模式、时钟分割及初始化定时器；接下来，开始设置PWM模式（有 边沿对齐和中心对齐两种模式），以及使能比较输出、设置输出极性来确定谁是 有效电平；接下来初始化定时器的PWM输出通道，如T3C3；最后，使能定时器。

#### GPIO 配置为输入模式时，上/下拉电阻的作用是什么？

答：在STM32 中，当GPIO配置为输入模式（上拉输入或下拉输入）时，上拉 和下拉电阻的核心作用是给引脚一个确定的电平状态，防止引脚悬空（即没有外 部信号驱动时）因外界电磁干扰导致电平不确定，从而引发逻辑误判。比如在使 用外部中断的时候，如果没有一个确定的初始电平状态，那中断自己由于外界的 电磁波干扰从而自行触发。此外，上/下拉电阻还用于匹配外部器件的电平需求， 如IIC总线的上拉或某些开漏输出器件的电平钳位，确保信号在空闲状态时处于 已知的逻辑电平。

### FreeRTOS 内核机制

#### 栈大小的单位是字还是字节，栈溢出会造成什么风险？

答：单位是字，因为栈大小定义的类型是32位的，32位是4个字节，1个字为4个字节；如果栈溢出会造成HardFault异常。

#### 请你说一下FreeRTOS的启动流程？

答：当上电复位后，内核从0x08000000处取出堆栈指针（根据启动方式不同，地址不同，一般在Flash启动），完成堆栈初始化；接下来在0X08000004 处取出复位中断的入口地址加载进PC寄存器，此时跳转到复位中断函数执行，在该函数里先进行系统时钟的初始化，然后调用__main函数将Flash里边存储的data数据拷贝到SRAM上，将BSS段变量进行清零。最后，调用main函数执行。在main函数中先完成必要的硬件初始化，然后创建开始任务完成RTOS的初始化，这包括：创建开始任务、TCB的初始化及任务堆栈初始化，将任务加入就绪表等操作。

最后一步就是开启多任务调度，该函数会创建内核必需的空闲任务，若启用软件定时器则同时创建定时器服务任务。随后调度器被使能，并调用硬件移植层接口xPortStartScheduler，该接口配置PendSV和SysTick异常的优先级，启动系统滴答定时器，并通过触发SVC异常来激活首个任务。

在SVC异常服务程序中，系统从第一个任务的任务控制块中恢复其上下文，包括堆栈指针和程序状态字。当异常返回时，CPU跳转到任务入口函数，至此系统正式进入多任务调度环境。后续所有任务由内核基于优先级和事件进行抢占式调度，而vTaskStartScheduler函数将永不返回。

#### 说一下FreeRTOS的任务切换原理

答：RTOS任务切换实际上就是堆栈指针SP的切换。当需要发 生任务切换时，首先先保存当前任务的上下文，此时为入栈操作，将CPU的PC、 XPSR、LR 及通用寄存器保存在栈中，并且将CPU的堆栈指针保存在当前任务的TCB里边；接下来寻找最高优先级的任务，找到以后从最高优先级任务的TCB 里取出堆栈指针SP赋给CPU，由于此时SP指向内核，因此新任务的堆栈数据 就会恢复到CPU的各寄存器上，当CPU完成寄存器恢复并执行最后的返回指令 后，CPU就跳转到新任务上次被切换出去时指令的下一条地址继续执行，从而完 成了从一个任务到另一个任务的切换。

#### 什么是优先级反转？如何解决？

答：优先级反转发生在实时系统中，当一个低优先级任务持有了 某个共享资源（如互斥锁），而一个高优先级任务需要访问该资源时被迫等待。 此时，如果一个中优先级任务（其优先级高于持有资源的低优先级任务，但低于 等待资源的高优先级任务）开始运行（因为它不需要该资源且就绪），它将抢占持有资源的低优先级任务。这导致持有资源的低优先级任务无法执行，也就无法 及时释放资源，结果就是本该最高优先级运行的任务（等待资源者）被一个中优 先级任务间接地、长时间地阻塞，严重破坏了系统的实时性和优先级调度原则。

解决方法：采用优先级继承。当高优先级任务等着低优先级任务释放资源时， 此时将低优先级任务的优先级临时提到最高，当资源释放后，就能让高优先级任 务及时访问；此时低优先级任务的优先级恢复原样。

#### RTOS中的延时函数源码看过吗？如何实现调度的？

答：延时函数的底层原理是根据需要延时的时间，换算成时钟节 拍数；在延时的这段时钟节拍数里，将当前任务变成阻塞态，从而不参与任务调 度。然后去任务就绪表里寻找其他高优先级任务执行，当延时的时间到达以后， 再将该任务从阻塞态变成就绪态中，即加入任务就绪表中参与任务调度，当该任 务优先级最高时，延时时间到达后会立即切换回该任务执行。

#### RTOS中二值信号量与计数信号量的区别

答：FreeRTOS 中计数信号量与二值信号量的核心区别在于可用的信号数量上限及其适用场景：二值信号量本质上是一个开关，其计数值只能为 0 或1，主要用于表示单一资源（如一个设备）的可用性、或者作为一次性事件 发生的通知（如一个中断通知一个任务）；而计数信号量则拥有一个大于1的最 大计数值上限（创建时设定），其当前计数值可以表示多个相同资源的可用数量 （如缓冲池中有N个空闲缓冲区），允许多个任务在不冲突的情况下获取资源（计 数值减1），直到资源耗尽（计数值为0）才需等待。简单说，二值信号量是有/无状态，解决单一资源或事件同步；计数信号量是有多少个可用状态，管理多个同类资源实例。

举例说明：当发生一次中断事件时，此时可以用二值信号量存储这个事件， 但存储的该事件未被处理之前，又再次发生了中断事件，此时二值信号量就存不 住新的中断事件了，只能丢失掉；而计数信号量有大于1的存储空间，可以锁存 多个事件，避免了中断事件丢失问题。

#### 请你说一下FreeRTOS中的动态内存管理方式

答：frertos 中的动态内存，通过pvPortmalloc 和 VPortFree 接口提供五种分配方式:
heap1:采用只分配，不释放的方式，适用于初始化后不删除的场景。
heap2:支持分配和释放，但只能分配释放固定大小的内存块，否则会引起内存碎片问题。
heap3:直接使用c语言标准库里边的malloc和free函数，但占用资源大。
heap4:freertos中默认的首选方案，能分配和释放，是 heap2 的升级版，可以合并空闲内存块减少内存碎片问题。但开销比heap1和heap2大， 分配速度较慢。
heap5:在 heap4 的基础上增加了对多内存区域的支持，可以让内存跨越多个 不连续的内存段。 可以将内部ram和外接ram合起来一起作为内存堆使用，但 其配置复杂且开销较大。

#### RTOS 的内存池机制如何优化内存分配？

答：RTOS中的内存池机制通过预先将一大块连续内存划分为多个固定大小的内 存块进行管理，从而有效优化了内存分配的性能和可靠性。系统启动时，内存池被初始化成一个由链表连接的块集合，每个块大小一致。当任务请求内存时，分 配算法只需从空闲链表中取出一个块，时间复杂度极低且具有确定性；释放时只 需将块重新挂回链表。这种设计从根本上消除了传统动态内存分配（如malloc） 产生的外部碎片问题，因为所有块大小固定，任何分配和释放都不会导致内存空 间被分割成不连续的小区域。  内存池的缺点是可能存在内部碎片，即如果请求的内存小于块大小，剩余的 字节就被浪费了，因此需要根据实际应用的数据结构大小来合理配置内存池的块尺寸。

#### RTOS中任务优先级的分配原则，高优先级任务长期占用CPU会导致什么问题？

答：任务优先级的分配通常遵循紧急事件快速响应与资源合理共享的原则。一般而言，对实时性要求高、执行时间短且需要快速响应的任务（如中断处理后的数 据接收、按键扫描等）应赋予较高优先级；而计算量大、耗时较长或对实时性要 求不高的任务（如数据显示、串口打印等）应赋予较低优先级。同时，需注意避 免多个高优先级任务频繁抢占导致低优先级任务“饿死”，并合理使用互斥量、任 务通知等机制来防止优先级反转问题。

如果一个高优先级任务长期占用CPU而不进入阻塞态（例如在任务循环中 未调用延时或等待事件），则会导致所有比它优先级低的任务永远无法获得CPU 使用权，这种现象称为“任务饥饿”。低优先级任务即使已准备就绪，也会因无法 被调度而永远无法执行，导致系统功能失效。RTOS的心跳节拍（如滴答定时器 处理）也可能被阻塞，最终引发看门狗超时复位或系统完全失去响应。

### C语言与内存基础

#### 说一下堆和栈的区别。

答：栈用于保存局部变量、函数调用和递归、函数的形参、通用寄存器等，空间由系统自动分配和回收，堆区用于保存动态分配的数据，如 malloc 函数申请 的内存数据就保存在堆区，其空间由程序员进行手动分配和释放。  其次，栈是一种线性结构，遵循后进先出原则；而堆是一种树状结构，没有 固定规则，允许随机插入和删除等操作。栈的大小是有限的，堆的大小可以根据 需求进行动态调整，但也受物理内存的限制。  最后，栈的分配和释放速度快，堆比较慢。

#### 请你说一下如何用C语言实现面向对象思想？

答：在C语言中实现面向对象编程，主要利用结构体和函数指针来模拟类的三大特性：封装、继承和多态。
封装通过将数据成员和函数指针组合在一个结构体中实现。例如，定义一个“类”时，结构体包含状态变量，并包含指向相关操作的函数指针，使用者通过该结构体实例调用方法，隐藏内部实现细节。
继承可以通过结构体嵌套来实现。将基类结构体作为子类结构体的第一个成员，这样在内存布局上，子类对象首地址与基类部分对齐，可以安全地将子类指针强制转换为基类指针，实现基类方法对派生部分的操作。
多态则依赖于虚函数表（vtable）。在基类中定义一个包含函数指针的结构体作为虚表，基类实例中保存虚表指针。子类可以修改虚表中的函数指针指向自己的实现，从而实现运行时动态绑定，也就是多态。
注：在本项目中，笔者使用的是封装思想。

#### 请说一下什么是内存碎片

答：内存碎片指的是由于频繁分配和释放不同大小内存，导致内存不断分割，存在大量很小内存块，这种内存块由于太小没法再次分配，就成为了内存碎片。

#### 说一下全局变量、静态全局变量、局部变量的存储区域及生命周期差异

答：全局变量和静态全局变量均存储在静态存储区（或者是全局区，一个意思）， 其中显式初始化的变量位于数据段（.data段），未初始化或初始化为零的变量位 于BSS 段（.bss），它们的生命周期贯穿整个程序运行期间，从程序加载开始到程序结束才释放。
两者的主要区别在于链接作用域：全局变量默认具有外部链接性，可被其他源文件通过extern声明访问；而静态全局变量由于static修饰，具 有内部链接性，只能在其定义的源文件内部使用，有效避免了命名冲突。  局部变量则存储在栈区，其生命周期严格限定在所在函数或代码块的执行期 内，当函数调用结束或代码块退出时，栈被销毁，局部变量也随之自动失效，不再占用内存。这种动态分配的特性使得局部变量适合存储临时数据，但使用时必 须确保其生命周期不超出定义范围，否则会导致悬空引用。

#### 说一下内存泄露的原因

答：内存泄漏的主要原因是对动态内存的不当管理，尤其是在资源受限的环境下。 常见情况包括：
1、调用malloc、calloc 等函数分配内存后，未及时调用 free 释 放，导致已分配的内存块无法被再次使用；或者程序逻辑存在异常路径，使得释 放内存的代码未能执行（例如函数提前返回或发生错误时遗漏释放）。
2、如果释放内存后，仍有指针指向该区域（悬垂指针）并继续使用，虽然 不直接增加泄漏，但可能导致后续分配混乱；而反复分配内存却丢失了原始指针 （如指针被覆盖），则会使该内存块永远无法回收。
3、循环或递归中不断分配内存而未释放，以及第三方库或底层驱动未提供 对应的释放接口，最终造成可用内存逐渐耗尽，系统性能下降甚至崩溃。

### 中断、可靠性与固件升级

#### 请你说一下什么是Bootloader？STM32的启动上电流程是怎样的？

答：Bootloader叫做引导加载程序。在嵌入式系统上电复位后首先运行引导加载程序，它的功能主要是负责系统的上电自检、必要的硬件初始化、建立储存空间映射，并加载和启动操作系统。Bootloader一般储存在bootROM中，当前使用最多的类型是NOR flash rom，在大多数的嵌入式系统中，flash里边不仅储存了bootloader，还储存了用户程序代码。Bootloader有两种工作模式，一种是启动加载模式，另一种是下载模式；而本章节所提到的固件升级就属于bootloader的下载模式。

STM32的上电启动流程：当STM32发生复位时，此时硬件会强制PC寄存器指向一个固定地址0X00000000（或者是由boot引脚映射的0x08000000），该地址存放的是主堆栈指针（MSP）的初始值，内核会读取该值并进行堆栈初始化，以创建好C环境以及安全调用中断服务函数。

其次，PC寄存器会执行到0x00000004地址，取出该地址存放的复位中断处理函数，并跳转过去执行；在复位函数中，首先完成系统时钟的初始化，其次调用__main函数，完成数据的初始化，如将Flash中的data段数据拷贝到RAM中，然后将未初始化的全局变量（bss段）清零。最后，__main函数调用main函数，进入到main函数执行。

#### 中断响应的过程？

答：在STM32中，中断响应的过程始于外设或内核事件产生的中断请求信号， 该信号被发送至嵌套向量中断控制器NVIC。NVIC 首先检查该中断的使能状态 以及当前优先级是否高于正在执行的中断或主线程的优先级，如果条件满足，则 向处理器内核发出中断请求。处理器在完成当前指令后响应中断，硬件自动将关 键寄存器（包括程序计数器PC、状态寄存器xPSR、通用寄存器R0-R3、R12等） 的值压入当前栈（主栈或进程栈），然后从中断向量表中取出对应中断服务函数 ISR 的入口地址，并跳转执行。
进入ISR后，用户编写的处理代码开始执行，进行必要的硬件状态清除或数 据处理。ISR执行完毕后，通过专用的中断返回指令触发硬件出栈操作，恢复之 前压入栈中的寄存器值，使程序返回到被中断打断的位置继续执行。整个过程由 硬件自动完成上下文保存和恢复，确保了中断响应的实时性和可靠性。

#### FreeRTOS 中的中断服务函数与任务间通信的安全方式，为何不建议在ISR中直接调用复杂函数？

答：在FreeRTOS 中，确保中断服务函数与任务间通信安全的核心是使用专为中 断设计的“FromISR” 结尾的 API 函数，如 xQueueSendFromISR 或 xSemaphoreGiveFromISR。这些函数在实现上避免了可能引起阻塞的操作，不会 试图获取内核锁或等待资源，同时它们会通过一个pxHigherPriorityTaskWoken参 数来指示是否有更高优先级的任务因本次通信而就绪，以便在中断退出时由调度 器决定是否触发任务切换，从而保证数据传递的原子性和实时性。

不建议在 ISR 中直接调用复杂函数的主要原因在于中断上下文的高度受限 性。ISR 需要快速执行以释放 CPU 响应其他中断，若调用复杂或可能阻塞的函 数，将显著增加中断延迟，影响系统实时性。此外，许多复杂函数并非可重入， 且可能依赖临界区或调度器锁，在中断中调用容易破坏内核数据结构或导致死锁。 因此，最佳实践是让ISR仅完成最必要的快速操作（如清除中断标志），然后通 过安全机制将事件通知给任务，将耗时处理转移至任务上下文中。

#### 固件升级过程中突然断电，再次上电如何保证系统能恢复并重新启动升级流程？

答：在固件升级过程中突然断电后，系统能够恢复并重新启动升级流程的核心依 赖于双区备份机制和启动加载程序的安全设计。常见的实现方式是采用 A/B 分 区策略，即芯片内部至少包含两个独立的固件存储区（分区A和分区B）以及一 个启动引导区。升级过程中，新的固件被写入当前未使用的备份分区（例如分区 B），而原有的固件仍在分区A正常运行。如果断电发生在分区B写入期间，原有分区 A 的固件完好无损，上电后引导程序通过校验标记或状态标志发现升级 未完成，会自动回滚至分区A启动，并重新触发升级流程。

此外，还可以结合非易失性存储器中的状态标记来实现断点续传。每次升级 开始前，系统会在Flash中写入特定的升级标志和进度信息。若写入新固件过程 中断电，上电后启动加载程序首先检查这些标志，发现上次升级未完成且当前活 动分区不可用或校验失败，则会重新尝试从备份区启动或从通信接口（如云端、 U盘）重新获取固件包。部分高级设计还支持从异常中恢复，通过冗余的启动代 码强制进入固件更新模式，确保设备永不“变砖”，直至升级成功。
