# `rtos-project` 来源覆盖补充

审计日期：2026-08-14。该文件是 [`source-boundary.md`](tools/distillation/rtos-project/source-boundary.md) 的覆盖补充；`projects/RTOS项目/` 原始文档、源码、配置和构建产物保持只读。

## 冻结统计

| 项目 | 数量 | 算式/来源 |
|---|---:|---|
| 当前域 inventory | 460 | `source-inventory-current.tsv` 中 `domain=rtos-project` |
| 精确 Skill evidence | 78 | `source-register.md` 的 `skill-evidence` |
| domain-only/indexed-only | 116 | `source-register.md` 的 `domain-referenced`，均无精确 Skill `source_files` |
| 构建/附件/派生层 | 266 | 257 构建证据 + 8 图示附件 + 1 IDE 派生缓存 |
| 未回链审计行 | 382 | `460 - 78 = 116 + 266`；见 [`unlinked-review.tsv`](tools/distillation/rtos-project/unlinked-review.tsv) |
| 分类复核 | 382 | `13 + 24 + 43 + 22 + 2 + 1 + 1 + 6 + 3 + 1 + 257 + 8 + 1` |

## 当前 Keil target 的精确缺口

只读取 `projects/RTOS项目/源码/USER/project.uvprojx` 的 `<FilePath>` 文件组：当前 target 共 43 个编译/汇编条目，其中 27 个已有精确 Skill evidence，16 个只有域级登记：

```text
projects/RTOS项目/源码/BSP/GPIO/gpiox.c
projects/RTOS项目/源码/CORE/core_cm3.c
projects/RTOS项目/源码/FreeRTOS/croutine.c
projects/RTOS项目/源码/FreeRTOS/event_groups.c
projects/RTOS项目/源码/FreeRTOS/list.c
projects/RTOS项目/源码/FreeRTOS/queue.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/misc.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_adc.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_dma.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_exti.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_flash.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_gpio.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_rcc.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_rtc.c
projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_usart.c
projects/RTOS项目/源码/SYSTEM/sys/sys.c
```

这 16 个文件不自动意味着应新增 16 个 Skill：GPIO/核心/FreeRTOS/ST 外设库多数是已有启动、任务/ISR、通信或配置 Skill 的支撑代码，后续应补精确路径和符号，而不是按库文件拆 Skill。

## 文档、配置、构建和测试边界

- `project.uvprojx` 当前选择 `STM32F103C8`、`startup_stm32f10x_md.s`、`FreeRTOS/portable/RVDS/ARM_CM3/port.c` 和 `heap_4.c`；`startup_stm32f10x_hd.s`、其他 `heap_x.c`、其他 RVDS port 是备用变体。
- `FreeRTOS/include/FreeRTOSConfig.h`、`SYSTEM/sys/sys.h`、`APP_TASK/app_tasks.c` 是配置/源码事实入口：1 kHz tick、10 KB heap、关闭栈溢出和 malloc 失败钩子，以及 `DEBUG=0`、`SENSOR_DEBUG=0`、`ifopen=0` 必须按当前文件写，不能按文档示例开关推断。
- 文档中的“互斥量保护全部共享状态”与当前 `app_tasks.c` 不完全一致：`g_dataMutex` 只覆盖部分路径，`MotorControlTask`、`UIDisplayTask`、`AntiBackflowTask` 有直接读写，`System_GetState()` 返回裸指针。正确 claim 是“部分访问受保护，仍有一致性风险”。
- `OBJ/PWM.build_log.htm`、AXF/HEX/BIN、LST、CRF/O/D 和 `tools/APP*.bin` 是历史构建/产物层；可以核对 target、地址和变体关系，但不能证明本次重编译、Flash verify、Reset 到 `main` 或业务运行。
- 257 个构建证据中只有 `USER/PWM.map`、`OBJ/PWM.sct` 进入现有 Skill evidence；其余保留 provenance，不重复算 Skill。8 个 SVG 是图示附件，`USER/PWM.uvguix.lzy` 是 IDE 缓存。
- 当前快照没有独立 `tests/`、pytest/CTest 或项目级可运行测试入口。`fix_review.py` 是修复/检查辅助脚本，库内 `assert_param`、HTML 动画和历史 Build log 都不能称为项目测试通过。

## 自检合同

- `unlinked-review.tsv` 的 382 个数据行必须全部来自当前 `source-register.md`，且 `existing_skill_evidence=no`。
- 116 条 domain-only 行必须是 `indexed_only=yes`、`precise_backlink=none`；构建、附件和派生层不冒充 indexed-only。
- `43 = 27 + 16` 的 target 文件组统计必须与 `project.uvprojx` 和 source-register 交叉一致。
- 本补充只链接本域 `FULL_COVERAGE_REVIEW.md`、`unlinked-review.tsv`、`source-boundary.md`、`INDEX.md` 和 `artifact-provenance.md`；不修改全局报告、脚本、客户端 Skill 或其他域。
