---
name: "vision-model-tensor-contract-audit"
description: "Audit an embedded Linux vision model's input/output tensor contract and the truth of its main-chain integration from project documents and source code. Use for questions about input count, input binding, shape, rank, host dtype, BGR/HWC to CHW conversion, resize, normalize, mask, log_space, logits/curve or segmentation decoding, model/image/result paths, and whether ONNX/LSTR and NCNN/Unet actually share a Qt/camera pipeline. Do not use for global ARM vision performance troubleshooting or interview/project storytelling."
metadata:
  source_files:
    - "projects/linux视觉感知项目/文档/04 模型推理部署/4.1 LSTR模型架构与曲线解码.md"
    - "projects/linux视觉感知项目/文档/04 模型推理部署/4.3 log_space与双输入机制.md"
    - "projects/linux视觉感知项目/文档/04 模型推理部署/4.5 NCNN部署与HWC-CHW转换.md"
    - "projects/linux视觉感知项目/文档/04 模型推理部署/4.7 嵌入式平台优化策略.md"
    - "projects/linux视觉感知项目/文档/01 项目概述/1.5 系统全景与数据流.md"
    - "projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp"
    - "projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp"
    - "projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/lstr_360x640.onnx"
    - "projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/lstr_360x640.onnx"
    - "projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/log_space.bin"
    - "projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/log_space.bin"
    - "projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp"
    - "projects/linux视觉感知项目/源码/图像预处理（加速前+加速后）/Lime_NEON+OpenMP/lime_opt.cpp"
  source_symbols:
    - "LSTR::LSTR"
    - "LSTR::normalize_"
    - "LSTR::detect"
    - "input_node_dims"
    - "output_node_dims"
    - "input_shape_"
    - "mask_shape_"
    - "mask_tensor"
    - "ort_session->Run"
    - "pred_logits"
    - "pred_curves"
    - "log_space"
    - "model_path"
    - "filefolderpath"
    - "Unet.load_param"
    - "Unet.load_model"
    - "ncnn::Extractor::input"
    - "ncnn::Extractor::extract"
    - "INPUT_WIDTH"
    - "INPUT_HEIGHT"
    - "copyMakeBorder"
    - "convertTo"
    - "LIME::lime::enhance"
    - "LIME::lime::_init_IllumMap"
    - "LIME::lime::getMax"
    - "cv::resize"
    - "cv::imread"
    - "cv::imwrite"
    - "fillConvexPoly"
  tags:
    - "embedded"
    - "arm-linux"
    - "computer-vision"
    - "tensor-contract"
    - "onnx"
    - "ncnn"
    - "lstr"
    - "unet"
    - "provenance"
    - "source-audit"
  related_skills:
    - "linux-vision-pipeline-and-optimization"
    - "linux-vision-project-storytelling"
    - "interactive-lab-fact-boundary-audit"
    - "linux-memory-source-audit"
---

# 嵌入式视觉模型 Tensor Contract 与主链真实性审计

只读项目文档、源码和可提供的模型元数据，建立“图像/文件 → 预处理 → 输入 tensor → 推理 API → 输出 tensor → 解码 → 结果文件/显示”的证据链。报告必须区分源码直接证明、文档声称、由代码推导和仍待运行时验证的结论；不要把独立示例、目录约定或架构图自动升级为 Qt 摄像头主线已经接通。

## R — 来源摘录（Reading）

本 Skill 的主源是用户指定的五份部署/系统文档和四份源码。文档可提供设计意图与流程图，源码优先回答“当前实现实际做了什么”。引用时保留精确路径和行号；不要把文档中的性能数字或架构图当作 tensor 元数据。

### 可直接从源码核对的事实

