# Test Results — linux-rx-napi-path-diagnosis

- 日期：2026-08-14
- 方法：静态结构与触发路由审查；按 Skill 正文逐条核对正例、兄弟 Skill 诱饵和证据边界。
- 结果：6/6（100%）
- 正例：3；诱饵：2；边界：1
- 诱饵容错：0；兄弟 Skill 混淆用例：`linux-tcp-loss-path-diagnosis`、`linux-socket-multiplexing-design`

## 判定

- `SKILL.md` 包含来源登记、R/I/A1/A2/E/B 六段，并将硬 IRQ、DMA/Ring、NAPI poll、`NET_RX`/softirq、`struct sk_buff`、协议栈、Socket 和应用读取串成可执行证据链。
- 三条正例覆盖软中断 CPU/NET_RX 压力、RX `dropped`/`overruns` 与 Ring 假设、抓包到 Socket 的断点；两条诱饵明确转交 TCP 端到端与 Socket framing/epoll 兄弟 Skill；边界用例拒绝由单次累计快照推出根因。
- 正文明确资料是通用方法，不把资料中的 NAPI/`ksoftirqd`/统计字段冒充用户网卡驱动实测，并要求目标内核/驱动/时间窗证据。

## 限制

这是结构和静态路由审查，不等于真实 Codex 客户端命中率，也没有执行用户网卡驱动、内核跟踪或压力测试。具体 NAPI poll 回调、Ring descriptor、softirq 上下文、IRQ 亲和性和统计字段仍需在目标 Linux 版本核对。
