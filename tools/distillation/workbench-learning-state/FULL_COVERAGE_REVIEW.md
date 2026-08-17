# workbench-learning-state 全量学习状态与来源覆盖复核

审计日期：2026-08-14。工作台/ 原始条目、状态文件和记录保持只读；本文件只新增本域审计，不回写学习状态或脚本。

## 结论与统计

当前 source-inventory-current.tsv 全库为 7,146 条数据行；本域当前 367 条由 360 个工作台条目记录和 7 个工作台根文件组成。按 INDEX.md、source-map.md、DIGEST.md、verified.md 与真实工作台记录做路径级复核：

| 口径 | 数量 | 解释 |
|---|---:|---|
| 当前域清单 | 367 | 360 条记录 + 7 个根文件 |
| 精确回链 | 364 | 360 条记录和 4 个工作台状态/日志/入口文件有精确来源或状态链 |
| domain-scoped | 3 | 工作台/力扣入口.md、工作台/嵌入式学习工作台.md、工作台/项目快刷.md 只有工作台域入口/范围覆盖 |
| indexed-only | 0 | 本轮 canonical 四文件扫描没有另列当前 indexed-only；粗粒度全局登记的标签不覆盖本报告的三条 scope-only 结果 |
| 记录 source_exists=yes | 360/360 | 所有记录的 source_target 文件存在且在当前 inventory 中 |
| 唯一 source_target | 133 | 多条学习记录可以指向同一个主来源 |

精确回链只证明记录能回到来源或工作台状态结构，不证明内容正确、用户真的学习过或能脱稿回答。source-register.md/全局 source-disposition.tsv 是粗粒度登记；本报告保留三条根入口的 scope-only 差异，不通过修改全局文件消除差异。

## 当前状态快照

| 字段 | 数量 | 证据边界 |
|---|---:|---|
| mastery=学过 | 307 | 当前记录的声明；工作台口径本身定义为看过但未必稳定复述 |
| mastery=未学 | 53 | 当前记录的声明 |
| mastery=掌握 | 0 | 没有当前条目被记录为掌握 |
| review_flag=待回看 | 360 | 全部记录都在复习队列 |
| 原始条目 last_studied 为空 | 360 | 原始工作台条目的日期字段没有真实学习日期 |
| records.tsv 第 9 列为 order:N | 360 | 派生表表头写作 last_studied，但该列实际承载排序值，不能当日期 |

工作台状态字段必须正交解释：mastery、review_flag、last_studied 和 source 互不替代。source_exists=yes 只说明来源可达；学过/待回看只说明记录状态；没有独立回忆、追问、提交或学习日志证据时，不能升格为真实掌握。

## 可复用摘要

- 复习入口应先按学过 + 待回看做无提示口述，再按未学 + 待回看回到 source_target 建立理解。
- 每次回忆至少检查“是什么、为什么、怎么验证、边界/反例”；项目题还要回到源码符号和个人贡献证据。
- 工作台只负责状态、排序和来源指针，技术答案仍由原始 Linux、视觉、RTOS 或算法主源提供；不要让本域复制答案或抢占专项 Skill。

## 不能升格的证据

不能从 307 条“学过”、360 条“待回看”、133 个 source_target 或自动 REVIEW_QUEUE 排序推断掌握率、独立回答率、真实学习时长、项目能力或面试通过率。last_studied 的派生列错位尤其不能被读成学习日期；学习日志中的模板/计划也不能代替真实发生记录。

## 可复现扫描口径

~~~sh
awk -F '\t' 'NR > 1 && $1 == "workbench-learning-state" {n++} END {print n}' \
  distillation/source-inventory-current.tsv
awk -F '\t' '
  NR > 1 {n++; mastery[$7]++; review[$8]++; last[$9]++; exists[$12]++; target[$11]++}
  END {
    print "records", n
    for (k in mastery) print "mastery", k, mastery[k]
    for (k in review) print "review", k, review[k]
    for (k in last) print "field9", k, last[k]
    for (k in exists) print "source_exists", k, exists[k]
    print "unique source targets", length(target)
  }' distillation/workbench-learning-state/records.tsv
~~~

路径存在性再用 rg --files 工作台/ 和 source-inventory-current.tsv 的第 5 列交叉；不要把 records.tsv 的第 9 列直接解释为日期。

## 剩余风险与最小补证

保持原始状态不变，先为每次真实回忆补日期、独立/提示后/失败结果、反例和来源定位，再由用户确认是否升级 mastery。若修复派生表 schema，应单独记录迁移前后的列定义和校验结果；本轮不修改 records.tsv、工作台原始文件、全局报告或脚本。
