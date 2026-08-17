# RedNote 证据等级

> 等级描述“这份材料当前最多支持什么说法”，不描述作者可信度，也不把文件存在、路径回链或帖子自述升级为个人事实。

| 等级 | 当前材料 | 当前数量 | 可以支持 | 不能支持 |
|---|---|---:|---|---|
| E0 登记证据 | inventory/disposition 的路径、类别、大小和 SHA-256 前 16 位 | 1,952 | 文件在快照中、路径可回链、字节重复关系 | 文件正文已读、观点正确、用户使用过 |
| E1 结构抽取 | 原始 Markdown frontmatter、H1、URL、标签、媒体嵌入 | 391 个 Markdown；391 个含 frontmatter | 可定位作者字段、原文 URL、标题和主题信号 | 语义完整理解、事实核验、图片文字正确 |
| E2 外部文本 | 帖子正文及评论中的作者叙述 | 202 条规则明确的收藏正文；177 条 Likes 待处置 | 作为第三方观察、问题清单、方法线索 | 用户经历、市场统计、产品保证、独立实验结论 |
| E3 派生索引 | 专辑索引与 Obsidian Base | 10 个专辑索引 + 1 个 Base | 收藏关系、主题导航和视图 provenance | 独立知识来源；重复计数正文 |
| E4 附件证据 | 图片/视频文件及其 resourceId、路径和哈希 | 1,560 行；1,464 个唯一媒体哈希 | 证明导出中存在附件，帮助回链帖子 | 仅凭图片证明数字、功能、硬件实测或作者身份 |
| E5 个人/实测事实 | 用户确认、原始项目源码、测试日志、硬件实测或独立官方数据 | RedNote 域当前为 0 条 | 只有补齐对应主源后才可作为个人事实/实测结论 | 由 RedNote 帖子、点赞、专辑或图片替代 |

## 当前覆盖状态的另一条轴

机器 `status` 与证据等级正交：

- 根级快照的 `domain-referenced=47`：专辑 4 + 收藏 42 + Base 1；目标域映射随后补充了类别前缀，但尚未刷新根级 status；
- 根级快照的 `needs-domain-review=345`：专辑 6 + 收藏 160 + 点赞 177 + 我的发布 2；这表示根 TSV 尚未逐文件回链这些记录；
- `evidence-layer=1,560`：附件已登记为 E4，不折算为知识文档覆盖；
- 机器输出的 `indexed-only=0` 不代表没有派生索引；当前机器用 `disposition=derived-index=11` 表达 10 个专辑索引和 1 个 Base。`external-reference=202` 与 `needs-review=179` 也是用途层字段，不等于正文理解状态。

## 引用规则

写作时应同时给出：

1. 原始路径或 resourceId；
2. 作者/来源身份（如可见）；
3. 这是作者声称、导出关系、附件存在还是独立验证；
4. 尚未核验的数字、版本、权限或身份边界。

完整逐文件路径见 [`source-register.md`](tools/distillation/rednote-bookmarks/source-register.md)，全量统计见 [`FULL_COVERAGE_REVIEW.md`](tools/distillation/rednote-bookmarks/FULL_COVERAGE_REVIEW.md)。
