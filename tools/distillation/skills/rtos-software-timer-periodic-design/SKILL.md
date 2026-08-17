---
name: rtos-software-timer-periodic-design
description: "审计和选择 FreeRTOS 软件定时器、delay-based 周期任务、硬件定时器 ISR 到任务通知的实现方式，结合当前 STM32 工程源码核对 Timer Service Task、命令队列、回调上下文、队列/栈/优先级、周期漂移、执行超时、二值信号量丢失或合并以及初始化顺序。Use when a user asks about xTimerCreate/configUSE_TIMERS, delay_ms 周期设计, TIM4 触发 SpeedCalcTask, software-timer callbacks, or a source-grounded timing implementation audit."
metadata:
  source_files:
    - "projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.2 任务创建、调度与优先级设计.md"
    - "projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.4 软件定时器与周期任务实现.md"
    - "projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h"
    - "projects/RTOS项目/源码/FreeRTOS/timers.c"
    - "projects/RTOS项目/源码/APP_TASK/app_tasks.c"
    - "projects/RTOS项目/源码/APP_TASK/app_tasks.h"
    - "projects/RTOS项目/源码/SYSTEM/delay/delay.c"
    - "projects/RTOS项目/源码/BSP/MOTOR/motor.c"
  source_symbols:
    - "configUSE_TIMERS"
    - "configTICK_RATE_HZ"
    - "configTIMER_TASK_PRIORITY"
    - "configTIMER_QUEUE_LENGTH"
    - "configTIMER_TASK_STACK_DEPTH"
    - "xTimerCreateTimerTask"
    - "xTimerCreate"
    - "xTimerGenericCommand"
    - "xTimerQueue"
    - "DaemonTaskMessage_t"
    - "prvTimerTask"
    - "prvProcessExpiredTimer"
    - "delay_ms"
    - "vTaskDelay"
    - "fac_ms"
    - "System_Init"
    - "StartTask"
    - "TIM4_init"
    - "TIM4_IRQHandler"
    - "g_speedCalcSemaphore"
    - "SpeedCalcTask"
    - "get_speed"
    - "xSemaphoreGiveFromISR"
    - "TASK_SPEED_CALC_PRIORITY"
  tags: ["freertos", "stm32", "rtos", "software-timer", "periodic-task", "hardware-timer", "timer-service", "timing-audit"]
  related_skills: ["rtos-task-and-isr-design", "stm32-clock-and-sampling-timing", "rtos-communication-debugging", "rtos-motor-pid-control"]
---

# FreeRTOS 软件定时器与周期实现审计

只回答“当前代码实现了什么、候选机制如何选择、如何验证时间行为”。把结论分成三类：`源码事实`、`由源码推导的机制`、`尚需测量的诊断风险`。不要把文档示例、注释中的周期或潜在风险写成运行时故障。

## R — 原文摘录（Reading）

> `configUSE_TIMERS=1` 会创建 Timer Service 任务，但业务周期没有使用 `xTimerCreate()`；实际采用 `delay_ms()` 周期任务和 TIM4 1ms 中断 + 二值信号量两种方式。

来源：`3.4 软件定时器与周期任务实现.md`，实现状态段。

> `delay_ms()` 在调度器运行后调用 `vTaskDelay(nms/fac_ms)`，余数用 `delay_us()` 处理。

来源：`SYSTEM/delay/delay.c` 的 `delay_ms()`；`fac_ms` 在 `delay_init()` 中由 `configTICK_RATE_HZ` 初始化。

> `TIM4_IRQHandler()` 清除更新标志后调用 `xSemaphoreGiveFromISR(g_speedCalcSemaphore, ...)`，再按需执行 `portYIELD_FROM_ISR()`。

来源：`APP_TASK/app_tasks.c` 的 `TIM4_IRQHandler()`。

> `timers.c` 由 `configUSE_TIMERS == 1` 编译；其他上下文通过 `xTimerQueue` 向 Timer Service Task 发送命令，过期处理函数直接调用定时器回调。

