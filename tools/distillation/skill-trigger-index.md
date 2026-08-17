# Skill 触发入口索引

> 从规范源 `SKILL.md` 的 description、压力矩阵主域和客户端审计自动生成。先按用户要做的动作选择入口，再让客户端决定是否实际加载；本索引不替代真实会话盲测。

- 规范 Skill：56
- 主域：9
- 机器记录：[`skill-trigger-index.json`](skill-trigger-index.json)
- 相关关系：[`skill-related-index.md`](skill-related-index.md)

## `embedded-core`

### `embedded-arm-linux-boot-chain`

- 触发描述：Use when the user is learning or debugging an embedded ARM Linux boot failure and can report the last visible stage, such as no serial output, U-Boot works but the kernel is silent, kernel starts but rootfs will not mount, or a service/application fails after login. Trigger phrases include “嵌入式 Linux 启动失败”, “U-Boot 到内核”, “rootfs 挂载失败”, “boot chain diagnosis”. Do not use for a standalone driver API explanation or MCU bare-metal boot without Linux.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-arm-linux-boot-chain/SKILL.md)
- 相关规范 Skill：`embedded-interview-layered-answer`, `linux-memory-source-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-bus-selection`

- 触发描述：Use when the user must choose or compare UART, RS232, RS485, I2C, SPI, or CAN for an embedded design, or diagnose a communication link using distance, speed, node count, duplex, clocking, electrical level, noise, and error-handling constraints. Trigger phrases include “选 UART 还是 SPI”, “RS485 和 RS232 区别”, “通信协议怎么选”, “which bus should I use”. Do not use for generic protocol definitions without a design choice or fault symptom.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-bus-selection/SKILL.md)
- 相关规范 Skill：`embedded-interview-layered-answer`, `rtos-communication-debugging`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-c-storage-linkage-audit`

- 触发描述：Use when an embedded C or bare-metal build must explain storage duration, linkage, .data/.bss placement, extern/static, startup initialization, scatter/linker regions, or RAM/Flash usage from a map file. Trigger phrases include “这个变量在 .data 还是 .bss”, “extern 但链接失败”, “头文件 multiple definition”, “启动时谁清 BSS”, and “Map 文件怎么查内存超限”. Do not use for C++ RAII/copy-move or Linux TCP diagnosis; volatile alone never proves atomicity or synchronization.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-c-storage-linkage-audit/SKILL.md)
- 相关规范 Skill：`embedded-memory-lifetime-and-pool-design`, `rtos-freertos-config-and-boot`, `embedded-cpp-resource-lifetime`, `linux-build-debug-chain`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-c-struct-binary-contract-audit`

- 触发描述：Use when auditing whether an embedded C struct safely matches a register map, DMA buffer, CAN/UART/SPI/I2C frame, flash record, or other binary layout. Trigger phrases include can this struct map a CAN frame, sizeof/offsetof mismatch, pragma pack, bit-field order, union type punning, endian conversion, unaligned access, volatile register mapping, or protocol CRC/DLC layout. Do not use for storage duration/linkage, bus selection, or ISR event delivery alone.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-c-struct-binary-contract-audit/SKILL.md)
- 相关规范 Skill：`embedded-c-storage-linkage-audit`, `embedded-numeric-contract-audit`, `embedded-memory-lifetime-and-pool-design`, `embedded-bus-selection`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-cpp-resource-lifetime`

- 触发描述：Use when embedded C++ code involves RAII, constructors/destructors, ownership, smart pointers, copy/move behavior, container lifetime, iterator invalidation, or choosing C++ abstractions under firmware resource constraints. Trigger phrases include “嵌入式 C++ RAII”, “unique_ptr 能不能用”, “拷贝和移动怎么查”, “vector 迭代器失效”, and “对象析构顺序”. Do not use for a C-only malloc/pool policy without C++ object semantics; use embedded-memory-lifetime-and-pool-design.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-cpp-resource-lifetime/SKILL.md)
- 相关规范 Skill：`embedded-memory-lifetime-and-pool-design`, `embedded-interview-layered-answer`, `rtos-runtime-fault-diagnosis`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-interview-layered-answer`

- 触发描述：Use when the user wants to prepare, answer, or be grilled on an embedded-systems interview question or project, especially when they need a definition, mechanism, code/project mapping, boundary, and optimization answer. Trigger phrases include “面试怎么答”, “八股怎么讲”, “项目深挖”, “追问我”, “how should I explain this in an embedded interview”. Do not use for pure API lookup or unrelated general interview coaching.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-interview-layered-answer/SKILL.md)
- 相关规范 Skill：`embedded-bus-selection`, `rtos-task-and-isr-design`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-memory-lifetime-and-pool-design`

- 触发描述：Use when an embedded C or RTOS design must choose static, stack, heap, or pool storage, or when malloc/free, ownership, fragmentation, allocation failure, task-stack allocation, or long-running memory stability is in question. Trigger phrases include “内存池怎么设计”, “嵌入式内存碎片”, “malloc/free 会不会出问题”, “任务栈用静态还是动态”, and “内存泄漏怎么查”. Do not use for C++ RAII and copy/move semantics as the primary topic; use embedded-cpp-resource-lifetime.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-memory-lifetime-and-pool-design/SKILL.md)
- 相关规范 Skill：`embedded-cpp-resource-lifetime`, `rtos-freertos-config-and-boot`, `rtos-runtime-fault-diagnosis`, `linux-buddy-fragmentation-diagnosis`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `embedded-numeric-contract-audit`

- 触发描述：Use only when diagnosing an embedded numeric fault or auditing code/protocol behavior across representation layers: raw bits and signed/unsigned/BCD/real interpretation, byte order after a field is located, intermediate arithmetic type and overflow, unit scaling, filtering or rounding, error budgets, thresholds, hysteresis, or boundary tests. Trigger phrases include 改成 REAL 还是报警不触发、中间乘法溢出、ADC/4–20 mA 边界、原始值缩放、阈值抖动 and 数值合同审计. Do not trigger for standalone IEEE 754 or 0.1+0.2 explanations, float-width definitions, struct/register/DMA/frame layout, clock or ADC sampling timing, physical sensor acquisition/calibration/fusion, or PID tuning; route those to the related skills.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-numeric-contract-audit/SKILL.md)
- 相关规范 Skill：`embedded-c-struct-binary-contract-audit`, `stm32-clock-and-sampling-timing`, `rtos-sensor-acquisition-and-fusion`, `rtos-motor-pid-control`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-driver-device-tree-boundary`