| 证据 | 当前代码事实 | 结论级别 |
|---|---|---|
| `LSTR_ONNX/main.cpp:48,76-82`；集成版 `main.cpp:49,77-83` | 模型路径表达式是 `../lstr_360x640.onnx`；`inpHeight/inpWidth` 取第一输入的维度 `[2]`/`[3]`；读取 `../log_space.bin`，分配 50 个 `float` 并 `fread` | 源码直接证明路径表达式和假设；不证明文件存在或读取成功 |
| `LSTR_ONNX/main.cpp:118-130`；集成版 `:119-130` | `input_shape_={1,3,inpHeight,inpWidth}`，`mask_shape_={1,1,inpHeight,inpWidth}`；两个 `CreateTensor<float>` 被 push 到 `ort_inputs`；`Run(..., 2, ...)` 明确传入 2 个输入 | 源码证明调用契约；不等同于已核验 ONNX 的输入节点数量/名称/元素类型 |
| `LSTR_ONNX/main.cpp:91-106`；集成版 `:92-107` | 每像素读取 `img.ptr<uchar>(i)[j*3+c]`，写入 `c*row*col+i*col+j`；数值变换是 `(pix/255.0-mean[c])/std[c]`，均值/标准差为 `{0.485,0.456,0.406}`/`{0.229,0.224,0.225}` | 源码证明 HWC 风格读法、CHW 目标索引和 float 标准化；没有 `cvtColor`，不能无证据称输入已由 BGR 转 RGB |
| `LSTR_ONNX/main.cpp:109-117`；集成版 `:110-118` | `detect()` 用模型读取到的宽高 `resize(..., INTER_LINEAR)`，随后调用 `normalize_()` | 源码证明 resize/normalize 顺序；“360×640”需由模型实际维度或文档另证 |
| `LSTR_ONNX/main.cpp:131-168`；集成版 `:132-169` | `ort_outputs[0]` 作为 `pred_logits`，`[1]` 作为 `pred_curves`；代码取 `output_node_dims[0][1]`、`[0][2]`、`[1][2]`，对 logits 做 argmax，`max_id==1` 才解码曲线 | 源码显示它按至少三维输出访问；文档写 `[N,2]`/`[N,8]`时必须标为简化语义 |
| 同上 | 每条有效曲线用 8 个位置 `p[0]..p[7]`计算 y/x，按 `len_log_space=50` 生成点，再乘原始 `srcimg` 的宽高；绿色区域由 `fillConvexPoly` 后处理生成 | 源码直接证明输出不是像素坐标/绿色 mask；没有断言曲线宽度为 8、没有防 `y-p[3]==0` |
| 集成版 `main.cpp:208-240` | 接收图片文件夹参数，按 `filefolderpath + to_string(i) + ".jpg"`读取；每张图先 resize 到 `360×204`，调用 LIME，再调用 `mynet.detect`，写到 `../result/<i>.jpg` | 源码证明该 LSTR 批处理入口的边；不证明 Qt 摄像头或 QProcess 已调用它 |
| `Unet_NCNN/src/unet.cpp:13-25,34-64` | 输入宏为 `720×720`；从 `argv[1]`读图；加载 `../models/model.ncnn.param` 和 `../models/model.ncnn.bin`；先按比例 padding，再 `INTER_CUBIC` resize 到 720×720，并用 `convertTo(CV_32FC3,1/255.0)` | 源码直接证明 NCNN 示例的图像/模型路径和预处理 |
| `Unet_NCNN/src/unet.cpp:66-88` | 通过三重循环把 HWC 地址 `i*W*3+j*3+k` 重排到 CHW 地址 `k*H*W+i*W+j`；构造 `ncnn::Mat`，调用 `ex.input("in0", in)`、`ex.extract("out0", mask)` | 源码直接证明布局、输入/输出 blob 名称和 host 缓冲区；不证明模型文件的真实 blob shape/dtype |
| `Unet_NCNN/src/unet.cpp:90-140` | 按 `mask.h/w/c`逐像素 argmax，去 padding，`cv_img*=255`后把非零区域设为绿色，写出 `result.jpg` | 源码直接证明后处理和结果文件表达式；文档写 `c=2`需用模型元数据或运行时确认 |
| `lime_opt.cpp:575-617` | `enhance()` 内部归一化到 `CV_32F`、求光照图、通道除以 `T`、threshold、merge，再转回 `CV_8U`×255；它返回图像，不构造 LSTR/NCNN tensor | 源码直接证明 LIME 是图像变换边，不是模型输入契约本身 |

