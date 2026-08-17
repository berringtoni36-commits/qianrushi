---
name: linux-thread-sync-deadlock-diagnosis
description: "Use when diagnosing Linux/POSIX pthread user-space shared-state races, mutex or condition-variable hangs, lock-order deadlocks, or C/C++ thread-pool shutdown and reclamation bugs. Trigger when a thread blocks in pthread_mutex_lock, pthread_cond_wait, or pthread_join, a queue predicate is stale, workers do not wake or exit, or shutdown frees pool state before workers are joined. Do not use when the primary problem is fd, pipe, Socket, fork/exec, mmap/IPC lifecycle, or STM32/FreeRTOS synchronization; route those to the adjacent skills."
metadata:
  source_files:
    - archive/大丙Linux教程/第3章 进程和线程/07 多线程.md
    - archive/大丙Linux教程/第3章 进程和线程/08 线程同步.md
    - archive/大丙Linux教程/第3章 进程和线程/09 线程池 - C语言版.md
    - archive/大丙Linux教程/第3章 进程和线程/10 线程池 - C改C++版.md
  source_symbols:
    - pthread_create
    - pthread_self
    - pthread_equal
    - pthread_join
    - pthread_detach
    - pthread_exit
    - pthread_mutex_t
    - pthread_mutex_init
    - pthread_mutex_destroy
    - pthread_mutex_lock
    - pthread_mutex_trylock
    - pthread_mutex_unlock
    - pthread_cond_t
    - pthread_cond_init
    - pthread_cond_destroy
    - pthread_cond_wait
    - pthread_cond_timedwait
    - pthread_cond_signal
    - pthread_cond_broadcast
    - ThreadPool
    - TaskQueue
    - TaskQueue::addTask
    - TaskQueue::takeTask
    - TaskQueue::taskNumber
    - threadPoolCreate
    - threadPoolDestroy
    - threadPoolAdd
    - worker
    - manager
    - threadExit
    - ThreadPool::~ThreadPool
    - ThreadPool::worker
    - ThreadPool::manager
    - ThreadPool::threadExit
  tags: [linux, pthread, thread, synchronization, mutex, condition-variable, deadlock, thread-pool, shutdown, debugging]
  related_skills: [linux-fd-process-io-debugging, linux-socket-multiplexing-design, linux-build-debug-chain, rtos-task-and-isr-design]
---

# Linux pthread 共享状态、线程池关闭与死锁诊断

## R — 来源摘录（Reading）

先只把下列内容当作教程中可核对的事实，并在回答中给出文件路径；不要把示例自动升级为生产级保证。

> “临界区越小越好”；互斥锁应包住访问共享资源的临界区。

来源：`08 线程同步.md` 的“同步方式”和“互斥锁使用”。其计数示例把 `number` 的读、`cur++`、写回放在 `pthread_mutex_lock` 与 `pthread_mutex_unlock` 之间。

> “需要循环的对链表是否为空进行判断，需要将 if 该成 while”。

来源：`08 线程同步.md` 的生产者/消费者代码分析；广播唤醒多个消费者后，只有一个消费者能先取走节点，其他消费者必须重新检查谓词。

> “`pthread_join()` 通常会阻塞到目标线程退出”；分离后“其他线程不能再对它 `pthread_join()`”。

来源：`07 多线程.md` 的“线程回收”和“线程分离”。join 等待并回收目标线程的可回收资源；detach 使退出资源自动回收，但不提供 join 等待点。

> C 版 `threadPoolDestroy` 的顺序是设置 `shutdown`、join `managerID`、多次 signal `notEmpty`，随后 `free(taskQ)`、`free(threadIDs)`、销毁锁/条件变量并 `free(pool)`。

来源：`09 线程池 - C语言版.md` 的 `threadPoolDestroy`。C++ 版 `ThreadPool::~ThreadPool` 对应地只 join 管理者，signal `m_notEmpty` 后立即 `delete m_taskQ`、`delete[] m_threadIDs` 和销毁同步对象。

## I — 方法论框架（Interpretation）

按三张图排查，并要求每个结论都能落到源码访问点：

1. **共享状态图**：列出队列、计数器、指针、终止标志和线程 ID 表；为每个字段标出所有读/写者、所有者、保护它的锁，以及“读改写”是否不可分割。凡是维持不变量的读—改—写（例如 `number = number + 1`、`queueSize--`、`busyNum++`）必须在同一保护协议内完成，不能只保护最后一次写。
2. **等待图**：把线程当前等待的对象记为节点，把“持有锁 A 后等待锁 B/条件谓词/目标线程”记为有向边。环是死锁候选；`pthread_join` 也要纳入图，因为 joiner 可能持有目标线程要释放或获取的锁。
3. **生命周期图**：画出 create → 运行/等待 → shutdown → 唤醒 → 线程终止 → join/detach → 销毁锁/条件变量/队列/池对象。`signal`/`broadcast` 只是唤醒机会，不是线程已退出的确认；任何 worker 仍可能使用的对象都不能先 free/delete 或 destroy。