- 触发描述：Use when an embedded Linux issue crosses device tree, platform-device/driver matching, probe resource acquisition, user/kernel interfaces, IRQ context, or driver cleanup boundaries. Trigger phrases include “设备树和驱动怎么匹配”, “probe 没进”, “compatible 不生效”, “驱动资源怎么释放”, “用户态怎么和驱动交互”, and “驱动内存泄漏怎么查”. This repository has tutorial material but no complete corresponding Linux driver implementation; do not present the tutorial examples as the user's project experience.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-driver-device-tree-boundary/SKILL.md)
- 相关规范 Skill：`embedded-arm-linux-boot-chain`, `linux-build-debug-chain`, `linux-fd-process-io-debugging`, `embedded-memory-lifetime-and-pool-design`, `embedded-interview-layered-answer`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-file-persistence-crash-consistency`

- 触发描述：Use when explaining or diagnosing what Linux file write success means after a process crash, kernel crash, reboot, sudden power loss, or filesystem recovery. Trigger phrases include write 返回成功是否落盘, fsync/fdatasync/fflush, Page Cache dirty data, 掉电丢数据, 原子 rename, or file durability contract. Do not use for virtual-memory reclaim, RTOS Flash/IAP, or generic file descriptor lifetime alone.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-file-persistence-crash-consistency/SKILL.md)
- 相关规范 Skill：`linux-fd-process-io-debugging`, `linux-virtual-memory-reclaim-path`, `rtos-iap-firmware-upgrade`, `embedded-c-struct-binary-contract-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-tcp-loss-path-diagnosis`

- 触发描述：Use when a Linux TCP service appears to lose connections or messages and the fault may be in the application, Socket buffers, SYN/accept queues, qdisc, NIC RingBuffer, or the network path. Trigger phrases include “TCP 丢包怎么定位”, “连接偶尔断”, “accept 队列满”, “ESTABLISHED 但对端死了”, “TCP ACK 了但业务没收到”, and “Keepalive 怎么判断”. Do not use for TCP half-packet/framing or epoll design as the primary topic; do not treat one ping, ss output, or ACK as proof of end-to-end application delivery.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-tcp-loss-path-diagnosis/SKILL.md)
- 相关规范 Skill：`linux-socket-multiplexing-design`, `linux-fd-process-io-debugging`, `linux-build-debug-chain`, `embedded-bus-selection`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-userspace-timer-drift-audit`

- 触发描述：Use when choosing or auditing Linux userspace periodic mechanisms such as timer_create/timer_settime, timerfd, clock_nanosleep, TIMER_ABSTIME, epoll integration, callback blocking, expiration overruns, or accumulated drift. Trigger phrases include Linux 周期任务漂移, timerfd + epoll, POSIX timer callback, absolute versus relative sleep, or timer overrun. Do not use for FreeRTOS software timers or STM32 clock-tree/ADC timing.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-userspace-timer-drift-audit/SKILL.md)
- 相关规范 Skill：`linux-socket-multiplexing-design`, `rtos-software-timer-periodic-design`, `stm32-clock-and-sampling-timing`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-virtual-memory-reclaim-path`

- 触发描述：Use when diagnosing Linux virtual-memory pressure, first-touch page faults, page-cache versus anonymous-page reclaim, kswapd/direct reclaim, watermarks, swap, NUMA reclaim, or reclaim-related latency. Trigger phrases include ‘缺页异常’, ‘页缓存和匿名页’, ‘kswapd’, ‘direct reclaim’, ‘水位线’, ‘pgscand’, and ‘内存回收抖动’. Do not use for high-order contiguous-page/buddy fragmentation or MCU/RTOS allocation-policy design.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-virtual-memory-reclaim-path/SKILL.md)
- 相关规范 Skill：`linux-buddy-fragmentation-diagnosis`, `embedded-memory-lifetime-and-pool-design`, `linux-memory-source-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `stm32-clock-and-sampling-timing`

