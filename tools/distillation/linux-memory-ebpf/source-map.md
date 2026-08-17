# Linux 内存/eBPF 来源映射

| 结论 | 文档来源 | 源码证据 |
|---|---|---|
| 运行链 | `文档/3.1.1 eBPF与BCC技术栈.md`、`3.3*`、`3.5*` | `源码/exfrag.py` 的 `BPF(src_file=...)`、Map 读取；`extfraginfo.c`、`fraginfo.c` |
| 碎片诊断 | `文档/3.2*`、`3.4.3*` | `fill_contig_page_info`、`unusable_free_index`、`__fragmentation_index` |
| 源码风险 | `文档/4.1 源码审计与事实边界.md`、复习版思维导图 | `last_time_map.lookup(&current_time)` 与 `update` 路径；视觉项目也有对应审计案例 |
| 快速路径观测单位 / `linux-memory-fastpath-observation-contract` | `文档/3.2.3 内存分配快速路径监控.md`；`文档/4.2.3 核心难点精讲.md`；`项目完整代码流程详解.md` | `fraginfo.c:kprobe__get_page_from_freelist`、`struct alloc_context`、`pgdat_map/zone_map`；只有入口采样，无返回点/请求 ID，目标内核探测和重试语义待验证 |
| Map 计数合同 / `linux-ebpf-map-counter-contract` | `文档/3.4.1 外碎片化事件采集.md`；`文档/4.2.3 核心难点精讲.md`；`项目完整代码流程详解.md` | `extfraginfo.c:counts_map` 的 PID key 与 `lookup→count++→update`、`exfrag.py:get_count_data`；累计/最近字段混合，精确丢失率和多 CPU 行为待验证 |

## 重要事实边界

`extfraginfo.c` 和 `fraginfo.c` 中的 `last_time_map` 查询使用当前时间作为 key；这使节流是否有效需要单独验证，不能按注释直接当作已完成功能。

## 当前可运行性报告

[`runtime-validation-matrix.md`](runtime-validation-matrix.md) 记录了当前源码的 M0–M8 检查：Python 语法可静态通过，但用户模块名和 BPF C 路径已经阻断直接运行；BCC 编译、探针 attach、Map 更新、TUI 和多 CPU 计数准确性没有在目标 Linux 环境执行。
