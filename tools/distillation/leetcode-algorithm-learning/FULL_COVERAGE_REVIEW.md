# leetcode-algorithm-learning 全量未回链覆盖复核

审计日期：2026-08-14。原始来源 archive/力扣刷题/ 保持只读；本文件只在本域新增覆盖审计。

## 结论与统计

当前 source-inventory-current.tsv 全库为 7,146 条数据行；本域文件系统与清单一致，共 141 条，其中 140 个 Markdown、1 个 LICENSE。按 INDEX.md、source-map.md、DIGEST.md、verified.md 对路径/主题范围进行逐条复核：

| 口径 | 数量 | 解释 |
|---|---:|---|
| 当前域清单 | 141 | 配置、Raw 调研/计划、专题总结、题目详解、14 天笔记和根文件 |
| 精确回链 | 3 | 两份 Hot100 原始调研/计划和 学习中枢.md 等少数主线入口 |
| domain-scoped | 130 | 题解、专题、Day 笔记和配置内容被目录/题型范围覆盖，但未逐文件精确回链 |
| indexed-only | 8 | 4 个配置文件、Outputs README、根 README、index.md、LICENSE |
| 算法源码 | 0 | 当前域没有可作为独立实现/测试证据的算法源文件 |

indexed-only 八条为：

- archive/力扣刷题/00-配置/全局索引.md
- archive/力扣刷题/00-配置/学习日志.md
- archive/力扣刷题/00-配置/学员档案.md
- archive/力扣刷题/00-配置/进度看板.md
- archive/力扣刷题/04-Outputs/README.md
- archive/力扣刷题/README.md
- archive/力扣刷题/index.md
- archive/力扣刷题/LICENSE

这些路径的存在性和用途可由 source-register.md、source-inventory-current.tsv 复核；它们是索引/配置/许可证，不应被统计为题解或独立 AC 证据。

## 可复用摘要

- 题型框架：哈希、双指针/滑动窗口、数组/矩阵、链表、树、图、回溯、二分、动态规划、贪心和技巧专题。
- 解题审计：先从约束、数据形状和操作结构选择候选框架，再明确状态/不变量/边界、反例和复杂度。
- 学习闭环：遮住答案独立尝试，给最小提示，复盘错误和反例，再做迁移题；题解文本本身只是案例。
- algorithm-active-recall-loop、algorithm-problem-framework-selection、algorithm-state-and-invariant-derivation 可复用方法，但不能把 130 条 domain-scoped 题解自动升格成新 Skill。

## 学习状态与 claim 边界

进度看板.md:19 显示 0% 已完成；进度表中题目完成数为 0，且其规则明确只有“独立 AC”或“可无提示重写”计入完成。学习日志.md 主要包含模板、计划和状态说明；Day 笔记中的总结/计划也不等于真实会话记录。

因此不能从题解数量、14 天目录、模板字段或“看过题解/提示后 AC”推断用户独立 AC、掌握、真实完成度或稳定迁移能力。需要把题解中的算法正确性与学习者行为证据分开；当前域没有独立提交记录、评测日志或逐题无提示回忆结果。

## 可复现扫描口径

~~~sh
awk -F '\t' 'NR > 1 && $1 == "leetcode-algorithm-learning" {n++} END {print n}' \
  distillation/source-inventory-current.tsv
rg --files 'archive/力扣刷题' | sort
rg -n '独立 AC|无提示重写|0%|完成数|学习状态|模板' \
  'archive/力扣刷题/00-配置/进度看板.md' \
  'archive/力扣刷题/00-配置/学习日志.md' \
  'archive/力扣刷题/03-学习笔记'
~~~

分类只把 canonical 文档中的单文件/主线入口算精确回链；目录、专题、题解集合和 Day 范围算 domain-scoped；根配置/README/LICENSE 的八条保留为 indexed-only。没有执行或伪造 LeetCode 提交、编译、评测或无提示回忆。

## 剩余风险与最小补证

若要提升覆盖，优先为已有主线补题目级来源定位和独立回忆记录，而不是创建重复 Skill。每题至少需要题目/约束、独立尝试结果、复杂度、失败反例和复盘日期；只有真实 AC 或无提示重写的可复核证据，才可更新学习状态。
