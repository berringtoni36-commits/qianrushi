# Linux 内存/eBPF 术语表

| 术语 | 项目语义 | 来源 |
|---|---|---|
| tracepoint | 稳定命名的内核事件挂点，项目用于 `mm_page_alloc_extfrag` | `源码/extfraginfo.c` |
| kprobe | 动态插桩函数入口，项目用于 `get_page_from_freelist` | `源码/fraginfo.c` |
| BPF Map | eBPF 与用户态交换状态/事件的内核对象 | `源码/*.c`、`exfrag.py` |
| order | 连续页数指数，order n 表示 `2^n` 页 | `文档/3.2.1...md` |
| zone | node 内按地址/用途划分的内存区域 | 同上 |
| 外部碎片 | 空闲页总量可能足够，但缺乏连续高阶块 | `文档/3.2.2...md` |
| score A/B | 项目对连续块可用性和不可用空闲页的缩放指标 | `源码/fraginfo.c` |

## Round 3 观测与计数术语

| 入口调用样本 | `get_page_from_freelist` 被探针观察到的一次进入尝试；不等于上层请求或最终成功/失败 | `linux-memory-fastpath-observation-contract` |
| 请求级关联 | 用请求 ID、线程/上下文或成对进入/返回状态把多次入口尝试连接到一次上层分配请求 | `linux-memory-fastpath-observation-contract` |
| 聚合快照 | Map 当前按 key 合并后的值；可用于热点排名，但不保留同一 key 的事件时间线 | `linux-ebpf-map-counter-contract` |
| read-modify-write（RMW） | `lookup→读取→修改→update` 的共享值更新窗口；无原子/per-CPU 设计时不能自动宣称精确计数 | `linux-ebpf-map-counter-contract` |
| 最近事件字段 | 与累计 `count` 同一 value 中被后续事件覆盖的 PFN/order/comm 等字段；不应拼成完整历史记录 | `linux-ebpf-map-counter-contract` |
