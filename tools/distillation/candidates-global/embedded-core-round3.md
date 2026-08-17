# embedded-core 第三轮候选扫描

处理日期：2026-08-14  
扫描配置：按委托使用 Luna 最高配置  
范围：`distillation/embedded-core/source-register.md` 中 disposition 为 `indexed-only` 的 `projects/嵌入式八股/` 来源。`projects/` 与 `archive/` 仅读；本轮不把合并稿、目录页或已有候选当作独立来源。

## 扫描结论

本轮保留 2 条候选，不为凑数提出第三条。两条均满足当前阶段的最低门槛：V1 有至少 2 个独立来源，V2 能推导来源未直接回答的新问题，V3 有稳定的触发面和现有 Skill 边界。它们仍是候选审查记录，不是 canonical Skill；没有创建 `distillation/skills/` 目录、测试文件或全局索引条目。

去重时读取了 `distillation/skills/` 下已有 Skill 的 `name`/`description`。本轮重点对照了 `linux-udp-datagram-endpoint-routing`、`linux-udp-broadcast-reachability-contract`、`linux-udp-multicast-interface-membership-contract`、`linux-socket-multiplexing-design`、`linux-tcp-loss-path-diagnosis`、`embedded-c-struct-binary-contract-audit`、`stm32-clock-and-sampling-timing`、`rtos-software-timer-periodic-design`、`rtos-sensor-acquisition-and-fusion`、`rtos-motor-pid-control` 及进程/线程、eBPF、构建类 Skill。

## C3-01：嵌入式 UDP 应用可靠性合同审计

- **title**：嵌入式 UDP 应用可靠性合同审计
- **建议 slug**：`embedded-udp-reliability-contract-audit`
- **候选结论**：保留候选；V1/V2/V3 均通过，但升格前需要真实协议实现或丢包/乱序/重复包测试作为降级风险的补强。

### V1：两个独立来源

1. `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.18 如何基于 UDP 协议实现可靠传输？.md:29-41,64-135,137-195,197-248`（独立的 QUIC/UDP 方法论文章）
   - 明确指出 UDP 可靠性不能停留在“加一个 ACK”，需要在应用层设计编号、确认、重传、流量控制和拥塞控制。
   - 用严格递增的 `Packet Number` 区分报文身份，用 `Stream ID + Offset` 区分被重传的数据内容，并用独立 Stream/Connection 窗口解释乱序确认和队头阻塞边界。
2. `projects/嵌入式八股/嵌入式高频八股150题/04 通信协议-网络（71-90题）.md:149-202,779-823,879-925`（独立的嵌入式通信/网络题库）
   - 自定义帧给出帧头、长度、序号、CRC、超时丢弃和重复包去重的接收状态机。
   - UDP 选型段把“可靠性优先/延迟优先/资源受限”与应用层序号、ACK、重传、超时的职责连接起来；同时区分 UDP 数据报和 TCP 字节流 framing。

两份资料不是同一篇文章的合并/拆分副本：第一份提供传输协议内部的编号、乱序和窗口模型，第二份提供 MCU/嵌入式协议帧的落地字段和状态机，交集足以支撑一个“合同审计流程”，而不是只支撑 UDP 定义。

### V2：资料未直接回答的新问题及推导

- **新问题**：一个 100 Hz 的 UDP 传感器通道允许丢少量样本，但每个样本 20 ms 后就过期；网络可能重复、乱序、延迟交付。如何保证重传不会把旧值重新施加到控制逻辑，也不会让一个丢包阻塞其他通道？
- **推导**：
  1. 先把“报文是否到达”和“业务样本是否仍有效”拆开。使用单调的消息/记录序号与采样时间或截止时间；ACK 只能确认传输层/协议层收到，不能自动证明样本仍可应用。
  2. 借鉴来源中的双层身份：用 packet-level 编号处理重传与 RTT，用 message/stream-level 序号或 offset 做去重、排序和内容重组；收到过期或已经提交的样本时丢弃，不再次触发控制动作。
  3. 对重要命令使用 ACK + 有界重传，对高频遥测使用选择性确认/跳过过期数据，而不是无条件 stop-and-wait；重传队列必须有截止时间和容量上限。
  4. 独立通道或逻辑 Stream 各自维护窗口与队列，避免一个通道的丢包制造全局队头阻塞；仍需增加应用层幂等键，防止重复命令造成二次执行。
  5. 用可控丢包、乱序、重复、延迟、重启和队列满测试验证：旧样本不执行、有效样本最终按合同处理、内存有界、不同通道互不误阻塞。

