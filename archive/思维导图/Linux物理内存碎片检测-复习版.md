# Linux 物理内存碎片检测｜复习版

- 复习顺序：先看绿色必背句，再展开完整标准回答。
- 事实原则：原作者 PDF 提供设计主线；项目 Wiki 和八股中的源码核验结果优先修正当前实现边界。
- XMind 导入：本文件使用标题和缩进列表表达层级。

## 资料入口与阅读顺序

- 原作者 PDF：`projects/Linux物理内存检测项目/linux物理内存检测工具：_带目录.pdf`
- 项目代码流程详解：`projects/Linux物理内存检测项目/项目完整代码流程详解.md`
- 源码事实边界：`projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md`
- 高频面试题原文：`projects/嵌入式八股/Linux物理内存碎片高频面试题.md`

## 01. 项目定位与总链路

- 复习提示：先记住项目解决什么问题、采什么数据、数据怎样到终端。
- [必背] 总串：内核 eBPF 采集事件与状态 → BPF Map → Python 适配 → curses 展示。
- 项目痛点：总空闲内存可能够，但连续大块不足，导致高阶分配失败、fallback 和性能下降。
- 双层架构：内核态 eBPF 负责采集；用户态 Python 负责加载、读取、排序、格式化和展示。
- 输出维度：Node/Zone/Order 状态、两个碎片化指数，以及 PID/COMM/PFN/Order 的外碎片事件。
- 项目价值：把“发生了 fallback”与“当时伙伴系统是什么状态”放到同一条诊断链路中。

## 02. Linux 物理内存与伙伴系统

- 复习提示：用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。
- [必背] 高阶请求需要连续的 2^order 个物理页；空闲页总量和连续性是两个不同问题。
- Page 与 PFN：Page 是物理页管理基本单位，PFN 标识物理页框位置；Zone/Node 通过起始 PFN 等字段定位。
- Node → Zone → Order：Node 表示 NUMA 节点，Zone 表示 DMA/DMA32/NORMAL 等区域，Order 表示连续页块阶数。
- Buddy 核心：空闲块按 2^order 组织，分配时拆分，释放时尝试与伙伴合并。
- 快速/慢速路径：get_page_from_freelist 先做快速尝试；失败后可能进入 reclaim、compaction 和重试。
- 外碎片 vs 内碎片：伙伴系统重点对应页级外碎片；SLAB/SLUB 更关注小对象分配和内部碎片。

## 03. 双探针：事件视角与状态视角

- 复习提示：一条线记录发生了什么，另一条线解释系统当时是什么样。
- [必背] Tracepoint 定位 fallback 事件；kprobe 采集 Node/Zone/Order 状态；两条线互相解释。
- Tracepoint：mm_page_alloc_extfrag：预定义 kmem 事件，读取 PFN、ALLOC_ORDER、FALLBACK_ORDER，并补充 PID/COMM。
- kprobe：get_page_from_freelist：挂在函数入口，读取 alloc_context，遍历 zonelist、Zone 和 Order，形成状态快照。
- 为什么不能只用一种：只有事件没有状态解释，只有状态没有责任定位；双探针形成事件发现与状态解释闭环。
- 准确边界：入口快照是分配前状态；fallback 是特定事件，不等于所有失败；探针不替内核改变分配结果。

## 04. eBPF 与 BCC 运行流程

- 复习提示：掌握从 Python 启动到内核触发的完整生命周期。
- [必背] 源码经 BCC 编译和加载，Verifier 校验后挂到探针；之后等待内核事件被动触发。
- 生命周期：编写 → 编译 → bpf() 加载 → Verifier 校验 → JIT/挂载 → 内核触发 → 写 Map → 用户态读取。
- BCC 的角色：把 C 风格 eBPF 程序编译、加载、挂载，并向 Python 暴露 Map 和读取接口。
- 安全读取：内核结构体字段通过 bpf_probe_read_kernel 等 helper 读取，不能直接解引用任意内核指针。
- 被动触发：eBPF 不是主动扫描线程；它随目标事件或函数调用执行，但高频挂点仍有采样开销。

## 05. BPF Map 与数据流

- 复习提示：把每张 Map 的用途、键和值，以及用户态如何消费说清楚。
- [必背] Map 同时承担内核/用户态通信、控制参数和运行状态存储。
- 事件 Map：counts_map 以 PID 聚合 fallback 事件，保存累计次数和最近字段；它是聚合快照，不是完整事件日志。
- 状态 Map：pgdat_map 保存 Node 元数据，zone_map 保存 Zone + Order 的空闲页、块量和两个指数。
- 控制 Map：delay_map 传入采样间隔，last_time_map 保存上次采样时间或节流状态。
- 用户态消费：Python 遍历 Map，完成字段解码、排序、过滤、格式化，再交给 curses。
- 键设计风险：数值编码、硬编码 Order、Zone 数量推导和 Map 覆盖都可能造成数据解释偏差。

## 06. 碎片化指数与手算链路

- 复习提示：先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。
- [必背] unusable 更像“当前有多难”，extfrag 更像“困难是否主要由外碎片造成”。
- 三个中间量：free_pages 是空闲页总量；free_blocks_total 是总空闲块数；free_blocks_suitable 是满足目标阶的块量。
- 遍历所有 Order：高阶块可拆分成多个低阶块，必须按目标 Order 折算，不能只比较块数量。
- unusable_free_index：表示无法满足目标 Order 的空闲页比例；0 代表几乎都可用，1000 代表都不可用。
- extfrag_index：存在 suitable 块时通常返回 -1000；没有合适块时，越接近 1000 越像外碎片主导。
- 三类手算：有大块但碎页多；空闲页不少但全是小块；总空闲量本身不足，三者要分别解释。

## 07. Python 与 curses 展示

- 复习提示：用户态只做桥接、解析、过滤、格式化和终端展示。
- [必背] Python 不直接读内核地址，而是读 eBPF Map；采样间隔和 UI 刷新间隔分开理解。
- exfrag.py：负责选择 eBPF 程序、写控制 Map、读取 pgdat/zone/counts 数据并适配成 Python 结构。
- exfrag_user.py：负责命令行参数、模式选择、curses 初始化、表格/条形图绘制和刷新退出。
- 展示模式：默认摘要、-n 节点、-z Zone、-v Order 矩阵、-s 外碎片事件等模式按源码快照核对。
- 两层时间：delay_map/last_time_map 影响内核采样；time.sleep 等 UI 逻辑影响终端刷新，不能混为一谈。

## 08. 源码事实边界与生产化

- 复习提示：面试时区分设计意图、当前实现和需要验证的结论。
- [必背] 先修可运行性，再修节流和数据模型，最后用内核接口、workload 和性能指标做联合验证。
- 当前可运行性：模块名、C 文件路径、BCC import 和工作目录存在不一致，旧 quick start 不能直接当作已验证命令。
- 采样节流：时间 Map 的 key/更新时间没有形成严格闭环，多 CPU 下还要明确全局一次、每 CPU 一次还是近似节流。
- 数据模型：Order 范围、Zone 数量、Map key、PID 聚合和 Map 快照一致性都不能依赖硬编码或字段名猜测。
- 不能过度归因：工具能观察事件和状态，但不能单独证明某次失败完全由碎片造成、某进程制造了全部碎片或 compaction 一定有效。
- 生产验证：联合 /proc/buddyinfo、debugfs extfrag、/proc/vmstat、workload、内核版本和 CPU/Map/丢数基准。
- 重构顺序：统一路径和 import → 修节流 → 显式 key/动态 Order → 事件流与聚合分离 → 补版本和验证矩阵。

## 9. 高频面试题（35题）

- [必背] 每题先遮住答案口述 60～90 秒，再展开“标准回答（完整）”复盘。

### 1. Tracepoint 和 kprobe

#### 第 1 题：Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？

- [必背] Tracepoint 是预定义静态事件，kprobe 是动态函数插桩：前者更稳，后者更灵活但更依赖内核实现。
- 标准回答（完整）
  - Tracepoint 是内核开发者预先埋好的静态跟踪点，事件名和字段由内核定义。eBPF 程序挂载后，内核运行到该事件就把结构化上下文传给程序，因此可以直接通过 `args->field` 取字段。它语义明确、兼容性通常更好、开销较低，适合长期观测稳定事件。
  - kprobe 是运行时对内核函数进行动态插桩，可以挂到存在且可探测的内核符号上，不要求内核预先提供 Tracepoint。它更灵活，能深入函数入口观察参数和内部结构，但依赖函数名、签名和结构布局；版本变化后更容易失效。参数通常来自寄存器上下文或 BCC 生成的函数形参，复杂内核数据要通过 `bpf_probe_read_kernel()` 等 helper 安全读取。
  - 本项目用 Tracepoint 观察 `mm_page_alloc_extfrag` 这种已经定义好的外碎片事件，用 kprobe 深入 `get_page_from_freelist` 查看伙伴系统的 node、zone、order 和空闲块状态。
  - 【核心对比】
  - 【表格】维度；Tracepoint；kprobe
  - 【表格】探针来源；内核源码预定义的静态事件；运行时动态挂到内核函数
  - 【表格】灵活性；只能使用已有事件；可覆盖大量可探测函数
  - 【表格】稳定性；事件语义和字段相对稳定；依赖函数符号、签名和内核结构
  - 【表格】参数获取；结构化 `args->field`；函数参数、`pt_regs`、安全读取 helper
  - 【表格】数据粒度；事件提供什么就能拿什么；可沿函数参数深入复杂内核对象
  - 【表格】典型用途；生产长期观测、统计稳定事件；深入诊断、补足没有 Tracepoint 的内部状态
  - 【表格】本项目挂点；`kmem:mm_page_alloc_extfrag`；`get_page_from_freelist`
  - **源码对应：** `extfraginfo.c:20` 使用 `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)`；`fraginfo.c:91` 使用 BCC 命名约定 `kprobe__get_page_from_freelist(...)`。
  - **常见错误：**
  - 把 Tracepoint 说成“运行时随便插入的点”；它是内核预定义事件。
  - 说 kprobe 可以无条件挂“任意代码位置”；本项目实际挂的是可解析的函数符号入口。
  - 绝对化地说 Tracepoint ABI 永远不变。面试中说“相对稳定、通常比内部函数签名稳定”更严谨。
  - **面试追问：** 如果某个内核函数被重命名或参数顺序改变，哪个方案更容易失效？为什么？
  - **记忆口诀：** **Tracepoint 是官方摄像头，kprobe 是临时安装的探头。**