- 触发描述：Use when an STM32 clock tree, APB timer clock, ADC clock/sample time, SysTick timing, UART baud rate, or sensor sampling schedule must be explained or debugged. Trigger phrases include “STM32 时钟不对”, “ADC 采样异常”, “72MHz 怎么来的”, “定时器频率差一倍”, “MQ2 采样怎么核对”, and “串口乱码会不会是时钟”. Do not generalize the repository's STM32F1 facts to another MCU family without checking its reference manual.
- 规范源：[`SKILL.md`](tools/distillation/skills/stm32-clock-and-sampling-timing/SKILL.md)
- 相关规范 Skill：`rtos-freertos-config-and-boot`, `rtos-sensor-acquisition-and-fusion`, `rtos-motor-pid-control`, `embedded-bus-selection`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `interactive-learning-labs`

### `interactive-lab-fact-boundary-audit`

- 触发描述：Use when auditing an HTML/JavaScript learning experiment, chart, Canvas, quiz, or simulation to determine what is source-grounded, what is derived teaching data, what tests actually cover, and where it must not be presented as measured project fact. Trigger phrases include “这个动画的数据真实吗”, “交互实验审计”, “图表数字来源”, “Canvas 和原文重复吗”. Do not use for ordinary UI styling or standalone embedded-system diagnosis.
- 规范源：[`SKILL.md`](tools/distillation/skills/interactive-lab-fact-boundary-audit/SKILL.md)
- 相关规范 Skill：`linux-memory-source-audit`, `linux-memory-ebpf-pipeline`, `linux-vision-pipeline-and-optimization`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `leetcode-algorithm-learning`

### `algorithm-active-recall-loop`

- 触发描述：Use when the user is learning algorithms and needs a truthful loop for independent attempts, minimal hints, post-solution review, mastery labels, spaced rewriting, and weak-topic scheduling. Trigger phrases include “刷题计划”, “我看懂但不会写”, “多久复习”, “提示后 AC 算掌握吗”, and “帮我安排主动回忆”. Do not use for solving one algorithm problem or proving its correctness.
- 规范源：[`SKILL.md`](tools/distillation/skills/algorithm-active-recall-loop/SKILL.md)
- 相关规范 Skill：`algorithm-problem-framework-selection`, `algorithm-state-and-invariant-derivation`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `algorithm-problem-framework-selection`

- 触发描述：Use when solving a new C++ algorithm problem and the user needs to identify a candidate pattern from constraints, data shape, operations, or objective before coding. Trigger phrases include “这道题用什么模板”, “怎么判断滑窗/二分/DP”, “新题没有思路”, and “帮我归类题型”. Do not use for proving an already chosen solution or for tracking study progress.
- 规范源：[`SKILL.md`](tools/distillation/skills/algorithm-problem-framework-selection/SKILL.md)
- 相关规范 Skill：`algorithm-state-and-invariant-derivation`, `algorithm-active-recall-loop`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `algorithm-state-and-invariant-derivation`

- 触发描述：Use when a C++ algorithm approach has been chosen and the user needs to define DP state, binary-search interval, sliding-window invariant, backtracking state, greedy proof, edge cases, or counterexamples before implementation. Trigger phrases include “状态怎么定义”, “二分边界错了”, “DP 转移”, “回溯剪枝”, “贪心怎么证明”. Do not use for initial pattern selection or study scheduling.
- 规范源：[`SKILL.md`](tools/distillation/skills/algorithm-state-and-invariant-derivation/SKILL.md)
- 相关规范 Skill：`algorithm-problem-framework-selection`, `algorithm-active-recall-loop`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `linux-memory-ebpf`

### `linux-buddy-fragmentation-diagnosis`

- 触发描述：Use when the user wants to analyze Linux physical-page fragmentation, buddy allocator order/zone/node data, extfrag or unusable-free indexes, or why a high-order allocation fails despite enough total free memory. Trigger phrases include “伙伴系统”, “高阶页分配失败”, “物理内存碎片”, “extfrag_index”, “buddyinfo”. Do not use for SLUB object fragmentation or generic virtual-memory explanations.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-buddy-fragmentation-diagnosis/SKILL.md)
- 相关规范 Skill：`linux-memory-ebpf-pipeline`, `linux-memory-source-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-ebpf-map-counter-contract`

- 触发描述：Use when auditing Linux eBPF/BCC Map aggregation for exact cumulative counts, approximate rankings, latest-event snapshots, or complete event streams. Apply it to PID keys, lookup→value++→update read-modify-write paths, cross-CPU contention, mixed cumulative/latest fields, per-CPU or atomic counter choices, ring-buffer selection, and validation experiment design in the Linux physical-memory project. Do not use it for the end-to-end BCC pipeline, buddy allocator metric meaning, or a general source/version audit.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-ebpf-map-counter-contract/SKILL.md)
- 相关规范 Skill：`linux-memory-ebpf-pipeline`, `linux-buddy-fragmentation-diagnosis`, `linux-memory-source-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-memory-ebpf-pipeline`

