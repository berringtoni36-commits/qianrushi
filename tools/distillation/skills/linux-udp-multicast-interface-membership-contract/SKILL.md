---
name: linux-udp-multicast-interface-membership-contract
description: "Use when diagnosing Linux UDP multicast interface selection, IP_MULTICAST_IF, IP_ADD_MEMBERSHIP, bind port, group address, IGMP, or why a receiver does not see multicast datagrams. Trigger phrases include UDP 组播加入错误网卡, IP_ADD_MEMBERSHIP, IP_MULTICAST_IF, 组播收不到, or multiple interfaces and multicast. Do not use for broadcast permissions or ordinary UDP reply routing."
metadata:
  source_files:
    - archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
    - archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
    - archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
    - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
    - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
  source_symbols:
    - IP_MULTICAST_IF
    - IP_ADD_MEMBERSHIP
    - ip_mreq
    - setsockopt
    - bind
    - sendto
    - recvfrom
    - INADDR_ANY
  related_skills:
    - linux-udp-broadcast-reachability-contract
    - linux-udp-datagram-endpoint-routing
    - linux-socket-multiplexing-design
---

# Linux UDP 组播接口与入组合同

## 来源证据

source_files:
  - archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
  - archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
  - archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
  - projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
  - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md

source_symbols:
  - IP_MULTICAST_IF
  - IP_ADD_MEMBERSHIP
  - ip_mreq
  - setsockopt
  - bind
  - sendto
  - recvfrom
  - INADDR_ANY

## R — 来源摘录与事实

- 发送端可以通过 IP_MULTICAST_IF 选择组播出口接口，再用 sendto 发往组播地址。
- 接收端需要 bind 组播端口，并通过 IP_ADD_MEMBERSHIP 加入指定组和接口，然后 recvfrom。
- 组播数据发送到端口 9999 的示例要求接收程序绑定该端口；组播地址、端口和接口共同构成接收合同。

## I — 方法论解释

将组播接收拆为四个必须同时成立的条件：数据报目的为正确组地址、目的端口正确、接收 socket 绑定正确、IP_ADD_MEMBERSHIP 使用正确接口。IP_MULTICAST_IF 影响发送出口，不等价于接收端入组；多网卡机器必须显式记录接口地址或索引。

## A1 — 资料中的应用

- 教程发送端设置 IP_MULTICAST_IF；接收端 bind 后使用 IP_ADD_MEMBERSHIP。
- 发送端和接收端代码都使用 sendto/recvfrom，但它们承担的地址合同不同。
- 广播章节使用 SO_BROADCAST；这说明权限与成员资格是两套机制，不能互换。

## A2 — 未来触发场景

- 用户说 UDP 组播发包成功但接收端收不到，或加入了错误网卡。
- 同一主机多网卡、容器、虚拟网卡或 VLAN 环境下组播行为异常。
- 需要审计组地址、端口、bind、入组、出接口和抓包证据。

## E — 可执行诊断流程

1. 记录组地址、端口、发送接口、接收接口和网络命名空间；用 ip addr、ip route 和 ss 核对实际状态。
2. 检查发送端 IP_MULTICAST_IF 的设置与 sendto 目标，确认数据报从预期接口发出。
3. 检查接收端 bind 地址/端口、ip_mreq 的 imr_multiaddr 和 imr_interface，以及 setsockopt 返回值。
4. 用 tcpdump 在发送接口和接收接口抓包；区分“未发出”“发错接口”“到达主机但未入组”“入组但应用未读”。
5. 检查 IGMP、交换机 snooping、路由、防火墙和容器网络策略；必要时用最小双进程程序复现。

## B — 边界与风险

- setsockopt 成功不证明交换机转发、内核入组或应用读取成功。
- 组播可达性依赖网络设备和内核配置，不能用本机 loopback 结果代表生产网络。
- 不把 IP_MULTICAST_IF 当成 IP_ADD_MEMBERSHIP；不把组播当广播。
- 需要请求响应时，回包地址仍应依据 recvfrom 的来源，使用 linux-udp-datagram-endpoint-routing。

## 相关 Skills

- linux-udp-datagram-endpoint-routing：普通 UDP 端点。
- linux-udp-broadcast-reachability-contract：广播权限和作用域。
- linux-socket-multiplexing-design：组播 socket 加入事件循环后的消费逻辑。
