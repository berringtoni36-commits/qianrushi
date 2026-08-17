---
title: "FreeRTOS 源码解析"
tags: [FreeRTOS, RTOS, 嵌入式, 面试八股, Defuddle]
type: reference
source: "https://mcnnyqy5r9ab.feishu.cn/wiki/Mk3Mw3fNFi96RlkUYlsc06NPnKg"
author: "用户582743的飞书"
extracted_by: "Defuddle 0.19.2"
image_count: 255
---

# FreeRTOS 源码解析

> [!info] 原文信息
> 文档：FreeRTOS 源码解析
> 来源：[飞书云文档](https://mcnnyqy5r9ab.feishu.cn/wiki/Mk3Mw3fNFi96RlkUYlsc06NPnKg)
> 页面显示：最近修改 7月23日 22:35
> 正文与图片按页面渲染顺序提取；图片保存至 `assets/feishu-freertos-source-analysis/`。

> [!warning] 核对说明（2026-08-13）
> 本文原始内容混合了通用 C/ARM/Linux 介绍、不同 FreeRTOS 版本的源码片段和具体开发板示例。阅读时请区分三条边界：
> - `§1–§11` 是通用说明，栈方向、优先级位数、Tick 宽度和 API 可用性必须以目标 MCU、编译器、port 及 `FreeRTOSConfig.h` 为准。
> - `§12` 明确按 FreeRTOS Kernel V11.1.0 讲解；本地工程 `[[projects/RTOS项目/源码/FreeRTOS/tasks.c]]` 为 V9.0.0，不能直接混用字段、宏和源码行号。
> - 标为“简化示意”的代码用于理解，不保证可直接编译；移植时应以对应版本的官方源码和端口实现为准。

## 目录

> [!tip] 阅读导航
> 下面列出主章节；更细的小节可直接使用 Obsidian 右侧大纲视图跳转。

- [[#导读与学习路线|导读与学习路线]]
- [[#1. 手动移植 RTOS|1. 手动移植 RTOS]]
- [[#2. 堆和栈（这个必考，务必掌握）|2. 堆和栈]]
- [[#3. 中断（面试必考的）前面 STM32 也有讲过，再复习一遍|3. 中断]]
- [[#4. 进程、线程|4. 进程、线程]]
- [[#5. 任务调度算法（重中之重）|5. 任务调度算法]]
- [[#6. PendSV|6. PendSV]]
- [[#7. 上下文切换|7. 上下文切换]]
- [[#8. FreeRTOS 内存管理（heap_1–heap_5）|8. FreeRTOS 内存管理]]
- [[#9. 任务间通信（必考）|9. 任务间通信]]
- [[#10. 低功耗（如果投消费电子或者芯片厂肯定会问的）|10. 低功耗]]
- [[#11. API 函数汇总|11. API 函数汇总]]
- [[#12. 延伸|12. 延伸]]
  - [[#第一章 list.c|第一章 list.c]]
  - [[#第二章 内存管理源码|第二章 内存管理源码]]
  - [[#第三章 tasks.c|第三章 tasks.c]]
  - [[#第四章 queue.c|第四章 queue.c]]
  - [[#第五章 timers.c|第五章 timers.c]]
  - [[#第六章 event_groups.c|第六章 event_groups.c]]

## 导读与学习路线

> [!tip] 建议读法
> 先通过快速入门手册完成几个 API Demo，建立任务、队列和信号量的直观认识；再结合视频和本文理解内部机制。

FreeRTOS 是面向嵌入式系统的实时内核，支持可抢占式或协作式调度（由配置决定），并提供任务、队列、信号量、互斥量等基础能力。开始阅读源码前，建议掌握结构体、指针、数组、函数指针、数组指针、指针数组，以及链表、队列等基础数据结构。

### 推荐顺序

1. **基础链表：`list.c` / `list.h`**
   - 理解 `List_t`、`ListItem_t`、双向循环链表和哨兵节点。
   - 重点看 `vListInsertEnd()`、`vListInsert()` 和 `uxListRemove()`。
   - 目标：能手画包含 3 个节点的 FreeRTOS 链表，并说清 `pvOwner`、`pvContainer` 与 `pxIndex` 的作用。
2. **内存管理：`heap_1.c` 至 `heap_5.c`**
   - 理解内存对齐、空闲块链表、拆分与合并。
   - 弄清五种实现的能力边界和适用场景。
3. **任务创建：`xTaskCreate()`**
   - 跟踪 TCB 和任务栈的分配、初始化，以及新任务加入就绪列表的过程。
   - 关注 `TCB_t` 中的 `xStateListItem` 和 `xEventListItem`。
4. **调度与上下文切换**
   - 跟踪 `vTaskStartScheduler()`、SysTick、PendSV 和目标 port。
   - 以 Cortex-M 为例，异常入口通常由硬件自动保存 R0–R3、R12、LR、PC 和 xPSR，port 再保存/恢复 R4–R11；若使用 FPU，还可能涉及浮点寄存器。具体以目标 port 为准。
5. **队列与同步：`queue.c`**
   - 重点看 `xQueueGenericSend()` 和 `xQueueReceive()`。
   - 观察队列满/空时，任务如何在就绪、延时和事件等待列表之间迁移。

### 参考资料

- `FreeRTOS完全开发手册之上册_快速入门.pdf`
- `FreeRTOS实时内核使用指南-中文.pdf`

---

## 1. 手动移植 RTOS

### 1.1 下载 FreeRTOS 源码

[FreeRTOS 官网](https://freertos.org/)

![[assets/feishu-freertos-source-analysis/img-001.jpg]]

### 1.2 解压并进入 `Kernel` 目录

> 解压源码包后进入 `Kernel` 目录；后续复制文件时只保留与目标编译器和 Cortex-M 内核匹配的移植层。

![[assets/feishu-freertos-source-analysis/img-002.jpg]]

![[assets/feishu-freertos-source-analysis/img-003.jpg]]

### 1.3 向工程添加必需文件

首先，我们要明确自己需要哪些文件。

![[assets/feishu-freertos-source-analysis/img-004.jpg]]

1. FreeRTOS 文件夹下：croutine.c、event\_groups.c、list.c、queue.c、tasks.c、timers.c

![[assets/feishu-freertos-source-analysis/img-005.jpg]]

2. FreeRTOS/include 文件下：建议完全复制到自己的文件夹下

![[assets/feishu-freertos-source-analysis/img-006.jpg]]

![[assets/feishu-freertos-source-analysis/img-007.jpg]]

![[assets/feishu-freertos-source-analysis/img-008.jpg]]

3. `FreeRTOS/portable/MemMang/`：根据需求只加入一个内存管理实现（`heap_1.c` 到 `heap_5.c` 任选其一，或使用自定义实现），不要把多个 `heap_x.c` 同时加入工程，否则会出现重复定义。
   - `FreeRTOS/portable/<编译器>/<内核>`：只选择与 MCU 内核、编译器和具体勘误匹配的一套移植层。例如 Keil/RVDS 下的 Cortex-M3 选 `RVDS/ARM_CM3`；Cortex-M7 的 `r0p1` 目录只适用于对应的 M7 修订版，不能因为使用 H7 就一律照搬。移植层通常至少需要 `port.c` 与 `portmacro.h`，具体以该端口目录说明和工程启动文件为准。

![[assets/feishu-freertos-source-analysis/img-009.jpg]]

![[assets/feishu-freertos-source-analysis/img-010.jpg]]

### 1.4 在 Keil 中配置文件与路径

1. 在 Keil 里面添加好文件夹之后把所需要的源文件加进去。

![[assets/feishu-freertos-source-analysis/img-011.jpg]]

![[assets/feishu-freertos-source-analysis/img-012.jpg]]

2. 添加头文件搜索路径。

① 添加工程所需 `.h` 文件的搜索路径。

![[assets/feishu-freertos-source-analysis/img-013.jpg]]

![[assets/feishu-freertos-source-analysis/img-014.jpg]]

![[assets/feishu-freertos-source-analysis/img-015.jpg]]

② 编译报错时，先按报错定位重复定义、缺少端口文件或缺少配置；不要简单把 `stm32f10x_it.c`（或其他 `*_it.c`）中的中断处理函数全部注释掉。SVC、PendSV、SysTick 必须按照所选 port 与启动文件完成映射，外部中断则保留自己的硬件处理逻辑，避免“能编译但调度器不工作”。

> [!note] `FreeRTOSConfig.h`
> `FreeRTOSConfig.h` 是应用工程的配置文件，不存在一份适用于所有 MCU/项目的“标准答案”。示例工程可能带有模板，但应按目标 port、编译器和应用需求逐项核对后再使用；它通过宏定义选择内核功能、时钟、优先级和内存分配方式。

③ 有些同学还会遇到未定义的钩子函数。如果工程不需要该钩子，可在 `FreeRTOSConfig.h` 中将对应配置宏设为 `0`；如果需要，则应在应用层提供匹配的实现。

![[assets/feishu-freertos-source-analysis/img-016.jpg]]

## 2. 堆和栈（这个必考，务必掌握）

堆栈操作本质上是“由 SP 指定地址”的内存读写： 通过 PUSH 指令将寄存器数据压入，POP 指令取出。在此过程中，SP 的值会根据规则 自动调整（自动增减），从而保证新压入的数据不会覆盖旧数据，维护数据的完整性。

先看内存分区示意图，重点辨认代码/只读区、`.data`、`.bss`、堆和栈。

![[assets/feishu-freertos-source-analysis/img-017.jpg]]

> 图中是通用进程地址空间的概念示意，不是 STM32/FreeRTOS 的固定内存布局；MCU 的 Flash、RAM、任务栈和 FreeRTOS 堆的实际地址与大小应以链接脚本、map 文件和所选分配器为准。

### 2.1 栈（Cortex-M/该 ARM port 中通常由高地址向低地址生长）

#### 2.1.1 定义

1. 栈是一种后进先出（LIFO）的数据结构，用于存储局部变量、函数调用的上下文信息（如返回地址、参数等）。
1. 栈的初始化至少包括设置栈指针 SP。Cortex-M 中 R13 是 SP；R11 是否作为帧指针（FP）由 ABI、编译器和优化选项决定，并不是 ARM 处理器固定用 R11 管理栈。
![[assets/feishu-freertos-source-analysis/img-018.jpg]]

#### 2.1.2 特点

> 🌰
>
> 1.
>
> 自动管理：栈的内存分配和释放是自动的，由编译器管理。
>
> 2.
>
> 局部变量存储：函数内的自动存储期对象通常位于栈上，但也可能被编译器放入寄存器或优化掉；`static` 局部变量不在栈上，而在静态存储区。
>
> 3.
>
> 生命周期：局部变量的生命周期仅限于函数的执行过程。函数调用结束后，局部变量占用的栈空间会被自动释放。（提问：如果 static 修饰了局部变量呢？)
>
> 4.
>
> 内存分配速度：栈的内存分配和释放速度非常快，因为它是连续的内存空间，操作简单。
>
> 5.
>
> 大小有限：在 MCU/FreeRTOS 中，栈大小由链接脚本、启动文件或任务创建参数决定；`configMINIMAL_STACK_SIZE` 的单位通常是 `StackType_t` 个“字”，不是字节，不能套用桌面系统“几 MB”的说法。
>
> 6.
>
> 函数传参：在常见 ARM AAPCS/EABI 下，前几个整型或指针参数通常使用 R0-R3，后续参数按 ABI 规则传递；具体布局由参数类型、对齐、编译器和优化选项决定。

#### 2.1.2.1 ARM 调用约定（概念）

- 在常见的 ARM AAPCS/EABI 下，前几个整型/指针参数通常通过 R0～R3 传递，后续参数按 ABI 放置到栈上或其他规定位置。
- 参数是否真的落在栈上、栈上排列方式以及是否建立 FP 栈帧，都可能受参数类型、对齐规则、编译器和优化级别影响；不能把“从右到左压栈”或“每个局部变量固定在 FP 偏移处”当成通用规则。
- 下面的 `swap` 图是帮助理解“值传递与指针传递”的概念示意，不是某个编译器生成的固定栈布局。

#### 2.1.2.2 `swap` 交换函数示例

![[assets/feishu-freertos-source-analysis/img-019.jpg]]

**Step 1：`main()` 初始化**

```c
int i = 10;  // [main 栈帧，FP-4] = 10
int j = 20;  // [main 栈帧，FP-8] = 20
```

此时 main 栈帧：

```text
高地址
│        ...        │
├───────────────────┤
│     保存的 FP      │  ← FP_main
├───────────────────┤
│     保存的 LR      │
├───────────────────┤
│   i = 10           │  ← FP_main - 4
├───────────────────┤
│   j = 20           │  ← FP_main - 8
└───────────────────┘  ← SP_main（指向栈顶）
低地址
```

**Step 2：调用 `swap(i, j)` —— 参数传递**

关键操作：实参 `i`、`j` 的值被复制到寄存器/栈中，而非传递地址！

- 参数 1（`i = 10`）：`R0 = 10`（值复制）
- 参数 2（`j = 20`）：`R1 = 20`（值复制）

此时栈无任何变化，但寄存器已携带副本。

**Step 3：进入 `swap()` —— 栈帧建立**

```text
高地址
│        ...        │
├───────────────────┤
│   i = 10           │  ← FP_main - 4（main 的 i，纹丝不动）
├───────────────────┤
│   j = 20           │  ← FP_main - 8（main 的 j，稳如泰山）
├───────────────────┤
│   保存的 LR（main）│  ← FP_main
├───────────────────┤
│   保存的 FP（main）│  ← FP_swap
├───────────────────┤
│   a = 10（R0）     │  ← FP_swap + 4（i 的副本）
├───────────────────┤
│   b = 20（R1）     │  ← FP_swap + 8（j 的副本）
├───────────────────┤
│   tmp = 未初始化   │  ← FP_swap - 4
└───────────────────┘  ← SP_swap
低地址
```

- `a` 和 `b` 是 `swap()` 栈帧中的独立变量，与 `i`、`j` 的内存地址完全不同。
- 它们只是值相等，关系如“双胞胎出生在两个家庭”。

**Step 4：`swap()` 内部交换**

```c
tmp = a;  // tmp = 10  → [FP_swap - 4] = 10
a = b;    // a   = 20  → [FP_swap + 4] = 20（改的是副本 a！）
b = tmp;  // b   = 10  → [FP_swap + 8] = 10（改的是副本 b！）
```

| 执行前 | 执行后 |
| --- | --- |
| `a = 10` | `a = 20` ← 改了，但只在 swap 栈内 |
| `b = 20` | `b = 10` ← 改了，但只在 swap 栈内 |
| `tmp = ?` | `tmp = 10` |
| `i = 10` | `i = 10` ← 完全不受影响 |
| `j = 20` | `j = 20` ← 完全不受影响 |

**Step 5：`swap()` 返回 —— 栈帧销毁**

此时：

- `swap()` 的整个栈帧空间被标记为无效。
- `a`、`b`、`tmp` 变量物理上消失了（SP/FP 已移走）。
- `main` 栈帧中的 `i`、`j` 从未被触碰。

**Step 6：回到 `main()`，`i` 仍为 10，`j` 仍为 20**

为什么传指针就能成功？

内存布局巨变：

- `a` 存的是 `i` 的地址，`b` 存的是 `j` 的地址。
- `*a = ...` 不是改 `a`，而是改 `a` 指向的内存——也就是 `main` 栈中 `i` 的位置。
- 此时 `swap` 拥有了 `main` 栈内存的“写入权限”。

代码块：

```c
void swap(int *a, int *b) {  // a、b 是指针（地址值）
    int tmp = *a;             // 通过地址解引用，直接访问 main 的 i/j 内存
    *a = *b;
    *b = tmp;
}
```

#### 小结

形参接收的是实参的值副本；这个对象可能由编译器放在寄存器或栈中，函数返回后其存储期结束。修改形参不会改变调用者对象；若传递的是指针值，则可以通过解引用修改指针所指向的对象。这是理解 C 语言值传递的核心，但不是固定栈布局的证明。

#### 2.1.3 栈的分类

入栈是把一个栈元素压入栈中，而出栈则是从栈中弹出一个栈元素。

入栈和出栈都靠栈指针（Stack Pointer，SP）来维护，SP 会随着入栈和出栈在栈顶上下移动。

如图，根据栈指针 SP 指向栈顶元素的不同，栈可分为满栈和空栈；根据栈的生长方向不同，栈又分为递增栈和递减栈。

满栈的栈指针 SP 总是指向栈顶元素，而空栈的栈指针则指向栈顶元素上方的可用空间。

一个栈元素入栈时，递增栈的栈指针从低地址往高地址增长，而递减栈的栈指针则从高地址往低地址增长。栈的类型不同，出栈和入栈时栈指针的操作方式也不同。

ARM 处理器使用的是满递减栈。

以图所示的满递减栈为例，栈指针 SP 指向栈顶元素 c，当有新元素入栈时，会先移动栈指针，然后把新元素 d 放入 SP 指向的空间即可完成入栈操作。出栈的顺序则刚好相反，先弹出栈顶元素，然后移动栈指针，指向下一个栈顶元素。

![[assets/feishu-freertos-source-analysis/img-020.jpg]]

![[assets/feishu-freertos-source-analysis/img-021.jpg]]

> [!caption] 栈的分类

#### 2.1.4 注意事项

栈设置过大会浪费 RAM；过小则可能因大型局部变量、深层函数嵌套或递归而溢出。在 MCU 上，栈溢出可能表现为 HardFault、数据损坏或无规律重启，不一定出现通用操作系统中的“段错误”。

> [!question] 高频问题
> 如何评估任务栈大小？如何监测栈溢出？可结合本节的静态估算和 [[#8.3 栈溢出检测（必考）|运行时检测]] 学习。

设置栈大小时，应根据局部变量、函数调用链、中断嵌套、库函数和测试覆盖情况保留裕量。可参考：

- 尽量不要在函数内使用大数组，如果确实需要大块内存，则可以使用 malloc 申请动态内存。

- 函数的嵌套层数不宜过深。

- 递归的层数不宜太深。

这个程序可能会导致栈溢出。

```c
void recursive_function(int depth) {
    int large_array[1000000]; // 定义过大的局部数组
    recursive_function(depth + 1);
}

int main() {
    recursive_function(0);
    return 0;
}
```

#### 2.1.5 栈帧

前面提到过，一个函数内定义的局部变量、传递的实参都是保存在栈中的。每一个函数都会有自己专门的栈空间来保存这些数据，每个函数调用可能使用一段栈帧（stack frame）；FP（frame pointer，帧指针）只是某些编译器用于定位栈帧的寄存器，二者不是同一个概念。

在需要调试回溯或稳定的栈帧寻址时，编译器可能同时使用 SP 和 FP；但 FP 可以被省略，R11 也可能作为普通寄存器使用，因此不能假设每个函数都有 R11 栈帧。

![[assets/feishu-freertos-source-analysis/img-022.jpg]]

![[assets/feishu-freertos-source-analysis/img-023.jpg]]

在 `main()` 调用 `f()` 时，调用约定和编译器会保存返回所需的状态；是否保存 FP、LR 以及保存到哪里取决于生成的指令和优化。函数返回时，处理器依据保存的返回地址继续执行调用者。

> 🌈
>
> 在多级函数调用中，每个调用可能建立自己的栈帧；SP 始终表示当前栈位置，而 FP 只有在编译器选择保留帧指针时才提供稳定的帧基址。优化、内联和寄存器分配都可能改变图示布局，所以栈回溯应结合目标编译器、调试信息和实际反汇编分析。
>
> 理解了栈帧，可以通过栈回溯去分析一些 BUG～（嵌入式 C 语言自我修养 5.3.2，或者韦东山老师的调试课也有讲）

### 2.2 堆（地址方向由平台和分配器决定）

#### 2.2.1 定义

> 👍
>
> 1.
>
> 堆是一种动态分配的内存区域，用于存储动态分配的数据（如通过 malloc、calloc、realloc 等函数分配的内存）。一般都是程序员手动分配！

#### 2.2.2 特点

> 📌
>
> 1.
>
> 手动管理：堆的内存分配和释放需要手动管理，由程序员通过调用动态内存分配函数（如 malloc、free）来完成。
>
> 2.
>
> 动态分配：堆内存的大小可以在运行时动态调整。
>
> 3.
>
> 生命周期：动态内存通常由分配器管理，并在显式释放或分配器/系统回收时结束；在 FreeRTOS 中还要看所选 `heap_x.c` 和对象的静态/动态创建方式。
>
> 4.
>
> 内存分配速度：堆的内存分配和释放速度相对较慢，因为需要进行复杂的内存管理（如查找空闲内存块、合并内存块等）。
>
> 5.
>
> 大小灵活：堆大小受链接脚本、静态数组、外部 RAM 和分配器配置限制；MCU 上的 RTOS 堆并不天然“很大”。

#### 2.2.3 裸机下的内存管理

![[assets/feishu-freertos-source-analysis/img-024.jpg]]

> 🌈
>
> 以 Keil 为例，其启动文件 startxx.s 负责初始化堆内存并设置大小，默认将堆空间置于 ARM ZI 区之后或通过 scatter 文件配置。
>
> 裸机环境下，频繁申请释放小块内存会导致严重的内存碎片化，使后续连续大块内存申请失败，因此不建议使用堆，可改用全局数组替代；更优方案是实现自定义内存池管理，将堆划分为固定或可变大小的内存块以避免碎片。在有操作系统支持时，通常由 OS 接管堆内存管理以减轻开发者负担。比如 FreeRTOS 的 heap1-5

#### 2.2.4 注意事项

> 🏝️
>
> 堆内存需要手动管理，如果忘记释放动态分配的内存，会导致内存泄漏。
>
> int\* ptr = (int\*)malloc(sizeof(int));
>
> // 忘记调用free(ptr);

> 💡
>
> 如果释放了未分配的内存或重复释放内存，会导致未定义行为。
>
> free(ptr);
>
> free(ptr); // 重复释放

#### 2.2.5 总结

| 特性 | 栈（Stack） | 堆（Heap） |
| --- | --- | --- |
| 内存分配方式 | 自动分配和释放（由编译器管理） | 手动分配和释放（由程序员管理） |
| 存储内容 | 局部变量、函数调用的上下文信息 | 动态分配的数据（如通过 `malloc` 分配的内存） |
| 生命周期 | 函数调用结束后自动释放 | 直到调用 `free` 函数释放 |
| 内存分配速度 | 快（连续内存空间，操作简单） | 慢（需要复杂的内存管理） |
| 大小限制 | 由 MCU/链接脚本或任务配置决定 | 由静态堆数组、链接脚本、外部 RAM 和分配器配置决定 |
| 使用场景 | 局部变量、函数调用 | 动态数据结构（如链表、数组等） |
| 安全性 | 相对安全（栈溢出可能导致程序崩溃） | 需要手动管理，容易出现内存泄漏问题 |

#### 2.2.6 代码段、data 数据段、bss 段构成可执行程序

> 🌅
>
> （1）编译器在编译程序的时候，将程序中所有元素分成了几个部分，各部分构成一个段，所以说段是可执行程序的组成部分。
>
> （2）代码段：就是程序中的可执行部分，直观理解代码段就是函数堆叠而成的。
>
> (3).data 数据段：放置初始化了的全局变量和静态变量。
>
> （4）BSS 段：通常放置未显式初始化或初始化为 0 的、具有静态存储期的对象；具体 section 划分由编译器和链接脚本决定。

有些特殊数据会被放到代码段

> 📌
>
> （1）`char *p = "freertos"` 中的字符串字面量通常位于只读的 `.rodata`/Flash 区域；程序不应修改它。若写成 `char buf[] = "freertos"`，数组内容则是可写对象，位置由链接脚本决定。
>
> （2）`const` 只表达“通过该表达式不可修改”的类型约束，并不保证对象一定放在代码段或 Flash；实际 section 由编译器、链接脚本和存储属性决定。

总结：栈、堆、静态存储区和代码/只读区是常见分类，但不是 C 语言对象存储的全部实现方式；编译器还可能把对象放在寄存器、链接到特殊内存段或直接优化掉。具体 section 以工具链和链接脚本为准。

> 🎉
>
> （1）相同点：三种获取内存的方法，都可以给程序提供可用内存。
>
> （2）不同点：栈内存对应于 C 语言中的普通局部变量；堆内存完全是独立于程序的存在和管理的；.data 数据段和 bss 段对应于 C 语言中的全局变量和静态局部变量。
>
> （3）函数内部临时使用，就定义局部变量；如果一个变量只在程序的一个阶段有用，就用堆内存；如果一个变量是和程序一生相伴的，就用全局变量或静态局部变量。

## 3. 中断（面试必考的）前面 STM32 也有讲过，再复习一遍

在 C 语言中，中断处理通常是指在嵌入式系统或实时操作系统中，程序对硬件中断信号的响应和处理。C 语言本身并没有直接支持中断处理的语法，但可以通过一些特定的机制（如中断服务例程、中断向量表等）来实现中断处理。中断是一种机制，允许硬件设备在需要时中断当前正在执行的程序，请求处理器执行特定的任务。中断处理程序（Interrupt Service Routine， ISR）是响应中断的函数，用于处理中断请求。

### 3.1 特点

> 🥇
>
> - 异步性：中断可以在程序的任何时刻发生。
>
> - 优先级：中断有不同的优先级，高优先级的中断可以打断低优先级的中断。
>
> - 快速响应：中断处理程序应尽可能短，只完成必要的硬件响应与数据搬运，把耗时处理延后到任务上下文。

### 3.2 中断处理的基本步骤

> 🚅
>
> 1.
>
> 中断请求：硬件设备发出中断信号。
>
> 2.
>
> 中断响应：处理器检测到中断信号后，保存当前程序的状态（如寄存器值、程序计数器等）。
>
> 3.
>
> 中断处理：处理器调用中断处理程序（ISR）来处理中断请求。
>
> 4.
>
> 中断返回：中断处理程序执行完毕后，处理器恢复之前保存的状态，继续执行主程序。

### 3.3 中断处理的注意事项

> 👍
>
> 1.
>
> 快速响应：中断处理程序应尽可能简洁，避免长时间占用处理器。
>
> 2.
>
> 临界区：ISR 应尽量短小。只有在确有必要且时间很短时，才使用端口提供的中断屏蔽/临界区机制；不要为了避免嵌套而随意关闭全局中断。
>
> 3.
>
> 数据保护：ISR 不能使用会阻塞的普通互斥量。任务与 ISR 共享数据时，应根据场景使用原子访问、短临界区、无锁缓冲区或带 `FromISR` 后缀的 FreeRTOS API。
>
> 4.
>
> 中断优先级：合理设置中断优先级，确保高优先级中断能够及时响应。

**示例**

```cpp
#include "stm32f4xx.h"

// 定义中断处理程序
void EXTI0_IRQHandler(void) {
    // 检查是否是EXTI0中断
    if (__HAL_GPIO_EXTI_GET_IT(GPIO_PIN_0) != RESET) {
        __HAL_GPIO_EXTI_CLEAR_IT(GPIO_PIN_0); // 清除中断标志
        // 处理中断
        // 例如：切换LED状态
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
    }
}

int main(void) {
    // 初始化GPIO
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    __HAL_RCC_GPIOA_CLK_ENABLE();
    GPIO_InitStruct.Pin = GPIO_PIN_0 | GPIO_PIN_5;
    GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING; // 上升沿触发
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    // 初始化NVIC
    HAL_NVIC_SetPriority(EXTI0_IRQn, 0, 0); // 设置中断优先级
    HAL_NVIC_EnableIRQ(EXTI0_IRQn);         // 使能中断

    while (1) {
        // 主程序
    }

    return 0;
}
```

## 4. 进程、线程

在操作系统中，进程（Process）和线程（Thread）是两个非常重要的概念，它们是程序运行的基本单位。

### 4.1 进程（Process）

#### 4.1.1 定义

进程是操作系统分配资源的基本单位。一个进程是一个正在运行的程序的实例，它包含了程序的代码、数据、堆栈、文件描述符等资源。

#### 4.1.2 特点

> 🏖️
>
> 独立性：每个进程都有自己独立的地址空间，包括代码段、数据段、堆和栈。
>
> 资源分配：操作系统为每个进程分配独立的资源，如内存、文件描述符、信号等。
>
> 调度单位：在现代通用操作系统中，通常由可运行线程作为调度实体；进程主要是资源和地址空间的容器。具体内核实现可能不同。
>
> 生命周期：进程从创建到结束有一个完整的生命周期，包括创建、运行、阻塞、终止等状态。

**示例**

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork(); // 创建一个子进程

    if (pid == 0) {
        // 子进程
        printf("Child process, PID: %d\n", getpid());
    } else if (pid > 0) {
        // 父进程
        printf("Parent process, PID: %d\n", getpid());
        wait(NULL); // 等待子进程结束
    } else {
        // 错误
        printf("Fork failed\n");
    }

    return 0;
}
```

> [!example] 可能的输出
> ```text
> Parent process, PID: <父进程 PID>
> Child process, PID: <子进程 PID>
> ```
> 实际输出顺序取决于调度，不保证父进程或子进程先打印。

### 4.2 线程（Thread）

#### 4.2.1 定义

线程是操作系统调度的基本单位，是进程中的一个执行单元。一个进程可以包含多个线程，这些线程共享进程的资源，但每个线程有自己的程序计数器、堆栈和局部变量。

#### 4.2.2 特点

> 🐵
>
> 轻量级：线程比进程更轻量级，创建和切换线程的开销比进程小。
>
> 共享资源：线程共享进程的资源，包括内存、文件描述符等。
>
> 调度单位：线程是操作系统调度的基本单位，操作系统通过线程调度算法来分配 CPU 时间。
>
> 并发性：多个线程可以并发执行，提高程序的效率。

```c
#include <stdio.h>
#include <pthread.h>

void* thread_function(void* arg) {
    printf("Thread is running\n");
    return NULL;
}

int main() {
    pthread_t thread;
    pthread_create(&thread, NULL, thread_function, NULL); // 创建线程

    printf("Main thread is running\n");
    pthread_join(thread, NULL); // 等待线程结束

    return 0;
}

/* 输出顺序不保证：
 * Main thread is running
 * Thread is running
 */
```

#### 4.2.3 总结

| 特性 | 进程（Process） | 线程（Thread） |
| --- | --- | --- |
| 资源分配 | 操作系统为每个进程分配独立资源 | 线程共享进程的资源 |
| 地址空间 | 每个进程有自己的独立地址空间 | 线程共享进程的地址空间 |
| 创建和销毁 | 创建和销毁进程的开销较大 | 创建和销毁线程的开销较小 |
| 通信方式 | 进程间通信（IPC）需要使用特定机制 | 线程间通信可以通过共享变量实现 |
| 调度单位 | 通常是资源/地址空间容器，具体由内核决定 | 现代通用 OS 中通常是实际调度实体 |
| 并发性 | 多进程并发执行 | 多线程并发执行 |
| 生命周期 | 从创建到结束的完整生命周期 | 从创建到结束的完整生命周期 |

#### 4.2.4 联系

> 🚅
>
> - 线程是进程的一部分：线程是进程中的一个执行单元，多个线程可以并发执行，提高进程的效率。
>
> - 线程共享进程资源：线程共享进程的资源，包括内存、文件描述符等，因此线程间的通信比进程间通信更高效。
>
> - 调度关系：线程通常是实际的调度实体；进程提供地址空间和资源，调度器不必先“调度进程”再“调度线程”。

#### 4.2.5 注意

> ⛱️
>
> - 线程安全：多线程程序需要考虑线程安全问题，避免数据竞争和死锁。
>
> - 同步机制：可以使用互斥锁（Mutex）、信号量（Semaphore）、条件变量（Condition Variable）等同步机制来协调线程间的操作。
>
> - 性能优化：合理使用线程可以提高程序的性能，但过多的线程可能会导致上下文切换开销增加。

## 5. 任务调度算法（重中之重）

任务调度可以把“任务状态变化”理解为 TCB 的链表项在就绪、延时和事件等待列表之间迁移，但完整调度还包括 Tick/超时处理、优先级选择、`pxCurrentTCB` 更新以及端口完成的上下文保存与恢复。

### 5.1 裸机系统

在 51、STM32 等单片机裸机编程（未使用操作系统）时，程序的执行结构一般是：

- 主函数 main() 中包含一个无限循环 while(1)，用于不断地执行各项任务；
- 中断服务函数（ISR） 用于响应外部事件或定时中断，完成一些对实时性要求较高的处理。

这种结构被称为 单任务系统 或 前后台系统（Foreground-Background System）。

![[assets/feishu-freertos-source-analysis/img-025.jpg]]

> 🌰
>
> 前后台系统结构简单、资源占用少，但实时性差、扩展性弱；
>
> 在复杂或实时性要求高的嵌入式应用中，就必须采用多任务系统（RTOS）来实现高效的任务管理与调度。

### 5.2 多任务系统

多任务系统通过“分而治之”和任务并发执行的方式，把复杂问题拆解成多个独立任务，由系统调度快速切换执行，从而实现高效、灵活、实时的任务管理。这些任务是并发处理的，注意，并不是说同一时刻一起执行很多个任务，而是由于每个任务执行的时间很短，导致看起来像是同一时刻执行了很多个任务一样。（务必记住这张图）

![[assets/feishu-freertos-source-analysis/img-026.jpg]]

> 🏕️
>
> - 运行态
>
>   当一个任务正在运行时，那么就说这个任务处于运行态，处于运行态的任务就是当前正在使用处理器的任务。如果使用的是单核处理器的话那么不管在任何时刻永远都只有一个任务处于运行态。
>
> - 就绪态
>
>   处于就绪态的任务是那些已经准备就绪（这些任务没有被阻塞或者挂起），可以运行的任务，但是处于就绪态的任务还没有运行，因为有一个同优先级或者更高优先级的任务正在运行！
>
> - 阻塞态
>
> 如果一个任务当前正在等待某个外部事件的话就说它处于阻塞态，比如说如果某个任务调用了函数 `vTaskDelay()` 就会进入阻塞态，直到延时周期完成。任务在等待队列、信号量、事件组、通知或互斥信号量的时候也会进入阻塞态。任务阻塞通常带有超时时间；若配置允许把 `portMAX_DELAY` 解释为无限阻塞，则也可能没有超时。超时到期时任务会恢复为就绪，即使所等待的事件还没有到来。

>
> - 挂起态
>
>   像阻塞态一样，任务进入挂起态以后也不能被调度器调用进入运行态，但是进入挂起态的任务没有超时时间。任务进入和退出挂起态通过调用 `vTaskSuspend()` 和 `vTaskResume()`；从 ISR 恢复任务应使用 `xTaskResumeFromISR()`。

任务特性：

> 🎹
>
> 在使用 RTOS 的时候每个任务都有自己的运行环境。任何一个时间点只能有一个任务运行，RTOS 调度器因此就会重复的开启、关闭每个任务。RTOS 调度器的职责是确保当一个任务开始执行的时候其上下文环境（寄存器值，堆栈内容等）和任务上一次退出的时候相同。为了做到这一点，每个任务都必须有个堆栈，当任务切换的时候将上下文环境保存在堆栈中，这样当任务再次执行的时候就可以从堆栈中取出上下文环境，任务恢复运行。

### 5.3 TCB（了解）

在 RTOS 中，调度器负责管理任务的执行与切换；通过为每个任务保存和恢复上下文（寄存器、堆栈等），系统实现了多任务的独立运行与平滑切换。

> 🚅
>
> TCB 是 RTOS 调度器用来识别、管理和切换任务的关键结构。
>
> 调度器通过 TCB 来：
>
> - 保存任务运行时的上下文（寄存器、堆栈指针等）；
>
> - 记录任务的优先级、状态；
>
> - 维护任务之间的调度关系（如就绪链表、延时链表等）。

**TCB 结构体（简化示意）**

> 实际 `TCB_t`/`tskTaskControlBlock` 会受 FreeRTOS 版本、配置宏、MPU/SMP 和 port 条件编译影响；任务入口函数和参数通常放在初始任务栈帧中，不是 V9 TCB 的固定成员。下面只用于理解字段关系，不能直接当作完整源码复制。

```c
typedef struct tskTaskControlBlock
{
    volatile StackType_t *pxTopOfStack;   // 保存该任务上下文的栈指针，通常位于结构体首部
    ListItem_t xStateListItem;            // 就绪/阻塞/挂起状态链表项
    ListItem_t xEventListItem;            // 等待队列/事件对象的链表项
    StackType_t *pxStack;                 // 栈起始地址
    UBaseType_t uxPriority;               // 当前优先级
    char pcTaskName[configMAX_TASK_NAME_LEN];
    /* 可选字段：pxEndOfStack、uxBasePriority、ulRunTimeCounter、
       任务通知、TLS、MPU/SMP 信息等。 */
} TCB_t;
```

> 🦄
>
> TCB 在任务切换中的作用
>
> 当任务创建时：
>
>   - 系统分配 TCB；
>
>   - 初始化任务堆栈；
>
>   - 把任务插入就绪队列。
>
> 当任务切换时：
>
>   - 当前任务的寄存器值等上下文被保存在任务栈中，TCB 主要保存栈指针、状态链表项和调度元数据；
>
>   - 下一个任务的上下文从其 TCB 堆栈中恢复；
>
>   - pxCurrentTCB 指针指向当前正在运行的任务的 TCB。

### 5.4 抢占式任务调度

（建议去看一下韦东山老师的视频（30min）理解起来更深刻，最好是也跟着一起去阅读源码！)

抢占式任务调度是 RTOS 的核心机制之一：当更高优先级任务就绪且调度器允许抢占时，内核会请求切换并由 port 保存/恢复上下文。切换并不一定在产生就绪事件的瞬间完成，ISR 中通常会延后到异常返回后的 PendSV 等路径执行。

#### 5.4.1 调度的常见触发时机

- 更高优先级任务进入就绪态。
- 当前任务阻塞、删除、挂起或主动让出 CPU。
- Tick 使延时任务到期，或触发同优先级时间片轮转。
- ISR 通过 `FromISR` API 唤醒了需要先运行的任务。

#### 5.4.2 调度的核心机制

> ⚽
>
> 高优先级任务进入就绪态
>
> - 例如：某个中断服务函数唤醒了优先级更高的任务。
>
> 触发 PendSV 中断
>
> - 内核设置 PendSV 触发软中断，准备进行任务切换。
>
> 保存当前任务上下文
>
> - 将当前任务的寄存器内容压入其堆栈；
>
> - 更新当前任务 TCB 中的 pxTopOfStack。
>
> 选择最高优先级就绪任务（本质就是链表的切换）
>
> - 调度器扫描就绪任务列表；
>
> - 找到优先级最高的任务对应的 TCB。
>
> 恢复新任务上下文
>
> - 从新任务的堆栈中弹出寄存器内容；
>
> - 恢复 CPU 状态，跳转执行该任务。
>
> 更新 pxCurrentTCB
>
> - pxCurrentTCB 指针指向新任务的 TCB。

#### 5.4.3 时间片轮转

> 🌟
>
> 时间片轮转：当 `configUSE_TIME_SLICING == 1` 且存在多个同优先级就绪任务时，Tick 处理可能轮换同优先级任务；时间片通常以 Tick 为粒度，但 API 主动让出、阻塞或更高优先级任务就绪也会触发调度，因此不能把“1 Tick 必切换”当成普遍规则。

## 6. PendSV

PendSV（Pendable Service Call，可挂起系统调用）是 Cortex-M 的可配置异常。RTOS 通常将它设为最低可配置优先级，用来把上下文切换推迟到其他高优先级中断处理完成之后。

### 6.1 特点与作用

- **可挂起**：软件可通过 `SCB->ICSR` 的 `PENDSVSET` 位请求 PendSV。
- **通常设为最低优先级**：让它在高优先级中断完成后再执行。
- **用于任务切换**：通常由 `portYIELD()`、Tick 或 `FromISR` 路径请求；`vTaskSwitchContext()` 负责选择下一个任务。

```c
SCB->ICSR |= SCB_ICSR_PENDSVSET_Msk;  // 请求 PendSV
```

当调度器决定由任务 A 切换到任务 B 时，PendSV 处理器会保存 A 的软件上下文、调用调度函数选择 B，再恢复 B 的上下文。

### 6.2 触发与执行流程

1. 任务 API、Tick 或 ISR 路径请求任务切换。
2. 内核设置 PendSV 挂起位。
3. 待更高优先级异常处理完成后，CPU 进入 PendSV Handler。
4. port 保存当前任务由软件维护的上下文，并将新的栈顶写回 TCB。
5. `vTaskSwitchContext()` 更新 `pxCurrentTCB`。
6. port 从新任务栈恢复上下文，异常返回时由硬件恢复异常栈帧。

> [!example] Cortex-M 简化示意
> 以下仅表达核心顺序，不是任何特定 FreeRTOS port 的可编译源码；临界区、FPU/MPU 处理和寄存器集会因 port 而异。
>
> ```asm
> mrs   r0, psp
> stmdb r0!, {r4-r11}
> str   r0, [pxCurrentTCB]
>
> bl    vTaskSwitchContext
>
> ldr   r0, [pxCurrentTCB]
> ldmia r0!, {r4-r11}
> msr   psp, r0
> bx    lr
> ```

### 6.3 与 SysTick 的关系

- SysTick：周期性中断，用于推进系统 Tick，并在需要时请求调度；不是每个 Tick 都必然切换任务。
- PendSV：在请求存在且优先级允许时执行端口的上下文切换（保存、恢复寄存器）。简单来说：🕒 SysTick 说“可能需要调度” ⚙️ PendSV 负责“真正切换”。

PendSV 是 Cortex-M 提供的用于延迟执行、最低优先级的软件异常。FreeRTOS 借助 PendSV 实现任务上下文切换，是任务调度的核心机制。

## 7. 上下文切换

想要了解一下具体的流程？可以先看一下这个视频：

[【FreeRTOS】动画搞懂任务切换到底是怎么回事！](https://www.bilibili.com/video/BV1ErWyziEtw)

### 什么是上下文（Context）（了解）

> 🦄
>
> 上下文指的是 CPU 执行任务时的完整运行环境，包括：
>
> - CPU 寄存器的内容（如 R0–R12、LR、PC、PSR）
>
> - 任务的堆栈内容
>
> - 程序计数器（PC） —— 表示任务执行到哪一行
>
> - 堆栈指针（PSP/SP） —— 表示任务当前栈的位置
>
> 换句话说，上下文 = 让任务能从中断处继续执行所需的全部信息。

### 什么是上下文切换（Context Switch）

> 📚
>
> 上下文切换就是：
>
> 当操作系统（RTOS）决定 CPU 需要从当前任务 A 切换到另一个任务 B 时，
>
> 系统要 保存任务 A 的上下文，并 恢复任务 B 的上下文，让 CPU 从 B 上次暂停的地方继续执行。

### 为什么需要上下文切换

> 🚅
>
> 因为在多任务系统中：
>
> - 同一时间 CPU 只能执行一个任务；
>
> - 不同任务会轮流使用 CPU。
>
> 如果不保存任务 A 的执行状态，那么下次再切回来时就“忘记自己执行到哪了”。
>
> 👉 因此：
>
> - 切出任务：保存现场（保存寄存器、堆栈等）；
>
> - 切入任务：恢复现场（恢复寄存器、堆栈等）。

### FreeRTOS 中的上下文切换流程

> 📚
>
> 以下是 FreeRTOS 在 Cortex-M 内核上的典型上下文切换过程（依赖 PendSV 异常）：
>
> 1. **触发切换**：任务延时、释放同步对象，或 ISR 唤醒更高优先级任务时，port 会请求 PendSV。
> 2. **保存旧任务上下文**：异常入口由硬件保存基础寄存器，port 再把 R4–R11 等软件保存寄存器压入当前任务栈，并更新 TCB 中的栈指针。
> 3. **选择新任务**：`vTaskSwitchContext()` 更新 `pxCurrentTCB`。
> 4. **恢复新任务上下文**：从新任务 TCB 取回栈指针，恢复 R4–R11 等寄存器。
> 5. **异常返回**：硬件恢复 R0–R3、R12、LR、PC 和 xPSR，CPU 从新任务继续执行。
>
> ```asm
> mrs   r0, psp
> stmdb r0!, {r4-r11}
> str   r0, [pxCurrentTCB]
> bl    vTaskSwitchContext
> ldr   r0, [pxCurrentTCB]
> ldr   r0, [r0]
> ldmia r0!, {r4-r11}
> msr   psp, r0
> ```
>
> 上述汇编是简化示意；实际指令、符号寻址和 FPU 保存路径以目标 port 为准。
>
> 下面图片来源于公众号《嵌入式摆渡人》

![[assets/feishu-freertos-source-analysis/img-027.jpg]]

## 8. FreeRTOS 内存管理（heap_1–heap_5）

这个图要记住（再复习一下）：

![[assets/feishu-freertos-source-analysis/img-028.jpg]]

> 📍
>
> 了解：
>
> 我们在 C 程序中定义的函数、全局变量、静态变量经过编译链接后，分别以 section 的形式存储在可执行文件的代码段、数据段和 BSS 段中。当程序运行时，可执行文件首先被加载到内存中，各个 section 分别加载到内存中对应的代码段、数据段和 BSS 段中。需要动态链接的动态库也被加载到内存中，完成代码的链接和重定位操作，以保证程序的正常运行。

### 8.1 五种内存管理方案

> [!note]
> 本节部分说明整理自百问网，具体行为以目标 FreeRTOS 版本的 `heap_x.c` 为准。

#### 8.1.1 `heap_1`：只分配，不释放

> 🐵
>
> heap\_1（面试的时候可以说）
>
> - 特点：运行时只分配、不释放；内存来自预先定义的静态数组，因此它不是“静态创建对象”，而是用静态数组实现的动态分配 API。
>
> - 实现方式：简单的线性分配（bump pointer），只增长，不回收。
>
> - 优缺点：
>
>   - ✅ 简单，可靠，没有碎片；
>
>   - ❌ 不支持释放内存，无法适应动态变化的内存需求。
>
> - 适用场景：
>
>   - 固定任务和对象数量的系统，内存需求可在启动时确定。

#### 源码解读：

> 一个工程通常只能选择一个 `heap_x.c` 实现；`heap_1` 使用静态数组作为运行时分配池，但不提供释放。

> 👍
>
> 它只实现了 pvPortMalloc，没有实现 vPortFree。
>
> 如果你的程序不需要删除内核对象，那么可以使用 heap\_1：
>
> - 实现最简单
>
> - 没有碎片问题
>
> - 一些要求非常严格的系统里，不允许使用动态内存，就可以使用 heap\_1
>
> 它的实现原理很简单，首先定义一个大数组：

```cpp
/* Allocate the memory for the heap. */
#if ( configAPPLICATION_ALLOCATED_HEAP == 1 )

/* The application writer has already defined the array used for the RTOS
heap - probably so it can be placed in a special segment or address. */
  extern uint8_t ucHeap[ configTOTAL_HEAP_SIZE ];
#else
    static uint8_t ucHeap[ configTOTAL_HEAP_SIZE ];
#endif /* configAPPLICATION_ALLOCATED_HEAP */
```

> 🥛
>
> 然后，对于 pvPortMalloc 调用时，从这个数组中分配空间。
>
> FreeRTOS 在创建任务时，需要 2 个内核对象：task control block（TCB）、stack。

![[assets/feishu-freertos-source-analysis/img-029.jpg]]

#### 8.1.2 `heap_2`：最佳适应，不合并空闲块

> ❤️
>
> heap\_2
>
> - 特点：支持动态分配和释放内存（malloc() + free()），采用 最佳适应（Best Fit）算法。它支持 vPortFree。
>
> - 实现方式：
>
>   - 内存块链表维护空闲和已分配块；
>
>   - 释放内存时将块加入空闲链表，可被后续分配复用。
>
> - 优缺点：
>
>   - ✅ 可以动态分配和释放内存；
>
>   - ❌ 长期运行可能产生 碎片，不适合实时性要求高的系统。
>
> - 适用场景：
>
>   - 允许动态内存但任务数量和对象数量变化不频繁的系统。

> 📍
>
> Heap\_2 之所以还保留，只是为了兼容以前的代码。新设计中不再推荐使用 Heap\_2。建议使用 Heap\_4 来替代 Heap\_2，更加高效。

![[assets/feishu-freertos-source-analysis/img-030.jpg]]

#### 8.1.3 `heap_3`：封装 C 库 `malloc()` / `free()`

> 🍞
>
> heap\_3
>
> - 特点：直接调用 C 库的 malloc() / free()。
>
> - 实现方式：
>
>   - FreeRTOS 不管理自己的堆空间，而是封装 C 库的 `malloc()`/`free()`；线程安全取决于该版本包装所使用的调度器保护、C 库实现和链接配置。
>
> - 优缺点：
>
>   - ✅ 使用标准库实现，方便移植；
>
>   - ❌ 受限于标准库，可能产生碎片和不可预测延迟；
>
>   - ❌ 在裸机或无标准库的环境不适用。
>
> - 适用场景：
>
>   - 使用现成 RTOS + C 库的系统，快速开发或非严格实时系统。

#### 8.1.4 `heap_4`：首次适应与相邻空闲块合并

> 📌
>
> heap\_4（这个重点看一下源码）
>
> - 特点：支持 动态分配 + 释放 + 内存块合并（coalescence）。
>
> - 实现方式：
>
>   - 内存空闲块释放时，会合并相邻空闲块，减少碎片；（注意合并是按相邻地址合并的）
>
>   - 可减少相邻空闲块造成的碎片，但不等于没有碎片；分配/释放路径的执行时间也不是硬实时上界，因此不能仅凭 heap_4 就保证适合所有“频繁小块申请”场景。
>
> - 优缺点：
>
>   - ✅ 支持动态分配和释放，碎片比 heap\_2 少；
>
>   - ✅ 可用于实时性较高的系统，但仍存在延迟不可完全确定。
>
> - 适用场景：
>
>   - 需要动态分配和释放内存，并且任务较多，碎片控制重要的嵌入式系统。

![[assets/feishu-freertos-source-analysis/img-031.jpg]]

#### 8.1.5 `heap_5`：管理多个不连续内存区域

> 🌰
>
> 特点：在 heap\_4 基础上，支持 多个不连续内存区域。
>
> - 实现方式：
>
>   - 可以定义多个内存区域作为堆（`xHeapRegion[]`），heap\_5 会管理它们；由链表管理
>
>   - 每个区域内存块可自由分配，释放时可合并。
>
> - 优缺点：
>
>   - ✅ 适合多段 RAM 或外部 SRAM 的系统；
>
>   - ✅ 支持动态分配和释放，并合并相邻空闲块；不做搬移式碎片压缩，非相邻区域不能合并。
>
>   - ❌ 实现最复杂，开销稍大。
>
> - 适用场景：
>
>   - MCU 内存分布不连续，或者需要管理多个 SRAM 区域的系统。

### 8.2 方案对比

> 下图对比 `heap_1`–`heap_5` 的分配/释放能力、碎片处理方式、内存区域限制和典型使用场景。

![[assets/feishu-freertos-source-analysis/img-032.jpg]]

### 8.3 栈溢出检测（必考）

> 🏖️
>
> `uxTaskGetStackHighWaterMark()` API 函数
>
> 该函数返回任务自创建以来观测到的“最小未使用栈空间”，单位是 `StackType_t` 个字（不是字节）。FreeRTOS 通常通过任务栈填充的标记区估算这个历史最小值。
>
> - 返回值越小，说明栈曾经用得越满；返回 0 表示没有观测到仍保持完整的标记字，但不应把它当成“已经正式溢出”的证明。
> - 返回值不是负数；不同版本可能提供 `uxTaskGetStackHighWaterMark2()` 等类型变体，但都不能用 `pdSTACK_GROWTH` 推导负的高水位值。
> - 它只能反映已经运行过的路径，不能替代代码审查、压力测试和栈溢出检测。
>
> 使用方法：
>
> - 在开发调试阶段周期性调用此函数，结合任务创建时的栈深度和测试覆盖情况预留余量；注意 `configMINIMAL_STACK_SIZE` 与高水位值的单位通常都是 `StackType_t` 个字。

> 📚
>
> 运行时栈侦测
>
> - 目的：在运行时主动侦测栈溢出事件，并通过钩子函数（Hook）通知开发者，便于快速定位问题。
>
> - 配置开关：FreeRTOSConfig.h 中的 configCHECK\_FOR\_STACK\_OVERFLOW可以配置为 1 或者 2。
>
> - 钩子函数：`void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName);`。
>
>   - 功能：当检测到栈溢出时由内核自动调用。
>
>   - 参数：传入出问题的任务句柄和任务名（但溢出时任务名可能已被破坏）。
>
>   - 限制：仅用于调试，无法从溢出中恢复系统。调用可能发生在中断上下文。

#### 实践建议

1. 开发阶段：
   - 优先使用 uxTaskGetStackHighWaterMark() 来合理设置栈大小。为每个任务的高水位线保留足够的余量（例如 10-20%）。
   - 同时开启 configCHECK\_FOR\_STACK\_OVERFLOW = 2（方法 2），以便在测试中捕获任何未预料到的溢出。
1. 生产阶段：
   - 在充分测试并确定栈大小安全后，可以考虑关闭运行时检测（configCHECK\_FOR\_STACK\_OVERFLOW = 0）以减少任务切换开销，提升性能。
   - 对于一些关键任务或栈大小难以精确估算的任务，可以保留检测（尤其是方法 2）作为最后的防护。
1. 注意：
   - 栈溢出钩子函数是调试辅助工具，不能用于系统恢复。
   - 某些微控制器（MCU）的内存保护单元（MPU）或硬件异常机制可能会在 FreeRTOS 软件检测之前就触发错误，需要结合硬件异常处理进行分析。

## 9. 任务间通信（必考）

因为多任务系统中任务是并发执行的，必须有机制进行数据交换或同步。

> ❤️
>
> 在多任务系统中：
>
> - 一个任务可能产生数据（如传感器采集），另一个任务消费数据（如处理或发送）。
>
> - 共享全局变量并非绝对禁止，但必须保证访问的原子性和同步关系；必要时使用临界区、互斥量、信号量或其他同步机制避免数据竞争。
>
> - RTOS 提供队列、信号量、事件组、任务通知、流/消息缓冲区等不同机制；具体选择取决于数据传递还是同步，以及任务还是 ISR 上下文。

### 9.1 FreeRTOS 常用任务间通信方式

#### 9.1.1 Queue（队列）

队列是 FreeRTOS 的一种核心机制；经典内核中的信号量和互斥量复用了 `queue.c` 的队列结构，但事件组、任务通知、流缓冲区和消息缓冲区有各自的实现，不能说所有通信与同步机制都基于队列。

1. 可以结合 `queue.c` 看普通队列、信号量和互斥量的共用底层，但不要因此忽略事件组、任务通知、流缓冲区和消息缓冲区的独立实现。

> ⚽
>
> 队列（Queue）
>
> 概念：FIFO（先进先出）缓冲区，用于任务间传递消息或数据块。
>
> 特点：
>
> 可以在任务间、任务与中断间传递数据；
>
> 自动处理同步（阻塞/等待）；
>
> 支持多任务同时发送和接收。

**示例 API**

```text
xQueueSend(queue, &data, portMAX_DELAY);    // 任务上下文发送
xQueueReceive(queue, &recvData, portMAX_DELAY); // 任务上下文接收
// ISR 必须改用 xQueueSendFromISR()/xQueueReceiveFromISR() 等接口。
```

#### 9.1.2 Semaphore（信号量）

> 🥖
>
> 信号量（Semaphore）
>
> - 概念：二值或计数信号，用于任务间同步或互斥。
>
> - 类型：
>
>   - 二值信号量（Binary Semaphore）：事件通知、任务同步。
>
>   - 计数信号量（Counting Semaphore）：控制资源数量。
>
>   - 互斥量（Mutex）：在经典内核中复用了队列结构的存储形式，但额外维护持有者和递归计数，并支持优先级继承；它不是可由任意任务/ISR 释放的普通二值信号量。

**示例 API**

```text
xSemaphoreGive(sem);   // 释放信号量
xSemaphoreTake(sem, portMAX_DELAY); // 获取信号量
```

#### 9.1.3 Event Group（事件组）

> ✍️
>
> 事件组（Event Group）
>
> - 概念：多个任务共享一个事件位，每个位表示一个事件状态。
>
> - 用途：
>
>   - 等待多个事件组合；
>
>   - 用于任务间复杂同步。

```text
xEventGroupSetBits(eventGroup, BIT_0);  // 设置事件
xEventGroupWaitBits(eventGroup, BIT_0 | BIT_1, pdTRUE, pdFALSE, portMAX_DELAY); // 等待事件
```

#### 9.1.4 Task Notification（任务通知）

> 🏕️
>
> 任务通知（Task Notification）
>
> - 概念：经典配置下每个任务有一个 32 位通知值；较新的内核还可以配置通知数组，因此具体数量取决于版本和 `configTASK_NOTIFICATION_ARRAY_ENTRIES`。
>
> - 特点：
>
>   - 最轻量、最快速的通信方式；
>
>   - 可以用作信号量、计数器或事件标志；
>
>   - 无需额外内存分配。

```text
xTaskNotifyGive(taskHandle); // 发送通知
ulTaskNotifyTake(pdTRUE, portMAX_DELAY); // 等待通知
```

#### 9.1.5 任务间通信的注意事项

> ⚽
>
> 1.
>
> 任务安全性
>
>   - 多任务共享同一全局变量时，必须保证访问原子性并建立同步关系；可以使用队列、互斥量、临界区、原子操作或任务通知，不能简单规定“必须用某一种 API”。
>
> 2.
>
> 阻塞与非阻塞
>
>   - 通信 API 通常支持 阻塞等待（阻塞任务直到条件满足）和 非阻塞（立即返回）模式。
>
> 3.
>
> 中断安全
>
>   - FreeRTOS 提供 `FromISR` 版本的 API（如 `xQueueSendFromISR()`）用于 ISR；普通阻塞 API 不能在 ISR 中调用。互斥量没有可用于 ISR 的普通获取/释放语义。
>
> 4.
>
> 优先级注意
>
>   - 互斥量可能使用优先级继承来缓解优先级反转；二值/计数信号量通常不承担互斥量的所有权和优先级继承语义。

#### 9.1.6 互斥量（必考）

互斥量（Mutex）是一种非常重要的同步机制，用于保护共享资源，确保同一时间只有一个任务可以访问该资源。互斥量主要用于解决多任务环境下的资源竞争问题。

> 🥛
>
> Mutex 在经典 FreeRTOS 内核中使用了与队列/二值信号量相近的底层结构，但语义不同：它有持有者、优先级继承和（可选）递归获取，通常用于保护共享资源；同一时刻只允许一个任务持有。

#### 与二值信号量的区别

> ✍️
>
> 互斥量的一个重要特性是优先级继承（Priority Inheritance）。当高优先级任务等待低优先级任务持有的互斥量时，RTOS 可能临时提升持有者的优先级，使其更快释放互斥量，从而缓解优先级反转；它不保证解决所有实时性问题，也不能替代锁顺序设计和超时策略。

> 🎁
>
> 互斥量的注意事项
>
> - 避免死锁
>
>   - 不要在持有互斥量的情况下调用可能导致任务阻塞的函数（如osDelay、osSemaphoreAcquire等）。
>
>   - 避免嵌套锁（即在一个任务中多次获取同一个互斥量）。

#### 面试高频：优先级反转与继承

优先级继承：当低优先级任务持有互斥量，高优先级任务等待时，低优先级任务暂时继承高优先级，防止优先级反转。

什么是优先级反转？怎么解决？

> 🌅
>
> 1\. 初始状态：低优先级任务 Task L 开始运行，并成功获取了某个共享资源（例如互斥锁）。
>
> 2\. 高优先级就绪：高优先级任务 Task H 就绪，并抢占了正在运行的 Task L，开始执行。
>
> 3\. 请求资源阻塞：Task H 运行后，也尝试获取那个已被 Task L 锁定的共享资源。由于资源不可用，Task H 被阻塞，挂起在资源的等待队列上。
>
> 4\. 关键的中等优先级任务：此时，CPU 使用权会归还给就绪队列中优先级最高的任务。Task H 被阻塞了，Task L 本来可以继续运行（如果它能一直运行下去，就能很快释放锁，从而解除 Task H 的阻塞）。
>
> 5\. 反转的发生：然而，此时中等优先级任务 Task M 就绪了。它的优先级虽然低于 Task H，但高于 Task L。于是，Task M 抢占了 Task L 的 CPU 使用权，开始执行。
>
> 6\. 问题本质：现在的情况是：
>
> · Task H（优先级最高）在等待 Task L（优先级最低）释放资源。
>
> · Task L（持有资源者）却无法运行，因为它被 Task M（优先级中等）抢占着。
>
> · 结果就是，Task M 这个与共享资源完全无关的任务，竟然间接地阻塞了系统中优先级最高的 Task H。
>
> · 从阻塞链上看， H <- L <- M，高优先级任务被一个低优先级任务阻塞，而后者又被一个中等优先级任务阻塞，优先级顺序发生了“反转”。
>
> 互斥量的一个重要特性是优先级继承（Priority Inheritance）。当高优先级任务等待低优先级任务持有的互斥量时，RTOS 可能临时提升持有者的优先级，使其更快释放互斥量，从而缓解优先级反转；它不保证解决所有实时性问题。

![[assets/feishu-freertos-source-analysis/img-033.jpg]]

![[assets/feishu-freertos-source-analysis/img-034.jpg]]

#### 9.1.7 死锁

1. 核心定义

死锁是指两个或多个任务在执行过程中，因争夺资源而造成的一种相互等待的现象。当每个任务都持有对方所需的资源，并等待对方释放其持有的资源时，所有相关任务都无法继续执行，系统进入停滞状态。它也被形象地称为 “死锁拥抱”。

经典发生场景（示例）

假设有两个任务（A 和 B）和两个互斥量资源（X 和 Y）。

1. 任务 A 运行，获得了互斥量 X。
1. 任务 A 被任务 B 抢占。
1. 任务 B 运行，获得了互斥量 Y。
1. 任务 B 尝试获取互斥量 X，但 X 已被 A 持有 → 任务 B 阻塞，等待 X。
1. 任务 A 恢复运行，尝试获取互斥量 Y，但 Y 已被 B 持有 → 任务 A 阻塞，等待 Y。

死锁产生的必要条件

示例中的情况揭示了死锁发生的四个必要条件，缺一不可：

- 互斥访问：资源不能被共享，一次只能被一个任务独占（如互斥量）。
- 持有并等待：任务已持有至少一个资源，同时又在等待获取其他任务持有的资源。
- 不可剥夺：资源只能由持有它的任务自愿释放，不能被强制抢占。
- 循环等待：存在一个任务-资源的循环等待链（如 A 等 B 的 Y，B 等 A 的 X）。

预防与解决思路

避免死锁的最佳策略是在系统设计阶段就进行规避。

- 固定顺序获取：所有任务都必须以相同的全局顺序获取互斥量（如必须先获取 X，才能获取 Y）。这是最简单有效的方法，它打破了“循环等待”的条件。
- 使用“尝试-等待”机制：在获取第二个资源时，使用非阻塞的“尝试获取”函数。如果失败，则主动释放已持有的所有资源，等待一段时间后重试。这破坏了“持有并等待”的条件。
- 引入看门狗/超时机制：为资源获取设置超时。如果任务在预定时间内无法获得所有所需资源，则主动回退，释放已持有资源。
- 在小型嵌入式系统中的实践：由于系统规模小、逻辑清晰，设计者可以通过仔细的代码审查来识别和消除潜在的死锁区域。

### 9.2 FreeRTOS 中断优先级配置（重要）

#### 9.2.1 NVIC 基础知识

> 🐵
>
> NVIC 的全称是 Nested Vectored Interrupt Controller，即嵌套向量中断控制器。
>
> Cortex-M 的 NVIC 优先级字段通常占 8 位，但真正实现的优先级位数由具体 MCU 决定；STM32F1/F4 常见为高 4 位有效，因此有 16 个优先级编码。这里的“16”表示优先级级别数量，不等于一定能嵌套 16 层中断；实际嵌套深度还受当前执行状态、屏蔽寄存器和硬件资源影响。
>
> 对于这个 NVIC，有个重要的知识点就是优先级分组、抢占优先级和子优先级。以 STM32 为例，STM32F1xx 和 F4xx 通常只使用这个 8 位寄存器的高四位 `[7:4]`。

![[assets/feishu-freertos-source-analysis/img-035.jpg]]

> 🏆
>
> 从上面的表格可以看出，STM32 支持 5 种优先级分组，系统上电复位后，默认使用的是优先级分组 0，也就是没有抢占式优先级，只有子优先级，关于这个抢占优先级和这个子优先级有几点一定要说清楚。
>
> - 具有高抢占式优先级的中断可以在具有低抢占式优先级的中断服务程序执行过程中被响应，即中断嵌套，或者说高抢占式优先级的中断可以抢占低抢占式优先级的中断的执行。
>
> - 在抢占式优先级相同的情况下，有几个子优先级不同的中断同时到来，那么高子优先级的中断优先被响应。
>
> - 在抢占式优先级相同的情况下，如果有低子优先级中断正在执行，高子优先级的中断要等待已被响应的低子优先级中断执行结束后才能得到响应，即子优先级不支持中断嵌套。
>
> - Reset、NMI、Hard Fault 优先级为负数，高于普通中断优先级，且优先级不可配置。
>
> - 对于初学者还有一个比较纠结的问题就是系统中断（比如：PendSV，SVC，SysTick）是不是一定比外部中断（比如 SPI，USART）要高，答案：不是的，它们是在同一个 NVIC 下面设置的。

#### 9.2.2 使用 FreeRTOS 时如何配置外设 NVIC

> 🎁
>
> 强烈推荐用户将 Cortex-M3 内核的 STM32F103 和 Cortex-M4 内核的 STM32F407 以及 STM32F429 的 NVIC 优先级分组设置为 4
>
> 即：NVIC\_PriorityGroupConfig（NVIC\_PriorityGroup\_4）；
>
> 这样中断优先级的管理将非常方便。这个也是官方强烈建议的。
>
> （注意：一旦初始化好 NVIC 的优先级分组后，不要在应用中再次更改。）
>
> 设置 NVIC 的优先级分组为 4 表示支持 0-15 级抢占优先级（注意，0-15 级是 16 个级别，包含 0 级），不支持子优先级。反映在 STM32 标准库的配置上就是如下：

```c
static void TIM_Config(void)
{
     NVIC_InitTypeDef  NVIC_InitStructure;

     NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
/* 抢占优先级设置，优先级分组为4的情况下，抢占优先级可设置范围0-15 */
     NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;
/* 子优先级设置，优先级分组为4的情况下，子优先级无效，取数值0即可 */
     NVIC_InitStructure.NVIC_IRQChannelSubPriority = 0;      
     NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
     NVIC_Init(&NVIC_InitStructure);
}
```

在这里继续强调下这一点，在 NVIC 分组为 4 的情况下，抢占优先级可配置范围是 0-15，那么数值越小，抢占优先级的级别越高，即 0 代表最高优先级，15 代表最低优先级。

#### 9.2.3 FreeRTOS 配置选项中 NVIC 相关配置

FreeRTOSConfig.h 配置文件中设置到 NVIC 中断的有如下几个选项：

```cpp
/* Cortex-M specific definitions. */
#ifdef __NVIC_PRIO_BITS
     /* __NVIC_PRIO_BITS is specified when CMSIS is being used. */
     #define configPRIO_BITS              __NVIC_PRIO_BITS
#else
     #define configPRIO_BITS              4        /* 仅为示例 fallback，实际以目标 MCU 为准 */
#endif

/* The lowest interrupt priority that can be used in a call to a "set priority"
function. */
#define configLIBRARY_LOWEST_INTERRUPT_PRIORITY              0x0f /* 示例值 */

/* The highest interrupt priority that can be used by any interrupt service
routine that makes calls to interrupt safe FreeRTOS API functions.  DO NOT CALL
INTERRUPT SAFE FREERTOS API FUNCTIONS FROM ANY INTERRUPT THAT HAS A HIGHER
PRIORITY THAN THIS! (higher priorities are lower numeric values. */
#define configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY    3    /* 本地 V9 工程示例；请按目标工程和 port 调整 */

/* Interrupt priorities used by the kernel port layer itself.  These are generic
to all Cortex-M ports, and do not rely on any particular library functions. */
#define configKERNEL_INTERRUPT_PRIORITY        ( configLIBRARY_LOWEST_INTERRUPT_PRIORITY << (8 - configPRIO_BITS) )
/* !!!! configMAX_SYSCALL_INTERRUPT_PRIORITY must not be set to zero !!!!
See http://www.FreeRTOS.org/RTOS-Cortex-M3-M4.html. */
#define configMAX_SYSCALL_INTERRUPT_PRIORITY   ( configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY << (8 - configPRIO_BITS) )
```

> 📌
>
> `configPRIO_BITS` 应优先取 CMSIS 提供的 `__NVIC_PRIO_BITS`，而不是盲目写 4。STM32F103/F407/F429 的常见型号确实是 4 个有效优先级位，但不同 MCU/系列应以芯片头文件和参考手册为准。
>
> #define configLIBRARY\_LOWEST\_INTERRUPT\_PRIORITY 0x0f
>
> 此宏定义是用来配置FreeRTOS用到的SysTick中断和PendSV中断的优先级。在NVIC分组设置为4的情况下，此宏定义的范围就是0-15，即专门配置抢占优先级。这里配置为了0x0f，即SysTick和PendSV都是配置为了最低优先级，实际项目中也建议大家配置最低优先级即可。
>
> `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY` 是允许调用 `FromISR` API 的库优先级边界。以 Cortex-M 的常见编号方式表示时，逻辑优先级高于阈值（库优先级数值更小）的中断不能调用 FreeRTOS API；库优先级数值大于或等于阈值的中断才可调用相应的 `FromISR` API。该值随后会按 `configPRIO_BITS` 左移，形成写入 NVIC/BASEPRI 的硬件编码。
>
> [!note] 本地 V9 工程示例
> 本地 `FreeRTOSConfig.h` 使用 `configLIBRARY_LOWEST_INTERRUPT_PRIORITY = 15`、`configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY = 3`，在 4 个有效优先级位时对应硬件编码 `0xF0` 和 `0x30`。这些数值只适用于该工程，不能跨 MCU 或 port 直接复制。

#### 9.2.4 不受 FreeRTOS 管理中断的深入讨论

> ✏️
>
> 讲解不受 FreeRTOS 管理的中断之前要说一个小知识点----中断延迟。中断延迟时间是衡量 RTOS 实时操作系统的一项重要指标，那什么又是中断延迟呢？从中断触发到执行中断服务程序的第一条指令这段时间就是中断延迟时间。
>
> FreeRTOS 内核源码中有多处开关全局中断的地方，这些开关全局中断会加大中断延迟时间。比如在源码的某个地方关闭了全局中断，但是此时有外部中断触发，这个中断的服务程序就需要等到再次开启全局中断后才可以得到执行。开关中断之间的时间越长，中断延迟时间就越大，这样极其影响系统的实时性。如果这是一个紧急的中断事件，得不到及时执行的话，后果是可想而知的。
>
> 针对这种情况，FreeRTOS 就专门做了一种新的开关中断实现机制。关闭中断时仅关闭受 FreeRTOS 管理的中断，不受 FreeRTOS 管理的中断不关闭，这些不受管理的中断都是高优先级的中断，用户可以在这些中断里面加入需要实时响应的程序。FreeRTOS 能够实现这种功能的奥秘就在于 FreeRTOS 开关中断使用的是寄存器 basepri，而像 uCOS 这种使用的是 primask，详情请看下面整理的表格：

![[assets/feishu-freertos-source-analysis/img-036.jpg]]

> 👍
>
> 以 Cortex-M 的硬件优先级编码为例，`BASEPRI` 屏蔽数值大于等于其值的可屏蔽中断，数值更小的高优先级中断仍可响应；写 0 表示不屏蔽。注意这里是已经左移后的硬件优先级编码，不能直接把 FreeRTOS 的库优先级值（如 1、15）和 `BASEPRI=16` 混为一谈；优先级 0 也不能被 `BASEPRI` 屏蔽。

## 10. 低功耗（如果投消费电子或者芯片厂肯定会问的）

参考附件名称：`RTOS低功耗设计原理及实现_TicklessMode（FreeRTOS 的实现）.pdf`（当前仓库未包含该文件）。

### 10.1 核心概念：Tickless Idle Mode（无滴答空闲模式）

> 🌈
>
> 这是 FreeRTOS 低功耗设计的灵魂。
>
> 1.
>
> 传统模式的问题
>
> 在标准模式下，FreeRTOS 依靠 SysTick （系统滴答定时器） 产生周期性中断（通常 1ms 一次）来调度任务。
>
> - 痛点： 即使当前没有任务需要运行（系统处于 Idle 任务），CPU 仍然每 1ms 被唤醒一次。这导致 CPU 无法进入深度睡眠模式，功耗降不下来。
>
> 2.
>
> Tickless 模式的原理
>
> 当系统发现未来很长一段时间（N 个 Tick）都没有任务需要运行时，它会：
>
> 1.
>
> 关闭 周期性的 SysTick 中断。
>
> 2.
>
> 计算 下一个任务唤醒的时间点。
>
> 3.
>
> 重设 定时器，让它直接在那个时间点触发中断（而不是每 1ms 触发一次）。
>
> 4.
>
> 调用端口提供的低功耗指令/钩子（通常会使用 WFI/WFE）让 CPU 进入端口和 MCU 配置允许的 Sleep 或更深低功耗模式。
>
> 5.
>
> 醒来后，补偿 系统时钟（把睡过去的 Tick 数补回来）。

### 10.2 深度实战：实现步骤

面试时应能说清“预计空闲时间—抑制 Tick—进入睡眠—外部事件唤醒—补偿 Tick”的完整链路。

#### 10.2.1 默认实现（端口相关，常见为 SysTick + Sleep）

许多 Cortex-M FreeRTOS 端口提供了基于 SysTick 的默认 Tickless 实现，并通过端口钩子进入低功耗；它通常适合浅睡眠，但不能据此断言所有 MCU 只能进入 Sleep，也不能固定断言功耗一定是 mA 级别。是否能进入 Stop/Standby 以及能耗大小取决于 MCU 时钟、电源和端口实现。

- 优点：在端口和硬件条件匹配时改动较少。
- 缺点：若 SysTick 在深度睡眠中停止，通常还需要 LPTIM/RTC 等低功耗时钟源。

#### 10.2.2 进阶实现（基于 LPTIM 的 Stop 模式）

若目标 MCU 要达到某些 uA 级别的功耗，通常需要 Stop/Standby 等更深睡眠模式和低功耗时钟；是否必须进入 Stop 取决于 MCU、电源配置和目标指标，往往还需要自定义低功耗钩子。

**举个🌰**

```cpp
// 示意伪代码：不要直接复制。实际实现必须处理临界区、唤醒竞态、计数器溢出、
// LPTIM/RTC 到 RTOS Tick 的换算，以及端口对 SysTick 的停止/恢复协议。
#define portSUPPRESS_TICKS_AND_SLEEP( xExpectedIdleTime ) \
    vApplicationSleep( xExpectedIdleTime )

void vApplicationSleep( TickType_t xExpectedIdleTime )
{
    // 1. 按端口要求抑制 SysTick，并把预计空闲 Tick 换算成 LPTIM/RTC 周期
    LPTIM_ConfigTicks( xExpectedIdleTime );
    LPTIM_Start();

    // 2. 进入由 MCU/端口支持的低功耗模式
    HAL_PWR_EnterSTOPMode( PWR_MAINREGULATOR_ON, PWR_STOPENTRY_WFI );

    // 3. 唤醒后恢复时钟和外设，并读取实际经过的低功耗定时器周期
    SystemClock_Config();
    TickType_t xCompletedTicks = ConvertLptimElapsedToRtosTicks();

    // 4. 只把“实际经过的 RTOS Tick”传给内核；不是直接传原始计数器值
    vTaskStepTick( xCompletedTicks );
}
```

### 10.3 避坑指南（面试加分项）

> 🌈
>
> - 时钟恢复：从 Stop 唤醒后，时钟树和 PLL 是否丢失、默认切到哪个时钟源取决于具体 MCU；以 STM32 某些系列为例可能需要重新配置 HSE/PLL，不能把“默认 HSI”当成所有芯片的规则。
>
> - 调试器断连： 进入低功耗模式会导致 J-Link/ST-Link 断开连接。调试技巧： 在低功耗代码前加个 if (DEBUG\_MODE) return; 或者在开发阶段暂时注释掉 WFI 指令。
>
> - 临界区保护：低功耗入口必须遵循所选 FreeRTOS port 的临界区和 tick 抑制协议，处理“刚配置完定时器就被唤醒”的竞态；不能机械地把整段代码包在 `taskENTER_CRITICAL()` 中，否则可能破坏端口的中断唤醒机制。

### 10.4 面试常见问题

#### 如何在 FreeRTOS 中开启低功耗模式？

需要在 FreeRTOSConfig.h 中配置宏定义：

```c
#define configUSE_TICKLESS_IDLE  1  // 启用低功耗 Tickless 模式
// 可选：定义最小进入低功耗的 Tick 数，防止频繁进出导致开销大于收益
#define configEXPECTED_IDLE_TIME_BEFORE_SLEEP  2

// 这是某些版本/port 使用的最小空闲 Tick 阈值；不是所有版本都需要由应用显式定义。
// 配置后，端口会在满足空闲阈值且没有更早唤醒事件时调用
// portSUPPRESS_TICKS_AND_SLEEP( xExpectedIdleTime )。
```

#### 既然关掉了 SysTick，系统唤醒后怎么知道过了多久？（时间补偿机制）

（这是核心难点） 系统唤醒主要有两种情况：

1. 定时器到期唤醒：若确实睡满了预设时长，经过的 RTOS Tick 可以接近 `xExpectedIdleTime`，但仍需按端口的补偿规则修正。
1. 外部中断唤醒（IRQ）：例如按键提前唤醒。应读取低功耗定时器并把其经过的硬件周期换算为实际 RTOS Tick，再调用 `vTaskStepTick()`；不能直接把原始计数器值当成 Tick。

#### 使用 SysTick 做低功耗有什么局限性？

答： SysTick 属于 Cortex-M 内核外设。在许多 MCU（如 STM32）的 Stop 模式 （深度睡眠） 下，内核时钟会停止，导致 SysTick 也会停止计数。

- 后果： 唤醒后无法知道睡了多久，系统时钟会偏差。
- 解决方案： 必须重写 portSUPPRESS\_TICKS\_AND\_SLEEP，不再使用 SysTick，而是改用 LPTIM （低功耗定时器） 或 RTC。这些外设在 Stop 模式下依然可以使用低速时钟（LSI/LSE）运行，实现真正的低功耗。

> 🏖️
>
> 总结
>
> 在 RTOS 中实现低功耗，主要通过：
>
> - 空闲任务挂起 CPU（Idle Hook + WFI/WFE）；
>
> - Tickless Idle 模式减少系统时钟唤醒；
>
> - 外部中断或事件唤醒保持响应性；
>
> - 合理任务调度，最大化空闲时间。
>
> 核心思想：空闲时让 CPU 停止运行，只在需要时唤醒，从而降低整体功耗。

## 11. API 函数汇总

### 11.1 任务管理（Task Management）

#### 创建与删除

- xTaskCreate() - 创建新任务
- xTaskCreateStatic() - 使用静态内存创建任务
- vTaskDelete() - 删除任务

#### 任务控制

- vTaskDelay() - 相对延时
- vTaskDelayUntil() - 绝对周期性延时
- vTaskPrioritySet() - 设置任务优先级
- uxTaskPriorityGet() - 获取任务优先级
- vTaskSuspend() - 挂起任务
- vTaskResume() - 恢复任务
- xTaskResumeFromISR() - 从中断恢复任务

#### 任务信息

- uxTaskGetStackHighWaterMark() - 获取任务堆栈最小剩余空间
- vTaskList() - 获取任务状态列表
- vTaskGetRunTimeStats() - 获取任务运行时间统计
- xTaskGetCurrentTaskHandle() - 获取当前任务句柄
- xTaskGetHandle() - 根据任务名获取句柄

### 11.2 队列（Queues）

#### 创建与删除

- xQueueCreate() - 创建队列
- xQueueCreateStatic() - 静态创建队列
- vQueueDelete() - 删除队列

#### 数据操作

- xQueueSend() - 发送数据到队列尾部
- xQueueSendToBack() - 发送数据到队列尾部
- xQueueSendToFront() - 发送到队列头部
- xQueueReceive() - 从队列接收数据
- xQueuePeek() - 查看队列数据但不移除
- uxQueueMessagesWaiting() - 获取队列中消息数量
- uxQueueSpacesAvailable() - 获取队列剩余空间
- xQueueReset() - 重置队列并清空其中的数据（本地 V9 API）

#### 中断服务函数

- xQueueSendFromISR() - 中断中发送
- xQueueReceiveFromISR() - 中断中接收
- xQueuePeekFromISR() - 中断中查看

### 11.3 信号量（Semaphores）

#### 二值信号量

- vSemaphoreCreateBinary() - 创建二值信号量（旧版）
- xSemaphoreCreateBinary() - 创建二值信号量（动态）
- xSemaphoreCreateBinaryStatic() - 静态创建

#### 计数信号量

- xSemaphoreCreateCounting() - 创建计数信号量
- xSemaphoreCreateCountingStatic() - 静态创建

#### 信号操作

- xSemaphoreTake() - 获取信号量
- xSemaphoreGive() - 释放信号量
- xSemaphoreGiveFromISR() - 中断中释放
- xSemaphoreTakeFromISR() - 中断中获取（仅二值/计数信号量，不可用于互斥锁；通过 `pxHigherPriorityTaskWoken` 报告是否需要切换）
- uxSemaphoreGetCount() - 获取信号量计数值

### 11.4 互斥锁（Mutexes）

#### 创建

- xSemaphoreCreateMutex() - 创建互斥锁
- xSemaphoreCreateMutexStatic() - 静态创建
- xSemaphoreCreateRecursiveMutex() - 创建递归互斥锁
- xSemaphoreCreateRecursiveMutexStatic() - 静态创建

#### 操作

- xSemaphoreTakeRecursive() - 递归获取互斥锁
- xSemaphoreGiveRecursive() - 递归释放互斥锁

### 11.5 递归互斥锁

- xSemaphoreCreateRecursiveMutex()
- xSemaphoreTakeRecursive()
- xSemaphoreGiveRecursive()

### 11.6 事件组（Event Groups）

#### 创建与删除

- xEventGroupCreate() - 创建事件组
- xEventGroupCreateStatic() - 静态创建
- vEventGroupDelete() - 删除事件组

#### 事件操作

- xEventGroupSetBits() - 设置事件位
- xEventGroupSetBitsFromISR() - 从 ISR 请求设置事件位（通常由定时器/守护任务延后处理，不是在 ISR 中完整遍历等待任务）
- xEventGroupClearBits() - 清除事件位
- xEventGroupClearBitsFromISR() - 从 ISR 请求清除事件位（具体处理方式以目标版本为准）
- xEventGroupWaitBits() - 等待事件位
- xEventGroupSync() - 同步任务

> [!note] ISR 版本的配置依赖
> 经典内核中的事件组 `FromISR` 操作会借助定时器服务任务延后执行，通常需要启用 `configUSE_TIMERS`、`INCLUDE_xTimerPendFunctionCall` 以及相应的跟踪/版本条件；使用前请核对目标版本的 `event_groups.c`。

### 11.7 软件定时器（Software Timers）

#### 创建与删除

- xTimerCreate() - 创建定时器
- xTimerCreateStatic() - 静态创建
- xTimerDelete() - 删除定时器

#### 控制

- xTimerStart() - 启动定时器
- xTimerStartFromISR() - 中断中启动
- xTimerStop() - 停止定时器
- xTimerStopFromISR() - 中断中停止
- xTimerReset() - 重置定时器
- xTimerResetFromISR() - 中断中重置
- xTimerChangePeriod() - 更改周期
- xTimerChangePeriodFromISR() - 中断中更改周期

#### 信息查询

- pvTimerGetTimerID() - 获取定时器 ID
- xTimerGetTimerDaemonTaskHandle() - 获取定时器服务任务句柄
- xTimerPendFunctionCall() - 将函数挂起到定时器任务

### 11.8 时间管理（Time Management）

- xTaskGetTickCount() - 获取当前系统节拍数
- xTaskGetTickCountFromISR() - 中断中获取
- vTaskSetTimeOutState() - 设置超时状态
- xTaskCheckForTimeOut() - 检查是否超时
- pdMS\_TO\_TICKS() - 毫秒转换为节拍数（宏）

### 11.9 中断管理（Interrupt Management）

- taskENTER\_CRITICAL() - 进入临界区
- taskEXIT\_CRITICAL() - 退出临界区
- taskENTER\_CRITICAL\_FROM\_ISR() - 中断中进入
- taskEXIT\_CRITICAL\_FROM\_ISR() - 中断中退出
- portDISABLE\_INTERRUPTS() - 禁用中断
- portENABLE\_INTERRUPTS() - 使能中断
- vPortEnterCritical() - 进入临界区（移植层）
- vPortExitCritical() - 退出临界区（移植层）

### 11.10 内存管理（Memory Management）

- pvPortMalloc() - 动态内存分配
- vPortFree() - 释放内存
- xPortGetFreeHeapSize() - 获取堆剩余大小
- xPortGetMinimumEverFreeHeapSize() - 获取历史最小剩余堆大小

### 11.11 协程（Coroutines）

- xCoRoutineCreate() - 创建协程
- vCoRoutineSchedule() - 调度协程
- crDELAY() - 协程延时
- crQUEUE\_SEND() - 协程队列发送
- crQUEUE\_RECEIVE() - 协程队列接收

### 11.12 流缓冲区（Stream Buffer）—v10+

- xStreamBufferCreate() - 创建流缓冲区
- xStreamBufferCreateStatic() - 静态创建
- xStreamBufferSend() - 发送数据
- xStreamBufferSendFromISR() - 中断中发送
- xStreamBufferReceive() - 接收数据
- xStreamBufferReceiveFromISR() - 中断中接收
- vStreamBufferDelete() - 删除流缓冲区

### 11.13 消息缓冲区（Message Buffer）—v10+

- xMessageBufferCreate() - 创建消息缓冲区
- xMessageBufferCreateStatic() - 静态创建
- xMessageBufferSend() - 发送消息
- xMessageBufferSendFromISR() - 中断中发送
- xMessageBufferReceive() - 接收消息
- xMessageBufferReceiveFromISR() - 中断中接收
- vMessageBufferDelete() - 删除消息缓冲区

### 11.14 跟踪与调试（Trace and Debug）

- vTaskGetInfo() - 获取任务信息
- uxTaskGetSystemState() - 获取系统状态
- `vTaskGetSnapshotAll()` - 某些版本/移植层或工具链相关的任务快照接口；当前本地 V9 工程和核对过的 V11.1.0 官方源码中都不应把它当作通用 API，使用前以目标版本头文件为准
- `traceSTART`/`traceSTOP` 通常是应用或跟踪工具提供的宏，不是所有 FreeRTOS 版本都自带的通用内核 API。

### 11.15 内核控制（Kernel Control）

- vTaskStartScheduler() - 启动调度器
- vTaskEndScheduler() - 结束调度器（部分平台）
- vTaskSuspendAll() - 挂起所有任务
- xTaskResumeAll() - 恢复所有任务
- vApplicationIdleHook() - 空闲任务钩子函数
- vApplicationTickHook() - 系统节拍钩子函数

## 12. 延伸

### 动态创建任务和静态创建任务的区别？

> 🌈
>
> 1.
>
> 内存分配方式
>
> 动态创建 （xTaskCreate）:
>
> - 任务所需的 堆栈和控制块内存 由 FreeRTOS 从 FreeRTOS 堆 自动分配（就是我们常说的“大数组”）
>
> - 需要 configSUPPORT\_DYNAMIC\_ALLOCATION = 1
>
> 静态创建 （xTaskCreateStatic）:
>
> - 任务所需的 堆栈和控制块内存 由 用户预先定义 并作为参数传入
>
> - 需要 configSUPPORT\_STATIC\_ALLOCATION = 1
>
> 2.
>
> 使用场景
>
> 使用动态创建 （xTaskCreate） 的场景：
>
> - 任务数量和堆栈大小在运行时确定
>
> - 内存资源相对充足
>
> - 需要频繁创建/删除任务
>
> - 开发初期，需要快速原型验证
>
> 使用静态创建 （xTaskCreateStatic） 的场景：
>
> - 对确定性要求高的系统（如汽车、医疗）
>
> - 避免内存碎片
>
> - 内存资源紧张且需要精确控制
>
> - 安全关键系统（需要明确知道内存位置）
>
> - 任务创建后不再删除
>
> - 静态创建方式还常用于 bootloader 转 app 的场景，因为 bootloader 使用的堆可能与 app 冲突，静态创建可以避免这个问题。

```cpp
// 动态创建
BaseType_t xTaskCreate(
    TaskFunction_t pvTaskCode,
    const char * const pcName,
    const configSTACK_DEPTH_TYPE usStackDepth,
    void * const pvParameters,
    UBaseType_t uxPriority,
    TaskHandle_t * const pxCreatedTask
);

// 静态创建
TaskHandle_t xTaskCreateStatic(
    TaskFunction_t pvTaskCode,
    const char * const pcName,
    const configSTACK_DEPTH_TYPE uxStackDepth,
    void * const pvParameters,
    UBaseType_t uxPriority,
    StackType_t * const puxStackBuffer,     // 用户提供的堆栈缓冲区
    StaticTask_t * const pxTaskBuffer       // 用户提供的任务控制块缓冲区
);
```

> [!note] V9 / V11 签名差异
> 本章按 V11.1.0 展示时，栈深度参数写作 `configSTACK_DEPTH_TYPE`；本地 V9 工程的 `task.h`/`tasks.c` 使用 `const uint32_t ulStackDepth`。两者都表示“栈字数”而不是字节数，阅读或移植时以目标版本头文件为准。

> [!tip] 源码阅读提示
> 时间紧张时，先看各函数的流程图，再回到文字和源码核对关键分支。阅读前可先速通韦东山老师的 RTOS 入门 PDF 或《FreeRTOS 实时内核使用指南》。

### 以 FreeRTOS Kernel V11.1.0 为例

> [!warning] 版本边界
> 本章按 FreeRTOS Kernel V11.1.0 的代码和配置宏讲解；本地 `[[projects/RTOS项目/源码/FreeRTOS/tasks.c]]`、`[[projects/RTOS项目/源码/FreeRTOS/queue.c]]` 是 V9.0.0。V11.1.0 的字段、宏和源码流程不能直接套到 V9 工程；示例中的配置值也不代表当前工程实测值。

> [!note] 原文附件
> 原页面列出了 `FreeRTOS.zip`（315.60 KB）和 `FreeRTOS实时内核使用指南-中文.pdf`（3.10 MB），但当前 Obsidian 仓库中没有对应附件文件，因此这里仅保留名称供查找。

配置文件 → 基础链表 → 内存管理 → 任务管理 → 队列管理 → 同步机制 → 定时器 → 移植层

### `FreeRTOSConfig.h` 配置文件

FreeRTOS 的内核裁剪主要是通过修改 FreeRTOSConfig.h 中的宏定义来实现的。这些宏直接控制了 FreeRTOS 的功能启用/禁用、资源分配和行为特性，从而实现按需裁剪内核大小和资源占用。很有必要了解一下哦！

除了修改配置宏，还可通过以下方式进一步裁剪：

1. 移除未使用的源文件

例如：不使用软件定时器时，可从编译列表中移除 timers.c；不使用事件组时，移除 event\_groups.c。

1. 优化编译器选项

开启死代码消除（如 GCC 的 -ffunction-sections -fdata-sections -Wl,--gc-sections），让链接器自动移除未使用的函数和数据。

#### 裁剪的目的和注意事项

- 目的：
  - 减少 ROM 占用（代码大小）。
  - 减少 RAM 占用（堆、栈、内核对象）。
  - 提升系统性能（减少不必要的计算和中断）。
  - 适配资源受限的硬件平台。
- 注意事项：
  - 确保保留应用必需的功能（如任务调度、必要的同步原语）。
  - 裁剪后需进行完整测试，避免因功能缺失导致系统异常。
  - 平衡裁剪程度与可维护性（过度裁剪可能影响后续功能扩展）。

### 模块组成

```text
├── 硬件描述相关配置
├── 调度行为相关配置
├── 软件定时器相关配置
├── 事件组相关配置
├── 流缓冲区相关配置（先不看）
├── 内存分配相关配置
├── 中断嵌套行为配置
├── 钩子和回调函数相关配置
├── 运行时和任务统计相关配置
├── 协程相关配置（先不看）
├── 调试辅助配置
└── FreeRTOS MPU 特定配置（先不看）
```

### CPU 时钟频率

![[assets/feishu-freertos-source-analysis/img-037.jpg]]
- configCPU\_CLOCK\_HZ：设置系统时钟频率，通常等于主 CPU 频率，这个根据自己配置的时钟来设置
- configSYSTICK\_CLOCK\_HZ：可选，当 SysTick 时钟与 CPU 时钟不同时设置

### 系统节拍中断的频率

![[assets/feishu-freertos-source-analysis/img-038.jpg]]
- （单位：Hz），决定了 RTOS 调度器的"心跳"频率
- 配置为 1000，意味着系统每 1ms 产生一次节拍中断

#### 影响

- 精度与延迟：频率越高（如 1000Hz），基于 Tick 的延时分辨率通常越高；但实际唤醒延迟还受优先级、临界区、调度器状态和端口实现影响，不能简单保证“最多 1ms”。
- 系统开销：频率越高，节拍中断处理的次数越多，CPU 开销越大
- 定时器分辨率：软件定时器的最小分辨率等于节拍周期（1ms）

#### 选择建议

- 实时性要求高的场景（如工业控制、电机驱动）：设置为 1000Hz 或更高
- 资源受限的场景（如低功耗设备）：设置为 100Hz 或更低，减少中断开销

### 控制调度器的调度模式（默认为 1）

- 1：启用抢占式调度（Pre-emptive Scheduling）
- 0：启用协作式调度（Co-operative Scheduling）
![[assets/feishu-freertos-source-analysis/img-039.jpg]]

#### 抢占式 vs 协作式

- 抢占式调度：
  - 高优先级任务可以主动打断低优先级任务的执行
  - 系统能及时响应紧急任务，实时性更好
  - 符合大多数实时系统的需求
- 协作式调度：
  - 任务必须主动放弃 CPU 控制权（如调用 taskYIELD() 或阻塞）
  - 低优先级任务可能长时间占用 CPU，导致高优先级任务延迟
  - 仅适用于特定场景（如无实时要求的系统）

#### 使用建议

- 默认选择抢占式（1）：适用于 99% 的实时应用场景
- 仅在特殊情况下使用协作式（如简化中断处理、特定硬件限制）

### 控制相同优先级任务的调度方式（示例配置；本地 V9 工程为 1）

![[assets/feishu-freertos-source-analysis/img-040.jpg]]
- 1：启用时间片轮转（Time Slicing）
- 0：禁用时间片轮转

#### 时间片轮转机制

- 启用时（1）：相同优先级的多个就绪任务可能在 Tick 处理时轮换；时间片通常以一个 Tick 为粒度（本地配置为 1ms），但不保证每个 Tick 都发生上下文切换
- 禁用时：相同优先级的任务不会因每个 Tick 自动轮换，但仍可能因主动让出、阻塞、删除或其他调度事件切换；当前运行任务会执行到：
  - 主动阻塞（如调用 vTaskDelay()）
  - 被更高优先级任务抢占
  - 主动放弃 CPU（如调用 taskYIELD()）

影响

- 启用时间片：相同优先级任务的响应更均衡，但可能增加上下文切换开销
- 禁用时间片：相同优先级任务的执行更连续，减少上下文切换，但可能导致某些任务长时间等待

使用建议

- 一般场景：启用时间片（1），确保相同优先级任务都有机会执行
- 特殊场景（禁用时间片轮转）：
  - 当相同优先级的任务执行时间短且顺序固定时
  - 当希望减少上下文切换开销时
  - 当任务间有明确的执行顺序要求时

### 任务选择算法

![[assets/feishu-freertos-source-analysis/img-041.jpg]]
- 作用：控制是否使用针对特定硬件平台优化的任务选择算法。
  - 0 = 禁用，使用通用的任务选择方法（适用于所有平台）。
  - 1 = 启用，使用具体 port 提供的优化（例如 Cortex-M 端口常用位图和 CLZ 指令），依赖目标架构和端口实现。
- 适用场景：只有在所选 port 明确支持时才启用；它不是“位带操作”开关。

### 低功耗 tickless 模式

![[assets/feishu-freertos-source-analysis/img-042.jpg]]
- 作用：控制是否启用低功耗 tickless 模式。
  - 0 = 保持常规 Tick 行为；是否进入普通 Sleep 仍可能由应用 Idle Hook/端口决定。
  - 1 = 启用端口的 tickless idle 路径，空闲时可抑制 Tick；它本身不保证进入 Stop/Standby。
- 注意：并非所有 FreeRTOS 移植都支持此功能；启用时需确保硬件能正确处理长时间休眠（如唤醒源、时钟校准）。

### 设置可用的任务优先级数量

![[assets/feishu-freertos-source-analysis/img-043.jpg]]
- 任务可分配的优先级范围为 0 到 （configMAX\_PRIORITIES - 1），其中 0 是最低优先级。
- 影响：值越大，优先级队列占用的内存越多（尤其是使用位映射实现时）。需根据实际任务需求设置，避免不必要的内存开销。

### 定义空闲任务（Idle Task）使用的栈大小

![[assets/feishu-freertos-source-analysis/img-044.jpg]]
- 单位：字，而非字节，例如，32 位处理器（字长 4 字节）下，128 字 = 512 字节栈空间。
- 注意：此值仅用于空闲任务，其他任务的栈大小需单独指定。设置过小可能导致空闲任务栈溢出，需根据硬件架构和空闲任务的实际需求调整。

### 任务名长度（很少调整）

![[assets/feishu-freertos-source-analysis/img-045.jpg]]

- `configMAX_TASK_NAME_LEN` 控制每个 TCB 中任务名缓冲区的容量。
- 值过小会截断调试器或统计信息中的任务名；值过大则会增加每个任务的 RAM 占用。本地 V9 工程配置为 `16`，其他工程请以实际配置为准。

### TickType_t 类型的位宽（V11.1.0 配置方式）

![[assets/feishu-freertos-source-analysis/img-046.jpg]]
- V11.1.0 可用 `TICK_TYPE_WIDTH_16_BITS`、`TICK_TYPE_WIDTH_32_BITS` 或 `TICK_TYPE_WIDTH_64_BITS` 选择 Tick 宽度。
- 本地 V9 工程使用的是 `configUSE_16_BIT_TICKS`，不要把两个版本的配置宏混用。
- 适用场景：
  - 64 位：适用于需要长时间运行（避免节拍溢出）或低 configTICK\_RATE\_HZ（节拍频率低，32 位可能更快溢出）的系统。
  - 32 位：适用于大多数常规场景，内存占用更小，操作更快。

### 空闲任务是否应该让位于同优先级的应用任务

![[assets/feishu-freertos-source-analysis/img-047.jpg]]
- 1 = 空闲任务会让出 CPU 时间给优先级为 0（空闲优先级）的应用任务。
- 0 = 空闲任务会使用完整的时间片，即使有同优先级的应用任务可运行。
- 适用场景：设置为 1 可确保优先级 0 的应用任务更及时地执行（避免被空闲任务占用时间片）。

### 队列注册表中可存储的队列/信号量最大数量

![[assets/feishu-freertos-source-analysis/img-048.jpg]]
- 0 = 禁用队列注册表（不使用调试器时推荐）。
- 大于 0 = 启用，允许调试器查看队列/信号量状态。
- 注意：仅在使用支持 FreeRTOS 的调试工具（如 SEGGER SystemView）时需要设置为非 0

### 是否启用向后兼容性

![[assets/feishu-freertos-source-analysis/img-049.jpg]]
- 0 = 禁用，仅使用新版本的 API（减少代码冗余，推荐新项目）。
- 1 = 启用，支持旧版本 API 名称（方便迁移旧项目）。

### 每个任务的线程本地存储（TLS）指针数组大小

![[assets/feishu-freertos-source-analysis/img-050.jpg]]
- 0 = 禁用 TLS（不使用任务本地数据时推荐）。
- 大于 0 = 启用，每个任务可拥有指定数量的私有指针。
- 适用场景：如需在任务间共享代码但使用不同上下文数据（如每个任务的独立缓冲区、状态变量），可增大此值

### 存储任务栈深度的类型

![[assets/feishu-freertos-source-analysis/img-051.jpg]]
- 作用：定义用于存储任务栈深度的类型（如 `xTaskCreate()` 等函数中的栈大小参数类型）。V11.1.0 默认通常为 `StackType_t`，可在配置中覆盖；不能笼统写成 `size_t`。
- 影响：选择的类型应能表示实际栈深度，并与目标 port 的 `StackType_t`、ABI 和 API 声明保持一致。

### 用于存储消息缓冲区中消息长度的类型

![[assets/feishu-freertos-source-analysis/img-052.jpg]]
- 作用：定义用于存储消息缓冲区中消息长度的类型（消息长度会随消息一起写入缓冲区）。
- 注意：
  - 虽然默认值为 size\_t，但如果消息长度不会超过 uint8\_t 范围（0-255），使用 uint8\_t 可节省内存（每个消息少占 3 字节）。
  - 此配置仅影响消息缓冲区（Stream Buffer 的一种变体），不影响普通流缓冲区。

### 释放内存时是否将内存块清零（建议开启）

![[assets/feishu-freertos-source-analysis/img-053.jpg]]
- 作用：控制释放内存时是否将内存块清零。
  - 1 = 释放时清零（增强安全性，防止敏感数据残留）。
  - 0 = 释放时不清零（提高性能，减少内存操作）。
- 适用场景：
  - 安全要求高的系统（如包含密码/密钥的应用）建议设为 1。
  - 对性能要求极高且无敏感数据的场景可设为 0。

### 存储任务统计信息缓冲区最大长度

![[assets/feishu-freertos-source-analysis/img-054.jpg]]
- 值：0xFFFF（65535）
- 作用：设置 `vTaskList()` 和 `vTaskGetRunTimeStats()` API 使用的缓冲区最大长度（用于存储任务统计信息）。
- 注意：
  - V11.1.0 新应用可使用 `vTaskListTasks()` 和 `vTaskGetRunTimeStatistics()`；它们显式要求传入缓冲区长度。前者依赖 `configUSE_TRACE_FACILITY` 和 `configUSE_STATS_FORMATTING_FUNCTIONS`，后者还依赖 `configGENERATE_RUN_TIME_STATS`。本地 V9 工程没有这两个新名称。
  - 此配置仅对旧版统计 API 有效。

### 是否启用 Newlib C 标准库的可重入支持（可以去了解了解可重入函数）

![[assets/feishu-freertos-source-analysis/img-055.jpg]]
- 值：0
- 作用：控制是否为每个任务维护 Newlib 的 `_reent` 上下文。
  - 0 = 禁用。
  - 1 = 启用，但仍需正确配置 Newlib、锁和底层系统调用；它不会自动让所有 `malloc`、`printf` 或其他库函数在任意场景下都线程安全。
- 注意：Newlib 重入支持会增加每个任务的内存开销，是否启用应结合工具链和应用实际使用情况判断。

### 设置软件定时器命令队列的长度

![[assets/feishu-freertos-source-analysis/img-056.jpg]]
- 作用：设置软件定时器命令队列的长度（用于存储发送给定时器守护任务的命令，如启动/停止/重置定时器）。
- 影响：
  - 队列长度决定了可同时待处理的定时器命令数量。
  - 值过小可能导致命令队列溢出（当短时间内发送大量定时器命令时）。
  - 值过大则会占用更多内存（每个队列项约几个字节）。
- 适用场景：根据应用中定时器操作的频率调整，一般 10 足够应对常规场景。

### 是否启用 FreeRTOS 软件定时器功能

![[assets/feishu-freertos-source-analysis/img-057.jpg]]
- 作用：控制是否启用 FreeRTOS 软件定时器功能。
  - 1 = 启用，系统会创建一个定时器守护任务（Timer Service Daemon Task）来管理软件定时器的命令处理和回调执行。
  - 0 = 禁用，不使用软件定时器功能（可节省内存和系统资源）。

### 设置定时器守护任务的优先级

![[assets/feishu-freertos-source-analysis/img-058.jpg]]
- 值：通常配置为 `( configMAX_PRIORITIES - 1 )`，但最终以工程配置为准。
  - 若示例中 `configMAX_PRIORITIES = 5`，则优先级为 4；本地 V9 工程为 `configMAX_PRIORITIES = 32` 时则为 31。FreeRTOS 中数值 0 最低。
- 作用：设置定时器守护任务的优先级。
- 影响：
  - 高优先级确保定时器回调能及时执行（避免被其他任务阻塞）。
  - 通常建议设为系统最高或次高优先级，以保证定时器的时间准确性。

### 定时器守护任务的栈大小（前面设置了 128 字）

![[assets/feishu-freertos-source-analysis/img-059.jpg]]
- 作用：设置定时器守护任务的栈大小（单位为字，非字节）。
  - 例如，32 位系统中 128 字 = 512 字节栈空间。
- 注意：
  - 栈大小需足够容纳守护任务的执行（包括处理命令队列和调用定时器回调函数）。
  - 如果回调函数复杂（如调用其他函数或使用局部变量较多），可能需要增大此值以避免栈溢出。

### 是否启用事件组（Event Groups）功能

![[assets/feishu-freertos-source-analysis/img-060.jpg]]
- 作用：控制是否启用事件组（Event Groups）功能。
  - 1 = 启用，可使用事件组 API（如 xEventGroupCreate、xEventGroupWaitBits 等）。
  - 0 = 禁用，不使用事件组功能（可节省内存）。
- 适用场景：需要任务等待多个事件组合（如“等待所有事件”或“等待任意事件”）时启用，常用于多事件同步场景（如传感器数据就绪 + 通信总线空闲）。

### 是否启用流缓冲区（Stream Buffers）功能

![[assets/feishu-freertos-source-analysis/img-061.jpg]]
- 作用：控制是否启用流缓冲区（Stream Buffers）功能。
  - 1 = 启用，可使用流缓冲区和消息缓冲区 API（如 xStreamBufferCreate、xMessageBufferCreate 等）。
  - 0 = 禁用，不使用流缓冲区功能（可节省内存）。
- 适用场景：需要高效传输字节流或离散消息时启用（如串口数据处理、任务间大数据块传输），相比队列更适合变长数据传输。

### 控制是否支持静态内存分配方式创建 FreeRTOS 对象

![[assets/feishu-freertos-source-analysis/img-062.jpg]]
- 作用：控制是否支持静态内存分配方式创建 FreeRTOS 对象（任务、队列、信号量等）。
  - 1 = 启用，可使用 \*\_CreateStatic 系列 API（如 xTaskCreateStatic、xQueueCreateStatic），内存由用户预分配（如全局数组）。
  - 0 = 禁用，仅支持动态分配。
- 优势：静态分配可消除内存碎片风险，内存使用更可预测（适用于对实时性要求高的场景）。

### 是否支持动态内存分配方式创建 FreeRTOS 对象

![[assets/feishu-freertos-source-analysis/img-063.jpg]]
- 作用：控制是否支持动态内存分配方式创建 FreeRTOS 对象。
  - 1 = 启用，可使用 \*\_Create 系列 API（如 xTaskCreate、xQueueCreate），内存由 FreeRTOS 内存分配器（pvPortMalloc）分配。
  - 0 = 禁用，仅支持静态分配。
- 优势：动态分配更灵活，无需预先确定内存大小，但可能产生内存碎片（需注意内存管理）。

### FreeRTOS 动态堆的总大小（动态分配）

![[assets/feishu-freertos-source-analysis/img-064.jpg]]
- `configTOTAL_HEAP_SIZE` 主要用于 `heap_1`、`heap_2`、`heap_4` 的内核堆数组；`heap_3` 使用 C 库堆，`heap_5` 的总容量由 `vPortDefineHeapRegions()` 提供的区域决定。
- 影响：
  - 对适用的分配器，堆大小决定可动态创建对象的内存上限。
  - 值过小可能导致 `pvPortMalloc()` 失败；值过大则会占用过多 RAM。

### 堆内存是否由应用程序预分配

![[assets/feishu-freertos-source-analysis/img-065.jpg]]
- 对 `heap_1`、`heap_2`、`heap_4`，`configAPPLICATION_ALLOCATED_HEAP == 1` 表示应用提供名为 `ucHeap` 的堆数组；为 0 时由该 `heap_x.c` 定义数组。
- 对 `heap_5`，应用应通过 `vPortDefineHeapRegions()` 提供多个区域，不能用 `configAPPLICATION_ALLOCATED_HEAP` 的描述替代；`heap_3` 则依赖 C 库堆。

### 是否从独立堆分配任务栈（端口/特定配置相关）

![[assets/feishu-freertos-source-analysis/img-066.jpg]]
- 该选项只在支持它的 port/MPU 或特定内核配置中有效，不能当成所有 FreeRTOS 工程都具备的通用功能。
- 启用时任务栈由 port 规定的独立分配函数提供；否则通常与其他内核对象共用主堆。

### 是否启用释放清零等堆保护选项

![[assets/feishu-freertos-source-analysis/img-067.jpg]]
- 不同版本/分配器的宏含义不同。例如 `configHEAP_CLEAR_MEMORY_ON_FREE` 只在支持它的 `heap_4/heap_5` 实现中控制释放时清零，并不是通用的“在堆块前后添加保护区域”开关。
- 越界检测通常需要 MPU、调试分配器或应用层保护，不能仅靠释放清零实现。

### 内核中断的优先级（如 tick 中断）

![[assets/feishu-freertos-source-analysis/img-068.jpg]]
- 具体优先级值的含义取决于硬件平台的中断优先级机制（如 ARM Cortex-M 系列的优先级编号方式：0 通常为最高优先级）。
- 此值应与硬件平台的中断控制器配置匹配。

### 可安全调用 FreeRTOS API 的最高中断优先级 BASEPRI 寄存器

![[assets/feishu-freertos-source-analysis/img-069.jpg]]
- 影响：
  - 逻辑优先级高于阈值的中断（Cortex-M 中通常表现为库优先级数值更小）不能调用 FreeRTOS API，调用可能触发断言或破坏内核状态。
  - 逻辑优先级不高于阈值、且库优先级数值大于或等于阈值的中断，才可以调用 `FromISR` API（如 `xQueueSendFromISR()`）。
- 注意：
  - 不要用“比 `configKERNEL_INTERRUPT_PRIORITY` 更低”这种模糊表述直接配置它；应按目标 Cortex-M port 的硬件优先级编码计算，并保证 PendSV/SysTick 的配置和 `configMAX_SYSCALL_INTERRUPT_PRIORITY` 满足官方约束。

### 钩子函数

![[assets/feishu-freertos-source-analysis/img-070.jpg]]

#### 1. configUSE_IDLE_HOOK

- 值：0
- 作用：控制是否启用空闲任务钩子函数（Idle Task Hook）。
  - 0 = 禁用，不使用空闲任务钩子。
  - 1 = 启用，系统会在空闲任务执行时调用用户定义的 vApplicationIdleHook() 函数。
- 适用场景：可用于在系统空闲时执行低优先级任务（如电源管理、后台数据处理），但需确保钩子函数执行时间短，避免阻塞空闲任务。

#### 2. configUSE_TICK_HOOK

- 值：0
- 作用：控制是否启用 tick 中断钩子函数（Tick Hook）。
  - 0 = 禁用，不使用 tick 钩子。
  - 1 = 启用，系统会在每次 tick 中断时调用用户定义的 vApplicationTickHook() 函数。
- 注意：钩子函数在中断上下文执行，必须简短且无阻塞操作（如不调用 vTaskDelay、xQueueReceive 等）。

#### 3. configUSE_MALLOC_FAILED_HOOK

- 值：0
- 作用：控制是否启用内存分配失败钩子函数（Malloc Failed Hook）。
  - 0 = 禁用，内存分配失败时无特殊处理（pvPortMalloc 返回 NULL）。
  - 1 = 启用，内存分配失败时调用用户定义的 vApplicationMallocFailedHook() 函数。
- 适用场景：用于处理内存分配失败的情况（如记录错误、执行紧急恢复操作），增强系统稳定性。

#### 4. configUSE_DAEMON_TASK_STARTUP_HOOK

- 值：0
- 作用：控制是否启用守护任务启动钩子函数（Daemon Task Startup Hook）。
  - 0 = 禁用，不使用守护任务启动钩子。
  - 1 = 启用，系统会在定时器守护任务启动时调用用户定义的 vApplicationDaemonTaskStartupHook() 函数。
- 适用场景：可用于在系统初始化完成后（守护任务启动时）执行一次性初始化操作。

### 是否启用流缓冲区完成回调

![[assets/feishu-freertos-source-analysis/img-071.jpg]]
- 0 = 禁用，不使用流缓冲区完成回调。
- 1 = 启用，流缓冲区操作完成时可调用用户定义的回调函数。
- 适用场景：用于在流缓冲区数据处理完成时触发通知（如数据接收完成后唤醒处理任务），增强流缓冲区的灵活性。

### 栈溢出检测的级别

![[assets/feishu-freertos-source-analysis/img-072.jpg]]
- 0 = 禁用，不检测栈溢出（节省资源，适用于已验证栈大小的稳定场景）。
- 1 = 基本检测，仅检查任务栈的末尾单词是否被修改（简单但可能漏检）。
- 2 = 完整检测，在任务切换时检查栈的使用情况（更全面，但会增加系统开销）。
- 优势：启用可提前发现栈溢出问题（如任务栈大小不足），避免系统崩溃或异常行为。

### 是否生成任务运行时间统计信息

![[assets/feishu-freertos-source-analysis/img-073.jpg]]
- 0 = 禁用，不收集运行时间统计（节省资源）。
- 1 = 启用，系统会记录每个任务的 CPU 占用时间（需配合硬件定时器或计数器实现）。
- 适用场景：用于性能分析（如识别 CPU 密集型任务），需实现 portCONFIGURE\_TIMER\_FOR\_RUN\_TIME\_STATS 和 portGET\_RUN\_TIME\_COUNTER\_VALUE 宏。

### 是否启用跟踪功能

![[assets/feishu-freertos-source-analysis/img-074.jpg]]
- 0 = 禁用，不使用跟踪功能（节省资源）。
- 1 = 启用，系统会提供额外的结构体字段和函数，支持调试器查看任务状态。

### 是否启用统计信息格式化函数

![[assets/feishu-freertos-source-analysis/img-075.jpg]]
- 0 = 禁用，不提供格式化函数（节省代码空间）。
- 1 = 启用，提供函数将统计信息格式化为人类可读的字符串。

### 协程的最大优先级数量（不咋使用协程）

![[assets/feishu-freertos-source-analysis/img-076.jpg]]
- 协程优先级范围为 0 到 （configMAX\_CO\_ROUTINE\_PRIORITIES - 1），0 是最低优先级。

### 协程（Co-routines）的最大优先级数量

![[assets/feishu-freertos-source-analysis/img-077.jpg]]
- 作用：设置协程（Co-routines）的最大优先级数量（仅在 configUSE\_CO\_ROUTINES = 1 时有效）。
  - 协程可分配的优先级范围为 0 到 (configMAX\_CO\_ROUTINE\_PRIORITIES - 1)，其中 0 是最低优先级。
- 注意：
  - 协程是 FreeRTOS 早期提供的轻量级线程机制，与任务（Tasks）相比：
    - 优点：共享栈空间，内存占用更小（适用于内存受限的旧硬件）。
    - 缺点：调度机制更简单（基于协作式调度），功能不如任务丰富，现代应用中已较少使用。
  - 由于当前配置 configUSE\_CO\_ROUTINES = 0（协程功能已禁用），此配置项实际上未生效。

### 是否允许应用程序定义特权函数

![[assets/feishu-freertos-source-analysis/img-078.jpg]]
- 0 = 禁用，应用程序无法定义特权函数（所有应用代码在非特权模式下执行，增强安全性）。
- 1 = 启用，应用程序可定义特权函数（需通过特定机制调用）。

### 设置目标硬件实现的 MPU 区域数量

![[assets/feishu-freertos-source-analysis/img-079.jpg]]
- 作用：设置目标硬件实现的 MPU 区域数量（仅用于 FreeRTOS Cortex-M MPU 移植）。
  - 常见值为 8 或 16（取决于处理器型号，如 Cortex-M3/M4 通常有 8 个区域）。

### 配置 MPU 中 Flash 区域的 TEX/S/C/B 属性

仅适用于 Cortex-M MPU 移植。部分 Cortex-M7 器件实现了 MPU，但是否存在及区域数量应以具体 MCU 为准，不能仅凭“M7”一概而论。

![[assets/feishu-freertos-source-analysis/img-080.jpg]]
- 作用：覆盖 MPU 中 Flash 区域的 TEX、S（可共享）、C（可缓存）、B（可缓冲）位的默认值（仅用于 Cortex-M MPU 移植）。
  - 0x07UL = TEX=000， S=1， C=1， B=1（表示 Flash 区域可共享、可缓存、可缓冲）。

### 覆盖 MPU 中 RAM 区域的 TEX、S、C、B 位的默认值（仅用于 Cortex-M MPU 移植）

![[assets/feishu-freertos-source-analysis/img-081.jpg]]
- 作用：覆盖 MPU 中 RAM 区域的 TEX、S、C、B 位的默认值（仅用于 Cortex-M MPU 移植）。
  - 0x07UL = TEX=000， S=1， C=1， B=1（表示 RAM 区域可共享、可缓存、可缓冲）。

### 控制系统调用的权限提升来源

![[assets/feishu-freertos-source-analysis/img-082.jpg]]
- 作用：控制系统调用的权限提升来源（仅用于 Cortex-M MPU 移植）。
  - 0 = 禁止任何来自内核外部的权限提升（更安全）。
  - 1 = 允许应用任务提升权限（更灵活，但安全性降低）。

### 控制非特权任务是否可进入临界区

![[assets/feishu-freertos-source-analysis/img-083.jpg]]
- 作用：控制非特权任务是否可进入临界区（仅用于 Cortex-M MPU 移植）。
  - 0 = 禁止，非特权任务无法进入临界区（更安全，防止非特权任务屏蔽中断）。
  - 1 = 允许，非特权任务可进入临界区（更灵活）。

### 选择使用的 MPU 包装器版本（FreeRTOS 10.6.0+ 引入）

![[assets/feishu-freertos-source-analysis/img-084.jpg]]
- 0 = 使用新版本 v2 包装器（mpu\_wrappers\_v2.c，推荐）。
- 1 = 使用旧版本 v1 包装器（mpu\_wrappers.c）。

### 受保护内核对象池的大小（仅用于 v2 MPU 包装器）

![[assets/feishu-freertos-source-analysis/img-085.jpg]]
- 作用：设置受保护内核对象池的大小（仅用于 v2 MPU 包装器）。
  - 内核对象包括：任务、队列、信号量、互斥量、事件组、定时器、流缓冲区、消息缓冲区。
  - 此值限制了应用程序可同时存在的内核对象总数（超过则创建失败）。

### 系统调用栈的大小（仅用于 v2 MPU 包装器）

![[assets/feishu-freertos-source-analysis/img-086.jpg]]
- 每个任务都会静态分配一个此大小的内存缓冲区，作为执行系统调用时的栈。
- 例如：若 configSYSTEM\_CALL\_STACK\_SIZE = 128 且应用有 10 个任务，则系统调用栈总内存为 128 \* 10 = 1280 字（32 位系统下为 5120 字节）。
- 影响：
  - 值过小可能导致系统调用时栈溢出（如调用复杂的内核 API）。
  - 值过大则会增加内存占用（需根据系统调用的复杂度调整）。

### 控制是否启用访问控制列表（ACL）功能（仅用于 v2 MPU 包装器）

![[assets/feishu-freertos-source-analysis/img-087.jpg]]
- 1 = 启用，非特权任务默认仅能访问自身，无法访问其他内核对象（如队列、信号量等）。
- 0 = 禁用，非特权任务可访问所有内核对象。
- 优势：
  - 增强安全性，防止非特权任务意外或恶意访问其他任务的资源。
  - 应用需通过特定 API 显式授予非特权任务对所需内核对象的访问权限。

### 控制是否允许多优先级任务运行（SMP 相关）

![[assets/feishu-freertos-source-analysis/img-088.jpg]]
- 该项是较新 SMP 内核的配置语义，需与 `configRUN_MULTIPLE_PRIORITIES`、核心数和所选 port 一起理解；不能把 0 简化成“单核系统只有一个优先级”。
- 本地 STM32F103/FreeRTOS V9 单核工程不适用这一组 SMP 配置。

### 是否启用 SMP（多核）系统的核心亲和性功能

![[assets/feishu-freertos-source-analysis/img-089.jpg]]
- 0 = 禁用，调度器可在任何可用核心上运行任务（默认行为）。
- 1 = 启用，可通过 vTaskCoreAffinitySet/vTaskCoreAffinityGet API 控制任务在哪些核心上运行。
- 适用场景：仅在 configNUMBER\_OF\_CORES > 1（多核系统）时有效。

### 设置创建任务时未指定亲和性掩码的默认核心亲和性（仅用于 SMP 系统）

![[assets/feishu-freertos-source-analysis/img-090.jpg]]
- tskNO\_AFFINITY = 无特定亲和性，调度器可自由分配核心。
- 其他值（如 1 或 (1 << portGET\_CORE\_ID())）可限制任务在特定核心上运行。

### 控制是否允许 SMP 系统中单独禁用任务的抢占

![[assets/feishu-freertos-source-analysis/img-091.jpg]]
- 0 = 禁用，所有任务保持默认调度策略。
- 1 = 启用，可通过 vTaskPreemptionDisable/vTaskPreemptionEnable API 控制单个任务的抢占模式（抢占式/协作式）。

### 控制是否启用 SMP 系统的被动空闲钩子函数

![[assets/feishu-freertos-source-analysis/img-092.jpg]]
- 0 = 禁用，不使用被动空闲钩子。
- 1 = 启用，可在被动空闲任务中添加后台功能（无需单独创建任务）。

### 设置定时器守护任务的核心亲和性（仅用于 SMP 系统）

![[assets/feishu-freertos-source-analysis/img-093.jpg]]

设置定时器守护任务的核心亲和性（仅用于 SMP 系统）。

- tskNO\_AFFINITY = 无特定亲和性，调度器可自由分配核心。

### 设置 ARMv8-M 芯片中可调用安全侧（Secure Side）的最大任务数

![[assets/feishu-freertos-source-analysis/img-094.jpg]]
- 仅用于 ARMv8-M 架构的 FreeRTOS 移植（支持 TrustZone 安全扩展）。
- 安全上下文用于管理非安全任务对安全资源的访问。

### 是否由内核提供 Idle/Timer 的静态内存（V11.1.0/特定 port）

![[assets/feishu-freertos-source-analysis/img-095.jpg]]
- 这不是 `configSUPPORT_STATIC_ALLOCATION` 的同义词。`configSUPPORT_STATIC_ALLOCATION == 1` 只是开放 `*_CreateStatic()` 等静态创建 API。
- V11.1.0 的 `configKERNEL_PROVIDED_STATIC_MEMORY == 1` 可在支持的非 MPU 场景下由内核提供 Idle/Timer 任务的静态内存；为 0 或不支持该机制时，应用通常需要实现 `vApplicationGetIdleTaskMemory()` 和 `vApplicationGetTimerTaskMemory()`。
- 具体行为还受 port、MPU 和是否启用软件定时器影响；本地 V9 工程应以其 `tasks.c` 和配置为准。

### 是否启用 ARMv8-M 端口的 TrustZone 支持

![[assets/feishu-freertos-source-analysis/img-096.jpg]]
- 1 = 启用，允许非安全侧的 FreeRTOS 任务调用安全侧导出的（非安全可调用）函数。
- 0 = 禁用，不使用 TrustZone 功能。
- 注意：当前示例同时设置了 `configRUN_FREERTOS_SECURE_ONLY = 1`，表示整个应用（包括调度器）都在安全侧运行；这是安全架构/端口的选择，不应推断为“硬件不支持禁用 TrustZone”。

### 控制是否仅在安全侧运行 FreeRTOS

![[assets/feishu-freertos-source-analysis/img-097.jpg]]
- 1 = 启用，整个应用（包括调度器）在安全侧运行，不访问非安全侧。
- 0 = 禁用，允许在非安全侧运行 FreeRTOS（配合 configENABLE\_TRUSTZONE = 1 使用）。
- 适用场景：当硬件不支持禁用 TrustZone，但应用不需要非安全侧功能时使用。

### 是否启用内存保护单元（MPU）

![[assets/feishu-freertos-source-analysis/img-098.jpg]]
- 1 = 启用，可设置内存区域的访问权限（如只读、只执行、无访问等），增强系统安全性。
- 0 = 禁用，不使用 MPU 功能（节省资源）。

### 是否启用浮点单元（FPU）

![[assets/feishu-freertos-source-analysis/img-099.jpg]]
- 1 = 启用端口对 FPU 上下文的支持；能否使用 `float/double` 还取决于 MCU 是否有 FPU、编译器选项和端口的寄存器保存策略。
- 0 = 不启用该端口支持。

### 是否启用 M 配置文件向量扩展（MVE）支持

![[assets/feishu-freertos-source-analysis/img-100.jpg]]
- 1 = 启用，支持向量处理指令（适用于 Cortex-M55 或 M85 架构）。
- 0 = 禁用，不使用 MVE 功能（适用于其他 Cortex-M 架构）。

### 是否启用中断处理函数安装检查

![[assets/feishu-freertos-source-analysis/img-101.jpg]]
- 1 = 启用，系统会通过断言验证应用是否正确安装了 FreeRTOS 所需的中断处理函数（如 vPortSVCHandler、xPortPendSVHandler）。
- 0 = 禁用，不进行检查（适用于使用间接路由方式安装中断处理函数的应用）。
- 中断处理函数安装方式：
  - 直接路由：直接安装 vPortSVCHandler 和 xPortPendSVHandler 作为 SVC 和 PendSV 中断的处理函数。
  - 间接路由：安装自定义处理函数，再在其中调用 vPortSVCHandler 和 xPortPendSVHandler（需将此配置设为 0）。

### 功能启用/禁用配置（互斥量 任务通知等）

![[assets/feishu-freertos-source-analysis/img-102.jpg]]

#### 1. configUSE_TASK_NOTIFICATIONS

- 值：1
- 作用：控制是否启用任务通知功能。
  - 1 = 启用；通知直接存放在任务控制块中，适合一对一或明确接收者的同步/计数/位操作。
  - 0 = 禁用。
- 限制：任务通知不能像事件组那样让一个任务等待多个独立对象的组合；通知数组和可用 API 取决于内核版本。

#### 2. configUSE_MUTEXES

- 值：1
- 作用：控制是否启用互斥量（Mutex）功能。
  - 1 = 启用，可使用 xSemaphoreCreateMutex 创建互斥量（用于资源独占访问）。
  - 0 = 禁用，不使用互斥量。

#### 3. configUSE_RECURSIVE_MUTEXES

- 值：1
- 作用：控制是否启用递归互斥量功能。
  - 1 = 启用，可使用 xSemaphoreCreateRecursiveMutex 创建递归互斥量（允许同一任务多次获取同一互斥量，需对应次数释放）。
  - 0 = 禁用，不使用递归互斥量。
- 适用场景：同一任务确实需要在嵌套调用中重复获取同一个递归互斥量，并按获取次数对应释放；它不是普通互斥量的通用替代品。

#### 4. configUSE_COUNTING_SEMAPHORES

- 值：1
- 作用：控制是否启用计数信号量功能。
  - 1 = 启用，可使用 xSemaphoreCreateCounting 创建计数信号量（用于资源池管理或事件计数）。
  - 0 = 禁用，不使用计数信号量。

#### 5. configUSE_QUEUE_SETS

- 值：示例为 0；本地 V9 工程 `FreeRTOSConfig.h` 为 1。
- 作用：控制是否启用队列集（Queue Sets）功能。
  - 0 = 禁用，不使用队列集。
  - 1 = 启用，可使用 `xQueueCreateSet()` 等 API 同时等待多个队列/信号量对象。

#### 6. configUSE_APPLICATION_TASK_TAG

- 值：0
- 作用：控制是否启用任务标签（Task Tag）功能。
  - 0 = 禁用，不使用任务标签。
  - 1 = 启用，可通过 vTaskSetApplicationTaskTag 为任务设置标签（用于任务识别或扩展功能）。

### API 函数包含控制

![[assets/feishu-freertos-source-analysis/img-103.jpg]]

> [!note] 示例值与本地 V9 配置
> 下面的编号沿用原文示例，不代表一份完整的 V9 配置清单。当前本地 V9 工程还定义了 `INCLUDE_vTaskCleanUpResources = 1`，而 `INCLUDE_xTaskResumeFromISR` 可由 `FreeRTOS.h` 的默认值补为 1；遇到具体 API 时应以目标工程的预处理结果为准。

#### INCLUDE_vTaskPrioritySet = 1

- 作用：包含 vTaskPrioritySet 函数（用于动态修改任务优先级）。

#### 2. INCLUDE_uxTaskPriorityGet = 1

- 作用：包含 uxTaskPriorityGet 函数（用于获取任务当前优先级）。

#### 3. INCLUDE_vTaskDelete = 1

- 作用：包含 vTaskDelete 函数（用于删除任务）。

#### 4. INCLUDE_vTaskSuspend = 1

- 作用：包含 vTaskSuspend 函数（用于挂起任务）。

#### 5. INCLUDE_xTaskResumeFromISR = 1

- 作用：包含 `xTaskResumeFromISR()` 函数（用于在中断中恢复任务）；`INCLUDE_xResumeFromISR` 不是这里应使用的通用宏名。

#### 6. INCLUDE_vTaskDelayUntil = 1

- 作用：包含 vTaskDelayUntil 函数（用于实现固定频率的周期性任务）。

#### 7. INCLUDE_vTaskDelay = 1

- 作用：包含 vTaskDelay 函数（用于任务延时）。

#### 8. INCLUDE_xTaskGetSchedulerState = 1

- 作用：包含 xTaskGetSchedulerState 函数（用于获取调度器状态，如运行/挂起）。

#### 9. INCLUDE_xTaskGetCurrentTaskHandle = 1

- 作用：包含 xTaskGetCurrentTaskHandle 函数（用于获取当前任务的句柄）。

#### 10. INCLUDE_uxTaskGetStackHighWaterMark = 0

- 作用：不包含 uxTaskGetStackHighWaterMark 函数（用于获取任务栈的历史最小剩余空间，即“高水位线”）。

#### 11. INCLUDE_xTaskGetIdleTaskHandle = 0

- 作用：不包含 xTaskGetIdleTaskHandle 函数（用于获取空闲任务的句柄）。

#### 12. INCLUDE_eTaskGetState = 0

- 作用：不包含 eTaskGetState 函数（用于获取任务的当前状态）。

#### 13. 事件组 ISR API 的条件（版本相关）

- 应使用实际版本提供的 `xEventGroupSetBitsFromISR()` 名称；不同版本还可能要求事件组、跟踪设施和定时器函数调用配置，不能用不存在的单数宏 `INCLUDE_xEventGroupSetBitFromISR` 一概判断。

#### 14. INCLUDE_xTimerPendFunctionCall

- 示例值为 0；本地 V9 工程为 1。该配置控制是否包含通过定时器守护任务执行延后函数调用的 API；事件组的 `FromISR` 置位/清位在经典实现中依赖这条路径。

#### 15. INCLUDE_xTaskAbortDelay = 0

- 作用：不包含 xTaskAbortDelay 函数（用于终止任务的延时状态）。

#### 16. INCLUDE_xTaskGetHandle = 0

- 作用：不包含 xTaskGetHandle 函数（用于通过任务名称获取任务句柄）。

#### 17. `INCLUDE_xTaskResumeFromISR`（本地 V9 默认由头文件补为 1）

- 作用：包含 `xTaskResumeFromISR()` 函数（用于在中断中恢复任务）。该 API 还要求 `INCLUDE_vTaskSuspend == 1`；具体默认值以目标工程的 `FreeRTOSConfig.h` 和 `FreeRTOS.h` 为准。

### 第一章 `list.c`

> 🌈
>
> FreeRTOS 最基础的双向链表实现，用于任务调度、队列、定时器等几乎所有核心模块就在 list.c 中。
>
> 重点理解：
>
> - List\_t结构体（列表控制块）和ListItem\_t结构体（列表项）的设计
>
> - 插入（vListInsert）、移除（uxListRemove）、遍历等核心操作
>
> - 环形链表+哨兵节点的设计思想（简化边界条件处理）

#### 数据结构总览

![[assets/feishu-freertos-source-analysis/img-104.jpg]]

先看下面的结构图，理清三种结构之间的包含关系：

> 🌈
>
> List\_t（一个名单）
>
> ├─ xListEnd （名单末尾的“假人”，永远站最后）
>
> ├─ pxIndex （当前翻到哪一页，很重要）
>
> ├─ uxNumberOfItems（名单里有多少真人）
>
> └─ ListItem\_t （名单里的每一个人）
>
> └─ pvOwner（这个人真正代表谁：任务 TCB）

##### ListItem_t：名单里“每一个人”

```c
struct xLIST_ITEM
{
    TickType_t xItemValue;             // 延时/事件链表常用唤醒值；就绪链表通常使用固定值
    ListItem_t * pxNext;               // 指向下一个成员
    ListItem_t * pxPrevious;           // 指向上一个成员
    void * pvOwner;                    // 通常指向拥有该 ListItem 的 TCB
    struct xLIST * pvContainer;         // 当前所属的 List_t；未加入链表时为 NULL
};
```

##### MiniListItem_t：假人（哨兵）

用来站在队伍最后，占个位置，所以它没有 void * pvOwner; 和 struct xLIST * pxContainer;  能不能理解？

```c
struct xMINI_LIST_ITEM
{
    TickType_t xItemValue;
    ListItem_t * pxNext;
    ListItem_t * pxPrevious;
};
```

##### List_t：整张“名单”

```c
typedef struct xLIST
{
    UBaseType_t uxNumberOfItems;
    ListItem_t * pxIndex;                                    //这是调度器级设计精华。
    MiniListItem_t xListEnd;                                //永远站最后的假人，每个 List_t 自带一个，不算任务
} List_t;
```

##### 具体怎么使用？

> 🌈
>
> 任务创建时
>
> 1.
>
> 创建 TCB
>
> 2.
>
> TCB 里有 ListItem\_t
>
> 3.
>
> pvOwner = TCB
>
> 4.
>
> 插入就绪链表 List\_t

![[assets/feishu-freertos-source-analysis/img-105.jpg]]

##### FreeRTOS 链表永远是“闭环”的，也就是我们所说的双向链表

![[assets/feishu-freertos-source-analysis/img-106.jpg]]

> 🌈
>
> 调度器选任务时
>
> - 从 List\_t 中：listGET\_OWNER\_OF\_NEXT\_ENTRY()
>
> - 利用 pxIndex 找下一个
>
> - 通过 pvOwner 找到 TCB
>
> - 切换任务

##### pxIndex 如何实现“时间片轮转”（核心）

```c
pxIndex = pxIndex->pxNext;
return pxIndex->pvOwner;
```

![[assets/feishu-freertos-source-analysis/img-107.jpg]]

##### 任务在不同 List_t 之间“切换”的流程图

对应到 List 操作其实只有两种：（链表是核心数据结构，但完整调度还包括 Tick、优先级选择、阻塞/唤醒和端口上下文切换）

- uxListRemove()
- vListInsert()
- 本质上就是把任务的 TCB 里面的状态 Item 和事件 Item 进行更改，比如我想延时任务 A，实际上是我把任务 A 的 TCB 的状态由就绪链表移动到了延时链表。
![[assets/feishu-freertos-source-analysis/img-108.jpg]]

#### 重要函数

下面五个函数构成 `list.c` 最核心的初始化、插入和移除操作。

##### `vListInitialise()`：初始化空链表

![[assets/feishu-freertos-source-analysis/img-109.jpg]]

> 🌈
>
> 核心目的（一句话）
>
> 创建一个只有“哨兵节点”的循环双向链表
>
> 1️⃣ 一开始只有 xListEnd，没有任何任务
>
> 2️⃣ pxIndex = &xListEnd（为轮转做准备）
>
> 3️⃣ xListEnd 前后指针都指向自己（闭环）
>
> 4️⃣ uxNumberOfItems = 0
>
> 这是后面所有 O（1） 操作的基础

![[assets/feishu-freertos-source-analysis/img-110.jpg]]

链表初始化之后的结构

##### `vListInitialiseItem()`：初始化链表项

![[assets/feishu-freertos-source-analysis/img-111.jpg]]

> 🌈
>
> 为什么必须有这个函数？
>
> - 防止：
>
>   - 重复插入
>
>   - 野指针删除
>
> - uxListRemove() 完全依赖 pxContainer

![[assets/feishu-freertos-source-analysis/img-112.jpg]]

##### `vListInsertEnd()`：在 `pxIndex` 前插入节点

![[assets/feishu-freertos-source-analysis/img-113.jpg]]

> 🌈
>
> 典型用途
>
> - ReadyList（同优先级任务）
>
> - 不关心 xItemValue，只关心轮转顺序
>
> 为什么“插在 pxIndex 前面”？
>
> FreeRTOS 的实现让新节点位于当前索引之前；之后通过 `listGET_OWNER_OF_NEXT_ENTRY()` 移动 `pxIndex`，从而实现同优先级任务的轮换。具体“最后一个被轮转到”的顺序应结合当前 `pxIndex` 验证，不能把它简单等同于普通链表尾插。
>
> - 不抢 CPU
>
> - 公平
>
> - 行为可预测

![[assets/feishu-freertos-source-analysis/img-114.jpg]]

##### `vListInsert()`：按 `xItemValue` 排序插入

![[assets/feishu-freertos-source-analysis/img-115.jpg]]

![[assets/feishu-freertos-source-analysis/img-116.jpg]]

> 🌈
>
> 核心用途
>
> - 延时链表（Tick）
> - 定时器
> - 事件超时
>
> 关键设计点（非常重要）
>
> ✅ 相同 xItemValue：插在后面
> - 保证公平
> - FIFO 行为
>
> ✅ portMAX_DELAY 特判
> - 否则会一直比到 xListEnd
> - 这是典型的 RTOS 防死循环设计
>
> 📌 面试高频点：
>
> FreeRTOS 如何避免延时链表死循环？

##### `uxListRemove()`：O(1) 移除节点

![[assets/feishu-freertos-source-analysis/img-117.jpg]]

> 🌈
>
> 最容易忽略、但最关键的一步
>
> ```c
> if( pxList->pxIndex == pxItemToRemove )
> {
>     pxList->pxIndex = pxItemToRemove->pxPrevious;
> }
> ```
>
> 为什么要这么做？
>
> 想象一下：
>
> - pxIndex 正指着某个任务
> - 这个任务被删除了
> - 下一次轮转会炸
>
> 👉 所以：
>
> pxIndex 永远不能指向“死人”
>
> 📌 这是 FreeRTOS 非常成熟的边界处理

![[assets/feishu-freertos-source-analysis/img-118.jpg]]

### 第二章 内存管理源码

链表是 FreeRTOS 的核心数据结构之一，但源码还共同处理 Tick、任务阻塞/唤醒、优先级选择、同步对象和上下文切换；不能把 RTOS 源码简单等同于链表操作。【C 语言 链表基础知识清晰讲解（黑马）】

> 🌈
>
> 总览
>
> - heap\_1.c：最简单的运行时动态分配器，使用静态数组作为内存池，只分配不释放，适合资源需求在启动阶段确定的场景。
>
> - heap\_2.c：基于最佳匹配的动态分配，不合并空闲块，适合频繁创建/删除相同大小任务的场景。
>
> - heap\_4.c：支持合并空闲块的动态分配，是最常用的方案。
>
> - heap\_5.c：支持多块不连续内存区域的动态分配，适合复杂硬件平台（如片内+外部 RAM 组合）。
>
> - 重点理解内存块的管理方式、空闲块链表的维护、分配/释放算法。

#### `heap_1`

线性分配、只增不减，是五种方案中实现最简单的一种。

![[assets/feishu-freertos-source-analysis/img-119.jpg]]

#### heap_1 内存分配方案的特点

1. 简单高效：实现非常简单，内存分配速度快
1. 不支持释放：运行时分配后无法释放；底层内存池是静态数组，但对象本身仍通过 `pvPortMalloc()` 动态创建。
1. 内存碎片：由于不支持释放，不会产生内存碎片
1. 内存保护：使用任务调度挂起确保多任务环境下的安全
1. 内存对齐：保证分配的内存块按要求对齐

#### 适用场景

heap\_1 适用于以下场景：

- 仅在系统启动时分配内存，运行过程中不需要释放
- 内存需求固定，不会动态变化
- 对内存分配速度要求较高
- 资源受限的嵌入式系统

#### 源码解析：

##### 1. 定义 8 字节对齐

内存对齐可满足处理器和 ABI 的访问要求，并通常有利于访问效率；实际对齐值由目标 port 决定。

![[assets/feishu-freertos-source-analysis/img-120.jpg]]

##### 2.有同学会问了，为什么要用掩码？

> 🌈
>
> - 计算方法：portBYTE\_ALIGNMENT\_MASK = portBYTE\_ALIGNMENT - 1
>
>   - 当 portBYTE\_ALIGNMENT = 8 时，portBYTE\_ALIGNMENT\_MASK = 8 - 1 = 7（十六进制 0x0007）
>
> - 二进制表示：8 字节对齐时，掩码是 00000111（二进制）

![[assets/feishu-freertos-source-analysis/img-121.jpg]]

工作原理：

- 如果 xWantedSize 是对齐值的整数倍，那么其二进制表示的低几位一定是 0
- 例如，8 字节对齐时，portBYTE\_ALIGNMENT\_MASK 是 00000111
- 8 的整数倍（如 8、16、24）的二进制低 3 位都是 0
- 非 8 整数倍（如 9、10、11）的二进制低 3 位至少有一个 1
- 按位与运算后，如果结果非 0，说明需要对齐；如果结果为 0，说明已经对齐

##### 3.然后如果我需要对齐的话就会

- xWantedSize & portBYTE\_ALIGNMENT\_MASK：计算当前大小与对齐值的余数
- portBYTE\_ALIGNMENT - 余数：需要补充的字节数，使总大小成为对齐值的整数倍
- 如果溢出，标记请求为无效（xWantedSize = 0）
![[assets/feishu-freertos-source-analysis/img-122.jpg]]

##### 4.进行内存分配

前置条件：

> 🌈
>
> 为什么需要挂起任务调度？
>
> 在多任务环境下，多个任务可能同时调用 pvPortMalloc。如果不进行保护，可能会出现以下问题：
>
> - 任务 A 和任务 B 同时检查到有足够内存
> - 任务 A 先分配内存，更新了 xNextFreeByte
> - 任务 B 不知道 xNextFreeByte 已经被更新，使用旧值分配内存
> - 结果导致内存重叠，程序崩溃
>
> 原子操作的实现
>
> - vTaskSuspendAll()：挂起所有任务调度器，当前任务可以继续执行，但不会发生任务切换
> - xTaskResumeAll()：恢复任务调度器；若恢复过程中产生了需要的调度，返回值会反映是否已经发生切换，具体还受抢占配置和端口影响。
>
> 这种方式确保了内存分配的原子性（要么全部完成，要么全部不完成）。
>
> 为什么需要堆起始地址对齐？
>
> ucHeap 是实际分配的堆数组，但它的起始地址可能不满足对齐要求。例如：
>
> - 假设 ucHeap 的实际地址是 0x20000001（1 字节对齐）
>
> - 但我们需要 8 字节对齐（地址必须是 8 的倍数）
> - 需要将起始地址调整为 0x20000008
>
> 计算过程：C 语言的基础操作！
>
> ```cpp
> #define portPOINTER_SIZE_TYPE    uint32_t
> ```
>
> 1. &ucHeap[portBYTE_ALIGNMENT - 1] = &ucHeap[7] = 0x20000001 + 7 = 0x20000008
> 2. ~portBYTE_ALIGNMENT_MASK = ~7 = 二进制 ...11111000（掩码反码）
> 3. 0x20000008 & ...11111000 = 0x20000008（已经对齐）
>
> 另一个例子（如果 ucHeap 地址是 0x20000005）：
>
> 1. &ucHeap[7] = 0x20000005 + 7 = 0x2000000C
> 2. 0x2000000C & ...11111000 = 0x20000008（向下对齐到最近的 8 字节边界）
>
> 条件 1：请求大小有效
>
> - 确保 xWantedSize > 0，防止分配 0 字节内存
>
> - 如果之前的对齐操作导致溢出，xWantedSize 会被设为 0，这里会被过滤掉
>
> 条件 2：足够的堆空间
>
> - xNextFreeByte：下一个可分配的空闲字节索引
>
> - xNextFreeByte + xWantedSize：分配后新的空闲字节索引
>
> - configADJUSTED\_HEAP\_SIZE：调整后的堆总大小（考虑了对齐损失）
>
> - 确保分配后不会超出堆的边界
>
> 条件 3：防止整数溢出
>
> - 与之前的溢出检查原理相同
>
> - 确保 xNextFreeByte + xWantedSize 不会溢出（回绕）
>
> - 如果溢出，xNextFreeByte + xWantedSize 会小于 xNextFreeByte

##### 内存分配的实际执行

![[assets/feishu-freertos-source-analysis/img-123.jpg]]

> 🌈
>
> 分配过程
>
> 1.
>
> pucAlignedHeap + xNextFreeByte：计算分配内存块的起始地址
>
> 2.
>
> 将这个地址赋值给 pvReturn，作为函数返回值
>
> 3.
>
> 更新 xNextFreeByte：将其增加 xWantedSize，指向下一个可分配的空闲位置
>
> 例如：
>
> - pucAlignedHeap = 0x20000008
>
> - xNextFreeByte = 0
>
> - xWantedSize = 32（已经对齐）
>
> - 分配的地址：0x20000008 + 0 = 0x20000008
>
> - 更新后 xNextFreeByte = 32

##### 5.源码带注释：

![[assets/feishu-freertos-source-analysis/img-124.jpg]]

```cpp
/**
 * @brief FreeRTOS heap_1 内存分配方案的核心函数
 * @param xWantedSize 请求分配的内存大小（字节）
 * @return 成功返回指向分配内存的指针，失败返回 NULL
 * @note heap_1 是最简单的内存分配实现，不支持内存释放，适用于仅在系统启动时分配内存的场景
 */
void * pvPortMalloc( size_t xWantedSize )
{
    void * pvReturn = NULL;                     /* 用于返回的指针，初始化为 NULL */
    static uint8_t * pucAlignedHeap = NULL;     /* 指向对齐后的堆起始地址的静态指针 */

    /* 确保分配的内存块总是按要求对齐 */
    #if ( portBYTE_ALIGNMENT != 1 )
    {
        /* 检查请求的大小是否需要对齐（如果大小不是对齐值的整数倍） */
        if( xWantedSize & portBYTE_ALIGNMENT_MASK ){
            /* 需要字节对齐，首先检查对齐操作是否会导致溢出 */
            if( ( xWantedSize + ( portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK ) ) ) > xWantedSize ){
                /* 计算并调整为对齐所需的大小 */
                xWantedSize += ( portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK ) );
            }
            else{
                /* 对齐操作会导致溢出，将请求大小设为 0，表示无效 */
                xWantedSize = 0;
            }
        }
    }
    #endif /* if ( portBYTE_ALIGNMENT != 1 ) */

    /* 挂起所有任务调度，确保内存分配是原子操作 */
    vTaskSuspendAll();
    {
        /* 首次调用时，初始化对齐后的堆起始地址 */
        if( pucAlignedHeap == NULL ){
            /* 将堆起始地址调整到正确的对齐边界上
             * 1. &ucHeap[ portBYTE_ALIGNMENT - 1 ]: 获取堆数组偏移后的地址
             * 2. ~(portBYTE_ALIGNMENT_MASK): 创建对齐掩码的反码
             * 3. 使用 & 操作将地址向下对齐到对齐边界 */
            pucAlignedHeap = ( uint8_t * ) ( ( ( portPOINTER_SIZE_TYPE ) &ucHeap[ portBYTE_ALIGNMENT - 1 ] ) & ( ~( ( portPOINTER_SIZE_TYPE ) portBYTE_ALIGNMENT_MASK ) ) );
        }

        /* 检查是否满足分配条件：
         * 1. 请求大小有效（大于 0）
         * 2. 堆中有足够的空间（当前空闲位置 + 请求大小 < 调整后的堆总大小）
         * 3. 不会发生整数溢出（防止内存越界） */
        if( ( xWantedSize > 0 ) &&                                /* 条件1: 有效大小 */
            ( ( xNextFreeByte + xWantedSize ) < configADJUSTED_HEAP_SIZE ) &&  /* 条件2: 足够空间 */
            ( ( xNextFreeByte + xWantedSize ) > xNextFreeByte ) ) /* 条件3: 无溢出 */
        {
            /* 分配内存：返回当前空闲字节的地址 */
            pvReturn = pucAlignedHeap + xNextFreeByte;
            /* 更新下一个空闲字节的索引 */
            xNextFreeByte += xWantedSize;
        }

        /* 调用内存分配跟踪宏（用于调试和性能分析） */
        traceMALLOC( pvReturn, xWantedSize );
    }
    /* 恢复任务调度 */
    ( void ) xTaskResumeAll();

    /* 如果配置了内存分配失败钩子，则在分配失败时调用 */
    #if ( configUSE_MALLOC_FAILED_HOOK == 1 )
    {
        if( pvReturn == NULL )
        {
            /* 调用应用程序定义的内存分配失败处理函数 */
            vApplicationMallocFailedHook();
        }
    }
    #endif

    /* 返回分配结果 */
    return pvReturn;
}
```

#### `heap_2`（最佳适配算法）

空闲块按大小组织，支持释放但不合并相邻块，因此长期运行可能产生碎片。

![[assets/feishu-freertos-source-analysis/img-125.jpg]]

![[assets/feishu-freertos-source-analysis/img-126.jpg]]

#### heap_2 内存分配方案的特点

- 支持内存释放：与 heap\_1 不同，允许动态释放已分配的内存块
- 最佳适配算法：空闲块按大小排序，优先分配刚好满足需求的最小块，提高内存利用率
- 块拆分机制：若找到的空闲块大于请求大小，会自动拆分为两部分，剩余部分重新加入空闲链表
- 内存碎片问题：不会合并相邻空闲块，频繁分配释放可能产生内存碎片
- 内存对齐：保证分配的内存块按硬件要求对齐，提高访问效率
- 多任务安全：使用任务调度挂起机制确保内存分配过程的原子性
- 空闲链表管理：空闲块通过链表有序组织，便于快速查找和插入

#### 适用场景

heap\_2 适用于以下场景：

- 需要频繁分配和释放内存的动态应用场景
- 内存分配大小变化较大但不会产生严重碎片的系统
- 对内存分配算法效率有一定要求的嵌入式系统
- 资源相对充足，能够容忍一定程度内存碎片的应用
- 开发调试阶段需要动态内存管理的项目

#### 源码解析：

##### 1.首先你要看明白一个数据结构！

> 🌈
>
> - pxNextFreeBlock：链表指针，指向下一个空闲内存块的地址
>
>   - 将所有空闲块组织成一个单向链表
>
>   - 链表按块大小排序（从小到大）
>
> - xBlockSize：块大小，记录当前内存块的总大小
>
>   - 包含 BlockLink\_t 结构体本身的大小
>
>   - 包含实际可用内存的大小
>
>   - 最高位用于标记块的分配状态（0=空闲，1=已分配）

##### 2.heap2 分配内存的结果变量

![[assets/feishu-freertos-source-analysis/img-127.jpg]]

> 🌈
>
> 变量作用：一定要理解
>
> - pxBlock：当前块指针
>
>   - 遍历空闲链表时，指向正在检查的空闲块
>
>   - 用于查找满足大小要求的空闲块
>
> - pxPreviousBlock：前一个块指针
>
>   - 指向当前遍历块的前一个空闲块
>
>   - 用于维护链表结构，便于插入/删除操作
>
> - pxNewBlockLink：新块指针
>
>   - 当找到的空闲块大于请求大小时，用于指向拆分后剩余的新空闲块
>
>   - 拆分后，新块会被重新加入空闲链表
>
> - pvReturn：返回指针
>
>   - 指向实际分配给应用程序使用的内存地址
>
>   - 跳过 BlockLink\_t 结构体（用户不需要直接访问管理信息）
>
> - xAdditionalRequiredSize：对齐额外空间
>
>   - 计算内存对齐所需的额外字节数
>
>   - 确保分配的内存块满足硬件要求的对齐边界（如 8 字节对齐）

##### 3. 内存分配前处理逻辑

1. 检查是否需要对齐：通过按位与运算判断当前大小是否满足对齐要求
1. 计算对齐所需额外空间：如果需要对齐，计算需要添加的字节数
1. 检查溢出：确保对齐后的大小不会超过size\_t的最大值
1. 执行对齐调整：如果安全，调整请求大小以满足对齐要求
1. 处理异常情况：如果发生溢出，标记请求无效
![[assets/feishu-freertos-source-analysis/img-128.jpg]]

> 🌈
>
> - 调整后：xWantedSize = 16（8 字节对齐）
>
> xWantedSize 为什么这样处理：
>
> - 防止分配过大的内存块导致系统错误
>
> - 简化错误处理逻辑，统一通过检查xWantedSize是否为 0 来判断分配是否失败

> 内存分配条件检查
>
> 注意要大于 0，分配 0 字节没有实际意义，反而可能导致内存管理混乱
>
> 🌈
>
> 为什么这样实现：
>
> - 直接计算 a + b 可能导致实际溢出，产生不可预测的结果
> - 使用“最大可表示的 `size_t` 值减去 `b`”可以在不先执行加法的情况下进行安全检查；具体源码可能通过版本相关的宏封装该判断。
>
> 🌈
>
> 添加块管理结构的大小：xWantedSize += xHeapStructSize；
>
> ```cpp
> static const size_t xHeapStructSize = ( ( sizeof( BlockLink_t ) + ( size_t ) ( portBYTE_ALIGNMENT - 1 ) ) & ~( ( size_t ) portBYTE_ALIGNMENT_MASK ) );
> ```
>
> 看懂这个需要一点点 C 语言功底了～
>
> - sizeof( BlockLink_t ) = 在 32 位系统上，原始大小为 4 + 4 = 8 字节；
> - ( size_t ) ( portBYTE_ALIGNMENT - 1 )：对齐偏移量，用于确保后续计算能覆盖对齐所需的额外空间，8 - 1 = 7 字节；
> - ~( ( size_t ) portBYTE_ALIGNMENT_MASK )：对齐掩码的按位取反，用于清除低 N 位实现对齐；因为 portBYTE_ALIGNMENT_MASK = 7（0x00000111），取反后为 0xFFFFFFF8（高 29 位为 1，低 3 位为 0）。

> 🌈
>
> OK 了，拆开看是不是好多了？下面是数学原理
>
> - 当 `N` 是 2 的幂时，将值 `x` 向上对齐到 `N` 字节边界的公式是：`(x + (N - 1)) & ~(N - 1)`。
> - 这个公式确保结果是 N 的整数倍，且最接近且大于等于 x
>
> 具体计算步骤（portBYTE_ALIGNMENT=8）
>
> 1. 获取原始大小：x = sizeof(BlockLink_t)
> 2. 添加偏移量：x + 7（确保能覆盖对齐所需的额外空间）
> 3. 清除低 3 位：(x + 7) & 0xFFFFFFF8（实现 8 字节对齐）

> 内存对齐检查，并且计算对齐所需额外空间，检查对齐操作是否会导致溢出
>
> 🌈
>
> 内存对齐检查工作原理：
>
> - xWantedSize & portBYTE_ALIGNMENT_MASK：获取 xWantedSize 的低 N 位（N 为对齐掩码的位数，这里是 3 位）
> - 如果结果不等于 0，表示 xWantedSize 不是 portBYTE_ALIGNMENT 的整数倍，需要进行对齐处理
> - 如果结果等于 0，表示已经对齐，无需处理

> 示例：
>
> - 假设 xWantedSize = 10（二进制：1010）
> - 10 & 7 = 2（二进制：1010 & 0111 = 0010），结果不为 0，需要对齐
> - 假设 xWantedSize = 16（二进制：10000）
> - 16 & 7 = 0，结果为 0，已经对齐

> 计算对齐所需额外空间示例：
>
> - xWantedSize = 10，余数 = 2
> - 额外空间 = 8 - 2 = 6
> - 对齐后大小：10 + 6 = 16（8 的整数倍）

> 🌈
>
> 检查对齐操作是否会导致溢出
>
> 为什么需要溢出检查：
>
> - 如果 `xWantedSize` 已经接近 `SIZE_MAX`（或目标版本定义的等价上限），添加对齐字节可能导致溢出
> - 溢出会导致 xWantedSize 变为一个很小的值（无符号整数溢出回绕）
> - 这会造成严重的内存分配错误，甚至系统崩溃

> 示例（溢出情况）：
>
> - 假设 `SIZE_MAX = 0xFFFFFFFF`（32 位 `size_t`）
> - xWantedSize = 0xFFFFFFFE（仅比最大值小 2）
> - xAdditionalRequiredSize = 6
> - 计算：0xFFFFFFFE > (0xFFFFFFFF - 6) → 0xFFFFFFFE > 0xFFFFFFF9 → 结果为 1，表示会溢出

> 执行内存对齐调整示例：
>
> - xWantedSize = 10，xAdditionalRequiredSize = 6（这个 xAdditionalRequiredSize 是前面计算得到的）
> - 调整后：xWantedSize = 16（8 字节对齐）

##### 4.实际分配过程

> 🌈
>
> 1. 挂起 FreeRTOS 的任务调度器
>
> ```c
> vTaskSuspendAll();
>
> if( xHeapHasBeenInitialised == pdFALSE )
> {
>     prvHeapInit();                         /* 初始化堆 */
>     xHeapHasBeenInitialised = pdTRUE;      /* 标记堆已初始化 */
> }
> ```
>
> - xHeapHasBeenInitialised是一个全局变量，用于标记堆是否已初始化
>
> - pdFALSE是 FreeRTOS 定义的布尔值，表示"假"
>
> - 如果是第一次调用pvPortMalloc，堆尚未初始化，需要调用prvHeapInit()进行初始化
>
> - 初始化完成后，将标记设置为pdTRUE，避免重复初始化
>
> 3. 块大小有效性检查
>
> if( heapBLOCK\_SIZE\_IS\_VALID( xWantedSize )!= 0 )
>
> - heapBLOCK\_SIZE\_IS\_VALID是一个宏，用于检查块大小是否有效
>
> - 实现：#define heapBLOCK\_SIZE\_IS\_VALID( xBlockSize ) ( ( ( xBlockSize ) & heapBLOCK\_ALLOCATED\_BITMASK ) == 0 )
>
> - heapBLOCK\_ALLOCATED\_BITMASK是块大小的最高位，用于标记块是否已分配
>
> - 如果xWantedSize的最高位为 0，表示这是一个有效的空闲块大小
>
> - 如果最高位为 1，表示该大小无效（已经被用作分配标记）
>
> 4. 请求大小和可用空间检查
>
> if( ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining ) )
>
> - 第一个条件：xWantedSize > 0确保请求的内存大小有效（非零）
>
> - 第二个条件：xWantedSize <= xFreeBytesRemaining确保堆中有足够的空闲空间

> 5. 最佳适配算法查找空闲块
>
> ```cpp
> pxPreviousBlock = &xStart;        /* 从链表头开始 */
> pxBlock = xStart.pxNextFreeBlock;  /* 获取第一个空闲块 */
> ```
>
> - xStart 是空闲块链表的头节点，不存储实际内存块
> - pxPreviousBlock 和 pxBlock 是遍历链表的指针
> - 空闲块链表按块大小升序排列，便于实现最佳适配算法（Best Fit）
> - 最佳适配算法的目标是找到刚好足够大的空闲块，减少内存浪费
>
> ```cpp
> /* 遍历空闲块链表，直到找到足够大的块或到达链表末尾 */
> while( ( pxBlock->xBlockSize < xWantedSize ) && ( pxBlock->pxNextFreeBlock != NULL ) )
> {
>     pxPreviousBlock = pxBlock;          /* 更新前一个块指针 */
>     pxBlock = pxBlock->pxNextFreeBlock; /* 移动到下一个块 */
> }
> ```
>
> - 循环条件 1：pxBlock->xBlockSize < xWantedSize——当前块太小，需要继续寻找
> - 循环条件 2：pxBlock->pxNextFreeBlock != NULL——尚未到达链表末尾
> - 在循环中，pxPreviousBlock 和 pxBlock 指针逐步向后移动
> - 当循环结束时，pxBlock 要么是足够大的块，要么是链表末尾标记
>
> 6. 内存块分配与指针计算
>
> - pvReturn 是函数的返回值，指向分配给用户的内存块
> - 内存块的结构：`[BlockLink_t 结构体][实际可用内存]`
> - 需要跳过前面的 BlockLink_t 结构，才能得到用户可用的内存指针
> - 计算过程：
>   1. pxPreviousBlock->pxNextFreeBlock——指向要分配的空闲块的指针
>   2. `( uint8_t * )`——转换为字节指针，便于进行字节级别的地址计算
>   3. `+ xHeapStructSize`——跳过 BlockLink_t 结构的大小
>   4. `( void * )`——转换回通用指针类型返回给用户
>
> 7. 空闲链表维护：这是链表操作中的节点移除操作
>
> - 将 pxPreviousBlock 的 pxNextFreeBlock 指针直接指向 pxBlock 的下一个节点
> - 这样就将 pxBlock 从空闲链表中移除了，防止它被再次分配
>
> 8. 块拆分处理
>
> - 检查分配后剩余的空间是否足够大，可以拆分成一个新的空闲块
> - heapMINIMUM_BLOCK_SIZE 是最小的空闲块大小，定义为 xHeapStructSize * 2（至少包含两个 BlockLink_t 结构的大小）
> - 如果剩余空间大于最小值，就可以将其拆分为一个新的空闲块
> - 计算新块的起始地址：在当前块的基础上偏移 xWantedSize 字节
> - 将指针转换为 void * 类型，然后赋值给 pxNewBlockLink
> - 更新新块的大小为剩余空间的大小
> - 更新当前块的大小为用户请求的大小
> - 这样就完成了内存块的拆分
>
> 9. 内存使用情况更新
>
> - xFreeBytesRemaining 是全局变量，跟踪堆中剩余的空闲字节数
> - 减去刚刚分配的块的大小，更新空闲内存统计
>
> 10. 块分配标记
>
> - heapALLOCATE_BLOCK 是一个宏，用于标记块为已分配状态
> - 实现：`#define heapALLOCATE_BLOCK( pxBlock ) ( ( pxBlock->xBlockSize ) |= heapBLOCK_ALLOCATED_BITMASK )`
> - 通过设置 xBlockSize 的最高位来标记块已分配
> - 将已分配块的 pxNextFreeBlock 指针设置为 NULL，确保它不再与空闲链表关联

> 这个地方涉及到一个链表插入的操作：这种链表的操作在数据结构的算法考察部分会考，可以先了解一下！
>
> 负责将空闲内存块按大小升序插入到空闲链表中，以支持最佳适配算法的高效查找。

```cpp
#define prvInsertBlockIntoFreeList( pxBlockToInsert ) \
    { \
        BlockLink_t * pxIterator;
        size_t xBlockSize;

        xBlockSize = pxBlockToInsert->xBlockSize;

        /* Iterate through the list until a block is found that has a larger size */
        /* than the block we are inserting. */
        for( pxIterator = &xStart; pxIterator->pxNextFreeBlock->xBlockSize < xBlockSize; pxIterator = pxIterator->pxNextFreeBlock ) \
        {
            /* There is nothing to do here - just iterate to the correct position. */
        }

        /* Update the list to include the block being inserted in the correct */
        /* position. */
        pxBlockToInsert->pxNextFreeBlock = pxIterator->pxNextFreeBlock;
        pxIterator->pxNextFreeBlock = pxBlockToInsert;
    }
```

> 插入前：
>
> `pxStart → Block A (size=32) → Block B (size=64) → Block C (size=128) → xEnd`
>
> 插入新块 (size=48)：
>
> 1. 遍历找到 Block A (32 < 48) → Block B (64 > 48)
> 2. 新块->pxNextFreeBlock = Block B
> 3. Block A->pxNextFreeBlock = 新块
>
> 插入后：
>
> `pxStart → Block A (32) → 新块 (48) → Block B (64) → Block C (128) → xEnd`

内存块释放示例：

最佳适配算法示例：

- 空闲块按大小顺序存储，从最小块开始遍历
- 寻找刚好足够大的块，减少内存浪费
- 提高内存利用率，避免过度分配

#### 源码带注释：

```cpp
/**
 * @brief FreeRTOS heap_2 内存分配方案的核心函数
 * @param xWantedSize 请求分配的内存大小（字节）
 * @return 成功返回指向分配内存的指针，失败返回 NULL
 * @note heap_2 支持内存释放，但不会合并相邻空闲块（可能导致内存碎片）
 */
void * pvPortMalloc( size_t xWantedSize )
{
    BlockLink_t * pxBlock;          /* 指向当前遍历的空闲块 */
    BlockLink_t * pxPreviousBlock;  /* 指向当前遍历块的前一个块 */
    BlockLink_t * pxNewBlockLink;   /* 用于块拆分时的新块指针 */
    void * pvReturn = NULL;         /* 函数返回值，初始化为 NULL */
    size_t xAdditionalRequiredSize; /* 用于内存对齐的额外空间大小 */

    /* 检查请求大小是否有效（大于 0） */
    if( xWantedSize > 0 )
    {
        /* 增加请求大小，以便包含 BlockLink_t 结构（存储块管理信息） */
        if( heapADD_WILL_OVERFLOW( xWantedSize, xHeapStructSize ) == 0 )
        {
            xWantedSize += xHeapStructSize;

            /* 确保内存块按要求的字节数对齐 */
            if( ( xWantedSize & portBYTE_ALIGNMENT_MASK ) != 0x00 )
            {
                /* 需要字节对齐，计算所需的额外空间 */
                xAdditionalRequiredSize = portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK );

                /* 检查对齐操作是否会导致溢出 */
                if( heapADD_WILL_OVERFLOW( xWantedSize, xAdditionalRequiredSize ) == 0 )
                {
                    /* 调整大小以满足对齐要求 */
                    xWantedSize += xAdditionalRequiredSize;
                }
                else
                {
                    /* 对齐会导致溢出，标记请求大小为 0（无效） */
                    xWantedSize = 0;
                }
            }
            else
            {
                mtCOVERAGE_TEST_MARKER(); /* 代码覆盖率测试标记 */
            }
        }
        else
        {
            /* 添加 BlockLink_t 结构会导致溢出，标记请求大小为 0（无效） */
            xWantedSize = 0;
        }
    }
    else
    {
        mtCOVERAGE_TEST_MARKER(); /* 代码覆盖率测试标记 */
    }

    /* 挂起所有任务调度，确保内存分配是原子操作 */
    vTaskSuspendAll();
    {
        /* 如果是第一次调用 malloc，需要初始化堆结构 */
        if( xHeapHasBeenInitialised == pdFALSE )
        {
            prvHeapInit();                /* 初始化堆 */
            xHeapHasBeenInitialised = pdTRUE; /* 标记堆已初始化 */
        }

        /* 检查块大小是否有效：最高位不能被设置
         * BlockLink_t 结构的 xBlockSize 成员的最高位用于标记块的所有权
         * 0：块属于空闲堆空间；1：块属于应用程序
         */
        if( heapBLOCK_SIZE_IS_VALID( xWantedSize ) != 0 )
        {
            /* 检查请求大小有效且堆中有足够空间 */
            if( ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining ) )
            {
                /* 空闲块按大小顺序存储，从最小块开始遍历
                 * 实现最佳适配算法：寻找刚好足够大的块
                 */
                pxPreviousBlock = &xStart;        /* 从链表头开始 */
                pxBlock = xStart.pxNextFreeBlock; /* 获取第一个空闲块 */

                /* 遍历空闲块链表，直到找到足够大的块或到达链表末尾 */
                while( ( pxBlock->xBlockSize < xWantedSize ) && ( pxBlock->pxNextFreeBlock != NULL ) )
                {
                    pxPreviousBlock = pxBlock;          /* 更新前一个块指针 */
                    pxBlock = pxBlock->pxNextFreeBlock; /* 移动到下一个块 */
                }

                /* 如果没有到达链表末尾（xEnd是末尾标记），说明找到合适的块 */
                if( pxBlock != &xEnd )
                {
                    /* 返回指向实际可用内存的指针：跳过块头部的BlockLink_t结构 */
                    pvReturn = ( void * ) ( ( ( uint8_t * ) pxPreviousBlock->pxNextFreeBlock ) + xHeapStructSize );

                    /* 将分配的块从空闲链表中移除 */
                    pxPreviousBlock->pxNextFreeBlock = pxBlock->pxNextFreeBlock;

                    /* 如果块的剩余空间大于最小块大小，则拆分块 */
                    if( ( pxBlock->xBlockSize - xWantedSize ) > heapMINIMUM_BLOCK_SIZE )
                    {
                        /* 创建新的块，位于当前块的后面 */
                        pxNewBlockLink = ( void * ) ( ( ( uint8_t * ) pxBlock ) + xWantedSize );

                        /* 设置两个块的大小 */
                        pxNewBlockLink->xBlockSize = pxBlock->xBlockSize - xWantedSize; /* 剩余空间作为新块 */
                        pxBlock->xBlockSize = xWantedSize;                               /* 当前块为请求大小 */

                        /* 将新块插入到空闲链表的正确位置
                         * 空闲链表按块大小排序，需要找到合适的插入位置
                         */
                        prvInsertBlockIntoFreeList( ( pxNewBlockLink ) );
                    }

                    /* 更新剩余空闲字节数 */
                    xFreeBytesRemaining -= pxBlock->xBlockSize;

                    /* 标记块为已分配（设置最高位） */
                    heapALLOCATE_BLOCK( pxBlock );
                    pxBlock->pxNextFreeBlock = NULL; /* 已分配块不再属于空闲链表 */
                }
            }
        }

        traceMALLOC( pvReturn, xWantedSize ); /* 内存分配跟踪（如果启用） */
    }
    ( void ) xTaskResumeAll(); /* 恢复任务调度 */

    /* 如果配置了内存分配失败钩子，则在分配失败时调用 */
    #if ( configUSE_MALLOC_FAILED_HOOK == 1 )
    {
        if( pvReturn == NULL )
        {
            vApplicationMallocFailedHook(); /* 调用内存分配失败钩子 */
        }
    }
    #endif

    return pvReturn;
}
```

#### `heap_2` 释放（主要是链表操作）

流程：

1. 参数检查：验证传入指针的有效性
1. 块头定位：通过指针调整找到内存块的管理结构
1. 状态验证：确保要释放的块处于有效状态
1. 状态更新：清除块的已分配标记
1. 内存清除：可选地将释放的内存内容清零
1. 原子操作：通过任务调度的挂起/恢复确保线程安全
1. 链表维护：将释放的块按大小排序插入空闲链表
1. 统计更新：维护空闲内存的统计信息
1. 事件记录：记录内存释放事件用于调试

#### 源码注释：

```cpp
void vPortFree( void * pv )
{
    uint8_t * puc = ( uint8_t * ) pv;  /* 将void指针转换为uint8_t指针以便进行字节级操作 */
    BlockLink_t * pxLink;               /* 用于指向内存块的管理结构 */

    /* 检查要释放的指针是否有效（非NULL） */
    if( pv != NULL )
    {
        /* 内存块的管理结构（BlockLink_t）位于用户可用内存的紧前面
         * 因此需要将指针向前移动xHeapStructSize字节找到管理结构 */
        puc -= xHeapStructSize;

        /* 这种强制转换是为了避免某些编译器发出字节对齐警告 */
        pxLink = ( void * ) puc;

        /* 断言检查：确保要释放的块确实是已分配状态 */
        configASSERT( heapBLOCK_IS_ALLOCATED( pxLink ) != 0 );
        /* 断言检查：确保已分配块的下一个指针为NULL（已分配块不在空闲链表中） */
        configASSERT( pxLink->pxNextFreeBlock == NULL );

        /* 双重检查：确保块处于已分配状态 */
        if( heapBLOCK_IS_ALLOCATED( pxLink ) != 0 )
        {
            /* 双重检查：确保块不在空闲链表中 */
            if( pxLink->pxNextFreeBlock == NULL )
            {
                /* 清除块的已分配标记，将其标记为空闲 */
                heapFREE_BLOCK( pxLink );
                
                /* 如果配置了在释放时清除内存内容（configHEAP_CLEAR_MEMORY_ON_FREE=1） */
                #if ( configHEAP_CLEAR_MEMORY_ON_FREE == 1 )
                {
                    /* 使用memset将用户可用内存部分清零，增强安全性和可调试性 */
                    ( void ) memset( puc + xHeapStructSize, 0, pxLink->xBlockSize - xHeapStructSize );
                }
                #endif

                /* 挂起所有任务调度，确保内存释放操作是原子的 */
                vTaskSuspendAll();
                {
                    /* 将释放的块重新插入到空闲链表中（按大小排序） */
                    prvInsertBlockIntoFreeList( ( ( BlockLink_t * ) pxLink ) );
                    /* 更新空闲字节计数，增加刚释放的块大小 */
                    xFreeBytesRemaining += pxLink->xBlockSize;
                    /* 记录内存释放事件，用于调试和性能分析 */
                    traceFREE( pv, pxLink->xBlockSize );
                }
                /* 恢复任务调度，允许其他任务继续执行 */
                ( void ) xTaskResumeAll();
            }
        }
    }
    /* 如果 pv 为 NULL，不执行任何操作，这是符合 C 标准的内存释放行为 */
}
```

#### `heap_3`（封装 C 库 `malloc()` / `free()`）

> `heap_3` 的完整概览见 [[#8.1.3 heap_3：封装 C 库 malloc() / free()|第 8.1.3 节]]；本章源码篇不再重复展开。

#### `heap_4`（首次适配算法）

空闲块按地址组织，支持拆分和相邻块合并，是常用的 FreeRTOS 堆实现。

![[assets/feishu-freertos-source-analysis/img-129.jpg]]

#### FreeRTOS heap_4 内存分配方案的特点

支持内存释放与合并：允许动态释放已分配内存块，且自动合并相邻空闲块，有效减少碎片

首次适配算法：空闲块按内存地址排序，优先分配最低地址的足够大的块，分配速度快

块拆分机制：若找到的空闲块大于请求大小，会自动拆分为两部分，剩余部分重新加入空闲链表

内存碎片控制：通过自动合并相邻空闲块，显著降低内存碎片产生

内存对齐：保证分配的内存块按硬件要求对齐，提高访问效率

多任务安全：使用任务调度挂起机制确保内存分配过程的原子性

内存保护：支持可选的指针保护功能，增强系统安全性

#### 适用场景

heap\_4 适用于以下场景： 需要频繁分配和释放内存的动态应用

对内存碎片敏感的长期运行系统

对内存分配效率有一定要求的实时应用

资源有限但需要高效利用内存的嵌入式设备

对系统可靠性要求较高的工业控制、医疗设备等场景

#### 源码解析

##### 先了解一下分配前的流程：

> 🌈
>
> heap4 的前置条件检查和 heap2 的是一样的。
>
> 1.
>
> 检查是否需要对齐：通过按位与运算判断当前大小是否满足对齐要求
>
> 2.
>
> 计算对齐所需额外空间：如果需要对齐，计算需要添加的字节数
>
> 3.
>
> 检查溢出：确保对齐后的大小不会超过size\_t的最大值
>
> 4.
>
> 执行对齐调整：如果安全，调整请求大小以满足对齐要求
>
> 5.
>
> 处理异常情况：如果发生溢出，标记请求无效

![[assets/feishu-freertos-source-analysis/img-130.jpg]]

##### 初始化堆函数讲解

![[assets/feishu-freertos-source-analysis/img-131.jpg]]

![[assets/feishu-freertos-source-analysis/img-132.jpg]]

首先，heap4 的内存都是在这个大数组进行分配的。

##### 地址对齐

这部分就不讲了，因为我们需要八字节对齐，所以如果不对齐的话会自动向后移动

数学原理：

- 第一步：地址 + (对齐边界-1) 确保结果至少等于下一个对齐边界
  - 例如，对于 4 字节对齐，任何地址加 3 后，都能覆盖到下一个 4 字节边界
- 第二步：& ~mask 清除低n位（n 是对齐边界的位数），得到精确的对齐地址
  - 例如， `uxStartAddress = 0x1005`
  - 第一步：加上portBYTE\_ALIGNMENT-1 = 7
    - 0x1005 + 7 = 0x100C
  - 第二步：与~mask（即~0b0111 = 0b1111...1000）做与运算
    - 0x100C & 0xFFFFFFF8 = 0x1008（8 字节对齐地址）

##### 初始化（全是链表的操作）

```c
typedef struct A_BLOCK_LINK
{
    struct A_BLOCK_LINK *pxNextFreeBlock;  // 指向下一个空闲块
    size_t xBlockSize;                     // 当前块的大小
} BlockLink_t;
```

👉 每一块内存前面，都有这样一个“管理头”
就像快递包裹上贴的单子：
这块有多大？
下一块在哪？

① 初始化链表头 xStart（注意：大小为 0、不占真实堆内存）

```c
xStart.pxNextFreeBlock = ( void * ) heapPROTECT_BLOCK_POINTER( uxStartAddress );
xStart.xBlockSize = ( size_t ) 0;
```

| 名字 | 作用 |
| --- | --- |
| xStart | 假头结点（不占真实内存） |
| pxFirstFreeBlock | 真正可用的第一块空闲内存 |
| pxEnd | 假尾结点（结束标记） |

② 计算堆的结束地址

```c
uxEndAddress = uxStartAddress + xTotalHeapSize;
//③ 给“结束标记”留位置
uxEndAddress -= xHeapStructSize;
//④ 地址对齐！！！
uxEndAddress &= ~( portBYTE_ALIGNMENT_MASK );
```

```c
//初始化真正的第一块空闲内存
pxFirstFreeBlock = ( BlockLink_t * ) uxStartAddress;
//计算第一块空闲块的大小,空闲块大小 = 结束标记地址 - 当前块起始地址
pxFirstFreeBlock->xBlockSize =    ( size_t ) ( uxEndAddress - ( portPOINTER_SIZE_TYPE ) pxFirstFreeBlock );
//把空闲块连到结束标记
pxFirstFreeBlock->pxNextFreeBlock = heapPROTECT_BLOCK_POINTER( pxEnd );
```

![[assets/feishu-freertos-source-analysis/img-133.jpg]]

初始化完成之后：

xStart（0 内存）

↓

pxFirstFreeBlock → pxEnd（0 内存） → NULL

##### 插入空闲块并合并相邻块

> 🌈
>
> 这个函数是 heap\_4 能够减少内存碎片的核心！通过自动合并相邻的空闲块，它确保了：
>
> 1.
>
> 空闲空间尽可能是连续的大区块
>
> 2.
>
> 下次分配内存时更容易找到合适大小的空间
>
> 3.
>
> 系统可以更高效地使用有限的内存资源
>
> 初读时可先把 `heapPROTECT_BLOCK_POINTER` 当成“保存或取回链表指针”的封装；启用堆保护后，它会用 canary 对指针做异或保护：
>
> ```c
> #if ( configENABLE_HEAP_PROTECTOR == 1 )
>     /* 启用指针保护模式 */
>     #define heapPROTECT_BLOCK_POINTER( pxBlock ) \
>         ( ( BlockLink_t * ) ( ( ( portPOINTER_SIZE_TYPE ) ( pxBlock ) ) ^ xHeapCanary ) )
> #else
>     /* 禁用指针保护模式（默认） */
>     #define heapPROTECT_BLOCK_POINTER( pxBlock ) ( pxBlock )
> #endif
> ```
>
> heapPROTECT\_BLOCK\_POINTER是 FreeRTOS heap\_4 内存管理方案中的指针保护机制，用于提高堆内存的安全性，防止指针损坏或恶意篡改。

> 🌈
>
> 重点去了解：
>
> 第一步：找到合适的插入位置
>
> - 空闲链表是按内存地址从小到大排列的
>
> - 作用是找到第一个地址大于要插入块的位置
>
> 第二步：验证指针有效性

> - 检查找到的位置是否有效，防止出错
>
> 第三步：检查是否可以和前面的块合并
>
> - 计算前一个块的结束地址：puc + pxIterator->xBlockSize
> - 如果前一个块的结束地址等于要插入块的起始地址，说明两块连续
> - 合并两块：更新前一个块的大小，把插入块指向合并后的块
>
> 第四步：检查是否可以和后面的块合并
>
> - 类似第三步，检查是否可以和后面的块合并
> - 如果后面的块也连续，就一起合并
>
> 第五步：完成插入
>
> - 如果没有和前面的块合并，就把插入块放到正确位置
> - 更新链表指针，确保链表完整

##### 实际分配讲解

按需拆分内存块好处：

1. 内存利用率优化：只分配请求大小的内存，剩余部分继续作为空闲块可用
1. 减少内存碎片：通过控制最小块大小，避免产生过多无法使用的小碎片
1. 保持链表结构：确保空闲链表始终保持有序且完整
1. 安全性保障：通过对齐检查和指针保护，提高内存操作的安全性

> 🌈
>
> 1. 关闭调度器
>
> 2. 第一次调用的话要初始化一下我们的内存，在这
>
> 3. 检查一下想申请的空间是否满足要求
>
> ```c
> ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining )
> ```
>
> 需要注意的是 heap4 是从最低地址开始查找的！

![[assets/feishu-freertos-source-analysis/img-134.jpg]]

4. 验证指针有效性

这个宏定义就是去确保所有堆操作都在预期的内存范围内进行，这个范围就是我们之前定义的“大数组”。

5. 遍历空闲块链表，这个也是链表的基本操作

一个是看当前空闲块的大小是不是符合：

```c
( pxBlock->xBlockSize < xWantedSize )
( pxBlock->pxNextFreeBlock != heapPROTECT_BLOCK_POINTER( NULL ) )
```

如果找到了合适的块就要开始内存分配了：

- pxPreviousBlock->pxNextFreeBlock：指向当前要分配的空闲块（与 pxBlock 相同）
- xHeapStructSize：BlockLink_t 结构的大小（包含对齐填充）

内存块头结构的对齐大小，计算方式为：

- `sizeof( BlockLink_t )`：管理块头中两个指针成员的原始大小。
- `( size_t ) ( portBYTE_ALIGNMENT - 1 )`：为向上对齐预留最多一个对齐单位的空间。
- `& ~( ( size_t ) portBYTE_ALIGNMENT_MASK )`：清除低位，使最终的块头大小满足 `portBYTE_ALIGNMENT` 对齐要求。

为什么需要额外加上这个大小？你需要返回的是实际的内存，而不是它的头部，所以需要跳过 xHeapStructSize 字节。

~~~text
┌─────────────────────────┐
│ BlockLink_t 结构（管理信息） │ ← pxBlock 指向这里
├─────────────────────────┤
│ 用户可用内存区域             │ ← pvReturn 指向这里
└─────────────────────────┘
~~~

然后把当前符合条件的内存块从空闲链表中移除：将前一个空闲块的 pxNextFreeBlock 指针直接指向当前块的下一个块，这样就把 pxBlock 从空闲链表中移除了。

分配前：

pxPreviousBlock → pxBlock → 下一个空闲块

分配后：

pxPreviousBlock → 下一个空闲块

6. 优势：如果当前空闲块的大小远大于请求的大小，会将其拆分为两部分。当找到的空闲块大小减去请求大小后，剩余空间大于最小允许块大小 heapMINIMUM_BLOCK_SIZE 时，才进行拆分。

- 确保拆分后的每个块都能独立使用（至少能容纳块头信息和一些用户数据）

1. (uint8_t *)pxBlock：将当前块指针转换为字节指针，以便进行精确的内存地址计算。
2. + xWantedSize：计算新块的起始地址（当前块地址加上请求的大小）。
3. (void *)：将计算得到的地址转换回通用指针类型。
4. 原块（pxBlock）：大小设置为请求的大小 xWantedSize，用于满足当前内存分配。
5. 新块（pxNewBlockLink）：大小设置为剩余空间大小（原块大小 - 请求大小），作为新的空闲块。
6. pxNewBlockLink->pxNextFreeBlock = pxPreviousBlock->pxNextFreeBlock：新块的下一个指针指向原块在链表中的下一个块。
7. pxPreviousBlock->pxNextFreeBlock = heapPROTECT_BLOCK_POINTER( pxNewBlockLink )：原块的前一个块的下一个指针现在指向新块，完成新块的插入。

~~~text
┌─────────────────────────────────────────────────┐
│                 原空闲块（pxBlock）              │
│  xBlockSize：原大小                              │
│  pxNextFreeBlock：指向链表中下一个块             │
└─────────────────────────────────────────────────┘

            ↓ 满足分配请求后拆分 ↓

┌─────────────────────────┐ ┌─────────────────────────┐
│       分配给用户的块     │ │       新的空闲块          │
│  xBlockSize：xWantedSize │ │  xBlockSize：剩余大小     │
│  （不再在空闲链表中）     │ │  pxNextFreeBlock：继承原指针 │
└─────────────────────────┘ └─────────────────────────┘
         ↑                              ↑
         │                              │
       原块位置                 原块地址 + xWantedSize
~~~

7. 这部分就是更新堆状态（了解即可）

- xFreeBytesRemaining：全局变量，记录当前堆中剩余的空闲字节总数。
- pxBlock->xBlockSize：当前分配的内存块的总大小（包含块头信息）。

- xMinimumEverFreeBytesRemaining：全局变量，记录从系统启动到现在，堆中曾经出现过的最小空闲内存字节数，这个是啥意思呢？它能告诉你系统在运行过程中内存最紧张的时候是什么样子。如果这个值非常小（比如接近 0），说明你的系统内存规划可能有问题，需要增加内存或优化内存使用。

- heapALLOCATE_BLOCK：宏定义去标记这块内存是已分配，即将块的最高位设置为 1。

- 从空闲链表移除：pxBlock->pxNextFreeBlock = NULL。

##### 带注释的源码：

![[assets/feishu-freertos-source-analysis/img-135.jpg]]

```cpp

void * pvPortMalloc( size_t xWantedSize )
{
    BlockLink_t * pxBlock;           /* 当前遍历的空闲块指针 */
    BlockLink_t * pxPreviousBlock;   /* 当前块的前一个空闲块指针 */
    BlockLink_t * pxNewBlockLink;    /* 块拆分时创建的新空闲块指针 */
    void * pvReturn = NULL;          /* 函数返回值，初始化为NULL表示分配失败 */
    size_t xAdditionalRequiredSize;  /* 计算内存对齐所需的额外空间 */

    /* 1. 输入参数有效性检查 - 忽略大小为0的请求 */
    if( xWantedSize > 0 ){
        /* 2. 计算实际所需内存大小：用户请求大小 + 内存块管理结构大小 */
        /* 检查加法是否会导致溢出 */
        if( heapADD_WILL_OVERFLOW( xWantedSize, xHeapStructSize ) == 0 ) {
            xWantedSize += xHeapStructSize;

            /* 3. 内存对齐处理 - 确保块大小按portBYTE_ALIGNMENT要求对齐 */
            if( ( xWantedSize & portBYTE_ALIGNMENT_MASK ) != 0x00 ) {
                /* 计算需要补充的对齐字节数 */
                xAdditionalRequiredSize = portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK );

                /* 再次检查加法是否会导致溢出 */
                if( heapADD_WILL_OVERFLOW( xWantedSize, xAdditionalRequiredSize ) == 0 ){
                    xWantedSize += xAdditionalRequiredSize;
                }
                else{
                    /* 溢出处理：标记请求大小为无效 */
                    xWantedSize = 0;
                }
            }
            else{
                mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
            }
        }
        else{
            /* 溢出处理：标记请求大小为无效 */
            xWantedSize = 0;
        }
    }
    else{
        mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
    }

    /* 4. 线程安全保护 - 挂起所有任务调度，确保内存操作原子性 */
    vTaskSuspendAll();
    {
        /* 5. 堆初始化检查 - 首次调用时初始化堆结构 */
        if( pxEnd == NULL ){
            prvHeapInit();
        }
        else{
            mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
        }

        /* 6. 有效性检查 - 确认最终请求大小有效且未设置分配标记位 */
        if( heapBLOCK_SIZE_IS_VALID( xWantedSize ) != 0 ){
            /* 7. 内存可用性检查 - 确认有足够的空闲内存满足请求 */
            if( ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining ) ){
                /* 8. 首次适配算法 - 从链表头开始查找合适的空闲块 */
                pxPreviousBlock = &xStart;
                /* 应用指针保护机制（如果启用） */
                pxBlock = heapPROTECT_BLOCK_POINTER( xStart.pxNextFreeBlock );
                /* 验证指针是否在堆边界内 */
                heapVALIDATE_BLOCK_POINTER( pxBlock );

                /* 遍历空闲链表，寻找第一个足够大的块 */
                while( ( pxBlock->xBlockSize < xWantedSize ) &&
                       ( pxBlock->pxNextFreeBlock != heapPROTECT_BLOCK_POINTER( NULL ) ) ){
                    pxPreviousBlock = pxBlock;
                    pxBlock = heapPROTECT_BLOCK_POINTER( pxBlock->pxNextFreeBlock );
                    heapVALIDATE_BLOCK_POINTER( pxBlock );
                }

                /* 9. 块分配判断 - 如果未到达链表末尾（pxEnd是结束标记），则找到合适块 */
                if( pxBlock != pxEnd ){
                    /* 10. 计算返回指针 - 跳过BlockLink_t结构，指向实际可用内存 */
                    pvReturn = ( void * ) ( ( ( uint8_t * ) heapPROTECT_BLOCK_POINTER( pxPreviousBlock->pxNextFreeBlock ) ) + xHeapStructSize );
                    heapVALIDATE_BLOCK_POINTER( pvReturn ); /* 验证返回指针的有效性 */

                    /* 11. 从空闲链表移除 - 将分配的块从空闲链表中删除 */
                    pxPreviousBlock->pxNextFreeBlock = pxBlock->pxNextFreeBlock;

                    /* 12. 块拆分准备 - 确保减法不会下溢 */
                    configASSERT( heapSUBTRACT_WILL_UNDERFLOW( pxBlock->xBlockSize, xWantedSize ) == 0 );

                    /* 13. 块拆分判断 - 如果剩余空间大于最小块大小，则拆分块 */
                    if( ( pxBlock->xBlockSize - xWantedSize ) > heapMINIMUM_BLOCK_SIZE ){
                        /* 创建新的空闲块，位置在当前块之后 */
                        pxNewBlockLink = ( void * ) ( ( ( uint8_t * ) pxBlock ) + xWantedSize );
                        /* 确保新块按要求对齐 */
                        configASSERT( ( ( ( size_t ) pxNewBlockLink ) & portBYTE_ALIGNMENT_MASK ) == 0 );

                        /* 14. 设置块大小 - 分配当前块，剩余空间作为新块 */
                        pxNewBlockLink->xBlockSize = pxBlock->xBlockSize - xWantedSize;
                        pxBlock->xBlockSize = xWantedSize;

                        /* 15. 插入新块 - 将拆分出的新空闲块插入空闲链表 */
                        pxNewBlockLink->pxNextFreeBlock = pxPreviousBlock->pxNextFreeBlock;
                        pxPreviousBlock->pxNextFreeBlock = heapPROTECT_BLOCK_POINTER( pxNewBlockLink );
                    }
                    else{
                        mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
                    }

                    /* 16. 更新空闲内存统计 - 减少剩余空闲字节数 */
                    xFreeBytesRemaining -= pxBlock->xBlockSize;

                    /* 17. 更新历史最低水位 - 记录堆内存的历史最小空闲值 */
                    if( xFreeBytesRemaining < xMinimumEverFreeBytesRemaining ){
                        xMinimumEverFreeBytesRemaining = xFreeBytesRemaining;
                    }
                    else{
                        mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
                    }

                    /* 18. 标记块状态 - 设置块的分配标记位（最高位） */
                    heapALLOCATE_BLOCK( pxBlock );
                    /* 19. 清除链表指针 - 已分配块不再属于空闲链表 */
                    pxBlock->pxNextFreeBlock = NULL;
                    /* 20. 更新分配统计 - 增加成功分配计数 */
                    xNumberOfSuccessfulAllocations++;
                }
                else{
                    mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
                }
            }
            else{
                mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
            }
        }
        else{
            mtCOVERAGE_TEST_MARKER(); /* 代码覆盖测试标记点 */
        }

        /* 21. 跟踪内存分配事件 - 用于调试和性能分析 */
        traceMALLOC( pvReturn, xWantedSize );
    }
    /* 22. 恢复任务调度 - 结束内存操作的原子性保护 */
    ( void ) xTaskResumeAll();

    /* 23. 分配失败钩子 - 如果配置了，在分配失败时调用 */
    #if ( configUSE_MALLOC_FAILED_HOOK == 1 )
    {
        if( pvReturn == NULL )
        {
            /* 调用应用程序定义的内存分配失败处理函数 */
            vApplicationMallocFailedHook();
        }
    }
    #endif

    /* 返回分配结果 */
    return pvReturn;
}
```

#### `heap_4` 释放：合并相邻空闲块

![[assets/feishu-freertos-source-analysis/img-136.jpg]]

![[assets/feishu-freertos-source-analysis/img-137.jpg]]

#### 举例子

![[assets/feishu-freertos-source-analysis/img-138.jpg]]

#### `heap_5`

算法继承自 `heap_4`，但可管理多个不连续的内存区域。

![[assets/feishu-freertos-source-analysis/img-139.jpg]]

#### FreeRTOS heap_5 内存分配方案的特点

支持多区域内存管理： 允许在多个不连续的内存区域上构建堆空间， 满足复杂硬件平台的内存架构需求

手动定义内存区域： 必须通过 vPortDefineHeapRegions（）函数显式定义堆区域， 提供更大的内存配置灵活性

内存块合并机制： 自动合并相邻空闲块， 有效减少内存碎片

首次适配算法： 空闲块按内存地址排序，优先分配最低地址的足够大的块，分配速度快

块拆分机制： 若找到的空闲块大于请求大小，会自动拆分为两部分，剩余部分重新加入空闲链表

内存碎片控制： 通过 自动合并相邻空闲块，显著降低内存碎片产生

内存对齐： 保证分配的内存块按硬件要求对齐，提高访问效率

多任务安全： 使用任务调度挂起机制确保内存分配过程的原子性

内存保护： 支持可选的指针保护功能，增强系统安全性

#### 适用场景

heap\_5 适用于以下场景：

- 需要利用多个不连续内存区域的复杂系统
- 具有片内 RAM+外部 RAM 组合架构的嵌入式设备
- 对内存资源分配有高度定制需求的应用
- 需要在不同内存类型（如快速 RAM 和慢速 RAM）上分配内存的系统
- 对系统可靠性要求较高且内存架构复杂的工业控制、医疗设备等场景

#### 源码解析

其实 heap5 的内存分配流程和 heap4 的是一致的。

唯一有区别的地方是在哪里呢？是 heap4 有一个首次分配需要先进行初始化，而 heap5 必须得先手动调用 vPortDefineHeapRegions（）函数显式定义堆区域。

![[assets/feishu-freertos-source-analysis/img-140.jpg]]

![[assets/feishu-freertos-source-analysis/img-141.jpg]]

![[assets/feishu-freertos-source-analysis/img-142.jpg]]

#### 带注释的源码：

![[assets/feishu-freertos-source-analysis/img-143.jpg]]

```cpp
void * pvPortMalloc( size_t xWantedSize )
{
    BlockLink_t * pxBlock;                /* 指向当前检查的内存块 */
    BlockLink_t * pxPreviousBlock;        /* 指向上一个内存块 */
    BlockLink_t * pxNewBlockLink;         /* 用于内存块分割时的新块 */
    void * pvReturn = NULL;               /* 函数返回值，初始化为NULL */
    size_t xAdditionalRequiredSize;       /* 字节对齐所需的额外空间 */

    /* 堆必须在首次调用pvPortMalloc()之前初始化 */
    configASSERT( pxEnd );

    if( xWantedSize > 0 )
    {
        /* 需要增加请求大小，以便在分配的内存块开头包含一个BlockLink_t结构 */
        if( heapADD_WILL_OVERFLOW( xWantedSize, xHeapStructSize ) == 0 )
        {
            xWantedSize += xHeapStructSize;

            /* 确保内存块始终对齐到要求的字节数 */
            if( ( xWantedSize & portBYTE_ALIGNMENT_MASK ) != 0x00 )
            {
                /* 需要进行字节对齐，计算所需的额外空间 */
                xAdditionalRequiredSize = portBYTE_ALIGNMENT - ( xWantedSize & portBYTE_ALIGNMENT_MASK );

                if( heapADD_WILL_OVERFLOW( xWantedSize, xAdditionalRequiredSize ) == 0 )
                {
                    xWantedSize += xAdditionalRequiredSize;
                }
                else
                {
                    /* 加法会导致溢出，设置为0表示分配失败 */
                    xWantedSize = 0;
                }
            }
            else
            {
                /* 仅用于测试覆盖率标记，实际不执行任何操作 */
                mtCOVERAGE_TEST_MARKER();
            }
        }
        else
        {
            /* 加法会导致溢出，设置为0表示分配失败 */
            xWantedSize = 0;
        }
    }
    else
    {
        /* 仅用于测试覆盖率标记，实际不执行任何操作 */
        mtCOVERAGE_TEST_MARKER();
    }

    /* 挂起所有任务，确保内存分配过程的原子性 */
    vTaskSuspendAll();
    {
        /* 检查要分配的块大小是否有效（最高位不能被设置）。
         * BlockLink_t结构的xBlockSize成员的最高位用于确定块的所有者 - 应用程序或内核，
         * 因此该位必须为0。 */
        if( heapBLOCK_SIZE_IS_VALID( xWantedSize ) != 0 )
        {
            /* 检查调整后的大小是否大于0且不超过可用内存 */
            if( ( xWantedSize > 0 ) && ( xWantedSize <= xFreeBytesRemaining ) )
            {
                /* 从空闲链表的开头（最低地址）开始遍历，直到找到足够大的块 */
                pxPreviousBlock = &xStart;
                pxBlock = heapPROTECT_BLOCK_POINTER( xStart.pxNextFreeBlock );  /* 获取第一个空闲块（带保护机制） */
                heapVALIDATE_BLOCK_POINTER( pxBlock );                          /* 验证块指针的有效性 */

                /* 遍历空闲链表，寻找足够大的块 */
                while( ( pxBlock->xBlockSize < xWantedSize ) && ( pxBlock->pxNextFreeBlock != heapPROTECT_BLOCK_POINTER( NULL ) ) )
                {
                    pxPreviousBlock = pxBlock;
                    pxBlock = heapPROTECT_BLOCK_POINTER( pxBlock->pxNextFreeBlock );  /* 移动到下一个空闲块 */
                    heapVALIDATE_BLOCK_POINTER( pxBlock );                          /* 验证块指针的有效性 */
                }

                /* 如果没有到达结束标记（pxEnd），说明找到了合适大小的块 */
                if( pxBlock != pxEnd )
                {
                    /* 返回指向内存块的指针，跳过开头的BlockLink_t结构 */
                    pvReturn = ( void * ) ( ( ( uint8_t * ) heapPROTECT_BLOCK_POINTER( pxPreviousBlock->pxNextFreeBlock ) ) + xHeapStructSize );
                    heapVALIDATE_BLOCK_POINTER( pvReturn );  /* 验证返回指针的有效性 */

                    /* 将该块从空闲块链表中移除 */
                    pxPreviousBlock->pxNextFreeBlock = pxBlock->pxNextFreeBlock;

                    /* 如果块的大小大于所需大小，可以将其分割为两个块 */
                    configASSERT( heapSUBTRACT_WILL_UNDERFLOW( pxBlock->xBlockSize, xWantedSize ) == 0 );

                    if( ( pxBlock->xBlockSize - xWantedSize ) > heapMINIMUM_BLOCK_SIZE )
                    {
                        /* 创建一个新的内存块，紧跟在已分配块之后 */
                        pxNewBlockLink = ( void * ) ( ( ( uint8_t * ) pxBlock ) + xWantedSize );
                        configASSERT( ( ( ( size_t ) pxNewBlockLink ) & portBYTE_ALIGNMENT_MASK ) == 0 );

                        /* 计算分割后两个块的大小 */
                        pxNewBlockLink->xBlockSize = pxBlock->xBlockSize - xWantedSize;
                        pxBlock->xBlockSize = xWantedSize;

                        /* 将新创建的空闲块插入到空闲链表中 */
                        pxNewBlockLink->pxNextFreeBlock = pxPreviousBlock->pxNextFreeBlock;
                        pxPreviousBlock->pxNextFreeBlock = heapPROTECT_BLOCK_POINTER( pxNewBlockLink );
                    }
                    else
                    {
                        /* 仅用于测试覆盖率标记，实际不执行任何操作 */
                        mtCOVERAGE_TEST_MARKER();
                    }

                    /* 更新剩余空闲字节数 */
                    xFreeBytesRemaining -= pxBlock->xBlockSize;

                    /* 更新最小剩余空闲字节数的历史记录 */
                    if( xFreeBytesRemaining < xMinimumEverFreeBytesRemaining )
                    {
                        xMinimumEverFreeBytesRemaining = xFreeBytesRemaining;
                    }
                    else
                    {
                        /* 仅用于测试覆盖率标记，实际不执行任何操作 */
                        mtCOVERAGE_TEST_MARKER();
                    }

                    /* 标记块为已分配（设置最高位） */
                    heapALLOCATE_BLOCK( pxBlock );
                    pxBlock->pxNextFreeBlock = NULL;  /* 已分配块不再属于空闲链表 */
                    xNumberOfSuccessfulAllocations++; /* 更新成功分配计数 */
                }
                else
                {
                    /* 仅用于测试覆盖率标记，实际不执行任何操作 */
                    mtCOVERAGE_TEST_MARKER();
                }
            }
            else
            {
                /* 仅用于测试覆盖率标记，实际不执行任何操作 */
                mtCOVERAGE_TEST_MARKER();
            }
        }
        else
        {
            /* 仅用于测试覆盖率标记，实际不执行任何操作 */
            mtCOVERAGE_TEST_MARKER();
        }

        /* 记录内存分配事件，用于调试和性能分析 */
        traceMALLOC( pvReturn, xWantedSize );
    }
    /* 恢复任务调度 */
    ( void ) xTaskResumeAll();

    /* 如果配置了内存分配失败钩子，则在分配失败时调用 */
    #if ( configUSE_MALLOC_FAILED_HOOK == 1 )
    {
        if( pvReturn == NULL )
        {
            /* 调用应用程序定义的内存分配失败处理函数 */
            vApplicationMallocFailedHook();
        }
    }
    #endif

    /* 返回分配结果 */
    return pvReturn;
}
```

#### `vPortDefineHeapRegions()`：`heap_5` 的核心初始化函数

它的主要作用是将用户定义的多个不连续内存区域组织成一个统一的、可动态分配的堆空间。

![[assets/feishu-freertos-source-analysis/img-144.jpg]]

![[assets/feishu-freertos-source-analysis/img-145.jpg]]

首先看一下这个函数的传入参数：

```c
typedef struct HeapRegion
{
    uint8_t *pucStartAddress;  // 内存区域的起始地址
    size_t xSizeInBytes;       // 内存区域的大小（字节）
} HeapRegion_t;
```

##### 内存区域遍历处理

因为 heap5 的特点就是有不连续的内存堆，所以我们挨个遍历所有的堆块。

```text
/* 获取第一个内存区域 */
pxHeapRegion = &( pxHeapRegions[ xDefinedRegions ] );
/* 遍历所有内存区域，直到遇到结束标记（xSizeInBytes == 0） */
while( pxHeapRegion->xSizeInBytes > 0 ){
    // 处理当前区域...
    /* 处理下一个内存区域 */
    xDefinedRegions++;
    pxHeapRegion = &( pxHeapRegions[ xDefinedRegions ] );
}
```

##### 各内存区域的地址对齐

确保每个内存区域的起始地址符合 portBYTE\_ALIGNMENT 要求：最后通过一个变量xAlignedHeap来保存。

![[assets/feishu-freertos-source-analysis/img-146.jpg]]

##### 空闲块链表构建（因为我们初始化就是要把所有的内存块给初始化为空闲）

为什么是链表，前面 heap4 也有所体会，其实 RTOS 的操作基本上都是链表的操作！

1. 第一个区域处理：初始化空闲块链表头 xStart：（就是链表的初始化）

因为我们有很多个块，所以是先处理第一个区域：xDefinedRegions = 0

![[assets/feishu-freertos-source-analysis/img-147.jpg]]

2. 后续区域处理：检查区域地址顺序；内存区域必须按地址从低到高传入。

![[assets/feishu-freertos-source-analysis/img-148.jpg]]

3. 创建区域结束标记：在每个区域末尾创建结束标记 pxEnd

结束标记本身不占用可用内存空间，它只是一个用于管理的特殊标记。

![[assets/feishu-freertos-source-analysis/img-149.jpg]]

4. 创建空闲块：将当前区域初始化为一个大的空闲块

```c
BlockLink_t * pxFirstFreeBlockInRegion = NULL;  /* 当前区域的第一个空闲块指针 */
pxFirstFreeBlockInRegion = ( BlockLink_t * ) xAlignedHeap;
//这个在开头定义了，所以我们先将空闲块指针指向刚刚初始化的第一个内存块的起始地址
```

5. 链接内存区域：将当前区域链接到前一个区域的链表中：（还是链表的操作）

![[assets/feishu-freertos-source-analysis/img-150.jpg]]

##### 使用示例：

使用示例：

```cpp
// 定义三个不连续的内存区域作为堆
HeapRegion_t xHeapRegions[] = {
    { (uint8_t *) 0x10000000, 0x1000 }, // 区域 1
    { (uint8_t *) 0x20000000, 0x2000 }, // 区域 2
    { NULL, 0 }                         // 结束标记
};

// 初始化堆
vPortDefineHeapRegions( xHeapRegions );
```

#### `heap_5` 释放：逻辑与 `heap_4` 相同

#### 带注释源码

![[assets/feishu-freertos-source-analysis/img-151.jpg]]

```cpp
void vPortFree( void * pv )
{
    uint8_t * puc = ( uint8_t * ) pv;    /* 将输入指针转换为字节指针，便于内存地址计算 */
    BlockLink_t * pxLink;                /* 指向内存块头部的 BlockLink_t 结构体指针 */

    /* 检查要释放的指针是否为 NULL，避免空指针操作 */
    if( pv != NULL )
    {
        /*
         * 内存块的结构是：[BlockLink_t][实际可用内存]
         * 因此需要将指针向前移动 xHeapStructSize 字节来找到 BlockLink_t 结构体
         */
        puc -= xHeapStructSize;

        /*
         * 将字节指针转换为 BlockLink_t 指针
         * 这种强制转换是为了避免编译器警告
         */
        pxLink = ( void * ) puc;

        /* 验证内存块指针的有效性，确保它指向一个有效的堆内存块 */
        heapVALIDATE_BLOCK_POINTER( pxLink );
        /* 断言检查内存块当前是否处于已分配状态 */
        configASSERT( heapBLOCK_IS_ALLOCATED( pxLink ) != 0 );
        /* 断言检查已分配块的 pxNextFreeBlock 字段必须为 NULL */
        configASSERT( pxLink->pxNextFreeBlock == NULL );

        /* 再次检查内存块是否处于已分配状态（双重检查，增强安全性） */
        if( heapBLOCK_IS_ALLOCATED( pxLink ) != 0 )
        {
            /* 再次检查 pxNextFreeBlock 是否为 NULL（已分配块的标志） */
            if( pxLink->pxNextFreeBlock == NULL )
            {
                /* 将内存块标记为空闲状态 */
                heapFREE_BLOCK( pxLink );

                /*
                 * 条件编译：如果配置了释放内存时清除内存内容
                 * 这个选项可以提高系统安全性，但会增加一些性能开销
                 */
                #if ( configHEAP_CLEAR_MEMORY_ON_FREE == 1 )
                {
                    /*
                     * 检查内存块大小减去头部大小是否会发生下溢
                     * 这可以检测出内存块大小被错误覆盖的情况
                     */
                    if( heapSUBTRACT_WILL_UNDERFLOW( pxLink->xBlockSize, xHeapStructSize ) == 0 )
                    {
                        /*
                         * 使用 memset 将实际可用内存区域清零
                         * 起始地址: puc + xHeapStructSize (跳过 BlockLink_t 头部)
                         * 大小: pxLink->xBlockSize - xHeapStructSize (实际可用内存大小)
                         */
                        ( void ) memset( puc + xHeapStructSize, 0, pxLink->xBlockSize - xHeapStructSize );
                    }
                }
                #endif

                /*
                 * 挂起所有任务调度，确保内存释放操作的原子性
                 * 这是为了避免多任务环境下对空闲链表的并发访问导致的问题
                 */
                vTaskSuspendAll();
                {
                    /* 更新空闲字节数统计 */
                    xFreeBytesRemaining += pxLink->xBlockSize;
                    /* 调用跟踪宏，用于调试和性能分析 */
                    traceFREE( pv, pxLink->xBlockSize );
                    /* 将空闲块插入到空闲链表中，可能会与相邻空闲块合并 */
                    prvInsertBlockIntoFreeList( ( ( BlockLink_t * ) pxLink ) );
                    /* 更新成功释放内存的次数统计 */
                    xNumberOfSuccessfulFrees++;
                }
                /* 恢复任务调度 */
                ( void ) xTaskResumeAll();
            }
            else
            {
                /* 代码覆盖测试标记，用于确保测试覆盖所有分支 */
                mtCOVERAGE_TEST_MARKER();
            }
        }
        else
        {
            /* 代码覆盖测试标记，用于确保测试覆盖所有分支 */
            mtCOVERAGE_TEST_MARKER();
        }
    }
}
```

### 第三章 `tasks.c`

本章沿着任务创建、状态迁移、调度器启动和任务通知的路径阅读 `tasks.c`。

#### 任务控制块 `TCB_t`

在 tasks.c 中，每个任务都有一个独立的 TCB\_t 结构体。

#### 这个结构体是干嘛的呢？

初读时先关注几个关键字段，其他条件字段再结合自己的配置查源码。

`TCB_t` 中许多字段受 `FreeRTOSConfig.h` 条件编译控制。例如启用互斥量后，才会包含与优先级继承有关的字段。

![[assets/feishu-freertos-source-analysis/img-152.jpg]]

#### 任务状态分类

在 FreeRTOS 中，所谓的“状态转换”，本质上就是把任务的 TCB\_t（任务控制块）从一个链表移动到另一个链表。（下面提到的 xxxList 可以先有个印象）

就绪态（Ready）：任务存放在 `pxReadyTasksLists[priority]` 数组中。

阻塞态 （Blocked）：任务存放在 pxDelayedTaskList（延时阻塞）或某个通信组件（如 Queue/Semaphore）的 xTasksWaitingToReceive 挂起列表中。

挂起态 （Suspended）：任务存放在 xSuspendedTaskList 中。

运行态 （Running）：这是一个逻辑状态。当前正在运行的任务由全局指针 pxCurrentTCB 指向。

“一个处于 Blocked 状态的任务，能够直接变成 Running 状态吗？”

> 答案：解除阻塞后，任务会先进入 Ready 状态；随后在同一次调度事件或下一次合适的调度点就可能被选为 `pxCurrentTCB`，不必等待下一个 Tick。是否立即切换取决于抢占配置、当前上下文和端口实现。

下面的状态图用于串联 Ready、Running、Blocked 和 Suspended 之间的转换：

![[assets/feishu-freertos-source-analysis/img-153.jpg]]

#### `xTaskCreate()`：动态创建任务

![[assets/feishu-freertos-source-analysis/img-154.jpg]]

##### 先看一下函数参数：

然后看一下函数代码，会发现他其实就是先创建了一个 TCB，然后实际调用的是 prvCreateTask 这个函数。

> [!tip] 分层思想
> `xTaskCreate()` 是应用接口，`prvCreateTask()` 是内核内部实现。阅读源码时先跟公开 API，再逐层进入内部函数。

![[assets/feishu-freertos-source-analysis/img-155.jpg]]

![[assets/feishu-freertos-source-analysis/img-156.jpg]]

#### `prvCreateTask()`：分配 TCB 与任务栈

![[assets/feishu-freertos-source-analysis/img-157.jpg]]

##### 为什么要判断 Growth？

情况 A：栈向上增长 （Growth > 0）

- 顺序：先申请 TCB，再申请 Stack。
- 理由：如果栈溢出了，它会往高地址走，离开 TCB 的区域，而不会直接把自己的“身份证”（TCB）改写掉。

情况 B：栈向下增长 （Growth < 0，绝大多数 MCU 如 STM32）

- 顺序：先申请 Stack，再申请 TCB。
- 理由：栈向下（低地址）增长。如果栈溢出了，它会向低地址跑，而 TCB 在高地址，这样可以保护 TCB 不被自己的栈数据冲掉。

pvPortMalloc 是什么？可以回去看一下 heap1-5

##### 申请成功之后先干嘛？

V11.1.0 的 `prvCreateTask()` 会先把新 TCB 清零，便于后续初始化；但这是版本源码实现，不应概括为所有 FreeRTOS 版本都完全相同。当前本地 V9 工程应以自己的 `tasks.c` 为准。

```c
( void ) memset( ( void * ) pxNewTCB, 0x00, sizeof( TCB_t ) );
/* Store the stack location in the TCB. */
pxNewTCB->pxStack = pxStack;
```

prvInitialiseNewTask这个函数可以去看一下！因为前面我们内存申请已经完成了，它的工作是把 TCB 结构体里的各种属性填好，并把栈空间初始化成“随时可以起跑”的状态。

#### `prvInitialiseNewTask()`：初始化任务 TCB 与初始栈帧

![[assets/feishu-freertos-source-analysis/img-158.jpg]]

![[assets/feishu-freertos-source-analysis/img-159.jpg]]

- #define tskSTACK\_FILL\_BYTE ( 0xa5U )

- 1.先使用 0XA5 填充栈 ：你在调试时看到的栈内容全是 A5A5A5A5 就是这个原因。

- 2.计算栈顶地址（最关键的逻辑）

- 栈增长方向：portSTACK\_GROWTH < 0 表示"向下增长" 一般咱们学习的 ARM 架构，栈都是从高地址向低地址生长。

- 对齐强制：通过位运算清除低位，确保地址是 8 字节或 4 字节对齐（取决于架构要求）

- 双指针体系：pxTopOfStack（当前栈顶，会变化） vs pxEndOfStack（栈边界，固定不变）

- 3\. 任务名处理

  即使名字超长，也会强制在末尾加 `\0`，防止调试器查看 TCB 时字符串越界崩溃。

- 4. 优先级与互斥量

  - 传入的任务优先级必须落在 `0 .. configMAX_PRIORITIES - 1`；例如 `configMAX_PRIORITIES = 5` 时，传入 10 会被限制为 4，而不是 5。
  - `uxBasePriority` 记录任务的“原始优先级”。当任务持有互斥量、优先级被临时提升后，释放互斥量时会恢复到 `uxBasePriority`。

- 5. 列表项初始化（调度器的基础设施）

  - `xStateListItem`：表示任务当前处于就绪列表、阻塞列表还是挂起列表。
  - `xEventListItem`：用于事件等待（如信号量、队列）。其值设为 `configMAX_PRIORITIES - uxPriority`，保证高优先级任务在事件列表升序排列时也排在前面。

- 6. 栈帧初始化（假装任务已被中断）

  新任务第一次运行时需要“恢复”上下文，就像它已经被调度器中断过一样：

  - 把 `pxTaskCode`（任务函数地址）填入返回地址（LR/PC 位置）。
  - 把 `pvParameters` 放入 R0（ARM 传参约定）。
  - 初始化 xPSR、LR 等寄存器为默认值。

- 7. 返回句柄

  `TaskHandle_t` 其实就是 `TCB_t *` 的不透明封装。后续对任务的操作（删除、挂起、修改优先级）都通过这个句柄找到对应的 TCB。

##### 💡 总结一下

这个函数做完后，任务已经是一个独立的、完整的个体了。它有名字、有等级、有自己的行李（栈数据），也拿到了自己的身份证（句柄）。

但是，它现在还在“冷宫”里，调度器还不知道它的存在。

#### `prvAddNewTaskToReadyList()`：将新任务加入就绪列表

执行相关的初始化和优先级管理操作。该函数确保任务创建过程的原子性和正确性，是任务从创建到可执行状态的关键过渡点。

> 🌈
>
> 1.
>
> 进入临界区
>
> 2.
>
> 更新任务数量：用于系统状态统计和任务调度决策
>
> 3.
>
> 当前任务指针处理
>
> 情况 A：无当前任务（pxCurrentTCB == NULL）
>
> - 将新任务设为当前执行任务
>
> - 如果是第一个创建的任务，调用 prvInitialiseTaskLists() 初始化所有任务列表（就绪、阻塞、挂起等）
>
> 情况 B：已有当前任务（pxCurrentTCB!= NULL）
>
> - 仅当调度器未运行时，比较优先级
>
> - 如果新任务优先级更高或相等，将其设为当前任务
>
> - 调度器运行时，不改变当前任务（由调度器自行决定）
>
> 4.
>
> 任务编号和跟踪：为任务分配唯一编号并记录创建事件
>
> 5.
>
> 添加到就绪列表：根据任务优先级将其插入到相应的就绪列表中（将任务 TCB 添加到对应优先级的双向链表中）
>
> 6.
>
> 端口相关 TCB 设置
>
> 7.
>
> 退出临界区
>
> 8.
>
> 任务切换判断
>
> - 如果新任务优先级高于当前任务，触发任务切换
>
> - 在多核系统中，可能需要在适当的核心上触发切换

![[assets/feishu-freertos-source-analysis/img-160.jpg]]

![[assets/feishu-freertos-source-analysis/img-161.jpg]]

#### `vTaskDelete()`：删除任务

- 删除当前任务：当前任务不能在仍执行自身代码时释放自己的栈和 TCB；内核会把它放入终止列表，由空闲任务稍后清理调度器分配的内存。
- 删除其他任务：若目标不是当前正在运行的任务，调度器分配的 TCB/栈通常可在删除路径中释放；应用自己通过 `malloc` 或外设分配的资源不会由 `vTaskDelete()` 自动释放。
![[assets/feishu-freertos-source-analysis/img-162.jpg]]

![[assets/feishu-freertos-source-analysis/img-163.jpg]]

![[assets/feishu-freertos-source-analysis/img-164.jpg]]

![[assets/feishu-freertos-source-analysis/img-165.jpg]]

```c
#define prvGetTCBFromHandle( pxHandle )    ( ( ( pxHandle ) == NULL ) ? pxCurrentTCB : ( pxHandle ) )
```

##### 获取目标并从列表中移除

- 先用 `prvGetTCBFromHandle()` 将 `NULL` 解析为当前任务句柄，再从状态列表和事件列表中移除目标任务。

##### 运行中任务放入终止等待列表

多核系统的我就没截图了。

##### 真正的清理（临界区外）

注意：如果是自删，prvDeleteTCB 不会在这里调用，而是由空闲任务稍后调用。

##### 简易版理解：

自己删自己时，必须立刻“让出” CPU，否则会继续执行已不存在的任务的后续代码。

```c
taskYIELD_WITHIN_API();  /* 触发上下文切换 */
```

#### `vTaskSuspend()`：挂起任务

将指定任务移入挂起列表，使其不再参与调度；这不是挂起整个调度器。如需暂停调度器，应使用 `vTaskSuspendAll()`。

##### 注意事项

- 挂起的任务需要显式调用 vTaskResume() 来恢复
- 挂起自己时，必须有其他就绪任务可运行
- 不能从中断服务程序中调用此函数
![[assets/feishu-freertos-source-analysis/img-166.jpg]]

![[assets/feishu-freertos-source-analysis/img-167.jpg]]

![[assets/feishu-freertos-source-analysis/img-168.jpg]]

![[assets/feishu-freertos-source-analysis/img-169.jpg]]

##### 1. 获取任务控制块

- 传入 `NULL` 时表示挂起当前正在运行的任务。

##### 2. 从就绪/延时列表中移除

```c
uxListRemove( &( pxTCB->xStateListItem ) );
```

- 从就绪列表或延迟列表中移除任务。
- 如果该优先级下没有其他就绪任务，清除就绪位图中的对应位。

##### 3. 处理事件列表项

```c
uxListRemove( &( pxTCB->xEventListItem ) );
```

- 如果任务正在等待某个事件（如队列、信号量等），从事件列表中移除。

##### 4. 加入挂起列表

```c
vListInsertEnd( &xSuspendedTaskList, &( pxTCB->xStateListItem ) );
```

- 将任务添加到全局挂起列表 xSuspendedTaskList

##### 5. 处理任务通知（配置启用时）

- 如果任务正在等待通知，将其状态重置为不等待

##### 6. 单核系统处理

分为几种情况：

如果调度器已经开启了：调用 prvResetNextTaskUnblockTime()

因为被挂起的任务可能原本在延迟列表中等待唤醒，现在被移除了，需要重新计算下一个任务的唤醒时间。

##### 调度器尚未启动时

这种情况发生在调用 `vTaskStartScheduler()` 之前挂起任务。

分支 1：所有任务都被挂起

- 条件：挂起列表长度 == 总任务数。
- 操作：将 `pxCurrentTCB` 设为 `NULL`。
- 意义：没有任务可以运行，系统处于“空转”状态。
- 后续：当创建新任务时，会检查 `pxCurrentTCB` 是否为 `NULL`；如果是，新任务会成为当前任务。

分支 2：还有任务未挂起

- 条件：还有其他任务处于就绪状态。
- 操作：调用 `vTaskSwitchContext()`。
- 功能：从就绪列表中选择最高优先级的任务作为新的当前任务。
- 注意：此时调度器未启动，所以不会真正进行上下文切换，只是更新 `pxCurrentTCB` 指针。

如果挂起的当前任务：

- pxCurrentTCB 是全局指针，指向当前正在执行的任务控制块

- 调用 portYIELD\_WITHIN\_API()

  - 触发一次上下文切换

  - CPU 切换到下一个最高优先级的就绪任务

  - 当前任务（被挂起的）不再执行

#### `vTaskResume()`：将挂起任务恢复为就绪状态

恢复一个被 vTaskSuspend() 挂起的任务，使其重新进入就绪状态

##### 不能从中断调用

- 恢复任务应使用 xTaskResumeFromISR()，有专门的 ISR 函数
- vTaskResume() 包含临界区操作，不适合中断上下文

##### 任务状态要求

- 只能恢复被 vTaskSuspend() 挂起的任务
- 不能恢复已删除的任务
- 不能恢复阻塞在事件上的任务（应使用对应的事件 API）

##### 自我恢复无效

- 不能恢复当前正在运行的任务（单核明确检查）
- 这种操作无意义
![[assets/feishu-freertos-source-analysis/img-170.jpg]]

![[assets/feishu-freertos-source-analysis/img-171.jpg]]

##### 进入临界区

- 保护对任务列表的访问

- 防止中断干扰任务状态变更

##### 检查任务是否确实被挂起

- prvTaskIsTaskSuspended() 检查任务是否在挂起列表中

##### 从挂起列表移除（就是链表的操作，前面有讲这个函数）

```c
( void ) uxListRemove( &( pxTCB->xStateListItem ) );
```

- 将任务从挂起列表 xSuspendedTaskList 中移除

##### 加入就绪列表

```c
prvAddTaskToReadyList( pxTCB );
```

- 将任务添加到对应优先级的就绪列表

##### 触发可能的调度

```c
taskYIELD_ANY_CORE_IF_USING_PREEMPTION( pxTCB );
```

- 宏功能：如果使用抢占式调度，可能触发任务切换

- 特殊处理：恢复的任务不一定立即运行，但确保调度器状态正确

#### `prvCreateIdleTasks()`：创建空闲任务（以单核为例）

为每个 CPU 核心创建空闲任务。空闲任务是系统中优先级最低的任务，当没有其他任务可运行时，调度器会运行空闲任务。

- 空闲任务总是系统中优先级最低的任务
- 当没有其他就绪任务时运行

##### 作用：

标准空闲任务（prvIdleTask）：

  - 执行系统清理工作

  - 处理已删除任务的内存回收

  - 进入低功耗模式（如果启用）

  - 执行空闲任务钩子函数

被动空闲任务（prvPassiveIdleTask，多核专用）：了解了解

  - 仅等待其他任务

  - 不执行系统清理工作

  - 避免多核间的同步冲突

![[assets/feishu-freertos-source-analysis/img-172.jpg]]

![[assets/feishu-freertos-source-analysis/img-173.jpg]]

![[assets/feishu-freertos-source-analysis/img-174.jpg]]

![[assets/feishu-freertos-source-analysis/img-175.jpg]]

单核端口中，可将空闲任务函数理解为：

```c
pxIdleTaskFunction = prvIdleTask;
```

标准空闲任务（处理系统清理工作）就是咱们说的清除自杀任务的“碎片”

##### 12.1 复制空闲任务名称

去自己定义的名字复制：

```c
#define configIDLE_TASK_NAME    "IDLE"
```

复制名称时遇到字符串结束符就停止复制。

##### 12.2 循环为每个核心创建空闲任务（此处以单核为例）

```c
BaseType_t xCoreID;  /* 核心 ID 循环变量 */
```

##### 12.3 创建空闲任务

这个看是静态分配还是动态分配

##### 如果是静态分配：xTaskCreateStatic

- 用户提供内存缓冲区

- 调用用户回调函数获取内存地址

##### 动态分配（默认）

- 系统自动分配内存

- `portPRIVILEGE_BIT` 是某些 MPU/特权端口使用的权限标志，不是数值任务优先级的一部分；空闲任务的数值优先级仍是 `tskIDLE_PRIORITY`（通常为 0）。

- 使用最小栈大小 configMINIMAL\_STACK\_SIZE

#### `vTaskStartScheduler()`：启动调度器（重点）

启动 FreeRTOS 实时内核，开始任务调度。这是从"裸机"程序切换到 RTOS 多任务环境的关键函数。

![[assets/feishu-freertos-source-analysis/img-176.jpg]]

![[assets/feishu-freertos-source-analysis/img-177.jpg]]

![[assets/feishu-freertos-source-analysis/img-178.jpg]]

##### 1. 创建空闲任务：`prvCreateIdleTasks()`

- 创建系统中优先级最低的任务（优先级 0）。
- 空闲任务确保系统总有任务可运行。
- 如果创建失败，后续步骤不会执行

##### 2. 创建定时器任务（可选）

- 如果启用软件定时器，创建定时器服务任务

- 该任务处理所有定时器回调

- 优先级由 configTIMER\_TASK\_PRIORITY 配置

##### 3. 用户自定义初始化（V11.1.0 等版本的可选扩展）

- 某些版本支持在 `FreeRTOSConfig.h` 中定义 `FREERTOS_TASKS_C_ADDITIONS_INIT`；V9 工程不一定存在该扩展，使用前先查对应版本的 `tasks.c`。

##### 4. 关键的系统初始化

> 关闭中断、初始化 Tick/调度器状态，并按配置启动运行时统计计时器。

##### 4.1 关闭中断

- 目的：确保在初始化过程中不发生中断

- 时机：在开始调度前关闭，防止 tick 中断干扰

- 恢复：第一个任务启动时会自动打开中断

##### 4.2 初始化全局变量

```c
xNextTaskUnblockTime = portMAX_DELAY;          // 下一个任务解除阻塞的时间
xSchedulerRunning = pdTRUE;                    // 标记调度器已运行
xTickCount = configINITIAL_TICK_COUNT;         // 系统节拍计数器
```

##### 4.3 运行时统计配置

- 如果启用运行时统计（configGENERATE\_RUN\_TIME\_STATS）

- 配置用于统计的硬件定时器

**5. 启动硬件相关的调度器：`xPortStartScheduler()`**

#### `xPortStartScheduler()`：启动硬件相关调度

它负责完成从初始化阶段到任务执行阶段的过渡，初始化 Cortex-M 处理器的中断优先级配置，并开始第一个任务的执行

![[assets/feishu-freertos-source-analysis/img-179.jpg]]

![[assets/feishu-freertos-source-analysis/img-180.jpg]]

![[assets/feishu-freertos-source-analysis/img-181.jpg]]

##### 1. 中断优先级位检查（仅在调试模式下）

- 这部分只在启用断言的调试模式下执行，目的是：
  - 检测硬件支持的优先级位数。
  - 验证系统调用优先级。
- 优先级分组检查

- 防止配置错误导致系统异常

##### 2. 设置 PendSV 和 SysTick 的中断优先级

```c
#define portNVIC_PENDSV_PRI ( ( ( uint32_t ) portMIN_INTERRUPT_PRIORITY ) << 16UL )
#define portNVIC_SYSTICK_PRI ( ( ( uint32_t ) portMIN_INTERRUPT_PRIORITY ) << 24UL )
```

- PendSV：任务切换中断（优先级最低）

- SysTick：系统节拍中断

- 设置为最低优先级，确保它们不会抢占其他中断

##### 3. 配置 SysTick 定时器

- 将 reload 值设置为 `configCPU_CLOCK_HZ / configTICK_RATE_HZ - 1`（具体寄存器和时钟源以目标 Cortex-M port 为准）。

##### 4. 初始化临界区嵌套计数器

- 将端口相关的临界区嵌套计数器初始化为未进入临界区状态。

##### 5. 启动第一个任务

- 最关键的一步：启动第一个任务的执行

- 通常使用汇编语言实现

- 此函数不会返回

关键调用：这是实际启动调度的地方；硬件相关实现由移植层提供，通常不返回，而是进入无限调度循环。

##### 为什么 PendSV 优先级最低？

- PendSV 用于延迟的上下文切换
- 设置为最低优先级，确保： a. 其他高优先级中断可以及时处理 b. 任务切换不会打断关键中断 c. 所有挂起的中断处理完后才切换任务

##### 启动第一个任务的过程

```asm
prvStartFirstTask:
    ; 1. 设置 MSP（主栈指针）
    ldr r0, =0xE000ED08  ; 向量表偏移寄存器地址
    ldr r0, [r0]         ; 读取向量表地址
    ldr r0, [r0]         ; 读取第一个向量的值（初始MSP）
    msr msp, r0          ; 设置主栈指针
    
    ; 2. 使能中断
    cpsie i              ; 开中断
    cpsie f              ; 开Fault中断
    dsb                  ; 数据同步屏障
    isb                  ; 指令同步屏障
    
    ; 3. 触发 SVC 中断开始第一个任务
    svc 0                ; 触发SVC中断
    
    ; 不会执行到这里
```

##### 为什么这个函数通常不返回？

- prvStartFirstTask() 触发 SVC 中断
- SVC 中断服务程序进行第一次上下文切换
- CPU 开始执行用户创建的最高优先级任务
- 从此进入 FreeRTOS 的调度循环

```c
prvStartFirstTask();  // 启动第一个任务
return 0;  // 理论上不会执行到这里
```

#### `vTaskSuspendAll()`：挂起任务调度器

它不会禁用中断，而是停止任务切换，允许中断继续执行但不会触发上下文切换。

##### 核心功能

- 暂停任务调度器的运行
- 允许中断继续执行
- 支持嵌套调用（可以多次调用，需要相应次数的恢复）
- 适用于需要原子地执行一系列操作但又不想完全禁用中断的场景
![[assets/feishu-freertos-source-analysis/img-182.jpg]]

##### 与临界区的区别

- `vTaskSuspendAll()` 只禁止任务调度，不屏蔽中断；临界区通常会屏蔽部分或全部中断。
- 前者适合保护只涉及任务的内核操作，后者才适合保护会被 ISR 同时访问的共享状态。

##### 使用注意事项

1. 调用上下文：
   - 只能从任务内部调用，不能从 ISR 中调用
   - 不能在临界区内调用
1. 配对使用：
   - 必须与xTaskResumeAll()配对使用
   - 挂起和恢复的次数必须相等
1. 中断处理：
   - 挂起期间中断会继续执行；若 ISR 使任务就绪，内核会暂存相关处理，待调度器恢复后处理。
   - `xTaskResumeAll()` 不是 ISR API；ISR 应使用相应的 `FromISR` 接口。
1. 资源保护：
   - 虽然阻止了任务切换，但共享资源仍可能被 ISR 访问
   - 对于同时被任务和 ISR 访问的资源，仍需额外保护
1. 执行时间：
   - 挂起期间应尽量减少执行时间，避免影响系统响应性
   - 长时间挂起调度器可能导致任务饥饿和系统不稳定

#### `xTaskResumeAll()`：恢复任务调度器

处理在调度器挂起期间积累的就绪任务和时钟 tick，并根据需要触发任务切换。

##### 核心功能

- 递减调度器挂起计数器
- 处理挂起期间积累的就绪任务（从 xPendingReadyList 移动到就绪列表）
- 处理挂起期间积累的时钟 tick
- 根据任务优先级决定是否需要触发任务切换
- 支持嵌套调用的正确恢复

##### 进入临界区并初始化

![[assets/feishu-freertos-source-analysis/img-183.jpg]]

- 进入临界区保护共享资源

- 获取当前核心 ID

- 断言确保调度器确实处于挂起状态

- 递减挂起计数器uxSchedulerSuspended

- 释放任务锁

##### 处理挂起期间的就绪任务

![[assets/feishu-freertos-source-analysis/img-184.jpg]]

- 仅当挂起计数器减至 0（完全恢复调度器）时执行

- 循环处理xPendingReadyList中的所有任务（链表操作）：

  - 从 pending 列表中获取任务

  - 移除任务的事件列表项和状态列表项

  - 将任务添加到就绪列表

  - 在单核系统中，如果新就绪任务优先级更高，则标记需要任务切换

- 重置下一个任务唤醒时间

  - prvResetNextTaskUnblockTime();

  - 当有任务从 pending 列表移到就绪列表时调用

  - 重新计算下一个需要唤醒的任务时间

  - 对低功耗 tickless 模式特别重要

##### 处理挂起期间的时钟 tick

![[assets/feishu-freertos-source-analysis/img-185.jpg]]

- 获取挂起期间积累的 tick 计数

- 逐个处理这些 tick：

  - 调用xTaskIncrementTick()处理每个 tick

  - 如果需要任务切换，则设置标记

- 重置积累的 tick 计数

##### 处理任务切换

![[assets/feishu-freertos-source-analysis/img-186.jpg]]

- 当需要任务切换时：

  - 如果启用了抢占式调度，则设置xAlreadyYielded = pdTRUE

  - 在单核系统中，调用taskYIELD\_TASK\_CORE\_IF\_USING\_PREEMPTION()触发任务切换

##### 关键技术点

1. 嵌套恢复机制
- 使用uxSchedulerSuspended计数器跟踪嵌套挂起的次数
- 只有当计数器减至 0 时，才完全恢复调度器并处理挂起期间的事件
1. Pending Ready 列表
- 当调度器挂起时，原本应该进入就绪列表的任务会被放入xPendingReadyList
- 恢复调度器时，这些任务会被批量处理并移至就绪列表
1. Tick 处理
- 使用xPendedTicks记录调度器挂起期间的 tick 数
- 恢复时逐个处理这些 tick，确保时间计数准确
1. 任务切换决策
- 基于任务优先级和抢占式调度配置决定是否需要任务切换
- 使用xYieldPendings标记需要切换的核心

##### 使用注意事项

1. 配对使用：必须与vTaskSuspendAll()配对使用，恢复次数应与挂起次数相同
1. 返回值：
   - 如果返回pdTRUE，表示已经发生了任务切换
   - 如果返回pdFALSE，表示没有发生任务切换
1. 调用上下文：
   - `xTaskResumeAll()` 通常从任务上下文调用，不应在 ISR 中调用。
1. 性能影响：
   - 恢复时需要处理挂起期间积累的所有事件，可能导致执行时间较长
   - 应尽量减少调度器挂起的时间
1. 与临界区的关系：
   - 函数内部使用临界区保护共享资源
   - 调用时不需要额外的临界区保护

#### `xTaskGetTickCount()`：获取系统 Tick 计数

- 将全局变量xTickCount的值赋给局部变量xTicks
![[assets/feishu-freertos-source-analysis/img-187.jpg]]

##### 核心技术点

1. Tick 计数机制
- xTickCount：FreeRTOS 内核维护的全局变量，记录系统从启动到现在的 Tick 总数
- Tick 间隔：由configTICK\_RATE\_HZ宏定义，通常为 100Hz（10ms/Tick）或 1000Hz（1ms/Tick）
- 溢出处理：TickType\_t通常是 32 位无符号整数，在 100Hz 下约 497 天溢出，1000Hz 下约 49.7 天溢出
1. 临界区保护的必要性
- 注释中特别说明："在 16 位处理器上需要临界区保护"
- 原因：16 位处理器无法原子地读取 32 位的xTickCount变量
- 在 32 位 Cortex-M 上读取原生宽度的 Tick 通常是原子的；是否仍进入临界区取决于 FreeRTOS 版本和 port，不能把“所有版本都保留临界区”当成固定行为。
1. 与 ISR 的兼容性
- 此函数可以在任务中安全使用
- 在中断服务程序（ISR）中，应该使用xTaskGetTickCountFromISR()函数：确保得到的计数值不会因中断嵌套或并发访问而出现错误
- xTaskGetTickCountFromISR()是xTaskGetTickCount()的 ISR 安全版本
- ISR 中应使用版本/port 提供的 `xTaskGetTickCountFromISR()`；其具体屏蔽方式由 port 决定，不应把某一版本的 `portTICK_TYPE_*` 宏描述成所有 Cortex-M port 的固定实现。
- 原子操作保证
  - 在中断保护区域内读取 xTickCount，确保读取操作的原子性
  - 防止在读取过程中因中断导致的计数值不一致问题

##### 注意事项

1. 溢出处理：
   - Tick 计数会定期溢出，不要直接使用比较运算符（<， >）比较 Tick 值
   - 不要直接用普通 `<` / `>` 跨 Tick 溢出比较；优先使用 `vTaskDelayUntil()`、`vTaskSetTimeOutState()` / `xTaskCheckForTimeOut()` 等目标版本提供的接口，或按目标 port/版本定义的 Tick 比较宏。FreeRTOS 并非所有版本都有 `pdTICKS_GREATER_THAN`。
1. 低功耗模式：
   - 在低功耗 tickless 模式下，xTickCount可能不会在系统休眠时更新
   - 需要特别注意时间计算的准确性
1. 函数调用开销：
   - 虽然函数本身很简单，但进入/退出临界区有一定开销
   - 频繁调用时应考虑性能影响
1. 配置依赖：
   - 函数的行为依赖于configTICK\_RATE\_HZ配置
   - 确保此配置与系统时钟设置一致

#### `vTaskSwitchContext()`：选择下一个运行任务

选择下一个要运行的任务。它根据优先级和时间片配置更新 `pxCurrentTCB`；栈溢出检查、运行时统计、TLS 等内容是否参与取决于配置和版本。它是内核/port 内部函数，应用通常不应直接调用；具体由 Tick、阻塞/唤醒和 yield 路径在所需的临界区或中断保护下调用。

流程图：
![[assets/feishu-freertos-source-analysis/img-188.jpg]]

![[assets/feishu-freertos-source-analysis/img-189.jpg]]

##### 在 FreeRTOS 调度中的位置

vTaskSwitchContext() 是 FreeRTOS 调度器的核心组成部分，通常在以下情况下被调用：

1. 系统 tick 中断：定期检查任务状态，决定是否需要任务切换
1. 任务阻塞：当任务调用阻塞 API（如 vTaskDelay()、xQueueReceive() 等）时
1. 任务解除阻塞：当任务从阻塞状态变为就绪状态时（如中断中释放信号量）
1. 任务优先级变化：当任务优先级被动态修改时
1. 手动请求任务切换：当调用 taskYIELD() 或 taskYIELD\_FROM\_ISR() 时

##### 使用注意事项

1. 调用上下文限制：
   - 通常由内核/port 在已经建立保护的上下文中调用，应用程序一般不需要直接调用。
   - 不要自行绕过内核保护直接调用；具体临界区要求以目标版本的调用路径为准。
1. 调度器状态影响：
   - 当调度器挂起时，函数不会执行实际的任务切换
   - 而是设置挂起标志，等待调度器恢复时处理
1. 性能影响：
   - 函数的执行效率直接影响系统的实时性能
   - 端口通常会提供汇编优化版本以提高性能
1. 配置依赖：
   - 函数的行为受多个配置宏影响，使用时需了解当前的 FreeRTOS 配置

#### `vTaskPlaceOnEventList()`：将当前任务加入事件列表并阻塞

![[assets/feishu-freertos-source-analysis/img-190.jpg]]

> 该内部函数要求调用者已经关闭中断或挂起调度器，并且相关队列/事件对象已经处于内核规定的锁定状态；不能作为普通应用 API 单独调用。

##### 核心解析：

1. 将任务插入事件列表：
   - vListInsert(pxEventList, &(pxCurrentTCB->xEventListItem))：将当前任务的事件列表项插入到指定的事件列表中
   - 每个任务 TCB 中都包含一个xEventListItem字段，用于在等待事件时链接到相应的事件列表
1. 将任务添加到延迟列表：
   - `prvAddCurrentTaskToDelayedList( xTicksToWait, pdTRUE )`：将当前任务添加到延时列表。
   - 第二个参数 `pdTRUE` 表示允许在配置支持时把 `portMAX_DELAY` 解释为无限阻塞，不是“相对时间”的标志；`xTicksToWait` 本身才是等待 Tick 数。
   - 此函数会：
     - 更新任务的阻塞时间
     - 将任务从就绪列表移除
     - 根据超时时间将任务添加到合适的延迟列表
     - 如果需要，更新系统下一次唤醒时间

#### `xTaskPriorityInherit()`：优先级继承

用于解决优先级反转问题。当一个高优先级任务等待一个低优先级任务持有的互斥锁时，该函数会将低优先级任务的优先级暂时提升到与高优先级任务相同，直到它释放互斥锁。

BaseType\_t xTaskPriorityInherit( TaskHandle\_t const pxMutexHolder )

- 参数：pxMutexHolder - 持有互斥锁的任务句柄
- 返回值：BaseType\_t - 表示是否发生了优先级继承（pdTRUE 表示发生继承，pdFALSE 表示未发生）

流程图：

![[assets/feishu-freertos-source-analysis/img-191.jpg]]

![[assets/feishu-freertos-source-analysis/img-192.jpg]]

##### 初始化与参数检查

- 将任务句柄转换为 TCB 指针

- 初始化返回值为 pdFALSE

- 检查互斥锁持有者是否为 NULL

##### 优先级比较与继承条件判断

- 只有当互斥锁持有者的当前优先级低于请求锁的任务（当前任务）优先级时，才需要进行优先级继承

##### 事件列表项处理

- 检查任务的事件列表项是否正在使用

- 如果未使用，设置其值为 configMAX\_PRIORITIES - 高优先级任务优先级

- 这一机制用于在任务阻塞在多个对象上时，确保优先级继承的正确性

##### 就绪列表中的任务处理

- 检查持有锁的任务是否在其当前优先级的就绪列表中

##### 从原就绪列表移除

- 将任务从其当前优先级的就绪列表中移除

- 如果移除后该优先级列表为空，重置该优先级的就绪标志

##### 继承优先级并添加到新就绪列表

- 将持有锁的任务优先级提升到与当前任务相同

- 将任务添加到新优先级的就绪列表中

##### 非就绪任务的处理

- 如果持有锁的任务不在就绪列表（例如处于阻塞状态），只需直接修改其优先级

##### 优先级未提升的情况处理

- 如果持有锁的任务当前优先级不低于当前任务，但其实时基础优先级低于当前任务

- 仍返回 pdTRUE，表示从基础优先级角度看需要继承（这是优先级继承机制的一部分，确保后续正确恢复优先级）

##### 关键技术点

优先级继承机制

优先级继承是解决优先级反转问题的关键机制：

- 当高优先级任务等待低优先级任务持有的资源时
- 低优先级任务暂时继承高优先级任务的优先级
- 这样可以减少低优先级任务被其他中优先级任务抢占的可能性
- 从而降低优先级反转的持续时间

事件列表项的作用

xEventListItem 的值设置为 configMAX\_PRIORITIES - 优先级 是一个巧妙的设计：

- 确保在任务阻塞在多个对象上时，能够正确记录最高的继承优先级
- 在释放资源时，能够正确恢复到合适的优先级

就绪列表管理

函数中对就绪列表的操作确保了：

- 任务从原优先级列表中正确移除
- 当列表为空时更新最高就绪优先级标志
- 任务被正确添加到新优先级的就绪列表

#### `ulTaskGenericNotifyTake()`：获取任务通知（V11 内部实现；V9 为 `ulTaskNotifyTake()`）

比队列、信号量等传统同步机制更高效。V11 的内部实现支持通知数组索引；本地 V9 只有 `ulTaskNotifyTake()`，没有 `uxIndexToWaitOn` 参数。该函数允许任务等待通知，如果没有立即获得通知，可以选择阻塞指定时间。

##### 流程图：

![[assets/feishu-freertos-source-analysis/img-193.jpg]]

![[assets/feishu-freertos-source-analysis/img-194.jpg]]

![[assets/feishu-freertos-source-analysis/img-195.jpg]]

![[assets/feishu-freertos-source-analysis/img-196.jpg]]

##### 调度器挂起

- 先调用 `vTaskSuspendAll()` 暂停调度，再在临界区内检查并更新通知状态；恢复时由 `xTaskResumeAll()` 处理挂起期间积累的事件。

##### 临界区检查通知状态

- 必须进入临界区以原子方式检查通知状态并设置等待标志

- 如果通知计数为 0，标记任务为等待通知状态

- 如果等待时间大于 0，设置阻塞标志

##### 任务阻塞处理

- 如果需要阻塞，将当前任务添加到延迟列表

- `pdTRUE` 表示允许在配置支持时无限阻塞；它不是“使用绝对时间”的参数。

##### 强制任务切换

- 如果需要阻塞且调度器恢复时没有发生任务切换

- 强制进行一次任务切换，让其他就绪任务有机会执行

##### 处理通知计数

- 再次进入临界区处理通知计数

- 保存当前通知计数到返回值

- 根据 xClearCountOnExit 参数决定是清除计数还是递减计数

- 重置任务的通知等待状态

##### 关键技术点

任务通知机制

任务通知是一种轻量级通信机制：

- 每个任务可以有多个通知（由 configTASK\_NOTIFICATION\_ARRAY\_ENTRIES 配置）
- 比队列、信号量等更高效，因为不需要额外的内存分配
- 支持计数、二进制和邮箱三种工作模式

双重保护机制

函数同时使用了调度器挂起和临界区：

- 调度器挂起：防止任务切换，确保任务状态修改的原子性
- 临界区：防止中断干扰，确保对共享数据的原子访问
- 这种组合确保了在处理通知状态和阻塞逻辑时的安全性

阻塞机制

当没有通知可用时，任务可以选择阻塞：

- 通过 prvAddCurrentTaskToDelayedList 将任务添加到延迟列表
- 支持超时等待，避免无限期阻塞
- 与 FreeRTOS 的任务调度机制紧密集成

通知计数处理

根据参数不同，通知计数有两种处理方式：

- 清除计数：将通知计数设置为 0，适用于二进制同步场景
- 递减计数：将通知计数减 1，适用于计数同步场景

#### `prvAddCurrentTaskToDelayedList()`：将当前任务加入延时列表

将当前运行的任务从就绪状态转换为阻塞状态，并根据阻塞时间将其添加到适当的延迟列表中

##### 流程图：

![[assets/feishu-freertos-source-analysis/img-197.jpg]]

![[assets/feishu-freertos-source-analysis/img-198.jpg]]

![[assets/feishu-freertos-source-analysis/img-199.jpg]]

##### 初始化与准备

- 初始化局部变量，包括计算唤醒时间所需的变量

- 保存当前 Tick 计数（避免在计算过程中被修改）

- 获取指向两个延迟列表的指针（正常延迟列表和溢出延迟列表）

##### 从就绪列表移除任务

- 从就绪列表中移除当前任务

- 由于同一个列表项（xStateListItem）同时用于就绪列表和阻塞列表，必须先移除再添加

- 如果移除后该优先级的就绪列表为空，更新最高就绪优先级标志

##### 处理无限阻塞情况（如果支持）

- 如果配置了 INCLUDE\_vTaskSuspend 且满足无限阻塞条件

- 将任务添加到挂起任务列表，而不是延迟列表

- 这样可以确保任务不会被定时事件唤醒，只会通过显式的恢复操作唤醒

##### 处理有限超时情况

- 计算任务应该被唤醒的时间

- 设置列表项的值为唤醒时间，这样列表会按唤醒时间排序

##### 处理 Tick 计数溢出

- 检查计算出的唤醒时间是否溢出（如果唤醒时间小于当前时间，说明发生了溢出）

- 如果溢出，将任务添加到溢出延迟列表

- 如果未溢出，将任务添加到正常延迟列表

- 如果新添加的任务是所有阻塞任务中最早唤醒的，更新 xNextTaskUnblockTime

##### 关键技术点

列表项复用机制

- FreeRTOS 巧妙地复用了任务控制块（TCB）中的同一个列表项（xStateListItem）来表示任务在不同状态列表中的位置
- 这减少了内存占用，但要求在切换列表时必须先移除再添加

双延迟列表溢出处理

- FreeRTOS 使用两个延迟列表来处理 Tick 计数溢出问题：
  - pxDelayedTaskList：用于存储唤醒时间未溢出的任务
  - pxOverflowDelayedTaskList：用于存储唤醒时间已溢出的任务
- 这种机制确保了即使 Tick 计数器溢出，任务也能在正确的时间被唤醒

最高就绪优先级管理

- 当从就绪列表中移除任务时，如果该列表变为空，需要更新 uxTopReadyPriority
- 这确保了调度器总能快速找到最高优先级的就绪任务

### 第四章 `queue.c`

本章从 `Queue_t` 数据结构出发，分析队列创建、发送、接收以及互斥量复用队列机制的实现。

#### `QueueDefinition` 结构体

> 以下是根据经典内核整理的简化示意；实际 `Queue_t/QueueDefinition` 会因 FreeRTOS 版本和配置条件编译增加字段，不能直接复制编译。

```c
typedef struct QueueDefinition
{
    int8_t * pcHead;
    int8_t * pcWriteTo;
    union
    {
        QueuePointers_t xQueue;
        SemaphoreData_t xSemaphore;
    } u;
    List_t xTasksWaitingToSend;
    List_t xTasksWaitingToReceive;
    volatile UBaseType_t uxMessagesWaiting;
    UBaseType_t uxLength;
    UBaseType_t uxItemSize;       // 为 0 时常用于信号量/互斥量
    int8_t cRxLock;
    int8_t cTxLock;
    /* 还可能有静态分配标记、队列集容器、跟踪编号等条件字段。 */
} Queue_t;
```

#### 核心成员解析

1. 存储区管理
- pcHead：指向队列存储区的起始地址，存储队列的实际数据项
- pcWriteTo：指向下一个可写入的空闲位置
1. 队列/信号量共用联合体（所以说信号量的本质就是队列）

通过联合体实现同一结构体在不同场景下的复用：

1. 任务等待列表
- xTasksWaitingToSend：按优先级排序的等待发送任务列表
- xTasksWaitingToReceive：按优先级排序的等待接收任务列表
1. 队列状态信息
- uxMessagesWaiting：当前队列中的有效项目数量
  - 对于普通队列：表示队列中的数据项数
  - 对于信号量/互斥锁：表示可用资源数
- uxLength：队列可容纳的最大项目数
- uxItemSize：每个项目的字节大小（信号量为 0）
1. 队列锁定机制
- cRxLock：接收锁定计数（队列被锁定时的出队操作计数）
- cTxLock：发送锁定计数（队列被锁定时的入队操作计数）
- 锁定状态：
  - queueUNLOCKED （-1）：队列未锁定
  - queueLOCKED\_UNMODIFIED （0）：队列已锁定但未修改
  - 正数：锁定期间的操作计数

#### `xQueueGenericCreateStatic()`：静态队列的内核底层实现

- 静态创建各种类型的队列对象（基础队列、信号量、互斥锁等）
- 验证参数有效性并初始化队列结构
- 设置队列属性并准备队列存储区
- 是所有静态队列创建 API（如 `xQueueCreateStatic()`、`xSemaphoreCreateMutexStatic()` 等）的底层实现；应用代码应调用公开封装 API，不要直接依赖该内部函数。

```cpp
QueueHandle_t xQueueGenericCreateStatic( 
    const UBaseType_t uxQueueLength,     // 队列长度（可容纳项目数）
    const UBaseType_t uxItemSize,        // 每个项目的大小（字节）
    uint8_t * pucQueueStorage,           // 队列存储区指针
    StaticQueue_t * pxStaticQueue,       // 静态分配的队列结构体指针
    const uint8_t ucQueueType            // 队列类型
);
```

##### 参数详解：

- uxQueueLength：队列可容纳的最大项目数，必须大于 0
- uxItemSize：每个项目的字节大小，信号量/互斥锁设为 0
- pucQueueStorage：指向预分配的队列存储区内存
  - 对于队列：必须指向大小为uxQueueLength \* uxItemSize的内存块
  - 对于信号量/互斥锁：必须为 NULL
- pxStaticQueue：指向预分配的 StaticQueue\_t 结构体
- ucQueueType：队列类型，所有类型共享同一套实现代码，提高了代码复用性。如：
  - queueQUEUE\_TYPE\_BASE：基础队列
  - queueQUEUE\_TYPE\_MUTEX：互斥锁
  - queueQUEUE\_TYPE\_BINARY\_SEMAPHORE：二进制信号量
  - queueQUEUE\_TYPE\_COUNTING\_SEMAPHORE：计数信号量

##### 使用实例：

```cpp
// 静态创建队列示例
#define QUEUE_LENGTH 10
#define ITEM_SIZE sizeof(uint32_t)

StaticQueue_t xStaticQueue;
uint8_t ucQueueStorage[QUEUE_LENGTH * ITEM_SIZE];

QueueHandle_t xQueue = xQueueCreateStatic(
    QUEUE_LENGTH,
    ITEM_SIZE,
    ucQueueStorage,
    &xStaticQueue
);

// 静态创建互斥锁示例
StaticQueue_t xMutexBuffer;
SemaphoreHandle_t xMutex = xSemaphoreCreateMutexStatic(&xMutexBuffer);
```

##### 实际调用：`prvInitialiseNewQueue()`

![[assets/feishu-freertos-source-analysis/img-200.jpg]]

##### 队列存储区指针初始化

关键设计点：

- uxItemSize == 0：用于信号量/互斥锁，不需要存储区
  - 不能将 pcHead 设为 NULL，因为 NULL 用于标识队列作为互斥锁使用
  - 因此将 pcHead 指向队列自身地址作为一个安全的默认值
- uxItemSize!= 0：用于普通队列，需要存储实际数据
  - 将 pcHead 指向提供的存储区指针

##### 队列基本属性设置

- 设置队列长度和项目大小
- 调用 `xQueueGenericReset()` 进行全面重置，`pdTRUE` 表示这是一个新创建的队列。

##### 可选功能配置（可以先不了解）

- 队列集支持：初始化队列集容器指针为 NULL

##### `xQueueGenericReset()`：重置队列状态

- 初始化存储区指针（思想与环形缓冲区类似）。
- 重置队列状态
- 初始化等待任务列表（`vListInitialise()` 在第一章有讲）。
![[assets/feishu-freertos-source-analysis/img-201.jpg]]

#### `xQueueGenericCreate()`：动态创建队列、信号量或互斥锁

参数说明：

- uxQueueLength：队列可容纳的最大项数，必须大于 0
- uxItemSize：队列中每个项的大小（字节）。对于信号量，该值通常为 0
- ucQueueType：队列类型标识，常见值包括：
  - queueQUEUE\_TYPE\_BASE：普通队列
  - queueQUEUE\_TYPE\_MUTEX：互斥锁
  - queueQUEUE\_TYPE\_COUNTING\_SEMAPHORE：计数信号量
  - queueQUEUE\_TYPE\_BINARY\_SEMAPHORE：二进制信号量

进行三重参数验证：

1. 队列长度必须大于 0
1. 防止 uxQueueLength \* uxItemSize 乘法溢出
1. 防止 sizeof(Queue\_t) + (uxQueueLength \* uxItemSize) 加法溢出

##### 流程图：

![[assets/feishu-freertos-source-analysis/img-202.jpg]]

![[assets/feishu-freertos-source-analysis/img-203.jpg]]

##### 内存分配计算与申请

- 计算存储所有队列项所需的总字节数

- 分配连续内存块：

  - 前半部分：Queue\_t 结构体（队列控制块）

  - 后半部分：队列项存储区域

##### 存储区域定位

- 将存储区域指针定位到队列控制块之后的连续内存空间

##### 队列初始化

实际调用：prvInitialiseNewQueue 函数

- 设置队列状态（空/满）

- 初始化读写指针

- 设置队列长度和项大小

- 初始化任务等待列表

- 根据队列类型执行特定初始化

##### 内存布局设计

┌────────────────────────┐

│ Queue\_t │ // 队列控制块

├────────────────────────┤

│ 队列项存储区域 │ // uxQueueLength \* uxItemSize 字节

└────────────────────────┘

该函数作为所有队列/同步原语的创建入口，体现了 FreeRTOS 的统一架构设计思想：

- 普通队列、信号量、互斥锁等共享相同的核心数据结构（Queue\_t）
- 通过 ucQueueType 参数区分不同类型
- 减少代码冗余，提高维护性

##### 与静态创建的对比

- 动态创建：内存自动管理，使用简单，但可能导致内存碎片
- 静态创建：内存手动管理，无内存碎片，但需要预先分配内存

#### `xQueueCreateMutex()`：创建互斥锁

![[assets/feishu-freertos-source-analysis/img-204.jpg]]

##### `prvInitialiseMutex()`：初始化互斥锁

![[assets/feishu-freertos-source-analysis/img-205.jpg]]

```c
/* 设置互斥锁持有者为空 */
pxNewQueue->u.xSemaphore.xMutexHolder = NULL;

/* 标记队列类型为互斥锁 */
pxNewQueue->uxQueueType = queueQUEUE_IS_MUTEX;

/* 初始化递归调用计数（支持递归互斥锁） */
pxNewQueue->u.xSemaphore.uxRecursiveCallCount = 0;
```

最后通过调用 xQueueGenericSend 发送一个 NULL 到队列中，将互斥锁初始化为可用状态（相当于二进制信号量的"给出"操作）。就是说创建完之后就立马“释放”。

##### 关键技术

**优先级继承支持**

xMutexHolder 成员是优先级继承机制的关键：

- 当低优先级任务持有互斥锁时，若有高优先级任务请求该互斥锁，系统会暂时提高低优先级任务的优先级
- 这有效防止了优先级反转问题
- xMutexHolder 记录当前持有者，以便系统知道需要提升哪个任务的优先级

**递归互斥锁支持**

uxRecursiveCallCount 成员支持递归互斥锁功能：

- 同一任务可以多次获取同一个互斥锁，不会导致死锁
- 每次获取互斥锁，计数加 1；每次释放，计数减 1
- 只有当计数为 0 时，互斥锁才真正被释放

**互斥锁的初始状态**

通过 xQueueGenericSend 初始化互斥锁状态：

- 互斥锁本质上可看作是一个特殊的二进制信号量
- 初始调用 xQueueGenericSend 将互斥锁设置为"可用"状态
- 后续任务可以通过 xSemaphoreTake 获取互斥锁

##### 引申：计数信号量和二值信号量也复用队列机制

![[assets/feishu-freertos-source-analysis/img-206.jpg]]

#### `xQueueGenericSend()`：队列发送的底层函数

向队列发送数据的通用函数，是所有队列发送操作（包括普通队列、二进制信号量、计数信号量等）的核心实现。它提供了灵活的数据发送方式，支持不同的等待策略和数据插入位置。

参数说明：

- xQueue：目标队列的句柄，由队列创建函数返回
- pvItemToQueue：指向要发送数据的指针。对于信号量，该参数为 NULL
- xTicksToWait：队列满时的等待时间，可选值：
  - 0：立即返回，不等待
  - portMAX\_DELAY：无限等待
  - 具体数值：等待指定的 Tick 数
- xCopyPosition：数据插入队列的位置，可选值：
  - queueSEND\_TO\_BACK（默认）：插入队列末尾
  - queueSEND\_TO\_FRONT：插入队列开头
  - queueOVERWRITE：覆盖队列头部数据（仅队列长度为 1 时有效）

返回值：

- pdPASS：数据发送成功
- errQUEUE\_FULL：队列满且等待超时

##### 流程图：

![[assets/feishu-freertos-source-analysis/img-207.jpg]]

![[assets/feishu-freertos-source-analysis/img-208.jpg]]

参数验证就不看了。

##### 尝试发送数据（临界区内）

- 进入临界区保护队列操作
- 检查队列是否有空间或使用覆盖模式
- 调用 prvCopyDataToQueue 将数据复制到队列
- 如果有任务等待接收数据，唤醒优先级最高的等待任务
- 如果唤醒的任务优先级更高，触发上下文切换
- 退出临界区并返回成功

##### 队列满时的处理

![[assets/feishu-freertos-source-analysis/img-209.jpg]]
- 如果队列满且不等待，直接返回 errQUEUE\_FULL
- 如果需要等待，初始化超时状态

##### 任务阻塞与超时处理

![[assets/feishu-freertos-source-analysis/img-210.jpg]]
- 挂起调度器并锁定队列
- 检查超时是否已到
- 如果未超时且队列仍满：
  - 将当前任务放入等待发送列表
  - 解锁队列并恢复调度器
  - 如果有更高优先级任务就绪，触发上下文切换
- 如果队列已有空间，继续循环尝试发送
- 如果超时，解锁队列并返回 errQUEUE\_FULL

##### `xQueueGenericSendFromISR()` 与普通版本的关键区别

- ISR 版本不能阻塞，也不能直接操作会导致任务阻塞的路径；它使用端口提供的中断安全临界区，并通过 `pxHigherPriorityTaskWoken` 报告是否需要在退出中断前请求切换。

#### `xQueueReceive()`：接收队列数据

##### 读取函数系列

xQueueSemaphoreTake 和 xQueuePeek 其实也是类似的，就不讲了。

用于任务上下文从队列中获取数据项。它支持阻塞等待机制，当队列空时可选择等待指定时间或立即返回。

##### 流程图：

其实这些发送接收都大同小异，无非就是链表的切换！

![[assets/feishu-freertos-source-analysis/img-211.jpg]]

##### 初始化与参数验证

![[assets/feishu-freertos-source-analysis/img-212.jpg]]

##### 主循环 - 尝试接收数据：队列非空时的数据接收

![[assets/feishu-freertos-source-analysis/img-213.jpg]]
- 调用 prvCopyDataFromQueue 将队列中的数据复制到接收缓冲区
- 减少队列中的消息计数
- 检查是否有任务在等待发送数据，如果有则唤醒最高优先级的等待任务
- 如果唤醒了更高优先级的任务，且系统使用抢占式调度，则执行任务切换
- 返回成功

##### 队列空时的处理

![[assets/feishu-freertos-source-analysis/img-214.jpg]]
- 如果不等待（xTicksToWait == 0），则立即返回失败
- 如果需要等待，则初始化超时结构体（仅第一次进入此分支时）

##### 阻塞等待逻辑

第三个参数 `xTicksToWait` 为 0 时立即返回；大于 0 时，函数会更新超时状态并等待数据或超时。

![[assets/feishu-freertos-source-analysis/img-215.jpg]]
1. 挂起调度器：调用 vTaskSuspendAll() 防止其他任务干扰
1. 锁定队列：调用 prvLockQueue() 确保队列在检查和修改过程中不被其他任务访问
1. 检查超时：调用 xTaskCheckForTimeOut() 更新超时状态
1. 未超时处理：
   - 如果队列仍然为空，将当前任务添加到等待接收的任务列表中
   - vTaskPlaceOnEventList( &( pxQueue->xTasksWaitingToReceive ), xTicksToWait );
   - 解锁队列并恢复调度器
   - 如果恢复调度器后需要切换任务，则执行上下文切换
1. 超时处理：
   - 解锁队列并恢复调度器
   - 检查队列是否仍然为空，如果是则返回失败
   - 否则，继续循环尝试接收数据

#### `prvCopyDataFromQueue()`：从队列复制数据

将数据从队列缓冲区复制到用户提供的缓冲区中

- pxQueue: 指向队列控制块的指针（队列的内部表示）
- pvBuffer: 指向用户缓冲区的指针，用于存储从队列复制的数据
- 返回值： 无（void）
- 关键检查： 只有当 uxItemSize 不为 0 时才执行数据复制
- 设计意图： 当 uxItemSize 为 0 时，表示队列实际用作二值信号量或互斥锁，不需要传递实际数据，只需记录信号量状态
- 指针移动： 将读指针 pcReadFrom 向后移动一个数据项的大小
- 环形缓冲区处理： 当读指针超过队列尾部 pcTail 时，将其重置到队列头部 pcHead
- 设计优势： 实现了高效的环形缓冲区机制，避免了内存碎片和数据移动开销
- 数据复制： 使用 memcpy 函数将队列中的数据复制到用户缓冲区
- 类型转换：
  - (void \*)： 确保指针类型兼容
  - (size\_t)： 确保复制大小的类型正确
- （void） 前缀： 消除编译器可能产生的"未使用返回值"警告

#### `prvCopyDataToQueue()`：向队列复制数据

将用户数据复制到队列缓冲区中

##### 参数

- pxQueue: 指向队列控制块的指针（队列的内部表示）
- pvItemToQueue: 指向要写入队列的数据的指针
- xPosition: 数据插入位置（queueSEND\_TO\_BACK/queueSEND\_TO\_FRONT/queueOVERWRITE）
- 返回值： pdFALSE（一般情况）或优先级继承相关结果（互斥锁情况）

##### 流程图

![[assets/feishu-freertos-source-analysis/img-216.jpg]]

##### 初始化与临界区说明

![[assets/feishu-freertos-source-analysis/img-217.jpg]]
- 初始化： 设置默认返回值和获取当前队列消息数
- 临界区说明： 注释明确指出该函数在临界区内调用，无需额外的临界区保护
- 设计意图： 确保队列操作的原子性，避免数据竞争

##### 特殊情况处理（信号量/互斥锁）

- 处理条件： 当 uxItemSize 为 0 时（队列用作信号量或互斥锁）
- 互斥锁特殊处理：
  - 调用 xTaskPriorityDisinherit 撤销优先级继承
  - 清空互斥锁持有者信息
- 设计意图： 实现信号量和互斥锁的释放逻辑，复用队列结构

##### 正常队列操作（从尾部插入）

![[assets/feishu-freertos-source-analysis/img-218.jpg]]
- 处理条件： 当数据要插入队列尾部时
- 数据复制： 使用 memcpy 将数据复制到写指针位置
- 写指针更新： 写指针向后移动一个数据项大小
- 环形缓冲区处理： 当写指针超过队列尾部时，重置到队列头部
- 设计意图： 实现标准的 FIFO（先进先出）队列操作

##### 特殊队列操作（头部插入或覆盖）

![[assets/feishu-freertos-source-analysis/img-219.jpg]]
- 处理条件： 当数据要插入队列头部或覆盖队列数据时
- 数据复制： 将数据复制到读指针位置
- 读指针更新： 读指针向前移动一个数据项大小
- 环形缓冲区处理： 当读指针超过队列头部时，重置到队列尾部前一个位置
- 覆盖操作处理：
  - 如果是覆盖操作且队列非空
  - 先减少消息计数（因为后面会统一加 1，实现覆盖效果）
- 设计意图： 支持 LIFO（后进先出）和覆盖式写入等特殊队列操作

##### 更新消息计数与返回

![[assets/feishu-freertos-source-analysis/img-220.jpg]]
- 更新计数： 统一将队列消息数加 1（覆盖操作已提前减 1，所以最终保持不变）
- 返回结果： 返回优先级继承相关结果（仅互斥锁情况有意义）

`prvIsQueueEmpty()` 和 `prvIsQueueFull()` 只是对环形缓冲区空、满状态的内部判断，这里不再展开。

### 第五章 `timers.c`

本章关注定时器服务任务、活动定时器列表和命令队列之间的协作。

#### 定时器结构体

> 以下是定时器控制块的简化示意。实际类型名、状态位和条件字段以目标 FreeRTOS 版本的 `timers.c` 为准。

```c
typedef struct tmrTimerControl
{
    const char * pcTimerName;
    ListItem_t xTimerListItem;
    TickType_t xTimerPeriodInTicks;
    void * pvTimerID;
    TimerCallbackFunction_t pxCallbackFunction;
    /* 可选：跟踪编号、静态分配标记、活动状态等字段。 */
} Timer_t;
```

#### `xTimerCreateTimerTask()`：创建定时器服务任务

所有定时器的命令处理和到期回调都在这个任务中执行，是整个定时器系统的核心。回调运行在定时器服务任务上下文中，不应调用会无限阻塞的 API；回调执行时间过长也会延迟其他定时器命令和回调。

##### 核心功能

- 创建一个独立的任务（定时器服务任务），专门处理定时器相关工作
- 根据系统配置（单/多核、静态/动态内存）选择不同的任务创建方式
- 确保定时器系统的基础设施（命令队列、定时器列表）已初始化

##### 流程图

![[assets/feishu-freertos-source-analysis/img-221.jpg]]

![[assets/feishu-freertos-source-analysis/img-222.jpg]]

##### `prvCheckForValidListAndQueue()`：检查定时器列表和命令队列

初始化定时器系统的核心组件：定时器列表和定时器命令队列

##### 初始化命令队列前的检查

- 进入临界区，防止初始化过程中被其他任务或中断打断。
- `xTimerQueue` 是定时器系统的“神经中枢”，用于接收所有定时器命令。
- 如果队列已存在，说明基础设施已经初始化过，直接返回。

##### 流程图

![[assets/feishu-freertos-source-analysis/img-223.jpg]]

- 创建两个定时器列表，用于处理系统 tick 溢出的情况

- 定时器按到期时间排序，放在这两个列表中管理：

  - pxCurrentTimerList：当前活跃的定时器列表

  - pxOverflowTimerList：处理 tick 溢出时的定时器列表

静态分配和动态分配就不赘述了

- 预分配固定内存，无动态内存碎片问题

- 适合对内存有严格要求的应用

动态分配

- 自动从 FreeRTOS 堆中分配内存

- 使用简单，但可能产生内存碎片

##### 为什么需要两个定时器列表？

FreeRTOS 使用 "双列表机制" 处理系统 tick 溢出：

- 系统 tick 是一个无符号整数，会不断增加，最终溢出回 0

- 当 tick 溢出时，新的定时器会被放入 pxOverflowTimerList

- 当所有当前列表中的定时器都处理完毕后，两个列表的角色会交换

- 这种机制确保了定时器能正确处理跨溢出周期的到期时间

##### 内存分配方式

静态分配

```text
vApplicationGetTimerTaskMemory(/* 获取预分配的内存 */);
xTimerTaskHandle = xTaskCreateStatic(/* 使用静态内存创建任务 */);
```

- 从应用程序预先分配的内存中获取任务所需的栈和控制块
- 优点：无动态内存碎片，确定性强

动态分配

```text
xReturn = xTaskCreate(/* 动态分配内存创建任务 */);
```

- 自动从 FreeRTOS 堆中分配任务所需的内存
- 优点：使用简单，但可能产生内存碎片

任务参数配置 无论哪种创建方式，任务的核心参数都是固定的：

- 任务函数：prvTimerTask（定时器服务任务的主函数）
- 任务名称：configTIMER\_SERVICE\_TASK\_NAME（默认："Tmr Svc"）
- 优先级：configTIMER\_TASK\_PRIORITY（通常是系统最高优先级之一）
- 特权位：portPRIVILEGE\_BIT（如果支持特权模式，任务将在特权级运行）

#### `xTimerCreate()`：动态创建软件定时器

- 动态分配内存创建一个新的定时器结构体
- 初始化定时器的基本属性（名称、周期、回调函数等）
- 返回一个可用于后续操作的定时器句柄

##### 流程图

![[assets/feishu-freertos-source-analysis/img-224.jpg]]

![[assets/feishu-freertos-source-analysis/img-225.jpg]]

![[assets/feishu-freertos-source-analysis/img-226.jpg]]

##### 初始化

- 声明一个指针变量，用于指向将要创建的定时器

##### 动态分配内存

- 使用 pvPortMalloc 动态分配内存，大小为定时器结构体 Timer\_t 的大小

- 进行类型转换，并将分配的内存地址赋值给 pxNewTimer

检查内存分配是否成功

##### 初始化定时器状态

- ucStatus 是定时器的状态标志位

- 0x00 表示：定时器不是静态创建的，且尚未启动

##### 调用通用初始化函数（实质）

- 调用内部私有函数 prvInitialiseNewTimer 完成定时器的全面初始化

- 设置定时器的名称、周期、ID、回调函数等属性

- 初始化定时器链表项，为后续加入活动列表做准备

##### prvInitialiseNewTimer函数

其实就是给结构体赋值！

##### 使用举例：

```cpp
// 创建一个周期为1秒的自动重载定时器
TimerHandle_t xMyTimer;

// 定时器回调函数
void vMyTimerCallback(TimerHandle_t pxTimer)
{
    // 定时器到期时执行的代码
    printf("Timer expired!\n");
}

// 创建定时器
xMyTimer = xTimerCreate(
    "MyTimer",           // 定时器名称
    pdMS_TO_TICKS(1000), // 周期：1秒（转换为tick）
    pdTRUE,              // 自动重载
    NULL,                // 没有ID
    vMyTimerCallback     // 回调函数
);

// 检查定时器是否创建成功
if (xMyTimer != NULL)
{
    // 启动定时器
    xTimerStart(xMyTimer, 0);
}
```

#### `xTimerGenericCommandFromTask()`：从任务发送定时器命令

##### 流程图

![[assets/feishu-freertos-source-analysis/img-227.jpg]]

##### 初始化与准备

![[assets/feishu-freertos-source-analysis/img-228.jpg]]

##### `DaemonTaskMessage_t` 结构体与核心设计思想

- 定时器服务任务通过固定格式的命令消息接收启动、停止、复位和改周期等请求；调用方只负责投递消息，真正的链表操作在服务任务上下文中完成。

##### 检查命令队列并且构建命令消息

- 填充命令消息结构体的各个字段：
  - xMessageID：命令类型（如启动、停止、重置等）
  - xMessageValue：命令的可选参数（如新的周期值）
  - pxTimer：要操作的目标定时器
![[assets/feishu-freertos-source-analysis/img-229.jpg]]

##### 根据调度器状态发送命令

- 调度器已运行：使用指定的等待时间发送命令，队列满时会等待
- 调度器未运行：立即发送命令，不等待（因为没有任务调度，等待没有意义）
- 这里 xQueueSendToBack 实际就是 xQueueGenericSend 函数
![[assets/feishu-freertos-source-analysis/img-230.jpg]]

#### `xTimerGenericCommandFromISR()`：从中断发送定时器命令

它与任务版本的核心消息格式相同，但使用 `xQueueSendToBackFromISR()`，不能阻塞，并通过唤醒标志通知调用者是否需要请求上下文切换。

#### `prvProcessReceivedCommands()`：处理定时器命令队列

所有定时器操作（启动、停止、重置等）和延迟函数调用最终都在这里执行。

##### 核心作用

就像一个"定时器服务员"，负责处理所有发给定时器系统的"订单"（命令）：

- 从"订单队列"（定时器命令队列）中取出所有待处理的订单
- 根据订单类型（延迟函数调用或定时器操作）执行不同的服务
- 处理完所有订单后才休息（直到队列为空）

##### 流程图

![[assets/feishu-freertos-source-analysis/img-231.jpg]]

![[assets/feishu-freertos-source-analysis/img-232.jpg]]

##### 循环处理队列中的所有命令

- 不断从"订单队列"中取订单，直到队列为空（不等待新订单）
- 每个订单都装在一个"订单信封"（DaemonTaskMessage\_t）里

##### 处理改变定时器状态的命令

对启动、停止、复位、改周期等定时器控制命令，内核会按需要从活动列表移除/重新插入以保持状态一致；延迟函数调用等其他命令并不都对应一个活动定时器，不能概括成“无论收到什么命令都先移除定时器”。

![[assets/feishu-freertos-source-analysis/img-233.jpg]]

##### 读取队列与获取时间的顺序

- 先读取命令队列，再在同一服务任务上下文中获取当前 Tick，可避免高优先级任务在两步之间抢占造成时间基准不一致。

##### 启动/复位等命令的特殊处理

![[assets/feishu-freertos-source-analysis/img-234.jpg]]

Stop 命令只需清除活动标志，因为前面的处理已经把定时器移出活动列表。

- 活动定时器：ACTIVE 标志置位 + 在 xActiveTimerList 中
- 停止后：ACTIVE 标志清除 + 不在任何列表中

`Change_Period` 通常以当前时间加新周期重新计算到期点；若新周期为 0 或很小，仍可能很快到期，不能绝对说“不会立即到期”。

Delete：静态定时器的内存由用户提供，不能对 `&xTimerBuffer` 调用 `vPortFree()`；只有动态创建的定时器对象才由 FreeRTOS 堆回收。

设置或获取定时器 ID 等简单辅助函数不再展开。

![[assets/feishu-freertos-source-analysis/img-235.jpg]]

### 第六章 `event_groups.c`

本章分析事件组的创建、置位、清位、同步、等待和删除流程。

#### `EventGroup_t` 数据结构

需要注意的是只有当 FreeRTOSConfig.h 中 configUSE\_EVENT\_GROUPS 设为 1 时，事件组功能才会被编译。

```cpp
typedef struct EventGroupDef_t
{
    EventBits_t uxEventBits;            // 当前事件组的位状态
    List_t xTasksWaitingForBits;        // 等待事件位的任务列表
    #if ( configUSE_TRACE_FACILITY == 1 )
        UBaseType_t uxEventGroupNumber; // 用于跟踪的事件组编号
    #endif
    #if ( configSUPPORT_STATIC_ALLOCATION == 1 ) && ( configSUPPORT_DYNAMIC_ALLOCATION == 1 )
        uint8_t ucStaticallyAllocated;  // 标记事件组是否静态分配
    #endif
} EventGroup_t;
```

- EventBits\_t uxEventBits:

存储事件组的当前位状态（二进制位），每个位代表一个事件。例如，位 0 可表示“传感器数据就绪”，位 1 可表示“通信完成”等。

在 V9/V10 的 32 位 Tick 配置中，`EventBits_t` 通常为 `uint32_t`，但高 8 位用于内部控制信息，因此应用可用事件位通常只有低 24 位；16 位 Tick 时通常只有 8 位。V11.1.0 的可用位数还取决于 Tick 宽度（常见为 8/24/56）。

- List\_t xTasksWaitingForBits:

等待事件位的任务列表。当任务调用 xEventGroupWaitBits（） 等待特定事件时，会被加入此列表，直到事件满足条件。

#### `xEventGroupCreateStatic()`：静态创建事件组

##### 流程图（静态和动态）

![[assets/feishu-freertos-source-analysis/img-236.jpg]]

![[assets/feishu-freertos-source-analysis/img-237.jpg]]

![[assets/feishu-freertos-source-analysis/img-238.jpg]]

##### 结构大小一致性检查

- 验证 StaticEventGroup\_t 和 EventGroup\_t 结构大小完全一致
- 确保后续类型转换的安全性
![[assets/feishu-freertos-source-analysis/img-239.jpg]]

##### 类型转换

- 将用户提供的 StaticEventGroup\_t 指针转换为内部使用的 EventGroup\_t 指针
- StaticEventGroup\_t 是给用户的不透明类型，EventGroup\_t 是内部实现类型

##### 事件组初始化

- 事件位初始化：将所有事件位清零
- 等待列表初始化：初始化用于存储等待事件的任务列表
- 静态分配标记：设置标志位，防止后续误释放静态分配的内存

##### 静态事件组的优点

- 不依赖 FreeRTOS 堆，生命周期和存储位置由应用明确控制，适合内存受限或需要确定性分配的场景。

##### StaticEventGroup_t 与 EventGroup_t 的关系

- StaticEventGroup\_t 是对外暴露的不透明类型，定义在 event\_groups.h 中
- EventGroup\_t 是内部实现类型，定义在 event\_groups.c 中
- 两者大小完全一致，确保类型转换安全
- 这种设计隐藏了内部实现细节，提供了良好的封装性

##### 与动态创建的对比

- 静态创建由应用提供 `StaticEventGroup_t` 缓冲区，删除时不释放该缓冲区；动态创建则从 FreeRTOS 堆申请并在删除时释放。

#### `xEventGroupSetBits()`：设置事件位

> `xEventGroupSetBitsFromISR()` 不能在 ISR 中直接遍历并唤醒等待任务；经典内核会把设置操作投递给定时器/守护任务延后处理。因此 ISR 中使用它要确保定时器服务任务和对应配置已启用，并根据返回值决定是否请求切换。

1. 设置事件组中的指定事件位
1. 检查是否有任务在等待这些位
1. 如果有，唤醒这些等待的任务

参数就俩：

EventBits\_t ( EventGroupHandle\_t xEventGroup,const EventBits\_t uxBitsToSet )

xEventGroup （事件组句柄）指定你要对哪个事件组进行操作，uxBitsToSet （要设置的位）

##### 流程图：

![[assets/feishu-freertos-source-analysis/img-240.jpg]]

![[assets/feishu-freertos-source-analysis/img-241.jpg]]

##### 准备遍历等待任务列表

- 获取事件组中等待任务的列表
- 获取列表结束标记

##### 挂起调度器设置事件位

- 将指定的位按位或到事件组的当前值中（用的或运算，就和置位一样）
![[assets/feishu-freertos-source-analysis/img-242.jpg]]

##### 遍历等待任务列表

这是函数的核心部分：

- 遍历所有在等待事件的任务
- 对每个等待任务检查其等待条件是否满足
- 逻辑或模式：只要有任何一个等待的位被设置即可
- 逻辑与模式：所有等待的位都必须被设置
![[assets/feishu-freertos-source-analysis/img-243.jpg]]

##### 唤醒匹配的任务

- 当等待条件满足时，调用专门的函数唤醒任务

##### vTaskRemoveFromUnorderedEventList 函数

从事件等待列表中移除一个任务，并将其添加到就绪列表中，从而唤醒等待在事件组上的任务。

- pxEventListItem：指向等待事件的任务在事件组等待列表中的列表项
- xItemValue：新的列表项值，通常包含事件组的当前状态和唤醒原因标识
![[assets/feishu-freertos-source-analysis/img-244.jpg]]

##### 获取任务控制块

- 从列表项中获取对应的任务控制块（TCB）
- 这个 TCB 包含了任务的所有信息

##### 从事件等待列表移除

- 将任务从事件组的等待列表中移除
- 任务不再等待该事件了

##### 处理 Tickless 模式

- 在低功耗 tickless 模式下，重置下一个任务的解锁时间
- 确保系统能尽早进入睡眠模式

##### 从延迟列表移除并添加到就绪列表

- 从当前状态列表（通常是阻塞列表）中移除任务
- 将任务添加到就绪列表，使其可以被调度执行

##### 处理优先级和上下文切换

- 单核系统：如果被唤醒的任务优先级更高，设置调度请求

##### 处理自动清除

- 若等待条件带有 `xClearOnExit`，唤醒任务时清除对应事件位；否则保留事件位供其他任务继续观察。

#### `xEventGroupSync()`：任务集合点同步

实现多任务同步的核心函数，用于创建一个“集合点”（Rendezvous），确保多个任务在执行后续操作前都已准备就绪。

1. 设置自己的状态位（告诉其他任务"我已就绪"）
1. 等待其他任务的状态位（等待"大家都就绪"）
1. 完成同步后自动清除相关位（为下次同步做准备）

##### 函数参数

```c
EventBits_t xEventGroupSync(
    EventGroupHandle_t xEventGroup,    // 事件组句柄
    const EventBits_t uxBitsToSet,     // 要设置的位（我的状态）
    const EventBits_t uxBitsToWaitFor, // 要等待的位（大家的状态）
    TickType_t xTicksToWait            // 等待超时时间
)
```

##### 流程图：

![[assets/feishu-freertos-source-analysis/img-245.jpg]]

##### 函数源码

```cpp
EventBits_t xEventGroupSync( EventGroupHandle_t xEventGroup,
                             const EventBits_t uxBitsToSet,
                             const EventBits_t uxBitsToWaitFor,
                             TickType_t xTicksToWait )
{
    EventBits_t uxOriginalBitValue; /* 原始事件位值 */
    EventBits_t uxReturn;            /* 函数返回值 */
    EventGroup_t * pxEventBits = xEventGroup; /* 事件组指针 */
    BaseType_t xAlreadyYielded;      /* 任务调度器恢复时是否已发生上下文切换 */
    BaseType_t xTimeoutOccurred = pdFALSE; /* 超时标志 */

    traceENTER_xEventGroupSync( xEventGroup, uxBitsToSet, uxBitsToWaitFor, xTicksToWait );

    /* 参数验证：uxBitsToWaitFor 不能包含控制位且不能为空 */
    configASSERT( ( uxBitsToWaitFor & eventEVENT_BITS_CONTROL_BYTES ) == 0 );
    configASSERT( uxBitsToWaitFor != 0 );
    
    /* 验证调度器状态：调度器挂起时不能设置超时等待 */
    #if ( ( INCLUDE_xTaskGetSchedulerState == 1 ) || ( configUSE_TIMERS == 1 ) )
    {
        configASSERT( !( ( xTaskGetSchedulerState() == taskSCHEDULER_SUSPENDED ) && ( xTicksToWait != 0 ) ) );
    }
    #endif

    /* 挂起任务调度器，确保以下操作原子性 */
    vTaskSuspendAll();
    {
        /* 保存原始事件位值 */
        uxOriginalBitValue = pxEventBits->uxEventBits;
        /* 设置指定的事件位（告知其他任务"我已就绪"） */
        ( void ) xEventGroupSetBits( xEventGroup, uxBitsToSet );
        /* 检查是否所有等待的位都已设置（所有任务都就绪） */
        if( ( ( uxOriginalBitValue | uxBitsToSet ) & uxBitsToWaitFor ) == uxBitsToWaitFor )
        {
            /* 所有同步位都已设置，无需阻塞 */
            uxReturn = ( uxOriginalBitValue | uxBitsToSet );
            /* 清除等待的事件位（完成同步后重置状态） */
            pxEventBits->uxEventBits &= ~uxBitsToWaitFor;
            /* 标记无需等待，直接返回 */
            xTicksToWait = 0;
        }
        else
        {
            /* 同步条件未满足，检查是否设置了超时时间 */
            if( xTicksToWait != ( TickType_t ) 0 )
            {
                traceEVENT_GROUP_SYNC_BLOCK( xEventGroup, uxBitsToSet, uxBitsToWaitFor );
                /* 将任务加入等待列表，等待同步条件满足 */
                /* 注：同时设置了清除位和等待所有位的标志 */
                vTaskPlaceOnUnorderedEventList( &( pxEventBits->xTasksWaitingForBits ),
                                                ( uxBitsToWaitFor | eventCLEAR_EVENTS_ON_EXIT_BIT | eventWAIT_FOR_ALL_BITS ),
                                                xTicksToWait );

                /* 初始化返回值（实际值将在任务唤醒后设置） */
                uxReturn = 0;
            }
            else
            {
                /* 未设置超时时间，直接返回当前事件位状态 */
                uxReturn = pxEventBits->uxEventBits;
                xTimeoutOccurred = pdTRUE;
            }
        }
    }

    /* 恢复任务调度器 */
    xAlreadyYielded = xTaskResumeAll();

    /* 如果任务被阻塞等待 */
    if( xTicksToWait != ( TickType_t ) 0 )
    {
        /* 如果恢复调度器时未发生上下文切换，主动触发一次切换 */
        if( xAlreadyYielded == pdFALSE )
        {
            taskYIELD_WITHIN_API();
        }
        else
        {
            mtCOVERAGE_TEST_MARKER();
        }

        /* 任务被唤醒：要么同步条件满足，要么超时 */
        uxReturn = uxTaskResetEventItemValue();
        /* 检查唤醒原因：是否因超时 */
        if( ( uxReturn & eventUNBLOCKED_DUE_TO_BIT_SET ) == ( EventBits_t ) 0 )
        {
            /* 因超时唤醒，返回当前事件位状态 */
            taskENTER_CRITICAL();
            {
                uxReturn = pxEventBits->uxEventBits;
                /* 特殊情况：虽然超时，但其他任务可能在唤醒后设置了同步位 */
                if( ( uxReturn & uxBitsToWaitFor ) == uxBitsToWaitFor )
                {
                    /* 清除同步位 */
                    pxEventBits->uxEventBits &= ~uxBitsToWaitFor;
                }
                else
                {
                    mtCOVERAGE_TEST_MARKER();
                }
            }
            taskEXIT_CRITICAL();
            xTimeoutOccurred = pdTRUE;
        }
        else
        {
            /* 因同步条件满足唤醒，uxReturn 已包含设置的事件位 */
        }

        /* 过滤掉控制位，只返回有效的事件位 */
        uxReturn &= ~eventEVENT_BITS_CONTROL_BYTES;
    }

    traceEVENT_GROUP_SYNC_END( xEventGroup, uxBitsToSet, uxBitsToWaitFor, xTimeoutOccurred );
    /* 防止未使用 trace 宏时的编译器警告 */
    ( void ) xTimeoutOccurred;
    traceRETURN_xEventGroupSync( uxReturn );
    return uxReturn;
}
```

##### 应用场景示例

##### 场景：多传感器数据采集

假设有 3 个任务分别采集温度、湿度和气压数据，需要等所有数据都采集完成后，再进行数据处理：

```c
// 定义事件位
#define BIT_TEMP_READY   (1 << 0)  // 温度数据就绪
#define BIT_HUMID_READY  (1 << 1)  // 湿度数据就绪
#define BIT_PRESS_READY  (1 << 2)  // 气压数据就绪
#define BIT_ALL_READY    (BIT_TEMP_READY | BIT_HUMID_READY | BIT_PRESS_READY)  // 所有数据就绪

// 温度采集任务
void vTempTask(void *pvParameters) {
    while (1) {
        // 采集温度数据
        printf("采集温度数据...\n");
        vTaskDelay(pdMS_TO_TICKS(1000));
        
        // 等待所有传感器数据就绪（设置自己的位，等待其他位）
        xEventGroupSync(xEventGroup, BIT_TEMP_READY, BIT_ALL_READY, portMAX_DELAY);
        
        // 所有数据就绪，开始处理
        printf("温度任务：开始处理数据\n");
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

// 湿度采集任务（类似）
void vHumidTask(void *pvParameters) {
    while (1) {
        printf("采集湿度数据...\n");
        vTaskDelay(pdMS_TO_TICKS(1500));
        xEventGroupSync(xEventGroup, BIT_HUMID_READY, BIT_ALL_READY, portMAX_DELAY);
        printf("湿度任务：开始处理数据\n");
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

// 气压采集任务（类似）
void vPressTask(void *pvParameters) {
    while (1) {
        printf("采集气压数据...\n");
        vTaskDelay(pdMS_TO_TICKS(2000));
        xEventGroupSync(xEventGroup, BIT_PRESS_READY, BIT_ALL_READY, portMAX_DELAY);
        printf("气压任务：开始处理数据\n");
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}
```

#### `xEventGroupClearBits()`：清除事件位

##### 流程图

![[assets/feishu-freertos-source-analysis/img-246.jpg]]

![[assets/feishu-freertos-source-analysis/img-247.jpg]]

##### 进入临界区，确保操作的原子性

- 进入临界区后读取并修改 `uxEventBits`，避免清除操作与其他任务或 ISR 的更新交错。

##### 保存原始值并清除位

- 保存原值：在清除位之前，先保存当前的事件组值作为返回值
- 执行清除：使用按位与操作配合按位取反来清除指定的位
  - ~uxBitsToClear：将要清除的位取反（1 变 0，0 变 1）
  - &=：按位与操作，使目标位变为 0，其他位保持不变

##### 退出临界区并返回

- 退出临界区后返回清除前的事件位快照，调用者可据此判断哪些位原先处于置位状态。

##### 示例

```c
// 假设事件组当前值为 0x07 (二进制: 00000111)
// 即位0、位1、位2都是1

EventBits_t old_value = xEventGroupClearBits(event_group, 0x03);

// 执行后：
// - old_value = 0x07 (返回清除前的值)
// - 事件组新值 = 0x04 (二进制: 00000100，位0和位1被清除，位2保持)
```

#### `vEventGroupDelete()`：删除事件组

1. 唤醒所有等待的任务：在删除事件组之前，必须先唤醒所有正在等待它的任务
1. 释放内存：根据创建方式（动态或静态）决定是否释放内存
1. 清理资源：确保系统资源得到正确回收

##### 流程图

![[assets/feishu-freertos-source-analysis/img-248.jpg]]

![[assets/feishu-freertos-source-analysis/img-249.jpg]]

##### 获取等待任务列表

- 获取正在等待该事件组的任务列表
- 这些任务目前都处于阻塞状态

##### 挂起调度器

- 调用 `vTaskSuspendAll()`，保证检查条件、加入等待列表和更新超时状态的过程不会被其他任务打断。

##### 唤醒所有等待任务

- 循环处理：只要还有任务在等待，就继续处理
- 唤醒任务：使用 vTaskRemoveFromUnorderedEventList 函数唤醒每个等待的任务
- 特殊标记：使用 eventUNBLOCKED\_DUE\_TO\_BIT\_SET 标记，让被唤醒的任务知道是因为事件组被删除而唤醒的（而不是因为事件位被设置）

##### 恢复调度器

- 调用 `xTaskResumeAll()`，完成等待任务迁移后再恢复调度。

##### 内存管理

只支持动态分配：直接释放内存

同时支持动态和静态：检查分配类型

静态分配的不释放

#### `xEventGroupWaitBits()`：等待事件位

```cpp
EventBits_t xEventGroupWaitBits(
    EventGroupHandle_t xEventGroup,    // 事件组句柄
    const EventBits_t uxBitsToWaitFor, // 要等待的位
    const BaseType_t xClearOnExit,    // 退出时是否清除位
    const BaseType_t xWaitForAllBits, // 是否等待所有位
    TickType_t xTicksToWait           // 等待超时时间
)
```

##### 流程图

![[assets/feishu-freertos-source-analysis/img-250.jpg]]

![[assets/feishu-freertos-source-analysis/img-251.jpg]]

##### 挂起调度器

- 调用 `vTaskSuspendAll()`，在不可发生任务切换的区间内检查事件位和等待条件。

##### 检查条件是否已满足（三种情况处理）

情况 A：条件已满足

![[assets/feishu-freertos-source-analysis/img-252.jpg]]

情况 B：条件未满足但不等待

![[assets/feishu-freertos-source-analysis/img-253.jpg]]

情况 C：条件未满足需要等待

![[assets/feishu-freertos-source-analysis/img-254.jpg]]

![[assets/feishu-freertos-source-analysis/img-255.jpg]]

##### 恢复调度器并检查上下文切换

- 调用 `xTaskResumeAll()`；若恢复过程中没有自动切换而当前任务已经阻塞，则调用 `taskYIELD_WITHIN_API()` 主动让出 CPU。

##### 检查是否需要手动触发调度

- 当任务调用 vTaskPlaceOnUnorderedEventList 进入阻塞状态时，它把自己放到了等待列表中
- 但是此时还没有真正切换到其他任务（因为还在原子操作段中）
- 恢复调度器后，需要确保 CPU 真的切换到其他任务，而不是继续执行当前任务
- 如果恢复调度器时没有发生切换，就要手动触发一次切换 （taskYIELD\_WITHIN\_API()）

##### 获取唤醒后的情况

- 通过 `uxTaskResetEventItemValue()` 取出任务事件列表项中保存的唤醒结果和控制位。

##### 判断唤醒原因

- eventUNBLOCKED_DUE_TO_BIT_SET 位被设置：事件位被设置了，任务正常唤醒
- eventUNBLOCKED_DUE_TO_BIT_SET 位未被设置：等待超时了

##### 处理超时情况

- 超时唤醒时返回当前事件位快照，并根据 `xClearOnExit` 决定是否清除满足条件的位。

##### 处理正常唤醒情况

- 事件位满足条件时返回有效事件位；若配置了自动清除，则清除本次等待对应的位。

##### 清理控制位

- 返回给应用前屏蔽内部控制位，只保留可供应用使用的事件位。
