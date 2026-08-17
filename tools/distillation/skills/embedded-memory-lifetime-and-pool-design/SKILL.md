---
name: embedded-memory-lifetime-and-pool-design
description: "Use when an embedded C or RTOS design must choose static, stack, heap, or pool storage, or when malloc/free, ownership, fragmentation, allocation failure, task-stack allocation, or long-running memory stability is in question. Trigger phrases include “内存池怎么设计”, “嵌入式内存碎片”, “malloc/free 会不会出问题”, “任务栈用静态还是动态”, and “内存泄漏怎么查”. Do not use for C++ RAII and copy/move semantics as the primary topic; use embedded-cpp-resource-lifetime."
metadata:
  source_book: 嵌入式核心资料集与 STM32 + FreeRTOS 项目资料
  source_files:
    - projects/嵌入式八股/糯叽叽八股/01 C语言.md
    - projects/嵌入式八股/糯叽叽八股/02 C++.md
    - projects/嵌入式八股/糯叽叽八股/07 FreeRTOS.md
    - projects/嵌入式八股/3. 杂七杂八/7. 嵌入式系统开发，必知的10个内存管理策略.md
    - projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h
    - projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
  source_symbols: [malloc, free, pvPortMalloc, vPortFree, xTaskCreate, xTaskCreateStatic, configSUPPORT_DYNAMIC_ALLOCATION, configTOTAL_HEAP_SIZE, Memory Pool]
  source_kind: tutorial_methodology_plus_project_memory_configuration
  tags: [embedded, memory, ownership, fragmentation, realtime, freertos]
  related_skills: embedded-cpp-resource-lifetime, rtos-freertos-config-and-boot, rtos-runtime-fault-diagnosis, linux-buddy-fragmentation-diagnosis
---

# 嵌入式内存生命周期与内存池设计

## Overview

这个 Skill 把“该把数据放在哪里、谁拥有它、何时释放、如何证明长期稳定”转成一个可执行的嵌入式内存决策流程。它同时覆盖 C 的动态内存风险、固定块内存池和 FreeRTOS 的动态/静态任务分配，但不会把资料中的教程建议误写成当前项目已经具备的能力。

## R — 来源摘录（Reading）

> 函数内申请的堆内存不会随函数结束自动释放，必须明确谁申请、谁释放；失败路径也要释放已申请的内存。
>
> — `projects/嵌入式八股/糯叽叽八股/01 C语言.md`，1.17、1.28

> 频繁、大小不一的 `malloc/free` 会造成空闲空间不连续；内存池通过预分配和固定块复用，使分配时间和容量更可控。
>
> — `projects/嵌入式八股/糯叽叽八股/01 C语言.md`，1.29–1.30；`projects/嵌入式八股/3. 杂七杂八/7. 嵌入式系统开发，必知的10个内存管理策略.md`

> 动态任务由 FreeRTOS 从堆中申请 TCB 和任务栈；静态任务由应用提供栈缓冲区和 TCB，不依赖 FreeRTOS 堆。
>
> — `projects/嵌入式八股/糯叽叽八股/07 FreeRTOS.md`，任务创建与静态分配章节

项目配置还需要单独核对：当前工程的 `FreeRTOSConfig.h` 启用动态分配并配置 `configTOTAL_HEAP_SIZE`，工程中存在 `heap_4.c`。这只能证明构建配置和分配器选择，不能证明系统已经做过长期碎片压力测试，也不能证明实现了自定义内存池。

## I — 方法论解释（Interpretation）

把内存问题拆成五个相互约束的维度：

- **生命周期**：对象是启动后一直存在、任务周期内存在，还是一次事务/消息期间存在。
- **所有权**：明确创建者、使用者、释放者和转移点；接口返回指针时必须说明调用方责任。
- **上下文**：初始化、普通任务和 ISR 对可阻塞性、执行时间和并发安全性的要求不同。
- **分配形态**：固定大小、高频复用适合池；大小不定且低频的对象才有理由使用堆；永久对象优先静态区；短暂小对象可放栈，但要核对栈余量。
- **可验证性**：记录申请/释放计数、失败次数、最大占用、最小剩余堆和任务栈水位，而不是只看一次“申请成功”。

内存池不是“免费消除所有碎片”：固定块池通常降低外部碎片和分配时间，但会产生块内浪费、容量上限和并发访问问题。要先选择块大小、池容量、空闲块管理方式和耗尽策略，再讨论性能。

### 代码与平台事实核对

| 位置/符号 | 实际职责 | 文档与代码是否一致 | 依赖与限制 |
|---|---|---|---|
| `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h` / `configTOTAL_HEAP_SIZE` | 配置 FreeRTOS 动态堆容量与动态分配开关 | 以当前编译配置为准；不能替代 map/运行时数据 | 依赖该工程的 FreeRTOS 版本和链接布局 |
| `projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c` / `pvPortMalloc`、`vPortFree` | 提供 FreeRTOS 堆分配实现 | 文件存在证明分配器来源，不证明每条路径无泄漏 | 依赖 FreeRTOS heap_4 实现；实时上界需实测 |
| `projects/RTOS项目/源码/APP_TASK/app_tasks.c` / `xTaskCreate` | 创建项目任务并由 FreeRTOS 动态申请任务资源 | 应与配置和返回值检查一起核对 | 依赖 `configSUPPORT_DYNAMIC_ALLOCATION` 与堆余量 |
| `01 C语言.md`、`07 FreeRTOS.md` 中的 `xTaskCreateStatic` 示例 | 解释静态任务分配接口 | 是教程示例，不等于当前项目已采用 | 需要调用方提供 `StackType_t` 和 `StaticTask_t` 缓冲区 |

