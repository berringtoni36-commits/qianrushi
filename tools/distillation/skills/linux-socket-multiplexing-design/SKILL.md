---
name: linux-socket-multiplexing-design
description: "Use when designing or debugging a Linux TCP or UDP server with message framing, partial reads, connection lifecycle, select, poll, epoll, nonblocking I/O, backpressure, or readiness events. Trigger phrases include “TCP 半包”, “粘包怎么处理”, “epoll 服务器”, “EAGAIN”, and “连接关闭”. Do not use for build failures, generic Socket API lookup, or FreeRTOS communication."
metadata:
  source_files:
    - archive/大丙Linux教程/第4章 套接字通信/01 套接字 socket.md
    - archive/大丙Linux教程/第4章 套接字通信/04 服务器并发.md
    - archive/大丙Linux教程/第4章 套接字通信/05 TCP数据粘包的处理.md
    - archive/大丙Linux教程/第4章 套接字通信/07 IO多路转接（复用）之select.md
    - archive/大丙Linux教程/第4章 套接字通信/08 IO多路转接（复用）之poll.md
    - archive/大丙Linux教程/第4章 套接字通信/09 IO多路转接（复用）之epoll.md
  source_symbols: [socket, bind, listen, accept, recv, send, select, poll, epoll_create, epoll_ctl, epoll_wait]
  tags: [linux, socket, tcp, udp, epoll, networking, debugging]
  related_skills: [linux-fd-process-io-debugging, embedded-bus-selection, linux-build-debug-chain]
---

# Linux Socket framing 与 I/O 多路复用设计

## R — 来源摘录（Reading）

> TCP 是面向连接的流式传输协议。

来源：`archive/大丙Linux教程/第4章 套接字通信/05 TCP数据粘包的处理.md`。

> 一旦检测到有文件描述符就绪，程序的阻塞就会被解除。

来源：`archive/大丙Linux教程/第4章 套接字通信/07 IO多路转接（复用）之select.md`。

## I — 方法论解释（Interpretation）

Socket 服务端要同时维护三层状态：传输层的字节到达/发送状态，应用层的消息边界和协议解析状态，事件层的 fd 注册、就绪通知和连接生命周期。TCP 只提供有序字节流，`send` 一次对应的字节不会自动对应 `recv` 一次，因此必须在用户态设计 framing，并为半包、合包、非法长度和关闭保留状态。

`select/poll/epoll` 只是等待多个 fd 的机制。就绪意味着某种 I/O 当前有机会不立即阻塞，不代表已经收到一条完整业务消息，也不代表一次调用会消费完所有数据。事件循环的正确性取决于 accept/read/parse/write/close 的状态转移，而不只取决于选择了哪个 API。

## A1 — 资料中的应用（Past Application）

### 案例 1：TCP 长度前缀 framing

- 教程的 `sendMsg`/`recvMsg` 思路是在业务数据外增加长度信息，接收端先读固定头，再按长度循环收齐 payload。
- 这种方法把拆包、合包和半包从“偶发网络问题”变成可测试的协议状态机。

来源：`archive/大丙Linux教程/第4章 套接字通信/05 TCP数据粘包的处理.md`。

### 案例 2：select、poll、epoll 的事件循环

- select/poll 以集合或数组反复提交 fd 并线性检查；epoll 将兴趣注册和等待分开，适合把连接集合长期交给内核维护。
- 无论使用哪种机制，都要对监听 fd 调 `accept`，对连接 fd 处理读写、EOF、错误和再次注册；教材对性能差异的概括需要结合内核、fd 数量和触发模式验证。

来源：`第4章 套接字通信/07 IO多路转接（复用）之select.md`、`08 ...poll.md`、`09 ...epoll.md`。

## A2 — 未来触发场景（Future Trigger）

当用户提出“TCP 粘包/半包”“epoll 收到事件但读不到完整包”“非阻塞 recv 返回 EAGAIN”“连接断开后 fd 集合异常”“高并发服务怎么选 select/poll/epoll”“发送缓冲积压和背压”等问题时触发。

若用户只是问 `socket` 函数参数，先做普通 API 解释；若问题是 fd 继承、管道端点或共享内存，则转给 `linux-fd-process-io-debugging`；若是 UART/SPI/CAN 物理链路选择，则转给 `embedded-bus-selection`。

## E — 可执行步骤（Execution）

1. **定义消息合同**：明确固定长度、分隔符、长度前缀或自描述格式；规定最大长度、字节序、校验、版本、超时和非法包处理。
2. **建立连接状态机**：每个 fd 保存接收缓冲、已解析偏移、待发送队列和关闭原因；监听 fd 只负责 accept，连接 fd 分别走 read/parse/write 分支。
3. **正确处理短 I/O**：read/recv 返回值要区分正数、0、`EINTR`、`EAGAIN/EWOULDBLOCK` 和其他错误；解析循环只在缓冲足够时消费完整帧，发送循环处理部分写和背压。
4. **选择并验证复用器**：按平台、连接规模、可移植性、ET/LT、非阻塞策略和 fd 生命周期选择 select/poll/epoll；用拆包、合包、慢消费者、RST、EOF、重连和 fd 复用测试回归。

## B — 边界与风险（Boundary）

- 不把“有可读事件”解释成“一定有一条完整消息”；必须保留解析状态。
- 不把 TCP 粘包归因于 TCP 错误，也不把 UDP 报文语义直接套到 TCP。
- 不因为 epoll 常用于高并发就无条件宣称它更快；事件模式、非阻塞循环和用户态处理才是整体性能的一部分。
- 教程中的 select fd 上限、系统调用开销和 ET/LT 细节必须按目标 libc/内核文档核对。
- 不用于 STM32 DMA/UART 事件交接、FreeRTOS 任务同步或 Linux 用户态构建错误。

## 相关 Skills

- `linux-fd-process-io-debugging`：分析 fd 继承、dup2、管道、进程和线程共享状态。
- `linux-build-debug-chain`：程序尚未完成编译/链接/加载时使用。
- `embedded-bus-selection`：选择 UART、RS485、SPI、I²C 或 CAN 等嵌入式总线时使用。

## 审计信息

- **代码职责**：本 Skill 组织 `accept/recv/send/select/poll/epoll_*` 的状态和证据，不复制完整服务器代码。
- **环境依赖**：Linux 网络栈、目标内核/‌libc、Socket 阻塞属性和应用协议。
- **三重验证**：V1 跨文档 ✓；V2 新问题预测 ✓；V3 独特方法 ✓。
