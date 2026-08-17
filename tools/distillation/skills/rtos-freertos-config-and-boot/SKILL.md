---
name: rtos-freertos-config-and-boot
description: "Use when the user needs to explain, review, or debug the STM32F103 + FreeRTOS configuration and boot chain, including Reset_Handler, SystemInit, main initialization order, scheduler startup, SysTick/PendSV/SVC, interrupt priority thresholds, software timers, heap selection, or task-stack units. Trigger phrases include “FreeRTOS 是怎么启动的”, “SysTick/PendSV/SVC 分别做什么”, “任务栈大小是字节还是字”, “调度器启动后不跑”. Do not use for a runtime symptom that requires a fault-isolation workflow; combine with rtos-runtime-fault-diagnosis."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.1 FreeRTOS 移植与配置详解.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.2 任务创建、调度与优先级设计.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.3 中断优先级配置与临界区保护.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.4 软件定时器与周期任务实现.md
    - projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s
    - projects/RTOS项目/源码/USER/system_stm32f10x.c
    - projects/RTOS项目/源码/USER/main.c
    - projects/RTOS项目/源码/SYSTEM/delay/delay.c
    - projects/RTOS项目/源码/USER/stm32f10x_it.c
    - projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h
    - projects/RTOS项目/源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c
    - projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
    - projects/RTOS项目/源码/USER/project.uvprojx
  source_symbols: [Reset_Handler, SystemInit, main, Hardware_Init, System_Init, StartTask, vTaskStartScheduler, vPortSetupTimerInterrupt, xPortSysTickHandler, xPortPendSVHandler, vPortSVCHandler, configTICK_RATE_HZ, configMAX_SYSCALL_INTERRUPT_PRIORITY, configTOTAL_HEAP_SIZE, configCHECK_FOR_STACK_OVERFLOW, xTaskCreate]
  source_chapter: projects/RTOS项目/文档/2.3；3.1-3.4
  tags: [stm32, cortex-m3, freertos, boot-chain, scheduler, systick, pendsv, svc]
  related_skills: rtos-task-and-isr-design, rtos-runtime-fault-diagnosis, rtos-communication-debugging, rtos-project-storytelling
---

# FreeRTOS 配置与启动链

## R — 来源摘录（Reading）

> 当前工程的启动顺序是复位启动文件 → `SystemInit()` → C 库入口 → `main()`；`main()` 先做硬件初始化，再执行 `System_Init()`、`StartTask_Create()`，最后调用 `vTaskStartScheduler()`。
>
> — `projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md`、`projects/RTOS项目/源码/USER/main.c`

> 工程采用 FreeRTOS V9.0.0 的 RVDS/ARM_CM3 移植；`configTICK_RATE_HZ=1000`，`configTOTAL_HEAP_SIZE=10*1024`，任务栈宏按 FreeRTOS 的 `StackType_t` 单位配置。
>
> — `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h`、`projects/RTOS项目/源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c`

## I — 方法论解释（Interpretation）

把“FreeRTOS 启动”拆成三条必须闭合的链：

1. **CPU/工具链链**：启动汇编提供初始 MSP 和复位向量，`Reset_Handler` 调 `SystemInit()`，再跳到 ARM C 库 `__main`；`.data`、`.bss`、堆栈准备好后才进入 `main()`。
2. **应用初始化链**：`Hardware_Init()` 配好时钟相关外设、GPIO、PWM、编码器、传感器、LCD 和 USART；`System_Init()` 初始化 `g_systemState` 并创建互斥量/二值信号量；`StartTask_Create()` 只先创建 `StartTask`。
3. **内核接管链**：`vTaskStartScheduler()` 创建空闲任务/软件定时器服务任务，Cortex-M3 port 配置 SysTick 并把调度切换放到 PendSV；SVC 负责启动第一个任务，SysTick 推进 tick，PendSV 保存/恢复上下文。

配置审计要同时看“宏值”和“实际被工程编译的文件”。本工程启用抢占、时间片、任务通知、互斥量、软件定时器、`heap_4.c` 和 FreeRTOS 感知调试；关闭 tickless、协程、运行时统计、栈溢出钩子和 malloc 失败钩子。`configASSERT` 虽然存在，但当前 `vAssertCalled` 只 `printf`，不能把它当成可靠的停机和现场保存机制。

中断优先级要按 Cortex-M 的数值语义检查：数值越小越高。本工程使用 `NVIC_PriorityGroup_4`，库优先级阈值为 3；调用 FreeRTOS `FromISR` API 的中断必须处于可调用范围（本项目 DMA=4、TIM4=5），SysTick/PendSV 由 port 设为内核低优先级。不要把 `delay_init()` 里对 SysTick 的配置和 `vPortSetupTimerInterrupt()` 的最终内核配置混为两套独立节拍；要核对调用时机和是否重复初始化。

## A1 — 资料中的应用（Past Application）

