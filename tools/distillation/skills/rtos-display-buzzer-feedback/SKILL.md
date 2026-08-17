---
name: rtos-display-buzzer-feedback
description: "Use when explaining or auditing the STM32+FreeRTOS LCD display and active-buzzer feedback path: UIDisplayTask versus control-task priority/period boundaries, synchronous SPI1/ST7735S initialization and refresh, GPIO buzzer control, short/long-press/release feedback, delay_ms blocking semantics, or a future single-consumer buzzer event queue. Trigger phrases include ‘LCD不刷新’, ‘蜂鸣器一直响’, ‘短按长按提示音’, ‘显示任务优先级’, and ‘多个任务报警如何仲裁’. Do not use as a replacement for the key state machine, generic task/ISR design, periodic-timer audit, or project-storytelling skills."
metadata:
  source_files:
    - "projects/RTOS项目/文档/4 硬件驱动开发/4.3 用户交互/4.3.2 LCD 显示驱动与UI设计.md"
    - "projects/RTOS项目/文档/4 硬件驱动开发/4.3 用户交互/4.3.3 蜂鸣器控制与音频提示.md"
    - "projects/RTOS项目/源码/BSP/LCD/lcd.c"
    - "projects/RTOS项目/源码/BSP/LCD/lcd.h"
    - "projects/RTOS项目/源码/BSP/LCD/GUI.c"
    - "projects/RTOS项目/源码/BSP/BEEP/beep.c"
    - "projects/RTOS项目/源码/BSP/BEEP/beep.h"
    - "projects/RTOS项目/源码/BSP/SPI/SPI.c"
    - "projects/RTOS项目/源码/BSP/SPI/SPI.h"
    - "projects/RTOS项目/源码/BSP/KEY/key.c"
    - "projects/RTOS项目/源码/BSP/KEY/key.h"
    - "projects/RTOS项目/源码/APP_TASK/app_tasks.c"
    - "projects/RTOS项目/源码/APP_TASK/app_tasks.h"
    - "projects/RTOS项目/源码/USER/main.c"
    - "projects/RTOS项目/源码/USER/main.h"
    - "projects/RTOS项目/源码/SYSTEM/delay/delay.c"
    - "projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h"
    - "projects/RTOS项目/RTOS项目复习文档.md"
  source_symbols:
    - "Hardware_Init"
    - "StartTask"
    - "UIDisplayTask"
    - "MotorControlTask"
    - "KeyScanTask"
    - "LCD_Init"
    - "LCD_GPIOInit"
    - "LCD_RESET"
    - "LCD_WR_REG"
    - "LCD_WR_DATA"
    - "Lcd_WriteData_16Bit"
    - "LCD_SetWindows"
    - "LCD_Clear"
    - "LCD_direction"
    - "SPI1_Init"
    - "SPI_WriteByte"
    - "Show_Str"
    - "Beep_Init"
    - "Beep_config"
    - "Beep_on"
    - "Beep_off"
    - "Buzzer_Beep"
    - "delay_ms"
    - "Key_StateMachine"
    - "Key_Scan"
    - "KEY_EVENT_SHORT_PRESS"
    - "KEY_EVENT_LONG_PRESS"
    - "KEY_EVENT_LONG_PRESSING"
    - "KEY_EVENT_RELEASE"
  related_skills:
    - rtos-key-event-state-machine
    - rtos-task-and-isr-design
    - rtos-software-timer-periodic-design
    - rtos-project-storytelling
  tags: [stm32, freertos, lcd, spi, buzzer, gpio, feedback, ui]
---

# RTOS 显示与蜂鸣器反馈

只沿着“初始化 → 任务边界 → 外设写入 → 用户反馈 → 可验证时序”回答。每条结论标注为**源码事实**、**文档叙述**、**未来设计建议**或**硬件实测**；没有示波器、逻辑分析仪、功耗或帧率记录时，不把代码中的周期、频率和持续时间称为实测结果。

## R

> “LCD驱动和200ms UI任务已接入。”

来源：LCD 交互文档的实现状态段。它是文档叙述，需用 `app_tasks.c` 和 `lcd.c` 复核。

> “有源蜂鸣器：高电平响，低电平不响。”

来源：`BEEP/beep.c` 注释及 `Beep_on`/`Beep_off` 实现。

