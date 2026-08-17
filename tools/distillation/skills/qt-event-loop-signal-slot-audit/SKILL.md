---
name: qt-event-loop-signal-slot-audit
description: "Use when auditing a Qt GUI in the ARM Linux vision project for event-loop blocking, synchronous waitKey or long polling, QProcess finished/error/readyRead/timeout/cancellation/repeated-start behavior, connectSlotsByName versus manual connect duplication, QObject ownership, thread affinity, or queued/direct signal-slot semantics. Keep linux-vision-file-ipc-lifecycle-audit for the cross-process file/result contract and linux-vision-project-storytelling for interview/project expression."
metadata:
  source_files:
    - projects/linux视觉感知项目/文档/02 Qt 上位机/2.2 信号槽机制与交互.md
    - projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md
    - projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/ui_mainwindow.h
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/main.cpp
  source_symbols:
    - MainWindow::MainWindow
    - MainWindow::~MainWindow
    - MainWindow::yolop_process
    - MainWindow::on_Select_triggered
    - MainWindow::readBashStandardOutputInfo
    - MainWindow::readFrame
    - MainWindow::timerTimeOut
    - MainWindow::InitChart
    - process2
    - process3
    - QProcess::start
    - QProcess::waitForStarted
    - QProcess::write
    - QProcess::readyReadStandardOutput
    - QProcess::readyReadStandardError
    - QProcess::finished
    - QProcess::errorOccurred/error
    - QTimer::start
    - QTimer::stop
    - waitKey
    - connect
    - disconnect
    - QMetaObject::connectSlotsByName
    - QApplication::exec
  related_skills:
    - linux-vision-file-ipc-lifecycle-audit
    - linux-vision-pipeline-and-optimization
    - linux-process-signal-daemon-lifecycle
    - linux-vision-project-storytelling
---

# Qt 事件循环、槽函数与信号槽连接生命周期审计

## 适用范围

审计“一个 Qt GUI 事件从哪里来、何时被调度、在哪个线程执行、何时结束以及对象是否仍然有效”。重点覆盖：

- UI 槽函数中的 `waitKey()`、`waitFor*()`、长 `for/while` 轮询和同步 I/O 是否阻塞 GUI 事件循环。
- `QProcess` 的启动、`readyReadStandardOutput/StandardError`、`finished`、错误、超时、取消、重复启动和析构收尾。
- `connectSlotsByName()` 与手动 `connect()` 是否连接了同一个 sender、同一个 signal 和同一个 receiver；不要仅凭 `on_<object>_<signal>()` 槽名断言重复。
- QObject parent/owner、创建线程、`moveToThread()`、连接类型，以及 queued/direct 回调执行时的线程和事件循环条件。

不要把“能启动子进程”写成“异步完成合同”，也不要把“有 `readyRead`”写成“已收到完整结果”。

## 来源证据

source_files:
  - projects/linux视觉感知项目/文档/02 Qt 上位机/2.2 信号槽机制与交互.md
  - projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md
  - projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/ui_mainwindow.h
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/main.cpp

source_symbols:
  - MainWindow::MainWindow
  - MainWindow::~MainWindow
  - MainWindow::yolop_process
  - MainWindow::on_Select_triggered
  - MainWindow::readBashStandardOutputInfo
  - MainWindow::readFrame
  - MainWindow::timerTimeOut
  - MainWindow::InitChart
  - process2
  - process3
  - QProcess::start
  - QProcess::waitForStarted
  - QProcess::write
  - QProcess::readyReadStandardOutput
  - QProcess::readyReadStandardError
  - QProcess::finished
  - QProcess::errorOccurred/error
  - QTimer::start
  - QTimer::stop
  - waitKey
  - connect
  - disconnect
  - QMetaObject::connectSlotsByName
  - QApplication::exec

## R — 原文与事实边界

### 文档建议

- `2.2 信号槽机制与交互.md:179-183` 将 `yolop_process()` 的 `waitKey(10000)` 描述为粗糙的阻塞等待，并建议用 `QProcess::finished()` 或文件监控替代；`2.2:316-319` 还把主线程阻塞、双重绑定和结果轮询列为改进点。
- `2.3 QProcess 进程管理.md:16-20` 说明把耗时推理交给独立进程的设计目标；`2.3:269-279` 建议补齐异步完成、进程终止和更高效的结果监控。
- `2.4 CPU与内存实时监控.md:232-254` 描述 `timer2` 每秒触发监控；文档中的 `waitForFinished()` 是系统监控短调用的同步模式，不能当作视觉推理任务完成证据。

### 源码事实

