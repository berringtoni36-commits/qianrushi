# Linux 视觉来源映射

| Skill/结论 | 文档来源 | 代码/实现边界 |
|---|---|---|
| 端到端链路 | `文档/01 项目概述/1.5 系统全景与数据流.md`；`Linux视觉感知处理系统-完整代码流程详解.md` | `mainwindow.cpp` 摄像头支路；`LSTR`；`Unet_NCNN/src/unet.cpp` |
| LIME 优化 | `文档/03 LIME 低照度增强/*`；`原作者学习指南.md` | NEON 四像素路径、OpenMP sections、归约变量 |
| 模型部署 | `文档/04 模型推理部署/*`；`文档/05 系统集成与性能/*` | ONNX Runtime/LSTR 与 NCNN/Unet 为不同执行分支 |
| 事实风险 | `Linux视觉感知处理系统-完整代码流程详解.md` 第五/六部分 | 摄像头写入目录与 LSTR 默认读取目录不一致；NEON 尾部和 OpenMP 归约需验证 |
| Tensor 契约 / `vision-model-tensor-contract-audit` | `文档/04 模型推理部署/4.1 LSTR模型架构与曲线解码.md`、`4.3 log_space与双输入机制.md`、`4.5 NCNN部署与HWC-CHW转换.md`、`文档/01 项目概述/1.5 系统全景与数据流.md`、两份同哈希 `lstr_360x640.onnx` 与 `log_space.bin` | `LSTR_ONNX/main.cpp` 的输入创建/`Run(...,2,...)`、HWC→CHW/normalize、输出解码；静态 graph 闭合当前模型的 2 输入和 5 输出元数据；`Unet_NCNN/src/unet.cpp` 的输入/输出；仍不证明 BGR/RGB 训练语义、实际 cwd、目标运行或 Qt 摄像头主链已接通 |
| 文件型 IPC / `linux-vision-file-ipc-lifecycle-audit` | `文档/02 Qt 上位机/2.3 QProcess 进程管理.md`；`文档/01 项目概述/1.6 模块间协作与进程通信.md` | `mainwindow.cpp:27-34` 创建两个无 parent 的 `QProcess`，`mainwindow.cpp:59-62` 析构只释放 `ui`；摄像头写入 `frames/<count>.jpg`，LSTR 使用 `../videos/frames/`，编号从 0/1 分裂；当前没有原子 rename、done 标记或锁的源码证据 |
| 构建 provenance / `linux-vision-build-provenance-audit` | `文档/03 LIME 低照度增强/3.7 优化前后性能对比.md`；`文档/04 模型推理部署/4.6 两种方案对比：分割vs曲线.md` | 基础 `Lime/CMakeLists.txt` 的 `add_executable(lime lime.cpp)`；优化目录的 `add_executable(lime lime_opt.cpp)`；`xinlime.cpp` 未见于 target；LSTR 链接 ONNX Runtime，Unet 链接 NCNN；性能数字未与完整 benchmark 日志和转换脚本闭合 |
| Mat→Qt 缓冲合同 / `linux-vision-qt-image-buffer-adapter-audit` | `文档/02 Qt 上位机/2.5 Mat与QImage格式互转.md`；`源码/上位机程序/Lane_Detection/mainwindow.cpp/.h/.ui` | `MatImageToQt` 的 `CV_8UC1/3/4` 分支、`src.step`、`memcmp`、`rgbSwapped/copy`、`cameraView/resultView`；目标 Qt/OpenCV 所有权和非连续 Mat 运行结果待验证 |
| 资源遥测合同 / `linux-vision-resource-telemetry-contract-audit` | `文档/02 Qt 上位机/2.4 CPU与内存实时监控.md`；`sysinfolinuximpl.cpp/.h`、`mainwindow.cpp/.h`、`.pro` | `cat /proc/stat`/`free -m`、`pre_user/pre_total`、固定字段、`QTimer(1000)`、51 点 `QSplineSeries`；目标发行版字段、首样本、退出状态和实测采样间隔待验证 |

## 当前主链核验报告