### 当前仓库模型的静态图元数据

对仓库内两份同名模型做离线 graph 读取（2026-08-14）；两份文件大小均为 `3,074,878` bytes，SHA-256 相同：`a36f5368c53ff01e7e8f3bdcdac4934a8cb96d20d8f0d47a3830c3e53be6cdae`。这只证明该模型文件的静态元数据，不证明目标 ARM 上 `Run()` 成功。

| 方向 | 名称 | dtype | shape | 结论 |
|---|---|---|---|---|
| 输入 | `input_rgb` | float | `[1,3,360,640]` | 与当前 LSTR 代码的 image tensor 形状相符；名称中的 RGB 仍不能证明源码已完成 BGR→RGB |
| 输入 | `input_mask` | float | `[1,1,360,640]` | 与当前全零 mask tensor 形状相符 |
| 输出 | `pred_logits` | float | `[1,7,2]` | 代码把第 0 个输出按 logits 使用，并忽略 batch=1 |
| 输出 | `pred_curves` | float | `[1,7,8]` | 代码把第 1 个输出按曲线参数使用，并固定读取 8 个参数 |
| 输出 | `foo_out_1` | float | `[1,7,2]` | 当前代码请求但不解释的第三个及后续输出之一 |
| 输出 | `foo_out_2` | float | `[1,7,8]` | 当前代码请求但不解释的第三个及后续输出之一 |
| 输出 | `weights` | float | `[1,240,240]` | 当前代码请求但不解释的第五个输出 |

因此，对这一个精确 hash 的模型可以把“静态输入数量/shape 与代码假设相符”标为 **G/S**；不能把它推广到另一份同名模型、另一种导出版本或运行时实际加载文件。代码仍按输出枚举顺序绑定，不按输入名称显式查找；颜色顺序、实际 `cwd`、`imread`/`fread` 成功和目标运行结果仍是 **U**。

### 证据标记

在审计表中给每条结论加一类标签：

- **S（Source）**：给定源码中的具体语句直接可见。
- **D（Document）**：部署/系统文档的设计描述或流程图；尚未被给定源码完全闭合。
- **M（Mapped）**：由 S 逐步推导出的布局、元素数或调用边，写明推导过程。
- **U（Unverified）**：需要实际 ONNX/NCNN 模型、运行日志、工作目录或图像结果才能确认。

## I — 方法论解释（Interpretation）

把 tensor contract 当作一个有生产者和消费者的接口，而不是只抄一个 shape。每个模型分支至少记录以下字段：

`输入来源/进程 → 输入数量与绑定 → shape/rank → host dtype/模型 dtype → channel order → layout → resize/padding → normalize → mask/辅助输入 → 推理 API → 输出数量与 shape/rank → 解码 → 结果路径/显示消费者`。

审计时遵守四条推理规则：

1. **调用数量不等于模型元数据。** `Run(..., 2, ...)` 说明该调用传了两个 `Ort::Value`；只有读取 ONNX graph 或打印 `GetInputCount()` 的实际值，才能说模型确实有两个输入。当前构造函数查询了 count，但没有对 count 做断言。
2. **代码索引比文档简写更精确。** 当前 LSTR 代码用 `output_node_dims[0][1]`、`[0][2]` 和 `output_node_dims[1][2]`，所以报告应先写“代码按 rank-3 索引访问”，再把 `[N,2]`/`[N,8]`作为文档语义或去掉 batch 维后的解释，不能反向替源码证明真实 rank。
3. **布局、颜色顺序、数值归一化是三个独立问题。** HWC→CHW 不代表 BGR→RGB；`pix/255` 不代表已经使用正确的训练均值/标准差；必须分别找 `cvtColor`、索引公式和 mean/std。
4. **路径是进程工作目录下的运行时表达式。** `../lstr_360x640.onnx`、`../log_space.bin`、`../models/model.ncnn.*`、`../result/*.jpg`和 `output.png`都不能仅凭源文件所在目录判断可访问性。报告写表达式、调用方给出的 cwd/`cd`（若有）和“未运行”状态。

