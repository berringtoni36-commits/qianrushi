# 当前快照 Canvas 可读索引

> 按 JSON Canvas 结构检查当前原始仓库；索引只记录节点数、边数和来源统计，不修改任何 `.canvas`。

## 当前扫描

- 当前 `.canvas` 文件：**0**。
- 当前 JSON Canvas 节点：0；边：0；来源统计：0。
- 因当前快照没有 Canvas JSON，不生成节点文本或边明细；`disposition.tsv` 仅保留表头，避免把历史派生报告伪装成当前文件。

## 历史登记对照（不计入当前快照）

`CANVAS_RELATIONS.md` 仍记录 4 个历史 Canvas 的解析结果，但对应路径当前均不存在。以下数字只来自该历史报告，不能用于当前覆盖计数：

| 历史路径 | 历史节点 | 历史边 | 当前存在 |
|---|---:|---:|---|
| `archive/思维导图/Linux物理内存碎片检测-复习版.canvas` | 198 | 197 | no |
| `archive/思维导图/Linux物理内存碎片检测-思维导图.canvas` | 108 | 107 | no |
| `archive/思维导图/Linux视觉感知项目复习-思维导图.canvas` | 107 | 110 | no |
| `archive/思维导图/RTOS项目复习-思维导图.canvas` | 105 | 100 | no |

## 来源边界

- Canvas 的节点/边只能作为关系、导航和派生转换证据；节点引用的 Markdown、源码、PDF 或附件才是需要分别核验的来源。
- 历史 `CANVAS_RELATIONS.md`、既有 `source-register.md` 和本索引均不把缺失的 `.canvas` 重新计入当前 `source-inventory-current.tsv`。
- 若后续出现 Canvas，需重新解析 JSON，检查节点/边 ID 唯一性、边引用有效性，并只记录节点数、边数和来源路径统计。

## 限制

- 本次没有可解析的当前 Canvas，因此没有真实节点/边来源统计；历史数字不代表当前仓库内容。
- 未修改或复制任何 `.canvas`；只读扫描按当前文件系统执行。

