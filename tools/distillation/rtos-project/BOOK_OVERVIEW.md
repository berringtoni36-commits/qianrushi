# STM32 + FreeRTOS 油烟机控制系统 — 整体理解

## 基本信息

- 类型：真实项目文档、代码流程说明和面试复习材料。
- 平台：STM32F103、FreeRTOS、Keil/J-Link；功能包含传感器、电机、LCD、模式状态和可选 IAP。
- 来源：`projects/RTOS项目/`。

## 结构

一句话主旨：用 FreeRTOS 把多个不同周期的硬件与业务功能组织成一个可调度、可控制、可升级的 STM32 产品系统。

1. **启动与内核骨架**：`Reset_Handler → SystemInit → main → System_Init → StartTask → vTaskStartScheduler`，以及 SysTick/PendSV/SVC、FreeRTOS 配置、堆和任务栈。
2. **任务、ISR 与并发可靠性**：周期/事件任务、FromISR、中断优先级、互斥量/二值信号量、共享状态、HardFault/栈堆/死锁诊断。
3. **硬件采集与用户交互**：DHT11 GPIO 时序、MQ2 ADC、风速融合、按键消抖和事件状态机。
4. **电机闭环控制**：H 桥互补 PWM、编码器计数、RPM 计算、PID、限幅和调参。
5. **业务状态与升级**：待机/手动/自动/防回流、Cooking Event、USART+DMA+CRC32+Flash+APP 跳转。
6. **项目表达与事实边界**：用代码符号讲架构和贡献；区分设计意图、源码现状、文档推断和硬件实测。

关系：先证明启动和调度器接管，再分析事件/数据如何进入业务控制，最后做故障证据审计和面试表达。

## 关键术语

FreeRTOS task、优先级、阻塞、互斥量、二值信号量、FromISR、`g_systemState`、编码器、PWM、PID、IAP、CRC32、HardFault。

## 核心命题

- 任务边界应由周期、响应期限、执行时间和共享资源决定；ISR 只做最小通知，复杂处理交给任务。
- Cortex-M 的 IRQ 数值越小优先级越高；调用 RTOS API 的中断必须落在可管理阈值内。
- `StackType_t` 任务栈宏按字计数；当前项目栈溢出和 malloc 失败钩子关闭，必须用配置事实回答。
- PWM 是控制量，编码器反馈才是实际转速；调参前先证明采样、方向、限幅和执行器链路正确。
- 传感器融合和 Cooking Event 是固定阈值/权重逻辑，不能夸大成标定后的准确 ppm 或智能算法。
- 状态机把外层工作模式与 AUTO 内部流程显式化；计数器基于任务周期，不自动等于硬件实测时间。
- IAP 链路必须同时说明 `ifopen`、固定长度 DMA、CRC32 完整性、地址边界、单 APP 和失败恢复缺口；CRC 不是签名。

## 批判与边界

- 文档与代码版本可能不同；当前源码 `ifopen=0`，IAP 不能当成默认已启用。
- `configCHECK_FOR_STACK_OVERFLOW=0`、`configUSE_MALLOC_FAILED_HOOK=0`，异常 handler 主要停机，当前缺少完整 fault frame 保存。
- 文档描述“共享状态由互斥量保护”，但 `AntiBackflowTask` 等路径存在直接读写，必须按函数核对锁覆盖。
- `FLASH_APP1_ADDR=0x0800F000` 与固定 `buff_size=3692` 依赖具体芯片/链接布局；仓库没有可核对的独立 APP 链接工程。
- 项目文档能证明设计和代码结构，不能自动证明硬件实测可靠性、个人贡献或性能结果。

## 应用潜力

本域通过验证的 13 个原子 Skills：配置与启动、任务/ISR 设计、通信排障、运行时故障、传感器融合、按键状态机、PID 闭环、自动状态机、IAP 升级、软件周期机制、LCD/蜂鸣器反馈、构建—烧录—运行 provenance、项目面试表达。单个驱动 API 和复制的库文件保留为证据，不独立 Skill 化。
