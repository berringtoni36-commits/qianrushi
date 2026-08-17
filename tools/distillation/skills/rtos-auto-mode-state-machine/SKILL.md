---
name: rtos-auto-mode-state-machine
description: "Use when explaining or debugging the STM32+FreeRTOS range-hood automatic or anti-backflow mode: Cooking Event thresholds, STARTUP/COOKING/DELAY_OFF transitions, timeout counters, sensor-to-PWM decisions, mode reset, or shared-state races. Trigger phrases include “自动模式”, “Cooking Event”, “延时关闭”, “防回流反复启动”. Do not use for generic finite-state-machine theory or a pure PID tuning question."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/5 系统功能实现/5.1 工作模式：待机、手动、自动、防回流.md
    - projects/RTOS项目/文档/5 系统功能实现/5.2 自动模式状态机与Cooking Event检测.md
    - projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.3 多传感器融合风速算法.md
    - projects/RTOS项目/RTOS项目复习文档.md
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
    - projects/RTOS项目/源码/BSP/WIND/wind_speed.c
    - projects/RTOS项目/源码/BSP/WIND/wind_speed.h
    - projects/RTOS项目/源码/BSP/MQ2/mq2.h
  source_symbols: [AutoModeState_t, AUTO_STATE_STARTUP, AUTO_STATE_COOKING, AUTO_STATE_DELAY_OFF, MotorControlTask, WindSpeed_Update, WindSpeed_IsCookingEvent, AntiBackflowTask, System_SwitchMode, AUTO_MODE_STARTUP_TIME, COOKING_EVENT_TIMEOUT, COOKING_EVENT_DELAY_OFF]
  source_chapter: projects/RTOS项目/文档/5.1-5.2；RTOS项目复习文档.md
  tags: [stm32, freertos, state-machine, cooking-event, anti-backflow, control]
  related_skills: rtos-sensor-acquisition-and-fusion, rtos-key-event-state-machine, rtos-motor-pid-control, rtos-task-and-isr-design, rtos-project-storytelling
---

# 自动模式与 Cooking Event 状态机

## R — 来源摘录（Reading）

> 自动模式内部为 `STARTUP → COOKING → DELAY_OFF`；Cooking Event 消失后进入延时关闭，再次出现则回到 COOKING。

来源：`projects/RTOS项目/文档/5 系统功能实现/5.2 自动模式状态机与Cooking Event检测.md`。

> 当前代码中 `AntiBackflowTask` 直接读写共享状态，未完整使用 `g_dataMutex`。

来源：`projects/RTOS项目/源码/APP_TASK/app_tasks.c` 的 `AntiBackflowTask()`。

## I — 方法论解释（Interpretation）

先区分**工作模式**和**模式内部状态**：`MODE_STANDBY/MANUAL/AUTO/ANTI_BACKFLOW` 是外层模式，`g_autoModeState` 的三个枚举是自动模式内部状态。

- `WindSpeed_Update()` 先对温度、湿度、气体浓度做归一化和固定权重融合，并用 `temp > 26 && humidity > 50 && gas > 100` 产生 `isCookingEvent`。
- `MotorControlTask()` 在 STARTUP 阶段以最小 PWM 运行，假定每轮 50ms 增加 `autoModeCounter`；检测到事件进入 COOKING，60s 无事件则回待机。
- COOKING 阶段使用融合结果映射 PWM；事件消失进入 DELAY_OFF，事件持续超过 60s 回待机；DELAY_OFF 持续 10s 后回待机，期间新事件回 COOKING。
- `System_SwitchMode()` 进入 AUTO 时重置为 STARTUP。防回流由 `AntiBackflowTask()` 用 NORMAL/HIGH 两级阈值控制，但当前代码中其状态读写没有统一锁保护，且极端阈值边界需要单独测试。

## A1 — 资料中的应用（Past Application）

项目中按键可以将外层模式切到 AUTO，`WindSpeedTask` 更新 `cookingEventActive`，`MotorControlTask` 根据该标志推进三段状态机并驱动电机。源码路径分别落在 `System_SwitchMode`、`WindSpeed_Update`、`WindSpeedTask` 和 `MotorControlTask`。

## A2 — 未来触发场景（Future Trigger）

当用户说“自动模式不进 Cooking”“事件消失后怎么关机”“自动模式偶尔提前退出”“防回流反复启动”“状态机的 60 秒/10 秒怎么证明”“文档和代码的状态图一致吗”时触发。

若用户只问传感器阈值/融合公式，转 `rtos-sensor-acquisition-and-fusion`；若只问 PID，转 `rtos-motor-pid-control`；若怀疑任务并发/锁，组合 `rtos-task-and-isr-design`。

## E — 可执行步骤（Execution）

1. 画两层状态图：外层工作模式和 AUTO 内部状态；列出每个状态的电机动作、PWM 来源、计时器和退出条件。
2. 找到事件生产者：检查 `WindSpeed_Update()` 的输入、归一化、阈值和 `WindSpeedTask` 写回时机；确认事件可能以 100ms 级别更新。
3. 找到事件消费者：逐分支核对 `MotorControlTask()` 的计数增量、延时周期、边界比较和状态重置；不要把注释中的“50ms”当成真实时钟测量。
4. 做并发审计：列出每个任务读写的 `g_systemState` 字段，检查锁覆盖、快照一致性和模式切换时的优先级/动作冲突。
5. 对防回流分别测试低于 NORMAL、NORMAL 附近、HIGH、超过 HIGH、模式退出和传感器无效值。

## B — 边界与风险（Boundary）

- `autoModeCounter += 50` 和 `cookingEventCounter += 50` 是基于任务周期的逻辑计数，不是单调 tick 或硬件测量；调度延迟会改变真实时间。
- 文档常把系统状态访问描述为由互斥量保护，但 `MotorControlTask`/`AntiBackflowTask` 存在直接访问，不能宣称完整线程安全。
- Cooking Event 是固定阈值规则，不是机器学习分类器，也没有传感器可信度评估。
- 这个 Skill 不负责 PID 参数调优；自动模式的 PWM 可能是直接映射，手动/防回流又可能进入 PID，需区分链路。

## 相关 Skills

- `rtos-sensor-acquisition-and-fusion`：事件输入与融合算法。
- `rtos-key-event-state-machine`：外层模式切换的按键事件。
- `rtos-motor-pid-control`：手动/防回流的闭环控制。
- `rtos-task-and-isr-design`：共享状态和任务周期审计。

## 审计信息

- 三重验证：V1 ✓ / V2 ✓ / V3 ✓。
- 代码职责：`WindSpeed_Update` 产生事件，`MotorControlTask` 消费并推进 AUTO 状态，`AntiBackflowTask` 管理防回流标志。