把条件变量解释成“在互斥锁保护下等待谓词变化的机制”，而不是事件或计数器。使用固定形状：先持有保护谓词的 mutex，再用 `while (!predicate && !shutdown) pthread_cond_wait(&cv, &mutex)`；被唤醒后重新取得 mutex 并重检谓词，满足后才消费/退出。生产者或关闭方必须在相同状态保护下修改谓词，再 signal/broadcast；有多个等待条件时，关闭协议必须唤醒每一类等待者。

把锁诊断落到两个问题：临界区是否完整覆盖共享不变量，以及所有路径是否以一致顺序取得多把锁。检查早退、错误返回、取消、回调和嵌套函数中的重复加锁；不要用“加一把全局锁”替代状态谓词和所有权设计。

## A1 — 来源案例（Application）

用以下案例建立类比，但明确标注“教程代码事实”和“生产实现判断”两层。

### 案例 1：共享计数器的丢失更新

在 `08 线程同步.md` 中，未加锁版本的两个线程分别读取全局 `number`、递增局部 `cur`、再写回，`usleep` 使交错更易出现，结果会重复计数。修正版在两线程中都把读—改—写整体放在 `pthread_mutex_lock(&mutex)`/`pthread_mutex_unlock(&mutex)` 内，线程 join 后才 destroy mutex。遇到“最终计数偶尔偏小”时，逐个列出该变量的每次访问，检查是否存在锁外读取、锁外写回或只锁住一半的 RMW。

### 案例 2：条件变量与队列谓词

`08 线程同步.md` 的消费者先锁 `mutex`，在 `while (head == NULL)` 中调用 `pthread_cond_wait(&cond, &mutex)`；等待期间函数释放 mutex，唤醒返回时重新取得 mutex。教程同时给出错误的 `if` 版本：生产者广播一次后，多个消费者竞争同一节点，一个消费者删除节点后，另一个若不重检就可能解引用空指针。把这个模式迁移到线程池时，谓词至少要包含“队列非空/非满”和“shutdown”；不要把一次 signal 当成任务已经可取或线程已经退出。

### 案例 3：C/C++ 线程池的关闭路径

`09 线程池 - C语言版.md` 的 `worker` 在 `mutexPool` 下检查 `queueSize`/`shutdown`，取任务后释放池锁，在池外执行回调，再用 `mutexBusy` 更新 `busyNum`；`manager` 周期性读取队列和忙线程数，创建或要求空闲 worker 自退。`threadPoolDestroy` 只 join manager，向 `notEmpty` 发若干 signal 后就释放任务队列、线程 ID 数组、锁、条件变量和池对象。`10 线程池 - C改C++版.md` 的 `ThreadPool::~ThreadPool`、`ThreadPool::worker`、`ThreadPool::manager`、`ThreadPool::threadExit` 保留相同的关闭形状。

因此遇到“shutdown 后偶发崩溃/卡住”，按源码核对：worker 是否仍在执行回调或将要访问 `pool`；唤醒后是否真的走到 `threadExit`；是否存在 joinable worker 未 join；`threadExit` 是否还会访问已释放的 `threadIDs`；锁和条件变量是否仍存活。不要只复述教程注释“唤醒消费者”，要验证终止和回收的完成条件。

## A2 — 触发与相邻 Skill 区分（Activation）

触发本 Skill 的信号包括：

- Linux 用户态 C/C++ 使用 pthread 共享全局/堆对象，出现丢失更新、队列损坏、数据竞争或“偶发”结果；
- 线程卡在 `pthread_mutex_lock`、`pthread_cond_wait`、`pthread_join`，或多个锁之间互相等待；
- 生产者/消费者在空队列、满队列或广播后行为错误；
- 线程池 shutdown 后 worker 不醒、不退、析构卡住、偶发 use-after-free、未回收线程资源，或 manager/worker/join 顺序可疑。

不要因用户提到“线程”就触发：

- 主要证据是 fd、管道 EOF、`fork/exec` 继承、mmap/System V IPC 生命周期：转 `linux-fd-process-io-debugging`；若其中另有 pthread 锁，再只处理明确的锁/谓词边界。
- 主要证据是 TCP/UDP framing、短读、epoll/poll/select 或 Socket 连接状态：转 `linux-socket-multiplexing-design`。
- 主要证据是 STM32/FreeRTOS ISR、DMA、任务通知或调度：转 `rtos-task-and-isr-design` 或对应 RTOS 通信 Skill。
- 程序尚未完成编译、链接、加载：转 `linux-build-debug-chain`；只问函数原型而没有故障现象时，先做普通 API 说明。

## E — 可执行诊断流程（Execution）

要求另一个 agent 按以下顺序执行，并在每一步保留证据：

