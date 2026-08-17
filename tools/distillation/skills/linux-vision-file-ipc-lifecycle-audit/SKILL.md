---
name: linux-vision-file-ipc-lifecycle-audit
description: "Use when auditing an ARM Linux vision pipeline that starts external programs with Qt QProcess and exchanges frames or results through files, stdout, or shell commands. Trigger phrases include QProcess reads stale results, camera frames are not seen by LSTR, file IPC drops frames, a vision child process hangs or exits, or the project claims asynchronous process communication. Do not use for model tensor shape alone, generic Qt UI design, or a one-minute project introduction."
metadata:
  source_files:
    - projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md
    - projects/linux视觉感知项目/文档/01 项目概述/1.6 模块间协作与进程通信.md
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h
    - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp
  source_symbols:
    - QProcess
    - process2
    - process3
    - start
    - waitForStarted
    - write
    - waitKey
    - imread
    - imwrite
    - cap.open
    - cap.release
  related_skills:
    - qt-event-loop-signal-slot-audit
    - linux-vision-pipeline-and-optimization
    - linux-fd-process-io-debugging
    - linux-vision-project-storytelling
---

# Linux 视觉文件型 IPC 与 QProcess 生命周期审计

## 来源证据

source_files:
  - projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md
  - projects/linux视觉感知项目/文档/01 项目概述/1.6 模块间协作与进程通信.md
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.h
  - projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp

source_symbols:
  - QProcess
  - process2
  - process3
  - start
  - waitForStarted
  - write
  - waitKey
  - imread
  - imwrite
  - cap.open
  - cap.release

## R — 来源摘录与事实

- 项目文档把 Qt 上位机、外部 LSTR/ffmpeg 进程、标准输出和文件系统描述为进程分离协作。
- 当前源码在 mainwindow.cpp 中创建两个没有 parent 的 QProcess，并启动 bash；析构函数只释放 ui，没有展示 terminate、kill、waitForFinished 或 delete。
- 摄像头支路把帧写入项目根目录下的 frames；LSTR 启动命令使用 LSTR/videos/frames，结果显示则轮询 LSTR/result。摄像头编号从 0 开始，结果轮询从 1 开始。

## I — 方法论解释

把文件型 IPC 当成一份必须实现的协议，而不是“两个进程约定了一个目录”。协议至少包含生产者、消费者、工作目录、完整路径、命名/编号、格式、完成标记、所有权、过期清理、超时、重试和退出语义。

文件存在不代表写入完成；目录树显示不代表结果已被消费；固定 waitKey 不代表外部程序完成。必须分别观察启动成功、输入已产生、结果已完整落盘、结果已读取和子进程已退出。

## A1 — 资料中的应用

- process2 用于 LSTR，process3 用于 ffmpeg；源码确实通过 bash 命令和文件路径驱动它们。
- 当前实现存在路径不一致、帧编号不一致和缺少临时文件/原子重命名/完成标记/锁的风险。
- QFileSystemModel 只展示目录树；结果显示实际使用 imread 轮询，不能把目录模型当作结果同步机制。

## A2 — 未来触发场景

- 用户说 QProcess 启动了但读到上一轮、空图片或半张图片。
- 用户说摄像头采集后 LSTR 没有识别结果，或外部进程卡住、退出后 UI 仍轮询。
- 用户要审计 Qt 上位机、ffmpeg、Python/C++ 推理程序之间的文件交换协议真实性。

## E — 可执行审计流程

1. 画时序表：谁启动谁、工作目录是什么、谁写哪个完整路径、文件名如何生成、谁判断完成、谁清理旧结果、失败如何回传。
2. 逐个边界核对 QProcess state、started/error/finished 信号、命令返回码、stdout/stderr、文件 stat 时间、帧编号和图像尺寸；必要时用 strace、lsof 或最小复现。
3. 将“存在即完成”改成明确协议：临时文件写完后原子 rename，或写 done/manifest；用单调帧 ID、时间戳和超时防止旧结果复用。
4. 审计生命周期：退出时 terminate、等待、必要时 kill；轮询必须可取消、有超时和退避，不能用长同步等待冻结 UI。
5. 输出三栏结论：文档声称、源码实际行为、还需目标板实测的内容。

## B — 边界与风险

- 本 Skill 审计进程/文件合同，不判断模型 tensor shape、dtype 或输出解码；使用 vision-model-tensor-contract-audit。
- 文档中的异步、实时和性能数字是资料主张；没有日志、基准和当前构建证据时只能标为待验证。
- 文件 IPC 不能靠 sleep 或 QFileSystemModel 自动保证；并发读写还要考虑半文件、旧文件、编号回绕和磁盘空间。
- 不把源码中的架构尝试写成用户个人贡献；面试表达使用 linux-vision-project-storytelling。

## 相关 Skills

- linux-vision-pipeline-and-optimization：端到端数据流和性能分层。
- vision-model-tensor-contract-audit：模型输入输出合同。
- linux-fd-process-io-debugging：fd、pipe、mmap 和通用用户态 I/O。
- linux-vision-project-storytelling：项目介绍和贡献边界。
