# 混合意图 Skill 路由对抗矩阵

> 这是基于 description、边界和相邻 Skill 的静态路由预期，用来检查容易串路由的请求是否有明确主入口。它不是 Codex、Claude 或 ZCode 的真实命中率；真实会话盲测仍需在各客户端新会话中独立执行。

- 用例：12
- 证据口径：静态预期，不是客户端实测

| ID | Prompt | Expected primary Skill | Acceptable helper Skill | Must-not-primary Skill | Reason |
|---|---|---|---|---|---|
| `mi-01` | FreeRTOS 调度器没启动，启动后系统像停住了，怎么区分启动链和任务故障？ | `rtos-freertos-config-and-boot` | `rtos-runtime-fault-diagnosis` | `rtos-project-storytelling` | 现象包含调度器启动，但需要把 Reset_Handler、main、创建任务和启动调度器与运行时故障分开。 |
| `mi-02` | DMA 已经报告完成，但 FreeRTOS 任务一直没醒，怎么排查 ISR 到任务的通信链？ | `rtos-communication-debugging` | `rtos-task-and-isr-design` | `rtos-iap-firmware-upgrade` | 核心是通知、信号量、队列和清中断等事件交接，不应因出现 DMA 就直接路由到升级协议。 |
| `mi-03` | STM32 启动后偶发 HardFault，怀疑某个 FreeRTOS 任务栈溢出，给我一套定位顺序。 | `rtos-runtime-fault-diagnosis` | `rtos-task-and-isr-design` | `rtos-project-storytelling` | 用户报告的是运行时故障和栈证据，项目介绍 Skill 不能替代 fault frame、栈水位和资源检查。 |
| `mi-04` | Linux UDP 服务收到请求后总是回到错误端口，客户端的临时端口和 recvfrom 地址应该怎么核对？ | `linux-udp-datagram-endpoint-routing` | `linux-fd-process-io-debugging` | `linux-udp-broadcast-reachability-contract` | 这是单播端点和回包地址合同，不是广播权限或接口可达性问题。 |
| `mi-05` | Linux UDP 广播 sendto 返回 Permission denied，255.255.255.255 和 SO_BROADCAST 怎么查？ | `linux-udp-broadcast-reachability-contract` | `linux-udp-datagram-endpoint-routing` | `linux-udp-multicast-interface-membership-contract` | 显式出现广播地址和 SO_BROADCAST，应优先检查权限、地址、接口和防火墙，而不是组播入组。 |
| `mi-06` | UDP 组播已经加入，但机器有两张网卡，接收端像是选错接口，怎么定位？ | `linux-udp-multicast-interface-membership-contract` | `linux-udp-datagram-endpoint-routing` | `linux-udp-broadcast-reachability-contract` | 问题集中在 IP_MULTICAST_IF、IP_ADD_MEMBERSHIP、bind 端口和 IGMP 接口选择。 |
| `mi-07` | 视觉推理报 tensor shape/rank 不匹配，帮我从输入数量、CHW、mask 到输出解码核对契约。 | `vision-model-tensor-contract-audit` | `linux-vision-build-provenance-audit` | `linux-vision-project-storytelling` | 用户要求核对模型接口和主链真实性，项目面试表达不是首要动作。 |
| `mi-08` | Qt 的 QProcess 读到了上一次视觉结果文件，怀疑帧编号、覆盖顺序和子进程生命周期有问题。 | `linux-vision-file-ipc-lifecycle-audit` | `qt-event-loop-signal-slot-audit` | `vision-model-tensor-contract-audit` | 主要风险是文件型 IPC 的唯一性、完成边界和 QProcess 生命周期，不是 tensor shape。 |
| `mi-09` | Qt 点击按钮后 waitForFinished 或 waitKey 卡住，界面不刷新，怎么审计事件循环？ | `qt-event-loop-signal-slot-audit` | `linux-vision-file-ipc-lifecycle-audit` | `linux-vision-project-storytelling` | 明确的 UI 阻塞和信号槽生命周期应先看事件循环、同步等待、取消与重复连接。 |
| `mi-10` | 优化版二进制到底来自哪个 CMake target？CMakeLists、build 目录和 lime_opt.cpp 对不上。 | `cmake-source-discovery-incremental-build-audit` | `linux-vision-build-provenance-audit` | `linux-build-debug-chain` | 核心是源码成员关系、构建树新鲜度和 target 归属；不是一般编译/链接失败。 |
| `mi-11` | TCP 抓包看到了 ACK，但业务进程没有收到消息，怎么沿应用、Socket、队列和网络路径定位？ | `linux-tcp-loss-path-diagnosis` | `linux-socket-multiplexing-design` | `linux-udp-datagram-endpoint-routing` | ACK 只证明 TCP 层的一段确认，问题需要端到端分层定位，不能套 UDP 端点模型。 |
| `mi-12` | TCP 服务器用 epoll 读到半包和 EAGAIN，帮我设计 framing、非阻塞读循环和连接关闭处理。 | `linux-socket-multiplexing-design` | `linux-tcp-loss-path-diagnosis` | `linux-udp-datagram-endpoint-routing` | 半包、epoll、EAGAIN、背压和连接生命周期属于多路复用与消息边界设计。 |
