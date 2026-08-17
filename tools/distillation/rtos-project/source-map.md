# RTOS 项目来源映射

| Skill/结论 | 文档来源 | 源码证据 |
|---|---|---|
| 任务与 ISR、共享状态覆盖 | `文档/3 FreeRTOS 内核与任务设计/*`；`文档/2 系统架构与设计/2.4 任务间通信：互斥信号量与全局状态管理.md`；`RTOS项目复习文档.md` | `源码/APP_TASK/app_tasks.h`：`SystemState_t`；`源码/APP_TASK/app_tasks.c`：`System_Init`、`StartTask`、各任务、`System_GetState`、`TIM4_IRQHandler`；`USER/stm32f10x_it.c`。`g_dataMutex` 只覆盖部分路径；`MotorControlTask`、`UIDisplayTask`、`AntiBackflowTask` 存在直接访问，不能宣称整个状态结构已线程安全。 |
| 通信事件链 | `文档/5 系统功能实现/5.3 固件升级...md` | `BSP/IAP/iap.c`、`BSP/DMA/dma.c`、`SYSTEM/usart/usart.c`、`g_iapSemaphore` |
| PID 闭环 | `文档/4 硬件驱动开发/4.1/*` | `BSP/PID/pid.c`、`BSP/MOTOR/motor.c`、`BSP/WIND/wind_speed.c` |
| 项目表达 | `RTOS项目完整代码流程详解.md` | `APP_TASK/app_tasks.c` 的任务创建与全局状态 |
| FreeRTOS 配置与启动 | `文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md`；`文档/3 FreeRTOS 内核与任务设计/3.1-3.4` | `CORE/startup_stm32f10x_md.s`：`Reset_Handler`；`USER/system_stm32f10x.c`：`SystemInit`；`USER/main.c`：`main`；`FreeRTOS/include/FreeRTOSConfig.h`；`FreeRTOS/portable/RVDS/ARM_CM3/port.c`；`SYSTEM/delay/delay.c`；`APP_TASK/app_tasks.c`：`StartTask` |
| 运行时故障诊断 | `文档/3 FreeRTOS 内核与任务设计/3.1-3.3`；`文档/2 系统架构与设计/2.3-2.4` | `USER/stm32f10x_it.c`：fault handlers；`FreeRTOS/tasks.c`：栈检查入口；`FreeRTOS/portable/MemMang/heap_4.c`：malloc hook；`ARM_CM3/port.c`：`prvTaskExitError`、`vPortValidateInterruptPriority`；`APP_TASK/app_tasks.c`：同步对象、TIM4 初始化顺序 |
| IAP 固件升级 | `文档/5 系统功能实现/5.3-5.4` | `SYSTEM/sys/sys.h`：`ifopen/buff_size`；`USER/main.c`：USART/DMA 初始化；`BSP/DMA/dma.c`、`SYSTEM/usart/usart.c`；`APP_TASK/app_tasks.c`：`iap_task`、`DMA1_Channel5_IRQHandler`；`BSP/CRC32/crc32.c`；`BSP/IAP/iap.c`；`BSP/STMFLASH/stmflash.c`；`tools/add_crc32.py` |
| 软件周期机制 | `文档/3 FreeRTOS 内核与任务设计/3.2 任务创建、调度与优先级设计.md`；`3.4 软件定时器与周期任务实现.md` | `FreeRTOS/timers.c`、`FreeRTOS/include/FreeRTOSConfig.h`、`APP_TASK/app_tasks.c`、`SYSTEM/delay/delay.c`、`BSP/MOTOR/motor.c`；`vTaskDelay`/`vTaskDelayUntil`/Timer Service Task 的上下文与延迟语义需分开，代码标称周期不等于实测周期 |
| LCD/蜂鸣器反馈 | `文档/4 硬件驱动开发/4.3 用户交互/4.3.2 LCD 显示驱动与UI设计.md`；`4.3.3 蜂鸣器控制与音频提示.md`；`RTOS项目复习文档.md` | `APP_TASK/app_tasks.c`：`UIDisplayTask`、`KeyScanTask`；`BSP/LCD/lcd.c`、`BSP/SPI/SPI.c`；`BSP/BEEP/beep.c`：`Buzzer_Beep`/`Beep_on/off`；当前存在其他直接写屏调用，未来单消费者蜂鸣队列不是现状 |

## 代码边界

- `ifopen` 控制 IAP 相关对象和任务；不能无条件宣称 IAP 默认运行。
- `configCHECK_FOR_STACK_OVERFLOW=0`、`configUSE_MALLOC_FAILED_HOOK=0`；当前异常 handler 只停机，不提供完整 fault frame 转储。
- `FLASH_APP1_ADDR=0x0800F000`、`buff_size=3692` 和 APP 链接布局是具体工程约定；不是通用 Bootloader 分区方案。
- CRC32 是完整性校验，不是数字签名；单 APP 没有 A/B/断电回滚证据。
- `OBJ/`、`*.o`、`*.crf`、`*.bin`、`*.hex` 是构建/输出产物，不作为知识来源。

| 固件 Build→Flash→Serial/Runtime Provenance | `文档/1 入门指南/1.2 快速入门：从零搭建开发环境并运行项目.md`；`文档/1 入门指南/1.3 开发环境配置/1.3.1 Keil MDK 工程配置与编译.md`；`1.3.2 J-Link 调试器配置与烧录.md`；`1.3.3 串口调试工具使用.md` | `源码/USER/project.uvprojx`：target/Pack/ARMCC/宏/IncludePath/IROM/IRAM/输出/Flash algorithm；`源码/USER/PWM.map`：入口、向量、IROM/RAM 区和符号；`CORE/startup_stm32f10x_md.s`；`USER/system_stm32f10x.c`；`USER/main.c`；`SYSTEM/usart/usart.c`；`SYSTEM/sys/sys.h`；`USER/JLinkSettings.ini`；`APP_TASK/app_tasks.c` |

## Build→Flash→Runtime 代码边界

- 工程 XML 的 target 文件组优先于 `OBJ/` 残留对象；AXF/HEX/MAP 同名不证明同源，需由变体、hash、MAP 地址和实际下载路径闭合。
- `project.uvprojx`/`PWM.map` 当前均指向 `0x08000000`；`BSP/IAP/iap.h` 的 `FLASH_APP1_ADDR=0x0800F000` 仅为规划/调用地址，仓库无独立 APP 链接工程证据。
- `JLinkSettings.ini` 的 verify/缓存/下载开关、文档的 `STM32F10x_128.FLM` 和 Reset and Run 属于配置/流程证据；真实 program、readback、PC/MSP/VTOR、串口和业务输出仍需现场测量。
- `SYSTEM/sys/sys.h` 当前 `DEBUG=0`、`SENSOR_DEBUG=0`、`ifopen=0`；串口沉默不能直接推出未运行，打开宏后必须视为新固件变体并重新构建烧录。

## 当前 provenance 报告

[`artifact-provenance.md`](artifact-provenance.md) 和对应 JSON 记录了 `project.uvprojx`、历史 Build log、AXF/HEX/MAP/Scatter、下载配置和启动源码之间的静态关系。报告结论是“C0 静态通过、C1 历史布局相容、C2-C4 未取得证据”，不是 Keil 重编译、J-Link 回读或板上运行报告。
