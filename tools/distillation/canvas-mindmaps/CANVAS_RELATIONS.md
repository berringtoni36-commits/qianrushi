# Obsidian Canvas 关系摘要

> Canvas 按 JSON Canvas 1.0 解析为派生证据；节点中引用的 Markdown/源码才是事实来源。为避免重复计数，本文件不把 Canvas 节点作为独立正文来源。


## Linux物理内存碎片检测-复习版.canvas

- 原始路径：`archive/思维导图/Linux物理内存碎片检测-复习版.canvas`
- 节点：198；边：197
- JSON：有效；节点 ID 唯一：True；边引用有效：True

### 节点摘要

1. `ac8b254bb630e281` (text)：# Linux 物理内存碎片检测 **复习版｜纵向单主干** 从问题 → 内核机制 → 双探针 → Map → 指数 → 面试回答。
2. `88673a676a32a5c6` (text)：## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险
3. `947a3c679e7a1c3e` (file)：projects/Linux物理内存检测项目/linux物理内存检测工具：_带目录.pdf
4. `caa741c62ea064f0` (file)：projects/嵌入式八股/Linux物理内存碎片高频面试题.md.easy-sync-recovery
5. `5d0d648f190ef69d` (file)：projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md
6. `db0f5b58c7a8a3e4` (text)：# 01 项目定位与总链路 先记住项目解决什么问题、采什么数据、数据怎样到终端。 **总串：内核 eBPF 采集事件与状态 → BPF Map → Python 适配 → curses 展示。**
7. `61a69b046a9777cb` (text)：## 项目痛点 总空闲内存可能够，但连续大块不足，导致高阶分配失败、fallback 和性能下降。
8. `1b0bce191eba13b4` (text)：## 双层架构 内核态 eBPF 负责采集；用户态 Python 负责加载、读取、排序、格式化和展示。
9. `c0ecc3172593cdb6` (text)：## 输出维度 Node/Zone/Order 状态、两个碎片化指数，以及 PID/COMM/PFN/Order 的外碎片事件。
10. `aa64cf785dc8ded9` (text)：## 项目价值 把“发生了 fallback”与“当时伙伴系统是什么状态”放到同一条诊断链路中。
11. `deeca230ff89066a` (text)：# 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请求需要连续的 2^order 个物理页；空闲页总量和连续性是两个不同问题。**
12. `856d77be5c3c3cdd` (text)：## Page 与 PFN Page 是物理页管理基本单位，PFN 标识物理页框位置；Zone/Node 通过起始 PFN 等字段定位。
13. `d1a88000d3fd96b2` (text)：## Node → Zone → Order Node 表示 NUMA 节点，Zone 表示 DMA/DMA32/NORMAL 等区域，Order 表示连续页块阶数。
14. `eb45bf11d94a211e` (text)：## Buddy 核心 空闲块按 2^order 组织，分配时拆分，释放时尝试与伙伴合并。
15. `9ee400e34d85f86b` (text)：## 快速/慢速路径 get_page_from_freelist 先做快速尝试；失败后可能进入 reclaim、compaction 和重试。
16. `c6f885c01a2f9e6d` (text)：## 外碎片 vs 内碎片 伙伴系统重点对应页级外碎片；SLAB/SLUB 更关注小对象分配和内部碎片。
17. `193078288e0b46dc` (text)：# 03 双探针：事件视角与状态视角 一条线记录发生了什么，另一条线解释系统当时是什么样。 **Tracepoint 定位 fallback 事件；kprobe 采集 Node/Zone/Order 状态；两条线互相解释。**
18. `e82aa527cb599cc4` (text)：## Tracepoint：mm_page_alloc_extfrag 预定义 kmem 事件，读取 PFN、ALLOC_ORDER、FALLBACK_ORDER，并补充 PID/COMM。
19. `573f39a345d06e09` (text)：## kprobe：get_page_from_freelist 挂在函数入口，读取 alloc_context，遍历 zonelist、Zone 和 Order，形成状态快照。
20. `d003593652d07524` (text)：## 为什么不能只用一种 只有事件没有状态解释，只有状态没有责任定位；双探针形成事件发现与状态解释闭环。
21. `f9c73c965ff5bc46` (text)：## 准确边界 入口快照是分配前状态；fallback 是特定事件，不等于所有失败；探针不替内核改变分配结果。
22. `ce48f2e66db47a2d` (text)：# 04 eBPF 与 BCC 运行流程 掌握从 Python 启动到内核触发的完整生命周期。 **源码经 BCC 编译和加载，Verifier 校验后挂到探针；之后等待内核事件被动触发。**
23. `80dca83cf02f7e48` (text)：## 生命周期 编写 → 编译 → bpf() 加载 → Verifier 校验 → JIT/挂载 → 内核触发 → 写 Map → 用户态读取。
24. `0693a56315839d27` (text)：## BCC 的角色 把 C 风格 eBPF 程序编译、加载、挂载，并向 Python 暴露 Map 和读取接口。
25. `d40626f402f7d2fa` (text)：## 安全读取 内核结构体字段通过 bpf_probe_read_kernel 等 helper 读取，不能直接解引用任意内核指针。
26. `42dda3fd85efb240` (text)：## 被动触发 eBPF 不是主动扫描线程；它随目标事件或函数调用执行，但高频挂点仍有采样开销。
27. `6ddc78ab7ee4c0a1` (text)：# 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参数和运行状态存储。**
28. `4749c7db1181a9a5` (text)：## 事件 Map counts_map 以 PID 聚合 fallback 事件，保存累计次数和最近字段；它是聚合快照，不是完整事件日志。
29. `90400cbba8c3d2f4` (text)：## 状态 Map pgdat_map 保存 Node 元数据，zone_map 保存 Zone + Order 的空闲页、块量和两个指数。
30. `9cd02f00d74a8614` (text)：## 控制 Map delay_map 传入采样间隔，last_time_map 保存上次采样时间或节流状态。
31. `ee89920e9c1cb3ce` (text)：## 用户态消费 Python 遍历 Map，完成字段解码、排序、过滤、格式化，再交给 curses。
32. `0a8ec3d73f1c2636` (text)：## 键设计风险 数值编码、硬编码 Order、Zone 数量推导和 Map 覆盖都可能造成数据解释偏差。
33. `c8396f11d8363871` (text)：# 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **unusable 更像“当前有多难”，extfrag 更像“困难是否主要由外碎片造成”。**
34. `aaa62ede5b0d5a85` (text)：## 三个中间量 free_pages 是空闲页总量；free_blocks_total 是总空闲块数；free_blocks_suitable 是满足目标阶的块量。
35. `dee51771eb3e17ed` (text)：## 遍历所有 Order 高阶块可拆分成多个低阶块，必须按目标 Order 折算，不能只比较块数量。
36. `26ed5eb01f6c1d7e` (text)：## unusable_free_index 表示无法满足目标 Order 的空闲页比例；0 代表几乎都可用，1000 代表都不可用。
37. `697fc99ca703a8e5` (text)：## extfrag_index 存在 suitable 块时通常返回 -1000；没有合适块时，越接近 1000 越像外碎片主导。
38. `7a137e8ba263fe7f` (text)：## 三类手算 有大块但碎页多；空闲页不少但全是小块；总空闲量本身不足，三者要分别解释。
39. `f6adb3de099efed9` (text)：# 07 Python 与 curses 展示 用户态只做桥接、解析、过滤、格式化和终端展示。 **Python 不直接读内核地址，而是读 eBPF Map；采样间隔和 UI 刷新间隔分开理解。**
40. `f32f349f26456f21` (text)：## exfrag.py 负责选择 eBPF 程序、写控制 Map、读取 pgdat/zone/counts 数据并适配成 Python 结构。
41. `4a89aef49413cc3c` (text)：## exfrag_user.py 负责命令行参数、模式选择、curses 初始化、表格/条形图绘制和刷新退出。
42. `81993a2d4ae650ac` (text)：## 展示模式 默认摘要、-n 节点、-z Zone、-v Order 矩阵、-s 外碎片事件等模式按源码快照核对。
43. `f8fbcf3b4ef5ad60` (text)：## 两层时间 delay_map/last_time_map 影响内核采样；time.sleep 等 UI 逻辑影响终端刷新，不能混为一谈。
44. `2c5c515eb5ea20f7` (text)：# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、workload 和性能指标做联合验证。**
45. `4854569cc3e2b411` (text)：## 当前可运行性 模块名、C 文件路径、BCC import 和工作目录存在不一致，旧 quick start 不能直接当作已验证命令。
46. `f991f220ba5fb2a6` (text)：## 采样节流 时间 Map 的 key/更新时间没有形成严格闭环，多 CPU 下还要明确全局一次、每 CPU 一次还是近似节流。
47. `bb2813362be6564d` (text)：## 数据模型 Order 范围、Zone 数量、Map key、PID 聚合和 Map 快照一致性都不能依赖硬编码或字段名猜测。
48. `bb385608b3b97bfb` (text)：## 不能过度归因 工具能观察事件和状态，但不能单独证明某次失败完全由碎片造成、某进程制造了全部碎片或 compaction 一定有效。
49. `041645c20c792337` (text)：## 生产验证 联合 /proc/buddyinfo、debugfs extfrag、/proc/vmstat、workload、内核版本和 CPU/Map/丢数基准。
50. `92cc953bfe56714d` (text)：## 重构顺序 统一路径和 import → 修节流 → 显式 key/动态 Order → 事件流与聚合分离 → 补版本和验证矩阵。
51. `15d678ad99780b81` (text)：# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。
52. `0392c09336fdd287` (text)：## 1. Tracepoint 和 kprobe 第 1～5 题
53. `39b08cf89676a75c` (text)：### 第 1 题 Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？
54. `f748293c9702da7c` (text)：## 必背结论 Tracepoint 是预定义静态事件，kprobe 是动态函数插桩：前者更稳，后者更灵活但更依赖内核实现。
55. `abfee4b07ed406b7` (text)：## 标准回答（完整） Tracepoint 是内核开发者预先埋好的静态跟踪点，事件名和字段由内核定义。eBPF 程序挂载后，内核运行到该事件就把结构化上下文传给程序，因此可以直接通过 \`args->field\` 取字段。它语义明确、兼容性通常更好、开销较低，适合长期观测稳定事件。 kprobe 是运行时对内核函数进行动态插桩，可以挂到存在且可探测的内核符号上，不要求内核预先提供 Tracepoint。它更灵活，能深入函数入口观察参数和内部结构，但依赖函数名、签名和结构布局；版本变化后更容易失效。参数通常来自寄
56. `cec07c21f901dfc0` (text)：## 常见误区 / 边界 不要说 Tracepoint ABI 永远不变，也不要说 kprobe 可以无条件插入任意代码位置。
57. `3989f5972944998a` (text)：### 第 2 题 为什么这个项目同时使用 Tracepoint 和 kprobe，而不是只用其中一种？
58. `37b8f0e3e36b77dc` (text)：## 必背结论 Tracepoint 负责发现 fallback 事件，kprobe 负责解释当时的 Node/Zone/Order 状态，二者互补。
59. `7fb09efc99177d91` (text)：## 标准回答（完整） 因为两个探针回答的问题不同。\`mm_page_alloc_extfrag\` Tracepoint 回答“外碎片相关的 fallback 事件是否发生、由哪个进程触发、请求阶和实际来源阶是什么”，属于事件证据；\`get_page_from_freelist\` kprobe 回答“当前伙伴系统各 node、zone、order 的空闲块怎样分布、哪些空闲页能满足目标阶、两个碎片指数是多少”，属于状态诊断。 只用 Tracepoint，能知道问题发生了，但拿不到完整的 \`zone->fr
60. `cf9c1f3a7e36faf5` (text)：## 常见误区 / 边界 只用事件看不到完整 Zone 状态，只用状态又难以定位具体 fallback 责任主体。
61. `423e041ffee1dcb5` (text)：### 第 3 题 为什么 mm_page_alloc_extfrag 适合用 Tracepoint 挂载？它什么时候会被内核触发？
62. `8e8ef95da3882f30` (text)：## 必背结论 mm_page_alloc_extfrag 只表示特定 fallback/extfrag 事件，不等于所有分配失败或 OOM。
63. `3cb77663363806d4` (text)：## 标准回答（完整） \`mm_page_alloc_extfrag\` 本身就是 \`kmem\` 子系统预定义的 Tracepoint，语义正好对应伙伴系统分配中的外碎片/fallback 场景，因此无需对内部函数动态插桩。它会在伙伴分配器使用 fallback 路径、从其他合适的空闲块中完成分配并记录外碎片相关信息时触发。原作者文档把它概括为“因碎片化需要降级或 fallback 时触发”。 项目直接从事件上下文读取 \`pfn\`、\`alloc_order\` 和 \`fallback_order\`，
64. `98afc123fbb6a84b` (text)：## 常见误区 / 边界 不要把 fallback 事件泛化成所有高阶失败，也不要把它说成已经 OOM。
65. `368f7f2f294fe6f7` (text)：### 第 4 题 为什么 get_page_from_freelist 适合用 kprobe 挂载？它在内核内存分配路径中处于什么位置？
66. `a3afbd56316c1de9` (text)：## 必背结论 get_page_from_freelist 是快速路径关键函数，入口 kprobe 看到的是分配前状态，不是最终结果。
67. `62a255f1e3783110` (text)：## 标准回答（完整） \`get_page_from_freelist\` 是伙伴系统物理页分配快速路径中的关键内部函数，但项目需要的 node、zone、\`free_area[order]\` 等细粒度状态没有一个现成 Tracepoint 完整提供，所以使用 kprobe 挂到函数入口。 内核准备好分配上下文后，会先调用它遍历 zonelist，检查 zone、水位线、NUMA/cpuset 等限制，并尝试从伙伴系统空闲链表分配。如果快速路径成功就返回页面；失败后上层才可能进入慢速路径，进行回收、规整或重试
68. `b7751c26270acf80` (text)：## 常见误区 / 边界 不要说 kprobe 只在分配失败后触发；入口探针也不能证明最终分配结果。
69. `1489c328119c6743` (text)：### 第 5 题 mm_page_alloc_extfrag 和 get_page_from_freelist 一个是“事件视角”、一个是“状态视角”，这句话怎么理解？
70. `69932e3d0ad2853a` (text)：## 必背结论 事件视角回答“发生了什么”，状态视角回答“系统现在是什么样”。
71. `08f39744e4547c87` (text)：## 标准回答（完整） 事件视角关注“发生了一次什么事”。\`mm_page_alloc_extfrag\` 每触发一次就提供一条具体事实：哪个进程、哪个 PFN、请求多少阶、fallback 到多少阶；项目再按 PID 聚合频率。 状态视角关注“系统现在是什么样”。\`get_page_from_freelist\` kprobe 被触发后，\`fraginfo.c\` 遍历 node、zone 和 order，统计空闲页、空闲块、可满足目标请求的块，并计算 \`score_a\` 和 \`score_b\`。它
72. `e8d86b161047f9e8` (text)：## 常见误区 / 边界 不要把事件累计快照当作完整事件日志。
73. `2582994222e69871` (text)：## 2. eBPF 原理和运行流程 第 6～10 题
74. `5af32c8edbce1ff2` (text)：### 第 6 题 eBPF 是什么？为什么它适合做 Linux 内核态监控？
75. `0551ad7ee6704622` (text)：## 必背结论 eBPF 是受 Verifier 约束、事件驱动的内核可编程机制，适合低侵入监控。
76. `304326fa77a66520` (text)：## 标准回答（完整） eBPF 是 Linux 内核提供的一种安全、事件驱动的可编程机制。用户态把受限制的 eBPF 字节码加载进内核，Verifier 先检查安全性和可终止性，通过后可以解释执行或 JIT 成本地机器码，并挂载到 Tracepoint、kprobe 等事件点。 它适合内核监控有四个原因：第一，能在事件发生现场获得内核上下文；第二，不需要修改内核源码或编写传统内核模块；第三，Verifier、受限 helper 和 Map 机制降低了直接破坏内核的风险；第四，事件触发时才执行，能在较低开销下实时采
77. `8bfacbcf087e1745` (text)：## 常见误区 / 边界 不要只背“低开销”，还要能说出 Verifier、挂点和 Map 数据流。
78. `049271a641ddd3ac` (text)：### 第 7 题 eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？
79. `3d86c7b273812c43` (text)：## 必背结论 源码 → BCC 编译 → bpf() 加载 → Verifier 校验/JIT → 挂载 → 内核触发 → Map → 用户态。
80. `feb42451614dafa6` (text)：## 标准回答（完整） 本项目先用受限 C 编写 \`extfraginfo.c\` 和 \`fraginfo.c\`。Python 创建 BCC 的 \`BPF(src_file=...)\` 对象后，BCC 调用 Clang/LLVM 编译代码，创建 Map，并通过 \`bpf()\` 系统调用把程序加载进内核。内核 Verifier 检查指针访问、边界、栈、控制流和 helper 使用；通过后程序可被 JIT。 随后 BCC 根据 \`TRACEPOINT_PROBE\` 或 \`kprobe__函数名\` 
81. `bd113ccf402b598c` (text)：## 常见误区 / 边界 挂载成功不等于运行时一定有数据，内核符号、权限、配置和探针触发条件都要验证。
82. `20a38354ca718c90` (text)：### 第 8 题 BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？
83. `f7835a66e44e47f7` (text)：## 必背结论 BCC 把 eBPF 的编译、加载、挂载和 Map 访问封装成 Python 接口。
84. `d44c3aada04b3842` (text)：## 标准回答（完整） BCC 是本项目的 eBPF 开发框架和用户态桥梁。Python 调用 \`BPF(src_file=...)\` 后，BCC 负责把 C 源码交给 Clang/LLVM 编译、调用 \`bpf()\` 创建 Map 和加载程序，并根据 BCC 宏和函数命名约定挂载 Tracepoint/kprobe。它还把内核 Map 暴露成 Python 可访问对象，例如 \`self.b["zone_map"]\`，让用户态可以像遍历字典一样读取数据、向 \`delay_map\` 写配置。 因此开发
85. `57e9e39d9604ebd7` (text)：## 常见误区 / 边界 BCC 是加载和桥接工具，不是替代内核 eBPF 逻辑的业务层。
86. `dd92ba33e603ce55` (text)：### 第 9 题 eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？
87. `1a2506ae3b3e5efa` (text)：## 必背结论 eBPF 不主动轮询内核，而是挂在事件/函数上被动触发，采集后写入 Map。
88. `1506fc08043c7205` (text)：## 标准回答（完整） 被触发后，程序先读取时间和用户配置，按设计判断是否需要跳过本次采样；然后读取 Tracepoint 参数或 kprobe 函数上下文，调用 helper 获取进程信息或安全读取内核结构，进行有限的统计和指数计算，最后更新 BPF Map 并返回 0。返回后，原来的内核页分配流程继续。 它被称为被动触发，是因为 eBPF 程序自身没有一个常驻的 \`while true\` 线程，也不会自己定时唤醒；执行机会来自挂载点。内核不发生对应事件或不调用对应函数时，这两个 eBPF 程序就不会运行。用
89. `69c7b079de0b5cad` (text)：## 常见误区 / 边界 被动触发不等于没有开销，高频挂点仍必须做采样和性能验证。
90. `6af84f833b98a477` (text)：### 第 10 题 eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？
91. `5bc9187f99d8da9c` (text)：## 必背结论 用户态通过 bpf() 系统调用请求内核加载、校验并挂载 eBPF 程序。
92. `e258266d4a53689d` (text)：## 标准回答（完整） 用户执行 Python 后，BCC 先编译 C 代码，再通过 Linux 的 \`bpf()\` 系统调用创建 Map、加载 eBPF 指令并取得相应文件描述符。加载时 Verifier 校验程序；只有通过后才具备执行资格。随后 BCC 根据程序段/宏和命名约定，把程序关联到 \`kmem:mm_page_alloc_extfrag\` Tracepoint 或 \`get_page_from_freelist\` kprobe。 这里要区分“加载”和“触发”：\`bpf()\` 让程序进入
93. `446fa9233e34b015` (text)：## 常见误区 / 边界 bpf() 是用户态请求进入内核的系统调用，不要把它说成探针触发机制。
94. `b553cad4ef1bc697` (text)：## 3. eBPF 与内核/用户态交互 第 11～14 题
95. `9a23395b38480b6b` (text)：### 第 11 题 BPF Map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？
96. `80d624ae354db049` (text)：## 必背结论 BPF Map 是内核 eBPF 与用户态 Python 之间的共享数据通道，也是控制和状态存储。
97. `517bb8fa34a4b14d` (text)：## 标准回答（完整） BPF Map 是由内核管理、同时向 eBPF 程序和持有 Map 文件描述符的用户态程序开放的数据结构。内核侧使用 \`lookup\`、\`update\` 写入事件和状态；Python 侧通过 BCC 的 \`self.b["map_name"]\` 访问同一个 Map。 通信是双向的：Python 把采样间隔写入 \`delay_map[0]\`，eBPF 读取它作为配置；eBPF 把事件写入 \`counts_map\`，把 node/zone 状态写入 \`pgdat_map\`
98. `57b7fe5dee82d561` (text)：## 常见误区 / 边界 Map 是共享状态，不天然等于严格一致的事务或事件日志。
99. `8b28e4fb70a70cc9` (text)：### 第 12 题 counts_map、pgdat_map、zone_map、delay_map、last_time_map 分别干什么？
100. `6aa56b59630fed6e` (text)：## 必背结论 counts_map 存事件聚合，pgdat_map 存 Node 元数据，zone_map 存 Zone/Order 状态，另外两张 Map 控制采样。
101. `4a743549ac429fcf` (text)：## 标准回答（完整） \`counts_map\` 按 PID 聚合外碎片事件；\`pgdat_map\` 保存 NUMA node 的摘要；\`zone_map\` 保存每个 zone 与 order 的空闲块、空闲页和指数；\`delay_map\` 由 Python 写入采样间隔；\`last_time_map\` 的设计目标是记录上次有效采样时间，与 \`delay_map\` 一起节流。 当前源码中，前四类数据流清楚；\`last_time_map\` 的 key 使用存在实现问题，不能把“设计上用于节
102. `b5c6af015ae76e62` (text)：## 常见误区 / 边界 delay_map 控制采样计划，last_time_map 保存状态；不要把 UI 刷新间隔混为一谈。
103. `43d0e0f0480eaf79` (text)：### 第 13 题 为什么 counts_map 用 PID 作为 key 聚合外部碎片事件？为什么 zone_map 要按 zone + order 维度统计？
104. `fb5e9827c3d39ee5` (text)：## 必背结论 PID 聚合便于定位责任主体，但会丢时间序列、Order/迁移类型分布并受 PID 复用影响。
105. `eada17de956b7321` (text)：## 标准回答（完整） \`counts_map\` 的业务目标是找出哪个进程最频繁触发外碎片事件。用 PID 做 key，可以在内核里就把同一进程的多次事件合并为一条记录，减少 Map 空间和用户态处理量，同时保留最近的 PFN、请求阶、fallback 阶和进程名。 伙伴系统的连续块可用性不仅取决于 zone，也取决于请求阶。同一个 zone 对 order 0 可能很健康，对 order 8 却可能没有任何可用连续块。因此 \`zone_map\` 必须为每个 zone/order 组合保存一条状态，才能回答
106. `2944868dff705aff` (text)：## 常见误区 / 边界 PID 聚合会遇到 PID 复用、并发更新和多种 Order/迁移类型被覆盖的问题。
107. `5f5fb4a777660b2a` (text)：### 第 14 题 为什么 eBPF 读取内核结构体时要用 bpf_probe_read_kernel() 或 bpf_probe_read_kernel_str()？直接访问内核指针有什么风险？
108. `8d089552eed8ec28` (text)：## 必背结论 读取内核结构体必须使用安全 helper，避免直接解引用无效指针并降低内核崩溃风险。
109. `c732729760d7a0aa` (text)：## 标准回答（完整） kprobe 获得的参数经常包含内核指针，例如 \`zone\`、\`free_area\` 和 zone 名称。eBPF 不能像普通内核 C 一样任意解引用不受信任或 Verifier 无法证明安全的指针，否则可能越界、访问无效地址、遇到并发变化，或者直接被 Verifier 拒绝。 \`bpf_probe_read_kernel()\` 是受控的内核内存读取 helper，用来把指定大小的数据复制到 eBPF 栈或局部变量；字符串使用 \`bpf_probe_read_kernel_st
110. `2b1e50272375c17a` (text)：## 常见误区 / 边界 直接访问内核指针可能读到无效地址、触发验证器拒绝或引入内核崩溃风险。
111. `df036bbe85794ee1` (text)：## 4. Python、BCC 和 curses 用户态展示 第 15～18 题
112. `1447522bade44abf` (text)：### 第 15 题 Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？
113. `d0a29d41e93809bb` (text)：## 必背结论 Python 不是核心采集层：exfrag.py 负责 BCC/Map 适配，exfrag_user.py 负责入口、模式和 curses。
114. `613d9cdeff175828` (text)：## 标准回答（完整） Python 不是核心采集层，真正读取内核事件和伙伴系统状态的是内核里的 eBPF 程序。Python 是“控制面 + 数据适配 + 展示层”。 \`exfrag.py\` 定义 \`ExtFrag\` 类：根据输出模式选择加载 \`extfraginfo.c\` 或 \`fraginfo.c\`，向 \`delay_map\` 写采样间隔，从 \`counts_map\`、\`pgdat_map\`、\`zone_map\` 读取数据，再把 C 结构体转换成 Python 列表和字典。\`
115. `fb6e7608e140362a` (text)：## 常见误区 / 边界 不要说 Python 直接读取任意内核地址；它读取的是 eBPF 写入的 Map。
116. `e2c5715b9e5172b3` (text)：### 第 16 题 BPF(src_file=...)、写入 delay_map、读取 zone_map/counts_map 分别对应项目运行链路中的哪个阶段？
117. `8e4b22882ebae971` (text)：## 必背结论 加载和写 delay_map 属于启动/控制阶段，读取 zone_map/counts_map 属于运行时消费阶段。
118. `a5358a0218303694` (text)：## 标准回答（完整） \`BPF(src_file=...)\` 属于初始化加载阶段：BCC 编译 C、通过系统调用加载程序和 Map，并按约定完成挂载。向 \`delay_map[0]\` 写值属于配置阶段：用户态把刷新/采样间隔传给内核侧。读取 \`zone_map\` 或 \`counts_map\` 属于运行时消费阶段：eBPF 已在事件触发时写入结果，Python 周期读取、转换并交给 UI。 三者不是同一时刻重复执行。加载通常发生一次；配置在初始化时写入；结果读取随 UI 刷新周期反复进行。 **源码
119. `2af8a17ab5d26311` (text)：## 常见误区 / 边界 当前源码快照存在模块名和 C 文件路径不一致，不能把旧 quick start 当成已验证命令。
120. `28d4997af6c678c9` (text)：### 第 17 题 curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？
121. `573c3a4e8acfa4e9` (text)：## 必背结论 curses 通过周期刷新绘制表格、条形图和筛选结果，展示 Node/Zone/Order、指数和事件。
122. `ec050b56b240977e` (text)：## 标准回答（完整） curses 把终端当作可按坐标重绘的画布。项目通过 \`curses.wrapper(main)\` 安全初始化和恢复终端，在 \`main\` 中关闭回显、隐藏光标、启用非阻塞输入和颜色；循环读取最新 Map 数据后，用 \`screen.addstr(row, col, text, color)\` 覆盖指定区域，再调用 \`refresh()\` 刷新，而不是不断 \`print\` 新行。 页面支持 node 信息、外碎片事件次数、详细 zone 信息、简化指数视图和条形图。主要字
123. `51b7535624c3fda6` (text)：## 常见误区 / 边界 curses 只是展示层，不能因为 UI 能刷新就证明内核采样准确。
124. `474af16c6f728e4a` (text)：### 第 18 题 为什么用 curses 做 TUI，而不是普通 print 输出？
125. `4370bb4e113d0c9f` (text)：## 必背结论 TUI 能原地刷新、着色、筛选和退出，比普通 print 更适合实时观察。
126. `3e132542ea04038b` (text)：## 标准回答（完整） 内存碎片数据是持续变化的多维表格。如果用 \`print\`，每次刷新都会向下追加，终端很快滚屏，用户难以横向比较同一个 zone/order 的变化。curses 可以原地覆盖、固定表头、按颜色突出高风险项、处理键盘和窗口变化，还能展示条形图，更适合做实时监控面板。 代价是代码更复杂、终端尺寸和兼容性要求更高，当前实现甚至要求至少 50 行、250 列。因此它适合本地运维和演示，不等同于生产级 Web 监控；长期留存和告警仍应接入指标系统。 【表格】维度；普通 print；curses T
127. `78853446f81f4058` (text)：## 常见误区 / 边界 TUI 带来终端尺寸、异常退出和刷新开销等边界，需要单独验证。
128. `997f31b27fe1795f` (text)：## 5. Linux 内存管理重点 第 19～24 题
129. `c4763f0f1eb91c57` (text)：### 第 19 题 为什么系统”总空闲内存还够”，却仍然可能分配不出大块连续物理内存？
130. `aa6116fedccbb94e` (text)：## 必背结论 空闲总量足够不代表存在足够大的连续块，连续性不足就是典型外部碎片问题。
131. `65fb43214dd0b2f0` (text)：## 标准回答（完整） 因为高阶物理页分配要求物理地址连续。伙伴系统中 order 为 \`n\` 的请求需要 \`2^n\` 个连续页。系统可能有很多空闲页，但它们分散在不同位置、不同 zone、不同 node，或被不可移动页面隔开，无法合并成目标阶的连续块，这就是外部碎片。 例如需要 order 3，即 8 个连续页；系统有 20 个空闲页，但最大连续段只有 4 页，按总量看足够，按连续性看仍然失败。回收解决“总量不足”，compaction 通过迁移可移动页改善连续性；两者解决的问题不同。 【表格】情况；总空
132. `369c2c161c2f0f9d` (text)：## 常见误区 / 边界 不要把空闲总量等同于连续可用内存，也不要把外碎片和内部碎片混为一谈。
133. `474cb4f28da0b9d2` (text)：### 第 20 题 伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？
134. `fb6737763d1fc61b` (text)：## 必背结论 Buddy 按 2^order 管理连续页；Node/NUMA、Zone 和 Order 是采集指标的三层坐标。
135. `929b3e4813080a02` (text)：## 标准回答（完整） 伙伴系统是 Linux 管理物理页的核心分配器之一，把连续页按 2 的幂组织到各阶空闲链表中；需要小块时可拆分高阶块，释放后满足条件的伙伴可合并。order 表示连续页数的指数，order \`n\` 对应 \`2^n\` 页。zone 是一个 node 内按地址能力和用途划分的物理内存区域，如 DMA、DMA32、Normal。node 是 NUMA 内存节点，每个节点与一组 CPU 的访问距离不同，内部包含多个 zone。 项目的 \`pgdat_map\` 对应 node，\`zone
136. `7144400bea59bdbe` (text)：## 常见误区 / 边界 Node/Zone/Order 是不同层次，不能用一个“内存区域”概念替代全部。
137. `89adc6be5d97c05c` (text)：### 第 21 题 外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？
138. `fe538ebc6abde87b` (text)：## 必背结论 项目主要观测伙伴系统页级外部碎片；SLAB/SLUB 更关注小对象和内部碎片。
139. `f7d41a938045e1ed` (text)：## 标准回答（完整） 外部碎片是空闲空间总量可能足够，但分散后无法组成需要的连续物理块；内部碎片是已经分配的块大于实际需求，块内部有未利用空间。伙伴系统位于页级，按 2 的幂分配连续物理页，通过拆分、合并和迁移类型分组来管理并缓解外部碎片，但 2 的幂向上取整也可能产生一定内部浪费。 SLAB/SLUB 建在伙伴系统之上，向伙伴系统申请页，再为内核小对象建立对象缓存，减少频繁页分配和小对象内部浪费。这个项目的两个挂点、order 分布和碎片指数都围绕伙伴系统的连续物理页可用性，因此主要观测外部碎片，不是对象缓存级
140. `bc640ecf78f882d6` (text)：## 常见误区 / 边界 本项目主要针对外部碎片，不等于覆盖所有 SLAB/SLUB 对象碎片。
141. `fa071429624464ef` (text)：### 第 22 题 get_page_from_freelist 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收、内存规整有什么关系？
142. `f76ccb96397f66f4` (text)：## 必背结论 它先尝试快速路径，失败后上层可能进入回收、规整、放宽限制并重试；探针只看到一次函数调用。
143. `2bb880baa9830a62` (text)：## 标准回答（完整） \`get_page_from_freelist\` 接收 \`gfp_mask\`、order、分配标志和 \`alloc_context\`，沿 zonelist 检查允许使用的 zone、水位线、NUMA/cpuset 和迁移类型等条件，然后尝试从伙伴空闲链表取出满足请求的连续页。它是快速路径的关键步骤，目标是在现有可用内存状态下尽快完成分配。 如果快速路径找不到合适页，上层分配逻辑才可能进入慢速路径：直接回收释放页解决容量压力，compaction 迁移可移动页形成大连续块解决碎片压
144. `4020379214861761` (text)：## 常见误区 / 边界 get_page_from_freelist 是快速路径之一，不等于整个伙伴系统，也不等于一次上层请求。
145. `5e7591fb348dfd7d` (text)：### 第 23 题 mm_page_alloc_extfrag 捕获的 fallback 事件说明什么？ALLOC_ORDER 和 FALLBACK_ORDER 的差异能反映什么问题？
146. `49453faddc440c67` (text)：## 必背结论 ALLOC_ORDER 是原始请求阶数，FALLBACK_ORDER 是 fallback 块阶数，差异反映跨迁移类型/降级事实。
147. `0c1abee7344b427d` (text)：## 标准回答（完整） 该事件说明伙伴系统没有直接从理想的目标空闲块路径满足请求，而使用了 fallback/更高阶块拆分等方式完成相关分配。\`ALLOC_ORDER\` 是请求需要的阶，\`FALLBACK_ORDER\` 是实际拿来满足请求的来源阶。两者相差越大，意味着为了一个较小请求拆分了更大的连续块，可能消耗宝贵的高阶连续内存，并增加后续高阶请求的压力。 但一次差值不能单独证明系统已严重碎片化。要结合事件频率、进程、目标 zone/order 的 \`free_blocks_suitable\` 和两个指
148. `eecf5d05e86e47c5` (text)：## 常见误区 / 边界 fallback_order 不是“错误码”，也不能简单解释成所有高阶请求都降成低阶。
149. `d285fa1b37127141` (text)：### 第 24 题 extfraginfo.c 和 fraginfo.c 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计分别怎么对应？
150. `13c3d10aedbb5c73` (text)：## 必背结论 extfraginfo.c 采集事件，fraginfo.c 采集状态；一个定位发生者，一个解释系统状态。
151. `eaff5bc42a83ed6a` (text)：## 标准回答（完整） \`extfraginfo.c\` 是事件采集程序。它挂 \`mm_page_alloc_extfrag\` Tracepoint，读取 PFN、请求阶、fallback 阶，补充 PID/comm，并在 \`counts_map\` 中按 PID 聚合事件次数。 \`fraginfo.c\` 是状态采样和计算程序。它挂 \`get_page_from_freelist\` kprobe，通过 \`alloc_context\` 找到 node/zone，遍历各 order 的 \`free
152. `c18ab34514be691f` (text)：## 常见误区 / 边界 两个 C 文件由输出模式选择时未必同时运行，必须结合当前实现核对。
153. `b6a1785e079b1758` (text)：## 6. eBPF 程序如何计算碎片化指数 第 25～30 题
154. `2ab691c74f9167e4` (text)：### 第 25 题 fill_contig_page_info() 做了什么？为什么它要遍历所有 order？
155. `6f39676752092800` (text)：## 必背结论 遍历所有 Order 才能把不同阶的块统一折算，得到目标 Order 的总量和可满足量。
156. `5029f5f846400d10` (text)：## 标准回答（完整） \`fill_contig_page_info()\` 针对一个 zone 和一个目标 \`suitable_order\`，遍历 \`order=0\` 到 \`MAX_ORDER\` 的伙伴空闲链表，安全读取每阶的 \`nr_free\`，汇总三个量：总空闲页数、所有空闲块数、以及折算成目标阶后可满足请求的块数。 必须遍历所有 order，因为低阶块贡献空闲总量和块分散程度，高阶块既贡献总量，也可以拆成多个目标阶块。只看目标阶会漏掉更高阶可拆分资源；只看目标阶以上又无法判断总空闲页是不是
157. `9de922f39bf3c1bb` (text)：## 常见误区 / 边界 nr_free 是块数，不是页数；不能跳过高阶块折算。
158. `fedd43ce644862c7` (text)：### 第 26 题 free_pages、free_blocks_total、free_blocks_suitable 分别代表什么？
159. `cbb5595332cb1465` (text)：## 必背结论 free_pages 是空闲页总量，free_blocks_total 是空闲块总数，free_blocks_suitable 是满足目标阶的块量。
160. `4d7c681b3e6cca63` (text)：## 标准回答（完整） \`free_pages\` 是把所有阶空闲块乘以各自页数后得到的总空闲页；\`free_blocks_total\` 是所有阶空闲块“块数”的简单合计，用来反映空闲空间被分成多少块；\`free_blocks_suitable\` 是所有能够满足目标阶请求的高阶块，折算成“等价目标阶块数”后的总数。 假设目标 order 为 2，一个 order 2 空闲块贡献 1 个 suitable，一个 order 4 空闲块可拆成 4 个 order 2 块，因此贡献 4。最后 \`free_bl
161. `ca4f359e49464f9c` (text)：## 常见误区 / 边界 free_blocks_total 和 free_pages 维度不同，不能直接互换。
162. `9b831cebd1b37f5e` (text)：### 第 27 题 free_blocks_suitable 为什么不能只简单统计 order >= suitable_order 的块数，而要按高阶块折算？
163. `efb47e525a4f8d55` (text)：## 必背结论 高阶块可以拆分满足多个低阶请求，suitable 必须折算页数/块数，不能只数块。
164. `a776ec1d770ba313` (text)：## 标准回答（完整） 因为不同阶的一个块能满足目标请求的次数不同。目标 order 为 2 时，一个 order 2 块只能满足一次 4 页请求；一个 order 5 块有 32 页，理论上可以拆成 8 个 order 2 块。如果都只计为 1，会严重低估高阶块对目标请求的供给能力。 源码使用 \`blocks << (order - suitable_order)\`，本质是乘以 \`2^(order-target)\`。这样所有高阶资源都被统一换算到目标阶单位，后续左移目标 order 才能得到真正可用页数。
165. `5cc95f4382740bdb` (text)：## 常见误区 / 边界 高阶块是否能满足请求还涉及拆分、对齐、相邻性和迁移类型，不是简单的 order 比较。
166. `e47161295b08f375` (text)：### 第 28 题 unusable_free_index 和 extfrag_index 分别衡量什么？为什么需要两个指标，而不是只用一个？
167. `acdf9679a76890d3` (text)：## 必背结论 unusable_free_index 衡量“现在有多难”，extfrag_index 更偏向判断“为什么难”。
168. `7614a654fec4fb40` (text)：## 标准回答（完整） \`unusable_free_index\`（源码中的 \`score_b\`）衡量现有空闲页中，有多大比例不能用于当前 order 请求。它更像“不可用比例”：0 表示空闲页几乎都能形成目标阶资源，1000 表示对该请求完全不可用或没有空闲页。 \`extfrag_index\`（\`score_a\`）更偏向原因诊断：当没有 suitable block 时，结合总空闲页、请求大小和空闲块数量，判断分配困难更像是外部碎片，还是总量不足。存在 suitable block 时返回 \`-
169. `9868bc7dee8385eb` (text)：## 常见误区 / 边界 两个指数不能合并成一个笼统的“碎片率”，还要结合水位、回收和规整解释。
170. `34a0c8f9471662e9` (text)：### 第 29 题 extfrag_index 中如果 free_blocks_suitable > 0，为什么可以直接返回负值？这个负值表示什么？
171. `4c8122c5aee715d0` (text)：## 必背结论 只要存在 suitable 块，连续性不是当前障碍，extfrag_index 返回负值表示状态良好。
172. `62ad2f05a9587aba` (text)：## 标准回答（完整） \`free_blocks_suitable > 0\` 表示当前 zone 至少存在一个可直接使用或通过拆分满足目标 order 的连续块，因此“因为没有合适连续块而失败”的前提不成立。源码直接返回 \`-1000\`，把它作为特殊哨兵值，表示当前无需用正区间指数诊断外部碎片导致的失败。 这个负值不是“负碎片率”，也不是数学意义上的 -100%；它是控制语义。用户态 \`calculate_scoreA()\` 会把整数缩放成显示字符串，但解释时必须保留“特殊返回值”的含义。 **源码对应
173. `75fa2f32951b84c8` (text)：## 常见误区 / 边界 负值表示存在合适连续块，不代表所有分配条件（例如 watermark）都一定满足。
174. `1f4e93b5d831c4c3` (text)：### 第 30 题 如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？
175. `6a117f6b999ff768` (text)：## 必背结论 空闲少且 extfrag 接近 0 更像总量不足；空闲不少、suitable 少且 extfrag 高更像外碎片。
176. `0ef20360220f6c13` (text)：## 标准回答（完整） 要按同一个 node、zone、order 联合看。先看 \`free_pages\` 判断总量，再看 \`free_blocks_suitable\` 判断连续性。若 suitable 大于 0，当前仍有可满足块；若 suitable 为 0 且总空闲页也很少，问题更像容量不足；若 suitable 为 0，但总空闲页相对不少、低阶块很多，\`extfrag_index\` 又较高，则更像外部碎片。 \`unusable_free_index\` 高说明大部分空闲页对目标 order 无法
177. `8785e28f0b7c87bc` (text)：## 常见误区 / 边界 指数只能说明 Zone/Order 状态，不能单独证明某次失败完全由碎片造成。
178. `30668bd73138be74` (text)：## 7. 整个项目运行逻辑 第 31～35 题
179. `705bddd252e897a2` (text)：### 第 31 题 请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终能展示什么？
180. `d4bd41a24d0ef4b7` (text)：## 必背结论 一分钟介绍按痛点、技术栈、双探针、Map 数据流、可视化结果和项目边界组织。
181. `1db67b40aa7dde90` (text)：## 标准回答（完整） 这个项目解决的是 Linux 服务器总空闲内存看起来还够，但因为物理页不连续，高阶连续页分配仍可能困难的问题。它使用 BCC/eBPF 在内核页分配路径上布置两个互补探针：\`mm_page_alloc_extfrag\` Tracepoint 记录具体 fallback 外碎片事件，并按 PID 统计触发进程；\`get_page_from_freelist\` kprobe 深入伙伴系统，按 node、zone、order 统计空闲页、空闲块、可满足请求的块，并计算 extfrag 和 
182. `bbd0bdd528d52780` (text)：## 常见误区 / 边界 项目介绍要说明这是 BCC/eBPF 教学原型，并诚实说明当前源码的可运行性边界。
183. `ae236ced616daf19` (text)：### 第 32 题 从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链路是什么？
184. `5d8e2da379343079` (text)：## 必背结论 用户态启动 → BCC 加载 → eBPF 挂探针 → 内核触发 → Map 写入 → Python 读取 → curses 展示。
185. `3e30e9aebd5b0e68` (text)：## 标准回答（完整） 用户运行 \`exfrag_user.py\`，程序解析命令行并创建 \`ExtFrag\`。\`ExtFrag\` 根据模式选择 \`extfraginfo.c\` 或 \`fraginfo.c\`，BCC 编译并通过 \`bpf()\` 加载，Verifier 通过后挂到 Tracepoint 或 kprobe。Python 把间隔写入 \`delay_map[0]\`。 之后内核运行到 \`mm_page_alloc_extfrag\` 或 \`get_page_from_freeli
186. `d3ced21858c8bb5a` (text)：## 常见误区 / 边界 不要把 eBPF 说成主动后台线程；探针是内核事件触发，Python 是读取和展示。
187. `44ea6e157b1a5059` (text)：### 第 33 题 这个项目相比 /proc/buddyinfo 有什么优势和不足？它更适合解决什么场景下的问题？
188. `5b8fa4de4bc25d31` (text)：## 必背结论 相比 buddyinfo，本项目提供事件、Node/Zone/Order 和指数，但复杂度、兼容性和语义风险更高。
189. `b6d8fc3118049ec5` (text)：## 标准回答（完整） \`/proc/buddyinfo\` 是内核提供的各 node/zone/order 空闲块快照，简单、稳定、无需加载探针，适合快速看当前伙伴空闲链表。但它本身不告诉你哪个进程触发了外碎片事件，也不直接计算本项目的两个指数或提供动态 TUI。 本项目的优势是事件与状态结合：可以按 PID 聚合 \`mm_page_alloc_extfrag\`，按 zone/order 计算可用性和原因指数，并用 curses 实时展示。它适合复现高阶分配抖动、寻找频繁触发进程、观察碎片趋势和教学演示。 
190. `8bc6d3c386a87c30` (text)：## 常见误区 / 边界 优势和不足要一起说，不能只说 eBPF 比 buddyinfo 更实时、更低开销。
191. `93d271b9ad90c2b8` (text)：### 第 34 题 这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 delay_map 和 last_time_map？
192. `b19c91a7ca6b7094` (text)：## 必背结论 delay_map 提供采样间隔，last_time_map 保存采样状态；内核节流和 UI sleep 是两层不同机制。
193. `3aec4d991e8d7583` (text)：## 标准回答（完整） 设计意图是时间窗口采样。Python 把秒级间隔写入 \`delay_map[0]\`；eBPF 每次触发先用 \`bpf_ktime_get_ns()\` 取当前时间，再从 \`last_time_map\` 取上次真正采样时间。如果间隔未到就立即返回，只有超过 delay 才执行遍历、计算和 Map 更新，并记录本次时间。因为两个挂点都可能在页分配高频路径上，尤其 \`fraginfo.c\` 还要遍历 zone 和所有 order，没有节流会显著增加 CPU 开销。 但当前源码没有正确
194. `da5eee07f5abe92f` (text)：## 常见误区 / 边界 当前时间 Map 的 key/更新时间逻辑存在闭环问题，采样开销必须实测。
195. `beef63262d527dd8` (text)：### 第 35 题 如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？
196. `1e61e97bccbcd081` (text)：## 必背结论 生产化要同时修兼容性、节流、数据模型、Order 动态发现、事件日志、准确性和可观测性。
197. `2a5f7a3cb9aee93e` (text)：## 标准回答（完整） 兼容性上，我会优先使用稳定 Tracepoint，kprobe 部分迁移到 libbpf + CO-RE，使用 BTF 和 \`BPF_CORE_READ\`，并针对不同内核校验函数签名；同时修正当前 Python 导入名和 C 文件路径。 性能上，先修复时间节流，考虑 Per-CPU Map、降低 kprobe 触发采样比例、避免每次遍历所有 zone/order，或把可从 \`/proc/buddyinfo\` 获得的低频状态放到用户态计算。数据准确性上，使用显式结构体 key 表示 n
198. `973464a13b61ed24` (text)：## 常见误区 / 边界 生产化不能只换成 CO-RE，还要补充事件丢失、Map 容量、并发、版本和长期运行验证。

