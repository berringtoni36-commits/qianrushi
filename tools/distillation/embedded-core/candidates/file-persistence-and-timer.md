# 候选组：Linux 用户态文件持久化与周期任务时序

本候选组拆成两个原子 Skill：

1. linux-file-persistence-crash-consistency：Page Cache、writeback、fflush、fsync/fdatasync、原子替换和故障模型。
2. linux-userspace-timer-drift-audit：POSIX timer、timerfd、epoll、clock_nanosleep、绝对 deadline 和 overrun。

## 来源

- projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.1 文件系统全家桶.md
- projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.2 进程写文件时，进程发生了崩溃，已写入的数据会丢失吗？.md
- projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
- projects/嵌入式八股/2. 小林图解/图解系统/09｜网络系统篇/9.2 I／O 多路复用：select／poll／epoll.md
- projects/嵌入式八股/糯叽叽八股/05 计算机网络.md

## 三重验证

- V1：文件系统章节与 Linux 应用笔记交叉支撑持久化；timer API、epoll 和网络/IO 资料交叉支撑周期设计。
- V2：可解释掉电后文件状态、kill -9、定时器漂移、overrun、回调阻塞和 epoll 消费问题。
- V3：两个 Skill 分别处理持久化承诺和用户态时间合同，和虚拟内存回收、RTOS 定时器、STM32 外设时钟不重复。
