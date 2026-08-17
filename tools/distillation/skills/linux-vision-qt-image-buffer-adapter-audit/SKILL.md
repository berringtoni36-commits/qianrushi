---
name: linux-vision-qt-image-buffer-adapter-audit
description: "审计 Linux/ARM 视觉项目的 cv::Mat → QImage → QPixmap → QLabel 显示边界：按 type、通道顺序、QImage 格式、step/bytesPerLine、连续性、外部缓冲所有权、深拷贝与 camera/result 消费者逐项核对。用户遇到颜色互换、灰度全黑、行错位、Mat 复用后花屏、格式分支遗漏，或要求区分文档声称、源码事实和目标 Qt/OpenCV 待验证项时使用；不要用它替代模型 tensor、Qt 事件循环/QProcess、文件 IPC 或端到端性能审计。"
metadata:
  source_book: Linux 视觉感知项目
  source_files:
    - projects/linux视觉感知项目/文档/02 Qt 上位机/2.5 Mat与QImage格式互转.md
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.ui
  source_symbols: [MainWindow::readFrame, MainWindow::yolop_process, MainWindow::MatImageToQt, src.step, QImage::Format_RGB888, QImage::rgbSwapped, QImage::copy, QPixmap::fromImage, cameraView, resultView]
  tags: [linux, vision, qt, opencv, image-buffer, stride, ownership]
  related_skills: [vision-model-tensor-contract-audit, qt-event-loop-signal-slot-audit, linux-vision-file-ipc-lifecycle-audit]
---

# Linux 视觉 Mat→Qt 图像缓冲适配器审计

## 来源证据

行号范围保留在正文事实说明中；frontmatter 的 `source_files` 只保存可由审计器解析的真实文件路径。

source_symbols:

- `MainWindow::readFrame`
- `MainWindow::yolop_process`
- `MainWindow::MatImageToQt`
- `src.type()`、`src.step`
- `QImage::Format_Indexed8`、`QImage::Format_RGB888`、`QImage::Format_ARGB32`
- `QImage::rgbSwapped()`、`QImage::copy()`、`QPixmap::fromImage()`
- `cameraView`、`resultView`
- `memcmp`、`memcpy`

## R — 原文与事实边界

### 文档声称

- OpenCV 的 `Mat` 在本项目语境中主要按 BGR/BGRA 组织，Qt `QImage` 按 RGB/ARGB 格式解释；`CV_8UC1/3/4` 分别映射到 `Format_Indexed8/RGB888/ARGB32`。三通道路径需要交换红蓝通道，外部行跨度由 `src.step` 提供（文档 `2.5:15-32`）。
- 灰度路径应建立 256 色灰度表并逐行复制；三通道路径先用外部指针包装再 `rgbSwapped()`；四通道路径先包装再 `copy()` 脱离 `Mat` 生命周期（`2.5:57-115`）。
- `MatImageToQt` 是摄像头帧和推理结果回到 Qt `QLabel` 的共同桥梁；文档明确指出灰度代码中的 `memcmp` 应为 `memcpy`（`2.5:117-171`）。

### 源码事实

