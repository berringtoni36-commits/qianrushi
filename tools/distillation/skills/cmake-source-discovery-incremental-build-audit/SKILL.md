---
name: cmake-source-discovery-incremental-build-audit
description: "Use when auditing whether a CMake source file actually enters a target, whether explicit sources or file(GLOB) discovery was configured, whether the configure/build tree belongs to the current source tree, whether an incremental target is stale, or whether a same-named binary and its runtime libraries came from the intended build. Trigger phrases include source file exists but is not compiled, CMakeLists and build directory disagree, old build artifact, stale incremental build, two targets both named lime, link_directories versus runtime loading, and which source produced this executable. Do not use for a generic compiler/linker/loader failure without source-membership or build-freshness evidence; use linux-build-debug-chain. Do not use for broad vision performance/model provenance or benchmark reproducibility; use linux-vision-build-provenance-audit."
metadata:
  source_files:
    - projects/linux视觉感知项目/文档/01 项目概述/1.3 CMake 构建指南.md
    - projects/linux视觉感知项目/文档/05 系统集成与性能/5.1 模型轻量化与参数压缩.md
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/lime.cpp
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/xinlime.cpp
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeCache.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/DependInfo.cmake
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/build.make
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/link.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeCache.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/DependInfo.cmake
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/build.make
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/link.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeCache.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/DependInfo.cmake
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/build.make
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/link.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeCache.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/DependInfo.cmake
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/build.make
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/link.txt
  source_symbols:
    - cmake_minimum_required
    - project
    - CMAKE_CXX_STANDARD
    - CMAKE_BUILD_TYPE
    - CMAKE_CXX_FLAGS
    - find_package
    - include_directories
    - link_directories
    - file(GLOB)
    - CONFIGURE_DEPENDS
    - add_subdirectory
    - add_executable
    - add_library
    - target_sources
    - target_link_libraries
    - CMAKE_HOME_DIRECTORY
    - CMAKE_SOURCE_DIR
    - CMAKE_BINARY_DIR
    - CMAKE_GENERATOR
    - CMakeCache.txt
    - DependInfo.cmake
    - build.make
    - compiler_depend.make
    - flags.make
    - link.txt
    - CMakeFiles/<target>.dir/<source>.cpp.o
    - <source>.cpp.o.d
    - RPATH
    - libonnxruntime.so
    - ncnn
    - OpenCV
    - OpenMP
  audit_targets:
    - file(GLOB)
    - CONFIGURE_DEPENDS
    - add_subdirectory
    - add_library
    - target_sources
    - CMakeFiles/<target>.dir/<source>.cpp.o
    - <source>.cpp.o.d
    - RUNPATH
    - DT_NEEDED
  related_skills:
    - linux-build-debug-chain
    - linux-vision-build-provenance-audit
    - rtos-build-flash-runtime-provenance
---

# CMake 源码发现—构建树—运行树与增量新鲜度审计

把“目录里有源码”“CMake 声明了源码”“构建树曾经编过源码”“二进制能加载库”拆成四个可验证命题，并进一步检查增量构建是否仍然新鲜。本 Skill 的原子范围是 source → configure/build tree → target/object/link command → executable/runtime loader；输出必须指出当前事实、历史构建快照、文档主张和未知项，不能用一个文件名或一次 clean build 代替证据链。

## 来源证据

以下路径均在当前仓库中实际存在。用户给出的 `文档/00 项目总览/0.3 代码目录与构建指南.md` 当前不存在，因此不把它写成来源；同一主题的现存真实来源是 `文档/01 项目概述/1.3 CMake 构建指南.md`。

`source_symbols` 只列当前声明来源中能定位的 CMake/构建锚点；`audit_targets` 是审计时要检查的字段或命令，不代表当前项目已经使用它们。尤其不能因为 `file(GLOB)`、`CONFIGURE_DEPENDS`、`RUNPATH` 或 `DT_NEEDED` 出现在审计清单，就宣称当前 target 已配置或产物已包含对应动态依赖。

