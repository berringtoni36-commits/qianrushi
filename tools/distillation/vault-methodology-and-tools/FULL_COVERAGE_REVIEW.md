# `vault-methodology-and-tools` 全量覆盖复核

> 本报告只审计 `tools/` 方法与工具域的来源登记和证据边界，不把工具规则自动升级为嵌入式技术结论。原始 `tools/` 文件保持只读。

## 计数合同

| 项目 | 数量 | 口径 |
|---|---:|---|
| 当前来源路径 | 8 | 以根级 `source-inventory-current.tsv` / `source-disposition.tsv` 的 `domain=vault-methodology-and-tools` 为准 |
| 知识文档 | 5 | `AGENTS.md`、`CLAUDE.md`、`README.md`、`index.md`、`sortspec.md.md` |
| 代码/配置 | 3 | `split_dabing_linux.py`、两份图片清单 TSV |
| 证据/构建/派生 | 0 | 本域没有被快照归类为附件或构建产物的当前路径 |
| 精确回链 | 8 | 7 条 `skill-evidence` + 1 条 `domain-referenced` |
| 未回链 | 0 | 当前域没有 `indexed-only` / `needs-domain-review` |

上述数字与 [source-register.md](tools/distillation/vault-methodology-and-tools/source-register.md) 逐行登记一致；这里的“精确回链”只证明派生文档引用了保守的来源路径，不证明规则没有过期，也不证明脚本已在所有输入上成功运行。

## 逐项边界

| 来源组 | 当前处置 | 可支持的结论 | 不能支持的结论 |
|---|---|---|---|
| `tools/AGENTS.md`、`tools/CLAUDE.md` | `skill-evidence` | 原始记录只读、目录/frontmatter 和工具协作规则 | 不证明所有历史文件都遵守规则 |
| `tools/README.md`、`tools/index.md` | `domain-referenced` / `skill-evidence` | vault 导航、项目入口和维护意图 | 不证明入口指向的项目内容完整或最新 |
| `tools/sortspec.md.md` | `skill-evidence` | 排序插件配置字段及其作用边界 | 不属于嵌入式学习方法或技术事实 |
| `tools/split_dabing_linux.py` | `skill-evidence` | `SOURCE`、`DEST`、`CHAPTERS`、文章拆分和图片路径契约 | 不证明当前目标目录生成结果已在运行环境复现 |
| `tools/图片当前清单.tsv`、`tools/图片迁移清单.tsv` | `skill-evidence` | 资产大小、哈希、引用次数和迁移登记 | 媒体本身不自动成为知识结论或 OCR 事实 |

## 与规范 Skill 的关系

本域的唯一规范 Skill 是 [`vault-source-boundary-and-derived-artifact-audit`](tools/distillation/skills/vault-source-boundary-and-derived-artifact-audit/SKILL.md)。它可以用于判断新文件是原始来源、派生稿、附件、构建产物、重复文件还是客户端副本；它不应替代项目域的源码审计、运行验证或面试事实核对。

## 开放风险

- `tools/README.md` 仅有域级引用，若后续要把其中某条规则作为事实，应补充精确段落或字段定位。
- 脚本和 TSV 清单是静态来源；未在本轮调用拆分脚本、执行迁移或重建附件。
- 根目录 `resume-deepdive.skill`、`zin3sgj2` 等外部 Skill/ZIP 资产已在其他域登记，不因本域的规则文件存在而纳入规范 Skill 源。
- 本报告不声称 Codex、Claude 或 ZCode 的真实会话已经命中该 Skill。

## 复核结果

- 8/8 当前来源路径已有来源登记。
- 8/8 当前来源路径已有精确或 Skill 证据回链。
- 原始 vault 未修改；未复制二进制、未解包压缩包、未运行外部安装动作。
