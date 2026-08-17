# Linux 教程候选案例

- `lc01` 动态库“链接成功、运行失败”：`08 静态库和动态库.md` 先用 `-L/-l` 解决链接，再用运行时搜索路径和 `ldd` 检查加载；绑定方法 `linux-build-debug-chain`。
- `lc02` 两线程计数少于预期：`08 线程同步.md` 通过共享变量读改写交错展示竞态，再引出互斥锁；绑定方法 `linux-fd-process-io-debugging`。
- `lc03` TCP 一次 `read` 得不到一条业务消息：`05 TCP数据粘包的处理.md` 用协议 framing 恢复边界；绑定方法 `linux-socket-multiplexing-design`。
- `lc04` epoll 服务端管理监听 fd 和连接 fd：`09 IO多路转接（复用）之epoll.md` 将注册/修改/删除与等待就绪分开；绑定方法 `linux-socket-multiplexing-design`。

