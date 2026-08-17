# 重复、派生与证据层审计

## 判定规则

1. 同一内容的不同导出格式只保留一个主源计数。
2. 派生物可以验证转换、关系、交互或展示逻辑，但核心事实回链主源。
3. 文件存在、测试通过、文档声称和目标系统实测分别记录，不能互相替代。
4. Skill 规范源与客户端副本分开统计；客户端副本不回写规范源。

## 已识别关系

| 主源 | 派生/重复物 | 处理 |
|---|---|---|
| `projects/嵌入式八股/大丙Linux 教程（Subingwen 专栏合并）-Defuddle提取.md` | `archive/大丙Linux教程/` 41 篇分章文章、章节索引 | 分章稿作为阅读主入口；合并稿作完整性/遗漏核对，不重复计数 |
| `projects/嵌入式八股/2. 小林图解/` 拆分稿 | 合并稿、图片附件 | 拆分稿与主题页交叉；图片只作说明证据 |
| `projects/Linux物理内存检测项目/` | Canvas、HTML/JS 交互实验、SVG 复习图 | 源码/项目文档优先；交互只验证教学模型和关系 |
| `projects/RTOS项目/` | RTOS HTML 动画、Canvas、构建输出 | 源码/文档优先；动画不证明硬件升级已验证 |
| `projects/linux视觉感知项目/` | 视觉 HTML 动画、图表、输入/结果图、模型二进制 | 文档/源码/测量优先；图表分清实测与派生值 |
| `archive/力扣刷题/` 专题/学习笔记 | 140+ 题目详解、算法 PDF | 题解和 PDF 作案例/证据；方法统一为 3 个算法 Skill |
| `acwing/算法基础课模板大全-C++版本.pdf` | `distillation/algorithm-pdf/*.pymupdf.md`、页面图片 | 仅有限抽取；OCR 失败，公式/图像待复核 |
| `tools/AGENTS.md` | `tools/CLAUDE.md` | 内容相同的客户端规则副本，不计两套方法论 |
| `archive/思维导图/*.canvas` | `distillation/canvas-mindmaps/CANVAS_RELATIONS.md` | JSON 关系摘要是派生索引，不作为正文来源 |
| `distillation/skills/` | `~/.codex/skills/`、`~/.claude/skills/`、`~/.zcode/skills/` | 规范源唯一维护；安装副本只做加载验证 |
| 根目录 `resume-deepdive.skill`、`zin3sgj2` | ZIP 内 `SKILL.md` 和 references | 外部/待确认资产，不纳入本轮规范源，不覆盖客户端同名 Skill |

## 明确排除或降级

- `__pycache__`、`.DS_Store`：缓存/系统元数据，不是知识来源。
- `OBJ/`、`build/`、`.o/.bin/.hex/.crf`：构建输出，只在需要时作为可运行性证据。
- 单个 API 原型、孤立命令参数、题目名称和普通百科定义：降级到 Glossary/案例/题库素材。
- OCR 401 导致无法核对的 PDF 公式/图片：`待复核`，不进入已验证核心结论。
