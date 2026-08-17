---
name: linux-tcp-loss-path-diagnosis
description: "Use when a Linux TCP service appears to lose connections or messages and the fault may be in the application, Socket buffers, SYN/accept queues, qdisc, NIC RingBuffer, or the network path. Trigger phrases include “TCP 丢包怎么定位”, “连接偶尔断”, “accept 队列满”, “ESTABLISHED 但对端死了”, “TCP ACK 了但业务没收到”, and “Keepalive 怎么判断”. Do not use for TCP half-packet/framing or epoll design as the primary topic; do not treat one ping, ss output, or ACK as proof of end-to-end application delivery."
metadata:
  source_book: 图解网络传输层资料集
  source_files:
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.4 TCP 半连接队列和全连接队列.md
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.12 TCP 连接，一端断电和进程崩溃有什么区别？.md
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.13 拔掉网线后， 原本的 TCP 连接还存在吗？.md
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.16 TCP Keepalive 和 HTTP Keep-Alive 是一个东西吗？.md
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.21 没有 accept，能建立 TCP 连接吗？.md
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.22 用了 TCP 协议，数据一定不会丢吗？.md
    - projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.3 TCP 实战抓包分析.md
  source_symbols: [SYN, "SYN+ACK", ACK, listen, accept, backlog, somaxconn, tcp_max_syn_backlog, tcp_abort_on_overflow, tcp_retries2, SO_KEEPALIVE, Keep-Alive, qdisc, txqueuelen, RingBuffer, TCPRcvQDrop, ss, netstat, ethtool, mtr, send, recv, ESTABLISHED, FIN, RST]
  source_kind: network_methodology_plus_linux_queue_and_failure_path_evidence
  tags: [linux, tcp, packet-loss, socket, queue, keepalive, diagnosis]
  related_skills: linux-socket-multiplexing-design, linux-fd-process-io-debugging, linux-build-debug-chain, embedded-bus-selection
---

# Linux TCP 丢包与断连路径诊断

## R — 来源摘录（Reading）

> TCP 连接建立后，数据还要经过 Socket 缓冲区、qdisc、网卡 RingBuffer、中间链路和对端接收路径；“TCP 可靠”只覆盖传输层到对端传输层，不自动覆盖应用处理和持久化。
>
> — `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.22 用了 TCP 协议，数据一定不会丢吗？.md`

> 半连接队列保存收到 SYN 后等待握手完成的连接；第三次握手完成后进入全连接队列，等待进程调用 `accept()`。
>
> — `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.4 TCP 半连接队列和全连接队列.md`

> HTTP Keep-Alive 是应用层复用 TCP 连接；TCP Keepalive 是内核探测空闲连接是否仍可达，二者名称相似但职责不同。
>
> — `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.16 TCP Keepalive 和 HTTP Keep-Alive 是一个东西吗？.md`

## I — 方法论骨架（Interpretation）

先定义“丢了什么”，再按层定位。连接建立失败、TCP 字节未确认、Socket 中有字节但应用没读、应用读到但业务未落盘，是四种不同故障。

将发送/接收路径画成：应用 syscall → Socket send/receive buffer → TCP 状态机/窗口/重传 → qdisc → NIC RingBuffer → 物理/中间网络 → 对端 NIC/内核 → 对端 Socket buffer → 应用 → 业务确认/持久化。

监听端口还要单独画 SYN 队列和 accept 队列；`ss` 在 LISTEN 与非 LISTEN 状态的 Recv-Q/Send-Q 语义不同。全连接队列上限通常受 `min(somaxconn, backlog)` 影响，但必须结合内核版本和服务实际调用确认。

连接生命周期要按事件分支：进程退出通常由本机内核发 FIN；主机断电/不可达没有机会发 FIN，活动连接依赖重传超时，空闲连接若未启用保活可能长期显示 `ESTABLISHED`；拔网线本身不必然立即改变 TCP 状态。

### 各层证据与典型观察点

