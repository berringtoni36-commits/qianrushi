# 嵌入式知识库蒸馏流水线状态

处理日期：2026-08-14

当前规范 Skill 基线：56；各知识域主域计数由 `skill-pressure-test-matrix.md` 维护并由审计脚本校验。

最近一次完整回归：见 [`regression-latest.md`](regression-latest.md)；最近一次完整刷新记录为 2026-08-14 11:23 CST。provenance 刷新、总审计、全仓库覆盖复核、只读复核和 37 条 Python 测试均通过；ZCode-only 同步 dry-run 规划安装 0、检测到 56 个既有同名目录冲突，未写入客户端。

## 范围

- [x] 当前范围扩大为全仓库：嵌入式核心、RTOS、Linux 内存/eBPF、Linux 视觉、Linux 用户态教程、LeetCode、交互实验、算法 PDF 证据、RedNote 外部参考和 vault 工具方法。
- [x] 图片、模型、Canvas、构建产物和压缩包按证据/派生/待审计边界处理，不整体复制到 Skill。
- [x] 原始仓库只读；源码和测试作为事实证据；文档声称、教学模型和实测结果分开标记。

## 阶段

- [x] 阶段 0：12 个来源域的结构、术语、事实边界和批判性概览；算法 PDF 为有限抽取证据域，附件域为证据层，RedNote 为外部参考域。
- [x] 阶段 1：框架、原则、案例、反例、术语候选池和重复/派生审计。
- [x] 阶段 1.5：核心候选通过 V1 跨来源、V2 预测力、V3 独特性验证；不合格内容降级为案例/术语/rejected。
- [x] 阶段 2–3：56 个规范 Skill、各域 INDEX/GLOSSARY/DIGEST/verified/source-map 和全局矩阵；本轮新增 Skill 按同一 RIA++ 格式维护。
- [x] 阶段 4：56 个 Skill 均具备 6 条静态压力测试；当前快照没有可运行交互实验源码，历史交互测试不再计入当前通过数。这里的静态结果不等于客户端真实命中率。
- [x] 阶段 5：56 个规范 Skill 已完成交付；Round 3 的 5 个 Skill 已安全同步到唯一活动目标 ZCode，既有目录不覆盖。Codex、全局 Claude 和 Obsidian Claudian 的蒸馏副本已停用并保留备份。最终审计已重算来源路径、符号级定位、ZCode 副本状态和域索引；ZCode 新会话盲测仍待完成。
- [x] 阶段 5 增强：RTOS、Linux 内存/eBPF、Linux 视觉新增可追溯性报告；静态事实、历史构建证据、目标环境验证和硬件实测分层记录。
- [x] 阶段 5 全量覆盖增强：附件/Canvas/根目录未知项、Linux 各域、算法 PDF、交互实验和工作台均有独立覆盖复核；当前来源快照 7,146 条，过期派生登记 233 条单独保留。
- [x] 阶段 5 证据增强：算法 PDF 增加 121 页主题卡和 39 条公式/图片缺口登记；工作台增加 360 条主动回忆队列、入口精确回链和状态更新边界；两类派生物均不冒充完整视觉复核或真实掌握率。

## Skill 状态

| 知识域 | 数量 | 状态 |
|---|---:|---|
| embedded-core | 14 | 数值合同、文件持久化、用户态定时和 C 结构体合同增量静态测试通过；INDEX 另保留 3 个跨域 UDP 入口 |
| rtos-project | 13 | 软件周期、LCD/蜂鸣器反馈和构建—烧录—运行 provenance 增量静态测试通过 |
| linux-memory-ebpf | 5 | 快速路径观测、Map 计数、运行链、buddy 指标和源码审计均通过静态测试 |
| linux-vision | 9 | 文件 IPC、构建 provenance、模型 Tensor、Qt 事件循环、CMake、Mat→Qt 和资源遥测均通过静态测试 |
| linux-systems-tutorial | 9 | 进程/信号、pthread 同步、Socket/UDP 和 RX/NAPI 接收路径增量静态测试通过 |
| leetcode-algorithm-learning | 3 | 通过首轮静态测试 |
| interactive-learning-labs | 1 | 通过首轮静态测试 |
| vault-methodology-and-tools | 1 | 通过首轮静态测试 |
| algorithm-pdf | 0 | 证据域完成；OCR/版面待复核 |
| rednote-bookmarks | 0 | 外部参考域已分层；不把第三方帖子直接升格为规范 Skill |

## 下一步

