# 全局案例/项目事实候选 Round 2

> 范围：RTOS、Linux 物理内存/eBPF、Linux 视觉、Linux 用户态教程和 LeetCode 资料。
> 本文件只登记候选，不创建最终 Skill；原始 vault、构建物和 `distillation/skills/` 规范源均保持只读。
>
> 证据标记：`D` = 文档/学习资料声称或教学意图；`S` = 源码实际行为；`B` = 构建、二进制或图片产物证据；`U` = 当前快照未核实。`B` 只能证明产物存在或曾被生成，不能单独证明目标硬件、目标环境或性能已复现。

## V1/V2/V3 初判说明

- `V1`：是否能由同域文档与源码/构建物互相回链；教程和题解的 `V1` 只表示资料内部交叉支撑，不表示用户项目实测。
- `V2`：能否从该具体事实推出可复盘的故障、代码审计问题、面试追问或学习动作。
- `V3`：是否绑定本 vault 的具体文件、符号和事实边界，而不是泛泛的 API 清单。
- `✓` 表示当前值得保留为候选，`△` 表示证据或迁移范围仍有限；初判不等于最终 Skill 通过。

## RTOS

### r2-rtos-01：TIM4 中断—二值信号量—测速任务的时序链

- purpose: 支持 RTOS 启动顺序、ISR 最小化和测速链路的项目复盘；可追问“为什么不能在 TIM4 ISR 里直接做测速和滤波”。
- source_files:
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.c#L121-L125,L145-L188,L783-L839`
  - `projects/RTOS项目/源码/BSP/MOTOR/motor.c#L242-L264,L267-L339`
  - `projects/RTOS项目/源码/BSP/MOTOR/motor.h#L15-L37`
  - `projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md#L15-L38,L253-L317`
  - `projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.2 任务创建、调度与优先级设计.md#L77-L111,L149-L154`
  - `projects/RTOS项目/源码/OBJ/PWM.build_log.htm#L68-L76`
- source_symbols: `System_Init`, `StartTask`, `TIM4_init`, `TIM4_IRQHandler`, `SpeedCalcTask`, `g_speedCalcSemaphore`, `get_encoder_value`, `get_speed`, `xSemaphoreGiveFromISR`
- 文档声称（D）：文档把 `TIM4` 描述为 1 ms 触发源，把 `SpeedCalcTask` 描述为优先级 6 的中断驱动任务，并称约 50 次通知后完成一次 50 ms 速度计算。
- 源码实际行为（S）：`System_Init()` 先创建 `g_speedCalcSemaphore`；`StartTask()` 创建 `SpeedCalcTask` 后才调用 `TIM4_init(5-1, 14400-1)`。`TIM4_IRQHandler()` 只清中断、释放二值信号量并请求切换，计算在 `SpeedCalcTask` 中完成。`get_speed(..., 50)` 内部以 `sp_count == ms` 决定何时更新速度，并在 10 个样本上做去极值平均和一阶滤波。
- 构建/图片证据（B）：`PWM.build_log.htm` 记录本次 Keil 构建 `0 Error(s), 0 Warning(s)` 及程序大小；这不证明 TIM4 实际频率、ISR 延迟或测速结果。
- 未核实内容（U）：没有当前目标板的示波器/逻辑分析仪、串口时间戳或长时间测速日志；二值信号量在任务来不及消费时是否合并事件，也未由运行证据核实。
- 事实边界：可安全表达为“源码实现了 ISR 到任务的通知链和 50 ms 参数化测速/滤波逻辑”；不能表达为“硬件已稳定每 50 ms 测速”或“闭环实时性已实测”。
- V1 初判：✓（启动文档、任务文档、应用源码、驱动源码和构建日志可回链）。
- V2 初判：✓（可预测初始化顺序错误、任务饿死、通知合并和测速延迟等追问）。
- V3 初判：✓（具体到 `g_speedCalcSemaphore`、`TIM4_IRQHandler` 和 `get_speed` 的双时间尺度）。

### r2-rtos-02：Cooking Event 三态机与多传感器 AND 触发

- purpose: 支持自动模式项目复盘和面试解释；把“阈值、状态转换、电机动作、超时退出”串成可核验案例。
- source_files:
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.c#L331-L475`
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.h#L43-L70`
  - `projects/RTOS项目/源码/BSP/WIND/wind_speed.c#L59-L113`
  - `projects/RTOS项目/源码/BSP/WIND/wind_speed.h#L15-L47`
  - `projects/RTOS项目/文档/5 系统功能实现/5.2 自动模式状态机与Cooking Event检测.md#L15-L31,L64-L126,L132-L228`
- source_symbols: `AUTO_STATE_STARTUP`, `AUTO_STATE_COOKING`, `AUTO_STATE_DELAY_OFF`, `MotorControlTask`, `WindSpeed_Update`, `WindSpeed_GetPWMCompare`, `g_autoModeState`, `g_systemState.cookingEventActive`
- 文档声称（D）：文档称自动模式有启动、Cooking、延时关闭三态；温度 `>26`、湿度 `>50`、气体 `>100` 必须同时满足；启动等待和 Cooking 超时各 60 s，事件结束后延时 10 s。
- 源码实际行为（S）：`WindSpeed_Update()` 先把温度、湿度、气体分别归一化并加权映射到 PWM，再用三个 `&&` 条件设置 `isCookingEvent`。`MotorControlTask()` 每轮以注释标称的 50 ms 增加计数，启动态检测事件或超时转待机，Cooking 态检测事件消失或 60 s 超时，Delay-Off 态检测事件恢复或 10 s 超时。
- 构建/图片证据（B）：当前有 RTOS Keil 构建日志，但没有自动模式传感器回放、LCD 录屏或电机转速曲线作为状态转换证据。
- 未核实内容（U）：阈值是否适合真实厨房环境、`delay_ms(50)` 的真实周期、DHT11/MQ2 的噪声与误触发率、PWM 到实际风量的关系均未实测。
- 事实边界：这是“源码状态机和算法规则”候选；不能升级为“自动模式已在真实烹饪场景可靠工作”或“60 s/10 s 是硬实时准确值”。
- V1 初判：✓（功能文档、头文件常量、状态机源码和风速源码交叉一致）。
- V2 初判：✓（可预测边界抖动、AND 条件过严、计时漂移和超时安全路径）。
- V3 初判：✓（将 `WindSpeed_Update()` 的判定与 `MotorControlTask()` 的状态转换绑定）。

