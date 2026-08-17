# Linux 内存/eBPF 三重验证结果

| ID | 候选 | V1 | V2 | V3 | 结论 |
|---|---|---|---|---|---|
| e01 | eBPF/BCC 端到端运行链 | 架构文档、源码、用户态 Python | 可定位加载成功但无数据 | 把加载/attach/触发/读取分开 | 通过 |
| e02 | 伙伴系统高阶碎片诊断 | 内存文档、指标文档、源码 | 可解释总空闲页足够但高阶失败 | 固定 node/zone/order 联合判断 | 通过 |
| e03 | 设计意图与源码事实审计 | 审计文档、C/Python 源码、复习图 | 可判断面试表述边界 | 把 claim 与证据链绑定 | 通过 |

| m01 | 快速路径入口探针的观测单位闭环 | 快速路径文档、主动推演文档、流程说明和 `fraginfo.c` 交叉支撑 | 可区分入口调用、上层请求和最终分配结果，推导 retry/返回点/请求关联验证 | 以观测时机和单位为核心，不重复运行链、buddy 指标或一般源码审计 | 通过 |
| m02 | 聚合 Map 并发与计数合同 | 外碎片采集、难点推演、流程说明、`extfraginfo.c` 和 `exfrag.py` 交叉支撑 | 可审计 PID 聚合、RMW 并发、累计/最近字段混合、排行榜与事件流选择 | 将 Map 输出承诺先于 Map 类型选择，独立于端到端 pipeline | 通过 |

## Round 3 canonical 状态

`linux-memory-fastpath-observation-contract` 与 `linux-ebpf-map-counter-contract` 已完成 RIA++、来源元数据、3 正例/2 诱饵/1 边界静态压力测试，并已安全同步到 ZCode。目标内核/BCC、多 CPU workload、返回点和独立事件计数尚未实测。
