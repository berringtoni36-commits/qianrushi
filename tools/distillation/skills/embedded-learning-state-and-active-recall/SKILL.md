---
name: embedded-learning-state-and-active-recall
description: "Use when auditing or using this Obsidian vault's embedded-learning workbench: deciding what to review, distinguishing 未学/学过/掌握, checking review_flag and last_studied, validating source links, or running a truthful active-recall session. Trigger phrases include “哪些嵌入式内容该复习”, “我看过但答不出来”, “这个算掌握吗”, “检查工作台状态/来源”, “帮我安排主动回忆”. Do not use for solving one technical question, diagnosing a FreeRTOS/Linux/vision fault, or algorithm-specific derivation; route those to the domain Skill and use this only for learning-state management."
metadata:
  source_book: 嵌入式 Obsidian 学习工作台
  source_files:
    - 工作台/学习总账.md
    - 工作台/八股进度.base
    - 工作台/学习日志.md
    - 工作台/资料地图.md
    - 工作台/嵌入式学习工作台.md
    - 工作台/条目记录/150题-001.md
    - 工作台/条目记录/项目八股-RTOS-A0.md
    - 工作台/条目记录/小林网络-001.md
  source_chapter: 工作台/学习总账.md；工作台/八股进度.base；工作台/学习日志.md
  source_symbols: [mastery, review_flag, last_studied, source, formula.mastery_score, formula.needs_review]
  tags: [embedded, learning-state, active-recall, obsidian, provenance]
  related_skills: [algorithm-active-recall-loop, embedded-interview-layered-answer, vault-source-boundary-and-derived-artifact-audit]
---

# 嵌入式学习状态与主动回忆

## R — 来源摘录（Reading）

> `学过`：看过，但不能稳定复述或解释；`掌握`：可以脱稿讲清楚，并能联系项目或回答基本追问。
>
> — `工作台/学习总账.md`

> 只追加真实发生的学习。
>
> — `工作台/学习日志.md`

> 所有答案、项目正文、源码和附件仍以 Vault 原文件为准。
>
> — `工作台/资料地图.md`

## I — 方法论骨架（Interpretation）

把“学习状态”“回看队列”“最近行为”和“原始来源”当作四个不同的合同。`mastery` 只表达当前学习状态声明，`review_flag` 只表达是否需要回看，`last_studied` 只记录真实发生的日期，`source` 只负责把状态条目指回主源；它们不能互相替代。

复习不从答案开始，而从标题和来源定位开始。先让学习者无提示地说出定义、机制、验证方法和边界，再提供一个最小提示，最后用新场景或追问检查迁移。只有行为证据支持时，才建议把 `学过` 升级为 `掌握`；审计和模型评价都不能代替用户确认。

## A1 — 资料中的应用（Past Application）

### 案例 1：360 条工作台记录

- **问题**：嵌入式八股、项目题组、系统/网络章节和 Linux 教程分散在不同主源中。
- **方法论的使用**：为每个条目保留 `record_id`、主线、模块、状态和 `source`，用 Bases 按主线、模块和状态筛选。
- **结论**：可以集中管理复习入口，但不需要复制答案，也不把条目数量当作掌握数量。
- **结果**：当前工作台形成 360 条可追溯学习记录；它们仍需回到原始资料进行学习。

### 案例 2：项目快刷与专项 Skill 组合

- **问题**：项目面试题既需要状态管理，又需要任务/ISR、PID、IAP、eBPF 或视觉链路的技术细节。
- **方法论的使用**：工作台只决定复习对象和状态，技术问题转给项目专项 Skill；项目快刷只保存入口与重点链路。
- **结论**：学习管理和技术诊断可以组合，但不能让状态 Skill 冒充技术答案或个人贡献证明。
- **结果**：项目题组按 RTOS、Linux 视觉和 Linux 物理内存分开统计。

## A2 — 触发场景（Future Trigger）★

### 用户会在什么情境下需要这个 Skill？

1. 用户想从工作台找出“学过但不稳”或“待回看”的嵌入式知识，而不是直接问某个技术答案。
2. 用户问“看过题解/文档算不算掌握”“掌握率为什么是 0”“哪些条目的来源失效或重复”。
3. 用户希望进行一次无提示口述、最小提示、反例迁移和复盘记录，但不希望模型擅自修改原始日志。

### 语言信号

