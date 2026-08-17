---
name: linux-memory-fastpath-observation-contract
description: "Use when auditing or designing Linux physical-memory/eBPF fast-path probes, especially kprobe entry observations of get_page_from_freelist, repeated calls during slowpath, return-point evidence, and request-level correlation. Keep function-entry samples, upper-level allocation requests, and final success/failure separate; do not use for the general BCC loading chain, buddy-fragmentation metric semantics, or broad source audits."
metadata:
  source_files:
    - "projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.3 内存分配快速路径监控.md"
    - "projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md"
    - "projects/Linux物理内存检测项目/项目完整代码流程详解.md"
    - "projects/Linux物理内存检测项目/源码/fraginfo.c"
  source_symbols:
    - "kprobe__get_page_from_freelist"
    - "struct alloc_context"
    - "fill_contig_page_info"
    - "pgdat_map"
    - "zone_map"
    - "unusable_free_index"
    - "__fragmentation_index"
  related_skills: [linux-memory-ebpf-pipeline, linux-buddy-fragmentation-diagnosis, linux-memory-source-audit]
  tags: [linux, memory, ebpf, kprobe, observability, evidence]
---

# Linux 快速路径观测单位与证据闭环

## 来源与符号

本 Skill 严格采用候选 1“快速路径入口探针的观测单位闭环”及其四份真实来源。候选扫描文件只负责选题，不替代项目文档或源码证据。真实来源如下：

- `projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.3 内存分配快速路径监控.md:15-38,42-91`
- `projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md:113-205`
- `projects/Linux物理内存检测项目/项目完整代码流程详解.md:641-653`
- `projects/Linux物理内存检测项目/源码/fraginfo.c:91-167`

关键符号：`kprobe__get_page_from_freelist`、`struct alloc_context`、`fill_contig_page_info`、`pgdat_map`、`zone_map`、`unusable_free_index`、`__fragmentation_index`。

## R — 来源摘录（Reading）

- 快速路径资料把 `get_page_from_freelist` 描述为页分配路径中的关键入口，并说明 BCC 的 `kprobe__get_page_from_freelist` 约定会在函数进入时接收 `gfp_mask`、`order`、`alloc_flags` 和 `alloc_context`（3.2.3:15-38,42-91）。
- 难点资料明确区分首次尝试与 slowpath 重试：一次上层请求在回收、规整或约束变化后可能再次进入同一函数。因此入口探针观察的是函数进入尝试，不是“每个上层请求一次”（4.2.3:113-205）。
- 同一资料列出入口能看到的参数和进入前状态快照，以及不能直接看到的返回 page、成功 zone、reclaim/compaction 经过和上层请求最终成败；要回答返回结果需要返回点，要关联完整请求还需要请求标识或成对状态（4.2.3:113-205）。
- 流程说明把 `fraginfo.c` 定义为入口处的状态采样：它从 `alloc_context` 找到 `pgdat`，遍历 fallback zonelist 和各 `order`，再写 `pgdat_map`、`zone_map`（项目完整代码流程详解.md:641-653）。
- 源码只有 `kprobe__get_page_from_freelist` 入口程序：读取参数和 `ac`，扫描 zone/order，更新状态 Map，最后由 eBPF 回调返回 `0`；在该文件中没有对应的 kretprobe/fexit、请求 ID 或请求级成对状态（fraginfo.c:91-167）。

## I — 方法论解释（Interpretation）

先写清计数单位，再写结论：

`入口调用样本 E ≠ 上层分配请求 R ≠ 最终结果 O`。

- **入口调用样本 E**：探针观测到一次 `get_page_from_freelist` 进入及其入口参数/近似进入前状态。`gfp_mask`、本次调用的 `order`、`alloc_flags` 和 `ac` 是调用级证据；它们不是结果字段。
- **上层请求 R**：一次由更上层分配路径发起、需要被追踪到生命周期结束的请求。一个 R 可能包含多次入口尝试；不同 R 也可能具有相同线程、order 或相近时间，不能用这些字段单独去重。
- **最终结果 O**：请求边界最终返回成功页面/状态或失败错误。`get_page_from_freelist` 的一次返回只能先闭合一次函数调用；它不自动等于整个上层请求的最终成败。

