---
name: linux-ebpf-map-counter-contract
description: "Use when auditing Linux eBPF/BCC Map aggregation for exact cumulative counts, approximate rankings, latest-event snapshots, or complete event streams. Apply it to PID keys, lookup→value++→update read-modify-write paths, cross-CPU contention, mixed cumulative/latest fields, per-CPU or atomic counter choices, ring-buffer selection, and validation experiment design in the Linux physical-memory project. Do not use it for the end-to-end BCC pipeline, buddy allocator metric meaning, or a general source/version audit."
metadata:
  source_book: Linux 物理内存碎片检测项目
  source_files:
    - projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.1 外碎片化事件采集.md
    - projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md
    - projects/Linux物理内存检测项目/项目完整代码流程详解.md
    - projects/Linux物理内存检测项目/源码/extfraginfo.c
    - projects/Linux物理内存检测项目/源码/exfrag.py
  source_symbols: ["struct data_t", "counts_map", "TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)", "data->count", "bpf_get_current_comm", "get_count_data", "alloc_order", "fallback_order"]
  tags: [linux, ebpf, bcc, bpf-map, concurrency, counting, correctness]
  related_skills: linux-memory-ebpf-pipeline, linux-buddy-fragmentation-diagnosis, linux-memory-source-audit
---

# Linux eBPF/BCC Map 聚合并发与计数合同

## R — 原文

本 Skill 严格采用 `distillation/candidates-global/linux-memory-round3.md` 的候选 2“聚合 Map 的并发更新与精确计数合同”作为边界；以下结论再逐项回链真实项目文档、源码和用户态读取路径。

> `counts_map` 以 PID 为键保存外碎片化事件数据，用户态读取后按 `count` 降序展示；`count` 与 PFN、分配阶数等字段放在同一个 `data_t` 中。
>
> — `projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.1 外碎片化事件采集.md`（相关段落：69–137、169–191）

> 当前聚合路径是 `lookup → data->count += 1 → update`；按 PID 聚合适合排行榜，完整事件流应使用 ring buffer，每 CPU 计数应使用 per-CPU Map。
>
> — `projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md`（相关段落：472–498）

## I — 方法论骨架

先写清 Map 的输出合同，再判断实现是否满足它。至少区分四种合同：

| 合同 | 输出承诺 | 可接受的丢失/覆盖 | 首选方向 |
|---|---|---|---|
| 精确累计计数 | 在定义的事件集合和时间范围内，每个被接受事件只贡献一次 | 不能静默丢增量；需说明 Map 更新失败 | 共享值上的原子加，或 per-CPU 计数后按一致快照汇总 |
| 近似排行榜 | 大致找出高频 key，排序用于定位热点 | 可接受少量误差，但必须明示“近似” | 稳定 key 的 hash/LRU hash 聚合 |
| 最近事件快照 | 每个 key 保留最近一次或当前最新元数据 | 旧 PFN/order/comm 被覆盖是合同的一部分 | hash/array；明确“最近”的时间和并发语义 |
| 完整事件流 | 每个事件有独立记录，并定义顺序、丢失和消费边界 | 不能用 Map 覆盖来代替历史；丢失必须可见 | ring buffer，并记录必要的序列/丢失证据 |

审计时把输入事件集合、key、value 字段、更新原子性、用户态读取方式和验证证据串成一条链：

1. 先界定计数分母：是 tracepoint 原始事件，还是通过采样/过滤后真正进入聚合的事件。`count` 只能代表后者，除非另有独立原始事件计数。
2. 检查 key 是否稳定且足以表达身份。PID 聚合要单独说明 PID 复用、进程退出和同一 PID 的不同 order 组合；不要用 value 内的 `pid` 字段替代 key 身份证明。
3. 展开每条更新分支。对 `lookup → value++ → update` 画出两个 CPU 同时读到旧值、分别加一、后写回的路径；没有原子或 per-CPU 设计时，不能把代码存在说成严格计数。
4. 分离字段语义。`count` 这类累计字段与 PFN、`alloc_order`、`fallback_order`、`pcomm` 这类最近事件字段不能共同解释为一条历史事件记录；后写入事件会覆盖前一事件的元数据。
5. 审计消费端。遍历当前 Map 并按 `count` 排序得到的是聚合快照/排行榜，不是事件时间线；读取期间的更新、删除、复用和更新失败都要纳入合同。
6. 根据合同选择实现，并把原子性、每 CPU 合并、ring buffer 丢失策略和读取一致性写成可验收条件，而不是只写 Map 类型名称。

## D/S/U — 事实分层

### D — 设计意图

- `3.4.1` 把 `counts_map` 定义为按 PID 聚合的容器，目标是快速找到触发 fallback 较多的进程；这天然更接近近似排行榜，而不是完整日志。
- 同一资料把 `count`、PFN、`alloc_order`、`fallback_order` 和 `pcomm` 放入 `data_t`，因此设计上已经混合了累计次数与最近事件快照两种时间语义。
- `4.2.3` 给出选择边界：按 PID 聚合可用 hash/LRU hash，完整事件流应使用 ring buffer，每 CPU 计数应使用 per-CPU Map；合同必须先于实现选择。

### S — 当前实现

- `extfraginfo.c` 用 `pid_t pid` 作为 `counts_map` 的 key。首次命中创建 `zero` 并将 `count` 设为 1；已有条目执行 `data->count += 1`，然后覆盖 PFN、两个 order 和 comm，再调用 `counts_map.update(&pid, data)`。
- 当前源码没有原子加、per-CPU 聚合、事件时间戳或 ring buffer。静态上只能确认存在共享 key 的读改写路径，不能确认运行时已经发生了多少丢增量。
- `exfrag.py:get_count_data()` 遍历当前 `counts_map`，复制这些字段并按 `count` 降序返回；该读取路径产生的是当前聚合视图，不保留同一 PID 的历史事件。

