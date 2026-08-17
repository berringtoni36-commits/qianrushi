---
name: rtos-motor-pid-control
description: "Use when the user is explaining or debugging a STM32 motor speed loop involving PWM, encoder feedback, RPM calculation, PID error, integral limiting, output saturation, or tuning. Trigger phrases include “PID 调参”, “电机转速不稳”, “PWM 和 RPM”, “编码器测速”, “闭环控制”. Do not use for general FreeRTOS scheduling or open-loop GPIO motor switching."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/4 硬件驱动开发/4.1 电机控制与反馈/4.1.1 直流有刷电机驱动：H桥电路与PWM互补输出.md
    - projects/RTOS项目/文档/4 硬件驱动开发/4.1 电机控制与反馈/4.1.2 编码器测速原理与定时器编码器模式.md
    - projects/RTOS项目/文档/4 硬件驱动开发/4.1 电机控制与反馈/4.1.3 PID闭环调速算法实现与调参.md
    - projects/RTOS项目/RTOS项目复习文档.md
    - projects/RTOS项目/源码/BSP/PID/pid.c
    - projects/RTOS项目/源码/BSP/PID/pid.h
    - projects/RTOS项目/源码/BSP/MOTOR/motor.c
    - projects/RTOS项目/源码/BSP/WIND/wind_speed.c
    - projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_tim.c
  source_chapter: projects/RTOS项目/文档/4.1；RTOS项目复习文档.md
  source_symbols: [TIM1, TIM4, PWM, CCR, TIM_EncoderMode, TIM_EncoderInterfaceConfig, get_speed, SpeedCalcTask, PID_Calculate, PID_Reset, targetRPM, actualRPM, integral, integral_max, output, output_max, motor_pwm_set]
  tags: [stm32, motor, pid, encoder, control]
  related_skills: rtos-task-and-isr-design, rtos-project-storytelling
---

# 电机测速与 PID 闭环

## R — 原文

> PWM 是控制量，不代表电机真实转速；编码器测速提供实际 RPM，PID 根据 `targetRPM - actualRPM` 修正 PWM。
>
> — `projects/RTOS项目/RTOS项目复习文档.md`

## I — 方法论骨架

控制链必须闭合：档位或模式产生目标 RPM，编码器在固定采样窗口提供实际 RPM，PID 根据误差计算控制量，输出限幅后写入 PWM，电机变化再反馈回来。调参先看符号是否正确、采样周期是否稳定、反馈是否有毛刺、积分是否饱和和输出是否碰限幅，再调整 Kp/Ki/Kd。ISR 只提供时间基准或通知，计算和滤波放进任务。

## A1 — 资料中的应用

- `TIM4` 提供测速周期，`SpeedCalcTask` 调用 `get_speed()` 计算 RPM。
- `MotorControlTask` 设置目标值、调用 `PID_Calculate`，再由 `motor_pwm_set` 写入 TIM1 CCR。
- 项目资料注明 PID 输出限幅为 0~1000，并包含积分限幅与 `PID_Reset`。

## A2 — 触发场景

1. 电机转速达不到目标、震荡、超调或负载变化后恢复慢。
2. 用户要解释编码器、PWM、RPM、PID 的关系或准备追问。
3. 用户需要决定先修采样、符号、滤波、积分还是参数。

语言信号： “PID 怎么调”、“为什么 PWM 不是转速”、“编码器测速抖动”、“电机低速不稳”。

## E — 可执行步骤

1. 验证目标值、编码器方向、计数溢出、采样周期和 RPM 换算；完成标准是静态/低速/负载下误差符号都符合预期。
2. 记录目标、实际、误差、PID 输出和饱和状态；先确认是否存在测量毛刺、积分累积或输出限幅。
3. 在固定工况下先调 Kp，再按稳态误差加入 Ki，只有确有需要才加入 Kd；每次只改变一个变量并保存波形。
4. 若问题源自中断通知或任务调度，转交 `rtos-task-and-isr-design` 或 `rtos-communication-debugging`。

## B — 边界

- PID 参数不能弥补编码器方向错误、采样不稳定或机械饱和。
- 自动模式可能使用风速融合算法，不应强行套用手动模式 PID 解释。
- 资料中的参数和“约几倍加速”是项目条件下的事实，不能外推到所有电机/平台。

## 相关 Skills

- `rtos-task-and-isr-design`：检查测速周期、任务阻塞和 ISR 交接。
- `rtos-project-storytelling`：组织闭环控制项目回答。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
