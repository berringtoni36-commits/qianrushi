# Linux 视觉感知项目 — 整体理解

## 基本信息

- 类型：ARM Linux 视觉项目文档、算法复现、C++/Qt 源码说明和面试资料。
- 平台：飞腾 FT2000/4、ARM Linux；涉及 OpenCV、Qt、LIME、ONNX Runtime、LSTR、Unet、NCNN、NEON 和 OpenMP。
- 来源：`projects/linux视觉感知项目/`。

## 结构

1. Qt 上位机与摄像头/文件输入。
2. LIME 低照度增强及 ADMM/Retinex 逻辑。
3. LSTR/ONNX 和 Unet/NCNN 两条推理路径。
4. ARM 平台的缓存、NEON、OpenMP 和模型轻量化。
5. 集成链路、文件型 IPC/QProcess 生命周期、Tensor 契约、构建 provenance、源码审计和面试表达。

## 关键术语

LIME、Retinex、ADMM、LSTR、Unet、ONNX Runtime、NCNN、HWC/CHW、NEON、SIMD、OpenMP、Qt signal/slot。

## 核心命题

- 性能优化必须先建立基线，再定位热点和验证结果。
- 摄像头采集、文件交换和识别入口必须检查路径/编号/格式是否一致。
- SIMD 和并行化的边界、归约和尾部处理决定正确性。
- 模型轻量化与推理框架属于端侧部署的系统决策。
- 模型输入/输出数量、shape、dtype、路径和解码必须以源码与模型元数据核对，不能只看架构图。
- 文件型 IPC 必须有路径、编号、完成标记、超时、清理和子进程退出合同；文件存在不等于结果完成。
- 性能数字必须能回到源码、CMake target、编译/链接库、模型/数据和原始 benchmark 口径。

## 批判与边界

- 文档描述的端到端路径存在目录不一致，不能默认摄像头帧会进入 LSTR；当前源码还存在摄像头从 0 编号、结果从 1 轮询的风险。
- `mainwindow.cpp` 创建两个无 parent 的 QProcess，析构只释放 `ui`；当前源码没有展示完整的 terminate/kill/wait 生命周期。
- 基础 LIME 与 NEON/OpenMP LIME 使用同名 target `lime` 但输入源不同；`xinlime.cpp` 存在不等于进入当前 CMake target。
- NEON 尾部和 OpenMP 归约存在源码风险，优化收益需要回归测试。
- 项目材料混合原作者指南和当前代码，个人贡献必须由用户确认。

## 应用潜力

本域生成九个 Skill：技术流水线/性能优化、文件型 IPC 与 QProcess 生命周期审计、源码—构建—产物 provenance 审计、模型 Tensor 契约审计、Qt 事件循环/信号槽审计、CMake source discovery/incremental build 审计、Mat→Qt 图像缓冲合同、资源遥测指标合同和项目面试表达；具体算法定义进入共享术语和 Digest。