- 触发描述：Use when the user needs to explain or trace the Linux physical-memory-fragmentation monitor from Python/BCC startup through eBPF load/attach, kernel probes, BPF maps, and terminal output. Trigger phrases include “eBPF 项目运行链路”, “BCC 做了什么”, “从 Python 到内核”, “物理内存碎片项目怎么讲”. Do not use for generic eBPF definitions without this project’s source context.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-memory-ebpf-pipeline/SKILL.md)
- 相关规范 Skill：`linux-memory-source-audit`, `linux-buddy-fragmentation-diagnosis`, `embedded-interview-layered-answer`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-memory-fastpath-observation-contract`

- 触发描述：Use when auditing or designing Linux physical-memory/eBPF fast-path probes, especially kprobe entry observations of get_page_from_freelist, repeated calls during slowpath, return-point evidence, and request-level correlation. Keep function-entry samples, upper-level allocation requests, and final success/failure separate; do not use for the general BCC loading chain, buddy-fragmentation metric semantics, or broad source audits.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-memory-fastpath-observation-contract/SKILL.md)
- 相关规范 Skill：`linux-memory-ebpf-pipeline`, `linux-buddy-fragmentation-diagnosis`, `linux-memory-source-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-memory-source-audit`

- 触发描述：Use when the user needs to distinguish design intent, documentation claims, and actual source behavior in the Linux physical-memory/eBPF project, especially around probe attachment, BPF map keys, sampling throttling, kernel-field reads, metric formulas, and project interview claims. Trigger phrases include “源码审计”, “文档和代码不一致”, “这个功能真的实现了吗”, “项目能不能这样说”. Do not use for general Linux memory teaching without source evidence.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-memory-source-audit/SKILL.md)
- 相关规范 Skill：`linux-memory-ebpf-pipeline`, `linux-buddy-fragmentation-diagnosis`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `linux-systems-tutorial`

### `linux-build-debug-chain`

- 触发描述：Use when a Linux C/C++ program fails during preprocessing, compilation, linking, shared-library loading, startup, or GDB-based runtime diagnosis. Trigger phrases include “编译报错”, “undefined reference”, “找不到 .so”, “Makefile 增量构建错了”, “GDB 怎么定位”. Do not use for pure application logic, FreeRTOS scheduling, or ARM Linux boot-chain failures without a user-space build/load symptom.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-build-debug-chain/SKILL.md)
- 相关规范 Skill：`linux-fd-process-io-debugging`, `embedded-arm-linux-boot-chain`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-fd-process-io-debugging`

- 触发描述：Use when a Linux user-space program has an fd leak, unexpected EOF, blocked pipe, fork or exec communication failure, mmap or shared-memory corruption, or a thread synchronization symptom. Trigger phrases include “文件描述符泄漏”, “fork 后读写异常”, “管道卡住”, “共享内存数据乱”, and “线程死锁”. Do not use for Socket protocol framing or build and linker failures.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-fd-process-io-debugging/SKILL.md)
- 相关规范 Skill：`linux-socket-multiplexing-design`, `linux-build-debug-chain`, `rtos-communication-debugging`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-process-signal-daemon-lifecycle`

- 触发描述：Use when analyzing Linux user-space process control, signal delivery, daemonization, child reaping, or process/IPC shutdown involving fork, exec, wait/waitpid, kill, sigaction, SIGCHLD, setsid, chdir, umask, dup2, mmap, or System V shared memory. Trigger phrases include 子进程僵尸、SIGCHLD 回收、守护进程退出、fork 后 exec、SIGTERM 不生效、共享内存残留。 Do not use as a replacement for fd/pipe I/O debugging, pthread deadlock diagnosis, or TCP/UDP framing and epoll design.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-process-signal-daemon-lifecycle/SKILL.md)
- 相关规范 Skill：`linux-fd-process-io-debugging`, `linux-thread-sync-deadlock-diagnosis`, `linux-socket-multiplexing-design`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-rx-napi-path-diagnosis`

- 触发描述：Use when diagnosing Linux network receive-path anomalies between NIC hardware and application-visible Socket data: hardware IRQ/ISR, DMA into the NIC Ring Buffer, NAPI poll, NET_RX softirq, sk_buff, protocol-stack delivery, Socket receive buffering, and application reads. Trigger phrases include ‘网卡收到但应用收不到’, ‘NET_RX 很高’, ‘ksoftirqd 占 CPU’, ‘RingBuffer 溢出’, ‘NAPI poll’, ‘软中断网络接收’, and ‘硬中断到 Socket 的包路径’. Do not use as the primary skill for TCP retransmission, SYN/accept queues, keepalive, or end-to-end TCP delivery (linux-tcp-loss-path-diagnosis); TCP framing, epoll readiness, nonblocking read loops, or backpressure (linux-socket-multiplexing-design); or generic device-tree/probe/driver lifecycle audits.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-rx-napi-path-diagnosis/SKILL.md)
- 相关规范 Skill：`linux-tcp-loss-path-diagnosis`, `linux-socket-multiplexing-design`, `linux-driver-device-tree-boundary`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-socket-multiplexing-design`

- 触发描述：Use when designing or debugging a Linux TCP or UDP server with message framing, partial reads, connection lifecycle, select, poll, epoll, nonblocking I/O, backpressure, or readiness events. Trigger phrases include “TCP 半包”, “粘包怎么处理”, “epoll 服务器”, “EAGAIN”, and “连接关闭”. Do not use for build failures, generic Socket API lookup, or FreeRTOS communication.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-socket-multiplexing-design/SKILL.md)
- 相关规范 Skill：`linux-fd-process-io-debugging`, `embedded-bus-selection`, `linux-build-debug-chain`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-thread-sync-deadlock-diagnosis`