### r2-rtos-03：全局状态锁覆盖不完整的并发审计

- purpose: 支持代码事实审计和面试追问“项目如何保护任务间共享状态”；可区分锁粒度优化与完整锁覆盖。
- source_files:
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.c#L34-L37,L254-L324,L331-L475,L525-L568,L690-L778`
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.h#L43-L63`
  - `projects/RTOS项目/文档/2 系统架构与设计/2.4 任务间通信：互斥信号量与全局状态管理.md#L15-L25,L54-L76,L80-L169`
- source_symbols: `g_systemState`, `g_dataMutex`, `SensorTask`, `WindSpeedTask`, `MotorControlTask`, `AntiBackflowTask`, `System_SwitchMode`, `System_ToggleMotor`
- 文档声称（D）：文档校准页明确指出项目只创建一个 `g_dataMutex`；传感器任务分两次短暂获取同一个锁，并非注释所写的“两把锁”；同时指出 `AntiBackflowTask` 等路径并非所有共享字段都受锁保护。
- 源码实际行为（S）：`SensorTask()` 分别锁住温湿度和气体写入；`WindSpeedTask()` 锁住输入快照和输出写回；但 `MotorControlTask()` 在读取和修改多个 `g_systemState` 字段时存在未持锁的 `switch`/分支，`AntiBackflowTask()` 直接读写 `currentMode`、`gasConcentration`、`gasThreshold`、`motorRunning` 等字段。模式切换函数本身使用 `g_dataMutex`，形成锁内修改与锁外消费并存的边界。
- 构建/图片证据（B）：有成功构建日志，但没有 ThreadSanitizer、竞态复现、任务跟踪或目标板异常日志。
- 未核实内容（U）：字段访问在具体 Cortex-M 编译器和中断/任务调度下是否实际产生错误、是否依赖单字宽原子性、优先级反转是否发生，均未由运行证据确认。
- 事实边界：可以说“源码存在共享状态保护不一致，值得按字段和访问者审计”；不能说“已复现数据竞争”或“单字读写天然安全”。
- V1 初判：✓（源码访问点与校准文档逐项互证）。
- V2 初判：✓（可由无锁读取推导陈旧快照、覆盖顺序和模式切换竞态的检查路径）。
- V3 初判：✓（具体到同一 `SystemState_t` 的生产、计算、控制和防回流消费者）。

### r2-rtos-04：IAP 文档链存在，但当前默认目标剔除了升级路径

- purpose: 支持项目复盘中“设计过/写过”与“当前 target 默认启用”之间的事实边界，也支持 IAP、CRC、链接布局审计。
- source_files:
  - `projects/RTOS项目/源码/SYSTEM/sys/sys.h#L19-L34`
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.c#L49-L77,L127-L180,L576-L684`
  - `projects/RTOS项目/源码/BSP/DMA/dma.c#L20-L68`
  - `projects/RTOS项目/源码/BSP/IAP/iap.c#L14-L62`
  - `projects/RTOS项目/源码/BSP/CRC32/crc32.c#L54-L128`
  - `projects/RTOS项目/源码/tools/add_crc32.py#L15-L62`
  - `projects/RTOS项目/源码/tools/APP.bin`
  - `projects/RTOS项目/源码/tools/APP_crc.bin`
  - `projects/RTOS项目/源码/USER/project.uvprojx#L21-L24,L368-L368`
  - `projects/RTOS项目/源码/USER/PWM.map#L1682-L1720,L3268-L3270`
  - `projects/RTOS项目/源码/OBJ/PWM.build_log.htm#L68-L76`
  - `projects/RTOS项目/文档/5 系统功能实现/5.3 固件升级（IAP）：Boot + 单APP分区与串口DMA传输.md#L15-L40,L102-L120,L212-L244`
- source_symbols: `ifopen`, `buff_size`, `iap_task`, `DMA1_Channel5_IRQHandler`, `MYDMA_Config`, `CRC32_VerifyFirmware`, `iap_write_appbin`, `iap_load_app`, `FLASH_APP1_ADDR`
- 文档声称（D）：IAP 文档描述 PC 端追加 CRC32、USART1+DMA 接收、任务校验、单 APP 区擦写和跳转；同时明确它是默认关闭的实验链路，不是 A/B 回滚方案。
- 源码实际行为（S）：`sys.h` 将 `ifopen` 定义为 `0`，`buff_size=3692` 只在 `#if ifopen` 下定义；接收缓冲区、IAP 任务、DMA 接收长度和 DMA 中断处理均受条件编译控制。启用路径中，CRC32 只做完整性校验，随后检查入口、擦写 `FLASH_APP1_ADDR` 并跳转；没有签名、备份槽、版本选择或断电回滚。
- 构建/图片证据（B）：`APP.bin` 为 3688 bytes、`APP_crc.bin` 为 3692 bytes；`PWM.map` 明确移除了 `iap_load_app`、`iap_write_appbin`、CRC 函数和相关数据；构建日志为 `0 Error(s), 0 Warning(s)`。当前 Keil 工程仍从 `0x08000000`、长度 `0x10000` 链接。
- 未核实内容（U）：没有与 `0x0800F000` APP 起始地址对应的独立 APP 工程、Boot+APP 双工程烧录日志、真实串口升级或断电恢复测试；CRC 与 PC 端 `zlib.crc32()` 的跨端回归也未见可追溯测试记录。
- 事实边界：面试可说“仓库有一条受 `ifopen` 控制的 IAP 实验代码链，当前默认构建把它裁掉”；不能说“当前固件已实现可部署的 Bootloader 升级”或“CRC 提供安全认证”。
- V1 初判：✓（IAP/CRC 文档、条件编译源码、MAP、二进制和工程配置相互校准）。
- V2 初判：✓（可预测链接地址冲突、默认关闭误判、固定长度、断电回滚和 CRC 安全边界）。
- V3 初判：✓（设计链与当前 `PWM.map` 删除记录形成鲜明、可回链的事实对照）。