这不是来源中“UDP 怎么实现可靠传输”的直接复述，而是把来源中的编号、偏移、流量控制和嵌入式帧状态机组合成一个有截止时间、重复语义和资源边界的新故障设计问题。

### V3：独特性

独特单位不是“UDP 不可靠”或 QUIC 字段百科，而是沿着“业务可靠性语义 → 报文/消息双重身份 → ACK/重传/去重 → 乱序与队头阻塞 → 流量/队列上限 → 故障注入验证”审计一份应用协议。它能区分“网络已收到”“消息已重组”“命令已执行”“遥测仍未过期”四种不同合同。

### 与现有 Skill 的边界

- `linux-udp-datagram-endpoint-routing` 只负责 `bind`、临时端口、`sendto/recvfrom` 源地址和单播回包路由；本候选从端点已经成立之后开始，审计应用层可靠性和消息生命周期。
- `linux-udp-broadcast-reachability-contract` 与 `linux-udp-multicast-interface-membership-contract` 分别处理广播权限/作用域和组播接口/入组；本候选不替代它们。
- `linux-socket-multiplexing-design` 负责 TCP/UDP Socket 的 framing、短 I/O、epoll、背压和 fd 生命周期；本候选只在需要“丢包后如何确认、重传、去重、过期和保持业务语义”时主导，事件循环实现仍转交前者。
- `linux-tcp-loss-path-diagnosis` 负责 TCP 队列、重传、网卡路径和 ACK 到业务的交付边界；本候选不是 TCP 内核丢包排查，也不把 UDP 应用重传写成 TCP 内核行为。
- `embedded-bus-selection` 负责 UART/SPI/I²C/CAN/UDP 等链路选型；本候选假设 UDP 已被选定，不回答“应该选哪条总线”。

### source_files

- `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.18 如何基于 UDP 协议实现可靠传输？.md`
- `projects/嵌入式八股/嵌入式高频八股150题/04 通信协议-网络（71-90题）.md`

### source_symbols

`Packet Number`、`Stream ID`、`Offset`、`ACK`、`MAX_STREAM_DATA`、`BlockFrame`、`Connection ID`、`sequence`、`CRC16`、`timeout`、`duplicate suppression`、`sendto`、`recvfrom`、`frame parser`

### 风险 / 降级理由

- 两份来源主要是教程/题库，没有当前仓库的 UDP 业务实现、抓包、目标 MCU/内核版本或吞吐/延迟测试；不能把它们写成用户已有的协议实现经验。
- QUIC 文章的协议字段和队头阻塞解释不能自动推出一个可互操作的 QUIC 实现；没有认证、加密、密钥、重放保护和拥塞测试时，最多形成“应用可靠性合同审计”候选，不应宣称生产级安全传输方案。
- 若用户只是问 UDP/TCP 定义、`socket` 参数、普通 endpoint 路由或 QUIC 字段含义，应直接拒绝独立 Skill 触发，转现有网络 Skill或普通说明。
- 若后续拿不到协议代码/状态机/故障注入证据，降级为 `linux-socket-multiplexing-design` 的应用可靠性扩展案例，不升格为新 Skill。

## C3-02：嵌入式跨表示层数值合同与阈值审计

- **title**：嵌入式跨表示层数值合同与阈值审计
- **建议 slug**：`embedded-numeric-contract-audit`
- **候选结论**：保留条件候选；V1/V2/V3 通过，但必须把“浮点基础知识”收窄为原始位模式、类型转换、中间溢出、单位缩放和控制阈值的一条可执行审计链。

### V1：两个独立来源

1. `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.7 为什么 0.1 + 0.2 不等于 0.3？.md:70-88,100-168,178-226,230-258`（独立的计算机表示文章）
   - 给出十进制小数到二进制的不可终止转换、IEEE 754 的符号/指数/尾数、有限精度舍入，以及 `0.1 + 0.2` 不是精确 `0.3` 的原因。
   - 关键可迁移事实是：数值的“数学写法”与内存中的近似表示不同，精度和范围由表示格式决定，不能用字符串或直觉判断等值。
2. `projects/嵌入式八股/3. 杂七杂八/14. PLC 原理 + 数据类型，工控入门天花板知识点.md:648-660,720-794,948-1047,1135-1184,1385-1428`（独立的工业控制数据类型/工程避坑文章）
   - 同时覆盖 DWORD/DINT/REAL 对同一位宽的不同解释、INT/DINT 中间表达式溢出、`INT_TO_REAL`/`REAL_TO_INT` 的截断/舍入不确定性、4–20 mA 量程缩放、浮点容差、滞回和传感器/模块/线路误差边界。
   - 它把“类型表”连接到实际控制判断：转换顺序、范围检查、阈值区间和输入异常状态都会改变最终动作。