- 触发描述：Use when diagnosing Linux/POSIX pthread user-space shared-state races, mutex or condition-variable hangs, lock-order deadlocks, or C/C++ thread-pool shutdown and reclamation bugs. Trigger when a thread blocks in pthread_mutex_lock, pthread_cond_wait, or pthread_join, a queue predicate is stale, workers do not wake or exit, or shutdown frees pool state before workers are joined. Do not use when the primary problem is fd, pipe, Socket, fork/exec, mmap/IPC lifecycle, or STM32/FreeRTOS synchronization; route those to the adjacent skills.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-thread-sync-deadlock-diagnosis/SKILL.md)
- 相关规范 Skill：`linux-fd-process-io-debugging`, `linux-socket-multiplexing-design`, `linux-build-debug-chain`, `rtos-task-and-isr-design`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-udp-broadcast-reachability-contract`

- 触发描述：Use when diagnosing Linux UDP broadcast reachability, SO_BROADCAST permission, subnet broadcast address, interface scope, firewall, or why a datagram is not delivered to intended hosts. Trigger phrases include UDP 广播发不出去, SO_BROADCAST, 255.255.255.255, 子网广播地址, or only one interface receives the broadcast. Do not use for ordinary UDP endpoint routing or multicast membership.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-udp-broadcast-reachability-contract/SKILL.md)
- 相关规范 Skill：`linux-udp-datagram-endpoint-routing`, `linux-udp-multicast-interface-membership-contract`, `linux-socket-multiplexing-design`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-udp-datagram-endpoint-routing`

- 触发描述：Use when diagnosing Linux UDP endpoint, ephemeral-port, sendto/recvfrom source-address, bind, or reply-routing problems. Trigger phrases include UDP reply goes to the wrong port, recvfrom source address is ignored, client uses a random port, datagrams arrive at one socket but replies disappear, or UDP endpoint contract. Do not use for TCP framing/epoll design, broadcast reachability, or multicast group membership.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-udp-datagram-endpoint-routing/SKILL.md)
- 相关规范 Skill：`linux-udp-broadcast-reachability-contract`, `linux-udp-multicast-interface-membership-contract`, `linux-socket-multiplexing-design`, `linux-fd-process-io-debugging`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-udp-multicast-interface-membership-contract`

- 触发描述：Use when diagnosing Linux UDP multicast interface selection, IP_MULTICAST_IF, IP_ADD_MEMBERSHIP, bind port, group address, IGMP, or why a receiver does not see multicast datagrams. Trigger phrases include UDP 组播加入错误网卡, IP_ADD_MEMBERSHIP, IP_MULTICAST_IF, 组播收不到, or multiple interfaces and multicast. Do not use for broadcast permissions or ordinary UDP reply routing.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-udp-multicast-interface-membership-contract/SKILL.md)
- 相关规范 Skill：`linux-udp-broadcast-reachability-contract`, `linux-udp-datagram-endpoint-routing`, `linux-socket-multiplexing-design`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `linux-vision`

### `cmake-source-discovery-incremental-build-audit`

- 触发描述：Use when auditing whether a CMake source file actually enters a target, whether explicit sources or file(GLOB) discovery was configured, whether the configure/build tree belongs to the current source tree, whether an incremental target is stale, or whether a same-named binary and its runtime libraries came from the intended build. Trigger phrases include source file exists but is not compiled, CMakeLists and build directory disagree, old build artifact, stale incremental build, two targets both named lime, link_directories versus runtime loading, and which source produced this executable. Do not use for a generic compiler/linker/loader failure without source-membership or build-freshness evidence; use linux-build-debug-chain. Do not use for broad vision performance/model provenance or benchmark reproducibility; use linux-vision-build-provenance-audit.
- 规范源：[`SKILL.md`](tools/distillation/skills/cmake-source-discovery-incremental-build-audit/SKILL.md)
- 相关规范 Skill：`linux-build-debug-chain`, `linux-vision-build-provenance-audit`, `rtos-build-flash-runtime-provenance`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-vision-build-provenance-audit`

- 触发描述：Use when auditing whether an ARM Linux vision executable, performance claim, model branch, or optimization result can be reproduced from the current source tree, CMake target, linked library, and recorded build evidence. Trigger phrases include which source produced this binary, whether lime_opt or xinlime is actually built, CMake and build artifacts disagree, performance numbers cannot be reproduced, or vision project build provenance. Do not use for tensor shape/layout analysis alone or generic compiler troubleshooting without a vision provenance question.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-vision-build-provenance-audit/SKILL.md)
- 相关规范 Skill：`cmake-source-discovery-incremental-build-audit`, `linux-vision-pipeline-and-optimization`, `linux-vision-project-storytelling`, `linux-build-debug-chain`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-vision-file-ipc-lifecycle-audit`

- 触发描述：Use when auditing an ARM Linux vision pipeline that starts external programs with Qt QProcess and exchanges frames or results through files, stdout, or shell commands. Trigger phrases include QProcess reads stale results, camera frames are not seen by LSTR, file IPC drops frames, a vision child process hangs or exits, or the project claims asynchronous process communication. Do not use for model tensor shape alone, generic Qt UI design, or a one-minute project introduction.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-vision-file-ipc-lifecycle-audit/SKILL.md)
- 相关规范 Skill：`qt-event-loop-signal-slot-audit`, `linux-vision-pipeline-and-optimization`, `linux-fd-process-io-debugging`, `linux-vision-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-vision-pipeline-and-optimization`

- 触发描述：Use when the user needs to explain, debug, or optimize the ARM Linux vision pipeline from camera capture through LIME enhancement, ONNX/LSTR or NCNN/Unet inference, post-processing, and Qt display, including NEON, OpenMP, cache locality, model quantization, and end-to-end performance. Trigger phrases include “视觉项目怎么讲”, “NEON/OpenMP 优化”, “摄像头到推理”, “端侧部署”. Do not use for generic computer-vision theory without this embedded project context.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-vision-pipeline-and-optimization/SKILL.md)
- 相关规范 Skill：`linux-memory-source-audit`, `embedded-interview-layered-answer`, `linux-vision-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-vision-project-storytelling`

- 触发描述：Use when the user wants a concise or deep interview explanation of the ARM Linux visual-perception project, its FT2000/4 platform, camera-to-inference pipeline, LIME, LSTR/Unet, Qt monitoring, personal contribution, and implementation caveats. Trigger phrases include “视觉项目面试”, “帮我介绍这个项目”, “面试官深挖 LIME/NEON”, “简历项目怎么说”. Do not use for standalone image-processing theory or performance benchmarking without interview/storytelling intent.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-vision-project-storytelling/SKILL.md)
- 相关规范 Skill：`linux-vision-pipeline-and-optimization`, `embedded-interview-layered-answer`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-vision-qt-image-buffer-adapter-audit`

