# 候选：视觉算法源码—CMake 目标—模型/二进制产物一致性审计

id: v06
title: 视觉算法源码—CMake 目标—模型/二进制产物一致性审计
type: framework
verification: V1=pass, V2=pass, V3=pass

## 方法论

建立 source → CMake target → flags → libraries → model/data/runtime → measurement log provenance 表，并区分当前源码、CMake 声明、历史 build 证据、可运行二进制和文档性能主张。

## 来源

- projects/linux视觉感知项目/文档/03 LIME 低照度增强/3.7 优化前后性能对比.md
- projects/linux视觉感知项目/文档/04 模型推理部署/4.6 两种方案对比：分割vs曲线.md
- projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt
- projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt
- projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt
- projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt

## 当前项目证据边界

- 基础 LIME target 输入 lime.cpp，优化 LIME target 输入 lime_opt.cpp；xinlime.cpp 存在但不是上述 CMake target 的输入。
- LSTR target 和 Unet target 分别链接 ONNX Runtime 与 ncnn。
- 性能文档有平台、输入量和数字，但当前来源中未同时发现完整转换脚本、benchmark 命令和原始日志；数字应标为文档主张/待复核。

## 三重验证

- V1：性能/模型对比文档、多个 CMakeLists、源码和 build 证据互相支撑。
- V2：可判断“同名 lime 到底编哪个源码”“旧 build 是否代表当前源码”“性能数字是否可重现”。
- V3：独特性来自视觉项目的同名 target、模型/库依赖和性能证据链，和一般编译排障保持边界。
