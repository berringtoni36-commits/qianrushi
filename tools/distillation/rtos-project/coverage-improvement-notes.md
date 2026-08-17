# RTOS 项目覆盖改进队列

## P0：工程身份

- 读取 `USER/project.uvprojx` 的 target、Device、宏、IncludePath、startup、port、heap、IROM/IRAM 和文件组。
- 将 AXF/HEX/BIN/MAP/LST 只作为历史产物身份，等待一次可复现 Keil build、Flash verify、Reset/串口日志。

## P1：运行时关键路径

- `queue.c`/`event_groups.c`：核对应用调用者、阻塞超时和 ISR 变体。
- `gpiox.c`/`stm32f10x_exti.c`：核对中断线、NVIC 优先级、消抖和任务交接。
- `app_tasks.c`：继续记录 `g_dataMutex` 部分保护、裸指针和共享状态一致性风险。
- `GUI.c`/`motor.c`：核对任务调用、PWM/显示边界；不把存在性当硬件实测。

## P2：变体和派生物

- `startup_stm32f10x_hd.s`、`heap_1/2/3/5.c` 与当前 `md + heap_4` target 分开登记。
- Defuddle 提取稿、HTML 动画、OBJ 目录和 IDE 缓存不复制进 Skill，只保留来源和证据用途。

本文件只增加验证队列，不修改 RTOS 源码或客户端 Skill。
