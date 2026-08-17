# linux-systems-tutorial 全量未回链覆盖复核

审计日期：2026-08-14。原始教程 archive/大丙Linux教程/ 保持只读；本文件只补充逐域覆盖统计和证据边界。

## 结论与统计

当前 source-inventory-current.tsv 全库为 7,146 条数据行，本域文件系统与清单均为 47 个 Markdown 主源。按 INDEX.md、source-map.md、DIGEST.md、verified.md 的文件级/章节级回链复核：

| 口径 | 数量 | 解释 |
|---|---:|---|
| 当前域清单 | 47 | 全部是知识文档；没有项目代码、构建产物或独立测试 |
| 精确回链 | 2 | GCC/构建链和文件描述符主线的精确代表锚点 |
| domain-scoped | 15 | 被章节/主题范围纳入，但没有逐文件精确回链 |
| indexed-only | 30 | 主要是根/章节 index、番外入口和第 3/4 章大量教程页；只登记或被聚合描述覆盖 |
| 真实来源缺失 | 0 | 47 条 inventory 路径全部存在 |

indexed-only 重点队列包括 archive/大丙Linux教程/index.md、番外/index.md、各章 index.md，以及第 3 章进程/线程和第 4 章套接字的大量单页；这些页仍可作为阅读来源，但不能因为被目录或 DIGEST 概括就视为逐文件已回链。source-register.md 保留 47 条完整路径、大小和哈希。

## 可复用摘要

- 构建—加载—运行链：预处理/编译/汇编/链接、静态库与动态库、Makefile 增量图、ldd/加载器和 GDB 运行证据要分层。
- fd 生命周期：open/read/write/dup2/socket/close、fork 后 fd 表与 open file description 的共享要分开。
- 进程/信号/守护：fork、exec、waitpid、kill、SIGCHLD、setsid 和资源回收必须画出 PID/进程组/会话关系。
- pthread/线程池：共享不变量、条件变量谓词、锁顺序、worker 退出和 join/detach 回收不可互相替代。
- TCP framing 与 select/poll/epoll：就绪不等于完整业务消息；仍需处理短读、EOF、EAGAIN、背压和 framing。
- NAPI 资料可复用为 NIC/DMA/IRQ/NAPI/softirq/sk_buff/Socket 的排障路径，但与 TCP 端到端丢失和应用 framing 分工不同。

## 文档 claim 与运行事实边界

教程 API、命令、流程图和“高并发”“不丢包”“实时”“可靠”等表述只能证明通用解释或设计方法。它们不能单独证明目标发行版的动态加载顺序、fd 行为、调度/锁性能、NIC 驱动/NAPI 计数、Socket 交付或任何目标机吞吐。现有 verified.md 的“通过”是跨文档方法论验证，不是对 47 页在目标系统逐页运行。

尤其不能把：

- 一次 read 当成一条业务消息；
- 有 epoll 事件当成消费完成；
- kill 成功当成进程已退出；
- signal/broadcast 当成 worker 已 join；
- 文档中的 API 顺序或性能形容词当成目标内核、库和驱动实测。

## 可复现扫描口径

~~~sh
awk -F '\t' 'NR > 1 && $1 == "linux-systems-tutorial" {n++} END {print n}' \
  distillation/source-inventory-current.tsv
rg --files 'archive/大丙Linux教程' | sort
rg -n 'GCC|文件描述符|fork|exec|waitpid|pthread|TCP|select|poll|epoll|NAPI' \
  distillation/linux-systems-tutorial/{INDEX.md,source-map.md,DIGEST.md,verified.md}
~~~

分类只接受 canonical 文档中的文件/章节锚点为精确回链；目录、章节聚合或只在 source-register 出现的路径进入 domain-scoped/indexed-only。没有执行教程示例、目标系统 API 回归、网络抓包、strace、perf 或 NAPI 计数实验。

## 剩余风险与最小补证

后续若要升格某一条教程结论，应选定目标 Linux/编译器/库/网卡和最小复现：保存命令、版本、源码、strace/调试器/抓包/计数器输出，并明确该证据只覆盖哪个层级。不要按 30 个 indexed-only 页面数量新增 Skill，也不要把通用教程数字改写成当前项目事实。
