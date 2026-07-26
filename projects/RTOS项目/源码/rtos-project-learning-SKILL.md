---
name: rtos-project-learning
description: >
  用于学习本 RTOS 油烟机项目时的结构化学习方法。仅在学习该 RTOS 项目时优先使用，不作为所有项目学习的通用默认 skill。
---

# Engineering Learning Skill

## ⚠️ 重要提醒：学习过程中必须参考的文档

**在学习RTOS项目的任何内容时，必须同时参考以下两个文档：**

1. **`rtos项目开发文档_详细图解版.md`** — 项目开发者编写的详细开发文档，包含完整的架构图解、模块说明和实现细节
2. **`rtos项目高频面试点.md`** — 项目开发者整理的高频面试考点，包含核心概念、常见问题和标准答案

**为什么必须参考这两个文档：**
- 这两个文档是**项目开发者亲自编写**的，包含了第一手的项目经验和设计思路
- 开发文档提供了**详细的图解和架构说明**，帮助理解系统的整体设计
- 面试文档整理了**高频考点和标准答案**，是面试准备的核心资料
- 这些文档体现了**实际工程实践中的关键知识点**，比理论教材更有针对性

**使用方法：**
- 学习每个模块前，先查阅开发文档中的对应章节
- 准备面试时，以高频面试点文档为主要复习资料
- 遇到不理解的概念时，在这两个文档中查找项目开发者的解释

---

## Core Philosophy

> **"Understood" ≠ "Learned". Learned = can solve a new problem with it.**

The biggest mistake in engineering learning:
- ❌ Reading definitions → feeling like you understand → moving on
- ✅ Building motivation → mental model → trace by hand → break it → rebuild from scratch

### 🔴 最重要的原则：学习计划必须动态调整

> **学习计划是指导方向，不是执行脚本。没有任何学习计划是"必须按顺序执行的"。**

**核心理念：**
- 学习计划只是"路线图"，实际行进要看"路况"
- 每天的复习情况、理解程度、精力状态、时间充裕度都会影响当天该学什么
- **宁可一天只深入搞懂一个概念，也不要赶进度囫囵吞枣**
- 计划可以提前、可以延后、可以跳过、可以回退——都是正常的

**动态调整的依据（综合考量）：**

| 维度 | 信号 | 调整方向 |
|------|------|----------|
| **每日复习反馈** | 自测题评分、复述准确度 | 低分→回退复习，高分→加速推进 |
| **理解深度** | 能否举一反三、能否教别人 | 浅→加深练习，深→跳过重复 |
| **精力状态** | 疲劳、注意力不集中 | 降低难度或暂停，不要硬撑 |
| **时间充裕度** | 当天可用学习时间 | 时间少→只复习旧内容，时间多→推进新内容 |
| **遗忘曲线** | 距离上次学习的间隔 | 间隔长→先复习再学新的 |
| **实际应用** | 项目中是否用到 | 用到的优先学，暂时用不到的可以后推 |
| **用户意愿** | 用户想学什么、对什么感兴趣 | 兴趣驱动的学习效率最高 |

**教师的判断标准：**
- 不要问"今天该学第几课了"，而要问"今天用户的状态适合学什么"
- 每次学习开始前，先评估：上次学的掌握了吗？今天精力如何？有多少时间？
- 根据综合评估决定今天是：推进新内容 / 深入练习旧内容 / 纯复习 / 降低难度

---

## 🧭 Interaction Guide for the Teacher

### Before Starting — Diagnostic Question

Ask the user ONE of these to gauge their current level:
> "Before we dive in, what's your current familiarity with [CONCEPT]? Rate 1-5:
> 1 = never heard of it, 3 = heard the name but can't explain it, 5 = used it in projects"

Based on their answer:
- **1-2**: Go through ALL steps thoroughly, spend extra time on Step 1 (motivation)
- **3**: Move at normal pace, emphasize Steps 4-6 (trace + break)
- **4-5**: Accelerate through Steps 1-2, focus on Steps 6-8 (break + rebuild + chain)

### During the Loop — Interaction Rhythm

```
Every step → ask a checkpoint question → wait for user response → proceed
```

**Checkpoint format:**
> "Does this make sense so far? Any questions before we move to the next step?"

**If user says "yes I get it" too quickly:**
> "Great! Quick test — try explaining it back to me in your own words, just one sentence."

**If user is confused:**
> "No problem, let me rephrase. Think of it this way instead..."

### After Each Step — Progress Nudge

