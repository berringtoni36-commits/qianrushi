# RTOS 项目来源边界与变体登记

> 这是对 `projects/RTOS项目/` 的来源分层，不是源码副本，也不把“出现在目录里”当成“当前 target 已使用”。具体结论仍以 `source-map.md`、Skill 的 `source_files` 和源码核对为准。

## 当前主线（优先级 P0）

### 当前 Keil target 的闭环

- 工程入口：`projects/RTOS项目/源码/USER/project.uvprojx`。
- 当前 target 声明设备为 `STM32F103C8`，include path 指向 `FreeRTOS/include` 与 `FreeRTOS/portable/RVDS/ARM_CM3`。
- 工程文件组明确列出 `main.c`、`system_stm32f10x.c`、`stm32f10x_it.c`、BSP、`FreeRTOS/tasks.c`、`queue.c`、`timers.c`、`heap_4.c`、`ARM_CM3/port.c` 和 `app_tasks.c` 等文件。
- 当前启动主线按源码核对为：`startup_stm32f10x_md.s → SystemInit → main → Hardware_Init/System_Init → StartTask_Create → vTaskStartScheduler`。
- 当前工程配置、源码和 `PWM.map` 能证明静态构建/布局证据；没有本次 Build log、J-Link 回读和硬件串口原始日志时，不升级为本次运行实测。

### 业务主线

1. 传感器/按键采集 → 共享状态/事件。
2. 编码器反馈 → RPM → PID → PWM/H 桥。
3. AUTO/Cooking Event/Delay-Off 与防回流状态机。
4. USART1/DMA → IAP 任务 → CRC32/Flash/APP 跳转（当前 `ifopen=0`，不是默认启用路径）。
5. LCD/SPI 与蜂鸣器反馈。

## 代码层分级

| 层级 | 来源范围 | 处理口径 |
|---|---|---|
| P0 当前主源码 | `USER/`、`APP_TASK/`、`BSP/` 中被 `project.uvprojx` 列入的源文件；`FreeRTOS/tasks.c`、`queue.c`、`timers.c`、`heap_4.c`、`portable/RVDS/ARM_CM3/port.c` | 可作为当前 target 的源码事实；函数、宏和路径必须逐项核对。 |
| P1 当前配置/构建证据 | `project.uvprojx`、`USER/PWM.map`、`OBJ/PWM.sct`、`USER/JLinkSettings.ini`、`OBJ/PWM.{axf,hex,bin}` | 证明配置、历史产物或布局证据；不能单独证明硬件已烧录、启动或业务成功。 |
| P2 文档/复习资料 | `文档/`、`RTOS项目复习文档.md`、`RTOS项目完整代码流程详解.md`、Defuddle 提取稿 | 用于设计意图、解释和面试组织；与源码不一致时标记“文档声称/源码实际”。 |
| P3 备用变体 | `startup_stm32f10x_hd.s`、未被 target 选中的其他 FreeRTOS port、`heap_1/2/3/5.c`、`core_cm3.*` 及库全集 | 作为平台/版本参考或备用材料；不能推断当前 target 使用。 |
| P4 外部库/附件/修复痕迹 | `STM32F10x_FWLib/` 未列入的文件、`OBJ/` 其他对象、`tools/` 脚本/固件、修复脚本和动画 | 仅作证据、工具或历史痕迹；不单独产生 Skill。 |

## 关键变体与陷阱

- `project.uvprojx` 选择 `startup_stm32f10x_md.s`，目录同时存在 `startup_stm32f10x_hd.s`；不能把 HD 启动文件当成当前启动入口。
- 目录中有多套 RVDS port 和多种 `heap_x.c`，当前 target 的闭环应以工程文件组为准，而不是以 FreeRTOS 目录存在性为准。
- `core_cm3.c/h`、STM32 标准外设库和 `FreeRTOS/include` 是依赖层，不代表每个 API 都在业务路径执行。
- `OBJ/` 中存在与当前工程不完全同名或历史变体相关的对象，必须用工程文件组、MAP、时间/哈希和构建日志闭合身份。
- 文档中的 Boot + APP 双区、CRC、IAP 地址和调试输出属于设计/配置条件；`ifopen`、链接布局、回读和跳转现场必须另外证明。

## 本轮审计结论

- 未将 GPIO、LCD/MOTOR/PID 头文件或备用 FreeRTOS port 机械升格为新 Skill；它们已按主源码/依赖/备用变体分层。
- 现有 13 个 RTOS Skill 已覆盖任务、ISR、启动、通信、采集、按键、PID、状态机、IAP、周期、反馈、provenance 和面试表达。
- 下一轮若有实测材料，优先补齐 `Build → Flash → Reset/Vector → Serial/业务输出` 的 C0–C4 证据，而不是新增 API 级 Skill。

## 原始资料与派生产物

- 原始路径：`projects/RTOS项目/`（只读）。
- 域索引：[`INDEX.md`](tools/distillation/rtos-project/INDEX.md)。
- 逐结论回链：[`source-map.md`](tools/distillation/rtos-project/source-map.md)。
- 文件级登记：[`source-register.md`](tools/distillation/rtos-project/source-register.md)。

## 未回链覆盖补充（2026-08-14）

- 全量逐文件复核见 [`FULL_COVERAGE_REVIEW.md`](tools/distillation/rtos-project/FULL_COVERAGE_REVIEW.md)。
- 382 条无精确 Skill evidence 的来源行见 [`unlinked-review.tsv`](tools/distillation/rtos-project/unlinked-review.tsv)；其中 116 条是 domain-only/indexed-only，257 条构建证据、8 条图示附件和 1 条 IDE 派生缓存不升格为 Skill。
- 统计、当前 target 43 = 27 + 16 缺口和测试边界见 [`coverage-supplement.md`](tools/distillation/rtos-project/coverage-supplement.md)。
