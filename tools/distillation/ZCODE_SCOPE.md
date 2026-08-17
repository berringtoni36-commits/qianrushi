# ZCode 作用域说明

本蒸馏包现在只对 ZCode 生效。

## 当前结构

- 规范源：distillation/skills/
- ZCode 活动副本：用户目录 ~/.zcode/skills/
- Codex、全局 Claude、Obsidian Claudian：不再安装这 56 个蒸馏 Skill
- 原始 Obsidian 笔记、源码、附件：不修改

ZCode 当前使用 ~/.zcode/skills/ 作为用户级 Skill 发现目录。本次迁移只把通过审计的 56 个规范 Skill 放回这个目录；其他客户端不再保留对应的活动副本。

## 日常使用

1. 启动 ZCode。
2. 新建会话，或重启 ZCode，让它重新扫描用户 Skill。
3. 直接用自然语言提问，例如“帮我排查 FreeRTOS 任务偶尔卡死，DMA 完成但任务没醒”。
4. 需要明确指定时，使用 ZCode 支持的 Skill 命令或名称，例如 /rtos-runtime-fault-diagnosis。

## 维护与更新

修改规范源后，在 Vault 根目录运行：

    python3 distillation/scripts/sync_zcode_skills.py --dry-run --allow-conflicts
    python3 distillation/scripts/sync_zcode_skills.py --allow-conflicts

该同步器只会把不存在的新目录复制到 ~/.zcode/skills/，不会覆盖已有目录。若要更新已存在的 Skill，应先人工比较规范源与 ZCode 副本，确认后再替换；不要使用已停用的 distillation/scripts/sync_skills.py。

完整检查：

    python3 distillation/scripts/run_regression.py

## 作用域边界

在 Codex、Claude 或 Obsidian Claudian 中不会自动加载这批 ZCode 用户目录 Skill。用户原有的非蒸馏 Skill 不受影响。

静态测试 6/6 只表示结构化测试清单完整，不等于 ZCode 真实触发率。真实验证时，使用每个 Skill 的 test-prompts.json，记录正例、诱饵和边界结果。

