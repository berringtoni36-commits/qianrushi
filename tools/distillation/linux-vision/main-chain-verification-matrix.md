# Linux 视觉主链核验矩阵

> 该矩阵把“摄像头/文件输入 → 帧文件 → LSTR/预处理 → 结果文件 → Qt 显示”拆开核对。源码、模型和构建树只读；没有在目标 ARM/Qt/OpenCV 环境执行。

## 静态主链结论

- 摄像头保存路径：`/home/kylin/桌面/project_v1.0/frames/`；Qt 启动的 LSTR 输入路径（按构建 cwd 展开）：`/home/kylin/桌面/project_v1.0/LSTR/videos/frames/`；默认不一致：`是`。
- 摄像头计数器在 `on_Open_triggered()` 设为 0，`readFrame()` 先写 `count` 再递增；LSTR 的读取循环从 1 开始。它是静态编号边界，不能自动推断所有场景必然失败。
- QProcess 以无 parent 形式创建：`是`；finished/error/stderr/timeout/terminate/kill 连接或调用命中：`0` 项。
- 现有构建树包含旧 `/media/kylin/...` 绝对路径的生成文件：18 个；可证明历史 configure/build 线索，不能证明当前 iCloud 源码已经重建。

## 验证矩阵

| ID | 检查 | 状态 | 当前证据/缺口 |
|---|---|---|---|
| V0 | source membership | **static-pass** | main/LIME plus LSTR_ONNX and Unet_NCNN CMake target source lists parsed |
| V1 | camera frame write reaches inference input | **static-blocked** | camera=/home/kylin/桌面/project_v1.0/frames/; inference=/home/kylin/桌面/project_v1.0/LSTR/videos/frames/ |
| V2 | frame numbering contract | **static-risk** | camera count starts at 0; LSTR loop starts at 1 |
| V3 | QProcess completion/error/cancel lifecycle | **static-risk** | parent/finished/error/timeout/termination must be checked |
| V4 | GUI event-loop responsiveness | **static-risk** | blocking wait and synchronous result loop occur in slot |
| V5 | current CMake/build provenance | **historical-only** | old absolute build paths in 18 generated files |
| V6 | model file and tensor metadata | **partial-static** | main, LSTR_ONNX and Unet_NCNN model/helper files are inventoried; file presence is not shape/dtype/runtime validation |
| V7 | ARM/NEON/OpenMP performance | **not-run** | requires target AArch64/NEON and benchmark harness |
| V8 | Qt/OpenCV buffer ownership and display | **not-run** | requires target Qt/OpenCV and known-pixel/non-contiguous Mat tests |

## 分支身份

- 基线 LIME target 是 `lime`，源文件为 `lime.cpp`；优化 LIME target 也叫 `lime`，源文件为 `lime_opt.cpp`。两套 build 目录不能只靠可执行文件名区分。
- `xinlime.cpp` 当前存在：`是`；优化 CMake 是否把它列入 target：`否`。
- LSTR 模型文件存在：`是`；`log_space.bin` 存在：`是`。文件存在不等于输入 shape、dtype、输出顺序和主链已运行验证。
- 独立 `LSTR_ONNX` target：`已识别且源文件存在`；其模型/`log_space.bin` 从 `build/` 相对路径解析：`是`；ONNX Runtime 共享库存在：`是`。
- 独立 `Unet_NCNN` target：`已识别且源文件存在`；其 `model.ncnn.param/bin` 从 `build/` 相对路径解析：`是`；`libncnn.a` 存在：`是`。
- 这两个独立分支只能证明源码、配置、模型/库和历史构建文件的静态关系；不能据此宣称当前机器或目标板完成了推理、输出质量或性能验证。

## 目标环境补证顺序

1. 统一输入/输出根目录和帧完成合同：明确摄像头、ffmpeg、LSTR 和 Qt 四方的实际路径、编号起点、原子落盘/完成标志和旧结果清理。
2. 在当前源码目录 clean configure/build，保存 CMake source/build directory、target source、compile/link command、架构和动态库 loader 证据。
3. 对主链 LSTR、独立 LSTR_ONNX 和 Unet_NCNN 分别用一个已知图片验证模型加载、输入 shape/dtype、输出 shape/类别映射和结果文件；不能用一个分支的输出替代另一个分支的证据。
4. 用已知像素和非连续 Mat 验证 Mat→QImage→QPixmap 所有权、stride、颜色顺序；最后在目标板测 NEON/OpenMP/NCNN 线程配置性能并保存原始 benchmark。

## 来源

- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp`
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h`
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp`
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/CMakeLists.txt`
- `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime/CMakeLists.txt`
- `projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/CMakeLists.txt`
- `projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp`
- `projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/CMakeLists.txt`
- `projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp`
- `projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/CMakeLists.txt`
