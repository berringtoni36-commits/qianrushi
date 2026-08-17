---
name: embedded-numeric-contract-audit
description: "Use only when diagnosing an embedded numeric fault or auditing code/protocol behavior across representation layers: raw bits and signed/unsigned/BCD/real interpretation, byte order after a field is located, intermediate arithmetic type and overflow, unit scaling, filtering or rounding, error budgets, thresholds, hysteresis, or boundary tests. Trigger phrases include 改成 REAL 还是报警不触发、中间乘法溢出、ADC/4–20 mA 边界、原始值缩放、阈值抖动 and 数值合同审计. Do not trigger for standalone IEEE 754 or 0.1+0.2 explanations, float-width definitions, struct/register/DMA/frame layout, clock or ADC sampling timing, physical sensor acquisition/calibration/fusion, or PID tuning; route those to the related skills."
metadata:
  source_book: 嵌入式八股
  source_files:
    - projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.7 为什么 0.1 + 0.2 不等于 0.3？.md
    - projects/嵌入式八股/3. 杂七杂八/14. PLC 原理 + 数据类型，工控入门天花板知识点.md
  source_symbols: [IEEE 754, float, double, REAL, LREAL, INT_TO_REAL, REAL_TO_INT, ScaleLinear, FilterCoefficient, HighLimit, LowLimit]
  tags: [embedded, numeric, conversion, scaling, threshold, audit]
  related_skills: [embedded-c-struct-binary-contract-audit, stm32-clock-and-sampling-timing, rtos-sensor-acquisition-and-fusion, rtos-motor-pid-control]
---

# 嵌入式跨表示层数值合同审计

## Overview

把“数值不对”拆成一条可复核的合同：`raw bits → 类型/端序解释 → 中间算术类型与范围 → 单位缩放 → 滤波/舍入 → 误差预算 → 阈值/滞回/延时`。本 Skill 从字段位置或原始字节已经确定之后开始，审计数值解释、计算和决策语义；不把单点浮点知识写成百科，也不把示例或推导写成目标板实测。

## R — 来源摘录（Reading）

来源 1 说明：十进制小数不一定能有限地表示成二进制，有限精度只能保留近似值；表示格式的有效位和指数影响精度与范围，因此不能凭数学写法或字符串直觉判断内存中的数值等价。该来源只提供表示层误差背景，不单独构成触发面。

来源 2 说明：同一位宽可按 `DWORD`、`DINT` 或 `REAL` 解释；具体 PLC 支持和语义仍取决于厂商、CPU 与固件。它还明确提醒：即使结果变量较宽，`INT` 中间乘法也可能先溢出；`INT_TO_REAL`、`REAL_TO_INT`、`DINT_TO_INT` 的截断、舍入和越界行为要查平台手册；字节序错误会造成数量级异常。

来源 2 还给出一个带参数的线性缩放、低通滤波、容差、上下限回差和报警延时示例，并强调 `RawAt4mA`、`RawAt20mA` 等原始范围只是示例，不能抄到所有模块。上述内容支持“表示—换算—判定”审计链，但不证明任何用户项目、目标 PLC 或 STM32 已按示例运行。

## I — 方法论解释（Interpretation）

数值合同至少要为每个节点写清：位模式、解释类型、字节序、有效范围、单位、表达式中间类型、转换时机、舍入/滤波规则、无效输入策略和证据等级。区分以下证据：源码事实、协议/手册要求、来源示例、可复算推导、运行日志或仪器测量；缺少后两者时不要声称精度、稳定性或报警已验证。

- **锁定输入语义**：保留原始字节和十六进制值；在字段位置已知的前提下，核对有符号/无符号、BCD、定点或实数解释及端序。不要因为结果“看起来合理”就接受一种解释；若字段从哪个字节取尚未确定，先转 `embedded-c-struct-binary-contract-audit`。
- **锁定算术语义**：逐个标注操作数和每个中间结果的类型、符号性、最大可能值和单位。扩大结果变量不能修复已经在 `INT`、窄定点或错误符号中发生的回绕；乘法、累加、减法、除法和缩小转换都要在运算前检查范围或显式提升。
- **锁定工程单位**：使用带命名参数的线性公式，核对原始上下限、工程上下限和分母；明确越量程、断线、负值和超界输入是拒绝、钳位、外推还是故障。任何 `4–20 mA` 或 ADC 原始范围都必须绑定具体模块/手册，不能从示例数字外推。
- **锁定动态处理**：记录采样间隔、滤波状态初值、无效样本如何处理，以及先滤波还是先舍入。对一阶低通可核对 `α = Δt / (τ + Δt)`；固定系数只有在采样周期和目标动态已被证明时才有意义。把量化、截断、舍入和滤波延迟分开。
- **建立误差预算**：按同一工程单位列出原始量化、表示/中间舍入、传感器、模块偏置/增益、线路噪声和滤波引入的误差；记录来源、假设、是否测量以及是否可能相关。没有标定或重复测量时，将数值标为未知或示例，不把分辨率当作绝对精度。
- **定义决策边界**：避免用浮点精确相等作为控制触发；明确允许容差、上升阈值、下降阈值、比较符号、延时和无效状态优先级。`HighLimit` 与 `LowLimit` 的间隔必须能解释为噪声/误差预算或控制需求，而不是随意常数。

