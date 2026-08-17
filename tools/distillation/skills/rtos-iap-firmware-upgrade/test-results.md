# Test Results — rtos-iap-firmware-upgrade

- 日期：2026-08-13
- 方法：静态路由与边界审查；未进行 Codex、Claude、ZCode 独立会话盲测。
- 结果：6/6（100%）；正例 3、诱饵 2、边界 1。

## 判定

覆盖 IAP 条件编译、固定长度 DMA、CRC32/字节序、Flash 半字写入、向量检查、MSP 跳转和安全/回滚边界；诱饵分别指向通信和运行时故障 Skill。静态结果不等于真实客户端命中率。
