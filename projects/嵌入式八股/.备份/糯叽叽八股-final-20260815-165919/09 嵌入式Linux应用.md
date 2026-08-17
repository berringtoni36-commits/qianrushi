---
title: "嵌入式 Linux 应用"
tags: [嵌入式, 面试, 八股]
---

# 嵌入式 Linux 应用

[[projects/嵌入式八股/index|← 总索引]] · [[08 通讯协议|← 上一章：通讯协议]] · [[10 嵌入式Linux驱动|下一章：嵌入式 Linux 驱动 →]]

---

## 1.1 Linux常见指令

### 1.1.1 文件与目录操作

- ls：列出目录内容
- cd：切换目录
- pwd：显示当前路径
- mkdir：创建目录
- rmdir：删除空目录
- rm -rf：删除文件或目录（慎用）
- cp：复制文件或目录
- mv：移动或重命名文件

### 1.1.2 文件查看与编辑

- cat：查看文件内容
- more / less：分页查看文件
- head / tail：查看文件开头或结尾
- vi / vim / nano：文本编辑器

### 1.1.3 文件查找与统计

- find：查找文件
- locate：快速查找文件（依赖索引）
- grep：按内容搜索文件
- wc：统计行数、字数、字符数

### 1.1.4 权限与用户管理

- chmod：修改文件权限
- chown：修改文件所有者
- chgrp：修改文件所属组
- su / sudo：切换用户或以管理员权限执行

### 1.1.5 系统管理

- ps：查看进程状态
- top / htop：实时查看进程和资源使用
- kill / killall：终止进程
- df：查看磁盘空间
- du：查看目录或文件占用空间
- free：查看内存使用情况
- uname -a：查看系统信息

### 1.1.6 压缩与归档

- tar：打包和解包文件（.tar / .tar.gz）
- gzip / gunzip：压缩和解压缩
- zip / unzip：压缩和解压

### 1.1.7 网络相关

- ping：测试网络连通性
- ifconfig / ip addr：查看网络接口信息
- netstat / ss：查看网络连接
- scp / rsync：远程文件传输
- wget / curl：下载文件

### 1.1.8 文本处理与管道

- awk / sed：文本处理
- sort：排序
- uniq：去重
- cut：提取文本列
- **管道（`|`）**：将一个命令输出传给下一个命令
- > / >>：重定向输出到文件

---

## 1.2 系统调用（System Call）的实现

