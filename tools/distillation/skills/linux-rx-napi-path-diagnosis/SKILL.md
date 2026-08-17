---
name: linux-rx-napi-path-diagnosis
description: "Use when diagnosing Linux network receive-path anomalies between NIC hardware and application-visible Socket data: hardware IRQ/ISR, DMA into the NIC Ring Buffer, NAPI poll, NET_RX softirq, sk_buff, protocol-stack delivery, Socket receive buffering, and application reads. Trigger phrases include ‘网卡收到但应用收不到’, ‘NET_RX 很高’, ‘ksoftirqd 占 CPU’, ‘RingBuffer 溢出’, ‘NAPI poll’, ‘软中断网络接收’, and ‘硬中断到 Socket 的包路径’. Do not use as the primary skill for TCP retransmission, SYN/accept queues, keepalive, or end-to-end TCP delivery (linux-tcp-loss-path-diagnosis); TCP framing, epoll readiness, nonblocking read loops, or backpressure (linux-socket-multiplexing-design); or generic device-tree/probe/driver lifecycle audits."
metadata:
  source_files:
    - projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.6 什么是软中断？.md
    - projects/嵌入式八股/2. 小林图解/图解系统/99｜附录/Linux 系统是如何收发网络包的？.md
    - projects/嵌入式八股/2. 小林图解/图解系统/10｜Linux 命令篇/10.1 如何查看网络的性能指标？.md
    - projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md
    - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
  source_symbols:
    - DMA
    - Ring Buffer
    - hardware interrupt
    - ISR
    - NAPI
    - poll
    - softirq
    - NET_RX
    - NET_TX
    - ksoftirqd/CPU
    - /proc/interrupts
    - /proc/softirqs
    - struct sk_buff
    - TCP
    - UDP
    - four-tuple
    - Socket receive buffer
    - ip
    - ifconfig
    - ss
    - netstat
    - sar -n DEV
    - tcpdump
    - ethtool
    - request_irq
    - irqreturn_t
    - tasklet_schedule
    - queue_work
    - GFP_ATOMIC
  related_skills:
    - linux-tcp-loss-path-diagnosis
    - linux-socket-multiplexing-design
    - linux-driver-device-tree-boundary
---

# Linux 网络接收路径：IRQ → NAPI → softirq → Socket 诊断

用一条“接收包生命周期”把硬件、驱动、软中断、协议栈、Socket 和应用的观察结果对齐：

```text
NIC/DMA → Ring Buffer → hardware IRQ/ISR → NAPI poll → NET_RX softirq
        → struct sk_buff → network-interface/IP/TCP-or-UDP layers
        → four-tuple → Socket receive buffer → application read/recv
```

本 Skill 解决“包在接收路径的哪一个交接点消失、积压或变慢”，不是把某个命令输出直接翻译成用户驱动已实测的结论。资料中的 NAPI、`ksoftirqd`、计数器和命令是通用诊断模型；目标内核、网卡驱动、发行版与运行窗口仍需现场验证。

## 来源登记

source_files:
  - projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.6 什么是软中断？.md
  - projects/嵌入式八股/2. 小林图解/图解系统/99｜附录/Linux 系统是如何收发网络包的？.md
  - projects/嵌入式八股/2. 小林图解/图解系统/10｜Linux 命令篇/10.1 如何查看网络的性能指标？.md
  - projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md
  - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md

source_symbols:
  - DMA
  - Ring Buffer
  - hardware interrupt
  - ISR
  - NAPI
  - poll
  - softirq
  - NET_RX
  - NET_TX
  - ksoftirqd/CPU
  - /proc/interrupts
  - /proc/softirqs
  - struct sk_buff
  - TCP
  - UDP
  - four-tuple
  - Socket receive buffer
  - ip
  - ifconfig
  - ss
  - netstat
  - sar -n DEV
  - tcpdump
  - ethtool
  - request_irq
  - irqreturn_t
  - tasklet_schedule
  - queue_work
  - GFP_ATOMIC

## R — 来源摘录（Reading）

### 接收路径的事实

