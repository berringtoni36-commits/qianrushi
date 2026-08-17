# attachments-evidence 审计入口

- [`FULL_COVERAGE_REVIEW.md`](tools/distillation/attachments-evidence/FULL_COVERAGE_REVIEW.md)：当前快照的附件/模型/图片/构建/派生边界与汇总数字。
- [`disposition.tsv`](tools/distillation/attachments-evidence/disposition.tsv)：逐文件机器可读记录；覆盖多个所属域，但只选择附件、模型、媒体、构建产物、备份/Canvas/Defuddle 特殊对象。

`disposition` 只使用 `source/evidence/derived/archive/excluded/needs-review` 六级。文本索引表示当前源文本中存在可解析的路径或同目录精确文件名引用，不表示已蒸馏；原始附件、模型和构建产物保持只读。

