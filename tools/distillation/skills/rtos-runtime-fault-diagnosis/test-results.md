# Test Results — rtos-runtime-fault-diagnosis

- 日期：2026-08-13
- 方法：静态路由与边界审查；未进行 Codex、Claude、ZCode 独立会话盲测。
- 结果：6/6（100%）；正例 3、诱饵 2、边界 1。

## 判定

覆盖 HardFault 现场、栈/堆、IRQ 优先级、空句柄、锁和二分回归；明确把启动解释与 DMA 事件链交给兄弟 Skill。静态结果不等于真实客户端命中率。