- `mainwindow.h:47-48` 声明 `QImage MatImageToQt(const Mat &src)`；`mainwindow.cpp:168-223` 按 `src.type()` 实现 `CV_8UC1`、`CV_8UC3`、`CV_8UC4` 和其他类型返回空 `QImage` 的四条路径。
- `readFrame()` 由 `cap.read(src_image)` 得到帧，检查 `!src_image.empty()` 后调用适配器，再以 `QPixmap::fromImage(qsrc)` 更新 `cameraView`；之后缩放并写出帧（`mainwindow.cpp:152-165`）。
- `yolop_process()` 用 `imread()` 得到结果 `Mat r`，遇到空图即退出循环；非空结果经同一适配器后以 `QPixmap::fromImage(rq)` 更新 `resultView`（`mainwindow.cpp:124-139`）。这证明两个调用点共用函数，不证明外部推理已成功或目标环境已运行。
- 灰度分支创建 `Format_Indexed8`、设置 256 个灰度色表，逐行取 `scanLine()`，但 `mainwindow.cpp:195` 调用的是 `memcmp(pDest,pSrc,src.cols)`，返回值被丢弃；源码没有把源像素写入目标图像。`pSrc += src.step` 只证明行指针按 Mat 步长前进。
- 三通道分支把 `src.data`、宽、高、`src.step` 传给 `Format_RGB888` 的外部缓冲构造函数，然后返回 `qImage.rgbSwapped()`；四通道分支把同样的外部缓冲包装为 `Format_ARGB32`，然后返回 `qImage.copy()`（`mainwindow.cpp:201-218`）。源码证明调用、参数和返回路径，不单凭调用名证明任意 Qt 版本的内部拷贝语义。
- `mainwindow.ui:63-78` 定义 `cameraView`，`mainwindow.ui:111-130` 定义 `resultView`；指定 UI 文件未证明 QLabel 的缩放、设备像素比或最终绘制结果与源像素逐点相同。

### 待验证

- 在目标 Qt 版本确认 `rgbSwapped()` 返回图像对外部 `Mat` 缓冲的所有权/拷贝语义；确认 `copy()`、`QPixmap::fromImage()` 和隐式共享在 Mat 立即释放、复用或修改后的可见行为。
- 用已知 BGR/灰度/BGRA 像素和带 padding 的非连续 ROI 检查颜色、宽高、每行边界、`bytesPerLine` 及是否越界；静态源码不能证明目标板上的实际显示结果。
- 确认调用点的真实 `type()`、深度、通道语义、端序、Qt 格式支持和 `src.step` 范围；文档中的“零拷贝”“深拷贝”“当前主要是彩色”均按证据等级报告，不能升级为运行成功或性能收益。
- 修复候选是把灰度分支的比较操作改成有边界的复制，或统一采用明确拥有像素的转换路径；本 Skill 不直接修改项目源码，修复效果需目标 Qt/OpenCV 回归。

## I — 适配器合同与审计不变量

把边界写成一条有生产者、借用缓冲、转换对象和消费者的合同：

`VideoCapture/imread → cv::Mat(type, cols, rows, step, data) → MatImageToQt → QImage → QPixmap::fromImage → cameraView/resultView`

逐项保持以下不变量：

1. **格式不变量**：`type()` 的深度和通道数必须与 QImage `Format`、每像素字节数及通道顺序一致。BGR→RGB、BGRA/ARGB 字节解释、灰度色表是三个独立问题，不能用“调用了转换函数”替代逐项证据。
2. **行跨度不变量**：有效行字节数为 `cols × elemSize()`；外部 QImage 的 `bytesPerLine` 必须覆盖有效像素，且下一行必须从实际 `step` 位置开始。连续 Mat 不是前提时，不能用 `cols × channels` 跨行寻址。
3. **边界不变量**：读取每行只能访问该行有效像素范围；复制到 QImage 时使用目标行自己的跨度；任何 `size_t` 到 Qt 构造参数的转换、空 Mat、零尺寸和不支持的深度都要显式记录。
4. **所有权不变量**：外部指针构造的 QImage 默认是借用 `Mat` 缓冲；在 Mat 释放、复用或写入前，必须已完成深拷贝，或证明消费者只在借用窗口内读取。`rgbSwapped()`/`copy()` 的语义按“源码调用—文档契约—目标版本验证”三层报告。
5. **消费者不变量**：必须把每一个适配器返回值映射到实际 `QLabel`、`QPixmap::fromImage()` 调用和更新时机；不能把 `cameraView` 的更新推断成 `resultView` 也已更新，反之亦然。
6. **证据不变量**：每个结论标为“文档声称、源码事实、待验证”之一；源码存在 `Format_RGB888`、`copy()` 或 `QPixmap` 不等于证明颜色正确、缓冲安全或目标程序运行成功。