> “100ms的延时会让任务进入阻塞态。”

来源：蜂鸣器交互文档；实际语义由 `delay_ms()`、调度器状态和调用上下文决定。

## I

### 1. 先分清四种证据

- **源码事实**：`UIDisplayTask` 优先级为 1、循环末尾 `delay_ms(200)`；`MotorControlTask` 优先级为 5、末尾 `delay_ms(50)`；`KeyScanTask` 优先级为 4、末尾 `delay_ms(10)`。`StartTask` 在临界区内创建任务，再初始化 TIM4 并删除自身。
- **文档叙述**：UI “5Hz”、SPI “最高 36MHz”、200ms“为其他任务留出充足 CPU”是设计说明或计算值，不是仓库中的波形、CPU 占用或帧率报告。
- **未来设计建议**：LCD DMA、局部刷新、双缓冲、显示消息队列，以及蜂鸣器事件队列/专用任务都没有在当前主链实现。
- **硬件实测**：当前指定资料没有逻辑分析仪、示波器、声学或帧率记录；显示是否真的达到 36MHz/5Hz、蜂鸣是否恰为 100ms，均待测。

### 2. 任务边界由响应期限和写入成本决定

| 工作 | 当前源码优先级 | 当前代码节拍 | 当前责任 | 边界判断 |
|---|---:|---:|---|---|
| `MotorControlTask` | 5 | `delay_ms(50)` | PID/PWM 与电机控制 | 控制闭环比 UI 紧急；不要把同步刷屏放进来 |
| `KeyScanTask` | 4 | `delay_ms(10)` | 扫描事件、模式/档位/电机动作、蜂鸣反馈 | 需要及时采样；短按提示会暂停本任务自身扫描 |
| `UIDisplayTask` | 1 | `delay_ms(200)` | 格式化状态并写 LCD | 只允许显示滞后；同步 SPI 仍会占用本任务运行时间 |
| `SensorTask`/`WindSpeedTask` | 3 | 500ms/100ms | 更新显示所依赖的共享状态 | 数据生产者，不应直接承担 UI 绘制 |

优先级只表达可抢占顺序，不保证 50ms、10ms 或 200ms 的 start-to-start 精度。`delay_ms(period)` 是相对延时，实际周期还包含本轮业务和调度等待；需要稳定相位时另行评估 `vTaskDelayUntil()`，不要把本 Skill 当作软件定时器审计。

### 3. LCD 是同步的 SPI 写屏链

当前链路为 `UIDisplayTask/其他直接调用者 → Show_Str/LCD_Clear → LCD_SetWindows/LCD_WR_* → SPI_WriteByte(SPI1) → ST7735S`。`SPI_WriteByte()` 轮询 TXE 后写数据，再轮询 RXNE；因此源码实际是同步、轮询式传输，没有 DMA 完成通知。

`SPI1_Init()` 配置主机、8 位、MSB first、软件 NSS、SPI1 分频 2，PA5 为 SCK、PA7 为 MOSI；PA6 虽初始化为上拉输入，但 LCD 主链不使用 MISO。`LCD_WR_REG()` 将 CS 拉低、RS/DC 拉低后发命令；`LCD_WR_DATA()` 将 RS/DC 拉高后发数据；16 位像素拆成高字节再低字节发送。

`LCD_Init()` 的可执行顺序是：`SPI1_Init()` → GPIOB PB6/PB7/PB8/PB9 推挽输出 → RST 低电平 100ms、再高电平 50ms → 发送 ST7735S 睡眠退出/帧率/电源/伽马/方向/像素格式/显示开命令 → `LCD_direction(USE_HORIZONTAL)` → 背光 PB6 置高 → 全屏白色清除。`main.c` 在调度器启动前调用它，所以这些初始化延时不是任务阻塞，而是 `delay_us()` 忙等待。

### 4. 蜂鸣反馈是 GPIO 电平与事件生命周期的组合

`Beep_Init()` 使能端口时钟、保存 `led_d` 的端口和引脚、配置推挽输出 50MHz，并调用 `Beep_off()` 先静音；当前 `Hardware_Init()` 传入 GPIOB/PB15。`Beep_on()` 输出高电平，`Beep_off()` 输出低电平，`Buzzer_Beep()` 则执行“开 → `delay_ms(duration_ms)` → 关”。这是有源蜂鸣器开关，不是音调/PWM接口。

