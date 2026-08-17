---
name: rtos-build-flash-runtime-provenance
description: "审计 STM32/FreeRTOS 固件从 Keil 工程配置、编译产物 AXF/HEX/MAP、J-Link/SWD 烧录到 Reset & Run、串口和运行时证据的可复现验证链。用户询问工程为何编不出同一固件、AXF/HEX/MAP 是否属于当前 target、Pack/宏/IncludePath/startup/port/IROM/IRAM 是否闭合、J-Link Flash algorithm 或烧录后不运行、向量表/地址/串口证据是否可信时使用；不要用它替代 FreeRTOS 启动机制、运行时故障隔离或 IAP 协议审计。"
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_chapter: projects/RTOS项目/文档/1.2–1.3；USER/project.uvprojx；USER/PWM.map；源码启动/串口/IAP链路
  source_files:
    - projects/RTOS项目/文档/1 入门指南/1.2 快速入门：从零搭建开发环境并运行项目.md
    - projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.1 Keil MDK 工程配置与编译.md
    - projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.2 J-Link 调试器配置与烧录.md
    - projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.3 串口调试工具使用.md
    - projects/RTOS项目/源码/USER/project.uvprojx
    - projects/RTOS项目/源码/USER/PWM.map
    - projects/RTOS项目/源码/USER/JLinkSettings.ini
    - projects/RTOS项目/源码/USER/DebugConfig/PWM_STM32F103ZE_1.0.0.dbgconf
    - projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s
    - projects/RTOS项目/源码/USER/system_stm32f10x.c
    - projects/RTOS项目/源码/USER/main.c
    - projects/RTOS项目/源码/USER/stm32f10x_it.c
    - projects/RTOS项目/源码/SYSTEM/usart/usart.c
    - projects/RTOS项目/源码/SYSTEM/sys/sys.h
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h
    - projects/RTOS项目/源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c
    - projects/RTOS项目/源码/BSP/IAP/iap.h
    - projects/RTOS项目/源码/BSP/IAP/iap.c
  source_symbols:
    - TargetName
    - Device
    - PackID
    - project.uvprojx
    - PWM.axf
    - PWM.hex
    - PWM.map
    - Image Entry point
    - __Vectors
    - Reset_Handler
    - SystemInit
    - main
    - vTaskStartScheduler
    - VerifyDownload
    - FlashDriverDll
    - Reset and Run
    - USART1
    - fputc
    - DEBUG
    - ifopen
    - FLASH_APP1_ADDR
  related_skills:
    - rtos-freertos-config-and-boot
    - rtos-runtime-fault-diagnosis
    - rtos-iap-firmware-upgrade
    - rtos-project-storytelling
    - linux-build-debug-chain
---

# RTOS 固件 Build→Flash→Serial/Runtime Provenance

source_book: STM32 + FreeRTOS 油烟机控制系统项目
source_chapter: projects/RTOS项目/文档/1.2–1.3；USER/project.uvprojx；USER/PWM.map；源码启动/串口/IAP链路

## 适用方式

把“编译成功”“烧录成功”“CPU 运行”“串口有输出”和“业务行为正确”拆成不同证据节点，沿同一个 target/变体建立可复现链。先锁定工程合同，再锁定产物身份，再验证 Flash 写入，最后分层记录启动和运行证据；任何一层缺证据，都只报告到该层，不向后推断。

