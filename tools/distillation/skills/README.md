# 规范 Skill 源

这里是本蒸馏包唯一的规范 Skill 源。根级 [`audit-report.json`](audit-report.json) 和 [`skill-pressure-test-matrix.md`](skill-pressure-test-matrix.md) 记录当前数量、来源、结构和静态压力测试状态；域目录下的 `skills/` 只用于按知识域导航，不是第二个规范源。

## 一个 Skill 包的合同

每个目录至少包含：

- `SKILL.md`：合法 frontmatter，以及 R/I/A1/A2/E/B 六段方法论。
- `test-prompts.json`：3 条正例、2 条诱饵、1 条边界用例。
- `test-results.md`：静态结果和真实客户端盲测边界；静态 6/6 不能冒充真实命中率。
- `agents/openai.yaml`：Codex 官方格式所需的展示元数据。

## 校验与同步

从 vault 根目录运行完整回归：

```bash
python3 distillation/scripts/run_regression.py
```

只检查已有派生产物：

```bash
python3 distillation/scripts/run_regression.py --check-only
```

如需同步到 ZCode，先执行 `python3 distillation/scripts/sync_zcode_skills.py --dry-run --allow-conflicts`。同步器只写用户级 `~/.zcode/skills/`，遵守同名不覆盖；不要运行旧的 `sync_skills.py`，它已停用多客户端同步。任何真实 ZCode 命中仍需新会话盲测并记录到 [`CLIENT_BLIND_TEST_TEMPLATE.md`](CLIENT_BLIND_TEST_TEMPLATE.md)。

## 事实边界

Skill 中的来源路径是可追溯证据，不等于目标板、目标内核、Qt/OpenCV、工具链或真实客户端已经运行。项目贡献、性能数字和硬件结果必须有独立证据；缺证据时按 Skill 中的 B（边界/风险）输出。
