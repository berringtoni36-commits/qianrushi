# 候选：Qt 事件循环、信号槽与 QProcess 生命周期审计

id: v08
title: Qt 事件循环、信号槽与 QProcess 生命周期审计
type: atomic-skill
verification: V1=pass, V2=pass, V3=pass

## 方法论

把 Qt GUI 的事件入口、槽函数执行区间、QProcess 状态、signal-slot 连接、QObject 归属和线程事件循环组成可追溯时序。先识别 `waitKey`、`waitFor*`、长轮询和同步 I/O 对 GUI 线程的阻塞，再分别核对 `started`、`readyRead*`、`finished`、error、timeout、cancel、重复启动和析构收尾；最后以 sender/真实 signal/receiver/slot/connection type/thread/lifetime 元组判定连接是否重复。

## 来源

- `projects/linux视觉感知项目/文档/02 Qt 上位机/2.2 信号槽机制与交互.md`：信号槽拓扑、`connectSlotsByName`/手动 connect 讨论、`waitKey` 阻塞与改进建议。
- `projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md`：QProcess 启动、`waitForStarted`、stdout 异步读取、同步延时、finished/终止改进建议。
- `projects/linux视觉感知项目/文档/02 Qt 上位机/2.4 CPU与内存实时监控.md`：`timer2`/`timeout` 监控链和短生命周期同步 QProcess 的区分。
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp`：`process2/process3`、`waitKey`、手动连接、stdout 槽、图例先断后连和析构实现。
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h`：QProcess/QTimer 指针、槽声明和 QObject 成员边界。
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/ui_mainwindow.h`：对象类型/objectName、`setupUi` 和 `QMetaObject::connectSlotsByName`。
- `projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/main.cpp`：`QApplication`、`MainWindow` 和 `a.exec()` 事件循环入口。

## 当前项目证据边界

- 源码直接证明 GUI 槽中存在 `waitKey(2000)`、`waitKey(10000)` 和 `waitKey(100)`；不能据此证明 ffmpeg/LSTR 已完成。
- 源码只连接 `process2` 的 `readyReadStandardOutput()`；没有看到 finished/error/stderr/超时/取消连接。
- `process2`/`process3` 用无 parent 的 `new QProcess`，析构函数只展示 `delete ui`；缺少 terminate/kill/有界等待的闭环证据。
- `setupUi()` 调用 `connectSlotsByName`，但文档将 QAction 自动连接与源码 `clicked()` 手动连接的双重绑定说法混在一起。由于 `Open`/`Stop` 是 QAction，实际是否同一 signal 必须在目标 Qt meta-object/运行时核对。
- 指定源码没有 `QThread`、`moveToThread` 或显式 `Qt::QueuedConnection/Qt::DirectConnection`；跨线程结论只能作为审计问题或待核对项。

## 三重验证

- V1：三份 Qt 上位机文档与 `mainwindow.cpp`、`mainwindow.h`、`ui_mainwindow.h`、`main.cpp` 的调用、连接、对象归属和事件循环证据交叉支撑。
- V2：6 条静态压力测试覆盖 3 个正例、2 个兄弟 Skill 诱饵和 1 个通用 Qt 边界；能从症状反推出阻塞、连接生命周期、QProcess 状态及线程语义的审计问题。
- V3：原子边界明确：本候选审计 Qt 调度/槽/QProcess signal lifecycle/对象线程；`linux-vision-file-ipc-lifecycle-audit` 审计跨进程文件合同；`linux-vision-project-storytelling` 负责项目表达。
