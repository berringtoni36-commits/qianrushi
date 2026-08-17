# 网络接收路径 IRQ→NAPI→softirq→Socket 诊断候选

## 状态

- 结论：V1/V2/V3 均通过，升格为 `linux-rx-napi-path-diagnosis`。
- 范围：只处理 Linux 网络包接收路径从网卡硬件/DMA/Ring Buffer、硬中断、NAPI poll、NET_RX softirq、`struct sk_buff`、协议栈到 Socket/应用读取的交接诊断。
- 事实边界：来源是通用教程、驱动资料和网络资料；不代表仓库存在用户网卡驱动、目标内核日志、Ring descriptor dump 或真实吞吐/丢包实测。

## 来源与符号

source_files:
  - projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.6 什么是软中断？.md
  - projects/嵌入式八股/2. 小林图解/图解系统/99｜附录/Linux 系统是如何收发网络包的？.md
  - projects/嵌入式八股/2. 小林图解/图解系统/10｜Linux 命令篇/10.1 如何查看网络的性能指标？.md
  - projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md
  - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md

source_symbols: `DMA`, `Ring Buffer`, `NAPI`, `poll`, `NET_RX`, `ksoftirqd`, `/proc/interrupts`, `/proc/softirqs`, `struct sk_buff`, four-tuple, `ip`, `ifconfig`, `ss`, `netstat`, `sar -n DEV`, `tcpdump`, `request_irq`, ISR, bottom half。

## V1 — 跨文档验证

- 机制来源：`2.6 什么是软中断？` 说明硬中断上半部、软中断下半部、`NET_RX`、`/proc/softirqs`、`top`/`ps`/`sar`/`tcpdump` 的观察链。
- 生命周期来源：`Linux 系统是如何收发网络包的？` 独立串起 DMA→Ring Buffer→硬件中断→NAPI poll→软中断→`struct sk_buff`→网络接口层/IP/TCP 或 UDP→四元组→Socket 接收缓冲→应用。
- 指标来源：`10.1 如何查看网络的性能指标？` 补充 `ip`/`ifconfig` 的 RX `errors`/`dropped`/`overruns` 及 `ss`/`netstat` 的 Socket/协议栈观察。
- 独立交叉来源：`糯叽叽八股/10 嵌入式Linux驱动.md` 支撑 ISR 快速不可阻塞、bottom half、DMA/缓冲交接；`糯叽叽八股/05 计算机网络.md` 支撑逐层解封装与 Socket API 交接。
- 判定：高。至少两条独立语境同时覆盖“中断/延迟处理”和“网络包到 Socket”的机制与证据入口。

## V2 — 新问题预测力

新问题：“`NET_RX` 速率很高、RX `overruns` 为零、tcpdump 有包，但应用超时，是否可以断定网卡丢包？”

可由来源推导的答案：不可以。`NET_RX` 只说明网络接收软中断活动，`overruns` 为零不能排除接口层合法性、IP 目的地、TCP/UDP 四元组、Socket 接收缓冲或应用读取断点；应继续比较 `top` 的 `si`、`/proc/interrupts`/`/proc/softirqs` 增量、`sar -n DEV`、抓包、`ss` 和应用 `recv/read` 日志。该问题要求跨层证据，而不是复述某一条命令含义。

另一个可检验推导：“RX `overruns` 在高 PPS 的同一时间窗增加，但 `ss` 的 Socket 仍无数据”时，应先把“Ring/接收处理不及”作为 `[D]` 假设，同时保留协议栈和应用证据，不把接口计数器自动升级为 TCP/业务丢包。

## V3 — 独特性与边界

独特方法是“接收阶段证据链”：`Δ硬 IRQ → ΔNET_RX/softirq → ΔRX dropped/overruns/PPS → tcpdump 捕获点 → skb/协议栈/四元组 → Socket Recv-Q → app recv/read`。核心边界如下：

| 主题 | 本候选 | 兄弟 Skill |
|---|---|---|
| 硬 IRQ、DMA/Ring、NAPI poll、NET_RX、skb 到 Socket | 主责，要求按接收路径分层取证 | — |
| TCP ACK、重传、SYN/accept 队列、qdisc、Keepalive、端到端交付 | 只在“是否到 Socket”处交接 | `linux-tcp-loss-path-diagnosis` |
| TCP 半包/粘包、framing、epoll/select/poll、非阻塞消费、背压 | 明确不展开；NAPI poll 不是用户态 `poll` | `linux-socket-multiplexing-design` |

判定：高。候选不是一般“网络性能指标”清单，而是把硬中断与 Ring/NAPI 的入口证据和 Socket/应用出口证据放在同一条可复盘链上。