1. **固定故障点和线程集合。** 记录是数据错误、永久阻塞、超时、崩溃还是 shutdown 后异常；在可复现挂起时用 `gdb -p <pid>` 的 `thread apply all bt`（或等价线程栈工具）记录每个线程停在 `pthread_mutex_*`、`pthread_cond_*`、join、回调还是 free/delete。不要先根据函数名猜死锁。
2. **枚举状态与访问。** 对每个共享字段列出所有读写位置、线程、锁、谓词和终止值。重点标记 `queueSize/front/rear`、`busyNum/liveNum/exitNum`、`shutdown`、任务参数和 `threadIDs`；确认每个 RMW 是否完整地受同一 mutex 保护，并检查普通 `shutdown` 读写是否存在无锁竞态。
3. **重建锁顺序和 wait-for 图。** 给每个 lock/unlock 加线程和源码位置标签，检查“持有 A 等 B”环、同一线程重复 lock、早退漏 unlock、嵌套回调反向取锁，以及 joiner 持锁而 target 需要该锁的情况。若使用 `trylock`，把失败作为观测/超时手段，不把它当成已经修复协议。
4. **核对条件变量合同。** 对每个 `pthread_cond_wait` 写出 mutex、谓词、改变谓词的代码和通知方；确认 wait 位于 `while`，返回后重新检查谓词和 shutdown，且修改谓词与 signal/broadcast 遵守同一锁协议。关闭时分别找出等待 `notEmpty`、`notFull` 或其他条件的线程；不能只 signal 一个条件就声称池已停止。
5. **核对线程终止与资源所有权。** 为每个 `pthread_create` 标记默认 joinable 还是显式 detached，并找到唯一的 `pthread_join` 或 detach 责任者。若是 joinable worker，先完成关闭/唤醒，再等待 manager 和每个 worker 终止，最后 destroy mutex/cond、释放队列/ID 表/池对象；绝不把 worker 自身调用 `pthread_exit` 当成 join。若是 detached worker，不能再 join，必须另有“所有 worker 不再触碰对象”的 quiescence/引用计数/屏障证明后才能释放对象。
6. **对照教程线程池并验证修复。** 分别检查 C 版 `threadPoolDestroy` 和 C++ 析构函数的实际顺序：shutdown 是否有同步保护，worker 是否全部被唤醒，是否有生产者卡在 `notFull`，是否 join 每个 joinable worker，是否在 worker 最后一次访问前 free/delete。再用空队列、满队列、多消费者广播、执行中 shutdown、长任务、重复 shutdown、创建/销毁竞速和高频 stress 重跑；记录 pthread 返回码、线程终止计数和 sanitizer/调试器证据。

推荐的安全关闭抽象是：在保护状态的锁下置 `shutdown` 并禁止新任务；在同一协议下唤醒所有相关等待者；按明确的 drain/abort 策略处理队列和运行中任务；join manager 与所有 joinable worker；确认没有线程再访问池；最后销毁同步原语和释放内存。若实现选择 detached worker，改用显式 quiescence 证明，不能用“signal 次数等于 liveNum”替代它。

## B — 不适用、风险与事实边界（Boundary）

- 四份教程是本 Skill 的来源证据，不是目标系统的正确性证明。尤其 `09`/`10` 的 shutdown/析构代码按源码只 join manager，signal worker 后立即 free/delete 队列和线程 ID、destroy 锁/条件变量；源码没有逐个 join worker。将其作为需要审计的生命周期风险，不要宣称它是安全关闭模板。
- `pthread_cond_signal`/`broadcast` 只影响等待者，不记录“未来线程必须收到的票”，也不表示谓词已满足或线程已完成退出。signal 次数不能替代 worker join、终止计数或 quiescence；必须以源码和运行证据核对。
- C 版 `shutdown` 在 `threadPoolDestroy` 中直接写入，manager/worker 在其他路径读取；C++ 版 `m_shutdown` 也在析构、`addTask`、worker、manager 间直接访问。除非目标实现另有原子或锁协议，不要把这些普通字段访问当成已同步。
- C 版只通知 `notEmpty`；若生产者可能阻塞在 `notFull`，关闭协议必须单独检查其唤醒和退出路径。C++ 版还应核对 `TaskQueue::taskNumber()`：它直接读 `std::queue::size()`，而 `addTask`/`takeTask` 使用 `m_mutex`，仅持有 `m_lock` 不能自动保护该队列访问。
- 教程 `08` 的生产者/消费者示例使用无限循环，随后 join 会持续等待；它展示条件变量谓词，不是可复用的 shutdown 实现。教程 `09`/`10` 的 `threadExit` 调用 `pthread_exit`，且还会访问线程 ID 表；在线程未 join 前释放表和池对象会形成 use-after-free 风险。
- 默认 joinable 线程退出后仍需 join 或 detach 才完成可回收资源处理；detach 后不能 join。不要混用两种所有权模型，也不要在 join 时持有 target 还需要的 mutex。`pthread_t` 的比较应按 `07` 的可移植提示使用 `pthread_equal`；教程池中直接 `==` 是目标平台需核对的假设。
- 本 Skill 不负责 fd/管道/Socket/跨进程 IPC 生命周期，也不把“共享内存”本身当作 pthread 同步；这些问题按 A2 转交。锁、条件变量和线程池判断仍须以目标源码、libc/内核实现和实际调试数据为准。
