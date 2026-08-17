# `rtos-project` 全量未回链覆盖复核

审计日期：2026-08-14。原始项目 `projects/RTOS项目/`、Keil 工程、源码和产物保持只读；本报告只在域内补充覆盖审计。

## 结论

| 口径 | 数量 | 结论 |
|---|---:|---|
| `source-inventory-current.tsv` 当前域文件 | 460 | 35 个知识文档、139 个代码/配置、18 个其他配置、259 个构建产物、8 个附件、1 个派生缓存 |
| 已有精确 Skill evidence | 78 | `source-register.md` 标为 `skill-evidence`；按规范 Skill 的精确 `source_files` 计数 |
| 未有精确 Skill evidence | 382 | 本报告 `unlinked-review.tsv` 的全部行 |
| 主来源型 domain-only / indexed-only | 116 | 文档、当前/备用源码、库、配置和工具脚本只有域级登记，没有精确 Skill 回链 |
| 有意不升格的构建/附件/派生层 | 266 | 257 个构建/列表/二进制证据、8 个图示附件、1 个 IDE 派生缓存 |
| 当前 target 文件组 | 43 | `project.uvprojx` 文件组中 27 个有精确 Skill evidence，16 个仅域级登记 |
| 独立测试套件 | 0 | 未发现 `tests/`、pytest/CTest 或项目级可运行测试入口；历史 Build log 不等于运行测试 |

逐文件路径、哈希、分类和处置见 [`unlinked-review.tsv`](tools/distillation/rtos-project/unlinked-review.tsv)。

全局报告把 116 条 `domain-referenced` 和 266 条 evidence layer 分开统计，但其 `indexed_only=0` 仍不足以表达“没有精确回链”；本轮将 `source_files` 精确命中与域级登记严格分开。

## 未回链分类

| 类别 | 数量 | 已有 Skill evidence | 仅索引 | 真实路径示例 | 处置和 claim/code 边界 |
|---|---:|---|---|---|---|
| `project-source-unlinked` | 13 | 否 | 是 | `projects/RTOS项目/源码/BSP/GPIO/gpiox.c`；`projects/RTOS项目/源码/SYSTEM/sys/sys.c` | 保留源码；以 `project.uvprojx`、符号和构建证据确认当前职责，不按孤立 API 新增 Skill。 |
| `freertos-core-unlinked` | 24 | 否 | 是 | `projects/RTOS项目/源码/FreeRTOS/croutine.c`；`projects/RTOS项目/源码/FreeRTOS/include/queue.h` | 保留核心/头文件参考；只有当前 target 文件组和调用符号能支撑当前行为，目录中其他版本不代表被编译。 |
| `vendor-library-unlinked` | 43 | 否 | 是 | `projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_adc.c`；`projects/RTOS项目/源码/STM32F10x_FWLib/inc/misc.h` | 保留依赖层；可解释 ST API，不能冒充项目独有实现、个人贡献或硬件结果。 |
| `alternate-port-or-heap` | 22 | 否 | 是 | `projects/RTOS项目/源码/CORE/startup_stm32f10x_hd.s`；`projects/RTOS项目/源码/FreeRTOS/portable/MemMang/heap_1.c` | 降级为备用变体；当前 target 选 `startup_stm32f10x_md.s`、`ARM_CM3/port.c`、`heap_4.c`，不能由目录存在性推断使用。 |
| `project-document-unlinked` | 2 | 否 | 是 | `projects/RTOS项目/文档/1 入门指南/1.1 项目概述：STM32 + FreeRTOS 油烟机控制系统.md`；`projects/RTOS项目/文档/2 系统架构与设计/2.2 目录结构与模块职责划分.md` | 保留设计意图/说明；与源码、宏和 target 配置冲突时，以代码事实为准。 |
| `derived-document-unlinked` | 1 | 否 | 是 | `projects/RTOS项目/基于STM32+FreeRTOS的烟机控制系统文档-Defuddle提取.md` | 保留阅读入口但标派生；不得和原项目文档重复计数。 |
| `interactive-derivative` | 1 | 否 | 否 | `projects/RTOS项目/文档/5 系统功能实现/anti-backflow-animation.html` | 降级为教学派生物；示例状态和阈值不等于源码执行或硬件实测。 |
| `ide-config-variant` | 6 | 否 | 是 | `projects/RTOS项目/源码/USER/project.uvoptx`；`projects/RTOS项目/源码/USER/EventRecorderStub.scvd` | 保留工具/调试配置；只能说明配置线索，不能证明编译、下载或运行成功。 |
| `repair-tool-script` | 3 | 否 | 是 | `projects/RTOS项目/源码/fix_review.py`；`projects/RTOS项目/源码/keilkilll.bat` | 保留 provenance/维护工具；不是产品路径，也不是测试结果。 |
| `directory-note-unlinked` | 1 | 否 | 是 | `projects/RTOS项目/源码/文件夹说明.txt` | 仅作目录上下文，不能证明源码行为。 |
| `build-or-evidence-artifact` | 257 | 否 | 否 | `projects/RTOS项目/源码/OBJ/PWM.build_log.htm`；`projects/RTOS项目/源码/OBJ/PWM.axf`；`projects/RTOS项目/源码/tools/APP_crc.bin` | 保留构建/历史产物身份；可支撑布局和变体核对，不能单独证明 Flash、Reset、串口或业务运行。 |
| `diagram-attachment` | 8 | 否 | 否 | `projects/RTOS项目/源码/assets/freertos-startup_animated.svg`；`projects/RTOS项目/源码/assets/state-sharing_animated.svg` | 保留图示证据；只能表达设计/教学关系，不能替代源码或测试。 |
| `derived-ide-cache` | 1 | 否 | 否 | `projects/RTOS项目/源码/USER/PWM.uvguix.lzy` | 降级为 IDE 缓存；不参与来源事实或 Skill 计数。 |