- 常见误区 / 边界
  - 不要说 Tracepoint ABI 永远不变，也不要说 kprobe 可以无条件插入任意代码位置。

#### 第 2 题：为什么这个项目同时使用 Tracepoint 和 kprobe，而不是只用其中一种？

- [必背] Tracepoint 负责发现 fallback 事件，kprobe 负责解释当时的 Node/Zone/Order 状态，二者互补。
- 标准回答（完整）
  - 因为两个探针回答的问题不同。`mm_page_alloc_extfrag` Tracepoint 回答“外碎片相关的 fallback 事件是否发生、由哪个进程触发、请求阶和实际来源阶是什么”，属于事件证据；`get_page_from_freelist` kprobe 回答“当前伙伴系统各 node、zone、order 的空闲块怎样分布、哪些空闲页能满足目标阶、两个碎片指数是多少”，属于状态诊断。
  - 只用 Tracepoint，能知道问题发生了，但拿不到完整的 `zone->free_area[]` 状态；只用 kprobe，能采集状态，却不如专用事件直接地定位哪个进程触发了外碎片 fallback。两者组合形成“事件发现问题 + 状态解释原因”的闭环。
  - 【双探针分工】
  - 【表格】问题；Tracepoint 路径；kprobe 路径
  - 【表格】什么时候采集；外碎片分配事件发生时；每次进入目标快速分配函数时，受采样控制意图约束
  - 【表格】核心数据；PID、进程名、PFN、请求阶、fallback 阶、次数；node、zone、order、空闲块、空闲页、两个指数
  - 【表格】Map；`counts_map`；`pgdat_map`、`zone_map`
  - 【表格】回答；谁触发了什么事件；当时内存布局健康吗
  - **源码对应：** `extfraginfo.c` 的 `data_t` 和 `counts_map`保存事件；`fraginfo.c` 的 `zone_info`、`pgdat_map`、`zone_map`保存状态。
  - **常见错误：** 说两个探针都只是“统计内存碎片”。应明确一个侧重事件，一个侧重整体状态。
  - **面试追问：** 如果只能保留一个探针做“哪个进程频繁触发外碎片事件”的告警，优先保留哪个？
  - **记忆口诀：** **Tracepoint 看报警单，kprobe 看体检报告。**
- 常见误区 / 边界
  - 只用事件看不到完整 Zone 状态，只用状态又难以定位具体 fallback 责任主体。

#### 第 3 题：为什么 mm_page_alloc_extfrag 适合用 Tracepoint 挂载？它什么时候会被内核触发？

- [必背] mm_page_alloc_extfrag 只表示特定 fallback/extfrag 事件，不等于所有分配失败或 OOM。
- 标准回答（完整）
  - `mm_page_alloc_extfrag` 本身就是 `kmem` 子系统预定义的 Tracepoint，语义正好对应伙伴系统分配中的外碎片/fallback 场景，因此无需对内部函数动态插桩。它会在伙伴分配器使用 fallback 路径、从其他合适的空闲块中完成分配并记录外碎片相关信息时触发。原作者文档把它概括为“因碎片化需要降级或 fallback 时触发”。
  - 项目直接从事件上下文读取 `pfn`、`alloc_order` 和 `fallback_order`，再补充当前 PID 与进程名，并按 PID 在 `counts_map` 中累计次数。它记录的是一次具体事件，不是周期扫描，也不是所有内存分配，更不等于已经 OOM。
  - 【触发和采集路径】
  - 【表格】字段；含义；项目用途
  - 【表格】`pfn`；分配页的页帧号；定位最近一次相关分配
  - 【表格】`alloc_order`；请求的阶；请求连续 `2^order` 个页
  - 【表格】`fallback_order`；实际找到并拆分/回退使用的阶；与请求阶对比，观察 fallback 程度
  - 【表格】PID、`pcomm`；当前进程上下文；找出高频触发进程
  - 【表格】`count`；按 PID 累积次数；对事件来源排序
  - **源码对应：** `extfraginfo.c:42-55` 直接读取事件 `args`，并更新 `counts_map`。
  - **常见错误：**
  - 说“高阶分配失败就一定触发”。它描述的是特定 fallback/外碎片分配事件，不应泛化为所有失败。
  - 把 `fallback_order` 当作“最终分配失败的错误码”。
  - **面试追问：** `alloc_order=2`、`fallback_order=5` 能说明什么？
  - **记忆口诀：** **请求阶是想要的尺寸，fallback 阶是实际被拆的来源尺寸。**
- 常见误区 / 边界
  - 不要把 fallback 事件泛化成所有高阶失败，也不要把它说成已经 OOM。

#### 第 4 题：为什么 get_page_from_freelist 适合用 kprobe 挂载？它在内核内存分配路径中处于什么位置？

- [必背] get_page_from_freelist 是快速路径关键函数，入口 kprobe 看到的是分配前状态，不是最终结果。
- 标准回答（完整）
  - `get_page_from_freelist` 是伙伴系统物理页分配快速路径中的关键内部函数，但项目需要的 node、zone、`free_area[order]` 等细粒度状态没有一个现成 Tracepoint 完整提供，所以使用 kprobe 挂到函数入口。
  - 内核准备好分配上下文后，会先调用它遍历 zonelist，检查 zone、水位线、NUMA/cpuset 等限制，并尝试从伙伴系统空闲链表分配。如果快速路径成功就返回页面；失败后上层才可能进入慢速路径，进行回收、规整或重试。项目在入口处借助 `alloc_context` 找到首选 zone/pgdat，再遍历备用 zonelist 和各阶空闲块，生成状态快照；它不是在替内核执行分配，也不改变函数返回值。
  - **源码对应：** `fraginfo.c:91-93` 声明了函数参数；`113-164` 从 `alloc_context` 出发遍历 zonelist、zone 和 order。
  - **常见错误：**
  - 说 kprobe 在“分配失败后”才触发；它挂函数入口，每次目标函数被调用都会触发。
  - 说 `get_page_from_freelist` 就是整个伙伴系统；它是核心快速分配路径之一。
  - **面试追问：** 为什么在函数入口采到的是“尝试前/进入时的状态”，不能直接当作本次分配结果？
  - **记忆口诀：** **快速分配先找 freelist，找不到才走慢路径。**
- 常见误区 / 边界
  - 不要说 kprobe 只在分配失败后触发；入口探针也不能证明最终分配结果。

#### 第 5 题：mm_page_alloc_extfrag 和 get_page_from_freelist 一个是“事件视角”、一个是“状态视角”，这句话怎么理解？

- [必背] 事件视角回答“发生了什么”，状态视角回答“系统现在是什么样”。
- 标准回答（完整）
  - 事件视角关注“发生了一次什么事”。`mm_page_alloc_extfrag` 每触发一次就提供一条具体事实：哪个进程、哪个 PFN、请求多少阶、fallback 到多少阶；项目再按 PID 聚合频率。
  - 状态视角关注“系统现在是什么样”。`get_page_from_freelist` kprobe 被触发后，`fraginfo.c` 遍历 node、zone 和 order，统计空闲页、空闲块、可满足目标请求的块，并计算 `score_a` 和 `score_b`。它不是只描述某一条事件，而是在采样时刻形成伙伴系统状态快照。
  - 因此事件数据适合定位“谁、何时、触发了什么”，状态数据适合解释“为什么这个阶难分配、问题偏向碎片还是内存不足”。联合起来才是完整诊断。
  - 【表格】视角；类比；时间语义；适合回答
  - 【表格】事件；医院急诊记录；某一刻发生的一件事；谁触发、发生多少次
  - 【表格】状态；全身体检报告；某个采样时刻的整体状态；哪个 zone/order 风险高、为什么
  - **源码对应：** `counts_map` 保存按 PID 聚合的事件；`zone_map` 保存每个 zone/order 的状态指标。
  - **常见错误：** 把“状态视角”说成持续轮询内核。该 eBPF 程序仍是被内核函数调用被动触发，只是每次触发时采集的内容是状态快照。
  - **面试追问：** 看到某 PID 的事件数很高，但对应 zone 的当前指数已恢复正常，可能有哪些解释？
  - **记忆口诀：** **事件回答“发生了什么”，状态回答“现在为什么”。**