因此，入口样本数量不能直接当作请求数量、成功率或失败率。还要区分“实际发生的入口调用”和“被探针、采样门控、缓冲/读取路径保留下来的观测样本”；静态源码不能把两者的比例写成运行时事实。

### D/S/U 事实分层

#### D — 设计意图

- 通过快速路径入口尽早取得分配参数和伙伴系统相关状态，为高阶分配困难与碎片分析提供现场快照。
- 入口监控的价值是观察“尝试发生时的上下文”，不是承诺一个用户态请求恰好产生一个样本，更不是承诺样本带有最终结果。
- 若问题要求“该次调用是否成功”或“这次请求为何最终失败”，设计上应增加返回点、请求边界和可验证的关联关系。

#### S — 当前实现

- `fraginfo.c` 的 `kprobe__get_page_from_freelist` 接收入口参数，经 `ac->preferred_zoneref` 找到 `pgdat`，遍历 fallback zonelist 与 `MAX_ORDER`，调用 `fill_contig_page_info` 并计算/写入 `pgdat_map`、`zone_map`。
- 文件中没有 kretprobe/fexit、调用级返回值记录、请求 ID 或请求开始/结束配对。`return 0` 是 eBPF 探针程序自身的返回，不是被观测分配请求的成功/失败值。
- `pgdat_map`、`zone_map` 在这里承载状态快照；它们不构成入口事件日志，也不证明命中了哪个最终 zone。`last_time_map`/`delay_map` 的门控即使被修正，也只改变采样保留，不会凭空提供请求结果或关联 ID。

#### U — 待验证

- 在目标内核和架构上核对符号是否可探测、BCC 参数映射是否正确、`alloc_context` 布局是否匹配，并记录探针丢失/门控语义。
- 用固定 workload 同时取得上层请求数、入口观测数、函数返回结果、最终请求结果、命中 zone 以及 reclaim/compaction 重试证据，再比较它们的单位和时间范围。
- 评估 kretprobe/fexit 或等价返回点能否可靠配对同一次调用；若要闭合上层请求，验证请求级标识、线程上下文、嵌套/重入、多 CPU 并发和事件丢失处理。
- 未有上述目标环境证据前，只能写“源码设计/静态实现/待验证”，不能写目标内核实测比例、成功率或客户端实际命中率。

## A1 — 资料中的应用（Past Application）

1. **入口次数高于请求次数**：看到 kprobe 入口计数高于用户态请求计数时，先标为“入口尝试与请求单位不同”；slowpath 重试和系统中其他分配请求都可能造成差异，不能仅凭差值判定统计错误。
2. **入口样本被写成失败事件**：`fraginfo.c` 的入口快照可以说明一次尝试带着某组参数进入并触发状态扫描，不能说明该次调用或上层请求最后失败。失败结论必须有返回点或请求级失败证据。
3. **状态快照被写成决策结果**：`zone_map` 中的 zone/order 状态可以作为进入前现场材料，不能单独证明内核最终选择了哪个 zone、是否执行 reclaim/compaction，或某个请求就是由该快照中的碎片指标导致失败。

这些例子只展示证据边界，不是目标内核运行测量。

## A2 — 未来触发场景（Future Trigger）

当用户询问以下问题时触发本 Skill：

- “`get_page_from_freelist` 的每次 kprobe 是不是一次内存分配？”
- “为什么入口探针次数比上层申请次数多？怎样识别 retry/重复调用？”
- “只看 `fraginfo.c` 的入口参数或 `zone_map`，能不能判断成功、失败、命中 zone 或经历 compaction？”
- “怎样用 kretprobe/fexit 和请求级 ID 把入口、返回、最终请求结果串起来？”
- “这段快速路径观测的结论，证据到底覆盖函数调用、请求生命周期，还是仅仅覆盖入口快照？”

## E — 可执行审计流程（Execution）

### 1. 先建立观测单位合同

