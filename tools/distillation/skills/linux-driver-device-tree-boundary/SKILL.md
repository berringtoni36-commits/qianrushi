---
name: linux-driver-device-tree-boundary
description: "Use when an embedded Linux issue crosses device tree, platform-device/driver matching, probe resource acquisition, user/kernel interfaces, IRQ context, or driver cleanup boundaries. Trigger phrases include “设备树和驱动怎么匹配”, “probe 没进”, “compatible 不生效”, “驱动资源怎么释放”, “用户态怎么和驱动交互”, and “驱动内存泄漏怎么查”. This repository has tutorial material but no complete corresponding Linux driver implementation; do not present the tutorial examples as the user's project experience."
metadata:
  source_book: 嵌入式核心资料集
  source_files:
    - projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md
    - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
    - projects/嵌入式八股/3. 杂七杂八/5. 嵌入式 ARM Linux 系统架构全解：一文讲透硬件、U-Boot、内核、驱动与应用.md
  source_symbols: [compatible, reg, interrupt, platform_device, platform_driver, probe, remove, devm_platform_ioremap_resource, platform_get_irq, file_operations, read, write, ioctl, mmap, request_irq, free_irq, wait_event_interruptible]
  source_kind: tutorial_methodology_no_project_driver_source
  tags: [embedded-linux, driver, device-tree, platform-bus, user-kernel, resources]
  related_skills: embedded-arm-linux-boot-chain, linux-build-debug-chain, linux-fd-process-io-debugging, embedded-memory-lifetime-and-pool-design, embedded-interview-layered-answer
---

# 嵌入式 Linux 驱动与设备树边界

## Overview

这个 Skill 用于把嵌入式 Linux 的硬件描述、设备模型匹配、`probe()` 资源获取、用户态接口、中断上下文和资源释放串起来排障。它是仓库教程驱动方法论，不是用户已经完成某个 Linux 驱动项目的证明；涉及真实代码时必须先做源码和目标板核对。

## R — 来源摘录（Reading）

> 设备树描述硬件资源和兼容性，驱动通过匹配表与设备节点匹配；匹配成功后 Driver Core 才会调用 `probe()`，驱动在其中获取寄存器、IRQ、时钟、GPIO、复位、电源和 DMA 等资源。
>
> — `projects/嵌入式八股/3. 杂七杂八/5. 嵌入式 ARM Linux 系统架构全解：一文讲透硬件、U-Boot、内核、驱动与应用.md`，5.4

> 用户态通过 `read/write` 传输数据、通过 `ioctl` 发送控制命令，也可以用 `mmap` 映射缓冲区；阻塞读写通常通过等待队列与唤醒配合。
>
> — `projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md`，2.9–2.14

> `request_irq()` 的处理函数不能阻塞或做大量耗时操作；设备资源申请、错误路径、卸载路径应与释放操作成对审计。
>
> — `projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md`，2.11–2.16

## I — 方法论解释（Interpretation）

将问题分成四个边界：

1. **硬件描述边界**：设备树节点的 `compatible`、`reg`、`interrupts`、GPIO/clock/reset 等属性描述“板上有什么、资源在哪里、如何连接”。设备树不是驱动逻辑，也不能替代芯片手册。
2. **匹配边界**：`platform_device` 与 `platform_driver` 通过匹配表进入 `probe()`；`compatible` 不匹配、节点状态关闭、驱动未编译/未加载或总线注册顺序异常，都可能导致 `probe()` 不执行。
3. **运行接口边界**：驱动用 `file_operations` 把内核资源暴露给用户态；`read/write` 偏数据，`ioctl` 偏控制，`mmap` 适合共享大缓冲区。可读/可写不代表数据一致或硬件工作正常。
4. **资源/上下文边界**：`probe()`、IRQ handler、workqueue/thread、`remove()` 的可睡眠性和清理责任不同。中断顶半部要短，耗时工作下放；申请失败和卸载必须释放已经成功获取的前置资源。

排障时要建立“设备树节点 → platform_device → 匹配表 → probe → 资源 → 中断/底半部 → 字符设备/用户接口 → 应用”的证据链，而不是只在 `probe()` 中加日志。

## A1 — 资料中的应用（Past Application）

仓库中的相关材料包含设备树和 `platform_driver` 的示例，例如 `demo_of_match[]`、`demo_probe()`、`devm_platform_ioremap_resource()`、`platform_get_irq()`；也包含 `file_operations` 的 `read/write/ioctl/mmap` 示例、等待队列和 `request_irq/free_irq` 的成对说明。这些是教程示例和面试素材。

