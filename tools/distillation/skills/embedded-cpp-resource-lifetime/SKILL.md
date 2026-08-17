---
name: embedded-cpp-resource-lifetime
description: "Use when embedded C++ code involves RAII, constructors/destructors, ownership, smart pointers, copy/move behavior, container lifetime, iterator invalidation, or choosing C++ abstractions under firmware resource constraints. Trigger phrases include “嵌入式 C++ RAII”, “unique_ptr 能不能用”, “拷贝和移动怎么查”, “vector 迭代器失效”, and “对象析构顺序”. Do not use for a C-only malloc/pool policy without C++ object semantics; use embedded-memory-lifetime-and-pool-design."
metadata:
  source_book: 嵌入式核心资料集
  source_files:
    - projects/嵌入式八股/糯叽叽八股/01 C语言.md
    - projects/嵌入式八股/糯叽叽八股/02 C++.md
    - projects/嵌入式八股/糯叽叽八股/03 STL与容器.md
  source_symbols: [RAII, constructor, destructor, copy constructor, move constructor, unique_ptr, shared_ptr, weak_ptr, vector, iterator]
  source_kind: tutorial_methodology
  tags: [embedded, cpp, raii, ownership, stl, lifetime]
  related_skills: embedded-memory-lifetime-and-pool-design, embedded-interview-layered-answer, rtos-runtime-fault-diagnosis
---

# 嵌入式 C++ 资源与对象生命周期

## Overview

这个 Skill 用“资源所有权—对象生命周期—移动/拷贝—容器失效—平台成本”分析嵌入式 C++ 代码。它帮助用户把 RAII 和智能指针讲成可审计的资源管理策略，而不是把“用了 C++”自动等同于安全或零开销。

## R — 来源摘录（Reading）

> `new` 会调用构造函数，`delete` 会调用析构函数；`malloc/free` 只负责原始内存，二者不能混用。
>
> — `projects/嵌入式八股/糯叽叽八股/02 C++.md`，2.8

> 智能指针通过对象离开作用域时自动释放资源来降低泄漏风险，但循环引用、所有权误用和嵌入式运行时开销仍需处理。
>
> — `projects/嵌入式八股/糯叽叽八股/02 C++.md`，2.20

> 拷贝通常复制资源/值，移动通常转移资源并使源对象处于有效但未指定的状态；容器扩容和插入可能使引用、指针或迭代器失效。
>
> — `projects/嵌入式八股/糯叽叽八股/02 C++.md`，2.18–2.19；`projects/嵌入式八股/糯叽叽八股/03 STL与容器.md`

## I — 方法论解释（Interpretation）

分析一个嵌入式 C++ 对象，先问它管理的到底是什么资源：堆内存、文件描述符、锁、DMA 缓冲区、外设句柄还是纯值。再确定所有权模型：唯一拥有用值语义或 `unique_ptr`，共享拥有才考虑 `shared_ptr`，观察关系用裸指针/引用但不负责释放，环状关系用 `weak_ptr` 或显式生命周期协议。

RAII 的核心不是“自动回收所有东西”，而是把资源获取绑定到构造、释放绑定到析构，并保证异常/提前返回路径具有对称清理。嵌入式场景还要额外检查：是否允许动态分配、析构是否可能阻塞、是否在 ISR/临界区调用、代码体积和 RTTI/异常配置、原子引用计数和控制块开销、对齐与 DMA 可访问性。

拷贝/移动审计要沿资源句柄走：拷贝后是否双重释放，移动后源对象是否仍被使用，析构是否虚拟，赋值失败时是否保持不变式。容器审计要先查操作是否触发重新分配，再查迭代器/引用/指针的有效性；“看起来地址没变”不能替代标准和实现文档。

## A1 — 资料中的应用（Past Application）