### 边摘要

- `ac8b254bb630e281` → `88673a676a32a5c6`，标签：主线（# Linux 物理内存碎片检测 **复习版｜纵向单主干** 从问题 → 内核机制 → 双探针 → Map → 指数 → 面试回答。 → ## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险）
- `88673a676a32a5c6` → `947a3c679e7a1c3e`，标签：原作者主线（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → projects/Linux物理内存检测项目/linux物理内存检测工具：_带目录.pdf）
- `88673a676a32a5c6` → `caa741c62ea064f0`，标签：35题原文（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → projects/嵌入式八股/Linux物理内存碎片高频面试题.md.easy-sync-recovery）
- `88673a676a32a5c6` → `5d0d648f190ef69d`，标签：事实核验（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md）
- `88673a676a32a5c6` → `db0f5b58c7a8a3e4`，标签：01（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 01 项目定位与总链路 先记住项目解决什么问题、采什么数据、数据怎样到终端。 **总串：内核 eBPF 采集事件与状态 → BPF Ma）
- `db0f5b58c7a8a3e4` → `61a69b046a9777cb`（# 01 项目定位与总链路 先记住项目解决什么问题、采什么数据、数据怎样到终端。 **总串：内核 eBPF 采集事件与状态 → BPF Ma → ## 项目痛点 总空闲内存可能够，但连续大块不足，导致高阶分配失败、fallback 和性能下降。）
- `db0f5b58c7a8a3e4` → `1b0bce191eba13b4`（# 01 项目定位与总链路 先记住项目解决什么问题、采什么数据、数据怎样到终端。 **总串：内核 eBPF 采集事件与状态 → BPF Ma → ## 双层架构 内核态 eBPF 负责采集；用户态 Python 负责加载、读取、排序、格式化和展示。）
- `db0f5b58c7a8a3e4` → `c0ecc3172593cdb6`（# 01 项目定位与总链路 先记住项目解决什么问题、采什么数据、数据怎样到终端。 **总串：内核 eBPF 采集事件与状态 → BPF Ma → ## 输出维度 Node/Zone/Order 状态、两个碎片化指数，以及 PID/COMM/PFN/Order 的外碎片事件。）
- `db0f5b58c7a8a3e4` → `aa64cf785dc8ded9`（# 01 项目定位与总链路 先记住项目解决什么问题、采什么数据、数据怎样到终端。 **总串：内核 eBPF 采集事件与状态 → BPF Ma → ## 项目价值 把“发生了 fallback”与“当时伙伴系统是什么状态”放到同一条诊断链路中。）
- `88673a676a32a5c6` → `deeca230ff89066a`，标签：02（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请）
- `deeca230ff89066a` → `856d77be5c3c3cdd`（# 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请 → ## Page 与 PFN Page 是物理页管理基本单位，PFN 标识物理页框位置；Zone/Node 通过起始 PFN 等字段定位。）
- `deeca230ff89066a` → `d1a88000d3fd96b2`（# 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请 → ## Node → Zone → Order Node 表示 NUMA 节点，Zone 表示 DMA/DMA32/NORMAL 等区域，Or）
- `deeca230ff89066a` → `eb45bf11d94a211e`（# 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请 → ## Buddy 核心 空闲块按 2^order 组织，分配时拆分，释放时尝试与伙伴合并。）
- `deeca230ff89066a` → `9ee400e34d85f86b`（# 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请 → ## 快速/慢速路径 get_page_from_freelist 先做快速尝试；失败后可能进入 reclaim、compaction 和重）
- `deeca230ff89066a` → `c6f885c01a2f9e6d`（# 02 Linux 物理内存与伙伴系统 用 Page/PFN、Node/Zone/Order 和 Buddy 解释连续物理页。 **高阶请 → ## 外碎片 vs 内碎片 伙伴系统重点对应页级外碎片；SLAB/SLUB 更关注小对象分配和内部碎片。）
- `88673a676a32a5c6` → `193078288e0b46dc`，标签：03（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 03 双探针：事件视角与状态视角 一条线记录发生了什么，另一条线解释系统当时是什么样。 **Tracepoint 定位 fallback）
- `193078288e0b46dc` → `e82aa527cb599cc4`（# 03 双探针：事件视角与状态视角 一条线记录发生了什么，另一条线解释系统当时是什么样。 **Tracepoint 定位 fallback → ## Tracepoint：mm_page_alloc_extfrag 预定义 kmem 事件，读取 PFN、ALLOC_ORDER、FAL）
- `193078288e0b46dc` → `573f39a345d06e09`（# 03 双探针：事件视角与状态视角 一条线记录发生了什么，另一条线解释系统当时是什么样。 **Tracepoint 定位 fallback → ## kprobe：get_page_from_freelist 挂在函数入口，读取 alloc_context，遍历 zonelist、Z）
- `193078288e0b46dc` → `d003593652d07524`（# 03 双探针：事件视角与状态视角 一条线记录发生了什么，另一条线解释系统当时是什么样。 **Tracepoint 定位 fallback → ## 为什么不能只用一种 只有事件没有状态解释，只有状态没有责任定位；双探针形成事件发现与状态解释闭环。）
- `193078288e0b46dc` → `f9c73c965ff5bc46`（# 03 双探针：事件视角与状态视角 一条线记录发生了什么，另一条线解释系统当时是什么样。 **Tracepoint 定位 fallback → ## 准确边界 入口快照是分配前状态；fallback 是特定事件，不等于所有失败；探针不替内核改变分配结果。）
- `88673a676a32a5c6` → `ce48f2e66db47a2d`，标签：04（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 04 eBPF 与 BCC 运行流程 掌握从 Python 启动到内核触发的完整生命周期。 **源码经 BCC 编译和加载，Verifi）
- `ce48f2e66db47a2d` → `80dca83cf02f7e48`（# 04 eBPF 与 BCC 运行流程 掌握从 Python 启动到内核触发的完整生命周期。 **源码经 BCC 编译和加载，Verifi → ## 生命周期 编写 → 编译 → bpf() 加载 → Verifier 校验 → JIT/挂载 → 内核触发 → 写 Map → 用户态）
- `ce48f2e66db47a2d` → `0693a56315839d27`（# 04 eBPF 与 BCC 运行流程 掌握从 Python 启动到内核触发的完整生命周期。 **源码经 BCC 编译和加载，Verifi → ## BCC 的角色 把 C 风格 eBPF 程序编译、加载、挂载，并向 Python 暴露 Map 和读取接口。）
- `ce48f2e66db47a2d` → `d40626f402f7d2fa`（# 04 eBPF 与 BCC 运行流程 掌握从 Python 启动到内核触发的完整生命周期。 **源码经 BCC 编译和加载，Verifi → ## 安全读取 内核结构体字段通过 bpf_probe_read_kernel 等 helper 读取，不能直接解引用任意内核指针。）
- `ce48f2e66db47a2d` → `42dda3fd85efb240`（# 04 eBPF 与 BCC 运行流程 掌握从 Python 启动到内核触发的完整生命周期。 **源码经 BCC 编译和加载，Verifi → ## 被动触发 eBPF 不是主动扫描线程；它随目标事件或函数调用执行，但高频挂点仍有采样开销。）
- `88673a676a32a5c6` → `6ddc78ab7ee4c0a1`，标签：05（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参）
- `6ddc78ab7ee4c0a1` → `4749c7db1181a9a5`（# 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参 → ## 事件 Map counts_map 以 PID 聚合 fallback 事件，保存累计次数和最近字段；它是聚合快照，不是完整事件日志。）
- `6ddc78ab7ee4c0a1` → `90400cbba8c3d2f4`（# 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参 → ## 状态 Map pgdat_map 保存 Node 元数据，zone_map 保存 Zone + Order 的空闲页、块量和两个指数。）
- `6ddc78ab7ee4c0a1` → `9cd02f00d74a8614`（# 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参 → ## 控制 Map delay_map 传入采样间隔，last_time_map 保存上次采样时间或节流状态。）
- `6ddc78ab7ee4c0a1` → `ee89920e9c1cb3ce`（# 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参 → ## 用户态消费 Python 遍历 Map，完成字段解码、排序、过滤、格式化，再交给 curses。）
- `6ddc78ab7ee4c0a1` → `0a8ec3d73f1c2636`（# 05 BPF Map 与数据流 把每张 Map 的用途、键和值，以及用户态如何消费说清楚。 **Map 同时承担内核/用户态通信、控制参 → ## 键设计风险 数值编码、硬编码 Order、Zone 数量推导和 Map 覆盖都可能造成数据解释偏差。）
- `88673a676a32a5c6` → `c8396f11d8363871`，标签：06（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **u）
- `c8396f11d8363871` → `aaa62ede5b0d5a85`（# 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **u → ## 三个中间量 free_pages 是空闲页总量；free_blocks_total 是总空闲块数；free_blocks_suitab）
- `c8396f11d8363871` → `dee51771eb3e17ed`（# 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **u → ## 遍历所有 Order 高阶块可拆分成多个低阶块，必须按目标 Order 折算，不能只比较块数量。）
- `c8396f11d8363871` → `26ed5eb01f6c1d7e`（# 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **u → ## unusable_free_index 表示无法满足目标 Order 的空闲页比例；0 代表几乎都可用，1000 代表都不可用。）
- `c8396f11d8363871` → `697fc99ca703a8e5`（# 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **u → ## extfrag_index 存在 suitable 块时通常返回 -1000；没有合适块时，越接近 1000 越像外碎片主导。）
- `c8396f11d8363871` → `7a137e8ba263fe7f`（# 06 碎片化指数与手算链路 先算三个中间量，再分别解释 unusable_free_index 和 extfrag_index。 **u → ## 三类手算 有大块但碎页多；空闲页不少但全是小块；总空闲量本身不足，三者要分别解释。）
- `88673a676a32a5c6` → `f6adb3de099efed9`，标签：07（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 07 Python 与 curses 展示 用户态只做桥接、解析、过滤、格式化和终端展示。 **Python 不直接读内核地址，而是读 ）
- `f6adb3de099efed9` → `f32f349f26456f21`（# 07 Python 与 curses 展示 用户态只做桥接、解析、过滤、格式化和终端展示。 **Python 不直接读内核地址，而是读  → ## exfrag.py 负责选择 eBPF 程序、写控制 Map、读取 pgdat/zone/counts 数据并适配成 Python 结）
- `f6adb3de099efed9` → `4a89aef49413cc3c`（# 07 Python 与 curses 展示 用户态只做桥接、解析、过滤、格式化和终端展示。 **Python 不直接读内核地址，而是读  → ## exfrag_user.py 负责命令行参数、模式选择、curses 初始化、表格/条形图绘制和刷新退出。）
- `f6adb3de099efed9` → `81993a2d4ae650ac`（# 07 Python 与 curses 展示 用户态只做桥接、解析、过滤、格式化和终端展示。 **Python 不直接读内核地址，而是读  → ## 展示模式 默认摘要、-n 节点、-z Zone、-v Order 矩阵、-s 外碎片事件等模式按源码快照核对。）
- `f6adb3de099efed9` → `f8fbcf3b4ef5ad60`（# 07 Python 与 curses 展示 用户态只做桥接、解析、过滤、格式化和终端展示。 **Python 不直接读内核地址，而是读  → ## 两层时间 delay_map/last_time_map 影响内核采样；time.sleep 等 UI 逻辑影响终端刷新，不能混为一谈）
- `88673a676a32a5c6` → `2c5c515eb5ea20f7`，标签：08（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor）
- `2c5c515eb5ea20f7` → `4854569cc3e2b411`（# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor → ## 当前可运行性 模块名、C 文件路径、BCC import 和工作目录存在不一致，旧 quick start 不能直接当作已验证命令。）
- `2c5c515eb5ea20f7` → `f991f220ba5fb2a6`（# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor → ## 采样节流 时间 Map 的 key/更新时间没有形成严格闭环，多 CPU 下还要明确全局一次、每 CPU 一次还是近似节流。）
- `2c5c515eb5ea20f7` → `bb2813362be6564d`（# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor → ## 数据模型 Order 范围、Zone 数量、Map key、PID 聚合和 Map 快照一致性都不能依赖硬编码或字段名猜测。）
- `2c5c515eb5ea20f7` → `bb385608b3b97bfb`（# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor → ## 不能过度归因 工具能观察事件和状态，但不能单独证明某次失败完全由碎片造成、某进程制造了全部碎片或 compaction 一定有效。）
- `2c5c515eb5ea20f7` → `041645c20c792337`（# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor → ## 生产验证 联合 /proc/buddyinfo、debugfs extfrag、/proc/vmstat、workload、内核版本和）
- `2c5c515eb5ea20f7` → `92cc953bfe56714d`（# 08 源码事实边界与生产化 面试时区分设计意图、当前实现和需要验证的结论。 **先修可运行性，再修节流和数据模型，最后用内核接口、wor → ## 重构顺序 统一路径和 import → 修节流 → 显式 key/动态 Order → 事件流与聚合分离 → 补版本和验证矩阵。）
- `88673a676a32a5c6` → `15d678ad99780b81`，标签：09（## 复习主线 绿色节点 = 面试必背 普通节点 = 解释与展开 红色节点 = 当前实现边界/风险 → # 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。）
- `15d678ad99780b81` → `0392c09336fdd287`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 1. Tracepoint 和 kprobe 第 1～5 题）
- `0392c09336fdd287` → `39b08cf89676a75c`（## 1. Tracepoint 和 kprobe 第 1～5 题 → ### 第 1 题 Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？）
- `39b08cf89676a75c` → `f748293c9702da7c`，标签：必背（### 第 1 题 Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？ → ## 必背结论 Tracepoint 是预定义静态事件，kprobe 是动态函数插桩：前者更稳，后者更灵活但更依赖内核实现。）
- `39b08cf89676a75c` → `abfee4b07ed406b7`，标签：展开（### 第 1 题 Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？ → ## 标准回答（完整） Tracepoint 是内核开发者预先埋好的静态跟踪点，事件名和字段由内核定义。eBPF 程序挂载后，内核运行到该事）
- `39b08cf89676a75c` → `cec07c21f901dfc0`，标签：边界（### 第 1 题 Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？ → ## 常见误区 / 边界 不要说 Tracepoint ABI 永远不变，也不要说 kprobe 可以无条件插入任意代码位置。）
- `0392c09336fdd287` → `3989f5972944998a`（## 1. Tracepoint 和 kprobe 第 1～5 题 → ### 第 2 题 为什么这个项目同时使用 Tracepoint 和 kprobe，而不是只用其中一种？）
- `3989f5972944998a` → `37b8f0e3e36b77dc`，标签：必背（### 第 2 题 为什么这个项目同时使用 Tracepoint 和 kprobe，而不是只用其中一种？ → ## 必背结论 Tracepoint 负责发现 fallback 事件，kprobe 负责解释当时的 Node/Zone/Order 状态，）
- `3989f5972944998a` → `7fb09efc99177d91`，标签：展开（### 第 2 题 为什么这个项目同时使用 Tracepoint 和 kprobe，而不是只用其中一种？ → ## 标准回答（完整） 因为两个探针回答的问题不同。`mm_page_alloc_extfrag` Tracepoint 回答“外碎片相关的）
- `3989f5972944998a` → `cf9c1f3a7e36faf5`，标签：边界（### 第 2 题 为什么这个项目同时使用 Tracepoint 和 kprobe，而不是只用其中一种？ → ## 常见误区 / 边界 只用事件看不到完整 Zone 状态，只用状态又难以定位具体 fallback 责任主体。）
- `0392c09336fdd287` → `423e041ffee1dcb5`（## 1. Tracepoint 和 kprobe 第 1～5 题 → ### 第 3 题 为什么 mm_page_alloc_extfrag 适合用 Tracepoint 挂载？它什么时候会被内核触发？）
- `423e041ffee1dcb5` → `8e8ef95da3882f30`，标签：必背（### 第 3 题 为什么 mm_page_alloc_extfrag 适合用 Tracepoint 挂载？它什么时候会被内核触发？ → ## 必背结论 mm_page_alloc_extfrag 只表示特定 fallback/extfrag 事件，不等于所有分配失败或 OOM）
- `423e041ffee1dcb5` → `3cb77663363806d4`，标签：展开（### 第 3 题 为什么 mm_page_alloc_extfrag 适合用 Tracepoint 挂载？它什么时候会被内核触发？ → ## 标准回答（完整） `mm_page_alloc_extfrag` 本身就是 `kmem` 子系统预定义的 Tracepoint，语义正）
- `423e041ffee1dcb5` → `98afc123fbb6a84b`，标签：边界（### 第 3 题 为什么 mm_page_alloc_extfrag 适合用 Tracepoint 挂载？它什么时候会被内核触发？ → ## 常见误区 / 边界 不要把 fallback 事件泛化成所有高阶失败，也不要把它说成已经 OOM。）
- `0392c09336fdd287` → `368f7f2f294fe6f7`（## 1. Tracepoint 和 kprobe 第 1～5 题 → ### 第 4 题 为什么 get_page_from_freelist 适合用 kprobe 挂载？它在内核内存分配路径中处于什么位置？）
- `368f7f2f294fe6f7` → `a3afbd56316c1de9`，标签：必背（### 第 4 题 为什么 get_page_from_freelist 适合用 kprobe 挂载？它在内核内存分配路径中处于什么位置？ → ## 必背结论 get_page_from_freelist 是快速路径关键函数，入口 kprobe 看到的是分配前状态，不是最终结果。）
- `368f7f2f294fe6f7` → `62a255f1e3783110`，标签：展开（### 第 4 题 为什么 get_page_from_freelist 适合用 kprobe 挂载？它在内核内存分配路径中处于什么位置？ → ## 标准回答（完整） `get_page_from_freelist` 是伙伴系统物理页分配快速路径中的关键内部函数，但项目需要的 nod）
- `368f7f2f294fe6f7` → `b7751c26270acf80`，标签：边界（### 第 4 题 为什么 get_page_from_freelist 适合用 kprobe 挂载？它在内核内存分配路径中处于什么位置？ → ## 常见误区 / 边界 不要说 kprobe 只在分配失败后触发；入口探针也不能证明最终分配结果。）
- `0392c09336fdd287` → `1489c328119c6743`（## 1. Tracepoint 和 kprobe 第 1～5 题 → ### 第 5 题 mm_page_alloc_extfrag 和 get_page_from_freelist 一个是“事件视角”、一个是）
- `1489c328119c6743` → `69932e3d0ad2853a`，标签：必背（### 第 5 题 mm_page_alloc_extfrag 和 get_page_from_freelist 一个是“事件视角”、一个是 → ## 必背结论 事件视角回答“发生了什么”，状态视角回答“系统现在是什么样”。）
- `1489c328119c6743` → `08f39744e4547c87`，标签：展开（### 第 5 题 mm_page_alloc_extfrag 和 get_page_from_freelist 一个是“事件视角”、一个是 → ## 标准回答（完整） 事件视角关注“发生了一次什么事”。`mm_page_alloc_extfrag` 每触发一次就提供一条具体事实：哪个）
- `1489c328119c6743` → `e8d86b161047f9e8`，标签：边界（### 第 5 题 mm_page_alloc_extfrag 和 get_page_from_freelist 一个是“事件视角”、一个是 → ## 常见误区 / 边界 不要把事件累计快照当作完整事件日志。）
- `15d678ad99780b81` → `2582994222e69871`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 2. eBPF 原理和运行流程 第 6～10 题）
- `2582994222e69871` → `5af32c8edbce1ff2`（## 2. eBPF 原理和运行流程 第 6～10 题 → ### 第 6 题 eBPF 是什么？为什么它适合做 Linux 内核态监控？）
- `5af32c8edbce1ff2` → `0551ad7ee6704622`，标签：必背（### 第 6 题 eBPF 是什么？为什么它适合做 Linux 内核态监控？ → ## 必背结论 eBPF 是受 Verifier 约束、事件驱动的内核可编程机制，适合低侵入监控。）
- `5af32c8edbce1ff2` → `304326fa77a66520`，标签：展开（### 第 6 题 eBPF 是什么？为什么它适合做 Linux 内核态监控？ → ## 标准回答（完整） eBPF 是 Linux 内核提供的一种安全、事件驱动的可编程机制。用户态把受限制的 eBPF 字节码加载进内核，V）
- `5af32c8edbce1ff2` → `8bfacbcf087e1745`，标签：边界（### 第 6 题 eBPF 是什么？为什么它适合做 Linux 内核态监控？ → ## 常见误区 / 边界 不要只背“低开销”，还要能说出 Verifier、挂点和 Map 数据流。）
- `2582994222e69871` → `049271a641ddd3ac`（## 2. eBPF 原理和运行流程 第 6～10 题 → ### 第 7 题 eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？）
- `049271a641ddd3ac` → `3d86c7b273812c43`，标签：必背（### 第 7 题 eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？ → ## 必背结论 源码 → BCC 编译 → bpf() 加载 → Verifier 校验/JIT → 挂载 → 内核触发 → Map → 用）
- `049271a641ddd3ac` → `feb42451614dafa6`，标签：展开（### 第 7 题 eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？ → ## 标准回答（完整） 本项目先用受限 C 编写 `extfraginfo.c` 和 `fraginfo.c`。Python 创建 BCC ）
- `049271a641ddd3ac` → `bd113ccf402b598c`，标签：边界（### 第 7 题 eBPF 程序从编写、编译、加载、校验、挂载到触发执行，完整运行流程是什么？ → ## 常见误区 / 边界 挂载成功不等于运行时一定有数据，内核符号、权限、配置和探针触发条件都要验证。）
- `2582994222e69871` → `20a38354ca718c90`（## 2. eBPF 原理和运行流程 第 6～10 题 → ### 第 8 题 BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？）
- `20a38354ca718c90` → `f7835a66e44e47f7`，标签：必背（### 第 8 题 BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？ → ## 必背结论 BCC 把 eBPF 的编译、加载、挂载和 Map 访问封装成 Python 接口。）
- `20a38354ca718c90` → `d44c3aada04b3842`，标签：展开（### 第 8 题 BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？ → ## 标准回答（完整） BCC 是本项目的 eBPF 开发框架和用户态桥梁。Python 调用 `BPF(src_file=...)` 后，）
- `20a38354ca718c90` → `57e9e39d9604ebd7`，标签：边界（### 第 8 题 BCC 在这个项目里具体起什么作用？它如何简化 eBPF 程序的编译、加载、挂载和调试？ → ## 常见误区 / 边界 BCC 是加载和桥接工具，不是替代内核 eBPF 逻辑的业务层。）
- `2582994222e69871` → `dd92ba33e603ce55`（## 2. eBPF 原理和运行流程 第 6～10 题 → ### 第 9 题 eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？）
- `dd92ba33e603ce55` → `1a2506ae3b3e5efa`，标签：必背（### 第 9 题 eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？ → ## 必背结论 eBPF 不主动轮询内核，而是挂在事件/函数上被动触发，采集后写入 Map。）
- `dd92ba33e603ce55` → `1506fc08043c7205`，标签：展开（### 第 9 题 eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？ → ## 标准回答（完整） 被触发后，程序先读取时间和用户配置，按设计判断是否需要跳过本次采样；然后读取 Tracepoint 参数或 kpro）
- `dd92ba33e603ce55` → `69c7b079de0b5cad`，标签：边界（### 第 9 题 eBPF 程序被触发后在内核里做了哪些事情？为什么说它是“被动触发”，不是主动一直运行？ → ## 常见误区 / 边界 被动触发不等于没有开销，高频挂点仍必须做采样和性能验证。）
- `2582994222e69871` → `6af84f833b98a477`（## 2. eBPF 原理和运行流程 第 6～10 题 → ### 第 10 题 eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？）
- `6af84f833b98a477` → `5bc9187f99d8da9c`，标签：必背（### 第 10 题 eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？ → ## 必背结论 用户态通过 bpf() 系统调用请求内核加载、校验并挂载 eBPF 程序。）
- `6af84f833b98a477` → `e258266d4a53689d`，标签：展开（### 第 10 题 eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？ → ## 标准回答（完整） 用户执行 Python 后，BCC 先编译 C 代码，再通过 Linux 的 `bpf()` 系统调用创建 Map、）
- `6af84f833b98a477` → `446fa9233e34b015`，标签：边界（### 第 10 题 eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？ → ## 常见误区 / 边界 bpf() 是用户态请求进入内核的系统调用，不要把它说成探针触发机制。）
- `15d678ad99780b81` → `b553cad4ef1bc697`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 3. eBPF 与内核/用户态交互 第 11～14 题）
- `b553cad4ef1bc697` → `9a23395b38480b6b`（## 3. eBPF 与内核/用户态交互 第 11～14 题 → ### 第 11 题 BPF Map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？）
- `9a23395b38480b6b` → `80d624ae354db049`，标签：必背（### 第 11 题 BPF Map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？ → ## 必背结论 BPF Map 是内核 eBPF 与用户态 Python 之间的共享数据通道，也是控制和状态存储。）
- `9a23395b38480b6b` → `517bb8fa34a4b14d`，标签：展开（### 第 11 题 BPF Map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？ → ## 标准回答（完整） BPF Map 是由内核管理、同时向 eBPF 程序和持有 Map 文件描述符的用户态程序开放的数据结构。内核侧使用）
- `9a23395b38480b6b` → `57b7fe5dee82d561`，标签：边界（### 第 11 题 BPF Map 在这个项目里如何实现内核态 eBPF 和用户态 Python 的数据共享？ → ## 常见误区 / 边界 Map 是共享状态，不天然等于严格一致的事务或事件日志。）
- `b553cad4ef1bc697` → `8b28e4fb70a70cc9`（## 3. eBPF 与内核/用户态交互 第 11～14 题 → ### 第 12 题 counts_map、pgdat_map、zone_map、delay_map、last_time_map 分别干什么）
- `8b28e4fb70a70cc9` → `6aa56b59630fed6e`，标签：必背（### 第 12 题 counts_map、pgdat_map、zone_map、delay_map、last_time_map 分别干什么 → ## 必背结论 counts_map 存事件聚合，pgdat_map 存 Node 元数据，zone_map 存 Zone/Order 状态）
- `8b28e4fb70a70cc9` → `4a743549ac429fcf`，标签：展开（### 第 12 题 counts_map、pgdat_map、zone_map、delay_map、last_time_map 分别干什么 → ## 标准回答（完整） `counts_map` 按 PID 聚合外碎片事件；`pgdat_map` 保存 NUMA node 的摘要；`z）
- `8b28e4fb70a70cc9` → `b5c6af015ae76e62`，标签：边界（### 第 12 题 counts_map、pgdat_map、zone_map、delay_map、last_time_map 分别干什么 → ## 常见误区 / 边界 delay_map 控制采样计划，last_time_map 保存状态；不要把 UI 刷新间隔混为一谈。）
- `b553cad4ef1bc697` → `43d0e0f0480eaf79`（## 3. eBPF 与内核/用户态交互 第 11～14 题 → ### 第 13 题 为什么 counts_map 用 PID 作为 key 聚合外部碎片事件？为什么 zone_map 要按 zone +）
- `43d0e0f0480eaf79` → `fb5e9827c3d39ee5`，标签：必背（### 第 13 题 为什么 counts_map 用 PID 作为 key 聚合外部碎片事件？为什么 zone_map 要按 zone + → ## 必背结论 PID 聚合便于定位责任主体，但会丢时间序列、Order/迁移类型分布并受 PID 复用影响。）
- `43d0e0f0480eaf79` → `eada17de956b7321`，标签：展开（### 第 13 题 为什么 counts_map 用 PID 作为 key 聚合外部碎片事件？为什么 zone_map 要按 zone + → ## 标准回答（完整） `counts_map` 的业务目标是找出哪个进程最频繁触发外碎片事件。用 PID 做 key，可以在内核里就把同一）
- `43d0e0f0480eaf79` → `2944868dff705aff`，标签：边界（### 第 13 题 为什么 counts_map 用 PID 作为 key 聚合外部碎片事件？为什么 zone_map 要按 zone + → ## 常见误区 / 边界 PID 聚合会遇到 PID 复用、并发更新和多种 Order/迁移类型被覆盖的问题。）
- `b553cad4ef1bc697` → `5f5fb4a777660b2a`（## 3. eBPF 与内核/用户态交互 第 11～14 题 → ### 第 14 题 为什么 eBPF 读取内核结构体时要用 bpf_probe_read_kernel() 或 bpf_probe_rea）
- `5f5fb4a777660b2a` → `8d089552eed8ec28`，标签：必背（### 第 14 题 为什么 eBPF 读取内核结构体时要用 bpf_probe_read_kernel() 或 bpf_probe_rea → ## 必背结论 读取内核结构体必须使用安全 helper，避免直接解引用无效指针并降低内核崩溃风险。）
- `5f5fb4a777660b2a` → `c732729760d7a0aa`，标签：展开（### 第 14 题 为什么 eBPF 读取内核结构体时要用 bpf_probe_read_kernel() 或 bpf_probe_rea → ## 标准回答（完整） kprobe 获得的参数经常包含内核指针，例如 `zone`、`free_area` 和 zone 名称。eBPF ）
- `5f5fb4a777660b2a` → `2b1e50272375c17a`，标签：边界（### 第 14 题 为什么 eBPF 读取内核结构体时要用 bpf_probe_read_kernel() 或 bpf_probe_rea → ## 常见误区 / 边界 直接访问内核指针可能读到无效地址、触发验证器拒绝或引入内核崩溃风险。）
- `15d678ad99780b81` → `df036bbe85794ee1`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 4. Python、BCC 和 curses 用户态展示 第 15～18 题）
- `df036bbe85794ee1` → `1447522bade44abf`（## 4. Python、BCC 和 curses 用户态展示 第 15～18 题 → ### 第 15 题 Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？）
- `1447522bade44abf` → `d0a29d41e93809bb`，标签：必背（### 第 15 题 Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？ → ## 必背结论 Python 不是核心采集层：exfrag.py 负责 BCC/Map 适配，exfrag_user.py 负责入口、模式和）
- `1447522bade44abf` → `613d9cdeff175828`，标签：展开（### 第 15 题 Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？ → ## 标准回答（完整） Python 不是核心采集层，真正读取内核事件和伙伴系统状态的是内核里的 eBPF 程序。Python 是“控制面 ）
- `1447522bade44abf` → `fb6e7608e140362a`，标签：边界（### 第 15 题 Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？ → ## 常见误区 / 边界 不要说 Python 直接读取任意内核地址；它读取的是 eBPF 写入的 Map。）
- `df036bbe85794ee1` → `e2c5715b9e5172b3`（## 4. Python、BCC 和 curses 用户态展示 第 15～18 题 → ### 第 16 题 BPF(src_file=...)、写入 delay_map、读取 zone_map/counts_map 分别对应项）
- `e2c5715b9e5172b3` → `8e4b22882ebae971`，标签：必背（### 第 16 题 BPF(src_file=...)、写入 delay_map、读取 zone_map/counts_map 分别对应项 → ## 必背结论 加载和写 delay_map 属于启动/控制阶段，读取 zone_map/counts_map 属于运行时消费阶段。）
- `e2c5715b9e5172b3` → `a5358a0218303694`，标签：展开（### 第 16 题 BPF(src_file=...)、写入 delay_map、读取 zone_map/counts_map 分别对应项 → ## 标准回答（完整） `BPF(src_file=...)` 属于初始化加载阶段：BCC 编译 C、通过系统调用加载程序和 Map，并按约）
- `e2c5715b9e5172b3` → `2af8a17ab5d26311`，标签：边界（### 第 16 题 BPF(src_file=...)、写入 delay_map、读取 zone_map/counts_map 分别对应项 → ## 常见误区 / 边界 当前源码快照存在模块名和 C 文件路径不一致，不能把旧 quick start 当成已验证命令。）
- `df036bbe85794ee1` → `28d4997af6c678c9`（## 4. Python、BCC 和 curses 用户态展示 第 15～18 题 → ### 第 17 题 curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？）
- `28d4997af6c678c9` → `573c3a4e8acfa4e9`，标签：必背（### 第 17 题 curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？ → ## 必背结论 curses 通过周期刷新绘制表格、条形图和筛选结果，展示 Node/Zone/Order、指数和事件。）
- `28d4997af6c678c9` → `ec050b56b240977e`，标签：展开（### 第 17 题 curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？ → ## 标准回答（完整） curses 把终端当作可按坐标重绘的画布。项目通过 `curses.wrapper(main)` 安全初始化和恢复）
- `28d4997af6c678c9` → `51b7535624c3fda6`，标签：边界（### 第 17 题 curses 终端动态可视化是怎么做的？页面主要展示哪些内存碎片信息？ → ## 常见误区 / 边界 curses 只是展示层，不能因为 UI 能刷新就证明内核采样准确。）
- `df036bbe85794ee1` → `474af16c6f728e4a`（## 4. Python、BCC 和 curses 用户态展示 第 15～18 题 → ### 第 18 题 为什么用 curses 做 TUI，而不是普通 print 输出？）
- `474af16c6f728e4a` → `4370bb4e113d0c9f`，标签：必背（### 第 18 题 为什么用 curses 做 TUI，而不是普通 print 输出？ → ## 必背结论 TUI 能原地刷新、着色、筛选和退出，比普通 print 更适合实时观察。）
- `474af16c6f728e4a` → `3e132542ea04038b`，标签：展开（### 第 18 题 为什么用 curses 做 TUI，而不是普通 print 输出？ → ## 标准回答（完整） 内存碎片数据是持续变化的多维表格。如果用 `print`，每次刷新都会向下追加，终端很快滚屏，用户难以横向比较同一个）
- `474af16c6f728e4a` → `78853446f81f4058`，标签：边界（### 第 18 题 为什么用 curses 做 TUI，而不是普通 print 输出？ → ## 常见误区 / 边界 TUI 带来终端尺寸、异常退出和刷新开销等边界，需要单独验证。）
- `15d678ad99780b81` → `997f31b27fe1795f`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 5. Linux 内存管理重点 第 19～24 题）
- `997f31b27fe1795f` → `c4763f0f1eb91c57`（## 5. Linux 内存管理重点 第 19～24 题 → ### 第 19 题 为什么系统”总空闲内存还够”，却仍然可能分配不出大块连续物理内存？）
- `c4763f0f1eb91c57` → `aa6116fedccbb94e`，标签：必背（### 第 19 题 为什么系统”总空闲内存还够”，却仍然可能分配不出大块连续物理内存？ → ## 必背结论 空闲总量足够不代表存在足够大的连续块，连续性不足就是典型外部碎片问题。）
- `c4763f0f1eb91c57` → `65fb43214dd0b2f0`，标签：展开（### 第 19 题 为什么系统”总空闲内存还够”，却仍然可能分配不出大块连续物理内存？ → ## 标准回答（完整） 因为高阶物理页分配要求物理地址连续。伙伴系统中 order 为 `n` 的请求需要 `2^n` 个连续页。系统可能有）
- `c4763f0f1eb91c57` → `369c2c161c2f0f9d`，标签：边界（### 第 19 题 为什么系统”总空闲内存还够”，却仍然可能分配不出大块连续物理内存？ → ## 常见误区 / 边界 不要把空闲总量等同于连续可用内存，也不要把外碎片和内部碎片混为一谈。）
- `997f31b27fe1795f` → `474cb4f28da0b9d2`（## 5. Linux 内存管理重点 第 19～24 题 → ### 第 20 题 伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？）
- `474cb4f28da0b9d2` → `fb6737763d1fc61b`，标签：必背（### 第 20 题 伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？ → ## 必背结论 Buddy 按 2^order 管理连续页；Node/NUMA、Zone 和 Order 是采集指标的三层坐标。）
- `474cb4f28da0b9d2` → `929b3e4813080a02`，标签：展开（### 第 20 题 伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？ → ## 标准回答（完整） 伙伴系统是 Linux 管理物理页的核心分配器之一，把连续页按 2 的幂组织到各阶空闲链表中；需要小块时可拆分高阶块）
- `474cb4f28da0b9d2` → `7144400bea59bdbe`，标签：边界（### 第 20 题 伙伴系统、order、zone、node/NUMA 分别是什么？它们和这个项目采集的指标如何对应？ → ## 常见误区 / 边界 Node/Zone/Order 是不同层次，不能用一个“内存区域”概念替代全部。）
- `997f31b27fe1795f` → `89adc6be5d97c05c`（## 5. Linux 内存管理重点 第 19～24 题 → ### 第 21 题 外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？）
- `89adc6be5d97c05c` → `fe538ebc6abde87b`，标签：必背（### 第 21 题 外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？ → ## 必背结论 项目主要观测伙伴系统页级外部碎片；SLAB/SLUB 更关注小对象和内部碎片。）
- `89adc6be5d97c05c` → `f7d41a938045e1ed`，标签：展开（### 第 21 题 外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？ → ## 标准回答（完整） 外部碎片是空闲空间总量可能足够，但分散后无法组成需要的连续物理块；内部碎片是已经分配的块大于实际需求，块内部有未利用）
- `89adc6be5d97c05c` → `bc640ecf78f882d6`，标签：边界（### 第 21 题 外部碎片、内部碎片、伙伴系统、SLAB/SLUB 之间是什么关系？这个项目主要观测哪一类碎片问题？ → ## 常见误区 / 边界 本项目主要针对外部碎片，不等于覆盖所有 SLAB/SLUB 对象碎片。）
- `997f31b27fe1795f` → `fa071429624464ef`（## 5. Linux 内存管理重点 第 19～24 题 → ### 第 22 题 get_page_from_freelist 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收）
- `fa071429624464ef` → `f76ccb96397f66f4`，标签：必背（### 第 22 题 get_page_from_freelist 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收 → ## 必背结论 它先尝试快速路径，失败后上层可能进入回收、规整、放宽限制并重试；探针只看到一次函数调用。）
- `fa071429624464ef` → `2bb880baa9830a62`，标签：展开（### 第 22 题 get_page_from_freelist 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收 → ## 标准回答（完整） `get_page_from_freelist` 接收 `gfp_mask`、order、分配标志和 `alloc_）
- `fa071429624464ef` → `4020379214861761`，标签：边界（### 第 22 题 get_page_from_freelist 在 Linux 伙伴系统快速分配路径中起什么作用？它和慢速路径、内存回收 → ## 常见误区 / 边界 get_page_from_freelist 是快速路径之一，不等于整个伙伴系统，也不等于一次上层请求。）
- `997f31b27fe1795f` → `5e7591fb348dfd7d`（## 5. Linux 内存管理重点 第 19～24 题 → ### 第 23 题 mm_page_alloc_extfrag 捕获的 fallback 事件说明什么？ALLOC_ORDER 和 FAL）
- `5e7591fb348dfd7d` → `49453faddc440c67`，标签：必背（### 第 23 题 mm_page_alloc_extfrag 捕获的 fallback 事件说明什么？ALLOC_ORDER 和 FAL → ## 必背结论 ALLOC_ORDER 是原始请求阶数，FALLBACK_ORDER 是 fallback 块阶数，差异反映跨迁移类型/降级）
- `5e7591fb348dfd7d` → `0c1abee7344b427d`，标签：展开（### 第 23 题 mm_page_alloc_extfrag 捕获的 fallback 事件说明什么？ALLOC_ORDER 和 FAL → ## 标准回答（完整） 该事件说明伙伴系统没有直接从理想的目标空闲块路径满足请求，而使用了 fallback/更高阶块拆分等方式完成相关分配）
- `5e7591fb348dfd7d` → `eecf5d05e86e47c5`，标签：边界（### 第 23 题 mm_page_alloc_extfrag 捕获的 fallback 事件说明什么？ALLOC_ORDER 和 FAL → ## 常见误区 / 边界 fallback_order 不是“错误码”，也不能简单解释成所有高阶请求都降成低阶。）
- `997f31b27fe1795f` → `d285fa1b37127141`（## 5. Linux 内存管理重点 第 19～24 题 → ### 第 24 题 extfraginfo.c 和 fraginfo.c 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计）
- `d285fa1b37127141` → `13c3d10aedbb5c73`，标签：必背（### 第 24 题 extfraginfo.c 和 fraginfo.c 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计 → ## 必背结论 extfraginfo.c 采集事件，fraginfo.c 采集状态；一个定位发生者，一个解释系统状态。）
- `d285fa1b37127141` → `eaff5bc42a83ed6a`，标签：展开（### 第 24 题 extfraginfo.c 和 fraginfo.c 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计 → ## 标准回答（完整） `extfraginfo.c` 是事件采集程序。它挂 `mm_page_alloc_extfrag` Tracepo）
- `d285fa1b37127141` → `c18ab34514be691f`，标签：边界（### 第 24 题 extfraginfo.c 和 fraginfo.c 分别负责什么？它们和 Linux 内存管理中的事件监控、状态统计 → ## 常见误区 / 边界 两个 C 文件由输出模式选择时未必同时运行，必须结合当前实现核对。）
- `15d678ad99780b81` → `b6a1785e079b1758`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 6. eBPF 程序如何计算碎片化指数 第 25～30 题）
- `b6a1785e079b1758` → `2ab691c74f9167e4`（## 6. eBPF 程序如何计算碎片化指数 第 25～30 题 → ### 第 25 题 fill_contig_page_info() 做了什么？为什么它要遍历所有 order？）
- `2ab691c74f9167e4` → `6f39676752092800`，标签：必背（### 第 25 题 fill_contig_page_info() 做了什么？为什么它要遍历所有 order？ → ## 必背结论 遍历所有 Order 才能把不同阶的块统一折算，得到目标 Order 的总量和可满足量。）
- `2ab691c74f9167e4` → `5029f5f846400d10`，标签：展开（### 第 25 题 fill_contig_page_info() 做了什么？为什么它要遍历所有 order？ → ## 标准回答（完整） `fill_contig_page_info()` 针对一个 zone 和一个目标 `suitable_order`）
- `2ab691c74f9167e4` → `9de922f39bf3c1bb`，标签：边界（### 第 25 题 fill_contig_page_info() 做了什么？为什么它要遍历所有 order？ → ## 常见误区 / 边界 nr_free 是块数，不是页数；不能跳过高阶块折算。）
- `b6a1785e079b1758` → `fedd43ce644862c7`（## 6. eBPF 程序如何计算碎片化指数 第 25～30 题 → ### 第 26 题 free_pages、free_blocks_total、free_blocks_suitable 分别代表什么？）
- `fedd43ce644862c7` → `cbb5595332cb1465`，标签：必背（### 第 26 题 free_pages、free_blocks_total、free_blocks_suitable 分别代表什么？ → ## 必背结论 free_pages 是空闲页总量，free_blocks_total 是空闲块总数，free_blocks_suitabl）
- `fedd43ce644862c7` → `4d7c681b3e6cca63`，标签：展开（### 第 26 题 free_pages、free_blocks_total、free_blocks_suitable 分别代表什么？ → ## 标准回答（完整） `free_pages` 是把所有阶空闲块乘以各自页数后得到的总空闲页；`free_blocks_total` 是所）
- `fedd43ce644862c7` → `ca4f359e49464f9c`，标签：边界（### 第 26 题 free_pages、free_blocks_total、free_blocks_suitable 分别代表什么？ → ## 常见误区 / 边界 free_blocks_total 和 free_pages 维度不同，不能直接互换。）
- `b6a1785e079b1758` → `9b831cebd1b37f5e`（## 6. eBPF 程序如何计算碎片化指数 第 25～30 题 → ### 第 27 题 free_blocks_suitable 为什么不能只简单统计 order >= suitable_order 的块数）
- `9b831cebd1b37f5e` → `efb47e525a4f8d55`，标签：必背（### 第 27 题 free_blocks_suitable 为什么不能只简单统计 order >= suitable_order 的块数 → ## 必背结论 高阶块可以拆分满足多个低阶请求，suitable 必须折算页数/块数，不能只数块。）
- `9b831cebd1b37f5e` → `a776ec1d770ba313`，标签：展开（### 第 27 题 free_blocks_suitable 为什么不能只简单统计 order >= suitable_order 的块数 → ## 标准回答（完整） 因为不同阶的一个块能满足目标请求的次数不同。目标 order 为 2 时，一个 order 2 块只能满足一次 4 ）
- `9b831cebd1b37f5e` → `5cc95f4382740bdb`，标签：边界（### 第 27 题 free_blocks_suitable 为什么不能只简单统计 order >= suitable_order 的块数 → ## 常见误区 / 边界 高阶块是否能满足请求还涉及拆分、对齐、相邻性和迁移类型，不是简单的 order 比较。）
- `b6a1785e079b1758` → `e47161295b08f375`（## 6. eBPF 程序如何计算碎片化指数 第 25～30 题 → ### 第 28 题 unusable_free_index 和 extfrag_index 分别衡量什么？为什么需要两个指标，而不是只用一）
- `e47161295b08f375` → `acdf9679a76890d3`，标签：必背（### 第 28 题 unusable_free_index 和 extfrag_index 分别衡量什么？为什么需要两个指标，而不是只用一 → ## 必背结论 unusable_free_index 衡量“现在有多难”，extfrag_index 更偏向判断“为什么难”。）
- `e47161295b08f375` → `7614a654fec4fb40`，标签：展开（### 第 28 题 unusable_free_index 和 extfrag_index 分别衡量什么？为什么需要两个指标，而不是只用一 → ## 标准回答（完整） `unusable_free_index`（源码中的 `score_b`）衡量现有空闲页中，有多大比例不能用于当前 ）
- `e47161295b08f375` → `9868bc7dee8385eb`，标签：边界（### 第 28 题 unusable_free_index 和 extfrag_index 分别衡量什么？为什么需要两个指标，而不是只用一 → ## 常见误区 / 边界 两个指数不能合并成一个笼统的“碎片率”，还要结合水位、回收和规整解释。）
- `b6a1785e079b1758` → `34a0c8f9471662e9`（## 6. eBPF 程序如何计算碎片化指数 第 25～30 题 → ### 第 29 题 extfrag_index 中如果 free_blocks_suitable > 0，为什么可以直接返回负值？这个负值）
- `34a0c8f9471662e9` → `4c8122c5aee715d0`，标签：必背（### 第 29 题 extfrag_index 中如果 free_blocks_suitable > 0，为什么可以直接返回负值？这个负值 → ## 必背结论 只要存在 suitable 块，连续性不是当前障碍，extfrag_index 返回负值表示状态良好。）
- `34a0c8f9471662e9` → `62ad2f05a9587aba`，标签：展开（### 第 29 题 extfrag_index 中如果 free_blocks_suitable > 0，为什么可以直接返回负值？这个负值 → ## 标准回答（完整） `free_blocks_suitable > 0` 表示当前 zone 至少存在一个可直接使用或通过拆分满足目标 ）
- `34a0c8f9471662e9` → `75fa2f32951b84c8`，标签：边界（### 第 29 题 extfrag_index 中如果 free_blocks_suitable > 0，为什么可以直接返回负值？这个负值 → ## 常见误区 / 边界 负值表示存在合适连续块，不代表所有分配条件（例如 watermark）都一定满足。）
- `b6a1785e079b1758` → `1f4e93b5d831c4c3`（## 6. eBPF 程序如何计算碎片化指数 第 25～30 题 → ### 第 30 题 如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？）
- `1f4e93b5d831c4c3` → `6a117f6b999ff768`，标签：必背（### 第 30 题 如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？ → ## 必背结论 空闲少且 extfrag 接近 0 更像总量不足；空闲不少、suitable 少且 extfrag 高更像外碎片。）
- `1f4e93b5d831c4c3` → `0ef20360220f6c13`，标签：展开（### 第 30 题 如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？ → ## 标准回答（完整） 要按同一个 node、zone、order 联合看。先看 `free_pages` 判断总量，再看 `free_bl）
- `1f4e93b5d831c4c3` → `8785e28f0b7c87bc`，标签：边界（### 第 30 题 如何通过这些指标判断当前问题更像是“内存不足”，还是“外部碎片导致连续页分配困难”？ → ## 常见误区 / 边界 指数只能说明 Zone/Order 状态，不能单独证明某次失败完全由碎片造成。）
- `15d678ad99780b81` → `30668bd73138be74`（# 09 高频面试题（35题） 先背绿色一句话，再展开完整标准回答；每题都保留原文答案与边界提醒。 → ## 7. 整个项目运行逻辑 第 31～35 题）
- `30668bd73138be74` → `705bddd252e897a2`（## 7. 整个项目运行逻辑 第 31～35 题 → ### 第 31 题 请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终）
- `705bddd252e897a2` → `d4bd41a24d0ef4b7`，标签：必背（### 第 31 题 请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终 → ## 必背结论 一分钟介绍按痛点、技术栈、双探针、Map 数据流、可视化结果和项目边界组织。）
- `705bddd252e897a2` → `1db67b40aa7dde90`，标签：展开（### 第 31 题 请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终 → ## 标准回答（完整） 这个项目解决的是 Linux 服务器总空闲内存看起来还够，但因为物理页不连续，高阶连续页分配仍可能困难的问题。它使用）
- `705bddd252e897a2` → `bbd0bdd528d52780`，标签：边界（### 第 31 题 请你用 1 分钟介绍这个 Linux 物理内存碎片化可视化监测工具：项目背景是什么、技术栈是什么、核心功能是什么、最终 → ## 常见误区 / 边界 项目介绍要说明这是 BCC/eBPF 教学原型，并诚实说明当前源码的可运行性边界。）
- `30668bd73138be74` → `ae236ced616daf19`（## 7. 整个项目运行逻辑 第 31～35 题 → ### 第 32 题 从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链）
- `ae236ced616daf19` → `5d8e2da379343079`，标签：必背（### 第 32 题 从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链 → ## 必背结论 用户态启动 → BCC 加载 → eBPF 挂探针 → 内核触发 → Map 写入 → Python 读取 → curses）
- `ae236ced616daf19` → `3e30e9aebd5b0e68`，标签：展开（### 第 32 题 从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链 → ## 标准回答（完整） 用户运行 `exfrag_user.py`，程序解析命令行并创建 `ExtFrag`。`ExtFrag` 根据模式选）
- `ae236ced616daf19` → `d3ced21858c8bb5a`，标签：边界（### 第 32 题 从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链 → ## 常见误区 / 边界 不要把 eBPF 说成主动后台线程；探针是内核事件触发，Python 是读取和展示。）
- `30668bd73138be74` → `44ea6e157b1a5059`（## 7. 整个项目运行逻辑 第 31～35 题 → ### 第 33 题 这个项目相比 /proc/buddyinfo 有什么优势和不足？它更适合解决什么场景下的问题？）
- `44ea6e157b1a5059` → `5b8fa4de4bc25d31`，标签：必背（### 第 33 题 这个项目相比 /proc/buddyinfo 有什么优势和不足？它更适合解决什么场景下的问题？ → ## 必背结论 相比 buddyinfo，本项目提供事件、Node/Zone/Order 和指数，但复杂度、兼容性和语义风险更高。）
- `44ea6e157b1a5059` → `b6d8fc3118049ec5`，标签：展开（### 第 33 题 这个项目相比 /proc/buddyinfo 有什么优势和不足？它更适合解决什么场景下的问题？ → ## 标准回答（完整） `/proc/buddyinfo` 是内核提供的各 node/zone/order 空闲块快照，简单、稳定、无需加载）
- `44ea6e157b1a5059` → `8bc6d3c386a87c30`，标签：边界（### 第 33 题 这个项目相比 /proc/buddyinfo 有什么优势和不足？它更适合解决什么场景下的问题？ → ## 常见误区 / 边界 优势和不足要一起说，不能只说 eBPF 比 buddyinfo 更实时、更低开销。）
- `30668bd73138be74` → `93d271b9ad90c2b8`（## 7. 整个项目运行逻辑 第 31～35 题 → ### 第 34 题 这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 delay_map 和 last_time_map？）
- `93d271b9ad90c2b8` → `b19c91a7ca6b7094`，标签：必背（### 第 34 题 这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 delay_map 和 last_time_map？ → ## 必背结论 delay_map 提供采样间隔，last_time_map 保存采样状态；内核节流和 UI sleep 是两层不同机制。）
- `93d271b9ad90c2b8` → `3aec4d991e8d7583`，标签：展开（### 第 34 题 这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 delay_map 和 last_time_map？ → ## 标准回答（完整） 设计意图是时间窗口采样。Python 把秒级间隔写入 `delay_map[0]`；eBPF 每次触发先用 `bpf）
- `93d271b9ad90c2b8` → `da5eee07f5abe92f`，标签：边界（### 第 34 题 这个项目如何控制 eBPF 高频触发带来的性能开销？为什么需要 delay_map 和 last_time_map？ → ## 常见误区 / 边界 当前时间 Map 的 key/更新时间逻辑存在闭环问题，采样开销必须实测。）
- `30668bd73138be74` → `beef63262d527dd8`（## 7. 整个项目运行逻辑 第 31～35 题 → ### 第 35 题 如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？）
- `beef63262d527dd8` → `1e61e97bccbcd081`，标签：必背（### 第 35 题 如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？ → ## 必背结论 生产化要同时修兼容性、节流、数据模型、Order 动态发现、事件日志、准确性和可观测性。）
- `beef63262d527dd8` → `2a5f7a3cb9aee93e`，标签：展开（### 第 35 题 如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？ → ## 标准回答（完整） 兼容性上，我会优先使用稳定 Tracepoint，kprobe 部分迁移到 libbpf + CO-RE，使用 BT）
- `beef63262d527dd8` → `973464a13b61ed24`，标签：边界（### 第 35 题 如果让你把这个工具优化成生产环境可长期运行的监控工具，你会从兼容性、性能、数据准确性和可观测性几个方面怎么改？ → ## 常见误区 / 边界 生产化不能只换成 CO-RE，还要补充事件丢失、Map 容量、并发、版本和长期运行验证。）