## Linux 物理内存/eBPF

### r2-mem-01：外碎片 tracepoint 记录的是按 PID 聚合快照

- purpose: 支持 eBPF 项目复盘和源码事实审计；澄清 `mm_page_alloc_extfrag` 事件、`fallback_order` 和 PID 聚合的表达边界。
- source_files:
  - `projects/Linux物理内存检测项目/源码/extfraginfo.c#L7-L59`
  - `projects/Linux物理内存检测项目/源码/exfrag.py#L126-L148`
  - `projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.1 外碎片化事件采集.md`
  - `projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md#L23-L64,L194-L224`
- source_symbols: `struct data_t`, `counts_map`, `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)`, `get_count_data`, `alloc_order`, `fallback_order`
- 文档声称（D）：项目文档将 tracepoint 与外碎片 fallback 事件关联，并将用户界面描述为实时统计分配行为；校准文档进一步提醒不能把 `fallback_order` 简化成“实际只分到更小 order”。
- 源码实际行为（S）：`extfraginfo.c` 以 PID 为 `counts_map` key；首次事件保存 PFN、两个 order、comm 和 `count=1`，后续只累加 count 并覆盖最近一次 PFN/order/comm。`exfrag.py` 将 map 展示为按 PID 排序的快照，不保存事件时间序列、迁移类型或 PID 生命周期。
- 构建/图片证据（B）：当前没有 eBPF attach 成功日志、内核 trace 输出、workload 回放或抓包/截图证据；源码文件存在本身不证明 tracepoint 在目标内核可用。
- 未核实内容（U）：目标内核中事件字段的具体语义、跨 CPU 更新是否严格原子、PID 复用影响、实际事件数量和 `fallback_order` 与迁移类型的因果关系均待验证。
- 事实边界：应称“源码实现了 `mm_page_alloc_extfrag` 的按 PID 聚合原型”；不能称“记录了完整外碎片历史”或“证明某进程制造了全部碎片”。
- V1 初判：✓（内核探针源码、Python 展示和源码审计文档互证）。
- V2 初判：✓（可预测 PID 聚合丢历史、迁移类型缺失和过度归因问题）。
- V3 初判：✓（具体到 `counts_map` value 的最近一次字段覆盖语义）。

### r2-mem-02：zone/order 状态采集与用户态 `/11` 推算

- purpose: 支持伙伴系统碎片指标代码审计；把 eBPF 的 zone/order 遍历和 Python 展示层硬编码放到同一案例中。
- source_files:
  - `projects/Linux物理内存检测项目/源码/fraginfo.c#L6-L27,L37-L89,L91-L167`
  - `projects/Linux物理内存检测项目/源码/exfrag.py#L87-L124`
  - `projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.2 内存状态统计方法.md`
  - `projects/Linux物理内存检测项目/文档/3 深入理解/3.4 数据采集与处理/3.4.3 碎片化指数计算算法.md`
  - `projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md#L27-L33,L140-L155,L182-L203`
- source_symbols: `MAX_ORDER`, `fill_contig_page_info`, `unusable_free_index`, `__fragmentation_index`, `kprobe__get_page_from_freelist`, `pgdat_map`, `zone_map`, `get_nr_zones`, `get_node_data`
- 文档声称（D）：文档将 kprobe 描述为采集 node/zone/order 的伙伴系统状态，并将 `unusable_free_index` 与 `__fragmentation_index` 作为两类碎片指标展示。
- 源码实际行为（S）：`fraginfo.c` 本地定义 `MAX_ORDER 10`，遍历 `0..MAX_ORDER` 和 `MAX_NR_ZONES`，从 `zone->free_area[order].nr_free` 计算总空闲块、可满足块、空闲页和两个 score。`pgdat_map` 的字段名为 `pgdat_ptr`，但写入的是 `node_start_pfn`；Python `get_node_data()` 又用 `len(zone_data)/11` 推导 zone 数量，假设每个 zone 永远有 11 个 order 记录。
- 构建/图片证据（B）：没有目标内核版本、eBPF verifier 日志、`/proc/buddyinfo` 对照或 TUI 输出截图；当前源码存在不等于这些结构偏移可在目标内核加载。
- 未核实内容（U）：目标内核 `free_area` 有效长度、`MAX_ORDER`/现代内核替代宏、zone map 更新是否完整、两个指标与内核工具输出的一致性均待验证。
- 事实边界：可复盘为“原型按固定 order 范围计算指标，用户态用 `/11` 还原数量”；不能称为跨内核稳定的伙伴系统统计实现。
- V1 初判：✓（C 探针、Python 解析、指标文档和审计页互证）。
- V2 初判：✓（可预测内核版本变化、map 丢项和字段命名误导）。
- V3 初判：✓（将内核数据模型和用户态数量推算放在一条可验证链上）。

### r2-mem-03：`last_time_map` 节流 key 没有形成状态闭环

- purpose: 支持 eBPF 采样节流的代码审计和面试追问；展示“有 delay_map 不等于节流生效”。
- source_files:
  - `projects/Linux物理内存检测项目/源码/extfraginfo.c#L16-L31,L34-L58`
  - `projects/Linux物理内存检测项目/源码/fraginfo.c#L43-L46,L91-L105,L162-L167`
  - `projects/Linux物理内存检测项目/源码/exfrag.py#L17-L23`
  - `projects/Linux物理内存检测项目/文档/3 深入理解/3.5 用户态展示与优化/3.5.2 性能优化与采样控制.md`
  - `projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md#L81-L138`