- 常见误区 / 边界
  - 不要把事件累计快照当作完整事件日志。

### 2. eBPF 原理和运行流程

#### 第 6 题：eBPF 是什么？为什么它适合做 Linux 内核态监控？

- [必背] eBPF 是受 Verifier 约束、事件驱动的内核可编程机制，适合低侵入监控。
- 标准回答（完整）
  - eBPF 是 Linux 内核提供的一种安全、事件驱动的可编程机制。用户态把受限制的 eBPF 字节码加载进内核，Verifier 先检查安全性和可终止性，通过后可以解释执行或 JIT 成本地机器码，并挂载到 Tracepoint、kprobe 等事件点。
  - 它适合内核监控有四个原因：第一，能在事件发生现场获得内核上下文；第二，不需要修改内核源码或编写传统内核模块；第三，Verifier、受限 helper 和 Map 机制降低了直接破坏内核的风险；第四，事件触发时才执行，能在较低开销下实时采集并通过 Map 把数据交给用户态。
  - 本项目正是把轻量采集和聚合放在内核，将复杂展示放在 Python/curses 用户态。
  - 【表格】能力；对本项目的价值
  - 【表格】内核现场执行；能看到伙伴系统函数与 Tracepoint 参数
  - 【表格】Verifier 安全检查；阻止明显越界、非法指针和不可证明安全的程序
  - 【表格】Helper；获取时间、PID、进程名并安全读取内核数据
  - 【表格】BPF Map；与 Python 共享配置和结果
  - 【表格】事件驱动；页分配路径触发时采集，不需常驻轮询线程
  - **源码对应：** `bpf_ktime_get_ns()`、`bpf_get_current_pid_tgid()`、`bpf_get_current_comm()`、`bpf_probe_read_kernel()` 都是 eBPF helper 的具体使用。
  - **常见错误：** 把 eBPF 说成一个用户态监控进程，或说它可以在内核里执行任意 C 代码。
  - **面试追问：** Verifier 通过是否代表程序的业务逻辑一定正确？
  - **记忆口诀：** **受校验、事件驱动、内核执行、Map 传数。**
- 常见误区 / 边界
  - 不要只背“低开销”，还要能说出 Verifier、挂点和 Map 数据流。

#### 第 7 题：eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？

- [必背] 源码 → BCC 编译 → bpf() 加载 → Verifier 校验/JIT → 挂载 → 内核触发 → Map → 用户态。
- 标准回答（完整）
  - 本项目先用受限 C 编写 `extfraginfo.c` 和 `fraginfo.c`。Python 创建 BCC 的 `BPF(src_file=...)` 对象后，BCC 调用 Clang/LLVM 编译代码，创建 Map，并通过 `bpf()` 系统调用把程序加载进内核。内核 Verifier 检查指针访问、边界、栈、控制流和 helper 使用；通过后程序可被 JIT。
  - 随后 BCC 根据 `TRACEPOINT_PROBE` 或 `kprobe__函数名` 的约定完成挂载。平时程序不主动循环；只有内核执行到 `mm_page_alloc_extfrag` 事件或 `get_page_from_freelist` 函数时，才进入对应 eBPF 程序。程序读取上下文、计算并更新 BPF Map，返回后内核继续原来的执行路径。Python 周期读取 Map，再由 curses 刷新界面。
  - **源码对应：** `exfrag.py:17-22` 选择 C 文件并写 `delay_map`；两个 C 文件定义探针和 Map。
  - **常见错误：**
  - 漏掉 Verifier，直接说“编译完就在内核运行”。
  - 说 Python 每次刷新都会重新加载 eBPF；实际是初始化时加载，之后读取同一组 Map。
  - **面试追问：** 如果 Verifier 拒绝程序，会发生在挂载之前还是之后？
  - **记忆口诀：** **写、编、载、验、挂、触、采、读、显。**
- 常见误区 / 边界
  - 挂载成功不等于运行时一定有数据，内核符号、权限、配置和探针触发条件都要验证。

#### 第 8 题：BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？

- [必背] BCC 把 eBPF 的编译、加载、挂载和 Map 访问封装成 Python 接口。
- 标准回答（完整）
  - BCC 是本项目的 eBPF 开发框架和用户态桥梁。Python 调用 `BPF(src_file=...)` 后，BCC 负责把 C 源码交给 Clang/LLVM 编译、调用 `bpf()` 创建 Map 和加载程序，并根据 BCC 宏和函数命名约定挂载 Tracepoint/kprobe。它还把内核 Map 暴露成 Python 可访问对象，例如 `self.b["zone_map"]`，让用户态可以像遍历字典一样读取数据、向 `delay_map` 写配置。
  - 因此开发者不用手写底层 bpf 系统调用、文件描述符管理和 attach 细节，也能获得编译/Verifier 日志，降低调试门槛。但 BCC 只是工具链和封装，不是内核真正执行采集的主体。
  - 【表格】阶段；BCC 帮助
  - 【表格】编译；调用 Clang/LLVM 编译内嵌或文件形式的 eBPF C
  - 【表格】加载；封装 Map 创建和 `bpf()` 程序加载
  - 【表格】挂载；识别 `TRACEPOINT_PROBE`、`kprobe__*` 等约定
  - 【表格】通信；把 Map 暴露给 Python 读写
  - 【表格】调试；提供编译错误和 Verifier 日志
  - **源码对应：** `exfrag.py:2` 导入 BPF，`17-22` 创建对象并写 Map。
  - **常见错误：** 把 BCC 与 eBPF 当成同一个东西。eBPF 是内核机制，BCC 是帮助开发、加载和访问的用户态框架。
  - **面试追问：** 不使用 BCC 能否运行 eBPF？可以，替代方案需要承担哪些工作？
  - **记忆口诀：** **eBPF 是发动机，BCC 是装配、点火和仪表接口。**
- 常见误区 / 边界
  - BCC 是加载和桥接工具，不是替代内核 eBPF 逻辑的业务层。

#### 第 9 题：eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？

- [必背] eBPF 不主动轮询内核，而是挂在事件/函数上被动触发，采集后写入 Map。
- 标准回答（完整）
  - 被触发后，程序先读取时间和用户配置，按设计判断是否需要跳过本次采样；然后读取 Tracepoint 参数或 kprobe 函数上下文，调用 helper 获取进程信息或安全读取内核结构，进行有限的统计和指数计算，最后更新 BPF Map 并返回 0。返回后，原来的内核页分配流程继续。
  - 它被称为被动触发，是因为 eBPF 程序自身没有一个常驻的 `while true` 线程，也不会自己定时唤醒；执行机会来自挂载点。内核不发生对应事件或不调用对应函数时，这两个 eBPF 程序就不会运行。用户态 curses 的刷新循环和 eBPF 的触发循环是两回事。
  - 【表格】程序；触发后主要动作
  - 【表格】`extfraginfo.c`；读事件字段、补 PID/comm、按 PID 更新次数
  - 【表格】`fraginfo.c`；遍历 zonelist 和 order、统计空闲块、计算指数、更新 node/zone Map
  - **源码对应：** 两个探针函数都以 `return 0` 结束；用户态循环位于 `exfrag_user.py`，不是 eBPF 程序内部。
  - **当前源码提醒：** 代码写出了采样控制框架，但时间 Map 的 key 使用有缺陷，详见文末“源码核验发现”。
  - **常见错误：** 把 Python 的 `while True` 刷新循环说成 eBPF 在内核中一直执行。
  - **面试追问：** 如果页面分配非常频繁，事件驱动为什么仍然可能有高开销？
  - **记忆口诀：** **挂点不响，eBPF 不跑；挂点一响，采完就走。**
- 常见误区 / 边界
  - 被动触发不等于没有开销，高频挂点仍必须做采样和性能验证。

#### 第 10 题：eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？

- [必背] 用户态通过 bpf() 系统调用请求内核加载、校验并挂载 eBPF 程序。
- 标准回答（完整）
  - 用户执行 Python 后，BCC 先编译 C 代码，再通过 Linux 的 `bpf()` 系统调用创建 Map、加载 eBPF 指令并取得相应文件描述符。加载时 Verifier 校验程序；只有通过后才具备执行资格。随后 BCC 根据程序段/宏和命名约定，把程序关联到 `kmem:mm_page_alloc_extfrag` Tracepoint 或 `get_page_from_freelist` kprobe。
  - 这里要区分“加载”和“触发”：`bpf()` 让程序进入内核并准备好，attach 建立挂点关系；真正执行要等内核路径运行到目标事件或函数。项目源码没有显式写出底层系统调用，因为这些步骤被 BCC Python API 封装了。
  - **源码对应：** `BPF(src_file=...)` 是当前项目可见的加载入口；底层 `bpf()` 和 attach 由 BCC 处理。
  - **常见错误：** 说 eBPF 是 Python 通过普通函数调用直接“跳进内核”的；跨越用户态/内核态的是系统调用和内核 attach 机制。
  - **面试追问：** 程序已经加载成功但一直没有数据，应该依次检查哪几个环节？
  - **记忆口诀：** **系统调用负责进内核，attach 负责等事件。**
- 常见误区 / 边界
  - bpf() 是用户态请求进入内核的系统调用，不要把它说成探针触发机制。

