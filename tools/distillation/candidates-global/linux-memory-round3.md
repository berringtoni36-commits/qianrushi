# Linux 物理内存/eBPF 候选扫描 Round 3

> 范围：只审查 `linux-memory-ebpf` 来源中尚未明确标为 `skill-evidence` 的文档/流程材料，并用现有源码做事实回链。本文是候选池，不创建 canonical Skill，不修改全局索引。
>
> 现有边界：`linux-memory-ebpf-pipeline` 已覆盖加载→挂载→触发→Map→用户态展示；`linux-buddy-fragmentation-diagnosis` 已覆盖 node/zone/order、连续页与碎片指标；`linux-memory-source-audit` 已覆盖设计意图—源码行为—验证状态及 key/字段/指标审计。

## 本轮判定标准

- **V1 来源事实**：至少有一份尚未升格的设计/难点/流程文档与真实源码互相回链；不能只凭术语或图示。
- **V2 推演能力**：能从方法推出未在原文逐字写出的故障症状、误读或最小验证实验。
- **V3 独特边界**：相对上述三个 Skill 及 Round 2 的 `r2-mem-01`～`r2-mem-05` 有稳定、原子、可复用的独立问题边界。

## 候选 1：快速路径入口探针的观测单位闭环

**原子方法**：在解释或设计 `get_page_from_freelist` 观测时，先声明计数单位和结果语义，再把“函数入口尝试”“上层分配请求”“最终成功/失败”分开。入口 kprobe 只能直接证明一次函数进入及进入前的参数/状态快照；若问题需要成功页、命中 zone、是否 reclaim/compaction 或最终失败，必须增加返回点/退出点或请求级关联，不能从入口快照推断。

### source_files

- `projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.3 内存分配快速路径监控.md:15-38,42-91`
- `projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md:113-205`
- `projects/Linux物理内存检测项目/项目完整代码流程详解.md:641-653`
- `projects/Linux物理内存检测项目/源码/fraginfo.c:91-167`

### source_symbols

- `kprobe__get_page_from_freelist`
- `struct alloc_context`
- `fill_contig_page_info`
- `pgdat_map`
- `zone_map`
- `unusable_free_index`
- `__fragmentation_index`

### 设计意图（D）

- 文档把 `get_page_from_freelist` 描述为快速路径的关键入口，意图通过每次进入时读取 `gfp_mask`、请求 `order`、`alloc_flags` 和 `alloc_context`，获得伙伴系统状态并尽早发现高阶分配困难。
- 设计目标是观察分配现场，为 zone/order 状态和碎片指数提供输入；“快速路径监控”不是承诺每个用户态分配请求恰好对应一个样本，也不是承诺样本包含最终分配结果。

### 当前实现（S）

- `fraginfo.c` 只有入口程序 `kprobe__get_page_from_freelist(...)`。它读取入口参数，从 `ac->preferred_zoneref` 取得 `pgdat`，遍历 fallback zonelist 和各 `order`，再写入 `pgdat_map`/`zone_map`。
- 该程序在入口没有读取原函数返回值，也没有 kretprobe/fexit、请求 ID 或成对的进入/退出状态；`return 0` 是 kprobe 程序自身的返回，不是被观测分配请求的成功/失败结果。
- `4.2.3` 明确指出 slowpath 可能再次调用同一函数，因此入口次数可能大于上层请求数；当前扫描还不是内核真实决策（watermark、nodemask/cpuset、alloc flags、reclaim/compaction）的逐分支复刻。

### 待验证（U）

- 在目标内核/架构上核对函数是否可探测、BCC 参数映射是否正确，并记录入口触发次数。
- 用固定 workload 同时记录上层请求数、入口次数、返回成功/失败、命中 zone 以及 reclaim/compaction 重试，比较“入口样本”与“请求结果”的比例。
- 若需要输出成功率、失败率或一次请求的重试链，验证 kretprobe/fexit 或请求级关联方案，并明确嵌套/重入语义；不能用现有 `zone_map` 快照替代结果证据。