- source_symbols: `last_time_map`, `delay_map`, `bpf_ktime_get_ns`, `current_time`, `lookup`, `update`
- 文档声称（D）：架构文档意图通过 `delay_map + last_time_map` 降低高频探针开销；审计文档指出当前实现的 key 使用和更新时间不闭环。
- 源码实际行为（S）：两个 C 程序都以每次触发得到的 `current_time` 作为 `last_time_map` key 再查表。`fraginfo.c` 在采集结束时以同一个本次时间写入，但下一次触发通常产生新 key；`extfraginfo.c` 只查不更新。两个程序还只在 `delay_ptr` 非空时初始化 `delay`，随后无条件使用它。
- 构建/图片证据（B）：没有探针触发频率、map key 数量、CPU 开销或 verifier 运行记录。
- 未核实内容（U）：在具体 BCC/内核上 map 更新失败、并发 CPU 同时通过窗口、实际采样频率和开销尚未实测。
- 事实边界：可以断言“按源码不能证明节流有效，并存在明确的 key/update 风险”；不能断言某次运行一定产生了多少倍事件或一定造成生产级开销。
- V1 初判：✓（两个 C 文件、Python delay 写入和审计文档共同支撑）。
- V2 初判：✓（可直接推导固定 key、原子/并发语义和 per-CPU 节流的后续修正方向）。
- V3 初判：✓（具体到动态时间戳作为 map key 的反例）。

### r2-mem-04：源码快照的 import、目录和 BCC 模块名不闭合

- purpose: 支持项目“先修可运行性再谈性能”的复盘；区分设计架构图与当前工作目录可执行性。
- source_files:
  - `projects/Linux物理内存检测项目/源码/exfrag_user.py#L1-L8,L165-L207,L418-L419`
  - `projects/Linux物理内存检测项目/源码/exfrag.py#L1-L23`
  - `projects/Linux物理内存检测项目/源码/extfraginfo.c`
  - `projects/Linux物理内存检测项目/源码/fraginfo.c`
  - `projects/Linux物理内存检测项目/文档/2 快速入门/2.2 快速搭建与运行.md#L15-L17,L47-L69,L139-L173`
  - `projects/Linux物理内存检测项目/文档/4 深度学习/4.1 源码审计与事实边界.md#L157-L180`
- source_symbols: `from extfrag import ExtFrag`, `from bpfcc import BPF`, `ExtFrag.__init__`, `BPF(src_file=...)`, `curses.wrapper(main)`
- 文档声称（D）：快速入门同时给出用户入口、桥梁层和 `bpf/` 目录结构，但第 15 行已校准为“当前源码快照不能按旧命令直接启动”。
- 源码实际行为（S）：用户入口导入 `extfrag`，仓库实际桥梁文件名为 `exfrag.py`；桥梁层加载 `./bpf/extfraginfo.c` 和 `./bpf/fraginfo.c`，两个 C 文件当前位于源码根目录；桥梁层使用 `bpfcc` import，目标发行版可能实际提供 `bcc`。这些是不依赖运行的路径/名称不一致。
- 构建/图片证据（B）：没有当前 Linux 环境下 `py_compile`、BCC import、BPF load/attach 或 curses 启动日志；文档中的安装命令不构成当前快照的运行证明。
- 未核实内容（U）：目标发行版 Python 模块名、工作目录、内核头文件、权限、tracepoint/kprobe 存在性以及修复路径后的 verifier 结果均待验证。
- 事实边界：面试可说“源码主线和运行契约存在缺口，不能把旧 quick start 当作已验证命令”；不能说“eBPF 工具已在 Linux 上成功运行”。
- V1 初判：✓（入口源码、桥梁源码、C 文件路径和校准文档直接互证）。
- V2 初判：✓（可预测 import error、文件找不到、BCC 兼容和工作目录问题）。
- V3 初判：✓（具体到三个可复现的文件名/路径/import 差异）。

### r2-mem-05：UI 选项组合可能读取未加载的 BPF map

- purpose: 支持用户态参数分支与内核态程序选择的联调审计；可用于追问“为什么 `-n -s` 不是两个模式叠加”。
- source_files:
  - `projects/Linux物理内存检测项目/源码/exfrag_user.py#L166-L207,L214-L248,L250-L307,L360-L412`
  - `projects/Linux物理内存检测项目/源码/exfrag.py#L7-L23,L87-L148`
  - `projects/Linux物理内存检测项目/文档/3 深入理解/3.1 核心技术架构/3.1.3 用户态Python架构.md`
  - `projects/Linux物理内存检测项目/文档/4 深度学习/4.3 实战重构与面试追问.md`
- source_symbols: `output_count`, `node_info`, `zone_info`, `ExtFrag.__init__`, `get_node_data`, `get_count_data`, `self.b["pgdat_map"]`, `self.b["counts_map"]`
- 文档声称（D）：用户态文档把 `-n`、`-s`、`-z` 等选项描述成不同展示能力；架构意图是根据选项采集并显示 node、zone 或事件统计。
- 源码实际行为（S）：`ExtFrag.__init__()` 只根据 `output_count` 二选一加载 `extfraginfo.c` 或 `fraginfo.c`。但 `exfrag_user.py` 在循环中先判断 `node_info`，再判断 `output_count`；同时传 `-n -s` 时会加载只有 `counts_map` 的事件程序，却优先调用 `get_node_data()` 读取 `pgdat_map`。反向组合也应按实际分支检查，不能假设选项自动合并底层 map。
- 构建/图片证据（B）：没有各参数组合的 curses 运行记录、异常栈或 map 列表快照。
- 未核实内容（U）：BPFCC 对缺失 map 的具体异常形式、命令行用户是否会组合冲突选项、修复后的 UI 期望行为均待验证。
- 事实边界：这是静态可审计的“模式选择—map 契约”风险；不能把潜在异常写成已经在目标环境复现的崩溃。
- V1 初判：✓（参数解析、ExtFrag 选择和 map 读取源码互证）。
- V2 初判：✓（可预测参数组合测试矩阵和 map 存在性断言）。
- V3 初判：✓（不是泛泛的 CLI 问题，而是 `-n/-s` 与 `pgdat_map/counts_map` 的具体错配）。

## Linux 视觉

### r2-vision-01：Qt/QProcess 文件 IPC 的路径、编号和完成信号不一致