### 3. eBPF 与内核/用户态交互

#### 第 11 题：BPF Map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？

- [必背] BPF Map 是内核 eBPF 与用户态 Python 之间的共享数据通道，也是控制和状态存储。
- 标准回答（完整）
  - BPF Map 是由内核管理、同时向 eBPF 程序和持有 Map 文件描述符的用户态程序开放的数据结构。内核侧使用 `lookup`、`update` 写入事件和状态；Python 侧通过 BCC 的 `self.b["map_name"]` 访问同一个 Map。
  - 通信是双向的：Python 把采样间隔写入 `delay_map[0]`，eBPF 读取它作为配置；eBPF 把事件写入 `counts_map`，把 node/zone 状态写入 `pgdat_map` 和 `zone_map`，Python 再遍历这些 Map 整理成列表或字典交给 curses。Map 共享的是结构化状态，不是让内核直接调用 Python。
  - **源码对应：** `exfrag.py:22` 写入 `delay_map`；`35-148` 读取各结果 Map。
  - **常见错误：** 说 BPF Map 只是 Hash。项目既用了 `BPF_HASH`，也用了长度为 1 的 `BPF_ARRAY`。
  - **面试追问：** 为什么不让 eBPF 直接把格式化表格打印到终端？
  - **记忆口诀：** **配置向内写，结果向外读，中间都走 Map。**
- 常见误区 / 边界
  - Map 是共享状态，不天然等于严格一致的事务或事件日志。

#### 第 12 题：counts_map、pgdat_map、zone_map、delay_map、last_time_map 分别干什么？

- [必背] counts_map 存事件聚合，pgdat_map 存 Node 元数据，zone_map 存 Zone/Order 状态，另外两张 Map 控制采样。
- 标准回答（完整）
  - `counts_map` 按 PID 聚合外碎片事件；`pgdat_map` 保存 NUMA node 的摘要；`zone_map` 保存每个 zone 与 order 的空闲块、空闲页和指数；`delay_map` 由 Python 写入采样间隔；`last_time_map` 的设计目标是记录上次有效采样时间，与 `delay_map` 一起节流。
  - 当前源码中，前四类数据流清楚；`last_time_map` 的 key 使用存在实现问题，不能把“设计上用于节流”直接说成“当前代码已经可靠节流”。
  - 【表格】Map；类型；key；value；读写方向
  - 【表格】`counts_map`；Hash；PID；`data_t`；eBPF 写，Python 读
  - 【表格】`pgdat_map`；Hash；`pgdata` 指针转成的 `u64`；`pgdat_info`；eBPF 写，Python 读
  - 【表格】`zone_map`；Hash；当前源码为 `zone_ptr + order`；`zone_info`；eBPF 写，Python 读
  - 【表格】`delay_map`；Array(1)；固定 0；秒级间隔；Python 写，eBPF 读
  - 【表格】`last_time_map`；Hash；设计上应能稳定定位“上次时间”；纳秒时间戳；eBPF 读写
  - **源码对应：** Map 声明位于 `extfraginfo.c:16-18` 和 `fraginfo.c:43-46`。
  - **常见错误：** 说 `zone_map` 的 key 是源码中显式定义的结构体二元组。当前实现实际是数值相加编码。
  - **面试追问：** 为什么 `delay_map` 适合 Array，而 `counts_map` 适合 Hash？
  - **记忆口诀：** **count 记进程，pgdat 记节点，zone 记阶，delay/last 控时间。**
- 常见误区 / 边界
  - delay_map 控制采样计划，last_time_map 保存状态；不要把 UI 刷新间隔混为一谈。

#### 第 13 题：为什么 counts_map 用 PID 作为 key 聚合外部碎片事件？为什么 zone_map 要按 zone + order 维度统计？

- [必背] PID 聚合便于定位责任主体，但会丢时间序列、Order/迁移类型分布并受 PID 复用影响。
- 标准回答（完整）
  - `counts_map` 的业务目标是找出哪个进程最频繁触发外碎片事件。用 PID 做 key，可以在内核里就把同一进程的多次事件合并为一条记录，减少 Map 空间和用户态处理量，同时保留最近的 PFN、请求阶、fallback 阶和进程名。
  - 伙伴系统的连续块可用性不仅取决于 zone，也取决于请求阶。同一个 zone 对 order 0 可能很健康，对 order 8 却可能没有任何可用连续块。因此 `zone_map` 必须为每个 zone/order 组合保存一条状态，才能回答“哪个区域的哪个阶存在风险”。当前源码把 `zone_ptr + order` 作为 key，用 value 中的 `node_id`、名称和 order 还原维度。
  - 【表格】聚合维度；为什么不能更粗；为什么不保存全量事件
  - 【表格】PID；只按进程名会混合同名进程；全量事件增长快，Map 压力大
  - 【表格】zone + order；只按 zone 会掩盖高阶碎片；每个组合保留最新状态已足够展示
  - **源码对应：** `extfraginfo.c:38-55` 查找并更新 PID；`fraginfo.c:147-162` 为每个 order 计算并写入 zone 数据。
  - **常见错误：** 说 `counts_map` 保存每一次原始事件；它保存的是按 PID 聚合结果。
  - **面试追问：** PID 被系统复用时，长期运行的 `counts_map` 可能出现什么问题？
  - **记忆口诀：** **事件按责任人聚合，状态按区域和尺寸展开。**
- 常见误区 / 边界
  - PID 聚合会遇到 PID 复用、并发更新和多种 Order/迁移类型被覆盖的问题。

#### 第 14 题：为什么 eBPF 读取内核结构体时要用 bpf_probe_read_kernel() 或 bpf_probe_read_kernel_str()？直接访问内核指针有什么风险？

- [必背] 读取内核结构体必须使用安全 helper，避免直接解引用无效指针并降低内核崩溃风险。
- 标准回答（完整）
  - kprobe 获得的参数经常包含内核指针，例如 `zone`、`free_area` 和 zone 名称。eBPF 不能像普通内核 C 一样任意解引用不受信任或 Verifier 无法证明安全的指针，否则可能越界、访问无效地址、遇到并发变化，或者直接被 Verifier 拒绝。
  - `bpf_probe_read_kernel()` 是受控的内核内存读取 helper，用来把指定大小的数据复制到 eBPF 栈或局部变量；字符串使用 `bpf_probe_read_kernel_str()`，它处理终止符和长度边界。本项目读取 `zone->free_area[order].nr_free` 和 `zone->name` 时分别使用这两个 helper。
  - 【表格】helper；本项目读取内容；保护重点
  - 【表格】`bpf_probe_read_kernel()`；`nr_free`；固定长度、安全拷贝
  - 【表格】`bpf_probe_read_kernel_str()`；zone 名称；长度限制和 NUL 终止
  - **源码对应：** `fraginfo.c:81-82` 和 `145`。
  - **常见错误：** 说 helper 能保证读到的数据绝对一致。它提高访问安全性，但并不自动提供跨多个字段的原子快照。
  - **面试追问：** 为什么内核版本变化仍可能让这些读取失效，即使使用了安全 helper？
  - **记忆口诀：** **指针不能乱解，数值安全拷，字符串专门读。**
- 常见误区 / 边界
  - 直接访问内核指针可能读到无效地址、触发验证器拒绝或引入内核崩溃风险。

### 4. Python、BCC 和 curses 用户态展示

#### 第 15 题：Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？

- [必背] Python 不是核心采集层：exfrag.py 负责 BCC/Map 适配，exfrag_user.py 负责入口、模式和 curses。
- 标准回答（完整）
  - Python 不是核心采集层，真正读取内核事件和伙伴系统状态的是内核里的 eBPF 程序。Python 是“控制面 + 数据适配 + 展示层”。
  - `exfrag.py` 定义 `ExtFrag` 类：根据输出模式选择加载 `extfraginfo.c` 或 `fraginfo.c`，向 `delay_map` 写采样间隔，从 `counts_map`、`pgdat_map`、`zone_map` 读取数据，再把 C 结构体转换成 Python 列表和字典。`exfrag_user.py` 是命令行和 curses UI：解析参数、初始化终端、调用 `ExtFrag` 的读取方法，并把节点、区域、事件次数、指数、颜色和条形图画到屏幕上。
  - 【表格】层；文件；核心职责
  - 【表格】内核采集；`extfraginfo.c`、`fraginfo.c`；事件采集、状态统计、指数计算
  - 【表格】Python 适配；`exfrag.py`；加载 eBPF、配置 Map、读 Map、整理数据
  - 【表格】终端展示；`exfrag_user.py`；参数解析、模式选择、curses 绘制与刷新
  - **源码对应：** `ExtFrag.__init__()` 负责加载与配置；`get_zone_data()`、`get_node_data()`、`get_count_data()` 负责读取；`curses.wrapper(main)` 启动 UI。
  - **常见错误：** 说 Python 直接读取 `struct zone`。Python 读的是 eBPF 已写入 Map 的结果。
  - **面试追问：** 为什么把复杂格式化和 UI 放在用户态，而不放进 eBPF？
  - **记忆口诀：** **C 在内核采，Python 在用户态管和画。**
- 常见误区 / 边界
  - 不要说 Python 直接读取任意内核地址；它读取的是 eBPF 写入的 Map。