把用户要证明的句子改写成 E、R、O 三者之一，并记录时间范围、计数器和去重规则。至少使用以下合同表：

| 要说的结论 | 最低证据 | 当前 `fraginfo.c` |
|---|---|---|
| 入口发生过 | 成功 attach 后的入口样本及参数 | 部分具备，仍需目标环境验证 attach/参数 |
| 一次调用返回什么 | 与入口配对的 kretprobe/fexit 或等价返回点 | 不具备 |
| 一个上层请求重试几次 | 请求边界、关联 ID、每次调用链 | 不具备 |
| 请求最终成功/失败 | 请求级结束点与结果字段 | 不具备 |
| 最终命中 zone/经历 reclaim 或 compaction | 对应分支/返回/请求级证据 | 入口快照不能证明 |

### 2. 审计入口参数和时机

1. 核对探针目标、函数签名和架构参数传递，确认 `gfp_mask`、`order`、`alloc_flags`、`ac` 的含义是“本次调用入口参数”。
2. 标出所有指针解引用和状态读取的时间点，例如 `ac->preferred_zoneref`、zonelist、`free_area`；把它们标成“入口前后近似快照”，不要改写成内核最终决策。
3. 分离探针触发、采样门控、Map 更新、用户态读取四条时间线；Map 更新或 TUI 刷新都不能代替调用返回证据。

### 3. 识别重试、重复与丢失

- 先按调用样本计数；再寻找上层请求边界，禁止用 PID/TID、order 或时间戳单独充当请求 ID。
- 为每次可配对调用记录 CPU、线程、时间和调用深度/关联 token；明确同一请求多次进入、不同请求相同线程以及嵌套/重入的区分规则。
- 记录门控、probe attach 失败、事件缓冲丢失和用户态读取延迟；缺少这些信息时，把“入口次数”限定为“观测到的样本数”。

### 4. 补足返回点和请求级关联

- 只需回答一次函数调用的结果时，使用 kretprobe/fexit 或等价返回点，并用可靠的 per-invocation 关联闭合入口与返回；不要把它直接升级成请求最终结果。
- 需要回答一次上层请求时，在请求开始/结束边界建立 request ID，把同一请求的多个入口尝试、返回结果、reclaim/compaction 阶段和最终状态归并；设计时处理并发、嵌套、重入、丢事件和退出路径。
- 对“命中哪个 zone”或“是否走某分支”的结论，补采对应决策/返回证据；入口处遍历到的候选 zone 只是状态材料。

### 5. 输出 D/S/U 审计结论

按“设计意图 D → 源码实现 S → 待验证 U”写结论，并逐句标注证据单位：入口样本、调用返回、请求生命周期或外部独立计数。若没有请求级关联，就明确停在“入口观测/调用级部分证据”，不输出成功率、失败率或因果结论。

## B — 边界与相关 Skill（Boundary）

- `linux-memory-ebpf-pipeline` 负责 Python/BCC 加载、attach、触发、Map 读取和 TUI 全链路。遇到“程序加载成功但没有数据”先用它；只有问题集中在样本究竟代表入口、请求还是结果时才用本 Skill。
- `linux-buddy-fragmentation-diagnosis` 负责 node/zone/order、连续页、buddy 与碎片指数的技术语义。遇到“总空闲内存足够为何高阶分配失败”先用它；本 Skill 只把这些字段当作入口快照证据，不重新解释指标或诊断碎片根因。
- `linux-memory-source-audit` 负责更宽的设计意图—源码行为—验证状态审计，包括 Map key、节流、字段兼容和项目表述。若问题是“文档和实现是否一致”，用它；若核心追问是“一个入口样本能否代表一次请求/结果”，在其基础上用本 Skill 收束观测合同。
- 本 Skill 不保证任意目标内核、BCC 版本或架构上的探针可用，不把静态源码当作运行日志，也不替代目标环境的返回点、请求级关联和压力验证。

## 审计信息

- 验证范围：静态结构审查 6/6（3 正例、2 兄弟 Skill 诱饵、1 边界）。
- 本结果不包含目标内核实测，也不包含任何真实客户端命中率或运行时成功率。