source_files:

  - projects/RTOS项目/文档/1 入门指南/1.2 快速入门：从零搭建开发环境并运行项目.md
  - projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.1 Keil MDK 工程配置与编译.md
  - projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.2 J-Link 调试器配置与烧录.md
  - projects/RTOS项目/文档/1 入门指南/1.3 开发环境配置/1.3.3 串口调试工具使用.md
  - projects/RTOS项目/源码/USER/project.uvprojx
  - projects/RTOS项目/源码/USER/PWM.map
  - projects/RTOS项目/源码/USER/JLinkSettings.ini
  - projects/RTOS项目/源码/USER/DebugConfig/PWM_STM32F103ZE_1.0.0.dbgconf
  - projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s
  - projects/RTOS项目/源码/USER/system_stm32f10x.c
  - projects/RTOS项目/源码/USER/main.c
  - projects/RTOS项目/源码/USER/stm32f10x_it.c
  - projects/RTOS项目/源码/SYSTEM/usart/usart.c
  - projects/RTOS项目/源码/SYSTEM/sys/sys.h
  - projects/RTOS项目/源码/APP_TASK/app_tasks.c
  - projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h
  - projects/RTOS项目/源码/FreeRTOS/portable/RVDS/ARM_CM3/port.c
  - projects/RTOS项目/源码/BSP/IAP/iap.h
  - projects/RTOS项目/源码/BSP/IAP/iap.c

source_symbols: [TargetName, Device, PackID, project.uvprojx, PWM.axf, PWM.hex, PWM.map, Image Entry point, __Vectors, Reset_Handler, SystemInit, main, vTaskStartScheduler, VerifyDownload, FlashDriverDll, Reset and Run, USART1, fputc, DEBUG, ifopen, FLASH_APP1_ADDR]

`PWM.map` 是构建产物证据，不是行为源码；`project.uvprojx` 的 target、源文件组和配置项优先于目录中“存在但未被 target 引用”的旧 `.o/.axf/.hex`。当前工作区观察到 `源码/OBJ/PWM.axf`、`PWM.hex`、`PWM.bin`，但它们的存在不能单独证明是本次源码、当前配置或当前硬件烧录产生的结果。

## source_symbols

- 工程合同：`TargetName`、`Device`、`PackID`、`pCCUsed`、`Cpu`、`FlashDriverDll`、`OutputDirectory`、`OutputName`、`CreateExecutable`、`CreateHexFile`、`DebugInformation`、`HexFormatSelection`、`Define`、`IncludePath`、`TextAddressRange`、`DataAddressRange`、`startup_stm32f10x_md.s`、`port.c`、`heap_4.c`
- 产物/链接：`PWM.axf`、`PWM.hex`、`PWM.bin`、`PWM.map`、`Image Entry point`、`LR_IROM1`、`ER_IROM1`、`RW_IRAM1`、`__Vectors`、`__Vectors_End`、`Reset_Handler`、`main`
- 启动/向量：`SystemInit`、`VECT_TAB_OFFSET`、`VECT_TAB_SRAM`、`SCB->VTOR`、`__initial_sp`、`SVC_Handler`、`PendSV_Handler`、`SysTick_Handler`
- 应用启动：`Hardware_Init`、`System_Init`、`StartTask_Create`、`vTaskStartScheduler`、`TIM4_init`、`Show_Str("Init Complete!")`
- Flash/调试：`JLinkSettings.ini`、`VerifyDownload`、`SkipProgOnCRCMatch`、`EnableFlashDL`、`STM32F10x_128.FLM`、`Reset and Run`、`SWDIO`、`SWCLK`
- 串口/日志：`uart_init`、`USART1`、`PA9`、`PA10`、`fputc`、`DEBUG`、`SENSOR_DEBUG`、`115200`
- 变体/边界：`ifopen`、`buff_size`、`FLASH_APP1_ADDR`、`iap_load_app`

## R — Reading：来源事实