- purpose: 支持视觉项目复盘和文件型 IPC 生命周期审计；把生产者、消费者、结果轮询和子进程完成条件落到源码。
- source_files:
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp#L9-L62,L64-L165`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h#L45-L90`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp#L208-L245`
  - `projects/linux视觉感知项目/文档/01 项目概述/1.6 模块间协作与进程通信.md`
  - `projects/linux视觉感知项目/文档/05 系统集成与性能/5.3 文件系统数据交换设计.md`
  - `projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/build/LSTR`
- source_symbols: `MainWindow::MainWindow`, `MainWindow::~MainWindow`, `MainWindow::on_Select_triggered`, `MainWindow::yolop_process`, `MainWindow::readFrame`, `QProcess::write`, `waitKey`, `LSTR::main`
- 文档声称（D）：文档将 Qt 上位机、QProcess、视频帧目录和 LSTR 结果目录描述为模块间文件交换链。
- 源码实际行为（S）：摄像头 `readFrame()` 写入 `/home/kylin/桌面/project_v1.0/frames/<count>.jpg`，从 0 开始；视频分支把帧写到 `LSTR/videos/frames/%d.jpg`，识别命令从 `../videos/frames/` 读，LSTR 主循环从 1 开始并写 `../result/<i>.jpg`；上位机也从 1 开始轮询结果，遇到第一张空图即 `break`。`waitKey(2000)`、`waitKey(10000)` 和 `waitKey(100)` 是固定延时，不是子进程退出或文件原子完成信号；两个无 parent 的 `QProcess` 在析构函数中未见显式回收。
- 构建/图片证据（B）：集成 LSTR 构建目录有 `LSTR` 可执行文件；独立模型目录有历史 `output.png`，但没有证明 Qt 当前路径、编号和等待协议已端到端运行。
- 未核实内容（U）：目标机器实际工作目录、旧结果是否残留、图片写入是否可能被读到半文件、QProcess 是否在退出时由 Qt/系统间接回收、摄像头模式是否仍使用该路径均待实测。
- 事实边界：可表达为“源码定义了一个存在路径/编号/完成信号缺口的文件 IPC 原型”；不能表达为“Qt 已可靠等待每帧识别完成”。
- V1 初判：✓（Qt 源码、LSTR 源码、协作文档和构建物可回链）。
- V2 初判：✓（可预测空图提前退出、旧结果混入、半文件读取和子进程残留）。
- V3 初判：✓（具体到摄像头 0 起始、LSTR 1 起始、`videos/frames` 与 `frames` 两组路径）。

### r2-vision-02：LSTR 双输入 Tensor 与模型文件的主链契约

- purpose: 支持视觉项目面试讲解和模型契约审计；区分“架构图有 LSTR”与“源码实际传了什么 tensor”。
- source_files:
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp#L15-L84,L92-L168,L208-L245`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/lstr_360x640.onnx`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/log_space.bin`
  - `projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp#L15-L140,L208-L218`
  - `projects/linux视觉感知项目/文档/04 模型推理部署/4.2 ONNX Runtime推理流程.md`
  - `projects/linux视觉感知项目/文档/04 模型推理部署/4.3 log_space与双输入机制.md`
  - `projects/linux视觉感知项目/文档/04 模型推理部署/4.1 LSTR模型架构与曲线解码.md`
- source_symbols: `LSTR::LSTR`, `LSTR::normalize_`, `LSTR::detect`, `Ort::Session::Run`, `input_shape_`, `mask_shape_`, `pred_logits`, `pred_curves`
- 文档声称（D）：部署文档称 LSTR 使用图像输入、全零 mask 双输入，并通过 `log_space` 解码 `pred_logits/pred_curves`；架构文档将该模型放入车道线主链。
- 源码实际行为（S）：构造函数从相对路径加载 `../lstr_360x640.onnx` 和 50 个 float 的 `../log_space.bin`，从运行时首个输入 shape 推导高宽；`detect()` resize 后按 `[1,3,H,W]` 构造图像 tensor，按 `[1,1,H,W]` 构造全零 mask，调用 `Run(..., 2, ...)`，按输出索引 0/1 读取 logits/curves。集成入口先 resize 到 `360x204`，再 LIME 增强后调用 `detect()`；独立 ONNX 示例则直接读一张图片输出 `output.png`。
- 构建/图片证据（B）：集成 LSTR 目录存在 ONNX、`log_space.bin` 和 `build/LSTR`；独立 `LSTR_ONNX/build/output.png` 存在。它们证明文件/产物快照存在，不证明当前模型与当前主链在 FT2000/4 上成功运行。
- 未核实内容（U）：实际 ONNX 输入输出 shape、节点名顺序、相对路径工作目录、模型版本和目标 ARM 推理结果没有独立运行日志；没有 tensor dump 或输出契约测试。
- 事实边界：可安全讲“源码确实构造了双输入并读取两类输出”；不能只凭文档或图片讲“模型部署已在目标平台稳定验证”。
- V1 初判：✓（两份 LSTR 源码、模型附件和三份部署文档交叉）。
- V2 初判：✓（可预测输入数量/shape、输出顺序、相对路径和模型版本错配）。
- V3 初判：✓（具体到双输入 shape、`Run` 参数和集成前置 LIME）。

### r2-vision-03：LSTR 后处理空检测、曲线分母与会话释放边界