### V1/V2/V3

- **V1：通过（高）**。未标记的快速路径与核心难点文档给出“入口可能重复、能看见/不能看见什么”的直接规则；`fraginfo.c` 的真实入口函数、参数和 Map 写入路径与之对应。
- **V2：通过（高）**。可预测入口计数高于请求计数、把重试误报为高频分配、把入口快照误写成“分配失败/成功”以及把状态统计误当作命中 zone；最小验证是入口计数与返回点/请求点对照。
- **V3：通过（高）**。边界专门处理“观测单位与观测时机”：不负责 BCC 加载链，不重新解释 buddy 指标，也不重复一般源码审计；与 `r2-mem-02` 的 order/zone 数据形状不同，后者不回答入口次数是否等于请求结果。

## 候选 2：聚合 Map 的并发更新与精确计数合同

**原子方法**：先声明 Map 输出是“精确计数”“近似排行榜”“最近一次事件快照”还是“完整事件流”，再审计 key、value 更新和跨 CPU 竞争。对共享 PID 的 `lookup → value++ → update`，不能把代码存在等同于严格计数；计数、最新元数据和历史事件应分开定义，并按合同选择原子加、per-CPU 聚合后合并或 ring buffer/perf event。

### source_files

- `projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.1 外碎片化事件采集.md:69-137,169-191`
- `projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md:472-498`
- `projects/Linux物理内存检测项目/项目完整代码流程详解.md:1116-1126`
- `projects/Linux物理内存检测项目/源码/extfraginfo.c:7-58`
- `projects/Linux物理内存检测项目/源码/exfrag.py:126-148`

### source_symbols

- `struct data_t`
- `counts_map`
- `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)`
- `data->count`
- `bpf_get_current_comm`
- `get_count_data`
- `alloc_order`
- `fallback_order`

### 设计意图（D）

- `3.4.1` 将 `counts_map` 定义为 PID 聚合容器，目标是快速找出触发 fallback 较多的进程；用户态按 `count` 降序展示，适合问题进程的近似排行榜。
- `4.2.3` 给出 Map 类型选择边界：按 PID 聚合可用 hash/LRU hash，完整事件流应使用 ring buffer，每 CPU 计数应使用 per-CPU map；这说明“聚合”本身必须先有精度与历史保留合同。

### 当前实现（S）

- `extfraginfo.c` 以 PID 为 `counts_map` key。已有条目走 `data->count += 1` 后再 `counts_map.update(&pid, data)`；同时覆盖最近的 `pfn`、`alloc_order`、`fallback_order` 和 `pcomm`。
- 源码没有原子加、per-CPU 聚合、事件时间戳或 ring buffer；`exfrag.py:get_count_data()` 只遍历当前 Map 并按 `count` 排序。因此当前值同时混合了累计字段和最近一次事件字段，不能自然解释为精确事件日志。
- 该候选只审计共享 key 的更新正确性与输出合同；PID 聚合丢失历史、PID 复用和字段覆盖的总体快照边界已在 `r2-mem-01` 记录，本条不重复升格“完整事件历史”主题。

### 待验证（U）

- 在多 CPU/多线程高频 fallback workload 下，对照原始 tracepoint 事件数、每 PID 汇总值和 Map 更新失败数，验证是否存在读改写丢增量或排名偏差。
- 分别测试“只要近似排行榜”“要求精确累计次数”“要求保留每次事件”三种合同，比较普通 hash、原子/每 CPU聚合和 ring buffer 的开销、丢失策略与用户态合并结果。
- 测试 PID 退出后复用、同一 PID 的不同 order 组合和并发更新，确认 `count` 与最近 PFN/order 是否会被误解为同一事件上下文。

### V1/V2/V3

