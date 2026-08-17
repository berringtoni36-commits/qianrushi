---
name: linux-vision-resource-telemetry-contract-audit
description: "审计 Linux 视觉 Qt 上位机 CPU/内存资源遥测从 /proc/stat、free -m 到采样时间、累计值差分、字段与单位、错误状态、QTimer、固定历史窗口和 QtCharts 展示的合同。Use when reviewing this project’s resource monitor, explaining a first-sample spike or stale/zero value, checking free-versus-available parsing, or deciding whether a chart is evidence of resource usage; do not use for generic Qt event-loop/QProcess lifecycle, the camera-to-inference performance pipeline, or build/benchmark provenance."
metadata:
  source_book: Linux 视觉感知项目
  source_files:
    - projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/sysinfolinuximpl.cpp
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/sysinfolinuximpl.h
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/1102demo3.pro
  source_symbols: [sysinfolinuximpl::cpuLoadAverage, sysinfolinuximpl::get_mem_usage__, pre_user, pre_total, QProcess::waitForFinished, MainWindow::timerTimeOut, timer2, maxSize, QSplineSeries::append]
  tags: [linux, vision, qt, telemetry, procfs, sampling, metrics]
  related_skills: [qt-event-loop-signal-slot-audit, linux-vision-pipeline-and-optimization, linux-vision-build-provenance-audit]
---

# Linux 视觉上位机资源遥测合同审计

行号范围保留在正文事实说明中；frontmatter 的 `source_files` 只保存可由审计器解析的真实文件路径。

source_symbols:

- `sysinfolinuximpl::cpuLoadAverage`
- `sysinfolinuximpl::get_mem_usage__`
- `pre_user`, `pre_total`, `cpu_rate`, `mem_rate`
- `QProcess::start`, `QProcess::waitForFinished`, `QProcess::readLine`
- `MainWindow::MainWindow`, `MainWindow::timerTimeOut`, `timer2`, `QTimer::start`
- `receivedData_cpu`, `receivedDate_mem`, `data_cpu`, `data_mem`
- `maxSize`, `maxX`, `maxY`, `QSplineSeries::clear`, `QSplineSeries::append`
- `series_cpu`, `series_mem`, `axisX`, `axisY`, `graphicsView`

## R — 原文与证据分层

本 Skill 只处理候选 2 的窄域：内核累计计数或命令输出如何变成带时间、单位、状态的资源样本，再如何进入 Qt 定时器、滑窗和图表。来源范围遵循第三轮候选扫描的 Luna 最高配置与真实项目来源；`projects/`、`archive/` 只读。

### 文档声称

- `2.4 CPU与内存实时监控.md` 将链路写成 `/proc/stat` 与 `free -m` → `sysinfolinuximpl` → `QTimer(1000ms)` → CPU/内存百分比 → `QSplineSeries`/`QChartView`。
- 文档把 CPU 定义为相邻 `/proc/stat` 累计值的差分：分子是 `user+nice+system` 的增量，分母是所有 CPU 状态的增量，再乘 `100`。
- 文档把内存定义为 `(total-free)/total*100`，称 `free -m` 的单位为 MB，并提醒使用 `free` 而非 `available` 可能使占用率偏高。
- 文档声称每类数据最多保留 51 个点，X 轴为 `0..5000`，按 1 秒刷新解释；清空后逐点追加是当前图表更新方式，直接读 `/proc` 与 `replace()` 是优化方向。

### 源码事实