source_files:
  - projects/linux视觉感知项目/文档/01 项目概述/1.3 CMake 构建指南.md
  - projects/linux视觉感知项目/文档/05 系统集成与性能/5.1 模型轻量化与参数压缩.md
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/lime.cpp
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/xinlime.cpp
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeCache.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/DependInfo.cmake
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/build.make
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/build/CMakeFiles/lime.dir/link.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeCache.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/DependInfo.cmake
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/build.make
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/build/CMakeFiles/lime.dir/link.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeCache.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/DependInfo.cmake
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/build.make
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/build/CMakeFiles/LSTR.dir/link.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeCache.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/DependInfo.cmake
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/build.make
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/build/CMakeFiles/unet_ncnn.dir/link.txt

source_symbols:
  - cmake_minimum_required
  - project
  - CMAKE_CXX_STANDARD
  - CMAKE_BUILD_TYPE
  - CMAKE_CXX_FLAGS
  - find_package
  - include_directories
  - link_directories
  - file(GLOB)
  - CONFIGURE_DEPENDS
  - add_subdirectory
  - add_executable
  - add_library
  - target_sources
  - target_link_libraries
  - CMAKE_HOME_DIRECTORY
  - CMAKE_SOURCE_DIR
  - CMAKE_BINARY_DIR
  - CMAKE_GENERATOR
  - CMakeCache.txt
  - DependInfo.cmake
  - build.make
  - compiler_depend.make
  - flags.make
  - link.txt
  - CMakeFiles/<target>.dir/<source>.cpp.o
  - <source>.cpp.o.d
  - RPATH
  - RUNPATH
  - DT_NEEDED
  - libonnxruntime.so
  - ncnn
  - OpenCV
  - OpenMP

### 已核对的项目事实

- 基础 LIME 的 `Lime/CMakeLists.txt` 用 `add_executable(lime lime.cpp)`，并将 `lime` 与 `${OpenCV_LIBS}` 链接。
- `Lime_NEON+OpenMP/CMakeLists.txt` 检测 OpenMP、追加 OpenMP 编译/链接 flags，并用 `add_executable(lime lime_opt.cpp)`；目录中的 `xinlime.cpp` 存在，但该 CMakeLists 未把它列为当前 target source。
- `LSTR_ONNX/CMakeLists.txt` 用 `add_executable(LSTR main.cpp)`，将 `${PROJECT_SOURCE_DIR}/lib/libonnxruntime.so`、pthread、ncurses 和 OpenCV 放入链接命令。
- `Unet_NCNN/CMakeLists.txt` 用 `link_directories(${CMAKE_CURRENT_SOURCE_DIR}/lib)`，再以 `add_executable(unet_ncnn src/unet.cpp)` 和 `target_link_libraries(unet_ncnn ncnn ${OpenCV_LIBS})` 构建。
- 当前四个 `CMakeLists.txt` 的源码输入是显式参数，未观察到 `file(GLOB)`；因此“目录中有文件”不能被解释成该文件已进入 target。
- 已保存的四套构建树中，`CMakeCache.txt`、`DependInfo.cmake`、`build.make` 和 `link.txt` 含有 `/media/kylin/...` 的旧源码/构建绝对路径；这些文件证明某次历史 configure/build 快照，不证明当前 iCloud 源码树已用同一 target 重建。
- 两个 LIME 工程都生成名为 `lime` 的可执行文件，但其构建树分别记录 `lime.cpp.o` 与 `lime_opt.cpp.o`；必须用 source dir + build dir + target 三元组消歧。
- 当前保存的四个可执行文件经 `file` 识别为 AArch64、动态链接的历史产物；`file` 不能证明它们对应当前源码，也不能替代目标板上的 `readelf -d`、`ldd` 或动态加载器追踪。
- `5.1 模型轻量化与参数压缩.md` 关于 NCNN 静态链接、无运行时依赖和优化收益是文档主张；是否由当前链接命令、实际库文件和运行时加载结果支持，必须另行核验。

## R — 原文（Reading）

