---
name: embedded-c-storage-linkage-audit
description: "Use when an embedded C or bare-metal build must explain storage duration, linkage, .data/.bss placement, extern/static, startup initialization, scatter/linker regions, or RAM/Flash usage from a map file. Trigger phrases include “这个变量在 .data 还是 .bss”, “extern 但链接失败”, “头文件 multiple definition”, “启动时谁清 BSS”, and “Map 文件怎么查内存超限”. Do not use for C++ RAII/copy-move or Linux TCP diagnosis; volatile alone never proves atomicity or synchronization."
metadata:
  source_book: 嵌入式核心资料集与 STM32 + FreeRTOS 项目资料
  source_files:
    - projects/嵌入式八股/糯叽叽八股/01 C语言.md
    - projects/嵌入式八股/糯叽叽八股/04 操作系统.md
    - projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s
    - projects/RTOS项目/源码/OBJ/PWM.sct
    - projects/RTOS项目/源码/USER/PWM.map
  source_symbols: [".data", ".bss", extern, static, volatile, Reset_Handler, SystemInit, __main, __initial_sp, __heap_base, __heap_limit, ER_IROM1, RW_IRAM1, "+RW", "+ZI", "Image Entry point", "Total RW Size"]
  source_kind: language_notes_plus_bare_metal_startup_and_map_evidence
  tags: [embedded, c, storage-duration, linkage, startup, linker, map-file]
  related_skills: embedded-memory-lifetime-and-pool-design, rtos-freertos-config-and-boot, embedded-cpp-resource-lifetime, linux-build-debug-chain
---

# 嵌入式 C 存储期、链接属性与镜像布局审计

## R — 来源摘录（Reading）

> C 语义保证静态存储期对象在启动前完成零初始化，但 `.bss`、`.data` 等段名和具体布局由常见工具链、启动代码与链接布局共同实现。
>
> — `projects/嵌入式八股/糯叽叽八股/01 C语言.md`，1.2–1.3

> 头文件通常只放 `extern` 声明，定义只出现一次；真正的跨文件引用在链接阶段解析。
>
> — `projects/嵌入式八股/糯叽叽八股/01 C语言.md`，1.8

> 当前 STM32 启动代码先设置向量表和栈/堆边界，再在 `Reset_Handler` 中调用 `SystemInit`，随后跳转到 C 库入口 `__main`。
>
> — `projects/RTOS项目/源码/CORE/startup_stm32f10x_md.s`，向量表、`Reset_Handler`、STACK/HEAP

## I — 方法论骨架（Interpretation）

不要把“变量在哪里”“符号为什么找不到”和“启动后谁初始化”混成一个问题。按四层核对：

1. **语言层**：分别记录作用域、存储期、链接属性和限定符。文件作用域 `static` 主要改变链接属性；块作用域 `static` 延长对象生命周期；无初始化器的 `extern` 通常是声明，不是定义；`volatile` 只约束编译器对访问的假设。
2. **构建层**：把问题定位到预处理、编译、汇编或链接阶段。`extern` 对应符号引用/定义关系；头文件重复定义、类型不一致和库/目标文件缺失要在目标文件与链接器诊断中确认。
3. **启动/布局层**：对裸机工程沿向量表首项 → `Reset_Handler` → `SystemInit` → `__main` → `main` 追踪；再把 scatter/linker 文件的 load region、execution region、`+RW`、`+ZI` 和 Map 中的实际地址/大小对上。
4. **证据层**：用源码、启动汇编、链接布局和 Map 表分别回答“设计意图、实际符号、占用、平台依赖”。C 标准、工具链惯例和本工程实现必须分栏，不得用教程中的典型段布局替代当前 Map。

### 当前工程的代码事实核对

| 路径/符号 | 实际职责 | 结论边界 |
|---|---|---|
| `startup_stm32f10x_md.s` / `__Vectors`、`__initial_sp` | 向量表首项提供初始 MSP；复位入口与异常入口位于只读向量区 | 这是该 MDK/STM32F1 启动实现，不是所有 MCU 的通用启动流程 |
| `startup_stm32f10x_md.s` / `Reset_Handler` | 调用 `SystemInit`，再跳转到 `__main` | `__main` 的具体 C 库初始化细节依赖 ARM 工具链 |
| `PWM.sct` / `ER_IROM1`、`RW_IRAM1` | 将 RO 放入 Flash 区，将 RW/ZI 放入 RAM 执行区 | `+RW +ZI` 是 ARM scatter 文件语法，不等同于 GNU ld 脚本 |
| `PWM.map` / `Execution Region RW_IRAM1` | 给出 `.data`、`.bss`、HEAP、STACK 的实际地址和大小 | Map 是该次构建的快照；换配置/链接器后必须重审 |

## A1 — 资料中的应用（Past Application）

### 案例 1：判断变量落在 `.data` 还是 `.bss`

- 先根据 C 语义判断对象是否具有静态存储期、初始值是否为零，再用目标文件/Map 确认实际段。
- 当前 `PWM.map` 中可见来自多个对象的 `.data` 与 `.bss`，并在 `RW_IRAM1` 下与 HEAP、STACK 一起计入 ZI/RW；这比背“全局变量一定在 BSS”更可靠。

### 案例 2：解释启动时的栈、堆和 C 环境

