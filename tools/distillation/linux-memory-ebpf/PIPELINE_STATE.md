# Linux 物理内存/eBPF 蒸馏状态

- 当前主域 Skill 数量：5。

- [x] 阶段 0：运行链、伙伴系统、探针、Map、指标和源码风险。
- [x] 阶段 1：框架、原则、案例、反例、术语候选池。
- [x] 阶段 1.5：5 个方法通过跨文档、预测力和独特性验证。
- [x] 阶段 2–3：5 个 Skill、INDEX、GLOSSARY、DIGEST、verified 和 source-map。
- [x] 阶段 4：每个 Skill 6 条静态压力测试。
- [x] 阶段 5：规范源已纳入全局 Skill 集合；ZCode 副本状态见 `../CLIENT_INSTALL.md`。

范围：`projects/Linux物理内存检测项目/` 文档、源码和复习版。源码路径、Map key、节流、硬编码和内核兼容性风险必须继续保留。

## Round 3 候选

- [x] `linux-memory-fastpath-observation-contract`：入口探针样本、上层请求和最终分配结果的观测单位边界；已完成 RIA++、来源核验、6/6 静态压力测试并安全同步到 ZCode。
- [x] `linux-ebpf-map-counter-contract`：PID 聚合 Map 的计数精度、RMW 并发、最近字段和事件流合同；已完成 RIA++、来源核验、6/6 静态压力测试并安全同步到 ZCode。
- [ ] 目标内核/BCC、多 CPU workload、返回点/独立事件计数实验：当前环境未执行，不能写成实测结论。
- [x] 可运行性报告已生成：[`runtime-validation-matrix.md`](runtime-validation-matrix.md) / [`runtime-validation-matrix.json`](runtime-validation-matrix.json)。当前 Python 语法通过；`from extfrag import ExtFrag` 与 `./bpf/*.c` 路径为静态阻断，BCC/内核 attach、Map 更新和并发计数仍待目标环境验证。
- [x] 报告生成器已纳入根级流程：`python3 ../scripts/provenance_audit.py --check-only` 可只读检查；不带参数可重生成报告。