当前 `KeyScanTask` 的映射是：

- Key1 短按：切换模式、`Buzzer_Beep(100)`、清事件；Key2 短按：切换档位、`Buzzer_Beep(100)`、清事件。
- 两个按键在 `KEY_EVENT_LONG_PRESSING` 时 `Beep_on()`；在 `KEY_EVENT_RELEASE` 时 `Beep_off()` 并清事件。
- Key2 的 `KEY_EVENT_LONG_PRESS` 还执行强制切换电机；Key1 的该事件在当前 `KeyScanTask` 没有额外业务动作。

详细的 30ms 消抖、1s 长按判定、字段式事件覆盖和 `ClearEvent()` 生命周期属于 `rtos-key-event-state-machine`；本 Skill 只消费其事件来解释反馈时序。

### 5. `delay_ms()` 的“阻塞”要按上下文解释

`delay_init()` 以 `configTICK_RATE_HZ=1000` 设置 `fac_ms=1`。调度器已启动时，`delay_ms(nms)` 对可整除的部分调用 `vTaskDelay(nms/fac_ms)`，当前任务进入 Blocked，其他就绪任务可运行；余数用 `delay_us()` 忙等待。调度器尚未启动时不调用 `vTaskDelay()`，整段走 `delay_us()`。因此：

- `UIDisplayTask` 的 200ms 延时会让出 CPU，但不能让该任务在这段时间刷新或处理新状态。
- Key1/Key2 短按的 `Buzzer_Beep(100)` 会让 `KeyScanTask` 约 100ms 不再扫描；高优先级任务仍可抢占，不能说成“整个系统停 100ms”。
- 不得在 ISR 调用 `Buzzer_Beep()` 或依赖 `vTaskDelay()`；ISR 只能使用相应的 FromISR 通信方式，把工作转给任务。

## A1

当前实际集成链为：`main()` 的 `Hardware_Init()` 初始化蜂鸣器、LCD 和按键；随后 `System_Init()` 建立共享状态/互斥量，`StartTask` 创建 `KeyScanTask`、`MotorControlTask`、`UIDisplayTask` 等；UI 读取 `g_systemState` 并显示模式、档位、风速 PWM、RPM、自动状态及计时；按键任务同时改变状态并驱动蜂鸣器。

需特别标出两个源码边界：

1. `UIDisplayTask` 当前直接读取 `g_systemState`，未在该函数中取得 `g_dataMutex`；文档也承认并非所有访问都加锁。若要求一致快照，建议先在短临界区复制状态，再释放锁后格式化和刷屏，不要持锁等待 SPI。
2. LCD 并非当前严格的单一消费者：`System_ToggleMotor()` 和条件编译的 `iap_task` 也直接 `Show_Str()`/`LCD_Clear()`。这是源码事实，不是已发生的撕裂故障；若并发写屏成为问题，应把显示请求集中到一个显示任务。

蜂鸣器则是另一种现状：指定源码中只有 `KeyScanTask` 直接访问 `bep`，没有 `BuzzerTask`、事件队列或多任务报警仲裁。未来若 `SensorTask`、`AntiBackflowTask` 等也发报警，不要让它们直接调用 `Beep_on/off()`。

## A2

在以下场景触发本 Skill：

1. 需要按当前源码解释 LCD 无显示、错位、刷新慢、初始化顺序、SPI 命令/数据和同步写屏。
2. 需要比较 UI、按键和电机控制任务的优先级/周期，或说明 `delay_ms()` 在启动前、任务中和 ISR 中的不同语义。
3. 需要追踪短按、长按持续、释放到蜂鸣器 GPIO 的反馈，或设计未来多任务报警的单一消费者/事件队列。

边界必须保持清楚：

- `rtos-key-event-state-machine` 负责按键状态机、消抖、长按阈值和事件消费细节；本 Skill 不替代它。
- `rtos-task-and-isr-design` 负责通用任务划分、优先级、互斥量、阻塞和 ISR 边界；本 Skill 只把这些原则落到显示/反馈链。
- `rtos-software-timer-periodic-design` 负责软件定时器、`vTaskDelayUntil()`、硬件定时器和周期机制审计；本 Skill 不把 `delay_ms()` 扩展成完整定时器教程。
- `rtos-project-storytelling` 负责项目介绍、面试结构和个人贡献边界；本 Skill 只提供可核对的交互链事实。

