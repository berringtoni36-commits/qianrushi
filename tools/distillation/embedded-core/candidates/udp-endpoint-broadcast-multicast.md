# 候选组：Linux UDP 数据报、广播与组播的地址合同

本候选组拆成三个原子 Skill：

1. linux-udp-datagram-endpoint-routing：源/目的 IP 与端口、临时端口、bind、recvfrom、sendto 和回包路由。
2. linux-udp-broadcast-reachability-contract：SO_BROADCAST、广播地址、接口/子网、接收 bind 和防火墙/交换机作用域。
3. linux-udp-multicast-interface-membership-contract：IP_MULTICAST_IF、IP_ADD_MEMBERSHIP、组地址、端口和多网卡入组。

## 来源

- archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md
- archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md
- archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md
- projects/嵌入式八股/糯叽叽八股/05 计算机网络.md
- projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md

## 三重验证

- V1：普通 UDP、广播和组播章节分别给出 API、流程和代码；相邻网络资料提供传输语义。
- V2：可从“能发不能收”“回包到错端口”“组播入错网卡”“广播跨 VLAN 不可达”等新症状反推层级。
- V3：原子边界清晰：普通端点、广播权限/作用域和组播成员资格不是同一套合同。
