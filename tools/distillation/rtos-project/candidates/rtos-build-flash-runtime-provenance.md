# Candidate — RTOS 固件 Build→Flash→Serial/Runtime Provenance

## 原子命题

固件“可复现”必须闭合同一个 Keil target 的工程配置合同、AXF/HEX/MAP 产物身份、J-Link/SWD Flash 编程与回读、向量/Reset & Run、串口和运行时证据；编译成功、烧录成功或文档规划都不能单独推出板上运行。

## 来源证据

- 主文档：`projects/RTOS项目/文档/1 入门指南/1.2 快速入门：从零搭建开发环境并运行项目.md`；`1.3.1 Keil MDK 工程配置与编译.md`；`1.3.2 J-Link 调试器配置与烧录.md`；`1.3.3 串口调试工具使用.md`。
- 工程合同：`projects/RTOS项目/源码/USER/project.uvprojx`，含 STM32F103C8、ARMCC 5.06、Pack、宏、IncludePath、startup/port/heap、IROM/IRAM、输出 AXF/HEX 和 Flash algorithm 配置。
- 链接证据：`projects/RTOS项目/源码/USER/PWM.map`，记录 armlink、入口 `0x080000ed`、`__Vectors=0x08000000`、IROM/RAM 执行区和符号表。
- 启动/串口/应用证据：`CORE/startup_stm32f10x_md.s`、`USER/system_stm32f10x.c`、`USER/main.c`、`SYSTEM/usart/usart.c`、`SYSTEM/sys/sys.h`、`APP_TASK/app_tasks.c`。
- 调试配置：`USER/JLinkSettings.ini`、`USER/DebugConfig/PWM_STM32F103ZE_1.0.0.dbgconf`。

## V1 / V2 / V3

- V1：通过文档、工程 XML、MAP、启动/系统/串口/应用源码和 J-Link 配置闭合来源；产物文件只作观察证据。
- V2：可从 target/产物不一致、verify 失败、向量错、Reset 后不到 main、串口沉默等现象反推最小缺口和下一项测量。
- V3：将 C0 工程合同、C1 产物身份、C2 Flash、C3 boot、C4 serial/runtime 串为原子流程，并明确转交启动机制、运行时故障和 IAP 协议的边界。

## 事实边界

- 当前工程和 MAP 从 `0x08000000` 链接；`FLASH_APP1_ADDR=0x0800F000` 仅是 IAP 规划/宏值，仓库没有独立 APP 链接工程的证据。
- 当前 `DEBUG=0`、`SENSOR_DEBUG=0`、`ifopen=0`；不能默认声称有调试串口、传感器日志或 IAP 运行实测。
- 当前工作区可见 `OBJ/PWM.axf/.hex/.bin` 和 `USER/PWM.map`，但缺少本次 Build log、完整 hash 链、J-Link 会话、Flash 回读和板上串口原始日志；结论不得超过历史产物/布局相容。
- 文档“应显示/建议选择/烧录后运行”属于流程或预期；个人贡献、长期稳定性和硬件成功率没有来源，不纳入已验证事实。

## 验证结论

候选通过三重验证，适合升格为 `distillation/skills/rtos-build-flash-runtime-provenance/` 原子 Skill；本候选不宣称固件已在目标板完成 C2-C4 硬件验证。
