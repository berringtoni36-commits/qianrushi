# 嵌入式知识库蒸馏产物

这是从当前 Obsidian vault 生成的、可断点续跑的 RIA-TV++ 蒸馏包。原始资料保持只读，`distillation/` 只保存可追溯的派生产物；静态审计不会冒充目标板、目标内核或客户端真实运行。

## 范围

- `embedded-core/`：通用嵌入式八股、C 存储/链接与 Map、TCP 分层诊断、通信、ARM Linux 启动链与面试表达。
- `rtos-project/`：STM32F103 + FreeRTOS 油烟机控制系统。
- `linux-memory-ebpf/`：BCC/eBPF Linux 物理内存碎片检测项目。
- `linux-vision/`：ARM Linux 视觉感知、LIME、ONNX/NCNN、NEON/OpenMP 项目。
- `linux-systems-tutorial/`：Linux 用户态工具链、fd/IPC、Socket/framing/多路复用。
- `leetcode-algorithm-learning/`：Hot 100 题型选择、状态推导和主动回忆；题解只作案例。
- `interactive-learning-labs/`：HTML/JS 实验、Canvas 和测试的事实边界审计。
- `algorithm-pdf/`：算法 PDF 的有限文本证据和 OCR 失败审计，不重复造 Skill。
- `vault-methodology-and-tools/`：来源边界、派生稿、脚本、附件和 ZCode 副本治理。
- `rednote-bookmarks/`：小红书收藏的外部参考索引；按嵌入式求职/八股、面试方法、AI/Obsidian 工具、招聘信息和非本领域内容分层，不把第三方观点当成用户事实。
- `skills/`：规范 Skill 源；当前基线为 56 个，数量和静态审计结果以 [`audit-report.json`](audit-report.json) 为准。
- [`skills/README.md`](tools/distillation/skills/README.md)：规范源目录的包合同、校验入口和不覆盖同步规则。
- [`CLIENT_INSTALL.md`](CLIENT_INSTALL.md) 与 [`ZCODE_SCOPE.md`](ZCODE_SCOPE.md)：ZCode-only 安装、作用域和恢复边界。
- [`regression-latest.md`](regression-latest.md)：最近一次自动回归的可续跑摘要。
- [`OPEN_QUEUES.md`](OPEN_QUEUES.md)：需要真实客户端、目标环境或用户选择的下一轮队列。
- [`ITERATION_LOG.md`](ITERATION_LOG.md)：持续蒸馏轮次、质量门和事实边界记录。
- [`CANGJIE_INSTALL.md`](CANGJIE_INSTALL.md)：蒸馏元 Skill 的安装位置与规范源边界。
- [`FULL_COVERAGE_REVIEW.md`](tools/distillation/FULL_COVERAGE_REVIEW.md)：全仓库逐路径 disposition、知识文档回链率和过期派生登记复核。
- `algorithm-pdf/page-topic-cards.md` 与 `algorithm-pdf/formula-figure-gap-register.tsv`：算法 PDF 的逐页证据卡和公式/图片缺口。
- `workbench-learning-state/ACTIVE_RECALL_PLAN.md` 与 `workbench-learning-state/review-queue.tsv`：360 条学习记录的主动回忆队列和状态更新边界。
- `embedded-core/unlinked-topic-cards.md`、`linux-vision/unlinked-topic-cards.md`：未回链主题的候选登记；配套 `candidate-triage.md`/`coverage-improvement-notes.md` 只代表待审查，不代表新 Skill 或项目实测。
- `rtos-project/unlinked-topic-cards.md`：RTOS target、ISR、共享状态和变体的候选登记；不替代 Keil/板卡 provenance。
- [`coverage-review.json`](coverage-review.json)：全量覆盖复核的机器可读队列。

原始笔记、源码和附件没有复制或改写；每条重要结论都在相应 `source-map.md` 中保留来源路径和源码符号（如有）。

## 使用入口

