# Linux 视觉感知项目 — 精华

项目的主线是：在 FT2000/4 ARM Linux 平台上，摄像头或文件输入经过低照度增强，再进入车道线模型推理，结果由 Qt 上位机展示并监控资源。真正值得复用的方法不是背模型名，而是用数据流和性能证据审查整个系统。

## 端到端链路

先确认每一帧从哪里来、以什么格式存储、经过哪一个进程/模型、最终在哪里展示。项目资料显示 LSTR/ONNX 主链与 Unet/NCNN 独立示例不能混为一谈，摄像头保存目录和 LSTR 默认读取目录也存在不一致风险。

## 文件交换与进程生命周期

当前视觉系统使用 Qt 上位机启动外部程序，并通过固定目录交换帧和结果。审计时要把生产者、消费者、工作目录、完整路径、文件名编号、格式、完成条件、旧结果清理、超时和退出回收写成协议。当前源码显示摄像头帧写入 `/home/kylin/桌面/project_v1.0/frames/<count>.jpg`，而 LSTR 读取参数使用 `../videos/frames/`；摄像头编号从 0 开始、结果轮询从 1 开始。结果文件也没有源码证据证明使用临时文件、原子 `rename`、完成标记或锁。

因此，文件存在不能当成写入完成，`waitKey` 不能当成子进程完成，目录树刷新也不能当成结果已被消费。应记录 QProcess 的 started/error/finished、stdout/stderr、返回码和子进程状态；写文件采用临时文件+原子替换或 manifest/done 标记，读取端使用单调帧 ID、超时和旧结果隔离。析构和取消路径要明确 terminate、等待和必要的 kill，避免 UI 轮询无限等待。

## 性能优化

先实现正确的基础版，记录阶段耗时，再用热点分析决定是否做循环重排、缓存优化、NEON SIMD 或 OpenMP。每一次改动都要检查向量尾部、数据布局、并行归约和输出误差。模型量化、卷积替换和推理框架选择属于部署层决策，应结合端到端指标判断。

## 构建与性能 provenance

视觉项目的“优化版”“模型路线”和“性能数字”都要回到 source → CMake target → flags → libraries → model/data/runtime → measurement log。当前基础 LIME CMake 编译 `lime.cpp`，NEON/OpenMP CMake 编译 `lime_opt.cpp`；两者使用同名 `lime` target。`xinlime.cpp` 虽然存在，但没有证据表明它进入这两个 target。LSTR 使用 ONNX Runtime，Unet 使用 NCNN，不能仅凭目录名或二进制名判断主链。

文档中的 5.19x、10.7x、模型体积和精度数字应保留平台、输入集、计时边界、线程数、重复次数和转换脚本；当前材料没有完整 benchmark 日志闭合时，只能称“文档数字/待复核”。旧 build 目录、绝对路径和 CMakeCache 只能证明历史配置留下过证据。

## 面试边界

可以说“项目设计并尝试了 NEON/OpenMP”，但要说明 intrinsic、线程数和测试平台；不能把未验证的加速数字或团队工作说成个人已完成成果。

## Tensor 契约

模型问题先不要从“模型坏了”开始。逐项核对输入数量/名称、rank/shape、dtype、BGR/RGB、HWC/CHW、resize/normalize、辅助 mask 或 `log_space`，再核对输出维度、logits/curve/segmentation 解码和结果路径。LSTR/ONNX 与 NCNN/Unet 是不同执行分支；源码调用存在不等于目标模型元数据匹配，也不等于 Qt 摄像头主链已经接通。
