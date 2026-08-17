# Linux 教程术语表

| 术语 | 解释 |
|---|---|
| 文件描述符 | 进程级整数句柄，用于访问文件、管道、终端和 Socket；复制 fd 与复制底层打开状态不是一回事。 |
| open file description | 内核中记录文件偏移、状态标志等的对象；`fork` 后父子 fd 可能指向同一对象。 |
| framing | 通过长度前缀、分隔符、固定长度或自描述格式在 TCP 字节流中恢复业务消息。 |
| 就绪 | 内核判断某 fd 进行某种 I/O 不会立刻阻塞；仍要处理短读、EOF、错误和 `EAGAIN`。 |
| ET/LT | epoll 边缘触发/水平触发；ET 通常要求非阻塞循环消费直到 `EAGAIN`。 |
| 动态加载器 | 进程启动或显式加载共享库时解析依赖、映射对象和重定位符号的运行时组件。 |
| `fork` / `exec` | `fork` 创建父子执行实体；`exec` 替换当前进程映像，不创建新 PID。 |
| `waitpid` / `SIGCHLD` | 父进程回收子进程并读取状态；信号是状态变化通知，不替代回收循环。 |
| 守护化 | 通过 fork/setsid 等改变会话/终端关系的启动步骤，不自动提供监督、日志或单实例合同。 |
| 条件变量谓词 | 由 mutex 保护、被 `while` 重检的共享状态条件；唤醒不是资源票据。 |
| joinable / detached | joinable 线程需由责任者 join；detached 不能再 join，但仍需证明不再访问共享对象后才能释放它。 |
| NAPI poll | 网卡接收路径中由硬件中断唤醒、再批量轮询 Ring Buffer 的内核接收机制；不等于用户态 `poll`/`epoll` 就绪等待。 |
| `NET_RX` / softirq | Linux 网络接收软中断类型及其延迟处理路径；`/proc/softirqs` 通常给出累计计数，诊断要看时间增量。 |
| Ring Buffer / `overruns` | 网卡驱动接收环形缓冲及处理不及的统计线索；RX `overruns` 不能直接等同 TCP 或业务层丢包。 |
| `struct sk_buff` | Linux 网络栈承载网络包的内核缓冲对象；资料用它连接 Ring Buffer 接收与后续协议栈处理，具体驱动分配/回收需按目标内核核对。 |