## Linux物理内存碎片检测-思维导图.canvas

- 原始路径：`archive/思维导图/Linux物理内存碎片检测-思维导图.canvas`
- 节点：108；边：107
- JSON：有效；节点 ID 唯一：True；边引用有效：True

### 节点摘要

1. `1d401491b0491b63` (group)：01 项目定位与主链
2. `cba718a5adecdeb6` (group)：02 Linux内存基础
3. `891495dbcd788e5b` (group)：04 数据结构与BPF Map
4. `b77dd53c23777bab` (group)：05 碎片化指数
5. `e04d838ee0304d8e` (group)：06 Python与curses
6. `2d401409544c44a0` (group)：07 源码审计与边界
7. `22ee433942d49f1a` (group)：08 学习、重构与面试
8. `19604ea38850bca4` (group)：03 eBPF/BCC与双探针
9. `7a127819ff38e8f9` (text)：## 手算顺序 1. 给出每个order的\`nr_free\` 2. 累加空闲页与块数 3. 按目标order换算suitable数量 4. 代入两个公式 5. 解释为什么两个结果可能不同 [[4.2.1 全链路手工追踪|全链路与手算]]
10. `cb884401dee82047` (text)：## 直觉例子 目标\`order=2\`需要4个连续页。若有8个空闲页但全是8个\`order=0\`小块： - 空闲总量足够两次请求 - suitable块为0 - unusable趋近1000 - 问题在连续性，而非总页数
11. `e9b8d90b9b7659a1` (text)：## 三个中间量 \`free_pages\`：所有order空闲页总数 \`free_blocks_total\`：所有空闲块数量 \`free_blocks_suitable\`：可拆成目标order块的数量 它们来自遍历\`zone->free_area[]\`。
12. `56c39c1725683ebc` (text)：## unusable_free_index \`(free_pages - (suitable << order)) / free_pages × 1000\` 表示空闲页中，因不连续而不能直接服务目标order请求的比例；0最好，1000最差。
13. `daf4771c8475639d` (text)：## extfrag_index 源码逻辑先区分： - 有suitable块 → \`-1000\` - 无空闲块 → \`0\` - 否则结合“理论可组成的请求数”与实际块数给出碎片程度 它强调失败更像“总量不足”还是“碎片问题”。
14. `309d376df76d57f2` (text)：## 两个指数怎样配合 - unusable高：大量空闲页不能满足目标连续性 - extfrag正且高：分配困难更像外碎片 - extfrag负：仍存在合适连续块 - 仅看单一分数不能证明某次失败原因 [[3.4.3 碎片化指数计算算法|指数计算算法]]
15. `83a2e3f82af761d5` (text)：## ⚠ 公式与实现边界 - \`MAX_ORDER=10\`并配合\`<=\`依赖特定内核布局 - 需要区分最大有效order和order数量 - Map快照可能不完全一致 - 指数说明Zone/Order状态，不等于直接归因到某个进程 - 生产诊断要联合buddyinfo、extfrag_index、vmstat和workload
16. `d64d7e043079e960` (text)：## VCQ自测 - \`free_blocks_suitable\`为何要将高阶块折算？ - 有suitable块时extfrag为何返回负值？ - 空闲总量不足与外碎片怎样区分？ - 同一Zone不同Order的分数为何不同？ - 哪些采样竞态会影响解释？
17. `87d8e0c09bc43822` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/fragmentation-index-logic_animated.svg
18. `fd823b618662305e` (text)：## 源码地标 \`fraginfo.c:48\`：\`unusable_free_index\` \`fraginfo.c:57\`：\`__fragmentation_index\` \`fraginfo.c:71\`：\`fill_contig_page_info\` \`fraginfo.c:147-162\`：逐order计算并更新Map [[4.2.3 核心难点精讲|核心难点精讲]]
19. `f288b553c0e124c6` (text)：# Linux物理内存与伙伴系统 先建立Page、Node、Zone、Order，再谈碎片和指数。
20. `046dd1265c0d0872` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线，并用Wiki与当前源码校准。
21. `9d910670ab69988e` (text)：## Page / PFN / 连续性 页是物理内存管理基本单位，通常4KB；PFN是页框编号。高阶请求需要 \`2^order\` 个物理连续页： \`order=0 → 1页\` \`order=2 → 4页\` \`order=10 → 1024页\`
22. `b98013aea8368506` (text)：## Migratetype与fallback 伙伴系统按迁移类型维护空闲链表，例如Movable、Unmovable、Reclaimable。目标类型无合适块时，可能从其他迁移类型“借块”，破坏反碎片布局。 \`mm_page_alloc_extfrag\`关注的核心正是这种fallback，而不只是order大小。
23. `24756653974b4cc1` (text)：## 高频追问 - 空闲内存充足为什么仍会失败？ - 高阶块怎样拆分与合并？ - Node/Zone/Order分别解决什么？ - 外部碎片和内部碎片如何区分？ - Compaction能解决哪些情况，不能保证什么？
24. `6db2f2e0266eea1f` (text)：# Python适配与curses可视化 Python负责加载、配置、解码、筛选和展示，不是内核采集者。
25. `d3016f443f686d2d` (text)：## 最小调试顺序 1. Python语法编译 2. BCC模块import 3. C文件路径与权限 4. Tracepoint/kprobe存在性 5. BPF编译/验证器日志 6. Map是否更新 7. 先纯文本打印，再接curses 8. 最后验证筛选与刷新
26. `12b5dca0fa253a64` (text)：## 面试表达 “Python不负责直接读取任意内核地址。它通过BCC加载eBPF，向控制Map写配置，从结果Map读取由内核态程序验证后采集的数据，再完成排序、格式化和curses展示。”
27. `2b734d22406ca464` (text)：## Node → Zone → Order - **Node**：NUMA内存节点 - **Zone**：DMA/DMA32/Normal等区域 - **Order**：连续块大小层级 - \`free_area[order]\`：伙伴系统的空闲链表 [[3.2.1 Linux物理内存与伙伴系统|物理内存与伙伴系统]]
28. `b4fa19b8089c0cea` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/project-data-flow_animated.svg
29. `8b7bef23c5b368ab` (text)：## 项目导航 [[projects/Linux物理内存检测项目/index|项目首页]] [[1.1 学习总览与架构地图|学习总览与架构地图]] 复习顺序：内存基础 → eBPF链路 → 双探针 → Map → 指数 → Python展示 → 源码审计。
30. `20255ec8f609faab` (text)：## 掌握标准 你需要能闭卷画出两条观测线，并回答： 1. 哪个内核事件触发？ 2. 采集哪些结构和字段？ 3. 写入哪个Map？ 4. Python怎样读取？ 5. 当前实现有哪些不能过度宣称的边界？
31. `ff4fee44d85378b2` (text)：## PDF章节地图 - p.1-4：整体介绍与必要性 - p.4-15：\`fraginfo.c\` - p.15-20：\`extfraginfo.c\` - p.21-22：碎片化指数 - p.22-26：伙伴系统与分配 - p.27-28：BCC作用
32. `194226c1016627fe` (text)：## 输出数据维度 \`NODE_ID\` · \`ZONE_COMM\` · \`PFN\` · \`ORDER\` \`FREE_PAGES\` · \`TOTAL\` · \`SUITABLE\` \`extfrag_index\` · \`unusable_index\` \`PID/COMM\` · \`ALLOC_ORDER\` · \`FALLBACK_ORDER\` · \`COUNT\`
33. `64f04f75fe945055` (text)：## 快速入口与事实提醒 [[2.2 快速搭建与运行|快速搭建与运行]] 旧Quick Start描述的是目标结构；当前快照存在import、文件名、\`./bpf/\`路径和BCC模块名不一致，不能直接视为已验证可运行。
34. `870d6afaa2792d52` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线，并用Wiki与当前源码校准。
35. `f50da37c60354709` (text)：# 碎片化指数与手算链路 不要把两个分数统称成一个“碎片率”。
36. `7501ab93ad0069f7` (text)：## 两条观测线 **事件线**：\`mm_page_alloc_extfrag\` → \`counts_map\` → 按PID聚合展示。 **状态线**：\`get_page_from_freelist\` → Node/Zone/Order扫描 → \`pgdat_map + zone_map\` → 指数/表格。
37. `1d9a2af45e8416e8` (text)：## 四个核心源码文件 - \`extfraginfo.c\`：Tracepoint事件采集 - \`fraginfo.c\`：kprobe状态扫描与指数 - \`exfrag.py\`：BCC加载、Map适配 - \`exfrag_user.py\`：参数与curses UI 当前源码位于外部项目根目录。
38. `a03e1715edef6d11` (text)：## 资料优先级 1. **主文档**：28页原作者 PDF 2. **补充**：项目目录内 26 个 Markdown 与 8 个 SVG 3. **事实校验**：当前四个核心源码文件 源码位置：\`/Users/zhaowenqiang/Desktop/Linux物理内存碎片检测\` \`fraginfo.c\` · \`extfraginfo.c\` · \`exfrag.py\` · \`exfrag_user.py\`
39. `a2ed6deac1f16227` (text)：# 项目定位与完整运行链 先回答：为什么需要它、采集什么、数据怎样回到终端。
40. `82e8f1eada620c71` (text)：## 项目解决什么问题 Linux 空闲页总量可能充足，但无法组成目标 order 所需的连续页块。工具用 eBPF 低侵入地观察： - 外碎片 fallback 事件 - Node/Zone/Order 状态 - 两种碎片化指数 - 进程与内存分配现场 [[2.1 项目概述与价值|项目概述与价值]]
41. `8627d7ce9cc9d0e9` (text)：## 一句话主链 Python 启动 → BCC编译/加载eBPF → \`bpf()\`进入内核 → Tracepoint/kprobe被动触发 → BPF Map保存数据 → Python读取 → curses终端展示。 这条链是学习和面试的总骨架。
42. `38583af0e0c010f1` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并用Wiki与当前源码校准。
43. `dc7cd4d44baa9b24` (text)：## 四个核心结构 - \`data_t\`：PID/COMM、PFN、两个order、count - \`pgdat_info\`：Node元数据 - \`zone_info\`：Zone/Order状态与两个分数 - \`contig_page_info\`：指数计算的三个中间量 结构体同时决定内核采集和Python解码契约。
44. `025a174f23128f8b` (text)：## 控制Map - \`delay_map[0]\`：用户态写入采样间隔 - \`last_time_map\`：计划记录上次采样时间 控制流是Python → Map → eBPF；结果流是eBPF → Map → Python。 [[3.3.3 BPF map通信机制|BPF Map通信]]
45. `21545bdace535381` (text)：## 阅读与颜色图例 🔵 项目链路 / 用户态 🟢 Linux内存 🟠 eBPF探针 🟡 数据/Map 🟣 指数/学习 🔴 风险与事实纠错 节点中的 **PDF p.X-Y** 对应主文档页码；Wiki链接用于继续深入。
46. `e770623fc0fe52c8` (text)：## 缺陷2：Order硬编码 源码重定义\`MAX_ORDER 10\`并使用\`<= MAX_ORDER\`；Python又用\`/11\`反推Zone数。 这依赖特定内核版本与数组长度，必须从目标内核真实定义推导。
47. `9ceda4ebdead0847` (text)：## 缺陷3：可运行性未闭合 文件名/import、BPF源码目录和BCC模块名不一致。没有证据证明当前快照已经在目标内核完成编译、加载、采集和UI联调。
48. `10e0540fe8419048` (text)：## 三层事实模型 1. **上游内核机制**：Tracepoint字段、伙伴系统、函数调用语义 2. **项目设计意图**：双探针、节流、Map、可视化 3. **当前源码行为**：实际路径、键值、聚合和缺陷 [[4.1 源码审计与事实边界|源码审计校准页]]
49. `499c5ac11a89e338` (text)：## 缺陷1：节流没有闭环 两段C代码都以不断变化的\`current_time\`作为Hash key查\`last_time_map\`，下一次几乎不会命中。 \`fraginfo.c\`还不断插入新时间key；\`extfraginfo.c\`甚至没有更新时间戳。
50. `d1f50bc01ab859b4` (text)：## 面试回答顺序 先说Map为什么存在，再说类型、key/value、生产者和消费者，最后说并发与丢数： “eBPF不能随意回调用户态，所以用Map作为稳定的数据与配置通道；不同Map按事件、状态和控制三类职责划分。”
51. `0c727471227f274e` (text)：# 数据结构与BPF Map 把每个字段放回“谁生产、写到哪、谁读取”。
52. `1341c8c06df09ac2` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/bpf-map-data-flow_animated.svg
53. `8bcfc4a29a55deb5` (text)：## 状态线数据流 \`alloc_context\` → preferred Node → fallback zonelist → 每个Zone → 每个Order → \`fill_contig_page_info\` → 两个指数 → \`zone_map\`；同时记录\`pgdat_map\`。 [[3.4.2 内存状态统计方法|内存状态统计]]
54. `5fc7285184828d69` (text)：## 格式化与风险提示 Python负责：字节串解码、Node/Zone分组、Order排序、数值格式化、屏幕裁剪、颜色编码、碎片条形图。 当前UI示例对高order且scoreB较高的行标红。 [[3.5.3 数据解析与格式化输出|解析与格式化]]
55. `81507ae78b8997ae` (text)：## 性能与采样 内核采样间隔与UI刷新间隔是两层控制： - \`delay_map\`影响探针采集计划 - \`time.sleep(args['delay'])\`影响终端刷新 二者应分别验证，不能因为UI慢就断言内核采样已节流。 [[3.5.2 性能优化与采样控制|性能与采样控制]]
56. `14a50281649b8252` (text)：## 当前数据适配假设 - \`get_node_data()\`用记录数\`/11\`推算Zone数量 - \`get_view_data()\`按\`(node_id, zone_name)\`覆盖，可能只保留某个Order - Hash Map遍历结果需显式排序 - 终端要求至少约50×250字符 这些都应进入重构与测试清单。
57. `2b7bed85f589bba2` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以PDF为主线，并用Wiki与当前源码校准。
58. `d34d99a929a790c8` (text)：## 调试检查点 1. BPF对象是否加载成功？ 2. 探针是否真正挂载？ 3. Map是否存在、键值类型是否匹配？ 4. 触发事件后Map是否增长/更新？ 5. Python解码、排序、过滤是否造成“看起来没数据”？
59. `c23a13559bf48a0e` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线，并用Wiki与当前源码校准。
60. `559b91ddca8b04c1` (text)：## 结果Map - \`counts_map<PID,data_t>\`：事件聚合快照 - \`pgdat_map<pgdat_ptr,pgdat_info>\`：Node信息 - \`zone_map<zone_ptr+order,zone_info>\`：Zone/Order状态 键设计决定覆盖、聚合维度、并发语义与可追溯性。
61. `d85b189c4d18be2c` (text)：## 键设计的风险 - \`counts_map\`仅用PID：丢失时间序列与order/migratetype组合 - \`zone_ptr + order\`：依赖地址和order编码不冲突 - \`last_time_map\`当前使用纳秒时间做key：无法表示同一份“上次时间”状态 - 多CPU更新需要说明竞态语义
62. `65e863b4cae09eda` (text)：## 事件线数据流 Tracepoint参数 → \`data_t\` → 以PID查\`counts_map\` → 新建或累计count → 更新最近一次PFN/order/COMM → Python排序展示。 [[3.4.1 外碎片化事件采集|外碎片事件采集]]
63. `c0fc30b8e573bc95` (text)：## Python读取方式 \`map.items()\`返回键值快照；\`exfrag.py\`解码C结构体、按Node/Zone分组、按Order排序，再交给UI。 注意：哈希Map遍历无天然排序，排序与聚合是用户态责任。
64. `641677cbf5582bd0` (text)：## 为什么两个都需要 Tracepoint回答“发生了什么fallback事件”；kprobe回答“当时伙伴系统状态怎样”。 只有事件缺少全局状态，只有状态缺少明确事件语义；二者关联后诊断更完整。
65. `9ebc042d99d3cfb4` (text)：## 内核态设计原则 - 只做有界循环与必要采集 - 使用 \`bpf_probe_read_kernel*\` 安全读取 - Map承接结果和配置 - 避免阻塞、动态分配和不可验证行为 [[3.1.2 内核态eBPF程序设计|内核态程序设计]]
66. `9803384f4801efd2` (text)：## VCQ五问 1. 为什么空闲内存够仍会失败？ 2. Python到eBPF触发经历什么？ 3. 双探针各观察什么？ 4. 五类Map分别负责什么？ 5. 三个中间量怎样进入两个指数？ [[4.2.2 深度学习路线与VCQ诊断|VCQ诊断与路线]]
67. `36156aff5ff3c060` (text)：## 七阶段依赖路线 物理直觉 → eBPF生命周期/Map → 双探针 → 内核态源码 → 指数手算 → Python/curses → 重构与答辩。 后面的点答不上来，先回退检查依赖，而不是继续背结论。
68. `2dc7a86dcf6ee34d` (text)：## 四条闭卷知识链 1. **内存链**：Page → Order → Buddy → 碎片 2. **事件链**：Tracepoint → counts_map → UI 3. **状态链**：kprobe → Zone扫描 → 指数 → UI 4. **控制链**：CLI → delay_map → 采样/刷新 每条都要能指出源码函数和边界。
69. `ae70364848ecf4ff` (text)：## 从零重建顺序 先做纯文本最小版本 → 只挂Tracepoint → 只挂kprobe → 独立验证Map → 手算对照指数 → 加过滤和采样 → 最后接curses。 每步都设置成功、负向和兼容性验收。
70. `e517533bfd9e7454` (text)：# 学习、重构与面试 目标不是看过，而是能手画、手算、追踪、纠错和重建。
71. `8e69a7e37e6a620c` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主线，并用Wiki与当前源码校准。
72. `ceb94aac26f64b31` (text)：## ⚠ fallback_order纠错 \`fallback_order\`是fallback路径找到的块阶数，通常满足： \`fallback_order >= alloc_order\` 内核可拆分较高阶块，最终仍满足原始请求。判断是否破坏反碎片布局还要结合\`alloc_migratetype\`、\`fallback_migratetype\`和ownership变化。
73. `e8bf9b9fad0b576d` (text)：## 内部碎片 vs 外部碎片 - **内部碎片**：分到的块大于实际需要，浪费发生在块内部。 - **外部碎片**：空闲总量够，但分散，无法满足连续高阶请求。 本项目重点检测外部碎片。 [[3.2.2 内存碎片化问题分析|碎片化问题分析]]
74. `8ece93dd5a77f576` (text)：## 页分配路径 \`__alloc_pages\` → \`get_page_from_freelist\` 首次尝试；失败后进入回收、规整等慢速路径，期间可能再次调用 \`get_page_from_freelist\`。 所以入口kprobe是高频“观测点”，不能简单说只执行一次fast path。 [[3.2.3 内存分配快速路径监控|快速路径监控]]
75. `152377d6d99d3aa2` (text)：## 伙伴系统与SLUB 伙伴系统管理页级连续物理内存；SLUB在页之上管理小对象。 对象分配问题不能直接等同于伙伴系统高阶页碎片；回答时要先说明所处层级。
76. `4f5d86c97f4202c6` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/buddy-allocation-path_animated.svg
77. `68369498e307901f` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/external-fragmentation_animated.svg
78. `4583b1e2be06c0ea` (text)：## 伙伴系统 分配时优先寻找目标order；没有则拆分更高阶块。释放时若地址对应的伙伴块空闲，则逐级合并。 优势：快速管理连续物理页。 局限：频繁分配释放、迁移类型混合会损害高阶连续块。
79. `d95ac2b7a3212032` (text)：# 源码审计与事实边界 每个结论必须区分：内核语义、设计意图、当前实现。
80. `b38f02eee62c3c76` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主线，并用Wiki与当前源码校准。
81. `d422008869b24d2d` (text)：## 稳定性取舍 Tracepoint字段是相对稳定接口；kprobe依赖内部实现。生产化需要： - 内核版本/配置矩阵 - BTF/CO-RE或兼容层 - 挂载点存在性检查 - 结构偏移和函数签名验证 - 失败时明确降级
82. `b1805b1bd60eaaff` (text)：## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论以PDF为主线，并用Wiki与当前源码校准。
83. `ed6555f4c02a70a1` (text)：## eBPF完整生命周期 C源码 → BCC/Clang编译字节码 → \`bpf()\`加载 → 验证器检查 → JIT/解释执行 → 挂到Tracepoint/kprobe → 内核事件触发 → Map输出。 [[3.1.1 eBPF与BCC技术栈|eBPF与BCC技术栈]]
84. `5f96e339af1a38c4` (text)：## BCC做什么 - 提供Python \`BPF\`接口 - 调用编译器和加载系统调用 - 自动处理探针挂载与Map对象 - 让用户态能像容器一样读写Map BCC简化工程链路，但不消除内核版本和探针签名差异。
85. `ccfe55a93c281ae9` (text)：# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Python/curses**
86. `aaf932d99f43ac31` (file)：projects/Linux物理内存检测项目/linux物理内存检测工具：_带目录.pdf
87. `6ccda37b43e79860` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/tracepoint-kprobe_animated.svg
88. `43b6378b805e45ef` (text)：## 源码地标 \`extfraginfo.c:20\`：Tracepoint入口 \`fraginfo.c:91\`：kprobe入口 \`exfrag.py:17-22\`：根据输出模式选择C文件并写入\`delay_map\` 当前代码体现了设计主线，也暴露了路径和兼容性问题。
89. `4733abb3a8cc3ce8` (text)：## Tracepoint：事件视角 \`TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)\` 优点：内核预定义、字段语义相对稳定。 观察：跨迁移类型fallback事件、PFN、order、PID/COMM。 [[3.3.1 tracepoint探针机制|Tracepoint机制]]
90. `2dcf697964ca1aa8` (text)：## kprobe：状态视角 \`kprobe__get_page_from_freelist(...)\` 优点：灵活插入内部函数入口。 风险：函数名、签名和内部结构随内核版本变化。 观察：当前zonelist、Node/Zone、各order空闲块。 [[3.3.2 kprobe动态插桩技术|kprobe技术]]
91. `4fc6c96b87ca595f` (text)：# eBPF/BCC与双探针 理解“加载一次、按事件被动触发、通过Map交付结果”。
92. `35071c574aed6533` (text)：## 缺陷4：事件并非日志 \`counts_map\`按PID聚合，保存累计count和最近字段： - 没有事件时间序列 - PID复用会混淆 - 不保留不同order/migratetype组合 - 多CPU并发计数语义未验证
93. `179a440e65ca77e0` (text)：## 新旧资料关系 PDF提供完整设计主线和代码讲解；新版Wiki增加了上游语义核对、源码缺陷、VCQ、手算和重构路线。 [[4.4 新旧Wiki对比总结|新旧Wiki对比]] Canvas保留设计价值，同时用红色节点标出不能照搬的结论。
94. `ee99448d1ad6f1fe` (text)：## 高频面试主题 Tracepoint vs kprobe｜eBPF生命周期｜\`bpf()\`与验证器｜伙伴系统/SLUB｜Node/Zone/Order｜内外碎片｜两个挂点时机｜BPF Map｜碎片化指数｜Python/curses｜采样与生产化边界 [[Linux物理内存碎片高频面试题|高频面试题与标准答案]]
95. `9c071b78655b90ef` (text)：## 生产化证据要求 联合验证：\`/proc/buddyinfo\`、debugfs extfrag指数、\`/proc/vmstat\`回收/规整计数、目标workload、内核版本与配置。 还需基准：CPU开销、Map容量、事件丢失、多CPU竞态、长时间运行和降级策略。
96. `a3039da7c054c7d5` (text)：## 60秒项目介绍 这是一个BCC/eBPF教学原型：Tracepoint记录迁移类型fallback事件，kprobe在页分配路径采集Node/Zone/Order伙伴系统状态，经BPF Map交给Python/curses展示。复盘源码发现节流key、目录/import、order硬编码和事件聚合存在问题，因此后续重点是先恢复可运行性，再验证兼容性、丢数与开销。
97. `f62aee300173a45b` (text)：## 回答模板 **痛点** → **机制** → **项目实现** → **源码证据** → **取舍** → **当前缺陷/改进**。 不要只说“eBPF低开销”；要说明挂点、字段、Map、触发时机、当前兼容性和验证证据。
98. `e0c150783889de41` (text)：## 验证矩阵 - 功能：两种探针与各Map变化 - 负向：挂点不存在、权限不足、Map为空 - 正确性：手算与内核接口对照 - 兼容：多内核版本/配置 - 性能：CPU、Map容量、采样频率 - UI：小终端、过滤、刷新、异常退出
99. `3c9eea274b424ece` (text)：## 使用这张图复习 - **3分钟**：只看八个分区标题和粗体主链 - **15分钟**：沿四条知识链复述 - **深入**：点击PDF和Wiki节点 - **面试前**：随机抽题，必须说出源码证据与事实边界 [[1.1 学习总览与架构地图|回到学习入口]]
100. `a42c85f83431951c` (text)：## 最终掌握标准 能手画完整数据流、解释双探针取舍、手算两个指数、追踪四个源码文件、指出当前缺陷，并给出可验证的重构顺序。 达到这个标准，才是“真正读过项目”，而不是只会复述PDF。
101. `f983155c77fa85d2` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/sampling-throttle_animated.svg
102. `9e8eceefe97497fb` (text)：## ⚠ 当前启动不一致 - \`exfrag_user.py\`：\`from extfrag import ExtFrag\` - 实际文件：\`exfrag.py\` - \`exfrag.py\`加载\`./bpf/*.c\` - 实际C文件位于项目根目录 - \`from bpfcc import BPF\`需按发行版验证是否应为\`bcc\` 旧命令不能直接当作已通过。
103. `a4dd8235e0236066` (text)：## \`ExtFrag\`适配层 构造时按模式选择eBPF源码并写\`delay_map\`；随后提供： - \`get_zone_data()\` - \`get_view_data()\` - \`get_node_data()\` - \`get_count_data()\` 负责C结构解码、排序和数据形状转换。 [[3.1.3 用户态Python架构|用户态Python架构]]
104. `e4988c1e28ead428` (text)：## 命令行模式 \`-d\`间隔 \`-n\`Node信息 \`-i\`Node过滤 \`-c\`Zone过滤 \`-e/-u\`指数选择 \`-s\`事件计数 \`-b\`条形图 \`-z\`Zone详情 \`-v\`可视化视图 参数最终决定加载哪个BPF程序以及如何渲染。
105. `034e33b746b8e43a` (text)：## curses生命周期 \`curses.wrapper(main)\` → 初始化颜色/光标/非阻塞输入 → 检查终端尺寸 → 解析参数 → 创建\`ExtFrag\` → 循环读Map → 表格/进度条 → refresh/sleep。 [[3.5.1 curses终端可视化实现|curses实现]]
106. `06e33d59db6ef4f2` (text)：## 缺陷5：不能过度归因 工具能观察fallback事件和内存状态，但不能单独证明： - 某次失败完全由碎片造成 - 某进程制造了全部碎片 - compaction一定有效 - 跨内核稳定、无丢数、低开销
107. `285e5527c1a54124` (file)：assets/linux-memory/Linux物理内存碎片高频面试题/event-state-correlation_animated.svg
108. `99eeee8f5826c088` (text)：## 最小修复顺序 1. 统一文件名/import/目录 2. 固定key并闭合节流状态 3. 消除order与Zone数量硬编码 4. 拆分事件流和聚合视图 5. 补充migratetype字段 6. 建立版本、功能、负向和开销测试 [[4.3 实战重构与面试追问|实战重构与追问]]