#### 第 16 题：BPF(src_file=...)、写入 delay_map、读取 zone_map/counts_map 分别对应项目运行链路中的哪个阶段？

- [必背] 加载和写 delay_map 属于启动/控制阶段，读取 zone_map/counts_map 属于运行时消费阶段。
- 标准回答（完整）
  - `BPF(src_file=...)` 属于初始化加载阶段：BCC 编译 C、通过系统调用加载程序和 Map，并按约定完成挂载。向 `delay_map[0]` 写值属于配置阶段：用户态把刷新/采样间隔传给内核侧。读取 `zone_map` 或 `counts_map` 属于运行时消费阶段：eBPF 已在事件触发时写入结果，Python 周期读取、转换并交给 UI。
  - 三者不是同一时刻重复执行。加载通常发生一次；配置在初始化时写入；结果读取随 UI 刷新周期反复进行。
  - **源码对应：** `exfrag.py:17-22`；读取逻辑位于 `get_zone_data()` 和 `get_count_data()`。
  - **常见错误：** 认为 `delay_map` 存的是 Python 的显示结果；它存的是配置值。
  - **面试追问：** UI 刷新间隔与内核采样节流间隔是否天然就是同一件事？
  - **记忆口诀：** **BPF 负责启，delay 负责配，结果 Map 负责取。**
- 常见误区 / 边界
  - 当前源码快照存在模块名和 C 文件路径不一致，不能把旧 quick start 当成已验证命令。

#### 第 17 题：curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？

- [必背] curses 通过周期刷新绘制表格、条形图和筛选结果，展示 Node/Zone/Order、指数和事件。
- 标准回答（完整）
  - curses 把终端当作可按坐标重绘的画布。项目通过 `curses.wrapper(main)` 安全初始化和恢复终端，在 `main` 中关闭回显、隐藏光标、启用非阻塞输入和颜色；循环读取最新 Map 数据后，用 `screen.addstr(row, col, text, color)` 覆盖指定区域，再调用 `refresh()` 刷新，而不是不断 `print` 新行。
  - 页面支持 node 信息、外碎片事件次数、详细 zone 信息、简化指数视图和条形图。主要字段包括进程名、PID、PFN、请求阶、fallback 阶、次数，以及 zone 名、node、order、总空闲块、可用块、空闲页、`extfrag_index` 和 `unusable_index`。代码还把 `order > 5` 且 `scoreB > 0.5` 的记录标红。
  - 【表格】显示模式；主要信息
  - 【表格】node 信息；node_id、zone 数、node_start_pfn
  - 【表格】event count；comm、PID、PFN、alloc/fallback order、count
  - 【表格】zone 详情；zone、PFN、页数、order、块数、两个指数
  - 【表格】简化视图/条形图；node、zone、order、指数、风险颜色
  - **源码对应：** `exfrag_user.py:68-84` 初始化 curses；`143-207` 解析参数；`232-411` 绘制并刷新。
  - **常见错误：** 只说“curses 做了一个 UI”，但说不出“坐标覆盖、颜色、周期 refresh、多模式”。
  - **面试追问：** 终端尺寸不足时项目怎样处理？
  - **记忆口诀：** **读数据、按坐标画、颜色标风险、refresh 原地更新。**
- 常见误区 / 边界
  - curses 只是展示层，不能因为 UI 能刷新就证明内核采样准确。

#### 第 18 题：为什么用 curses 做 TUI，而不是普通 print 输出？

- [必背] TUI 能原地刷新、着色、筛选和退出，比普通 print 更适合实时观察。
- 标准回答（完整）
  - 内存碎片数据是持续变化的多维表格。如果用 `print`，每次刷新都会向下追加，终端很快滚屏，用户难以横向比较同一个 zone/order 的变化。curses 可以原地覆盖、固定表头、按颜色突出高风险项、处理键盘和窗口变化，还能展示条形图，更适合做实时监控面板。
  - 代价是代码更复杂、终端尺寸和兼容性要求更高，当前实现甚至要求至少 50 行、250 列。因此它适合本地运维和演示，不等同于生产级 Web 监控；长期留存和告警仍应接入指标系统。
  - 【表格】维度；普通 print；curses TUI
  - 【表格】刷新方式；不断追加；原地覆盖
  - 【表格】对比趋势；容易滚屏；固定布局更直观
  - 【表格】颜色/条形图；较弱；原生支持
  - 【表格】交互；简单；可处理按键、窗口变化
  - 【表格】实现复杂度；低；高
  - **源码对应：** `screenEnough()` 检查尺寸；`generate_fragmentation_bar()` 生成条形图；`screen.nodelay(True)` 支持非阻塞交互。
  - **常见错误：** 把“更好看”当作唯一理由。核心价值是实时、原地、结构化刷新。
  - **面试追问：** 如果改成 Prometheus + Grafana，内核采集层需要全部重写吗？
  - **记忆口诀：** **print 适合日志，curses 适合实时仪表盘。**
- 常见误区 / 边界
  - TUI 带来终端尺寸、异常退出和刷新开销等边界，需要单独验证。

### 5. Linux 内存管理重点

#### 第 19 题：为什么系统”总空闲内存还够”，却仍然可能分配不出大块连续物理内存？

- [必背] 空闲总量足够不代表存在足够大的连续块，连续性不足就是典型外部碎片问题。
- 标准回答（完整）
  - 因为高阶物理页分配要求物理地址连续。伙伴系统中 order 为 `n` 的请求需要 `2^n` 个连续页。系统可能有很多空闲页，但它们分散在不同位置、不同 zone、不同 node，或被不可移动页面隔开，无法合并成目标阶的连续块，这就是外部碎片。
  - 例如需要 order 3，即 8 个连续页；系统有 20 个空闲页，但最大连续段只有 4 页，按总量看足够，按连续性看仍然失败。回收解决“总量不足”，compaction 通过迁移可移动页改善连续性；两者解决的问题不同。
  - 【表格】情况；总空闲页；最大连续块；order 3 能否分配
  - 【表格】连续；8；8 页；能
  - 【表格】分散；20；4 页；不能
  - **源码对应：** `fill_contig_page_info()` 同时统计总空闲页和能满足特定 order 的块，正是为了区分总量和连续性。
  - **常见错误：** 把虚拟地址连续和物理页连续混为一谈。
  - **面试追问：** 为什么 order 0 通常比 order 8 更不容易受外部碎片影响？
  - **记忆口诀：** **空闲总量看“有多少”，高阶分配还要看“连不连”。**
- 常见误区 / 边界
  - 不要把空闲总量等同于连续可用内存，也不要把外碎片和内部碎片混为一谈。

#### 第 20 题：伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？

- [必背] Buddy 按 2^order 管理连续页；Node/NUMA、Zone 和 Order 是采集指标的三层坐标。
- 标准回答（完整）
  - 伙伴系统是 Linux 管理物理页的核心分配器之一，把连续页按 2 的幂组织到各阶空闲链表中；需要小块时可拆分高阶块，释放后满足条件的伙伴可合并。order 表示连续页数的指数，order `n` 对应 `2^n` 页。zone 是一个 node 内按地址能力和用途划分的物理内存区域，如 DMA、DMA32、Normal。node 是 NUMA 内存节点，每个节点与一组 CPU 的访问距离不同，内部包含多个 zone。
  - 项目的 `pgdat_map` 对应 node，`zone_map` 对应 zone + order；`zone_info` 保存 zone 名、页范围、node_id、空闲页、空闲块和两个指数。
  - 【表格】内核概念；含义；项目落点
  - 【表格】node；NUMA 物理内存节点；`pgdat_map`、`node_id`
  - 【表格】zone；节点内的管理区域；`zone_info.name`、zone 指针
  - 【表格】order；连续页块大小指数；`zone_info.order`
  - 【表格】伙伴空闲链表；各阶空闲块；`free_area[order].nr_free`
  - **源码对应：** `fraginfo.c:8-27` 定义 node/zone 输出结构，`121-162` 建立映射。
  - **常见错误：** 说一个 zone 就是一个 NUMA node；node 通常包含多个 zone。
  - **面试追问：** 页大小为 4 KiB 时，order 5 表示多少连续内存？
  - **记忆口诀：** **node 是仓库，zone 是库区，order 是连续货架尺寸，buddy 管拆合。**
- 常见误区 / 边界
  - Node/Zone/Order 是不同层次，不能用一个“内存区域”概念替代全部。

#### 第 21 题：外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？

- [必背] 项目主要观测伙伴系统页级外部碎片；SLAB/SLUB 更关注小对象和内部碎片。
- 标准回答（完整）
  - 外部碎片是空闲空间总量可能足够，但分散后无法组成需要的连续物理块；内部碎片是已经分配的块大于实际需求，块内部有未利用空间。伙伴系统位于页级，按 2 的幂分配连续物理页，通过拆分、合并和迁移类型分组来管理并缓解外部碎片，但 2 的幂向上取整也可能产生一定内部浪费。
  - SLAB/SLUB 建在伙伴系统之上，向伙伴系统申请页，再为内核小对象建立对象缓存，减少频繁页分配和小对象内部浪费。这个项目的两个挂点、order 分布和碎片指数都围绕伙伴系统的连续物理页可用性，因此主要观测外部碎片，不是对象缓存级的 SLUB 碎片分析器。
  - 【表格】概念；层级；典型问题；本项目是否直接观测
  - 【表格】伙伴系统；物理页；连续页块拆分、合并、外碎片；是
  - 【表格】SLAB/SLUB；内核对象；小对象缓存与内部浪费；否，仅有上下游关系
  - 【表格】外部碎片；空闲块之间；总量够但不连续；核心目标
  - 【表格】内部碎片；已分配块内部；分得比实际需要多；不是核心目标
  - **源码对应：** 项目读取 `zone->free_area[]`，没有读取 SLUB cache/slab 元数据。
  - **常见错误：** 说“伙伴系统彻底解决外部碎片”。更准确是管理并尽量缓解，长期运行后仍可能碎片化。
  - **面试追问：** 监控 SLUB 内部碎片应该选择哪些不同的数据和挂点？
  - **记忆口诀：** **Buddy 管页，SLUB 管对象；本项目看页之间是否连得起来。**
