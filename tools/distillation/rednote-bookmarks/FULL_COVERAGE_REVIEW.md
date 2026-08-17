# RedNote 全量覆盖复核

> 审计基线：当前根级 `source-inventory-current.tsv` / `source-disposition.tsv` 快照（2026-08-14 10:22 CST）以及目标域 `source-map.md` 的精确路径边界。覆盖 status 以根 TSV 实际值为准。

## 结论先行

当前 RedNote 域有 **1,952 个来源路径**，其中 **391 个 `knowledge-document`**、**1,560 个媒体附件**和 **1 个 `.base` 配置**。1,952/1,952 路径都出现在当前 inventory 与 disposition，目标域的 [`source-register.md`](tools/distillation/rednote-bookmarks/source-register.md) 也有 1,952 条逐文件数据行；这证明的是登记完整，不是 1,952 个文件都已被理解。

当前共享快照已应用人工边界规则，物理文件的 disposition 分解为：

```text
1,952 = 1,560 evidence-layer
      +    11 indexed-only（10 个专辑索引 + 1 个 Base 配置）
      +   202 external-reference（收藏正文）
      +   179 needs-review（177 个点赞正文 + 2 个我的发布）
```

上述四项与当前 `source-disposition.tsv` 的实际输出一致；`status` 仍是另一条轴，且根级 status 快照早于本目标域来源映射的最后增补，见下方覆盖表和[当前规则状态](#当前规则状态)。

## 1. 审计输入与计数合同

| 项目 | 数量/结果 | 证据与口径 |
|---|---:|---|
| RedNote inventory 行 | 1,952 | [`../source-inventory-current.tsv`](source-inventory-current.tsv)，按 `domain=rednote-bookmarks` 计数 |
| RedNote disposition 行 | 1,952 | [`../source-disposition.tsv`](source-disposition.tsv)，与 inventory 总行数和路径集合一致 |
| 唯一来源路径 | 1,952 | 当前快照没有缺失路径或重复路径 |
| `knowledge-document` | 391 | 10 专辑 + 202 收藏 + 177 点赞 + 2 我的发布 |
| `attachment-evidence` | 1,560 | `媒体（Media）/` 下图片/视频文件 |
| `.base` 配置 | 1 | `小红书内容总览.base`，不是知识正文 |
| 逐文件登记行 | 1,952 | [`source-register.md`](tools/distillation/rednote-bookmarks/source-register.md) 的表格数据行 |

权威机器快照是 [`../source-inventory-current.tsv`](source-inventory-current.tsv) 和 [`../source-disposition.tsv`](source-disposition.tsv)；人工规则是 [`../source-disposition-overrides.tsv`](source-disposition-overrides.tsv)。本报告的“内容覆盖”还参考了原始 Markdown 的只读标题、frontmatter、URL、标签和媒体嵌入统计，但没有把这些结构统计当作正文理解证明。

## 2. 逐类覆盖与处置

| 原始路径类别 | inventory 类别 | 文件数 | 当前 `status` | 当前 `disposition` | 本次审计解释 | 后续处置 |
|---|---|---:|---|---|---|---|
| `专辑（Albums）/` | `knowledge-document` | 10 | `4 domain-referenced + 6 needs-domain-review` | `derived-index` | **indexed-only / derived-index**；专辑索引由收藏关系派生，不重复计作知识正文 | 保留索引关系；不把索引内容升级为作者事实 |
| `收藏（Bookmarks）/` | `knowledge-document` | 202 | `42 domain-referenced + 160 needs-domain-review` | `external-reference` | **external-reference**；人工规则明确把第三方收藏正文作为外部参考 | 保留作者、时间、原文 URL；观点、经历、数字须独立核验 |
| `点赞（Likes）/` | `knowledge-document` | 177 | `needs-domain-review` | `needs-review` | **needs-review**；当前规则没有给 Likes 单独的 external-reference 覆盖，不能仅凭目录名升格 | 逐文件确认是否纳入外部参考及主题归属 |
| `我的发布（Posts）/` | `knowledge-document` | 2 | `needs-domain-review` | `needs-review` | **needs-review / possible personal-origin**；frontmatter 的 `author` 与 `accountName` 均为脱敏账户名，但身份和是否允许转述仍未由用户确认 | 不把帖子内容写成用户个人事实；等待确认 |
| `媒体（Media）/` | `attachment-evidence` | 1,560 | `evidence-layer` | `evidence-layer` | **附件证据层**；图片/视频不能代替正文、代码、实验或原始数据 | 仅按 resourceId、路径、哈希关联；不自动 OCR 或转 Skill |
| `小红书内容总览.base` | `other-binary-or-config` | 1 | `domain-referenced` | `derived-index` | **indexed-only / derived-index**；Obsidian Base 视图配置，不是知识正文 | 只保留导航/视图 provenance |

### 知识文档 391 条的覆盖结论

- 391/391 条确实是 Markdown 知识文档类记录，但“知识文档”是 inventory 的文件类别，不是已理解结论。
- 根级覆盖快照把 RedNote 的 47 条记录标为 `domain-referenced`（专辑 4 + 收藏 42 + Base 1），把 345 条知识文档标为 `needs-domain-review`（专辑 6 + 收藏 160 + 点赞 177 + 我的发布 2），另把 1,560 个媒体文件标为 `evidence-layer`。因此按根级机器 `status`，知识文档的域回链率为 `46/391=11.8%`，未逐文件域回链队列为 `345/391=88.2%`；这不是正文理解率。
- 当前没有 `skill-evidence`、`domain-scoped` 或机器输出的 `indexed-only` 行。这里的 11 条 `indexed-only` 是本报告把人工规则中的 `derived-index` 映射到用户要求的审计语义，不能回写为机器 status。
- 当前根级快照已经包含目标域补充的 Likes/Posts 和完整类别边界；`needs-domain-review` 仍是明确的 345 条开放队列。即使未来 status 变为全量回链，也只证明路径边界被声明或可回链，不证明每个帖子正文已经人工阅读、事实核验或进入规范 Skill。

### 物理文件、唯一内容与重复

| 范围 | 物理行 | SHA-256 重复组 | 重复组内行 | 可去重后的内容数 | 解释 |
|---|---:|---:|---:|---:|---|
| RedNote 全域 | 1,952 | 96 | 192 | 1,856 | 96 组均为两份同哈希文件，重复冗余为 96 行 |
| `媒体（Media）/` | 1,560 | 96 | 192 | 1,464 | 重复组全部在附件层 |
| 391 个 Markdown + 1 个 Base | 392 | 0 | 0 | 392 | 当前快照内无同哈希重复 |

典型重复是一对 `image-N.jpg` 与 `image-N (Multi Source Sync).jpg`，应按同一附件内容归并，不作为两条知识或两份独立证据。哈希只能证明字节相同，不能证明图片语义相同或帖子事实正确。

## 3. 原始 Markdown 结构抽取（不是理解证明）

对原始 RedNote Markdown 做了只读结构扫描：

| 抽取项 | 结果 | 边界 |
|---|---:|---|
| Markdown 文件 | 391 | 与 inventory 的 `knowledge-document` 数一致 |
| 含 frontmatter 的文件 | 391 | 可抽取 `author`、`url`、`tags`、时间和账户元数据 |
| H1 标题行 | 394 | 有 3 个文件含额外 H1；不是 394 个文档 |
| URL 出现次数 | 902 | 包括 frontmatter、正文原文链接和媒体/视频 URL，非唯一外部事实数 |
| 媒体嵌入出现次数 | 1,558 | 381 个帖子 Markdown 含媒体嵌入；10 个专辑索引不含媒体嵌入 |
| 媒体路径字符串去重后 | 1,558 | 与出现次数相同；路径名层面未见重复引用 |
| 专辑索引文件 | 10 | 共 76 条列表行，抽到 56 个唯一收藏路径和 56 个原文 URL |

媒体引用与附件快照的差集：2 个规范路径没有被正文直接引用：

```text
小红书（RedNote）/。。。。。。。/媒体（Media）/69c68242000000001a0372e4/image-1.jpg
小红书（RedNote）/。。。。。。。/媒体（Media）/69c68242000000001a0372e4/image-2.jpg
```

原始帖子实际引用的是同一 resourceId 下的 `image-1 (Multi Source Sync).jpg` 和 `image-2 (Multi Source Sync).jpg`；这属于文件名变体/重复边界，不应据此断言媒体内容缺失。

## 4. 当前输出与人工规则

### 当前规则状态

共享流水线在 10:22 CST 刷新根级 disposition 时，当前 [`../scripts/audit_vault.py`](audit_vault.py) 已按制表符读取 [`../source-disposition-overrides.tsv`](source-disposition-overrides.tsv)；当前 disposition 输出与规则一致：

- 根级 `status=domain-referenced`：47 条；`status=needs-domain-review`：345 条；`status=evidence-layer`：1,560 条媒体记录；
- `disposition=derived-index`：11（专辑 10 + Base 1）；
- `disposition=external-reference`：202（收藏）；
- `disposition=needs-review`：179（点赞 177 + 我的发布 2）；
- 本报告不修改脚本或根级 TSV/JSON；根级覆盖审计已在本轮刷新后纳入目标域来源映射，保留的 `needs-domain-review` 仍是内容级开放队列，而不是快照延迟。

### 当前快照 status 与 disposition 不可混用

```text
根级快照 status：1,560 evidence-layer + 47 domain-referenced + 345 needs-domain-review = 1,952
机器实际 disposition：1,560 evidence-layer + 11 derived-index
                   + 202 external-reference + 179 needs-review = 1,952
```

`domain-referenced` 是路径回链状态；`external-reference`、`derived-index`、`evidence-layer` 是用途/证据层。它们回答不同问题，不能用一个字段替代另一个字段。

## 5. 外部参考与个人事实护栏

- `收藏（Bookmarks）/` 的 202 条可作为第三方外部参考；作者经历、学习时长、offer、薪资、Star、安装量、节省比例和工具功能都保留为“作者声称”，不写成用户事实或市场事实。
- `点赞（Likes）/` 的 177 条内容虽然从 frontmatter 看均有第三方 `author`，但当前人工覆盖表没有给 Likes 明确的 `external-reference` 处置；本报告将其留在 177 条 `needs-review` 队列，不擅自补规则。
- `我的发布（Posts）/` 的 2 条 frontmatter 标记作者/账户为同一脱敏名，内容涉及考研调剂；这只能证明导出元数据的标记，不能单独证明用户身份、经历或允许转述。
- 图片、视频和专辑索引只用于证据/关系层；图中文字、数字和宣传语没有 OCR、原始仓库或独立实验支撑时，不升级为事实。
- 当前 RedNote 域没有生成新的规范 Skill；现有方法候选与验证边界见 [`verified.md`](tools/distillation/rednote-bookmarks/verified.md) 和 [`rejected/not-skills.md`](not-skills.md)。

## 6. 交付与未解决边界

本轮在目标目录内新增/完善：

- [`TOPIC_DIGEST.md`](tools/distillation/rednote-bookmarks/TOPIC_DIGEST.md)：基于 391 个 Markdown 的标题、标签和链接信号的主题摘要；
- [`evidence-levels.md`](evidence-levels.md)：登记、结构抽取、外部文本、派生索引、附件和个人事实的证据等级；
- [`limitations.md`](limitations.md)：脚本、链接、附件、外部资料和身份核验边界；
- [`source-map.md`](tools/distillation/rednote-bookmarks/source-map.md)、[`source-register.md`](tools/distillation/rednote-bookmarks/source-register.md)、[`INDEX.md`](tools/distillation/rednote-bookmarks/INDEX.md)：补充当前快照口径和导航。

未解决项是明确的开放队列，而不是覆盖成功：177 条 Likes 的用途仍需确认、2 条 Posts 的身份/转述边界、2 个媒体文件名差集、图片/视频内容未核验、外部 URL 未重新抓取，以及所有第三方数字缺少独立验证。原始 RedNote 文件、根级 `audit-report.json`、根 README/PIPELINE_STATE、脚本和其他域目录均未由本报告修改。