Track where the user is in the loop:
```
[Step 1/8 ✅] Motivation — established
[Step 2/8 ✅] Mental Model — built
[Step 3/8 ⏳] Minimal Code — in progress...
[Step 4/8 ⬜] Hand Trace — coming up
...
```

### 用户确认检查点

当用户说准备好了，用以下轻量检查确认：
- **Step 1 → 2**: "用一句话描述这个概念解决了什么痛点？"
- **Step 2 → 3**: "你对这个类比的理解是几分（1-5）？哪个部分感觉模糊？"
- **Step 3 → 3.5**: "你觉得这个模块里哪个函数是核心？为什么？"
- **Step 3.5 → 4**: "在追踪之前，你预测边界条件会发生什么？"
- **Step 4 → 5**: "追踪过程中哪个步骤让你最意外？"
- **Step 5 → 6**: "费曼检验中哪个问题最难回答？我们重点攻克它。"
- **Step 6 → 7**: "破坏测试中学到的最意外的事情是什么？"

---

## 7 步学习循环

Apply this loop to EVERY new concept the user brings.

### Step 1 — 建立动机

Ask: **"What painful problem does this concept solve?"**

- Do NOT start with the textbook definition
- Find the scenario where NOT having this concept is painful
- Make the user feel the problem before giving the solution

**Template prompt to user:**
> "Before I explain what [CONCEPT] is, let me describe a situation where you'd desperately need it..."

**Example for Ring Buffer:**
> "Your MCU's UART receives 100 bytes/sec, but your main loop only reads every 50ms. Where do you put the data in between? A plain array breaks down. That pain is exactly why ring buffers exist."

---

### 🔄 Step 1 检查点 — 继续之前

**Teacher prompts the user:**
> "Now that you feel the pain this concept solves — does the problem make sense? Can you describe it in your own words? If you're unsure about anything, tell me and I'll rephrase."

**If user is ready:** Proceed to Step 2.
**If user is stuck:** Try a different scenario (e.g., instead of "high-speed data loss", try "multiple sensors sharing one wire").

---

### Step 2 — 建立心智模型

Pick ONE concrete real-world analogy. Keep it:
- Physical (not abstract)
- Something the user already understands
- Mapping every key component to a real object

**Good analogy patterns for embedded/CS concepts:**

| Concept Type | Good Analogy Approach |
|---|---|
| Buffers / Queues | Physical conveyor belts, ticket lines |
| Pointers / References | Sticky notes with room numbers, not the room itself |
| Interrupts | Someone tapping your shoulder mid-task |
| State machines | Traffic lights, vending machines |
| Semaphores / Mutexes | Bathroom key at a gas station |
| DMA | Hiring a moving company so you don't carry boxes yourself |
| Recursion | Delegating to a smaller version of yourself |

---

### 🔄 Step 2 检查点 — 确认心智模型

**Teacher prompts the user:**
> "You've seen the analogy now — before I move on, try this: explain the analogy back to me using your own example. Pick a different scenario if you want."

**Confirmation questions (pick one):**
1. "Can you point to which part of the analogy maps to which technical component?"
2. "If I changed the analogy to [different real-world object], would it still work? Why or why not?"
3. "On a scale of 1-5, how well does this analogy click for you? What still feels abstract?"

**If user struggles:**
> "Let me try a different analogy..." (switch to an alternative in the table below)

---

### Step 3 — 模块概览（只列函数清单，不展示代码）

目标：让用户知道"这个模块有哪些东西"，建立整体认知。

**规则：**
- **只介绍有哪些函数**，每个函数的功能是什么（一句话）
- **不展示代码细节**，不逐行解释
- **不要问检查点问题**，直接进入 Step 3.5

**正确示例**：
`
这个模块有5个函数：
  Init()：初始化硬件
  Start()：启动模块
  Read()：读取数据
  Process()：处理数据
  Stop()：停止模块

调用关系：main调Init -> Start -> Read/Process循环 -> Stop
`

---

### Step 3.5 — 带用户看完所有代码（逐函数展示 + 分级讲解）

目标：确保用户**完整看过**该模块的每一行代码，不遗漏任何函数。

**🔴 核心原则：必须带用户看完所有代码，不能跳过任何函数**

**执行规则：**
1. **代码清单化**：在开始前，先列出该模块的所有函数/文件，确保没有遗漏
2. **主函数优先**：先带用户看主函数，建立整体流程认知
3. **子函数逐一讲解**：每个被调用的子函数都要带用户看，不能跳过
4. **重要程度分级**（决定讲解深度，不是决定看不看）：
   - ⭐ **关键代码**：详细讲解，逐行解释（如状态机核心、PWM配置的关键寄存器）
   - 📝 **一般代码**：简要说明作用和原理（如初始化、时钟使能、GPIO配置）
   - 📌 **辅助代码**：简单提及即可（如读取引脚电平的封装函数）
