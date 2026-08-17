# Test Results — embedded-c-storage-linkage-audit

- 日期：2026-08-13
- 方法：主流程静态盲测；当前环境未提供独立 sub-agent，正式部署后建议用新会话复测。
- 结果：6/6（100%）
- 正例：3；诱饵：2；边界：1
- 诱饵容错：0；跨 Skill 混淆用例：2 条

## 判定

- `SKILL.md` 具备明确的 C 存储期、链接属性、裸机启动和 Map 触发描述。
- 正文完整包含 R/I/A1/A2/E/B，并列出 `source_files` 与 `source_symbols`。
- 用例覆盖 `.data/.bss`、`extern/static`、启动/Map、内存策略、C++ 生命周期和无源码边界。

## 限制

这是结构与路由审查，不等于真实 Codex、Claude、ZCode 会话命中率，也不替代目标工具链编译和目标板启动验证。
