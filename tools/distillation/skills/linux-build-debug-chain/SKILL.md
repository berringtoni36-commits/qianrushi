---
name: linux-build-debug-chain
description: "Use when a Linux C/C++ program fails during preprocessing, compilation, linking, shared-library loading, startup, or GDB-based runtime diagnosis. Trigger phrases include “编译报错”, “undefined reference”, “找不到 .so”, “Makefile 增量构建错了”, “GDB 怎么定位”. Do not use for pure application logic, FreeRTOS scheduling, or ARM Linux boot-chain failures without a user-space build/load symptom."
metadata:
  source_book: 大丙 Linux 教程（Subingwen 专栏）
  source_files:
    - archive/大丙Linux教程/第1章 Linux 基础/07 GCC.md
    - archive/大丙Linux教程/第1章 Linux 基础/08 静态库和动态库.md
    - archive/大丙Linux教程/第1章 Linux 基础/09 Makefile.md
    - archive/大丙Linux教程/第1章 Linux 基础/10 GDB调试.md
  source_chapter: 第1章 Linux 基础/07 GCC.md、08 静态库和动态库.md、09 Makefile.md、10 GDB调试.md
  source_symbols: [gcc, g++, ar, cpp, as, ld, make, target, depend, ldd, LD_LIBRARY_PATH, gdb]
  audit_targets: [prerequisite, ELF, rpath, backtrace]
  tags: [linux, gcc, make, linker, gdb, debugging]
  related_skills: [linux-fd-process-io-debugging, embedded-arm-linux-boot-chain]
---

# Linux 构建—加载—运行证据链

## R — 原文（Reading）

> GCC 的处理可以拆成预处理、编译、汇编和链接；动态库还要在程序运行时由加载器解析依赖。
>
> — `archive/大丙Linux教程/第1章 Linux 基础/07 GCC.md`；`08 静态库和动态库.md`

## I — 方法论骨架（Interpretation）

把“程序跑不起来”拆成连续但不同的层：源文件是否被正确预处理，编译器能否生成目标文件，链接器能否解析符号，运行时能否找到并加载共享库，进程启动后是否出现逻辑/内存错误。Makefile 决定这些目标和依赖如何增量重建，GDB 负责观察已经启动的程序。每层都先保留原始命令、版本和错误输出，再做最小修改；不要用改代码或反复 clean build 掩盖故障层级。

## A1 — 资料中的应用（Past Application）

### 案例 1：动态库链接成功但启动失败

- **问题**：`-L/-l` 已让链接器找到库，但可执行文件启动时仍提示找不到 `.so`。
- **方法**：分开检查链接期搜索与运行时动态加载器搜索，使用 `ldd` 和目标系统的加载器配置核对依赖。
- **结论**：链接成功不能证明运行时依赖已部署。
- **结果**：把修复动作限定在运行时路径、缓存或部署目录，而不是重写调用代码。

### 案例 2：多文件工程的增量构建

- **问题**：工程文件增多后，手写 GCC 命令容易漏依赖或重复编译。
- **方法**：用 Makefile 的目标—依赖—命令关系表达构建图，再观察时间戳触发的重建范围。
- **边界**：教程示例不是本仓库当前项目的构建事实，具体工具链仍需实测。

## A2 — 触发场景（Future Trigger）

### 用户会在什么情境下需要这个 Skill？

1. Linux C/C++ 工程在编译、链接、启动或调试阶段报错。
2. 用户说“编译通过了但运行找不到动态库/符号”或“Makefile 没有重新编译正确文件”。
3. 用户希望用 GDB、栈回溯、断点和变量证据定位运行时崩溃。

### 语言信号

- “`undefined reference` / `找不到 .so` / `symbol lookup error` 怎么排查？”
- “GCC 四个阶段到底是哪一阶段出错？”
- “Makefile 为什么没有重新编译？”
- “GDB 怎么从崩溃现场定位？”

### 与相邻 Skill 的区分

- 与 `linux-fd-process-io-debugging` 的区别：本 Skill 先定位构建/加载/启动层；已经启动且症状是 fd、进程、线程或共享状态时切换。
- 与 `embedded-arm-linux-boot-chain` 的区别：本 Skill 针对用户态可执行文件；U-Boot、内核、rootfs 和驱动启动阶段用后者。

## E — 可执行步骤（Execution）

1. **锁定故障层**：记录目标命令、编译器/链接器版本、工作目录和完整 stderr，判断处于预处理、编译、链接、加载还是运行期。
   - 完成标准：能指出“最后一个成功节点”和“第一个失败节点”。
2. **收集对应证据**：编译层保留预处理/目标文件；链接层检查未解析符号和库顺序；加载层检查依赖、部署路径和 `ldd`；运行层用带调试信息的构建进入 GDB。
   - 判停条件：若程序尚未成功链接，不进入 GDB 猜逻辑；若只缺运行时 `.so`，不改业务源代码。
3. **最小修复并回归**：只改触发故障层的命令、依赖或配置，分别做增量构建和干净构建，验证目标文件时间戳、启动结果和关键运行路径。
   - 完成标准：能解释为什么修复改变了该层，并保留可复现命令。

## B — 边界（Boundary）

### 不要在以下情况使用

- 用户只问 C/C++ 语义、算法或业务逻辑，没有构建/加载/崩溃证据。
- 用户的问题是 STM32/FreeRTOS 任务、ISR、DMA 或 Linux 启动链，而不是用户态构建。

### 失败模式与事实边界

- 不要把 `-L` 当作运行时库搜索路径；链接器和动态加载器是两个阶段。
- 不要把“重新 clean build 后成功”当作依赖关系已经正确；要检查 Makefile 依赖和可复现命令。
- 动态加载搜索顺序、ABI、权限和工具输出依赖目标发行版、架构和工具链；教程示例不能替代目标机实测。

## 相关 Skills

- `linux-fd-process-io-debugging`：程序已启动后排查 fd、进程、线程和共享状态。
- `linux-socket-multiplexing-design`：构建成功后设计/排查 Socket 协议和多路复用。
- `embedded-arm-linux-boot-chain`：处理 U-Boot→内核→rootfs→服务的启动阶段。

## 审计信息

- **来源文件**：见 frontmatter；当前可定位的工具/API锚点包括 `gcc`、`g++`、`ar`、`make`、`ld`、`ldd`、`gdb`。`ELF`、`rpath`、`backtrace` 和 `prerequisite` 是跨环境审计目标，不代表每个声明来源都逐字出现。
- **验证通过**：V1 ✓ / V2 ✓ / V3 ✓。
- **测试状态**：静态结构测试 6/6；独立模型盲测待补。