| 层 | 要回答的问题 | 可用证据/限制 |
|---|---|---|
| 应用 | `send/recv` 返回了什么？消息是否有长度/ID/业务确认？ | syscall 返回值、errno、日志、应用 ACK；`send` 返回不等于对端业务已处理 |
| 监听/连接队列 | 是握手前 SYN 满，还是握手后 accept 队列满？ | `ss`、`netstat -s`、`somaxconn`、`backlog`；字段语义依状态/版本变化 |
| Socket/TCP | 字节是否在缓冲区、窗口是否为零、是否重传？ | `ss -tin`、抓包、`/proc/net/netstat`；ACK 只到 TCP 接收层 |
| qdisc/NIC | 内核排队或网卡 RingBuffer 是否溢出？ | `tc -s qdisc`、`ip -s link`、`ethtool -S/-g`；接口统计可能是累计值 |
| 中间链路 | 丢包从哪一跳开始？ | `ping` 只看端到端 ICMP，`mtr` 受节点限速/ICMP 过滤影响，不能单独证明 TCP 业务路径 |

## A1 — 资料中的应用（Past Application）

### 案例 1：全连接队列溢出

- 资料用 `ss` 观察 LISTEN 的 Recv-Q/Send-Q，用 `netstat -s` 观察 listen queue overflow，并说明全连接队列上限通常由 `somaxconn` 与 `listen(backlog)` 的较小者限制。
- 结论是“队列溢出会丢后续连接/影响建立”，不是“调大一个参数永远解决”；还要看 `accept()` 消费速度和内核策略。

### 案例 2：端到端丢包路径

- 资料把应用拷贝、发送/接收缓冲、qdisc、RingBuffer、网卡、中间路由和对端应用串成链路，并分别给出 `ifconfig`/`ethtool`/`/proc/net/netstat`/`mtr` 等观察入口。
- TCP 重传能提高传输层交付概率，但对端应用若在读取前崩溃，发送方收到 ACK 仍不代表业务消息已处理；应用需要消息 ID、业务确认或服务端对账来闭环。

### 案例 3：异常断连和保活

- 进程崩溃、主机断电、拔网线和空闲未保活的观察结果不同；不能看到 `ESTABLISHED` 就断言对端健康。
- HTTP Keep-Alive 负责复用；TCP `SO_KEEPALIVE` 负责内核探测，两者要在报告中分开。

## A2 — 触发场景（Future Trigger）★

### 用户会在什么情境下需要这个 Skill？

1. Linux TCP 服务偶发连接失败、accept 队列满、SYN 洪峰或请求数上不去。
2. 用户说“TCP 丢包”“ACK 了但业务没收到”“Socket 显示 ESTABLISHED 但对端像死了”，要求沿链路给证据。
3. 需要区分断电、进程崩溃、拔网线、重传超时、TCP Keepalive 和 HTTP Keep-Alive。

语言信号： “TCP 丢包怎么定位”“accept 队列满”“网卡 RingBuffer”“tcp_retries2”“keepalive 和 Keep-Alive”“ACK 了业务为什么没收到”。

### 与相邻 Skill 的区分

- 与 `linux-socket-multiplexing-design` 的区别：本 Skill 追踪丢包、队列、断连和交付边界；半包/粘包、framing、非阻塞 epoll 和 backpressure 的接口设计优先转后者。
- 与 `linux-fd-process-io-debugging` 的区别：本 Skill 处理 TCP/网络路径；纯 fd 泄漏、pipe EOF、fork/exec 和 mmap 破坏优先转前者。
- 与 `embedded-bus-selection` 的区别：本 Skill 不是 UART/SPI/I²C/CAN 选型，也不处理 MCU ISR/DMA 通信。

## E — 可执行流程（Execution）

1. **定义损失语义和复现窗口**
   - 区分连接、TCP 字节、Socket 缓冲中的数据、应用消息和持久化记录；记录方向、四元组、时间、内核/应用版本、阻塞/非阻塞模式。完成标准：能写出“哪一层观察到丢失”。
