# RTOS 项目蒸馏状态

- 当前主域 Skill 数量：13。

- [x] 阶段 0：项目架构、任务/ISR、控制、升级和事实边界。
- [x] 阶段 1：框架、原则、案例、反例、术语候选池。
- [x] 阶段 1.5：13 个项目方法通过 V1/V2/V3。
- [x] 阶段 2–3：13 个 Skill、INDEX、GLOSSARY、DIGEST、verified 和 source-map。
- [x] 阶段 4：每个 Skill 6 条静态压力测试。
- [x] 阶段 5：规范源已纳入全局 Skill 集合；ZCode 副本状态见 `../CLIENT_INSTALL.md`。

范围：`projects/RTOS项目/` 文档、源码和复习材料；构建产物不作正文来源。新增配置/启动、运行时故障、IAP/CRC/Flash、软件周期机制、LCD/蜂鸣器反馈方法；个人贡献、硬件结果和独立 APP 部署保持事实边界。

## 增量记录（2026-08-14）

- [x] `rtos-build-flash-runtime-provenance`：完成 SKILL.md、agents/openai.yaml、3 正例/2 诱饵/1 边界测试和静态结果。
- [x] 候选 `r10` 已写入 `verified.md` 与 `source-map.md`；INDEX/GLOSSARY/压力矩阵已增量登记。
- [x] 事实边界已记录：当前主工程/MAP 为 `0x08000000`；`0x0800F000` 仅为 IAP 规划；无本次 Build/J-Link 回读/板上串口原始日志，不能宣称 C2-C4 硬件实测。
- 限制：本轮未在当前 macOS 环境运行 Keil 或连接 J-Link；验证结果是 Skill 结构、来源和静态路由通过，不是固件硬件验证。
- 当前轮同步状态：`rtos-build-flash-runtime-provenance` 已进入规范源并安全同步到 ZCode；未覆盖已有目录。
- [x] provenance 报告已生成：[`artifact-provenance.md`](artifact-provenance.md) / [`artifact-provenance.json`](artifact-provenance.json)。当前 C0 工程合同静态通过，C1 为历史构建布局相容；C2 Flash、C3 复位启动、C4 串口/业务运行仍无实测证据。
- [x] 报告生成器已纳入根级流程：`python3 ../scripts/provenance_audit.py --check-only` 可只读检查；不带参数可从当前源码/配置重生成本域报告。
- [x] 增量源码审计：补充 `g_systemState`/`g_dataMutex` 的读写者边界；确认 `MotorControlTask`、`UIDisplayTask`、`AntiBackflowTask` 和 `System_GetState()` 存在绕过统一锁覆盖的路径。该结论已回写任务/ISR Skill、来源映射、反例和测试；未新增重叠 Skill。
- 限制：本轮仍是静态源码审计，没有在目标板执行竞态注入、UI 一致性测试或调度时序测量。

## 未回链主题候选（2026-08-14 11:28）

- [x] 登记 6 条 target/ISR/共享状态/变体主题卡：见 [`unlinked-topic-cards.md`](tools/distillation/rtos-project/unlinked-topic-cards.md)。
- [x] 建立候选分流和覆盖改进队列；不新增规范 Skill：见 [`candidate-triage.md`](tools/distillation/rtos-project/candidate-triage.md)。
- [ ] 仍需 Keil/板卡/串口或精确工程符号证据，不能把历史产物或文档描述写成运行事实。