- **V1：通过（高）**。未标记的外碎片采集与核心难点文档明确给出 PID 聚合、Map 类型和并发读改写规则；`extfraginfo.c` 与 `exfrag.py` 可逐符号回链当前实现。
- **V2：通过（高）**。可预测高并发下计数低估、排行榜顺序错误、最近 PFN/order 被当作累计分布，以及把快照误说成审计日志；可用多 CPU workload 与独立事件计数复核。
- **V3：通过（高）**。边界专门处理 BPF Map 聚合的更新/精度/历史合同；`linux-memory-ebpf-pipeline` 只描述 Map 数据流，`linux-memory-source-audit` 的通用审计不提供该聚合合同，`r2-mem-01` 也只覆盖快照留存边界而非 RMW 精度决策；不涉及伙伴指标含义。

## Reject / 降级：未同时达到 V1/V2/V3 的内容

| 近候选 | V1/V2/V3 判定 | 处理与原因 |
|---|---|---|
| 固定 key、单元素/每 CPU Map 的采样节流状态机 | V1 通过，V2 通过，V3 不通过 | 已由 `linux-memory-source-audit` 的节流审计和 Round 2 `r2-mem-03` 覆盖；当前 `last_time_map` 的动态时间 key、事件程序不 update、`delay` 未初始化只作为既有反例，不再建候选。 |
| `mm_page_alloc_extfrag` 的 fallback_order、migratetype 与 ownership 语义 | V1 通过，V2 通过，V3 不通过 | 已嵌入 `r2-mem-01`、伙伴系统语义和核心难点文档；当前源码缺少 migratetype/ownership 字段，不能再从同一字段解释链拆出独立 Skill。 |
| 双探针“事件 + 状态”联合因果关联 | V1 通过，V2 部分通过，V3 不通过 | 现有资料虽有 `event-state-correlation_animated.svg` 和“谁触发 + 为什么困难”的联合图，但当前两程序互斥加载、Map 无共享事件 ID/时间线；这只能作为现有 pipeline/buddy/source-audit 的联合诊断边界，不能声称形成新的已实现方法。 |
| tracepoint 比 kprobe 更稳定、kprobe 依赖函数签名/结构体布局 | V1 通过，V2 通过，V3 不通过 | 是现有 pipeline 的探针选择与 source-audit 的内核版本/字段兼容边界；没有新的项目级验证或独立输出合同。 |
| zone/order `/11` 推算、`zone_map` 覆盖、import/path/BCC 名称不闭合、模式与 Map 错配 | V1 通过，V2 通过，V3 不通过 | 已由 Round 2 `r2-mem-02`～`r2-mem-05` 明确登记，并归入现有 source-audit/pipeline 反例；本轮不重复。 |
| score A/B 阈值、compaction 决策或“高 scoreB 就是碎片根因” | V1 通过，V2 通过，V3 不通过 | 属于 `linux-buddy-fragmentation-diagnosis` 的指标语义与不确定性边界；缺少目标内核、workload 和运行日志时，不能升格为新的观测方法。 |
| curses 刷新频率等于内核采样频率、或把 Map 读取当事件流 | V1 通过，V2 部分通过，V3 不通过 | 已由 `linux-memory-ebpf-pipeline` 的两条时间线边界覆盖；候选 2 只保留聚合更新正确性，不重复 UI/Map 解耦说明。 |
| 泛化的“快速路径监控”或“BPF Map 是内核—用户态通信” | V1 通过，V2 不足，V3 不通过 | 只能复述已有 `linux-memory-ebpf-pipeline` / `linux-buddy-fragmentation-diagnosis` 的运行链和内存语义，未形成原子故障定位合同；已收回为候选 1 的观测单位切面。 |

## 本轮结论

保留 2 条候选：

1. **快速路径入口探针的观测单位闭环**：入口调用 ≠ 上层请求 ≠ 最终结果。
2. **聚合 Map 的并发更新与精确计数合同**：累计计数、最近快照和完整事件流必须分合同审计。

两条都满足当前静态证据下的 V1/V2/V3；它们仍需目标内核、BCC 版本、多 CPU workload 和独立计数/返回点实验后，才能进入后续 Skill 评审。本文不把“待验证”写成已运行事实。
