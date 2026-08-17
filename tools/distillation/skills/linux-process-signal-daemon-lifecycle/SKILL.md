---
name: linux-process-signal-daemon-lifecycle
description: "Use when analyzing Linux user-space process control, signal delivery, daemonization, child reaping, or process/IPC shutdown involving fork, exec, wait/waitpid, kill, sigaction, SIGCHLD, setsid, chdir, umask, dup2, mmap, or System V shared memory. Trigger phrases include 子进程僵尸、SIGCHLD 回收、守护进程退出、fork 后 exec、SIGTERM 不生效、共享内存残留。 Do not use as a replacement for fd/pipe I/O debugging, pthread deadlock diagnosis, or TCP/UDP framing and epoll design."
metadata:
  source_files:
    - archive/大丙Linux教程/第3章 进程和线程/01 进程控制.md
    - archive/大丙Linux教程/第3章 进程和线程/05 信号.md
    - archive/大丙Linux教程/第3章 进程和线程/06 守护进程.md
    - archive/大丙Linux教程/第3章 进程和线程/02 管道.md
    - archive/大丙Linux教程/第3章 进程和线程/03 内存映射区.md
    - archive/大丙Linux教程/第3章 进程和线程/04 共享内存.md
  source_symbols:
    - fork
    - exec
    - execl
    - execlp
    - wait
    - waitpid
    - kill
    - sigaction
    - SIGCHLD
    - SIGTERM
    - SIGKILL
    - sigprocmask
    - sigpending
    - setsid
    - chdir
    - umask
    - dup2
    - pipe
    - mmap
    - munmap
    - shmget
    - shmat
    - shmdt
    - shmctl
  related_skills: [linux-fd-process-io-debugging, linux-thread-sync-deadlock-diagnosis, linux-socket-multiplexing-design]
  tags: [linux, process, signal, daemon, lifecycle, fork, exec, wait, ipc, mmap, shm]
---

# Linux 进程、信号、守护进程与生命周期分析

把“进程没退出、子进程变僵尸、信号没生效、守护进程脱离后异常、IPC 对象残留”还原成可验证的生命周期图。回答时分开教程示例、可迁移分析规则、生产级要求和目标机实测；不复制整篇或完整教程程序。

## R — 来源事实

- `fork`：成功后产生子进程；父子从调用点继续执行，返回值在父进程为子 PID、子进程为 0，失败为 -1。教程把地址空间描述为逻辑副本，并指出父子数据区隔离；父子 fd 表项可能仍指向同一个 open file description。
- `exec`/`execl[p]`：成功时用新程序替换调用进程的用户态映像且不返回；失败才从调用点返回 -1。`exec` 不创建新 PID，通常由 `fork` 后的子进程调用。
- `wait`/`waitpid`：父进程用它们回收已退出子进程并读取状态；`waitpid` 可按 PID/进程组选择目标，`WNOHANG` 可非阻塞查询。多个子进程要循环回收。
- `kill` 与信号：`kill` 发送信号，不等于目标已经处理或退出；信号有产生、未决、递达状态。`SIGKILL` 与 `SIGSTOP` 不能被捕获、阻塞或忽略；`SIGTERM` 可用于协作式停止。
- `sigaction`：为信号注册处理动作、屏蔽集和 flags。教程的回调示例是教学观察；生产处理器只能做 async-signal-safe 的最小动作，复杂逻辑应回到普通控制流。
- `SIGCHLD`：子进程状态变化可通知父进程。普通信号可能合并，不能把一次 `SIGCHLD` 当作只有一个子进程退出；应反复 `waitpid(-1, ..., WNOHANG)`。
- 守护化：教程顺序是 fork 后让父进程退出、子进程 `setsid`，按需 `chdir`、设置 `umask`，再关闭或用 `dup2` 重定向标准 fd。`setsid` 脱离控制终端不等于完成生产服务部署。
- 管道与映射：`fork` 会继承管道 fd；关闭不用的读/写端才能得到单向流和可判断 EOF。`mmap(MAP_SHARED)` 共享映射位置，完成后 `munmap`；共享位置本身不提供应用协议或同步。
- System V 共享内存：`shmget` 得到对象 ID，`shmat`/`shmdt` 建立/解除关联，`shmctl(IPC_RMID)` 标记删除；标记后仍要等关联解除才真正回收。共享内存本身不提供同步。

