---
name: linux-udp-broadcast-reachability-contract
description: "Use when diagnosing Linux UDP broadcast reachability, SO_BROADCAST permission, subnet broadcast address, interface scope, firewall, or why a datagram is not delivered to intended hosts. Trigger phrases include UDP 广播发不出去, SO_BROADCAST, 255.255.255.255, 子网广播地址, or only one interface receives the broadcast. Do not use for ordinary UDP endpoint routing or multicast membership."
metadata:
  source_files:
    - archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
    - archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
    - archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
    - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
    - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
  source_symbols:
    - SO_BROADCAST
    - setsockopt
    - sendto
    - recvfrom
    - INADDR_BROADCAST
    - sockaddr_in
    - bind
  related_skills:
    - linux-udp-datagram-endpoint-routing
    - linux-udp-multicast-interface-membership-contract
    - linux-socket-multiplexing-design
---

# Linux UDP 广播可达性合同

## 来源证据

source_files:
  - archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
  - archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
  - archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
  - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
  - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md

source_symbols:
  - SO_BROADCAST
  - setsockopt
  - sendto
  - recvfrom
  - INADDR_BROADCAST
  - sockaddr_in
  - bind

## R — 来源摘录与事实

- 广播发送端需要在 socket 上设置 SO_BROADCAST，再用 sendto 发往广播地址。
- 接收端仍需要 socket、bind 和 recvfrom；广播不是“所有端口都自动收到”。
- 广播的作用域受网卡、子网、路由器策略和防火墙影响，不能只凭 255.255.255.255 推断跨网段可达。

## I — 方法论解释

广播合同有四层：发送权限、目的地址、出口接口/子网、接收绑定/过滤。SO_BROADCAST 只解决本地权限，不解决地址计算、路由转发、防火墙、网络命名空间或接收端端口。先抓包确认数据报是否从期望接口发出，再查接收端是否绑定正确端口。

## A1 — 资料中的应用

- 教程发送端调用 setsockopt(fd, SOL_SOCKET, SO_BROADCAST, ...) 后 sendto。
- 教程接收端绑定端口后 recvfrom；这与普通 UDP 端点流程相同，但目的地址是广播地址。
- 资料将广播与组播分开讨论；组播有明确的组地址和入组接口，不能用广播地址替代。

## A2 — 未来触发场景

- 设备发现、局域网配置或 UDP 广播在一台机器可见、另一台不可见。
- sendto 报 Permission denied、广播发到错误网卡或跨 VLAN 不可达。
- 需要判断 SO_BROADCAST、子网广播地址、bind 端口和防火墙谁是故障点。

## E — 可执行诊断流程

1. 确认 socket 类型、setsockopt 返回值和 errno；核对是否在发送前设置 SO_BROADCAST。
2. 根据目标接口 IP/掩码计算定向广播地址，分别测试定向广播与有限广播；记录路由表和出口接口。
3. 在发送端和接收端同时用 tcpdump/抓包确认接口、目的地址、端口和数据报长度。
4. 检查接收端 bind 的地址、端口、网络命名空间、iptables/nftables 和交换机/VLAN 策略。
5. 若需求是跨网段一对多或成员可控，评估组播；若只是一对一请求响应，使用普通 UDP 端点合同。

## B — 边界与风险

- SO_BROADCAST 成功不证明网络转发或接收应用成功。
- 广播通常受二层/子网边界限制；不要承诺跨路由器可达。
- 不把广播与组播混合；组播接口和入组交给 linux-udp-multicast-interface-membership-contract。
- 不把 sendto 成功当作可靠交付；需要 ACK、重试和去重时，应在应用层设计。

## 相关 Skills

- linux-udp-datagram-endpoint-routing：普通 UDP 端点和回包。
- linux-udp-multicast-interface-membership-contract：组播。
- linux-tcp-loss-path-diagnosis：TCP 丢包路径，不是广播配置。
