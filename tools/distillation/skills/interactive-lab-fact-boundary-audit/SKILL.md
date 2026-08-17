---
name: interactive-lab-fact-boundary-audit
description: "Use when auditing an HTML/JavaScript learning experiment, chart, Canvas, quiz, or simulation to determine what is source-grounded, what is derived teaching data, what tests actually cover, and where it must not be presented as measured project fact. Trigger phrases include “这个动画的数据真实吗”, “交互实验审计”, “图表数字来源”, “Canvas 和原文重复吗”. Do not use for ordinary UI styling or standalone embedded-system diagnosis."
metadata:
  source_files:
    - projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md
    - projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.1 全链路手工追踪.md
    - projects/Linux物理内存检测项目/文档/4 深度学习/4.2 主动学习与推演/4.2.2 深度学习路线与VCQ诊断.md
    - projects/linux视觉感知项目/文档/01 项目概述/1.5 系统全景与数据流.md
    - projects/linux视觉感知项目/文档/05 系统集成与性能/5.1 模型轻量化与参数压缩.md
  source_symbols: [eBPF, BCC, Python, curses, source, boundary, LIME, LSTR]
  historical_symbols: [calculateFragmentation, applyThrottle, pipelineSteps, quizzes]
  tags: [learning-lab, audit, provenance, canvas, javascript]
  related_skills: [linux-memory-source-audit, linux-memory-ebpf-pipeline, linux-vision-pipeline-and-optimization]
---

# 交互实验事实边界审计

## R — 来源摘录（Reading）

- Linux 内存项目的学习资料要求把“源码事实、设计意图、文档声称和待验证项”分开，并沿用户态到内核态的完整链路手工追踪。
- 视觉项目的系统文档把输入、增强、模型、输出和性能证据分层；模型轻量化资料要求把参数量、精度和耗时数字绑定到实验口径。
- 当前 vault 快照中没有此前登记的 `archive/项目交互动画/` HTML/JS 源文件，因此不能把历史交互页面或其测试结果当作当前存在的直接证据。

## I — 方法论解释（Interpretation）

交互产物至少包含四种不同证据：主项目文档/源码，实验代码中的模型数据，页面呈现逻辑，以及测试断言。审计的目标不是判断页面好不好看，而是沿 `source → code → boundary → test` 追踪每个结论：它来自哪个符号？代码承担了什么职责？是教学模型、文档转述、派生计算还是硬件/内核实测？测试是否会在数据、公式、状态机或边界说明被改坏时失败？

Canvas、HTML 图表和交互动画多数是派生证据，适合表达关系、流程和主动回忆，不应与它们指向的 Markdown/源码重复计数。教学预设可以验证算法和状态转换的演示逻辑，但不能自动升级为目标系统的运行结果。

## A1 — 资料中的应用（Past Application）

- Linux 内存资料以全链路手工追踪和 VCQ 诊断把探针、Map、指标和源码缺陷分开；这提供了审计交互教学模型时应复用的证据分层。
- 视觉资料把系统数据流、模型部署和性能数字分开；这提供了审计图表或交互页面时核对输入路径、模型分支和测量口径的案例。
- 当前快照只保留这些项目正文和源码证据；历史交互实现若重新出现，必须重新核对其源文件、函数和测试，不能沿用旧路径。

## A2 — 未来触发场景（Future Trigger）

当用户要求判断一个教学网页/Canvas/图表“是否真实”“能否写进面试/简历”“数字是不是实测”“哪些内容来自源码”“改动后测试是否仍覆盖”时触发。若用户直接问物理内存碎片机制，转 `linux-buddy-fragmentation-diagnosis`；若问项目 eBPF 运行链路，转 `linux-memory-ebpf-pipeline`；若问视觉优化本身，转 `linux-vision-pipeline-and-optimization`。

## E — 可执行步骤（Execution）

1. **列证据层**：对每个页面区块/图表/quiz 记录主源文件、派生代码、关键函数/字段和测试文件；路径不存在时先标为历史/缺失证据。
2. **标注事实类型**：分别标为 `源码事实`、`文档声称`、`教学模型`、`派生计算`、`实测记录` 或 `待验证`；默认不把教学模型当实测。
3. **跑语义测试**：检查数据长度、状态转换、公式结果、故障列表、quiz 覆盖和来源/边界字段；必要时做静态 grep 和 Node 测试。
4. **审计重复与矛盾**：把 Canvas/HTML 节点映射回主源，去重；对文档、源码和页面不一致的地方列出“声称—实际—风险—面试可说边界”。
5. **输出可引用结论**：每条结论带相对仓库路径、函数/字段、证据类型和验证状态，不能只写“看起来正确”。

## B — 边界与风险（Boundary）

- 交互页面能打开不代表其模型、公式、代码路径或性能数字正确。
- 交互数据、场景和图表值是教学/派生数据，除非存在独立测量记录，否则不能称为目标内核、芯片或摄像头实测。
- Canvas 是关系导航证据，不是独立正文来源。
- 测试通过只证明测试覆盖到的断言，不证明未覆盖的 UI、硬件、内核版本或性能。
- 不因为页面写着“源码”就跳过真实源码核对；不把团队/资料作者贡献写成用户个人贡献。

## 相关 Skills

- `linux-memory-source-audit`：审计物理内存项目文档和 C/Python 源码的一致性。
- `linux-memory-ebpf-pipeline`：解释 Python/BCC 到 eBPF 探针、Map 和输出的运行链路。
- `linux-vision-pipeline-and-optimization`：解释视觉端到端链路和 NEON/OpenMP 优化。

## 审计信息

- **代码职责**：`calculateFragmentation` 负责教学指标计算，`applyThrottle` 演示节流状态，`pipelineSteps`/`quizzes` 提供教学元数据；它们不是内核/硬件采集器。
- **环境依赖**：Node 测试运行时、浏览器状态、源码快照和目标项目测量环境。
- **三重验证**：V1 文档层交叉 ✓，但当前快照缺少 JS/HTML/tests/Canvas，不能宣称直接代码交叉验证；V2 方法可迁移 ✓；V3 模型与事实边界 ✓。历史函数名仅作待恢复证据标签。
