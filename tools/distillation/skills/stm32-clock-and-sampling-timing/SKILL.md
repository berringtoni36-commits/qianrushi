---
name: stm32-clock-and-sampling-timing
description: "Use when an STM32 clock tree, APB timer clock, ADC clock/sample time, SysTick timing, UART baud rate, or sensor sampling schedule must be explained or debugged. Trigger phrases include “STM32 时钟不对”, “ADC 采样异常”, “72MHz 怎么来的”, “定时器频率差一倍”, “MQ2 采样怎么核对”, and “串口乱码会不会是时钟”. Do not generalize the repository's STM32F1 facts to another MCU family without checking its reference manual."
metadata:
  source_book: STM32 + FreeRTOS 油烟机控制系统项目与嵌入式核心资料
  source_files:
    - projects/嵌入式八股/3. 杂七杂八/9. 嵌入式 STM32 时钟体系全解：从硬件底层到量产实战.md
    - projects/嵌入式八股/3. 杂七杂八/11. 图解 ADC：工作原理、架构分类与核心性能指标.md
    - projects/RTOS项目/源码/USER/system_stm32f10x.c
    - projects/RTOS项目/源码/BSP/MQ2/mq2.c
    - projects/RTOS项目/源码/BSP/MQ2/mq2.h
    - projects/RTOS项目/源码/SYSTEM/delay/delay.c
    - projects/RTOS项目/源码/SYSTEM/delay/delay.h
    - projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.2 MQ2 气体传感器：ADC采集与数据处理.md
  source_symbols: [SYSCLK_FREQ_72MHz, SystemCoreClock, SystemInit, RCC_ADCCLKConfig, RCC_PCLK2_Div6, ADC_RegularChannelConfig, ADC_SampleTime_239Cycles5, MQ2_GetAdcValue, MQ2_GetGasConcentration, delay_init, SysTick_Handler]
  source_kind: tutorial_plus_stm32f1_source_audit
  tags: [stm32, clock-tree, adc, sampling, systick, timing]
  related_skills: rtos-freertos-config-and-boot, rtos-sensor-acquisition-and-fusion, rtos-motor-pid-control, embedded-bus-selection
---

# STM32 时钟与采样时序核对

## Overview

这个 Skill 把 STM32 的“时钟配置—总线分频—外设时钟—采样时间—任务/中断周期”串成一条可验证链路，用于解释或排查串口乱码、定时器频率错误、ADC 超规格、采样抖动和传感器数据异常。默认事实绑定仓库中的 STM32F1 工程，换到其他系列必须重新查手册。

## R — 来源摘录（Reading）

> 外设的精度、响应速度和采样行为依赖时钟树；APB 预分频不为 1 时，经典 STM32F1 定时器时钟可能与 PCLK 不同，不能直接拿 PCLK 套公式。
>
> — `projects/嵌入式八股/3. 杂七杂八/9. 嵌入式 STM32 时钟体系全解：从硬件底层到量产实战.md`

> ADC 一次转换包含采样、保持、量化和编码；采样率、采样时间、输入源阻抗、参考电压和抗混叠条件共同决定结果，理想量化步长不等于真实精度。
>
> — `projects/嵌入式八股/3. 杂七杂八/11. 图解 ADC：工作原理、架构分类与核心性能指标.md`

当前工程源码明确写出：`SYSCLK_FREQ_72MHz`、`RCC_PCLK2_Div6`（注释计算为 72M/6=12M）、ADC1 通道 4/PA4、`ADC_SampleTime_239Cycles5`、10 次平均；`MQ2_Init()` 末尾注释说明需要预热但没有在此等待。`delay_init()` 用 `SystemCoreClock` 与 `configTICK_RATE_HZ` 计算 SysTick reload，并在调度器启动后由 `SysTick_Handler()` 调用 `xPortSysTickHandler()`。

## I — 方法论解释（Interpretation）

不要从“系统应该是 72MHz”直接跳到“采样正确”。应画出：时钟源 → PLL/SYSCLK → AHB/HCLK → APB → 外设内核时钟 → 分频/采样周期 → 软件触发/任务周期 → 数据换算。每一层都要注明配置来源和实际测量证据。

- **频率事实**：先核对宏、复位后默认时钟、HSE/PLL 锁定和 `SystemCoreClock` 是否同步；宏值是配置意图，示波器/寄存器/测量才是运行事实。
- **总线与定时器**：分别计算 PCLK 和 timer clock；在 F1 的 APB prescaler 规则下，不要把 APB1 的 PCLK1 当作 TIM2/3/4 的最终计数时钟。
- **ADC 时钟**：核对 PCLK2 分频、芯片允许上限和采样时间；采样时间越长不等于整体采样率越高，但可改善高源阻抗输入的充电充分性。
- **采样链**：记录通道/引脚、触发间隔、原始码、参考电压、平均/滤波、标定和输出公式；ADC 平均只能降低部分随机噪声，不能提供传感器绝对精度。
- **软件时间**：区分 SysTick tick、阻塞式 `delay_us`、`vTaskDelay` 和外设转换完成等待；阻塞等待会占用当前上下文，不是“有定时器就自动并发”。

## A1 — 资料中的应用（Past Application）

### 当前 RTOS 工程的可核对事实

