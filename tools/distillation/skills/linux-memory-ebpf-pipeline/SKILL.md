---
name: linux-memory-ebpf-pipeline
description: "Use when the user needs to explain or trace the Linux physical-memory-fragmentation monitor from Python/BCC startup through eBPF load/attach, kernel probes, BPF maps, and terminal output. Trigger phrases include “eBPF 项目运行链路”, “BCC 做了什么”, “从 Python 到内核”, “物理内存碎片项目怎么讲”. Do not use for generic eBPF definitions without this project’s source context."
metadata:
  source_book: Linux 物理内存碎片检测项目
  source_files:
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.1 核心技术架构/3.1.1 eBPF与BCC技术栈.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.1 核心技术架构/3.1.2 内核态eBPF程序设计.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.1 核心技术架构/3.1.3 用户态Python架构.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.3 eBPF程序深度解析/3.3.1 tracepoint探针机制.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.3 eBPF程序深度解析/3.3.2 kprobe动态插桩技术.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.3 eBPF程序深度解析/3.3.3 BPF map通信机制.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.5 用户态展示与优化/3.5.1 curses终端可视化实现.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.5 用户态展示与优化/3.5.2 性能优化与采样控制.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.5 用户态展示与优化/3.5.3 数据解析与格式化输出.md
    - projects/Linux物理内存检测项目/源码/exfrag.py
    - projects/Linux物理内存检测项目/源码/exfrag_user.py
    - projects/Linux物理内存检测项目/源码/extfraginfo.c
    - projects/Linux物理内存检测项目/源码/fraginfo.c
  source_symbols: [BPF, TRACEPOINT_PROBE, kprobe__get_page_from_freelist, counts_map, zone_map, last_time_map]
  tags: [linux, ebpf, bcc, observability, project]
  related_skills: linux-memory-source-audit, linux-buddy-fragmentation-diagnosis, embedded-interview-layered-answer
---

# eBPF 物理内存检测运行链路

## R — 原文

> BCC 负责把用户态 Python、内核态 eBPF、BPF Map 和探针挂载连接起来，用户态再读取 Map 做格式化与展示。
>
> — `projects/Linux物理内存检测项目/文档/3 深入理解/3.1 核心技术架构/3.1.1 eBPF与BCC技术栈.md`

## I — 方法论骨架

运行链路分为加载、挂载、触发、聚合、读取和展示。`exfrag.py` 调用 BCC 的 `BPF(src_file=...)`，BCC 编译并通过 `bpf()` 加载程序；tracepoint 或 kprobe 建立内核事件挂点；事件发生时 eBPF 更新 `counts_map`、`zone_map` 等 Map；Python 遍历 Map、转换数据并交给 TUI。加载成功不等于已经有数据，必须单独验证挂点触发和 Map 更新。

## A1 — 资料中的应用

- `extfraginfo.c` 使用 `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)` 统计 PID 相关事件。
- `fraginfo.c` 使用 `kprobe__get_page_from_freelist` 遍历 zone/order 并更新状态 Map。
- `exfrag.py` 通过 `self.b["zone_map"]` 和 `self.b["counts_map"]` 读取内核数据。

## A2 — 触发场景

用户要解释 eBPF 项目全链路、BCC 作用、程序为何加载后无数据、Map 如何通信或如何准备该项目的面试回答。

## E — 可执行步骤

1. 标出用户态入口、BPF 源文件、探针类型、Map 名称和展示入口；完成标准是画出端到端箭头。
2. 分别验证编译/加载、attach、事件触发、Map 更新、用户态读取和刷新；完成标准是每段都有日志、计数或命令证据。
3. 对照源码确认文档没有把封装层能力夸大；如果出现节流、内核版本或字段读取问题，转交审计 Skill。

## B — 边界

- BCC 是框架，不等于 eBPF 本身；不使用 BCC 仍可用 libbpf/CO-RE 等方案。
- 读取内核结构体字段依赖内核版本和布局，安全 helper 不会消除语义兼容风险。
- 不能把 TUI 刷新频率当成内核采样频率。

## 相关 Skills

- `linux-memory-source-audit`：核查设计意图与源码实际行为。
- `linux-buddy-fragmentation-diagnosis`：解释 zone/order 与碎片指标。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