两份资料的来源和问题语境不同：第一份解释表示层误差从何而来，第二份把表示误差放进工业量程换算和控制判定；只有将它们组合成“跨表示层合同”才形成方法论，单独的 IEEE 754 章节不构成 Skill。

### V2：资料未直接回答的新问题及推导

- **新问题**：一个 12 位 ADC/4–20 mA 通道在边界附近偶发不触发报警；把最终变量改成 `REAL` 后仍然失败。应该从哪里开始定位，才能区分数据格式、算术溢出、舍入和物理噪声？
- **推导**：
  1. 不从最终阈值开始猜，先记录 `raw bits → signed/unsigned/BCD/端序解释 → 中间表达式类型 → 显式转换 → 工程单位缩放 → 滤波/舍入 → 阈值/滞回` 的每个中间值和单位。
  2. 先查“扩大结果变量但没有扩大中间表达式”的情况：如果乘法或累加在 INT 中已经回绕，之后再转 REAL 只能保存错误结果。
  3. 再查原始位模式的解释是否错位：同一 16/32 位可能被当作有符号整数、BCD、REAL 或错误端序；这类错误会在缩放前就产生数量级异常。
  4. 对浮点判定使用相对/绝对容差和滞回，而不是精确相等；把 ADC 量化噪声、传感器误差、模块偏移/增益和线路干扰与表示误差分别记录。
  5. 用最小边界向量覆盖最小值、最大值、负值、转换临界值、刚好越过报警阈值、重复输入和断线/越量程；定位“第一个偏离合同的节点”，而不是只换 `float/double/REAL`。

来源没有直接给出这个 ADC/4–20 mA 边界故障的完整排查顺序；推导来自“浮点近似表示”与“PLC 中间类型/量程/阈值语义”的组合，并可产出可验证的中间值和边界测试。

### V3：独特性

独特单位不是“什么是 float”或“REAL 有几位精度”，而是把数值问题写成一份可审计合同：位模式解释、范围、单位、缩放、转换时机、舍入策略、误差预算、阈值/滞回语义和边界测试。它能定位“最终类型看似正确但中间已经溢出”“分辨率足够但传感器/线路误差主导”“浮点相等判断导致状态不切换”等跨层问题。

### 与现有 Skill 的边界

- `embedded-c-struct-binary-contract-audit` 负责 struct/寄存器/DMA/帧的偏移、对齐、端序、位域和 CRC 布局；本候选从字节已经解码为数值后开始，审计算术和决策语义。若问题是“字段从哪个字节取”，以前者为主。
- `stm32-clock-and-sampling-timing` 负责时钟树、ADC 时钟、采样时间和采样周期；本候选不证明 ADC 采样已经正确，只审计采样结果进入计算后的数值合同。需要同时核对采样时序时组合使用。
- `rtos-sensor-acquisition-and-fusion` 负责 DHT11/MQ2 物理采集、预热、标定和多传感器融合；本候选不把经验公式变成 ppm 精度结论，只处理表示/转换/阈值层。
- `rtos-motor-pid-control` 负责 PWM/RPM/误差积分和 PID 调参；本候选只审计控制量进入 PID 前后的数值表示、饱和和阈值合同，不替代闭环调参。
- `embedded-interview-layered-answer` 负责如何表达面试答案；本候选必须由实际数值故障/代码审计触发，不能退化成浮点八股讲解。

### source_files

- `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.7 为什么 0.1 + 0.2 不等于 0.3？.md`
- `projects/嵌入式八股/3. 杂七杂八/14. PLC 原理 + 数据类型，工控入门天花板知识点.md`

### source_symbols

`IEEE 754`、`float`、`double`、`REAL`、`LREAL`、`INT_TO_REAL`、`REAL_TO_INT`、`DINT_TO_INT`、`BCD_TO_INT`、`ABS`、`RawValue`、`RawMinimum`、`RawMaximum`、`PressureRaw`、`PressureTolerance`、`SensorWireBreak`、`SensorOverRange`、`ScaleLinear`

### 风险 / 降级理由

