---
name: rtos-task-and-isr-design
description: Use when the user is designing or explaining STM32/FreeRTOS tasks, priorities, blocking, mutexes, binary semaphores, interrupt-to-task handoff, or shared-state protection, or when an RTOS task is delayed, starved, stuck, or crashes. Trigger phrases include “FreeRTOS 任务怎么划分”, “中断里能不能做计算”, “任务卡死”, “FromISR”, “task scheduling”. Do not use for generic Linux process scheduling or a pure PID tuning question.
source_book: STM32 + FreeRTOS 油烟机控制系统项目
source_chapter: projects/RTOS项目/文档/2-3；RTOS项目复习文档.md
tags: [stm32, freertos, rtos, interrupt, debugging]
related_skills: rtos-communication-debugging, rtos-motor-pid-control, rtos-project-storytelling
---

# FreeRTOS 任务与 ISR 设计

## R — 原文

> TIM4/DMA 中断只清标志、释放信号量，复杂处理放到任务里；周期任务通过延时或阻塞主动让出 CPU。
>
> — `projects/RTOS项目/RTOS项目复习文档.md`

## I — 方法论骨架

按时间约束拆任务：稳定周期的工作做周期任务，硬件事件驱动的工作让任务阻塞等待通知。共享状态由互斥量保护；信号量传递“有事件”，不保存业务数据。ISR 只做清标志、采样最小信息、发送 FromISR 通知和必要的切换请求；复杂计算、格式化和业务决策放在任务上下文。任务优先级要依据响应时限、执行长度和阻塞关系，而不是功能听起来重要不重要。

## A1 — 资料中的应用

- `app_tasks.c` 创建 KeyScan、Sensor、WindSpeed、Motor、UI、AntiBF、SpeedCalc 和 IAP 任务。
- `TIM4_IRQHandler()` 通过 `xSemaphoreGiveFromISR` 唤醒 `SpeedCalcTask`，测速计算留在任务中。
- `g_systemState` 由多个任务访问，`g_dataMutex` 保护共享读写。

## A2 — 触发场景

1. 需要划分 FreeRTOS 任务、设置优先级或判断周期/事件模型。
2. 中断里计算太多、任务被饿死、系统偶发卡死或共享状态异常。
3. 面试中被追问 `xSemaphoreTake`、`FromISR`、临界区和调度切换。

语言信号： “任务怎么拆”、“ISR 里能不能直接算速度”、“为什么用二值信号量”、“FreeRTOS 任务不运行”。

## E — 可执行步骤

1. 列出每个功能的周期、最坏执行时间、响应期限、共享资源和事件源；完成标准是得到任务/ISR 责任表。
2. 将周期工作改为阻塞/延时任务，将硬件事件改为 ISR→FromISR→阻塞任务；完成标准是 ISR 没有长循环、打印、浮点或复杂业务。
3. 检查优先级、栈、临界区、`configMAX_SYSCALL_INTERRUPT_PRIORITY` 和句柄初始化顺序；完成标准是能解释每个高优先级任务为何不会长期占用 CPU。
4. 若仍异常，转交 `rtos-communication-debugging` 做现象驱动排查。

## B — 边界

- 互斥量保护数据，不等于传递数据；二值信号量通知事件，不等于消息队列。
- FromISR API 的优先级约束依赖 FreeRTOS 配置和 Cortex-M NVIC 规则。
- 任务拆分不是越多越好；栈、上下文切换和共享状态复杂度都要计入。

## 相关 Skills

- `rtos-communication-debugging`：从故障现象检查通信与同步。
- `rtos-motor-pid-control`：处理闭环控制的数据链。
- `rtos-project-storytelling`：把设计选择组织为项目回答。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
