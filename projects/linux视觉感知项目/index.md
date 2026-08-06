---
title: "Linux 视觉感知处理系统"
tags: [tech, project, Linux, in-progress]
created: 2026-07-11
type: index
summary: "Linux 视觉感知项目的 Obsidian 学习导航，按系统数据流顺序编排：总览→Qt→LIME→推理→集成→面试。"
---

# Linux 视觉感知处理系统

面向 Qt、LIME、Unet、LSTR 与 ARM 优化的学习入口。

> [!tip] 学习方式
> 从上到下按顺序阅读即可，目录编号与系统数据流一致。
> 摄像头采集 → Qt 控制 → LIME 增强 → 模型推理 → 系统集成 → 面试复习

## 思维导图导出

- [[projects/linux视觉感知项目/思维导图/Linux视觉感知项目-复习思维导图|Linux视觉感知项目复习思维导图（XMind 导入源）]]
- [SVG 高清长图](思维导图/Linux视觉感知项目-复习思维导图.svg)
- [PNG 长图](思维导图/Linux视觉感知项目-复习思维导图.png)

## 00 项目总览

> 先建立全局认知：项目是什么、怎么搭建、整体架构长什么样

- [[0.1 深度学习入口与阅读顺序|0.1 深度学习入口与阅读顺序]]
- [[0.2 主动回忆与破坏测试手册|0.2 主动回忆与破坏测试手册]]
- [[projects/Linux视觉感知项目/00 项目总览/1.1 项目概述|1.1 项目概述]]
- [[projects/Linux视觉感知项目/00 项目总览/1.2 环境搭建与依赖安装|1.2 环境搭建与依赖安装]]
- [[projects/Linux视觉感知项目/00 项目总览/1.3 CMake 构建指南|1.3 CMake 构建指南]]
- [[projects/Linux视觉感知项目/00 项目总览/1.4 快速运行车道线检测|1.4 快速运行车道线检测]]
- [[projects/Linux视觉感知项目/00 项目总览/1.5 系统全景与数据流|1.5 系统全景与数据流]]
- [[projects/Linux视觉感知项目/00 项目总览/1.6 模块间协作与进程通信|1.6 模块间协作与进程通信]]

## 01 Qt 上位机

> 界面层：理解 Qt 如何控制整个系统

- [[projects/Linux视觉感知项目/01 Qt 上位机/2.1 界面布局与UI控件|2.1 界面布局与UI控件]]
- [[projects/Linux视觉感知项目/01 Qt 上位机/2.2 信号槽机制与交互|2.2 信号槽机制与交互]]
- [[projects/Linux视觉感知项目/01 Qt 上位机/2.3 QProcess 进程管理|2.3 QProcess 进程管理]]
- [[projects/Linux视觉感知项目/01 Qt 上位机/2.4 CPU与内存实时监控|2.4 CPU与内存实时监控]]
- [[projects/Linux视觉感知项目/01 Qt 上位机/2.5 Mat与QImage格式互转|2.5 Mat与QImage格式互转]]

## 02 LIME 低照度增强

> 算法层：从理论到优化的完整链路

**理论基础**
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.1 算法原理：Retinex与光照图|3.1 算法原理：Retinex与光照图]]
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.2 ADMM优化框架|3.2 ADMM优化框架]]
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.3 收敛策略与参数调优|3.3 收敛策略与参数调优]]

**四层优化递进**
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.4 循环重排与缓存优化|3.4 循环重排与缓存优化]] ← 第一层：缓存命中
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.5 NEON SIMD向量化加速|3.5 NEON SIMD向量化加速]] ← 第二层：单核4路并行
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.6 OpenMP多线程并行|3.6 OpenMP多线程并行]] ← 第三层：4核16路并行
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.7 优化前后性能对比|3.7 优化前后性能对比]] ← 效果验证：5.19×加速

## 03 模型推理部署

> 推理层：LSTR + Unet 两条技术路线

**LSTR 参数化车道线检测（ONNX Runtime）**
- [[projects/Linux视觉感知项目/03 模型推理部署/4.1 LSTR模型架构与曲线解码|4.1 LSTR模型架构与曲线解码]]
- [[projects/Linux视觉感知项目/03 模型推理部署/4.2 ONNX Runtime推理流程|4.2 ONNX Runtime推理流程]]
- [[projects/Linux视觉感知项目/03 模型推理部署/4.3 log_space与双输入机制|4.3 log_space与双输入机制]]

**Unet 语义分割（NCNN）**
- [[projects/Linux视觉感知项目/03 模型推理部署/4.4 Unet编码器-解码器架构|4.4 Unet编码器-解码器架构]]
- [[projects/Linux视觉感知项目/03 模型推理部署/4.5 NCNN部署与HWC-CHW转换|4.5 NCNN部署与HWC-CHW转换]]

**对比与优化**
- [[projects/Linux视觉感知项目/03 模型推理部署/4.6 两种方案对比：分割vs曲线|4.6 两种方案对比：分割vs曲线]]
- [[projects/Linux视觉感知项目/03 模型推理部署/4.7 嵌入式平台优化策略|4.7 嵌入式平台优化策略]]

## 04 系统集成与性能

> 整合层：看整体怎么跑起来、性能数据如何

- [[projects/Linux视觉感知项目/05 面试与复习/6.5 系统设计决策与追问应对|5.1 模块集成与技术选型]]
- [[projects/Linux视觉感知项目/04 系统集成与性能/5.2 模型轻量化与参数压缩|5.2 模型轻量化与参数压缩]]
- [[projects/Linux视觉感知项目/04 系统集成与性能/5.3 文件系统数据交换设计|5.3 文件系统数据交换设计]]

## 05 面试与复习

> 输出层：准备面试，巩固所学

- [[projects/Linux视觉感知项目/05 面试与复习/6.1 学习计划与时间分配|6.1 学习计划与时间分配]]
- [[projects/Linux视觉感知项目/05 面试与复习/6.2 项目全局面试问答|6.2 项目全局面试问答]]
- [[projects/Linux视觉感知项目/05 面试与复习/6.3 LIME与优化面试要点|6.3 LIME与优化面试要点]]
- [[projects/Linux视觉感知项目/05 面试与复习/6.4 LSTR与Unet部署面试要点|6.4 LSTR与Unet部署面试要点]]
- [[projects/Linux视觉感知项目/05 面试与复习/6.5 系统设计决策与追问应对|6.5 系统设计决策与追问应对]]
- [[linux视觉感知面试题|6.6 高频面试总复习（唯一主文档）]]
