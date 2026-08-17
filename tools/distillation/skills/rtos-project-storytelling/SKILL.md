---
name: rtos-project-storytelling
description: "Use when the user wants a 30-second, 1-minute, 3-minute, or deep-dive interview explanation of the STM32F103 + FreeRTOS range-hood controller, including architecture, tasks, motor control, sensors, state machine, IAP, CRC32, and personal contribution boundaries. Trigger phrases include “讲 RTOS 项目”, “烟机项目面试”, “项目介绍”, “项目深挖”. Do not use for generic FreeRTOS teaching without this project context."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/index.md
    - projects/RTOS项目/RTOS项目完整代码流程详解.md
    - projects/RTOS项目/RTOS项目复习文档.md
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
  source_chapter: projects/RTOS项目/index.md；RTOS项目完整代码流程详解.md
  source_symbols: [STM32F103, FreeRTOS, app_tasks.c, g_systemState, g_dataMutex, KeyScanTask, SensorTask, MotorControlTask, UIDisplayTask, AntiBackflowTask, IAP, CRC32, personal-contribution, evidence-boundary]
  tags: [embedded, project, interview, freertos]
  related_skills: embedded-interview-layered-answer, rtos-task-and-isr-design, rtos-motor-pid-control
---

# RTOS 油烟机项目面试表达

## R — 原文

> 这个项目同时包含按键、电机控制、传感器采集、风速计算、LCD 显示、编码器测速和 IAP 升级，它们的执行周期不同。
>
> — `projects/RTOS项目/RTOS项目复习文档.md`

## I — 方法论骨架

用“产品痛点→系统架构→关键链路→个人贡献→结果与边界”的顺序讲项目。架构层说明驱动层、RTOS 中间层和应用层；调度层说明周期任务、事件任务、共享状态和 ISR；业务层挑一个可讲深的链路，如目标 RPM→编码器→PID→PWM；可靠性层讲 CRC32/IAP 或 HardFault；最后主动承认 IAP 默认宏、平台依赖和未验证部分。短版本只保留一条主链，深挖版本再展开其他模块。

## A1 — 资料中的应用

- 项目文档将 STM32F103、FreeRTOS、传感器、电机、LCD、模式状态机和固件升级组织为完整产品。
- 源码 `app_tasks.c` 真实创建多个任务并使用 `g_systemState`、`g_dataMutex` 和二值信号量。

## A2 — 触发场景

1. 准备嵌入式项目自我介绍或简历项目深挖。
2. 需要分别生成 30 秒、1 分钟、3 分钟版本。
3. 想模拟面试官从架构追问到代码和故障。

语言信号： “帮我讲烟机项目”、“项目亮点怎么说”、“面试官会问哪些细节”、“我的贡献怎么界定”。

## E — 可执行步骤

1. 先确认用户真实参与的模块、平台和可验证结果；缺失信息标为待补，不替用户编造贡献。
2. 选择一条主链，输出背景、架构、难点、方案、结果和边界；完成标准是 1 分钟内能说完且不堆模块名。
3. 生成 5 层追问：为什么用 RTOS、任务如何协作、ISR 如何通知、控制如何闭环、故障如何定位；每题给证据路径。
4. 根据用户回答继续追问，发现源码与文档不一致时切换到事实审计表。

## B — 边界

- 不要把项目资料作者的经历自动归为用户个人贡献。
- IAP 由 `ifopen` 宏控制，讲“支持升级”时必须说明配置和实际验证范围。
- 不适用于脱离烟机项目的通用 FreeRTOS 概念题。

## 相关 Skills

- `embedded-interview-layered-answer`：通用分层回答。
- `rtos-task-and-isr-design`：任务与 ISR 深挖。
- `rtos-motor-pid-control`：电机控制深挖。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
