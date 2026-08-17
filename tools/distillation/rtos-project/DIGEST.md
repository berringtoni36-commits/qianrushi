# STM32 + FreeRTOS 油烟机项目 — 精华

这个项目最适合用一条主线理解：STM32F103 上有多个不同周期和实时性要求的功能，启动文件和 FreeRTOS port 先把 CPU 交给调度器，再由任务、ISR 和同步对象组织传感器、按键、编码器、电机、UI 和可选升级链路。学习时应始终把“设计意图、当前源码、文档推断、硬件实测”分开。

## 0. 先看启动与配置

当前启动链是：`Reset_Handler` 设置时钟前置条件并进入 `SystemInit()`，C 库完成 `.data/.bss/堆栈` 准备后进入 `main()`；`main()` 顺序为 `Hardware_Init()`、`System_Init()`、`StartTask_Create()`、`vTaskStartScheduler()`。调度器启动时，Cortex-M3 port 配置 1kHz SysTick，把 PendSV 作为上下文切换入口，SVC 启动第一个任务。

配置事实：抢占式调度、时间片、互斥量、任务通知、软件定时器、`heap_4.c` 和 10KB FreeRTOS 动态堆开启；tickless、协程、运行时统计、栈溢出钩子和 malloc 失败钩子关闭。`app_tasks.h` 的任务栈宏按 `StackType_t` 元素计数，不是字节。任何“任务不跑”的问题，都先确认实际编译的 port、向量映射、tick reload、任务创建返回值和堆剩余量。

## 核心方法

### 1. 任务与 ISR

周期任务负责按键、传感器、电机和显示；事件任务等待测速或 DMA 信号量。中断只清标志和通知，避免在高优先级上下文做复杂计算。`g_systemState` 是共享状态中心，`g_dataMutex` 保护读写。

### 2. 闭环控制

目标 RPM 来自档位或模式，编码器给出实际 RPM，PID 计算 PWM 控制量，TIM1 CCR 执行。调参前先检查方向、采样周期、毛刺、积分限幅和输出饱和。

### 3. 传感器、按键与状态机

DHT11 是阻塞式 GPIO 手动时序；MQ2 是 ADC 采样、10 次平均和经验换算；融合模块使用固定归一化和权重产生 PWM 映射与 Cooking Event。按键采用 30ms 消抖、1s 长按和字段式事件，业务任务必须清理单次事件。AUTO 是 `STARTUP → COOKING → DELAY_OFF` 三段内部状态；计数器来自任务周期累加，不自动等于真实秒数。

### 4. 可靠性与升级

IAP 链路涉及串口 DMA、接收缓冲区、CRC32、Flash 写入和跳转。`ifopen` 宏决定功能是否参与编译，面试表述必须说明实际配置。

## 故障诊断主线

HardFault 不是根因。当前异常 handler 只是死循环，`configCHECK_FOR_STACK_OVERFLOW=0` 和 `configUSE_MALLOC_FAILED_HOOK=0`，所以诊断应先取得 MSP/PSP、PC/LR、CFSR/HFSR/BFAR/MMFAR，再按启动、任务栈/堆、ISR 优先级、空句柄、锁和越界分类。`TIM4_init()` 只有在 `g_speedCalcSemaphore`/`SpeedCalcTask` 创建后才安全；共享状态仍需按实际函数逐项审计。

## 陷阱

- 互斥量不是消息队列，信号量不是业务数据。
- 任务栈单位是字，不是字节。
- 定时器或 DMA 中断早于信号量创建会造成异常风险。
- `ifopen=0` 时 IAP 路径默认不参与应用流程；不能把代码存在说成已启用、已实测。
- CRC32 是完整性校验，不是签名；单 APP 没有 A/B 回滚和断电恢复。
- `configASSERT` 的 `printf` 不是异常现场保存；ISR 中打印还可能改变时序。

## 升级链路

可选 IAP 的证据链是 `add_crc32.py → USART1 RX → DMA1 Channel5 → DMA TC ISR → g_iapSemaphore → iap_task → CRC32_VerifyFirmware → 入口向量检查 → FLASH_APP1_ADDR 擦写 → 写后检查 → iap_load_app`。它依赖固定 `buff_size=3692`、APP 链接布局和 `ifopen`，当前不具备通用长度协议、签名认证、A/B 槽、持久化升级状态或断电回滚。

## 5. 周期与交互反馈

不要把 `vTaskDelay()`、`vTaskDelayUntil()`、FreeRTOS 软件定时器和硬件定时器当成同一种周期机制：它们的执行上下文、阻塞方式、抖动来源和回调约束不同。当前项目的 UI 任务、控制任务和按键任务应以源码配置为事实；200ms/50ms 等标称周期还需用 tick、GPIO 或 trace 实测。

LCD 链路是初始化→窗口/命令数据→同步 SPI1 轮询写屏→ST7735S；蜂鸣器当前由按键路径直接开关，短按提示会阻塞当前任务，长按需在释放时关闭。未来由传感器、自动模式等多任务共同报警时，可设计单一 `BuzzerTask`/事件队列，但不能把建议写成当前实现。

## 项目讲解模板

先说产品问题，再说启动/三层架构，然后讲任务协作和一条闭环控制链，最后给出一个有证据的故障或升级链，并明确当前配置、个人贡献和实测边界。不要把库文件名当作个人贡献。