## 当前 target 与文档/代码边界

- `projects/RTOS项目/源码/USER/project.uvprojx` 声明 `STM32F103C8`，当前文件组共 43 个条目；精确 Skill evidence 覆盖 27 个，未回链的 16 个 P0 编译单元见 [`coverage-supplement.md`](tools/distillation/rtos-project/coverage-supplement.md)。
- 代码事实必须以 target 文件组和符号为准：`startup_stm32f10x_md.s → SystemInit → main → System_Init → StartTask → vTaskStartScheduler`；`FreeRTOSConfig.h` 的 1 kHz tick、10 KB heap、关闭栈溢出/ malloc 失败钩子，以及 `sys.h` 的 `DEBUG=0`、`SENSOR_DEBUG=0`、`ifopen=0` 都是配置/源码事实。
- 文档“所有共享状态由互斥量保护”不能直接照抄。`app_tasks.c` 中 `g_dataMutex` 只覆盖部分路径，`MotorControlTask`、`UIDisplayTask`、`AntiBackflowTask` 有直接访问；`System_GetState()` 返回裸指针。应写成“部分路径加锁”，不能宣称完整线程安全。
- IAP 文档的 `FLASH_APP1_ADDR=0x0800F000`、固定 `buff_size=3692` 和 CRC32 说明是工程约定/设计链；当前工程和 MAP 从 `0x08000000` 链接，没有独立 APP 工程、J-Link 回读或板上串口原始日志时，不能宣称可部署升级或 C2-C4 已验证。
- `PWM.build_log.htm` 的成功/警告数字和 `PWM.map`、AXF/HEX/BIN 的存在性是历史静态证据；它们不等于当前环境重编译、已烧录、已到达 `main` 或业务闭环通过。
- 未发现独立项目测试入口。库源码里的 `assert_param`、HTML 动画和修复脚本不能替代编译回归、目标板测试、故障注入或运行日志。

## 建议

1. 优先把 16 个当前 target P0 编译单元补入已有 RTOS 配置/启动、任务/ISR、通信或反馈 Skill 的精确来源映射；这是回链补充，不是新增 API Skill。
2. 对 257 个构建产物只保留 provenance 层：若要升级 C1，补同一次构建的输入 hash、工具版本和完整日志；若要升级 C2-C4，补 program/verify/readback、向量/PC/MSP/VTOR 和原始串口/业务日志。
3. 继续保留备用 port、heap、ST 库和 IDE 配置作为边界材料，禁止根据文件存在性或对象名把备用变体算入当前 target。
4. 若后续补测试，优先建立可复现的 host 静态检查和目标板运行记录；不要把 HTML 或历史 Build log 改称为测试通过。

边界补充见 [`coverage-supplement.md`](tools/distillation/rtos-project/coverage-supplement.md)，原域分层见 [`source-boundary.md`](tools/distillation/rtos-project/source-boundary.md)。
