---
title: "Linux 视觉感知交互学习实验室"
tags: [project, linux, computer-vision, interactive-learning]
created: 2026-07-20
type: learning-lab
---

# Linux 视觉感知交互学习实验室

> [!success] 启动学习实验室
> [[archive/项目交互动画/index.html|打开 Linux 视觉感知交互学习实验室]]
>
> 如果 Obsidian 将 HTML 显示为源码，请右键链接选择在默认应用中打开，或在文件管理器中双击 `archive/项目交互动画/index.html`。

## 你可以操作什么

- 播放、暂停、单步追踪 `Qt → 采集 → 文件系统 → LIME → LSTR/Unet → Qt 显示`。
- 拖动 100 组真实 LSTR 输入/结果帧，切换 LSTR 与 Unet 路线。
- 用项目真实图像对比 LIME 处理前后效果，并手算 $R=I/\max(T,\varepsilon)$。
- 观察标量循环、NEON SIMD 和 OpenMP 四核分块的处理差异。
- 完成费曼检验、故障注入题和两分钟项目表达练习。

> [!info] 数据真实性
> 页面使用项目已有的真实图像与结果帧，但是一个**离线教学仿真**，不会在 Windows 上调用面向 Linux/ARM 的模型可执行程序。CPU/内存曲线也只用于解释 Qt 的 51 点滑动窗口机制。

## 推荐学习顺序

1. **系统主线**：先能闭眼说出数据流。
2. **LIME 实验**：理解光照图、ADMM 和安全下限。
3. **模型路线**：对比参数化曲线与像素级分割。
4. **ARM 性能**：区分缓存优化、NEON 单核 SIMD 和 OpenMP 多核并行。
5. **检验与排障**：不看资料完成题目，再回到薄弱模块。

## 配套笔记

- [[projects/linux视觉感知项目/index|项目学习首页]]
- [[projects/Linux视觉感知项目/00 项目总览/1.5 系统全景与数据流|系统全景与数据流]]
- [[projects/Linux视觉感知项目/02 LIME 低照度增强/3.7 优化前后性能对比|LIME 优化前后性能对比]]
- [[projects/Linux视觉感知项目/03 模型推理部署/4.6 两种方案对比：分割vs曲线|Unet 与 LSTR 方案对比]]
- [[projects/Linux视觉感知项目/05 面试与复习/6.2 项目全局面试问答|项目全局面试问答]]