- `main()` 的实际链路是 `Hardware_Init()` → `System_Init()` → `StartTask_Create()` → `vTaskStartScheduler()`。
- `StartTask()` 在临界区内创建 KeyScan、Sensor、WindSpeed、Motor、UI、AntiBF、SpeedCalc 以及条件编译的 IAP 任务，然后调用 `TIM4_init()`，最后删除自身；因此会先创建 `g_speedCalcSemaphore`，再启动会释放它的测速定时器。
- `FreeRTOSConfig.h` 将任务栈宏定义为 `64/128/256` 等数值；这些是 words，不是 bytes。启动汇编另有 1KB 裸机 MSP 栈和 512B heap 区，不能和 FreeRTOS 动态堆、任务栈概念混为一谈。
- `configMAX_SYSCALL_INTERRUPT_PRIORITY` 由库优先级 3 左移得到；`port.c` 的 `xPortSysTickHandler()` 只推进 tick 并挂起 PendSV，`xPortPendSVHandler()` 保存/切换/恢复任务上下文。

## A2 — 未来触发场景（Anticipated Trigger）

当用户问“FreeRTOS 启动后为什么任务不跑”“SysTick/PendSV/SVC 如何配合”“任务栈 128 到底是多少”“移植 FreeRTOS 要检查什么”“软件定时器回调为什么不执行”“中断优先级 3/4 能不能调用 API”时触发。

若用户已经报告 HardFault、复位、栈溢出、内存申请失败或初始化后卡死，组合 `rtos-runtime-fault-diagnosis`；若问题是 ISR 到任务的具体事件丢失，组合 `rtos-communication-debugging`；若目的是面试讲项目，组合 `rtos-project-storytelling`。

## E — 可执行步骤（Execution）

1. **锁定编译变体**：确认芯片、启动文件（本工程文档指向 `startup_stm32f10x_md.s`）、编译器、FreeRTOS port、内存管理实现和链接地址；不要仅看 `FreeRTOS/portable` 目录里存在的其他 port 文件。
2. **画启动时间线**：逐项标出 Reset_Handler、SystemInit、`__main`、main、硬件初始化、同步对象创建、任务创建、调度器启动、StartTask 和 TIM4 启动；完成标准是每个 API 的前置条件都有来源。
3. **核对 tick**：检查 `configTICK_RATE_HZ`、`SystemCoreClock`、SysTick 时钟源和 reload 值；确认 `SysTick_Handler` 在调度器未启动时不会调用内核，启动后调用 `xPortSysTickHandler()`。
4. **核对上下文切换**：确认 `xPortPendSVHandler`/`vPortSVCHandler` 映射到向量表，PendSV/SysTick 的优先级低于业务中断，且没有自定义 handler 把 FreeRTOS port 覆盖掉。
5. **核对优先级边界**：列出每个会调用 `FromISR` API 的 IRQ 的库优先级；数值小于 3 的 ISR 不得调用 FreeRTOS API。若项目文档和芯片库对“高/低”用词冲突，以寄存器配置和 port 断言规则为准。
6. **核对内存和栈**：用 map 文件核对 `configTOTAL_HEAP_SIZE`、所有 `xTaskCreate` 申请、定时器任务栈和启动文件 RAM 区；将栈数值换算成 `sizeof(StackType_t)` 字节，并检查每次创建返回值。
7. **核对软件定时器**：确认 `configUSE_TIMERS=1`、服务任务优先级/队列长度/栈深度足够；回调里不做长时间阻塞，周期任务的实际周期要用 tick 或时间戳验证，不能只相信注释。
8. **做最小运行验证**：先只保留一个 LED/串口心跳任务，再逐个加入外设和业务任务；观察 SysTick 计数、任务状态、空闲任务和服务任务，最后恢复完整系统。

## B — 边界与风险（Boundary）

- 这里解释的是仓库中的 STM32F103/Cortex-M3/FreeRTOS V9.0.0 变体，不是所有 FreeRTOS 版本或 Cortex-M port 的通用结论。
- 文档中“初始化完成”“任务栈充足”和“编译通过”不是硬件运行实测；当前仓库没有一份独立的真实调度时序测量报告。
- `configCHECK_FOR_STACK_OVERFLOW=0` 与 `configUSE_MALLOC_FAILED_HOOK=0` 是当前事实，不能说项目已经具备栈/堆故障自动捕获。
- `configASSERT` 当前只输出文本；串口未初始化、ISR 中打印或输出阻塞时，断言信息可能丢失或改变时序。
- `delay_ms()` 在调度器运行后会调用 `vTaskDelay()`，小于一个 tick 的余数仍忙等；不要把所有 delay 都当成可抢占阻塞。
- 若用户要定位实际崩溃现场，必须转入 `rtos-runtime-fault-diagnosis`，本 Skill 不凭启动图猜根因。

## 相关 Skills

- `rtos-task-and-isr-design`：任务/ISR 责任、阻塞和同步对象设计。
- `rtos-runtime-fault-diagnosis`：HardFault、栈、堆、初始化和 IRQ 现场隔离。
- `rtos-communication-debugging`：DMA/中断/信号量到任务的事件链。
- `rtos-project-storytelling`：把配置和启动链组织成面试回答。

## 审计信息

- 三重验证：V1 ✓（配置、移植、启动文档和源码）；V2 ✓（可推导“不启动/任务不运行/服务任务饿死”等新问题的检查路径）；V3 ✓（把宏配置、向量映射、初始化顺序和实际源文件连接起来，不是 API 定义堆砌）。
- 当前事实重点：FreeRTOSConfig、Cortex-M3 port、启动文件、main 和 app_tasks 必须作为一个版本整体核对。