- [嵌入式知识库总索引](嵌入式知识库总索引.md)
- [使用说明](使用说明.md)
- [流水线状态](tools/distillation/PIPELINE_STATE.md)
- [全仓库覆盖矩阵](coverage-matrix.md)
- [全局来源映射](global-source-map.md)
- [重复与派生审计](duplicate-and-derived.md)
- [Artifact 清单](artifact-inventory.md)
- [Skill 压力测试矩阵](skill-pressure-test-matrix.md)
- [Skill 一致性复核](skill-consistency-review.md)
- [质量审计](quality-audit.md)
- [官方 Skill 格式校验记录](official-validation.md)
- [来源符号审计](source-symbol-audit.md)
- [规范 Skill 来源新鲜度审计](source-freshness-audit.md)
- [来源新鲜度人工处置表](source-freshness-review.tsv)
- [Skill 触发入口索引](skill-trigger-index.md)
- [Skill 相关关系索引](skill-related-index.md)
- [混合意图路由对抗矩阵](skill-mixed-intent-matrix.md)
- [客户端逐 Skill 副本审计](client-skill-audit.md)
- [RTOS 构建产物 provenance](artifact-provenance.md)
- [Linux 内存/eBPF 可运行性矩阵](runtime-validation-matrix.md)
- [Linux 视觉主链核验矩阵](main-chain-verification-matrix.md)
- [项目验证运行手册](PROJECT_VALIDATION_RUNBOOK.md)
- [ZCode 真实盲测记录模板](CLIENT_BLIND_TEST_TEMPLATE.md)
- [独立前向复核记录](independent-forward-review.md)
- [首轮候选验证结果](tools/distillation/embedded-core/verified.md)

根级自动生成的当前审计入口是 [`audit-report.json`](audit-report.json)；其中还记录触发索引和客户端逐项审计的路径。

新增资料后的完整回归入口是：`python3 distillation/scripts/run_regression.py`。它会刷新来源/Skill 审计和全仓库覆盖复核，执行三域 provenance 只读检查、全部 Python 回归测试和 ZCode-only 安全同步 dry-run，并检查各报告之间的计数、错误、链接和 ZCode 缺失合同；同步预演显式允许冲突但仍不写入或覆盖，冲突数量会保留在输出中；`--check-only` 只检查已有派生产物。单独运行覆盖复核可用 `python3 distillation/scripts/coverage_review.py`，只读检查用 `--check-only`。底层审计命令仍是 `python3 distillation/scripts/audit_vault.py`；该命令同时检查来源存在性、Skill 结构、`source_symbols` 元数据、压力矩阵一一对应、各域 INDEX 主入口、流水线状态计数、测试结果口径、触发入口和相关关系索引、混合意图矩阵、派生 JSON 重复键和 ZCode 副本状态，并自动刷新来源摘要/Artifact 清单。三域 provenance 报告可用 `python3 distillation/scripts/provenance_audit.py --check-only` 做只读检查，用不带参数的命令重生成。安全同步命令：`python3 distillation/scripts/sync_zcode_skills.py --dry-run --allow-conflicts`。

## 质量说明

当前规范源的每个 Skill 都要求具有 R/I/A1/A2/E/B 六段、`test-prompts.json` 和测试结果；数量、测试条数和来源路径缺口以当前审计报告为准。测试结果仍是静态路由审查，不等于 ZCode 真实会话命中率。

来源路径审计、符号级定位统计和 Skill 数量以当前 `audit-report.json` 为准；逐符号明细见 [source-symbol-audit.md](source-symbol-audit.md)。本轮新增快速路径观测、eBPF Map 计数合同、Mat→Qt 图像缓冲、视觉资源遥测和嵌入式数值合同 5 个 Skill，均已通过来源、RIA++ 结构和静态压力测试检查。三域 provenance 报告进一步把“文件存在/历史构建/静态兼容/目标环境实测”分开。ZCode 同步遵循“不覆盖同名目录”规则；Codex、全局 Claude 和 Obsidian Claudian 中的蒸馏副本已停用并保留备份，详情见 [CLIENT_INSTALL.md](CLIENT_INSTALL.md)。
