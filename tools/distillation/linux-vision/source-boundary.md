# Linux 视觉感知来源边界与主链登记

> 本域文件数很大，主要由 vendor 头文件、模型、历史 build、结果图片和构建证据构成。这里明确哪些文件能证明主链，哪些只能证明依赖或历史状态；原始项目保持只读。

## P0 当前主链候选

### Qt/摄像头与进程协作

- `源码/上位机程序/Lane_Detection/mainwindow.cpp/.h/.ui`：Qt UI、摄像头、QTimer、QProcess、文件帧和结果显示。
- `源码/上位机程序/Lane_Detection/sysinfolinuximpl.cpp/.h`：`/proc/stat`、`free -m` 资源读取。
- `源码/上位机程序/Lane_Detection/1102demo3.pro`：Qt 工程配置/源成员关系。

### 预处理与推理分支

- `源码/图像预处理（加速前+加速后）/Lime/lime.cpp` + `Lime/CMakeLists.txt`：基线 LIME target。
- `源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp` + 对应 `CMakeLists.txt`：NEON/OpenMP 优化分支；`xinlime.cpp` 存在不等于已进入 target。
- `源码/上位机程序/Lane_Detection/LSTR/main.cpp` + `LSTR/CMakeLists.txt`：ONNX Runtime/LSTR 可执行分支。
- `源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp` + `LSTR_ONNX/CMakeLists.txt`：另一份 LSTR/ONNX 分支或复刻，不能和上位机子目录自动视为同一 build。
- `源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp` + `Unet_NCNN/CMakeLists.txt`：NCNN/Unet 分支；模型文件和输入输出契约需独立核对。

## P1 文档与事实边界

- `文档/00`–`06`、三份完整流程/原作者文档/学习指南：用于设计意图、解释、面试和审计线索。
- 端到端主链不能只靠架构图确认：摄像头写入目录、LSTR 读取目录、帧编号和结果轮询必须回到源码逐项核对。
- “优化更快”“模型更轻”“实时监控”等说法需绑定 target、编译 flags、模型/数据集和 benchmark 原始记录；当前静态产物不等于目标板实测。

## P2 依赖/历史/证据层

| 类型 | 典型路径 | 口径 |
|---|---|---|
| vendor headers | `*/include/onnxruntime/**`、`*/include/ncnn/**`、`omp.h` | 证明可见依赖接口/版本线索，不证明当前 target 完整构建。 |
| model assets | `lstr_360x640.onnx`、`log_space.bin`、`model.ncnn.*` | 证明模型文件存在；shape、dtype、版本和主链仍需元数据/运行确认。 |
| build tree | 各模块 `build/`、`CMakeCache.txt`、`DependInfo.cmake`、`link.txt` | 证明历史 configure/build 配置；绝对路径指向旧副本时不能当作当前源码重建。 |
| result/media | `result/`、`frames/`、`assets/`、图片 | 只能作为示例/输出证据；不能单独证明生成链和性能。 |

## 本轮处理结论

- 现有 9 个规范 Skill 已覆盖端到端优化、文件 IPC、构建 provenance、项目表达、Tensor 契约、Qt 事件循环、CMake source discovery、Mat→Qt 缓冲和资源遥测。
- 没有把数百个 vendor 头文件、模型和 build 产物复制进 Skill；它们保留在来源登记簿作为证据层。
- 下一步增量应优先闭合一个可复现主链（输入文件/摄像头 → 预处理 → LSTR/Unet → 输出 → Qt 显示），再决定是否需要新的方法 Skill。

## 原始资料与派生产物

- 原始路径：`projects/linux视觉感知项目/`（只读）。
- 域概览：[`BOOK_OVERVIEW.md`](tools/distillation/linux-vision/BOOK_OVERVIEW.md)。
- 结论回链：[`source-map.md`](tools/distillation/linux-vision/source-map.md)。
- 文件级登记：[`source-register.md`](tools/distillation/linux-vision/source-register.md)。
