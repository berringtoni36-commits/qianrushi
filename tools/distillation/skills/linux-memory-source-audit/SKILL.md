---
name: linux-memory-source-audit
description: "Use when the user needs to distinguish design intent, documentation claims, and actual source behavior in the Linux physical-memory/eBPF project, especially around probe attachment, BPF map keys, sampling throttling, kernel-field reads, metric formulas, and project interview claims. Trigger phrases include “源码审计”, “文档和代码不一致”, “这个功能真的实现了吗”, “项目能不能这样说”. Do not use for general Linux memory teaching without source evidence."
metadata:
  source_book: Linux 物理内存检测项目
  source_files:
    - projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md
    - projects/Linux物理内存检测项目/文档/4 深度学习/4.3 实战重构与面试追问.md
    - projects/Linux物理内存检测项目/源码/extfraginfo.c
    - projects/Linux物理内存检测项目/源码/fraginfo.c
    - projects/Linux物理内存检测项目/源码/exfrag.py
    - projects/Linux物理内存检测项目/源码/exfrag_user.py
  source_chapter: projects/Linux物理内存检测项目/文档/4.1、4.3；源码/*.c, *.py
  source_symbols: [extfraginfo.c, fraginfo.c, exfrag.py, exfrag_user.py, last_time_map, current_time, counts_map, TRACEPOINT_PROBE, kprobe__get_page_from_freelist, fill_contig_page_info, unusable_free_index, __fragmentation_index]
  tags: [linux, ebpf, source-audit, correctness]
  related_skills: linux-memory-ebpf-pipeline, linux-buddy-fragmentation-diagnosis, rtos-project-storytelling
---

# Linux 项目源码事实审计

## R — 原文

> 项目设计了节流机制，但当前实现使用不断变化的时间作为查询 key，导致旧记录几乎不能命中；应改用固定 key 或单元素方案。
>
> — `archive/思维导图/Linux物理内存碎片检测-复习版.md`；对照 `源码/extfraginfo.c`、`源码/fraginfo.c`

## I — 方法论骨架

把每个项目结论写成四列：设计意图、文档声称、源码证据、可运行/可验证状态。源码审计不接受“函数名看起来像完成了功能”；要追踪输入、状态 key、更新路径、读取路径和平台依赖。对 eBPF 尤其检查 Map 的 key 是否稳定、探针是否真的 attach、结构体字段是否兼容、指标是否与定义一致。最终结论分为已证实、部分实现、设计缺陷、环境依赖和未知。

## A1 — 资料中的应用

- `extfraginfo.c` 和 `fraginfo.c` 都以 `current_time` 查询 `last_time_map`；其中节流逻辑的 key/更新时间路径存在缺陷。
- 视觉项目文档核对出摄像头写入 `/project_v1.0/frames/`，而 LSTR 默认读取 `LSTR/videos/frames/`，因此采集支路默认不等于识别支路。
- 视觉项目核对出 NEON 循环缺少标量尾部、OpenMP 对 `total_sum` 存在数据竞争风险。

## A2 — 触发场景

1. 用户想判断项目 README/复习文档是否真实反映源码。
2. 面试前需要知道哪些功能能说、哪些只能说“设计过”。
3. 遇到“加载成功但无数据”“优化后结果不一致”等实现问题。

语言信号： “源码真的做到了吗？”、“这句话能写进简历吗？”、“文档和代码对不上”、“帮我审计这个项目”。

## E — 可执行步骤

1. 建立 claim 表：结论、来源文档、源码路径、符号、运行前置条件；完成标准是每个 claim 可回到具体文件。
2. 顺着输入→状态→更新→读取→输出检查，重点审计 Map key、条件分支、错误路径、并发和版本依赖；完成标准是能指出至少一条支持或反证。
3. 把结论分级为 confirmed/partial/bug/environment-dependent/unknown，并给最小复现或修复建议；不得用“看起来合理”替代证据。
4. 生成面试表述时，只把 confirmed 内容写成已完成，把 partial/bug 内容写成设计意图或待修复项。

## B — 边界

- 静态审计不能替代目标板、内核版本和压力测试。
- 不要因为发现一个缺陷就否定整个项目；应保留可工作的部分和影响范围。
- 个人资料中的性能数字若无原始测试条件，只能作为待验证声明。

## 相关 Skills

- `linux-memory-ebpf-pipeline`：解释完整运行链。
- `linux-buddy-fragmentation-diagnosis`：解释指标的技术语义。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