- purpose: 支持源码审计和面试中的“我如何找出模型后处理风险”；把潜在错误与已运行结果区分开。
- source_files:
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp#L86-L90,L140-L205`
  - `projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp#L85-L205`
  - `projects/linux视觉感知项目/文档/04 模型推理部署/4.1 LSTR模型架构与曲线解码.md`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/build/LSTR`
- source_symbols: `LSTR::~LSTR`, `LSTR::detect`, `good_detections`, `right_lane`, `left_lane`, `p_lane_data`, `ort_session`
- 文档声称（D）：模型文档把输出解码和左右车道线可视化描述为正常主链，并强调曲线参数化绘制。
- 源码实际行为（S）：当 `right_lane.size() == left_lane.size()` 时直接访问 `right_lane[0]` 和 `left_lane[0]`；两侧都为空时条件仍成立，存在越界风险。曲线 x 公式含 `1/(y-p_lane_data[3])` 和平方分母，未见分母保护或坐标裁剪。构造函数 `new Session`，析构函数只 `delete[] log_space`，未见 `delete ort_session`。
- 构建/图片证据（B）：有 LSTR 可执行文件和独立输出图片，但没有空检测输入、极端曲线参数、ASan/UBSan 或进程退出内存检查证据；图片只能说明某个输入曾产生输出文件。
- 未核实内容（U）：实际模型是否会产生空的左右检测、分母是否在训练输出范围内、长期运行内存增长是否发生，均未核实；不能把潜在 UB 写成已复现崩溃。
- 事实边界：候选结论应使用“源码存在触发条件明确的潜在越界/数值/资源生命周期风险”；不能使用“模型一定崩溃”或“已证明泄漏”。
- V1 初判：✓（集成与独立 LSTR 源码、模型文档、构建产物交叉）。
- V2 初判：✓（可直接设计空检测、极端参数和析构回归测试）。
- V3 初判：✓（同时覆盖后处理、数值稳定性和 ONNX Session 所有权）。

### r2-vision-04：LIME 基线/优化 target 与性能数字的 provenance

- purpose: 支持视觉项目优化复盘和构建证据审计；防止把文档中的加速比直接当作当前源码复现结果。
- source_files:
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt#L2-L18`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/lime.cpp#L48-L116,L400-L416`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt#L2-L33`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp#L50-L88,L102-L173,L669-L689`
  - `projects/linux视觉感知项目/文档/03 LIME 低照度增强/3.7 优化前后性能对比.md#L21-L24,L51-L56,L209-L218,L240-L356`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/lime`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/lime`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/output.jpg`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/output.jpg`
- source_symbols: `lime::getMax`, `lime::Frobenius`, `lime::enhance`, `cv::getTickCount`, `add_executable(lime ...)`
- 文档声称（D）：性能文档声称使用 1000 帧和 `cv::getTickCount()`，LIME 优化从 1.6305 s 到 0.314 s、约 5.19x；并把 NEON、OpenMP 和 FT2000/4 平台联系起来。
- 源码实际行为（S）：基础 CMake 的 target 输入是 `lime.cpp`；优化 CMake 的 target 输入是 `lime_opt.cpp`，并启用 `-O3`、OpenMP。两份源码都包含单图入口和计时；`xinlime.cpp` 不在上述两个 CMake target 的 `add_executable` 输入中。
- 构建/图片证据（B）：基础和优化目录各有 `build/lime`、`CMakeCache.txt`、目标文件/链接记录和 `output.jpg`；这证明存在历史构建与输出产物，但不证明性能文档所用的同一 commit、同一输入集、同一平台和同一计时范围。
- 未核实内容（U）：没有完整 1000 帧原始计时日志、CPU 亲和性/线程数、输入尺寸、优化前后像素误差或当前 ARM 目标重跑记录；5.19x 和 LSTR 10.7x 仍属于文档主张。
- 事实边界：可说“仓库有可追踪的 baseline/optimized target 和历史输出，性能数字需补 benchmark provenance”；不能说“当前源码已复现 5.19x”。
- V1 初判：✓（CMake、两版源码、性能文档和构建/图片产物互证）。
- V2 初判：✓（可预测 target 混淆、计时口径、输入集和正确性回归缺失）。
- V3 初判：✓（将性能数字落到具体 `add_executable` 和输出产物，而非只讲 NEON/OpenMP）。

### r2-vision-05：优化版 `Frobenius()` 的共享累加器竞争

- purpose: 支持“优化后如何审查正确性”的代码事实案例；对照文档声称的 `critical` 保护与实际并行区行为。
- source_files:
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp#L172-L237`
  - `projects/linux视觉感知项目/文档/03 LIME 低照度增强/3.7 优化前后性能对比.md#L113-L155`
  - `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/output.jpg`
- source_symbols: `lime::Frobenius`, `total_sum`, `#pragma omp parallel sections`, `#pragma omp critical`, `vaddq_f32`, `vpaddq_f32`
- 文档声称（D）：性能文档称 `Frobenius()` 使用 NEON、四路 OpenMP，并以 `#pragma omp critical` 保护规约操作，宣称线程安全。
- 源码实际行为（S）：四个 OpenMP section 在并行区内共同读写同一个 `float32x4_t total_sum`；并行区结束后才进入 `omp critical`，此时竞争已经发生，critical 只保护后续两次水平相加，不能修复此前的并发累加。循环还以 `j += 4` 进行向量加载，尾部维度和分块边界需满足额外假设。
- 构建/图片证据（B）：优化版已有 build 目录和 `output.jpg`，只能证明某次构建/输出存在，不能证明多线程规约数值正确或性能稳定。
- 未核实内容（U）：不同线程数、输入尺寸和架构下的误差大小、是否被编译器/运行时偶然掩盖、是否影响最终 LIME 输出尚未通过对照测试确认。
- 事实边界：应写成“源码存在可定位的并行累加器竞争风险，文档的 critical 解释与代码位置不一致”；不能把输出图片当作竞争不存在的证明。
- V1 初判：✓（优化源码、性能文档和产物交叉）。
- V2 初判：✓（可设计串行/1/2/4 线程数值差分和 sanitizer/规约修复验证）。
- V3 初判：✓（具体到 critical 位于并行区之后这一反例）。

## Linux 用户态教程（教程示例，不是用户项目实测）

### r2-linux-tutorial-01：C/C++ 线程池销毁顺序的潜在提前释放

- purpose: 支持 Linux 用户态并发教程的代码审计和面试讲解；用一个具体析构路径说明“唤醒 worker 不等于 worker 已退出”。
- source_files:
  - `archive/大丙Linux教程/第3章 进程和线程/09 线程池 - C语言版.md#L182-L216,L258-L307,L318-L365`
  - `archive/大丙Linux教程/第3章 进程和线程/10 线程池 - C改C++版.md#L205-L220,L253-L300,L310-L356`
