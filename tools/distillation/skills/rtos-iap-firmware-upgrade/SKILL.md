---
name: rtos-iap-firmware-upgrade
description: "Use when the user needs to explain, review, debug, or interview the STM32 + FreeRTOS IAP firmware-upgrade chain: USART1 RX, DMA1 Channel5, ISR-to-task handoff, CRC32 packaging, Flash erase/write, APP vector validation, MSP setup, and jump. Trigger phrases include “IAP 怎么实现”, “串口 DMA 固件升级”, “CRC 校验通过后怎么写 Flash”, “Boot 跳 APP”, “升级后不启动”. Do not describe this as a production OTA/security solution unless the user supplies signatures, rollback, power-fail recovery, and a verified APP linker layout."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/5 系统功能实现/5.3 固件升级（IAP）：Boot + 单APP分区与串口DMA传输.md
    - projects/RTOS项目/文档/5 系统功能实现/5.4 CRC32校验：数据完整性验证机制.md
    - projects/RTOS项目/文档/2 系统架构与设计/2.3 系统启动流程与初始化顺序.md
    - projects/RTOS项目/文档/3 FreeRTOS 内核与任务设计/3.3 中断优先级配置与临界区保护.md
    - projects/RTOS项目/源码/SYSTEM/sys/sys.h
    - projects/RTOS项目/源码/USER/main.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
    - projects/RTOS项目/源码/BSP/DMA/dma.c
    - projects/RTOS项目/源码/BSP/DMA/dma.h
    - projects/RTOS项目/源码/SYSTEM/usart/usart.c
    - projects/RTOS项目/源码/BSP/IAP/iap.c
    - projects/RTOS项目/源码/BSP/IAP/iap.h
    - projects/RTOS项目/源码/BSP/CRC32/crc32.c
    - projects/RTOS项目/源码/BSP/CRC32/crc32.h
    - projects/RTOS项目/源码/BSP/STMFLASH/stmflash.c
    - projects/RTOS项目/源码/BSP/STMFLASH/stmflash.h
    - projects/RTOS项目/源码/tools/add_crc32.py
    - projects/RTOS项目/源码/USER/project.uvprojx
  source_symbols: [ifopen, buff_size, uart_init, MYDMA_Config, MYDMA_Enable, DMA1_Channel5_IRQHandler, g_iapSemaphore, iap_task, GetReceivedDataLength, CRC32_Calculate, CRC32_VerifyFirmware, iap_write_appbin, STMFLASH_Write, FLASH_APP1_ADDR, iap_load_app, MSR_MSP]
  source_chapter: projects/RTOS项目/文档/5.3-5.4
  tags: [stm32, freertos, iap, bootloader, dma, crc32, flash, firmware-update]
  related_skills: rtos-communication-debugging, rtos-freertos-config-and-boot, rtos-runtime-fault-diagnosis, rtos-project-storytelling
---

# STM32 IAP 固件升级链路

## R — 来源摘录（Reading）

> 这是默认关闭的实验性链路（`ifopen=0`）：USART1 + DMA1 Channel5 接收固定长度缓冲区，DMA 完成中断释放二值信号量，`iap_task` 做 CRC32、入口检查、Flash 擦写并尝试跳转。
>
> — `projects/RTOS项目/文档/5 系统功能实现/5.3 固件升级（IAP）：Boot + 单APP分区与串口DMA传输.md`、`projects/RTOS项目/源码/SYSTEM/sys/sys.h`、`projects/RTOS项目/源码/APP_TASK/app_tasks.c`

> PC 端格式是 `[APP正文][4字节 CRC32 小端序]`；STM32 端从尾部取 CRC，计算正文并比较。
>
> — `projects/RTOS项目/源码/tools/add_crc32.py`、`projects/RTOS项目/源码/BSP/CRC32/crc32.c`

## I — 方法论解释（Interpretation）

把升级当作一条有前置条件的状态链，而不是“收到文件后调用一个升级 API”：