- “帮我看一下嵌入式工作台哪些内容该复习。”
- “我学过很多，但是 FreeRTOS/项目面试还是答不出来。”
- “这个 `mastery` 状态能不能证明我掌握了？”
- “检查工作台的 source、回看状态和学习记录。”

### 与相邻 Skill 的区分

- 与 `algorithm-active-recall-loop` 的区别：后者专门处理算法题的提示、独立 AC、重写和题型薄弱点；本 Skill 管理整个嵌入式工作台及其来源指针。
- 与 `embedded-interview-layered-answer` 的区别：后者组织技术/项目回答；本 Skill 只管理学习对象、回忆过程和状态证据。
- 与 `vault-source-boundary-and-derived-artifact-audit` 的区别：后者覆盖整个 vault 的主源、派生物、附件和客户端副本；本 Skill 聚焦 `工作台/` 的学习记录。

## E — 可执行步骤（Execution）

1. **读取并审计状态层**
   - 检查 `records.tsv` 或原始 `工作台/条目记录/` 的 `mastery`、`review_flag`、`last_studied`、`record_id` 和 `source`。
   - 完成标准：报告记录数、各状态计数、非法值、标题/ID问题和来源缺失；不把文件修改时间当学习时间。

2. **选择复习队列**
   - 用户指定主线或模块时按指定范围；未指定时优先“学过 + 待回看”，再考虑与当前项目或面试目标相关的“未学”。
   - 完成标准：每个候选都有记录文件、原始来源、选择理由和事实边界；不要按题号或数量机械宣称优先级。

3. **执行主动回忆**
   - 先只给标题或问题，让用户说“是什么—机制—验证—边界”；卡住时只给一个最小提示，再让用户继续。
   - 完成标准：得到用户的独立回答、提示后回答或未完成证据；没有用户回应时不得伪造掌握结果。

4. **做迁移和事实核对**
   - 对技术条目追加一个主源没有原样回答的新场景；对项目条目要求指出源码路径、符号和个人贡献边界；必要时转交专项 Skill。
   - 完成标准：明确哪些是原文事实、源码事实、用户自述、推断或待实测。

5. **提出而不擅自回写状态**
   - 给出建议状态、薄弱点和下一次复习动作；只有用户明确授权修改时才回写原始工作台记录。
   - 判停条件：如果只是审计来源或状态字段，不要继续生成技术答案；如果用户改问具体故障、算法推导或项目细节，转相邻 Skill。

## B — 边界（Boundary）★

### 不要在以下情况使用此 Skill

- 用户只问“什么是 TCP 三次握手”“FreeRTOS 任务为什么卡死”等具体技术问题。
- 用户要求推导某道算法题的状态、不变量或复杂度。
- 用户要求把 `学过`、完成数量或模型评价直接改成 `掌握`。
- 用户要求自动设置固定每日配额、倒计时或预计完成日期；当前工作台明确只记录真实进度。

### 资料中的失败模式

- 把看过答案等同于掌握。
- 把 `review_flag` 和 `mastery` 当成同一个状态。
- 用文件修改时间或审计时间冒充 `last_studied`。
- 把工作台条目、派生 TSV 或项目题组标题当作原始答案和源码事实。

### 事实与安全边界

- `source` 存在只证明链接可解析，不证明原文正确或用户已经学习。
- `掌握` 是工作台中的用户状态声明，不是硬件实测、项目贡献证明或永久能力证明。
- 不修改 `工作台/` 原始记录，除非用户明确授权；审计产物只写 `distillation/`。

## 相关 Skills

- `algorithm-active-recall-loop`：算法题专用的提示与重写闭环。
- `embedded-interview-layered-answer`：技术面试回答的定义—机制—项目—边界结构。
- `vault-source-boundary-and-derived-artifact-audit`：全 vault 来源、派生物和同步副本审计。
- `rtos-runtime-fault-diagnosis`、`linux-memory-source-audit`、`linux-vision-project-storytelling`：需要具体技术或项目分析时转交。

## 审计信息

- **三重验证**：V1 ✓ / V2 ✓ / V3 ✓，详见 `distillation/workbench-learning-state/verified.md`。
- **测试**：静态与独立盲测记录见本目录的 `test-prompts.json`、`test-results.md`。
- **原始资料**：只读；本 Skill 不复制答案或修改状态。