> 项目对图像预处理和卷积神经网络模块采用独立的 CMake 构建目录，并按“进入模块目录 → 创建 build → `cmake ..` → 编译 → 运行”的流程组织。
>
> — `projects/linux视觉感知项目/文档/01 项目概述/1.3 CMake 构建指南.md`

> 基础 LIME、LIME 加速版、LSTR ONNX 和 Unet NCNN 的构建配置分别声明不同的源文件、目标名和库依赖；优化版还要求 OpenMP。
>
> — 四份真实 `CMakeLists.txt`；文档主张以源码和生成构建文件复核

> NCNN 方案被文档描述为静态链接、无运行时依赖，并列出 `libncnn.a`。
>
> — `projects/linux视觉感知项目/文档/05 系统集成与性能/5.1 模型轻量化与参数压缩.md`；这是文档主张，不是本 Skill 自动接受的当前构建事实

## I — 解释与不变量（Interpretation）

使用五层证据，不跨层推断：

1. **源码发现层**：目录清单只能说明文件存在。只有 `add_executable`、`add_library`、`target_sources`、生成源码规则或 `file(GLOB...)` 的实际声明，才构成候选 source 输入；`file(GLOB)` 是否在本次 configure 后生效，要回到生成文件核对。当前项目列出的四个 target 都是显式 source。
2. **配置层**：`CMakeCache.txt` 的 `CMAKE_HOME_DIRECTORY`、生成器、编译器和 build type 说明这次 configure 绑定了哪个 source/build 身份。缓存指向旧复制目录时，不能把生成文件当作当前目录的即时结果。
3. **目标依赖层**：`DependInfo.cmake`、`build.make`、`compiler_depend.make`、`flags.make` 和 `<target>.dir` 下的对象/依赖文件，才是“这个 source 实际被纳入该 target 的生成快照”证据；`link.txt` 进一步确认对象、库、flags 和 rpath 的实际链接命令。
4. **运行树层**：`-L`、`link_directories`、绝对库文件路径属于链接期输入，不等于运行时 loader 搜索路径。对目标架构读取 ELF `DT_NEEDED`、`RPATH/RUNPATH`，并在目标环境用 `ldd` 或 `LD_DEBUG=libs` 观察真正加载了哪个 `.so`；静态库/动态库类型要看实际库和 ELF 结果，不能只看文档或库名。
5. **新鲜度层**：比较当前 CMakeLists、源文件、头文件（由 `*.o.d` 展开）、库、对象和可执行文件的时间/哈希，并重新运行 configure/build 的 verbose 输出。CMakeLists、工具链、选项、生成器或 source discovery 规则变化时，旧 build 的“没有动作”不等于当前 target 正确。

报告至少回答四个独立问题：

| 问题 | 直接证据 | 不足以证明的材料 |
|---|---|---|
| 源文件是否进入 target？ | CMake source 声明 + `DependInfo.cmake`/`build.make` + 对象文件 | 目录存在、文件名相同、二进制字符串 |
| 这个 build 是否来自当前源码树？ | `CMAKE_HOME_DIRECTORY`、`CMAKE_SOURCE_DIR`、configure 命令和当前路径一致 | 只看 `CMakeCache` 的 target 名或 build 目录名 |
| target 实际链接了什么？ | `link.txt`、对象清单、实际库文件和 ELF 依赖 | `target_link_libraries` 一行、文档表格、`-L` |
| 运行时加载了什么？ | 目标架构 `readelf -d` + loader/`ldd` 追踪 + 部署路径 | 链接成功、`link_directories`、库文件“存在” |

### 与相邻 Skill 的明确边界

- `linux-build-debug-chain` 处理通用预处理、编译、链接、动态库加载和 GDB 故障。本 Skill 只有在核心问题是“哪个 source 进入哪个 CMake target、构建树是否陈旧/错源、同名产物如何消歧、构建树与运行树是否分离”时介入；若只是 `undefined reference`、找不到 `.so` 或 GDB 崩溃，转交前者。
- `linux-vision-build-provenance-audit` 处理视觉项目的模型/数据/库/二进制/性能数字是否可复现。本 Skill 可以提供 source→target→build→runtime 的底层证据，但不评价 benchmark、模型转换、精度或“加速几倍”的完整 provenance；出现这些主问题时转交后者。