## A1 — 资料中的应用（Past Application）

以下是来源文章中的 PLC 教学示例和可迁移方法，不是当前用户项目事实：

| 来源构造 | 可用于审计的合同问题 | 不可直接推出 |
|---|---|---|
| `DWORD` / `DINT` / `REAL` | 同一位宽的位模式、整数和实数语义必须分开 | 某目标 PLC 的 ABI、浮点支持或转换结果 |
| `PressureRaw`、`RawAt4mA`、`RawAt20mA` | 先检查原始有效区间，再做带单位的线性缩放 | 示例中的 `5530`、`27648` 适用于所有模块 |
| `INT_TO_REAL` 后缩放；`DINT_TO_INT` 前范围检查 | 在乘法前提升类型，在缩小前验证范围 | 所有 C/C++ 编译器或 STM32 工具链具有相同 PLC 语义 |
| `ScaleLinear`、`FilterCoefficient` | 核对分母、`Δt`、滤波初值、舍入顺序和无效输入 | 经验公式已完成标定或滤波后精度已实测 |
| `PressureFiltered >= 8.0`、`<= 7.5` 与 2 s 延时 | 复核包含边界、回差宽度和延时状态 | 任一设备实际报警已经触发或解除 |

## A2 — 触发场景（Anticipated Trigger）

仅在存在数值故障、代码审计或协议数据审计时触发，例如：

1. “最终变量改成 `REAL` 仍然不报警”，需要区分原始解释、端序、窄类型中间溢出、缩放、滤波和阈值边界。
2. “12 位 ADC/4–20 mA 在边界偶发漏报”，需要核对原始范围、单位、舍入、误差预算、回差和最小边界向量。
3. “协议字段位置已经确认，但同一 16/32 位有时被当成负数、BCD 或异常实数”，需要审计解释类型和端序后的数值合同。
4. “整数乘法结果存进 `DINT`/`float` 仍错”，需要追踪每个中间表达式，而不是只换最终类型。
5. “滤波后阈值来回抖动或恰好边界不切换”，需要核对采样周期、滤波/舍入顺序、容差和上下限回差。

以下请求不独立触发本 Skill：

- 只问 IEEE 754、`0.1 + 0.2`、`float`/`double` 位宽、补码或 BCD 定义：做普通概念说明。
- 询问 `struct` 的 `sizeof`、`offsetof`、对齐、位域、DMA/寄存器/帧偏移或 CRC：转 `embedded-c-struct-binary-contract-audit`。
- 询问 STM32 时钟树、ADC 时钟/采样时间、SysTick、定时器频率或采样周期：转 `stm32-clock-and-sampling-timing`。
- 询问 DHT11/MQ2 物理采集、预热、标定、传感器融合或 ppm 可信度：转 `rtos-sensor-acquisition-and-fusion`；只有进入表示、换算和阈值层时组合本 Skill。
- 询问 PWM/RPM/PID 调参、编码器测速或闭环动态：转 `rtos-motor-pid-control`；只有审计进入 PID 前后的数值表示、饱和或阈值时组合本 Skill。

## E — 可执行审计流程（Execution）

1. **固定问题和证据边界**：记录目标语言、CPU/PLC 型号、编译器/运行时、协议字段说明、相关代码、配置、日志和测量条件。把“来源示例”“代码当前行为”“平台手册要求”“推导值”“实测值”分栏；缺少代码或原始数据时只给审计清单。
2. **建立数值合同表**：每一行对应一个节点，至少填写 `raw hex → 解释类型/端序 → 数值范围 → 算术类型 → 单位 → 公式 → 滤波/舍入 → 有效性 → 判定`，并标注证据路径或行号。
3. **审计 raw bits 和端序**：确认字段已定位后保留原始字节；按协议/手册核对字节顺序、符号位、BCD/定点/实数解释、保留位和非法编码。对每个候选解释算出数量级和范围，定位第一个偏离合同的节点。
4. **审计中间算术**：沿表达式标注每次提升、乘加、减法、除法和赋值的实际类型。检查符号扩展、无符号回绕、窄类型溢出、累加长期范围、除零、NaN/无穷或错误标志（若该平台支持）、缩小转换和饱和策略。PLC 转换规则查厂商手册；不要移植成 C/C++ 或 STM32 事实。
5. **审计单位缩放**：复算 `engineering = (raw - raw_min) * (eng_max - eng_min) / (raw_max - raw_min) + eng_min`，并在更宽的中间类型中检查分母、端点、负值和越量程。明确断线/无效码在缩放前拦截还是产生故障值；记录是否允许钳位或外推。
6. **审计滤波和舍入**：核对采样周期是否与滤波系数匹配、初始状态是否污染首个结果、无效样本是否推进状态、舍入发生在缩放前还是后、负数舍入规则是否明确，以及重复输入是否稳定地产生同一输出。
7. **形成误差预算**：把每一项误差换到同一工程单位，分别记录量化上限、表示/舍入误差、传感器误差、模块偏置/增益、线路噪声和滤波延迟；比较阈值余量。不能从来源示例或理想 ADC 分辨率推导目标板准确度。
8. **审计阈值状态机**：写出上升和下降的完整不等式，确认 `==` 是否误用，区分容差、回差和延时；规定无效、断线、越量程与正常值同时出现时的优先级。确认状态是否在滤波值、原始值或舍入值上判断。
9. **运行最小边界向量**：至少覆盖原始最小/最大值、合法负值（若允许）、零、类型转换临界值、乘法/累加上界、缩放两端、低于/等于/高于报警阈值、低于/等于/高于解除阈值、重复输入、断线/越量程、端序反转和滤波首样本。每个向量记录全链路中间值，报告第一个不满足合同的节点。
10. **交付结论**：按“已证实 / 可复算推导 / 平台待查 / 必须测量”分级，给出最小修复点和回归向量。若唯一问题是字段偏移、采样时序、物理标定或 PID 参数，明确转交相关 Skill，不用数值合同审计替代它。