| 文件/符号 | 实际职责 | 当前可说的事实 | 不能夸大的部分 |
|---|---|---|---|
| `system_stm32f10x.c` / `SYSCLK_FREQ_72MHz`, `SystemCoreClock`, `SystemInit` | 选择 F1 系统时钟并初始化 RCC/Flash/PLL | 工程配置目标为 72MHz；需结合芯片宏与 HSE 条件理解 | 没有目标板测量就不能宣称实测稳定 72MHz |
| `mq2.c` / `MQ2_Init` | 打开 GPIO/ADC 时钟、配置 ADC1、校准 | 使用 PCLK2/6，注释给出 12MHz ADC 时钟 | 依赖 PCLK2 实际值和 F1 型号上限 |
| `mq2.c` / `MQ2_GetAdcValue` | 配置 ADC1_CH4、239.5 cycles，软件启动单次转换并等待 EOC | 证实通道、采样时间和等待方式 | 没有超时；ADC 异常时可能长期阻塞 |
| `mq2.c` / `MQ2_GetGasConcentration` | 10 次采样、100us 间隔、平均后按公式换算 | 证实了数字平均和经验公式 | 没有在初始化处等待 MQ2 预热，也没有 Ro 标定/精度测试证据 |
| `delay.c` / `delay_init`, `SysTick_Handler` | 基于 `SystemCoreClock` 配置 SysTick，并交给 FreeRTOS tick handler | 能解释项目 tick 链路 | 不能单凭源码证明实际 tick 频率和无抖动 |

### 典型故障映射

- 串口乱码：先核对实际外设时钟、BRR 计算、系统时钟切换和两端波特率，再查电气连接。
- 定时器频率差一倍：核对 APB prescaler 与 F1 timer clock x2 规则，再查 PSC/ARR。
- ADC 读数飘或饱和：核对引脚/通道、参考电压、ADC 时钟上限、采样时间、源阻抗、预热、标定和平均窗口。
- 任务周期不准：核对 `configTICK_RATE_HZ`、SysTick reload、`delay_ms` 的余数忙等和更高优先级任务占用。

## A2 — 触发场景（Anticipated Trigger）

当用户说“STM32 时钟树怎么查”“72MHz 实际是不是 72”“TIM 频率为什么差一倍”“ADC 采样时间怎么选”“MQ2 采样和预热是否合理”“SysTick 周期不对”“串口乱码怀疑时钟”时触发。

若重点是 MQ2/DHT11 数据有效性和融合，组合 `rtos-sensor-acquisition-and-fusion`；若重点是 FreeRTOS 启动、tick、PendSV/SVC 和任务栈，组合 `rtos-freertos-config-and-boot`；若重点是电机 PID，不要用本 Skill 代替 `rtos-motor-pid-control`。

## E — 可执行流程（Execution）

1. **确认平台与编译变体**：芯片型号、外部晶振、标准外设库版本、时钟宏、启动文件和当前链接配置。
2. **从寄存器/代码画时钟链**：HSE/HSI → PLL → SYSCLK → HCLK → PCLK1/PCLK2 → 外设或定时器时钟；把每个分频写成公式，标出“配置值”和“实测值”。
3. **计算外设时序**：分别核对 UART BRR、TIM 更新频率、ADC 时钟/采样周期和 SysTick reload；检查单位、整数截断和 APB timer doubling。
4. **核对 ADC 输入链**：引脚与通道、模拟模式、参考电压、源阻抗/采样时间、转换完成等待、超时、校准、预热、平均和换算边界。
5. **核对软件调度**：确认转换触发来自哪个任务/定时器/ISR，等待是否阻塞，任务周期是否被 tick 精度或高优先级工作改变。
6. **最小化验证**：用 MCO/定时器输出/逻辑分析仪测频率，用已知电压验证 ADC 码值，用时间戳记录采样间隔；未测量时把结论标为“源码配置/推导”。

## B — 边界与风险（Boundary）

- `SYSCLK_FREQ_72MHz` 是本工程的配置目标，不是所有 STM32 或目标板的运行实测；HSE 频率、芯片密度和时钟失败分支必须核对。
- F1 的 APB 定时器倍频规则不能直接推广到 F0/F4/G4/H7；切换系列必须重查参考手册。
- ADC 的理想 LSB、奈奎斯特定理和 10 次平均不能证明 MQ2 输出是准确 ppm；当前代码没有预热等待、Ro 标定和精度测试证据。
- `MQ2_GetAdcValue()` 等待 EOC 没有超时；把“采样卡死”与“数据噪声”分成不同故障路径。
- `delay_us` 忙等、`vTaskDelay` 和 SysTick tick 的精度/占用不同；不能把软件延时注释当成实测波形。
- 对串口、PWM、ADC 的最终上限和误差应以具体芯片手册、外设时钟寄存器和测量为准。

## 相关 Skills

- `rtos-sensor-acquisition-and-fusion`：当前项目传感器链路、标定边界和融合算法。
- `rtos-freertos-config-and-boot`：FreeRTOS tick、启动和中断优先级配置。
- `rtos-motor-pid-control`：PWM/RPM/PID 闭环的控制时序。
- `embedded-bus-selection`：通信接口和电气约束选型。

## 审计信息

- 三重验证：V1 ✓（时钟/ADC 教程、工程源码和 MQ2 文档）；V2 ✓（可从乱码、频率偏差、采样异常反推时钟链）；V3 ✓（绑定 F1 工程的真实符号和“配置≠实测”边界）。
- 代码职责：见 frontmatter 的 `source_symbols` 和 A1 表；MQ2 采样依赖 STM32F1 标准外设库、PA4/ADC1_CH4 和项目 SysTick。
- 测试：静态盲测 6/6，见 `test-prompts.json` 与 `test-results.md`。