- `__Vectors` 的首项是 `__initial_sp`；启动文件定义了 0x400 字节栈和 0x200 字节堆的区域。
- `Reset_Handler` 先 `BLX SystemInit`，再 `BX __main`。资料可以解释常见职责，但不能把 `__main` 的库内部实现夸成用户自己写的 BSS 清零代码。

### 案例 3：从 Map 找 RAM/Flash 压力

- `PWM.sct` 规定 `ER_IROM1` 和 `RW_IRAM1` 的最大区域；`PWM.map` 给出本次构建的 execution region、对象级 `.data/.bss`、HEAP/STACK 及 `Total RW/ROM`。
- 诊断应先找超限 region，再按对象和符号排序，而不是仅看二进制文件总大小。

## A2 — 触发场景（Future Trigger）★

### 用户会在什么情境下需要这个 Skill？

1. 需要解释全局/静态/局部变量的生命周期、`.data/.bss/stack/heap` 位置或零初始化来源。
2. 遇到 `undefined reference`、`multiple definition`、`extern` 跨文件引用失败或头文件变量定义错误。
3. STM32 裸机启动、栈堆边界、scatter 文件、Map 内存超限和符号地址需要核对。

语言信号： “这个变量到底放哪”“extern 后还链接失败”“谁清 BSS”“启动时栈怎么来的”“RAM/Flash 超限看 Map”。

### 与相邻 Skill 的区分

- 与 `embedded-memory-lifetime-and-pool-design` 的区别：后者选择堆/栈/池并处理所有权、碎片和运行时失败；本 Skill 追踪 C 语义、链接符号、启动和最终镜像布局。
- 与 `embedded-cpp-resource-lifetime` 的区别：本 Skill 不负责 RAII、拷贝/移动和容器迭代器失效。
- 与 `linux-build-debug-chain` 的区别：本 Skill 聚焦嵌入式 C/裸机启动和 Map；Linux 构建链 Skill 负责更广泛的预处理、编译、链接、动态库和 GDB 诊断。

## E — 可执行流程（Execution）

1. **定义问题和构建变体**
   - 记录语言标准、目标 MCU、编译器/链接器、Debug/Release、链接布局文件和报错阶段。完成标准：知道是在语义、目标文件、链接还是运行启动阶段出问题。
2. **建立对象/符号表**
   - 对每个变量写出作用域、存储期、链接属性、声明/定义位置、初始值和引用者；对 `extern` 检查“头文件声明 + 单一 `.c` 定义”，对 `static` 检查是否误以为跨文件可见。完成标准：每个未解析或重复符号都有具体定义/引用证据。
3. **追踪启动链**
   - 查看向量表、初始 MSP、`Reset_Handler`、时钟初始化、C 库入口和堆栈边界；把“C 语言保证什么”和“启动代码/库实际做什么”分开。完成标准：能说明 BSS/数据初始化的责任归属，而不是只说“系统自动完成”。
4. **核对链接布局和 Map**
   - 对照 scatter/linker 的 region 基址与上限，检查 `.data` 的加载地址/执行地址、`.bss`/ZI、HEAP、STACK 和对象级占用；必要时使用 `nm`、`objdump -h` 或工具链 Map 分析。完成标准：能指出最接近上限的 region、主要贡献对象和一个可验证修复方向。
5. **输出事实分级**
   - 用“C 标准语义 / 工具链约定 / 当前源码事实 / 当前构建快照 / 待实测”五列报告；`volatile` 另列原子性、顺序和同步风险。若只有教程没有源码或 Map，只能给验证方法，不能断言当前镜像布局。

## B — 边界（Boundary）★

- `.data`、`.bss`、load region/execution region 是常见实现和工具链概念；C 标准不规定段名、地址和具体启动代码。
- `Reset_Handler`、`__main`、`__user_initial_stackheap`、scatter 文件和 Map 中的列含义依赖 ARM/MDK 版本、C 库配置、芯片和链接选项；不要泛化为 GCC/所有 Cortex-M。
- `volatile` 不能提供原子性、互斥、线程间顺序或通用内存屏障；ISR/任务共享数据还要核对访问宽度、临界区和同步原语。
- `extern` 声明成功不代表定义存在；带初始化器的 `extern` 声明可能仍是定义。头文件直接放普通定义可能造成多重定义，但具体诊断还受编译选项和语言标准影响。
- 该 Skill 不处理 C++ RAII、容器地址稳定、Linux 动态加载器或 FreeRTOS 内存池策略；遇到这些主题应转相邻 Skill。
- 只有文档没有目标文件、启动代码或 Map 时，不能声称“实际放在某段”或“启动确实清了某区域”。

## 相关 Skills

- depends-on: `linux-build-debug-chain`（定位构建阶段和链接器诊断）
- contrasts-with: `embedded-memory-lifetime-and-pool-design`、`embedded-cpp-resource-lifetime`
- composes-with: `rtos-freertos-config-and-boot`、`rtos-runtime-fault-diagnosis`、`embedded-interview-layered-answer`

## 审计信息

- 验证：V1 ✓ / V2 ✓ / V3 ✓
- 代码事实：startup 汇编、scatter 文件和 `PWM.map` 已逐路径列入；`__main` 的库内部实现仍标为工具链依赖。
- 测试：静态盲测 6/6，见 `test-prompts.json` 与 `test-results.md`。
- 蒸馏时间：2026-08-13