2. **先查应用 syscall 和协议边界**
   - 记录 `send/recv/accept` 返回值、errno、短写、`EAGAIN`、超时和应用消息长度/ID；检查是否已有应用确认或持久化。完成标准：排除“send 返回成功就等于业务送达”的误判；若主要是半包/粘包，转 `linux-socket-multiplexing-design`。
3. **检查监听与 TCP 状态**
   - 对监听 socket 记录 `ss` 的 LISTEN Recv-Q/Send-Q，核对 `listen(backlog)`、`somaxconn` 和相关 SYN 队列参数；对已连接 socket 检查状态、Recv-Q/Send-Q、窗口、重传和抓包。完成标准：区分 SYN 队列、accept 队列、Socket 缓冲和链路丢包。
4. **检查主机网络栈和网卡**
   - 结合 `tc -s qdisc`、`ip -s link`、`ethtool -S/-g`、`/proc/net/netstat` 和必要的 tcpdump，查 qdisc、RingBuffer、驱动、零窗口、重传和累计 dropped/overrun 计数。完成标准：每个“丢包”结论有计数器、抓包或时间相关证据，不能只凭单个统计字段。
5. **定位中间链路并做对端核对**
   - 用 `ping` 做端到端连通性参考，用 `mtr` 观察路径但考虑 ICMP 限速/过滤；在对端重复检查网卡、Socket 和应用日志。完成标准：不把中间节点对探测包不响应误报为业务 TCP 丢包。
6. **按断连事件解释状态**
   - 进程退出查 FIN/资源回收；主机断电或拔线查重传/超时和是否启用 `SO_KEEPALIVE`；区分 TCP Keepalive 与 HTTP Keep-Alive。完成标准：报告空闲连接的探测策略、超时参数和“ESTABLISHED 不等于对端健康”的条件。
7. **提出有边界的修复和验证**
   - 只有在证据指向对应层时，才调整 backlog/somaxconn、消费速度、缓冲、RingBuffer、流控或应用确认；注明内核版本和默认值差异，并用同一复现窗口回归。完成标准：修复项能对应一个计数器/抓包/业务指标的变化。

## B — 边界（Boundary）★

- TCP ACK 通常只证明对端 TCP 栈已确认相应字节，不证明应用已 `recv`、解析、处理或落盘；需要应用级 ID/确认/对账才能讨论业务可靠性。
- `send()` 成功通常只说明数据进入本端内核发送路径；非阻塞短写、阻塞等待和失败返回要分别处理。
- `somaxconn`、`backlog`、`tcp_max_syn_backlog`、`tcp_abort_on_overflow`、`tcp_retries2` 的含义和默认值依赖 Linux 内核、服务实现和发行版；不要把某篇文章的数字直接套用到目标机。
- `ss` 在 LISTEN 和非 LISTEN 状态的 Recv-Q/Send-Q 语义不同；`ESTABLISHED`、单次 `ping`、单个 `netstat` 计数都不足以证明完整应用链路健康。
- `ping/mtr` 常用 ICMP/UDP 探测，不等于 TCP 业务流量；中间节点可能限速或过滤探测包，必须和 TCP 抓包、接口计数及应用日志交叉验证。
- 进程退出、主机断电、拔网线和对端不可达的 TCP 行为不同；保活只在启用并达到相应定时条件后发挥作用，不能替代业务心跳或消息确认。
- 本 Skill 不负责 TCP 半包/粘包、epoll 就绪语义、通用 fd 生命周期，也不把资料中的实验数字当成用户线上实测。

## 相关 Skills

- depends-on: `linux-socket-multiplexing-design`（需要理解消息 framing、阻塞/非阻塞和消费路径时）
- contrasts-with: `linux-fd-process-io-debugging`、`embedded-bus-selection`
- composes-with: `linux-build-debug-chain`、`embedded-interview-layered-answer`、`linux-memory-source-audit`

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 资料事实：队列、异常断连、Keepalive 与端到端丢包路径均有独立文档支撑；Linux 参数/统计字段保留版本边界。
- 测试：静态盲测 6/6，见 `test-prompts.json` 与 `test-results.md`。
- 蒸馏时间：2026-08-13
