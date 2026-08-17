# Round 2 候选三重验证与升格记录

处理日期：2026-08-14

本文件是第二轮候选池的审计结论。候选文件仍保留完整证据；本表只记录升格决策，不把候选数量当作最终 Skill 数量。

## 验证口径

- **V1 跨来源**：至少两个独立文档、源码位置或构建证据共同支撑；同一篇文章的合并稿/拆分稿不重复计为独立来源。
- **V2 预测力**：方法能从资料没有直接写出的症状推导下一步证据，而不是只复述定义。
- **V3 独特性**：有稳定的适用边界，且不能被现有 Skill 通过改写描述完全替代。
- 代码候选还要区分 D（文档/设计意图）、S（源码行为）、B（构建/资产证据）和 U（未验证）。

## 本轮升格

| 候选 | V1 | V2 | V3 | 处理 | 边界 |
|---|---|---|---|---|---|
| 网络接收路径：硬中断→RingBuffer/NAPI→软中断→协议栈→Socket | 通过 | 通过 | 通过 | `linux-rx-napi-path-diagnosis` | 只诊断 RX 分层断点；TCP 端到端丢包转 `linux-tcp-loss-path-diagnosis`，应用 framing/epoll 转 `linux-socket-multiplexing-design` |
| 固件 build→flash→serial/runtime 可复现验证链 | 通过 | 通过 | 通过 | `rtos-build-flash-runtime-provenance` | 核对工程/产物/烧录/运行证据；FreeRTOS 启动机制、运行时故障和 IAP 协议分别转相邻 Skill |
| Qt 事件循环、槽函数与信号槽生命周期审计 | 通过 | 通过 | 通过 | `qt-event-loop-signal-slot-audit` | 聚焦 UI 线程阻塞、连接重复和 QProcess 事件；文件帧协议转视觉 IPC Skill，项目表达转 storytelling Skill |
| CMake 源码发现、构建树与增量构建审计 | 通过 | 通过 | 通过 | `cmake-source-discovery-incremental-build-audit` | 聚焦“源码是否进入目标/构建是否过时/运行时加载”；通用编译链和视觉 provenance 仍由相邻 Skill 主导 |

升格条件：四条候选均有至少两个原始来源、可由新故障症状触发、能形成独立执行步骤；最终仍必须通过规范 Skill 结构审计和正/负/边界压力测试。若任一 Worker 交付的是模板或来源缺失，则降回候选，不计入规范 Skill。

## 暂缓升格：有价值但与现有 Skill 重叠

| 候选 | 主要重叠 | 当前去向 |
|---|---|---|
| 零拷贝与复制预算 | `linux-tcp-loss-path-diagnosis`、视觉性能/文件 IPC、驱动边界 | 保留为 `principles-round2.md` 的原则；先在相关 Skill 的边界段落中引用 |
| Reactor/Proactor 与多 Reactor | `linux-socket-multiplexing-design` | 作为该 Skill 的扩展测试，不另造同义 Skill |
| TCP 状态/半关闭/TIME_WAIT/端口复用 | `linux-tcp-loss-path-diagnosis`、Socket multiplexing | 保留为补充案例，等待出现独立来源和非重叠触发面 |
| RTOS snapshot→计算→原子提交 | `rtos-task-and-isr-design`、`rtos-runtime-fault-diagnosis` | 先作为 RTOS 共享状态反例/案例，避免把同一锁边界拆成多个 Skill |
| 视觉学习“痛点→函数地图→破坏测试” | `embedded-learning-state-and-active-recall`、视觉 pipeline/tensor Skill | 保留为学习工作流候选，尚不生成独立领域 Skill |
| ADMM 变量依赖与收敛顺序 | `linux-vision-pipeline-and-optimization` | 作为 LIME 复盘章节和测试场景，不独立复制优化 Skill |
| 模型轻量化多指标选择 | 视觉 pipeline、build provenance、tensor contract | 保留为跨 Skill 组合原则 |
| CPU 缓存/伪共享/亲和性 | 视觉 ARM 优化、build provenance | 需要目标平台 benchmark 才能脱离现有优化 Skill |
| PCI 拓扑/BAR/桥窗口 | 当前 vault 缺少完整 PCI 项目源码链 | 保留为待审计候选，不进入规范源 |

## 降级为反例/案例/术语

- UART 与 RS232 层级混淆、Cortex-M 与 ARM Linux syscall 混用、`mmap` 绝对化为零拷贝：作为嵌入式面试反例与术语边界，不单独生成 Skill。
- IAP 默认关闭、CRC 表注释矛盾、奇数长度、二值信号量合并、MQ2 经验值：并入现有 IAP、通信、周期、传感器和运行时故障 Skill 的边界/测试。
- eBPF `last_time_map` key、zone/order `/11`、import/path 不闭合、模式与 Map 错配：并入现有 memory pipeline/source audit 的源码反例。
- 视觉 NEON 尾部、OpenMP 共享累加、LSTR 空检测和后处理生命周期：并入现有视觉 pipeline、tensor 和 provenance 的反例/测试。
- LeetCode 链表、图、树、堆、回溯和复杂度候选：保留在算法 Skill 的案例和测试，不按题型无限拆 Skill。
- 学习总账“学过”不等于“掌握”、占位题目字段：保留在 `embedded-learning-state-and-active-recall` 的状态边界。

## 下一轮候选队列

1. 为四个升格 Skill 做真实客户端新会话盲测；静态 6/6 不代表客户端命中率。
2. 如果用户提供目标设备/内核/编译器/Qt 版本，分别补充版本化证据测试。
3. 对 `linux-rx-napi-path-diagnosis` 增加网卡统计、NAPI budget、softnet_stat 与 Socket backlog 的实机命令模板，但不把通用命令当作仓库项目实测。
4. 对 `rtos-build-flash-runtime-provenance` 增加 AXF/HEX/MAP 哈希和 J-Link 日志记录模板，保持 IAP/APP 地址的条件性表述。
5. 对 Qt/CMake 两个 Skill 检查目标机器的构建目录和运行日志；当前仓库的历史产物只作为证据层。

## 结论

Round 2 的候选池完成了“提取→跨来源→预测力→独特性→边界”筛选。规范源只接受完整 R/I/A1/A2/E/B、真实 `source_files`、结构化测试和 `test-results.md` 的 Skill；任何模板、缺来源或仅有通用常识的目录都必须被审计器拦截。
