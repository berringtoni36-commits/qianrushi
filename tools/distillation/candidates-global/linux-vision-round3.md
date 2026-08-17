# Linux 视觉项目第三轮候选扫描

> 配置：Luna 最高配置。范围仅为 `projects/linux视觉感知项目/` 的剩余可读文档与项目自有源码；`projects/`、`archive/` 只读。本轮只登记候选，不创建 canonical Skill，也不修改全局索引。
>
> 去重边界：已有 `linux-vision-pipeline-and-optimization` 覆盖摄像头→LIME→推理→显示的全局链路、NEON/OpenMP 与端到端优化；`linux-vision-file-ipc-lifecycle-audit` 覆盖 QProcess/文件帧协议；`linux-vision-build-provenance-audit` 覆盖 source→target→产物→性能证据；`linux-vision-project-storytelling` 覆盖项目表达；`vision-model-tensor-contract-audit` 覆盖模型输入输出 tensor/布局/解码及主链真实性；`qt-event-loop-signal-slot-audit` 覆盖 Qt 事件循环、QProcess 状态/连接/线程；`cmake-source-discovery-incremental-build-audit` 覆盖源码发现与构建树归属。下列候选分别收窄到 UI 图像缓冲适配合同、以及资源遥测指标合同，不把这些相邻主题重新包装。
>
> 排除：`include/onnxruntime/**`、`include/ncnn/**`、`lib/**`、构建目录、已有二进制和结果图片仅作目录/产物背景，不作为用户方法或候选来源。

## 候选 1：Mat→QImage/QPixmap 显示边界的格式、stride 与所有权合同

- **建议名称**：`linux-vision-qt-image-buffer-adapter-audit`
- **端到端方法**：从 `VideoCapture::read` 或结果 `imread` 产生的 `cv::Mat` 出发，按 `type()` 分派到 QImage 格式；逐项核对 BGR/RGB、`step`/`bytesPerLine`、是否深拷贝、Mat 复用/释放时机，最后确认 `QPixmap::fromImage` 更新的是哪个 QLabel。故障定位顺序是“颜色错误 → stride/尺寸错位 → 缓冲悬空/复用 → 分支未覆盖”，而不是把所有显示异常归因于摄像头或模型。
- **source_files**：
  - `projects/linux视觉感知项目/文档/02 Qt 上位机/2.5 Mat与QImage格式互转.md#L15-L32,L57-L171`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp#L124-L139,L152-L223`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h#L47-L48,L69-L88`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.ui#L53-L140`
- **source_symbols**：`MainWindow::readFrame`、`MainWindow::yolop_process`、`MainWindow::MatImageToQt`、`src.type()`、`src.step`、`QImage::Format_Indexed8`、`QImage::Format_RGB888`、`QImage::Format_ARGB32`、`QImage::rgbSwapped`、`QImage::copy`、`QPixmap::fromImage`、`cameraView`、`resultView`、`memcmp`、`memcpy`。
- **V1/V2/V3**：高 / 高 / 高。
  - **V1**：2.5 文档给出 BGR/RGB、stride、三种 QImage 格式和生命周期说明；`mainwindow.cpp` 同时提供摄像头帧与推理结果两个调用点，可由文档→适配函数→UI 消费者回链。
  - **V2**：能预测灰度输入全黑、红蓝互换、非连续 Mat 行错位、Mat 复用后的花屏等新症状，并能用最小图像与不同 `step` 复现，而不需要先运行模型。
  - **V3**：核心对象是“跨图像库显示边界的字节布局与所有权合同”，不是 Qt 事件调度，也不是模型 tensor；当前 Skill 组合没有独立覆盖此边界。
- **文档声称**：
  - OpenCV `cv::Mat` 主要是 BGR/BGRA、Qt `QImage` 主要是 RGB/ARGB，三通道要交换红蓝通道，构造函数中的 `src.step` 用于保留真实行跨度。
  - 灰度分支应逐行复制；三通道分支先外部指针包装再 `rgbSwapped()`；四通道分支用 `copy()` 脱离 Mat 生命周期。
  - `MatImageToQt` 是摄像头画面和推理结果回到 Qt `QLabel` 的共同桥梁；文档明确指出灰度路径的 `memcmp` 应为 `memcpy`。
