# 全仓库 Artifact Inventory

> 来源：[`source-inventory-current.tsv`](source-inventory-current.tsv)；`source-inventory.tsv` 保留为历史基线。以下分类每次由 `scripts/audit_vault.py` 从当前文件系统重算。

## 分类摘要

| 类型 | 文件数 | 总大小（bytes） | 处理策略 |
|---|---:|---:|---|
| `attachment-evidence` | 5,042 | 2,743,431,340 | 图片、SVG、模型和媒体按引用/哈希索引，不自动转换为知识结论。 |
| `build-artifact` | 439 | 130,272,677 | 识别并排除正文；只在 provenance 中记录可证明的构建身份。 |
| `code-or-config` | 425 | 18,791,824 | 作为项目事实和代码职责证据；不整体复制到 Skill。 |
| `derived-backup` | 6 | 3,299,078 | 保留用于差异审计，不作为新的知识来源。 |
| `knowledge-document` | 1,193 | 17,848,789 | 按知识域读取、去重、提取和回链。 |
| `other-binary-or-config` | 41 | 67,428,584 | 逐项判断用途和证据边界，不默认解包或安装。 |

## 重点资产群

- `assets/`、项目附件和 RedNote 媒体：保留为证据索引，不整体复制进规范 Skill。
- `OBJ/`、`build/`、`.o/.bin/.hex/.crf` 等：作为构建身份或 provenance 证据，不替代源码和测量。
- `archive/项目交互动画/` 与 `archive/思维导图/`：分别按可运行实验和 Canvas 派生关系审计；当前快照若缺实现则明确记录不可复现。
- 根目录 ZIP、`.skill` 或未知二进制：不自动安装、不解包写回 vault，保留待确认状态。

## 原始保护

本轮报告刷新只写入 `distillation/`；原始笔记、源码、附件、工作台记录和客户端已有同名 Skill 不被重命名、移动、删除或覆盖。