- `cpuLoadAverage()` 每次临时创建 `QProcess`，启动 `cat /proc/stat`，无参数调用 `waitForFinished()`，只读取一行；将 `lst[1..3]` 相加为 `use`，将 `lst[1..]` 相加为 `total`，在 `total-pre_total>0` 时按差分更新 `cpu_rate` 与两个前值。
- `pre_user`、`pre_total` 初值为 `0`。因此第一次成功解析且总量大于零的调用会拿开机以来的累计值与零作差，它不是天然经过一个完整 1 秒的区间样本；后续才有相邻累计样本差分。采样失败或总量未增长时，CPU 函数保留并返回旧 `cpu_rate`。
- CPU 源码不检查命令退出状态，也不检查每个数值转换的成功标志；它只检查分割后的字段数量。函数名含 `LoadAverage`，但实现是一个 CPU 使用率比例，不是 Linux load average 队列指标。
- `get_mem_usage__()` 启动 `free -m` 并无界等待，丢弃一行后只读取下一行；按固定下标取 `lst[1]` 和 `lst[6]`，计算 `(total-free)/total*100`。没有按表头识别字段、检查退出状态、检查单位或保护 `total==0`。字段不足时返回 `false`，在 `double` 返回值上表现为 `0.0`。
- 常见 `free -m` 的 `Mem:` 行中，`lst[6]` 可能对应 `available` 而非文档所称的 `free`；这是字段语义需要用目标版本原始输出核对的风险，不能仅凭文档或索引命名升格为目标发行版事实。
- `MainWindow` 创建有 parent 的 `timer2`，调用 `timer2->start(1000)`，并把其 `timeout()` 连接到 `timerTimeOut()`。该槽顺序调用 CPU、内存采集，再把两个 `double` 交给 `receivedData_cpu()` 和 `receivedDate_mem()`；源码没有把 timestamp、unit 或 validity 一并传到图表层。
- 图表初始化设置 `maxSize=51`、`maxX=5000`、`maxY=100`，CPU/内存各有一个 `QSplineSeries`，X 点间距为 `maxX/(maxSize-1)=100`。两个更新函数都追加数据、超过 51 点移除头部、`clear()` 后逐点 `append()`。
- `.pro` 的 `QT += core gui multimedia multimediawidgets charts` 证明项目声明使用 Qt Charts；它不证明采样数字正确、定时器实际每秒触发或目标板运行成功。

### 待验证

- 记录目标环境的原始 `/proc/stat` 首行、`free -m` 完整 stdout、命令退出状态、单调时钟时间戳和采样调用耗时，核对字段顺序、`free`/`available` 语义、单位、locale、缺失字段与命令失败路径。
- 规定首样本是只建立 baseline、显示无效状态还是显示零；验证计数器回退/重启/溢出、`total` 不增长、负增量和解析失败时是否重新建立 baseline。
- 测量 `QTimer` 回调实际 start-to-start 间隔、CPU 与内存采样之间的时间差、两个 `waitForFinished()` 对 GUI 响应的影响，以及回调执行超过 1000 ms 时的行为。事件循环与同步等待的完整判定交给 `qt-event-loop-signal-slot-audit`。
- 验证 51 点究竟覆盖多少墙钟时间，`xSpace=100` 是否只是绘图坐标；检查 `QSplineSeries` 的插值展示是否被误读为原始样本或推理吞吐。
- 若要把资源曲线用于视觉性能结论，还需独立的阶段耗时、帧数、推理完成事件和 benchmark provenance；当前资料没有目标发行版实测或真实客户端命中证据。

## I — 审计推理与不变量

把“采集值”“区间指标”“图表点”和“性能结论”分开。每条结论都标为文档声称、源码事实、推导或待验证，不用图表外观替代原始证据。

1. **累计量差分不变量**：`/proc/stat` 的 CPU 数字是随系统运行累加的计数。CPU 使用率必须明确前后样本、`Δuse`、`Δtotal` 和有效时间顺序；首个样本只能建立 baseline，除非另有明确起始值。计数器回退或重置时不能把负差分当正常负载。
2. **分母与语义不变量**：当前代码的分子是 `user+nice+system`，分母是其余状态也在内的总和，输出约定是 `0..100` 百分比。不要把函数名 `cpuLoadAverage`、单核百分比、多核平均、进程 CPU 或 load average 混写。
3. **时间不变量**：`QTimer::start(1000)` 是请求的定时器间隔，不是每个样本的实测间隔。命令启动、同步等待、槽执行、调度延迟都可能改变 start-to-start 时间。CPU 和内存在同一槽内顺序采集，不能默认拥有同一时间戳。
4. **字段与单位不变量**：指标记录必须同时说明原始字段、解析规则、单位和显示比例。CPU 差分比值本身不需要把两个同源计数先换算成秒；若报告绝对 CPU 时间或每秒速率，则必须说明 jiffy/HZ 来源。`free -m` 的 MB 只能在命令输出和环境可核对时成立。
5. **错误状态不变量**：数值与状态分离。至少区分 `valid`、`baseline_only`、`command_error`、`parse_error`、`counter_reset`、`stale` 和 `unsupported`；失败不能静默复用旧 CPU 值，也不能把内存的 `false`/`0.0` 当成真实零占用。当前源码没有这层状态，审计报告必须保留该缺口。
6. **窗口不变量**：51 是样本数量上限，不是时间长度。只有每个样本都有可信时间戳且间隔稳定，才能近似说“约 51 秒”；`xSpace=100` 是 `0..5000` 坐标的派生值，不是实测时间。
7. **展示不变量**：`QSplineSeries` 的曲线是显示消费者，清空重建和样条插值不改变采样合同。原始样本、有效状态、时间戳和单位应可独立审计，不能只凭截图判定实时性、准确性或推理 FPS。
8. **归因不变量**：系统级 CPU/内存遥测只能说明采样时的主机资源状态，不能单独归因给 LIME、ONNX/NCNN、摄像头、QProcess 或某一帧，也不能替代端到端性能基线。