主链真实性采用“边存在才算接通”的原则：只有在源码中找到调用、参数传递、进程启动或结果读取的明确边，才把两个节点连成实现主链。系统文档的“摄像头→LIME→Unet/LSTR→Qt”是 **D**；集成 LSTR `main.cpp` 内的“文件夹→LIME→LSTR→../result”是 **S**；独立 `LSTR_ONNX/main.cpp` 的硬编码图片演示和独立 `Unet_NCNN/src/unet.cpp` 的单图示例不能自动变成 Qt 摄像头主线。

## A1 — 资料中的应用（Past Application）

### 案例 1：LSTR 双输入与输出解码

从 `LSTR_ONNX/main.cpp` 逐语句建立契约：构造函数拿第一输入的空间维度；`detect()`创建 `[1,3,H,W]` 图像张量与 `[1,1,H,W]` 全零 mask 张量，并以 `float` host buffer 调用 `Run`，count 为 2。输出按 `ort_outputs[0/1]`取 logits/curves；代码按第三维读取候选数/类别或曲线宽度，argmax 后使用 50 个 `log_space` 样本和 8 参数公式恢复像素点。这个案例同时要求标记未验证项：实际节点数量、名字、模型声明 dtype、真实输出 rank/维度、文件是否可读和推理是否成功。

### 案例 2：独立 LSTR、集成 LSTR 与 NCNN/Unet 的边界

集成版 LSTR 源码接收图片目录，固定把每帧先变为 `360×204`，调用 LIME 后再进入 `detect()`，结果写 `../result/<i>.jpg`。独立 ONNX 示例却读取 `../images/0.jpg`并写 `output.png`；Unet 示例读取命令行单图，执行 padding、720×720、HWC→CHW、`in0/out0`推理和本地 `result.jpg`。因此可以报告“存在一个带 LIME 的 LSTR 批处理入口和一个独立 Unet NCNN 入口”，但不能报告“两个分支已经由同一个 dispatcher/Qt 按钮接通”，除非继续找到进程启动/调用源码或运行日志。

### 案例 3：文档描述与源码事实的分层

4.1/4.3文档将 LSTR 概括为双输入、`[N,2]` logits、`[N,8]` curves，1.5文档画出 Qt 摄像头和两模型分支，4.5文档概括 NCNN 的 720×720 和 argmax。审计报告应把这些作为 D，再回链到源码的 `input_shape_`、`mask_shape_`、输出维度索引、`copyMakeBorder`和重排循环；若源码没有对应检查，就把结论降为“代码假设/待验证”，而不是修正文档或补写运行成功。

### 案例 4：精确模型元数据与任意模型的边界

对当前同哈希 `lstr_360x640.onnx`，离线 graph 元数据闭合了输入数量、输入 shape、前两个输出 shape 和总输出数量；代码与其 image/mask shape 相符，但只解释前两个输出。这个闭合不能外推到任意替换模型，也不能解决 BGR/RGB 训练语义、实际工作目录、文件读取失败和 ARM 运行时问题。

## A2 — 未来触发场景（Future Trigger）

在以下请求中调用本 Skill：