### 边摘要

- `a03e1715edef6d11` → `ccfe55a93c281ae9`，标签：资料汇总（## 资料优先级 1. **主文档**：28页原作者 PDF 2. **补充**：项目目录内 26 个 Markdown 与 8 个 SVG → # Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho）
- `ccfe55a93c281ae9` → `aaf932d99f43ac31`，标签：主文档（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → projects/Linux物理内存检测项目/linux物理内存检测工具：_带目录.pdf）
- `ccfe55a93c281ae9` → `21545bdace535381`，标签：阅读说明（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → ## 阅读与颜色图例 🔵 项目链路 / 用户态 🟢 Linux内存 🟠 eBPF探针 🟡 数据/Map 🟣 指数/学习 🔴 风险与事实纠错 ）
- `ccfe55a93c281ae9` → `a2ed6deac1f16227`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # 项目定位与完整运行链 先回答：为什么需要它、采集什么、数据怎样回到终端。）
- `a2ed6deac1f16227` → `38583af0e0c010f1`，标签：PDF主线（# 项目定位与完整运行链 先回答：为什么需要它、采集什么、数据怎样回到终端。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并）
- `38583af0e0c010f1` → `82e8f1eada620c71`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 项目解决什么问题 Linux 空闲页总量可能充足，但无法组成目标 order 所需的连续页块。工具用 eBPF 低侵入地观察： - 外）
- `38583af0e0c010f1` → `8627d7ce9cc9d0e9`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 一句话主链 Python 启动 → BCC编译/加载eBPF → `bpf()`进入内核 → Tracepoint/kprobe被动触）
- `38583af0e0c010f1` → `7501ab93ad0069f7`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 两条观测线 **事件线**：`mm_page_alloc_extfrag` → `counts_map` → 按PID聚合展示。 **）
- `38583af0e0c010f1` → `1d9a2af45e8416e8`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 四个核心源码文件 - `extfraginfo.c`：Tracepoint事件采集 - `fraginfo.c`：kprobe状态扫描）
- `38583af0e0c010f1` → `194226c1016627fe`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 输出数据维度 `NODE_ID` · `ZONE_COMM` · `PFN` · `ORDER` `FREE_PAGES` · `TO）
- `38583af0e0c010f1` → `64f04f75fe945055`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 快速入口与事实提醒 [[2.2 快速搭建与运行|快速搭建与运行]] 旧Quick Start描述的是目标结构；当前快照存在import）
- `38583af0e0c010f1` → `b4fa19b8089c0cea`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → assets/linux-memory/Linux物理内存碎片高频面试题/project-data-flow_animated.svg）
- `38583af0e0c010f1` → `8b7bef23c5b368ab`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 项目导航 [[projects/Linux物理内存检测项目/index|项目首页]] [[1.1 学习总览与架构地图|学习总览与架构地）
- `38583af0e0c010f1` → `20255ec8f609faab`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## 掌握标准 你需要能闭卷画出两条观测线，并回答： 1. 哪个内核事件触发？ 2. 采集哪些结构和字段？ 3. 写入哪个Map？ 4. P）
- `38583af0e0c010f1` → `ff4fee44d85378b2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-4** 本区结论以PDF为主线，并 → ## PDF章节地图 - p.1-4：整体介绍与必要性 - p.4-15：`fraginfo.c` - p.15-20：`extfragin）
- `ccfe55a93c281ae9` → `f288b553c0e124c6`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # Linux物理内存与伙伴系统 先建立Page、Node、Zone、Order，再谈碎片和指数。）
- `f288b553c0e124c6` → `046dd1265c0d0872`，标签：PDF主线（# Linux物理内存与伙伴系统 先建立Page、Node、Zone、Order，再谈碎片和指数。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线）
- `046dd1265c0d0872` → `9d910670ab69988e`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## Page / PFN / 连续性 页是物理内存管理基本单位，通常4KB；PFN是页框编号。高阶请求需要 `2^order` 个物理连续）
- `046dd1265c0d0872` → `2b734d22406ca464`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## Node → Zone → Order - **Node**：NUMA内存节点 - **Zone**：DMA/DMA32/Normal）
- `046dd1265c0d0872` → `4583b1e2be06c0ea`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## 伙伴系统 分配时优先寻找目标order；没有则拆分更高阶块。释放时若地址对应的伙伴块空闲，则逐级合并。 优势：快速管理连续物理页。 局）
- `046dd1265c0d0872` → `e8bf9b9fad0b576d`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## 内部碎片 vs 外部碎片 - **内部碎片**：分到的块大于实际需要，浪费发生在块内部。 - **外部碎片**：空闲总量够，但分散，无）
- `046dd1265c0d0872` → `8ece93dd5a77f576`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## 页分配路径 `__alloc_pages` → `get_page_from_freelist` 首次尝试；失败后进入回收、规整等慢速）
- `046dd1265c0d0872` → `152377d6d99d3aa2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## 伙伴系统与SLUB 伙伴系统管理页级连续物理内存；SLUB在页之上管理小对象。 对象分配问题不能直接等同于伙伴系统高阶页碎片；回答时要）
- `046dd1265c0d0872` → `4f5d86c97f4202c6`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → assets/linux-memory/Linux物理内存碎片高频面试题/buddy-allocation-path_animated.sv）
- `046dd1265c0d0872` → `68369498e307901f`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → assets/linux-memory/Linux物理内存碎片高频面试题/external-fragmentation_animated.s）
- `046dd1265c0d0872` → `b98013aea8368506`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## Migratetype与fallback 伙伴系统按迁移类型维护空闲链表，例如Movable、Unmovable、Reclaimabl）
- `046dd1265c0d0872` → `24756653974b4cc1`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.22-26** 本区结论以PDF为主线 → ## 高频追问 - 空闲内存充足为什么仍会失败？ - 高阶块怎样拆分与合并？ - Node/Zone/Order分别解决什么？ - 外部碎片）
- `ccfe55a93c281ae9` → `4fc6c96b87ca595f`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # eBPF/BCC与双探针 理解“加载一次、按事件被动触发、通过Map交付结果”。）
- `4fc6c96b87ca595f` → `b1805b1bd60eaaff`，标签：PDF主线（# eBPF/BCC与双探针 理解“加载一次、按事件被动触发、通过Map交付结果”。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论）
- `b1805b1bd60eaaff` → `ed6555f4c02a70a1`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## eBPF完整生命周期 C源码 → BCC/Clang编译字节码 → `bpf()`加载 → 验证器检查 → JIT/解释执行 → 挂到）
- `b1805b1bd60eaaff` → `5f96e339af1a38c4`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## BCC做什么 - 提供Python `BPF`接口 - 调用编译器和加载系统调用 - 自动处理探针挂载与Map对象 - 让用户态能像容）
- `b1805b1bd60eaaff` → `4733abb3a8cc3ce8`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## Tracepoint：事件视角 `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)` 优点：）
- `b1805b1bd60eaaff` → `2dcf697964ca1aa8`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## kprobe：状态视角 `kprobe__get_page_from_freelist(...)` 优点：灵活插入内部函数入口。 风险）
- `b1805b1bd60eaaff` → `641677cbf5582bd0`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## 为什么两个都需要 Tracepoint回答“发生了什么fallback事件”；kprobe回答“当时伙伴系统状态怎样”。 只有事件缺少）
- `b1805b1bd60eaaff` → `9ebc042d99d3cfb4`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## 内核态设计原则 - 只做有界循环与必要采集 - 使用 `bpf_probe_read_kernel*` 安全读取 - Map承接结果和）
- `b1805b1bd60eaaff` → `6ccda37b43e79860`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → assets/linux-memory/Linux物理内存碎片高频面试题/tracepoint-kprobe_animated.svg）
- `b1805b1bd60eaaff` → `43b6378b805e45ef`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## 源码地标 `extfraginfo.c:20`：Tracepoint入口 `fraginfo.c:91`：kprobe入口 `exfr）
- `b1805b1bd60eaaff` → `ceb94aac26f64b31`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## ⚠ fallback_order纠错 `fallback_order`是fallback路径找到的块阶数，通常满足： `fallbac）
- `b1805b1bd60eaaff` → `d422008869b24d2d`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20、p.27-28** 本区结论 → ## 稳定性取舍 Tracepoint字段是相对稳定接口；kprobe依赖内部实现。生产化需要： - 内核版本/配置矩阵 - BTF/CO-）
- `ccfe55a93c281ae9` → `0c727471227f274e`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # 数据结构与BPF Map 把每个字段放回“谁生产、写到哪、谁读取”。）
- `0c727471227f274e` → `c23a13559bf48a0e`，标签：PDF主线（# 数据结构与BPF Map 把每个字段放回“谁生产、写到哪、谁读取”。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线，）
- `c23a13559bf48a0e` → `dc7cd4d44baa9b24`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 四个核心结构 - `data_t`：PID/COMM、PFN、两个order、count - `pgdat_info`：Node元数据）
- `c23a13559bf48a0e` → `559b91ddca8b04c1`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 结果Map - `counts_map<PID,data_t>`：事件聚合快照 - `pgdat_map<pgdat_ptr,pgda）
- `c23a13559bf48a0e` → `025a174f23128f8b`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 控制Map - `delay_map[0]`：用户态写入采样间隔 - `last_time_map`：计划记录上次采样时间 控制流是P）
- `c23a13559bf48a0e` → `65e863b4cae09eda`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 事件线数据流 Tracepoint参数 → `data_t` → 以PID查`counts_map` → 新建或累计count → 更）
- `c23a13559bf48a0e` → `8bcfc4a29a55deb5`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 状态线数据流 `alloc_context` → preferred Node → fallback zonelist → 每个Zon）
- `c23a13559bf48a0e` → `c0fc30b8e573bc95`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## Python读取方式 `map.items()`返回键值快照；`exfrag.py`解码C结构体、按Node/Zone分组、按Orde）
- `c23a13559bf48a0e` → `1341c8c06df09ac2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → assets/linux-memory/Linux物理内存碎片高频面试题/bpf-map-data-flow_animated.svg）
- `c23a13559bf48a0e` → `d85b189c4d18be2c`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 键设计的风险 - `counts_map`仅用PID：丢失时间序列与order/migratetype组合 - `zone_ptr +）
- `c23a13559bf48a0e` → `d1f50bc01ab859b4`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 面试回答顺序 先说Map为什么存在，再说类型、key/value、生产者和消费者，最后说并发与丢数： “eBPF不能随意回调用户态，所）
- `c23a13559bf48a0e` → `d34d99a929a790c8`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.4-20** 本区结论以PDF为主线， → ## 调试检查点 1. BPF对象是否加载成功？ 2. 探针是否真正挂载？ 3. Map是否存在、键值类型是否匹配？ 4. 触发事件后Map）
- `ccfe55a93c281ae9` → `f50da37c60354709`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # 碎片化指数与手算链路 不要把两个分数统称成一个“碎片率”。）
- `f50da37c60354709` → `870d6afaa2792d52`，标签：PDF主线（# 碎片化指数与手算链路 不要把两个分数统称成一个“碎片率”。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线）
- `870d6afaa2792d52` → `e9b8d90b9b7659a1`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## 三个中间量 `free_pages`：所有order空闲页总数 `free_blocks_total`：所有空闲块数量 `free_b）
- `870d6afaa2792d52` → `56c39c1725683ebc`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## unusable_free_index `(free_pages - (suitable << order)) / free_page）
- `870d6afaa2792d52` → `daf4771c8475639d`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## extfrag_index 源码逻辑先区分： - 有suitable块 → `-1000` - 无空闲块 → `0` - 否则结合“理）
- `870d6afaa2792d52` → `309d376df76d57f2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## 两个指数怎样配合 - unusable高：大量空闲页不能满足目标连续性 - extfrag正且高：分配困难更像外碎片 - extfra）
- `870d6afaa2792d52` → `7a127819ff38e8f9`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## 手算顺序 1. 给出每个order的`nr_free` 2. 累加空闲页与块数 3. 按目标order换算suitable数量 4. ）
- `870d6afaa2792d52` → `cb884401dee82047`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## 直觉例子 目标`order=2`需要4个连续页。若有8个空闲页但全是8个`order=0`小块： - 空闲总量足够两次请求 - sui）
- `870d6afaa2792d52` → `87d8e0c09bc43822`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → assets/linux-memory/Linux物理内存碎片高频面试题/fragmentation-index-logic_animate）
- `870d6afaa2792d52` → `fd823b618662305e`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## 源码地标 `fraginfo.c:48`：`unusable_free_index` `fraginfo.c:57`：`__fragm）
- `870d6afaa2792d52` → `83a2e3f82af761d5`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## ⚠ 公式与实现边界 - `MAX_ORDER=10`并配合`<=`依赖特定内核布局 - 需要区分最大有效order和order数量 -）
- `870d6afaa2792d52` → `d64d7e043079e960`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.21-22** 本区结论以PDF为主线 → ## VCQ自测 - `free_blocks_suitable`为何要将高阶块折算？ - 有suitable块时extfrag为何返回负值）
- `ccfe55a93c281ae9` → `6db2f2e0266eea1f`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # Python适配与curses可视化 Python负责加载、配置、解码、筛选和展示，不是内核采集者。）
- `6db2f2e0266eea1f` → `2b7bed85f589bba2`，标签：PDF主线（# Python适配与curses可视化 Python负责加载、配置、解码、筛选和展示，不是内核采集者。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以）
- `2b7bed85f589bba2` → `a4dd8235e0236066`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## `ExtFrag`适配层 构造时按模式选择eBPF源码并写`delay_map`；随后提供： - `get_zone_data()` ）
- `2b7bed85f589bba2` → `e4988c1e28ead428`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## 命令行模式 `-d`间隔 `-n`Node信息 `-i`Node过滤 `-c`Zone过滤 `-e/-u`指数选择 `-s`事件计数 ）
- `2b7bed85f589bba2` → `034e33b746b8e43a`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## curses生命周期 `curses.wrapper(main)` → 初始化颜色/光标/非阻塞输入 → 检查终端尺寸 → 解析参数 ）
- `2b7bed85f589bba2` → `5fc7285184828d69`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## 格式化与风险提示 Python负责：字节串解码、Node/Zone分组、Order排序、数值格式化、屏幕裁剪、颜色编码、碎片条形图。 ）
- `2b7bed85f589bba2` → `81507ae78b8997ae`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## 性能与采样 内核采样间隔与UI刷新间隔是两层控制： - `delay_map`影响探针采集计划 - `time.sleep(args[）
- `2b7bed85f589bba2` → `14a50281649b8252`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## 当前数据适配假设 - `get_node_data()`用记录数`/11`推算Zone数量 - `get_view_data()`按`）
- `2b7bed85f589bba2` → `f983155c77fa85d2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → assets/linux-memory/Linux物理内存碎片高频面试题/sampling-throttle_animated.svg）
- `2b7bed85f589bba2` → `9e8eceefe97497fb`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## ⚠ 当前启动不一致 - `exfrag_user.py`：`from extfrag import ExtFrag` - 实际文件：`）
- `2b7bed85f589bba2` → `d3016f443f686d2d`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## 最小调试顺序 1. Python语法编译 2. BCC模块import 3. C文件路径与权限 4. Tracepoint/kprob）
- `2b7bed85f589bba2` → `12b5dca0fa253a64`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF p.1-2、p.27-28** 本区结论以 → ## 面试表达 “Python不负责直接读取任意内核地址。它通过BCC加载eBPF，向控制Map写配置，从结果Map读取由内核态程序验证后采）
- `ccfe55a93c281ae9` → `d95ac2b7a3212032`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # 源码审计与事实边界 每个结论必须区分：内核语义、设计意图、当前实现。）
- `d95ac2b7a3212032` → `b38f02eee62c3c76`，标签：PDF主线（# 源码审计与事实边界 每个结论必须区分：内核语义、设计意图、当前实现。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主）
- `b38f02eee62c3c76` → `10e0540fe8419048`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 三层事实模型 1. **上游内核机制**：Tracepoint字段、伙伴系统、函数调用语义 2. **项目设计意图**：双探针、节流、）
- `b38f02eee62c3c76` → `499c5ac11a89e338`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 缺陷1：节流没有闭环 两段C代码都以不断变化的`current_time`作为Hash key查`last_time_map`，下一次）
- `b38f02eee62c3c76` → `e770623fc0fe52c8`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 缺陷2：Order硬编码 源码重定义`MAX_ORDER 10`并使用`<= MAX_ORDER`；Python又用`/11`反推Zo）
- `b38f02eee62c3c76` → `9ceda4ebdead0847`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 缺陷3：可运行性未闭合 文件名/import、BPF源码目录和BCC模块名不一致。没有证据证明当前快照已经在目标内核完成编译、加载、采）
- `b38f02eee62c3c76` → `35071c574aed6533`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 缺陷4：事件并非日志 `counts_map`按PID聚合，保存累计count和最近字段： - 没有事件时间序列 - PID复用会混淆）
- `b38f02eee62c3c76` → `06e33d59db6ef4f2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 缺陷5：不能过度归因 工具能观察fallback事件和内存状态，但不能单独证明： - 某次失败完全由碎片造成 - 某进程制造了全部碎片）
- `b38f02eee62c3c76` → `285e5527c1a54124`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → assets/linux-memory/Linux物理内存碎片高频面试题/event-state-correlation_animated.）
- `b38f02eee62c3c76` → `99eeee8f5826c088`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 最小修复顺序 1. 统一文件名/import/目录 2. 固定key并闭合节流状态 3. 消除order与Zone数量硬编码 4. 拆）
- `b38f02eee62c3c76` → `179a440e65ca77e0`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 新旧资料关系 PDF提供完整设计主线和代码讲解；新版Wiki增加了上游语义核对、源码缺陷、VCQ、手算和重构路线。 [[4.4 新旧W）
- `b38f02eee62c3c76` → `9c071b78655b90ef`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**PDF全篇 + 当前源码** 本区结论以PDF为主 → ## 生产化证据要求 联合验证：`/proc/buddyinfo`、debugfs extfrag指数、`/proc/vmstat`回收/规）
- `ccfe55a93c281ae9` → `e517533bfd9e7454`，标签：主分支（# Linux 物理内存碎片检测 ## 全面复习思维导图 **eBPF/BCC · 伙伴系统 · 双探针 · BPF Map · Pytho → # 学习、重构与面试 目标不是看过，而是能手画、手算、追踪、纠错和重建。）
- `e517533bfd9e7454` → `8e69a7e37e6a620c`，标签：PDF主线（# 学习、重构与面试 目标不是看过，而是能手画、手算、追踪、纠错和重建。 → ## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主）
- `8e69a7e37e6a620c` → `9803384f4801efd2`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## VCQ五问 1. 为什么空闲内存够仍会失败？ 2. Python到eBPF触发经历什么？ 3. 双探针各观察什么？ 4. 五类Map分）
- `8e69a7e37e6a620c` → `36156aff5ff3c060`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 七阶段依赖路线 物理直觉 → eBPF生命周期/Map → 双探针 → 内核态源码 → 指数手算 → Python/curses → ）
- `8e69a7e37e6a620c` → `2dc7a86dcf6ee34d`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 四条闭卷知识链 1. **内存链**：Page → Order → Buddy → 碎片 2. **事件链**：Tracepoint ）
- `8e69a7e37e6a620c` → `ae70364848ecf4ff`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 从零重建顺序 先做纯文本最小版本 → 只挂Tracepoint → 只挂kprobe → 独立验证Map → 手算对照指数 → 加过滤）
- `8e69a7e37e6a620c` → `ee99448d1ad6f1fe`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 高频面试主题 Tracepoint vs kprobe｜eBPF生命周期｜`bpf()`与验证器｜伙伴系统/SLUB｜Node/Zon）
- `8e69a7e37e6a620c` → `f62aee300173a45b`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 回答模板 **痛点** → **机制** → **项目实现** → **源码证据** → **取舍** → **当前缺陷/改进**。 ）
- `8e69a7e37e6a620c` → `a3039da7c054c7d5`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 60秒项目介绍 这是一个BCC/eBPF教学原型：Tracepoint记录迁移类型fallback事件，kprobe在页分配路径采集N）
- `8e69a7e37e6a620c` → `e0c150783889de41`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 验证矩阵 - 功能：两种探针与各Map变化 - 负向：挂点不存在、权限不足、Map为空 - 正确性：手算与内核接口对照 - 兼容：多内）
- `8e69a7e37e6a620c` → `3c9eea274b424ece`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 使用这张图复习 - **3分钟**：只看八个分区标题和粗体主链 - **15分钟**：沿四条知识链复述 - **深入**：点击PDF和）
- `8e69a7e37e6a620c` → `a42c85f83431951c`（## 主文档入口 [[linux物理内存检测工具：_带目录.pdf|原作者PDF]]：**Wiki学习路线与高频题** 本区结论以PDF为主 → ## 最终掌握标准 能手画完整数据流、解释双探针取舍、手算两个指数、追踪四个源码文件、指出当前缺陷，并给出可验证的重构顺序。 达到这个标准，）
- `4583b1e2be06c0ea` → `2dcf697964ca1aa8`，标签：分配现场（## 伙伴系统 分配时优先寻找目标order；没有则拆分更高阶块。释放时若地址对应的伙伴块空闲，则逐级合并。 优势：快速管理连续物理页。 局 → ## kprobe：状态视角 `kprobe__get_page_from_freelist(...)` 优点：灵活插入内部函数入口。 风险）
- `4733abb3a8cc3ce8` → `65e863b4cae09eda`，标签：写事件Map（## Tracepoint：事件视角 `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)` 优点： → ## 事件线数据流 Tracepoint参数 → `data_t` → 以PID查`counts_map` → 新建或累计count → 更）
- `2dcf697964ca1aa8` → `8bcfc4a29a55deb5`，标签：写状态Map（## kprobe：状态视角 `kprobe__get_page_from_freelist(...)` 优点：灵活插入内部函数入口。 风险 → ## 状态线数据流 `alloc_context` → preferred Node → fallback zonelist → 每个Zon）
- `8bcfc4a29a55deb5` → `e9b8d90b9b7659a1`，标签：提供中间量（## 状态线数据流 `alloc_context` → preferred Node → fallback zonelist → 每个Zon → ## 三个中间量 `free_pages`：所有order空闲页总数 `free_blocks_total`：所有空闲块数量 `free_b）
- `c0fc30b8e573bc95` → `a4dd8235e0236066`，标签：读取/适配（## Python读取方式 `map.items()`返回键值快照；`exfrag.py`解码C结构体、按Node/Zone分组、按Orde → ## `ExtFrag`适配层 构造时按模式选择eBPF源码并写`delay_map`；随后提供： - `get_zone_data()` ）
- `81507ae78b8997ae` → `499c5ac11a89e338`，标签：源码核对（## 性能与采样 内核采样间隔与UI刷新间隔是两层控制： - `delay_map`影响探针采集计划 - `time.sleep(args[ → ## 缺陷1：节流没有闭环 两段C代码都以不断变化的`current_time`作为Hash key查`last_time_map`，下一次）
- `ceb94aac26f64b31` → `10e0540fe8419048`，标签：事实纠错（## ⚠ fallback_order纠错 `fallback_order`是fallback路径找到的块阶数，通常满足： `fallbac → ## 三层事实模型 1. **上游内核机制**：Tracepoint字段、伙伴系统、函数调用语义 2. **项目设计意图**：双探针、节流、）
- `9c071b78655b90ef` → `f62aee300173a45b`，标签：诚实表达（## 生产化证据要求 联合验证：`/proc/buddyinfo`、debugfs extfrag指数、`/proc/vmstat`回收/规 → ## 回答模板 **痛点** → **机制** → **项目实现** → **源码证据** → **取舍** → **当前缺陷/改进**。 ）

