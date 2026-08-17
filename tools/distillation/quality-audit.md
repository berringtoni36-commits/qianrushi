# 蒸馏包质量审计

审计日期：2026-08-14

## 结果摘要

| 检查项 | 结果 | 说明 |
|---|---|---|
| 规范源 Skill 数量 | 56 | 唯一规范源：`distillation/skills/` |
| R/I/A1/A2/E/B 六段 | 56/56 | 每个 `SKILL.md` 均包含六段 |
| 规范源来源文件路径 | 434 条记录 / 265 条唯一路径 | 56 个规范 Skill 的 `source_files` 均通过当前 vault 存在性检查；当前 Tensor Skill 额外登记两份同哈希模型和两份 `log_space.bin`；最终 `audit-report.json` 的 Skill 错误为 0 |
| 测试 JSON | 56/56 合法 | 共 336 条，全部可解析 |
| 测试结构 | 56/56 | 每个 3 正例、2 诱饵、1 边界 |
| 兄弟 Skill 诱饵 | 56/56 具备相关 Skill 路由 | 正文与测试均保留相邻 Skill 区分 |
| 压力测试矩阵覆盖 | 56/56 | `audit_vault.py` 自动核对规范源与矩阵行；当前无重复、缺失或多余行 |
| Skill 关系索引 | 56/56 | frontmatter 关系完整；181 条规范关系边、2 条外部工具边、未知关系 0 |
| 混合意图路由矩阵 | 12/12 | 静态主路由/辅助路由/禁用主路由预期通过；不等于客户端真实命中率 |
| 各域 INDEX 主入口 | 9/9 | 由压力矩阵推导主域；无重复/缺失链接，跨域相关链接单独保留 |
| 流水线状态计数 | 9/9 + 根级 | 根级 56 与各主域声明均和压力矩阵匹配 |
| `source_symbols` 元数据 | 56/56 | 每个规范 Skill 均声明源码/文档定位提示；当前逐字命中 705、限定名叶子命中 17、语义标签待确认 43，详见 `source-symbol-audit.md` |
| 测试元数据/结果口径 | 56/56 | JSON 有 version、darwin 标记和唯一用例 ID；结果文件均声明静态 6/6 与真实测试限制 |
| 交互实验原有 Node 测试 | 历史记录 27/27 | 当前 vault 快照缺少原交互 HTML/JS 源文件，因此不把历史测试当作当前可复现测试 |
| 客户端新增 Skill 同名冲突 | 0 个新增目标冲突 | 本轮 5 个新 Skill 的 15 个目标目录此前均不存在；安全同步未覆盖已有同名目录 |
| 最近一轮新增 Skill 同步 | 已完成 | Round 3 新增 5 个 Skill 已进入唯一活动目标 ZCode；当前 ZCode 完整 Skill 包审计为 `same=56`、`different=0`、`missing=0`；未覆盖既有目录 |
| 同步冲突保护 | 通过 | 临时目录回归测试验证冲突预检不产生部分安装；允许冲突时只复制缺失目录，不改写已有目录 |
| 原有/旧版 Skill 副本 | 以当前完整包审计为准 | ZCode 活动副本为 `same=56`、`different=0`、`missing=0`；Codex、全局 Claude 和 Obsidian Claudian 中的蒸馏副本已移出活动发现目录，并在 `*-skills-disabled-by-qianrushi/` 中保留可恢复备份 |
| JSON 派生物重复键审计 | 通过 | 111 个 JSON 文件均可解析，重复键 0；审计器已对后续重复对象键直接报错 |
| 三域 provenance 报告 | 已生成 | RTOS C0–C4、Linux 内存 M0–M8、Linux 视觉 V0–V8；均为静态/历史证据，未调用目标工具链、内核、硬件或 GUI 运行环境 |
| 来源新鲜度审计 | 已生成 | 当前 6 个文件相对历史基线发生变化，另有 8 个历史基线后新增且被规范 Skill 引用的工作台文件；共 14 条变化/新增引用已处置，pending=0；高优先级技术引用涉及 3 条关系；详见 `source-freshness-audit.md` |
| 当前来源盘点报告 | 已自动重生成 | `audit_vault.py` 从 `source-inventory-current.tsv` 重算 7,146 个路径、12 个来源域、6 个文件类别和 2,981,072,292 bytes；摘要和 Artifact 清单不再沿用旧手工统计 |
| 来源盘点报告回归测试 | 通过 | `scripts/test_inventory_reports.py` 检查总量、每个来源域、每个文件类别和自动生成声明均与当前 TSV 一致（4/4） |
| 统一回归入口 | 通过 | `scripts/run_regression.py` 已串联 provenance 刷新、vault/Skill 审计、三域只读复核、37 条 Python 回归测试和 ZCode-only 同步 dry-run；报告合同检查通过。ZCode 56 个同名冲突是预期的“不覆盖”状态，不等于失败 |
| 独立前向源代码复核 | 3/3 已完成 | 持久化、Qt 事件循环和视觉 Tensor 契约复核均完成；确认当前模型静态 graph 与代码 shape 相符，同时保留颜色、cwd、运行时和客户端盲测边界。该记录不是客户端真实触发率，见 `independent-forward-review.md` |
| 验证运行手册 | 已生成 | [`PROJECT_VALIDATION_RUNBOOK.md`](PROJECT_VALIDATION_RUNBOOK.md) 把三个项目的补证步骤、原始日志字段和完成条件固化为可续跑模板 |
| 客户端盲测记录模板 | 已生成 | [`CLIENT_BLIND_TEST_TEMPLATE.md`](CLIENT_BLIND_TEST_TEMPLATE.md) 区分真实会话路由、回答事实边界和静态 6/6 |
| 实际会话盲测 | 待执行 | 需要新建/重启 ZCode 会话后按测试清单验证 |