- 触发描述：审计 Linux/ARM 视觉项目的 cv::Mat → QImage → QPixmap → QLabel 显示边界：按 type、通道顺序、QImage 格式、step/bytesPerLine、连续性、外部缓冲所有权、深拷贝与 camera/result 消费者逐项核对。用户遇到颜色互换、灰度全黑、行错位、Mat 复用后花屏、格式分支遗漏，或要求区分文档声称、源码事实和目标 Qt/OpenCV 待验证项时使用；不要用它替代模型 tensor、Qt 事件循环/QProcess、文件 IPC 或端到端性能审计。
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-vision-qt-image-buffer-adapter-audit/SKILL.md)
- 相关规范 Skill：`vision-model-tensor-contract-audit`, `qt-event-loop-signal-slot-audit`, `linux-vision-file-ipc-lifecycle-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `linux-vision-resource-telemetry-contract-audit`

- 触发描述：审计 Linux 视觉 Qt 上位机 CPU/内存资源遥测从 /proc/stat、free -m 到采样时间、累计值差分、字段与单位、错误状态、QTimer、固定历史窗口和 QtCharts 展示的合同。Use when reviewing this project’s resource monitor, explaining a first-sample spike or stale/zero value, checking free-versus-available parsing, or deciding whether a chart is evidence of resource usage; do not use for generic Qt event-loop/QProcess lifecycle, the camera-to-inference performance pipeline, or build/benchmark provenance.
- 规范源：[`SKILL.md`](tools/distillation/skills/linux-vision-resource-telemetry-contract-audit/SKILL.md)
- 相关规范 Skill：`qt-event-loop-signal-slot-audit`, `linux-vision-pipeline-and-optimization`, `linux-vision-build-provenance-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `qt-event-loop-signal-slot-audit`

- 触发描述：Use when auditing a Qt GUI in the ARM Linux vision project for event-loop blocking, synchronous waitKey or long polling, QProcess finished/error/readyRead/timeout/cancellation/repeated-start behavior, connectSlotsByName versus manual connect duplication, QObject ownership, thread affinity, or queued/direct signal-slot semantics. Keep linux-vision-file-ipc-lifecycle-audit for the cross-process file/result contract and linux-vision-project-storytelling for interview/project expression.
- 规范源：[`SKILL.md`](tools/distillation/skills/qt-event-loop-signal-slot-audit/SKILL.md)
- 相关规范 Skill：`linux-vision-file-ipc-lifecycle-audit`, `linux-vision-pipeline-and-optimization`, `linux-process-signal-daemon-lifecycle`, `linux-vision-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `vision-model-tensor-contract-audit`

- 触发描述：Audit an embedded Linux vision model's input/output tensor contract and the truth of its main-chain integration from project documents and source code. Use for questions about input count, input binding, shape, rank, host dtype, BGR/HWC to CHW conversion, resize, normalize, mask, log_space, logits/curve or segmentation decoding, model/image/result paths, and whether ONNX/LSTR and NCNN/Unet actually share a Qt/camera pipeline. Do not use for global ARM vision performance troubleshooting or interview/project storytelling.
- 规范源：[`SKILL.md`](tools/distillation/skills/vision-model-tensor-contract-audit/SKILL.md)
- 相关规范 Skill：`linux-vision-pipeline-and-optimization`, `linux-vision-project-storytelling`, `interactive-lab-fact-boundary-audit`, `linux-memory-source-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `rtos-project`

### `rtos-auto-mode-state-machine`

- 触发描述：Use when explaining or debugging the STM32+FreeRTOS range-hood automatic or anti-backflow mode: Cooking Event thresholds, STARTUP/COOKING/DELAY_OFF transitions, timeout counters, sensor-to-PWM decisions, mode reset, or shared-state races. Trigger phrases include “自动模式”, “Cooking Event”, “延时关闭”, “防回流反复启动”. Do not use for generic finite-state-machine theory or a pure PID tuning question.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-auto-mode-state-machine/SKILL.md)
- 相关规范 Skill：`rtos-sensor-acquisition-and-fusion`, `rtos-key-event-state-machine`, `rtos-motor-pid-control`, `rtos-task-and-isr-design`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-build-flash-runtime-provenance`

- 触发描述：审计 STM32/FreeRTOS 固件从 Keil 工程配置、编译产物 AXF/HEX/MAP、J-Link/SWD 烧录到 Reset & Run、串口和运行时证据的可复现验证链。用户询问工程为何编不出同一固件、AXF/HEX/MAP 是否属于当前 target、Pack/宏/IncludePath/startup/port/IROM/IRAM 是否闭合、J-Link Flash algorithm 或烧录后不运行、向量表/地址/串口证据是否可信时使用；不要用它替代 FreeRTOS 启动机制、运行时故障隔离或 IAP 协议审计。
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-build-flash-runtime-provenance/SKILL.md)
- 相关规范 Skill：`rtos-freertos-config-and-boot`, `rtos-runtime-fault-diagnosis`, `rtos-iap-firmware-upgrade`, `rtos-project-storytelling`, `linux-build-debug-chain`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-communication-debugging`