- 常见误区 / 边界
  - 本项目主要针对外部碎片，不等于覆盖所有 SLAB/SLUB 对象碎片。

#### 第 22 题：get_page_from_freelist 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收、内存规整有什么关系？

- [必背] 它先尝试快速路径，失败后上层可能进入回收、规整、放宽限制并重试；探针只看到一次函数调用。
- 标准回答（完整）
  - `get_page_from_freelist` 接收 `gfp_mask`、order、分配标志和 `alloc_context`，沿 zonelist 检查允许使用的 zone、水位线、NUMA/cpuset 和迁移类型等条件，然后尝试从伙伴空闲链表取出满足请求的连续页。它是快速路径的关键步骤，目标是在现有可用内存状态下尽快完成分配。
  - 如果快速路径找不到合适页，上层分配逻辑才可能进入慢速路径：直接回收释放页解决容量压力，compaction 迁移可移动页形成大连续块解决碎片压力，然后重新尝试；必要时还可能 OOM。项目在这个函数入口做 kprobe，只观察状态，不执行或触发这些机制。
  - 【表格】机制；主要目标
  - 【表格】fast path；利用当前可用空闲块快速完成分配
  - 【表格】reclaim；增加空闲页总量
  - 【表格】compaction；提高空闲页连续性
  - 【表格】OOM；无法通过正常手段满足内存需求时的最后处理
  - **源码对应：** 项目使用 `ac->preferred_zoneref` 和 fallback zonelist 定位 zone，但不调用回收或规整。
  - **常见错误：** 说 `get_page_from_freelist` 失败就必然 OOM；中间还有慢速路径和多种重试。
  - **面试追问：** 为什么“空闲页少”更偏向 reclaim，“空闲页不少但无高阶块”更偏向 compaction？
  - **记忆口诀：** **快路径先找现货，找不到再回收腾量、规整腾连续。**
- 常见误区 / 边界
  - get_page_from_freelist 是快速路径之一，不等于整个伙伴系统，也不等于一次上层请求。

#### 第 23 题：mm_page_alloc_extfrag 捕获的 fallback 事件说明什么？ALLOC_ORDER 和 FALLBACK_ORDER 的差异能反映什么问题？

- [必背] ALLOC_ORDER 是原始请求阶数，FALLBACK_ORDER 是 fallback 块阶数，差异反映跨迁移类型/降级事实。
- 标准回答（完整）
  - 该事件说明伙伴系统没有直接从理想的目标空闲块路径满足请求，而使用了 fallback/更高阶块拆分等方式完成相关分配。`ALLOC_ORDER` 是请求需要的阶，`FALLBACK_ORDER` 是实际拿来满足请求的来源阶。两者相差越大，意味着为了一个较小请求拆分了更大的连续块，可能消耗宝贵的高阶连续内存，并增加后续高阶请求的压力。
  - 但一次差值不能单独证明系统已严重碎片化。要结合事件频率、进程、目标 zone/order 的 `free_blocks_suitable` 和两个指数判断。它也不等同于本次分配失败；很多情况下 fallback 后分配仍然成功。
  - 【表格】示例；解释
  - 【表格】alloc 2, fallback 2；使用同阶块，没有跨阶拆分信息
  - 【表格】alloc 2, fallback 5；从 32 页块中拆出 4 页请求，消耗较高阶连续块
  - 【表格】同 PID 大量出现较大差值；该进程可能持续制造高阶块拆分压力
  - **源码对应：** `data_t` 保存两个 order；`counts_map` 只保留同一 PID 的最新 order/PFN 和累计次数。
  - **常见错误：** 把 FALLBACK_ORDER 解释成回退到了更小的阶。这里它表示实际来源块的阶，原作者示例中通常高于请求阶。
  - **面试追问：** 为什么仅按 PID 累积总次数会丢失 order 差值的历史分布？
  - **记忆口诀：** **要小块却拆大块，差值越大越伤高阶库存。**
- 常见误区 / 边界
  - fallback_order 不是“错误码”，也不能简单解释成所有高阶请求都降成低阶。

#### 第 24 题：extfraginfo.c 和 fraginfo.c 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计分别怎么对应？

- [必背] extfraginfo.c 采集事件，fraginfo.c 采集状态；一个定位发生者，一个解释系统状态。
- 标准回答（完整）
  - `extfraginfo.c` 是事件采集程序。它挂 `mm_page_alloc_extfrag` Tracepoint，读取 PFN、请求阶、fallback 阶，补充 PID/comm，并在 `counts_map` 中按 PID 聚合事件次数。
  - `fraginfo.c` 是状态采样和计算程序。它挂 `get_page_from_freelist` kprobe，通过 `alloc_context` 找到 node/zone，遍历各 order 的 `free_area[].nr_free`，计算三项中间量和两个指数，再写入 `pgdat_map`、`zone_map`。
  - 【表格】文件；探针；输入；输出；定位
  - 【表格】`extfraginfo.c`；Tracepoint；事件 args + 进程上下文；`counts_map`；事件监控
  - 【表格】`fraginfo.c`；kprobe；函数参数 + 内核结构；`pgdat_map`、`zone_map`；状态统计与评分
  - **源码对应：** 两个文件的探针入口分别位于第 20 行和第 91 行附近。
  - **常见错误：** 说两个文件都会同时加载。`exfrag.py` 当前是根据 `output_count` 二选一加载。
  - **面试追问：** 当前二选一加载会给“事件与状态联合诊断”带来什么限制？
  - **记忆口诀：** **extfraginfo 记事件，fraginfo 做体检。**
- 常见误区 / 边界
  - 两个 C 文件由输出模式选择时未必同时运行，必须结合当前实现核对。

### 6. eBPF 程序如何计算碎片化指数

#### 第 25 题：fill_contig_page_info() 做了什么？为什么它要遍历所有 order？

- [必背] 遍历所有 Order 才能把不同阶的块统一折算，得到目标 Order 的总量和可满足量。
- 标准回答（完整）
  - `fill_contig_page_info()` 针对一个 zone 和一个目标 `suitable_order`，遍历 `order=0` 到 `MAX_ORDER` 的伙伴空闲链表，安全读取每阶的 `nr_free`，汇总三个量：总空闲页数、所有空闲块数、以及折算成目标阶后可满足请求的块数。
  - 必须遍历所有 order，因为低阶块贡献空闲总量和块分散程度，高阶块既贡献总量，也可以拆成多个目标阶块。只看目标阶会漏掉更高阶可拆分资源；只看目标阶以上又无法判断总空闲页是不是其实很多但都碎在低阶。三个汇总量随后同时供 `unusable_free_index()` 和 `__fragmentation_index()` 使用。
  - **源码对应：** `fraginfo.c:71-89`。
  - **常见错误：** 说它只统计“目标 order 以上的空闲块”。那只是 `free_blocks_suitable` 的一部分逻辑；另两个量包含所有阶。
  - **面试追问：** 如果只遍历 `order >= suitable_order`，哪个指标会被系统性低估？
  - **记忆口诀：** **所有阶算家底，高阶再算能用多少。**
- 常见误区 / 边界
  - nr_free 是块数，不是页数；不能跳过高阶块折算。

#### 第 26 题：free_pages、free_blocks_total、free_blocks_suitable 分别代表什么？

- [必背] free_pages 是空闲页总量，free_blocks_total 是空闲块总数，free_blocks_suitable 是满足目标阶的块量。
- 标准回答（完整）
  - `free_pages` 是把所有阶空闲块乘以各自页数后得到的总空闲页；`free_blocks_total` 是所有阶空闲块“块数”的简单合计，用来反映空闲空间被分成多少块；`free_blocks_suitable` 是所有能够满足目标阶请求的高阶块，折算成“等价目标阶块数”后的总数。
  - 假设目标 order 为 2，一个 order 2 空闲块贡献 1 个 suitable，一个 order 4 空闲块可拆成 4 个 order 2 块，因此贡献 4。最后 `free_blocks_suitable << target_order` 就能还原成对该请求真正可用的页数。
  - 【表格】指标；源码累加方式；回答的问题
  - 【表格】`free_pages`；`blocks << order`；总共有多少空闲页
  - 【表格】`free_blocks_total`；`+ blocks`；空闲页分散成多少块
  - 【表格】`free_blocks_suitable`；`blocks << (order-target)`；对目标阶等价可用多少块
  - **源码对应：** `fraginfo.c:83-87`。
  - **常见错误：** 把 `free_blocks_suitable` 当作原始高阶块个数；它已经按目标阶折算。
  - **面试追问：** 目标 order 为 3 时，2 个 order 5 块贡献多少个 suitable block？
  - **记忆口诀：** **pages 看页数，total 看碎成几块，suitable 看目标请求能用几份。**