```text
APP.bin
  → PC add_crc32.py
  → [正文 + 4 字节小端 CRC32]
  → USART1 RX 请求
  → DMA1 Channel5 搬到 receive_buff
  → DMA TC ISR 清标志 + xSemaphoreGiveFromISR
  → iap_task 读取 DMA 剩余计数得到长度
  → CRC32_VerifyFirmware
  → 复位向量地址检查
  → 擦除/半字写入 APP 区
  → 写后向量检查
  → 关闭外设/中断，设置 MSP，跳 APP Reset_Handler
```

每一段都要回答四个问题：输入是什么、完成证据是什么、失败如何恢复、下一段的地址/长度/所有权是否成立。DMA 只解决搬运，不解决帧边界、版本、认证、断电一致性；二值信号量只表达“有一批事件”，不承载固件数据。`GetReceivedDataLength()` 依赖固定 `buff_size` 和 DMA CNDTR，因此实际传输协议必须保证长度、缓冲区、DMA 模式和 PC 文件完全一致。

CRC32 是传输完整性检测，不是身份认证或防篡改签名。Flash 写入前后的向量检查是很窄的地址合法性检查，不等于镜像可运行性验证；APP 还必须按目标地址链接并正确设置向量表偏移。

## A1 — 资料中的应用（Past Application）

- `sys.h` 当前 `ifopen=0`；打开它后，`main.c` 才调用 `MYDMA_Config()`，`app_tasks.c` 才创建接收缓冲区、`g_iapSemaphore`、`iap_task` 和 DMA ISR 路径。
- `uart_init(115200)` 在 `MYDMA_Config()` 前执行；USART1 RX DMA 请求开启，DMA 使用外设地址不递增、内存地址递增、8-bit、Normal 模式。
- `DMA1_Channel5_IRQHandler()` 清 TC 标志、释放 `g_iapSemaphore` 并按需 `portYIELD_FROM_ISR()`；`iap_task` 阻塞等待后通过 `buff_size - DMA_GetCurrDataCounter()` 取得接收长度。
- CRC32 由 PC `zlib.crc32()` 和 STM32 查表实现协作，末尾 4 字节按小端解码；通过后先检查 RAM 缓冲区偏移 4 的复位向量，再写入 `FLASH_APP1_ADDR=0x0800F000`，写后再次检查向量。
- `iap_write_appbin()` 将字节两两组合成 16 位半字，使用 512 个半字（1024B）缓冲分块调用 `STMFLASH_Write()`；`iap_load_app()` 关闭全局中断、DMA、USART，检查 MSP 后写 MSP 并跳转函数指针。

## A2 — 未来触发场景（Anticipated Trigger）

当用户问“IAP 如何讲”“DMA 接收完成但升级任务没反应”“CRC 通过却写不进/跳不过去”“Boot 如何跳 APP”“升级后黑屏”“这个项目有没有 A/B 回滚/安全升级”时触发。

若现象是泛化的 DMA/信号量丢事件，组合 `rtos-communication-debugging`；若是启动器、VTOR、SysTick 或 APP 启动链，组合 `rtos-freertos-config-and-boot`；若已经 HardFault/复位，组合 `rtos-runtime-fault-diagnosis`。

## E — 可执行步骤（Execution）

