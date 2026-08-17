# Embedded-core 未回链主题卡（候选登记）

> 这是覆盖审计后的“值得继续主题化”的小队列，不是新 Skill 清单，也不是三重验证通过表。所有 `v1/v2/v3` 都是初判；最终是否进入 RIA++ 仍需逐条读源、交叉核对和压力测试。

## 使用边界

- `unlinked-review.tsv` 记录的是逐文件覆盖状态；本文件只把相邻文件聚合成 8 个可审查主题。
- 主题可预测新问题才有候选价值；单纯定义、转载教程和已有 Skill 的重复内容降级为术语或现有 Skill 的补证。
- 代码、内核版本、芯片平台和真实抓包/运行结果仍是独立证据层，不能由教程正文替代。

## 候选主题

### 1. CPU Cache 与共享数据一致性合同

- 证据：CPU 性能/局部性教程与缓存一致性教程各自提供概念入口。
- 初判：V1 有两份独立资料，V2 可用于解释共享状态、DMA 或 cache 线问题，V3 仍需确认是否能形成“现象→内存序/一致性→证据”的独特流程。
- 现有关系：`embedded-c-struct-binary-contract-audit`、`embedded-memory-lifetime-and-pool-design`；暂不新建 Skill。

### 2. 多线程竞争、同步与死锁排查

- 证据：多线程冲突和死锁两篇独立教程，另有 RTOS 面试题作为项目语境。
- 初判：V1 较强，V2 能预测锁顺序、阻塞、饥饿和优先级反转问题；V3 的关键是保留 `pstack + gdb`、锁顺序和 RTOS/Linux 边界，而不是重复“加锁”。
- 现有关系：`linux-thread-sync-deadlock-diagnosis`、`rtos-task-and-isr-design`、`rtos-runtime-fault-diagnosis`。

### 3. TCP 字节流与应用层消息边界

- 证据：TCP 面向字节流专题与 Socket 高并发编程资料。
- 初判：可从“发送一次不等于接收一次”推导固定长度、分隔符、长度前缀和状态机，但需继续核对仓库中真实 Socket 代码，避免只留下八股定义。
- 现有关系：`linux-socket-multiplexing-design`、`linux-tcp-loss-path-diagnosis`。

### 4. TCP 重传、窗口与拥塞/流量控制定位

- 证据：机制说明与抓包分析各一份，具备从包序列到现象的桥接潜力。
- 初判：V1 较强，V2 可用于区分网络丢包、接收窗口受限和应用层未消费；V3 必须加入 `ss`、抓包、socket 队列和日志的证据顺序。
- 事实边界：内核参数、网卡队列和抓包结果依目标机器，当前仅登记方法论候选。

### 5. select/poll/epoll 就绪语义与负载边界

- 证据：两份 IO 多路复用解释，覆盖演进、就绪队列和 LT/ET。
- 初判：候选价值在于把 fd 数量、活跃度、非阻塞读取和触发模式连接成决策流程，而不是简单比较“epoll 更快”。
- 现有关系：`linux-socket-multiplexing-design`、`linux-userspace-timer-drift-audit`。

### 6. eBPF 受约束内核扩展的观察边界

- 证据：eBPF 原理图解与物理内存项目面试材料。
- 初判：V1 只有部分跨来源支撑，V2 可帮助定位 verifier、probe、Map 和用户态读取问题，但 V3 泛化风险高。
- 处置：降级为术语/入口，具体 pipeline、Map 计数和源码审计沿用现有 Linux memory Skill。

### 7. Linux 虚拟内存回收与压力现象解释

- 证据：虚拟内存、物理内存和内存策略三类资料。
- 初判：可预测 page cache/anonymous reclaim、kswapd/direct reclaim 等追问；内核版本、架构和 libc 细节不能从资料直接升级为目标机事实。
- 处置：并入 `linux-virtual-memory-reclaim-path` 与伙伴系统 Skill，不重复生成。

### 8. C/C++ 生命周期、布局与二进制合同审计

- 证据：C、C++、通信协议资料共同覆盖对象生命周期、布局、端序和帧合同。
- 初判：需要拆分问题类别后才具备 V3 独特性；可用于预测 DMA 缓冲、ABI、对齐和协议解析错误。
- 处置：优先补充现有 `embedded-c-struct-binary-contract-audit`、`embedded-cpp-resource-lifetime` 和内存生命周期 Skill 的来源链接。

## 未处理队列

1. 对每条候选读取至少两个独立正文段落，记录精确标题/段落或源码符号。
2. 为 TCP/epoll 候选补真实 Socket 代码或明确标记为教程方法论。
3. 为 Cache/C 合同候选补目标 MCU、DMA、编译器/ABI 或运行日志证据。
4. 将“已有 Skill 的补证”与“真正新增方法论”分开，再决定是否进入 `verified.md`。
5. 只有通过 V1/V2/V3 且用户确认后，才允许生成新 `SKILL.md`；本轮没有生成。