- `[F]` 网卡收到包后可通过 DMA 把数据放入 Ring Buffer；高包速下逐包硬中断会造成中断开销。Linux 的 NAPI 使用“中断唤醒、poll 轮询”的混合方式：硬件中断处理函数暂时屏蔽网卡中断，唤醒软中断来轮询，直到没有新数据再恢复中断。来源：`projects/嵌入式八股/2. 小林图解/图解系统/99｜附录/Linux 系统是如何收发网络包的？.md` 的“Linux 接收网络包的流程”。
- `[F]` 软中断接收处理会把 Ring Buffer 中的数据放入内核 `struct sk_buff`，随后经过网络接口层合法性/协议类型检查、网络层目的地判断、传输层 TCP/UDP 头解析，再按源 IP、源端口、目的 IP、目的端口四元组找到 Socket，把数据放入 Socket 接收缓冲区；应用再通过 Socket 接口读取。来源同上。
- `[F]` 上半部对应硬中断，负责快速处理硬件请求；下半部对应软中断，延迟处理上半部未完成的工作。`/proc/softirqs` 与 `/proc/interrupts` 分别用于观察软中断与硬中断；`NET_RX` 表示网络接收软中断，`ksoftirqd/CPU` 是可观察的软中断相关内核线程。来源：`projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.6 什么是软中断？.md`。
- `[F]` `/proc/softirqs` 中的数值是系统运行以来的累计次数，诊断应关注变化速率；资料给出的观察方式是 `watch -d cat /proc/softirqs`。`top` 的 `si` 可显示软中断 CPU 使用率，`ps` 可观察 `ksoftirqd`，`sar -n DEV` 可观察网卡收包速率，`tcpdump` 可进一步分析包来源。来源同上。
- `[F]` `ip`/`ifconfig` 可查看网口状态、MTU、地址和收发统计；资料将 `errors`、`dropped`、`overruns`、`carrier`、`collisions` 作为需要关注的错误统计，其中 `dropped` 的解释落在已到达 Ring Buffer 后的丢弃，`overruns` 的解释落在处理不及导致 Ring Buffer 溢出。来源：`projects/嵌入式八股/2. 小林图解/图解系统/10｜Linux 命令篇/10.1 如何查看网络的性能指标？.md`。
- `[F]` 独立驱动资料要求 ISR 快速、不可阻塞，并把耗时工作交给 bottom half、Tasklet 或 Workqueue；它还把中断上下文、DMA 缓冲和用户/内核数据交接列为驱动边界。来源：`projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md` 的 `2.11`、`2.12`、`2.14`。
- `[F]` 独立网络资料把接收端描述为链路层校验/解封装、网络层 IP 解析、传输层端口选择的逐层过程，并把 `socket`/`bind`/`recv`/`recvfrom` 作为应用交接接口。来源：`projects/嵌入式八股/糯叽叽八股/05 计算机网络.md` 的 `1.5`、`1.25`。

### 资料与目标机之间的事实边界

- `[V]` 上述材料是通用教程/八股资料，不是本机网卡驱动、内核版本、IRQ 拓扑或压力测试记录。资料没有证明用户当前驱动真的采用某个 Ring descriptor 布局、某个 NAPI poll 实现或某个 CPU 亲和性。
- `[V]` 资料用“软中断线程”讲解下半部，目标内核可能在中断返回路径直接处理部分 softirq，并在积压时由 `ksoftirqd` 参与；看到 `ksoftirqd` 不能反推所有 `NET_RX` 都由它执行。若报告需要精确上下文，必须补目标内核/驱动源码或运行跟踪。

## I — 方法论解释（Interpretation）

先把“收到了但没到应用”拆成不同断点，不要把所有现象统称为网卡丢包。每个断点都要求一项观测和一个不能越界的结论：

| 接收阶段 | 关键对象 | 资料支持的观察 | 不能直接推出 |
|---|---|---|---|
| 物理/NIC → DMA | 网卡、DMA、Ring Buffer | `ip`/`ifconfig` 的 RX 状态、`dropped`、`overruns`；必要时 `ethtool` 看链路速度 | 不等于协议栈已经看到包 |
| 硬中断/ISR | IRQ、上半部 | `/proc/interrupts` 的累计变化、驱动 ISR 证据 | IRQ 有增长不等于每个包都已被应用消费 |
| NAPI poll/softirq | poll、`NET_RX`、`ksoftirqd` | `/proc/softirqs` 变化率、`top` 的 `si`、`ps` 的 `ksoftirqd` | `NET_RX` 高不等于 Ring 溢出或业务丢包 |
| Ring → `skb` → 接口层 | `struct sk_buff`、帧合法性、上层协议 | `tcpdump` 与 RX 统计在同一时间窗对齐 | 抓到包不等于合法包已经穿过接口层 |
| 网络层/传输层 | IP 目的地、TCP/UDP、四元组 | `tcpdump`、`ss`/`netstat` 的协议/Socket 侧信息 | TCP ACK 或 Socket 状态不属于本 Skill 的充分结论 |
| 传输层 → Socket | Socket、接收缓冲区、`Recv-Q` | `ss`/`netstat`、应用 `recv/read` 日志 | Socket 有数据不等于应用已解析/处理 |
| Socket → 应用 | 应用读调用、消费速度 | 应用日志和 `recv/read` 返回值 | 本 Skill 不负责 framing、epoll 状态机或业务确认 |