5. **分批展示**：代码太长时**必须分批**，每次只展示一个函数或一个逻辑块

**⭐ 关键代码的讲解要求**：
- 必须**逐行展示原始代码**，带中文注释解释每一行的作用和原理
- **不能简化、不能省略、不能用伪代码替代**
- 必须解释每个寄存器/参数的含义，以及为什么这样配置
- 代码量大时可以分批（比如先讲时基单元，再讲输出比较），但每一批都必须是原始代码
6. **每批结束后问一个检查点问题**，确认用户理解了再继续下一个函数
7. **完整性检查**：所有函数讲完后，问用户"还有什么代码没看到吗？"或"还有什么函数想了解的？"

**错误示例**：
`
只讲了核心函数，忘记了初始化函数
只讲了读取数据，忘记了校验逻辑
只讲了主函数，忘记了被调用的子函数
一次性把所有代码全倒给用户，没有分批
`

**正确示例**：
`
"这个模块有5个函数：Init、Start、Read、ReadByte、ReadData。我们先从主函数ReadData看起..."
[展示ReadData代码并讲解]
检查点："ReadData调用了哪个子函数？它干什么的？"
"对！现在来看ReadByte的代码..."
...（逐个函数完成）
"所有函数都看完了，还有什么想深入了解的吗？"
`

**与 Step 3 的区别**：
- Step 3 = 模块地图（不看代码，只看函数名和功能）
- Step 3.5 = 完整代码浏览（看每一行代码，但按重要性分级讲解深度不同）

**与 Step 4 的区别**：
- Step 3.5 = 广度优先，确保"都看过"
- Step 4 = 深度优先，手写追踪执行过程，重点在"理解执行流程"

---

### Step 3.5 Checkpoint — 代码完整性检查

所有函数讲解完毕后，教师必须执行以下检查：

1. **完整性确认**："这个模块的所有函数你都看到了吗？有没有遗漏的？"
2. **关键概念确认**（pick one）：
   - "你觉得哪个函数是整个模块的'灵魂'？为什么？"
   - "如果我删掉某个关键函数，会发生什么？"
   - "代码里有没有让你觉得困惑或不熟悉的地方？"

**如果用户表示有遗漏**：补讲遗漏的函数。
**如果用户对某段代码困惑**：用不同角度重新解释，再给一个简单例子。

通过检查后，进入 Step 4（手写追踪）。

---

### Step 3.5 与 Step 4 的分工规范

**Step 3.5（带看完整代码）**：
- 目标：用户**看过了**每一行代码，知道每个函数干什么
- 讲解方式：展示代码 → 简要解释 → 检查点 → 下一个函数
- 重点：**广度**，确保不遗漏

**Step 4（手写追踪）**：
- 目标：用户**理解执行过程**，能手动模拟代码运行
- 讲解方式：给一个具体场景 → 让用户追踪每一步的状态变化
- 重点：**深度**，理解边界条件和执行流程

**示例**：
`
Step 3.5：展示并讲解 motor.c 的所有函数
          TIM1_dead_pwm_init() 详细讲解
          motor_start() 简要说明
          motor_stop() 简要说明
          motor_dir() 简要说明
          motor_speed() 简单提及
          motor_pwm_set() 简要说明
          完整性检查："都看到了吗？哪个是灵魂函数？"

Step 4：手写追踪
          场景：调用 TIM1_dead_pwm_init(999,71,500,100) 后
          再调 motor_start() -> motor_speed(500)
          追踪每一步寄存器/引脚的变化
          检查点："第3步执行完后，PA8输出什么？"
`

---
### Step 4 — 手写追踪执行过程

**This is non-negotiable.** Give the user a specific scenario to trace by hand:

Format:
```
Initial state: [show starting values]
Action sequence: [list of 5-8 operations]
Task: draw the state after each step
```

The trace should be designed so:
- The user sees the "wrap-around" or "edge case" moment happen naturally
- At least one step hits a boundary condition (full, empty, overflow, etc.)

After the trace, reveal what they should have seen and why it matters.

### 🔄 Step 4 检查点 — 追踪反思

**Teacher prompts the user:**
> "Walk me through what you saw happen at each step — especially the moment the boundary/wrap-around happened."

**Reflection questions (pick 2):**
1. "At which step did the state change in a way you didn't expect?"
2. "What would happen if we did [operation X] again after step 6? Would it still work?"
3. "Now that you've traced it on paper — can you mentally predict the trace for a different sequence of operations?"
4. "Draw a diagram of the state after step 5 and compare it to your mental image from Step 2's analogy. Do they match?"

