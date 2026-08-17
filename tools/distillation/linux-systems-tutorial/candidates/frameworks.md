# Linux 教程候选框架

## l01 构建—加载—运行证据链

```yaml
id: l01
title: 构建—加载—运行证据链
type: framework
source_files:
  - archive/大丙Linux教程/第1章 Linux 基础/07 GCC.md
  - archive/大丙Linux教程/第1章 Linux 基础/08 静态库和动态库.md
  - archive/大丙Linux教程/第1章 Linux 基础/09 Makefile.md
  - archive/大丙Linux教程/第1章 Linux 基础/10 GDB调试.md
summary: 将预处理、编译、汇编、链接、动态加载、运行和调试作为不同证据节点，先确认故障发生在哪一层，再修改命令或代码。
```

## l02 文件描述符统一 I/O 模型

```yaml
id: l02
title: 文件描述符统一 I/O 模型
type: framework
source_files:
  - archive/大丙Linux教程/第2章 文件IO/01 文件描述符.md
  - archive/大丙Linux教程/第2章 文件IO/02 Linux系统IO.md
  - archive/大丙Linux教程/第2章 文件IO/04 文件描述符复制和重定向.md
  - archive/大丙Linux教程/第4章 套接字通信/01 套接字 socket.md
summary: 把文件、管道、标准输入输出和 Socket 都先还原为 fd 的创建、复制、读写、阻塞和关闭生命周期。
```

## l03 并发服务的消息与就绪分层

```yaml
id: l03
title: 并发服务的消息与就绪分层
type: framework
source_files:
  - archive/大丙Linux教程/第3章 进程和线程/07 多线程.md
  - archive/大丙Linux教程/第3章 进程和线程/08 线程同步.md
  - archive/大丙Linux教程/第4章 套接字通信/05 TCP数据粘包的处理.md
  - archive/大丙Linux教程/第4章 套接字通信/07 IO多路转接（复用）之select.md
  - archive/大丙Linux教程/第4章 套接字通信/09 IO多路转接（复用）之epoll.md
summary: 分别处理共享状态保护、消息边界恢复和 I/O 就绪通知，避免把“线程安全”“收到事件”“读到完整消息”误认为一件事。
```