- **源码事实**：
  - `readFrame()` 由 `cap.read(src_image)` 得到帧，先调用 `MatImageToQt(src_image)` 更新 `cameraView`，再把缩放后的帧写文件；`yolop_process()` 对结果 `Mat r` 调同一适配器后更新 `resultView`（`mainwindow.cpp#L124-L139,L152-L165`）。
  - `CV_8UC1` 分支创建 `Format_Indexed8` 和 256 色表，随后在每行调用的是 `memcmp(pDest,pSrc,src.cols)`；返回值被丢弃，源码没有把像素复制到 QImage，因此文档指出的全黑风险是可由当前源码直接定位的事实。
  - 灰度源地址按 `src.step` 移到下一行，但每行只取 `src.cols` 字节；三通道分支把 `src.data`、`src.cols`、`src.rows`、`src.step` 包装为 `Format_RGB888` 后调用 `rgbSwapped()`；四通道分支包装为 `Format_ARGB32` 后调用 `copy()`。源码证明了分派、stride 传递和拷贝/交换调用位置，不单凭调用名证明所有 Qt 版本的内部拷贝语义。
  - 当前项目实际主要经过 `CV_8UC3` 摄像头/结果路径；`CV_8UC1` 与 `CV_8UC4` 是适配器的分支能力，不能由“程序能显示彩色图”推断灰度分支正确。
- **待验证**：
  - 在目标 Qt/OpenCV 版本上确认 `rgbSwapped()` 返回值是否已经完全脱离 Mat 缓冲；对 Mat 立即复用、释放、非连续 ROI 和自定义 stride 做运行时验证。
  - 用 1×1/2×2 已知 BGR 像素、灰度图、带 padding 的非连续 Mat 检查颜色、行边界和输出尺寸；用 AddressSanitizer 或等价边界检查确认适配器没有越界。
  - 修复候选是将 `memcmp` 改为有边界的 `memcpy`（或统一采用明确深拷贝的转换路径），但修复后的显示结果、帧率和不同 Qt 格式支持仍需目标环境回归；本轮不改源码。
- **现有 Skill 边界**：
  - `qt-event-loop-signal-slot-audit` 只审计 `QTimer`/槽调度、QProcess 信号、线程和对象生命周期；它不建立像素格式、stride 或 Mat/QImage 外部缓冲合同。
  - `vision-model-tensor-contract-audit` 可审计模型输入侧的 BGR/HWC→CHW/normalize，但本候选停在“模型/文件结果进入 Qt 显示”的 QImage/QPixmap 边，不判断 ONNX/NCNN tensor。
  - `linux-vision-file-ipc-lifecycle-audit` 负责结果文件何时完整、编号和消费者协议；本候选只接收已经读入的 `Mat`，不重新审计文件 IPC。
  - `linux-vision-pipeline-and-optimization` 可把显示作为端到端阶段，但不替代本候选对局部字节布局、浅拷贝和显示正确性的逐分支检查；`linux-vision-project-storytelling` 只负责如何表达这些事实。
- **建议**：保留为窄域候选，后续以“适配器合同表 + 四类最小图像 + Mat 复用/释放测试 + UI 结果截图/哈希”评审；若只需修复当前缺陷，优先修正灰度复制并补 `src.empty()`、连续性/stride 断言，再做彩色和四通道回归。不要把文档所称“零拷贝”自动升级为整条视觉链的零拷贝收益。

## 候选 2：上位机 CPU/内存资源遥测的采样、单位与滑窗合同

- **建议名称**：`linux-vision-resource-telemetry-contract-audit`
- **端到端方法**：从 Linux 累计 CPU 计数和内存命令输出开始，经过采样时间间隔、差分/分母、字段解析、错误状态，再进入 `QTimer`、固定长度历史窗口和 QtCharts。审计时把“内核累计量”“一次采样值”“相邻采样区间”“图表显示点”分开，先验证指标语义，再用它解释视觉负载；不把图表曲线或单次数字直接当作推理 FPS/性能 benchmark。
- **source_files**：
  - `projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md#L15-L96,L228-L355`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/sysinfolinuximpl.cpp#L11-L59`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/sysinfolinuximpl.h#L7-L20`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp#L22-L36,L51-L55,L225-L345`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h#L93-L117`
  - `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/1102demo3.pro#L7-L40`
- **source_symbols**：`sysinfolinuximpl::cpuLoadAverage`、`sysinfolinuximpl::get_mem_usage__`、`pre_user`、`pre_total`、`cpu_rate`、`mem_rate`、`QProcess::start`、`QProcess::waitForFinished`、`QProcess::readLine`、`MainWindow::timerTimeOut`、`timer2`、`QTimer::start`、`receivedData_cpu`、`receivedDate_mem`、`data_cpu`、`data_mem`、`maxSize`、`QSplineSeries::clear`、`QSplineSeries::append`、`graphicsView`。
- **V1/V2/V3**：高 / 高 / 高。
  - **V1**：2.4 文档、独立采集类、MainWindow 定时器/图表调用和 `.pro` 的 Qt Charts 配置形成完整来源链；CPU、内存、滑窗和 UI 消费各有对应符号。
  - **V2**：能预测首个 CPU 样本把开机以来累计值当成区间值、`free -m` 输出格式变化造成列错读、解析失败静默变为 0、采样调用阻塞 UI，以及 51 点曲线只代表历史窗口而不是实时吞吐等问题。
  - **V3**：核心对象是“资源指标的时间/单位/错误/展示合同”，不是视觉模型性能测量、QProcess 外部推理生命周期或 Qt 信号连接；现有视觉 Skill 没有覆盖资源监控实现自身的语义校准。
