# Linux 教程来源映射

| 核心结论/Skill | 文档证据 | 代码/API证据 | 事实边界 |
|---|---|---|---|
| 构建—加载—运行链 | `第1章 Linux 基础/07 GCC.md`、`08 静态库和动态库.md`、`09 Makefile.md`、`10 GDB调试.md` | `gcc`、`ar`、`ldd`、`gdb`、Makefile 规则 | 具体动态加载顺序依目标系统 `ld.so` 配置 |
| fd 生命周期 | `第2章 文件IO/01 文件描述符.md`、`04 文件描述符复制和重定向.md`、`第4章/01 套接字 socket.md` | `open/read/write/dup2/socket/close` | 父子进程 fd 表复制与 open file description 共享要区分 |
| 并发与同步 | `第3章/07 多线程.md`、`08 线程同步.md`、线程池两篇 | `pthread_mutex_*`、条件变量、信号量、线程池队列 | 调度、内存模型和锁性能依平台与实现 |
| 消息边界 | `第4章/05 TCP数据粘包的处理.md` | `read/recv/send` 循环、长度/分隔 framing | TCP 不保证业务消息边界 |
| 多路复用 | `第4章/07 select.md`、`08 poll.md`、`09 epoll.md` | `select/poll/epoll_ctl/epoll_wait` | fd 上限、ET/LT 和行为依目标内核/库文档 |
| 进程/信号/守护生命周期 | `第3章/01 进程控制.md`、`05 信号.md`、`06 守护进程.md`；IPC 章节作边界 | `fork/exec/waitpid/kill/sigaction/SIGCHLD/setsid/chdir/umask/dup2/mmap/shm*` | 信号递达、PID/进程组、CLOEXEC、生产监督和 IPC 删除需目标系统/源码/strace/ipcs 验证 |
| pthread 同步/线程池关闭 | `第3章/07 多线程.md`、`08 线程同步.md`、`09/10 线程池` | `pthread_mutex_*`、`pthread_cond_*`、`pthread_join/detach`、`threadPoolDestroy`、C/C++ worker | 教程销毁顺序含潜在提前 free 风险；不能把 signal/broadcast 当作 worker 已终止证明 |
| Linux 网络接收路径 / `linux-rx-napi-path-diagnosis` | `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.6 什么是软中断？.md`；`99｜附录/Linux 系统是如何收发网络包的？.md`；`10｜Linux 命令篇/10.1 如何查看网络的性能指标？.md`；`projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md`；`05 计算机网络.md` | `DMA`、Ring Buffer、hardware IRQ/ISR、NAPI `poll`、`NET_RX`、`ksoftirqd`、`/proc/interrupts`、`/proc/softirqs`、`struct sk_buff`、四元组、`ip/ifconfig`、`sar -n DEV`、`tcpdump`、`ss/netstat`、`request_irq` | 教程是通用接收路径和观测方法；计数器为累计值且字段/上下文依目标内核、驱动、工具版本，不能冒充用户网卡驱动实测；与 TCP 端到端丢失及 Socket framing 分工不同 |
