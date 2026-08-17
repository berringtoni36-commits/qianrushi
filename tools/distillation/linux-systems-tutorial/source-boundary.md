# Linux 用户态教程来源边界

> 本域把用户态工程方法蒸馏为排障/设计 Skill；单个命令和 API 仍回到教程章节，不把教程目录数量当成独立能力。

## 来源分层

- 主源：`archive/大丙Linux教程/` 的分章 Markdown，重点是 GCC/CMake、文件 I/O、进程线程、Socket 和网络状态。
- 派生源：合并/Defuddle 稿用于查漏和重复审计，不覆盖分章主源。
- 附件/外部内容：图片、索引和缓存只作导航或解释证据。

## 方法主线

1. 预处理 → 编译 → 链接 → 动态加载 → 启动 → GDB 的构建调试链。
2. fd、管道、fork/exec、mmap、共享内存和 I/O 生命周期。
3. 进程/信号/守护化与 pthread/线程池同步分开分析。
4. Socket framing、短读写、非阻塞和 select/poll/epoll。
5. NIC/DMA/Ring → IRQ/NAPI → 协议栈 → Socket → 应用读取的接收路径。
6. UDP 端点、广播和组播是不同地址/接口合同，不能混成一个“UDP 问题”。

## 事实边界

- 教程 API 解释不是目标系统版本的运行证明。
- 任何“高并发”“不丢包”“实时”说法都要回到应用 framing、队列、Socket 缓冲、内核队列和测量方法。
- `linux-systems-tutorial` 与 `embedded-core` 共享网络知识，但项目主域/触发边界以压力矩阵为准。

## 原始资料与派生产物

- 原始路径：`archive/大丙Linux教程/`（只读）。
- 域索引：[`INDEX.md`](tools/distillation/linux-systems-tutorial/INDEX.md)。
- 文件级登记：[`source-register.md`](tools/distillation/linux-systems-tutorial/source-register.md)。
