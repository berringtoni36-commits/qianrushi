# vault 方法与工具 — 精华

这个 vault 的整理原则可以压缩为一句话：先保护主源，再建立可追溯的派生层。`projects/` 是进行中的项目与源码，`archive/` 是归档资料，`tools/` 保存协作规则和重复处理脚本，`distillation/` 是本轮新增的只读蒸馏结果。

`AGENTS.md` 和 `CLAUDE.md` 说明了目录边界、笔记 frontmatter、标签和“不要修改原始记录”的规则。`split_dabing_linux.py` 将合并教程按来源标记拆分为章节，输出索引和图片 wikilink；它适合重复执行，但文章标记数量、章节数量和路径结构是前置契约。图片 TSV 用大小、哈希和引用次数管理附件，不能把有图片就等同于有新的知识结论。

仓库内的 `.skill`/ZIP、备份和构建目录必须先判定来源与用途。当前蒸馏包只安装到 ZCode：`distillation/skills/` 是规范源，`~/.zcode/skills/` 是唯一活动副本；同步前检查同名目录和哈希，不能无提示覆盖用户已有 Skill。Codex、全局 Claude 和 Obsidian Claudian 不在本包的活动交付范围内。后续新增内容应先更新来源清单和状态文件，再生成知识页和 Skill。
