# 交互实验候选框架

## x01 模型—来源—边界三元审计

```yaml
id: x01
title: 模型—来源—边界三元审计
type: framework
source_files:
  - archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/project-data.js
  - archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/app-core.js
  - archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/tests/project-data.test.cjs
  - archive/项目交互动画/RTOS项目交互学习动画.html
  - archive/项目交互动画/index.html
summary: 对每个交互结论同时核对模型计算、来源符号/路径和边界说明，再用测试确认模型能复现声明的场景。
```

*** Add File: /Users/zhaowenqiang/Library/Mobile Documents/iCloud~md~obsidian/Documents/qianrushi/distillation/interactive-learning-labs/candidates/principles.md
# 交互实验候选原则

- `x02`：教学数据和实测数据分标签。依据：视觉性能页明确区分真实处理结果与教学计算；规则：图表、示例值和项目实测必须分别标注。
- `x03`：测试要覆盖事实边界。依据：物理内存实验的 fault/quizzes/tests 和 RTOS 动画的安全模型提示；规则：测试不仅断言结果，还断言风险、来源和未实现状态。
- `x04`：派生关系不重复计数。依据：Canvas 文件节点、交互实验和项目源码/文档的重复关系；规则：以 Markdown/源码为主证据，Canvas/HTML 为派生验证。

