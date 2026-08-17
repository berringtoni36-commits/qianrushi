---
name: rtos-key-event-state-machine
description: "Use when explaining or debugging the STM32+FreeRTOS project key input path: 30 ms debounce, tick-based short/long press detection, event consumption, release handling, or the mapping from KEY1/KEY2 events to mode, speed, motor, and buzzer actions. Trigger phrases include “按键没反应”, “短按长按”, “消抖”, “事件一直触发”. Do not use for sensor sampling, generic GUI input, or a pure FreeRTOS scheduling question."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/4 硬件驱动开发/4.3 用户交互/4.3.1 按键状态机：消抖、短按与长按检测.md
    - projects/RTOS项目/RTOS项目复习文档.md
    - projects/RTOS项目/源码/BSP/KEY/key.c
    - projects/RTOS项目/源码/BSP/KEY/key.h
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
  source_symbols: [Key_StateMachine, Key_Scan, Key1_GetEvent, Key2_GetEvent, Key1_ClearEvent, Key2_ClearEvent, KEY_DEBOUNCE_TIME_MS, KEY_LONG_PRESS_TIME_MS, KeyScanTask]
  source_chapter: projects/RTOS项目/文档/4 硬件驱动开发/4.3 用户交互/4.3.1；RTOS项目复习文档.md
  tags: [stm32, freertos, key, debounce, state-machine, ui]
  related_skills: rtos-auto-mode-state-machine, rtos-task-and-isr-design, rtos-project-storytelling
---

# RTOS 按键消抖与事件状态机

## R — 来源摘录（Reading）

> 消抖时间为 30ms，长按时间为 1000ms，使用 `xTaskGetTickCount()` 计时。

来源：`projects/RTOS项目/源码/BSP/KEY/key.h`。

> 上层任务获取事件后需要调用 `ClearEvent()`，否则事件会持续存在。

来源：`projects/RTOS项目/文档/4 硬件驱动开发/4.3 用户交互/4.3.1 按键状态机：消抖、短按与长按检测.md`。

## I — 方法论解释（Interpretation）

把按键问题分成**电平采样、时间确认、状态转换、事件消费、业务映射**五层。

- `Key_StateMachine()` 每次读取引脚和 FreeRTOS tick；按下先进入 `KEY_STATE_DEBOUNCE`，超过 30ms 且仍按下才进入 `KEY_STATE_PRESSED`。
- 在确认按下状态中，保持超过 1000ms 会产生一次 `KEY_EVENT_LONG_PRESS` 并进入 `KEY_STATE_LONG_PRESS`；持续按住时每次扫描覆盖为 `KEY_EVENT_LONG_PRESSING`，释放时产生 `KEY_EVENT_RELEASE`。短按只在未触发长按且释放时产生。
- `KeyScanTask` 每 10ms 调用 `Key_Scan()`，然后将 KEY1 短按映射到模式切换、KEY2 短按映射到档位切换、KEY2 长按映射到电机开关，长按持续/释放映射到蜂鸣器。
- 事件存储是每个按键一个 `event` 字段，不是队列；短按和释放需要上层清除。`KEY_STATE_WAIT_RELEASE` 虽在头文件枚举中定义，但当前 `key.c` 没有专门处理分支，不能把它说成当前运行状态。

## A1 — 资料中的应用（Past Application）

项目的两个按键分别位于 PB1/PB12，按下为低电平；`Key_Init()` 配置上拉输入并初始化 `Key_t`，`KeyScanTask()` 以 10ms 周期扫描。该链路展示了驱动层产生事件、应用层消费事件的分层方式。

## A2 — 未来触发场景（Future Trigger）

当用户说“按键偶发多次触发”“短按被识别成长按”“长按松手还在响”“事件一直不消失”“PB1/PB12 按键怎么映射到业务”时触发。

若问题是任务没有按 10ms 运行、tick 不走或资源阻塞，转 `rtos-task-and-isr-design`；若是按键切换自动模式后的状态行为，转 `rtos-auto-mode-state-machine`。

## E — 可执行步骤（Execution）

1. **先确认电平和采样**：验证 GPIO 端口、上拉、按下电平、`Key_Scan()` 实际调用周期和 tick 频率。
2. **画出事件生命周期**：`IDLE → DEBOUNCE → PRESSED → LONG_PRESS`，分别标注 30ms、1000ms、释放条件和 `longPressTriggered`。
3. **检查消费语义**：确认业务处理后是否清除单次事件；检查是否需要队列，因为当前一个字段无法保存连续多个事件。
4. **核对业务映射**：把事件、状态修改、蜂鸣器反馈和电机动作分别列出来，再用日志验证一次扫描只产生预期动作。

## B — 边界与风险（Boundary）

- 30ms/1000ms 是当前项目宏，不是所有机械按键的通用最佳值。
- 这是轮询式、tick 计时状态机，不是硬件中断去抖，也不是多事件消息队列。
- `KEY_STATE_WAIT_RELEASE` 已声明但当前实现没有使用；文档中的理想状态图要和源码版本区分。
- `event` 字段可能被后续扫描覆盖；若业务必须保留每个事件，应设计队列/环形缓冲，而不是只增加清除调用。

## 相关 Skills

- `rtos-auto-mode-state-machine`：解释按键切换后自动模式内部状态。
- `rtos-task-and-isr-design`：检查按键任务周期、阻塞、优先级和 tick。
- `rtos-project-storytelling`：准备用户交互模块的项目面试回答。

## 审计信息

- 三重验证：V1 ✓ / V2 ✓ / V3 ✓。
- 代码职责：`Key_StateMachine` 负责状态和事件，`KeyScanTask` 负责业务消费；依赖 FreeRTOS tick 和 STM32 GPIO。