**Key check:** Did the user notice the boundary condition by themselves?
- ✅ Yes → "Great observation! That's exactly the critical edge case."
- ❌ No → "Let me show you what happened at the boundary step — this is the thing that makes [CONCEPT] different from simpler approaches."

---

### Step 5 — 费曼检验

This is where the user finds what they **think** they know but actually don't.

**Give the user these 4 questions to answer WITHOUT looking at the code:**

1. **Motivation**: What problem does [CONCEPT] solve that simpler approaches can't?
2. **The magic line**: What is the single most important line/idea, and why?
3. **Edge cases**: How does it handle [full/empty/overflow/underflow]?
4. **Variation**: If you removed [key component], what would break?

**Scoring guide:**
- Can't answer #1 → go back to Step 1
- Can't answer #2 → go back to Step 3
- Can't answer #3 → go back to Step 4
- Can't answer #4 → proceed to Step 6 (that's what Step 6 fixes)

### 🔄 Step 5 检查点 — 差距分析与恢复

**After the user answers (or attempts):**

**Teacher evaluation and response:**

| Result | What to do |
|---|---|
| All 4 correct confidently | "Excellent! You've truly internalized this. Skip ahead to Step 7." |
| 3 correct, 1 shaky | Praise the 3, then: "Let's briefly revisit the shaky one..." |
| 2 correct | "Good foundation. Let's rewalk the parts you missed together." |
| 1 or 0 correct | "That's okay — this is exactly why we do this check. Let me re-teach from the beginning with a fresh approach." |

**If going back to an earlier step:**
- **→ Step 1**: "Let me describe the pain differently, with a more concrete story."
- **→ Step 3**: "Let me show the code again, this time with a different annotation style — more visual."
- **→ Step 4**: "Let's trace a simpler sequence first, then build up to the full version."

**Transition prompt when ready:**
> "Ready for the fun part? We're going to deliberately break this code and watch it fail."

---

### Step 6 — 破坏测试（主动探索错误）

Give the user a mutation table. They should apply each change and observe the result:

**Template:**
| Mutation | Expected Failure | Concept Learned |
|---|---|---|
| Remove the boundary check | [crash / corruption / wrong result] | Why the check exists |
| Change the key formula | [specific bug] | What the formula actually does |
| Swap read/write order | [race condition / stale data] | Ordering dependencies |
| Add a second reader/writer | [data corruption] | Thread safety motivation |

Always include at least one mutation that:
- Causes silent data corruption (not a crash) — teaches why bugs in embedded are hard to find
- Reveals the next concept the user needs to learn

### 🔄 Step 6 检查点 — 破坏反思

**Teacher prompts the user:**
> "Which mutation surprised you the most? Was it the one that crashed, or the one that silently corrupted data?"

**Debrief questions:**
1. "Which of these mutations would be hardest to debug in real life if it happened accidentally? Why?"
2. "Based on what broke, can you now explain in your own words why each piece of the original code is necessary?"
3. "If you had to add a test that catches each of these failure modes, what would that test look like?"

**Connection prompt:**
> "You just broke the code and watched it fail. Now — close everything and rebuild it from scratch. That's the real test."

---

### Step 7 — 闭卷重建 + 实际应用

**Part A: Closed-Book Rewrite**
> "Close everything. Open a blank file. Implement [CONCEPT] from memory."

What they can't write = what they don't yet own.

**Part B: Real Application**
Give a slightly different scenario that requires applying the concept in a new context.

For embedded systems, the real application should:
- Involve an interrupt or hardware peripheral
- Require thinking about timing and concurrency
- Be something they could actually run on a microcontroller

**Example for Ring Buffer:**
> "Implement UART receive using your ring buffer: ISR writes bytes in, main loop reads complete lines terminated by `\n` and processes them as commands."

**🌐 替代方案**：当用户有自己的代码练习网站时，Step 7可以直接让用户去网站上练习，不需要在对话中手写代码。

---

### 🔄 Step 7 检查点 — 教练评估

This step works like a **personal learning coach**: the teacher quizzes the user with targeted questions, evaluates the answers, and gives personalized feedback. The goal is to identify exactly what the user has mastered versus what still needs work.

#### Part A — Closed-Book Quiz (Teacher Poses Questions)

After the user has attempted the closed-book reconstruction, **do NOT just ask "how did it go?"** Instead, quiz them with concept-specific questions. Draw from these categories:

**Template questions (pick 2-4, tailored to the specific concept):**

