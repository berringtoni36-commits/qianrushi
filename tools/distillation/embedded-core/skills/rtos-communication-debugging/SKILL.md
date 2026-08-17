---
name: rtos-communication-debugging
description: Use when an STM32/FreeRTOS communication or event path fails: UART/DMA data is missing or corrupted, an ISR notification is lost, a task waits forever, or shared state is inconsistent. Trigger phrases include “串口收不到”, “DMA 完成但任务没反应”, “信号量卡住”, “FreeRTOS 通信排查”. Do not use for choosing a new bus or tuning a motor PID loop.
source_book: STM32 + FreeRTOS 油烟机控制系统项目
source_chapter: projects/RTOS项目/文档/2.4、3.3、5.3
tags: [stm32, freertos, dma, uart, debugging]
related_skills: rtos-task-and-isr-design, embedded-bus-selection
---

# RTOS 通信与事件链排障

## R — 原文

> 任务间通过共享状态和互斥量协作；TIM4/DMA 中断通过二值信号量通知任务，ISR 只做快速通知。
>
> — `projects/RTOS项目/RTOS项目复习文档.md`

## I — 方法论骨架

把“收不到数据”拆成硬件、电气、外设、DMA/中断、RTOS 通知、任务消费和业务状态七段。每段都要有可观察证据：引脚波形、寄存器标志、DMA 计数、中断进入次数、信号量句柄、任务状态和缓冲区内容。先确定数据在哪一段消失，再修复最小环节。共享状态异常则检查锁的覆盖范围、读写原子性和信号量是否被误当作数据容器。

## A1 — 资料中的应用

- IAP 链路是 PC 固件→USART1/DMA→中断释放 `g_iapSemaphore`→`iap_task` 校验 CRC32→写 Flash/跳转。
- 测速链路是 TIM4 周期中断→`g_speedCalcSemaphore`→`SpeedCalcTask`→读取编码器→更新 RPM。

## A2 — 触发场景

1. 串口、DMA、定时器或 GPIO 事件没有到达任务。
2. 任务永久阻塞、信号量句柄为空或共享状态偶发错乱。
3. 用户需要逐层排查 RTOS 中断通信。

语言信号： “DMA 完成中断触发了但任务没醒”、“串口乱码”、“为什么信号量一直拿不到”、“共享变量偶发错误”。

## E — 可执行步骤

1. 画出源→外设→DMA→ISR→FromISR→同步对象→任务→业务字段的链路，并给每一段加日志/计数器；完成标准是定位最后一个有证据的节点。
2. 检查波特率/电平/帧格式、DMA 通道、清中断顺序、NVIC 优先级、句柄初始化、缓冲区生命周期和缓存一致性；完成标准是每项有寄存器、波形或代码证据。
3. 检查任务是否真的阻塞在目标对象、对象是否被清空/重复消费、锁是否覆盖了完整读写；完成标准是能复现并缩小到一处状态转移。
4. 修复后分别验证空载、连续事件、突发事件和错误帧；若问题是协议选型，转交 `embedded-bus-selection`。

## B — 边界

- 不要把“中断进入”当作“任务已正确消费”。
- 不要在 ISR 中打印或做复杂格式化来代替低扰动观测。
- DMA、Cache 和内存屏障细节依赖具体 Cortex-M/ARM Linux 平台，需查手册。

## 相关 Skills

- `rtos-task-and-isr-design`：设计阶段决定任务/ISR 责任边界。
- `embedded-bus-selection`：重新选择通信链路时使用。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
