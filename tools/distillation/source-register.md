# 全仓库来源登记簿

> 这是逐文件身份与处理用途登记，不等于每个文件都已提炼成 Skill。机器可读的完整记录见 `source-disposition.tsv`；内容缺口见 `coverage-gaps.md`。

## 登记规则

- `skill-evidence`：被规范 Skill 的 `source_files` 明确引用。
- `domain-reference`：在知识域的人工摘要、来源地图或验证记录中被明确回链；允许有目录前缀的精确别名或带固定前缀的 glob。
- `domain-scoped`：只被域的 `source-boundary.md` 覆盖，说明它属于审计范围或某个变体目录，但不证明内容已逐文件使用。
- `domain-scoped`：被域来源边界纳入范围，但尚未建立逐文件正文/源码回链。
- `case/example`、`evidence-layer`、`build-evidence`、`derived`：保留为案例、附件证据、构建证据或派生关系，不自动升格为方法论。
- `needs-review`：已登记但仍需要人工阅读、外部核验或用户确认。

## 各域登记簿

- [algorithm-pdf](tools/distillation/algorithm-pdf/source-register.md)：1 个文件
- [attachments-evidence](tools/distillation/attachments-evidence/source-register.md)：3026 个文件
- [embedded-core](tools/distillation/embedded-core/source-register.md)：132 个文件
- [leetcode-algorithm-learning](tools/distillation/leetcode-algorithm-learning/source-register.md)：141 个文件
- [linux-memory-ebpf](tools/distillation/linux-memory-ebpf/source-register.md)：47 个文件
- [linux-systems-tutorial](tools/distillation/linux-systems-tutorial/source-register.md)：47 个文件
- [linux-vision](tools/distillation/linux-vision/source-register.md)：959 个文件
- [rednote-bookmarks](tools/distillation/rednote-bookmarks/source-register.md)：1952 个文件
- [rtos-project](tools/distillation/rtos-project/source-register.md)：460 个文件
- [vault-methodology-and-tools](tools/distillation/vault-methodology-and-tools/source-register.md)：8 个文件
- [vault-root-or-unknown](tools/distillation/vault-root-or-unknown/source-register.md)：6 个文件
- [workbench-learning-state](tools/distillation/workbench-learning-state/source-register.md)：367 个文件

## 机器可读记录

- [source-disposition.tsv](source-disposition.tsv)：逐文件身份、状态、处理用途、哈希和关联产物。
- [source-inventory-current.tsv](source-inventory-current.tsv)：当前原始文件快照。
- [duplicate-hash-groups.tsv](duplicate-hash-groups.tsv)：完整 SHA-256 重复组。