- PLC 数据类型、转换指令的舍入/溢出和 REAL/LREAL 支持依厂商、CPU 代际、固件和语言运行时；不能把文章中的语义无条件推广到 C、C++ 或某一 STM32 ABI。
- 当前 indexed-only 来源没有配套数值计算源码、编译器选项、硬件 ADC 原始日志或标定实验；候选目前是方法论，不是项目实现事实。
- 若用户只是问 IEEE 754、`0.1 + 0.2`、float/double 位宽或 BCD 定义，应明确 reject 为普通定义；只有跨原始数据、转换链和控制阈值的故障审计才触发本候选。
- 若后续无法补充目标平台的转换语义和边界测试，降级为 `embedded-c-struct-binary-contract-audit`/`stm32-clock-and-sampling-timing`/`rtos-sensor-acquisition-and-fusion` 的交叉案例，不创建独立 Skill。

## 明确 Reject：普通定义、重复百科或证据不足

| 主题 | 判定 | reject 理由与去向 |
|---|---|---|
| IEEE 754、`0.1 + 0.2`、补码、BCD、REAL/INT 位宽的单点解释 | **reject：普通定义** | 只有概念、格式和例题，没有独立执行触发面；仅作为 C3-02 的 V1 证据。泛问转普通说明，不生成数值百科 Skill。 |
| UDP/TCP 区别、Socket API、QUIC 字段逐项背诵 | **reject：普通定义/重复百科** | C3-01 只保留可靠性合同与故障注入框架；endpoint、广播、组播、framing 和 TCP 路径已有对应 Skill。 |
| PLC“输入采样→程序执行→输出刷新”、扫描周期和 I/O 延迟公式 | **reject：平台定义/边界重叠** | PLC 文档有清晰解释，但没有独立项目源码或目标控制器证据；且与 `stm32-clock-and-sampling-timing`、`rtos-software-timer-periodic-design`、`rtos-task-and-isr-design` 的时序/事件边界重叠。保留为案例，不独立升格。 |
| CPU 局部性、伪共享、亲和性、上下文切换 | **reject：Round 2 暂缓重复** | 已在 `frameworks-round2.md` 记录，缺少目标 ARM benchmark/counter；不以 indexed-only 教程再造性能 Skill，必要时作为视觉优化或构建 provenance 的测试场景。 |
| 零拷贝、`mmap`、sendfile、splice | **reject：Round 2 暂缓/宣传语审计已覆盖** | 需要逐段复制、DMA、缓存和实测吞吐，但现有网络/视觉/驱动边界已覆盖主要触发面；“mmap=零拷贝”本身是反例，不是独立 Skill。 |
| Reactor/Proactor、多 Reactor 拓扑 | **reject：与 `linux-socket-multiplexing-design` 重复** | 可作为事件循环和 framing 的边界测试，但本轮没有新的独立触发合同。 |
| TCP 半关闭、TIME_WAIT、端口重用、SYN/accept 状态问题 | **reject：与 `linux-tcp-loss-path-diagnosis`/`linux-socket-multiplexing-design` 重叠** | indexed-only 文章提供状态解释和抓包案例，但尚不足以形成独立于既有 TCP 交付/连接生命周期边界的 Skill。 |
| PCI 拓扑、BAR、桥窗口、资源分配 | **reject：证据不足** | 虽可形成资源审计框架，但当前只有教程型文章，没有完整 PCI 驱动源码、启动日志或硬件配置证据；沿用 Round 2 的“待审计候选”状态，不写入本轮保留候选。 |
| CMake 源码发现、构建树、增量配置 | **reject：已有 Skill** | 已有 `cmake-source-discovery-incremental-build-audit`，不能从 indexed-only CMake/构建百科重复生成。 |
| 进程/线程区别、锁/死锁四条件、IPC API、信号/守护进程定义 | **reject：已有 Skill/普通定义** | 已有 `linux-thread-sync-deadlock-diagnosis`、`linux-process-signal-daemon-lifecycle`、`linux-fd-process-io-debugging`；没有新的独立触发面。 |
| eBPF 工作原理、Map/探针概念 | **reject：已有 Skill** | 已有 `linux-memory-ebpf-pipeline` 与 `linux-memory-source-audit`；indexed-only 通用 eBPF 文章不能改变项目源码边界。 |
| ADC 分辨率、采样时间、DMA、低功耗、PID 的单点说明 | **reject：已有 Skill/普通定义** | 分别由 `stm32-clock-and-sampling-timing`、`rtos-communication-debugging`、`rtos-sensor-acquisition-and-fusion`、`rtos-motor-pid-control` 覆盖；只保留可证明的新组合问题。 |

## 本轮实际写入范围

- 仅写入：`distillation/candidates-global/embedded-core-round3.md`
- 未创建 canonical Skill、`test-prompts.json`、`test-results.md`、`INDEX.md` 或其他全局索引。
- `projects/`、`archive/` 及已有 `distillation/skills/` 均未写入。
