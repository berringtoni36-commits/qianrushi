---
name: algorithm-state-and-invariant-derivation
description: "Use when a C++ algorithm approach has been chosen and the user needs to define DP state, binary-search interval, sliding-window invariant, backtracking state, greedy proof, edge cases, or counterexamples before implementation. Trigger phrases include “状态怎么定义”, “二分边界错了”, “DP 转移”, “回溯剪枝”, “贪心怎么证明”. Do not use for initial pattern selection or study scheduling."
metadata:
  source_files:
    - archive/力扣刷题/02-Wiki/专题总结/08-回溯算法.md
    - archive/力扣刷题/02-Wiki/专题总结/09-二分查找.md
    - archive/力扣刷题/02-Wiki/专题总结/10-动态规划.md
    - archive/力扣刷题/02-Wiki/专题总结/11-贪心算法.md
    - archive/力扣刷题/03-学习笔记/Day11-二分查找.md
    - archive/力扣刷题/03-学习笔记/Day12-动态规划入门与贪心.md
  source_symbols: [base_case, transition, invariant, check, path, choice_list, pruning]
  tags: [algorithm, correctness, invariant, dynamic-programming, binary-search]
  related_skills: [algorithm-problem-framework-selection, algorithm-active-recall-loop]
---

# 状态—不变量—反例推导

## R — 来源摘录（Reading）

> 回溯三要素：路径、选择列表、结束条件。

来源：`archive/力扣刷题/02-Wiki/专题总结/08-回溯算法.md`。

> DP 需要明确状态、选择、base case 和 dp 数组/函数的含义。

来源：`archive/力扣刷题/02-Wiki/专题总结/10-动态规划.md`。

## I — 方法论解释（Interpretation）

正确性不是从一段看似熟悉的代码里“读出来”的，而是由状态语义和推进规则共同保证。先定义每个变量/区间/递归参数代表什么，再写一次推进后的不变量；对 DP，状态必须包含决定未来所需的全部信息；对二分，闭区间或半开区间语义、循环不变量和 `check(mid)` 单调性必须互相匹配；对滑窗，扩张/收缩条件和答案更新时机必须与窗口语义一致；对回溯，路径、选择和结束条件决定枚举是否完整；对贪心，若不能给出交换论证、覆盖论证或反例排除，就只能标为候选而非结论。

## A1 — 资料中的应用（Past Application）

- 二分专题把“找目标、左边界、右边界、二分答案”统一到区间和判定函数语义。
- DP 专题和 Day 12/13 笔记要求先写状态、初始化、转移、遍历顺序和答案位置，再做空间优化。
- 回溯专题以路径/选择列表/结束条件组织排列、组合和分割；贪心专题通过主动找反例检查局部选择。

来源：`archive/力扣刷题/02-Wiki/专题总结/08-回溯算法.md`、`09-二分查找.md`、`10-动态规划.md`、`11-贪心算法.md`。

## A2 — 未来触发场景（Future Trigger）

当用户已有候选算法，问“为什么这段 DP 对”“二分总是死循环”“窗口收缩条件怎么写”“回溯剪枝是否漏解”“贪心是否能证明”时触发。若用户还没有候选范式，先转 `algorithm-problem-framework-selection`；若用户要安排复习而不是证明，转 `algorithm-active-recall-loop`。

## E — 可执行步骤（Execution）

1. **写语义契约**：逐一解释状态、指针、区间、队列、递归参数和返回值；补上输入为空、单元素、重复、极值和溢出边界。
2. **写不变量**：说明初始化时成立、每次循环/递归推进后仍成立、终止时如何推出答案；二分同时写区间是否包含答案。
3. **检查转移/选择**：DP 逐项核对 base case、转移来源、遍历顺序和空间覆盖；回溯核对选择树是否完整；贪心核对局部选择的安全性证明。
4. **构造反例**：优先测试空输入、最小规模、全相等、单调相反、重复、答案在端点、无法达到和溢出；若策略没有证明，主动搜索能击穿它的最小反例。
5. **再编码并复核复杂度**：代码变量必须对应语义，说明时间/空间复杂度和是否依赖排序、递归深度或语言整数范围。

## B — 边界与风险（Boundary）

- 不能用一个样例、AC 或题解截图替代不变量和证明。
- “DP 五步法”“二分模板”是组织方法，不保证题目一定存在可用转移或单调判定。
- 贪心在当前资料中只有可迁移的反例检查方法；不能把没有证明的策略说成用户项目经验。
- 不自动替用户改写题解、学习日志或代码提交状态。
- 语言库的 `lower_bound`、递归栈、整数溢出和题目数据范围仍需实际核对。

## 相关 Skills

- `algorithm-problem-framework-selection`：从新题信号中选择候选范式。
- `algorithm-active-recall-loop`：把推导结果转成无提示重写和间隔复习任务。

## 审计信息

- **三重验证**：V1 二分/DP/回溯/贪心跨专题 ✓；V2 可审查未收录新题 ✓；V3 同时约束语义、证明和反例 ✓。
- **来源边界**：题目详解仅用于具体案例，不作为普适证明。
