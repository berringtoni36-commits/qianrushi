# RTOS 项目第三轮候选扫描

> 范围：RTOS 来源登记簿中 `indexed-only` 的文档、BSP/硬件模块、源码与工程配置。`projects/` 与 `archive/` 仅读。本文件是候选审查报告，不是 canonical Skill；本轮没有修改 Skill 或全局索引。
>
> 结论：没有需要在 Round 3 新增升格的独立候选。`rtos-bsp-module-integration-contract` 与 `rtos-debug-halt-timing-audit` 相对当前 canonical Skill 具备独特边界，但已经分别出现在 Round 2 的 G-R04/G-R05，本轮只复审、不重复建项；资源合同候选与现有 Skill 重叠，降级吸收。

## 候选 1：BSP 模块接入闭环（Round 2 G-R04 复审）

- **title**：BSP 模块接入：接口—硬件资源—Keil target—初始化—验收闭环
- **slug**：`rtos-bsp-module-integration-contract`
- **V1 两个独立来源**：
  1. `projects/RTOS项目/文档/2 系统架构与设计/2.2 目录结构与模块职责划分.md`（`BSP` 单一职责、创建新模块目录和 `.c/.h`、定义上层接口、接入任务/初始化的步骤）。
  2. `projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.1 Keil MDK 工程配置与编译.md` + `projects/RTOS项目/源码/USER/project.uvprojx` + `projects/RTOS项目/源码/USER/main.c`（IncludePath、显式 Group/File、编译宏与 `Hardware_Init()` 的实际接入点）。文档规则由 XML target 和源码控制流相互校验。
- **V2 新问题推导**：新增 I²C/ADC/显示或执行器模块时，不能只检查目录和头文件是否存在；应沿“头文件/API → GPIO/时钟/外设资源 → `project.uvprojx` 的 Group/File 与 IncludePath → `Hardware_Init()`/任务调用 → 启动和接口测试”闭合。由此可定位“源码存在但未进 target”“引脚/外设资源冲突”“初始化早于前置资源”“应用层只能绕过抽象直接操作寄存器”等新症状。
- **V3 独特性**：相对 `rtos-build-flash-runtime-provenance`（核对既有 target/产物身份）、`rtos-freertos-config-and-boot`（启动顺序）以及单个电机/传感器/LCD Skill，本候选关注“新增 BSP 功能如何从目录一路进入可运行 target”的变更闭环，不是孤立 API 教程。独特性成立，但 Round 2 已以 G-R04 明确提出。
- **现有 Skill 边界**：
  - `rtos-build-flash-runtime-provenance` 负责既有工程配置、实际文件组、产物和烧录身份；本候选只在“新增模块接入是否闭合”时主导。
  - `rtos-freertos-config-and-boot` 负责启动/调度/IRQ 前置条件；本候选不重讲 FreeRTOS 启动机制。
  - `rtos-task-and-isr-design`、`rtos-sensor-acquisition-and-fusion`、`rtos-motor-pid-control` 等负责任务或具体硬件行为；本候选审计接入边界，不替代这些模块内部设计。
- **source_files**：
  - `projects/RTOS项目/文档/2 系统架构与设计/2.2 目录结构与模块职责划分.md`
  - `projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.1 Keil MDK 工程配置与编译.md`
  - `projects/RTOS项目/源码/USER/project.uvprojx`
  - `projects/RTOS项目/源码/USER/main.c`
  - `projects/RTOS项目/源码/BSP/GPIO/gpiox.c`
  - `projects/RTOS项目/源码/BSP/GPIO/gpiox.h`
  - `projects/RTOS项目/源码/BSP/DHT11/dht11.c`
  - `projects/RTOS项目/源码/BSP/MOTOR/motor.c`
  - `projects/RTOS项目/源码/BSP/SPI/SPI.c`
  - `projects/RTOS项目/源码/BSP/LCD/lcd.c`
- **source_symbols**：`Hardware_Init`, `main`, `io_set`, `io_set_bit`, `io_reset_bit`, `DHT11_Read`, `SPI1_Init`, `LCD_Init`, `motor_init`, `TIM1_dead_pwm_init`, `TIM2_encode_init`, `MQ2_Init`, `WindSpeed_Init`；工程 XML 的 `TargetOption`, `IncludePath`, `Groups`, `GroupName`, `FileName`。
- **事实风险**：2.2 是教学/设计说明，不证明新模块已经在板上通过测试；`project.uvprojx` 的当前 target 是 `STM32F103C8`，不能用文档中的 C8T6 或硬件描述替代 XML。GPIO/SPI/LCD/DHT11 代码包含固定引脚和阻塞/时序假设，缺少波形和实板证据时只能报告接入闭合风险。工程文件的显式 Group 证明 target 声明了文件，不等于当前机器已重新编译。
- **是否建议升格**：**本轮不重复升格（降级为 G-R04 复审/合并项）**。若后续评审允许从 Round 2 续审，可优先升格为独立 Skill，但必须保留“target 文件组 + 资源所有权 + 初始化前置条件 + 最小测试”四类证据。