## E

1. **建立证据表**：按“源码事实 / 文档叙述 / 未来建议 / 待实测”四列记录任务优先级、周期、调用者、GPIO、SPI 配置和事件动作。先以 `app_tasks.c/.h`、`main.c`、BSP 实现为准，再指出文档超出源码或实测的部分。
2. **复核初始化与写屏**：确认 `Hardware_Init()` 在 `vTaskStartScheduler()` 前，检查 SPI1 的 PA5/PA7、PB6-9、RST 时序、命令/数据 DC 电平、窗口设置和 `SPI_WriteByte()` 的轮询等待。若要判断实际波形或速度，使用逻辑分析仪测 CS/RS/SCK/MOSI，并报告测量条件。
3. **划定任务责任**：让控制任务只更新控制输出，让 UI 任务格式化快照并执行同步写屏；评估刷新调用的最坏执行时间，避免把“低优先级”误解成“零 CPU 占用”。若需稳定周期或事件唤醒，转交 `rtos-software-timer-periodic-design`/`rtos-task-and-isr-design`。
4. **复核反馈生命周期**：将每个按键事件映射为“业务动作、蜂鸣开关、事件清除、下一次扫描”的表格；确认短按提示的 100ms 只阻塞 `KeyScanTask`，长按使用 `Beep_on()`，释放必达 `Beep_off()`。不要在 ISR 或显示任务中直接调用阻塞式 `Buzzer_Beep()`。
5. **设计未来报警队列**：让 `SensorTask`、`AntiBackflowTask`、`KeyScanTask` 只提交语义事件，例如 `{source, pattern, priority, duration, cancel_key}`；由唯一 `BuzzerTask` 从队列取出并独占 `Beep_on/off()`。明确队列满时丢弃/合并策略、报警优先级、短提示是否可抢占、长按释放如何取消，以及需要 ISR 时使用 `xQueueSendFromISR()`。有源蜂鸣器只能开关；多音调需另评估无源蜂鸣器和 PWM。
6. **补上可重复验证**：用 `xTaskGetTickCount()` 或 trace 记录任务 start-to-start；用 GPIO/逻辑分析仪测蜂鸣器 PB15 高电平宽度、LCD CS/SCK 波形；把“代码标称 200ms/100ms/分频 2”与“实测值、负载、误差”分开保存。

## B

- 当前 UI 是优先级 1、200ms 相对延时的同步 SPI 刷新；当前控制是优先级 5、50ms 相对延时的电机任务。它们是本项目配置，不是通用实时性保证。
- `SPI1_Init()` 的分频设置、文档所说的 36MHz 和 UI 所说的 5Hz 不能替代实际时钟/帧率测量；仓库没有 DMA、双缓冲、局部刷新或硬件性能报告。
- `delay_ms()` 在任务中会阻塞当前任务并让出 CPU，在调度器启动前会忙等待；它不是 ISR API，也不等于精确周期或非阻塞业务函数。
- 当前蜂鸣器只有单一按键任务消费者；不存在已实现的报警队列、专用蜂鸣任务、优先级仲裁或音调播放。队列方案是未来设计建议，不得写成当前功能。
- `g_dataMutex` 保护共享状态的用途不能自动扩展成蜂鸣器仲裁；互斥量只能串行访问，不能定义报警优先级、取消和模式播放。
- “有源、高电平响、低电平静音”来自源码注释/电平操作；是否接线正确、音量、实际鸣叫时长和 LCD 画面质量都未在资料中硬件实测。
- 本 Skill 不复制原始笔记或源码，不修改原始资料、附件和构建产物；只维护规范 Skill 与获准的 `distillation/rtos-project/` 域索引材料。

## 相关 Skills

- `rtos-key-event-state-machine`：按键状态机、消抖、短按/长按与事件清除。
- `rtos-task-and-isr-design`：通用任务/ISR、优先级、阻塞和共享状态设计。
- `rtos-software-timer-periodic-design`：软件定时器、周期实现和时间机制审计。
- `rtos-project-storytelling`：把已核实项目链组织成面试表达。

