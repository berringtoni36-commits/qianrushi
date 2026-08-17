# Q012 事实核对与来源记录

## 原题来源

- 原始笔记：2. 嵌入式高频八股150题/01 C-C++基础（1-25题）.md
- 对应章节：第 12 题：什么是内存泄漏？如何避免？
- 原文核心句：申请了内存没释放，就叫内存泄漏；长时间运行的嵌入式设备会逐渐死机。

## 语义核对

1. 视频采用工程上的实用定义：动态存储已经申请成功，但程序丢失了到该存储的有效所有权或可达路径，因而无法释放，形成泄漏。
2. 提前 return、错误分支遗漏和容器只增不删都可能让申请成功的内存无法回收；修复重点是每条路径都释放或明确转移所有权。
3. shared_ptr 的循环引用会让两个对象互相保留 strong reference，外部 owner 消失后引用计数仍可能不归零；weak_ptr 用于不拥有对象的观察关系，可以打破循环。
4. RAII、unique_ptr 和 make_unique 能把资源释放绑定到对象生命周期，但不能自动修复错误的所有权设计，也不能消除所有动态内存风险。
5. Valgrind 和 AddressSanitizer 是 Linux 常用的动态分析工具；视频把它们描述为定位线索和证据，不把工具使用说成语言保证。
6. FreeRTOS 的 xPortGetFreeHeapSize() 可以报告当前可用堆空间；连续记录它可以观察趋势，但单次快照不能单独证明不存在泄漏，也不能完整反映碎片。
7. 静态分配和固定块内存池是嵌入式工程策略，能减少通用堆带来的泄漏、碎片和长期运行不确定性，但仍需要边界和所有权管理。

## 原文需要收紧的表述

- “申请了内存没释放”在视频中补充为“所有权丢失且变得不可达”，避免把暂时延迟释放、明确转移所有权误判为泄漏。
- FreeRTOS 监控部分明确“趋势是线索，不是单次证明”，避免把 xPortGetFreeHeapSize() 当成完整泄漏检测器。

## 标准检索关键词

- C++ memory leak ownership
- C++ shared_ptr cyclic reference weak_ptr
- C++ RAII unique_ptr
- Valgrind leak check AddressSanitizer
- FreeRTOS xPortGetFreeHeapSize

## 复核日期

2026-08-17
