---
name: algorithm-problem-framework-selection
description: "Use when solving a new C++ algorithm problem and the user needs to identify a candidate pattern from constraints, data shape, operations, or objective before coding. Trigger phrases include “这道题用什么模板”, “怎么判断滑窗/二分/DP”, “新题没有思路”, and “帮我归类题型”. Do not use for proving an already chosen solution or for tracking study progress."
metadata:
  source_files:
    - archive/力扣刷题/01-Raw/01-Hot100刷题体系调研报告.md
    - archive/力扣刷题/01-Raw/02-Hot100两周速通刷题计划.md
    - archive/力扣刷题/02-Wiki/专题总结/00-YXC常用模板索引.md
    - archive/力扣刷题/02-Wiki/专题总结/02-双指针与滑动窗口.md
    - archive/力扣刷题/02-Wiki/专题总结/07-图论.md
    - archive/力扣刷题/02-Wiki/专题总结/09-二分查找.md
    - archive/力扣刷题/02-Wiki/专题总结/10-动态规划.md
  source_symbols: [sliding_window, binary_search, BFS, DFS, backtracking, DP, greedy]
  tags: [algorithm, leetcode, cxx, problem-solving, study]
  related_skills: [algorithm-state-and-invariant-derivation, algorithm-active-recall-loop]
---

# 约束—结构—模板选择

## R — 来源摘录（Reading）

> 具体的题目没有价值，成体系的方法论才有价值。

来源：`archive/力扣刷题/01-Raw/01-Hot100刷题体系调研报告.md`。

> 先学习模板，再看题目、独立思考、编码实现和总结归纳。

来源：`archive/力扣刷题/01-Raw/02-Hot100两周速通刷题计划.md`。

## I — 方法论解释（Interpretation）

遇到新题不要从题名或熟悉样例直接联想代码，而是把题面压缩成四类信号：约束规模、输入结构、允许的操作、目标与输出形式。约束先决定暴力是否可行，结构决定候选数据结构，操作限制决定能否排序/原地修改，目标形式再决定是查找、遍历、计数、最短路、可行性还是最优值。

模板只是候选解释器：哈希适合快速映射/计数，双指针和滑窗依赖顺序或窗口条件，BFS/DFS 依赖状态图，二分依赖单调判定，回溯枚举选择树，DP 依赖可复用子问题，贪心需要额外证明。选择之后必须转到 `algorithm-state-and-invariant-derivation` 验证，而不是把“像某道题”当作正确性。

## A1 — 资料中的应用（Past Application）

- Hot 100 体系把哈希、双指针/滑窗、链表、树/图、二分、回溯、DP、贪心组织成题型地图。
- 两周计划把“学模板—读题—独立思考—编码—总结”作为每题的最小闭环，说明题型识别应先于大量编码。
- 专题页用“滑动窗口三问”、二分边界、回溯三要素和 DP 状态定义把题目变成可迁移框架。

来源：`archive/力扣刷题/01-Raw/01-Hot100刷题体系调研报告.md`、`02-Hot100两周速通刷题计划.md`、`02-Wiki/专题总结/*.md`。

## A2 — 未来触发场景（Future Trigger）

当用户给出一道未必在仓库中的 C++ 算法题，并问“该用什么方法”“我总是套错模板”“从约束怎么判断题型”时触发。先让用户提供数据范围、输入/输出、操作限制和目标；缺少这些信息时只列候选，不给出确定结论。

与相邻 Skill 的区分：已经选定二分/DP/回溯/贪心并需要证明边界时用 `algorithm-state-and-invariant-derivation`；需要按掌握程度安排重写和复习时用 `algorithm-active-recall-loop`。

## E — 可执行步骤（Execution）

1. **压缩题面**：写出 `n` 的规模、值域、是否有序/重复、是否要求连续/子序列/路径、允许的修改和目标函数。
2. **生成最多三个候选**：说明每个候选依赖的结构信号和复杂度预期；若题目涉及单调性、状态复用或枚举空间，明确指出需要额外验证。
3. **排除错误候选**：用最小反例检查顺序条件、窗口单调性、图状态、子问题重叠和贪心安全性；再选择模板。
4. **写模板契约**：记录状态/不变量、边界、复杂度和一个相邻但不同的题型，交给推导 Skill 完成实现前审查。

## B — 边界与风险（Boundary）

- 不以题名、平台标签或一个样例决定模板。
- 不把“能套代码”当作证明；排序会改变原序、滑窗需要单调条件、二分需要 `check` 单调、DP 需要状态完整、贪心需要安全性论证。
- Hot 100/14 天计划服务面试覆盖率，不等于完整算法课程或工程算法能力。
- 不自动修改 `archive/力扣刷题/00-配置/` 的学习日志和进度看板。
- 需要事实 API 说明或代码调试时，切换到相应工程 Skill。

## 相关 Skills

- `algorithm-state-and-invariant-derivation`：对已选范式定义状态、不变量、边界并构造反例。
- `algorithm-active-recall-loop`：根据行为证据安排提示、重写和间隔复习。

## 审计信息

- **三重验证**：V1 跨报告/计划/专题 ✓；V2 可识别未收录新题 ✓；V3 迁移的是决策流程而非题目答案 ✓。
- **来源边界**：题目详解属于案例库，不能证明某模板在所有题目上成立。