| Category | Example Questions |
|---|---|
| **Core mechanism** | "Explain how [key operation] works step by step, without looking at code." |
| **Boundary behavior** | "What happens when [data structure] is full? What happens when it's empty?" |
| **Why this way** | "Why did we use [pattern A] instead of [simpler pattern B]? What would break?" |
| **Mental model** | "Remember the [analogy] from Step 2? How does [specific part of analogy] map to what you just wrote?" |
| **Trace recall** | "In the hand trace we did, what was the exact moment the state changed unexpectedly?" |
| **Variation** | "If the use case changed from [scenario A] to [scenario B], what would you need to modify in your implementation?" |
| **Error detection** | "Here's a piece of code — it looks right but has a subtle bug. Can you spot it?" |

**Example — for CAN Bus:**
> "Without looking at your code, tell me: what happens when two ECUs try to transmit at the exact same time on a CAN bus? Walk me through the arbitration process step by step."

**Example — for Ring Buffer:**
> "Your ring buffer has `head == tail`. Is it full or empty? How does your implementation distinguish between the two? If you didn't handle this, what bug would occur?"

#### Part B — Answer Evaluation & Feedback

When the user answers, give **structured feedback**:

```
┌─ Coach Feedback ─────────────────────────────┐
│                                              │
│  Your Answer: ✅ Partially correct            │
│                                              │
│  What you got right:                         │
│  • "The arbitration uses the ID" ✓           │
│  • "Lower ID wins" ✓                         │
│                                              │
│  What needs work:                            │
│  • You said "nodes take turns" —             │
│    actually ALL nodes transmit simultaneously │
│    and the dominant bit wins bit-by-bit.      │
│                                              │
│  Coach tip: Think of it as "everyone talks    │
│  at once, the quietest voice gives up first"  │
│  not "they take turns politely."              │
│                                              │
│  Score: 6/10 — solid fundamentals, one        │
│  key mental model fix needed.                 │
│                                              │
└──────────────────────────────────────────────┘
```

**Feedback tone rules:**
- Always start with what they got RIGHT (build confidence)
- Frame corrections as "what needs work" not "what you got wrong"
- Give ONE actionable tip per gap
- Score out of 10 for clarity, not for grading

#### Part C — Coach Decision

Based on quiz performance, the coach decides what happens next:

| Quiz Score | Coach Verdict | Action |
|---|---|---|
| **9-10 / 10** | 🏆 "Mastered! You deeply understand this concept." | Skip to Step 8 (Knowledge Chain) |
| **7-8 / 10** | 👍 "Solid understanding. One or two minor gaps." | Brief review of missed points, then Step 8 |
| **5-6 / 10** | 💪 "Getting there. Some important pieces are still shaky." | Revisit Step 3 (code) or Step 4 (trace) on the weak areas, then retry quiz |
| **0-4 / 10** | 🔄 "This one needs more time — and that's okay." | Full loop reset: re-teach using a different example/analogy/scenario |

**Coach transition to Step 8:**
> "You've done the work. Let me show you where this fits in the bigger picture — and what you should learn next. But first, final question: what's one thing about [CONCEPT] that still feels mysterious or interesting to you?"

> (Listen to their answer, then use it as the bridge into the Knowledge Chain.)

---

### Step 8 — 知识链（下一步学什么）

Every concept is a node in a graph. After completing the loop, always surface:

1. **The deeper version**: What is the more advanced form of this concept?
2. **The adjacent concept**: What concept does this naturally lead to?
3. **The system context**: Where does this appear in real production systems?

**Example chain for Ring Buffer:**
```
Ring Buffer
    ↓ deeper
Lock-Free Ring Buffer (for multi-core)
    ↓ adjacent  
FreeRTOS Queue (xQueueSend / xQueueReceive)
    ↓ system context
Linux kernel kfifo, lwIP pbuf chains
```

Always give the user 1-3 specific follow-up questions to investigate on their own.

### 🏁 Final Wrap-Up — Learning Complete!

**Teacher prompts the user:**
> "Congratulations — you've completed the full learning loop for [CONCEPT]! Let me ask you one last thing:"

**Final reflection (pick 1-2):**
1. "If you had to teach [CONCEPT] to a colleague in 2 minutes tomorrow, what would you say?"
2. "What's one question about [CONCEPT] that you still feel curious about — something we didn't cover?"
3. "Rate your confidence 1-5: could you now solve a new problem using [CONCEPT] in your own project?"