## A1 — 资料中的应用（Past Application）

1. **C 函数传出堆对象**：资料示例用返回指针传出 `malloc` 结果，并要求调用者释放；失败路径不能遗留已分配块。
2. **长时间运行与碎片规避**：资料建议减少大小不一的动态分配，改用静态对象、固定块和集中释放策略。这里是知识资料中的工程建议，不是某个已测量的用户项目结果。
3. **RTOS 任务内存选择**：资料对比 `xTaskCreate` 与 `xTaskCreateStatic`；当前 RTOS 工程的配置和 `heap_4.c` 可作为“动态分配链路”的源码核对入口，但仓库没有自定义内存池实现证据。

## A2 — 触发场景（Anticipated Trigger）

当用户提出以下问题时触发：

- “嵌入式系统应该用静态内存、malloc 还是内存池？”
- “运行几天后 malloc 失败，但剩余内存看着不少，怎么查？”
- “这个任务用 `xTaskCreate` 还是 `xTaskCreateStatic`？”
- “内存泄漏、悬空指针、双重释放和碎片怎么区分？”
- “内存池固定块大小和耗尽策略怎么设计？”

如果问题主要是 C++ 的 RAII、拷贝/移动、智能指针或容器迭代器失效，优先转 `embedded-cpp-resource-lifetime`；如果是当前 RTOS 的启动、任务栈水位或 HardFault 现场，分别组合 `rtos-freertos-config-and-boot` 或 `rtos-runtime-fault-diagnosis`。

## E — 可执行流程（Execution）

1. **画生命周期表**：列出对象/缓冲区、创建时机、最后使用点、释放点、所有者和跨任务/ISR 传递方式。若释放点写不出来，先不选堆。
2. **分类上下文**：标记是否在 ISR、实时任务、初始化或后台任务中申请/归还；ISR 中不调用普通 `malloc/free`，除非平台明确提供可证明安全且有界的专用机制。
3. **按形态选存储**：永久配置用静态/只读区；函数内短生命周期且尺寸可控的对象用栈；固定大小、高频、需要确定性响应的对象用池；只有在尺寸/生命周期确实不固定且能接受运行时失败时才用堆。
4. **定义所有权协议**：为每个返回指针、消息缓冲区和对象写“谁创建/谁释放/是否转移/失败谁回收”；释放后清理所有仍可见的别名。
5. **审计申请与释放**：检查正常路径、提前返回、超时、取消、任务删除和模块卸载；C 代码至少成对检查 `malloc/free`，FreeRTOS 代码还要核对任务、队列、信号量的创建失败返回值。
6. **验证长期行为**：做重复申请/归还、随机尺寸、池耗尽、并发争用和最坏栈深度测试；记录峰值、最小余量、失败次数和恢复策略。没有这些数据，只能说“设计上降低风险”。

## B — 边界与风险（Boundary）

- 内存池能减少外部碎片和不确定搜索，但可能浪费块内空间、固定容量并引入锁/并发问题；不能无条件宣称“无碎片”。
- `xTaskCreate` 的动态任务分配、`heap_4.c` 的存在和 `configTOTAL_HEAP_SIZE` 的数值，不等于项目做过内存压力测试或具备故障恢复。
- 任务栈大小的单位、栈水位和启动文件 MSP 栈属于具体 FreeRTOS/工具链配置；需要与 `rtos-freertos-config-and-boot` 联合核对，不能只凭一个宏名推断。
- `free(p); p = NULL` 只能清理当前指针，不能自动修复其他别名、越界写或所有权混乱。
- 资料中的“内存池通常 O(1)”是典型固定块设计的目标；实际实现若有锁、搜索、临界区或多个尺寸等级，最坏时间必须重新测量。
- 本 Skill 没有证据证明用户已经在项目中实现了自定义内存池；面试表达应说“资料提出/工程可采用”，不要说“项目已经使用”。

## 相关 Skills

- `embedded-cpp-resource-lifetime`：C++ 对象、RAII、智能指针、拷贝/移动和容器失效。
- `rtos-freertos-config-and-boot`：当前 STM32F103 工程的 FreeRTOS 堆、任务栈和启动配置。
- `rtos-runtime-fault-diagnosis`：HardFault、栈溢出、malloc 失败和运行时现场。
- `linux-buddy-fragmentation-diagnosis`：Linux 物理页级伙伴系统碎片，不等同于 MCU 堆碎片。

## 审计信息

- 三重验证：V1 ✓（C、FreeRTOS、内存策略文章与当前工程分配配置）；V2 ✓（可从症状反推存储形态和验证动作）；V3 ✓（把所有权、上下文、确定性和碎片取舍组合成决策流程）。
- 代码职责：见 frontmatter 的 `source_symbols` 与“代码与平台事实核对”；教程示例和当前项目事实已分开。
- 测试：静态盲测 6/6，见 `test-prompts.json` 与 `test-results.md`。
