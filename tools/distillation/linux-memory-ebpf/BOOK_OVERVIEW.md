# Linux 物理内存碎片检测项目 — 整体理解

## 基本信息

- 类型：BCC/eBPF 源码、Python 用户态、Linux 内存管理文档和面试复习材料。
- 目标：观察伙伴系统高阶页分配相关事件与 node/zone/order 状态，并在用户态展示。
- 来源：`projects/Linux物理内存检测项目/` 和 `archive/思维导图/Linux物理内存碎片检测-复习版.md`。

## 结构

1. Python/BCC 启动与 eBPF 加载。
2. tracepoint/kprobe 采集事件和状态。
3. BPF Map 传输 node/zone/order/PID 数据。
4. 伙伴系统、外部碎片和指数计算。
5. 用户态解析、TUI、节流、源码审计和面试表达。

## 关键术语

eBPF、BCC、tracepoint、kprobe、BPF Map、node、zone、order、buddy allocator、external fragmentation、`extfrag_index`、`unusable_free_index`。

## 核心命题

- 事件和状态是互补证据，不能互相替代。
- 高阶连续页不足不等于总空闲页不足。
- 指标必须固定 node/zone/order 并结合趋势解释。
- BPF helper 解决受控读取，不解决内核版本语义兼容。
- 源码审计必须区分设计意图、文档声明和实际执行路径。

## 批判与边界

- `last_time_map` 使用变化时间作为 key 的节流逻辑存在明显实现风险。
- eBPF 读取内核结构字段依赖目标内核布局和 BCC/Clang 环境。
- 项目是教学型监控原型，不能直接宣称替代生产级内核工具。

## 应用潜力

通过验证的 Skills：eBPF 运行链、伙伴系统碎片诊断、源码事实审计、快速路径入口观测合同和 eBPF Map 计数合同。
