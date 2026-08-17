---
name: linux-vision-build-provenance-audit
description: "Use when auditing whether an ARM Linux vision executable, performance claim, model branch, or optimization result can be reproduced from the current source tree, CMake target, linked library, and recorded build evidence. Trigger phrases include which source produced this binary, whether lime_opt or xinlime is actually built, CMake and build artifacts disagree, performance numbers cannot be reproduced, or vision project build provenance. Do not use for tensor shape/layout analysis alone or generic compiler troubleshooting without a vision provenance question."
metadata:
  source_files:
    - projects/linux视觉感知项目/文档/03 LIME 低照度增强/3.7 优化前后性能对比.md
    - projects/linux视觉感知项目/文档/04 模型推理部署/4.6 两种方案对比：分割vs曲线.md
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/lime.cpp
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp
    - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/xinlime.cpp
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt
    - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp
  source_symbols:
    - add_executable
    - target_link_libraries
    - lime
    - lime.cpp
    - lime_opt.cpp
    - xinlime.cpp
    - LSTR
    - unet_ncnn
    - libonnxruntime.so
    - ncnn
    - OpenMP
    - CMAKE_BUILD_TYPE
  related_skills:
    - cmake-source-discovery-incremental-build-audit
    - linux-vision-pipeline-and-optimization
    - linux-vision-project-storytelling
    - linux-build-debug-chain
---

# Linux 视觉源码—构建目标—产物来源审计

## 来源证据

source_files:
  - projects/linux视觉感知项目/文档/03 LIME 低照度增强/3.7 优化前后性能对比.md
  - projects/linux视觉感知项目/文档/04 模型推理部署/4.6 两种方案对比：分割vs曲线.md
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/lime.cpp
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp
  - projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/xinlime.cpp
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt
  - projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp

source_symbols:
  - add_executable
  - target_link_libraries
  - lime
  - lime.cpp
  - lime_opt.cpp
  - xinlime.cpp
  - LSTR
  - unet_ncnn
  - libonnxruntime.so
  - ncnn
  - OpenMP
  - CMAKE_BUILD_TYPE

## R — 来源摘录与事实

- 性能文档给出 FT2000/4、1000 帧、getTickCount 以及 LIME/Unet/LSTR 的耗时、体积和精度数字；它们是文档主张，必须回到源码、构建配置和日志核验。
- 基础 LIME 的 CMake 使用 add_executable(lime lime.cpp)；Lime_NEON+OpenMP 使用 add_executable(lime lime_opt.cpp)。同名目标不能只凭目标名判断实现版本，xinlime.cpp 也不能因存在于目录就视为当前 target 输入。
- LSTR_ONNX 构建 main.cpp 并链接 libonnxruntime.so；Unet_NCNN 构建 src/unet.cpp 并链接 ncnn 与 OpenCV。

## I — 方法论解释

把“源码存在”“CMake 声明”“构建树曾经编过”“二进制当前可运行”“性能数字可复现”拆成五个证据层。只有串起 source → target → flags → libraries → model/data/runtime → measurement log，才能说某个优化版本或模型分支可复现。

构建目录中的旧 CMakeCache、DependInfo、绝对路径和二进制只能证明某次历史配置/构建留下过证据，不能自动证明当前源码在当前机器可重建。性能表格必须有基线、输入集、编译参数、重复次数、计时范围和原始日志。

## A1 — 资料中的应用

- 两个 LIME 目录分别把基础实现和 NEON/OpenMP 实现编成同名 lime，形成目标名相同、输入源码不同的审计案例。
- lime_opt.cpp 有 NEON 加载/存储和 OpenMP；xinlime.cpp 是另一套分块并行实现，CMake 选择关系必须以当前 CMakeLists 为准。
- 文档声称的 5.19x、10.7x、模型体积/精度变化和量化收益，没有同时对应完整转换脚本、可重复 benchmark 命令和原始日志，应标为文档数字/待复核。

## A2 — 未来触发场景

- 用户问 build/lime 二进制对应哪个源码版本，或优化版是否真的被 CMake 编译。
- 用户要审计视觉项目的 CMake、动态库、模型文件、输入数据和性能/精度表格的可追溯性。
- 用户准备面试，需要区分设计意图、当前源码、历史构建和实测结果。

## E — 可执行审计流程

1. 建立 provenance 表：可执行文件对应源文件、CMake target、编译器/标准/优化选项、OpenMP/NEON 开关、链接库、模型/辅助数据、工作目录和输出。
2. 阅读 CMakeLists，再核对 build/CMakeCache、DependInfo、link.txt 和目标文件；绝对路径指向历史介质或源文件不存在时，标为历史构建证据。
3. 对同名目标和并行实现逐项比对 lime.cpp、lime_opt.cpp、xinlime.cpp，以及 LSTR_ONNX、上位机 LSTR 和 Unet_NCNN；不以目录名或二进制名代替 target 证据。
4. 审计性能实验合同：平台、输入帧、冷/热启动、计时边界、线程数、重复次数、输出误差阈值、模型转换步骤和原始日志。
5. 输出可复现、部分可复现、仅文档主张、无法确认四级结论，并给出最小复现实验。

## B — 边界与风险

- 不判断模型 tensor shape、布局和输出解码；使用 vision-model-tensor-contract-audit。
- 构建产物、模型和动态库是证据层，不自动视为当前主源。
- CMake 配置成功不等于链接库 ABI、运行时搜索路径、模型路径和输入数据可用；一般构建故障交给 linux-build-debug-chain。
- 采用 NEON/OpenMP/量化不等于目标板获得固定倍数，也不等于精度损失原因已被实验隔离。

## 相关 Skills

- linux-vision-pipeline-and-optimization：端到端热点和优化正确性。
- vision-model-tensor-contract-audit：模型输入输出合同。
- linux-build-debug-chain：一般构建、加载和运行阶段故障。
- linux-memory-source-audit：设计意图、源码事实和证据边界。
