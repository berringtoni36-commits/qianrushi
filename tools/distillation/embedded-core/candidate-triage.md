# Embedded-core 候选分流审计

更新时间：2026-08-14；本轮只做小范围登记。

## keep-for-review

| 候选 | 保留理由 | 进入下一阶段的条件 |
|---|---|---|
| `concurrency-deadlock-diagnosis` | 有独立教程和 RTOS 语境，能形成现象到证据的排障顺序 | 区分 Linux pthread 与 FreeRTOS 同步原语，并补代码符号 |
| `tcp-byte-stream-framing` | 可预测粘包、半包、部分读写等新问题 | 找到仓库中真实收发循环或明确标注为通用方法论 |
| `tcp-loss-and-flow-control` | 机制和抓包材料可以组合为路径诊断 | 加入抓包字段、socket 队列、应用日志证据 |
| `io-multiplexing-readiness` | LT/ET、非阻塞和负载边界具有决策价值 | 与现有 Socket Skill 去重并设计跨 Skill 诱饵 |
| `linux-memory-reclaim-model` | 资料跨虚拟内存与物理内存，适合解释压力现象 | 并入既有 Skill，确认版本边界而非重复建包 |
| `c-binary-contract-and-lifetime` | 能连接协议、DMA、ABI 和对象生命周期 | 按问题类型拆分，不能成为泛 C/C++ 汇总 |

## term-or-reference

| 候选 | 降级理由 |
|---|---|
| `ebpf-runtime-boundary` | eBPF 基础叙述较通用，且具体 Map/probe/源码审计已有专门 Skill |
| `cpu-cache-coherence-contract` | 当前只有教程级证据，平台/DMA/cache 运行合同尚未闭合 |

## rejected-or-archive

本轮没有删除或否定原始资料。未来若某候选只有单篇转载、没有预测新问题的步骤，写入 `rejected/` 审计记录而不是继续扩张 Skill。

## 结论

本登记不改变现有 56 个规范 Skill 的数量，也不代表任何候选已经通过三重验证。
