# 框架候选

## v01 主源—派生稿—证据层

先确定直接记录事实的主源，再把 Defuddle、Canvas、HTML、图表和清单标为派生证据；核心结论回链到主源。

来源：`tools/AGENTS.md`、`tools/CLAUDE.md`、`tools/split_dabing_linux.py`、`distillation/canvas-mindmaps/CANVAS_RELATIONS.md`。

## v02 脚本输出契约

对批处理脚本显式审计输入路径、分章数量、来源标记数量、输出路径、图片转换和失败条件；脚本成功退出不等于内容事实正确。

来源：`tools/split_dabing_linux.py`、`projects/嵌入式八股/大丙Linux 教程（Subingwen 专栏合并）-Defuddle提取.md.bak-20260813-1317`、`archive/大丙Linux教程/`。

## v03 规范源—客户端副本

规范 Skill 只在 `distillation/skills/` 维护，客户端只作为同步副本；同步前做同名目录、来源路径、测试和哈希审计。

来源：`distillation/CLIENT_INSTALL.md`、ZCode Skill 目录、各 Skill 的 `test-results.md`。