## 规范源清单

规范源的完整清单、主域归属和压力测试条目以 [`skill-pressure-test-matrix.md`](skill-pressure-test-matrix.md) 与 [`audit-report.json`](audit-report.json) 为准；这里不再维护按轮次拆分的历史名单，避免新增 Skill 后出现过期计数。当前基线为 56 个规范 Skill，主域计数为：embedded-core 14、rtos-project 13、linux-memory-ebpf 5、linux-vision 9、linux-systems-tutorial 9、leetcode-algorithm-learning 3、interactive-learning-labs 1、vault-methodology-and-tools 1、workbench-learning-state 1。

## 复核口径

- `source_files` 路径检查只证明文件在当前 vault 中存在，不证明文档结论、代码可编译或目标硬件可运行。
- `source_symbols` 只作为定位提示；符号可能出现在文档、注释、代码或资源文本中，不能替代逐函数审计。
- 审计器同时兼容规范 `metadata` 和少量历史正文 evidence block；正文列表遇到同级标题或非列表行即结束，避免跨段落误收符号。
- `test-results.md` 的静态结果只检查测试清单与路由边界，不是 ZCode 的真实会话命中率。
- `audit-report.json` 还记录压力矩阵完整性；矩阵通过只代表每个 Skill 有结构化测试条目，不代表真实客户端命中率。
- `provenance_audit.py` 的报告只证明当前文件、配置、源码控制流和历史构建证据的关系；`static-compatible` 不等于当前重编译，`not-run`/`not-evidenced` 不等于失败或成功。

## 事实边界

- 文档声称、源码实际行为、交互教学模型、派生计算和目标平台实测没有混写。
- Linux 内存项目的 import/path、节流 key、PID 聚合、硬编码 order 等风险仍然保留。
- RTOS 项目的 IAP/CRC/Flash、竞态和个人贡献不作无条件宣称。
- Linux 视觉项目的摄像头路径、`memcmp`/`memcpy`、Qt 事件循环、NEON 尾部、OpenMP 归约和性能数字仍标为需核对的边界。
- RTOS 的 C2 Flash、C3 复位启动、C4 串口/业务运行；Linux 内存的 BCC 编译/attach/Map 并发行为；Linux 视觉的目标 Qt/OpenCV、模型 Tensor、摄像头、ARM/NEON/OpenMP 性能均未被本机静态脚本伪装成实测。
- 算法 PDF 仅为 PyMuPDF 有限文本抽取；OCR 401 失败，公式/图片/版面待复核。
- Canvas、HTML、图片、模型和构建产物按派生证据/附件/构建证据处理，不重复生成正文 Skill。

## 当前客户端副本口径

规范源 `distillation/skills/` 已完成官方 frontmatter 规范化。唯一活动目标 ZCode 有 56 个可识别目录，按完整 Skill 包逐文件比较为 `same=56`、`different=0`、`missing=0`。Codex、全局 Claude 和 Obsidian Claudian 不在本蒸馏包的活动交付范围内；对应副本已停用并保留备份。ZCode 同步脚本仍遵守同名不覆盖规则。

客户端逐项差异、缺少文件和变化文件由 [`client-skill-audit.tsv`](client-skill-audit.tsv) 的 `difference_kind`、`missing_files`、`changed_files` 字段给出。

## 未完成但不阻塞当前交付的事项

1. 在 ZCode 新会话执行每个 Skill 的正例、诱饵和边界 prompt，记录真实命中/漏命中。
2. 根据真实会话结果回炉低于 80% 的 Skill；当前没有实际盲测数据，不能虚报通过率。
3. 若获得有效 OCR 凭证或完成人工逐页复核，再升级算法 PDF 的公式和图片结论。
