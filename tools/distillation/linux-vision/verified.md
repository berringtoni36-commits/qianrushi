# Linux 视觉三重验证结果

| ID | 候选 | V1 | V2 | V3 | 结论 |
|---|---|---|---|---|---|
| v05 | 文件型 IPC 与 QProcess 生命周期审计 | QProcess/协作文档、mainwindow.cpp、mainwindow.h、LSTR main.cpp | 可从路径、编号、旧结果、半文件和子进程退出症状反推协议缺口 | 把视觉进程间文件交换从架构描述提升为可验证的生产者/消费者合同 | 通过 |
| v06 | 源码—CMake—模型/二进制 provenance 审计 | LIME 性能/模型对比文档、多个 CMakeLists 和源码 | 可判断同名 target、历史 build、动态库/模型依赖和性能数字的复现等级 | 将视觉项目性能与模型主张绑定到可追溯构建链 | 通过 |
| v07 | 文件型 IPC 与 QProcess 生命周期审计 | Qt/QProcess 文档、模块协作文档、mainwindow.cpp/mainwindow.h/LSTR main.cpp | 可从路径、编号、旧结果、半文件和子进程退出症状反推协议缺口 | 将视觉进程间文件交换从架构描述提升为可验证的生产者/消费者合同 | 通过 |
| v01 | 端到端视觉流水线审计 | 总览、完整代码、学习指南 | 可定位输入断链与格式错误 | 把系统边界作为核心方法 | 通过 |
| v02 | 基线驱动的 ARM 优化 | LIME 文档、性能文档、源码审计 | 可分析新热点和错误优化 | 将正确性回归纳入优化 | 通过 |
| v03 | 视觉项目面试表达 | 学习指南、面试文档、完整流程 | 可组织新追问 | 贡献/事实边界明确 | 通过 |
| v04 | 模型 Tensor 契约与主链真实性审计 | LSTR/ONNX、同哈希 `lstr_360x640.onnx` 静态 graph、`log_space`、NCNN/Unet、系统总览文档与四份源码交叉支撑 | 可从静态 graph、shape、输入数量、路径、布局和输出解码反推模型/主链缺口 | 将 tensor 契约和“架构图声称”与实际调用路径合并审计，并把精确模型元数据与运行时证据分开 | 通过 |
| v08 | Qt 事件循环、信号槽与 QProcess 生命周期审计 | Qt 上位机 2.2/2.3/2.4 文档、mainwindow.cpp/h、ui_mainwindow.h、main.cpp | 可从 waitKey/长轮询、QProcess 信号缺口、对象 parent、连接元组和线程证据边界反推 UI 卡顿与生命周期风险 | 将 Qt 调度/槽/QProcess signal lifecycle 从文件 IPC 合同和项目表达中拆成原子审计 | 通过 |
| v09 | CMake 源码发现—构建树—运行树与增量构建审计 | CMake 构建指南、模型轻量化文档、四份 CMakeLists、源码及 CMakeCache/DependInfo/build.make/link.txt | 可判断显式 source、未编译文件、同名 target、旧绝对路径 build、增量新鲜度以及链接期/运行期库搜索边界 | 将 source membership、build tree freshness 与 runtime loader separation 升格为原子 Skill | 通过 |

| v10 | Mat→QImage/QPixmap 显示边界合同 | Qt 格式文档、`mainwindow.cpp/.h/.ui` 的适配与消费者路径交叉支撑 | 可从灰度全黑、BGR/RGB、ROI stride、Mat 复用花屏推导最小像素/生命周期验证 | 独立审计字节布局、行跨度和外部缓冲所有权，不替代 Tensor/IPC/事件循环 | 通过 |
| v11 | Qt 视觉资源遥测指标合同 | CPU/内存监控文档、`sysinfolinuximpl.*`、`mainwindow.*` 和 `.pro` 交叉支撑 | 可从首样本、`free -m` 固定列、解析失败、QTimer 标称周期和 51 点窗口推导指标误读 | 独立于 Qt 生命周期、端到端性能和构建 provenance，强调字段/单位/状态/时间证据 | 通过 |

## Round 3 canonical 状态

`linux-vision-qt-image-buffer-adapter-audit` 与 `linux-vision-resource-telemetry-contract-audit` 已完成 RIA++、来源元数据、3 正例/2 诱饵/1 边界静态压力测试，并已安全同步到 ZCode。目标 Qt/OpenCV、摄像头/非连续 Mat、目标发行版 `/proc/stat`/`free -m` 和 ZCode 真实盲测尚未执行。
