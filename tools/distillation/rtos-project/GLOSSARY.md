# RTOS 项目术语表

| 术语 | 项目语义 | 来源 |
|---|---|---|
| `g_systemState` | 保存模式、传感器、转速和控制状态的共享结构 | `源码/APP_TASK/app_tasks.c` |
| 周期任务 | 按固定周期工作并主动 delay/block 的任务 | `RTOS项目复习文档.md` |
| 事件任务 | 等待信号量或通知，被事件唤醒后执行 | 同上 |
| `g_dataMutex` | 保护共享状态读写的互斥量 | `源码/APP_TASK/app_tasks.c` |
| `g_speedCalcSemaphore` | TIM4 测速中断通知 `SpeedCalcTask` 的二值信号量 | `源码/APP_TASK/app_tasks.c` |
| PID 输出 | 送给 PWM/CCR 的控制量，不是 RPM | `RTOS项目复习文档.md` |
| IAP | 在运行系统中接收、校验、写入并跳转到新固件 | `文档/5 系统功能实现/5.3...md` |
| `ifopen` | IAP 条件编译开关；当前源码值为 0 | `源码/SYSTEM/sys/sys.h` |
| `configTICK_RATE_HZ` | FreeRTOS tick 频率；当前为 1000Hz | `源码/FreeRTOS/include/FreeRTOSConfig.h` |
| `SysTick` | 产生 RTOS tick；由 Cortex-M3 port 配置 | `源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c`、`源码/SYSTEM/delay/delay.c` |
| `PendSV` | Cortex-M 上执行任务上下文切换的异常 | `源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c` |
| `SVC` | 启动第一个任务的异常入口 | `源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c` |
| `StackType_t` | FreeRTOS 任务栈元素类型；任务栈宏按元素数计，不是字节 | `源码/FreeRTOS/include/FreeRTOS.h`、`源码/APP_TASK/app_tasks.h` |
| `configTOTAL_HEAP_SIZE` | FreeRTOS 动态堆总量，当前 10KB | `源码/FreeRTOS/include/FreeRTOSConfig.h`、`源码/USER/project.uvprojx` |
| `configCHECK_FOR_STACK_OVERFLOW` | 栈溢出检测开关；当前为 0 | `源码/FreeRTOS/include/FreeRTOSConfig.h` |
| `configMAX_SYSCALL_INTERRUPT_PRIORITY` | 允许 ISR 使用 RTOS API 的屏蔽阈值 | `源码/FreeRTOS/include/FreeRTOSConfig.h`、`源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c` |
| `HardFault_Handler` | 当前只进入死循环的硬故障入口 | `源码/USER/stm32f10x_it.c` |
| `Cooking Event` | 温度/湿度/气体阈值规则触发的事件，不是机器学习分类器 | `源码/BSP/WIND/wind_speed.c`、`源码/APP_TASK/app_tasks.c` |
| `FLASH_APP1_ADDR` | APP 单分区起始地址，当前为 `0x0800F000` | `源码/BSP/IAP/iap.h` |
| `CRC32` | 传输完整性校验；当前不是签名认证 | `源码/BSP/CRC32/crc32.c`、`源码/tools/add_crc32.py` |
| `iap_load_app` | 关闭部分外设/中断、检查向量、设置 MSP 并跳转 APP 的函数 | `源码/BSP/IAP/iap.c` |
| `UIDisplayTask` | 当前负责周期读取状态并同步刷新 LCD 的低优先级任务 | `源码/APP_TASK/app_tasks.c`；LCD 文档；周期/刷新是否满足目标需实测 |
| `Buzzer_Beep` | 当前按键反馈中执行蜂鸣器开关和延时的阻塞式提示函数 | `源码/BSP/BEEP/beep.c`；不等于已实现多任务报警队列 |
| 软件定时器 | FreeRTOS Timer Service Task 驱动的回调机制；与任务 `delay`、硬件定时器的上下文不同 | `源码/FreeRTOS/timers.c`、`FreeRTOSConfig.h`；具体周期受 tick/队列/回调执行影响 |

| C0 工程合同 | target、芯片/Pack、编译器、宏、IncludePath、startup/port/heap、IROM/IRAM 和输出规则的冻结记录 | `源码/USER/project.uvprojx`；构建 provenance Skill |
| C1 产物身份 | AXF/HEX/MAP 的同源、地址、hash、时间和变体关联；同名不等于同源 | `源码/USER/project.uvprojx`、`源码/USER/PWM.map`；构建 provenance Skill |
| C2 Flash 证据 | J-Link/SWD program、algorithm、擦除范围、verify/readback 的实际记录 | `文档/1.3.2 J-Link 调试器配置与烧录.md`、`源码/USER/JLinkSettings.ini`；真实会话仍需测量 |
| C3 Reset/boot 证据 | 向量首项 MSP、次项 Reset_Handler、PC/MSP/VTOR 和到达 main 的观测 | `源码/CORE/startup_stm32f10x_md.s`、`源码/USER/system_stm32f10x.c`；不等于任务/业务已运行 |
| C4 serial/runtime 证据 | 与固件变体匹配的串口原始日志、LCD/调试器/任务和业务断言记录 | `源码/SYSTEM/usart/usart.c`、`源码/SYSTEM/sys/sys.h`、`源码/USER/main.c`；无现场日志不得宣称已验证 |
| `PWM.map` | ARMCC/armlink 生成的链接布局/符号/内存证据；属于历史构建产物，不是源码 | `源码/USER/PWM.map` |