- `mainwindow.cpp:13` 调用 `ui->setupUi(this)`；`ui_mainwindow.h:172` 随后调用 `QMetaObject::connectSlotsByName(MainWindow)`。
- `mainwindow.cpp:23-34` 创建两个有 `this` parent 的 `QTimer`，但 `process2`/`process3` 用无 parent 的 `new QProcess`；两者在构造函数中启动 `bash` 并调用阻塞式 `waitForStarted()`。
- `mainwindow.cpp:40-52` 只看到手动连接：摄像头/监控定时器、按钮以及 `process2` 的 `readyReadStandardOutput()`；在指定源码中没有看到 `finished`、`errorOccurred/error`、`readyReadStandardError`、过程超时或取消连接。
- `mainwindow.cpp:104-106` 在视频槽中向 `process3` 写入 ffmpeg 命令后调用 `waitKey(2000)`；`mainwindow.cpp:124-139` 在 `yolop_process()` 中向 `process2` 写入 LSTR 命令，然后 `waitKey(10000)`，再以 `imread()` 和 `waitKey(100)` 同步轮询结果。
- `mainwindow.cpp:144-149` 的输出槽只调用 `readAllStandardOutput()` 并追加到文本框，没有源码证据表明它按行、按消息或按任务 ID 组装 stdout。
- `mainwindow.cpp:59-62` 的析构函数只写 `delete ui`；源码没有展示对无 parent 的 `process2`/`process3` 调用 `terminate()`、`kill()`、有界等待或显式 `delete`。这是生命周期缺口的源码事实，不等于已经证明所有运行路径都会泄漏或子进程必然存活。
- `mainwindow.cpp:282-287` 对图例 marker 先 `disconnect` 再 `connect`，这是当前源码中明确的去重模式；它不能替代对按钮、QProcess 和定时器连接的逐项盘点。
- `ui_mainwindow.h:35,68-71` 将 `Open`/`Stop` 生成为 `QAction`；而 `mainwindow.cpp:42-44` 用旧式 `SIGNAL(clicked())` 手动连接到 `on_Open_triggered()`/`on_Stop_triggered()`。因此文档 `2.2:84-88` 所称“自动绑定与手动连接造成同一信号双重绑定”必须标为待核对：要比较实际 objectName、实际 signal 元签名和运行时连接结果，不能把 QAction 的 `triggered` 与 `clicked` 混为一谈。
- `main.cpp:4-10` 在创建 `QApplication` 后构造 `MainWindow`、显示窗口并进入 `a.exec()`；指定项目源码没有 `QThread`、`moveToThread()` 或显式 `Qt::QueuedConnection/Qt::DirectConnection` 的证据。

### 待核对

- `readyReadStandardOutput()` 的每次通知只代表当前有可读字节，不自动代表一行、一个结果文件或一个任务已经完成；是否存在部分输出、stderr、退出码和错误原因要用日志/运行时观测确认。
- `QProcess::finished()` 若被补接到当前 `process2`，它首先描述的是 `bash` 这个 QProcess 对象的退出；当前源码把 LSTR 命令写入长驻 bash，因此“LSTR 单次命令结束”与“bash QProcess finished”不能未经验证地等同。
- 当前源码没有 `QThread` 或显式连接类型；应记录 sender/receiver 的 `thread()`、连接建立时的线程和信号发出时的线程。不要仅凭“QProcess 是异步”推断槽函数在后台线程执行。
- `connectSlotsByName` 是否与某个手动连接重复，必须在目标 Qt 版本的 meta-object 上核对。至少比较 sender 的 objectName、真实 signal 名称/参数、receiver 槽签名和连接建立次数；必要时用 `QMetaObject`、运行日志或最小复现确认。
- 超时、取消和重复点击后的实际状态、子进程组行为、`terminate()` 是否足够、`kill()` 的有界等待以及 UI 关闭时的收尾，均需目标板/目标 Qt 版本实测；指定源码没有这些闭环证据。

## I — 审计推理与不变量

把每条交互链写成以下不变量，而不是只看某个 API 名称：