- 常见误区 / 边界
  - free_blocks_total 和 free_pages 维度不同，不能直接互换。

#### 第 27 题：free_blocks_suitable 为什么不能只简单统计 order >= suitable_order 的块数，而要按高阶块折算？

- [必背] 高阶块可以拆分满足多个低阶请求，suitable 必须折算页数/块数，不能只数块。
- 标准回答（完整）
  - 因为不同阶的一个块能满足目标请求的次数不同。目标 order 为 2 时，一个 order 2 块只能满足一次 4 页请求；一个 order 5 块有 32 页，理论上可以拆成 8 个 order 2 块。如果都只计为 1，会严重低估高阶块对目标请求的供给能力。
  - 源码使用 `blocks << (order - suitable_order)`，本质是乘以 `2^(order-target)`。这样所有高阶资源都被统一换算到目标阶单位，后续左移目标 order 才能得到真正可用页数。该计算是假设伙伴块可按需要拆分的容量折算，不等于预测每次实际分配一定成功。
  - 【表格】目标 order；现有块；简单计数；正确折算
  - 【表格】2；1 个 order 2；1；1
  - 【表格】2；1 个 order 3；1；2
  - 【表格】2；1 个 order 5；1；8
  - **源码对应：** `fraginfo.c:86-87`。
  - **常见错误：** 把左移理解成“字节数转换”。这里转换的是等价目标阶块数量。
  - **面试追问：** 为什么低于目标阶的多个小块不能直接相加算 suitable？
  - **记忆口诀：** **大块能拆多份，小块不能凭空拼成连续大块。**
- 常见误区 / 边界
  - 高阶块是否能满足请求还涉及拆分、对齐、相邻性和迁移类型，不是简单的 order 比较。

#### 第 28 题：unusable_free_index 和 extfrag_index 分别衡量什么？为什么需要两个指标，而不是只用一个？

- [必背] unusable_free_index 衡量“现在有多难”，extfrag_index 更偏向判断“为什么难”。
- 标准回答（完整）
  - `unusable_free_index`（源码中的 `score_b`）衡量现有空闲页中，有多大比例不能用于当前 order 请求。它更像“不可用比例”：0 表示空闲页几乎都能形成目标阶资源，1000 表示对该请求完全不可用或没有空闲页。
  - `extfrag_index`（`score_a`）更偏向原因诊断：当没有 suitable block 时，结合总空闲页、请求大小和空闲块数量，判断分配困难更像是外部碎片，还是总量不足。存在 suitable block 时返回 `-1000` 作为哨兵值；正区间越接近 1000，越偏向碎片主导。
  - 两个指标回答不同问题：一个量化“当前空闲页有多少对目标请求不可用”，另一个帮助区分“为什么会困难”。联合看比单一分数更稳妥。
  - 【表格】指标；核心视角；典型范围；解读
  - 【表格】unusable / score_b；空闲页可用比例；0～1000；越高，目标阶可用页比例越低
  - 【表格】extfrag / score_a；失败原因倾向；-1000 或约 0～1000；-1000 表示已有 suitable；正值越高越偏碎片
  - **源码对应：** `fraginfo.c:48-69`；结果写入 `zone_info.score_b/score_a`。
  - **常见错误：** 把两个指标都简单说成“越大碎片越严重”，忽略 `-1000` 哨兵和原因诊断语义。
  - **面试追问：** 为什么 score_b 很高时仍不能只凭它断言“碎片是唯一原因”？
  - **记忆口诀：** **B 看有多少不能用，A 看困难更像碎片还是缺量。**
- 常见误区 / 边界
  - 两个指数不能合并成一个笼统的“碎片率”，还要结合水位、回收和规整解释。

#### 第 29 题：extfrag_index 中如果 free_blocks_suitable > 0，为什么可以直接返回负值？这个负值表示什么？

- [必背] 只要存在 suitable 块，连续性不是当前障碍，extfrag_index 返回负值表示状态良好。
- 标准回答（完整）
  - `free_blocks_suitable > 0` 表示当前 zone 至少存在一个可直接使用或通过拆分满足目标 order 的连续块，因此“因为没有合适连续块而失败”的前提不成立。源码直接返回 `-1000`，把它作为特殊哨兵值，表示当前无需用正区间指数诊断外部碎片导致的失败。
  - 这个负值不是“负碎片率”，也不是数学意义上的 -100%；它是控制语义。用户态 `calculate_scoreA()` 会把整数缩放成显示字符串，但解释时必须保留“特殊返回值”的含义。
  - **源码对应：** `fraginfo.c:62-68`。
  - **常见错误：** 说 -1000 表示“内存非常充足”。它只严格说明当前统计中有 suitable block，不代表整个系统各维度都充足。
  - **面试追问：** `free_blocks_total == 0` 返回 0 为什么不能被理解为“完全没有碎片”？
  - **记忆口诀：** **有合适块就不判碎片，-1000 是哨兵，不是百分比。**
- 常见误区 / 边界
  - 负值表示存在合适连续块，不代表所有分配条件（例如 watermark）都一定满足。

#### 第 30 题：如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？

- [必背] 空闲少且 extfrag 接近 0 更像总量不足；空闲不少、suitable 少且 extfrag 高更像外碎片。
- 标准回答（完整）
  - 要按同一个 node、zone、order 联合看。先看 `free_pages` 判断总量，再看 `free_blocks_suitable` 判断连续性。若 suitable 大于 0，当前仍有可满足块；若 suitable 为 0 且总空闲页也很少，问题更像容量不足；若 suitable 为 0，但总空闲页相对不少、低阶块很多，`extfrag_index` 又较高，则更像外部碎片。
  - `unusable_free_index` 高说明大部分空闲页对目标 order 无法利用，但还要结合 `extfrag_index`、总空闲页和事件数据。原作者文档提到内核常用 `/proc/sys/vm/extfrag_threshold`（常见默认 500）辅助 compaction 决策；本项目只是计算和展示指数，并没有在源码中主动触发 compaction。
  - 【表格】观察组合；更可能的判断
  - 【表格】suitable > 0，score_a = -1000；当前仍有合适连续块
  - 【表格】suitable = 0，free_pages 很少，score_a 偏低；总量不足倾向
  - 【表格】suitable = 0，free_pages 不少，低阶块多，score_a 高；外部碎片倾向
  - 【表格】score_b 高；多数空闲页对该 order 不可用，需要结合上面条件
  - **源码对应：** UI 可同时展示 `TOTAL`、`SUITABLE`、`FREE`、score_a 和 score_b。
  - **常见错误：** 机械地用单一 0.5 阈值下结论；面试中应强调同一 zone/order 的多指标联合和时间趋势。
  - **面试追问：** 为什么必须按 order 分析，不能只给整个 zone 一个碎片分数？
  - **记忆口诀：** **先看量，再看连续；有量无块是碎片，无量无块是缺内存。**
- 常见误区 / 边界
  - 指数只能说明 Zone/Order 状态，不能单独证明某次失败完全由碎片造成。

### 7. 整个项目运行逻辑

#### 第 31 题：请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终能展示什么？

- [必背] 一分钟介绍按痛点、技术栈、双探针、Map 数据流、可视化结果和项目边界组织。
- 标准回答（完整）
  - 这个项目解决的是 Linux 服务器总空闲内存看起来还够，但因为物理页不连续，高阶连续页分配仍可能困难的问题。它使用 BCC/eBPF 在内核页分配路径上布置两个互补探针：`mm_page_alloc_extfrag` Tracepoint 记录具体 fallback 外碎片事件，并按 PID 统计触发进程；`get_page_from_freelist` kprobe 深入伙伴系统，按 node、zone、order 统计空闲页、空闲块、可满足请求的块，并计算 extfrag 和 unusable 两个指数。
  - 内核采集结果通过 BPF Map 共享给 Python。`exfrag.py` 负责加载程序、传递配置和整理 Map 数据，`exfrag_user.py` 使用 curses 展示事件次数、zone/order 状态、指数、颜色和条形图。相比只看 `/proc/buddyinfo`，它把事件来源、实时状态和可视化结合起来，适合定位高阶分配压力和外碎片趋势。
  - 【1 分钟结构】
  - 【表格】时间；要讲什么
  - 【表格】前 15 秒；痛点：总空闲够但连续页不足
  - 【表格】15～35 秒；双探针：事件 + 状态
  - 【表格】35～50 秒；Map + Python + curses
  - 【表格】最后 10 秒；价值和边界
  - **源码对应：** 四个核心文件分别构成“事件采集、状态计算、数据适配、UI 展示”。
  - **常见错误：** 一上来堆 eBPF 名词，没有先讲项目解决的真实问题。
  - **面试追问：** 这个项目最有区分度的技术点是什么？
  - **记忆口诀：** **痛点、双探针、Map、Python 展示、诊断价值。**
- 常见误区 / 边界
  - 项目介绍要说明这是 BCC/eBPF 教学原型，并诚实说明当前源码的可运行性边界。

#### 第 32 题：从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链路是什么？