- source_symbols: `threadPoolDestroy`, `ThreadPool::~ThreadPool`, `worker`, `manager`, `pthread_join`, `pthread_cond_signal`, `pthread_mutex_destroy`, `pthread_cond_destroy`
- 文档声称（D）：教程示例把 `shutdown`、管理者线程 join、条件变量唤醒和资源释放组织成线程池销毁流程；C 与 C++ 版本意图相同。
- 源码实际行为（S）：C 版和 C++ 版都设置关闭标志、只 join 管理者线程，然后 signal 等待中的 worker，随后立即释放任务队列/线程 ID 数组并销毁同步对象；当前片段没有等待每个 worker 退出的完整 join 链。worker 被唤醒后仍可能访问 pool、队列或条件变量，因此存在潜在 use-after-free/销毁中同步原语使用风险。
- 构建/图片证据（B）：教程目录没有与该示例绑定的本仓库构建日志、竞态测试或运行回溯。
- 未核实内容（U）：具体调度下是否触发、worker 是否在某处另有退出保证、编译器/平台表现和修复后吞吐均待独立编译运行验证；不能称为用户项目故障。
- 事实边界：这是“教程代码潜在生命周期风险”候选，不是“用户已经遇到线程池崩溃”的事实。
- V1 初判：✓（C/C++ 两个教程实现对照，符号和销毁顺序清楚）。
- V2 初判：✓（可预测关闭竞态、join 顺序、条件变量和资源所有权追问）。
- V3 初判：✓（以两个具体析构实现为例，超出一般 pthread API 罗列）。

### r2-linux-tutorial-02：信号发送、子进程退出与回收是三件事

- purpose: 支持 Linux 进程/信号/守护进程面试讲解；建立 `kill`、`SIGCHLD`、`waitpid` 和 daemon 化步骤的责任边界。
- source_files:
  - `archive/大丙Linux教程/第3章 进程和线程/01 进程控制.md#L90-L118,L430-L466`
  - `archive/大丙Linux教程/第3章 进程和线程/05 信号.md#L135-L158,L580-L622`
  - `archive/大丙Linux教程/第3章 进程和线程/06 守护进程.md#L72-L108,L140-L178`
- source_symbols: `fork`, `exec`, `kill`, `sigaction`, `SIGCHLD`, `waitpid`, `setsid`, `chdir`, `umask`, `dup2`
- 文档声称（D）：教程分别介绍信号发送、exec 替换、SIGCHLD 回收和 fork/setsid/chdir/umask/dup2 的守护化步骤。
- 源码实际行为（S）：资料中的 `kill()` 是发送信号的 API，不是等待目标退出的 API；SIGCHLD 示例用 `while` 循环 `waitpid(-1, NULL, WNOHANG)` 处理多个已退出子进程；守护示例先 fork 让父进程退出，再 setsid、改变目录、设置 umask、重定向标准 fd。这个链条没有自动提供 supervisor、日志、权限降级、单实例或优雅退出协议。
- 构建/图片证据（B）：没有本仓库对教程示例的编译、strace、进程树或僵尸进程观测记录。
- 未核实内容（U）：目标系统的信号屏蔽/重启语义、进程组策略、CLOEXEC、服务监督和实际退出顺序需结合具体程序与系统验证；教程不证明用户做过这些实验。
- 事实边界：可作为教程 API 语义和生命周期审计案例；不能写成用户项目已有 daemon 或信号故障。
- V1 初判：✓（三章资料覆盖发送、执行、退出、回收和 daemon 化）。
- V2 初判：✓（可预测僵尸、SIGTERM 不退出、exec 失败和日志丢失等追问）。
- V3 初判：✓（按“发送—退出—回收—服务环境”拆开常被混淆的生命周期）。

### r2-linux-tutorial-03：UDP 广播/组播的端点与接口合同

- purpose: 支持 Linux 用户态网络学习闭环和面试讲解；把 `SO_BROADCAST`、广播地址、组播接口、bind 和 membership 分成可执行检查点。
- source_files:
  - `archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md`
  - `archive/大丙Linux教程/第4章 套接字通信/11 UDP之广播.md#L60-L145,L147-L195`
  - `archive/大丙Linux教程/第4章 套接字通信/12 UDP之组播（多播）.md#L96-L150,L167-L207`
- source_symbols: `socket`, `bind`, `sendto`, `recvfrom`, `setsockopt`, `SO_BROADCAST`, `IP_MULTICAST_IF`, `IP_ADD_MEMBERSHIP`, `if_nametoindex`, `close`
- 文档声称（D）：广播示例要求发送端开启 `SO_BROADCAST`、向当前网段广播地址发送，接收端 bind 固定端口；组播示例要求发送端选接口，接收端 bind 端口并加入组播组。
- 源码实际行为（S）：教程代码硬编码广播地址 `192.168.237.255`，接收端绑定端口；组播代码使用 `239.0.1.10`，发送端设置 `IP_MULTICAST_IF`，接收端用 `ip_mreqn` 和接口名 `ens33` 调用 `IP_ADD_MEMBERSHIP`。这些是示例的端点/接口合同，不是通用环境配置。
- 构建/图片证据（B）：没有本仓库实际网络运行、tcpdump 抓包、路由表、网卡或防火墙证据。
- 未核实内容（U）：当前网段是否使用 `192.168.237.0/24`、`ens33` 是否存在、SO_BROADCAST 权限、组播路由/IGMP 和接收端防火墙均待目标系统验证。
- 事实边界：只能称“教程提供广播/组播代码事实和排障检查点”；不能称“该网络链路在当前环境已可达”。
- V1 初判：✓（UDP 基础、广播和组播三份教程交叉）。
- V2 初判：✓（可从无包现象反推地址、bind、接口、membership 和防火墙）。
- V3 初判：✓（具体到硬编码地址与 `ens33` 接口选择）。

## LeetCode 资料（题解/学习记录，不是项目实测或掌握证明）

### r2-leetcode-01：同为滑动窗口，合法条件和收缩时机不同

- purpose: 支持算法学习闭环和面试讲题；用两道题对照“窗口模板不能只背代码”。
- source_files:
  - `archive/力扣刷题/02-Wiki/题目详解/3-无重复字符的最长子串.md#L77-L128,L132-L135`
  - `archive/力扣刷题/02-Wiki/题目详解/76-最小覆盖子串.md#L85-L145`
  - `archive/力扣刷题/03-学习笔记/Day02-滑动窗口与子串.md`
