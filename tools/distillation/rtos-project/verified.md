# RTOS 项目三重验证结果

| ID | 候选 | V1 | V2 | V3 | 结论 |
|---|---|---|---|---|---|
| r01 | 周期/事件任务 + ISR 最小化 | 任务设计文档、复习文档、`app_tasks.c` | 可推导任务饥饿和 ISR 延迟排查 | 以实际链路落地，不是 API 罗列 | 通过 |
| r02 | 通信事件链排障 | IAP 文档、DMA/串口源码、复习文档 | 可定位“中断有但任务无响应” | 按证据节点切分故障 | 通过 |
| r03 | 编码器-PID-PWM 闭环 | 电机文档、复习文档、PID/MOTOR 源码 | 可推导超调、抖动和符号错误 | 明确 PWM 与 RPM 的控制/反馈区别 | 通过 |
| r04 | RTOS 项目面试表达 | 项目索引、完整流程、复习文档 | 可组织新追问和贡献边界 | 结合真实代码符号与平台限制 | 通过 |
| r05 | FreeRTOS 配置与启动闭环 | 启动文档、FreeRTOSConfig、Cortex-M3 port、main/app_tasks | 可定位 tick 不走、调度器不接管、栈单位误读和 IRQ 边界 | 把宏、向量映射和初始化顺序连成实际链路 | 通过 |
| r06 | 运行时故障证据诊断 | 故障/移植文档、异常 handler、tasks.c、heap_4、app_tasks | 可迁移到 HardFault、栈堆、空句柄、死锁和优先级问题 | 明确当前钩子关闭、handler 只死循环、锁覆盖不完整 | 通过 |
| r07 | IAP 固件升级链路 | IAP/CRC 文档、PC 工具、DMA/USART/Flash/IAP 源码 | 可定位短包、CRC、DMA 唤醒、写入和跳转问题 | 明确 ifopen、单 APP、固定长度、CRC 非签名、无回滚 | 通过 |
| r08 | 软件周期机制选择 | FreeRTOS 定时器/任务延时资料、`timers.c`、项目配置和任务实现 | 可从“周期漂移、回调阻塞、tick 不准”反推上下文和测量路径 | 把 `vTaskDelay`、`vTaskDelayUntil`、软件定时器和硬件定时器的边界组合起来 | 通过 |
| r09 | LCD 与蜂鸣器反馈边界 | UI/蜂鸣器文档、LCD/SPI/BEEP/KEY/app_tasks 源码 | 可从无显示、错位、反馈不止或多任务报警需求反推调用链 | 明确当前同步轮询写屏、单一按键蜂鸣消费者和未来队列建议的区别 | 通过 |

## 逐项边界核对

- `r05`：文档中的配置解释以当前 `FreeRTOSConfig.h`、实际 `project.uvprojx` 编译文件和 `ARM_CM3/port.c` 为准；其他 port 文件不表示当前 target 使用它们。
- `r06`：仓库当前没有完整 fault frame 保存实现；“建议读取 CFSR/HFSR 等寄存器”属于诊断方法，不是现有代码功能。
- `r07`：IAP 源码被 `ifopen=0` 关闭；固定 `buff_size`、APP 地址和独立 APP 链接布局必须在实际构建中重新验证。

## 增量源码核对：共享状态保护

- `SystemState_t` 在 `源码/APP_TASK/app_tasks.h` 定义，`g_systemState` 在 `app_tasks.c` 中作为全局对象使用；工程没有把它声明为 `volatile`。
- `SensorTask`、`WindSpeedTask` 和 `System_SwitchMode`/`System_SwitchSpeedLevel`/`System_ToggleMotor` 的部分访问显式获取 `g_dataMutex`；`MotorControlTask` 的大部分状态机分支、`UIDisplayTask` 的显示读取以及 `AntiBackflowTask` 的读写路径没有统一包在该互斥量内。
- `System_GetState()` 返回 `&g_systemState`，调用者可以绕过锁直接拿到可写裸指针；这是接口设计风险，不是互斥量已经失效的证明。
- 结论：当前源码只能说“部分路径使用互斥量”，不能说“整个共享状态结构线程安全”。需要一致快照时，应在短锁区复制字段，释放锁后格式化/刷屏/计算；需要事件语义时，应使用消息/通知协议。`volatile` 单独不能解决互斥、读改写和跨字段一致性。

## 增量候选

| ID | 候选 | V1 | V2 | V3 | 结论 |
|---|---|---|---|---|---|
| r10 | 固件 Build→Flash→Serial/Runtime Provenance | 入门/Keil/J-Link/串口文档、`project.uvprojx`、`PWM.map`、startup/system/main/USART/J-Link 配置 | 可从 target/产物不一致、Flash verify/向量/Reset & Run/串口沉默反推最小缺口 | 将配置合同、AXF/HEX/MAP、烧录回读、向量启动和运行证据串成 C0-C4，并明确兄弟 Skill 边界 | 通过 |

## r10 事实边界

- 当前工程与 MAP 从 `0x08000000` 链接；`FLASH_APP1_ADDR=0x0800F000` 是 IAP 规划值，不是独立 APP 已验证布局。
- `OBJ/PWM.axf/.hex/.bin` 和 `USER/PWM.map` 是可见产物/历史证据；没有本次 Build log、hash 链、J-Link 回读和串口原始日志，不宣称 C2-C4 已完成。
- `DEBUG=0`、`SENSOR_DEBUG=0`、`ifopen=0` 的当前源码事实限制了默认串口/IAP 结论。