## A1 — 当前视觉项目中的应用

沿源码边建立两条独立证据链，再与图表消费边对齐：

| 链路 | 可确认内容 | 不能直接声称 |
|---|---|---|
| CPU：`timer2` → `timerTimeOut()` → `cpuLoadAverage()` → `cat /proc/stat` → 差分 → `data_cpu`/`series_cpu` | 有 1000 ms 定时器配置；源码按 `lst[1..3]` 与全部字段差分，并保存 `pre_user/pre_total` | 首点是 1 秒利用率、字段解析始终成功、值代表某个推理阶段或进程 |
| 内存：`timerTimeOut()` → `get_mem_usage__()` → `free -m` → `[1]/[6]` → `data_mem`/`series_mem` | 有命令采集和 `(total-free)/total*100` 计算；输出进入 0..100 图表 | `[6]` 在目标系统就是 `free`、单位/locale 已校验、失败的 0 是真实占用 |
| 展示：`receivedData_*()` → `QList<double>` → `clear()`/`append()` → `QChartView` | 每条曲线最多保留 51 个 `double`，使用固定绘图坐标与 Qt Charts | 51 点必然代表 51 秒、曲线点等于原始采样时刻、样条曲线等于 FPS |

项目级审计应先输出“文档声称—源码事实—待验证”三栏。静态 verdict 可以说“遥测链路的调用和图表窗口可回链”，但必须同时标出首样本、字段标签、错误状态和实测时间缺口。

## A2 — 未来触发场景

在以下请求中激活本 Skill：

1. “CPU 曲线第一点特别高/一直不变，`/proc/stat` 到底怎么算？”——检查累计计数、baseline、分子/分母和回退行为。
2. “内存占用和 `free`/`top` 对不上，`free -m` 的第几列是什么？”——核对原始 stdout、表头、字段标签、单位与 `available` 选择。
3. “QTimer 设 1 秒、最多 51 点，能说是 51 秒实时曲线吗？”——区分标称周期、实测间隔、样本窗口和 X 轴坐标。
4. “采集命令失败、解析失败或首个样本没有前值时，UI 应该显示什么？”——审计 baseline、validity、错误原因、timestamp/unit 以及图表是否吞掉状态。
5. “能不能用这张 CPU/内存图证明 LIME/模型优化有效或推理 FPS 提升？”——建立资源遥测与视觉 benchmark/provenance 的边界。

如果请求主要是 `QProcess` 的 finished/error/取消、信号连接、GUI 线程阻塞或 QObject 生命周期，转交 `qt-event-loop-signal-slot-audit`；如果主要是摄像头→LIME→模型→显示的端到端优化，转交 `linux-vision-pipeline-and-optimization`。

## E — 可执行审计流程

### 1. 固定范围与证据账本

记录目标文件、可执行程序、源码版本、文档版本、是否有原始命令输出、运行日志、单调时间戳和图表数据。建立 `claim | 类型 | path:line | 推导 | 未闭合项` 账本。只有源码/文档/用户提供的运行材料才能升格结论；没有目标环境材料时只给静态分析。

### 2. 画采样到展示的数据流

分别画两条，不要把 CPU、内存、推理和图表混成一条性能链：

```text
timer2.timeout
  └─ MainWindow::timerTimeOut
      ├─ cpuLoadAverage → QProcess(cat /proc/stat) → first line → Δuse/Δtotal → data_cpu → series_cpu
      └─ get_mem_usage__ → QProcess(free -m) → second line → fields/unit → data_mem → series_mem
```

每条边记录 producer、consumer、调用点、返回类型、是否携带时间戳/单位/状态以及失败后的去向。`QChartView` 只作为最终显示消费者，不把它当作数据源或性能测量器。

### 3. 审计 CPU 原始计数与差分

1. 保存每次 `/proc/stat` 原始首行和单调时间；核对第一 token 是否为 `cpu`、字段是否足够、字段顺序是否与代码索引一致。
2. 明写 `use = user+nice+system`、`total = Σ所有状态`、`Δuse`、`Δtotal` 和输出范围；不要把 `iowait`、`idle` 等状态从分母中悄然删掉。
3. 检查 baseline 建立时机：首个有效样本应为 `baseline_only`，后续才允许 `valid`；检查重启、回退、总量不增长和转换失败的策略。
4. 说明 jiffy/HZ 只在需要绝对时间或速率时才进入公式；同一 `/proc/stat` 计数的差分比值不因未换算成秒而失去比例语义。
5. 将源码中的旧值复用和无转换状态记录为缺口，而非把旧值写成“CPU 没变化”。

