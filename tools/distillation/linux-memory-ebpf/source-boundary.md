# Linux 物理内存/eBPF 来源边界与证据层

> 本域把项目主链、运行环境修复记录、外部工具和构建/附件证据分开。当前结论来自静态源码与文档核对；未在目标 Linux 内核/BCC 环境运行时，不宣称兼容性或采样准确率。

## P0 项目主链

| 层级 | 来源 | 作用 |
|---|---|---|
| 用户态入口 | `projects/Linux物理内存检测项目/源码/exfrag_user.py` | 参数、curses、模式选择、刷新和展示。 |
| BCC 桥接 | `projects/Linux物理内存检测项目/源码/exfrag.py` | 加载 C 源、配置 `delay_map`、读取 `zone_map`/`pgdat_map`/`counts_map`。 |
| 状态探针 | `projects/Linux物理内存检测项目/源码/fraginfo.c` | `get_page_from_freelist` kprobe、zone/node 状态、碎片指数。 |
| 事件探针 | `projects/Linux物理内存检测项目/源码/extfraginfo.c` | `mm_page_alloc_extfrag` tracepoint、PID 聚合计数。 |
| 学习/审计文档 | `文档/3 深入理解/`、`文档/4 深度学习/`、`项目完整代码流程详解.md` | 解释、手工追踪、源码事实审计和面试复盘。 |

## P1 设计意图与当前事实

- 文档目标是“内核采集 + Python 展示”的实时碎片监控原型。
- 当前源码中 `exfrag_user.py` 导入模块名、`exfrag.py` 的 `./bpf/` 相对路径和仓库实际布局存在需要先修复/确认的可运行性边界。
- `last_time_map` 以变化的时间戳作为 key；不能仅凭注释宣称节流已经按预期工作。
- `counts_map` 以 PID 聚合并将最近一次 PFN/order 覆盖到累计 count；它不是天然的逐事件日志或精确无丢失计数合同。
- `fraginfo.c` 的入口 kprobe 样本不自动等于一次上层分配请求，也不等于最终成功/失败返回结果。

## P2 环境与外围证据

- `源码/vmware_*_status.txt`、`install-lulu-sleep-monitor.sh`、`patch-chatgpt-lulu-sleep.sh`、`lulu-usage-overlay.swift`：环境/主机辅助记录，不属于项目核心观测链。
- `linux物理内存检测工具：_带目录.pdf`：原始排版证据；当前不替代 Markdown 源码核对。
- `源码/assets/interview-svg/`：面试图示/派生素材，不单独证明实现正确性。
- `debug.log`、缓存或外部工具输出：只作故障历史，不直接升格为项目功能。

## 证据等级

1. 源码符号和实际路径：可证明“当前文件写了什么”。
2. 项目文档/复习稿：可证明设计意图和学习解释。
3. BCC/内核运行日志：若存在，才可证明特定环境的加载/触发/输出。
4. 目标机压力、抓包/事件对照和多 CPU 实验：才可支持采样开销、丢失率和兼容性结论。

## 本轮处理结论

- P0 主链已被 5 个规范 Skill 覆盖：运行链、伙伴系统诊断、源码事实审计、快速路径观测合同、Map 计数合同。
- 未把 Mac/VMware 修复脚本、PDF 或 SVG 机械生成 Skill。
- 后续最有价值的增量是可运行性修复后的最小验证矩阵：import/path、BCC attach、Map 初始值、事件触发、返回结果和用户态刷新；不是再拆 API 定义 Skill。

## 原始资料与派生产物

- 原始路径：`projects/Linux物理内存检测项目/`（只读）。
- 域概览：[`BOOK_OVERVIEW.md`](tools/distillation/linux-memory-ebpf/BOOK_OVERVIEW.md)。
- 结论回链：[`source-map.md`](tools/distillation/linux-memory-ebpf/source-map.md)。
- 文件级登记：[`source-register.md`](tools/distillation/linux-memory-ebpf/source-register.md)。