## Linux视觉感知项目复习-思维导图.canvas

- 原始路径：`archive/思维导图/Linux视觉感知项目复习-思维导图.canvas`
- 节点：107；边：110
- JSON：有效；节点 ID 唯一：True；边引用有效：True

### 节点摘要

1. `22052dea2ae88ab6` (group)：01 系统全景
2. `b2a306a7e053c1a7` (group)：02 Qt 控制与监控
3. `a7aeaf864866cb62` (group)：03 LIME 算法主线
4. `a063e84ca0cd363d` (group)：04 NEON + OpenMP 加速
5. `48d799b5454de143` (group)：05 Unet + NCNN
6. `0144397c95193e6e` (group)：06 LSTR + ONNX Runtime
7. `4729fd7ce03f8eda` (group)：07 构建、审计与破坏测试
8. `268520545fbe7555` (group)：08 面试、重建与取舍
9. `420b925ea74e313d` (text)：# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结果显示 → CPU / 内存监控**
10. `a5b10ad9c7a7196c` (text)：## 使用方法 - **3 分钟**：只看八个分组标题和粗体结论 - **15 分钟**：沿主链、LIME链、Unet链、LSTR链复述 - **深入**：点击文档预览并对照源码地标 - **闭卷**：做每区的手写追踪、破坏测试和面试自测
11. `ba7b6adfa4b82640` (text)：## 事实边界 - 可点击节点来自 Vault 的拆分 Wiki - 源码事实来自桌面 \`Linux视觉感知处理系统\` - 外部源码路径以文本地标呈现，不创建失效 File 节点 - 性能数字为项目资料记录值，本 Canvas 未重新跑基准
12. `c311cea5c012141e` (text)：# 01 系统全景与端到端数据流 先回答：这个系统解决什么问题，各模块为什么存在？
13. `ae3d7d34a781eadc` (file)：projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md
14. `da655d9abec24229` (text)：## 项目身份与平台 - 校园无人配送车车道感知 - FT2000/4 四核 ARM v8 + 麒麟 V10 - 海康 DS-E12 摄像头 - AMD R5-230 主要承担显示 - C++ / OpenCV / Qt / NCNN / ONNX Runtime **约束：边缘端、CPU 为主、低照度、要可视化。**
15. `44c347c1ca79915d` (text)：## 一条主链 \`Qt按钮\` → 摄像头/视频帧 → 文件帧交换 → \`LIME\` 增强 → \`Unet 或 LSTR\` → 后处理 → Qt 结果显示。 并行旁路：\`/proc\`/命令输出 → CPU、内存 → QtCharts。
16. `c8480f8d79ef04f6` (text)：## 模块边界 - **Qt**：控制、显示、调度、监控 - **LIME**：改善低照度输入质量 - **Unet/LSTR**：识别车道线 - **NEON/OpenMP**：压缩 CPU 热点 - **NCNN/ONNX Runtime**：承载端侧推理 不要把 Qt 说成算法核心。
17. `aa2153a0fa90d843` (text)：## 两条模型路线 - Unet：像素级语义分割 → \`H×W mask\` - LSTR：候选有效性 + 曲线参数 - 前者像“画家”，后者像“数学家” 绿色可行驶区域是后处理构造，不是 LSTR 直接输出。
18. `d15efd75140838fb` (text)：## 文件系统 IPC 当前实现把抽帧、推理结果写入固定目录，再由 Qt 读取。 **优点**：直观、模块解耦、易调试。 **代价**：磁盘 I/O、延迟、路径耦合、同步与清理问题。 [[projects/Linux视觉感知项目/3 系统架构/3.3 模块间协作与进程间通信机制|模块协作与 IPC]]
19. `4c935f6f8f13cccb` (text)：## 心智模型：流水线 - Qt：调度台 - 摄像头/视频：原料入口 - LIME：补光工位 - Unet/LSTR：检测员 - 后处理：标注工位 - QtCharts：仪表盘 检查点：每个工位拿什么输入、交什么输出？
20. `8c56190d5637617b` (text)：## 源码证据地图 - Qt：\`上位机程序/Lane_Detection/mainwindow.cpp\` - LIME：\`.../Lime/lime.cpp\` - 加速：\`.../Lime_NEON+OpenMP/lime_opt.cpp\` - Unet：\`.../Unet_NCNN/src/unet.cpp\` - LSTR：\`.../LSTR_ONNX/main.cpp\`
21. `ac1c5fefeb594a32` (text)：## 手写追踪 假设用户选择一段夜间视频： 1. 写出按钮到结果图的每一步 2. 标出进程边界和文件边界 3. 分别写出 Unet/LSTR 的输出语义 4. 指出哪一步最可能成为延迟瓶颈
22. `d98a22136424c301` (text)：## 破坏测试 如果把 Qt、LIME、推理、后处理塞进一个 UI 槽函数： - 事件循环被阻塞 - 模块无法单独测试 - 错误边界模糊 - 算法替换成本升高 **教训：控制层与重计算层必须有明确边界。**
23. `1a4a974c55454cfa` (text)：## 全景自测 1. 两分钟讲清项目目标、平台和主链。 2. 为什么低照度增强必须在检测前？ 3. 为什么保留两条模型路线？ 4. 为什么 Qt 不是算法核心？ 5. 文件系统 IPC 的适用场景和代价是什么？
24. `b9478a6b9c69a56c` (text)：# 02 Qt 控制、显示与资源监控 痛点：既要交互和显示，又不能让重计算拖死事件循环。
25. `3997a703e2c2da27` (file)：projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md
26. `9d52705e1427a8ac` (text)：## Qt 的职责 Qt 是**控制面**：接收按钮、组织摄像头/视频、启动外部程序、呈现结果、刷新监控。 算法数据面由 LIME 与模型完成。 心智模型：Qt 是调度台，而不是在调度台上亲自完成整条生产线。
27. `2cc374e56c2b2cf5` (text)：## 启动与事件循环 \`main()\` 创建 \`QApplication\` 和 \`MainWindow\`，窗口 \`show()\` 后由 \`a.exec()\` 进入事件循环。 去掉 \`a.exec()\`：窗口无法持续处理事件，会迅速退出。
28. `18656148d6112595` (text)：## 信号槽函数地图 - \`on_Open_triggered()\`：打开摄像头、启动帧定时器 - \`on_Stop_triggered()\`：停采集并释放 - \`on_Select_triggered()\`：选视频、ffmpeg 抽帧、播放 - \`yolop_process()\`：启动外部 LSTR 并读结果 - \`readFrame()\`：采集、显示、落盘
29. `0bb01159274e56c3` (text)：## 摄像头链 按钮 \`Open\` → \`on_Open_triggered()\` → \`cap.open(0)\` → \`timer->start(3)\` → timeout → \`readFrame()\` → \`cap.read()\` → \`MatImageToQt()\` → \`cameraView\`。 同时 resize 到 \`320×240\` 并把帧写入固定目录。
30. `3f3685c633b3fc49` (text)：## QProcess 调度 构造函数创建 \`process2/process3\` 并启动 Bash： - process2：进入 LSTR build，执行推理 - process3：通过 ffmpeg 抽视频帧 - \`readyReadStandardOutput()\` → \`readBashStandardOutputInfo()\` [[projects/Linux视觉感知项目/6 Qt 上位机程序开发指南/6.2 系统集成与监控/6.2.1 QProcess 进程管理与外部推理程序调用|QPro
31. `e5466b35d264a241` (text)：## CPU 与内存监控 \`timer2\` 每秒调用 \`timerTimeOut()\`： - CPU：累计计数必须用前后两次 \`/proc/stat\` 差值 - 内存：可用 \`free -m\` 当前快照 - \`receivedData_cpu()\` / \`receivedDate_mem()\` 更新曲线 [[projects/Linux视觉感知项目/6 Qt 上位机程序开发指南/6.2 系统集成与监控/6.2.2 CPU ／ 内存实时监控与 QtCharts 图表展示|资源监控]]
32. `d883f0ea715efe36` (text)：## Mat → QImage \`MatImageToQt()\` 按 \`CV_8UC1/3/4\` 分支转换。 关键风险： - OpenCV BGR 与 Qt RGB 顺序 - \`bytesPerLine\` 与连续内存 - 临时 Mat 生命周期 [[projects/Linux视觉感知项目/6 Qt 上位机程序开发指南/6.2 系统集成与监控/6.2.3 OpenCV Mat 与 QImage 格式互转|格式互转]]
33. `a7309aaf01096d68` (text)：## 源码地标 \`上位机程序/Lane_Detection/mainwindow.cpp\` 构造/析构、7 个核心槽函数、\`InitChart()\`、图例点击处理均在此。 \`mainwindow.h\` 给出 QTimer、QProcess、VideoCapture、图表序列等状态成员。
34. `df3c90bb4b499cb0` (text)：## 实现边界：QProcess ≠ 自动不卡 源码虽用外部进程执行推理，但 \`yolop_process()\` 仍调用 \`waitKey(10000)\`，随后在 UI 槽里循环读结果。 因此面试应说：**进程已分离，但 UI 路径仍有同步等待与轮询优化空间。**
35. `6e07da99e2a5e46a` (text)：## Qt 破坏与重建 - 去掉 \`a.exec()\` 会怎样？ - 推理直接跑 UI 线程会怎样？ - 为什么 CPU 不能只采一次？ - 固定绝对路径换设备后会怎样？ 闭卷重建：按钮 → signal → slot → QProcess → 文件结果 → Qt 显示。
36. `95a6547684e7fb18` (text)：# 03 LIME：从光照估计到增强 痛点：低照度让车道线不可见，直接推理会降低识别质量。
37. `a5b40683d8887a88` (file)：projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Retinex 理论与光照图估计.md
38. `ba372e3d2645b0f0` (text)：## 心智模型：图像眼镜 \`T\` 是每个空间位置的“镜片强度”。暗处 \`T\` 较小，\`channel / T\` 提升更多；亮处提升较少。 同一位置三个颜色通道共享 \`T\`，因为光照是空间属性，不属于单个颜色通道。
39. `81238d4409f601c2` (text)：## 初始光照图 \`T_hat\` \`_init_IllumMap()\`：输入转 \`CV_32F\`、归一化、计算每像素 RGB 最大值。 \`getMax()\` 得到粗光照估计 \`T_hat\`。 它快但不够平滑，需要后续优化得到 \`T\`。
40. `1e1b3b48629d4a68` (text)：## T / G / Z / u - **T**：优化后的光照图，主角 - **G**：梯度辅助变量，保留/稀疏结构 - **Z**：误差账本/拉格朗日辅助量 - **u**：惩罚参数，控制约束力度 口诀：T 主角，G 净化，Z 记账，u 控节奏。
41. `f00ccf113fa4b3b2` (text)：## 完整函数链 \`enhance(src)\` → \`_init_IllumMap()\` → \`getMax()\` → \`optIllumMap()\` → \`weightStrategy()\` → 迭代 \`solveT/G/Z/U\` → split RGB → 各通道 \`/ T\` → threshold → merge。
42. `371471cdff6d222d` (text)：## ADMM 迭代顺序 \`optIllumMap()\` 初始化 T/G/Z/u，随后循环： 1. \`T = solveT(G,Z,u)\` 2. \`G = solveG(T,Z,u,W)\` 3. \`Z = solveZ(T,G,Z,u)\` 4. \`u = solveU(u)\` 5. 用 Frobenius 范数判断收敛 [[projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.2 ADMM 优化框架：T／G／Z 子问题求解与 FFT 频域加速
43. `46905e1260ed2b7c` (text)：## \`solveT()\` 中的 DFT DFT 在这里是**求解优化子问题的工具**：把卷积/差分结构转到频域，简化求解，再恢复实部和矩阵形状。 不要回答成“给图像加了一个视觉滤镜”。
44. `109f120222fab8c6` (text)：## 安全护栏 源码在 \`solveT()\` 中执行： \`normalize(T_temp, T_temp, 0.2, 1, CV_MINMAX)\` 下界 0.2 防止后续 \`channel / T\` 被接近 0 的值放大到失控。 [[projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.3 收敛策略与关键参数调优（alpha、rho、归一化范围）|参数与收敛]]
45. `0c01546ea007ed49` (text)：## 函数地图 \`derivative\`、\`Dev\`：差分算子 \`Mat2Vec\`、\`reshape1D\`、\`getReal\`：频域/布局辅助 \`solveT/G/Z/U\`：子问题更新 \`weightStrategy\`：梯度权重 \`optIllumMap\`：总迭代 \`enhance\`：输入到增强输出
46. `44cb41637d348755` (text)：## 2×2 手写追踪 给定某通道：\`[[0.1,0.4],[0.6,0.9]]\`，给定 T：\`[[0.2,0.5],[0.75,1.0]]\`。 逐格计算 \`channel/T\`，再思考：若左上 T=0.001 会怎样？为什么三个通道必须使用同一张 T？
47. `2dff9731cd40bd8a` (text)：## LIME 自测 1. LIME 不只是“调亮”，核心是什么？ 2. \`T_hat\` 与 \`T\` 的区别？ 3. \`T/G/Z/u\` 各自做什么？ 4. DFT 为什么不是视觉滤镜？ 5. 去掉归一化下界会出现什么故障？
48. `0d0a3c96abc5768c` (text)：# 04 LIME 加速：缓存、SIMD 与多核 平台没有合适 GPU 通用计算路径，热点必须在 ARM CPU 上优化。
49. `2169377819801124` (file)：projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版.md
50. `235db57f3c228218` (text)：## 四层优化 1. 循环重排：顺应按行连续存储 2. 循环展开：\`j += 4\`，减少控制开销 3. NEON：单核一次处理 4 个 float 4. OpenMP：多个核心分区/分通道 顺序是先优化访问，再向量化，再多核。
51. `6d302fae17494eed` (text)：## NEON 心智模型 一个工人一次搬四箱： - \`vld1q_f32\`：装入 4 个 float - \`vmaxq_f32\`：4 路并行比较 - \`vmulq_f32/vaddq_f32\`：并行乘加 - \`vst1q_f32\`：写回 4 个 float
52. `dfca4649d9cb2c46` (text)：## \`getMax()\` 向量链 逐块加载 G/B/R 四个像素 → 两次 \`vmaxq_f32\` → 写入 \`T_hat\`。 源码还把图像划成四个 section，试图让四核并行处理。 必须检查：宽度不足 4 的尾部、块边界、写区是否互斥。
53. `a1c0e566ba2e0aa8` (text)：## OpenMP 心智模型 多个工人分区域工作。适合： - RGB 三通道增强 - 无共享写的图像块 不适合直接套用： - 有前后依赖的迭代 - 多线程写同一输出 - 顺序敏感的数据变换 [[projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.2 性能优化技术/4.2.2 OpenMP 多线程并行策略（色彩通道分离与图像分块处理）|OpenMP 策略]]
54. `0efd0848dab44cf2` (text)：## NEON 与 OpenMP - NEON：**单个核心变宽**，利用 SIMD lane - OpenMP：**多个核心并行**，利用线程 - 二者解决不同层级问题，可以叠加 但叠加后要关注线程开销、内存带宽和共享缓存竞争。
55. `d6e9e7fb8638398d` (text)：## FFT 与辅助热点 优化版增加 \`fft2()\`、\`fft2_neon()\`、\`ReverseBin()\`，并向量化 Frobenius、Mat2Vec、蝶形相关数据操作。 面试不要只背 intrinsic；要说明优化的是哪类数据访问和计算热点。
56. `103441e14e2336d2` (text)：## 项目资料记录值 针对 256×256 傅里叶相关处理： - 原始：**1.6305 s** - 函数重构：**1.031 s** - NEON + OpenMP：**0.314 s** - 总加速：约 **5.19×** 这是资料记录值，本 Canvas 未复跑基准。
57. `ae2ed8951e9257f8` (text)：## 性能结论要带条件 可靠基准应固定：输入尺寸、编译选项、线程数、热身、采样次数、硬件频率。 线程数远超 4 核会增加调度开销；SIMD 若忽略尾部会让最后几个像素错误。 [[projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.2 性能优化技术/4.2.4 优化前后性能对比与加速比分析|性能对比]]
58. `62d5f70441e05882` (text)：## 4×4 并行追踪 1. 把图像分成四块，标出每个线程写区。 2. 用 4 个 RGB 像素追踪 load → max → store。 3. 把宽度改成 6，指出 SIMD 尾部在哪里。 4. 找出需要 reduction/critical 的标量汇总。
59. `f0655a4058bd0444` (text)：## 加速自测 1. 循环重排解决什么瓶颈？ 2. 为什么步长常设为 4？ 3. NEON 与 OpenMP 一句话区别？ 4. 哪些循环不能盲目并行？ 5. 为什么性能数据必须说明测试条件？
60. `9edf7eae047ea2a1` (text)：# 05 Unet + NCNN：像素级分割链 痛点：车道线需要像素级位置和边界，而不只是“是否存在”。
61. `48ebdab95636ab45` (file)：projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：HWC 到 CHW 数据布局转换与 argmax 后处理.md
62. `6307334a256391b1` (text)：## 心智模型：画家 Unet 给每个像素涂类别： - 编码器提取语义 - 解码器恢复空间分辨率 - skip connection 把浅层细节送回解码端 适合细长车道边界，但整图像素推理开销较大。
63. `1f11a173ba4150b8` (text)：## 模型与入口 \`Unet_NCNN/src/unet.cpp\` 的逻辑集中在 \`main()\`： - 加载 \`.ncnn.param/.bin\` - 读输入图 - 预处理 - 创建 Extractor - 推理和 argmax - 去 padding、着色并保存
64. `251752ddbd4a7522` (text)：## 保持几何：先补方形 比较宽高，在短边两侧 \`copyMakeBorder()\` 补黑边，再 resize 到 \`720×720\`。 直接把长方形拉伸成方形会扭曲车道几何。后处理必须把 padding 区域重新置零。
65. `8b6c11807ebf5f9d` (text)：## HWC → CHW OpenCV \`CV_32FC3\` 是 HWC 交错布局；模型输入按通道连续。 映射： \`dst[k*H*W + i*W + j] = src[i*W*3 + j*3 + k]\` 忘记转换不会必然崩溃，却会得到语义错误的推理结果。
66. `13314dd7418e3b9b` (text)：## NCNN 推理 - \`ncnn::Mat\` reshape 为 \`720×720×3\` - \`create_extractor()\` - \`set_light_mode(true)\` - \`set_num_threads(4)\` 匹配四核 - \`ex.input("in0", in)\` - \`ex.extract("out0", mask)\`
67. `c8fe1beb87ad9db4` (text)：## Argmax 与去 Padding 对输出 \`mask.c\` 个类别逐像素取最大通道索引，写入灰度 mask；落在 left/right/top/bottom padding 的像素强制清零。 最后把 mask 区域着绿色。这里的绿色同样属于后处理可视化。
68. `4f672b9344292038` (text)：## 轻量化取舍 项目用深度可分离卷积等手段压缩端侧成本：把空间卷积和通道混合拆开。 资料记录：权重约 **124 MB → 24 MB**，但精度存在下降。 [[projects/Linux视觉感知项目/7 嵌入式平台优化实践/7.2 模型轻量化部署：深度可分离卷积与参数量压缩|模型轻量化]]
69. `7b013b27676504de` (text)：## 源码审计地标 \`卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp\` 关注： - 输入为空时缺少检查 - \`new float[...]\` 未释放 - padding 缩放公式依赖原宽高分支 - 输出、颜色与浮点 Mat 的类型边界
70. `ea252944fabd53d0` (text)：## 手写追踪 输入 \`1280×720×3 HWC\`： 1. 计算上下 padding 使其变方形 2. resize 到 720×720 3. 写出像素 \`(i,j,k)\` 的 CHW 地址 4. 对三类 logits 做 argmax 5. 清除 padding 并映回可视化
71. `34c0518347fd4e71` (text)：## Unet 自测 1. encoder / decoder / skip 各自解决什么？ 2. 为什么先 padding 再 resize？ 3. HWC 与 CHW 混淆为何很难排查？ 4. NCNN 在这里负责什么？ 5. argmax 后为什么还要去 padding？
72. `00611f4a63ba7f2f` (text)：# 06 LSTR + ONNX Runtime：参数化车道链 痛点：Unet 整图分割在开发板上较慢，需要更短的参数化检测路线。
73. `bf86ecb851165008` (file)：projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 ONNX Runtime 推理流程：模型加载、输入预处理与推理执行.md
74. `c8c782080cdcbc26` (text)：## 心智模型：数学家 LSTR 不输出整张语义 mask，而是输出： - 候选车道是否有效 - 有效车道的曲线参数 程序再把参数采样为离散点并绘制。它缩短了端侧后处理链。
75. `055a7ad8eb3fc818` (text)：## 构造函数 \`LSTR::LSTR()\`： 1. 加载 \`lstr_360x640.onnx\` 2. 获取输入/输出节点名和形状 3. 推导输入 H/W 4. 创建全零 \`mask_tensor\` 5. 读取 50 个 \`log_space\` 浮点值
76. `311f92a9dccf18e8` (text)：## \`normalize_()\` resize 后逐通道遍历，按 CHW 写入 \`input_image_\`： \`(pix/255 - mean[c]) / std[c]\` 均值 \`{0.485,0.456,0.406}\`，标准差 \`{0.229,0.224,0.225}\`。 输入布局错误会让模型看到错误语义。
77. `23a9c0ed4fd4f144` (text)：## 双输入机制 - image tensor：\`[1,3,H,W]\`，归一化图像 - mask tensor：\`[1,1,H,W]\`，当前实现全零 它是导出 ONNX 图签名要求的第二输入，不是最终可视化 mask。 [[projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.3 双输入机制与 log_space.bin 预计算数据|双输入与 log_space]]
78. `1f33e7ee0852e11d` (text)：## 推理与两类输出 \`ort_session->Run()\` 后： - \`pred_logits\`：各候选的类别/有效性 - \`pred_curves\`：每个候选的曲线参数 代码对 logits 取最大类别，\`max_id == 1\` 才把候选加入有效集合。
79. `676d81d1da26a497` (text)：## 曲线恢复 对 50 个 \`log_space[k]\` 采样： - y 在曲线有效范围内插值 - x 由 8 个曲线参数组合计算 - 再乘原图宽高得到像素坐标 \`log_space.bin\` 是预计算采样基准，不是模型权重。
80. `44635153ae0e41f9` (text)：## 可视化语义 源码寻找指定左右车道候选，把两组点拼成多边形，\`fillConvexPoly()\` 填绿色，再 \`addWeighted()\` 与原图叠加；随后绘制各车道采样点。 **绿色区域是 C++ 后处理生成，不是模型直接输出。**
81. `b2409f2c428c8925` (text)：## 项目资料记录值 优化后 LSTR： - 单图约 **0.182 s** - 权重约 **12 MB** - 准确率约 **90.7%** 对应 Unet 约 4.676 s、84.5%。这些是项目资料记录值，不是本轮复测。
82. `9cbf13687a8e77d8` (text)：## 源码审计地标 \`卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp\` 关注： - \`fopen/fread\` 缺少失败检查 - 左右车道数量都为 0 时仍可能索引 \`[0]\` - \`ort_session\` 使用 \`new\`，析构未见 delete - 曲线分母接近 0 的保护
83. `650ac492e95fa9b1` (text)：## LSTR 自测 1. 为什么已经有 Unet 还要 LSTR？ 2. 两个输入、两个输出分别是什么？ 3. \`log_space.bin\` 做什么？ 4. 绿色区域是否为模型输出？ 5. 从图片到曲线点完整复述 \`detect()\`。
84. `99f8c8b116e44c64` (text)：# 07 构建、源码审计与破坏测试 目标：不只会背理想架构，还能指出真实实现边界和故障位置。
85. `9c5887936e69c0f8` (file)：projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md
86. `97163e2156c4e192` (text)：## 四个构建单元 - Qt：qmake \`.pro\` 工程 - LIME：CMake + OpenCV + OpenMP/NEON - Unet：CMake + NCNN + OpenCV - LSTR：CMake + ONNX Runtime + OpenCV 先分模块验证，再串全链。不要把 \`build/\` 和 \`.o\` 当源码。
87. `1a3bca638d5a065e` (text)：## 最小复现顺序 1. 单图跑原始 LIME 2. 对同图跑优化版并比对输出 3. 单图跑 Unet 4. 单图跑 LSTR 5. 验证 Qt 摄像头/视频 6. 最后串文件目录与结果显示 [[projects/Linux视觉感知项目/2 快速入门/2.3 系统构建与运行/2.3.2 快速运行车道线检测流程|快速运行]]
88. `69c03e3ae39f3e08` (text)：## 路径耦合 Qt 源码硬编码 \`/home/kylin/桌面/project_v1.0/...\`；LSTR/Unet 也依赖相对模型路径。 换机器或工作目录就可能找不到模型、帧或结果。 改进：配置文件/命令行参数、启动时校验、统一路径管理。
89. `9441baeeaa86c721` (text)：## Qt 破坏测试 - 推理放 UI 线程 → 卡顿 - \`waitKey(10000)\` → 同步等待 - 无限范围轮询结果文件 → 长时占用事件处理 - 目录不存在 → 空结果但错误信息不足 改进：异步完成信号、任务状态机、超时和错误回传。
90. `0f73689ceadc5dce` (text)：## LIME 源码风险 原始 \`lime.cpp\` 可见重复的 \`derivative()\` 定义，\`solveT()\` 旁还有 \`//bug\`、\`//要取 -1\` 注释。 这些必须通过真实编译和数值测试确认，不能在面试中把文档算法直接等同于无缺陷实现。
91. `5715f848eba46657` (text)：## 模型部署风险 - 图像读取失败未检查 - 模型/预计算文件读取失败 - HWC/CHW 静默错位 - padding 未正确移除 - LSTR 无左右车道仍索引 - 手工 \`new\` 带来泄漏 优先补输入校验、边界校验和 RAII。
92. `6e5137d5da89f890` (text)：## 基准与正确性 性能优化必须同时验证： - 输出与基线误差 - 多尺寸、非 4 倍数宽度 - 单/多线程一致性 - 重复采样与统计量 - 峰值内存和线程数 只报“更快”而不验结果可能是在加速错误答案。
93. `f4d255fa41c179c5` (text)：## 故障定位链 症状 → 模块边界 → 输入/输出文件 → 进程退出码/标准输出 → 图像尺寸与类型 → tensor shape/layout → 后处理索引 → 资源与耗时。 每一步都保留可观察证据，不凭感觉跳到模型精度。
94. `590542a344b2ace0` (text)：## 故障演练 场景：Qt 能播放视频，但结果区为空。 依次检查：抽帧目录 → QProcess 命令/工作目录 → 模型和 \`log_space.bin\` → 推理标准输出 → result 文件编号 → Qt 轮询逻辑 → Mat 是否为空。
95. `8ed2dded8dd7fe7b` (text)：## 审计自测 1. 当前 QProcess 方案为什么仍可能卡 UI？ 2. 哪些硬编码路径会阻碍部署？ 3. LIME 源码中有哪些明确警示？ 4. SIMD 优化如何验证尾部正确？ 5. 如何证明“更快且没算错”？
96. `8f50ffa63e1e3b7e` (text)：# 08 面试表达、闭卷重建与设计取舍 掌握标准：能从痛点讲到代码，再主动指出边界与改进。
97. `1a29d40ef8282d92` (file)：projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md
98. `deac99ccb0df67db` (text)：## 两分钟回答骨架 1. 场景与平台：ARM Linux 校园配送车 2. 主链：Qt → LIME → Unet/LSTR → 显示/监控 3. 难点：低照度、无合适 GPU、端侧实时性 4. 优化：缓存、NEON、OpenMP、轻量化 5. 结果：给资料数字并说明测试边界 6. 反思：路径、异步、边界检查
99. `366c0b77e1c149fa` (text)：## LIME 面试必答 - 为什么增强在检测前？ - \`T_hat\` 和 \`T\` 有何不同？ - \`T/G/Z/u\` 如何协作？ - DFT 在 \`solveT()\` 里做什么？ - 为什么归一化到 \`[0.2,1]\`？ [[projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.2 LIME 算法与 NEON ／ OpenMP 优化面试要点|LIME 面试要点]]
100. `1f64a1748cef260a` (text)：## 优化面试必答 - 循环重排与缓存局部性 - \`j += 4\` 与 SIMD 宽度 - NEON vs OpenMP - 为什么二者可以叠加 - 为什么不能给所有循环加 OpenMP - 尾部、数据竞争、线程数和基准条件
101. `ae681917d895d1cd` (text)：## 模型面试必答 - Unet：像素 mask；LSTR：有效性 + 曲线参数 - NCNN 与 ONNX Runtime 各自承担什么 - HWC→CHW、padding、argmax - image/mask 双输入 - logits/curves 双输出 - 绿色区域属于后处理 [[projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.3 LSTR 与 Unet 模型部署面试要点|模型部署面试]]
102. `292a7f51dca2f831` (text)：## 设计取舍 - Unet：覆盖更完整，但端侧较慢 - LSTR：快且小，但复杂多车道泛化边界要说明 - 文件 IPC：简单可观察，但 I/O 与路径耦合 - 外部进程：隔离算法，但仍需真正异步 - CPU 优化：贴合硬件，但可移植性下降 [[projects/Linux视觉感知项目/8 学习路线与面试准备/8.3 系统设计决策与常见追问应对|设计追问]]
103. `201c181561a73f50` (text)：## 数字记忆卡（资料值） - LIME：1.6305 → 1.031 → 0.314 s，约 5.19× - Unet：17.386 → 4.676 s；准确率 93.1% → 84.5% - LSTR：1.953 → 0.182 s；124.7 → 12 MB；97.4% → 90.7% 回答时说明数据集、硬件和口径来自项目资料。
104. `0f6e338186b241a2` (text)：## 四条闭卷知识链 1. **系统链**：按钮 → 帧 → 增强 → 检测 → 显示 2. **LIME链**：T_hat → ADMM → T → channel/T 3. **Unet链**：pad → CHW → NCNN → argmax 4. **LSTR链**：双输入 → Run → logits/curves → 点集 能画出并解释边界才算掌握。
105. `f0d5791575ae5a60` (text)：## 费曼检验模板 对任意模块闭卷回答： 1. 它解决什么痛点？ 2. 最关键变量/函数/设计是什么？ 3. 哪个边界条件最危险？ 4. 去掉关键组件会坏在哪里？ 5. 在整条系统链处于什么位置？
106. `a6b74fc694bd6340` (text)：## 追问题 - 为什么不用 GPU？ - 为什么 LIME 不能只用 Gamma？ - OpenMP 线程越多越好吗？ - LSTR 绿色区域是否可信地代表模型输出？ - Qt 使用 QProcess 后为何仍可能卡？ - 如果重构，先改哪三个工程风险？
107. `12297ed1f578bc5b` (text)：## 最终通过标准 - 2 分钟讲项目，5 分钟讲难点 - 能从症状定位到源码文件和函数 - 能手写两条模型预/后处理链 - 能解释性能数字的测试边界 - 能主动指出当前实现风险，不把理想架构冒充现状 [[projects/linux视觉感知项目/index|项目首页]]

