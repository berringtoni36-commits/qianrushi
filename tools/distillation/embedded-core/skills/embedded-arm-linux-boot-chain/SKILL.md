---
name: embedded-arm-linux-boot-chain
description: Use when the user is learning or debugging an embedded ARM Linux boot failure and can report the last visible stage, such as no serial output, U-Boot works but the kernel is silent, kernel starts but rootfs will not mount, or a service/application fails after login. Trigger phrases include “嵌入式 Linux 启动失败”, “U-Boot 到内核”, “rootfs 挂载失败”, “boot chain diagnosis”. Do not use for a standalone driver API explanation or MCU bare-metal boot without Linux.
source_book: 嵌入式核心资料集 — 个人 Obsidian 知识库
source_chapter: projects/嵌入式八股/3. 杂七杂八/5；糯叽叽八股/11
tags: [embedded-linux, bootloader, rootfs, debugging]
related_skills: embedded-interview-layered-answer, linux-memory-source-audit
---

# 嵌入式 ARM Linux 启动链诊断

## R — 原文

> 上电后系统依次经历 Boot ROM、SPL、DDR 初始化、U-Boot、内核与设备树、驱动、根文件系统和应用启动；不同阶段的失败需要不同排查方式。
>
> — `projects/嵌入式八股/3. 杂七杂八/5. 嵌入式 ARM Linux 系统架构全解...md`

## I — 方法论骨架

把启动看成一条有证据边界的链：Boot ROM/SPL 负责最早期加载和 DDR，U-Boot 负责加载内核、设备树并传参，内核负责初始化架构、内存、驱动和挂载 Rootfs，用户空间再启动 PID 1、服务和应用。排查时先找“最后一个确定成功的阶段”，只检查该阶段到下一个阶段的输入、地址、格式、硬件资源和日志。启动链的层次顺序比“可能原因大全”更重要。

## A1 — 资料中的应用

### 案例：按串口证据分层

- 问题：设备被描述为“系统没启动”。
- 使用：资料把无输出、进入 U-Boot、内核无输出、Rootfs 失败和登录后应用失败分别映射到不同阶段。
- 结论：最后日志位置决定优先检查电源/启动模式、镜像地址、设备树/串口、`root=`/文件系统，还是动态库/权限。

## A2 — 触发场景

1. ARM Linux 板卡无法启动或启动停在某一阶段。
2. 用户需要解释 Boot ROM、SPL、U-Boot、设备树、内核和 Rootfs 的关系。
3. 面试官追问“从上电到应用运行发生了什么”。

语言信号： “没有串口输出”、“U-Boot 能进但内核不启动”、“rootfs 挂不上”、“设备树在哪一层起作用？”

与相邻 Skill：`linux-memory-source-audit` 处理源码设计意图/事实差异；本 Skill 处理启动阶段证据链。`embedded-interview-layered-answer` 只提供表达层次。

## E — 可执行步骤

1. 记录最后一条可信输出、启动介质、SoC/架构、内核版本、设备树和启动参数；完成标准是确定当前阶段。
2. 按阶段检查输入：镜像位置和大小、DDR 初始化、加载地址/入口、设备树兼容与内存、串口、`root=`、文件系统和驱动；完成标准是每个假设都对应一个日志或实验。
3. 用最小改动验证：保存 U-Boot 环境、增加串口日志、替换已知可启动镜像或单独验证存储；判停条件是出现新的确定阶段，再重新定位。

## B — 边界

- 不适用于 Cortex-M 裸机/FreeRTOS 启动故障；那应看 `rtos-task-and-isr-design`。
- 不要在没有最后日志的情况下断言是驱动问题。
- 不同 SoC 的 Boot ROM、SPL、设备树和加载地址差异很大，资料只能提供框架。
- 设备树描述硬件，不等于设备驱动实现。

## 相关 Skills

- `embedded-interview-layered-answer`：组织启动链面试回答。
- `linux-memory-source-audit`：审计内核/eBPF 代码实际行为。

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 测试：静态盲测 6/6。