1. 用户要审计 LSTR/ONNX 或 Unet/NCNN 的输入数量、输入节点绑定、shape、rank、dtype、颜色顺序、HWC→CHW、resize、padding、normalize、mask 或 `log_space`。
2. 用户要核对 logits/curves、mask、argmax、曲线采样/像素映射、输出文件路径，或问“模型/图片/结果路径是否真的连上”。
3. 用户要判断 LSTR 与 Unet 两条分支是否真的接入同一个 Qt/摄像头/文件主链，或要分离文档架构图、独立示例与可证明调用边。
4. 用户提供源码但没有模型文件/运行日志，要求说明哪些能静态确认、哪些不能声称运行成功。

典型信号包括：“Run 传了几个输入？”、“mask_shape_ 对不对？”、“为什么文档说 RGB 但代码没转色？”、“输出到底是 `[N,2]` 还是三维？”、“Unet 和 LSTR 是不是同一主线？”、“相对路径相对谁？”、“只看源码能证明模型能加载吗？”

明确排除两类相邻任务：只做摄像头到 Qt 的全局性能、NEON/OpenMP、缓存、量化或端到端帧率排障时转 `linux-vision-pipeline-and-optimization`；只做 30 秒/1 分钟项目介绍、面试追问或个人贡献叙事时转 `linux-vision-project-storytelling`。本 Skill 可以指出 tensor/路径/接线证据，但不展开性能优化教程或面试话术。

## E — 可执行步骤（Execution）

按下面顺序输出审计，不跳过“证据不足”标记；所有原始笔记和源码只读，审计产物写入用户指定的派生目录。

### 1. 固定审计范围与证据等级

记录目标 executable、源码提交/文件时间（若可得）、模型文件是否提供、实际工作目录是否提供、是否有运行日志/结果图。只读取本 Skill `source_files`和用户额外明确授权的元数据；不要修改原始 Markdown、C++、模型或结果文件。建立 claim ledger：`claim | S/D/M/U | path:line | why | unresolved`。

### 2. 画出按 executable 分开的数据流

至少分三张小图或三行表，不先画成一条总链：

- **LSTR 独立 ONNX**：`../images/0.jpg → imread → detect(resize/normalize) → 2 Ort::Value → Run → logits/curves → 50 点/可视化 → output.png`。
- **集成 LSTR 批处理**：`argv[1] 文件夹 → imread(i.jpg) → resize(360,204) → LIME::enhance → LSTR::detect → ../result/i.jpg`。
- **Unet NCNN**：`argv[1] 单图 → padding → resize(720,720) → float [0,1] HWC → CHW buffer → in0 → out0 mask → argmax/去 padding/绿色叠加 → result.jpg`。

每条边都填 `producer/consumer、调用符号、传递对象、路径表达式、证据等级`。没有调用点就写“未证明”，不要用同目录结构补边。

### 3. 抽取输入数量、绑定、shape、rank 与 dtype

对 ONNX：

1. 找 `GetInputCount()`、`GetInputNameAllocated()`、`GetInputTypeInfo()`、`GetShape()`，记录代码是否只收集还是有 assert/检查。
2. 找每个 `CreateTensor<T>` 的 T、buffer 元素数、shape 数组和 `Run` 的 input count。把 `input_shape_`与`mask_shape_`的元素数核算为 `1×3×H×W`和`1×1×H×W`。
3. 分开写“主机 buffer 是 float”和“模型 graph 声明 dtype 是什么”。后者只有 ONNX 元数据/运行时 `GetElementType()`输出才可确认；当前源码没有读取 element type。
4. 核对输入节点顺序与 `input_names`是否显式绑定到 image/mask。若只按节点枚举顺序 push，记录这是顺序假设，不声称名字语义。

对 NCNN：记录 `ex.input("in0", in)`、`ex.extract("out0", mask)`、输入 buffer 类型/布局和模型加载结果。`INPUT_WIDTH/HEIGHT=720`是当前源码常量，不要用它反推任意 `.param`都接受相同 shape。

### 4. 逐项审计图像预处理与布局

