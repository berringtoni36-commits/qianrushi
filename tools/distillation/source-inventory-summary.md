# 全仓库来源清单摘要

> 统计范围：当前 vault 原始内容；排除 `distillation/`、`.obsidian/`、`.claudian/` 及缓存目录。当前权威快照见 [`source-inventory-current.tsv`](source-inventory-current.tsv)；`source-inventory.tsv` 保留为历史基线。

## 总量

- 文件数：7,146
- 总大小：2,981,072,292 bytes（仅用于盘点，不等同于可蒸馏文本量）

## 按知识域

| 知识域 | 文件数 | 总大小（bytes） | 主要处理策略 |
|---|---:|---:|---|
| `algorithm-pdf` | 1 | 3,948,866 | 保留本地文本抽取、OCR 和版面证据边界；不把公式缺失当作已验证知识。 |
| `attachments-evidence` | 3,026 | 2,468,858,172 | 按引用关系建资产索引；图片、模型和媒体不整体复制进 Skill。 |
| `embedded-core` | 132 | 44,480,662 | 按主题去重，交叉核对八股、项目文档和源码。 |
| `leetcode-algorithm-learning` | 141 | 1,700,905 | 以专题总结和学习日志为主；题解作为案例，不为每道题生成 Skill。 |
| `linux-memory-ebpf` | 47 | 3,051,252 | 核对文档、源码、运行链和指标计算；BCC/目标内核行为单独标注。 |
| `linux-systems-tutorial` | 47 | 723,629 | 按构建、进程线程、文件 IO、Socket 和接收路径提炼可复用排障方法。 |
| `linux-vision` | 959 | 220,455,774 | 交叉核对文档、源码、模型、构建配置和测试/附件证据。 |
| `rednote-bookmarks` | 1,952 | 170,428,912 | 第三方外部参考分层登记；不把帖子观点直接升格为用户事实。 |
| `rtos-project` | 460 | 66,536,515 | 三角核对 RTOS 文档、STM32 源码和构建配置；构建产物只作证据。 |
| `vault-methodology-and-tools` | 8 | 437,550 | 登记仓库治理、脚本、派生物和安装边界；必要时形成工具方法 Skill。 |
| `vault-root-or-unknown` | 6 | 165,682 | 逐项人工检查根目录未知文件，不默认纳入蒸馏。 |
| `workbench-learning-state` | 367 | 284,373 | 保留学习进度、来源回链和复习状态；不把工作台记录当成独立事实来源。 |

## 按文件类别

| 类别 | 文件数 | 总大小（bytes） |
|---|---:|---:|
| `attachment-evidence` | 5,042 | 2,743,431,340 |
| `build-artifact` | 439 | 130,272,677 |
| `code-or-config` | 425 | 18,791,824 |
| `derived-backup` | 6 | 3,299,078 |
| `knowledge-document` | 1,193 | 17,848,789 |
| `other-binary-or-config` | 41 | 67,428,584 |

## 口径说明

- `attachments-evidence` 是按路径归属的资产域；`attachment-evidence` 是按文件类别统计的全仓库附件类，两者不是同一个维度。
- 工作台记录属于当前 vault 的学习状态层，已登记来源回链，但不自动等同于独立技术事实。
- 本文件由 `scripts/audit_vault.py` 在每次审计时重生成，避免手工沿用旧快照。