1. GUI 事件循环不变量：进入耗时槽后，必须能说明谁让出 GUI 线程、谁报告完成、谁处理超时/取消；固定 `waitKey`、`sleep`、`waitForFinished` 或无上界轮询都先标为阻塞风险。
2. 完成不变量：启动成功、收到 stdout、子进程退出、结果文件完整、结果已显示是五个不同事件。`readyRead*` 只覆盖“有字节可读”，`finished` 只覆盖对应 QProcess 的进程结束，不能互相替代。
3. 连接唯一性不变量：对每条连接记录 `(sender objectName, signal signature, receiver, slot signature, connection type, creation site, teardown site)`；只有六元组相同且建立多次，才判为重复绑定。`on_` 前缀、手动 `connect` 的存在或 `setupUi` 的存在本身都不是证据。
4. 对象生命周期不变量：回调执行前 sender、receiver、关联上下文和 UI 控件必须仍有效；parent-child 只覆盖传入 parent 的 QObject。无 parent 的 QProcess 要单独记录 owner、销毁点和子进程收尾。
5. 线程语义不变量：`DirectConnection` 在发信线程立即执行；`QueuedConnection` 把调用投递到 receiver 所在线程的事件循环；未指定类型的 `AutoConnection` 要按信号发出时的线程关系判定。跨线程 direct 更新 QWidget 是高风险；queued 若目标线程没有运行事件循环则会延迟或无法按预期执行。以上是通用 Qt 审计规则，不是当前项目已经采用的事实。
6. 任务代际不变量：每次推理/ffmpeg 运行分配唯一 run ID；完成、错误、超时、取消和迟到的 stdout/文件事件都必须带上或能映射到该 ID。重复启动不得让旧回调更新新任务的 UI。

## A1 — 当前视觉项目中的应用

按下列事实链审计本项目时，优先输出“资料主张—源码事实—待核对”三栏：

| 链路 | 当前源码应确认的点 | 初步结论边界 |
|---|---|---|
| 摄像头/视频按钮 | `mainwindow.cpp:40-48,65-120` 的按钮连接、`timer->start/stop`、`process3->write`、`waitKey(2000)` | 可确认同步等待存在；不能据此证明 ffmpeg 已结束或播放器输入已完成 |
| LSTR 推理按钮 | `mainwindow.cpp:48,124-149` 的 `write`、`waitKey(10000)`、`imread` 轮询和 stdout 槽 | 可确认 GUI 槽中有长同步等待和无取消轮询；不能把 stdout 回调当作结果完成回调 |
| 监控定时器 | `mainwindow.cpp:25,36,52,291-297` 与 `2.4:232-254` | `timer2` 的 `timeout` 是监控刷新，不是 QProcess 推理 timeout；文档中的同步监控命令要和 GUI 响应性分别审计 |
| 自动/手动连接 | `ui_mainwindow.h:62-73,172`、`mainwindow.cpp:40-52`、`2.2:78-88` | 文档的双重绑定说法与 QAction/`clicked()` 源码存在信号名冲突，结论必须降级为待核对 |
| 退出与对象归属 | `mainwindow.h:70-88`、`mainwindow.cpp:23-34,59-62` | QTimer 有 parent；QProcess 无 parent 且析构未展示收尾，必须补 owner/terminate/等待/kill 证据 |

## A2 — 未来触发场景

当用户出现以下表达时触发本 Skill：

1. “点车道线识别后窗口卡死/按钮没有响应，`waitKey` 或轮询怎么改？”——检查调用栈、GUI 线程、完成事件和可取消状态。
2. “QProcess 有输出但没有 finished/error，超时后还在更新 UI，重复点击会启动多份任务。”——建立 QProcess 状态表、信号覆盖表、run ID 和取消收尾。
3. “`connectSlotsByName` 后槽执行两次，或者 queued/direct 跨线程行为不对。”——核对 objectName、真实 signal、连接类型、线程归属和连接建立/销毁次数。
4. “关闭窗口时 QProcess/定时器/槽回调偶发崩溃。”——追踪 parent、owner、上下文连接、线程事件循环和退出时序。

## E — 可执行审计流程

### 1. 建立事件时序与阻塞清单

先从入口槽画出：用户事件 → 槽 → QProcess/定时器/文件观察 → 完成/错误 → UI 更新 → 取消/析构。逐行搜索 `waitKey`、`waitFor`、`sleep`、无上界 `for/while`、同步文件/网络 I/O；记录调用线程、最大等待时间、是否仍能处理 Qt 事件、退出条件和取消入口。

### 2. 盘点 signal-slot 连接

对每个 `connect` 和自动连接候选建立表格：

| 字段 | 必答问题 |
|---|---|
| sender/signal | objectName 是什么？真实 signal 签名和参数是什么？是否是 QAction 的 `triggered`、按钮的 `clicked` 或 QProcess 的 `readyRead*`？ |
| receiver/slot | receiver 是否仍存活？槽是否触碰 QWidget 或任务状态？ |
| type/thread | 是否显式 `Direct/Queued/BlockingQueued`？否则 Auto 在发出时落在哪种语义？两端 `thread()` 是什么？ |
| lifetime | 在哪里建立？会否重复建立？在哪里断开？context/parent 销毁时会否自动断开？ |
| payload | 是否可能部分 stdout、迟到信号、重复信号或旧 run 更新新 UI？ |

