---
name: vault-source-boundary-and-derived-artifact-audit
description: "Use when maintaining this Obsidian vault and the user needs to distinguish original notes/source code from Defuddle splits, Canvas, HTML demos, backups, build artifacts, attachments, or client Skill copies. Trigger phrases include “这个文件是不是原始资料”, “会不会重复统计”, “来源边界”, “同步 Skill 会覆盖吗”, and “脚本生成的文件能不能当证据”. Do not use for embedded technical diagnosis or ordinary Obsidian formatting."
metadata:
  source_files:
    - tools/AGENTS.md
    - tools/CLAUDE.md
    - tools/index.md
    - tools/sortspec.md.md
    - tools/split_dabing_linux.py
    - tools/图片当前清单.tsv
    - tools/图片迁移清单.tsv
    - distillation/source-inventory.tsv
    - distillation/canvas-mindmaps/CANVAS_RELATIONS.md
  source_symbols: [SOURCE, DEST, CHAPTERS, extract_articles, write_article, sha256, reference_count]
  tags: [obsidian, vault, provenance, audit, distillation]
  related_skills: [interactive-lab-fact-boundary-audit]
  external_related_skills: [json-canvas, cangjie-skill]
---

# vault 来源边界与派生物审计

## R — 来源摘录（Reading）

> 不可以：删除已有笔记内容、修改我的原始记录。

来源：`tools/AGENTS.md`、`tools/CLAUDE.md`。

> 原始仓库只读；源码仅作为事实证据。

来源：`distillation/PIPELINE_STATE.md` 和本次蒸馏流水线约定。

## I — 方法论解释（Interpretation）

维护 vault 时先给文件定身份，再决定如何引用和计数。主源是直接记录事实的笔记、项目文档、源码、测试或原始 PDF；派生稿是脚本/Defuddle/人工拆分后的副本；Canvas、HTML、图表和交互实验通常是关系或教学派生物；图片和模型是附件证据；`.o/.bin/.hex/build/__pycache__` 是构建或缓存产物；客户端目录中的 Skill 是规范源的副本。文件名、扩展名和“看起来像文档”都不足以单独证明身份。

对任何结论建立 `主源 → 派生代码/文件 → 边界 → 测试/测量` 链。重复内容不重复计数；派生文件可以证明转换逻辑或关系，但不能悄悄替代主源。当前蒸馏包只在用户级 `~/.zcode/skills/` 作为 ZCode Skill 生效；不要把它重新安装到 Codex、全局 Claude 或 Obsidian Claudian。

## A1 — 资料中的应用（Past Application）

### 案例 1：大丙教程分章

`tools/split_dabing_linux.py` 从合并稿的来源标记提取文章，按 `CHAPTERS` 写入 `DEST`，转换图片链接并生成索引。分章稿是阅读入口和派生产物；合并稿仍是审计参照，不能把两者当两套独立教程。

### 案例 2：Canvas 与交互实验

`CANVAS_RELATIONS.md` 解析四个 Canvas 的节点/边，把关系指向项目 Markdown、源码和附件；交互实验中的 `project-data.js`/`app-core.js` 可测试教学模型，但页面明确示例值是确定性教学数据，不能称为硬件/内核实测。

### 案例 3：规范 Skill 与客户端副本

`distillation/skills/` 是唯一规范源；用户级 `~/.zcode/skills/` 是唯一活动交付副本，供 ZCode 读取。Codex、全局 Claude 和 Obsidian Claudian 目录不属于本包的活动目标；发现 ZCode 同名目录时暂停，不覆盖原有内容。

## A2 — 未来触发场景（Future Trigger）

当用户问某文件是不是原始资料、是否会重复统计、某个 Canvas/HTML 数值能不能写进简历、脚本生成物能否当证据、同步 Skill 是否安全、附件/压缩包应该如何归类时触发。

若用户需要解析/编辑 JSON Canvas，转 `json-canvas`；若用户要把长资料继续蒸馏成方法 Skill，转 `cangjie-skill`；若用户问实验模型和项目事实差异，转 `interactive-lab-fact-boundary-audit`。

## E — 可执行步骤（Execution）

1. **识别文件身份**：用路径、扩展名、frontmatter、引用关系、生成脚本、哈希和内部 ZIP 清单判断主源/派生/附件/构建/外部资产。
2. **建立来源链**：记录源文件、派生动作、函数/字段、结论、事实类型和验证状态；对 Canvas/HTML 回链到 Markdown/源码。
3. **去重与冲突审计**：合并稿与拆分稿、AGENTS/CLAUDE、Canvas 与正文、规范源与客户端副本按内容/哈希归并；列出文档声称与源码/测试的差异。
4. **检查写入安全**：原始路径只读；规范 Skill 只写 `distillation/skills/`，再由 ZCode 专用同步器复制到用户级 `~/.zcode/skills/`；发现同名目录就报告，不覆盖，也不向其他客户端目录写入。
5. **输出覆盖结论**：给出已覆盖、仅作证据、待复核、排除/拒绝和下一步，更新 `source-inventory`/`coverage-matrix`/`PIPELINE_STATE`。

## B — 边界与风险（Boundary）

- 文件存在不等于内容已核实；测试通过不等于硬件/内核实测。
- Canvas、HTML、图片、PDF 抽取稿和构建产物的证据等级不同，不能混为主源。
- 不能仅凭两个 ZIP 同大小就断言内容相同，也不能仅凭扩展名断言来源；应查看内部清单和哈希。
- 不自动删除、移动、重命名或覆盖原始资料；不自动修改用户学习日志。
- 不把客户端副本的变化直接回写规范源；先确认来源和差异。

## 相关 Skills

- `interactive-lab-fact-boundary-audit`：细审交互模型、测试和实测边界。
- `json-canvas`：创建/编辑/解析 Canvas 文件结构。
- `cangjie-skill`：把长资料的方法论抽取成原子 Skill。

## 审计信息

- **代码职责**：审计 `split_dabing_linux.py` 的输入/输出契约、清单哈希/引用字段和客户端目录身份；不执行删除或覆盖。
- **环境依赖**：本 vault 路径、Obsidian 链接、客户端 Skill 目录和压缩包格式。
- **三重验证**：V1 规则/脚本/清单/派生索引 ✓；V2 可处理新文件分类问题 ✓；V3 直接针对本 vault 的重复和写入风险 ✓。
