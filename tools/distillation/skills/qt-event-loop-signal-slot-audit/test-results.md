# Test Results — qt-event-loop-signal-slot-audit

- 日期：2026-08-14
- 方法：静态路由与结构盲审；3 条应触发、2 条兄弟 Skill 诱饵、1 条通用 Qt 边界。
- 结果：6/6（100%）
- 覆盖：`waitKey`/长轮询阻塞 UI、QProcess finished/error/readyRead/超时/取消/重复启动、`connectSlotsByName` 与手动 connect、QObject 归属和 queued/direct 语义。
- 事实边界：项目结论严格分为“文档建议、源码事实、待核对”；QAction 的 `triggered` 与源码手动 `clicked()` 的信号名冲突未被静态测试误判为已证实双重绑定。
- 限制：未在目标板和目标 Qt 运行时执行 GUI/子进程压力测试；真实客户端新会话盲测待主线程统一安排。
