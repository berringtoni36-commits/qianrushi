---
name: rtos-runtime-fault-diagnosis
description: "Use when an STM32/FreeRTOS system HardFaults, resets, freezes, starves a task, overflows a task stack, fails dynamic allocation, deadlocks, or behaves incorrectly after initialization. Trigger phrases include “STM32 一运行就 HardFault”, “FreeRTOS 栈溢出”, “任务突然不调度”, “优先级反转”, “初始化后卡死”, “中断优先级导致崩溃”. Do not use for a purely conceptual FreeRTOS boot explanation or a standalone UART/DMA event-chain question; combine with rtos-freertos-config-and-boot or rtos-communication-debugging as needed."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md
    - projects/RTOS项目/文档/2 系统架构与设计/2.4 任务间通信：互斥信号量与全局状态管理.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.1 FreeRTOS 移植与配置详解.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.2 任务创建、调度与优先级设计.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.3 中断优先级配置与临界区保护.md
    - projects/RTOS项目/源码/USER/stm32f10x_it.c
    - projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s
    - projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h
    - projects/RTOS项目/源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c
    - projects/RTOS项目/源码/FreeRTOS/tasks.c
    - projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
    - projects/RTOS项目/源码/USER/project.uvprojx
  source_symbols: [HardFault_Handler, MemManage_Handler, BusFault_Handler, UsageFault_Handler, configASSERT, vAssertCalled, configCHECK_FOR_STACK_OVERFLOW, configUSE_MALLOC_FAILED_HOOK, vApplicationStackOverflowHook, vApplicationMallocFailedHook, prvTaskExitError, vPortValidateInterruptPriority, g_dataMutex, g_systemState, xTaskCreate, xSemaphoreTake, xSemaphoreGive]
  source_chapter: projects/RTOS项目/文档/2.3-2.4；3.1-3.3
  tags: [stm32, freertos, hardfault, stack-overflow, deadlock, priority-inversion, diagnosis]
  related_skills: rtos-freertos-config-and-boot, rtos-task-and-isr-design, rtos-communication-debugging, rtos-project-storytelling
---

# STM32 + FreeRTOS 运行时故障诊断

## R — 来源摘录（Reading）

> 当前工程的 `HardFault_Handler`、`MemManage_Handler`、`BusFault_Handler` 和 `UsageFault_Handler` 都是进入无限循环；源码没有保存异常栈帧、打印 PC/LR 或自动复位的实现。
>
> — `projects/RTOS项目/源码/USER/stm32f10x_it.c`

> `configCHECK_FOR_STACK_OVERFLOW=0`、`configUSE_MALLOC_FAILED_HOOK=0`；任务/内存故障钩子当前没有被配置为运行时捕获入口。
>
> — `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h`、`projects/RTOS项目/源码/FreeRTOS/tasks.c`、`projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c`

> `TIM4_init()` 必须在 `g_speedCalcSemaphore` 和 `SpeedCalcTask` 创建后调用；否则中断可能先释放空句柄。
>
> — `projects/RTOS项目/源码/APP_TASK/app_tasks.c`、`projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md`

## I — 方法论解释（Interpretation）

不要把“HardFault”当作根因，它只是 CPU/异常向量报告的最后一层。先保存现场，再把故障按发生阶段切开：

1. **启动前/调度器前**：启动文件、时钟、向量表、栈、外设寄存器和初始化顺序。
2. **调度器刚接管**：SysTick/PendSV/SVC 映射、`SystemCoreClock`/tick reload、任务入口是否返回、任务栈和动态堆。
3. **任务运行一段时间后**：栈越界、数组/指针、浮点/格式化开销、阻塞和锁顺序、共享状态竞态。
4. **中断发生时**：IRQ 优先级是否允许调用 RTOS API、是否错误地在 ISR 使用普通 API、是否清标志/重入/访问空句柄。

运行时诊断的核心是“最后一个有证据的节点”，而不是先改优先级或盲目加 delay。每个假设都要给出可观察证据：异常栈里的 PC/LR/PSR，当前任务名，栈高水位，堆剩余量，IRQ 优先级，句柄值，锁持有者和复现条件。项目中 `g_dataMutex` 只对部分读写路径形成保护；如果某任务直接访问 `g_systemState`，不能因为存在互斥量就宣布整个结构线程安全。

优先级反转和死锁要分开：优先级反转是调度响应变差，互斥量的优先级继承可能缓解它；死锁是循环等待/永不释放，继承不能消除锁顺序错误。当前诊断应同时审查锁覆盖、持有时长、阻塞 API、任务优先级和资源创建顺序。

## A1 — 资料中的应用（Past Application）

- `System_Init()` 创建 `g_dataMutex`、`g_speedCalcSemaphore`，条件编译时创建 `g_iapSemaphore`；`StartTask()` 后续创建任务并初始化 TIM4。这个顺序是项目中实际的空句柄/早期 ISR 风险控制点。
- `FreeRTOSConfig.h` 定义了 `configASSERT`，但 `vAssertCalled` 只是 `printf`；因此发生 IRQ 优先级非法、临界区计数异常等断言时，输出本身不能替代停机现场。
- `port.c` 的 `prvTaskExitError()` 对错误返回的任务进入死循环；`vPortValidateInterruptPriority()` 在启用断言时检查调用 FreeRTOS API 的中断优先级。
- `HardFault_Handler()` 等异常处理函数仅 `while(1)`；当前源码并不提供可直接用于事后定位的寄存器转储。
- `AntiBackflowTask()` 和部分电机/状态路径存在直接读写共享系统状态的代码；文档中“共享状态由互斥量保护”的设计意图必须和当前函数实际锁覆盖范围分开审计。

