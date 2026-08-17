---
name: linux-udp-datagram-endpoint-routing
description: "Use when diagnosing Linux UDP endpoint, ephemeral-port, sendto/recvfrom source-address, bind, or reply-routing problems. Trigger phrases include UDP reply goes to the wrong port, recvfrom source address is ignored, client uses a random port, datagrams arrive at one socket but replies disappear, or UDP endpoint contract. Do not use for TCP framing/epoll design, broadcast reachability, or multicast group membership."
metadata:
  source_files:
    - archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
    - archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
    - archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
    - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
    - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
  source_symbols:
    - socket
    - SOCK_DGRAM
    - bind
    - sendto
    - recvfrom
    - sockaddr_in
    - htons
    - INADDR_ANY
  related_skills:
    - linux-udp-broadcast-reachability-contract
    - linux-udp-multicast-interface-membership-contract
    - linux-socket-multiplexing-design
    - linux-fd-process-io-debugging
---

# Linux UDP 数据报端点与回包路由合同

## 来源证据

source_files:
  - archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
  - archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
  - archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
  - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
  - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md

source_symbols:
  - socket
  - SOCK_DGRAM
  - bind
  - sendto
  - recvfrom
  - sockaddr_in
  - htons
  - INADDR_ANY

## R — 来源摘录与事实

- UDP 使用 SOCK_DGRAM；接收端通常 bind 固定端口，用 recvfrom 同时取得发送端地址，再用 sendto 回包。
- 客户端可以不 bind 固定端口，首次发送时由系统选择临时端口；回包必须发往 recvfrom 返回的源 IP 和源端口。
- UDP 是数据报模型，不提供 TCP 那样的连接、字节流拼接、按序和重传保证。

## I — 方法论解释

先把每个数据报写成四元组：源 IP/源端口 → 目的 IP/目的端口。再区分本地 socket 的 bind 合同、内核选择的临时端口、recvfrom 得到的对端地址和 sendto 的目标地址。只有目标地址正确且经过路由/防火墙，应用才可能收到回包。

不要用“客户端知道服务器地址”替代“服务器知道客户端回包地址”。UDP 服务端应以本次 recvfrom 的来源为回包依据，并记录实际绑定地址、端口、网络命名空间和接口。

## A1 — 资料中的应用

- 教程服务器绑定固定端口，recvfrom 保存 cliaddr，sendto 回发 cliaddr。
- 教程客户端发送前不固定 bind，接收时可以不保存服务器地址，因为服务器地址在发送前已知；这只适用于该简单请求/响应流程。
- 广播和组播仍是 UDP 数据报，但它们的目的地址和网卡/成员资格合同不同，不能用普通单播回包逻辑替代。

## A2 — 未来触发场景

- UDP 服务“能收到但回不去”、回包发到 0 端口/旧端口或多客户端串包。
- 用户要解释临时端口、bind、sendto、recvfrom、源地址和端点路由。
- 需要审计设备发现、请求响应或日志中的 UDP 四元组。

## E — 可执行诊断流程

1. 记录 socket 创建参数、bind 地址/端口、网络命名空间和实际接口；用 ss、tcpdump 或 strace 验证而不是只看代码。
2. 在 recvfrom 后打印来源 IP、来源端口、长度和 errno；确认没有把 sockaddr 长度、字节序或地址生命周期写错。
3. 检查 sendto 的目标是否就是当前数据报来源，确认多客户端状态没有共享可变 cliaddr。
4. 用抓包定位层级：没有发出、发错目标、到达网卡但被丢弃、对端收到但应用未读，分别处理。
5. 若问题涉及 TCP 字节流、半包、epoll 或背压，转给 linux-socket-multiplexing-design。

## B — 边界与风险

- UDP sendto 返回成功只表示本地交给内核，不证明对端应用收到或处理。
- 组播接口/入组使用 linux-udp-multicast-interface-membership-contract；广播权限/作用域使用 linux-udp-broadcast-reachability-contract。
- 不把教程客户端随机端口的行为当成所有协议都应如此；协议可能要求固定源端口或显式会话标识。

## 相关 Skills

- linux-socket-multiplexing-design：TCP framing、短读、epoll、非阻塞和背压。
- linux-tcp-loss-path-diagnosis：TCP 队列、网卡、链路和应用交付。
- linux-udp-broadcast-reachability-contract：广播。
- linux-udp-multicast-interface-membership-contract：组播。