- **文档声称**：
  - 监控采用 `QTimer(1000ms)` → `sysinfolinuximpl` → CPU/内存百分比 → `QSplineSeries`/`QChartView` 的定时轮询、滑动窗口、图表绑定架构。
  - CPU 使用率按相邻 `/proc/stat` 累计值差分，分子为 user+nice+system，分母为所有 CPU 状态之和；内存按 `(total-free)/total`，文档提醒使用 `free` 而非 `available` 可能偏高。
  - 每类数据最多保留 51 个点，X 轴按 1 秒采样配置为 0–5000；文档把直接读 `/proc`、更短采样周期和 `replace()` 列为后续优化方向。
- **源码事实**：
  - 构造函数创建 `timer2`，调用 `timer2->start(1000)`，并把 `timeout()` 连接到 `timerTimeOut()`；该槽依次调用 `cpuLoadAverage()`、`get_mem_usage__()`，再刷新 CPU/内存曲线（`mainwindow.cpp#L22-L36,L51-L55,L290-L345`）。
  - CPU 采集每次临时启动 `QProcess` 执行 `cat /proc/stat` 并无界 `waitForFinished()`；第一行拆分后将 `lst[1..3]`相加为 `use`、将 `lst[1..]`相加为 `total`，以 `pre_user/pre_total` 差分并保存上一值。首次成功采样的前值为 0，因此它不是天然的“第一个 1 秒窗口”；解析失败或总量不增长时返回旧 `cpu_rate`。
  - 内存采集每次执行 `free -m`，丢弃一行后只读取下一行，按固定下标取 `lst[1]` 为 total、`lst[6]` 为 free，并计算 `(total-free)/total`；源码没有按字段名、单位或命令退出状态校验，解析失败返回 `false`，在 double 接口上等价于 0。常见 `free -m` 输出中 `lst[6]` 可能是 `available` 而非 `free`，但最终字段映射必须用目标版本原始输出核对。
  - 图表端将数据追加到 `QList`，超过 51 点就 `removeFirst()`，随后 `clear()` 再逐点 `append()`；这证明了显示的是有界历史窗口，不证明采样周期稳定或曲线代表推理阶段耗时。
- **待验证**：
  - 在目标发行版记录原始 `/proc/stat`、`free -m` 输出、命令退出码和单调时间戳，确认列顺序、`free`/`available` 含义、locale/字段缺失和内存单位；在空闲、摄像头开启、LIME/推理负载下与 `vmstat`/直接文件读取交叉核对。
  - 规定首样本策略（只建立 baseline 还是显示 0/无效），为 CPU/内存解析失败提供状态而不是复用旧值/返回 0，并测量 `waitForFinished()` 对 1 秒定时器和 UI 响应的影响；这里的事件循环阻塞细节交给 Qt Skill 验证。
  - 检查 51 点滑窗的真实采样间隔、`clear()+append()` 重绘开销和窗口关闭/采样进程未结束时的行为；不要用一次图表截图证明实时性或端到端 FPS。
- **现有 Skill 边界**：
  - `qt-event-loop-signal-slot-audit` 负责 `QTimer`、同步等待、线程和槽执行位置；本候选只把这些作为采样实现的交叉风险，重点是累计计数差分、字段/单位、错误状态和历史窗口语义。
  - `linux-vision-pipeline-and-optimization` 可要求记录 CPU/内存作为视觉 benchmark 的上下文，但本候选不测 LIME/模型阶段耗时、不评价 NEON/OpenMP 收益，也不把资源曲线当性能结果。
  - `linux-vision-build-provenance-audit` 负责性能数字与 source/target/模型/日志的可复现 provenance；本候选负责运行中监控器如何产生数字，不替代 benchmark provenance。
  - `linux-vision-file-ipc-lifecycle-audit` 负责帧/结果文件协议；`vision-model-tensor-contract-audit` 负责模型 tensor；二者都不覆盖 `/proc`/`free` 到 QtCharts 的指标合同。
- **建议**：保留为窄域候选，后续设计“标签化解析 + 首样本 baseline + `MemAvailable`/明确分母 + `ok/timestamp/unit` 状态 + 固定窗口”最小复现，并在视觉负载前后比较原始采样日志与图表数据。若评审认为通用 Linux 资源监控范围过宽，可限定为“Qt 上位机视觉负载监控的指标校准与证据边界”，不扩展成通用系统监控 Skill。

## 本轮结论

两条均达到 V1/V2/V3 高，且分别落在“图像显示适配合同”和“资源遥测合同”两个未被现有视觉 Skill 独立覆盖的边界。它们仍是候选，不代表项目运行成功、目标板实测或用户个人贡献；后续若升格，应先补最小复现与目标环境证据。