## 候选 2：调试暂停改变 RTOS/外设时序（Round 2 G-R05 复审）

- **title**：Cortex-M halt/resume 下的 RTOS tick、定时器事件与调试配置审计
- **slug**：`rtos-debug-halt-timing-audit`
- **V1 两个独立来源**：
  1. `projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.2 J-Link 调试器配置与烧录.md`（暂停期间外设时钟/调试位的审计建议，以及恢复后延时和 TIM4 路径的风险说明）。
  2. `projects/RTOS项目/源码/USER/DebugConfig/PWM_STM32F103ZE_1.0.0.dbgconf` + `projects/RTOS项目/源码/APP_TASK/app_tasks.c`（实际 `DbgMCU_CR = 0x00000007`、`TIM4_init()`、`TIM4_IRQHandler()`、`xSemaphoreGiveFromISR()` 与 `SpeedCalcTask` 消费链）。
- **V2 新问题推导**：调试器断点期间必须分别记录 CPU halt、SysTick、TIM4、DMA、看门狗和 pending 状态；恢复后出现 `vTaskDelay()` 相位跳变、速度计算触发时序异常、看门狗复位或一次合并事件时，先区分 halt 造成的时间语义变化与业务逻辑错误。验证应对照 `DBGMCU_CR`、计数器/中断标志、任务唤醒次数和时间戳，而不是仅凭单步现象改业务代码。
- **V3 独特性**：`rtos-software-timer-periodic-design` 审计正常运行时的 delay/TIM4 周期、二值信号量合并和事件消费；`rtos-runtime-fault-diagnosis` 负责已经发生的 HardFault/复位现场。本候选专门处理“调试器暂停本身改变时间系统”的验证合同，边界独立；但该主题已经在 Round 2 G-R05 出现。
- **现有 Skill 边界**：不替代 `rtos-software-timer-periodic-design` 的周期机制选择，也不把断点下的现象直接定性为运行时故障；若停机后发生真实复位/HardFault，再组合 `rtos-runtime-fault-diagnosis`。若问题是 J-Link 连接、烧录地址或产物身份，转 `rtos-build-flash-runtime-provenance`。
- **source_files**：
  - `projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.2 J-Link 调试器配置与烧录.md`
  - `projects/RTOS项目/源码/USER/DebugConfig/PWM_STM32F103ZE_1.0.0.dbgconf`
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.c`
  - `projects/RTOS项目/源码/BSP/MOTOR/motor.c`
  - `projects/RTOS项目/源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c`
  - `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h`
- **source_symbols**：`DbgMCU_CR`, `DBG_TIM1_STOP`, `DBG_TIM2_STOP`, `DBG_TIM4_STOP`, `TIM4_init`, `TIM4_IRQHandler`, `xSemaphoreGiveFromISR`, `SpeedCalcTask`, `xSemaphoreTake`, `vTaskDelay`, `xPortSysTickHandler`。
- **事实风险**：源码配置向导注释把 TIM4 停止位列为 bit13，而文档建议写成 bit17；这是必须先纠正/标注的文档事实冲突。`0x00000007` 只置位 bit0–2，不能据此证明 TIM4 或 SysTick 的停止策略。二值信号量最多保留一个 token，不能把反复 `GiveFromISR` 简化成“积压大量事件”；文档的“积压”需要以 pending/返回值/时间戳实测。当前仓库没有真实 J-Link halt/resume 日志，亦没有板上波形证据。
- **是否建议升格**：**本轮不重复升格（降级为 G-R05 复审项）**。后续若升格，必须以芯片参考手册/实际调试会话修正 bit 位，并把 SysTick、TIM4、DMA、binary semaphore 的合并语义分开验证。

## 候选 3：任务栈—FreeRTOS heap—链接 RAM 资源合同

- **title**：FreeRTOS 动态任务资源预算与链接 RAM 闭合审计
- **slug**：`rtos-task-heap-linker-resource-contract`
- **V1 两个独立来源**：
  1. `projects/RTOS项目/源码/APP_TASK/app_tasks.h` + `projects/RTOS项目/源码/APP_TASK/app_tasks.c`（任务栈宏、`xTaskCreate()`、互斥量/二值信号量的动态创建；返回值当前未检查）。
  2. `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h` + `projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c` + `projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s`（10 KiB FreeRTOS heap、动态分配、heap_4 统计、独立 MSP 栈/ARM C heap）。
- **V2 新问题推导**：将任务栈深度换算为 `StackType_t` 单位并加上 TCB、空闲任务、Timer Service Task 和同步对象后，再与 heap/linker RAM 对照。当前常驻业务任务栈宏合计为 1024 words；`ifopen=1` 时条件增加 IAP 的 256 words，另有 `configTIMER_TASK_STACK_DEPTH = 260` words，不能把“调度器能启动”当作新增任务仍有余量。由此可推导新增任务或打开 IAP 后的创建失败、部分任务缺失、堆耗尽和栈溢出风险，并要求检查 `xTaskCreate()`/同步对象返回值、最小剩余 heap 和 stack high-water mark。
- **V3 独特性**：相对一般的内存生命周期教程，本候选试图把应用任务表、FreeRTOS allocator 和链接/启动 RAM 放进一张变体级预算合同；但现有 `rtos-freertos-config-and-boot` 已明确核对任务栈单位、heap、启动文件和所有创建返回值，`rtos-runtime-fault-diagnosis` 已覆盖堆/栈故障现场，`embedded-memory-lifetime-and-pool-design` 已覆盖动态分配与验证。没有足够独立的 V3 边界。
- **现有 Skill 边界**：启动配置、栈单位和内核 heap 选择转 `rtos-freertos-config-and-boot`；实际 HardFault、malloc 失败、栈溢出和任务不运行转 `rtos-runtime-fault-diagnosis`；存储期、所有权、池与长期碎片转 `embedded-memory-lifetime-and-pool-design`。本候选不能仅因列出了 `xTaskCreate`/`pvPortMalloc` API 而拆成独立 Skill。
- **source_files**：
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.h`
  - `projects/RTOS项目/源码/APP_TASK/app_tasks.c`
  - `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h`
  - `projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_4.c`
  - `projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s`
  - `projects/RTOS项目/源码/USER/project.uvprojx`
  - `projects/RTOS项目/源码/USER/PWM.map`（仅历史链接旁证，不作为当前构建证明）
