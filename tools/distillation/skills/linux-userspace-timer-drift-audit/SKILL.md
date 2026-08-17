---
name: linux-userspace-timer-drift-audit
description: "Use when choosing or auditing Linux userspace periodic mechanisms such as timer_create/timer_settime, timerfd, clock_nanosleep, TIMER_ABSTIME, epoll integration, callback blocking, expiration overruns, or accumulated drift. Trigger phrases include Linux 周期任务漂移, timerfd + epoll, POSIX timer callback, absolute versus relative sleep, or timer overrun. Do not use for FreeRTOS software timers or STM32 clock-tree/ADC timing."
metadata:
  source_files:
    - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
    - projects/嵌入式八股/2. 小林图解/图解系统/09｜网络系统篇/9.2 I／O 多路复用：select／poll／epoll.md
    - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
    - archive/大丙Linux教程/第4章 套接字通信/09 IO多路转接（复用）之epoll.md
  source_symbols:
    - timer_create
    - timer_settime
    - timerfd_create
    - timerfd_settime
    - clock_nanosleep
    - TIMER_ABSTIME
    - epoll_wait
    - SIGEV_THREAD
    - itimerspec
    - expiration count
  related_skills:
    - linux-socket-multiplexing-design
    - rtos-software-timer-periodic-design
    - stm32-clock-and-sampling-timing
---

# Linux 用户态周期任务与定时器漂移审计

## 来源证据

source_files:
  - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
  - projects/嵌入式八股/2. 小林图解/图解系统/09｜网络系统篇/9.2 I／O 多路复用：select／poll／epoll.md
  - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
  - archive/大丙Linux教程/第4章 套接字通信/09 IO多路转接（复用）之epoll.md

source_symbols:
  - timer_create
  - timer_settime
  - timerfd_create
  - timerfd_settime
  - clock_nanosleep
  - TIMER_ABSTIME
  - epoll_wait
  - SIGEV_THREAD
  - itimerspec
  - expiration count

## R — 来源摘录与事实

- 资料将 timer_create/timer_settime 作为 POSIX 程序内定时器，将 timerfd_create/timerfd_settime 作为可读 fd，并将 timerfd 与 epoll 组合。
- clock_nanosleep 配合 TIMER_ABSTIME 以绝对时间推进下一次执行，可避免相对 sleep 循环的累计误差。
- timerfd read 返回到期次数，能暴露周期任务被延迟时发生的 overrun；回调或任务执行时间过长会影响下一周期。

## I — 方法论解释

定时器选择先看消费模型，再看精度：单线程阻塞循环可用绝对时间 sleep；事件循环应把 timerfd 当 fd 纳入 epoll；异步回调需要审计回调线程、并发、重入和执行超时。周期定义必须明确是固定相位还是“任务完成后再延迟”。

相对 sleep 的常见漂移来自执行时间和调度延迟被重复加到下一周期；绝对 deadline 把下一次目标锚定在时间轴上。若任务赶不上周期，必须决定跳过、合并、补执行或降频，不能静默堆积。

## A1 — 资料中的应用

- 资料给出 timer_create + SIGEV_THREAD、timerfd + epoll 和 clock_nanosleep + TIMER_ABSTIME 三种方案。
- epoll 资料强调 epoll_wait 返回就绪 fd，不代表业务消息已经完整消费；timerfd 同样要 read 取出到期计数。
- 资料把周期任务的执行时间、阻塞 I/O、实时调度和漂移监控列为设计要点。

## A2 — 未来触发场景

- 用户说 Linux 周期任务越跑越慢、偶发连续触发、回调重入或 epoll 中定时事件丢失。
- 用户要在 sleep 循环、POSIX timer、timerfd、epoll 之间做选择。
- 用户需要解释绝对时间/相对时间、overrun、执行超时和周期相位。

## E — 可执行审计流程

1. 写出时间合同：时钟源、首次延迟、周期、相位、允许抖动、执行上限和 overrun 策略。
2. 根据消费模型选机制：简单单线程用绝对 deadline；事件驱动用 timerfd + epoll；回调模式审计线程与异步信号安全。
3. 记录每次 deadline、实际开始/结束时间、延迟、执行时长和 expiration count；区分调度抖动、执行超时和系统时间跳变。
4. 检查读取 timerfd 的 8 字节计数、epoll 返回后的消费循环、EINTR/EAGAIN、关闭和销毁顺序。
5. 负载测试让任务执行时间接近或超过周期，明确选择跳过、合并、补执行或报警，并验证长期漂移。

## B — 边界与风险

- 用户态高精度不等于硬实时；调度器、CPU 频率、抢占、负载和时钟源都会影响结果。
- POSIX timer、timerfd 和 clock_nanosleep 的具体行为必须以目标 Linux、libc 和 man page 为准。
- 不与 rtos-software-timer-periodic-design 混用；FreeRTOS tick、Timer Service Task 和 ISR 边界不同。
- 不与 stm32-clock-and-sampling-timing 混用；STM32 外设时钟和 ADC 采样属于硬件时序链。

## 相关 Skills

- linux-socket-multiplexing-design：epoll 事件消费、短读和背压。
- rtos-software-timer-periodic-design：FreeRTOS 周期机制。
- stm32-clock-and-sampling-timing：STM32 时钟和采样时序。
