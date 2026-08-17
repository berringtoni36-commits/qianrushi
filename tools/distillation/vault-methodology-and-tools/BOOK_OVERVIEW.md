# vault 方法与工具 — 全局理解

## 基本信息

- 内容类型：当前 vault 的协作规则、客户端行为规范、索引、排序配置、图片清单和拆分脚本。
- 主来源：`tools/AGENTS.md`、`tools/CLAUDE.md`、`tools/index.md`、`tools/sortspec.md.md`、`tools/split_dabing_linux.py`。
- 派生来源：仓库根目录的 `.skill`/压缩包资产、`tools/__pycache__`、图片迁移/当前清单。

## 核心主线

1. 先确定来源边界和只读规则，再生成派生产物。
2. 用 frontmatter、目录索引和双向链接保持 Obsidian 导航。
3. 用脚本处理可重复的分章、图片引用和元数据转换；脚本输出必须与原始合并稿区分。
4. 用文件清单、哈希和引用关系管理附件；媒体和构建产物是证据或输出，不默认蒸馏成正文。
5. `distillation/skills/` 与唯一活动目标 `~/.zcode/skills/` 要分开审计，避免覆盖同名 Skill；Codex、全局 Claude 和 Obsidian Claudian 不在活动交付范围内。

## 关键批判

- `AGENTS.md` 与 `CLAUDE.md` 内容目前一致，是不同客户端的派生规则副本，不应计成两套方法论。
- `tools/README.md` 只有标题和一句说明，不能当作完整 vault 索引；真正的导航内容在 `tools/index.md`。
- `split_dabing_linux.py` 会从合并稿生成分章文档和索引，输出是派生文件；脚本中对文章数量、章节数量和图片格式有显式假设。
- 根目录 `resume-deepdive.skill` 与 `zin3sgj2` 是同尺寸 ZIP 资产，不能仅因扩展名/位置把它们判定为当前仓库原创 Skill；需解包审计 manifest 和来源。

## Skill 化潜力

通过验证的核心方法：`vault-source-boundary-and-derived-artifact-audit`。它用于后续维护时判断源文件、备份、派生稿、构建产物和客户端副本的身份，不替代具体技术 Skill。
