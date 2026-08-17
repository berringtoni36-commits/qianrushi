# vault 方法与工具来源映射

| 结论/方法 | 来源文件 | 代码/字段 | 边界 |
|---|---|---|---|
| 原始记录只读、目录和 frontmatter 规则 | `tools/AGENTS.md`、`tools/CLAUDE.md` | `projects/`、`notes/`、`archive/` 规则 | 两文件内容重叠，是客户端规则副本 |
| vault 导航和项目入口 | `tools/index.md` | Obsidian wikilink、项目表 | 入口描述不能证明项目内容完整 |
| 文件排序配置 | `tools/sortspec.md.md` | `sorting-spec.target-folder`、`order-asc` | 只影响插件排序，不是知识方法 |
| 合并稿拆分流程 | `tools/split_dabing_linux.py` | `SOURCE`、`DEST`、`CHAPTERS`、`extract_articles`、`write_article` | 对 41 个来源标记、5 个章节和图片路径有契约假设 |
| 图片资产管理 | `tools/图片当前清单.tsv`、`tools/图片迁移清单.tsv` | size/hash/reference_count 字段 | 媒体是证据，不自动升级为结论 |
| 外部 Skill/ZIP 资产 | `resume-deepdive.skill`、`zin3sgj2` | ZIP 内 `SKILL.md`/`references/` | 需另行确认来源和授权；不纳入本轮规范源 |