来源：`FreeRTOS/timers.c` 的 `xTimerCreateTimerTask()`、`xTimerGenericCommand()`、`prvTimerTask()` 和 `prvProcessExpiredTimer()`。

## I — 机制解释与选择原则（Interpretation）

### 1. 先区分三条时间路径

| 路径 | 触发/等待 | 工作执行上下文 | 适合的承诺 | 当前工程状态 |
|---|---|---|---|---|
| 软件定时器 | tick 到期；启动/停止/改周期等命令进入 `xTimerQueue` | Timer Service Task；所有回调在该任务中串行执行 | 轻量超时、状态检查、非硬实时周期动作 | 功能启用，但业务源码未发现 `xTimerCreate()` 周期实现 |
| delay-based 任务 | 业务循环末尾 `delay_ms()` → `vTaskDelay()` | 各自的业务任务 | 简单、独立、允许调度抖动的周期工作 | Key/Sensor/Wind/Motor/UI/AntiBF 使用 |
| 硬件定时器 ISR→任务 | TIM4 更新中断给二值信号量 | ISR 只发信号；计算在 `SpeedCalcTask` | 需要硬件事件作为时间基准，且允许任务消费事件 | 当前测速路径 |

按以下条件选择：

1. 只需轻量超时或非关键周期动作，并能接受共享 Timer Service Task 的优先级和串行回调时，选择软件定时器。回调只做短操作；复杂工作应再交给专用任务。
2. 需要一个拥有自己栈和优先级的周期工作单元，且周期允许受调度影响时，选择任务循环。若需要相对固定的起始相位，优先评估 `vTaskDelayUntil()`；当前工程虽在配置中启用 `INCLUDE_vTaskDelayUntil`，业务源码未发现调用。
3. 周期由外设事件、采样边界或捕获点定义，且每次事件是否必须保留已经明确时，选择硬件定时器 ISR→任务。二值信号量只表达“有一个事件待处理”，不能自动记录每个中断；必须确认事件合并是可接受语义，否则评估计数型通知/信号量或队列。
4. 不要用软件定时器回调替代硬件捕获，也不要因 `configUSE_TIMERS=1` 就推断业务已经使用软件定时器。

### 2. 当前内核资源的可核对含义

- `FreeRTOSConfig.h`：`configUSE_TIMERS=1`；`configMAX_PRIORITIES=32`；`configTIMER_TASK_PRIORITY=(configMAX_PRIORITIES-1)`，因此 Timer Service Task 配置优先级为 31。
- 同一文件配置 `configTIMER_QUEUE_LENGTH=5`，`configTIMER_TASK_STACK_DEPTH=(configMINIMAL_STACK_SIZE*2)`；当前 `configMINIMAL_STACK_SIZE=130`，表达式为 260 个 `StackType_t` 栈深度。业务任务的栈大小和优先级是 `app_tasks.h` 中的 `TASK_*` 宏，不要与 Timer Service Task 混为一谈。
- `timers.c` 的 `DaemonTaskMessage_t` 同时承载定时器命令和（启用 `INCLUDE_xTimerPendFunctionCall` 时）挂起回调请求；`xTimerQueue` 的容量受 `configTIMER_QUEUE_LENGTH` 限制。`xTimerGenericCommand()`、`xTimerPendFunctionCallFromISR()` 都返回发送结果，调用方若忽略失败，才是需要记录的审计点。
- `prvTimerTask()` 在自己的循环中等待下一个到期时间或命令，随后清空命令队列；`prvProcessExpiredTimer()` 和命令处理路径直接调用回调。因此一个长时间运行或阻塞的回调会占用 Timer Service Task，并可能推迟其他定时器和命令。这是内核机制推导的风险，不是当前工程已发生的故障。
- `timers.c` 同时保留静态/动态创建分支；本工程显式开启 `configSUPPORT_DYNAMIC_ALLOCATION=1`，审计具体内存路径时仍要以最终预处理后的 `configSUPPORT_STATIC_ALLOCATION` 为准。

