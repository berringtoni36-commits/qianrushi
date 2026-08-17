# Linux 视觉术语表

| 术语 | 项目语义 | 来源 |
|---|---|---|
| LIME | 低照度增强算法链，包含光照图估计和优化 | `文档/03 LIME 低照度增强/*` |
| LSTR | 车道线检测模型/推理路径 | `文档/04 模型推理部署/*` |
| NCNN | 端侧推理框架，项目另有 Unet 独立路径 | `完整代码流程详解.md` |
| HWC/CHW | 图像张量布局转换 | `文档/04 模型推理部署/4.5...md` |
| NEON | ARM SIMD 指令集，通过 intrinsic 使用 | `原作者学习指南.md` |
| OpenMP | 多线程并行接口，需处理归约和数据竞争 | `文档/03 LIME 低照度增强/3.6...md` |
| 端到端链路 | 摄像头/文件→增强→推理→后处理→Qt | `完整代码流程详解.md` |
| Tensor contract | 输入数量、名称、shape、rank、dtype、布局、预处理和输出解码的联合契约 | `文档/04 模型推理部署/4.1/4.3/4.5`；LSTR/Unet 源码 |
| `log_space` | LSTR 曲线解码使用的离散位置/辅助输入数据；是否与目标模型完全匹配需核对文件和元数据 | LSTR 源码 `log_space.bin` 读取路径 |
| ONNX / NCNN 分支 | 项目中不同推理框架/示例路径；不能仅凭都出现于文档就断言共享 Qt 摄像头主链 | LSTR_ONNX、Unet_NCNN、上位机源码 |
| 文件型 IPC 合同 | 生产者/消费者对路径、编号、格式、完成标记、超时、清理和退出的联合约束 | `文档/01 项目概述/1.6 模块间协作与进程通信.md`；`mainwindow.cpp` |
| QProcess 生命周期 | 子进程启动、状态/错误信号、stdout/stderr、退出、terminate/kill、等待和 UI 取消的完整过程 | `文档/02 Qt 上位机/2.3 QProcess 进程管理.md`；`mainwindow.cpp` |
| provenance | 从源文件到 CMake target、编译参数、链接库、模型/数据、二进制和 benchmark 记录的可追溯链 | `CMakeLists.txt`、性能对比文档和构建目录证据 |
| 同名 target 风险 | 不同目录可用同一可执行文件名，但实际输入源、库和编译选项不同 | 基础 `Lime/CMakeLists.txt` 与 `Lime_NEON+OpenMP/CMakeLists.txt` |

## Round 3 图像与遥测术语

| `src.step` / `bytesPerLine` | OpenCV 每行实际跨度与 Qt 图像行跨度；ROI/非连续 Mat 不能用有效像素宽度替代 | `linux-vision-qt-image-buffer-adapter-audit` |
| 外部缓冲所有权 | QImage 用 `Mat.data` 构造时对源缓冲的借用/拷贝责任；`rgbSwapped()`/`copy()` 的目标版本语义仍需验证 | `linux-vision-qt-image-buffer-adapter-audit` |
| 首样本 baseline | 用第一次有效 `/proc/stat` 累计值建立前值；没有前后样本时不能当作完整采样区间利用率 | `linux-vision-resource-telemetry-contract-audit` |
| 字段/单位合同 | 原始命令字段、表头语义、单位、比例和解析状态一起记录，不能用固定下标或图表标签替代 | `linux-vision-resource-telemetry-contract-audit` |
| 样本窗口 | 图表保留的点数上限；51 点不自动等于 51 秒，需有单调时间戳和稳定间隔 | `linux-vision-resource-telemetry-contract-audit` |

## 增量术语

| 术语 | 项目语义 | 来源 |
|---|---|---|
| GUI 事件循环阻塞 | 槽函数中的固定 `waitKey`、`waitFor*` 或长轮询占住 GUI 线程，期间不能正常处理用户事件 | `文档/02 Qt 上位机/2.2 信号槽机制与交互.md`；`mainwindow.cpp:124-139`；`main.cpp:4-10` |
| `readyRead*` | QProcess 当前有可读 stdout/stderr 字节的通知，不等于完整消息、结果文件完成或任务结束 | `文档/02 Qt 上位机/2.3 QProcess 进程管理.md:129-152`；`mainwindow.cpp:50,144-149` |
| signal lifecycle | 从连接建立、信号发出、槽执行到对象销毁/自动断开的完整生命周期，需包含错误、超时、取消和迟到事件 | `mainwindow.cpp:40-52,282-287`；`ui_mainwindow.h:172` |
| 连接元组 | `(sender objectName, signal signature, receiver, slot signature, connection type, creation/teardown)`，用于判定重复连接 | `文档/02 Qt 上位机/2.2 信号槽机制与交互.md:78-88,214-220`；`mainwindow.cpp:42-52,282-287` |
| QProcess 任务代际 | 每次启动/取消/重启的 run ID；迟到 stdout、finished 或文件事件不得更新新任务 UI | `文档/02 Qt 上位机/2.3 QProcess 进程管理.md:269-279`；当前源码缺少 run ID，标为待核对/改进 |
| Auto/Queued/Direct 语义 | 连接类型决定槽是在发信线程立即执行还是投递到 receiver 线程事件循环；当前项目没有显式线程/连接类型证据 | Qt 审计通用规则；当前项目边界见 `mainwindow.cpp`、`main.cpp`，需目标运行时核对 |
| source membership | 某个源文件经 CMake 声明、生成依赖和对象链实际归属于某个 target；目录存在或文件同名不构成 membership | `add_executable`/`target_sources` 与 `DependInfo.cmake`、`build.make` |
| configure tree | CMake 配置阶段生成的缓存、生成器、source/build 根目录和依赖元数据集合 | `CMakeCache.txt`、`CMAKE_HOME_DIRECTORY`、`CMAKE_SOURCE_DIR`、`CMAKE_BINARY_DIR` |
| build tree | configure 后由生成器维护的 target 规则、对象、依赖文件、链接命令和产物目录 | `CMakeFiles/<target>.dir/`、`DependInfo.cmake`、`build.make`、`flags.make`、`link.txt` |
| runtime loader tree | 可执行文件启动时由 ELF `DT_NEEDED`、RPATH/RUNPATH、环境变量、系统缓存和部署目录共同决定的实际库搜索/加载路径 | 目标架构 `readelf -d`、`ldd` 或 `LD_DEBUG=libs`；不能由 `-L` 单独推出 |
| 增量构建新鲜度 | 当前源码、CMake 配置、头文件依赖、库、对象和 binary 是否由同一有效依赖图更新到一致状态 | 当前路径/哈希/时间与 `*.o.d`、对象、binary 对照；no-op 不等于新鲜 |
| 历史 build 产物 | 来自旧 source/build 根目录、旧工具链或旧配置的 CMake 元数据、对象或 binary，只能证明过去发生过构建 | 当前项目四套 build 文件中的 `/media/kylin/...` 绝对路径 |