建议故障定位顺序为：颜色错误 → stride/尺寸错位 → Mat 释放或复用后的悬空 → `type()` 分支未覆盖。不要先把所有显示异常归因于摄像头、模型或 Qt 事件循环。

## A1 — 当前项目中的应用

### 适配器分支表

| Mat 分支 | 源码转换 | 要核对的合同 | 当前静态结论 |
|---|---|---|---|
| `CV_8UC1` | `Format_Indexed8`、256 色表、逐行目标行 | `src.cols` 是否等于每行有效字节数，复制是否真的发生 | `memcmp` 返回值被丢弃，源码直接支持灰度输出未复制的缺陷判断 |
| `CV_8UC3` | 外部 `data` + `src.step` → `Format_RGB888` → `rgbSwapped()` | BGR/RGB、非连续行、外部缓冲何时失效 | 调用链和 stride 传递可静态确认；最终所有权/显示正确性待目标 Qt 验证 |
| `CV_8UC4` | 外部 `data` + `src.step` → `Format_ARGB32` → `copy()` | BGRA/ARGB 字节序、Alpha 语义、copy 后生命周期 | 调用链可静态确认；格式兼容与运行结果不可仅由源码升级确认 |
| 其他类型 | `QImage()` | 调用方是否处理空图、是否需要更多深度/通道分支 | 源码明确返回空图，未证明调用方覆盖该结果 |

### 两个实际消费点

- **摄像头画面**：`cap.read(src_image)` → `MatImageToQt(src_image)` → `cameraView.setPixmap(...)`。适配器之后的 `resize/imwrite` 不属于 QImage 显示合同，但可改变 Mat 后续复用时机，审计时记录其相邻关系。
- **推理结果画面**：`imread(result/<i>.jpg)` → `MatImageToQt(r)` → `resultView.setPixmap(...)`。文件何时完整、编号是否正确属于文件 IPC Skill；本 Skill 从已经得到的 `Mat r` 开始核对显示边界。

### 最小可复核样例

用 1×1/2×2 已知像素、一个 `step > cols × elemSize()` 的非连续 ROI，以及在转换后立即复用/释放 Mat 的用例，分别记录：输入 `type/cols/rows/step/data`、返回 QImage `format/size/bytesPerLine`、像素值、QPixmap 消费者和生命周期事件。灰度用例应专门验证当前 `memcmp` 路径不会被误报为成功。

## A2 — 未来触发场景

1. “画面红蓝反了、天空变橙、红色物体变蓝。”——先核对三通道源顺序、`Format_RGB888` 与 `rgbSwapped()`，再检查显示端是否另做转换。
2. “灰度图全黑或某些行错位。”——分别检查 `memcmp/memcpy`、`src.cols`、`src.step`、QImage 目标行跨度和非连续 Mat。
3. “QImage 转完当下正常，下一帧/释放 Mat 后花屏或随机崩溃。”——建立借用缓冲到 QPixmap 消费的时间线，验证 `rgbSwapped()`/`copy()` 的目标 Qt 语义和 Mat 复用点。
4. “摄像头能显示，结果图不显示，或新增 CV_8UC4/16 位输入后空白。”——沿 `readFrame`/`yolop_process` 的实际消费者映射检查分支覆盖、空 QImage 和 QLabel，而不跳到模型 tensor 结论。
5. “想审计 Mat→Qt 适配是否零拷贝、是否安全、是否支持 ROI。”——输出格式、stride、所有权和最小图像证据表；没有目标运行证据就保留待验证。

## E — 可执行审计流程

### 1. 固定范围和证据等级

记录目标函数、调用点、Qt/OpenCV 版本、是否提供运行日志/截图/最小复现。先读本 Skill 的 `source_files` 和用户明确授权的额外文件；原始文档、源码、模型、图片和结果只读。建立表格：`claim | 文档/源码/待验证 | path:line | 推理 | 未闭合项`。

### 2. 建立生产者—适配器—消费者链