诊断时维护一条“时间窗证据链”：`Δ硬 IRQ → ΔNET_RX/softirq → ΔRX 统计/PPS → tcpdump 包 → Socket 队列 → 应用读取`。任一环节只有静态快照时，结论标为 `[U]` 或 `[D]`，不补写成用户驱动实测。

## A1 — 资料中的应用（Past Application）

### 案例 1：NET_RX/软中断 CPU 偏高

资料给出的路径是：先看 `top` 的 `si` 和软中断相关 `ksoftirqd`，再用 `watch -d cat /proc/softirqs` 判断哪类软中断变化快；若 `NET_RX` 快，再用 `sar -n DEV` 找收包较多的网卡，最后用 `tcpdump` 分析来源。非法来源可进入防火墙方向，正常流量则进入硬件能力方向。

这是一条“CPU 软中断压力 → 网卡收包速率 → 包来源”的排查路径，不是“看到 `NET_RX` 高就已经证明应用丢包”。

### 案例 2：RX `dropped`/`overruns` 非零

资料把 `dropped` 和 `overruns` 放在网口 RX/TX 统计中：前者描述包已到达 Ring Buffer 后发生丢弃，后者描述处理速度跟不上、Ring Buffer 可能溢出。应先记录两个采样点的增量，再与 `NET_RX` 变化率、`sar -n DEV` 的收包速率和 `tcpdump` 时间窗对齐。

可检验的推导是：若 `overruns` 与高 PPS、Ring/softirq 处理压力同时上升，可提出“接收处理不及”的假设；若只有历史累计值非零，不能把它归因到当前故障窗口。

### 案例 3：抓包可见但应用不可见

`tcpdump` 只能证明捕获点看到过包。若同一窗口内没有 Ring 统计异常但应用仍读不到，应继续沿合法性、IP 目的地、TCP/UDP、四元组、Socket 接收缓冲和 `recv/read` 逐段核对；不能停在“网卡没丢包”，也不能跳到“应用一定有 bug”。这是由资料中的逐层接收流程推导出的诊断分支，目标机结果仍需 `[U]` 证据。

## A2 — 触发场景（Future Trigger）★

### 应触发

- Linux 主机“网卡有流量但应用收不到”，需要定位硬中断、DMA/Ring、NAPI poll、`NET_RX` softirq、`sk_buff`、协议栈、Socket 或应用交接点。
- `NET_RX` 变化很快、`top` 的 `si`/`ksoftirqd` 占用异常、不同 CPU 的软中断分布值得核对。
- `ip`/`ifconfig` 的 RX `dropped`、`overruns`、`errors` 非零，或高 PPS 下怀疑 Ring Buffer/接收处理跟不上。
- 用户要求用 `/proc/interrupts`、`/proc/softirqs`、`watch`、`sar -n DEV`、`tcpdump`、`ss`/`netstat` 构建接收证据链。
- 用户问“硬中断为什么要下半部”“NAPI 为什么混合中断和轮询”“包怎样从网卡到 Socket”。

### 不应作为主 Skill 触发

- TCP 重传、ACK、SYN 半连接/accept 全连接队列、qdisc/端到端 TCP 丢失、断电/拔线/Keepalive：转 `linux-tcp-loss-path-diagnosis`。如果问题同时涉及接收路径，先用本 Skill 找到“是否到 Socket”的边界，再由兄弟 Skill 处理 TCP 传输与业务交付。
- TCP 半包/粘包、长度前缀 framing、`select`/`poll`/`epoll` 就绪、非阻塞 `EAGAIN`、发送背压：转 `linux-socket-multiplexing-design`。本 Skill 的 `poll` 仅指 NAPI 接收轮询，不是用户态 I/O 多路复用器设计。
- 设备树 `compatible`、platform driver/probe、通用 IRQ 申请/释放、字符设备资源生命周期：转 `linux-driver-device-tree-boundary`，除非用户明确把问题收窄到网卡接收路径的观测交接。
- 通用 fd 泄漏、pipe EOF、fork/exec、mmap 破坏或 FreeRTOS ISR/任务通知：不触发本 Skill。