建议输出格式：

```text
故障现象：
合同链：raw(hex/type/endian) → arithmetic(type/range) → scale(unit) → filter/round → error budget → decision
第一个偏离节点：
证据与未知项：
修复约束：
边界向量与预期：
平台/实测限制：
```

## B — 边界与事实边界（Boundary）

- **PLC**：来源中的 `INT`、`DINT`、`REAL` 位宽、转换舍入/溢出、`REAL`/`LREAL` 支持和指令语义都可能随厂商、CPU 代际、固件和语言运行时变化；`RawAt4mA=5530`、`RawAt20mA=27648`、滤波系数和报警阈值是示例。必须以具体平台手册、项目配置和代码为准。
- **STM32**：C3-02 两份来源没有当前 STM32 数值计算源码、编译选项、目标芯片手册、ADC 原始日志或标定实验。因此本 Skill 不建立 STM32 ADC 分辨率、端序、ABI、`float`/`double` 实现、FPU、转换舍入、采样周期或测量精度事实；这些必须从目标源码、参考手册、编译产物和测量重新核对。
- **来源与推导**：来源 1 的浮点近似表示和来源 2 的 PLC 工程示例支持方法论，不支持用户项目经验、目标平台实测、生产可靠性或准确 ppm/压力结论。
- **起止边界**：字段偏移、对齐、位域、寄存器/DMA/帧布局和 CRC 归 `embedded-c-struct-binary-contract-audit`；本 Skill 可接收其已确认的 raw 字段。时钟树、ADC 采样时间和采样周期归 `stm32-clock-and-sampling-timing`。物理传感器采集、预热、标定和融合归 `rtos-sensor-acquisition-and-fusion`。闭环 PID 动态和调参归 `rtos-motor-pid-control`。
- **证据不足**：只有“数值看起来不对”而没有 raw 值、代码/公式或平台语义时，不能诊断根因；应列出需要补充的中间值和边界测试，不凭空选择 `float`、端序或阈值。

## source_files

- `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.7 为什么 0.1 + 0.2 不等于 0.3？.md:70-88,100-168,178-226,230-258`
- `projects/嵌入式八股/3. 杂七杂八/14. PLC 原理 + 数据类型，工控入门天花板知识点.md:648-660,720-794,948-1047,1135-1184,1385-1428`

## source_symbols

`IEEE 754`, `float`, `double`, `REAL`, `LREAL`, `DWORD`, `DINT`, `INT_TO_REAL`, `REAL_TO_INT`, `DINT_TO_INT`, `BCD_TO_INT`, `ABS`, `RawValue`, `RawMinimum`, `RawMaximum`, `PressureRaw`, `PressureTolerance`, `SensorWireBreak`, `SensorOverRange`, `ScaleLinear`, `FilterCoefficient`, `HighLimit`, `LowLimit`

## 相关 Skills

- `embedded-c-struct-binary-contract-audit`：负责字段偏移、对齐、位域、寄存器/DMA/帧布局、端序布局和 CRC；先确认“取到哪个字段”，再把 raw 值交给本 Skill。
- `stm32-clock-and-sampling-timing`：负责 STM32 时钟树、ADC 时钟/采样时间、SysTick、定时器和采样周期；数值故障若依赖采样时基则组合使用。
- `rtos-sensor-acquisition-and-fusion`：负责 DHT11/MQ2 物理采集、预热、标定、融合和项目传感器链；本 Skill 只补表示/换算/阈值层。
- `rtos-motor-pid-control`：负责编码器、RPM、PWM、PID 误差、积分限幅和调参；本 Skill 只补 PID 边界处的数值表示、饱和和阈值合同。

## 审计声明

- 本 Skill 由 C3-02 的两份真实来源组合为方法论；不是 IEEE754/`float` 位宽百科。
- 本交付只做静态路由与结构验证 6/6；没有目标平台实测或用户项目经验，不宣称真实客户端命中。
