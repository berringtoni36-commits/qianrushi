# Round 3 候选三重验证与升格记录

处理日期：2026-08-14

本文件只记录 Round 3 的候选验证，不把候选数量当作规范 Skill 数量。原始项目、源码、附件和工作台只读；规范源仍以 `distillation/skills/` 为准。

## 验证口径

- **V1 跨来源**：至少两个独立文档/源码位置共同支撑；同一合并稿与分章稿不重复计数。
- **V2 预测力**：能从方法推出资料未直接写出的故障症状、误读或最小验证实验。
- **V3 独特性**：相对现有 Skill 有独立、稳定、可执行的问题边界，而不是换名的概念解释。
- 代码候选区分 D（设计意图）、S（当前源码行为）和 U（目标环境待验证）。

## 进入 Skill 构造的候选

### m01 — 快速路径入口探针的观测单位闭环

- **V1：通过。** `projects/Linux物理内存检测项目/文档/3 深入理解/3.2 内存管理核心概念/3.2.3 内存分配快速路径监控.md` 与 `文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md` 讨论入口样本、重复调用和观测边界；`项目完整代码流程详解.md` 与 `源码/fraginfo.c` 提供真实函数和 Map 写入回链。
- **V2：通过。** 可推导“入口触发次数明显高于上层请求”“入口快照被误写成最终分配成功/失败”“需要返回点或请求级关联才能计算成功率”等新问题，并给出最小对照实验。
- **V3：通过。** 独立边界是观测单位与时机合同；不重复 eBPF 加载链、伙伴系统指标含义或通用源码事实审计。
- **当前事实边界。** `fraginfo.c` 只有 `kprobe__get_page_from_freelist` 入口程序；没有返回点、请求 ID 或成对进出状态。目标内核可探测性、BCC 参数映射、重试链和成功/失败比例仍为 U。
- **拟建 Skill。** `linux-memory-fastpath-observation-contract`。
- **状态。** 已完成 RIA++ 构造、来源核验和 6/6 静态压力测试，并安全同步到 ZCode；目标内核实验仍待执行。

### m02 — 聚合 Map 的并发更新与精确计数合同

- **V1：通过。** `文档/3 深入理解/3.4 数据采集与处理/3.4.1 外碎片化事件采集.md`、`文档/4 深度学习/4.2 主动学习与推演/4.2.3 核心难点精讲.md` 和 `项目完整代码流程详解.md` 讨论 PID 聚合与 Map 选择；`源码/extfraginfo.c`、`源码/exfrag.py` 可逐符号回链当前更新与展示行为。
- **V2：通过。** 可推导多 CPU 高并发下 RMW 低估、排行榜偏差、累计 count 与最近 PFN/order 混读、PID 复用，以及“近似排行榜/精确计数/完整事件流”应采用不同合同；可设计独立事件计数对照实验。
- **V3：通过。** 独立边界是 Map 聚合的精度、并发更新和输出语义；不重复 pipeline 的数据流、buddy 指标或通用源码审计。
- **当前事实边界。** 当前 `extfraginfo.c` 使用 PID key 和 `lookup → data->count += 1 → update`，没有原子加、per-CPU 聚合、时间戳或 ring buffer；是否丢增量必须在目标内核/多 CPU workload 上验证。
- **拟建 Skill。** `linux-ebpf-map-counter-contract`。
- **状态。** 已完成 RIA++ 构造、来源核验和 6/6 静态压力测试，并安全同步到 ZCode；多 CPU 计数实验仍待执行。

### v10 — Mat→QImage/QPixmap 显示边界合同

- **V1：通过。** `projects/linux视觉感知项目/文档/02 Qt 上位机/2.5 Mat与QImage格式互转.md` 提供格式、stride 和生命周期规则；`源码/上位机程序/Lane_Detection/mainwindow.cpp`、`mainwindow.h` 和 `.ui` 提供摄像头/结果 Mat 到 `cameraView`/`resultView` 的实际适配与消费路径。
- **V2：通过。** 可从格式分支、`src.step`、非连续 Mat 和 Mat 复用推导红蓝互换、灰度全黑、行错位、悬空缓冲和未覆盖分支等资料未逐项回答的新症状，并设计 1×1/2×2、padding、释放后复用的最小测试。
- **V3：通过。** 独立边界是跨 OpenCV/Qt 的字节布局、stride 和所有权合同；不替代 Tensor 契约、Qt 事件调度、文件 IPC 或端到端性能 provenance。
- **当前事实边界。** 源码 `CV_8UC1` 分支调用 `memcmp` 且丢弃返回值，文档已指出应为复制语义；`CV_8UC3`/`CV_8UC4` 的交换和拷贝路径可定位，但 `rgbSwapped()` 的完全脱离缓冲语义及目标版本行为仍为 U。
- **拟建 Skill。** `linux-vision-qt-image-buffer-adapter-audit`。
- **状态。** 已完成 RIA++ 构造、来源核验和 6/6 静态压力测试，并安全同步到 ZCode；目标 Qt/OpenCV 运行实验仍待执行。