## I — 方法论解释

先画四张图，再解释 API：

1. **进程图**：PID、PPID、PGID、SID、`fork` 分支、`exec` 成功/失败、退出原因和唯一回收者。`fork` 是增加进程实体，`exec` 是替换一个实体的映像。
2. **信号图**：发送者、目标 PID/进程组、信号、阻塞集、未决状态、处理动作和最终后果。`kill` 成功只说明发送调用成功，不能证明业务已停止。
3. **服务图**：启动 → 创建/替换 → 运行 → 收到停止请求 → 停止新工作 → 回收子进程/IPC → 退出。守护化只改变会话和终端关系。
4. **资源图**：管道读写端、`dup2` 目标、mmap 地址/文件 fd、System V 对象/attach 引用、数据协议和同步原语；每项都写清创建者、最后使用者和释放者。

始终分层表述：教程中的调用顺序只是“资料展示过”；本 Skill 提取的是核对顺序；生产级实现还要处理错误返回、`EINTR`、权限、`CLOEXEC`、并发回收、日志、监督、信号安全和异常清理；目标系统事实必须由 man、源码、`ps`、`/proc`、`strace`、`ipcs` 或最小复现确认。

## A1 — 资料中的应用

### fork → exec → wait

教程让父进程创建子进程，子进程执行 `execl[p]`，父进程继续并等待。排查命令失败或僵尸时，逐项核对 `fork` 返回值、exec 失败分支、目标 PID、唯一 `waitpid` 所有者和退出状态；不能说“exec 创建了新进程”。

### SIGCHLD 回收

教程指出多个子进程同时退出时，单次信号处理不能代表单个退出事件。生产实现应由安全通知唤醒普通控制流，在那里循环 `waitpid(-1, ..., WNOHANG)`；教程回调中的 `printf` 不能直接照搬。

### 守护化与 IPC

教程展示 `fork → setsid → chdir/umask → dup2`。排查后台运行问题时分别检查 SID/PGID、cwd、新文件权限、0/1/2 指向和额外 fd。管道要核对两端关闭；mmap 要核对 backing file、长度和 `munmap`；System V 要核对 `shmat`、`shmdt`、`IPC_RMID` 和最后一个 attach。

## A2 — 未来触发场景

触发条件：

- 子进程出现 `<defunct>`，`wait`/`waitpid` 卡住、漏回收或退出原因不明；
- `fork` 后 exec 失败，`SIGTERM`/`SIGCHLD`/`sigaction` 行为与预期不符，或服务停止流程不完整；
- 守护进程受终端影响、相对路径/权限/标准流异常，或需要核对 `setsid/chdir/umask/dup2`；
- 管道 EOF、mmap 或 System V 共享内存的创建、继承、关联、解除、删除和同步协议是主问题。

明确不替代：

- 主要是 fd 泄漏、管道阻塞/EOF、`dup2` 继承细节或 mmap/共享内存 I/O 数据损坏时，转 `linux-fd-process-io-debugging`。
- 主要是 pthread mutex/cond、锁顺序、线程 join 或线程池关闭时，转 `linux-thread-sync-deadlock-diagnosis`。
- 主要是 TCP/UDP framing、短读、背压、select/poll/epoll 或 Socket 连接状态时，转 `linux-socket-multiplexing-design`。

## E — 可执行分析步骤

