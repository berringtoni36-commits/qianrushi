# 候选：CMake 源码发现—构建树—运行树与增量构建审计

id: v09
title: CMake 源码发现—构建树—运行树与增量构建审计
type: framework
verification: V1=pass, V2=pass, V3=pass

## 方法论

把源码存在、CMake source 声明、configure 生成的构建树、target/object/link command、可执行文件和运行时 loader 分成独立证据层；再比较 CMakeLists、头文件依赖、对象和 binary 的时间/哈希，判断增量构建属于当前新鲜、可更新、历史快照/路径失配或无法确认。

## 来源

- projects/linux视觉感知项目/文档/01 项目概述/1.3 CMake 构建指南.md（用户指定的 `文档/00 项目总览/0.3 代码目录与构建指南.md` 当前缺失，以此现存同主题文档为真实替代）
- projects/linux视觉感知项目/文档/05 系统集成与性能/5.1 模型轻量化与参数压缩.md
- projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt
- projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt
- projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt
- projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt
- 四个模块的 `build/CMakeCache.txt`、`CMakeFiles/<target>.dir/DependInfo.cmake`、`build.make` 与 `link.txt`

## 当前事实与证据边界

- 当前四个 CMakeLists 使用显式 source，没有当前 `file(GLOB)` 事实：基础 LIME 为 `lime.cpp`，优化 LIME 为 `lime_opt.cpp`，LSTR 为 `main.cpp`，Unet 为 `src/unet.cpp`。
- 优化目录存在 `xinlime.cpp`，但当前 CMake target 未列它；目录存在不能替代 target membership。
- 两个独立工程都产生 `lime`，必须以 source/build/output 完整路径消歧。
- 保存的 build 证据将 `CMAKE_HOME_DIRECTORY`、`CMAKE_SOURCE_DIR`、`DependInfo.cmake` 和 `link.txt` 指向 `/media/kylin/...` 旧副本；这是历史构建快照/路径失配证据，不是当前 iCloud 源码已重建的证明。
- `5.1` 关于 NCNN 静态链接、无运行时依赖和性能收益是文档主张；只有实际 link/ELF/loader 证据闭合后才能升级为当前构建/运行事实。

## 三重验证

- V1：四份 CMakeLists、当前源文件、对应 build 的 `DependInfo`/`build.make`/`link.txt` 和项目构建指南相互支撑 source→target→object→link 关系。
- V2：可判断显式 source 与未编译文件、同名 `lime`、旧绝对路径 build、增量构建陈旧性以及链接期/运行期库搜索的差异。
- V3：独特性来自“CMake source discovery + build tree freshness + runtime loader separation”的原子范围；通用编译/链接故障交给 `linux-build-debug-chain`，视觉性能/模型总体 provenance 交给 `linux-vision-build-provenance-audit`。