- **source_symbols**：`TASK_*_STK_SIZE`, `xTaskCreate`, `xSemaphoreCreateMutex`, `xSemaphoreCreateBinary`, `configTOTAL_HEAP_SIZE`, `configMINIMAL_STACK_SIZE`, `configTIMER_TASK_STACK_DEPTH`, `configCHECK_FOR_STACK_OVERFLOW`, `configUSE_MALLOC_FAILED_HOOK`, `pvPortMalloc`, `xPortGetFreeHeapSize`, `xPortGetMinimumEverFreeHeapSize`, `__user_initial_stackheap`, `Stack_Size`, `Heap_Size`。
- **事实风险**：任务栈宏是 words，不是字节；业务任务栈合计不等于实际 heap 消耗，TCB、对齐和队列/信号量对象必须另计。`ifopen=0` 是当前工程事实，IAP 的 256 words 只能作为条件分支。启动文件的 1 KiB MSP 栈和 512 B ARM C heap 不等于 FreeRTOS 的 10 KiB `heap_4` 区。`configCHECK_FOR_STACK_OVERFLOW=0`、`configUSE_MALLOC_FAILED_HOOK=0` 且 high-water API 未启用时，不能宣称运行时预算已验证；`PWM.map` 是历史产物证据。
- **是否建议升格**：**reject/降级，不建议独立升格**。把预算核对作为 `rtos-freertos-config-and-boot` 与 `rtos-runtime-fault-diagnosis` 的联合检查项即可；只有出现新的静态分配/链接脚本变体且能证明现有 Skill 无法覆盖时再重新评估。

## Round 3 结论

- 新颖性门槛：候选 1、2 的 V1/V2/V3 相对当前 canonical Skill 可成立，但不是 Round 3 新发现，分别沿用 Round 2 G-R04/G-R05；本轮不重复创建或升格。
- 候选 3 的 V1/V2 有执行价值，但 V3 被现有 Skill 明确覆盖，降级为组合审计。
- 因此本轮 **0 条新的独立升格候选**。本文件仅记录审查结果；未创建 canonical Skill、未修改全局索引、未修改 `projects/` 或 `archive/`。

## Round 4 边界复核：共享状态锁覆盖

- **观察**：`SystemState_t` 的结构体定义、`g_dataMutex` 创建、锁内辅助函数和多个任务的直接访问分别位于 `app_tasks.h`、`app_tasks.c` 与任务间通信文档中；这足以支持一次源码事实审计。
- **V1**：`文档/2.4 任务间通信：互斥信号量与全局状态管理.md` 描述设计意图；`app_tasks.c` 的 `SensorTask`、`WindSpeedTask`、`MotorControlTask`、`UIDisplayTask`、`AntiBackflowTask`、`System_GetState` 提供独立实现证据。
- **V2**：可推导“UI 撕裂快照”“模式/电机状态短暂不一致”“防回流和电机任务同时改状态”“读改写被打断”等新故障，并能通过读写者矩阵、短锁区快照和重复状态切换测试验证。
- **V3**：它是现有 `rtos-task-and-isr-design`、`rtos-runtime-fault-diagnosis`、`rtos-auto-mode-state-machine` 和 `rtos-display-buzzer-feedback` 的共同事实边界，不是新的独立方法 Skill；拆出新 Skill 会重复四个已有入口。
- **处理**：不新增 Skill；将“设计意图/当前锁覆盖/`System_GetState()` 裸指针/`volatile` 不等于同步”合并到现有 `rtos-task-and-isr-design`，并由运行时、AUTO 和显示 Skill 通过相关边界继续承接。