## A1 — 资料中的应用（Past Application）

### 案例 1：两个同名 `lime` 的源码消歧

- 先记录两个 source dir 和两个 build dir，不能只执行 `which lime` 或按文件名判断。
- 基础目录的 CMake 明确选择 `lime.cpp`；优化目录明确选择 `lime_opt.cpp`。`xinlime.cpp` 虽然存在，但没有出现在当前优化 CMake 的 `add_executable` 中。
- 再核对各自 `DependInfo.cmake` 和 `build.make`：历史生成文件分别记录 `lime.cpp.o` 与 `lime_opt.cpp.o`。结论可以说“两个历史 target 快照选择了不同 source”，不能说当前源码树已经被重新构建，除非路径和重新构建命令也一致。

### 案例 2：旧构建树看似成功，实际绑定到旧复制目录

- 四套构建证据中的 `CMakeCache.txt`/`DependInfo.cmake`/`link.txt` 包含 `/media/kylin/...` 旧路径；当前源码位于 iCloud 工作树。
- 这能证明旧构建曾经配置、编译和链接过某个副本；不能证明当前 `projects/...` 下的 CMakeLists、源码和库已进入同一个 target。
- 保留旧 build 作为证据，使用新的隔离 build 目录做 `cmake -S <current-source> -B <new-build>` 和 `cmake --build <new-build> --target <target> --verbose` 对照；不要删除共享旧目录来“修复”结论。

### 案例 3：链接期库目录与运行期动态加载分离

- LSTR 的 CMake 显式把项目 `lib/libonnxruntime.so` 作为链接输入；保存的 `link.txt` 还记录了旧复制目录的 rpath。
- 这只说明某次链接命令如何寻找库。运行时仍需检查当前二进制的 `DT_NEEDED`、`RPATH/RUNPATH`、目标板的 loader、库 ABI 和部署路径。
- `5.1` 对 Unet/NCNN 的静态链接描述属于文档主张；若要升级为当前事实，必须提供实际 `libncnn.a`/动态库、`link.txt` 和 ELF/运行结果的闭环。

## A2 — 触发场景（Future Trigger）

### 应触发

1. “目录里有 `xinlime.cpp`，为什么没有编译？”“`file(GLOB)` 新增源文件后增量构建为什么没反应？”
2. “两个目录都有 `lime`，当前二进制到底来自 `lime.cpp` 还是 `lime_opt.cpp`？”
3. “CMake configure/build tree 和当前源码路径对不上，旧 build 还能不能作为当前版本证据？”
4. “改了 CMakeLists、头文件或源文件但 target 没有重新编译，缓存是不是过时？”
5. “链接用了 `-L`/`link_directories`，运行时为什么加载了另一份 `.so`？”
6. “构建产物存在且能启动，如何确认它由当前 source、当前 target 和当前库生成？”

语言信号包括：`source not compiled`、`CMakeFiles/<target>.dir`、`DependInfo.cmake`、`build.make`、`link.txt`、`CMakeCache`、`stale build`、`incremental`、`same target name`、`which binary`、`RPATH/RUNPATH`、`old artifact`。

### 不应触发

- 只问 CMake 语法、编译器报错、未解析符号、通用 `.so` 缺失或 GDB 运行时崩溃，没有 source/target/build-tree 归属问题：使用 `linux-build-debug-chain`。
- 只问 LIME/LSTR/Unet 的性能数字、模型分支、输入数据、转换脚本、精度或完整复现等级：使用 `linux-vision-build-provenance-audit`。
- 只问 tensor shape/layout、Qt 文件 IPC、算法正确性、OpenMP/NEON 数据竞争或项目面试表达：转对应专用 Skill。

## E — 可执行审计流程（Execution）

