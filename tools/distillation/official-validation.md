# 官方 Skill 格式校验记录

日期：2026-08-14

使用 `/Users/zhaowenqiang/.codex/skills/.system/skill-creator/scripts/quick_validate.py` 对规范源 `distillation/skills/` 的全部目录执行校验。由于当前 Python 环境没有预装 PyYAML，校验过程在临时目录安装 PyYAML，仅通过 `PYTHONPATH` 使用，不写入 vault、规范源或客户端目录。

## 结果

- 规范 Skill：56
- 通过：56
- 失败：0
- 每个 Skill 的 `SKILL.md` 均有合法 frontmatter、合法名称和不超过 1024 字符的 description。
- 官方允许的自定义 frontmatter 字段已放入 `metadata:`；来源审计字段没有停留在顶层。

## 其他静态交付检查

- R/I/A1/A2/E/B：56/56
- `test-prompts.json`：56/56；共 336 条，每个 Skill 为 3 正例、2 诱饵、1 边界。
- 兄弟 Skill 诱饵：56/56 有可识别的相邻 Skill 路由。
- `agents/openai.yaml`：56/56 有 `interface.display_name` 和 25–64 字符的 `short_description`。
- 派生 JSON：111/111 可解析，重复对象键 0；`audit_vault.py` 对后续重复键采用失败策略。
- 关系索引：56/56 个 Skill 均有可解析关系字段；181 条规范关系边、2 条外部工具边、未知关系 0。
- 混合意图矩阵：12/12 条静态路由预期通过；这不是 ZCode 的真实命中率。
- Skill 正文长度：61–301 行，无 Skill 超过 500 行。

## 解释边界

这是官方格式/结构校验，不是 ZCode 真实会话命中率。ZCode 的实际触发仍需新会话盲测；ZCode 副本也仍遵守同名不覆盖规则。

## 客户端目录快照

2026-08-14（本机）：ZCode `~/.zcode/skills/` 包含 56 个本蒸馏包对应目录，后续完整包审计为 `same=56`、`different=0`、`missing=0`。Codex、全局 Claude 和 Obsidian Claudian 的蒸馏副本已从活动发现目录移出并保留备份。ZCode `~/.zcode/cli/config.json` 没有发现覆盖 `~/.zcode/skills/` 的自定义根目录。目录存在只证明安装位置可见，不能替代新会话盲测。
