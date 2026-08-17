# Linux 视觉感知项目蒸馏状态

- 当前主域 Skill 数量：9。

- [x] 阶段 0：端到端链路、LIME、模型、性能和个人贡献边界。
- [x] 阶段 1：框架、原则、案例、反例、术语候选池。
- [x] 阶段 1.5：流水线优化、文件 IPC、build provenance、Tensor 契约、Qt 事件循环、CMake 增量构建审计和项目表达通过三重验证。
- [x] 阶段 2–3：9 个 Skill、INDEX、GLOSSARY、DIGEST、verified 和 source-map。
- [x] 阶段 4：每个 Skill 6 条静态压力测试。
- [x] 阶段 5：规范源已纳入全局 Skill 集合；ZCode 副本状态见 `../CLIENT_INSTALL.md`。

范围：`projects/linux视觉感知项目/` 文档、源码、构建配置、模型和交互证据。摄像头路径、尾部处理、OpenMP 归约、性能数字和个人贡献仍按源码/测量核对。

增量：阶段 6 新增 `qt-event-loop-signal-slot-audit` 原子 Skill。已完成 SKILL.md、agents/openai.yaml、6 条压力测试、候选验证记录、verified/source-map/INDEX/GLOSSARY 增量；静态检查目标为 6/6。Qt 线程归属、连接类型、QAction 实际 meta-signal、QProcess 子进程收尾和目标板运行行为仍需运行时核对。

增量：阶段 6 新增 `cmake-source-discovery-incremental-build-audit` 原子 Skill。已完成 SKILL.md、agents/openai.yaml、source_files/source_symbols、6 条压力测试、候选验证记录、verified/source-map/INDEX/GLOSSARY 增量；静态检查目标为 6/6。当前四套 build 的旧 `/media/kylin/...` 路径、同名 `lime`、`xinlime.cpp` 未入 target 及目标板 loader 仍按历史快照/待实测标注。

## Round 3 候选

- [x] `linux-vision-qt-image-buffer-adapter-audit`：Mat→QImage/QPixmap 的格式、stride、拷贝/所有权和 UI 消费合同；已完成 RIA++、来源核验、6/6 静态压力测试并安全同步到 ZCode。
- [x] `linux-vision-resource-telemetry-contract-audit`：CPU/内存累计量、采样差分、单位/错误状态和 51 点滑窗合同；已完成 RIA++、来源核验、6/6 静态压力测试并安全同步到 ZCode。
- [ ] 目标 Qt/OpenCV/发行版运行、非连续 Mat/已知像素和原始 `/proc/stat`/`free -m` 交叉实验：当前环境未执行，不能写成实测结论。
- [x] 主链核验报告已生成：[`main-chain-verification-matrix.md`](main-chain-verification-matrix.md) / [`main-chain-verification-matrix.json`](main-chain-verification-matrix.json)。当前路径和编号存在静态风险，QProcess/事件循环存在静态风险，旧 build 只作为历史证据；目标 Qt/OpenCV、摄像头、模型 Tensor 和 ARM 性能仍待验证。
- [x] 报告生成器已纳入根级流程：`python3 ../scripts/provenance_audit.py --check-only` 可只读检查；不带参数可重生成报告。

## 未回链主题候选（2026-08-14 11:24）

- [x] 登记 8 条主题卡，均有至少两个现有来源路径、V1/V2/V3 初判和现有 Skill 关系：见 [`unlinked-topic-cards.md`](tools/distillation/linux-vision/unlinked-topic-cards.md)。
- [x] 建立主链、构建、模型、Qt 和性能的补证队列：见 [`coverage-improvement-notes.md`](tools/distillation/linux-vision/coverage-improvement-notes.md)。
- [ ] 逐条核对路径、编号、模型调用者、构建身份和目标环境；当前不能将文档性能数字或历史 build 写成实测结论。
