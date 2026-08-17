# 嵌入式核心八股来源边界与去重规则

> 本域资料量大、重复度高。这里按主题主源、派生合并稿、章节索引和附件证据分层，不把每道题或每个 API 拆成 Skill。

## 主源优先级

| 优先级 | 来源 | 处理方式 |
|---|---|---|
| P0 | `projects/嵌入式八股/糯叽叽八股/`、`1. 项目八股/`、`3. 杂七杂八/`、`FreeRTOS 源码解析.md`、`嵌入式高频八股150题.md` | 作为八股主题、项目连接、源码/机制解释的主要阅读入口；结论按主题去重。 |
| P1 | `projects/嵌入式八股/2. 小林图解/` 分章系统/网络资料 | 作为 OS、网络、硬件结构的解释材料；具体版本、内核参数和实验数字需要边界标记。 |
| P2 | `嵌入式高频八股150题/` 分章节 | 作为题目索引和面试练习案例；不把 150 道题机械生成 150 个 Skill。 |
| 派生 | `archive/糯叽叽八股（完整版）.md`、Defuddle/backup/合并稿 | 只做查漏、重复和来源关系审计；不重复计入主结论。 |
| 证据 | EPUB、图片、Canvas、备份和附件 | 保留为证据/关系层；图片或教学图不替代正文/源码/目标实测。 |

## 已覆盖的方法主线

- C/C++：存储期/链接、对象生命周期、内存所有权、结构体二进制合同和数值合同。
- MCU/RTOS：STM32 时钟采样、FreeRTOS 任务/ISR、项目启动和面试表达。
- 通信/网络：UART/SPI/I²C/CAN 选型、UDP 端点/广播/组播、TCP 丢包路径和用户态 Socket。
- ARM Linux：启动链、设备树/驱动边界、虚拟内存回收与 Linux 构建链。
- 面试方法：分层回答、项目事实边界和从八股迁移到项目源码。

## 当前仍是资料层而非新 Skill 的内容

- 单个命令、单个 API、普通定义和重复题目：进入 `GLOSSARY.md`、题目来源或工作台，不单独 Skill 化。
- 小林图解中未建立独立方法论的章节：先按已有生命周期、时序、通信、系统边界去重。
- 网络/OS 教程的版本依赖和实验数字：作为解释线索，不直接写成目标机器实测。
- `嵌入式高频八股150题` 分章：作为练习队列和案例，不代表用户掌握状态。

## 面试事实边界

- 八股资料能支撑机制解释，不自动支撑用户个人项目经历。
- 项目 Skill 必须回到 RTOS、Linux 内存或视觉项目的源码/文档证据；不能用通用八股填充个人贡献。
- 文档中“最佳”“实时”“高性能”等措辞，除非有实验条件、数据和平台，否则只作为待验证主张。

## 原始资料与派生产物

- 原始路径：`projects/嵌入式八股/`（只读）。
- 域概览：[`BOOK_OVERVIEW.md`](tools/distillation/embedded-core/BOOK_OVERVIEW.md)。
- 域索引：[`INDEX.md`](tools/distillation/embedded-core/INDEX.md)。
- 文件级登记：[`source-register.md`](tools/distillation/embedded-core/source-register.md)。

## 未回链覆盖补充（2026-08-14）

- 全量逐文件复核见 [`FULL_COVERAGE_REVIEW.md`](tools/distillation/embedded-core/FULL_COVERAGE_REVIEW.md)。
- 86 条无精确 Skill evidence 的来源行见 [`unlinked-review.tsv`](tools/distillation/embedded-core/unlinked-review.tsv)；其中 81 条是 domain-only/indexed-only，4 条派生备份、1 条附件不升格为 Skill。
- 统计、精确回链口径和去重合同见 [`coverage-supplement.md`](tools/distillation/embedded-core/coverage-supplement.md)。