## E — 可执行流程（Execution）

每一步都输出四列：`观察到什么 | 属于哪一层 | 支持/排除的假设 | 下一项证据`。只在相邻两项时间对齐后升级结论。

### 1. 定义“丢失”与采样窗口

记录接口、方向（RX）、源/目的 IP 与端口（若可见）、故障时间、包速率/业务请求、内核/驱动版本、CPU 数量和应用症状。把症状归类为“抓不到包”“网口统计增加但 Socket 无数据”“Socket 有数据但应用未读”“应用读到但业务处理失败”。

完成标准：报告明确指出“哪一层第一次观察到缺失”，并保留至少两个时间点，避免用累计计数器冒充当前速率。

### 2. 先核对网口与 RX 统计

```sh
ip addr
ip link
ifconfig
ethtool <interface>
```

核对 `RUNNING`/`LOWER_UP`、MTU、IP/MAC/网关、链路速度，以及 RX/TX 的 `errors`、`dropped`、`overruns`、`carrier`、`collisions`。用固定间隔取样计算增量；保留原始输出和接口名。

完成标准：能回答“物理/链路状态是否异常”“RX 统计是否在故障窗口增加”，但不把该层统计直接写成 TCP 或应用丢包。

### 3. 分开硬 IRQ 与 softirq/NET_RX

```sh
cat /proc/interrupts
cat /proc/softirqs
watch -d cat /proc/softirqs
top
ps
```

观察 `/proc/interrupts` 的硬中断变化、`/proc/softirqs` 的 `NET_RX` 变化率、CPU 分布、`top` 的 `si` 和 `ps` 中的 `ksoftirqd`。重点比较同一窗口的变化量与 CPU，而不是比较机器运行以来的绝对累计数。

完成标准：区分“IRQ 没有明显响应”“NET_RX 活跃”“softirq 占 CPU”“某 CPU 分布异常”等现象；不要从 `ksoftirqd` 的存在单独推出 Ring 溢出或 NAPI 实现细节。

### 4. 定位 Ring/NAPI 交接假设

按资料模型复述并核对：`DMA → Ring Buffer → hardware IRQ/ISR → 暂时屏蔽网卡中断 → NAPI poll/softirq 处理 → 无新数据后恢复中断`。把 RX `overruns`/`dropped` 增量与 `NET_RX` 速率、`sar -n DEV` 收包速率对齐。

```sh
sar -n DEV
```

若需要断言具体 driver 的 NAPI budget、descriptor、poll 回调、IRQ affinity 或回收/补充 buffer，先要求目标驱动源码、内核配置或跟踪证据；本仓库资料没有这些用户设备事实。

完成标准：输出“Ring/处理不及”是 `[D]` 还是 `[F]`，并列出支持它的计数器增量；没有直接 Ring/NAPI 证据时标 `[U]`。

### 5. 从 `skb` 走到协议栈

在同一时间窗运行或核对：

```sh
tcpdump -i <interface> -nn
```

检查捕获包是否来自预期接口和来源，是否能看到目标 IP、TCP/UDP 及端口。按资料的接收顺序继续追问：网络接口层是否合法并识别上层协议？网络层是交给本机还是转发？传输层是否能按四元组找到目标 Socket？

完成标准：将“捕获点看到包”“接口层接受”“协议栈送入 Socket”分开写；抓包本身只作为捕获点证据。

### 6. 验证 Socket 交接，不展开 framing

```sh
ss -a
netstat -s
```

结合 `State`、`Recv-Q`、`Send-Q`、本地/远端地址和进程信息，检查目标 Socket 是否存在及接收队列是否变化；再要求应用记录 `recv/read` 的时间、返回长度和错误。若用户的问题是“读取到半条消息”“epoll 可读但协议解析失败”，立即转 `linux-socket-multiplexing-design`。

完成标准：能区分“未找到目标 Socket”“Socket 接收缓冲有积压”“应用没有读取/读取失败”；不能把 `Recv-Q` 非零写成应用已处理，也不能把 `ss` 一次快照写成持续丢包。