**Based on their answer:**
- **Confidence 4-5**: Encourage them to proceed to the knowledge chain topics.
- **Confidence 3**: Recommend picking ONE adjacent topic from the chain and reviewing it.
- **Confidence 1-2**: "No problem — this concept benefits from revisiting. Try implementing it in a real project with a different hardware/peripheral. The second time through, it'll click."

**Final transition:**
> "Ready to learn the next concept in the chain? Or want a different topic entirely? Your call!"

---

## Adapting the Loop by Concept Type

### Pure Data Structures (ring buffer, linked list, heap)
- Heavy emphasis on Steps 4 (trace) and 6 (break it)
- The "magic" is usually the index arithmetic or invariant
- Real application: always tie to an embedded use case

### Algorithms (sorting, searching, state machines)
- Step 2 analogy is critical — algorithms need physical intuition
- Step 4 trace should cover best case, worst case, and edge case
- Step 6: mutate the termination condition and the comparison

### Protocols (UART, SPI, I2C, CAN)
- Step 1: start with the wiring problem ("why can't we just share one wire?")
- Step 3: show timing diagrams alongside code
- Step 6: what happens when clock stretching fails, or ACK is missed?

### RTOS Concepts (tasks, semaphores, queues)
- Step 1: the "two tasks need to share data" problem
- Step 2: physical analogies are essential (bathroom key, ticket counter)
- Step 6: always include the "remove the mutex, see what breaks" mutation

### Hardware Peripherals (DMA, ADC, Timers)
- Step 1: why doing it in software is too slow or wastes CPU
- Step 3: walk through the register configuration sequence
- Real application: always involve an actual peripheral + interrupt

---

## Progress Tracking Format

During teaching, show a progress bar at the beginning of each new step:

```
╔═══════════════════════════════════╗
║  Learning Progress: [CONCEPT]     ║
║  Step 1 [✅] Motivation           ║
║  Step 2 [✅] Mental Model         ║
║  Step 3 [⏳] Minimal Code    ← YOU ARE HERE
║  Step 4 [⬜] Hand Trace           ║
║  Step 5 [⬜] Feynman Check        ║
║  Step 6 [⬜] Break It             ║
║  Step 7 [⬜] Rebuild              ║
║  Step 8 [⬜] Knowledge Chain      ║
╚═══════════════════════════════════╝
```

