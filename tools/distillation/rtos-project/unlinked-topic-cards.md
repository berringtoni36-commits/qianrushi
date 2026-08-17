# RTOS 项目未回链主题卡（候选登记）

> 这些卡片聚合 `unlinked-review.tsv` 中的文档、target 源文件和变体证据。它们不是新增 Skill，也不等于 Keil 编译、烧录、上板启动或业务运行已完成。

## 候选主题

1. **Keil target 文件组、变体与产物身份**：把工程 XML、startup、宏/Pack、AXF/HEX/MAP 和 Flash/运行证据串成 provenance；优先补现有 `rtos-build-flash-runtime-provenance`。
2. **FreeRTOS queue/event group 内核路径与应用通信**：`queue.c`、`event_groups.c` 是 target 可能使用的内核支撑，但文件在工程里不等于应用实际调用；需回到符号和工程文件组核对。
3. **GPIO/EXTI 中断到任务的事件交接**：把 NVIC 优先级、ISR 合法 API、按键消抖和任务接收连成时序；优先补 `rtos-task-and-isr-design` 与按键 Skill。
4. **共享状态、互斥量与裸指针的一致性边界**：文档设计意图与 `app_tasks.c` 存在不完全一致，候选的独特性在于保留“部分保护”的反例。
5. **LCD UI 与电机驱动的任务/驱动边界**：只作为已有显示反馈和 PID Skill 的来源补证；驱动源码或构建产物不能单独证明硬件动作。
6. **启动文件、port 和 heap 变体的选择边界**：区分 `md/hd`、`ARM_CM3` 和 `heap_4/heap_5` 的当前 target 选择，备用变体降级为参考，不按文件数量新增 Skill。

## 初判与限制

- V1：前四条有文档加源码/配置的交叉支撑；后两条需要工程 target 和源码符号继续核对。
- V2：候选可用于预测编译目标错配、事件丢失、共享状态不一致、启动异常和“文档说有但 target 未编”的问题。
- V3：真正独特的部分是工程/源码/运行证据的边界和文档—源码不一致，不是 FreeRTOS API 定义本身。
- 当前不生成新 `SKILL.md`；需要用户确认后再进入 RIA++ 和压力测试。

## 未处理队列

1. 从 `project.uvprojx` 逐项闭合 43 个 target 源文件与已有 Skill `source_files`。
2. 对 queue/event group、GPIO/EXTI 和共享状态补函数、宏、调用者及 ISR 上下文。
3. 对 startup/port/heap 只保留当前 target 证据，备用变体进入 variant 审计。
4. 在 Keil/板卡/串口证据可用前，不把构建产物、文档性能或动画示例写成实测。