### 7. 形成分层结论与有边界的修复建议

用以下证据模式组织报告：

| 证据组合 | 可提出的假设 | 仍需补的证据 |
|---|---|---|
| `overruns` 增量 + 高 RX/PPS + `NET_RX`/`si` 同窗升高 | 接收处理可能跟不上、Ring 有压力 `[D]` | 目标驱动 Ring/NAPI 统计或复现对照 |
| `NET_RX`/`si` 高，但 RX `overruns` 未增加 | softirq/网络处理 CPU 压力 `[D]` | CPU 归属、包类型/来源、目标内核跟踪 |
| `tcpdump` 看到包，RX 统计正常，但 Socket 无数据 | 协议栈合法性、目的地、四元组或 Socket 交接断点 `[D]` | 更靠近协议栈/Socket 的目标机证据 |
| Socket `Recv-Q` 增长，应用没有相应 `recv/read` | 应用消费滞后或读取链异常 `[D]` | 应用日志、读取返回值；若涉及 framing 转兄弟 Skill |

修复建议必须绑定一个已观测断点和回归指标；不要只因 `NET_RX` 高就调 Ring，也不要把资料中的“防火墙/硬件升级”方向写成目标机已验证方案。

## B — 边界（Boundary）★

- 本 Skill 负责接收路径从 NIC/硬中断到 Socket 可见性的分层诊断；它不替代 `linux-tcp-loss-path-diagnosis` 的 TCP 队列、重传、ACK、断连、Keepalive 和端到端业务交付判断。
- 本 Skill 负责识别 Socket 交接点，但不负责 `linux-socket-multiplexing-design` 的 TCP framing、半包/粘包、`select`/`poll`/`epoll` 就绪、非阻塞消费循环或背压设计。这里的 NAPI `poll` 与用户态 I/O 复用 `poll` 不是同一层。
- `/proc/interrupts`、`/proc/softirqs` 和网卡 RX/TX 统计通常是累计值；单次快照不能证明当前速率、因果关系或丢包位置。应使用时间增量并与抓包/应用日志对齐。
- `NET_RX` 变化快、`top` 的 `si` 高或存在 `ksoftirqd`，只说明接收软中断活动/CPU 压力线索，不自动证明 Ring 溢出、协议栈丢包或应用消息丢失。
- `dropped`、`overruns` 属于网口统计语义；它们不能与 TCP 重传、协议栈丢弃、Socket 接收队列缺失或业务未处理互换。输出字段和含义需按目标工具、内核、驱动确认。
- `tcpdump` 是捕获点证据；看到包不等于它已通过合法性检查、命中本机四元组、进入 Socket 或被应用处理。`ss` 的 `Recv-Q` 也不等于业务消费完成。
- 资料给出的 NAPI/softirq 是通用教学模型；精确的 poll 回调、budget、descriptor 回收、IRQ 亲和性、softirq 执行上下文和驱动 drop 计数，必须回到目标内核/驱动源码或运行跟踪。
- 本仓库没有用户网卡驱动、目标机内核日志、IRQ 采样、Ring descriptor dump、压力测试或真实客户端命中记录。因此本 Skill 只能给通用诊断方法，不能宣称用户驱动已采用某方案、某次包已在某层丢失，或某个修复已提升吞吐。

## 相关 Skills

- `linux-tcp-loss-path-diagnosis`：TCP/队列/传输层端到端丢失、ACK、重传、accept 队列、断连与 Keepalive。
- `linux-socket-multiplexing-design`：TCP framing、短读、非阻塞 Socket、select/poll/epoll、就绪和背压。
- `linux-driver-device-tree-boundary`：设备树、platform driver/probe、通用驱动接口、IRQ 注册/释放与资源生命周期。
- `linux-fd-process-io-debugging`：通用 fd、pipe、fork/exec、mmap 和进程 IPC 生命周期。

## 审计信息

- 三重验证：V1 跨来源 ✓；V2 新问题预测 ✓；V3 独特接收路径与兄弟边界 ✓。
- 事实边界：来源是通用教程/驱动与网络资料；不得冒充用户网卡驱动实测。
- 测试：静态路由审查 6/6，见 `test-prompts.json` 与 `test-results.md`；不声称真实客户端命中率。
- 蒸馏时间：2026-08-14。