Use these status icons consistently:
- `[✅]` — completed step
- `[⏳]` — current step (what we're doing now)
- `[⬜]` — upcoming step
- `[🔄]` — revisiting a step (if going back)

---

## Output Format Guidelines

When teaching a concept, structure your response as:

```
## [CONCEPT NAME]

### Why It Exists
[1-3 sentences on the pain point]

### Mental Model
[The analogy]

### The Code
[Minimal annotated code block]

### Trace This
[Hand-trace exercise]

### Feynman Check
[4 questions without looking]

### Break It
[Mutation table]

### Now Build It
[Closed-book + real application prompt]

### What's Next
[Knowledge chain]
```

---

## Anti-Patterns to Avoid

- ❌ Starting with Wikipedia-style definitions
- ❌ Showing production/complex code before minimal code
- ❌ Skipping the hand-trace ("just run it and see")
- ❌ Moving forward when the user can't explain Step 1
- ❌ Teaching without tying to a real hardware/embedded context (when applicable)
- ❌ Listing follow-up topics without explaining WHY they connect

---

## Example Teaching Flow (With Interactions)

When teaching a concept, the actual conversation should alternate between **content delivery** and **interaction**:

```
--- CONTENT DELIVERY PHASE ---
[Teacher]: Step 1 — Motivation story + pain point
[Teacher]: 🔄 Checkpoint — "Does this problem make sense to you?"

--- INTERACTION PHASE ---
[User]:  "Yes, I see why this is needed"
[Teacher]: ✅ Great, moving to Step 2...

--- CONTENT DELIVERY PHASE ---
[Teacher]: Step 2 — Analogy with mapping table
[Teacher]: 🔄 Checkpoint — "Try explaining the analogy in your own words"

--- INTERACTION PHASE ---
[User]:  "Hmm, I'm not sure how X maps to Y"
[Teacher]: Let me clarify that mapping... [re-explains]
[Teacher]: 🔄 "Does the analogy click now?"

--- INTERACTION PHASE ---
[User]:  "Yes, got it!"
[Teacher]: ✅ Moving to Step 3...
```

**Key rules for the teacher:**
- Never deliver 2 content steps in a row without an interaction check in between
- If the user gives a short answer ("yes"), probe deeper with "explain in your own words"
- If the user asks a question, answer it fully before proceeding
- Always show the progress bar at the start of each content step

---

## Quick Reference Card

```
Concept arrives
    ↓
1. Motivation    → What pain does it solve?
                   🔄 "Does this problem feel real to you?"
    ↓
2. Analogy       → Physical real-world model
                   🔄 "Explain it back to me in your words"
    ↓
3. Minimal code  → Annotated, stripped down
                   🔄 "Which line is the 'magic' here?"
    ↓
4. Hand trace    → Paper, step by step
                   🔄 "What surprised you at the boundary?"
    ↓
5. Feynman       → 4 questions, no peeking → find gaps
                   🔄 Score → go back or proceed
    ↓
6. Break it      → Mutation table → explore edges
                   🔄 "Which bug would be hardest to find?"
    ↓
7. Rebuild       → Closed-book + real scenario
                   🔄 "How much did you remember? Be honest."
    ↓
8. Chain         → Deeper / adjacent / system context
                   🔄 "What's your confidence to use this in a project?"
    ↓
✅ Done!  → Celebrate + point to next topic
```

---

## 📅 动态学习计划调整规范（核心规范，必须遵守）

### 核心原则

> **🔴 学习计划是活的，不是死的。每次学习前都要重新评估，而不是机械执行计划。**

学习计划不是固定的，必须根据用户的学习情况动态调整。当发现用户掌握程度不同，需要灵活调整后续内容。

**每次学习开始前，教师必须先做"状态评估"：**

```
┌─ 每日状态评估 ────────────────────────────────────┐
│                                                    │
│  1. 上次学习内容掌握了吗？  → 复习自测             │
│  2. 今天精力状态如何？      → 决定学习强度          │
│  3. 今天有多少时间？        → 决定学习量            │
│  4. 有没有想重点学的内容？  → 兴趣驱动              │
│  5. 项目中遇到什么问题？    → 问题驱动              │
│                                                    │
│  综合判断 → 今天做什么：                            │
│  A. 推进新内容（状态好+时间多）                     │
│  B. 深入练习旧内容（状态好但上次没掌握）             │
│  C. 纯复习（状态一般或时间少）                      │
│  D. 降低难度/休息（状态差）                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 调整触发条件

#### 一、基于掌握程度的调整

**需要加速的情况**（用户掌握很快）：
- 用户连续3个自测题评分 9-10/10
- 用户能主动提出深入问题
- 用户能举一反三，将概念应用到新场景
- 用户说"这个我懂了，继续吧"

**需要减速的情况**（用户掌握困难）：
- 自测题评分连续低于 6/10
- 用户说"太快了"、"没理解"、"等等"
- 用户回答问题时犹豫或错误
- 用户无法用自己的话解释概念

**需要回退的情况**（用户完全没理解）：
- 自测题评分 0-3/10
- 用户说"不知道"、"完全不懂"
- 基础概念都没掌握

#### 二、基于每日复习情况的调整

| 复习情况 | 调整策略 |
|----------|----------|
| 上次内容复习全对（9-10/10） | 可以推进新内容，适当加速 |
| 上次内容复习部分对（7-8/10） | 先补充上次的薄弱点，再推进 |
| 上次内容复习大部分错（5-6/10） | 今天不学新的，专注巩固上次内容 |
| 上次内容复习几乎全错（0-4/10） | 回退到更基础的内容，重新讲解 |
| 隔了很久没复习（遗忘） | 先做全面复习，确认记忆后再推进 |

#### 三、基于外部因素的调整

| 因素 | 情况 | 调整策略 |
|------|------|----------|
| **时间** | 只有15分钟 | 只做复习，不学新内容 |
| **时间** | 有1小时+ | 可以推进新内容+练习 |
| **精力** | 疲劳/困倦 | 降低难度，只做轻松的复习 |
| **精力** | 精力充沛 | 可以挑战高难度内容 |
| **间隔** | 连续学习（每天） | 正常节奏推进 |
| **间隔** | 隔了3天+ | 先复习再推进 |
| **间隔** | 隔了一周+ | 全面复习，可能需要重新学部分内容 |
| **应用** | 项目中遇到了相关问题 | 优先解决实际问题，以此为切入点学习 |
| **兴趣** | 对某个话题特别感兴趣 | 可以临时调整顺序，优先学感兴趣的 |

### 调整策略

#### 策略1：加速（用户掌握很快）

```
原计划：Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8
调整后：Step 1 → Step 2 → Step 5（跳过3、4）→ Step 7 → Step 8
```

**具体做法**：
- 跳过Step 3（最小代码）和Step 4（手写追踪）
- 直接进入Step 5（费曼检验）
- 如果费曼检验通过，直接进入Step 7（重建）
- 减少重复练习，快速推进

**示例对话**：
```
用户：这个我懂了，继续吧
教师：好的！快速测试——用一句话解释[概念]的核心思想？
用户：[正确回答]
教师：完美！跳过代码追踪，直接进入下一阶段
```

#### 策略2：减速（用户掌握困难）

```
原计划：Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8
调整后：Step 1 → Step 2 → Step 2补充 → Step 3 → Step 3补充 → Step 4 → ...
```

**具体做法**：
- 在当前步骤增加更多解释和示例
- 用不同的角度重新讲解同一个概念
- 增加更多类比和对比
- 增加更多练习题

**示例对话**：
```
用户：这个没理解
教师：没关系！让我换个角度解释...
[换一个不同的类比]
教师：这个类比清楚吗？
用户：清楚了
教师：好的，我们再做一道练习题确认一下
```

#### 策略3：回退（用户完全没理解）

```
原计划：Step 4（手写追踪）
调整后：Step 1（重新建立动机）→ Step 2（新类比）→ Step 3 → Step 4
```

**具体做法**：
- 回到Step 1，用不同的场景重新建立动机
- 用全新的类比重新建立心智模型
- 从最简单的例子开始
- 降低学习难度，逐步引导

**示例对话**：
```
用户：完全不知道
教师：没关系！让我用一个更简单的例子...
[用全新的、更简单的类比]
教师：这个例子你理解吗？
用户：理解了
教师：好的，那我们从这里开始，一步一步来
```

### 调整时机

**每完成一个步骤后**：
- 询问用户："这个理解了吗？"
- 根据回答决定是否调整

**自测题后**：
- 根据评分立即调整
- 低分：回退或减速
- 高分：加速或跳过

**用户主动反馈时**：
- 用户说"太快了"：立即减速
- 用户说"太慢了"：立即加速
- 用户说"没理解"：立即回退

### 记录调整

每次调整后，记录到复习文档中：

```markdown
### 学习调整记录

**调整1**：
- **原因**：连续3题评分9-10/10
- **调整**：跳过Step 3、4，直接进入Step 5
- **结果**：用户顺利掌握

**调整2**：
- **原因**：Step 4自测题评分3/10
- **调整**：回退到Step 2，用新类比重新讲解
- **结果**：用户理解了
```

### 注意事项

1. **不要机械执行计划**：计划是指导，不是束缚
2. **关注用户反馈**：用户的表情、语气、回答都是信号
3. **灵活调整**：可以跳过、回退、加速、减速
4. **记录调整**：方便复习时了解学习过程
5. **保持沟通**：随时询问用户感受
6. **复习文档规范**：复习文档只放核心知识点、关键代码、常见问题、数据流、知识链
   - 不要在复习文档中放破坏测试内容，破坏测试是学习过程中的环节，不属于复习文档
   - 如果某个知识点属于高频面试考点（即 rtos项目高频面试点.md 中的内容），在复习文档中必须标注：> 面试高频考点详见 rtos项目高频面试点.md


7. **高频面试点教学规范**：
   - 当学习内容涉及 rtos项目高频面试点.md 中的考点时，**必须带用户查看对应的面试点**
   - **禁止照搬文档原文作为答案**。正确做法是：
     1. 先用文档中的标准答案作为参考
     2. 结合用户在本轮学习中的实际回答和理解
     3. 为用户**量身定制**一个面试答案——用用户自己的话、用户理解的深度来组织
     4. 答案要口语化、自然，像在面试现场说话，不要像在背书
   - 面试点答案的结构：先用用户已经掌握的知识串起来，再补充用户遗漏的关键词
   - 如果用户的回答已经覆盖了核心要点，只需帮他精炼表达，不要推翻重来
   - 每个面试点都标注：面试高频考点详见 rtos项目高频面试点.md
### 调整示例

#### 示例1：用户掌握很快

```
原计划：系统数据流学习（预计30分钟）
实际情况：用户连续答对，理解很快
调整：跳过详细代码追踪，直接进入核心概念
结果：15分钟完成，节省15分钟
```

#### 示例2：用户掌握困难

```
原计划：系统数据流学习（预计30分钟）
实际情况：用户对互斥量概念不理解
调整：增加互斥量专项讲解（+20分钟）
结果：50分钟完成，但用户真正理解了
```

#### 示例3：用户完全没理解

```
原计划：系统数据流学习（预计30分钟）
实际情况：用户对任务间通信完全不懂
调整：回退到"为什么需要多个任务"的基础问题（+30分钟）
结果：60分钟完成，从基础开始建立理解
```
