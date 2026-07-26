# Linux 物理内存检测面试高频点

> 说明：以下题目已将原 S/A 题、简历追问和原作者文档重点合并，并严格按照“必须掌握点”的学习顺序排列。只保留题目，不写答案。

## 1. Tracepoint 和 kprobe

- `tracepoint` 和 `kprobe` 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？

- 为什么这个项目同时使用 `tracepoint` 和 `kprobe`，而不是只用其中一种？

- 为什么 `mm_page_alloc_extfrag` 适合用 `tracepoint` 挂载？它什么时候会被内核触发？

- 为什么 `get_page_from_freelist` 适合用 `kprobe` 挂载？它在内核内存分配路径中处于什么位置？

- `mm_page_alloc_extfrag` 和 `get_page_from_freelist` 一个是“事件视角”、一个是“状态视角”，这句话怎么理解？

## 2. eBPF 原理和运行流程

- eBPF 是什么？为什么它适合做 Linux 内核态监控？

- eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？

- BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？

- eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？

## 3. eBPF 如何与内核/用户态交互

- eBPF 程序是如何通过 `bpf()` 系统调用进入内核并挂载到目标 tracepoint/kprobe 上的？

- BPF map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？

- `counts_map`、`pgdat_map`、`zone_map`、`delay_map`、`last_time_map` 分别干什么？

- 为什么 `counts_map` 用 PID 作为 key 聚合外部碎片事件？为什么 `zone_map` 要按 `zone + order` 维度统计？

- 为什么 eBPF 读取内核结构体时要用 `bpf_probe_read_kernel()` 或 `bpf_probe_read_kernel_str()`？直接访问内核指针有什么风险？

## 4. Python、BCC 和 curses 用户态展示

- Python 在这个项目里是不是核心采集层？`exfrag.py` 和 `exfrag_user.py` 分别负责什么？

- `BPF(src_file=...)`、写入 `delay_map`、读取 `zone_map/counts_map` 分别对应项目运行链路中的哪个阶段？

- curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？

- 为什么用 curses 做 TUI，而不是普通 `print` 输出？

## 5. Linux 内存管理重点

- 为什么系统“总空闲内存还够”，却仍然可能分配不出大块连续物理内存？

- 伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？

- 外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？

- `get_page_from_freelist` 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收、内存规整有什么关系？

- `mm_page_alloc_extfrag` 捕获的 fallback 事件说明什么？`ALLOC_ORDER` 和 `FALLBACK_ORDER` 的差异能反映什么问题？

- `extfraginfo.c` 和 `fraginfo.c` 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计分别怎么对应？

## 6. eBPF 程序如何计算碎片化指数

- `fill_contig_page_info()` 做了什么？为什么它要遍历所有 order？

- `free_pages`、`free_blocks_total`、`free_blocks_suitable` 分别代表什么？

- `free_blocks_suitable` 为什么不能只简单统计 `order >= suitable_order` 的块数，而要按高阶块折算？

- `unusable_free_index` 和 `extfrag_index` 分别衡量什么？为什么需要两个指标，而不是只用一个？

- `extfrag_index` 中如果 `free_blocks_suitable > 0`，为什么可以直接返回负值？这个负值表示什么？

- 如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？

## 7. 整个项目运行逻辑

- 请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终能展示什么？

- 从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链路是什么？

- 这个项目相比 `/proc/buddyinfo` 有什么优势和不足？它更适合解决什么场景下的问题？

- 这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 `delay_map` 和 `last_time_map`？

- 如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？
