# 压力测试结果

- 静态结构：6/6（3 条 should_trigger、2 条 should_not_trigger、1 条 edge_case）。
- 正例：fork→exec→wait 回收链、SIGTERM/SIGCHLD 信号合同、setsid/chdir/umask/dup2 守护化环境均命中本 Skill 的生命周期审计流程。
- 诱饵：管道 EOF/fd 引用转给 `linux-fd-process-io-debugging`；pthread 锁环转给 `linux-thread-sync-deadlock-diagnosis`。
- 边界：mmap 与 System V 共享内存残留案例要求区分映射/attach、同步协议、munmap/shmdt 和 IPC_RMID；不把共享位置自动当成同步机制。
- 未进行真实客户端盲测；以上是基于 JSON 结构、触发词、预期路由和 Skill 正文边界的静态检查记录。