- [x] 已将各轮通过静态测试的 Skill 安全同步到唯一活动目标 ZCode；复制前确认目标目录，已有同名目录不覆盖。
- [x] Round 3 的 5 个 Skill 已安全同步到 ZCode；其余 Codex、全局 Claude 和 Obsidian Claudian 活动副本已移出并保留可恢复备份。
- [x] 复核 ZCode 副本：当前完整 Skill 包口径为 `same=56`、`different=0`、`missing=0`；详见 `client-skill-audit.md/tsv`。其他客户端不在活动审计目标内。
- [x] 为 56 个规范 Skill 重算 `source_files`，补齐 9 个旧 Skill 的 `source_symbols`，并检查新增来源路径；当前 `source_files` 为 434 条记录 / 265 条唯一路径，最终审计 Skill 错误为 0。
- [x] 增强 `audit_vault.py`：自动检查 56 个规范 Skill 与压力矩阵一一对应，并检查各域 INDEX 的主 Skill 链接无重复/缺失；跨域相关链接保留但不冒充主域计数。
- [x] 增强 `audit_vault.py`：自动检查根级/域级流水线状态计数、测试 JSON 的 version/darwin 标记与唯一 ID、`test-results.md` 的静态 6/6 和真实测试限制。
- [x] 增加 `source-symbol-audit.md/tsv`：当前 765 个声明符号中 705 个逐字命中、17 个限定名叶子命中、43 个语义标签待人工确认；修复正文 fallback 的列表边界后重新生成，不把后续 R/I/A/B 段落误算成源码事实。
- [x] 增加 RTOS、Linux 内存/eBPF、Linux 视觉三个域的 `source-boundary.md`，把当前主链、备用变体、vendor/构建/附件证据和未实测边界分层。
- [x] 改进来源覆盖审计：支持来源地图中的安全目录前缀别名和固定前缀 glob，避免已登记主链被错误显示为 indexed-only；不使用 basename 模糊匹配。
- [x] 增加 `skill-trigger-index.md/json` 和 `client-skill-audit.md/tsv`：按 description/主域提供触发入口，并逐项记录 ZCode 的 same/different/missing 与哈希。
- [x] 增强触发入口：56 个 Skill 均有可解析的规范关系；生成 `skill-related-index.md/json`，当前 181 条规范关系边、2 条外部工具关系边、未知关系 0。
- [x] 增加 `skill-mixed-intent-matrix.md/json`：12 条 RTOS、UDP、视觉、CMake 和 TCP 的混合意图静态主路由/辅助路由/禁用主路由预期；明确不冒充客户端实测命中率。
- [x] 记录 ZCode 副本与规范源的元数据差异，未擅自覆盖；当前完整包口径为 `same=56`、`different=0`、`missing=0`，逐项差异类型、缺少文件和变化文件见 `client-skill-audit.tsv`。规范源的 56 个 Skill 已规范化，ZCode 副本不会自动覆盖。
- [x] 建立 `source-disposition-overrides.tsv`，人工标记 RedNote 外部资料、派生索引、媒体和根目录外部压缩包。
- [x] 完成 RedNote 书签域的全局理解、来源映射和外部事实边界。
- [x] RTOS 第二轮补充传感器、按键、自动状态机、配置启动、运行时故障、IAP/CRC、软件周期、显示反馈和构建—烧录—运行 provenance 候选及规范 Skill；当前 RTOS 共 13 个规范 Skill。
- [x] 补充 Linux 线程同步、Linux 进程/信号生命周期、Linux 虚拟内存回收和视觉模型 Tensor 契约 Skill；已安全同步到 ZCode。
- [x] 为全部规范源补齐 `agents/openai.yaml`；官方 Python 校验器已在临时隔离环境补齐 PyYAML 后运行，56/56 通过；不会把依赖写入 vault 或客户端目录。
- [x] 增加 [`official-validation.md`](official-validation.md)：记录官方 `skill-creator` 校验器的 56/56 结果、临时依赖边界和静态检查限制。
- [x] 增加 [`source-freshness-audit.md`](source-freshness-audit.md)：将历史基线之后发生变化且被规范 Skill 引用的来源文件单独列为复核队列，不自动改写结论。
- [x] 来源新鲜度当前快照：6 个文件相对历史基线变化，另有 8 个历史基线后新增且已被规范 Skill 引用的工作台文件；共 14 条变化/新增引用均已处置，pending=0。其中高优先级变化引用涉及 3 条关系（`08 通讯协议.md` → 总线选择/结构体合同；`FreeRTOS 源码解析.md` → Linux 虚拟内存回收），其余按 context/state boundary 保留，不自动回炉。
- [x] Round 3：新增 5 个 Skill，均完成 RIA++、6 条静态压力测试、来源元数据修复、压力矩阵登记和 ZCode 缺失目录安全同步。
- [x] RTOS 增量边界复核：未新增重复 Skill；将 `g_dataMutex` 仅部分覆盖共享状态、`System_GetState()` 裸指针和 `volatile`/原子性边界写入现有任务/ISR Skill、来源映射、反例与测试。
- [x] 本轮修改后重新生成审计报告：规范 Skill 结构、压力矩阵、来源路径、相对链接和 ZCode 缺失状态继续由脚本核对；客户端旧副本不覆盖。
- [x] 来源摘要与 Artifact 清单改为由 `audit_vault.py` 从当前来源快照自动重生成；当前为 7,146 个路径、12 个来源域、6 个文件类别、2,981,072,292 bytes，避免新增工作台/外部资料后出现旧统计。
- [x] 新增 `scripts/test_inventory_reports.py`，以当前 `source-inventory-current.tsv` 回归检查来源摘要和 Artifact 清单的总量、域级/类别级统计（4/4 通过）。
- [x] 增加独立前向复核记录：持久化、Qt 事件循环和视觉 Tensor 契约 Skill 均完成只读源代码/模型元数据边界复核；不把该复核当作客户端真实命中率。
- [x] 修复唯一发现的重复 JSON 键；`audit_vault.py` 现在对全部 111 个派生 JSON 拒绝重复对象键，并以回归测试覆盖该行为。
- [x] 增强客户端副本审计：逐项输出 `difference_kind`、`missing_files`、`extra_files`、`changed_files`，不把“目录存在”误报为“逐字同步”。
- [x] 新增 `scripts/test_sync_skills.py`：用临时目录回归验证冲突预检是 all-or-nothing，`--allow-conflicts` 只安装缺失目录且不改写已有目录。
- [x] 增加 `source-freshness-review.tsv`：对 6 个当前变化文件和 8 个历史基线后新增且被引用的工作台文件记录已核对的事实边界和是否回炉；14 条处置均已完成，pending=0；两份高优先级技术引用已做静态边界复核，暂不改写 Skill。
- [x] 新增 `scripts/run_regression.py` 与 `scripts/test_regression.py`：提供可断点续跑的单命令回归入口，串联 vault/Skill 审计、三域 provenance 只读检查、Python 测试和 ZCode-only 同步 dry-run，并检查报告间的数量、错误、链接、provenance 与 ZCode 缺失合同；不把客户端目录差异误报为失败，也不宣称真实会话命中率。
- [x] 新增 RTOS 构建产物 provenance 报告：[`rtos-project/artifact-provenance.md`](artifact-provenance.md)，区分 C0 工程合同、C1 历史产物身份和未取得的 C2-C4 Flash/启动/运行证据。
- [x] 新增 Linux 内存/eBPF 可运行性矩阵：[`linux-memory-ebpf/runtime-validation-matrix.md`](runtime-validation-matrix.md)，登记 import/path 静态阻断、BCC/内核待执行项、节流风险和 Map 计数边界。
- [x] 新增 Linux 视觉主链核验矩阵：[`linux-vision/main-chain-verification-matrix.md`](main-chain-verification-matrix.md)，核对摄像头→帧文件→LSTR→结果→Qt 显示的路径、编号、进程生命周期和历史 build provenance。
- [x] 新增只读生成器：[`scripts/provenance_audit.py`](provenance_audit.py)；`--check-only` 只验证，默认重生成三域 JSON/Markdown 报告，不调用 Keil、J-Link、BCC、Qt、OpenCV 或目标内核。
- [x] 修复 provenance CMake 源文件扩展名解析：长扩展名优先，`main.cpp`/`lime.cpp`/`lime_opt.cpp` 不再被错误截断为 `.c`；新增 [`PROJECT_VALIDATION_RUNBOOK.md`](PROJECT_VALIDATION_RUNBOOK.md) 与 [`CLIENT_BLIND_TEST_TEMPLATE.md`](CLIENT_BLIND_TEST_TEMPLATE.md)。
- [x] 收尾全仓库覆盖复核：当前 7,146/7,146 来源路径登记一致；RedNote 精确回链 46/391、RTOS 27/35、Linux memory 21/30、Linux vision 34/49；所有开放队列保留在根级 `FULL_COVERAGE_REVIEW.md` 与 `coverage-review.json`，不被泛化 DIGEST 掩盖。
- [x] 收尾特殊对象审计：5,488 个附件/构建/模型/压缩包等对象已按证据、派生、外部归档或待审计分层；未复制二进制、未解包 ZIP、未执行硬件烧录或目标机运行。
- [x] 新增 [`OPEN_QUEUES.md`](OPEN_QUEUES.md)，将 ZCode 真实盲测、ZCode 副本升级、目标环境验证和资料侧待复核项分开登记。
- [x] 新增 [`CANGJIE_INSTALL.md`](CANGJIE_INSTALL.md)，记录 `cangjie-skill` 的 Codex 安装位置，并明确它与 ZCode-only 规范 Skill 源的边界。
- [x] 新增 `ITERATION_LOG.md` 和 `scripts/test_sidecar_reports.py`，记录持续迭代口径并把算法 PDF/工作台派生物纳入回归。
- [x] 11:17–11:24：为 `embedded-core` 和 `linux-vision` 建立 8+8 条未回链主题卡、候选分流/覆盖改进队列；所有候选均保留 V1/V2/V3 初判，不新增规范 Skill；回归扩展到 36 条测试并通过。
- [x] 11:25–11:28：为 `rtos-project` 建立 6 条 target/ISR/共享状态/变体主题卡和覆盖改进队列；仍不新增规范 Skill，候选来源路径全部通过存在性回归。
- [ ] 在 ZCode 新建会话，验证实际触发；目前只确认 Skill 文件已放入发现目录，尚无真实会话盲测记录。截止中午前不伪造该结果。
- [ ] 根据你的真实提问记录误触发/漏触发案例，进入第二轮回炉。
- [ ] 若 OCR 凭证或人工复核可用，升级算法 PDF 的公式/图片证据。