分别画出摄像头和结果图两条链，标记 `Mat` 创建/填充点、`MatImageToQt` 调用、QImage 返回值、`QPixmap::fromImage` 和具体 QLabel。没有调用点时写“未证明”，不以目录名、文档流程图或函数名称补边。

### 3. 逐分支抽取字节合同

对每个 `src.type()` 记录深度、通道数、每像素字节、有效行字节、`src.step`、QImage format、色表、bytesPerLine、颜色交换和返回对象。检查空图、零尺寸、非连续 ROI、padding、行尾越界、未知 type 与整型范围；区分“代码调用了 API”与“API 的目标版本行为已测”。

### 4. 单独审计所有权和复用窗口

标记每个 QImage 构造函数是否借用外部指针。对 `rgbSwapped()`、`copy()`、隐式共享和 `QPixmap::fromImage()` 分别记录：调用位置、文档语义、当前 Qt 版本待确认项。追踪 Mat 的释放、下一次 `cap.read`、原地修改、ROI 所属存储和 QPixmap 设置时机；不把“函数返回”自动等同于“缓冲已脱离”。

### 5. 以症状顺序验证

先用已知 BGR/RGB 像素排颜色，再用带 padding 的 2D 图排 stride，再用灰度图排复制，再用 Mat 释放/复用排所有权，最后用未覆盖 type 排分支。记录像素值或哈希、尺寸、行跨度、生命周期和 QLabel；截图只能证明一次渲染现象，不能独立证明拷贝合同。

### 6. 给出最小修复与验证条件

修复建议只针对已定位的边界，例如将比较调用改为有边界复制、统一明确拥有的转换路径、补空图/类型/stride 检查、将结果消费者映射到正确 QLabel。每项写回归条件；不修改用户未授权的源码，也不宣称已在目标 Qt/OpenCV 或真实客户端运行。

### 7. 输出审计报告

按“结论摘要 → 两条消费链 → 分支格式/stride 表 → 所有权时间线 → 文档声称/源码事实/待验证三栏 → 最小复现与修复条件 → 相关 Skill 边界”交付。若没有运行证据，明确写“静态审计”；不要把文档中的零拷贝、深拷贝、实时显示或性能说法写成实测结果。

## B — 相关 Skill 边界与风险

- `qt-event-loop-signal-slot-audit` 审计 `QTimer`、`waitKey`、QProcess 信号、线程和对象生命周期；本 Skill 只审计像素格式、行跨度、缓冲所有权和显示消费者。若问题是窗口卡顿或槽未调度，交给该 Skill。
- `vision-model-tensor-contract-audit` 审计模型输入输出的 shape、dtype、HWC/CHW、归一化和解码；本 Skill 从已经得到的 `cv::Mat` 到 QImage/QPixmap 停止，不判断 ONNX/NCNN tensor。
- `linux-vision-file-ipc-lifecycle-audit` 审计 QProcess、路径、编号、文件完整性和跨进程结果协议；本 Skill 不判断 `imread` 前的文件是否完整，只审计 `Mat` 已产生后的显示适配。
- `linux-vision-pipeline-and-optimization` 审计摄像头→增强→推理→显示的全局链路、NEON/OpenMP 和端到端性能；本 Skill 不把一个适配器的拷贝/stride 结论升级为全链路零拷贝收益或 FPS 结论。
- `linux-vision-project-storytelling` 负责项目介绍、面试表达和个人贡献边界；本 Skill 只输出可回链的技术证据。
- 不把文档代码块当作当前实现，不把 `rgbSwapped()`/`copy()` 的名称当作目标版本运行证明，不把彩色路径显示过一次推断成灰度/四通道分支正确，不修改原始 `projects/`、`archive/`、源码或全局索引。

静态审计可确认源码中的分派、指针、stride 参数、拷贝调用和 QLabel 调用点；目标 Qt/OpenCV 的内部语义、设备显示、性能、运行成功和真实客户端命中必须另有证据。