**事实边界**：当前仓库没有与这些示例对应的完整 Linux 驱动源码、设备树源码、Kconfig/Makefile、目标板日志或实测结果。因此不能说“用户项目已经实现了设备树驱动”“probe 已成功”“驱动支持零拷贝/中断”等，只能说资料提供了分析和实现模板。

## A2 — 触发场景（Anticipated Trigger）

当用户提出以下问题时触发：

- “设备树 `compatible` 写了但 `probe()` 没进，怎么查？”
- “`reg`/IRQ/clock 在设备树和驱动里怎样对应？”
- “驱动用 `read/write`、`ioctl` 还是 `mmap` 给应用？”
- “中断里应该做什么，为什么要下放 workqueue？”
- “probe 失败或模块卸载后资源泄漏怎么审计？”

若最后可见证据仍在 Boot ROM/U-Boot/内核/rootfs 启动阶段，优先使用 `embedded-arm-linux-boot-chain`；若已经是用户态 fd、半包或进程 I/O，组合 `linux-fd-process-io-debugging` 或 `linux-socket-multiplexing-design`。

## E — 可执行流程（Execution）

1. **固定构建与运行变体**：记录板卡、SoC、内核版本、设备树 blob/源文件、驱动模块、Kconfig、交叉工具链和启动参数。
2. **先查设备树现场**：确认节点存在且 `status` 可用，`compatible` 与驱动 `of_match_table` 完全对应，`reg` 地址/长度、IRQ 触发类型、clock/reset/GPIO phandle 和 pinctrl 均符合硬件资料。
3. **确认设备模型链**：用内核日志、`/sys/bus/platform/devices`、`/sys/bus/platform/drivers` 和绑定状态证明节点是否成为 `platform_device`、驱动是否注册、是否发生匹配以及 `probe()` 返回值。
4. **审计 `probe()` 资源路径**：逐项记录 `devm_*`、`ioremap/iounmap`、`request_irq/free_irq`、时钟/复位/GPIO/DMA 获取与释放；检查每个失败跳转是否回收前置资源。不要把 `devm_*` 与手动释放重复配对。
5. **审计 IRQ 与底半部**：顶半部读取/清除状态并快速入队或唤醒；耗时计算、可能睡眠的操作和用户拷贝放到可睡眠上下文。检查并发、锁、环形缓冲区和丢事件策略。
6. **核对用户接口**：确认 `open/read/write/ioctl/mmap/poll` 的数据方向、长度检查、`copy_to_user/copy_from_user`、阻塞/非阻塞语义、错误码和生命周期；用 `strace`/日志/最小用户程序验证每一跳。
7. **做卸载与压力回归**：重复 bind/unbind、open/close、IRQ 触发、读写、错误注入和 suspend/resume；确认无 use-after-free、挂起等待者、未取消 work/timer 和资源泄漏。

## B — 边界与风险（Boundary）

- `compatible` 匹配成功只说明进入 `probe()` 的条件满足，不证明寄存器地址、电气连接或业务功能正确。
- 设备树是硬件描述输入，不是“自动生成驱动”；资源属性和驱动使用方式仍需芯片手册核对。
- `devm_*` 的自动释放依赖设备生命周期；异步 work、DMA、IRQ 和用户打开的 fd 仍需要正确停止/同步。
- `mmap` 省去部分拷贝不等于零成本或天然安全；缓存一致性、权限、映射长度、生命周期和生产者/消费者协议必须明确。
- `request_irq` 的示例 IRQ 号、`compatible` 字符串和寄存器地址都是教程占位内容，不可直接移植到真实板卡。
- 本仓库没有完整 Linux 驱动项目源码；面试回答时将教程例子称为“通用实现流程/学习资料”，不要称为个人已交付成果。

## 相关 Skills

- `embedded-arm-linux-boot-chain`：按最后可信启动证据定位启动层级。
- `linux-build-debug-chain`：交叉编译、模块链接和加载错误。
- `linux-fd-process-io-debugging`：用户态 fd、阻塞 I/O 和进程间事件边界。
- `embedded-memory-lifetime-and-pool-design`：资源所有权和内存分配风险。
- `embedded-interview-layered-answer`：把驱动机制组织成面试分层回答。

## 审计信息

- 三重验证：V1 ✓（嵌入式 Linux 驱动、应用、ARM 架构三组文档）；V2 ✓（可从 `probe` 不进、资源泄漏、用户态阻塞等新现象推导证据链）；V3 ✓（明确教程示例与用户项目事实边界）。
- 代码职责：来源中的 C 代码是教程示例；仓库没有相应完整驱动源码，故不登记个人项目函数。
- 测试：静态盲测 6/6，见 `test-prompts.json` 与 `test-results.md`。
