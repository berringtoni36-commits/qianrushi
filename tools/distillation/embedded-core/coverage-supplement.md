# `embedded-core` 来源覆盖补充

审计日期：2026-08-14。该文件是 [`source-boundary.md`](tools/distillation/embedded-core/source-boundary.md) 的覆盖补充；原始资料不在本域写入范围内。

## 冻结统计

| 项目 | 数量 | 算式/来源 |
|---|---:|---|
| 当前域 inventory | 132 | `source-inventory-current.tsv` 中 `domain=embedded-core` |
| 精确 Skill evidence | 46 | `source-register.md` 的 `skill-evidence` |
| domain-only/indexed-only | 81 | `source-register.md` 的 `domain-referenced`，均无精确 Skill `source_files` |
| 派生/附件层 | 5 | 4 `derived-backup` + 1 `attachment-evidence` |
| 未回链审计行 | 86 | `46 + 81 + 5 = 132`；见 [`unlinked-review.tsv`](tools/distillation/embedded-core/unlinked-review.tsv) |
| 分类复核 | 86 | `tutorial 58 + index/aggregate 17 + question-bank 6 + derived 4 + attachment 1` |

这里的“精确”要求规范 Skill 的 `source_files` 逐字命中路径；目录、basename、相似标题、`GLOSSARY.md` 的术语来源和 `source-map.md` 的章节范围均不算精确 Skill evidence。

## 已覆盖主源与未覆盖主源

- 46 条 evidence 主要落在 C/C++、OS、网络、STM32、Linux 应用/驱动、FreeRTOS 源码解析和 TCP/内存/文件/定时主题；对应规范入口见 [`INDEX.md`](tools/distillation/embedded-core/INDEX.md) 与 canonical Skill 元数据。
- 本域 `source-inventory-current.tsv` 没有 `code-or-config` 文件。涉及启动汇编、FreeRTOS 配置、Map、GPIO、DMA 或外设调用的代码事实，应回到 `projects/RTOS项目/源码/` 的真实路径；本域八股只能作为解释或候选背景。
- 81 条 domain-reference 没有 `source-map.md` 的逐文件精确回链：
  - 58 条小林图解/杂七杂八教程，保留为方法论或待复核参考；
  - 17 条目录、合并稿和索引，保留导航关系但降级；
  - 6 条 150 题分章，保留题目范围但不重复生成 Skill。

## 去重和 claim 边界

- `图解系统/00. 原始合并稿.md` 与拆分章节、4 个带日期备份属于同一内容链；不按每个副本重复计数。
- 150 题分章与完整题库、八股主笔记之间可能重叠；只有新增且可验证的机制才值得补精确回链。
- 教程中的 Linux 内核参数、TCP 行为、ADC/时钟数字、设备树 API 和经验结论必须标为“文档声称/待目标平台核验”；没有目标机日志、芯片手册、工程配置或测试，不能写成当前项目事实。
- EPUB 是附件证据，不自动替代 Markdown 主源；Defuddle/备份文件只能证明转换或历史存在性。

## 自检合同

- `unlinked-review.tsv` 的 86 个数据行必须全部来自当前 `source-register.md`，且 `existing_skill_evidence=no`。
- domain-only 行必须是 `indexed_only=yes`、`precise_backlink=none`；派生/附件行不计为 indexed-only。
- 该补充只链接本域 `FULL_COVERAGE_REVIEW.md`、`unlinked-review.tsv`、`source-boundary.md`、`INDEX.md`；不修改全局 `audit-report.json`、脚本或其他域。
