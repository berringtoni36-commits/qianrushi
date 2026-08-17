# Test Results — rtos-freertos-config-and-boot

- 日期：2026-08-13
- 方法：静态路由与边界审查；未进行 Codex、Claude、ZCode 独立会话盲测。
- 结果：6/6（100%）；正例 3、诱饵 2、边界 1。

## 判定

覆盖启动链、Cortex-M3 port、FreeRTOS 配置、任务栈、tick 和 IRQ 优先级；诱饵分别指向通信事件链和运行时故障 Skill。静态结果不等于真实客户端命中率。