- [必背] 用户态启动 → BCC 加载 → eBPF 挂探针 → 内核触发 → Map 写入 → Python 读取 → curses 展示。
- 标准回答（完整）
  - 用户运行 `exfrag_user.py`，程序解析命令行并创建 `ExtFrag`。`ExtFrag` 根据模式选择 `extfraginfo.c` 或 `fraginfo.c`，BCC 编译并通过 `bpf()` 加载，Verifier 通过后挂到 Tracepoint 或 kprobe。Python 把间隔写入 `delay_map[0]`。
  - 之后内核运行到 `mm_page_alloc_extfrag` 或 `get_page_from_freelist` 时，被动执行 eBPF：前者聚合进程事件到 `counts_map`，后者统计 node/zone/order 并把结果写入 `pgdat_map` 和 `zone_map`。Python 周期遍历这些 Map，解码字符串、格式化分数、排序和过滤；curses 再按模式绘制表头、数据、颜色和条形图并刷新。
  - **源码对应：** `exfrag_user.py:202-207` 创建对象；`209-411` 循环读取和显示。
  - **当前源码边界：** 当前目录中的 Python 文件名、导入名和 `./bpf/` 源码路径并不完全一致，部署时要统一；这不改变设计链路，但会影响当前快照直接运行。
  - **常见错误：** 漏掉“Verifier/attach”或漏掉“Map 是内核与 Python 的中间层”。
  - **面试追问：** 当前代码为什么是根据模式二选一加载，而不是同时加载两个 eBPF 程序？
  - **记忆口诀：** **入口解析 -> BCC 加载 -> 挂点触发 -> Map 汇总 -> Python 整理 -> curses 刷新。**
- 常见误区 / 边界
  - 不要把 eBPF 说成主动后台线程；探针是内核事件触发，Python 是读取和展示。

#### 第 33 题：这个项目相比 /proc/buddyinfo 有什么优势和不足？它更适合解决什么场景下的问题？

- [必背] 相比 buddyinfo，本项目提供事件、Node/Zone/Order 和指数，但复杂度、兼容性和语义风险更高。
- 标准回答（完整）
  - `/proc/buddyinfo` 是内核提供的各 node/zone/order 空闲块快照，简单、稳定、无需加载探针，适合快速看当前伙伴空闲链表。但它本身不告诉你哪个进程触发了外碎片事件，也不直接计算本项目的两个指数或提供动态 TUI。
  - 本项目的优势是事件与状态结合：可以按 PID 聚合 `mm_page_alloc_extfrag`，按 zone/order 计算可用性和原因指数，并用 curses 实时展示。它适合复现高阶分配抖动、寻找频繁触发进程、观察碎片趋势和教学演示。
  - 不足是依赖 BCC、内核符号和结构布局，kprobe 兼容性弱；高频路径采集可能有开销；Map 聚合会丢失历史；当前代码还有节流、路径和键设计问题。因此生产诊断应与 `/proc/buddyinfo`、内核 trace、告警和长期指标联合使用。
  - 【表格】维度；/proc/buddyinfo；本项目
  - 【表格】数据性质；读取时的静态快照；事件驱动采集 + 动态展示
  - 【表格】进程归因；无；有 PID/comm 聚合
  - 【表格】指数；需自行计算；eBPF 内核侧计算
  - 【表格】依赖与兼容性；低；BCC、探针、内核版本敏感
  - 【表格】长期趋势；需外部采集；当前也缺少持久化
  - 【表格】开销；很低；与触发频率和采集工作量相关
  - **源码对应：** 本项目通过 `fraginfo.c` 自行遍历 `free_area[]`，并通过 `extfraginfo.c` 增加 `/proc/buddyinfo` 不提供的进程事件归因。
  - **常见错误：** 说本项目“完全替代” `/proc/buddyinfo`。
  - **面试追问：** 为什么从 `/proc/buddyinfo` 用户态计算指数可能比在高频 kprobe 中遍历所有 order 更省开销？
  - **记忆口诀：** **buddyinfo 简单看库存，本项目进一步看事件、原因和实时展示。**
- 常见误区 / 边界
  - 优势和不足要一起说，不能只说 eBPF 比 buddyinfo 更实时、更低开销。

#### 第 34 题：这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 delay_map 和 last_time_map？

- [必背] delay_map 提供采样间隔，last_time_map 保存采样状态；内核节流和 UI sleep 是两层不同机制。
- 标准回答（完整）
  - 设计意图是时间窗口采样。Python 把秒级间隔写入 `delay_map[0]`；eBPF 每次触发先用 `bpf_ktime_get_ns()` 取当前时间，再从 `last_time_map` 取上次真正采样时间。如果间隔未到就立即返回，只有超过 delay 才执行遍历、计算和 Map 更新，并记录本次时间。因为两个挂点都可能在页分配高频路径上，尤其 `fraginfo.c` 还要遍历 zone 和所有 order，没有节流会显著增加 CPU 开销。
  - 但当前源码没有正确完成这个设计：两个文件都用不断变化的 `current_time` 作为查询 key；`fraginfo.c` 又以当前时间为 key 更新，下一次几乎不可能用新时间命中旧记录；`extfraginfo.c` 甚至没有更新时间 Map。因此面试时应说“项目设计了节流机制，但当前实现有 key 和更新缺陷，需要改成固定 key（如 0）或单元素 Array/Per-CPU 方案”。
  - 【表格】项目；设计意图；当前源码
  - 【表格】`delay_map`；key 0 保存间隔；基本符合
  - 【表格】查询上次时间；用稳定 key 查同一条记录；错用 `&current_time`
  - 【表格】更新上次时间；有效采样后覆盖同一 key；fraginfo 用新时间作 key
  - 【表格】extfrag 更新；有效采样后更新；缺失
  - **源码对应：** `extfraginfo.c:21-31`；`fraginfo.c:94-105,166`。
  - **常见错误：** 只背“delay + last 实现节流”，没有核对源码是否真的命中同一个 key。
  - **面试追问：** 修成固定 key 后，多 CPU 并发触发还可能有什么竞争和重复采样问题？
  - **记忆口诀：** **delay 定窗口，last 记上次；key 必须稳定，更新必须发生。**
- 常见误区 / 边界
  - 当前时间 Map 的 key/更新时间逻辑存在闭环问题，采样开销必须实测。

#### 第 35 题：如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？

- [必背] 生产化要同时修兼容性、节流、数据模型、Order 动态发现、事件日志、准确性和可观测性。
- 标准回答（完整）
  - 兼容性上，我会优先使用稳定 Tracepoint，kprobe 部分迁移到 libbpf + CO-RE，使用 BTF 和 `BPF_CORE_READ`，并针对不同内核校验函数签名；同时修正当前 Python 导入名和 C 文件路径。
  - 性能上，先修复时间节流，考虑 Per-CPU Map、降低 kprobe 触发采样比例、避免每次遍历所有 zone/order，或把可从 `/proc/buddyinfo` 获得的低频状态放到用户态计算。数据准确性上，使用显式结构体 key 表示 node/zone/order，处理 PID 复用、Map 容量、过期清理、并发计数原子性，并同时加载事件和状态探针形成时间关联。
  - 可观测性上，把结果导出为 Prometheus 指标或 ring buffer 事件，增加丢失数、采样次数、程序开销、Map 使用率和加载失败日志；建立历史趋势、阈值告警和基线。上线前做多内核版本、NUMA、压力场景和开销基准测试，并提供最小权限与自动降级策略。
  - 【表格】方向；优化项；解决的问题
  - 【表格】兼容性；CO-RE/BTF、稳定挂点、签名探测；内核升级后失效
  - 【表格】性能；正确节流、采样、Per-CPU、减少循环；高频路径开销
  - 【表格】准确性；结构体 key、原子聚合、过期清理、双探针关联；冲突、竞态、历史丢失
  - 【表格】可观测性；指标导出、丢失计数、加载日志、历史趋势；只能看当前终端
  - 【表格】工程化；路径修复、权限、测试矩阵、降级；难部署和维护
  - **源码对应：** 优化建议直接针对当前 `kprobe__get_page_from_freelist` 的签名依赖、Map key、时间逻辑和 Python 路径。
  - **常见错误：** 只回答“降低采样频率、增加日志”，没有从兼容性、正确性和工程部署完整展开。
  - **面试追问：** 如果只能先做三项改造，你会如何排序？推荐：修运行路径和节流正确性 -> 建立准确性/开销指标 -> 再做 CO-RE 与导出。
  - **记忆口诀：** **先能跑对，再跑得轻；再跨版本，最后接入生产观测。**
- 常见误区 / 边界
  - 生产化不能只换成 CO-RE，还要补充事件丢失、Map 容量、并发、版本和长期运行验证。

## 10. 面试前 30 秒速记

- 痛点：空闲总量够，不代表连续大块够。
- 事件：`mm_page_alloc_extfrag` Tracepoint 记录 fallback 事实。
- 状态：`get_page_from_freelist` kprobe 观察 Node/Zone/Order 快照。
- 计算：先算 `free_pages`、`free_blocks_total`、`free_blocks_suitable`，再解释两个指数。
- 桥接：BCC 加载 eBPF，BPF Map 连接内核态与 Python/curses。
- 边界：当前代码的路径、节流、Order、Map key 和聚合语义都要经过验证。