1. **冻结身份，不先清理**
   - 记录当前 source dir、build dir、target、预期 binary、配置命令、generator、compiler、架构和运行环境。用 `pwd`、`rg --files`、`file <binary>` 和只读 `stat` 建立快照。
   - 先复制命令输出/哈希或保存审计日志；不要 `rm -rf build`、不要覆盖他人的 build，也不要把 clean build 成功当成增量依赖正确。
   - 完成标准：每个 binary 都有唯一的 `source dir + build dir + target + output path` 身份。
2. **判定 source discovery 方式**
   - 阅读实际 CMakeLists，搜索 `add_executable`、`add_library`、`target_sources`、`file(GLOB...)`、`CONFIGURE_DEPENDS`、`add_subdirectory` 和生成源码命令。把显式 source、glob、生成 source、子目录 target 分栏。
   - 对 `file(GLOB)`：把目录枚举当候选集合，不当成已编译事实；核对本次 configure 后生成的 `DependInfo.cmake`/`build.make`，新增文件若未出现，先在隔离 build 中重新 configure，再判断是否需要改 CMake 声明。
   - 完成标准：列出“目录中存在但未进入 target”“CMake 声明但文件缺失”“进入 target 但对象/依赖缺失”的差集。
3. **从 configure 树追到 target**
   - 检查 `CMakeCache.txt` 中的 `CMAKE_HOME_DIRECTORY`、`CMAKE_GENERATOR`、compiler、build type；检查 `CMakeFiles/Makefile2` 或 generator 等价物的 `CMAKE_SOURCE_DIR`/`CMAKE_BINARY_DIR`。
   - 检查 `CMakeFiles/<target>.dir/DependInfo.cmake`、`build.make`、`compiler_depend.make`、`flags.make`、`<source>.o.d` 和 `<source>.o`。只有 source 路径、编译命令和对象链一致，才把“进入 target”标为高可信。
   - 完成标准：能从 target 反向列出每个 source、object、头文件依赖和编译 flags，并标出生成文件记录的绝对路径。
4. **核对 link graph 与同名 target**
   - 阅读 `link.txt`，记录对象顺序、`-L`/绝对库、`-l`、OpenMP flags、rpath 和输出文件；对照 `target_link_libraries`，把 CMake 意图与生成命令分开。
   - 对同名 target，使用完整 source/build/output 路径建表；不能以 `lime`、`LSTR` 等 basename 代替工程身份。
   - `link_directories`/`-L` 只回答链接器查库位置；不能推导 loader 的运行时搜索顺序。静态/动态性质要由实际库文件和 ELF 依赖确认。
   - 完成标准：target 的 object、link command、库文件和输出 binary 能互相对上；若只能对上历史副本，标为历史快照。
5. **审计增量新鲜度**
   - 比较当前 CMakeLists、source、头文件、第三方库、object、binary 的时间和内容哈希；以 `*.o.d` 展开的头文件集合为依赖候选。CMakeLists、工具链、generator、选项或 discovery 变化时，要求重新 configure。
   - 在不破坏现有 build 的前提下执行 `cmake -S <current-source> -B <audit-build> <options>`，再执行 `cmake --build <audit-build> --target <target> --verbose`；保留“应编译了哪些对象、实际编译了哪些对象”的差异。
   - 对原 build 可执行一次只读/非破坏的 verbose no-op 检查，但不能只依据 `nothing to be done`；若 `CMAKE_HOME_DIRECTORY` 或 source path 已失配，直接标 stale/历史，不强行解释。
   - 完成标准：结论属于 `当前新鲜`、`当前可增量更新`、`历史快照/路径失配`、`无法确认` 四类之一，并说明触发重建的具体输入。