## A1 — 当前工程应用与源码事实（Application）

### 业务周期实现矩阵

以下是源码中可定位到的实现；“周期”是代码/文档标称值，不等于实测 start-to-start 周期。

| 任务/上下文 | 标称节拍 | 代码路径 | 优先级 / 栈深度 |
|---|---:|---|---:|
| `KeyScanTask` | 10 ms | `delay_ms(10)` | 4 / 64 |
| `SensorTask` | 500 ms | `delay_ms(500)` | 3 / 128 |
| `WindSpeedTask` | 100 ms | `delay_ms(100)` | 3 / 64 |
| `MotorControlTask` | 50 ms | `delay_ms(50)` | 5 / 256 |
| `UIDisplayTask` | 200 ms | `delay_ms(200)` | 1 / 256 |
| `AntiBackflowTask` | 100 ms | `delay_ms(100)` | 2 / 64 |
| `SpeedCalcTask` | TIM4 信号触发 | `xSemaphoreTake(g_speedCalcSemaphore, portMAX_DELAY)` | 6 / 128 |
| `IAPTask`（`ifopen` 开启时） | DMA 信号触发 | `g_iapSemaphore` 二值信号量 | 7 / 256 |

依据：`APP_TASK/app_tasks.c` 的各任务函数、`StartTask()`、`SpeedCalcTask()`、`TIM4_IRQHandler()`，以及 `APP_TASK/app_tasks.h` 的 `TASK_*_PRIORITY`/`TASK_*_STK_SIZE` 宏。

### 软件定时器是否真的被业务使用

当前工程事实必须这样写：

- `configUSE_TIMERS=1` 只表示软件定时器功能启用，并使内核在启动调度器时创建名为 `Tmr Svc` 的 Timer Service Task；它不等于业务创建了定时器。
- 对业务源码（排除 `FreeRTOS` 内核实现、头文件 API 声明和示例）搜索，没有发现 `xTimerCreate()` 作为业务周期实现；也没有发现业务 `TimerHandle_t`/回调注册链。
- `app_tasks.c` 的实际常驻周期代码是 `delay_ms()`；测速是 TIM4 ISR 给 `g_speedCalcSemaphore` 后由 `SpeedCalcTask` 消费。不要在报告中杜撰一个不存在的 `TimerCallback`。

### TIM4→SpeedCalcTask 链路

`System_Init()` 先创建 `g_speedCalcSemaphore`，`StartTask()` 在临界区内创建业务任务后调用 `TIM4_init(5-1, 14400-1)`，退出临界区，再删除启动任务。`motor.c` 的 `TIM4_init()` 配置更新中断和 NVIC 数字优先级 5；ISR 实现在 `app_tasks.c`，清标志、`xSemaphoreGiveFromISR()`、按需让出 CPU。`SpeedCalcTask` 被唤醒后读取编码器并调用 `get_speed(encoderCount, 50)`。

`get_speed()` 内部用 `sp_count` 计数，条件满足时才计算一次速度；源码注释把参数 50 解释为 50 ms，资料描述为“约每 50 次调用”。因此应写成“约每 50 次有效消费/调用计算”，不能把每个 TIM4 中断都等同于一次新的 RPM 结果。

### 配置、内核和业务层的边界

- `configTICK_RATE_HZ=1000` 是系统 tick 配置；`delay_init()` 用它设置 `fac_ms=1000/configTICK_RATE_HZ`，当前配置下为 1 ms 的节拍单位。
- Timer Service Task 的优先级、栈深度和命令队列长度来自 `FreeRTOSConfig.h`，其等待/命令/回调行为来自 `timers.c`；它们不是业务任务表中的某个任务。
- 业务优先级/栈深度来自 `app_tasks.h`，实际创建发生在 `app_tasks.c` 的 `StartTask()`。`xTaskCreate()` 返回值在当前代码中没有被检查，内存不足或创建失败需作为审计项核实。