按实际顺序写一条变换链，不把“归一化”合并成一个词：

- 原始图像类型、通道顺序和是否 `cvtColor`。
- padding 的方向、填充值、缩放后的边界坐标，以及是否在输出后去 padding。
- resize 目标尺寸和插值方法。
- 数值类型转换、缩放因子、mean/std 或其它 normalize。
- 源布局地址公式和目标布局地址公式；验证 buffer 元素数等于 shape 体积。
- 进入框架 API 时的 blob 名称/对象所有权。

特别核对：LSTR 的 `img.ptr<uchar>(i)[j*3+c]`说明它直接按 OpenCV 三通道内存读，给定代码没有 BGR→RGB转换；Unet 的三重循环明确进行 HWC→CHW；LIME `enhance()`返回的是 `CV_8U`图像，后续 LSTR 仍会再次 resize/normalize。若文档使用 RGB 字样，报告“文档语义 vs 源码通道事实”，不要擅自改代码。

### 5. 抽取输出 shape 与解码假设

对 LSTR：

1. 记录输出数量读取方式、`ort_outputs`索引、每个 `output_node_dims`访问的下标和指针类型。
2. 用代码实际索引写出契约：`pred_logits`按 `dims[1]`个候选、`dims[2]`个类别访问；`pred_curves`按 `dims[1]`/候选行、`dims[2]`为行宽访问。只有元数据确认后，才展开为具体 `[1,N,2]`、`[1,N,8]`或其它 shape。
3. 复核 `max_id==1`筛选、`p[0]..p[7]`、`y=p0+log_space[k](p1-p0)`、x 有理函数、50 个点、原图宽高映射和 `fillConvexPoly`。
4. 列出未检查项：输出数量/空 tensor、rank、curves width≥8、`log_space`读取长度、分母为零、坐标越界、左右车道索引为空。它们是当前实现的边界，不要把“代码能编译”当作“输出契约已验证”。

对 Unet：记录 `mask.w/h/c`的实际来源、逐像素 argmax、去 padding、类别标签到 `cv_img`的转换、绿色叠加和 `result.jpg`。文档中的“c=2”只能在 `.param`/运行时输出元数据可得时升格为已确认事实。

### 6. 审计模型、图片、结果路径和工作目录

把所有路径原样列出并标注 `relative-to-process-cwd`：

| 分支 | 模型/辅助文件 | 输入图片 | 输出结果 |
|---|---|---|---|
| LSTR 独立 | `../lstr_360x640.onnx`；`../log_space.bin` | `../images/0.jpg` | `output.png` |
| 集成 LSTR | 同上 | `argv[1] + i + ".jpg"` | `../result/i.jpg` |
| Unet NCNN | `../models/model.ncnn.param`；`../models/model.ncnn.bin` | `argv[1]` | `result.jpg` |
| LIME 独立示例 | 无模型 | `../data/38.jpg` | `output.jpg` |

若找不到启动命令、`cd`、`argv`实际值或文件存在性检查，标记 U。不要根据源文件目录、Obsidian 链接或文档目录树猜 cwd；不要运行模型来“补齐”用户没有授权的真实环境结论。

### 7. 判定 ONNX/LSTR 与 NCNN/Unet 是否共用主链

使用三态判定：

- **已接通（S）**：源码有明确调用/进程启动/结果读取边，且输入输出对象和路径可对上。
- **部分接通（S+D）**：一个集成入口（例如 LIME→LSTR）有源码，但另一端只有系统文档或独立示例。
- **未证明/断链候选（U）**：只有架构图、目录或独立 demo，没有共享 dispatcher、Qt 调用、公共输入目录或结果消费者证据。

