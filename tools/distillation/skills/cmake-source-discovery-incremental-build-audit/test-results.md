# Test Results — cmake-source-discovery-incremental-build-audit

- 日期：2026-08-14
- 方法：静态路由与结构检查；未执行独立客户端新会话盲测。
- 结果：6/6（100%）。
- 正例：3/3，覆盖显式 source 与未编译文件、同名 target/旧构建树/增量新鲜度、链接期与运行期动态库分离。
- 诱饵：2/2，分别转向 `linux-build-debug-chain` 和 `linux-vision-build-provenance-audit`。
- 边界：1/1，普通 CMake API 语法问题不触发本 Skill。
- 限制：静态 6/6 不等于实际客户端触发率；目标板上的 `readelf`/`ldd`/loader 运行证据仍需在目标环境采集。