6. **分离运行时加载树**
   - 在目标架构上运行 `file <binary>`、`readelf -d <binary> | rg 'NEEDED|RPATH|RUNPATH'`，再用 `ldd <binary>` 或 `LD_DEBUG=libs <binary>` 记录实际 loader 搜索/加载；必要时检查 `LD_LIBRARY_PATH`、系统缓存和部署目录。
   - 对 `libonnxruntime.so`、OpenCV、OpenMP、NCNN 等逐项记录：链接命令使用的文件、ELF 记录的 soname/needed、运行时实际路径、ABI/架构和文件哈希。不要在 macOS 主机上把 AArch64 `file` 结果当成可运行验证。
   - 完成标准：能分别回答“链接时找到了哪个库”和“运行时加载了哪个库”；若没有目标板 loader 证据，标为未验证。
7. **输出分层报告**
   - 用表格输出：`source`、`CMake 声明`、`configure source/build`、`target/object`、`link.txt`、`binary`、`runtime loader`、`freshness`、`证据类别`、`结论`。
   - 每条结论标记为：`CMake 当前事实`、`生成构建快照`、`历史产物`、`文档主张`、`目标机实测` 或 `未知/待补证据`。禁止把文档主张、旧 build、文件存在和运行成功混写。

## B — 边界与失败模式（Boundary）

- 当前项目的 CMakeLists 使用显式 source；没有证据表明使用了 `file(GLOB)`。本 Skill 覆盖 glob 的审计方法，但不能把 glob 规则虚构成当前项目事实。
- `CMakeCache.txt`、`DependInfo.cmake`、`build.make`、`link.txt`、`.o` 和 binary 是某次生成/构建的快照；若绝对路径、工具链、时间或哈希与当前树不一致，只能作为历史证据。
- 源文件未出现在 target 的生成依赖中时，不能因为它与其他文件同目录、同名函数或被二进制字符串提及就说“已编译”。反过来，旧生成文件出现 source 也不证明当前 CMakeLists 仍然选择它。
- 同名 target 可以在不同独立 CMake 工程中产生不同 binary；必须以完整 source/build/output 路径消歧。不要用 basename、PATH 顺序或最后修改时间单独归因。
- `-L`、`link_directories`、`target_link_libraries` 解决链接期关系；运行时动态 loader 还受 ELF `RPATH/RUNPATH`、环境变量、系统缓存、部署目录、ABI、架构和权限影响。
- `file` 识别为动态链接或 `link.txt` 出现 `.so` 只能说明存在动态链接证据；不能证明目标机真的加载了预期版本。`libncnn.a` 的静态链接描述同样必须与实际 link/ELF 结果核对。
- `cmake --build` 的 no-op、目标文件时间戳或一次 clean build 都不能单独证明依赖图正确；要同时核对 source discovery、configure 身份、头文件依赖、编译命令和 target 输出。
- 不删除、重置或覆盖共享 build/产物来消除矛盾；保留原快照，使用隔离 build 做对照。若源树、构建树或运行环境缺失，报告精确缺口，不猜测。
- 本 Skill 不负责通用编译器/链接器/GDB 故障、模型 tensor 合同、视觉性能数字、Qt 文件 IPC、算法正确性或个人贡献归因。

## 相关 Skills

- `linux-build-debug-chain`：通用预处理、编译、链接、动态库加载和 GDB 故障。
- `linux-vision-build-provenance-audit`：视觉源码、模型/数据、库、二进制和性能结果的总体可复现性。
- `linux-vision-pipeline-and-optimization`：视觉端到端链路、NEON/OpenMP 正确性和性能优化。
- `vision-model-tensor-contract-audit`：模型输入/输出、shape、dtype、布局和主链真实性。

## 审计信息

- 来源核对：真实项目文档、四份 CMakeLists、源码和四套生成 build 证据已逐路径检查；用户指定的 `文档/00 项目总览/0.3 代码目录与构建指南.md` 缺失，已用现存 `文档/01 项目概述/1.3 CMake 构建指南.md` 替代并显式记录。
- 当前关键事实：基础/优化 LIME 均名为 `lime`，source 分别为 `lime.cpp`/`lime_opt.cpp`；`xinlime.cpp` 未见于当前 CMake target；历史 build 绝对路径指向 `/media/kylin/...` 旧副本。
- 压力测试：静态 6/6，见 `test-prompts.json` 与 `test-results.md`；独立客户端盲测未执行。
