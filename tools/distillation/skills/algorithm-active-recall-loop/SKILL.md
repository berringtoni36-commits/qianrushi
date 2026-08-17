---
name: algorithm-active-recall-loop
description: "Use when the user is learning algorithms and needs a truthful loop for independent attempts, minimal hints, post-solution review, mastery labels, spaced rewriting, and weak-topic scheduling. Trigger phrases include “刷题计划”, “我看懂但不会写”, “多久复习”, “提示后 AC 算掌握吗”, and “帮我安排主动回忆”. Do not use for solving one algorithm problem or proving its correctness."
metadata:
  source_files:
    - archive/力扣刷题/学习中枢.md
    - archive/力扣刷题/00-配置/学习日志.md
    - archive/力扣刷题/00-配置/进度看板.md
    - archive/力扣刷题/01-Raw/02-Hot100两周速通刷题计划.md
    - archive/力扣刷题/03-学习笔记/Day01-哈希与双指针.md
    - archive/力扣刷题/03-学习笔记/Day07-二叉树进阶与周复习.md
    - archive/力扣刷题/03-学习笔记/Day14-技巧与全局复习.md
  source_symbols: ["⬜", "👀", "🟡", "🟢", "🔵", "学习日志", "进度看板"]
  tags: [algorithm, active-recall, spaced-review, learning, leetcode]
  related_skills: [algorithm-problem-framework-selection, algorithm-state-and-invariant-derivation]
---

# 算法主动回忆与复习闭环

## R — 来源摘录（Reading）

> 学习状态：⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写。

来源：`archive/力扣刷题/00-配置/学习日志.md`、`进度看板.md`。

> 学模板 → 看题目 → 想思路 → 写代码 → 做总结。

来源：`archive/力扣刷题/学习中枢.md`、`archive/力扣刷题/01-Raw/02-Hot100两周速通刷题计划.md`。

## I — 方法论解释（Interpretation）

“看懂”与“掌握”必须用行为证据分开记录。每道题先独立读题和口述思路，卡住时只获得能推动下一步的最小提示；看过题解后记录为看过或提示后 AC，不把熟悉感计为完成；只有能独立 AC，尤其能隔一段时间无提示重写，才说明方法已经进入可调用状态。复习的对象不是题号列表，而是模板、状态/不变量、易错边界和薄弱点。

## A1 — 资料中的应用（Past Application）

- 学习中枢规定五步法、先提示后完整答案、做完回到框架层归纳。
- 学习日志和进度看板定义五级状态，并明确只有独立 AC/无提示重写计入完成数。
- 14 天计划把当天模板学习、独立思考、编码、总结和睡前回顾串成日循环，Day 7 和 Day 14 提供阶段复习检查。

来源：`archive/力扣刷题/学习中枢.md`、`00-配置/学习日志.md`、`进度看板.md`、`03-学习笔记/Day07-二叉树进阶与周复习.md`、`Day14-技巧与全局复习.md`。

## A2 — 未来触发场景（Future Trigger）

当用户说“刷题总忘”“看过题解但不会写”“提示后 AC 算不算掌握”“帮我排一个复习计划”“我有哪些薄弱专题”时触发。先询问/读取用户明确提供的学习状态；不擅自修改仓库中的日志或看板。

与相邻 Skill 的区分：题目还没归类时用 `algorithm-problem-framework-selection`；已经选定方法并要证明时用 `algorithm-state-and-invariant-derivation`。

## E — 可执行步骤（Execution）

1. **记录起点**：按五级状态标记每题当前证据，记录是否看题解、获得了几级提示、是否独立写出和最后一次无提示重写日期。
2. **执行最小提示闭环**：先让用户口述题型、状态/不变量和伪代码；只补一个关键提示，再要求继续；最后才对照题解和代码。
3. **生成复盘卡**：保留题型、核心框架、状态/不变量、复杂度、边界、一个反例和相邻题差异。
4. **安排间隔重写**：优先复习 `👀/🟡` 和反复出错的模板；安排短期重写、几天后无提示重写、阶段性混合抽题，并在每次复习后更新掌握证据。
5. **判断是否加题**：若旧模板不能无提示复现，减少新题量；先补框架和变式迁移，再扩展题单。

## B — 边界与风险（Boundary）

- 不把完成题数、看过题解、提示后 AC 直接等同于掌握。
- 不用固定 14 天计划伪装成适合所有人的科学定律；时间、目标、基础和遗忘速度需个性化。
- 不自动写入 `学习日志.md`、`进度看板.md` 或修改题目状态，除非用户明确授权。
- 不替代具体题目的状态/不变量推导；那属于 `algorithm-state-and-invariant-derivation`。
- 该 Skill 管理学习反馈回路，不保证算法题本身正确。

## 相关 Skills

- `algorithm-problem-framework-selection`：先识别新题的结构和候选模板。
- `algorithm-state-and-invariant-derivation`：验证状态、边界、转移和反例。

## 审计信息

- **三重验证**：V1 学习中枢/日志/看板/Day 笔记 ✓；V2 能对新学习状态安排动作 ✓；V3 用行为证据区分熟悉与掌握 ✓。
- **数据边界**：当前日志和看板是模板/空状态时，不能推断用户已经完成任何题。
