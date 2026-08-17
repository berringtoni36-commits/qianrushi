# 暂不升格候选

## Linux 目录遍历与文件类型/元数据核验

- 来源：archive/大丙Linux教程/第2章 文件IO/03 文件属性和目录操作.md、05 文件读写.md。
- 理由：有独立 API 语义，但当前优先级低于 UDP 合同、持久化和时序；可先作为 linux-fd-process-io-debugging 的补充案例。

## CMake 源码树—构建树—目标依赖图

- 来源：archive/大丙Linux教程/番外篇/03 CMake.md、04 CMake进阶.md。
- 理由：与 linux-build-debug-chain 高度重叠；若后续升格，必须限定为 CMake 配置/目标依赖/父子目录作用域，不能复制一般构建排障。

## PCI 拓扑枚举与桥窗口/资源分配

- 来源：嵌入式 Linux PCI 文章、ARM Linux 架构文章和驱动文章。
- 理由：当前只有教程证据，没有用户项目 PCI 源码或硬件日志；先保留为主题候选，不把教程示例写成个人项目。

## LIME/NEON/OpenMP 数值等价

- 来源：视觉 LIME 优化文档和 lime_opt.cpp/xinlime.cpp。
- 理由：已有 linux-vision-pipeline-and-optimization 覆盖性能优化和正确性边界；数值等价审计作为其反例/补强，暂不重复生成 Skill。