### 边摘要

- `420b925ea74e313d` → `a5b10ad9c7a7196c`，标签：复习方式（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → ## 使用方法 - **3 分钟**：只看八个分组标题和粗体结论 - **15 分钟**：沿主链、LIME链、Unet链、LSTR链复述 -）
- `a5b10ad9c7a7196c` → `ba7b6adfa4b82640`，标签：事实边界（## 使用方法 - **3 分钟**：只看八个分组标题和粗体结论 - **15 分钟**：沿主链、LIME链、Unet链、LSTR链复述 - → ## 事实边界 - 可点击节点来自 Vault 的拆分 Wiki - 源码事实来自桌面 `Linux视觉感知处理系统` - 外部源码路径以文）
- `c311cea5c012141e` → `ae3d7d34a781eadc`，标签：主入口（# 01 系统全景与端到端数据流 先回答：这个系统解决什么问题，各模块为什么存在？ → projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md）
- `ae3d7d34a781eadc` → `da655d9abec24229`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 项目身份与平台 - 校园无人配送车车道感知 - FT2000/4 四核 ARM v8 + 麒麟 V10 - 海康 DS-E12 摄像头）
- `ae3d7d34a781eadc` → `44c347c1ca79915d`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 一条主链 `Qt按钮` → 摄像头/视频帧 → 文件帧交换 → `LIME` 增强 → `Unet 或 LSTR` → 后处理 → Q）
- `ae3d7d34a781eadc` → `c8480f8d79ef04f6`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 模块边界 - **Qt**：控制、显示、调度、监控 - **LIME**：改善低照度输入质量 - **Unet/LSTR**：识别车道）
- `ae3d7d34a781eadc` → `aa2153a0fa90d843`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 两条模型路线 - Unet：像素级语义分割 → `H×W mask` - LSTR：候选有效性 + 曲线参数 - 前者像“画家”，后者）
- `ae3d7d34a781eadc` → `d15efd75140838fb`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 文件系统 IPC 当前实现把抽帧、推理结果写入固定目录，再由 Qt 读取。 **优点**：直观、模块解耦、易调试。 **代价**：磁盘）
- `ae3d7d34a781eadc` → `4c935f6f8f13cccb`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 心智模型：流水线 - Qt：调度台 - 摄像头/视频：原料入口 - LIME：补光工位 - Unet/LSTR：检测员 - 后处理：标）
- `ae3d7d34a781eadc` → `8c56190d5637617b`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 源码证据地图 - Qt：`上位机程序/Lane_Detection/mainwindow.cpp` - LIME：`.../Lime/）
- `ae3d7d34a781eadc` → `ac1c5fefeb594a32`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 手写追踪 假设用户选择一段夜间视频： 1. 写出按钮到结果图的每一步 2. 标出进程边界和文件边界 3. 分别写出 Unet/LSTR）
- `ae3d7d34a781eadc` → `d98a22136424c301`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 破坏测试 如果把 Qt、LIME、推理、后处理塞进一个 UI 槽函数： - 事件循环被阻塞 - 模块无法单独测试 - 错误边界模糊 -）
- `ae3d7d34a781eadc` → `1a4a974c55454cfa`（projects/Linux视觉感知项目/1 先看这里/1.1 深度学习入口：系统地图与阅读顺序.md → ## 全景自测 1. 两分钟讲清项目目标、平台和主链。 2. 为什么低照度增强必须在检测前？ 3. 为什么保留两条模型路线？ 4. 为什么 ）
- `420b925ea74e313d` → `c311cea5c012141e`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 01 系统全景与端到端数据流 先回答：这个系统解决什么问题，各模块为什么存在？）
- `b9478a6b9c69a56c` → `3997a703e2c2da27`，标签：主入口（# 02 Qt 控制、显示与资源监控 痛点：既要交互和显示，又不能让重计算拖死事件循环。 → projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md）
- `3997a703e2c2da27` → `9d52705e1427a8ac`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## Qt 的职责 Qt 是**控制面**：接收按钮、组织摄像头/视频、启动外部程序、呈现结果、刷新监控。 算法数据面由 LIME 与模型完）
- `3997a703e2c2da27` → `2cc374e56c2b2cf5`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## 启动与事件循环 `main()` 创建 `QApplication` 和 `MainWindow`，窗口 `show()` 后由 `a）
- `3997a703e2c2da27` → `18656148d6112595`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## 信号槽函数地图 - `on_Open_triggered()`：打开摄像头、启动帧定时器 - `on_Stop_triggered()）
- `3997a703e2c2da27` → `0bb01159274e56c3`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## 摄像头链 按钮 `Open` → `on_Open_triggered()` → `cap.open(0)` → `timer->st）
- `3997a703e2c2da27` → `3f3685c633b3fc49`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## QProcess 调度 构造函数创建 `process2/process3` 并启动 Bash： - process2：进入 LSTR）
- `3997a703e2c2da27` → `e5466b35d264a241`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## CPU 与内存监控 `timer2` 每秒调用 `timerTimeOut()`： - CPU：累计计数必须用前后两次 `/proc/）
- `3997a703e2c2da27` → `d883f0ea715efe36`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## Mat → QImage `MatImageToQt()` 按 `CV_8UC1/3/4` 分支转换。 关键风险： - OpenCV ）
- `3997a703e2c2da27` → `a7309aaf01096d68`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## 源码地标 `上位机程序/Lane_Detection/mainwindow.cpp` 构造/析构、7 个核心槽函数、`InitChar）
- `3997a703e2c2da27` → `df3c90bb4b499cb0`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## 实现边界：QProcess ≠ 自动不卡 源码虽用外部进程执行推理，但 `yolop_process()` 仍调用 `waitKey(）
- `3997a703e2c2da27` → `6e07da99e2a5e46a`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.1 Qt 上位机程序：界面控制与系统监控.md → ## Qt 破坏与重建 - 去掉 `a.exec()` 会怎样？ - 推理直接跑 UI 线程会怎样？ - 为什么 CPU 不能只采一次？ -）
- `420b925ea74e313d` → `b9478a6b9c69a56c`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 02 Qt 控制、显示与资源监控 痛点：既要交互和显示，又不能让重计算拖死事件循环。）
- `95a6547684e7fb18` → `a5b40683d8887a88`，标签：主入口（# 03 LIME：从光照估计到增强 痛点：低照度让车道线不可见，直接推理会降低识别质量。 → projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti）
- `a5b40683d8887a88` → `ba372e3d2645b0f0`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## 心智模型：图像眼镜 `T` 是每个空间位置的“镜片强度”。暗处 `T` 较小，`channel / T` 提升更多；亮处提升较少。 同）
- `a5b40683d8887a88` → `81238d4409f601c2`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## 初始光照图 `T_hat` `_init_IllumMap()`：输入转 `CV_32F`、归一化、计算每像素 RGB 最大值。 `g）
- `a5b40683d8887a88` → `1e1b3b48629d4a68`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## T / G / Z / u - **T**：优化后的光照图，主角 - **G**：梯度辅助变量，保留/稀疏结构 - **Z**：误差账）
- `a5b40683d8887a88` → `f00ccf113fa4b3b2`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## 完整函数链 `enhance(src)` → `_init_IllumMap()` → `getMax()` → `optIllumM）
- `a5b40683d8887a88` → `371471cdff6d222d`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## ADMM 迭代顺序 `optIllumMap()` 初始化 T/G/Z/u，随后循环： 1. `T = solveT(G,Z,u)` ）
- `a5b40683d8887a88` → `46905e1260ed2b7c`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## `solveT()` 中的 DFT DFT 在这里是**求解优化子问题的工具**：把卷积/差分结构转到频域，简化求解，再恢复实部和矩阵）
- `a5b40683d8887a88` → `109f120222fab8c6`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## 安全护栏 源码在 `solveT()` 中执行： `normalize(T_temp, T_temp, 0.2, 1, CV_MINM）
- `a5b40683d8887a88` → `0c01546ea007ed49`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## 函数地图 `derivative`、`Dev`：差分算子 `Mat2Vec`、`reshape1D`、`getReal`：频域/布局辅）
- `a5b40683d8887a88` → `44cb41637d348755`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## 2×2 手写追踪 给定某通道：`[[0.1,0.4],[0.6,0.9]]`，给定 T：`[[0.2,0.5],[0.75,1.0]]）
- `a5b40683d8887a88` → `2dff9731cd40bd8a`（projects/Linux视觉感知项目/4 LIME 低照度增强深度剖析/4.1 算法原理与实现/4.1.1 LIME 算法原理：Reti → ## LIME 自测 1. LIME 不只是“调亮”，核心是什么？ 2. `T_hat` 与 `T` 的区别？ 3. `T/G/Z/u` 各）
- `420b925ea74e313d` → `95a6547684e7fb18`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 03 LIME：从光照估计到增强 痛点：低照度让车道线不可见，直接推理会降低识别质量。）
- `0d0a3c96abc5768c` → `2169377819801124`，标签：主入口（# 04 LIME 加速：缓存、SIMD 与多核 平台没有合适 GPU 通用计算路径，热点必须在 ARM CPU 上优化。 → projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版）
- `2169377819801124` → `235db57f3c228218`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## 四层优化 1. 循环重排：顺应按行连续存储 2. 循环展开：`j += 4`，减少控制开销 3. NEON：单核一次处理 4 个 fl）
- `2169377819801124` → `6d302fae17494eed`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## NEON 心智模型 一个工人一次搬四箱： - `vld1q_f32`：装入 4 个 float - `vmaxq_f32`：4 路并行）
- `2169377819801124` → `dfca4649d9cb2c46`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## `getMax()` 向量链 逐块加载 G/B/R 四个像素 → 两次 `vmaxq_f32` → 写入 `T_hat`。 源码还把图）
- `2169377819801124` → `a1c0e566ba2e0aa8`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## OpenMP 心智模型 多个工人分区域工作。适合： - RGB 三通道增强 - 无共享写的图像块 不适合直接套用： - 有前后依赖的迭）
- `2169377819801124` → `0efd0848dab44cf2`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## NEON 与 OpenMP - NEON：**单个核心变宽**，利用 SIMD lane - OpenMP：**多个核心并行**，利用）
- `2169377819801124` → `d6e9e7fb8638398d`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## FFT 与辅助热点 优化版增加 `fft2()`、`fft2_neon()`、`ReverseBin()`，并向量化 Frobeniu）
- `2169377819801124` → `103441e14e2336d2`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## 项目资料记录值 针对 256×256 傅里叶相关处理： - 原始：**1.6305 s** - 函数重构：**1.031 s** - ）
- `2169377819801124` → `ae2ed8951e9257f8`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## 性能结论要带条件 可靠基准应固定：输入尺寸、编译选项、线程数、热身、采样次数、硬件频率。 线程数远超 4 核会增加调度开销；SIMD ）
- `2169377819801124` → `62d5f70441e05882`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## 4×4 并行追踪 1. 把图像分成四块，标出每个线程写区。 2. 用 4 个 RGB 像素追踪 load → max → store。）
- `2169377819801124` → `f0655a4058bd0444`（projects/Linux视觉感知项目/3 系统架构/3.2 四大核心模块/3.2.3 LIME 算法 NEON + OpenMP 加速版 → ## 加速自测 1. 循环重排解决什么瓶颈？ 2. 为什么步长常设为 4？ 3. NEON 与 OpenMP 一句话区别？ 4. 哪些循环不）
- `420b925ea74e313d` → `0d0a3c96abc5768c`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 04 LIME 加速：缓存、SIMD 与多核 平台没有合适 GPU 通用计算路径，热点必须在 ARM CPU 上优化。）
- `9edf7eae047ea2a1` → `48ebdab95636ab45`，标签：主入口（# 05 Unet + NCNN：像素级分割链 痛点：车道线需要像素级位置和边界，而不只是“是否存在”。 → projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H）
- `48ebdab95636ab45` → `6307334a256391b1`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## 心智模型：画家 Unet 给每个像素涂类别： - 编码器提取语义 - 解码器恢复空间分辨率 - skip connection 把浅层）
- `48ebdab95636ab45` → `1f11a173ba4150b8`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## 模型与入口 `Unet_NCNN/src/unet.cpp` 的逻辑集中在 `main()`： - 加载 `.ncnn.param/.）
- `48ebdab95636ab45` → `251752ddbd4a7522`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## 保持几何：先补方形 比较宽高，在短边两侧 `copyMakeBorder()` 补黑边，再 resize 到 `720×720`。 直）
- `48ebdab95636ab45` → `8b6c11807ebf5f9d`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## HWC → CHW OpenCV `CV_32FC3` 是 HWC 交错布局；模型输入按通道连续。 映射： `dst[k*H*W + ）
- `48ebdab95636ab45` → `13314dd7418e3b9b`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## NCNN 推理 - `ncnn::Mat` reshape 为 `720×720×3` - `create_extractor()` ）
- `48ebdab95636ab45` → `c8fe1beb87ad9db4`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## Argmax 与去 Padding 对输出 `mask.c` 个类别逐像素取最大通道索引，写入灰度 mask；落在 left/righ）
- `48ebdab95636ab45` → `4f672b9344292038`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## 轻量化取舍 项目用深度可分离卷积等手段压缩端侧成本：把空间卷积和通道混合拆开。 资料记录：权重约 **124 MB → 24 MB**）
- `48ebdab95636ab45` → `7b013b27676504de`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## 源码审计地标 `卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp` 关注： - 输入为空时缺少检查 - `ne）
- `48ebdab95636ab45` → `ea252944fabd53d0`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## 手写追踪 输入 `1280×720×3 HWC`： 1. 计算上下 padding 使其变方形 2. resize 到 720×720）
- `48ebdab95636ab45` → `34c0518347fd4e71`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.2 Unet 语义分割（NCNN）/5.2.2 NCNN 模型部署：H → ## Unet 自测 1. encoder / decoder / skip 各自解决什么？ 2. 为什么先 padding 再 resiz）
- `420b925ea74e313d` → `9edf7eae047ea2a1`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 05 Unet + NCNN：像素级分割链 痛点：车道线需要像素级位置和边界，而不只是“是否存在”。）
- `00611f4a63ba7f2f` → `bf86ecb851165008`，标签：主入口（# 06 LSTR + ONNX Runtime：参数化车道链 痛点：Unet 整图分割在开发板上较慢，需要更短的参数化检测路线。 → projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2）
- `bf86ecb851165008` → `c8c782080cdcbc26`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 心智模型：数学家 LSTR 不输出整张语义 mask，而是输出： - 候选车道是否有效 - 有效车道的曲线参数 程序再把参数采样为离散）
- `bf86ecb851165008` → `055a7ad8eb3fc818`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 构造函数 `LSTR::LSTR()`： 1. 加载 `lstr_360x640.onnx` 2. 获取输入/输出节点名和形状 3. ）
- `bf86ecb851165008` → `311f92a9dccf18e8`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## `normalize_()` resize 后逐通道遍历，按 CHW 写入 `input_image_`： `(pix/255 - m）
- `bf86ecb851165008` → `23a9c0ed4fd4f144`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 双输入机制 - image tensor：`[1,3,H,W]`，归一化图像 - mask tensor：`[1,1,H,W]`，当前）
- `bf86ecb851165008` → `1f33e7ee0852e11d`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 推理与两类输出 `ort_session->Run()` 后： - `pred_logits`：各候选的类别/有效性 - `pred_）
- `bf86ecb851165008` → `676d81d1da26a497`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 曲线恢复 对 50 个 `log_space[k]` 采样： - y 在曲线有效范围内插值 - x 由 8 个曲线参数组合计算 - 再）
- `bf86ecb851165008` → `44635153ae0e41f9`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 可视化语义 源码寻找指定左右车道候选，把两组点拼成多边形，`fillConvexPoly()` 填绿色，再 `addWeighted(）
- `bf86ecb851165008` → `b2409f2c428c8925`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 项目资料记录值 优化后 LSTR： - 单图约 **0.182 s** - 权重约 **12 MB** - 准确率约 **90.7%*）
- `bf86ecb851165008` → `9cbf13687a8e77d8`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## 源码审计地标 `卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp` 关注： - `fopen/fread` 缺少失败检）
- `bf86ecb851165008` → `650ac492e95fa9b1`（projects/Linux视觉感知项目/5 车道线检测模型部署/5.1 LSTR 参数化车道线检测（ONNX Runtime）/5.1.2 → ## LSTR 自测 1. 为什么已经有 Unet 还要 LSTR？ 2. 两个输入、两个输出分别是什么？ 3. `log_space.bi）
- `420b925ea74e313d` → `00611f4a63ba7f2f`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 06 LSTR + ONNX Runtime：参数化车道链 痛点：Unet 整图分割在开发板上较慢，需要更短的参数化检测路线。）
- `99f8c8b116e44c64` → `9c5887936e69c0f8`，标签：主入口（# 07 构建、源码审计与破坏测试 目标：不只会背理想架构，还能指出真实实现边界和故障位置。 → projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md）
- `9c5887936e69c0f8` → `97163e2156c4e192`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 四个构建单元 - Qt：qmake `.pro` 工程 - LIME：CMake + OpenCV + OpenMP/NEON - U）
- `9c5887936e69c0f8` → `1a3bca638d5a065e`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 最小复现顺序 1. 单图跑原始 LIME 2. 对同图跑优化版并比对输出 3. 单图跑 Unet 4. 单图跑 LSTR 5. 验证 ）
- `9c5887936e69c0f8` → `69c03e3ae39f3e08`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 路径耦合 Qt 源码硬编码 `/home/kylin/桌面/project_v1.0/...`；LSTR/Unet 也依赖相对模型路径）
- `9c5887936e69c0f8` → `9441baeeaa86c721`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## Qt 破坏测试 - 推理放 UI 线程 → 卡顿 - `waitKey(10000)` → 同步等待 - 无限范围轮询结果文件 → 长）
- `9c5887936e69c0f8` → `0f73689ceadc5dce`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## LIME 源码风险 原始 `lime.cpp` 可见重复的 `derivative()` 定义，`solveT()` 旁还有 `//b）
- `9c5887936e69c0f8` → `5715f848eba46657`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 模型部署风险 - 图像读取失败未检查 - 模型/预计算文件读取失败 - HWC/CHW 静默错位 - padding 未正确移除 - ）
- `9c5887936e69c0f8` → `6e5137d5da89f890`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 基准与正确性 性能优化必须同时验证： - 输出与基线误差 - 多尺寸、非 4 倍数宽度 - 单/多线程一致性 - 重复采样与统计量 -）
- `9c5887936e69c0f8` → `f4d255fa41c179c5`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 故障定位链 症状 → 模块边界 → 输入/输出文件 → 进程退出码/标准输出 → 图像尺寸与类型 → tensor shape/lay）
- `9c5887936e69c0f8` → `590542a344b2ace0`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 故障演练 场景：Qt 能播放视频，但结果区为空。 依次检查：抽帧目录 → QProcess 命令/工作目录 → 模型和 `log_sp）
- `9c5887936e69c0f8` → `8ed2dded8dd7fe7b`（projects/Linux视觉感知项目/1 先看这里/1.2 主动回忆与破坏测试手册.md → ## 审计自测 1. 当前 QProcess 方案为什么仍可能卡 UI？ 2. 哪些硬编码路径会阻碍部署？ 3. LIME 源码中有哪些明确）
- `420b925ea74e313d` → `99f8c8b116e44c64`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 07 构建、源码审计与破坏测试 目标：不只会背理想架构，还能指出真实实现边界和故障位置。）
- `8f50ffa63e1e3b7e` → `1a29d40ef8282d92`，标签：主入口（# 08 面试表达、闭卷重建与设计取舍 掌握标准：能从痛点讲到代码，再主动指出边界与改进。 → projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md）
- `1a29d40ef8282d92` → `deac99ccb0df67db`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 两分钟回答骨架 1. 场景与平台：ARM Linux 校园配送车 2. 主链：Qt → LIME → Unet/LSTR → 显示/监）
- `1a29d40ef8282d92` → `366c0b77e1c149fa`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## LIME 面试必答 - 为什么增强在检测前？ - `T_hat` 和 `T` 有何不同？ - `T/G/Z/u` 如何协作？ - DF）
- `1a29d40ef8282d92` → `1f64a1748cef260a`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 优化面试必答 - 循环重排与缓存局部性 - `j += 4` 与 SIMD 宽度 - NEON vs OpenMP - 为什么二者可以）
- `1a29d40ef8282d92` → `ae681917d895d1cd`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 模型面试必答 - Unet：像素 mask；LSTR：有效性 + 曲线参数 - NCNN 与 ONNX Runtime 各自承担什么 ）
- `1a29d40ef8282d92` → `292a7f51dca2f831`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 设计取舍 - Unet：覆盖更完整，但端侧较慢 - LSTR：快且小，但复杂多车道泛化边界要说明 - 文件 IPC：简单可观察，但 I）
- `1a29d40ef8282d92` → `201c181561a73f50`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 数字记忆卡（资料值） - LIME：1.6305 → 1.031 → 0.314 s，约 5.19× - Unet：17.386 → ）
- `1a29d40ef8282d92` → `0f6e338186b241a2`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 四条闭卷知识链 1. **系统链**：按钮 → 帧 → 增强 → 检测 → 显示 2. **LIME链**：T_hat → ADMM ）
- `1a29d40ef8282d92` → `f0d5791575ae5a60`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 费曼检验模板 对任意模块闭卷回答： 1. 它解决什么痛点？ 2. 最关键变量/函数/设计是什么？ 3. 哪个边界条件最危险？ 4. 去）
- `1a29d40ef8282d92` → `a6b74fc694bd6340`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 追问题 - 为什么不用 GPU？ - 为什么 LIME 不能只用 Gamma？ - OpenMP 线程越多越好吗？ - LSTR 绿色）
- `1a29d40ef8282d92` → `12297ed1f578bc5b`（projects/Linux视觉感知项目/8 学习路线与面试准备/8.2 高频面试知识点/8.2.1 项目全局高频面试问答.md → ## 最终通过标准 - 2 分钟讲项目，5 分钟讲难点 - 能从症状定位到源码文件和函数 - 能手写两条模型预/后处理链 - 能解释性能数字）
- `420b925ea74e313d` → `8f50ffa63e1e3b7e`，标签：主分支（# Linux 视觉感知处理系统 · 完整复习地图 **主链：Qt 调度 → 帧输入 → LIME 增强 → Unet / LSTR → 结 → # 08 面试表达、闭卷重建与设计取舍 掌握标准：能从痛点讲到代码，再主动指出边界与改进。）
- `44c347c1ca79915d` → `9d52705e1427a8ac`，标签：控制层（## 一条主链 `Qt按钮` → 摄像头/视频帧 → 文件帧交换 → `LIME` 增强 → `Unet 或 LSTR` → 后处理 → Q → ## Qt 的职责 Qt 是**控制面**：接收按钮、组织摄像头/视频、启动外部程序、呈现结果、刷新监控。 算法数据面由 LIME 与模型完）
- `44c347c1ca79915d` → `ba372e3d2645b0f0`，标签：低照度输入（## 一条主链 `Qt按钮` → 摄像头/视频帧 → 文件帧交换 → `LIME` 增强 → `Unet 或 LSTR` → 后处理 → Q → ## 心智模型：图像眼镜 `T` 是每个空间位置的“镜片强度”。暗处 `T` 较小，`channel / T` 提升更多；亮处提升较少。 同）
- `f00ccf113fa4b3b2` → `235db57f3c228218`，标签：热点加速（## 完整函数链 `enhance(src)` → `_init_IllumMap()` → `getMax()` → `optIllumM → ## 四层优化 1. 循环重排：顺应按行连续存储 2. 循环展开：`j += 4`，减少控制开销 3. NEON：单核一次处理 4 个 fl）
- `aa2153a0fa90d843` → `6307334a256391b1`，标签：分割路线（## 两条模型路线 - Unet：像素级语义分割 → `H×W mask` - LSTR：候选有效性 + 曲线参数 - 前者像“画家”，后者 → ## 心智模型：画家 Unet 给每个像素涂类别： - 编码器提取语义 - 解码器恢复空间分辨率 - skip connection 把浅层）
- `aa2153a0fa90d843` → `c8c782080cdcbc26`，标签：参数化路线（## 两条模型路线 - Unet：像素级语义分割 → `H×W mask` - LSTR：候选有效性 + 曲线参数 - 前者像“画家”，后者 → ## 心智模型：数学家 LSTR 不输出整张语义 mask，而是输出： - 候选车道是否有效 - 有效车道的曲线参数 程序再把参数采样为离散）
- `3f3685c633b3fc49` → `d15efd75140838fb`，标签：文件交换（## QProcess 调度 构造函数创建 `process2/process3` 并启动 Bash： - process2：进入 LSTR → ## 文件系统 IPC 当前实现把抽帧、推理结果写入固定目录，再由 Qt 读取。 **优点**：直观、模块解耦、易调试。 **代价**：磁盘）
- `ae2ed8951e9257f8` → `6e5137d5da89f890`，标签：验证正确性（## 性能结论要带条件 可靠基准应固定：输入尺寸、编译选项、线程数、热身、采样次数、硬件频率。 线程数远超 4 核会增加调度开销；SIMD  → ## 基准与正确性 性能优化必须同时验证： - 输出与基线误差 - 多尺寸、非 4 倍数宽度 - 单/多线程一致性 - 重复采样与统计量 -）
- `7b013b27676504de` → `5715f848eba46657`，标签：代码审计（## 源码审计地标 `卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp` 关注： - 输入为空时缺少检查 - `ne → ## 模型部署风险 - 图像读取失败未检查 - 模型/预计算文件读取失败 - HWC/CHW 静默错位 - padding 未正确移除 - ）
- `9cbf13687a8e77d8` → `5715f848eba46657`，标签：代码审计（## 源码审计地标 `卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp` 关注： - `fopen/fread` 缺少失败检 → ## 模型部署风险 - 图像读取失败未检查 - 模型/预计算文件读取失败 - HWC/CHW 静默错位 - padding 未正确移除 - ）
- `8ed2dded8dd7fe7b` → `deac99ccb0df67db`，标签：形成可信表达（## 审计自测 1. 当前 QProcess 方案为什么仍可能卡 UI？ 2. 哪些硬编码路径会阻碍部署？ 3. LIME 源码中有哪些明确 → ## 两分钟回答骨架 1. 场景与平台：ARM Linux 校园配送车 2. 主链：Qt → LIME → Unet/LSTR → 显示/监）
- `34c0518347fd4e71` → `ae681917d895d1cd`，标签：模型对比（## Unet 自测 1. encoder / decoder / skip 各自解决什么？ 2. 为什么先 padding 再 resiz → ## 模型面试必答 - Unet：像素 mask；LSTR：有效性 + 曲线参数 - NCNN 与 ONNX Runtime 各自承担什么 ）
- `650ac492e95fa9b1` → `ae681917d895d1cd`，标签：模型对比（## LSTR 自测 1. 为什么已经有 Unet 还要 LSTR？ 2. 两个输入、两个输出分别是什么？ 3. `log_space.bi → ## 模型面试必答 - Unet：像素 mask；LSTR：有效性 + 曲线参数 - NCNN 与 ONNX Runtime 各自承担什么 ）

## RTOS项目复习-思维导图.canvas

- 原始路径：`archive/思维导图/RTOS项目复习-思维导图.canvas`
- 节点：105；边：100
- JSON：有效；节点 ID 唯一：True；边引用有效：True

### 节点摘要

1. `dbe9b0ef424575b4` (group)：01 全局地图
2. `d628387da9241c01` (group)：02 裸机驱动
3. `044e3fac6d5a1226` (group)：03 PID 闭环
4. `183eadcdd405c7e8` (group)：05 模式与算法
5. `38f64daf9a2b26be` (group)：06 IAP 与可靠性
6. `22eaf80bf6370982` (group)：07 调试与复现
7. `dae2b93eb27c7322` (group)：04 FreeRTOS 与任务
8. `d8ece43bfd6ebddd` (group)：08 面试与扩展
9. `c0af8a4762a2eb46` (file)：projects/RTOS项目/RTOS项目复习文档.md
10. `71ebd79c708027ce` (text)：## 五类高频题 1. 项目架构与任务通信 2. 外设驱动与控制算法 3. FreeRTOS内核机制 4. C语言与内存基础 5. 中断、可靠性与固件升级 [[RTOS高频面试题|完整题库]]
11. `19dfdd31b73616d4` (text)：## 推荐回答模板 1. **痛点/场景**：项目为什么需要它 2. **机制**：核心原理是什么 3. **实现**：对应任务、函数、外设 4. **权衡**：为什么不用另一方案 5. **风险**：边界与改进方向 避免只背定义或把规划功能说成已实现。
12. `bd4912bae118d237` (text)：# 面试速查与扩展 回答顺序：项目场景 → 设计选择 → 源码证据 → 风险与改进。
13. `975d427c7dd14cb3` (text)：## 源码证据映射 架构：\`USER/main.c\` 任务/同步：\`APP_TASK/app_tasks.c\` 电机/PID：\`BSP/MOTOR\` \`BSP/PID\` 传感器：\`BSP/DHT11\` \`BSP/MQ2\` 升级：\`BSP/DMA\` \`CRC32\` \`STMFLASH\` \`IAP\`
14. `7f551da1448b0106` (text)：## 扩展方向 - WiFi：通信任务、协议与状态同步 - OTA：下载、签名校验、A/B与回滚 - 低功耗：任务阻塞、Tickless、外设时钟管理 [[projects/RTOS项目/7 项目实战与面试准备/7.1 项目扩展方向：WiFi、OTA、低功耗优化|扩展方向]]
15. `d0a26bec427a131c` (text)：## 复习使用法 - **3分钟**：只走八个分组标题和粗体结论 - **15分钟**：沿四条知识链复述 - **深入**：点击主文档预览和 Wiki 链接 - **面试前**：随机抽题，必须指出源码位置与实现边界
16. `2cc05dc65258ae0b` (text)：## 中断约束 NVIC 分组4；源码注释说明可调用 RTOS API 的外设中断配置为 DMA=4、TIM4=5、TIM2=6。 使用 FromISR API，并遵守 \`configMAX_SYSCALL_INTERRUPT_PRIORITY\` 约束。 [[3.3 中断优先级配置与临界区保护|中断优先级]]
17. `516360faf286b417` (file)：projects/RTOS项目/RTOS项目复习文档.md
18. `e699aceda60aa947` (text)：# FreeRTOS 与应用层任务 任务、状态、同步、中断、调度五条线一起看。
19. `572b4109d787d193` (text)：## 常驻任务（源码确认） - P6 \`SpeedCalcTask\`：中断唤醒测速 - P5 \`MotorControlTask\`：模式/PID/电机 - P4 \`KeyScanTask\`：10ms按键 - P3 \`SensorTask\` / \`WindSpeedTask\` - P2 \`AntiBackflowTask\` - P1 \`UIDisplayTask\` \`StartTask\` 创建完成后自删除。
20. `d9d1d9f6345abe00` (text)：## 启动与创建顺序 \`System_Init\` 先创建互斥量和二值信号量；\`StartTask\` 再创建业务任务，最后初始化 TIM4。 **原因**：若 TIM4 提前中断，信号量尚未创建，可能触发 HardFault。 [[3.2 任务创建、调度与优先级设计|任务创建与优先级]]
21. `6d203067d9cbe5c8` (text)：## 颜色图例 🔵 架构/流程 🟢 驱动/源码 🟠 控制算法 🟡 模式/业务 🔴 风险/IAP 🟣 RTOS/面试
22. `fb2cbce6c82d8238` (text)：# 裸机驱动逐个掌握 按“硬件原理 → 初始化 → API → 易错点”复习。
23. `fd2678564e74985e` (file)：projects/RTOS项目/RTOS项目复习文档.md
24. `7a6a2181b86c469f` (text)：## ⚠ 断电恢复边界 当前源码是 **Boot + 单APP**，并未实现 A/B 双镜像、原子切换或断点续传。升级中断电可能破坏 APP，但 Boot 区仍可作为重新下载入口。 面试中的 A/B 回滚属于可扩展可靠性方案，不应描述成现有功能。
25. `c84bc4419d0f179a` (text)：## 源码确认 \`BSP/DMA/dma.c\`：DMA接收长度 \`BSP/CRC32/crc32.c\`：校验 \`BSP/STMFLASH/stmflash.c\`：Flash写入 \`BSP/IAP/iap.c\`：APP跳转 \`APP_TASK/app_tasks.c\`：IAP任务/ISR
26. `3df198ca58290e7d` (text)：## ⚠ 当前实现状态 源码 \`SYSTEM/sys/sys.h\` 中： \`#define ifopen 0\` 因此 DMA 接收、IAP 信号量和 IAP 任务默认不参与运行；这是条件编译候选功能。
27. `4491859d6606e66d` (text)：## 升级主链 PC端 APP.bin 追加 CRC32 → USART1 + DMA 接收 → ISR释放 IAP 信号量 → 校验长度/CRC → 擦写 APP Flash → 设置 MSP 和复位向量 → 跳转 APP。
28. `02c2176ca69725e7` (text)：## 固件数据格式 \`[APP 正文][4字节 CRC32，小端]\` STM32 对正文重新计算 CRC32，再与末尾校验值比较；失败不得写入/跳转。 [[5.4 CRC32校验：数据完整性验证机制|CRC32机制]]
29. `b93054566723ea36` (text)：## Flash / RAM 关键点 Boot 与 APP 使用不同 Flash 地址；接收缓冲区位于固定 RAM 区域。跳转前校验 APP 栈顶地址，再设置 MSP 与复位入口。 [[5.3 固件升级（IAP）：Boot + 单APP分区与串口DMA传输|IAP地址与传输]]
30. `58ae0cc0ae7aa29c` (text)：## TIM2 编码器测速 定时器编码器模式读取正交脉冲；TIM4 每 1ms 唤醒测速任务，约 50ms 形成一次速度样本。 [[4.1.2 编码器测速原理与定时器编码器模式|编码器测速]]
31. `9ee6aa711949eeb7` (text)：## 源码入口 \`BSP/KEY\` \`BSP/BEEP\` \`BSP/DHT11\` \`BSP/MQ2\` \`BSP/LCD\` \`BSP/SPI\` \`BSP/MOTOR\` 复习函数：初始化、读取/扫描、控制输出、异常返回。
32. `405bffde91472c70` (text)：## LCD + SPI SPI 时序负责传输，LCD 驱动负责命令/数据，\`UIDisplayTask\` 周期刷新业务状态。 [[4.3.2 LCD 显示驱动与UI设计|LCD 与 UI]]
33. `f4bbb1a0951a8ed8` (text)：## TIM1 PWM + H桥 TIM1 互补 PWM + 死区 → H桥上下管安全换向 → 有刷电机调速。 [[4.1.1 直流有刷电机驱动：H桥电路与PWM互补输出|H桥与互补PWM]]
34. `416c193b8844a455` (text)：# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]]
35. `6b6d8bf59cbb5365` (text)：## DHT11 / MQ2 + ADC - DHT11：单总线时序 + 40bit 数据 + 校验 - MQ2：ADC1_CH4 采样后换算气体浓度 [[4.2.1 DHT11 温湿度传感器：单总线协议驱动|DHT11]] · [[4.2.2 MQ2 气体传感器：ADC采集与数据处理|MQ2+ADC]]
36. `9670a351d9002af0` (text)：## GPIO / 按键 / 蜂鸣器 - GPIO 输入上拉与输出控制 - 按键状态机：消抖、短按、长按 - 蜂鸣器通过通用 GPIO 封装 [[4.3.1 按键状态机：消抖、短按与长按检测|按键状态机]] · [[4.3.3 蜂鸣器控制与音频提示|蜂鸣器]]
37. `4faf0057edd6257d` (text)：## 信息优先级 **主线**：RTOS项目复习文档 **补充**：项目 Wiki + 开发者参考文档 **事实校验**：\`/Desktop/Rtos项目\` 当前源码
38. `cdab9f8f9a8f94bc` (text)：## Cooking Event 不是读取单一传感器瞬时值，而是基于融合结果、阈值和持续计数判断烹饪事件，降低噪声误触发。 关键状态：\`cookingEventActive\`、\`cookingEventCounter\`。
39. `0180f77ac4e162c3` (text)：## 防回流滞回 气体浓度超过高阈值启动；下降到低阈值以下才停止。高低双阈值避免临界点反复抖动。 关键状态：\`antiBackflowActive\`、\`gasThreshold\`。
40. `531bc33d0c69db60` (file)：assets/rtos/three-layer-architecture.svg
41. `ea5099f618039bc5` (text)：## 源码确认 \`USER/main.c\`：初始化与启动调度器 \`APP_TASK/app_tasks.c/.h\`：状态、任务、模式、中断 \`BSP/*\`：驱动与控制算法 **当前基线**：7 个常驻业务任务 + 1 个条件编译 IAP 任务。
42. `22dab9d71b516ad8` (text)：## 一条完整业务链 传感器/按键 → 采集任务 → \`g_systemState\` → 风速/模式判断 → \`MotorControlTask\` → PID/PWM → 电机 → 编码器反馈 UI 与蜂鸣器旁路读取状态，提供反馈。
43. `1e8832c3c8bbad9e` (text)：## 源码入口 \`APP_TASK/app_tasks.c\`：模式、任务、状态机 \`BSP/WIND/wind_speed.c\`：融合算法 \`BSP/KEY/key.c\`：输入事件 \`BSP/MOTOR\` + \`BSP/PID\`：执行闭环
44. `f9b573cfa3f7848e` (text)：## 自动模式三段状态机 \`Startup → Cooking → DelayOff\` 启动阶段建立稳定运行；检测 Cooking Event 后进入烹饪控制；事件消失后延时关闭，避免频繁启停。 [[5.2 自动模式状态机与Cooking Event检测|自动模式与Cooking Event]]
45. `d901861c641d8ff9` (text)：## 多传感器融合 DHT11温湿度 + MQ2气体浓度 → 归一化/加权 → \`windSpeedPWM\` → 自动模式目标输出。 [[4.2.3 多传感器融合风速算法|风速融合算法]]
46. `0a3a984ff7d1d949` (file)：assets/rtos/system-state-data-flow.svg
47. `952472d9eb7625a9` (file)：assets/rtos/motor-module-flow.svg
48. `f398554f51b2d2ea` (text)：## 四种工作模式 \`待机 → 手动 → 自动 → 防回流 → 待机\` - 待机：电机停止 - 手动：低/高档目标转速 + PID - 自动：传感器融合与三段状态机 - 防回流：气体浓度滞回控制 [[5.1 工作模式：待机、手动、自动、防回流|四种模式]]
49. `48d89aab316fa480` (file)：assets/rtos/main-startup-flow.svg
50. `4201acaa530067cd` (text)：## 目录职责 \`CORE\` 启动与CMSIS｜\`FreeRTOS\` 内核 \`SYSTEM\` 串口/延时｜\`BSP\` 外设驱动 \`APP_TASK\` 业务任务｜\`USER\` 系统入口 \`OBJ\` 编译产物（不修改） [[2.2 目录结构与模块职责划分|深入：目录结构]]
51. `6545d805d53c8b1b` (file)：assets/rtos/system-data-flow.svg
52. `52912d1631dfe95f` (text)：## 系统数据中枢 传感器/按键/编码器 → \`g_systemState\` → 模式与控制任务 → PWM/LCD/蜂鸣器 \`g_dataMutex\` 保护共享状态，但当前源码仍存在少量未加锁访问。 [[2.4 任务间通信：互斥信号量与全局状态管理|深入：任务通信]]
53. `dbb44576f07f5cba` (text)：# 建立项目全局地图 先会讲清目录、分层、启动和数据流。
54. `ca6ba9aed6ca7ecf` (file)：projects/RTOS项目/RTOS项目复习文档.md
55. `ea1a2828c6f04a6e` (text)：## 用户输入 - KEY1 短按：循环切换模式 - KEY2 短按：低/高档切换 - KEY2 长按：电机开关 状态修改进入 \`g_systemState\`，\`MotorControlTask\` 根据快照执行。
56. `cb83750fc31010c7` (text)：# 工作模式与业务算法 从输入事件追踪到共享状态，再追踪到执行器。
57. `40080b1eda6cafc4` (file)：projects/RTOS项目/RTOS项目复习文档.md
58. `0eb581c1c6ee259f` (text)：## 三层架构 - **BSP**：硬件驱动与算法封装 - **FreeRTOS**：调度、同步、中断衔接 - **APP_TASK**：模式、任务、业务逻辑 [[2.1 三层架构：驱动层、RTOS中间层、应用层|深入：三层架构]]
59. `4896be0d39766bdf` (text)：## 启动主链 \`Reset → SystemInit → main\` \`Hardware_Init → System_Init\` \`StartTask_Create → Scheduler\` [[2.3 系统启动流程与初始化顺序|深入：启动与初始化]]
60. `826499f56550eb74` (text)：## 时间关系 TIM4 中断周期约 **1ms**，每次释放二值信号量；\`get_speed(..., 50)\` 约每 **50ms** 形成原始转速样本。 注意：信号量是唤醒机制，不等于每 1ms 完成一次完整 PID。
61. `b67ff782fd551a03` (text)：## 易错点 - PID 输出范围必须映射到 PWM 范围 - 积分项需要限幅/复位，避免长时间饱和 - 编码器方向、脉冲数和采样周期决定 RPM 换算 - 调参顺序：P → I → 必要时 D
62. `7e93edc31bd6e47c` (text)：## 闭环主链 \`targetRPM\` → PID → PWM占空比 → TIM1/H桥 → 电机 → TIM2编码器 → \`actualRPM\` → PID 控制任务：\`MotorControlTask\` 测速任务：\`SpeedCalcTask\`
63. `54d6fefc3ecfadbc` (text)：## 源码确认 \`BSP/PID/pid.c/.h\`：PID 算法 \`BSP/MOTOR/motor.c/.h\`：PWM与测速 \`APP_TASK/app_tasks.c\`：目标值、模式与控制闭环
64. `b3f78b243aa80198` (text)：## 波形检查 - TIM1：频率、互补输出、死区 - TIM2：A/B相位和计数方向 - DHT11：起始、响应、位宽判决 - USART/DMA：帧长度与传输完成 - SPI：CPOL/CPHA与片选时序
65. `f026fa5f9f70a6d5` (text)：## HardFault 读取 HFSR/CFSR/BFAR/MMFAR，保存异常栈中的 PC/LR；重点排查空句柄、栈溢出、非法地址和中断优先级。 本项目典型风险：TIM4 在信号量创建前触发。 [[projects/RTOS项目/6 调试与优化/6.2 HardFault异常诊断与堆栈溢出检测|HardFault诊断]]
66. `23aa8457938e5ede` (text)：## RTOS 运行监控 检查任务状态、阻塞点、优先级、运行时间与栈高水位；确认高优先级任务会阻塞/延时，防止低优先级任务饥饿。 [[projects/RTOS项目/6 调试与优化/6.3 FreeRTOS任务状态监控与性能分析|任务监控]]
67. `4febfa83ac96186d` (file)：assets/rtos/pid-closed-loop-flow.svg
68. `53f7230440f36038` (file)：assets/rtos/encoder-pid-loop_animated.svg
69. `2e6c3e7a676058b6` (file)：projects/RTOS项目/RTOS项目复习文档.md
70. `98f88b583ad0d4bf` (text)：## 开发环境补充 [[1.3.1 Keil MDK 工程配置与编译|Keil MDK]] [[1.3.2 J-Link 调试器配置与烧录|J-Link/SWD]] [[1.3.3 串口调试工具使用|串口调试]] 它们不是面试主线，但独立复现项目时不可缺失。
71. `02831780cae67f64` (text)：## 最终自测 - 能画出启动链、任务图、数据流和闭环 - 能从症状定位到 BSP/任务/内核层 - 能解释并验证中断优先级与同步 - 能独立重写核心驱动和任务框架 - 能指出当前实现边界，而不是只背理想方案
72. `1e3d77c222472784` (text)：## 快速入口 [[1.2 快速入门：从零搭建开发环境并运行项目|从零运行项目]] [[projects/RTOS项目/7 项目实战与面试准备/7.3 代码规范与可维护性设计|代码规范与维护]] \`OBJ/\` 为构建产物，不纳入手工修改范围。
73. `47076d9bbc8880cf` (file)：projects/RTOS项目/RTOS项目复习文档.md
74. `f337a3b632c49f3b` (text)：## 推荐复现顺序 GPIO/按键/蜂鸣器 → DHT11/MQ2 → LCD/SPI → TIM1电机 → TIM2测速 → PID → FreeRTOS任务 → 模式状态机 → IAP/CRC → 故障注入。 每步先单模块测试，再接入共享状态。
75. `a912439374e7f152` (text)：## 内容状态 主复习文档中的调试清单、HardFault、RTOS调试、波形要点与综合复现仍标记为 TODO。 下列内容来自项目补充 Wiki，用作查漏入口。
76. `d6470f880c1f3d35` (text)：# 调试、工具与综合复现 主文档本节为 TODO；此区由补充 Wiki 与源码事实填充。
77. `f92050280f259ffc` (file)：assets/rtos/iap-upgrade-flow.svg
78. `58ee0c2b41e2e2cd` (file)：assets/rtos/flash-ram-layout.svg
79. `a98e0a81ab928f08` (text)：## 外设不工作排查 电源/时钟 → GPIO复用 → 外设参数 → NVIC/DMA → 状态寄存器 → 逻辑分析仪/示波器 → 任务是否真正运行。 [[projects/RTOS项目/6 调试与优化/6.1 嵌入式调试技巧与故障排查方法|故障排查]]
80. `0da4d11ee7c69705` (file)：projects/RTOS项目/RTOS项目复习文档.md
81. `776f8f95c0e37c88` (text)：# PID 闭环调速 把“目标—误差—控制量—反馈”连成一条链。
82. `24ca2b95c7f1334d` (text)：## 参数作用 - **Kp**：快速纠偏，过大易振荡 - **Ki**：消除稳态误差，需防积分饱和 - **Kd**：抑制变化趋势，本项目当前为 0 [[4.1.3 PID闭环调速算法实现与调参|PID实现与调参]]
83. `15a1294f8d464b75` (text)：## 位置式 PID \`error = targetRPM - actualRPM\` \`output = Kp·e + Ki·Σe + Kd·Δe\` 源码参数：\`Kp=14.0, Ki=1.65, Kd=0.0\`，输出限制 \`0~1000\`。
84. `417c7dc886c69e26` (file)：assets/rtos/tim1-hbridge-pwm.svg
85. `49741074bb3c2382` (text)：## 面试复述 1. 为什么必须闭环？ 2. 编码器速度怎样换算？ 3. Kp/Ki/Kd 分别解决什么？ 4. 为什么要限幅和抗积分饱和？ 5. PWM频率、占空比、死区各影响什么？
86. `816906713b32482b` (file)：assets/rtos/mq2-adc-sampling-flow.svg
87. `9490261725be89d6` (text)：# Bootloader / IAP / CRC32 区分“当前 Boot+单APP 实现”和“未来可靠升级方案”。
88. `3156185ef38bfdbf` (file)：assets/rtos/hbridge-circuit.svg
89. `041c8796f37a1e26` (file)：projects/RTOS项目/RTOS项目复习文档.md
90. `aebb7765d0dba6f5` (file)：assets/rtos/dht11-timing.svg
91. `61f2f1a20aee3a74` (file)：assets/rtos/lcd-spi-display-flow.svg
92. `8451f66ee05f9a34` (file)：assets/rtos/iap-power-recovery_animated.svg
93. `0eb7b94927b8660f` (text)：## 面试必答 1. 为什么 DMA 接收？ 2. CRC32 能发现什么，不能保证什么？ 3. 为什么 ISR 只通知任务？ 4. 跳转 APP 前为什么设置 MSP？ 5. 单APP与A/B升级的可靠性差异？
94. `50f255f0f6c0655d` (text)：## 架构与 RTOS 必会 - 为什么使用 FreeRTOS？ - 为什么共享状态 + Mutex，而非全用队列？ - StartTask 为什么存在？ - SVC/SysTick/PendSV 如何协作？ - 优先级反转、任务饥饿、栈溢出如何处理？
95. `a5a2ccf9d0e351f5` (text)：## 驱动与控制必会 - H桥与互补PWM/死区 - 编码器测速与采样周期 - PID三个参数及积分饱和 - DHT11单总线 - SPI四种模式 - ADC采集与传感器融合
96. `b02a1ed905a36886` (text)：## 状态与同步 \`g_systemState\` 保存最新系统快照；\`g_dataMutex\` 提供互斥与优先级继承。 本项目适合“共享最新状态”，因此没有把所有数据拆成消息队列。 [[2.4 任务间通信：互斥信号量与全局状态管理|同步机制]]
97. `1bb9d568f559c2a9` (text)：## ISR → 任务 \`TIM4_IRQHandler\` 清标志 → \`xSemaphoreGiveFromISR\` → 必要时 \`portYIELD_FROM_ISR\` → \`SpeedCalcTask\` 运行。 ISR 只做必要工作，耗时处理下放任务。
98. `b3fa13a842014ceb` (file)：projects/RTOS项目/index.md
99. `e322936f9edf40b6` (text)：## 四条总知识链 1. 启动链：复位 → 调度器 → 任务 2. 控制链：传感器 → 状态 → PID → 电机 3. 实时链：中断 → 同步 → 高优先级任务 4. 升级链：DMA → CRC → Flash → 跳转 能独立讲通四条链，才算真正掌握。
100. `d2efd0ecfa857ad0` (text)：## 中断与升级必会 - Cortex-M3中断响应过程 - 为什么使用 FromISR API - DMA、CRC32、Flash、MSP跳转 - 升级断电怎样恢复 - 当前单APP实现与A/B方案的区别
101. `a902d703da1d9d88` (file)：assets/rtos/state-sharing_animated.svg
102. `8731e4849712f4bb` (file)：assets/rtos/isr-task-handoff_animated.svg
103. `85fc26bd97fe2a6c` (text)：## Cortex-M3 调度三件套 - **SVC**：启动首个任务/系统调用 - **SysTick**：时钟节拍、延时计数 - **PendSV**：最低优先级完成上下文切换 [[3.1 FreeRTOS 移植与配置详解|移植与配置]]
104. `51984954e523f453` (file)：assets/rtos/context-switch_animated.svg
105. `2249c99781f56b09` (text)：## 源码入口 \`APP_TASK/app_tasks.c/.h\` \`FreeRTOS/include/FreeRTOSConfig.h\` \`FreeRTOS/tasks.c\` \`queue.c\` \`FreeRTOS/portable/.../port.c\` 先理解项目调用链，再下钻内核实现。

### 边摘要

- `4faf0057edd6257d` → `416c193b8844a455`，标签：资料汇总（## 信息优先级 **主线**：RTOS项目复习文档 **补充**：项目 Wiki + 开发者参考文档 **事实校验**：`/Desktop → # STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]]）
- `416c193b8844a455` → `6d203067d9cbe5c8`，标签：阅读说明（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → ## 颜色图例 🔵 架构/流程 🟢 驱动/源码 🟠 控制算法 🟡 模式/业务 🔴 风险/IAP 🟣 RTOS/面试）
- `416c193b8844a455` → `dbb44576f07f5cba`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # 建立项目全局地图 先会讲清目录、分层、启动和数据流。）
- `dbb44576f07f5cba` → `ca6ba9aed6ca7ecf`，标签：主文档（# 建立项目全局地图 先会讲清目录、分层、启动和数据流。 → projects/RTOS项目/RTOS项目复习文档.md）
- `ca6ba9aed6ca7ecf` → `0eb581c1c6ee259f`（projects/RTOS项目/RTOS项目复习文档.md → ## 三层架构 - **BSP**：硬件驱动与算法封装 - **FreeRTOS**：调度、同步、中断衔接 - **APP_TASK**：模）
- `ca6ba9aed6ca7ecf` → `4896be0d39766bdf`（projects/RTOS项目/RTOS项目复习文档.md → ## 启动主链 `Reset → SystemInit → main` `Hardware_Init → System_Init` `Sta）
- `ca6ba9aed6ca7ecf` → `52912d1631dfe95f`（projects/RTOS项目/RTOS项目复习文档.md → ## 系统数据中枢 传感器/按键/编码器 → `g_systemState` → 模式与控制任务 → PWM/LCD/蜂鸣器 `g_data）
- `ca6ba9aed6ca7ecf` → `4201acaa530067cd`（projects/RTOS项目/RTOS项目复习文档.md → ## 目录职责 `CORE` 启动与CMSIS｜`FreeRTOS` 内核 `SYSTEM` 串口/延时｜`BSP` 外设驱动 `APP_T）
- `ca6ba9aed6ca7ecf` → `ea5099f618039bc5`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码确认 `USER/main.c`：初始化与启动调度器 `APP_TASK/app_tasks.c/.h`：状态、任务、模式、中断 ）
- `ca6ba9aed6ca7ecf` → `531bc33d0c69db60`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/three-layer-architecture.svg）
- `ca6ba9aed6ca7ecf` → `48d89aab316fa480`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/main-startup-flow.svg）
- `ca6ba9aed6ca7ecf` → `6545d805d53c8b1b`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/system-data-flow.svg）
- `416c193b8844a455` → `fb2cbce6c82d8238`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # 裸机驱动逐个掌握 按“硬件原理 → 初始化 → API → 易错点”复习。）
- `fb2cbce6c82d8238` → `fd2678564e74985e`，标签：主文档（# 裸机驱动逐个掌握 按“硬件原理 → 初始化 → API → 易错点”复习。 → projects/RTOS项目/RTOS项目复习文档.md）
- `fd2678564e74985e` → `9670a351d9002af0`（projects/RTOS项目/RTOS项目复习文档.md → ## GPIO / 按键 / 蜂鸣器 - GPIO 输入上拉与输出控制 - 按键状态机：消抖、短按、长按 - 蜂鸣器通过通用 GPIO 封装）
- `fd2678564e74985e` → `6b6d8bf59cbb5365`（projects/RTOS项目/RTOS项目复习文档.md → ## DHT11 / MQ2 + ADC - DHT11：单总线时序 + 40bit 数据 + 校验 - MQ2：ADC1_CH4 采样后换）
- `fd2678564e74985e` → `405bffde91472c70`（projects/RTOS项目/RTOS项目复习文档.md → ## LCD + SPI SPI 时序负责传输，LCD 驱动负责命令/数据，`UIDisplayTask` 周期刷新业务状态。 [[4.3.）
- `fd2678564e74985e` → `f4bbb1a0951a8ed8`（projects/RTOS项目/RTOS项目复习文档.md → ## TIM1 PWM + H桥 TIM1 互补 PWM + 死区 → H桥上下管安全换向 → 有刷电机调速。 [[4.1.1 直流有刷电机）
- `fd2678564e74985e` → `58ae0cc0ae7aa29c`（projects/RTOS项目/RTOS项目复习文档.md → ## TIM2 编码器测速 定时器编码器模式读取正交脉冲；TIM4 每 1ms 唤醒测速任务，约 50ms 形成一次速度样本。 [[4.1.）
- `fd2678564e74985e` → `9ee6aa711949eeb7`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码入口 `BSP/KEY` `BSP/BEEP` `BSP/DHT11` `BSP/MQ2` `BSP/LCD` `BSP/SPI`）
- `fd2678564e74985e` → `3156185ef38bfdbf`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/hbridge-circuit.svg）
- `fd2678564e74985e` → `aebb7765d0dba6f5`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/dht11-timing.svg）
- `fd2678564e74985e` → `816906713b32482b`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/mq2-adc-sampling-flow.svg）
- `fd2678564e74985e` → `61f2f1a20aee3a74`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/lcd-spi-display-flow.svg）
- `416c193b8844a455` → `776f8f95c0e37c88`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # PID 闭环调速 把“目标—误差—控制量—反馈”连成一条链。）
- `776f8f95c0e37c88` → `0da4d11ee7c69705`，标签：主文档（# PID 闭环调速 把“目标—误差—控制量—反馈”连成一条链。 → projects/RTOS项目/RTOS项目复习文档.md）
- `0da4d11ee7c69705` → `15a1294f8d464b75`（projects/RTOS项目/RTOS项目复习文档.md → ## 位置式 PID `error = targetRPM - actualRPM` `output = Kp·e + Ki·Σe + Kd）
- `0da4d11ee7c69705` → `24ca2b95c7f1334d`（projects/RTOS项目/RTOS项目复习文档.md → ## 参数作用 - **Kp**：快速纠偏，过大易振荡 - **Ki**：消除稳态误差，需防积分饱和 - **Kd**：抑制变化趋势，本项目）
- `0da4d11ee7c69705` → `7e93edc31bd6e47c`（projects/RTOS项目/RTOS项目复习文档.md → ## 闭环主链 `targetRPM` → PID → PWM占空比 → TIM1/H桥 → 电机 → TIM2编码器 → `actualR）
- `0da4d11ee7c69705` → `826499f56550eb74`（projects/RTOS项目/RTOS项目复习文档.md → ## 时间关系 TIM4 中断周期约 **1ms**，每次释放二值信号量；`get_speed(..., 50)` 约每 **50ms** ）
- `0da4d11ee7c69705` → `b67ff782fd551a03`（projects/RTOS项目/RTOS项目复习文档.md → ## 易错点 - PID 输出范围必须映射到 PWM 范围 - 积分项需要限幅/复位，避免长时间饱和 - 编码器方向、脉冲数和采样周期决定 ）
- `0da4d11ee7c69705` → `54d6fefc3ecfadbc`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码确认 `BSP/PID/pid.c/.h`：PID 算法 `BSP/MOTOR/motor.c/.h`：PWM与测速 `APP_T）
- `0da4d11ee7c69705` → `4febfa83ac96186d`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/pid-closed-loop-flow.svg）
- `0da4d11ee7c69705` → `53f7230440f36038`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/encoder-pid-loop_animated.svg）
- `0da4d11ee7c69705` → `417c7dc886c69e26`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/tim1-hbridge-pwm.svg）
- `0da4d11ee7c69705` → `49741074bb3c2382`（projects/RTOS项目/RTOS项目复习文档.md → ## 面试复述 1. 为什么必须闭环？ 2. 编码器速度怎样换算？ 3. Kp/Ki/Kd 分别解决什么？ 4. 为什么要限幅和抗积分饱和？）
- `416c193b8844a455` → `e699aceda60aa947`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # FreeRTOS 与应用层任务 任务、状态、同步、中断、调度五条线一起看。）
- `e699aceda60aa947` → `516360faf286b417`，标签：主文档（# FreeRTOS 与应用层任务 任务、状态、同步、中断、调度五条线一起看。 → projects/RTOS项目/RTOS项目复习文档.md）
- `516360faf286b417` → `572b4109d787d193`（projects/RTOS项目/RTOS项目复习文档.md → ## 常驻任务（源码确认） - P6 `SpeedCalcTask`：中断唤醒测速 - P5 `MotorControlTask`：模式/P）
- `516360faf286b417` → `d9d1d9f6345abe00`（projects/RTOS项目/RTOS项目复习文档.md → ## 启动与创建顺序 `System_Init` 先创建互斥量和二值信号量；`StartTask` 再创建业务任务，最后初始化 TIM4。 ）
- `516360faf286b417` → `b02a1ed905a36886`（projects/RTOS项目/RTOS项目复习文档.md → ## 状态与同步 `g_systemState` 保存最新系统快照；`g_dataMutex` 提供互斥与优先级继承。 本项目适合“共享最新）
- `516360faf286b417` → `1bb9d568f559c2a9`（projects/RTOS项目/RTOS项目复习文档.md → ## ISR → 任务 `TIM4_IRQHandler` 清标志 → `xSemaphoreGiveFromISR` → 必要时 `por）
- `516360faf286b417` → `85fc26bd97fe2a6c`（projects/RTOS项目/RTOS项目复习文档.md → ## Cortex-M3 调度三件套 - **SVC**：启动首个任务/系统调用 - **SysTick**：时钟节拍、延时计数 - **P）
- `516360faf286b417` → `2cc05dc65258ae0b`（projects/RTOS项目/RTOS项目复习文档.md → ## 中断约束 NVIC 分组4；源码注释说明可调用 RTOS API 的外设中断配置为 DMA=4、TIM4=5、TIM2=6。 使用 F）
- `516360faf286b417` → `a902d703da1d9d88`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/state-sharing_animated.svg）
- `516360faf286b417` → `8731e4849712f4bb`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/isr-task-handoff_animated.svg）
- `516360faf286b417` → `51984954e523f453`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/context-switch_animated.svg）
- `516360faf286b417` → `2249c99781f56b09`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码入口 `APP_TASK/app_tasks.c/.h` `FreeRTOS/include/FreeRTOSConfig.h` ）
- `416c193b8844a455` → `cb83750fc31010c7`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # 工作模式与业务算法 从输入事件追踪到共享状态，再追踪到执行器。）
- `cb83750fc31010c7` → `40080b1eda6cafc4`，标签：主文档（# 工作模式与业务算法 从输入事件追踪到共享状态，再追踪到执行器。 → projects/RTOS项目/RTOS项目复习文档.md）
- `40080b1eda6cafc4` → `f398554f51b2d2ea`（projects/RTOS项目/RTOS项目复习文档.md → ## 四种工作模式 `待机 → 手动 → 自动 → 防回流 → 待机` - 待机：电机停止 - 手动：低/高档目标转速 + PID - 自动）
- `40080b1eda6cafc4` → `ea1a2828c6f04a6e`（projects/RTOS项目/RTOS项目复习文档.md → ## 用户输入 - KEY1 短按：循环切换模式 - KEY2 短按：低/高档切换 - KEY2 长按：电机开关 状态修改进入 `g_sys）
- `40080b1eda6cafc4` → `f9b573cfa3f7848e`（projects/RTOS项目/RTOS项目复习文档.md → ## 自动模式三段状态机 `Startup → Cooking → DelayOff` 启动阶段建立稳定运行；检测 Cooking Even）
- `40080b1eda6cafc4` → `d901861c641d8ff9`（projects/RTOS项目/RTOS项目复习文档.md → ## 多传感器融合 DHT11温湿度 + MQ2气体浓度 → 归一化/加权 → `windSpeedPWM` → 自动模式目标输出。 [[4）
- `40080b1eda6cafc4` → `cdab9f8f9a8f94bc`（projects/RTOS项目/RTOS项目复习文档.md → ## Cooking Event 不是读取单一传感器瞬时值，而是基于融合结果、阈值和持续计数判断烹饪事件，降低噪声误触发。 关键状态：`co）
- `40080b1eda6cafc4` → `0180f77ac4e162c3`（projects/RTOS项目/RTOS项目复习文档.md → ## 防回流滞回 气体浓度超过高阈值启动；下降到低阈值以下才停止。高低双阈值避免临界点反复抖动。 关键状态：`antiBackflowAct）
- `40080b1eda6cafc4` → `22dab9d71b516ad8`（projects/RTOS项目/RTOS项目复习文档.md → ## 一条完整业务链 传感器/按键 → 采集任务 → `g_systemState` → 风速/模式判断 → `MotorControlTa）
- `40080b1eda6cafc4` → `1e8832c3c8bbad9e`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码入口 `APP_TASK/app_tasks.c`：模式、任务、状态机 `BSP/WIND/wind_speed.c`：融合算法 ）
- `40080b1eda6cafc4` → `0a3a984ff7d1d949`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/system-state-data-flow.svg）
- `40080b1eda6cafc4` → `952472d9eb7625a9`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/motor-module-flow.svg）
- `416c193b8844a455` → `9490261725be89d6`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # Bootloader / IAP / CRC32 区分“当前 Boot+单APP 实现”和“未来可靠升级方案”。）
- `9490261725be89d6` → `041c8796f37a1e26`，标签：主文档（# Bootloader / IAP / CRC32 区分“当前 Boot+单APP 实现”和“未来可靠升级方案”。 → projects/RTOS项目/RTOS项目复习文档.md）
- `041c8796f37a1e26` → `3df198ca58290e7d`（projects/RTOS项目/RTOS项目复习文档.md → ## ⚠ 当前实现状态 源码 `SYSTEM/sys/sys.h` 中： `#define ifopen 0` 因此 DMA 接收、IAP ）
- `041c8796f37a1e26` → `4491859d6606e66d`（projects/RTOS项目/RTOS项目复习文档.md → ## 升级主链 PC端 APP.bin 追加 CRC32 → USART1 + DMA 接收 → ISR释放 IAP 信号量 → 校验长度/）
- `041c8796f37a1e26` → `02c2176ca69725e7`（projects/RTOS项目/RTOS项目复习文档.md → ## 固件数据格式 `[APP 正文][4字节 CRC32，小端]` STM32 对正文重新计算 CRC32，再与末尾校验值比较；失败不得写）
- `041c8796f37a1e26` → `b93054566723ea36`（projects/RTOS项目/RTOS项目复习文档.md → ## Flash / RAM 关键点 Boot 与 APP 使用不同 Flash 地址；接收缓冲区位于固定 RAM 区域。跳转前校验 APP）
- `041c8796f37a1e26` → `7a6a2181b86c469f`（projects/RTOS项目/RTOS项目复习文档.md → ## ⚠ 断电恢复边界 当前源码是 **Boot + 单APP**，并未实现 A/B 双镜像、原子切换或断点续传。升级中断电可能破坏 APP）
- `041c8796f37a1e26` → `c84bc4419d0f179a`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码确认 `BSP/DMA/dma.c`：DMA接收长度 `BSP/CRC32/crc32.c`：校验 `BSP/STMFLASH/s）
- `041c8796f37a1e26` → `f92050280f259ffc`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/iap-upgrade-flow.svg）
- `041c8796f37a1e26` → `58ee0c2b41e2e2cd`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/flash-ram-layout.svg）
- `041c8796f37a1e26` → `8451f66ee05f9a34`（projects/RTOS项目/RTOS项目复习文档.md → assets/rtos/iap-power-recovery_animated.svg）
- `041c8796f37a1e26` → `0eb7b94927b8660f`（projects/RTOS项目/RTOS项目复习文档.md → ## 面试必答 1. 为什么 DMA 接收？ 2. CRC32 能发现什么，不能保证什么？ 3. 为什么 ISR 只通知任务？ 4. 跳转 ）
- `416c193b8844a455` → `d6470f880c1f3d35`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # 调试、工具与综合复现 主文档本节为 TODO；此区由补充 Wiki 与源码事实填充。）
- `d6470f880c1f3d35` → `47076d9bbc8880cf`，标签：主文档（# 调试、工具与综合复现 主文档本节为 TODO；此区由补充 Wiki 与源码事实填充。 → projects/RTOS项目/RTOS项目复习文档.md）
- `47076d9bbc8880cf` → `a912439374e7f152`（projects/RTOS项目/RTOS项目复习文档.md → ## 内容状态 主复习文档中的调试清单、HardFault、RTOS调试、波形要点与综合复现仍标记为 TODO。 下列内容来自项目补充 Wi）
- `47076d9bbc8880cf` → `a98e0a81ab928f08`（projects/RTOS项目/RTOS项目复习文档.md → ## 外设不工作排查 电源/时钟 → GPIO复用 → 外设参数 → NVIC/DMA → 状态寄存器 → 逻辑分析仪/示波器 → 任务是否）
- `47076d9bbc8880cf` → `f026fa5f9f70a6d5`（projects/RTOS项目/RTOS项目复习文档.md → ## HardFault 读取 HFSR/CFSR/BFAR/MMFAR，保存异常栈中的 PC/LR；重点排查空句柄、栈溢出、非法地址和中断）
- `47076d9bbc8880cf` → `23aa8457938e5ede`（projects/RTOS项目/RTOS项目复习文档.md → ## RTOS 运行监控 检查任务状态、阻塞点、优先级、运行时间与栈高水位；确认高优先级任务会阻塞/延时，防止低优先级任务饥饿。 [[pro）
- `47076d9bbc8880cf` → `b3f78b243aa80198`（projects/RTOS项目/RTOS项目复习文档.md → ## 波形检查 - TIM1：频率、互补输出、死区 - TIM2：A/B相位和计数方向 - DHT11：起始、响应、位宽判决 - USART）
- `47076d9bbc8880cf` → `f337a3b632c49f3b`（projects/RTOS项目/RTOS项目复习文档.md → ## 推荐复现顺序 GPIO/按键/蜂鸣器 → DHT11/MQ2 → LCD/SPI → TIM1电机 → TIM2测速 → PID → ）
- `47076d9bbc8880cf` → `98f88b583ad0d4bf`（projects/RTOS项目/RTOS项目复习文档.md → ## 开发环境补充 [[1.3.1 Keil MDK 工程配置与编译|Keil MDK]] [[1.3.2 J-Link 调试器配置与烧录|）
- `47076d9bbc8880cf` → `02831780cae67f64`（projects/RTOS项目/RTOS项目复习文档.md → ## 最终自测 - 能画出启动链、任务图、数据流和闭环 - 能从症状定位到 BSP/任务/内核层 - 能解释并验证中断优先级与同步 - 能独）
- `47076d9bbc8880cf` → `2e6c3e7a676058b6`（projects/RTOS项目/RTOS项目复习文档.md → projects/RTOS项目/RTOS项目复习文档.md）
- `47076d9bbc8880cf` → `1e3d77c222472784`（projects/RTOS项目/RTOS项目复习文档.md → ## 快速入口 [[1.2 快速入门：从零搭建开发环境并运行项目|从零运行项目]] [[projects/RTOS项目/7 项目实战与面试准）
- `416c193b8844a455` → `bd4912bae118d237`，标签：主分支（# STM32 + FreeRTOS 油烟机项目 ## 全面复习总图 [[RTOS项目复习文档|打开主复习文档]] → # 面试速查与扩展 回答顺序：项目场景 → 设计选择 → 源码证据 → 风险与改进。）
- `bd4912bae118d237` → `c0af8a4762a2eb46`，标签：主文档（# 面试速查与扩展 回答顺序：项目场景 → 设计选择 → 源码证据 → 风险与改进。 → projects/RTOS项目/RTOS项目复习文档.md）
- `c0af8a4762a2eb46` → `71ebd79c708027ce`（projects/RTOS项目/RTOS项目复习文档.md → ## 五类高频题 1. 项目架构与任务通信 2. 外设驱动与控制算法 3. FreeRTOS内核机制 4. C语言与内存基础 5. 中断、可）
- `c0af8a4762a2eb46` → `19dfdd31b73616d4`（projects/RTOS项目/RTOS项目复习文档.md → ## 推荐回答模板 1. **痛点/场景**：项目为什么需要它 2. **机制**：核心原理是什么 3. **实现**：对应任务、函数、外设）
- `c0af8a4762a2eb46` → `50f255f0f6c0655d`（projects/RTOS项目/RTOS项目复习文档.md → ## 架构与 RTOS 必会 - 为什么使用 FreeRTOS？ - 为什么共享状态 + Mutex，而非全用队列？ - StartTask）
- `c0af8a4762a2eb46` → `a5a2ccf9d0e351f5`（projects/RTOS项目/RTOS项目复习文档.md → ## 驱动与控制必会 - H桥与互补PWM/死区 - 编码器测速与采样周期 - PID三个参数及积分饱和 - DHT11单总线 - SPI四）
- `c0af8a4762a2eb46` → `d2efd0ecfa857ad0`（projects/RTOS项目/RTOS项目复习文档.md → ## 中断与升级必会 - Cortex-M3中断响应过程 - 为什么使用 FromISR API - DMA、CRC32、Flash、MSP）
- `c0af8a4762a2eb46` → `975d427c7dd14cb3`（projects/RTOS项目/RTOS项目复习文档.md → ## 源码证据映射 架构：`USER/main.c` 任务/同步：`APP_TASK/app_tasks.c` 电机/PID：`BSP/MO）
- `c0af8a4762a2eb46` → `7f551da1448b0106`（projects/RTOS项目/RTOS项目复习文档.md → ## 扩展方向 - WiFi：通信任务、协议与状态同步 - OTA：下载、签名校验、A/B与回滚 - 低功耗：任务阻塞、Tickless、外）
- `c0af8a4762a2eb46` → `d0a26bec427a131c`（projects/RTOS项目/RTOS项目复习文档.md → ## 复习使用法 - **3分钟**：只走八个分组标题和粗体结论 - **15分钟**：沿四条知识链复述 - **深入**：点击主文档预览和）
- `c0af8a4762a2eb46` → `b3fa13a842014ceb`（projects/RTOS项目/RTOS项目复习文档.md → projects/RTOS项目/index.md）
- `c0af8a4762a2eb46` → `e322936f9edf40b6`（projects/RTOS项目/RTOS项目复习文档.md → ## 四条总知识链 1. 启动链：复位 → 调度器 → 任务 2. 控制链：传感器 → 状态 → PID → 电机 3. 实时链：中断 → ）
- `6b6d8bf59cbb5365` → `d901861c641d8ff9`，标签：采集输入（## DHT11 / MQ2 + ADC - DHT11：单总线时序 + 40bit 数据 + 校验 - MQ2：ADC1_CH4 采样后换 → ## 多传感器融合 DHT11温湿度 + MQ2气体浓度 → 归一化/加权 → `windSpeedPWM` → 自动模式目标输出。 [[4）
- `58ae0cc0ae7aa29c` → `7e93edc31bd6e47c`，标签：速度反馈（## TIM2 编码器测速 定时器编码器模式读取正交脉冲；TIM4 每 1ms 唤醒测速任务，约 50ms 形成一次速度样本。 [[4.1. → ## 闭环主链 `targetRPM` → PID → PWM占空比 → TIM1/H桥 → 电机 → TIM2编码器 → `actualR）
- `1bb9d568f559c2a9` → `826499f56550eb74`，标签：信号量唤醒（## ISR → 任务 `TIM4_IRQHandler` 清标志 → `xSemaphoreGiveFromISR` → 必要时 `por → ## 时间关系 TIM4 中断周期约 **1ms**，每次释放二值信号量；`get_speed(..., 50)` 约每 **50ms** ）
- `7a6a2181b86c469f` → `02831780cae67f64`，标签：可靠性验证（## ⚠ 断电恢复边界 当前源码是 **Boot + 单APP**，并未实现 A/B 双镜像、原子切换或断点续传。升级中断电可能破坏 APP → ## 最终自测 - 能画出启动链、任务图、数据流和闭环 - 能从症状定位到 BSP/任务/内核层 - 能解释并验证中断优先级与同步 - 能独）