### 4. 审计内存字段、单位与公式

1. 采集完整 `free -m` stdout、stderr、退出码和时间；按表头定位 `total/free/available`，不要只确认 `lst.size()>6`。
2. 将代码的 `[1]`、`[6]` 与原始 `Mem:` 行逐项对齐；若采用 `available`，明确这是语义选择，不要继续称为 `free`。
3. 检查 `total > 0`、每个字段的转换成功标志、单位是否确为 MB、locale/缺失列是否可处理；明确百分比是 `0..100` 还是 `0..1`。
4. 分别记录 `command_error`、`parse_error`、`zero_total`、`unsupported_layout`；禁止用双精度 `0.0` 让 UI 看不出失败。

### 5. 审计采样时序与 Qt 消费

1. 对每个样本记录 `sample_start_mono`、`sample_end_mono`、CPU/内存各自采集时间、命令等待耗时、回调序号和状态；用实测 start-to-start 判断周期，不用 `start(1000)` 或 X 轴标题替代。
2. 检查 CPU 与内存是否应共享一个采样批次时间，或应分别带时间；当前源码是顺序调用且只有 `double`，不能假定同时刻。
3. 检查 51 点窗口、淘汰策略、X 坐标、缺失点处理和图表重绘；将“样本数”“墙钟跨度”“可视化插值”分栏记录。
4. 记录同步 `waitForFinished()` 作为 GUI 影响的交叉风险；完整的事件循环、连接和线程审计交接给兄弟 Skill，不在本 Skill 内重复扩展。

### 6. 输出结论与最小验证计划

按以下顺序交付：

1. 一句话 verdict：已确认的调用/公式/窗口，以及最关键的未验证项。
2. CPU contract 表：原始字段、baseline、差分、分母、单位/比例、错误状态。
3. 内存 contract 表：命令输出、表头映射、`free`/`available`、单位、零值和失败状态。
4. 时序与窗口表：标称定时器、实测时间戳、51 点上限、X 轴坐标、图表消费者。
5. 文档声称/源码事实/待验证三栏；每条附文件与行号。
6. 最小验证：原始输出+单调时间日志、首样本/失败/字段变化测试、空闲与视觉负载的独立对照；不要以一次截图、一次数字或一次客户端对话代替验证。

## B — 边界、风险与交接

- `qt-event-loop-signal-slot-audit` 负责 `QTimer`/`waitForFinished()` 造成的事件循环阻塞、QProcess 状态与信号、连接类型、线程和 QObject 生命周期。本 Skill 只记录这些因素如何影响遥测样本时序，并把完整 GUI 行为交接过去。
- `linux-vision-pipeline-and-optimization` 负责摄像头→LIME→ONNX/NCNN→显示、NEON/OpenMP、缓存、量化、端到端 FPS 和优化回归。本 Skill 不测阶段耗时，不评价优化收益；资源曲线只能作为待校准的上下文。
- `linux-vision-build-provenance-audit` 负责 source→target→AXF/HEX/MAP→烧录/日志→性能数字的可复现 provenance。本 Skill 负责运行中监控器如何生成 CPU/内存数，不证明 benchmark 来自同一构建或目标板。
- 不把当前文档的公式、`free -m` 的常见输出、51 点窗口或“1 秒刷新”写成目标发行版实测；不把静态调用链写成真实客户端已经命中；不把源码存在写成运行成功。
- 不把系统级 CPU/内存值当成进程级或模型级指标，不把内存解析的 `false`/`0.0`、CPU 的旧值复用当成有效样本，不把样条曲线当原始时间序列。
- 只读原始 projects/archive 和来源文件；审计报告、修复建议和测试记录写入用户指定的派生 Skill 目录，不修改项目源码、模型、图片、全局索引、候选、审计或其他 Skill。

## 相关 Skill 边界

本 Skill 与上述三个兄弟 Skill 的交界仅用于路由：资源指标的字段/单位/差分/状态/窗口留在这里；GUI 事件调度留给 `qt-event-loop-signal-slot-audit`；视觉流水线与优化留给 `linux-vision-pipeline-and-optimization`；构建和 benchmark 证据链留给 `linux-vision-build-provenance-audit`。涉及模型 tensor、文件帧协议或项目面试表达时，继续使用各自专门 Skill，不在这里扩展主题。