- 触发描述：Use when an STM32/FreeRTOS communication or event path fails: UART/DMA data is missing or corrupted, an ISR notification is lost, a task waits forever, or shared state is inconsistent. Trigger phrases include “串口收不到”, “DMA 完成但任务没反应”, “信号量卡住”, “FreeRTOS 通信排查”. Do not use for choosing a new bus or tuning a motor PID loop.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-communication-debugging/SKILL.md)
- 相关规范 Skill：`rtos-task-and-isr-design`, `embedded-bus-selection`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-display-buzzer-feedback`

- 触发描述：Use when explaining or auditing the STM32+FreeRTOS LCD display and active-buzzer feedback path: UIDisplayTask versus control-task priority/period boundaries, synchronous SPI1/ST7735S initialization and refresh, GPIO buzzer control, short/long-press/release feedback, delay_ms blocking semantics, or a future single-consumer buzzer event queue. Trigger phrases include ‘LCD不刷新’, ‘蜂鸣器一直响’, ‘短按长按提示音’, ‘显示任务优先级’, and ‘多个任务报警如何仲裁’. Do not use as a replacement for the key state machine, generic task/ISR design, periodic-timer audit, or project-storytelling skills.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-display-buzzer-feedback/SKILL.md)
- 相关规范 Skill：`rtos-key-event-state-machine`, `rtos-task-and-isr-design`, `rtos-software-timer-periodic-design`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-freertos-config-and-boot`

- 触发描述：Use when the user needs to explain, review, or debug the STM32F103 + FreeRTOS configuration and boot chain, including Reset_Handler, SystemInit, main initialization order, scheduler startup, SysTick/PendSV/SVC, interrupt priority thresholds, software timers, heap selection, or task-stack units. Trigger phrases include “FreeRTOS 是怎么启动的”, “SysTick/PendSV/SVC 分别做什么”, “任务栈大小是字节还是字”, “调度器启动后不跑”. Do not use for a runtime symptom that requires a fault-isolation workflow; combine with rtos-runtime-fault-diagnosis.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-freertos-config-and-boot/SKILL.md)
- 相关规范 Skill：`rtos-task-and-isr-design`, `rtos-runtime-fault-diagnosis`, `rtos-communication-debugging`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-iap-firmware-upgrade`

- 触发描述：Use when the user needs to explain, review, debug, or interview the STM32 + FreeRTOS IAP firmware-upgrade chain: USART1 RX, DMA1 Channel5, ISR-to-task handoff, CRC32 packaging, Flash erase/write, APP vector validation, MSP setup, and jump. Trigger phrases include “IAP 怎么实现”, “串口 DMA 固件升级”, “CRC 校验通过后怎么写 Flash”, “Boot 跳 APP”, “升级后不启动”. Do not describe this as a production OTA/security solution unless the user supplies signatures, rollback, power-fail recovery, and a verified APP linker layout.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-iap-firmware-upgrade/SKILL.md)
- 相关规范 Skill：`rtos-communication-debugging`, `rtos-freertos-config-and-boot`, `rtos-runtime-fault-diagnosis`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-key-event-state-machine`

- 触发描述：Use when explaining or debugging the STM32+FreeRTOS project key input path: 30 ms debounce, tick-based short/long press detection, event consumption, release handling, or the mapping from KEY1/KEY2 events to mode, speed, motor, and buzzer actions. Trigger phrases include “按键没反应”, “短按长按”, “消抖”, “事件一直触发”. Do not use for sensor sampling, generic GUI input, or a pure FreeRTOS scheduling question.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-key-event-state-machine/SKILL.md)
- 相关规范 Skill：`rtos-auto-mode-state-machine`, `rtos-task-and-isr-design`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-motor-pid-control`

- 触发描述：Use when the user is explaining or debugging a STM32 motor speed loop involving PWM, encoder feedback, RPM calculation, PID error, integral limiting, output saturation, or tuning. Trigger phrases include “PID 调参”, “电机转速不稳”, “PWM 和 RPM”, “编码器测速”, “闭环控制”. Do not use for general FreeRTOS scheduling or open-loop GPIO motor switching.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-motor-pid-control/SKILL.md)
- 相关规范 Skill：`rtos-task-and-isr-design`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-project-storytelling`

