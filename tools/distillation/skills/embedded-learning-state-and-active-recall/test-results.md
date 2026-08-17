# Test Results — embedded-learning-state-and-active-recall

- 日期：2026-08-14
- 方法：规范结构审查 + 静态路由预期。
- 结果：6/6（100% 静态预期）。
- 正例：3；诱饵：2；边界：1。
- 诱饵容错：0；跨 Skill 混淆：RTOS 通信故障、算法状态推导。

## 限制

当前结果不是 Codex、Claude 或 ZCode 的真实会话命中率。需要在新会话中隐藏 `type` 和 `expected_behavior`，独立判断是否激活及应转交哪个专项 Skill；结果应追加到本文件，不覆盖本次静态基线。