> [!tip] 🔗 项目关联
> - [[projects/嵌入式八股/1. 项目八股/Linux物理内存碎片高频面试题#第 10 题：eBPF 程序是如何通过 bpf() 系统调用进入内核并挂载到目标 Tracepoint/kprobe 上的？|内存项目 10：eBPF 程序是如何通过 bpf() 系统调用进…]]
> - [[projects/嵌入式八股/1. 项目八股/Linux物理内存碎片高频面试题#第 32 题：从用户执行 Python 程序开始，到 eBPF 在内核中采集数据，再到 curses 终端展示，整个项目的完整运行链路是什么？|内存项目 32：从用户执行 Python 程序开始，到 eBPF…]]

### 1.2.1 基本概念

- **定义**：用户程序通过系统调用请求操作系统内核提供服务的机制
- **作用**：提供用户态程序访问内核服务和受保护资源的受控接口；除系统调用外，还可通过设备文件、共享内存、信号等机制协作（具体仍由内核权限规则约束）
- **关键点**：用户态不能直接操作内核数据结构，需要通过系统调用进入内核态

### 1.2.2 系统调用的实现流程

1. **用户程序发起系统调用**
    - 通过库函数（如 printf()、read()、open()）封装系统调用
    - 库函数会把系统调用号和参数准备好
2. **切换到内核态（特权模式）**
    - 通过特定指令触发软中断或异常：
    - x86：int 0x80（老方式）或 syscall（新方式）
    - ARM Cortex-M/Linux：使用 SVC（Supervisor Call）
    - CPU 从用户态切换到内核态，进入系统调用处理程序
3. **内核处理系统调用**
    - 内核根据系统调用号找到对应的内核函数
    - 检查参数合法性，执行对应操作（文件操作、进程调度、内存管理等）
4. **返回用户态**
    - 内核执行完成后，通过返回指令恢复用户态上下文
    - 返回值放在指定寄存器中（如 x86 的 EAX，ARM 的 R0）
    - 用户程序继续执行

### 1.2.3 注意事项

- 系统调用开销大于普通函数调用（上下文切换和特权级切换）
- 参数传递和返回值必须遵循体系结构约定
- 用户态程序不能直接访问内核空间数据，必须通过系统调用

### 1.2.4 总结

- 系统调用是用户程序访问内核资源的桥梁
- 通过库函数发起软中断，CPU 切换到内核态执行服务
- 内核完成操作后返回用户态，保证安全性和系统稳定性

---

## 1.3 pthread_create() 创建线程的基本流程

### 1.3.1 基本概念

- pthread_create() 是 POSIX 线程（pthreads）创建线程的 API
- 功能：在进程中创建一个新的执行流（线程），线程共享进程的地址空间

函数原型：

```c
int pthread_create(pthread_t *thread,
                   const pthread_attr_t *attr,
                   void *(*start_routine)(void *),
                   void *arg);
```

- thread：返回创建的线程 ID
- attr：线程属性（可为空使用默认属性）
- start_routine：线程入口函数
- arg：传递给入口函数的参数

### 1.3.2 创建线程的流程

1. **内核准备线程控制块（TCB）**
    - 内核分配线程控制块结构，保存线程信息（ID、状态、寄存器上下文等）
    - 如果指定了 pthread_attr_t，则设置栈大小、调度策略等
2. **分配线程栈空间**
    - 内核为线程分配独立栈
    - 栈空间大小可通过 attr 设置
3. **初始化线程上下文**
    - 设置程序计数器指向线程入口函数 start_routine
    - 设置栈指针、寄存器初值
4. **将线程加入调度器**
    - 内核将新线程放入可运行队列
    - 根据调度策略（SCHED_FIFO、SCHED_RR、SCHED_OTHER）等待 CPU 调度
5. **返回线程 ID 给用户**
    - pthread_create() 返回 0 表示成功
    - 用户态线程可以通过返回的线程 ID 对线程进行操作（join、detach 等）
6. **线程开始执行**
    - CPU 调度器选择新线程运行
    - 线程执行 start_routine(arg)
    - 执行完毕后调用 pthread_exit() 或自动退出

### 1.3.3 注意事项

- 线程共享进程地址空间（全局变量、堆）
- 每个线程有独立的栈空间和寄存器上下文
- 如果不调用 pthread_detach() 或 pthread_join()，线程资源可能无法释放

### 1.3.4 总结

- pthread_create() 创建线程的核心流程：准备 TCB → 分配栈 → 初始化上下文 → 加入调度器 → 返回线程 ID → 线程开始执行
- 用户线程与内核调度器协作完成真正的执行

---

## 1.4 线程分离（Detach）与 join 的区别

### 1.4.1 pthread_join

- **功能**：阻塞调用线程，等待指定线程结束并获取其返回值
- **特点**：
    - 调用线程会挂起，直到目标线程退出
    - 可以获取目标线程的返回值
    - 适合需要知道线程执行结果的场景
- **示例**：

```c
pthread_t tid;
pthread_create(&tid, NULL, thread_func, NULL);
void *ret;
pthread_join(tid, &ret);  // 等待线程结束并获取返回值
```

### 1.4.2 pthread_detach（线程分离）

- **功能**：将线程标记为分离状态，线程结束后自动释放资源
- **特点**：
    - 调用线程不会等待目标线程结束
    - 目标线程结束后系统自动回收资源
    - 无法获取线程返回值
    - 适合不关心返回值、只需后台执行的线程
- **示例**：

```c
pthread_t tid;
pthread_create(&tid, NULL, thread_func, NULL);
pthread_detach(tid);  // 线程分离，自动释放资源
```

### 1.4.3 区别总结

- join：调用线程阻塞等待，被 join 的线程结束后获取返回值，需手动释放资源
- detach：调用线程不阻塞，线程结束后自动释放资源，不可获取返回值
- 选择原则：
    - 需要返回值或同步结束 → join
    - 后台任务、无需返回值 → detach

---

## 1.5 Linux 中守护进程（Daemon）的创建

### 1.5.1 守护进程概念

- 守护进程：在后台运行的独立进程，不依赖终端
- 用途：提供系统服务（如 syslog、cron、nginx 等）

### 1.5.2 创建守护进程的基本步骤

1. **创建子进程，父进程退出**

    ```c
    pid_t pid = fork();
    if (pid > 0) exit(0);   // 父进程退出
    ```

    - 父进程退出后，子进程成为 **孤儿进程**
    - 被 init（PID 1）收养，避免进程终端退出导致被杀死

2. **创建新会话（脱离终端）**

    ```c
    setsid();
    ```

    - 将子进程设置为新会话首进程，脱离终端控制
    - 避免收到 SIGHUP 信号

3. **改变工作目录**

    ```c
    chdir("/");
    ```

    - 避免占用挂载点，确保守护进程不会阻止文件系统卸载

4. **重设文件权限掩码**

    ```c
    umask(0);
    ```

    - 确保守护进程创建的文件拥有期望权限

5. **关闭标准文件描述符**

    ```c
    close(STDIN_FILENO);
    close(STDOUT_FILENO);
    close(STDERR_FILENO);
    ```

    - 守护进程不依赖终端，通常重定向到 /dev/null

6. **可选：重定向日志或输出**

    ```c
    freopen("/var/log/daemon.log", "a", stdout);
    freopen("/var/log/daemon.log", "a", stderr);
    ```

    - 用于记录运行信息

### 1.5.3 小结

- 创建守护进程核心流程：
  a. fork 并退出父进程
  b. setsid 脱离终端
  c. 改变工作目录、重设 umask
  d. 关闭或重定向标准文件描述符
- 守护进程可以在后台独立运行，不受终端和用户退出影响

---

## 1.6 管道（pipe）和命名管道（FIFO）的区别

### 1.6.1 管道（pipe）

- **定义**：进程间通信（IPC）机制，通过内存缓冲区在父子进程间传输数据
- **特点**：
    - 半双工（只读或只写）
    - **匿名**：没有文件系统路径，通常由 `fork()` 继承，也可以通过 FD 传递给无亲缘关系进程
    - 生命周期由所有读写文件描述符决定；创建者退出但仍有描述符存活时，管道对象不会立即消失
- **创建方式**：int pipe(int fd[2]);
- **适用场景**：父子进程间简单通信，例如 shell 管道 ls | grep txt

### 1.6.2 命名管道（FIFO）

- **定义**：具有名字的管道，可在无亲缘关系的进程间通信
- **特点**：
    - 半双工
    - **有名字**：存在于文件系统，可被不同进程打开读写
    - 生命周期独立于进程，除非手动删除
- **创建方式**：
    - 内核创建：mkfifo("/tmp/myfifo", 0666);
    - 用户进程打开读写：open("/tmp/myfifo", O_RDONLY / O_WRONLY);
- **适用场景**：不同进程间通信，后台服务与客户端之间传递数据

### 1.6.3 区别

| 维度 | `pipe()` 匿名管道 | FIFO（命名管道） |
|---|---|---|
| 名称 | 没有文件系统路径，返回两个文件描述符 | 有路径，可用 `mkfifo()` 创建 |
| 亲缘关系 | 通常通过 `fork()` 继承给相关进程 | 无亲缘关系进程也可通过路径打开 |
| 方向 | 一个读端、一个写端，通常按半双工使用 | 同样是字节流，方向由打开方式决定 |
| 生命周期 | 所有描述符关闭后内核对象消失 | 路径项持续存在，需 `unlink()` 删除 |
| 阻塞行为 | 无读者/无写者时读写可能阻塞或返回错误 | `open()` 读写端配对时也可能阻塞 |
| 权限 | 由文件描述符继承关系决定 | 受目录和 FIFO 文件权限控制 |

两者都是字节流，没有消息边界；一次 `write()` 不应被当成接收端一次 `read()` 的一条完整消息。若需要双向或消息边界，应考虑两条管道、`socketpair()`、消息队列或自定义帧格式。

### 1.6.4 总结

- 匿名管道简单高效，适合父子进程间通信
- 命名管道可跨进程，存在于文件系统，更灵活
- 都是半双工通信机制，读写顺序遵循 FIFO 原则

---

## 1.7 消息队列（message queue）基本使用

### 1.7.1 概念

- **消息队列**是一种进程间通信（IPC）机制，用于在进程间传递**固定格式的数据块**
- 支持**异步、无亲缘关系**的进程通信
- 核心特点：FIFO（先进先出）、可带优先级

### 1.7.2 POSIX 消息队列基本操作

1. **创建/打开消息队列**

    ```c
    mq = mq_open("/myqueue", O_CREAT | O_RDWR, 0666, &attr);
    ```

2. **发送消息**

    ```c
    char msg[] = "Hello";
    mq_send(mq, msg, sizeof(msg), 0);  // 0 为消息优先级
    ```

3. **接收消息**

    ```c
    char buf[256];
    unsigned int prio;
    mq_receive(mq, buf, sizeof(buf), &prio);
    ```

4. **关闭消息队列**

    ```c
    mq_close(mq);
    ```

5. **删除消息队列**

    ```c
    mq_unlink("/myqueue");
    ```

### 1.7.3 System V 消息队列基本操作

1. **创建/打开**

    ```c
    #include <sys/msg.h>
    int msqid = msgget(key_t key, IPC_CREAT | 0666);
    ```

2. **发送消息**

    ```c
    msg.mtype = 1;
    strcpy(msg.mtext, "Hello");
    msgsnd(msqid, &msg, sizeof(msg.mtext), 0);
    ```

3. **接收消息**

    ```c
    msgrcv(msqid, &msg, sizeof(msg.mtext), 1, 0);
    ```

4. **删除消息队列**

    ```c
    msgctl(msqid, IPC_RMID, NULL);
    ```

### 1.7.4 使用注意事项

- 消息队列容量有限，发送前要处理满队列情况
- 消息队列可以阻塞或非阻塞，阻塞时等待消息或队列可用
- POSIX 消息队列支持消息优先级，System V 消息队列仅按类型过滤

### 1.7.5 总结

- 消息队列适合无亲缘关系进程间的异步通信
- POSIX 消息队列简单易用，支持优先级
- System V 消息队列兼容性好，经典 IPC 方式
- 使用流程：创建/打开 → 发送/接收 → 关闭 → 删除

---

## 1.8 socketpair() 与管道的区别

### 1.8.1 基本概念

- **管道（pipe）**
    - 通常按半双工使用；无亲缘关系进程也可以在继承或显式传递文件描述符后使用
    - 进程通过 `pipe(fd[2])` 创建，读写方向通常按两个端点约定
    - 生命周期由文件描述符引用决定，匿名管道没有文件系统路径
- **socketpair()**
    - 在同一台机器上创建一对**全双工 UNIX 域套接字**
    - 支持双向通信，类似网络套接字但不经过网络栈
    - 进程间可无亲缘关系（通过继承或 fork 传递文件描述符）

### 1.8.2 区别

| 维度 | `pipe()` | `socketpair()` |
|---|---|---|
| 默认方向 | 通常半双工，一端读、一端写 | 可创建全双工的一对 Unix 域 socket |
| 数据语义 | 字节流 | `SOCK_STREAM` 是字节流；选择 `SOCK_DGRAM/SEQPACKET` 才保留报文边界 |
| 描述符传递 | 继承或显式传递 | 除继承外，还可配合 Unix 域 socket 传递 FD |
| 功能 | 接口简单、开销小 | 支持 `poll/epoll`、凭据、FD 传递和更多 socket 选项 |
| 典型场景 | 父子进程流水线 | 双向控制通道、事件循环、进程监督 |

`socketpair()` 只在本机创建连接端点，不经过网卡；是否有消息边界由创建时的 socket 类型决定，不能笼统地说所有 socketpair 都支持消息边界。

### 1.8.3 总结

- **pipe**：简单高效，通常按半双工使用，适合通过继承或传递 FD 建立的本机通道
- **socketpair**：双向通信，可无亲缘关系进程使用；只有 `SOCK_DGRAM`/`SOCK_SEQPACKET` 等类型保留报文边界，`SOCK_STREAM` 仍是字节流
- 面试常考点：半双工 vs 全双工、是否依赖父子关系、是否有消息边界

---

## 1.9 阻塞和非阻塞 socket 区别

### 1.9.1 阻塞 Socket（Blocking Socket）

- **特性**：调用如 read()、write()、connect() 时，如果操作无法立即完成，调用线程会**被阻塞**，直到完成或出错
- **特点**：
    - 简单易用，编程直观
    - CPU 不会忙等，操作系统挂起线程
    - 缺点：如果网络延迟或对方未响应，线程会长时间阻塞
- **示例**：

```c
int sockfd = socket(AF_INET, SOCK_STREAM, 0);
connect(sockfd, (struct sockaddr*)&addr, sizeof(addr)); // 阻塞直到连接成功或失败
read(sockfd, buf, sizeof(buf)); // 阻塞直到有数据
```

### 1.9.2 非阻塞 Socket（Non-blocking Socket）

- **特性**：调用网络函数时，如果操作无法立即完成，函数会**立即返回**，通常返回 -1 并设置 errno = EAGAIN 或 EWOULDBLOCK
- **特点**：
    - 不会阻塞线程，适合高并发或异步 I/O
    - 需要程序轮询或结合 I/O 多路复用（select、poll、epoll）
    - 编程复杂度高，需要处理“资源暂不可用”情况
- **示例**：

```c
int flags = fcntl(sockfd, F_GETFL, 0);
fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);

int ret = read(sockfd, buf, sizeof(buf));
if (ret < 0 && errno == EAGAIN) {
    // 暂无数据，稍后重试
}
```

### 1.9.3 区别总结

| 行为 | 阻塞 socket | 非阻塞 socket |
|---|---|---|
| `connect` | 可能等待握手完成或失败 | 通常立即返回 `EINPROGRESS`，用 `poll/epoll` 等待可写并检查 `SO_ERROR` |
| `read/recv` | 没有数据时可能睡眠 | 没有数据时返回 `EAGAIN/EWOULDBLOCK` |
| `write/send` | 发送缓冲满时可能睡眠 | 缓冲不足时可能只发送部分数据或返回 `EAGAIN` |
| 适用模型 | 每个连接一个阻塞线程/任务、代码直观 | 事件循环、高并发、避免单个连接拖住线程 |
| 编程要求 | 仍需处理短读、短写、断开和错误 | 还需保存未发送数据、处理就绪状态和重试 |

非阻塞不等于异步 I/O，也不保证“永不等待”；它只改变系统调用在当前无法完成时的返回方式。边沿触发 `epoll` 通常要循环读写直到 `EAGAIN`，并把 socket 设为非阻塞。

### 1.9.4 总结

- 阻塞 socket 编程简单，但在高并发场景容易造成线程阻塞
- 非阻塞 socket 与 I/O 多路复用结合，可以实现高并发、高效异步通信
- 面试常考点：阻塞 vs 非阻塞、select/poll/epoll 的应用场景

---

## 1.10 select、poll、epoll 的区别与使用场景

### 1.10.1 基本概念

- **select** / **poll** / **epoll** 都是 Linux 提供的 I/O 多路复用机制，用于同时监听多个文件描述符（socket、pipe 等）是否可读、可写或异常。
- 主要目标：解决**单线程处理高并发连接**的问题。

### 1.10.2 select

- **特点**：
    - 文件描述符集合受 `FD_SETSIZE` 编译期限制（glibc 常见默认值为 1024，不能把这个数当作 Linux 内核统一上限）
    - 用户态向内核传递**整个位数组**，内核扫描返回可读写的 fd
    - 每次调用都要重新设置 fd 集合
- **性能**：O(n)，fd 数量多时效率低
- **使用示例**：

```c
fd_set readfds;
FD_ZERO(&readfds);
FD_SET(sockfd, &readfds);
select(sockfd+1, &readfds, NULL, NULL, &timeout);
```

- **适用场景**：连接数较少（几十到几百），简单 I/O 多路复用

### 1.10.3 poll

- **特点**：
    - 用数组 struct pollfd 传递文件描述符，解决 FD_SETSIZE 限制
    - 每次调用仍需传递整个数组
- **性能**：O(n)，与 select 类似
- **使用示例**：

```c
struct pollfd fds[2];
fds[0].fd = sockfd;
fds[0].events = POLLIN;
poll(fds, 1, 1000);  // 1000ms 超时
```

- **适用场景**：比 select 支持更多 fd，但性能仍受 fd 数量影响

### 1.10.4 epoll

- **特点**：
    - Linux 特有，使用内核事件表
    - 支持水平触发（LT）和边沿触发（ET）
    - 注册 fd 到内核，事件就绪时通过 epoll_wait 通知
    - 适合**海量 fd 高并发场景**
- **性能**：等待阶段通常与返回的就绪事件数相关，但注册、修改和内核实现仍有开销；不能把 epoll 概括为对所有场景严格 O(1)
- **使用示例**：

```c
int epfd = epoll_create1(0);
struct epoll_event ev;
ev.events = EPOLLIN;
ev.data.fd = sockfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);

struct epoll_event events[10];
int nfds = epoll_wait(epfd, events, 10, 1000);
```

- **适用场景**：大规模并发（上千到上万连接）、高性能服务器

### 1.10.5 总结

- **select/poll**：适合少量连接，编程简单
- **epoll**：适合高并发、海量 fd，效率高，但编程复杂
- 面试重点：理解扫描式等待与就绪事件返回的差别、水平触发 vs 边沿触发、fd 数量限制

---

## 1.11 LT（水平触发）和 ET（边沿触发）区别

在 Linux epoll 中，事件触发方式有两种：**水平触发（Level Triggered, LT）** 和 **边沿触发（Edge Triggered, ET）**。

### 1.11.1 水平触发（LT）

- **特点**：只要文件描述符可读/可写，epoll_wait 就会一直返回该事件
- **行为**：
    - 多次触发，直到应用程序读/写消耗掉所有数据
    - 类似 poll/select 的默认行为
- **优点**：编程简单，容错性高
- **缺点**：频繁触发，可能导致 epoll_wait 被反复唤醒
- **示例**：

```c
if (events[i].events & EPOLLIN) {
    // 文件描述符可读，循环读取直到返回 EAGAIN
}
```

### 1.11.2 边沿触发（ET）

- **特点**：只在状态发生变化时触发一次事件
- **行为**：
    - 文件描述符从不可读变为可读时触发
    - 事件触发后，如果不一次性读完数据，下次不会再次触发
- **优点**：减少 epoll_wait 被频繁唤醒，适合高并发
- **缺点**：编程复杂，需要 **非阻塞 I/O** + **循环读/写**
- **示例**：

```c
if (events[i].events & EPOLLIN) {
    while ((n = read(fd, buf, sizeof(buf))) > 0) {
        // 读取所有数据
    }
    // 返回 EAGAIN 表示数据已读完
}
```

### 1.11.3 总结

- **LT**：默认模式，容易使用，事件重复触发
- **ET**：高性能模式，需要非阻塞 I/O 并一次性读写所有数据
- 面试重点：理解触发机制差异、循环读取必要性、CPU 使用效率

---

## 1.12 设计一个高并发 TCP 服务

### 1.12.1 基本思路

高并发 TCP 服务通常面临**大量客户端连接**同时请求，需要**高效、可扩展**的架构。设计核心点：

1. **非阻塞 I/O 或 I/O 多路复用**
2. **线程/进程模型选择**
3. **资源管理与任务调度**
4. **错误处理与容错**

### 1.12.2 I/O 模型选择

高并发服务器通常采用 **IO 多路复用**，避免一个连接对应一个线程。

常见模型：

1. **select**

    - 支持多连接监听
    - 连接数量受 FD_SETSIZE 限制

2. **poll**

    - 解决 select 数量限制
    - 但仍需要线性扫描

3. **epoll（Linux 常用）**

特点：

- 事件驱动
- 等待阶段通常只返回就绪事件，开销与就绪事件数相关；注册、修改和具体内核实现仍会影响性能，不能笼统承诺严格 O(1)
- 支持大量连接

典型流程：

```cpp
socket()
bind()
listen()
epoll_create()
epoll_ctl()
epoll_wait()
```

### 1.12.3 线程与进程模型设计

1. **单线程 + epoll**
    - 事件循环处理所有连接
    - CPU 密集型任务需拆分或 offload
2. **线程池 + epoll**
    - 主线程负责 epoll_wait，分发就绪事件到线程池处理
    - 避免每连接创建/销毁线程开销
3. **多进程 + epoll（Reactor 模型）**
    - 多进程处理不同连接，利用多核 CPU
    - 每进程 epoll 管理部分连接

### 1.12.4 资源管理

- **连接表**：维护 socket、状态、缓冲区
- **内存池**：避免频繁 malloc/free
- **线程池/任务队列**：统一管理任务，避免线程膨胀
- **日志系统**：异步写入，降低 I/O 阻塞

### 1.12.5 网络优化技巧

1. **设置 socket 选项**
    - SO_REUSEADDR / SO_REUSEPORT
    - TCP_NODELAY（禁用 Nagle 算法，减少延迟）
    - 调整发送/接收缓冲区大小
2. **使用边沿触发（EPOLLET）**
    - 减少 epoll_wait 调用次数，提高吞吐
3. **批量处理事件**
    - 每次 epoll_wait 获取多条事件，减少系统调用
4. **负载均衡**
    - 多线程/多进程分发连接
    - 可结合反向代理（如 Nginx/Tengine）

### 1.12.6 简单伪代码示例（线程池 + epoll）

```c
int epfd = epoll_create1(0);
struct epoll_event ev, events[MAX_EVENTS];
ev.events = EPOLLIN;
ev.data.fd = listen_sock;
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_sock, &ev);

while(1) {
    int nfds = epoll_wait(epfd, events, MAX_EVENTS, -1);
    for(int i = 0; i < nfds; i++) {
        if(events[i].data.fd == listen_sock) {
            int client_fd = accept(listen_sock, ...);
            set_nonblocking(client_fd);
            add_to_epoll(epfd, client_fd);
        } else {
            // 分发给线程池处理
            threadpool_add_task(worker_func, &events[i].data.fd);
        }
    }
}
```

### 1.12.7 总结

- 核心思想：**非阻塞 + I/O 多路复用 + 线程/进程调度**
- 线程池与 epoll 结合是高并发 TCP 服务最常用方案
- 注意连接管理、内存优化、日志异步、系统参数调优
- 面试常问点：阻塞 vs 非阻塞、select/poll/epoll 区别、线程池设计、负载均衡策略

---

## 1.13 客户端断线检测方法

### 1.13.1 TCP 异常返回检测

- **方法**：对 socket 进行读/写操作
    - read() / recv() 返回 0 → 对端正常关闭连接
    - write() / send() 返回 `EPIPE`、`ECONNRESET` 等错误 → 本地 TCP 状态已观察到连接异常；这不等于能证明对端此刻完全不可达
- **特点**：简单直接，但依赖 I/O 事件触发
- **缺点**：如果客户端异常断电或网络中断，不会立即返回，通常需要 I/O 事件、发送数据或 keepalive 探测才会发现

### 1.13.2 心跳机制（应用层检测）

- **方法**：服务器和客户端定期交换心跳包
- **实现**：
    - 客户端每隔固定时间发送心跳数据
    - 服务器维护最后一次心跳时间戳
    - 超时未收到 → 判断客户端断线
- **优点**：可快速发现异常断线
- **缺点**：增加应用层通信开销

### 1.13.3 TCP keepalive（内核层检测）

- **方法**：启用 socket 选项 SO_KEEPALIVE
- **特点**：
    - 内核周期性发送探测包
    - 如果一定次数未收到 ACK → 判定连接在本地超时/不可用候选；是否“对端不可达”仍需结合网络路径和业务语义
- **缺点**：默认周期较长（2 小时），可通过 TCP_KEEPIDLE/TCP_KEEPINTVL/TCP_KEEPCNT 调整

### 1.13.4 select / poll / epoll 错误事件

- **方法**：在 I/O 多路复用中监听异常事件
    - EPOLLERR / EPOLLHUP / POLLERR / POLLHUP
- **特点**：可在事件就绪时及时发现断线
- **优点**：结合 epoll 边沿触发可快速处理大量连接

### 1.13.5 总结

- 仅依靠读/写返回值通常不能及时发现“静默”的异常断线；对端显式关闭时 read() 返回 0，发生错误时通常返回 -1 并设置 errno，仍需结合超时、心跳或 TCP keepalive 判断
- **心跳机制**最常用于高并发服务的快速断线检测
- **TCP keepalive**适合低频检测
- 多路复用结合异常事件可高效管理大量连接

---

## 1.14 Linux 下实现定时任务

### 1.14.1 cron 定时任务

- **概念**：Linux 系统守护进程 cron 提供定期执行命令或脚本的功能
- **配置方式**：使用 crontab 文件
    - 编辑当前用户定时任务：

```bash
crontab -e
```

    - 格式：

```text
* * * * * command
分 时 日 月 周 command
```

    - 示例：每天凌晨 2 点执行备份脚本

```text
0 2 * * * /home/user/backup.sh
```

- **特点**：简单、适合周期性执行脚本或命令，不依赖程序运行状态

### 1.14.2 at/ batch 命令

- **at**：执行一次性延时任务

```bash
echo "/home/user/task.sh" | at 14:30
```

- **batch**：在系统空闲时执行任务
- **特点**：一次性任务，适合临时定时执行

### 1.14.3 sleep + shell 循环

- **方法**：通过 shell 脚本循环 + sleep 实现定时任务

```bash
while true; do
    /home/user/task.sh
    sleep 3600  # 每小时执行一次
done
```

- **特点**：无需依赖 cron，可在用户空间自定义周期
- **缺点**：需要脚本一直运行，占用进程资源

### 1.14.4 使用 Linux 定时器 API（编程方式）

- **timer_create / timer_settime**：POSIX 定时器

```c
timer_t timerid;
struct sigevent sev = {0};
sev.sigev_notify = SIGEV_THREAD; // 线程通知
sev.sigev_notify_function = callback;
timer_create(CLOCK_REALTIME, &sev, &timerid);

struct itimerspec its = {0};
its.it_value.tv_sec = 5;       // 初始延迟
its.it_interval.tv_sec = 10;   // 周期
timer_settime(timerid, 0, &its, NULL);
```

- **特点**：适合 C/C++ 程序内部定时任务；实际回调时间仍受时钟分辨率、调度和系统负载影响

### 1.14.5 总结

- **cron**：系统级周期任务，最常用
- **at/batch**：一次性任务
- **sleep 循环**：用户空间简单实现
- **timer_create**：程序内部定时，可响应回调；精度和延迟需结合时钟与调度评估

---

## 1.15 timerfd 与 signal timer 区别

### 1.15.1 signal timer（信号定时器）

- **实现方式**：通过 timer_create() + SIGALRM 等信号通知程序定时到期
- **特点**：
    - 支持周期性和一次性定时
- **优点**：标准 POSIX API，编程简单
- **缺点**：
    - 信号是全局资源，同一进程多个定时器可能冲突
    - 信号处理程序中可调用函数受限（不可调用非异步安全函数）
    - 编程复杂度高时容易出现竞争
- **示例**：

```c
// 示例省略了错误处理；实际代码应声明并检查 timerid
#include <signal.h>
#include <time.h>

timer_t timerid;
struct sigevent sev = {0};
sev.sigev_notify = SIGEV_SIGNAL;
sev.sigev_signo = SIGALRM;
timer_create(CLOCK_REALTIME, &sev, &timerid);
```

### 1.15.2 timerfd（文件描述符定时器）

- **实现方式**：通过 timerfd_create() 创建一个文件描述符，定时到期可通过 read() 获取次数
- **特点**：
    - 定时事件作为可读事件，用于 I/O 多路复用（select/poll/epoll）
    - 可纳入多路复用；多个线程共享同一 FD 时仍需自行设计并发访问和读取规则
    - 可精确获取定时器触发次数（防止遗漏）
- **优点**：
    - 与信号无关，可与 epoll 等事件循环结合
    - 可在多线程或高并发程序中使用；共享同一 FD 时仍需约定谁负责读取和关闭
- **缺点**：仅 Linux 支持
- **示例**：

```c
#include <stdint.h>
#include <unistd.h>
#include <sys/timerfd.h>

int tfd = timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC);
struct itimerspec new_value = {0};
new_value.it_value.tv_sec = 5;      // 初始延迟
new_value.it_interval.tv_sec = 2;   // 周期
timerfd_settime(tfd, 0, &new_value, NULL);

uint64_t expirations;
read(tfd, &expirations, sizeof(expirations));  // 获取触发次数
```

### 1.15.3 区别总结

| 维度 | POSIX signal timer | Linux `timerfd` |
|---|---|---|
| 通知方式 | 信号递送到进程/线程 | 文件描述符变为可读，`read()` 返回过期次数 |
| 事件循环 | 需处理信号异步执行限制 | 可直接加入 `select/poll/epoll` |
| 多定时器 | 需要区分信号、值或线程通知 | 每个定时器有独立 FD，管理直观 |
| 丢失处理 | 相同信号可能合并，处理逻辑要谨慎 | 过期次数累计在 `uint64_t` 中，读取后得到累计值 |
| 可移植性 | POSIX 平台较广 | Linux 专有 |
| 适用场景 | 简单通知、已有信号架构 | Linux 事件循环和高并发服务 |

两者的计时精度都受时钟源、调度延迟和系统负载影响；“微秒级定时”不等于回调能在微秒内准时执行。周期任务应使用单调时钟避免系统时间回拨影响，并处理过期次数累积。

### 1.15.4 总结

- **signal timer**：适合简单定时任务，但信号复杂且受限制
- **timerfd**：适合高并发、事件驱动程序，与 epoll 配合可统一处理定时事件；实际到期延迟仍受时钟源、调度和系统负载影响

---

## 1.16 实现高精度周期任务

### 1.16.1 使用 POSIX 定时器（timer_create + timer_settime）

- **特点**：
    - 内核定时器，精度较高（毫秒甚至微秒级）
    - 可绑定回调函数（线程通知）
- **实现示例**：

```c
#include <time.h>
#include <signal.h>

void callback(union sigval sv) {
    // 周期任务执行内容
}

struct sigevent sev = {0};
sev.sigev_notify = SIGEV_THREAD;  // 线程回调
sev.sigev_notify_function = callback;
timer_t timerid;
timer_create(CLOCK_MONOTONIC, &sev, &timerid);

struct itimerspec its = {0};
its.it_value.tv_sec = 1;          // 首次延迟 1 秒
its.it_interval.tv_sec = 1;       // 周期 1 秒
timer_settime(timerid, 0, &its, NULL);
```

- **优点**：可异步执行；实际触发时间仍受调度和系统负载影响
- **缺点**：需要线程支持，回调执行时间可能影响下一周期

### 1.16.2 使用 timerfd + epoll（事件驱动方式）

- **特点**：定时器作为文件描述符，可与 epoll/select/poll 配合
- **实现示例**：

```c
#include <sys/timerfd.h>
#include <unistd.h>
#include <stdint.h>
#include <stdio.h>
#include <sys/epoll.h>

int tfd = timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC);
struct itimerspec its = {0};
its.it_value.tv_sec = 1;       // 首次延迟
its.it_interval.tv_sec = 1;    // 周期
timerfd_settime(tfd, 0, &its, NULL);

int epfd = epoll_create1(0);
struct epoll_event ev;
ev.events = EPOLLIN;
ev.data.fd = tfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, tfd, &ev);

struct epoll_event events[1];
while (1) {
    int nfds = epoll_wait(epfd, events, 1, -1);
    if (nfds > 0) {
        uint64_t expirations;
        read(tfd, &expirations, sizeof(expirations));
        // 执行周期任务
    }
}
```

- **优点**：可与高并发事件循环结合，精度高
- **缺点**：编程相对复杂

### 1.16.3 使用 clock_nanosleep（精确睡眠）

- **特点**：阻塞当前线程，接口以纳秒为单位表达绝对时间；实际唤醒精度受内核时钟分辨率、调度和系统负载影响，并不保证纳秒级准时
- **实现示例**：

```c
#include <errno.h>
#include <time.h>

struct timespec next;
clock_gettime(CLOCK_MONOTONIC, &next);
while (1) {
    // 执行周期任务
    next.tv_sec += 1;   // 下一个周期
    while (clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, NULL) == EINTR) {
        /* 被信号打断时继续等待同一个绝对时间点 */
    }
}
```

- **优点**：简单、精度高
- **缺点**：阻塞线程，不适合需要并发处理的场景

### 1.16.4 高精度周期任务设计要点

1. **使用绝对时间（TIMER_ABSTIME）**避免累积误差
2. **任务执行时间 < 周期**，避免任务延迟
3. **避免阻塞 I/O**，使用异步或事件驱动
4. **结合实时调度策略**（SCHED_FIFO / SCHED_RR）可进一步提高精度
5. **监控周期漂移**：可记录实际执行时间，必要时调整下一周期

### 1.16.5 总结

- **简单单线程周期任务**：clock_nanosleep + TIMER_ABSTIME
- **高并发/事件驱动周期任务**：timerfd + epoll
- **高精度异步回调**：POSIX timer_create + SIGEV_THREAD
- 面试常考点：**绝对时间 vs 相对时间、阻塞 vs 异步、周期漂移处理**

---

## 1.17 Linux 下操作 GPIO/UART/SPI/I2C

### 1.17.1 GPIO 操作

1. **通过 sysfs（旧接口，已逐步废弃）**

    ```bash
    # 仅适用于内核仍启用旧 sysfs GPIO 接口的系统；新代码优先使用 character device/gpiod
    echo 17 > /sys/class/gpio/export
    echo out > /sys/class/gpio/gpio17/direction
    echo 1 > /sys/class/gpio/gpio17/value
    cat /sys/class/gpio/gpio17/value
    echo 17 > /sys/class/gpio/unexport
    ```

2. **通过 character device（/dev/gpiochipN, gpiod 库）**

    ```c
    #include <gpiod.h>
    struct gpiod_chip *chip = gpiod_chip_open("/dev/gpiochip0");
    struct gpiod_line *line = gpiod_chip_get_line(chip, 17);
    gpiod_line_request_output(line, "example", 0);
    gpiod_line_set_value(line, 1);
    ```

    - 优点：现代接口，支持事件和批量操作；上面调用方式是 libgpiod v1 风格，libgpiod v2 使用 request/config 对象，代码需按目标库版本调整

### 1.17.2 UART 操作

1. **通过字符设备 /dev/ttySx 或 /dev/ttyUSBx**

    ```c
    int fd = open("/dev/ttyS1", O_RDWR | O_NOCTTY | O_NDELAY);
    struct termios options;
    tcgetattr(fd, &options);
    cfsetispeed(&options, B115200);
    cfsetospeed(&options, B115200);
    options.c_cflag |= (CLOCAL | CREAD);
    tcsetattr(fd, TCSANOW, &options);

    write(fd, data, len);
    read(fd, buf, len);
    close(fd);
    ```

2. **注意事项**

    - 配置波特率、数据位、停止位、校验位
    - 可结合 select/poll/epoll 实现异步接收

### 1.17.3 SPI 操作

1. **通过 /dev/spidevX.Y**

    ```c
    #include <fcntl.h>
    #include <linux/spi/spidev.h>
    #include <stdint.h>
    #include <sys/ioctl.h>
    #include <unistd.h>

    int fd = open("/dev/spidev0.0", O_RDWR);
    uint8_t tx[2] = {0x9f, 0x00};
    uint8_t rx[2] = {0};
    struct spi_ioc_transfer tr = {0};
    tr.tx_buf = (uintptr_t)tx;
    tr.rx_buf = (uintptr_t)rx;
    tr.len = sizeof(tx);
    tr.speed_hz = 500000;
    tr.bits_per_word = 8;
    ioctl(fd, SPI_IOC_MESSAGE(1), &tr);
    close(fd);
    ```

2. **特点**

    - 全双工通信，主从模式
    - 通过 ioctl 设置模式、时钟、位序

### 1.17.4 I2C 操作

1. **通过 /dev/i2c-X 和 ioctl**

    ```c
    #include <linux/i2c-dev.h>
    int fd = open("/dev/i2c-1", O_RDWR);
    ioctl(fd, I2C_SLAVE, 0x50); // 设置从设备地址

    uint8_t buf[2];
    buf[0] = reg_addr;
    buf[1] = value;
    write(fd, buf, 2);          // 写寄存器
    read(fd, buf, 1);           // 读寄存器
    close(fd);
    ```

2. **特点**

    - 半双工通信，主从模式
    - 支持多从设备，地址冲突需处理
    - 可结合 Linux i2c-tools 调试

### 1.17.5 总结

- GPIO 新项目优先使用 `/dev/gpiochipN` 与 `libgpiod`；sysfs GPIO 仅用于兼容旧系统。
- UART 通过 termios 配置串口，SPI 通过 spidev 的 ioctl 完成全双工传输，I²C 通过 `/dev/i2c-*` 与 ioctl/读写访问设备。
- 设备节点、权限、地址和驱动绑定由目标发行版与内核配置决定，不能把示例设备名当作所有板卡的固定值。

---

## 1.18 多线程访问硬件寄存器的处理

在嵌入式或 Linux 驱动开发中，硬件寄存器通常是**共享资源**，如果多线程同时访问可能出现**竞态条件**或**数据错误**。处理方法如下：

### 1.18.1 使用互斥锁（Mutex）

- **概念**：通过互斥锁保证同一时间只有一个线程访问寄存器
- **实现方式（POSIX 线程）**：

```c
pthread_mutex_t reg_mutex = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_lock(&reg_mutex);
*REG_ADDR = value;   // 写寄存器
val = *REG_ADDR;     // 读寄存器
pthread_mutex_unlock(&reg_mutex);
```

- **特点**：简单，适合低并发场景

### 1.18.2 使用自旋锁（Spinlock）

- **概念**：在短时间内访问寄存器时，线程不断轮询锁而不是睡眠
- **使用场景**：
    - 硬件寄存器访问非常快
    - 不希望线程睡眠切换
- **Linux 内核示例**：

```c
spinlock_t lock;
spin_lock(&lock);
*REG_ADDR = value;
spin_unlock(&lock);
```

- **特点**：避免上下文切换开销，但 CPU 会忙等

### 1.18.3 禁用中断保护（仅内核或裸机环境）

- **方法**：在访问寄存器期间禁用局部中断，防止中断处理函数访问同一寄存器
- **适用场景**：中断处理与线程/任务共享寄存器
- **示例（裸机 STM32）**：

```c
uint32_t primask = __get_PRIMASK();
__disable_irq();
*REG_ADDR = value;
if (!primask) {
    __enable_irq();
}
```

- **注意**：禁止中断时间要尽量短，避免影响系统实时性

### 1.18.4 原子操作（Atomic）

- **概念**：原子指令适合保护软件变量或实现锁；不能据此断言对任意 MMIO 寄存器的读-改-写都原子，也不能替代芯片规定的 `readl/writel`、专用 SET/CLR 寄存器或驱动锁。
- **适用场景**：简单的软件状态量读写；硬件寄存器仍需遵循架构和驱动 API 的访问规则。
- **示例（软件变量，而非 MMIO 寄存器）**：

```c
#include <stdatomic.h>
_Atomic unsigned int state = 0;
atomic_store(&state, value);
val = atomic_load(&state);
```

- **特点**：开销低，但复杂操作仍需锁保护

### 1.18.5 总结

- 多线程访问寄存器必须保证**互斥访问**
- **互斥锁**：简单安全，适合用户态和长操作
- **自旋锁**：短操作，高并发或内核态使用
- **禁用中断**：防止中断与任务冲突，裸机或内核常用
- **原子操作**：适合软件状态量的简单读写；MMIO 访问不能仅靠 C11 原子类型保证正确性
- 面试考点：**竞态条件、互斥锁、自旋锁、原子操作和中断保护的选择场景**

---

## 1.19 日志系统设计：保证性能与可靠性

### 1.19.1 日志写入模式

1. **同步写**
    - 每条日志写入文件或外设立即完成
    - 优点：简单，数据可靠
    - 缺点：I/O 阻塞，影响系统性能
2. **异步写（缓冲写）**
    - 日志先写入内存缓冲区，再由独立线程或任务写入存储
    - 优点：减少阻塞，提高吞吐
    - 缺点：系统异常或掉电可能丢失缓冲日志
    - 常用优化：环形缓冲区 + 后台线程

### 1.19.2 日志等级与过滤

- 按严重性划分等级：DEBUG、INFO、WARN、ERROR
- 可以动态控制输出等级，减少低级日志对性能影响
- 对高频模块使用专用日志缓冲区，避免影响关键任务

### 1.19.3 日志存储策略

1. **轮转日志（log rotation）**
    - 限制单文件大小或按时间分割
    - 避免日志文件无限增长
2. **异地/远程存储**
    - 高可靠场景，将日志发送到服务器或云端
    - 可结合网络重传、心跳机制保证可靠性

### 1.19.4 日志缓冲与批量写

- 使用环形缓冲区或队列缓存日志
- 批量写入文件或存储设备，减少 I/O 系统调用
- 可结合多线程：
    - 生产者线程：写入日志缓冲区
    - 消费者线程：定时或条件触发写入外设

### 1.19.5 性能优化

- 异步写 + 环形缓冲 + 批量写
- 避免在高优先级任务中直接写文件或串口
- 对关键任务使用轻量级日志接口，详细日志由后台任务处理
- 可用 mmap 映射文件减少系统调用

### 1.19.6 可靠性保证

- 异步日志写入前可保留环形缓冲区，防止临时任务阻塞
- 异常掉电可通过定期 flush 或日志分区保证最小数据丢失
- 重要日志（ERROR/WARN）可立即同步写入

### 1.19.7 总结

- **性能**：异步写 + 缓冲区 + 批量写 + 多线程
- **可靠性**：日志等级控制 + flush/轮转 + 异地存储
- **设计原则**：高频低价值日志异步写，关键低频日志同步或优先写入
- 面试常考点：同步/异步日志区别、环形缓冲、批量写、flush 策略

---

[[projects/嵌入式八股/index|← 总索引]] · [[08 通讯协议|← 上一章：通讯协议]] · [[10 嵌入式Linux驱动|下一章：嵌入式 Linux 驱动 →]]