- 触发描述：Use when the user wants a 30-second, 1-minute, 3-minute, or deep-dive interview explanation of the STM32F103 + FreeRTOS range-hood controller, including architecture, tasks, motor control, sensors, state machine, IAP, CRC32, and personal contribution boundaries. Trigger phrases include “讲 RTOS 项目”, “烟机项目面试”, “项目介绍”, “项目深挖”. Do not use for generic FreeRTOS teaching without this project context.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-project-storytelling/SKILL.md)
- 相关规范 Skill：`embedded-interview-layered-answer`, `rtos-task-and-isr-design`, `rtos-motor-pid-control`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-runtime-fault-diagnosis`

- 触发描述：Use when an STM32/FreeRTOS system HardFaults, resets, freezes, starves a task, overflows a task stack, fails dynamic allocation, deadlocks, or behaves incorrectly after initialization. Trigger phrases include “STM32 一运行就 HardFault”, “FreeRTOS 栈溢出”, “任务突然不调度”, “优先级反转”, “初始化后卡死”, “中断优先级导致崩溃”. Do not use for a purely conceptual FreeRTOS boot explanation or a standalone UART/DMA event-chain question; combine with rtos-freertos-config-and-boot or rtos-communication-debugging as needed.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-runtime-fault-diagnosis/SKILL.md)
- 相关规范 Skill：`rtos-freertos-config-and-boot`, `rtos-task-and-isr-design`, `rtos-communication-debugging`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-sensor-acquisition-and-fusion`

- 触发描述：Use when diagnosing or explaining the STM32+FreeRTOS project sensor path: DHT11 GPIO bit-banging, MQ2 ADC sampling, averaging, empirical concentration conversion, multi-sensor normalization, weighted PWM mapping, or Cooking Event detection. Trigger phrases include “DHT11 读不到”, “MQ2 ADC 异常”, “传感器采样”, “ppm 准不准”, “多传感器融合”. Do not use for a pure PID loop, key-only UI logic, or generic sensor definitions without this project context.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-sensor-acquisition-and-fusion/SKILL.md)
- 相关规范 Skill：`rtos-task-and-isr-design`, `rtos-auto-mode-state-machine`, `rtos-motor-pid-control`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-software-timer-periodic-design`

- 触发描述：审计和选择 FreeRTOS 软件定时器、delay-based 周期任务、硬件定时器 ISR 到任务通知的实现方式，结合当前 STM32 工程源码核对 Timer Service Task、命令队列、回调上下文、队列/栈/优先级、周期漂移、执行超时、二值信号量丢失或合并以及初始化顺序。Use when a user asks about xTimerCreate/configUSE_TIMERS, delay_ms 周期设计, TIM4 触发 SpeedCalcTask, software-timer callbacks, or a source-grounded timing implementation audit.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-software-timer-periodic-design/SKILL.md)
- 相关规范 Skill：`rtos-task-and-isr-design`, `stm32-clock-and-sampling-timing`, `rtos-communication-debugging`, `rtos-motor-pid-control`
- 外部/非规范关系：无
- 客户端副本：zcode=same

### `rtos-task-and-isr-design`

- 触发描述：Use when the user is designing or explaining STM32/FreeRTOS tasks, priorities, blocking, mutexes, binary semaphores, interrupt-to-task handoff, or shared-state protection, or when an RTOS task is delayed, starved, stuck, or crashes. Trigger phrases include “FreeRTOS 任务怎么划分”, “中断里能不能做计算”, “任务卡死”, “FromISR”, “task scheduling”. Do not use for generic Linux process scheduling or a pure PID tuning question.
- 规范源：[`SKILL.md`](tools/distillation/skills/rtos-task-and-isr-design/SKILL.md)
- 相关规范 Skill：`rtos-communication-debugging`, `rtos-motor-pid-control`, `rtos-project-storytelling`
- 外部/非规范关系：无
- 客户端副本：zcode=same

## `vault-methodology-and-tools`

### `vault-source-boundary-and-derived-artifact-audit`

- 触发描述：Use when maintaining this Obsidian vault and the user needs to distinguish original notes/source code from Defuddle splits, Canvas, HTML demos, backups, build artifacts, attachments, or client Skill copies. Trigger phrases include “这个文件是不是原始资料”, “会不会重复统计”, “来源边界”, “同步 Skill 会覆盖吗”, and “脚本生成的文件能不能当证据”. Do not use for embedded technical diagnosis or ordinary Obsidian formatting.
- 规范源：[`SKILL.md`](tools/distillation/skills/vault-source-boundary-and-derived-artifact-audit/SKILL.md)
- 相关规范 Skill：`interactive-lab-fact-boundary-audit`
- 外部/非规范关系：`json-canvas`, `cangjie-skill`
- 客户端副本：zcode=same

## `workbench-learning-state`

### `embedded-learning-state-and-active-recall`

- 触发描述：Use when auditing or using this Obsidian vault's embedded-learning workbench: deciding what to review, distinguishing 未学/学过/掌握, checking review_flag and last_studied, validating source links, or running a truthful active-recall session. Trigger phrases include “哪些嵌入式内容该复习”, “我看过但答不出来”, “这个算掌握吗”, “检查工作台状态/来源”, “帮我安排主动回忆”. Do not use for solving one technical question, diagnosing a FreeRTOS/Linux/vision fault, or algorithm-specific derivation; route those to the domain Skill and use this only for learning-state management.
- 规范源：[`SKILL.md`](tools/distillation/skills/embedded-learning-state-and-active-recall/SKILL.md)
- 相关规范 Skill：`algorithm-active-recall-loop`, `embedded-interview-layered-answer`, `vault-source-boundary-and-derived-artifact-audit`
- 外部/非规范关系：无
- 客户端副本：zcode=same
