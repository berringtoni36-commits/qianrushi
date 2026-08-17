---
name: embedded-bus-selection
description: "Use when the user must choose or compare UART, RS232, RS485, I2C, SPI, or CAN for an embedded design, or diagnose a communication link using distance, speed, node count, duplex, clocking, electrical level, noise, and error-handling constraints. Trigger phrases include “选 UART 还是 SPI”, “RS485 和 RS232 区别”, “通信协议怎么选”, “which bus should I use”. Do not use for generic protocol definitions without a design choice or fault symptom."
metadata:
  source_book: 嵌入式核心资料集 — 个人 Obsidian 知识库
  source_files:
    - projects/嵌入式八股/3. 杂七杂八/1.【图解】5种总线协议：UART、RS232、RS485、I²C、SPI.md
    - projects/嵌入式八股/3. 杂七杂八/2. 从 0 和 1 一步步推导 MCU 通信- 吃透 UART-SPI-I²C-CAN 底层原理.md
    - projects/嵌入式八股/3. 杂七杂八/12. 图解 UART 异步通信.md
    - projects/嵌入式八股/糯叽叽八股/08 通讯协议.md
    - projects/RTOS项目/源码/SYSTEM/usart/usart.c
    - projects/RTOS项目/源码/BSP/DMA/dma.c
    - projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_spi.c
    - projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_i2c.c
  source_symbols: [USART, DMA, SPI, I2C, UART, RS232, RS485, CAN]
  tags: [embedded, bus, protocol, hardware]
  related_skills: embedded-interview-layered-answer, rtos-communication-debugging
---

# 嵌入式通信总线选择

## R — 原文

> 速率、距离、抗干扰能力是互相制约的，没有一种接口在所有场景下都最好。
>
> — `projects/嵌入式八股/3. 杂七杂八/1.【图解】5种总线协议：UART、RS232、RS485、I²C、SPI.md`

## I — 方法论骨架

先把“接口外设”“协议/事务规则”和“物理电平/收发器”分开。再把需求转成约束：设备数量、距离、吞吐、是否需要时钟、单双工、噪声、布线、功耗和错误检测。UART 解决异步点对点收发，但 TTL、RS232 和 RS485 是不同电气实现；I²C 强调地址、ACK 和多节点；SPI 牺牲引脚换取简单高速；CAN 适合多节点、仲裁和较强的错误处理。最终选择要写出取舍，而不是只报一个“最快”的协议。

## A1 — 资料中的应用

### 案例 1：外设接口组合

- 问题：传感器、LCD、调试口和升级链路怎样连接。
- 使用：资料将 UART、SPI、I²C、ADC 和 DMA 按时序、带宽与设备角色区分。
- 结论：同一个产品可以并存多个协议，每条链路承担不同约束。

### 案例 2：RS232/RS485 与 UART

- 问题：为什么 MCU 的 UART 不能直接接 RS232 电平。
- 使用：区分 UART 外设产生的逻辑串行数据与外部收发器的电平标准。
- 结论：协议和电平不匹配时，软件配置正确也无法可靠通信。

## A2 — 触发场景

1. 用户正在做硬件接口选型或评审通信方案。
2. 用户遇到乱码、无 ACK、距离一长就丢包或多设备冲突。
3. 用户需要在面试中比较 UART、SPI、I²C、CAN、RS232 和 RS485。

语言信号： “通信协议怎么选？”、“UART 能不能接 RS485？”、“为什么 I²C 没有数据？”、“长距离用什么总线？”

与相邻 Skill：`rtos-communication-debugging` 负责已有 RTOS 工程的定位；本 Skill 负责选择和比较协议。`embedded-interview-layered-answer` 负责表达结构，不替代工程约束分析。

## E — 可执行步骤

1. 收集距离、节点数、吞吐、时钟、方向、电平、噪声和错误恢复要求；缺失项先列为未知。
2. 用约束排除候选：短距离板内高速偏向 SPI，多节点寻址偏向 I²C，长距离差分偏向 RS485，需仲裁/强错误处理时考虑 CAN；完成标准是至少写出一个被放弃方案及原因。
3. 检查 MCU 外设、收发器、终端电阻、共地/隔离、DMA/中断和帧校验；完成标准是能画出 TX/RX 或总线事务链。
4. 若是故障排查，先用逻辑分析仪/示波器确认电平和时序，再检查软件寄存器与缓存；不要反过来只改波特率碰运气。

## B — 边界

- 不要把理论最大速率当成实际吞吐，也不要脱离线长、负载和收发器谈距离。
- 协议选型不能替代芯片手册、电气规范和 EMC 测试。
- RS485 是物理层/收发器方案，通常还需要上层帧格式、地址和冲突策略。
- 只问“UART 是什么”时应使用普通解释，不必启动选型流程。

## 相关 Skills

- `rtos-communication-debugging`：连接已经落地后的 RTOS 串口/DMA 故障。
- `embedded-interview-layered-answer`：把选型结果组织成面试回答。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