## A2 — 触发边界与协作分工（Anticipated Trigger）

1. `rtos-task-and-isr-design`：处理通用的任务拆分、优先级、阻塞、互斥量、ISR 最小化和共享状态原则。本 Skill 只在问题聚焦“周期/超时机制如何选、Timer Service Task 如何串行执行、delay 周期怎样审计、TIM4 事件是否会合并/丢失、初始化顺序如何验证”时主导；不要重复完整的任务/ISR 教程。
2. `stm32-clock-and-sampling-timing`：处理 HSE/PLL/APB/定时器时钟、SysTick 实际频率、ADC 采样时间和公式核对。本 Skill 只把当前工程的 tick/TIM4 作为已配置的时间源来审计行为；若核心问题是“TIM4 为什么不是 1 ms”“72 MHz/APB 计算是否正确”，转交该 Skill，不在这里重做时钟公式。
3. `rtos-communication-debugging`：处理已经出现的 UART/DMA/事件链故障、任务永久等待、通知没有到达或共享状态不一致。本 Skill 可指出二值信号量、Timer 命令队列和初始化顺序的可疑检查点；若用户已有“中断已进但任务没醒”等故障证据，组合或转交该 Skill 做现象驱动排障。
4. `rtos-motor-pid-control`：处理编码器、RPM、PWM、误差、PID 饱和与调参。本 Skill 只核对 `SpeedCalcTask` 的触发节拍、消费语义和 `get_speed()` 调用频率；若用户问“电机震荡/怎么调 Kp Ki Kd”，转交该 Skill。

## E — 可执行的选择与源码审计流程（Execution）

### Step 1：固定问题和证据等级

记录目标周期、允许的最迟响应、是否必须逐事件保留、回调/任务最坏执行时间、是否需要独立栈和优先级、启动时机。把“配置/注释”“源码控制流”“运行测量”分别标为不同证据，禁止用前一层替代后一层。

### Step 2：先做实现存在性搜索

在业务源码中分别搜索 `xTimerCreate`、`xTimerStart`、`TimerHandle_t`、`delay_ms`、`vTaskDelayUntil`、`TIM4_IRQHandler`、`xSemaphoreGiveFromISR` 和 `xSemaphoreTake`；同时单独检查 `FreeRTOS/timers.c`，避免把内核 API 定义或文档示例误判成业务调用。先输出“启用但未使用 / 已使用”的事实。

### Step 3：重建软件定时器路径

核对 `configUSE_TIMERS`、Timer Service Task 名称/优先级/栈、`configTIMER_QUEUE_LENGTH`，再沿 `xTimerGenericCommand()` → `xTimerQueue` → `prvTimerTask()` → 过期回调跟踪。确认每个创建、启动、停止、改周期和挂起回调调用都检查返回值；队列满时记录 `pdFAIL`，不要假定命令一定到达。检查回调运行时间、是否阻塞、是否把大段业务工作直接放进共享回调上下文。

### Step 4：审计 delay-based 周期

对每个 `while(1)` 记录“工作开始、工作结束、调用 delay、下一次工作开始”。当前模式是工作结束后再 `delay_ms(period)`，所以应区分：

- **周期漂移风险**：工作时间和调度延迟会叠加到下一轮起点；这是机制上的可诊断风险，不是源码已证明的异常。
- **执行超时风险**：若一次工作时间接近或超过标称周期，测量 start-to-start、执行时长和阻塞时长；不要仅看 `delay_ms(50)` 就宣布有 50 ms 固定周期。
- **替代方案**：若需求是固定相位周期，评估 `vTaskDelayUntil()`；若任务执行超过周期，记录其“本轮不再等待/错过节拍”的实际语义，再决定是否需要跳过、补算或改成事件模型。

### Step 5：审计 TIM4 ISR→任务语义