1. `02 C++.md` 以构造/析构、拷贝构造、移动构造和智能指针组织资源生命周期知识；这些是教程和面试素材，不是仓库中某个完整 C++ 固件项目的实测实现。
2. `01 C语言.md` 将 C 的所有权、堆对象传出、释放后置空、失败路径和内存池作为对照，帮助判断 C++ RAII 解决了哪一层问题。
3. `03 STL与容器.md` 提供容器操作与迭代器失效的核对入口；在嵌入式项目中若使用 `vector` 或自定义 allocator，必须回到目标标准库、容量策略和实时约束验证。

## A2 — 触发场景（Anticipated Trigger）

当用户说以下内容时触发：

- “嵌入式里能用 `unique_ptr`/`shared_ptr` 吗？”
- “这个类的析构为什么没释放/为什么 double free？”
- “拷贝构造和移动构造会怎样影响 DMA buffer/句柄？”
- “`vector` 扩容后指针、引用、迭代器还能用吗？”
- “如何把 C 接口包装成 RAII？”

如果问题只涉及 C 的 `malloc/free`、固定块池或 RTOS 堆容量，优先使用 `embedded-memory-lifetime-and-pool-design`；如果已经发生 HardFault、栈溢出或运行时复位，组合 `rtos-runtime-fault-diagnosis`。

## E — 可执行流程（Execution）

1. **列资源清单**：为每个成员标出资源类型、创建点、释放点、所有者、是否可复制/移动以及所在上下文。
2. **画状态转移**：至少覆盖构造成功、构造失败、移动后、拷贝后、赋值失败、析构和异常/提前返回；对“有效但未指定”的 moved-from 对象不能继续使用其资源值。
3. **选择语义**：优先值成员和明确的 `unique_ptr`；只有确有共享所有权时才用 `shared_ptr`；观察者不拥有资源。禁止用裸指针注释“约定释放”替代接口契约。
4. **检查配对规则**：`new/delete`、`new[]/delete[]`、C API 的专用释放函数、文件/锁/DMA 的 acquire/release 必须配对；不能用 `free` 释放 `new`，也不能让析构在 ISR 中执行不可接受的工作。
5. **核对容器稳定性**：查 `reserve`、扩容、插入、删除、`erase` 和迭代器保存点；若地址稳定性是接口要求，使用明确的存储策略并做目标库验证。
6. **量化嵌入式代价**：检查异常/RTTI、代码体积、堆分配、控制块、锁和最坏执行时间；用 map、静态分析、栈水位和目标板测试验证，而不是凭“现代 C++”标签下结论。

## B — 边界与风险（Boundary）

- RAII 只管理被正确封装的资源；它不自动修复底层 API 的失败语义、DMA cache 一致性、硬件复位顺序或数据竞争。
- `shared_ptr` 不是默认的“更安全指针”：引用计数和控制块可能需要动态内存，循环引用会泄漏，实时性和代码体积需要平台评估。
- 移动对象通常仍可析构和重新赋值，但其值/资源状态由类型约定决定；不能假设 moved-from 对象保持原值。
- 容器的失效规则取决于具体操作和标准库实现；不要把一个实现的地址观察结果推广成语言保证。
- 本仓库这些来源主要是八股和教程，没有对应完整 C++ 固件源码可证明用户已经在产品中采用某个智能指针架构。
- 不把“没有手写 `delete`”直接写成“没有泄漏”，还要查循环引用、外部资源、所有权逃逸和释放失败。

## 相关 Skills

- `embedded-memory-lifetime-and-pool-design`：C/RTOS 的存储形态、所有权和内存池决策。
- `embedded-interview-layered-answer`：将对象模型组织成定义→机制→项目边界的面试回答。
- `rtos-runtime-fault-diagnosis`：把生命周期缺陷与 HardFault、复位和栈堆现场连接起来。

## 审计信息

- 三重验证：V1 ✓（C、C++、STL 三个主题来源）；V2 ✓（可从 double free、失效迭代器和 DMA 资源边界推导新问题）；V3 ✓（围绕所有权与嵌入式成本组织，不是 API 定义列表）。
- 来源性质：教程/面试方法论；没有把通用 C++ 知识冒充仓库项目实现。
- 测试：静态盲测 6/6，见 `test-prompts.json` 与 `test-results.md`。
