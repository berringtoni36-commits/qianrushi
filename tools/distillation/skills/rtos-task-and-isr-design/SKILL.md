---
name: rtos-task-and-isr-design
description: "Use when the user is designing or explaining STM32/FreeRTOS tasks, priorities, blocking, mutexes, binary semaphores, interrupt-to-task handoff, or shared-state protection, or when an RTOS task is delayed, starved, stuck, or crashes. Trigger phrases include “FreeRTOS 任务怎么划分”, “中断里能不能做计算”, “任务卡死”, “FromISR”, “task scheduling”. Do not use for generic Linux process scheduling or a pure PID tuning question."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/2 系统架构与设计/2.1 三层架构：驱动层、RTOS中间层、应用层.md
    - projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md
    - projects/RTOS项目/文档/2 系统架构与设计/2.4 任务间通信：互斥信号量与全局状态管理.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.2 任务创建、调度与优先级设计.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.3 中断优先级配置与临界区保护.md
    - projects/RTOS项目/RTOS项目复习文档.md
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/USER/stm32f10x_it.c
    - projects/RTOS项目/源码/FreeRTOS/tasks.c
  source_chapter: projects/RTOS项目/文档/2-3；RTOS项目复习文档.md
  source_symbols: [xTaskCreate, vTaskDelay, vTaskDelayUntil, xSemaphoreTake, xSemaphoreGiveFromISR, portYIELD_FROM_ISR, g_dataMutex, g_systemState, SystemState_t, System_GetState, System_SwitchMode, MotorControlTask, UIDisplayTask, AntiBackflowTask, TIM4_IRQHandler, DMA1_Channel5_IRQHandler, configMAX_SYSCALL_INTERRUPT_PRIORITY, TASK_MOTOR_PRIORITY, TASK_MOTOR_STK_SIZE]
  tags: [stm32, freertos, rtos, interrupt, debugging]
  related_skills: rtos-communication-debugging, rtos-motor-pid-control, rtos-project-storytelling
---

# FreeRTOS 任务与 ISR 设计

## R — 原文

> TIM4/DMA 中断只清标志、释放信号量，复杂处理放到任务里；周期任务通过延时或阻塞主动让出 CPU。
>
> — `projects/RTOS项目/RTOS项目复习文档.md`

## I — 方法论骨架

按时间约束拆任务：稳定周期的工作做周期任务，硬件事件驱动的工作让任务阻塞等待通知。共享状态应有明确的保护合同；不能因为存在一个互斥量就宣布所有字段访问都安全。信号量传递“有事件”，不保存业务数据。ISR 只做清标志、采样最小信息、发送 FromISR 通知和必要的切换请求；复杂计算、格式化和业务决策放在任务上下文。任务优先级要依据响应时限、执行长度和阻塞关系，而不是功能听起来重要不重要。

## A1 — 资料中的应用

- `app_tasks.c` 创建 KeyScan、Sensor、WindSpeed、Motor、UI、AntiBF、SpeedCalc 和 IAP 任务。
- `TIM4_IRQHandler()` 通过 `xSemaphoreGiveFromISR` 唤醒 `SpeedCalcTask`，测速计算留在任务中。
- `SensorTask`、`WindSpeedTask` 和 `System_Switch*` 辅助函数的部分访问显式获取 `g_dataMutex`；但 `MotorControlTask`、`UIDisplayTask`、`AntiBackflowTask` 仍有直接读写 `g_systemState` 的路径，`System_GetState()` 还返回裸指针。这里应区分“设计意图”和“当前源码覆盖范围”。

## A2 — 触发场景

1. 需要划分 FreeRTOS 任务、设置优先级或判断周期/事件模型。
2. 中断里计算太多、任务被饿死、系统偶发卡死或共享状态异常。
3. 面试中被追问 `xSemaphoreTake`、`FromISR`、临界区和调度切换。

语言信号： “任务怎么拆”、“ISR 里能不能直接算速度”、“为什么用二值信号量”、“FreeRTOS 任务不运行”。

## E — 可执行步骤

1. 列出每个功能的周期、最坏执行时间、响应期限、共享资源和事件源；完成标准是得到任务/ISR 责任表。
2. 将周期工作改为阻塞/延时任务，将硬件事件改为 ISR→FromISR→阻塞任务；完成标准是 ISR 没有长循环、打印、浮点或复杂业务。
3. 对每个共享字段建立“读者/写者—锁或消息—读改写范围—一致性要求”表。把 `g_systemState` 的直接访问、`System_GetState()` 裸指针和多字段快照单独标记；完成标准是没有用“字段通常是 32 位”替代同步证明。
4. 需要一致快照时，在短锁区复制必要字段，释放锁后做 LCD、printf、Flash 或控制计算；需要表达事件或命令时使用队列/通知，而不是把二值信号量当数据容器。不要在持锁期间调用可能阻塞的外设或等待另一个对象。
5. 检查优先级、栈、临界区、`configMAX_SYSCALL_INTERRUPT_PRIORITY` 和句柄初始化顺序；完成标准是能解释每个高优先级任务为何不会长期占用 CPU，并能区分任务级互斥与 ISR 级屏蔽。
6. 若仍异常，转交 `rtos-communication-debugging` 做事件链排查，或转交 `rtos-runtime-fault-diagnosis` 做现场隔离。

## B — 边界

- 互斥量保护数据，不等于传递数据；二值信号量通知事件，不等于消息队列。
- FromISR API 的优先级约束依赖 FreeRTOS 配置和 Cortex-M NVIC 规则。
- 任务拆分不是越多越好；栈、上下文切换和共享状态复杂度都要计入。
- 当前项目没有把 `g_systemState` 声明为 `volatile`，但补上 `volatile` 也不会提供互斥、原子读改写、字段间快照一致性或通用内存屏障；必须按实际上下文和数据宽度选择锁、原子操作、临界区或消息协议。
- `taskENTER_CRITICAL()` 在本项目 Cortex-M3 port 中通过 BASEPRI 管理可屏蔽中断，不能替代任务间互斥，也不能包住阻塞调用；它只适合很短的不可抢占区。
- `MotorControlTask`、`UIDisplayTask` 和 `AntiBackflowTask` 的无锁路径是当前源码事实，不应包装成“已经完整线程安全”；修复建议与现状必须分开写。

## 相关 Skills

- `rtos-communication-debugging`：从故障现象检查通信与同步。
- `rtos-runtime-fault-diagnosis`：当无锁读写、锁顺序或句柄生命周期已经表现为崩溃、卡死或数据损坏时定位现场。
- `rtos-auto-mode-state-machine`：自动/防回流状态机的共享状态和模式动作冲突。
- `rtos-display-buzzer-feedback`：UI 快照、显示时序和反馈消费者的具体边界。
- `rtos-motor-pid-control`：处理闭环控制的数据链。
- `rtos-project-storytelling`：把设计选择组织为项目回答。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