1. `project.uvprojx` 的当前 target 是 `STM32F103C8`/Cortex-M3，使用 `ARMCC V5.06 update 1 (build 61)` 和 `Keil.STM32F1xx_DFP.1.0.5`；CPU 合同写有 IROM `0x08000000/0x10000`、IRAM `0x20000000/0x5000`。同一文件配置 `STM32F10x_128.FLM`、输出目录 `..\OBJ\`、输出名 `PWM`、生成可执行文件和 HEX，并启用调试信息（`project.uvprojx` 的 `TargetCommonOption`、`Cads`、`LDads`）。
2. C 编译宏是 `STM32F10X_MD,USE_STDPERIPH_DRIVER`，IncludePath 包含 `FreeRTOS/include`、`FreeRTOS/portable/RVDS/ARM_CM3`、`CORE`、`USER`、`SYSTEM` 和 BSP 目录；target 的实际文件组同时列出 `startup_stm32f10x_md.s`、`port.c`、`heap_4.c`、`main.c`、`system_stm32f10x.c` 和 `app_tasks.c`。因此“目录里有另一个 port/startup”不能替代 target 文件组证据。
3. 现有 `PWM.map` 标注 ARM Compiler/armlink，记录 Image Entry point `0x080000ed`、`LR_IROM1/ER_IROM1` 从 `0x08000000` 开始，以及 `RW_IRAM1` 从 `0x20000000` 开始；其符号表把 `__Vectors` 放在 `0x08000000`，并记录 `Reset_Handler`、`SystemInit`、`main`、`Hardware_Init` 等符号。它能证明这份 MAP 所对应的历史链接布局，不能证明当前机器刚刚复现或目标板已经运行。
4. `startup_stm32f10x_md.s` 的向量表首项是 `__initial_sp`，第二项是 `Reset_Handler`；`Reset_Handler` 调 `SystemInit` 后跳到 `__main`。`system_stm32f10x.c` 当前默认不定义 `VECT_TAB_SRAM`、`VECT_TAB_OFFSET` 为 `0x0`，因此默认写入 `SCB->VTOR = FLASH_BASE | VECT_TAB_OFFSET`。这是当前启动源码的地址合同，不是对某次板上执行的观测。
5. `main.c` 的源码顺序是 `Hardware_Init()` → `System_Init()` → `StartTask_Create()` → `vTaskStartScheduler()`；`Hardware_Init` 调 `uart_init(115200)`，在 `ifopen` 条件下再初始化 DMA，并显示 LCD 文本 `Init Complete!`。这些是链接/源码路径证据；文档中“上电后应显示”是验收步骤，不是仓库内的硬件测试日志。
6. `usart.c` 把 USART1 配为 PA9 TX、PA10 RX、115200、8 数据位、1 停止位、无校验、无硬件流控，并通过 `fputc` 忙等 USART1 发送完成后写 DR。`sys.h` 当前 `DEBUG=0`、`SENSOR_DEBUG=0`、`ifopen=0`；因此不能默认声称当前固件会输出调试日志或包含启用的 IAP 运行链。
7. `JLinkSettings.ini` 当前记录 `VerifyDownload=1`、`SkipProgOnCRCMatch=1`、`EnableFlashDL=2`，而 `project.uvprojx` 记录目标 Flash 驱动和算法字符串。J-Link 文档给出 SWD 接线、Programming Algorithm、擦除范围和 Reset and Run 的操作合同；文档建议或 ini 配置都不等于一次真实连接、回读和复位运行证据。

## I — Interpretation：证据合同

把一次交付标成以下节点，并为每个节点保留变体 ID（工程文件 hash、宏值、产物 hash、工具版本和时间）：

| 节点 | 可以证明什么 | 不能自动证明什么 |
|---|---|---|
| C0 工程合同 | target、芯片、Pack、ARMCC、宏、IncludePath、startup/port/heap、IROM/IRAM、输出规则已锁定 | 工程在本机实际编译过，或目标板与配置一致 |
| C1 编译产物 | Build 日志、AXF/HEX/MAP 由同一变体产生；MAP 的入口、向量、区域和符号闭合 | HEX 已烧进板，AXF 与 HEX 一定同源，源码未被外部改动 |
| C2 Flash | J-Link 已连接目标、使用的 algorithm/擦除范围明确，program 后 verify/readback 成功 | CPU 已执行到 `main`，业务功能正确 |
| C3 Reset/boot | 复位后 PC/MSP/VTOR/向量和 `Reset_Handler → SystemInit → __main → main` 观测成立 | RTOS 任务、外设或串口链路已经正确 |
| C4 serial/runtime | 端口、电气连接、参数、日志变体和时间戳匹配，取得串口/调试器/LCD/任务证据 | 没有串口输出就等于程序没运行；一条日志就等于系统稳定 |

产物身份必须同时记录：`AXF`（调试/符号和可执行映像入口）、`HEX`（带地址记录的编程载荷）、`MAP`（链接布局、对象/符号和内存占用）。至少保存三者路径、大小、SHA-256、生成时间、target/宏/编译器、输入源码版本和烧录使用的实际文件路径；只看到同名 `PWM` 或目录中的旧 `.o` 不足以建立身份闭环。

## A1 — Past Application：本项目落地

- **工程合同卡**：记录 `project.uvprojx`、`STM32F103C8`、Pack ID、ARMCC 版本、`STM32F10X_MD,USE_STDPERIPH_DRIVER`、完整 IncludePath、`startup_stm32f10x_md.s`、`FreeRTOS/portable/RVDS/ARM_CM3/port.c`、`heap_4.c`、IROM/IRAM 和 `PWM` 输出名。以 XML target 文件组核对“实际参加构建”的文件，不以 `OBJ/` 的残留文件列表代替。
- **产物卡**：把 `OBJ/PWM.axf`、`OBJ/PWM.hex` 与 `USER/PWM.map` 作为待核对的一组；用 MAP 的 `Image Entry point`、`__Vectors`、`ER_IROM1`、`RW_IRAM1` 和目标合同对比。当前 MAP 的 `0x08000000` 向量/执行区与当前工程合同一致，但没有独立 Build log、哈希链或目标板回读证据，结论只能是“布局相容/历史构建证据”，不能是“本次可复现已验证”。
- **烧录卡**：确认目标供电、GND、SWDIO/PA13、SWCLK/PA14、推荐的 NRST，J-Link 连接到 `STM32F103C8`，记录速度/连接模式/Flash algorithm/擦除范围；执行 program、VerifyDownload 和读回。若使用整片擦除，先确认没有真实 Bootloader 需要保留；`0x0800F000` 是 `FLASH_APP1_ADDR` 的 IAP 规划值，不得把当前主工程的 `0x08000000` image 当作已重定位 APP。
- **启动卡**：烧录后先读 Flash 起始两个 words，核对首 word 是目标 SRAM 范围内的 MSP、次 word 是 Thumb 且落在该 image 的 Flash 范围；用 debugger 记录 PC、MSP、VTOR，在 `Reset_Handler`、`main` 或源码可用的最小断点处取证。当前源码的 VTOR 默认偏移为 0；不能因为 IAP 文档写了 APP 地址就推断当前工程已把 VTOR 改到 `0x0800F000`。
- **串口/运行卡**：核对 USB-TTL TX↔PA10、RX↔PA9、GND、115200-8-N-1 和日志编译开关。当前 `DEBUG=0`，所以“串口无 debug 文本”首先是变体事实，不是运行失败；若为取证而打开宏，必须把宏改变记录为新变体并重新 Build、烧录、verify。`fputc` 是阻塞发送，长日志可能改变时序，不能把日志本身当作无扰动测量。
- **证据分层交付**：报告分别写“Build succeeded”“Flash verified”“reached main”“serial received”“business assertion observed”，每一项附文件/命令/时间/截图或日志。`Init Complete!`、传感器数据和任务状态是验收/运行观测候选，不能仅凭文档中的预期输出宣称已实测。

## A2 — Anticipated Triggers：新问题路由

- “AXF、HEX、MAP 到底是不是同一次编译的”“MAP 显示地址和工程设置不一致”“目录里有很多旧 `.o`，哪个 target 真编了”：先用本 Skill 做 target→产物身份审计。
- “Keil 编译通过但 J-Link 烧录失败”“Flash Download Failed”“verify 不一致”“烧录后 PC 不在 image”：先核对工程合同、algorithm、擦除范围、HEX 地址记录和读回向量。
- “下载成功但没有串口”“Reset and Run 后没有运行证据”“只看到 LCD/调试器现象”：先做 C2/C3/C4 分层，核对 `DEBUG`/UART 变体；不要从串口沉默直接跳到 HardFault 结论。
- “FreeRTOS 的 SysTick/PendSV/SVC、调度器为何没接管”：转 `rtos-freertos-config-and-boot`；本 Skill 只确认 target 是否包含正确 port/启动文件并记录 boot 观测。
- “已经 HardFault、复位、栈溢出、运行一段时间卡死”：转 `rtos-runtime-fault-diagnosis`；本 Skill 只提供最后一个已证实节点和产物/变体上下文。
- “DMA/USART 收到但升级任务没醒”“CRC、Flash 写入、Boot 跳 APP 协议”：转 `rtos-iap-firmware-upgrade` 或 `rtos-communication-debugging`；本 Skill 只审计构建变体和烧录产物是否与该链路相符。

## E — Execution：可复现检查流程

1. **冻结变体**：复制工程文件路径、TargetName、芯片/Pack、ARMCC/工具版本、宏、IncludePath、startup/port/heap、IROM/IRAM、输出目录/名称和 `DEBUG/ifopen/SENSOR_DEBUG` 值；给工程、源文件清单和配置做 hash。若用户只提供一个 AXF/HEX，先标记 C0 缺失。
2. **闭合 target 文件**：解析 `project.uvprojx` 的目标文件组，确认 `main.c`、`system_stm32f10x.c`、`startup_stm32f10x_md.s`、实际 FreeRTOS port/heap 和串口文件均在组内；检查 IncludePath 能解析它们所需头文件。目录存在、Keil 文档列出或 `OBJ` 有旧对象，都只能作为待核对线索。
3. **执行干净 Build**：在同一 Keil target 下 Build/重新链接并保存 0 error、warning 处置、编译器输出、生成时间和产物路径。保存 AXF/HEX/MAP 的 SHA-256、大小；如果无法在当前环境使用 Keil，明确“未重新编译”，不要把已有 MAP 当作新 Build 结果。
4. **核对产物身份和布局**：检查 AXF 的 target/入口/调试信息，HEX 的地址记录是否从期望 IROM 开始，MAP 的入口、`__Vectors`、`Reset_Handler`、ER_IROM1/RW_IRAM1、对象列表和最大容量。比较工程 `IROM/IRAM` 与 MAP `Max/Size`；任何旧 MAP、路径不符、地址漂移或 hash 不同都使 C1 降级。
5. **准备 J-Link/SWD**：记录目标板供电、GND、PA13/PA14/NRST、设备识别、接口和速度；核对 `project.uvprojx` 的 `FlashDriverDll`、Keil Programming Algorithm 与实际下载设置，并记录擦除策略。对 Boot/APP 规划只擦目标页，除非明确授权整片擦除且已确认无 Boot 内容。
6. **Program + Verify + Readback**：明确本次实际送入的是 HEX 还是 AXF、完整路径和 hash；执行烧录、下载后校验和读回。至少保存 verify 结果、Flash 起始/末尾采样、起始两个 words、复位后的 PC/MSP/VTOR。`VerifyDownload=1` 是配置意图/工具设置，只有命令输出或读回比较才是 C2 证据。
7. **验证 Reset/Run**：选择并记录 `Reset and Run` 的真实状态；在 reset 后观察 `Reset_Handler`/`main`，核对向量首项 MSP、次项复位入口的地址范围与 Thumb 位；对当前工程检查 `SCB->VTOR` 是否仍为 `FLASH_BASE + 0`。若目标是独立 APP，必须拿到其独立链接工程、向量偏移和 MAP，不能用 `FLASH_APP1_ADDR` 规划值补齐证据。
8. **验证串口和运行层**：记录 USB-TTL 接线、USART1 参数、固件宏变体、终端打开时刻、复位周期和原始日志；分别标记 debugger 到 main、LCD 文本、串口 banner/数据、任务状态、功能输入/输出。没有日志时先判断 `DEBUG` 是否为 0、代码路径是否被条件编译、TX/RX 是否接反，再决定是否进入运行时故障诊断。
9. **输出结论等级**：使用“可复现（C0-C4 全闭合）”“部分可复现（指出断点）”“只有文档/历史产物证据”“无法确认”四级；附最小缺口清单。任何个人贡献、板卡成功率、长期稳定性、APP 可部署性、IAP 安全性和回滚能力必须有独立证据才可写入结论。

## B — Boundary：事实边界与兄弟 Skill

- 工程 XML、源码和 MAP 能证明配置、链接关系和历史布局；不能证明本次 Build、真实 J-Link 会话、Flash 回读、Reset & Run 或串口/业务实测。
- 文档中的“应显示”“建议选择”“烧录成功后自动运行”是操作说明/验收期望；没有原始日志、调试器读数、回读数据或板上记录时，不升级为已验证事实。
- `AXF`、`HEX`、`MAP` 的同名不构成同源；必须用变体、时间、hash、MAP 地址和实际下载路径建立身份。`OBJ` 中的残留 `.o` 不能证明参加当前 target。
- 当前工程从 `0x08000000` 链接、向量表默认在 Flash base；`FLASH_APP1_ADDR=0x0800F000` 是 IAP 源码的地址规划/调用参数，不是当前工程已经重定位的 APP 事实。当前仓库没有可核对的独立 APP 链接工程时，报告为未验证。
- `JLinkSettings.ini` 的 `VerifyDownload=1`、文档中的 `STM32F10x_128.FLM` 和 `Reset and Run` 只描述设置/流程；目标 ID、算法兼容性、擦除范围、编程和回读结果必须现场取得。
- `DEBUG=0` 时串口没有调试输出不是运行失败证明；打开 `DEBUG` 或 `SENSOR_DEBUG` 会改变产物身份，必须重新走 C0-C4。`fputc` 忙等发送完成，串口日志也可能扰动时序。
- 不在本 Skill 内解释 SysTick/PendSV/SVC 的机制、任务栈/堆、调度器启动顺序或 IRQ 优先级根因；使用 `rtos-freertos-config-and-boot`。
- 不在本 Skill 内定位 HardFault、栈溢出、死锁、运行时复位或任务 starvation 根因；使用 `rtos-runtime-fault-diagnosis`。
- 不在本 Skill 内审计 DMA/USART 固件协议、CRC、Flash 半字写入、Boot 跳 APP、签名、回滚或断电恢复；使用 `rtos-iap-firmware-upgrade`，事件未唤醒再组合 `rtos-communication-debugging`。

## V1 / V2 / V3

- **V1（来源闭合）✓**：优先入门文档、Keil/J-Link/串口文档，结合 `project.uvprojx`、`PWM.map`、startup、system、main、USART、sys.h、FreeRTOS target 文件组和 J-Link 配置；AXF/HEX/BIN 只作为当前工作区观察到的产物，不冒充源码。
- **V2（可迁移）✓**：流程能迁移到“编译出来的文件不是当前 target”“烧录 verify 失败”“向量地址错”“Reset 后未到 main”“串口沉默但 CPU 已运行”等新问题，并要求每个判断回到 C0-C4 证据节点。
- **V3（原子性）✓**：把工程配置合同→产物身份→Flash algorithm/Verify→向量/Reset & Run→串口/runtime 证据串成一条可执行链，并以 sibling routing 阻止把启动机制、运行时根因或 IAP 协议混入。

## 事实标记

回答中使用以下标签：`[S]` 当前源码/XML 事实；`[A]` MAP/AXF/HEX/J-Link 配置等产物或工具配置证据；`[D]` 文档流程/预期；`[M]` 必须通过真实构建、烧录、回读或板上观测取得；`[P]` 规划、假设或待验证项。没有 `[M]`，不要写“已烧录运行”“串口已验证”“功能已通过”。

## 相关 Skills

- `rtos-freertos-config-and-boot`：Reset/系统初始化、FreeRTOS port、SysTick/PendSV/SVC、堆栈与调度器机制。
- `rtos-runtime-fault-diagnosis`：HardFault、复位、栈/堆、死锁和运行时现场隔离。
- `rtos-iap-firmware-upgrade`：IAP 条件编译、DMA/CRC/Flash、APP 向量与跳转协议。
- `rtos-communication-debugging`：UART/DMA/ISR 到任务的事件链。