核对 `System_Init()` 创建信号量、`StartTask()` 创建任务并最后启用 TIM4 的顺序；确认 TIM4 更新标志清除、`xSemaphoreGiveFromISR()` 返回值、`xHigherPriorityTaskWoken` 和任务实际 `xSemaphoreTake()` 次数。重点检查：

- 二值信号量容量为 1；任务尚未消费时再次中断，`give` 可能失败，多个中断可能合并为一次唤醒。当前 ISR 忽略 `xSemaphoreGiveFromISR()` 返回值，因此这是“需计数/测量的风险点”，不是“已丢信号”的结论。
- 比较 ISR 计数、成功 give 计数、任务唤醒/消费计数和计算完成计数；再比较任务一次计算的最长执行时间与中断间隔。
- `get_speed(..., 50)` 的内部计数和信号合并会共同影响有效计算间隔；报告中分别写“硬件触发间隔”和“任务实际消费/计算间隔”。

### Step 6：检查资源和初始化闭环

列出 Timer Service Task、业务任务、队列、信号量和回调/任务栈的创建点及失败返回值。当前配置还应记录：`configCHECK_FOR_STACK_OVERFLOW=0`、`configGENERATE_RUN_TIME_STATS=0`；这表示源码没有启用相应的内核检测/统计证据，不表示栈或负载一定正常。对现有任务，核对 `app_tasks.h` 的栈/优先级与 `app_tasks.c` 的创建参数；对软件定时器，核对 `configTIMER_*` 与 `timers.c` 的实际使用。

### Step 7：输出选择结论

采用固定格式：

1. **当前实现**：指出实际路径和符号。
2. **为什么匹配/不匹配**：对照周期、截止时间、逐事件要求、执行时长和上下文。
3. **源码证据**：给出文件、函数/宏和短摘录。
4. **待验证风险**：只列可观测的漂移、超时、队列满、信号合并/丢失、栈/优先级和初始化顺序风险。
5. **最小验证**：指定计数器、时间戳、返回值或栈水位；没有测量就明确写“未证实”。

## B — 边界、风险与禁止推断（Boundary）

- `configUSE_TIMERS=1` ≠ 业务使用软件定时器；本工程业务源码未发现 `xTimerCreate()` 周期调用。
- `configTICK_RATE_HZ=1000` 和文档中的“1 ms”是配置/推导事实；不在本 Skill 内替代 `stm32-clock-and-sampling-timing` 做时钟树或实测频率证明。
- `delay_ms()` 任务的标称周期不是 start-to-start 实测周期；漂移和执行超时必须通过时间戳和执行时长确认。
- TIM4 的二值信号量路径并不保证每个更新中断都对应一次任务计算；信号丢失或合并是待验证的容量/消费速度风险，不能直接宣称故障。
- Timer Service Task 的回调共享一个任务上下文；回调长或阻塞可能推迟其他定时器，但当前工程没有业务回调可供宣称已经发生该问题。
- 命令队列长度为 5 是配置事实；队列是否实际满、命令是否发送失败，必须检查 API 返回值或运行计数。
- 初始化顺序只说明当前代码先创建 `g_speedCalcSemaphore` 再启用 TIM4；不能据此断言所有变体、复位路径或未来重构都安全。
- 任务优先级/栈宏和 Timer Service 配置是静态事实，不等于满足实时性或栈裕量；当前关闭栈溢出检测与运行时间统计会限制诊断证据。
- 不把该 Skill 扩写成通用任务/ISR 原则、STM32 时钟公式、通信故障全链路或 PID 调参教程；按 A2 转交相邻 Skill。

## 相关 Skills

- `rtos-task-and-isr-design`：通用任务、优先级、阻塞和 ISR 设计。
- `stm32-clock-and-sampling-timing`：时钟树、SysTick/TIM 频率和采样时序核对。
- `rtos-communication-debugging`：已有通信/事件通知故障的证据链排障。
- `rtos-motor-pid-control`：编码器、RPM、PWM 和 PID 闭环。
