# 候选：视觉项目跨进程文件交换与 QProcess 生命周期审计

id: v05
title: 视觉项目跨进程文件交换与 QProcess 生命周期审计
type: framework
verification: V1=pass, V2=pass, V3=pass

## 方法论

把 Qt 上位机、ffmpeg/LSTR 子进程、输入帧、结果帧和 stdout 建成一个显式协议，逐项核对路径、编号、完成标记、所有权、超时、清理和退出回收。不要把固定 waitKey、文件存在或 QFileSystemModel 展示当成同步完成证据。

## 来源

- projects/linux视觉感知项目/文档/02 Qt 上位机/2.3 QProcess 进程管理.md
- projects/linux视觉感知项目/文档/01 项目概述/1.6 模块间协作与进程通信.md
- projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp：QProcess、process2、process3、waitKey、imread、imwrite
- projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp

## 当前项目证据边界

- mainwindow.cpp 创建无 parent 的两个 QProcess；析构函数只删 ui。
- 摄像头写入 /home/kylin/桌面/project_v1.0/frames/<count>.jpg，LSTR 启动参数使用 ../videos/frames/。
- 摄像头从 0 编号，结果轮询从 1 开始；结果文件没有源码证据证明存在原子 rename、done 标记或锁。

## 三重验证

- V1：QProcess 文档、模块协作文档和 mainwindow.cpp/LSTR 源码交叉支撑。
- V2：可用于诊断资料没有直接列出的旧结果、半文件、路径错位、子进程退出后轮询等问题。
- V3：独特性来自“视觉文件 IPC 合同 + 项目源码真实性”组合，不是泛泛的 QProcess API 说明。