### U — 待验证

- 在目标内核、BCC 版本和多 CPU/多线程 workload 上，对照独立的原始 tracepoint 事件数、每 PID 汇总值和 Map 操作失败数，才能判断实际低估、排序偏差及其规模。
- 需要分别验证近似排行榜、精确累计次数和完整事件流三种合同，并测试同一 PID 的不同 order、PID 退出后复用、并发更新以及读取时的快照边界。
- 原子加、per-CPU 汇总或 ring buffer 的具体实现还受目标内核、验证器、value 布局和用户态消费策略影响；本 Skill 不把候选设计写成已运行结果。

## A1 — 资料中的应用

- `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)` 提供事件上下文；`bpf_get_current_pid_tgid()` 提取 PID，`bpf_get_current_comm()` 写入进程名。
- `struct data_t` 同时含 `count`、`pfn`、`alloc_order`、`fallback_order`、`pid` 和 `pcomm`；`counts_map` 按 PID 保存它。
- `exfrag.py:get_count_data()` 读取 `counts_map`，解码 `pcomm`，返回字段字典并按 `count` 排序。解释这段代码时必须称其为 PID 聚合快照或排行榜输入，不能称为完整事件流。
- `项目完整代码流程详解.md:1116-1126` 明确指出该 Map 会丢失同一 PID 的事件时间线、order 分布、迁移类型、PID 复用边界和严格精确计数保证；这些是本 Skill 的聚合合同边界。

## A2 — 触发场景

在出现以下问题时使用本 Skill：

1. 用户问“`count` 能不能当精确事件数”“多 CPU 会不会丢计数”或“`lookup → ++ → update` 是否安全”。
2. 用户需要判断 PID Map 适合精确累计、近似热点排名、最近字段快照还是完整事件记录。
3. 用户需要设计 hash、per-CPU、原子加或 ring buffer 的选择依据和验收实验。
4. 用户发现同一 PID 的 `count` 与 PFN/order/comm 似乎互相矛盾，或想解释为什么 Map 读取看不到历史事件。

## E — 可执行步骤

1. **写合同**：记录事件来源、采样/过滤后的纳入条件、key 身份、时间范围、是否要求每事件保留、允许的丢失和排序语义。
2. **审 key**：核对 PID 是否只是聚合维度；检查 PID 复用、进程退出、同一 PID 的不同 order 组合，以及 value 内 `pid` 与 key 是否一致。
3. **审 value**：把累计字段、最近字段和身份字段分栏；标出每个字段在哪个分支初始化、累加、覆盖或从未更新。
4. **审 RMW**：沿着 miss/hit 两条分支画出 `lookup`、修改和 `update`；检查共享 value 的并发窗口、字段整体覆盖、更新失败处理和 64 位计数布局约束。没有证据时把“可能丢增量”标为风险，不写成实测损失。
5. **选实现**：
   - 只需近似热点排名：稳定 key 的 hash/LRU hash，并在输出中标“近似排行榜”。
   - 要精确累计：使用目标内核支持且已验证的原子加，或按 CPU 累计后在定义好的边界合并；同时统计查找/更新失败和重置期间的缺口。
   - 要最近事件快照：保留显式时间/序号或版本语义，接受旧元数据覆盖，并避免把它与累计次数拼成历史记录。
   - 要完整事件流：每次接受的事件写入 ring buffer；定义容量不足时的丢失计数、消费边界和用户态退出/重启行为。
6. **做最小验证**：用受控 workload 产生已知事件集合，分别在低并发与多 CPU 条件下采集独立事件计数、Map 聚合值、最近字段和操作错误；再注入不同 order、PID 复用和并发读取，按合同逐项判定。
7. **报告分层**：将文档主张列为 D，将源码路径列为 S，将未执行的目标内核/多 CPU/客户端验证列为 U；结论只使用证据允许的精度。

## B — 边界

- 不解释 Python/BCC 从加载、attach、触发到 TUI 的完整运行链；需要该链路时使用 `linux-memory-ebpf-pipeline`。
- 不解释 `order`、zone、node、buddy 或 extfrag/unusable 指标的内存语义；需要伙伴系统诊断时使用 `linux-buddy-fragmentation-diagnosis`。
- 不承担通用的探针可用性、内核字段布局、采样 key 缺陷或设计意图—源码—运行状态总审计；需要这些内容时使用 `linux-memory-source-audit`。本 Skill 只接收其中与 Map 聚合计数合同直接相关的证据。
- 本目录的静态审查没有运行目标内核、真实多 CPU 压力测试或真实客户端命中率；不要把 U 层建议写成性能数字、实测丢失率或已验证准确率。
- 不把 `counts_map` 的一次遍历扩写成事件日志，也不把排行榜的相对用途升级为精确计量承诺。

## 相关 Skills

- `linux-memory-ebpf-pipeline`：解释 BCC/eBPF 加载、挂载、触发、Map 读取和展示的端到端链路。
- `linux-buddy-fragmentation-diagnosis`：解释伙伴系统的 node/zone/order、连续页和碎片指标。
- `linux-memory-source-audit`：建立设计意图、文档声称、源码行为和运行验证状态的通用事实审计。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态结构审查 6/6；未声称目标内核、多 CPU 实测或真实客户端命中率。
