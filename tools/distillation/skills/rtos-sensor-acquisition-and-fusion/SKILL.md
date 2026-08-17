---
name: rtos-sensor-acquisition-and-fusion
description: "Use when diagnosing or explaining the STM32+FreeRTOS project sensor path: DHT11 GPIO bit-banging, MQ2 ADC sampling, averaging, empirical concentration conversion, multi-sensor normalization, weighted PWM mapping, or Cooking Event detection. Trigger phrases include “DHT11 读不到”, “MQ2 ADC 异常”, “传感器采样”, “ppm 准不准”, “多传感器融合”. Do not use for a pure PID loop, key-only UI logic, or generic sensor definitions without this project context."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目
  source_files:
    - projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.1 DHT11 温湿度传感器：单总线协议驱动.md
    - projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.2 MQ2 气体传感器：ADC采集与数据处理.md
    - projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.3 多传感器融合风速算法.md
    - projects/RTOS项目/RTOS项目复习文档.md
    - projects/RTOS项目/源码/BSP/DHT11/dht11.c
    - projects/RTOS项目/源码/BSP/DHT11/dht11.h
    - projects/RTOS项目/源码/BSP/MQ2/mq2.c
    - projects/RTOS项目/源码/BSP/MQ2/mq2.h
    - projects/RTOS项目/源码/BSP/WIND/wind_speed.c
    - projects/RTOS项目/源码/BSP/WIND/wind_speed.h
    - projects/RTOS项目/源码/APP_TASK/app_tasks.c
    - projects/RTOS项目/源码/APP_TASK/app_tasks.h
  source_symbols: [DHT_Read_Data, DHT_Read_Byte, MQ2_Init, MQ2_GetAdcValue, MQ2_GetGasConcentration, WindSpeed_Update, SensorTask, g_dataMutex]
  source_chapter: projects/RTOS项目/文档/4 硬件驱动开发/4.2；RTOS项目复习文档.md
  tags: [stm32, freertos, sensor, adc, dht11, mq2, data-fusion]
  related_skills: rtos-task-and-isr-design, rtos-auto-mode-state-machine, rtos-motor-pid-control, rtos-project-storytelling
---

# RTOS 传感器采集与融合审计

## R — 来源摘录（Reading）

> 当前代码进行 10 次 ADC 平均，再按经验公式计算浓度；没有保存 Ro 标定或 ppm 精度测试，不能直接宣称为准确的绝对 ppm。

来源：`projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.2 MQ2 气体传感器：ADC采集与数据处理.md`。

> DHT11 驱动采用 GPIO 手动时序和阻塞式微秒/毫秒延时；它不是中断或 DMA 采集。

来源：`projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.1 DHT11 温湿度传感器：单总线协议驱动.md`。

## I — 方法论解释（Interpretation）

把传感器问题拆成四层：**物理/引脚 → 原始采样 → 有效性与标定 → 控制变量**。

- DHT11 在 `DHT_Read_Data()` 中通过 GPIO 输出起始信号、切换输入、按位计时并校验 5 字节；`DHT_Read_Byte()` 的等待循环以 `t < 100` 防止外设失联时永久卡住。`SensorTask` 每约 500ms 调用一次，读取失败时保留旧的有效状态。
- MQ2 在 PA4/ADC1 通道 4 上做单次软件转换，`MQ2_GetGasConcentration()` 连续采样 10 次、每次间隔约 100us，再套电压/电阻/经验公式。函数注释写了 0–500，但当前实现没有限幅、Ro 标定和精度实测；ADC 为 0 时还需要特别检查除零/无穷结果。
- `WindSpeed_Update()` 把温度、湿度、气体值归一化并限制到 0–1，使用 0.2/0.2/0.6 固定权重映射到 20%–100% PWM，同时用温度、湿度、气体阈值判断 Cooking Event。
- `SensorTask` 和 `WindSpeedTask` 的部分读写使用 `g_dataMutex`，但 `AntiBackflowTask` 直接访问 `g_systemState`。因此“文档描述的完整保护”不能替代逐任务代码审计。

## A1 — 资料中的应用（Past Application）

项目链路是 `DHT11/MQ2 → SensorTask → g_systemState → WindSpeedTask → WindSpeed_Update → PWM/Cooking Event → MotorControlTask`。源码中可定位到：

- `DHT_Read_Data()`：完成 GPIO 时序和校验；
- `MQ2_GetGasConcentration()`：10 次 ADC 平均和经验换算；
- `WindSpeed_Update()`：归一化、固定权重和阈值判断；
- `SensorTask()`：周期采集并写入系统状态。

这些位置能证明代码承担的职责，不等于证明传感器测量精度或用户个人贡献。

## A2 — 未来触发场景（Future Trigger）

当用户说“DHT11 没响应/数据校验失败”“MQ2 ADC 总是 0 或 ppm 飘”“传感器数据怎么进自动模式”“多传感器权重怎么解释”“这个 ppm 能不能写进简历”时触发。

若问题已经进入自动模式状态转换，转 `rtos-auto-mode-state-machine`；若是 PWM/RPM 闭环，转 `rtos-motor-pid-control`；若是锁、任务饥饿或 ISR 交接，转 `rtos-task-and-isr-design` 或 `rtos-communication-debugging`。

## E — 可执行步骤（Execution）

1. **先定位层级**：记录引脚电平/供电/上拉、ADC 原始值、换算中间量、校验结果和任务周期；不要一开始就改融合权重。
2. **审计有效性**：对 DHT11 检查起始/响应/位宽/校验和超时；对 MQ2 检查 ADC 通道、参考电压、预热、负载电阻、除零、Ro/曲线来源和输出限幅。
3. **跟踪状态链**：确认采集成功后谁写 `g_systemState`、谁加锁、谁读取以及读取时是否可能得到跨字段不一致快照。
4. **验证控制影响**：用已知输入覆盖归一化上下界、Cooking Event 阈值和 PWM 映射；若要声称 ppm/精度或“效果提升”，补标定、重复测量和误差记录。

## B — 边界与风险（Boundary）

- 当前 MQ2 经验公式输出不能直接视为准确绝对 ppm；文档中的参数不等于标定和实测。
- DHT11 是阻塞式 GPIO 手动时序，不能宣称使用 DMA/中断采集；高实时场景要单独评估阻塞时间。
- 固定 0.2/0.2/0.6 权重是项目算法参数，不是在线学习或通用传感器融合规律。
- 没有实测波形、标定数据或硬件回归时，只能说“源码/文档设计如此”，不能说“系统已可靠工作”。

## 相关 Skills

- `rtos-auto-mode-state-machine`：解释 Cooking Event 如何驱动自动模式状态转换。
- `rtos-motor-pid-control`：解释传感器/目标如何进入转速闭环。
- `rtos-task-and-isr-design`：审计任务周期、锁和 ISR 边界。
- `rtos-project-storytelling`：将传感器链路组织成项目面试回答。

## 审计信息

- 三重验证：V1 ✓ / V2 ✓ / V3 ✓。
- 代码职责：见 frontmatter 的 `source_symbols`；依赖 STM32F1 标准外设库、项目 tick 和传感器硬件接线。