对 `connectSlotsByName`，从生成的 `setupUi()` 开始，列出每个 objectName 和符合 `on_<object>_<signal>()` 的槽，再与手动连接逐项比对。若怀疑重复，使用 `Qt::UniqueConnection` 只作为保护手段，不能代替修正错误 signal、错误 objectName 或错误生命周期。

### 3. 审计 QProcess 状态机

至少覆盖：`NotRunning → Starting → Running → Finishing/Cancelled → Finished/Error → Destroyed`。为每个 QProcess 填写：

- 启动方式（直接 executable/arguments 还是长驻 shell）、启动前状态检查和 start failure。
- `started`、`stateChanged`、`readyReadStandardOutput`、`readyReadStandardError`、`finished(exitCode,status)`、`errorOccurred/error` 是否有处理者。
- 每次输出如何缓冲、区分 stdout/stderr、关联 run ID；不要把一次 readyRead 当成完整消息。
- 超时由哪个 `QTimer`/deadline 驱动；超时后先拒绝迟到更新，再 `terminate()`，有界等待后按策略 `kill()`，最后记录退出原因。
- 取消按钮、窗口关闭和重复启动分别走什么状态；取消是否停止轮询、禁用按钮、清除旧结果并等待进程/进程组收尾。
- 若使用 bash，明确 QProcess 监控的是 shell 还是 shell 内的子命令；需要命令级完成时，采用可观测的退出/协议设计并验证，不拿 shell 的 finished 冒充 LSTR/ffmpeg 的 finished。

### 4. 审计对象归属与线程

画 parent-child 树和线程表。对每个 `QObject*` 记录创建语句、parent、owner、`thread()`、是否 move、销毁点；对 QWidget、QTimer、QProcess 和回调上下文分别记录。若工作移到线程，确认目标线程已启动事件循环、对象在正确线程创建/移动，跨线程参数可复制或已注册元类型，退出时先停任务再停事件循环。

### 5. 输出分级结论与最小修复

每条结论必须附真实文件和行号，并使用以下标签：

- **文档建议**：资料提出的设计意图或改进建议；不能当作已实现。
- **源码事实**：当前源码直接显示的调用、连接、parent、循环或缺失证据。
- **待核对**：需要目标 Qt 版本、运行日志、`QMetaObject`、线程 ID、子进程树或目标板实测才能闭合的判断。

最小修复建议按优先级给出：先移除 GUI 槽中的长同步等待并以可取消的事件驱动状态机替代；再补齐 finished/error/timeout/cancel/duplicate-start；然后修正唯一连接和对象归属；最后才讨论线程优化。每项修复都写验证条件，例如“超时后旧 run 的 stdout 不再更新 `textBrowser`，窗口仍能处理点击，退出码/错误可追溯”。

## B — 边界、风险与交接

- `linux-vision-file-ipc-lifecycle-audit` 负责跨进程文件/目录/路径/编号/完成标记/原子性/旧结果/文件轮询合同；本 Skill 只负责 Qt 事件循环、槽调度、QProcess signal lifecycle、取消和对象/线程语义。两者重叠处要分别报告“Qt 收到事件了吗”和“文件真的完整了吗”。
- `linux-vision-project-storytelling` 负责项目介绍、面试答案和个人贡献边界；本 Skill 输出证据审计，不把源码尝试包装成个人成果。
- 不把 `waitKey(10000)` 的固定延迟当成推理完成，不把 `readyReadStandardOutput()` 当成完整结果，不把 `QFileSystemModel` 的目录显示当成同步机制。
- 不把 `QProcess` 的存在写成后台线程；不把默认 AutoConnection 写成 queued；不把跨线程 direct 当成安全 UI 更新。缺少线程/运行时证据就标为待核对。
- 不用“加 `processEvents()`”掩盖不可取消的长任务；嵌套事件循环可能重入按钮、重复启动和析构路径，若采用必须单独审计重入。
- 不在本 Skill 内判断模型 tensor shape、dtype、HWC/CHW 或输出解码；交给 `vision-model-tensor-contract-audit`。

## 推荐交付格式

1. 范围与运行入口。
2. 事件循环阻塞点（调用、线程、上界、取消）。
3. signal-slot 连接表与重复绑定判定。
4. QProcess 状态/信号/超时/取消/重复启动表。
5. QObject parent/owner/thread/connection-type 表。
6. “文档建议—源码事实—待核对”三栏结论。
7. 最小修复和可观测验证条件。