[`main-chain-verification-matrix.md`](main-chain-verification-matrix.md) 和对应 JSON 将摄像头写帧、LSTR 输入、结果读取、QProcess 生命周期、Qt 事件循环、CMake 历史构建和模型/性能待验证项拆开记录。当前报告是源码/构建树静态核验，不是目标 ARM、摄像头、Qt/OpenCV 或模型运行报告。

## 增量来源映射：Qt 事件循环、信号槽与 QProcess 生命周期审计

| Skill/结论 | 文档来源 | 代码/实现边界 |
|---|---|---|
| Qt 事件循环阻塞 | `文档/02 Qt 上位机/2.2 信号槽机制与交互.md:179-183,316-319`；`文档/02 Qt 上位机/2.3 QProcess 进程管理.md:69,99-103,275-279` | `mainwindow.cpp:104-106,124-139` 的 `waitKey`、同步 `imread` 轮询和 `a.exec()` 入口；可证明槽内阻塞风险，不能证明外部任务完成 |
| QProcess signal lifecycle | `文档/02 Qt 上位机/2.3 QProcess 进程管理.md:129-152,269-279` | `mainwindow.cpp:27-34,50,144-149` 只展示 bash 启动和 stdout 读取；指定源码未见 finished/error/stderr/timeout/cancel 连接 |
| 自动/手动连接与事实边界 | `文档/02 Qt 上位机/2.2 信号槽机制与交互.md:78-88,214-220` | `ui_mainwindow.h:35,68-71,172` 的 QAction/objectName 与 `mainwindow.cpp:42-44,282-287` 的连接；图例先断后连有源码证据，按钮双重绑定需核对真实 signal |
| QObject 归属、退出和线程 | `文档/02 Qt 上位机/2.2 信号槽机制与交互.md:222-299`；`文档/02 Qt 上位机/2.3 QProcess 进程管理.md:269-279` | `mainwindow.h:70-88`、`mainwindow.cpp:23-34,59-62`、`main.cpp:4-10`；QTimer 有 parent，QProcess 无 parent，未见 QThread/moveToThread/显式连接类型 |

## 增量来源映射：CMake 源码发现—构建树—运行树与增量构建审计

| Skill/结论 | 文档/配置来源 | 代码/构建/运行边界 |
|---|---|---|
| 显式 source membership | `文档/01 项目概述/1.3 CMake 构建指南.md`；四份模块 `CMakeLists.txt` | 基础 LIME 为 `add_executable(lime lime.cpp)`；优化 LIME 为 `add_executable(lime lime_opt.cpp)`；LSTR 为 `main.cpp`；Unet 为 `src/unet.cpp`；`xinlime.cpp` 存在但未列入当前 target |
| configure/build 身份与历史快照 | 四套 `build/CMakeCache.txt`、`CMakeFiles/Makefile2`、`CMakeDirectoryInformation.cmake`、`DependInfo.cmake` | 生成文件中的 `CMAKE_HOME_DIRECTORY`/`CMAKE_SOURCE_DIR` 指向 `/media/kylin/...` 旧副本；可证明历史 configure/build，不证明当前 iCloud 源码已重建 |
| target 对象与链接命令 | 各 target 的 `DependInfo.cmake`、`build.make`、`flags.make`、`link.txt` | 两个独立工程均输出同名 `lime`，对象分别是 `lime.cpp.o` 与 `lime_opt.cpp.o`；LSTR/Unet 的库、flags、rpath 需以 `link.txt` 为准 |
| 运行时加载分离 | `文档/05 系统集成与性能/5.1 模型轻量化与参数压缩.md` | 文档关于 NCNN 静态链接/无运行时依赖是主张；当前四个产物为 AArch64 动态可执行文件，仍需目标架构 `readelf -d`、`ldd`/`LD_DEBUG=libs` 闭合 loader 证据 |
| 增量新鲜度 | `CMakeLists.txt`、`CMakeCache.txt`、`*.o.d` 与对象/二进制文件 | 以当前 source/config/头文件/库与生成对象、binary 的路径、时间和哈希对照；no-op 或 clean build 单独不能证明依赖图正确 |
