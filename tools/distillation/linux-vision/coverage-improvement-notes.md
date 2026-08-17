# Linux vision 覆盖改进队列

## P0：先闭合主链身份

| 缺口 | 具体补证 | 当前不能声称 |
|---|---|---|
| 摄像头→文件→LSTR→结果→Qt 显示 | 同一次运行记录帧号、绝对路径、进程命令行、退出码、结果时间戳和显示帧 | 不能声称摄像头主链已稳定跑通 |
| LSTR/Unet 分支关系 | 记录实际调用者、cwd、模型 graph 输入输出和加载库 | 不能声称两个模型同时属于同一默认主链 |
| 构建身份 | 从 clean configure 到 build、`compile_commands`/`link.txt`、架构和动态库加载逐项留证 | 不能把历史 build 目录当作当前源码的重建结果 |

## P1：补实现合同

| 缺口 | 需要核对的文件/符号 | 目标 |
|---|---|---|
| 文件 IPC | `mainwindow.cpp`、LSTR `main.cpp`、结果文件读写处 | 完成编号、就绪、超时、清理和错误传播表 |
| Qt 生命周期 | `mainwindow.cpp/.h`、`main.cpp`、`.ui` | 闭合事件循环、槽内阻塞、QProcess finished/error/stderr、QObject ownership |
| 图像缓冲 | `MatImageToQt`、camera/result view 调用者 | 闭合 type、通道、step、连续性、copy 和所有权 |
| 资源遥测 | `sysinfolinuximpl.cpp/.h`、QTimer 和 series 更新 | 闭合字段、单位、差分、首样本和固定窗口 |

## P2：补性能证据

- NEON：记录尾部处理、编译 flags、目标 ISA 和同一输入集的多次计时。
- OpenMP：记录线程数、归约变量、调度策略和可重复性。
- LIME/ADMM：记录输入尺寸、迭代停止条件、质量指标与 wall-clock，不把文档中的单个数字当成实测。
- 模型：记录 ONNX Runtime/NCNN 版本、动态库、预处理布局和输出解码检查。

## 处置原则

本文件只增加验证队列，不修改源码，不复制二进制，不执行 ARM/Qt/OpenCV/摄像头/模型运行。补证完成后要回写来源映射和测试，而不是直接把候选升格为 Skill。