## A2 — 未来触发场景（Anticipated Trigger）

当用户说“上电就 HardFault”“启动调度器后死机”“运行几分钟后复位”“某个任务偶尔不再运行”“怀疑栈溢出/堆不够”“高优先级任务卡住”“优先级反转或死锁”“中断一来就崩”时触发。

若现象明确是“DMA/定时器中断已进但任务未醒”，组合 `rtos-communication-debugging`；若用户只问启动链和配置含义，转 `rtos-freertos-config-and-boot`；若需要面试表达，最后组合 `rtos-project-storytelling`。

## E — 可执行步骤（Execution）

1. **先固定现场**：记录复位类型、是否可稳定复现、最后一条串口/LED 事件、当前 IRQ、任务名和输入条件；禁止先在异常处理里加入阻塞打印。
2. **拿到异常上下文**：在调试器停在 fault handler 时读取 MSP/PSP、`SCB->CFSR/HFSR/SHCSR/BFAR/MMFAR`、R0–R3、R12、LR、PC、xPSR；若没有异常栈转储，先增加最小汇编包装器或用调试器查看栈，再谈源代码行号。PC 是第一优先定位点，LR 用于回看调用链。
3. **按 PC/LR 分类**：PC 落在任务函数/库函数时查越界、栈和指针；落在 ISR/FreeRTOS port 时查 FromISR/API、优先级和句柄；落在 Flash/外设寄存器访问时查地址、时钟和初始化顺序；PC 无效或返回地址破坏时优先查栈/内存破坏。
4. **核对调度器前置条件**：确认 `System_Init()` 已成功创建所有同步对象，所有 `xTaskCreate()` 返回值已检查，定时器/中断不会早于句柄创建，`vTaskStartScheduler()` 使用的 port 与向量表映射一致。
5. **核对任务栈和堆**：开发构建把 `configCHECK_FOR_STACK_OVERFLOW` 临时设为 1 或 2 并实现 `vApplicationStackOverflowHook()`；打开 malloc 失败钩子；用 `uxTaskGetStackHighWaterMark()` 和 heap 统计记录峰值。注意本项目当前两个钩子均关闭，不能用“没有回调”排除故障。
6. **核对 IRQ 合规性**：列出所有调用 RTOS API 的 ISR，确认使用 `xSemaphoreGiveFromISR` 等 ISR-safe API，确认库优先级不高于 FreeRTOS 可管理边界，并确认 `portYIELD_FROM_ISR()` 的使用条件。普通 `xSemaphoreGive`、`vTaskDelay`、阻塞锁 API 不可从 ISR 调用。
7. **核对锁与共享状态**：画每个任务对 `g_systemState` 的读写表；检查是否在锁内做 DHT11 阻塞、LCD、printf 或 Flash 擦写；统一锁顺序，避免持锁后永久等待另一个对象；对直接读写路径做快照/原子性审查。
8. **二分回归**：只保留启动心跳→单个任务→单个 ISR→外设→业务链路，逐层恢复；每次只改变一个变量，并保留可重放输入和构建版本。
9. **修复后验证**：冷启动、热复位、最长任务周期、突发中断、堆接近上限、异常输入和断点暂停都要覆盖；记录“没有复现”与“已证明修复”的差别。

## B — 边界与风险（Boundary）

- 当前 `HardFault_Handler` 只有死循环；本 Skill 提供的是现场采集方案，不声称仓库已经实现 fault frame 保存或自动复位。
- 当前栈溢出和 malloc 失败检测关闭；开启钩子是建议性的诊断改动，不是当前项目事实，也不应在没有用户授权时修改原始源码。
- `configASSERT` 的 `printf` 可能依赖 USART 已初始化并可能阻塞；它不能证明断言位置、异常原因或现场数据完整。
- 文档中的“使用互斥量避免优先级反转”是设计意图；是否每条真实读写路径都拿锁必须以函数代码为准。
- Cortex-M fault 寄存器、调试器命令和 ABI 栈帧会随芯片、编译器和异常入口变体变化；实际工程应以当前启动文件、编译器手册和芯片参考手册核对。
- 本 Skill 不能替代电气测量、看门狗复位记录、J-Link/SWD 调试或硬件复现。

## 相关 Skills

- `rtos-freertos-config-and-boot`：启动、port、tick、配置和前置条件。
- `rtos-task-and-isr-design`：任务边界、阻塞、同步和 ISR 责任。
- `rtos-communication-debugging`：具体 DMA/中断/信号量事件链。
- `rtos-project-storytelling`：把真实故障整理成面试项目故事。

## 审计信息

- 三重验证：V1 ✓（故障文档、FreeRTOS 配置/port、异常处理和应用代码）；V2 ✓（可迁移到“任务不运行/初始化死机/IRQ 崩溃/栈耗尽”等新现象）；V3 ✓（强调现场证据和当前缺失的诊断设施，而非泛泛列举异常名词）。
- 当前最重要的项目边界：异常 handler 只停机，栈/堆钩子关闭，共享状态锁覆盖不完整，启动顺序存在可验证的句柄前置条件。
