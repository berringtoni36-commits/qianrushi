# linux-memory-ebpf 全量未回链与源码事实覆盖复核

审计日期：2026-08-14。原始来源 projects/Linux物理内存检测项目/ 保持只读；本文件只在本域记录覆盖结果，不修改全局清单、脚本或规范 Skill。

## 结论与统计

本轮输入是当前 source-inventory-current.tsv（全库 7,146 条数据行）以及本域 INDEX.md、source-map.md、DIGEST.md、verified.md 和真实源码。这里的“精确回链”要求 canonical 文档中有文件/源码符号或可定位的文件级锚点；目录、章节通配符、basename 或“项目包含某模块”的描述只算 domain-scoped。

| 口径 | 数量 | 解释 |
|---|---:|---|
| 当前域清单 | 47 | 30 个知识文档、7 个代码/配置、10 个证据/构建/派生条目 |
| 精确回链 | 2 | 主链的少数文件级/符号级锚点；不等于 2 个文件已经运行通过 |
| domain-scoped | 43 | 已纳入本域边界或主题/目录范围，但没有逐文件精确回链 |
| indexed-only | 2 | 只在索引/登记或外围材料中出现，未形成 canonical 文件级回链 |
| 当前真实源码 | 4 个核心代码文件 | exfrag_user.py、exfrag.py、extfraginfo.c、fraginfo.c |
| 运行时验证 | 0 次目标 Linux/BCC 实测 | 现有 runtime-validation-matrix 只记录静态阻断和补证顺序 |

indexed-only 队列应从 source-register.md 与当前清单逐条复核；本轮最明确的外围项是项目根索引/PDF 类入口和运行日志类材料。PDF、SVG、debug.log、主机修复脚本以及 Swift 辅助程序都不能因为“被登记”而升级为 eBPF 运行证据。完整 47 条路径仍以 source-register.md 和 source-inventory-current.tsv 为准，不在这里复制一份容易漂移的重复清单。

## 可复用的内容

- 伙伴系统诊断应按 node/zone/order 联合观察 free pages、free blocks suitable 和碎片指数；总空闲量不等于高阶连续页可用。
- 运行链应拆成 Python import、BCC 编译、程序加载、探针 attach、事件触发、Map 更新、用户态读取和 TUI 展示，不能把其中一步的存在写成端到端成功。
- tracepoint 与 kprobe 的观测时机不同；Map 的累计字段、最近事件字段和展示排序必须分开定义。
- 主动回忆和源码事实审计适合复用为学习方法，但不把面试图示、SVG 或文档中的设计意图当成内核输出。

## 文档 claim 与当前源码事实

### 1. 入口和路径

- projects/Linux物理内存检测项目/源码/exfrag_user.py:6 导入模块名 extfrag；真实文件名是 exfrag.py。
- exfrag.py:18-20 使用 ./bpf/extfraginfo.c 和 ./bpf/fraginfo.c；当前两个 C 文件在源码目录根下。除非改变工作目录/布局或修正路径，不能把当前仓库直接运行描述成已闭合。
- 文档可以证明“设计为 Python/BCC 加载内核程序并读取 Map”，不能证明当前 import、BCC 版本和相对路径在目标机可用。

### 2. 节流状态并未由源码闭合

- extfraginfo.c:20-30 用变化的 current_time 查询 last_time_map，且该路径没有稳定 key 的 update；fraginfo.c:91-105 也用变化时间查询，fraginfo.c:166 虽 update 了同一类变化 key，仍不能形成稳定的单槽节流状态。
- 因此“设计了 delay_map/last_time_map”可以作为源码事实；“按 interval 正确限频”仍是待验证或需要重构后的 claim。

### 3. counts_map 不是无丢失事件流

- extfraginfo.c:16-18 定义 PID 聚合的 counts_map；38-55 采用 lookup → count++ → update。
- count 是累计字段，而 pfn、alloc_order、fallback_order、pcomm 在后续事件中覆盖为最近值。它可以支持“按 PID 聚合的观察原型”，不能直接支持逐事件日志、精确多 CPU 计数或无丢失率。
- 当前代码没有独立事件 ID、时间序列或 per-CPU 合并证据；并发 RMW、Map 更新失败和采样丢失均未在目标内核压力下测量。

### 4. 快速路径观测单位有限

- fraginfo.c:6 将 MAX_ORDER 硬编码为 10，存在内核版本和布局依赖。
- fraginfo.c:91 是 get_page_from_freelist 入口 kprobe；没有返回点、请求 ID 或最终成功/失败结果。它能证明入口样本被设计出来，不能把样本直接解释成一次完整上层分配请求或最终分配失败。

## 不能升格的证据

以下表述在补齐目标环境日志前只能保留为设计意图、静态源码事实或待验证项：BCC/内核兼容；探针 attach 成功；Map 实际更新和刷新；节流准确率；多 CPU 计数准确率；高阶分配最终成功/失败；采样开销；“实时监控”以及任何无丢失、精确计数结论。

本域 INDEX/source-map/verified 中的 25 条 skill-evidence 登记是来源用途标签，不等同于本轮 2 个精确文件级回链锚点；这是“登记覆盖”和“逐文件精确覆盖”的差异，不能用全局报告的粗粒度状态抹平。

## 可复现扫描口径

~~~sh
awk -F '\t' 'NR > 1 && $1 == "linux-memory-ebpf" {n++} END {print n}' distillation/source-inventory-current.tsv
rg --files 'projects/Linux物理内存检测项目' | sort
rg -n 'from extfrag|BPF\(src_file|last_time_map|counts_map|kprobe__get_page_from_freelist|MAX_ORDER' \
  'projects/Linux物理内存检测项目/源码'
~~~

分类时只读取 INDEX.md、source-map.md、DIGEST.md、verified.md 的当前内容：literal 文件/符号/行号锚点计入精确回链，目录/章节/通配符计入 domain-scoped，其余当前清单路径计入 indexed-only；source-register.md 只用于回查路径和哈希，不作为精确证据。运行验证没有在本次审计中执行。

## 剩余风险与最小补证

优先补一套目标 Linux/BCC 矩阵：修正 import/path 后做 BCC 编译与 attach，确认两个探针在目标内核的参数/字段兼容；分别用单 CPU、并发多 CPU 和已知 workload 对照 counts_map；增加返回点或独立请求关联以区分入口样本与最终结果；最后记录用户态刷新和退出行为。未完成这些步骤前，本报告的静态结论不应写成运行成功。