- source_symbols: `lengthOfLongestSubstring`, `minWindow`, `char_set`, `last`, `need`, `window`, `valid`, `missing`, `left`, `right`
- 文档声称（D）：Day02 和题解把两题都归为滑动窗口，但明确无重复子串在重复时收缩，最小覆盖子串在满足需求后收缩并更新最优答案。
- 源码实际行为（S）：无重复子串的教学实现用计数并在 `heap[s[i]] > 1` 时移动左边界，优化版记录最近位置并用 `max` 防止 left 回退；`minWindow` 维护需求计数/已满足数量，只有覆盖完成后才收缩，并在收缩过程中更新最短区间。题目名相近但窗口不变量、计数结构和答案更新时机不同。
- 构建/图片证据（B）：题解中的手算/示例不是独立编译、OJ 结果或用户盲测证据；仓库未提供对应测试 harness。
- 未核实内容（U）：用户能否无提示写出两种不变量、是否通过隐藏测试、复杂度和 Unicode/字符集边界是否掌握，均未核实。
- 事实边界：这是题解代码与学习案例，不能写成“用户已独立掌握滑动窗口”或“真实面试已答对”。
- V1 初判：✓（两道题解与 Day02 专题交叉）。
- V2 初判：✓（可迁移到新题的扩张/收缩/更新三问）。
- V3 初判：✓（用合法条件和收缩时机对照，而非单一窗口模板）。

### r2-leetcode-02：DP 状态、初始化和遍历顺序随题变化

- purpose: 支持算法讲题和学习闭环；将“会写 DP”拆成状态定义、转移、边界和遍历的具体证据。
- source_files:
  - `archive/力扣刷题/02-Wiki/题目详解/198-打家劫舍.md#L68-L90,L128-L130`
  - `archive/力扣刷题/02-Wiki/题目详解/322-零钱兑换.md#L66-L105,L129-L132`
  - `archive/力扣刷题/02-Wiki/题目详解/1143-最长公共子序列.md#L75-L110,L159-L162`
  - `archive/力扣刷题/02-Wiki/题目详解/72-编辑距离.md#L76-L115,L178-L181`
  - `archive/力扣刷题/03-学习笔记/Day12-动态规划入门与贪心.md`
- source_symbols: `rob`, `coinChange`, `longestCommonSubsequence`, `minDistance`, `dp`, `f`, `g`, `diagonal`
- 文档声称（D）：题解均按 DP 五步法展开，但分别强调打家劫舍的相邻约束、零钱兑换的完全背包正序、LCS 的匹配/跳过二维状态和编辑距离的插入/删除/替换三方向。
- 源码实际行为（S）：`rob` 用前 i 间房和偷/不偷状态；`coinChange` 以 `dp[0]=0` 和不可达大值初始化并按硬币、金额正序更新；LCS 在字符相等时取左上角加一、不等时取上/左最大；编辑距离边界初始化为 i/j，并在一维优化版用 `diagonal` 保存旧左上角。题解源码本身展示了遍历顺序和索引偏移的具体差异。
- 构建/图片证据（B）：文档内例题表格和手算结果属于教学材料，不是独立 C++ 编译、OJ 记录或用户真实面试证据。
- 未核实内容（U）：题解代码的所有边界输入、用户能否从状态定义独立重写、复杂度权衡和迁移到新题的能力均未核实。
- 事实边界：可以作为“DP 状态/不变量审查案例”；不能由题解存在推断用户已掌握 DP。
- V1 初判：✓（四道题解和 Day12 笔记交叉）。
- V2 初判：✓（可预测初始化错、遍历顺序反转、索引偏移和滚动数组左上角丢失）。
- V3 初判：✓（跨相邻约束、完全背包、LCS 和编辑距离形成具体对照组）。

### r2-leetcode-03：学习日志状态不等于独立掌握

- purpose: 支持算法学习闭环的证据边界；明确哪些记录能说明计划/状态，哪些仍需要独立回忆或盲测。
- source_files:
  - `archive/力扣刷题/学习中枢.md#L27-L34,L54-L70,L88-L96,L140-L150`
  - `archive/力扣刷题/00-配置/学习日志.md#L20-L35`
  - `archive/力扣刷题/00-配置/进度看板.md#L45-L58,L81-L90,L108-L116`
  - `archive/力扣刷题/03-学习笔记/Day14-技巧与全局复习.md#L153-L170,L195-L203`
- source_symbols: `学习状态`, `⬜ 未学`, `👀 看过题解`, `🟡 提示后 AC`, `🟢 独立 AC`, `🔵 可无提示重写`, `完成数`, `模板掌握矩阵`, `无提示重写`
- 文档声称（D）：学习中枢要求按日志、看板和 Day 笔记建立反馈；日志和看板明确只有“独立 AC”和“可无提示重写”计入完成数，Day14 checklist 也要求不把看过题解/提示后 AC 计为完成。
- 源码实际行为（S）：这些记录文件实际提供的是状态枚举、完成数口径、模板矩阵、复习字段和待复习清单；它们能记录“计划、标签和自报状态”，不能自行执行盲测，也没有看到独立评测程序或面试录像/记录。
- 构建/图片证据（B）：没有独立回忆测试、定时重写提交、OJ 结果汇总或面试反馈作为掌握证据；Markdown 中的空白模板/勾选项不等于已完成行为。
- 未核实内容（U）：每道题的真实状态、是否在无提示下重写、间隔复习后的保持率和迁移到新题的能力均待用户实际补证。
- 事实边界：可把它作为“学习闭环规则与证据分级”候选；不能从日志存在或题解数量推断用户掌握度。
- V1 初判：✓（学习中枢、日志、看板和 Day14 复习规则互证）。
- V2 初判：✓（能据状态安排无提示重写、间隔复习和错误复盘）。
- V3 初判：✓（将“看过/提示后 AC/独立 AC/无提示重写”明确分层，直接服务学习闭环）。
