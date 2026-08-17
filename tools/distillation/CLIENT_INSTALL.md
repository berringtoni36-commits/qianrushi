# ZCode 专用 Skill 安装说明

本蒸馏包只向 ZCode 安装。唯一活动交付位置是：

    ~/.zcode/skills/

规范源仍是：

    distillation/skills/

当前共 56 个规范 Skill。Codex、全局 Claude 和 Obsidian Claudian 不再安装这批蒸馏 Skill；用户原有的其他 Skill 不处理。

## 在 ZCode 中使用

1. 启动 ZCode。
2. 新建会话，或重启 ZCode，让它重新扫描用户级 Skill。
3. 直接自然语言提问，例如：

   - 帮我排查 FreeRTOS 任务偶尔卡死，DMA 完成但任务没醒。
   - 审计这个 eBPF 项目：文档说的和源码实际做的一样吗？
   - 帮我准备这个 RTOS 项目的 1 分钟介绍和技术追问。

若 ZCode 界面支持显式 Skill 命令，也可以使用：

    /rtos-runtime-fault-diagnosis

## 更新 Skill

从 Obsidian Vault 根目录先预览：

    python3 distillation/scripts/sync_zcode_skills.py --dry-run --allow-conflicts

确认后同步：

    python3 distillation/scripts/sync_zcode_skills.py --allow-conflicts

这个脚本只复制缺失目录，不覆盖已经存在的 ~/.zcode/skills/<skill-name>/。如果规范源中的既有 Skill 内容发生变化，应先比较后再人工替换 ZCode 副本；不能把同步器的“只复制缺失目录”误解为版本升级。

旧的 distillation/scripts/sync_skills.py 已停用，运行它会拒绝向任何客户端目录写入。

## 检查安装状态

只检查，不刷新：

    python3 distillation/scripts/run_regression.py --check-only

完整刷新和检查：

    python3 distillation/scripts/run_regression.py

当前审计应显示：

    active_clients = ["zcode"]
    zcode missing = 0

逐 Skill 哈希明细见 client-skill-audit.md 和 client-skill-audit.tsv。

## 作用域边界

这批 Skill 不会在 Codex、全局 Claude 或 Obsidian Claudian 中被发现。ZCode 使用的是用户级 ~/.zcode/skills/；它不是 Obsidian 仓库内的项目目录。

Skill 的静态 6/6 只表示结构化测试清单完整，不等于 ZCode 真实触发率。真实验证时，使用每个 Skill 的 test-prompts.json，记录新会话中的应触发、诱饵和边界结果。