### v11 — Qt 视觉上位机资源遥测指标合同

- **V1：通过。** `projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md` 给出采样、差分、单位和滑窗设计；`sysinfolinuximpl.cpp/.h`、`mainwindow.cpp/.h` 和 `.pro` 可回链采集、定时器、曲线和 Qt Charts 消费。
- **V2：通过。** 可推导首个 CPU 样本误当区间值、`free -m` 列位变化、解析失败静默变 0、同步等待阻塞 UI、51 点窗口被误当实时 FPS 等新问题，并设计原始输出/单调时间/交叉工具对照。
- **V3：通过。** 独立边界是累计计数、采样间隔、字段/单位、错误状态和滑动窗口展示合同；不替代 Qt 事件循环、视觉 benchmark provenance、模型 Tensor 或文件 IPC Skill。
- **当前事实边界。** 源码使用 `QProcess` 执行 `cat /proc/stat`、`free -m` 并固定下标解析，首次基线、退出码、字段名和目标发行版输出仍需核对；曲线只证明有界历史窗口，不证明端到端性能。
- **拟建 Skill。** `linux-vision-resource-telemetry-contract-audit`。
- **状态。** 已完成 RIA++ 构造、来源核验和 6/6 静态压力测试，并安全同步到 ZCode；目标发行版遥测实验仍待执行。

### e12 — 嵌入式 UDP 应用可靠性合同审计

- **V1：通过。** `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.18 如何基于 UDP 协议实现可靠传输？.md` 提供 Packet Number、Stream/Offset、ACK、重传和窗口语义；`projects/嵌入式八股/嵌入式高频八股150题/04 通信协议-网络（71-90题）.md` 提供 MCU 自定义帧的序号、CRC、超时、丢弃和重复包去重状态机。
- **V2：通过。** 可推导高频传感器通道中“样本已过期但重传到达”“重复命令二次执行”“一个通道丢包阻塞其它通道”“重传队列无界”等新问题，并以序号/截止时间/幂等键/有界窗口和故障注入验证。
- **V3：通过。** 独立边界是 UDP 端点建立之后的应用可靠性、消息生命周期和过期语义；不替代普通 endpoint、广播/组播、Socket framing 或 TCP 内核路径。
- **当前事实边界。** 当前 vault 没有对应的用户 UDP 业务实现、抓包或丢包测试；QUIC/自定义帧资料只支持审计方法，不能宣称存在生产级协议实现。
- **拟建 Skill。** `embedded-udp-reliability-contract-audit`。
- **状态。** 已进入候选记录，但不升格为规范 Skill：当前没有用户 UDP 业务实现、抓包或故障注入证据；保留为通用方法候选。

### e13 — 嵌入式跨表示层数值合同与阈值审计

- **V1：通过。** `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.7 为什么 0.1 + 0.2 不等于 0.3？.md` 支持表示、精度和舍入边界；`projects/嵌入式八股/3. 杂七杂八/14. PLC 原理 + 数据类型，工控入门天花板知识点.md` 支持原始位模式、类型转换、中间溢出、量程缩放、误差/滞回和控制判断。
- **V2：通过。** 可推导 ADC/4–20mA 边界报警不触发、最终变量改成 REAL 仍错误、原始位模式/端序解释错位和浮点精确相等导致状态抖动等新问题；执行链为 bits→类型→中间值→单位缩放→滤波/舍入→阈值/滞回。
- **V3：通过。** 独立边界是数值表示、单位、转换时机、误差预算和阈值语义的跨层合同；不替代 C 结构体布局、STM32 时钟/ADC 采样、RTOS 传感器物理采集或 PID 调参。
- **当前事实边界。** PLC 转换/舍入语义依厂商和运行时；当前来源没有配套目标平台数值源码、ADC 原始日志或标定实验，不能推广为某个 STM32 工程已验证行为。
- **拟建 Skill。** `embedded-numeric-contract-audit`。
- **状态。** 已完成 RIA++ 构造、来源核验和 6/6 静态压力测试，并安全同步到 ZCode；没有目标平台数值日志或标定实测。

