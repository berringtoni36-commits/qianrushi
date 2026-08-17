# `embedded-core` 全量未回链覆盖复核

审计日期：2026-08-14。原始来源 `projects/嵌入式八股/` 保持只读；本报告只记录覆盖边界，不把登记行自动升格为 Skill evidence。

## 结论

| 口径 | 数量 | 结论 |
|---|---:|---|
| `source-inventory-current.tsv` 当前域文件 | 132 | 127 个知识文档，另有 4 个派生备份和 1 个 EPUB 附件层 |
| 已有精确 Skill evidence | 46 | `source-register.md` 标为 `skill-evidence`；按规范 Skill 的精确 `source_files` 计数 |
| 未有精确 Skill evidence | 86 | 本报告 `unlinked-review.tsv` 的全部行 |
| 主来源型 domain-only / indexed-only | 81 | `domain-referenced`，但没有精确 Skill `source_files`，也没有相应 `source-map.md` 精确路径回链 |
| 有意不升格的派生/附件 | 5 | 4 个备份合并稿 + 1 个 EPUB；保留 provenance，不产生新 Skill |

因此，全局报告中 `indexed_only=0` 不能解释为“逐文件已回链”：它把 `domain-referenced` 当作已覆盖。本轮以精确 `source_files` 为 Skill evidence；81 条 domain-reference 均应继续视为域级登记/索引覆盖，而不是 Skill 覆盖。

逐文件结果、哈希和处置见 [`unlinked-review.tsv`](tools/distillation/embedded-core/unlinked-review.tsv)。

## 计数和身份口径

- `existing_skill_evidence=yes` 只表示当前规范 Skill 的 `source_files` 精确指向该路径；不按 basename、相似标题或目录存在性匹配。
- `indexed_only=yes` 表示只有 `source-register.md`/域索引或宽泛主题描述，未形成精确 Skill 回链；本域 81 条 domain-reference 全部满足这一条件。
- `precise_backlink=none` 是本轮对 81 条 domain-reference 的结果。`source-map.md` 中的主题、章节范围和跨域入口不能替代逐文件路径。
- 合并稿、拆分稿、题库分章和 EPUB 不按文件数量重复算 Skill；一个机制只按唯一主源和唯一规范 Skill 计数。

## 未回链分类

| 类别 | 数量 | 已有 Skill evidence | 仅索引 | 真实路径示例 | 处置和 claim/code 边界 |
|---|---:|---|---|---|---|
| `tutorial-unlinked` | 58 | 否 | 是 | `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.1 CPU 是如何执行程序的？.md`；`projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.17 TCP 协议有什么缺陷？.md` | 保留为教程/转载参考；平台、内核版本、参数和示例数字不能直接写成项目代码或目标机实测。 |
| `index-or-aggregate` | 17 | 否 | 是 | `projects/嵌入式八股/2. 小林图解/图解系统/00. 原始合并稿.md`；`projects/嵌入式八股/嵌入式高频八股150题/00 索引-150题速查汇总.md` | 保留导航和聚合关系；降级为索引，不单独产生 Skill 或事实证据。 |
| `question-bank-unlinked` | 6 | 否 | 是 | `projects/嵌入式八股/嵌入式高频八股150题/01 C-C++基础（1-25题）.md`；`projects/嵌入式八股/嵌入式高频八股150题/05 RTOS-FreeRTOS（91-105题）.md` | 保留题目范围和复习入口；题库答案不能替代逐符号源码、配置或测试证据。 |
| `derived-backup` | 4 | 否 | 否 | `projects/嵌入式八股/糯叽叽八股（完整版）.md.backup-20260813-stl`；`projects/嵌入式八股/2. 小林图解/图解系统（小林coding·全章节合并）-Defuddle提取.md.backup-20260812-134426` | 明确标为派生/备份并降级；不得与主稿重复计数，也不能支撑新的技术 claim。 |
| `external-attachment` | 1 | 否 | 否 | `projects/嵌入式八股/图解系统-小林coding-v1.0.epub` | 保留附件来源存在性；版面/OCR/附件内容不自动成为代码事实或 Skill evidence。 |

## 文档 claim 与代码事实边界

- C/C++、OS、网络、STM32 和 Linux 驱动的 46 条已有 evidence 主要来自八股/教程文档；本域 inventory 没有 `code-or-config` 行。涉及 `SYSCLK`、FreeRTOS 堆、启动汇编、Map 或设备树的代码事实，必须回到 `projects/RTOS项目/` 的具体源码和配置，而不能从本域题库标题推断。
- `embedded-core/source-map.md` 已把部分 C/网络/内存/文件/定时主题连到规范 Skill，但剩余小林章节和 150 题分章仍是域级参考；“出现在 `GLOSSARY.md`/`DIGEST.md`”不等于该文件已进入 Skill `source_files`。
- 教程中的内核队列、TCP 参数、watermark、ADC 精度、Linux 驱动 API 和经验数字属于解释或方法论；没有目标内核、芯片手册、工程配置、日志或实测时，只能写“文档声称/待验证”。
- 跨域 UDP 三个 Skill 仍以 `linux-systems-tutorial` 为主域；在本域 INDEX 中导航不应重复计数为新的 embedded-core Skill。

## 建议

1. 保留 58 条教程和 6 条题库分章作为复习参考，后续若确有需求，只为独立机制补精确路径和符号证据，不按章节数量新增 Skill。
2. 继续把合并稿、备份和 EPUB 放在来源边界/附件层；不要把 Defuddle 或题库副本当成新的独立证据。
3. 下一轮如要提高覆盖，优先选择一个唯一主源，补 `source_files`、符号级定位和反例测试；不要先改全局数量。
4. 代码事实优先引用 RTOS 当前 target 的 `project.uvprojx`、源码、MAP 和构建 provenance；硬件运行结论仍需目标板日志。

边界补充见 [`coverage-supplement.md`](tools/distillation/embedded-core/coverage-supplement.md)，原域分层见 [`source-boundary.md`](tools/distillation/embedded-core/source-boundary.md)。
