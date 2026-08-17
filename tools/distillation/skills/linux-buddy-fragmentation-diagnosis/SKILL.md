---
name: linux-buddy-fragmentation-diagnosis
description: "Use when the user wants to analyze Linux physical-page fragmentation, buddy allocator order/zone/node data, extfrag or unusable-free indexes, or why a high-order allocation fails despite enough total free memory. Trigger phrases include “伙伴系统”, “高阶页分配失败”, “物理内存碎片”, “extfrag_index”, “buddyinfo”. Do not use for SLUB object fragmentation or generic virtual-memory explanations."
metadata:
  source_book: Linux 物理内存碎片检测项目
  source_files:
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.1 Linux物理内存与伙伴系统.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.2 内存碎片化问题分析.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.3 内存分配快速路径监控.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.2 内存状态统计方法.md
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.3 碎片化指数计算算法.md
    - projects/Linux物理内存检测项目/源码/fraginfo.c
  source_symbols: [struct zone, free_area, fill_contig_page_info, unusable_free_index, __fragmentation_index, order, buddyinfo]
  tags: [linux, memory, buddy, fragmentation]
  related_skills: linux-memory-ebpf-pipeline, linux-memory-source-audit
---

# Linux 伙伴系统与外部碎片诊断

## R — 原文

> 伙伴系统按 order 组织连续物理页；项目按 node、zone、order 统计空闲页、空闲块和可满足请求的块。
>
> — `projects/Linux物理内存检测项目/文档/3.2.1 Linux物理内存与伙伴系统.md`

## I — 方法论骨架

总空闲页多不代表高阶连续页足够。伙伴系统把连续页按 `2^order` 组织到空闲链表；高阶分配需要一块连续区域。诊断必须固定 node、zone 和目标 order，比较 `free_pages`、总块数、可满足块数以及指标的时间趋势。外部碎片关注页能否连续，SLUB 关注小对象缓存，二者层级不同。单一指数只能提示风险，不能单独证明根因。

## A1 — 资料中的应用

- `fraginfo.c` 的 `fill_contig_page_info` 遍历 `zone->free_area[order].nr_free`，计算总页和 suitable blocks。
- 项目复习文档将 `/proc/buddyinfo` 与 eBPF 事件/状态结合，用于观察高阶分配和触发进程。

## A2 — 触发场景

1. 总内存看似充足但大块连续内存申请失败。
2. 用户要解释 `order`、`zone`、`node`、外部/内部碎片或 buddyinfo。
3. 用户要判断 extfrag/unusable 指标应该怎么解读。

## E — 可执行步骤

1. 明确页大小、目标 order、node/zone 和分配上下文；完成标准是把请求换算为连续页数。
2. 读取 buddyinfo 或项目 Map，按 order 比较 free pages、总块数和 suitable blocks；完成标准是避免把低阶小块直接相加成高阶块。
3. 结合 reclaim、compaction、事件频率和时间趋势判断原因；判停条件是只能说明“碎片相关”而不能排除内存压力时，明确保留不确定性。

## B — 边界

- 本项目主要观测伙伴系统页级外部碎片，不是 SLUB 对象碎片分析器。
- 指标是缩放后的整数，显示格式和阈值不能脱离实现解释。
- 低空闲页可能是容量压力，空闲页多但高阶块少才更支持碎片假设。

## 相关 Skills

- `linux-memory-ebpf-pipeline`：先追踪数据如何被采集。
- `linux-memory-source-audit`：核对指标实现与内核版本边界。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