1. **固定症状**：记录 PID/进程组、时间、信号/系统调用、现象和最后一个成功阶段；用 `ps -o pid,ppid,pgid,sid,stat,wchan,cmd`、`/proc/<pid>/status`、必要时 `strace -ff -e trace=process,signal,wait4,desc,mmap` 取证。
2. **重建创建与替换**：给每次 `fork` 标父/子返回值和错误分支；给每次 exec 标路径、argv/env、继承 fd 和成功不返回/失败返回边界；指定唯一回收者。
3. **闭合回收链**：检查 `wait`/`waitpid` 目标、阻塞选项、状态宏、`EINTR`/`ECHILD`；多子进程或 SIGCHLD 驱动场景循环 `WNOHANG`，直到返回 0 或确认没有子进程。
4. **核对信号合同**：记录发送者、目标语义、权限、阻塞集、未决状态、处理动作和结果；区分信号已产生、已递达和进程已退出；不得尝试捕获/阻塞/忽略 `SIGKILL`/`SIGSTOP`。
5. **核对守护环境**：检查 fork、`setsid` 返回值、SID/PGID/控制终端、`chdir`、`umask`、0/1/2 的 `dup2` 目标、额外 fd 及关闭错误；另列 pid 文件、日志、权限降级、重复启动、重启和监督合同。
6. **核对 IPC 所有权**：管道列出每个进程的读/写端和 EOF 条件；mmap 列出 fd、映射长度/权限、访问者和 `munmap`；System V 列出 key/shmid、attach、detach、`IPC_RMID`、`shm_nattch`、数据版本和同步协议。
7. **验证异常路径**：测试 exec 不存在、多个子进程同时退出、信号打断 wait/阻塞 I/O、父进程先死、终端断开、cwd 不可用、权限变化、未关闭管道端点、映射文件过小、共享内存使用者崩溃。
8. **分层输出**：用“教程直接事实 / 当前源码事实 / 生产建议 / 待实测”四列报告；没有“所有使用者已停止”的证据，不宣称可以释放映射、删除对象或退出服务。

## B — 边界与风险

- `fork` 隔离用户态地址空间，但父子 fd 表项可能共享 open file description；fd/管道引用与 EOF 细节交给 `linux-fd-process-io-debugging`。
- `exec` 不返回只表示映像替换成功；路径、环境、权限、CLOEXEC 和动态加载依目标系统，教程 `execlp` 不是安全命令执行合同。
- `waitpid` 是子进程回收接口，不是线程 join、任意进程终止 API，也不是收到 SIGCHLD 的自动证明；要处理等待竞争、`EINTR` 和 `ECHILD`。
- `kill` 成功不等于目标已退出；PID/进程组、权限、处理器、调度和业务状态都要验证，不以 `SIGKILL` 代替正常 shutdown。
- 信号处理器不得照搬教程中的 `printf`、文件 I/O、分配、锁或复杂 IPC；只做 async-signal-safe 最小动作，复杂逻辑回到普通控制流。
- `setsid`、`chdir`、`umask`、`dup2` 各自只改变局部环境，不自动提供日志、权限、单实例、重启、健康检查或 supervisor 合同。
- mmap/`shmat` 只建立共享位置；不自动提供消息边界、互斥、发布顺序、无缺页或持久化保证。`IPC_RMID` 是删除标记，不是立即清空所有 attach 者。
- 本 Skill 不复制整篇原文，不替代 `linux-fd-process-io-debugging`、`linux-thread-sync-deadlock-diagnosis`、`linux-socket-multiplexing-design`。

## 相关 Skills

- `linux-fd-process-io-debugging`：fd、管道 EOF、`dup2`、mmap/共享内存 I/O 生命周期。
- `linux-thread-sync-deadlock-diagnosis`：pthread 共享状态、条件变量、锁顺序和线程池关闭。
- `linux-socket-multiplexing-design`：TCP/UDP framing、短读、背压、select/poll/epoll 和连接生命周期。

## 审计信息

- 来源：frontmatter 中六份指定教程；未修改原始资料、源码或附件。
- 正文：RIA++ 六段，低于 500 行；教程示例与生产实现边界已分开。
- 测试：静态触发矩阵 6/6；不宣称真实客户端盲测，详见同目录测试文件。