1. **确认变体和边界**：读取 `ifopen`、`buff_size`、`FLASH_APP1_ADDR`、芯片 Flash/SRAM 容量、Keil target、APP 链接地址；先确认当前构建真的包含 IAP，而不是只看到 BSP 文件存在。
2. **验证 PC 包**：对原始 APP 做 CRC32，追加 `<I` 小端 4 字节；记录输入长度、输出长度、CRC 值和文件哈希。确认没有把已经带 CRC 的文件再次追加。
3. **验证串口/DMA**：确认 USART1 波特率/帧格式、电平和 PA9/PA10 连接；核对 DMA1 Channel5、外设/内存地址、CNDTR、Normal 模式、RX DMA 请求、TC 标志和中断优先级。
4. **验证 ISR→任务交接**：确认 `g_iapSemaphore` 在 DMA 中断可能发生前已创建，ISR 使用 `xSemaphoreGiveFromISR()` 而不是普通 API，任务确实阻塞在同一个句柄；记录 ISR 次数、CNDTR、任务唤醒次数和缓冲区首尾字节。
5. **验证长度和格式**：`receivedLength` 必须大于 4；固件正文长度、末尾 CRC 和 `buff_size` 一致，检查奇数长度、超长、短包、重复包和 DMA 重启时的残留数据。
6. **验证 CRC**：用已知测试向量分别运行 PC 和 STM32 算法，核对多项式/初值/最终异或/字节序；只在 CRC 覆盖 APP 正文、不覆盖尾部 CRC 时比较。
7. **验证 Flash 地址和写入**：确认 APP 起始地址在合法 Flash 范围且按芯片页大小擦除；检查 16 位写入对齐、缓冲区尾部、跨页行为和写后读回。`STMFLASH_Write()` 会读整页、必要时擦除并回写，需考虑擦写时间和断电窗口。
8. **验证跳转**：写入后读取 APP 起始字的 MSP 和 `+4` 复位向量；检查 MSP 在目标 SRAM 范围、复位向量在目标 Flash 范围；跳转前清理 DMA/USART/中断挂起状态，并确认 APP 的 VTOR/链接地址与 Boot 分区一致。
9. **验证失败恢复**：CRC/入口检查失败时清空/重启 DMA 的行为是否可重复；模拟断电、掉线、半包、错误 CRC、Flash 写失败和 APP 启动失败。记录当前实现没有 A/B 槽、持久化状态、断点续传和自动回滚。

## B — 边界与风险（Boundary）

- 当前代码 `ifopen=0`；不能把 IAP、DMA 接收任务和升级成功流程说成默认运行，更不能仅凭文档声称已经在目标板完成升级实测。
- 当前是 Boot + 单 APP 地址规划，不是 A/B 双镜像；`FLASH_APP1_ADDR=0x0800F000` 在 64KB 设备上只留下约 4KB 地址空间，仓库没有一个可核对的独立 APP 链接工程，因此可部署性需另证。
- `buff_size=3692` 是固定长度约定；当前链路没有通用长度协议、分包序号、超时、重传计数、版本选择或签名认证。
- CRC32 能检测许多偶然传输错误，但不是密码学签名，不能防恶意篡改或证明来源可信。
- `iap_load_app()` 的清理序列是当前代码事实，不等于覆盖所有外设、NVIC pending、SysTick、缓存或向量表状态；跳转失败应进入运行时故障/启动链 Skill。
- Flash 擦写存在断电窗口；当前代码没有 A/B 回滚、升级状态日志或可靠性证明，不能把“失败后重新接收”说成断电恢复。
- 不要整体复制 FreeRTOS/STM32 库代码进回答；应引用函数、地址、宏和职责，并明确文档、源码和硬件实测的等级。

## 相关 Skills

- `rtos-communication-debugging`：DMA、ISR、信号量和任务事件链。
- `rtos-freertos-config-and-boot`：启动器、VTOR、SysTick、向量表和调度器前置条件。
- `rtos-runtime-fault-diagnosis`：升级后 HardFault、复位和任务运行时异常。
- `rtos-project-storytelling`：以产品问题、链路、个人贡献和边界讲项目。

## 审计信息

- 三重验证：V1 ✓（IAP 文档、PC 工具、USART/DMA/CRC/Flash/IAP 源码和工程配置）；V2 ✓（可用于定位短包、CRC 不一致、DMA 不唤醒、写入失败、跳转失败等新问题）；V3 ✓（把固定长度、条件编译、地址规划和失败恢复缺口连成完整决策链）。
- 当前事实重点：IAP 是可选实验链路；安全性、回滚、断电恢复和独立 APP 可部署性均不能夸大。