### v14 — Mat→QImage/QPixmap 显示边界合同

- **V1：通过。** `projects/linux视觉感知项目/文档/02 Qt 上位机/2.5 Mat与QImage格式互转.md` 与 `源码/上位机程序/Lane_Detection/mainwindow.cpp`/`.h`/`.ui` 共同支持格式、stride、Mat 到 QLabel 的真实适配路径。
- **V2：通过。** 可推导灰度全黑、BGR/RGB 互换、非连续 Mat 行错位、Mat 复用后的花屏等症状，并用已知像素、padding 和生命周期测试定位。
- **V3：通过。** 独立边界是 OpenCV/Qt 图像缓冲的字节布局、stride 和所有权；不替代 Tensor、Qt 调度、文件 IPC 或端到端性能。
- **当前事实边界。** `CV_8UC1` 分支调用 `memcmp` 且丢弃返回值；`CV_8UC3`/`CV_8UC4` 交换/拷贝路径可从源码定位，但目标 Qt/OpenCV 版本的运行时所有权仍待验证。
- **拟建 Skill。** `linux-vision-qt-image-buffer-adapter-audit`。
- **状态。** 与 v10 重复，合并到 `linux-vision-qt-image-buffer-adapter-audit`；不单独创建第二个规范 Skill。

### v15 — Qt 视觉上位机资源遥测指标合同

- **V1：通过。** `projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md` 与 `sysinfolinuximpl.cpp/.h`、`mainwindow.cpp/.h`、`.pro` 共同支持采样、差分、单位、定时器和 51 点滑窗证据链。
- **V2：通过。** 可推导首样本基线错误、`free -m` 固定列位变化、解析失败默默变 0、同步命令阻塞 UI 和滑窗被误当实时 FPS 等问题。
- **V3：通过。** 独立边界是累计量/采样间隔/字段单位/错误状态/历史窗口合同；不替代 Qt 事件循环、视觉 benchmark provenance、Tensor 或文件 IPC。
- **当前事实边界。** 源码以 `QProcess` 执行 `cat /proc/stat`、`free -m` 并固定下标解析；目标发行版输出、退出码、首样本策略和采样时延仍待验证。
- **拟建 Skill。** `linux-vision-resource-telemetry-contract-audit`。
- **状态。** 与 v11 重复，合并到 `linux-vision-resource-telemetry-contract-audit`；不单独创建第二个规范 Skill。

## 降级或拒绝

| 近候选 | 判定 | 处理 |
|---|---|---|
| 固定 key / 每 CPU Map 的采样节流状态机 | V1/V2 通过，V3 不通过 | 已由现有 `linux-memory-source-audit` 与上一轮候选覆盖；保留为反例，不重复建 Skill。 |
| tracepoint 与 kprobe 的稳定性比较 | V1/V2 通过，V3 不通过 | 属于现有 pipeline 的探针选择边界，不能独立成新的项目方法。 |
| fallback_order、migratetype、ownership 语义 | V1/V2 通过，V3 不通过 | 并入 buddy 碎片诊断和现有源码审计；当前源码证据不足以拆出独立合同。 |
| “BPF Map 是内核—用户态通信” | V2/V3 不通过 | 只是已有 pipeline 的定义性复述，降级为术语。 |
| curses 刷新频率与采样频率分离 | V3 不通过 | 已由现有 pipeline 的两条时间线边界覆盖，作为测试/反例保留。 |

## 仍需补充的验证

- 目标内核上确认 `get_page_from_freelist` 的探测可用性、参数映射和重试语义。
- 用固定 workload 对照上层请求数、入口数、返回成功/失败和独立 tracepoint 事件数。
- 在多 CPU/多线程 fallback workload 下比较普通 Hash RMW、原子/per-CPU 聚合和 ring buffer 的计数误差、丢失策略和开销。
- 上述实验未完成前，两个 Skill 只能输出通用诊断方法，不能宣称用户项目或目标内核已实测。