本组给定源码的保守结论通常应是：集成 LSTR 批处理内部的 LIME→LSTR→result 边可由源码证明；独立 ONNX demo 与 Unet NCNN demo 各自可审计；两条模型分支都出现在系统文档中，但“同一个 Qt/摄像头主线自动接入两者”不能仅凭这些文件等同确认。若要升格结论，继续查找 Qt `QProcess`/dispatcher、构建目标、命令行参数、公共 frames/result 目录和运行日志。

### 8. 输出可复核报告

按以下顺序交付，不写泛化性能结论：

1. 一句话 verdict：已确认的 contract、最关键未验证项、主链判定。
2. 输入 contract 表：source、count/binding、shape/rank、host dtype、layout、颜色、预处理、mask。
3. 输出 contract 表：output index/name（若有）、代码访问的 dims、语义、解码、结果路径。
4. 路径表：表达式、进程 cwd 依赖、文件存在性检查、证据等级。
5. 主链图/边表：每条边的 source line 和 S/D/U 判定。
6. 风险与下一步：只列能由当前证据支持的缺口，例如需要 ONNX graph、NCNN `.param`、实际 cwd、输入输出日志或结果图。

## B — 边界与风险（Boundary）

- 给定源码证明的是静态行为和调用假设，不证明模型文件存在、`fopen`/`imread`成功、推理返回、结果图正确或目标 ARM 运行成功；当前 LSTR 对 `fopen/fread`也没有错误检查。
- 当前精确 SHA-256 模型的离线 graph 元数据可以补强输入/输出静态合同，但不能替代目标环境运行日志；同名或替换模型必须重新读取 graph。
- `Run(..., 2, ...)`是调用方传入的数量，不是对 graph 输入节点数的独立验证；当前代码获取 count/shape，但没有断言数量、名字、元素类型和 shape 与两个本地数组完全相符。
- 文档把输出写成 `[N,2]`与 `[N,8]`便于解释；源码按 `output_node_dims`的第三维访问，必须先报告 rank/维度访问假设，不能凭文档猜具体 N、batch 或 curves width。
- LSTR 源码没有 `cvtColor`；不要把 OpenCV `imread`的 BGR 内存称为已经转换的 RGB。HWC→CHW、BGR→RGB和 mean/std normalize 必须分别举证。
- 相对路径相对进程工作目录，不相对 `.cpp`文件；`../lstr_360x640.onnx`、`../log_space.bin`、NCNN 模型、图片和结果路径按当前源码表达式报告，不假设运行成功。
- LSTR 曲线解码直接使用 8 个参数、50 个 `log_space`样本和原图尺寸；当前代码未证明输出 width=8，也未保护分母为零、空左右车道、坐标越界等条件。绿色区域是 `fillConvexPoly`后处理，不是模型原始输出。
- 集成 LSTR 的文件夹批处理入口、独立 ONNX 图片 demo、Unet NCNN 单图 demo 和系统文档中的 Qt/摄像头架构不是同一证据等级。没有调用点/进程命令/公共路径/日志时，不能声称 ONNX/LSTR 与 NCNN/Unet 共用一条已运行主链。
- `lime_opt.cpp`在本 Skill 中只用于确认图像变换边和接线；不展开 NEON/OpenMP、缓存、量化、帧率或端到端性能排障。此类请求转 `linux-vision-pipeline-and-optimization`；面试表达转 `linux-vision-project-storytelling`。
- 不修改原始 Obsidian 笔记、源码、模型、图片或结果；不把派生报告、文档流程图或独立示例回写成主源事实。

## 相关 Skills

- `linux-vision-pipeline-and-optimization`：全局摄像头到 Qt 流水线、NEON/OpenMP、缓存、量化和性能验证；本 Skill 只提供 tensor/接线事实。
- `linux-vision-project-storytelling`：项目介绍、面试叙事和个人贡献边界；本 Skill 不生成面试话术。
- `interactive-lab-fact-boundary-audit`：交互实验/图表中的来源事实、派生教学数据和测试覆盖边界。
- `linux-memory-source-audit`：源码与文档 claim 的系统化证据审计。
