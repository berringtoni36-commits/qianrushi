# RedNote 逐文档可用性索引

处理日期：2026-08-14

> 本索引覆盖 小红书（RedNote）/ 下现有的 391 个 Markdown 知识文档。TSV 是逐文档机器可读主表；本页提供同一批文档的范围、证据边界和可读目录。full_distill_recommended 只表示“值得后续全文阅读/蒸馏”，不改变既有 source disposition，也不等于事实已验证。

## 覆盖范围

| 集合 | 文档数 | 既有状态 | 既有用途 |
|---|---:|---|---|
| Bookmarks | 202 | domain-referenced=202 | external-reference=202 |
| Likes | 177 | domain-referenced=177 | needs-review=177 |
| Posts | 2 | domain-referenced=2 | needs-review=2 |
| Albums | 10 | domain-referenced=10 | derived-index=10 |

## 字段与判定约定

- Bookmarks、Likes、Posts 是导出集合标签，不是用户事实证明；尤其 Likes 的点赞身份/意图、Posts 的账号归属均保留不确定性。
- D0 表示专辑派生索引；E1 表示正文不足/媒体主导；E2 表示可读的单篇自述或经验；E3 表示篇幅较足且有步骤/题目/流程线索。它们是索引证据等级，不是事实真伪等级。
- 方法候选只表示可以从原文提取“步骤、检查点或复盘结构”；原帖的公司、学校、岗位、offer、薪资、Star、浏览/点赞数字、版本和效果承诺仍需独立核验。
- 详细字段（来源 URL、标签、正文字符数、媒体/评论存在性、重复 resourceId、精确路径）均在 article-index.tsv。

## 主题汇总

| 主题 | 文档数 | yes | maybe | no |
|---|---:|---:|---:|---:|
| 嵌入式求职、面试与学习闭环 (embedded-career) | 108 | 60 | 48 | 0 |
| 嵌入式技术、项目与排错 (embedded-technical) | 7 | 3 | 4 | 0 |
| AI / Agent / Skill 工具工作流 (ai-agent-workflow) | 87 | 43 | 38 | 6 |
| AI + Obsidian / 知识工作流 (ai-knowledge-workflow) | 45 | 32 | 12 | 1 |
| Obsidian、Anki、Zotero 与知识管理 (knowledge-management) | 16 | 2 | 13 | 1 |
| LeetCode / Hot100 / 算法学习 (algorithm-learning) | 12 | 8 | 4 | 0 |
| 考研、科研、调剂与教育信息 (graduate-research) | 36 | 0 | 12 | 24 |
| 泛求职与就业信息 (career-and-employment) | 8 | 4 | 4 | 0 |
| Mac / Apple / 数码设备 (apple-digital) | 21 | 0 | 1 | 20 |
| 健康、减脂与饮食 (health-lifestyle) | 16 | 0 | 0 | 16 |
| 消费、生活与产品内容 (consumer-lifestyle) | 9 | 0 | 0 | 9 |
| 其他外部内容 (misc-external) | 16 | 0 | 0 | 16 |
| 专辑派生导航 (derived-album-index) | 10 | 0 | 0 | 10 |

## 逐文档登记

以下目录与 TSV 一一对应；source_path 保留 vault 内精确相对路径。为避免把第三方帖子误写成用户事实，表中只展示索引判定，完整边界说明在 user_fact_boundary 字段和 content-boundary-review.md。

| No. | 集合 | 标题 | 作者 | 主题 | 索引用途 | 证据 | 全文蒸馏 | 既有用途 | source_path |
|---:|---|---|---|---|---|---|---|---|---|
| 001 | Albums | skills | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/skills/专辑索引.md |
| 002 | Albums | 个人专辑 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/个人专辑/专辑索引.md |
| 003 | Albums | 好玩的 ai | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/好玩的 ai/专辑索引.md |
| 004 | Albums | 小米嵌入式 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/小米嵌入式/专辑索引.md |
| 005 | Albums | 就业 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/就业/专辑索引.md |
| 006 | Albums | 嵌入式学习经验 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/嵌入式学习经验/专辑索引.md |
| 007 | Albums | 嵌入式就业 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/嵌入式就业/专辑索引.md |
| 008 | Albums | 嵌入式面经 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/嵌入式面经/专辑索引.md |
| 009 | Albums | 找实习工作 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/找实习工作/专辑索引.md |
| 010 | Albums | 算法刷题 | not_applicable | derived-album-index | 派生导航（非独立原帖） | D0 | no | derived-index | 小红书（RedNote）/。。。。。。。/专辑（Albums）/算法刷题/专辑索引.md |
| 011 | Posts | 生物技术与工程考研调剂 | 。。。。。。。 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/我的发布（Posts）/生物技术与工程考研调剂 - 67ea45bb000000001b024a1e.md |
| 012 | Posts | 考数学和数据结构的生物信息学该往哪调啊，本科非生物，调剂可太难了，救救孩子吧[哭 | 。。。。。。。 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/我的发布（Posts）/考数学和数据结构的生物信息学该往哪调啊，本科非生物，调剂可太难了，救救孩子吧[哭 - 67ea443b000000001c001c23.md |
| 013 | Bookmarks | #复试 #考研复试 #电气工程 | 大红薯777 | graduate-research | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/#复试 #考研复试 #电气工程 - 69a8ef53000000002801c002.md |
| 014 | Bookmarks | 0基础嵌入式Linux学习路线 | zllllll | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/0基础嵌入式Linux学习路线 - 6a565b0a000000001702d88e.md |
| 015 | Bookmarks | 0实习双非硕｜备战秋招 | 木兔 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/0实习双非硕｜备战秋招 - 6a76d28f0000000026036444.md |
| 016 | Bookmarks | 1000个开源项目拆解：Opencodex接入多AI | DAYU大渔 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/1000个开源项目拆解：Opencodex接入多AI - 6a69d2e9000000001d00fd7f.md |
| 017 | Bookmarks | 10万+看过的额度插件更新上线啦✨ | Change设计师 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/10万+看过的额度插件更新上线啦✨ - 6a54bbc60000000017029090.md |
| 018 | Bookmarks | 2026 年还在手动投简历？在起跑线上输麻了 | Mr. Weirdo | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/2026 年还在手动投简历？在起跑线上输麻了 - 6a4ab0ad000000000f01ec33.md |
| 019 | Bookmarks | 2026图文创作Skill清单，少装一个都亏 | 铲屎官阿沐的Ai日常 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/2026图文创作Skill清单，少装一个都亏 - 6a4caae600000000070277be.md |
| 020 | Bookmarks | 2026年，这可能是最爽的远程Coding方式... | 数字生命卡兹克 | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/2026年，这可能是最爽的远程Coding方式... - 6a585e7c000000000f03cba8.md |
| 021 | Bookmarks | 2026还买 M1 Pro MacBook Pro？ | 大花活河蛤蟆 | ai-agent-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/2026还买 M1 Pro MacBook Pro？ - 6a6497d4000000000301e889.md |
| 022 | Bookmarks | 264分复试0淘汰！安徽理工大学录取221人！ | 研途电气考研 | graduate-research | 仅外部参考（考情/个人经历） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/264分复试0淘汰！安徽理工大学录取221人！ - 6a6307ee0000000001001536.md |
| 023 | Bookmarks | 26届小米秋招一面面经(含答案)-嵌入式软件 | 布川NeiCool | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/26届小米秋招一面面经(含答案)-嵌入式软件 - 6a60deff000000000f009ee2.md |
| 024 | Bookmarks | 27届嵌入式，简历没改完能先投吗 | 胜哥-嵌入式面试官 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/27届嵌入式，简历没改完能先投吗 - 6a7c3ed1000000002c003c80.md |
| 025 | Bookmarks | 27岁嵌入式每周3场面试，上岸后真感受 | 再吃亿大口 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/27岁嵌入式每周3场面试，上岸后真感受 - 6a7a7d3d0000000026034950.md |
| 026 | Bookmarks | 4个skill就能实现Obsidian+Codex 文献阅读 | catrabbit | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/4个skill就能实现Obsidian+Codex 文献阅读 - 6a44e70c000000001603c0fc.md |
| 027 | Bookmarks | 5.6万 Star！GitHub 爆火的 AI 求职神器， | Agent 实战日记 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/5.6万 Star！GitHub 爆火的 AI 求职神器， - 6a5b6d6c00000000010333b6.md |
| 028 | Bookmarks | 52天瘦了32.6斤 | 爱分享的西瓜🍉 | health-lifestyle | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/52天瘦了32.6斤 - 6a605580000000000f01f5c0.md |
| 029 | Bookmarks | 6万star求职skill！帮你直通boss直聘offer | Ceci（AI版） | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/6万star求职skill！帮你直通boss直聘offer - 6a4e64830000000017008b9f.md |
| 030 | Bookmarks | 6万人看过的Codex自动投简历Skill，开源了 | 藏个栗子🌰 | ai-knowledge-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/6万人看过的Codex自动投简历Skill，开源了 - 6a40e8a4000000001101cb98.md |
| 031 | Bookmarks | 8月份第一周skill红黑榜（第六期） | 铲屎官阿沐的Ai日常 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/8月份第一周skill红黑榜（第六期） - 6a79d52a000000003301d4b8.md |
| 032 | Bookmarks | AI Skills 一站式管理，一屏尽览 | 生活告诉我 | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/AI Skills 一站式管理，一屏尽览 - 6a66ecf5000000001101c424.md |
| 033 | Bookmarks | AI 工具支持扩至 28 款、自定义菜单栏排版 | Javis | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/AI 工具支持扩至 28 款、自定义菜单栏排版 - 6a67732b000000000c003000.md |
| 034 | Bookmarks | AI版面试自救指南（二）项目篇 | 路过说 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/AI版面试自救指南（二）项目篇 - 6a536bc4000000001603d051.md |
| 035 | Bookmarks | ChatGPT 新功能 Health，每周生成健康周报 | 杜耶Pro | ai-agent-workflow | 方法候选（工具工作流） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/ChatGPT 新功能 Health，每周生成健康周报 - 6a677f9f000000000100cec8.md |
| 036 | Bookmarks | CodexBar | 改名字辟邪 | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/CodexBar - 6a44a4570000000015025bd0.md |
| 037 | Bookmarks | Codex一个月两篇2区 | 踏雪驭风 | ai-agent-workflow | 仅外部参考（工具/资讯） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Codex一个月两篇2区 - 6a6dcb6d00000000350156fd.md |
| 038 | Bookmarks | Codex菜单栏额度小表 | 绿萝卜蹲蹲 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Codex菜单栏额度小表 - 6a4f790d000000002101bfc9.md |
| 039 | Bookmarks | Codex额度重置卡不用打开看了 | 小万AI实战记 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Codex额度重置卡不用打开看了 - 6a53967d000000000702f7cf.md |
| 040 | Bookmarks | FPGA学习路径 从零基础到实战的成长指南 | 江上知客 | embedded-technical | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/FPGA学习路径 从零基础到实战的成长指南 - 68874fc5000000001d00d884.md |
| 041 | Bookmarks | Feishu x Obsidian｜多人协同+自动化☁️ | 鱼先生的模块化Obsidian | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Feishu x Obsidian｜多人协同+自动化☁️ - 6a7dad79000000002402c02c.md |
| 042 | Bookmarks | GitHub一周飙升榜，第一名狂涨 7,554 Star | 硅基白话 | ai-agent-workflow | 方法候选（工具工作流） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/GitHub一周飙升榜，第一名狂涨 7,554 Star - 6a73f448000000002500b3ab.md |
| 043 | Bookmarks | GitHub上的闷声发大财的项目！ | 麦哲伦二世 | misc-external | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/GitHub上的闷声发大财的项目！ - 6a57a7c3000000001503edd0.md |
| 044 | Bookmarks | GitHub本周最火Agent Skill盘点 | 铲屎官阿沐的Ai日常 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/GitHub本周最火Agent Skill盘点 - 6a4f8d6d000000000702cc4b.md |
| 045 | Bookmarks | Github最热门的100个Skill（整理版） | 包子呀 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Github最热门的100个Skill（整理版） - 69d3102f000000001a0309d1.md |
| 046 | Bookmarks | Github本周热门项目排行榜（2026.07.11） | 赛博猫2077 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Github本周热门项目排行榜（2026.07.11） - 6a51962d00000000220092e2.md |
| 047 | Bookmarks | HOT100刷题笔记（卡片版）：哈希 | Jerry X | algorithm-learning | 方法候选（算法学习/复习） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/HOT100刷题笔记（卡片版）：哈希 - 695beca6000000001a0367a6.md |
| 048 | Bookmarks | Karpathy刚说完就有人做了！CC知识图谱神器 | 两斤AI | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Karpathy刚说完就有人做了！CC知识图谱神器 - 69d5a453000000002200ca16.md |
| 049 | Bookmarks | M5很好，但我却留下了M1 Pro | Zephyr Lee🌟 | ai-agent-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/M5很好，但我却留下了M1 Pro - 6a567699000000002200bbcb.md |
| 050 | Bookmarks | MCU+RTOS基础方向学习路线(详细视频版) | 不搭xhs | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/MCU+RTOS基础方向学习路线(详细视频版) - 6a572eea000000000f032bba.md |
| 051 | Bookmarks | Mac 这 10 个功能，相见恨晚 | 多多数码屋 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Mac 这 10 个功能，相见恨晚 - 6a414621000000002201768e.md |
| 052 | Bookmarks | Macbookair m5 已拿下！（国产，已安全下车） | Momo | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Macbookair m5 已拿下！（国产，已安全下车） - 6a5a1f78000000000f01c263.md |
| 053 | Bookmarks | Mac建议！ | 喝美式了嘛 | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Mac建议！ - 6a4b4211000000001003c9a9.md |
| 054 | Bookmarks | Mac快捷启动器 | Z程序猿 | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Mac快捷启动器 - 6a75ba1d000000002403dc75.md |
| 055 | Bookmarks | Mac苹果电脑如何查看电池健康 | 果循环 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Mac苹果电脑如何查看电池健康 - 67d84390000000001c002742.md |
| 056 | Bookmarks | Nature Skills的起点，不过是我案头一方顺手的小工具。直到4月30日， | 袁一哲(Nature Skills) | graduate-research | 方法候选（信息核对/备考流程） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Nature Skills的起点，不过是我案头一方顺手的小工具。直到4月30日， - 6a44cde1000000001101e4b8.md |
| 057 | Bookmarks | Obsidian 2026新一代同步插件 | 焦应行 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian 2026新一代同步插件 - 6a58408f000000001003d877.md |
| 058 | Bookmarks | Obsidian 4款思维导图插件测评 | 数字化小组 | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian 4款思维导图插件测评 - 6658388e0000000016012708.md |
| 059 | Bookmarks | Obsidian+AI，3步搭建你的第二大脑 | 铲屎官阿沐的Ai日常 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian+AI，3步搭建你的第二大脑 - 6a4e09ee00000000220161cd.md |
| 060 | Bookmarks | Obsidian+claude装上10个agent | 哈泰利 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian+claude装上10个agent - 69c68242000000001a0372e4.md |
| 061 | Bookmarks | Obsidian唯一遗憾被补上了，完美融合XMind | 及时春雨 | knowledge-management | 方法候选（知识库/笔记工作流） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian唯一遗憾被补上了，完美融合XMind - 6a409ebc0000000007026a80.md |
| 062 | Bookmarks | Obsidian插件推荐！点一下鼠标，内容乖乖落盘 | Lance | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian插件推荐！点一下鼠标，内容乖乖落盘 - 6a6a1c840000000011015677.md |
| 063 | Bookmarks | Obsidian的白板，永远滴神 | Maxwell | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian的白板，永远滴神 - 6958f8c5000000001f004b45.md |
| 064 | Bookmarks | RTOS学习路线（详细版） | 不搭xhs | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/RTOS学习路线（详细版） - 68c9732c000000001202f933.md |
| 065 | Bookmarks | STM32基础外设学到什么程度才算学会了 | 不搭xhs | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/STM32基础外设学到什么程度才算学会了 - 6a59aa6d000000001101e8e1.md |
| 066 | Bookmarks | [内测]可能是目前最好用的思维导图插件之一 | PKMer | knowledge-management | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/[内测]可能是目前最好用的思维导图插件之一 - 6a2408a50000000006031c6b.md |
| 067 | Bookmarks | agent skill | 小海爱技术 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/agent skill - 6a5e2d8a000000001f01d903.md |
| 068 | Bookmarks | ai面试辅助工具自救指南 | 路过说 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/ai面试辅助工具自救指南 - 6a21491e000000003601fe52.md |
| 069 | Bookmarks | claude+obsidian 最佳搭配方式 | 哈泰利 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/claude+obsidian 最佳搭配方式 - 69b6981900000000220272b4.md |
| 070 | Bookmarks | codex+obsidian科研 ／ 每天自动读论文 | 哈泰利 | ai-knowledge-workflow | 方法候选（文献/研究工作流） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/codex+obsidian科研 每天自动读论文 - 6a566413000000002101b030.md |
| 071 | Bookmarks | hot100刷题总忘？我做了个SRS复习工具! | 没有名字的名字在coding | algorithm-learning | 方法候选（算法学习/复习） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/hot100刷题总忘？我做了个SRS复习工具! - 6a18140e000000003501e1e2.md |
| 072 | Bookmarks | ob有没有能够像幕布一样能够一键将笔记转换为思维导图的插件呀#笔记还能这 #效率 | 卷王 | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/ob有没有能够像幕布一样能够一键将笔记转换为思维导图的插件呀#笔记还能这 #效率 - 682ec4d30000000022035e19.md |
| 073 | Bookmarks | pdf/word/excel etc to markdown for agent | moumo | graduate-research | 方法候选（信息核对/备考流程） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/pdf word excel etc to markdown for agent - 6a5c8f33000000001101a6f2.md |
| 074 | Bookmarks | ⚡一天刷完LeetCode Hot 100 | 晴天资料库 | algorithm-learning | 方法候选（算法学习/复习） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/⚡一天刷完LeetCode Hot 100 - 6a105720000000000803d947.md |
| 075 | Bookmarks | 「小米」视频面试～一面 | 桃子先生（27秋招版） | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/「小米」视频面试～一面 - 69674e93000000002102a422.md |
| 076 | Bookmarks | 一个从Codex快速跳转obsidian的小插件 | AGENT大白 | ai-knowledge-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一个从Codex快速跳转obsidian的小插件 - 6a75826700000000330128fd.md |
| 077 | Bookmarks | 一个把简历项目真正吃透的AI面试Prompt | Eleen | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一个把简历项目真正吃透的AI面试Prompt - 6a7869240000000022030e4a.md |
| 078 | Bookmarks | 一天用K3把LeetCode Hot100做成了刷题神器 | 工藤一加一 | embedded-career | 方法候选（求职/简历流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一天用K3把LeetCode Hot100做成了刷题神器 - 6a5dd3b6000000000101f3e2.md |
| 079 | Bookmarks | 一想到去年这个时候还在上班，今年居然已经拿到上理录取通知书等待开学了，还是感觉很 | 我还是叫鲤鲤吧 | graduate-research | 仅外部参考（考情/个人经历） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一想到去年这个时候还在上班，今年居然已经拿到上理录取通知书等待开学了，还是感觉很 - 6a648554000000000301ef81.md |
| 080 | Bookmarks | 一款好用且实用的 Obsidian AI 插件！ | 维客笔记 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一款好用且实用的 Obsidian AI 插件！ - 6a661c1c00000000110056ea.md |
| 081 | Bookmarks | 一款完美替代掉 VsCode 等IDE的终端工具！ | 啊莱0al | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一款完美替代掉 VsCode 等IDE的终端工具！ - 6a6532e7000000000e03606c.md |
| 082 | Bookmarks | 一键把任意书蒸馏成Skill！快速吃透🎉 | 袋鼠帝 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一键把任意书蒸馏成Skill！快速吃透🎉 - 6a6307ff000000000401c793.md |
| 083 | Bookmarks | 上理生医工研究生薪资待遇 | 8086 | graduate-research | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/上理生医工研究生薪资待遇 - 6a5a0062000000001102c2d7.md |
| 084 | Bookmarks | 不用点侧边栏了！我的Obsidian导航页长这样 | 搭建笔记中 | knowledge-management | 方法候选（知识库/笔记工作流） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/不用点侧边栏了！我的Obsidian导航页长这样 - 6a3e0a52000000001100498d.md |
| 085 | Bookmarks | 个人真实减脂全历程｜170斤→120斤，50斤蜕变 | 米饭炒大肉 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/个人真实减脂全历程｜170斤→120斤，50斤蜕变 - 6a574f77000000000702825e.md |
| 086 | Bookmarks | 二手 M1 Pro MacBook 蹲价 day24：有降价 | 一点都不机智的江先生 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/二手 M1 Pro MacBook 蹲价 day24：有降价 - 6a6071c90000000009034e22.md |
| 087 | Bookmarks | 从夯到拉，锐评论文Skills | 库森说AI | graduate-research | 方法候选（信息核对/备考流程） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/从夯到拉，锐评论文Skills - 6a56463f00000000170295d5.md |
| 088 | Bookmarks | 从夯到拉｜锐评各类热门简历skill | 圆圆的探索日记 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/从夯到拉｜锐评各类热门简历skill - 6a79b5690000000032031459.md |
| 089 | Bookmarks | 从简历到面试，6个Skill全搞定 | 铲屎官阿沐的Ai日常 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/从简历到面试，6个Skill全搞定 - 6a56f4610000000006036236.md |
| 090 | Bookmarks | 做一个iCloud自由组队网站，大家会使用吗？ | 莫名其妙 | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/做一个iCloud自由组队网站，大家会使用吗？ - 69c25429000000001a02a49b.md |
| 091 | Bookmarks | 免费Skill分享-深挖项目/模拟压力面 | 爱吃鸡饲料的猪 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/免费Skill分享-深挖项目 模拟压力面 - 6a5f602100000000110044da.md |
| 092 | Bookmarks | 关于95新 MacBook Pro M1pro 32+512 成功下车，也是终于 | 小苏 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/关于95新 MacBook Pro M1pro 32+512 成功下车，也是终于 - 6a6aed5c000000000f033ed4.md |
| 093 | Bookmarks | 出16寸MacBook Pro M4Pro定制 | 大彬（济南26年国补办理中） | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/出16寸MacBook Pro M4Pro定制 - 6a5208e7000000001700a557.md |
| 094 | Bookmarks | 分享一下嵌入式linux方向面经--小米一面 | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/分享一下嵌入式linux方向面经--小米一面 - 6a6430e7000000001c00d7db.md |
| 095 | Bookmarks | 分享一个自用Obsidian主题 | 星团读博日记 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/分享一个自用Obsidian主题 - 6a7b4c7d00000000280332c1.md |
| 096 | Bookmarks | 分享一期粉丝嵌入式面经(实习版，mcu岗) | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/分享一期粉丝嵌入式面经(实习版，mcu岗) - 6a54698b000000001003ec19.md |
| 097 | Bookmarks | 分享自己写的秋招面试Agents和skills | momo | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/分享自己写的秋招面试Agents和skills - 6a7740ac0000000021022013.md |
| 098 | Bookmarks | 利用 Anki 和遗忘曲线来强化记忆和认知！ | JiachenYu | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/利用 Anki 和遗忘曲线来强化记忆和认知！ - 69512ff7000000001f009b16.md |
| 099 | Bookmarks | 加班140天猝S，公司以最快速度“毁灭证据” | 念_ 37岁工程师张亮加班140天猝死〇赔偿 | misc-external | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/加班140天猝S，公司以最快速度“毁灭证据” - 6a5b8ce1000000001d00faf1.md |
| 100 | Bookmarks | 单2硕 嵌入式全栈选手 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/单2硕 嵌入式全栈选手 - 69a5548e0000000026030618.md |
| 101 | Bookmarks | 南京大学2023届LAMDA实验室去向 | 鹿鸣观山海 | graduate-research | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/南京大学2023届LAMDA实验室去向 - 652d1b16000000002101f13a.md |
| 102 | Bookmarks | 双非一本秋招选手（非强双非），有实习🈶奖项 | beenu丶 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/双非一本秋招选手（非强双非），有实习🈶奖项 - 6a62f1760000000014006e0a.md |
| 103 | Bookmarks | 双非本科 嵌入式 实习秋招清单 | 盛夏的时光 | embedded-career | 方法候选（求职/简历流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/双非本科 嵌入式 实习秋招清单 - 6a619bd1000000000100ebd5.md |
| 104 | Bookmarks | 双非硕0实习0项目，怎么拿到嵌入式offer | 梦嘉的硬件笔记 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/双非硕0实习0项目，怎么拿到嵌入式offer - 6a0056c2000000003502bc43.md |
| 105 | Bookmarks | 双非硕，嵌入式❤️简历V2.0，大厂可以吗？ | 十二月小鸿 | embedded-career | 方法候选（求职/简历流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/双非硕，嵌入式❤️简历V2.0，大厂可以吗？ - 68aece69000000001c00a883.md |
| 106 | Bookmarks | 哪个冤大头涨价才入手MacBook Air M5 | 针尖对麦当劳🥕 | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/哪个冤大头涨价才入手MacBook Air M5 - 6a51082800000000060207a3.md |
| 107 | Bookmarks | 备餐vlog｜减脂版沙县鸡腿饭 50元吃一周 | 灰尝粘年糕 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/备餐vlog｜减脂版沙县鸡腿饭 50元吃一周 - 6a3a8ffa000000000f03131f.md |
| 108 | Bookmarks | 多线程在嵌入式Linux项目中解决什么问题？ | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/多线程在嵌入式Linux项目中解决什么问题？ - 6a6eee480000000029032ddc.md |
| 109 | Bookmarks | 大模型 | 卢大堡 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/大模型 - 6a1b91d20000000007026aab.md |
| 110 | Bookmarks | 奉劝那些用zotero的人.... | 靠岸 | ai-knowledge-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/奉劝那些用zotero的人.... - 6a560bd600000000220086bb.md |
| 111 | Bookmarks | 奉贤海湾街上，近上师大，仅租1000包网 | 小刘好房推荐AA | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/奉贤海湾街上，近上师大，仅租1000包网 - 6a52ee58000000000f030ab8.md |
| 112 | Bookmarks | 如果我的Obsidian只装5个插件 | 三木 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/如果我的Obsidian只装5个插件 - 6a647106000000000101e9cf.md |
| 113 | Bookmarks | 如果说最推荐的一个Skill，那么我会推荐它 | 麦哲伦二世 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/如果说最推荐的一个Skill，那么我会推荐它 - 6a7a8bf9000000002500784d.md |
| 114 | Bookmarks | 字节嵌入式面经 | 猛嵌 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/字节嵌入式面经 - 69f3188a000000001a02fc11.md |
| 115 | Bookmarks | 实时监控20款AI工具用量 多设备同步 已开源 | Javis | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/实时监控20款AI工具用量 多设备同步 已开源 - 6a4a27e1000000000e038401.md |
| 116 | Bookmarks | 实时监控28款AI工具用量/额度、记录订阅信息 | Javis | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/实时监控28款AI工具用量 额度、记录订阅信息 - 6a7461250000000002003c00.md |
| 117 | Bookmarks | 实话实说，嵌入式面试是纯骗人的… | 再吃亿大口 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/实话实说，嵌入式面试是纯骗人的… - 6a1d3c360000000035020db5.md |
| 118 | Bookmarks | 小米2026薪资情报~平均年薪30w+ | 小青蛙布布 | career-and-employment | 案例/外部参考 | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/小米2026薪资情报~平均年薪30w+ - 6a7c2715000000002701da62.md |
| 119 | Bookmarks | 小米嵌入式软件工程师面经 | 企鹅嵌入式🐧 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/小米嵌入式软件工程师面经 - 6a562a9f000000002003b943.md |
| 120 | Bookmarks | 小米嵌软一面面经 | 当啷当 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/小米嵌软一面面经 - 68cd0e7d000000001302ace0.md |
| 121 | Bookmarks | 小米手环助你随时随地vibecoding | 不正经设计师LEN | ai-agent-workflow | 方法候选（工具工作流） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/小米手环助你随时随地vibecoding - 6a40f67b000000000f02873d.md |
| 122 | Bookmarks | 屡战屡胜SSP候选人如何用录音转文字复盘！ | 连理🌱 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/屡战屡胜SSP候选人如何用录音转文字复盘！ - 6a60e001000000000f01ed8a.md |
| 123 | Bookmarks | 嵌入式Linux方向总体学习路线（完整版） | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式Linux方向总体学习路线（完整版） - 6a5c4f80000000000f0332e1.md |
| 124 | Bookmarks | 嵌入式冲机器人，今年行情汇总，关于前景 | 工科女的日常 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式冲机器人，今年行情汇总，关于前景 - 6a68ad1e000000001f01cf47.md |
| 125 | Bookmarks | 嵌入式学习路线分 | brave.hahaha | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式学习路线分 - 6a1e56dd0000000006030604.md |
| 126 | Bookmarks | 嵌入式实习 | 猛嵌 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式实习 - 6a7bbdab000000003300e802.md |
| 127 | Bookmarks | 嵌入式实习/嵌入式学习/不要焦虑 | 嵌入式多多 | embedded-career | 方法候选（学习路线/复习流程） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式实习 嵌入式学习 不要焦虑 - 6a575e0f000000000f033e9f.md |
| 128 | Bookmarks | 嵌入式常见算法题总结 | 糯叽唧大王 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式常见算法题总结 - 6a7865ea0000000022014ab4.md |
| 129 | Bookmarks | 嵌入式开发 | 漂亮四季豆 | embedded-career | 方法候选（求职/简历流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式开发 - 6a720c4400000000250084db.md |
| 130 | Bookmarks | 嵌入式找实习/秋招八股要背到什么程度？ | 工科女的日常 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式找实习 秋招八股要背到什么程度？ - 6a7b137c0000000035016851.md |
| 131 | Bookmarks | 嵌入式找实习焚决 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式找实习焚决 - 6a52dab8000000000f007864.md |
| 132 | Bookmarks | 嵌入式校招AI面经总结（下） | 飞出金陵的烤鸭 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式校招AI面经总结（下） - 6a2e9d62000000001603ce89.md |
| 133 | Bookmarks | 嵌入式校招从入门到秋招闭环(汽车电子篇) | 飞出金陵的烤鸭 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式校招从入门到秋招闭环(汽车电子篇) - 6a5c58e40000000001000d43.md |
| 134 | Bookmarks | 嵌入式校招从入门到秋招闭环（介绍篇） | 飞出金陵的烤鸭 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式校招从入门到秋招闭环（介绍篇） - 6a5c56fb0000000001030cc3.md |
| 135 | Bookmarks | 嵌入式校招可投方向全总结 | 梦嘉的硬件笔记 | embedded-career | 方法候选（求职/简历流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式校招可投方向全总结 - 6a3fc241000000001101d9e9.md |
| 136 | Bookmarks | 嵌入式校招笔记 使用策略 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式校招笔记 使用策略 - 6a1d56c60000000035031133.md |
| 137 | Bookmarks | 嵌入式爱好者的常用软件分享 | Eedgcoder | embedded-technical | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式爱好者的常用软件分享 - 6a5b56ae000000001c00f973.md |
| 138 | Bookmarks | 嵌入式秋招备考，八股面试题到底怎么背？ | 梦嘉的硬件笔记 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式秋招备考，八股面试题到底怎么背？ - 6a3ff7e7000000000f02a3f2.md |
| 139 | Bookmarks | 嵌入式秋招，比起刷题更应该想清楚这五件事 | 飞出金陵的烤鸭 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式秋招，比起刷题更应该想清楚这五件事 - 6a58c03c000000000100c00f.md |
| 140 | Bookmarks | 嵌入式软件秋招算法基础太烂 | 枫林晚 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式软件秋招算法基础太烂 - 6a74a68100000000270211a3.md |
| 141 | Bookmarks | 嵌入式面试害怕问到不会的怎么办？ | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式面试害怕问到不会的怎么办？ - 6a606518000000000f00709e.md |
| 142 | Bookmarks | 已获某头部芯片原厂暑期实习认证 | 早睡冠军🏆 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/已获某头部芯片原厂暑期实习认证 - 6a6a0900000000001002679e.md |
| 143 | Bookmarks | 建立表达力（面试）训练知识库，变化可追踪 | 张张慢半拍 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/建立表达力（面试）训练知识库，变化可追踪 - 6a73315d000000000502007d.md |
| 144 | Bookmarks | 强推读项目代码神器！ | LancFr | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/强推读项目代码神器！ - 69d7c0c50000000023016adb.md |
| 145 | Bookmarks | 强烈建议大家搭建一个自己的个人网站。 | 小盖 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/强烈建议大家搭建一个自己的个人网站。 - 6a58d371000000000f02ab0a.md |
| 146 | Bookmarks | 我使用频率最高的 Obsidian Skill | 屁一天放多少个比较合适 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我使用频率最高的 Obsidian Skill - 6a4f30810000000011004424.md |
| 147 | Bookmarks | 我做了一个 Skill：不只写简历，而是养简历 | Neil | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我做了一个 Skill：不只写简历，而是养简历 - 6a3914a10000000021014bdb.md |
| 148 | Bookmarks | 我做了个简历Skill，一句话直出PDF🔥 | 库森说AI | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我做了个简历Skill，一句话直出PDF🔥 - 6a39480900000000080305c2.md |
| 149 | Bookmarks | 我做的五款Obsidian插件，已上架社区商店 | 焦应行 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我做的五款Obsidian插件，已上架社区商店 - 6a680763000000000f016856.md |
| 150 | Bookmarks | 我实际开发中的五个skills推荐 | 0xApple | graduate-research | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我实际开发中的五个skills推荐 - 6a6de9170000000033031709.md |
| 151 | Bookmarks | 我把 175 个 AI Skill 做成了本地资产台 | 文峰AI笔记 | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我把 175 个 AI Skill 做成了本地资产台 - 6a4a915700000000210088a9.md |
| 152 | Bookmarks | 我把codex自带的桌面宠物改成了噜噜 | 越好（好运版 | ai-agent-workflow | 仅外部参考（工具/资讯） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我把codex自带的桌面宠物改成了噜噜 - 6a521a0100000000070115aa.md |
| 153 | Bookmarks | 我把obsidian做成了霍格沃兹 | Ian | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我把obsidian做成了霍格沃兹 - 6a40aa510000000017029106.md |
| 154 | Bookmarks | 我把收藏夹接进Obsidian，还做了 Skill！ | 阿丢本丢 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我把收藏夹接进Obsidian，还做了 Skill！ - 6a564c1e0000000015024abe.md |
| 155 | Bookmarks | 我用 workbuddy 实现了秋招岗位推送自动化 | 一只妮可的材料鼠🐭 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我用 workbuddy 实现了秋招岗位推送自动化 - 6a5b6e75000000001f01f2d9.md |
| 156 | Bookmarks | 我的 Windows 桌面终于不想藏了 | 方木做DoStack | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我的 Windows 桌面终于不想藏了 - 6a3953de0000000007011cd9.md |
| 157 | Bookmarks | 我的天，这个工具忒厉害了吧！ | 沐飞的 AI 圈 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我的天，这个工具忒厉害了吧！ - 6a771c4e0000000008010193.md |
| 158 | Bookmarks | 所以科研是什么 | 非典型在读momo | graduate-research | 仅外部参考（考情/个人经历） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/所以科研是什么 - 6a684e05000000000f03c92e.md |
| 159 | Bookmarks | 手搓了一个毛玻璃Zotero插件 | W.W | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/手搓了一个毛玻璃Zotero插件 - 6a5633400000000022019fe0.md |
| 160 | Bookmarks | 找实习是一种逃避 | 立志做卷王 | career-and-employment | 方法候选（求职/经验复盘） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/找实习是一种逃避 - 6a687639000000002201bc2c.md |
| 161 | Bookmarks | 找得到！ | Leileilayle | embedded-career | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/找得到！ - 6a620a3c000000000f03e735.md |
| 162 | Bookmarks | 把 Mac 顶栏变成我的效率中枢 | mico | knowledge-management | 方法候选（知识库/笔记工作流） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/把 Mac 顶栏变成我的效率中枢 - 6a4cf6c4000000000f01780c.md |
| 163 | Bookmarks | 把 Windows 和 Codex 改成自己喜欢的样子 | 芒果味雪糕 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/把 Windows 和 Codex 改成自己喜欢的样子 - 6a53bf44000000001003e467.md |
| 164 | Bookmarks | 把面试skill升级了  这次你一定要提现！ | 九九渊 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/把面试skill升级了 这次你一定要提现！ - 6a687827000000001302edcc.md |
| 165 | Bookmarks | 把面试准备SOP做成了Skill | 长尾敲字员 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/把面试准备SOP做成了Skill - 6a15195b000000000803ff72.md |
| 166 | Bookmarks | 拼多多macbook air m5安全下车！ | 小豆子 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/拼多多macbook air m5安全下车！ - 6a4683610000000011012a2e.md |
| 167 | Bookmarks | 接上集：我做了个面试深挖简历skill！ | 上司同事在天堂 | ai-knowledge-workflow | 方法候选（AI辅助求职/面试流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/接上集：我做了个面试深挖简历skill！ - 6a2a0d9f000000001c027f6f.md |
| 168 | Bookmarks | 推荐一下困哥的SSP笔记 | 木兔 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/推荐一下困哥的SSP笔记 - 6a658195000000000f007d3e.md |
| 169 | Bookmarks | 收藏几千篇终于能用了，第二大脑快速构建🧠 | 坦丁｜场景化AI知识库 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/收藏几千篇终于能用了，第二大脑快速构建🧠 - 6a2bff2f000000003502a964.md |
| 170 | Bookmarks | 教你一秒924个随机笔记转卡组(所有笔记软件 | 橘子大主包 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/教你一秒924个随机笔记转卡组(所有笔记软件 - 6a53af50000000001003f486.md |
| 171 | Bookmarks | 文科生用cc+ob做的人生系统Skill（附原文件 | 蔡不菜（AI版） | ai-agent-workflow | 方法候选（工具工作流） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/文科生用cc+ob做的人生系统Skill（附原文件 - 6a109d66000000003700fbb9.md |
| 172 | Bookmarks | 新手如何一个月内学会力扣hot100，干货满满 | momo | algorithm-learning | 方法候选（算法学习/复习） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/新手如何一个月内学会力扣hot100，干货满满 - 68edc98f0000000007033e13.md |
| 173 | Bookmarks | 时隔半年，又发现了5个Mac必备的APP | 科技阿黑 | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/时隔半年，又发现了5个Mac必备的APP - 6a5b04d1000000001102e1e7.md |
| 174 | Bookmarks | 更适合中国宝宝体质的面试复盘skill！ | 上司同事在天堂 | ai-knowledge-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/更适合中国宝宝体质的面试复盘skill！ - 6a75bc5b00000000220331cd.md |
| 175 | Bookmarks | 有了这个skill 程序员不知道是该哭还是笑 | 天才程序员杜少峰 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/有了这个skill 程序员不知道是该哭还是笑 - 6a56e91c000000000803ce3f.md |
| 176 | Bookmarks | 期末速成/考研/考公·本科生/研究生有救了！ | 一叶知秋 | ai-knowledge-workflow | 方法候选（文献/研究工作流） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/期末速成 考研 考公·本科生 研究生有救了！ - 6a059fa40000000037036073.md |
| 177 | Bookmarks | 杨立昆转发的OCR 到底牛在哪? | 能工智人Jack | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/杨立昆转发的OCR 到底牛在哪 - 6a60a683000000001f01d3fe.md |
| 178 | Bookmarks | 求推荐一把能适配mac办公用的键盘 | momo | apple-digital | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/求推荐一把能适配mac办公用的键盘 - 6a5ad737000000001101d6cb.md |
| 179 | Bookmarks | 求改善颈椎压迫神经供血不足头晕好方法 | 我爱布丁 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/求改善颈椎压迫神经供血不足头晕好方法 - 653edb67000000001e03f7b0.md |
| 180 | Bookmarks | 用Obsidian批量做 Anki：我只用这一条规则 | 水水狼 | knowledge-management | 方法候选（记忆/复习工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/用Obsidian批量做 Anki：我只用这一条规则 - 68beb536000000001d001cb0.md |
| 181 | Bookmarks | 用obsidian+claude找到一份大厂工作 | 哈泰利 | ai-knowledge-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/用obsidian+claude找到一份大厂工作 - 69e3a9d3000000001e00f8a6.md |
| 182 | Bookmarks | 用obsidian做导图也不错诶 | orangewestt | ai-knowledge-workflow | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/用obsidian做导图也不错诶 - 6a6aecc0000000000a0382c7.md |
| 183 | Bookmarks | 省钱近一半，专治GPT5.6代码防御skill | 句芒QiMen | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/省钱近一半，专治GPT5.6代码防御skill - 6a759604000000002202f0a5.md |
| 184 | Bookmarks | 看过的最简单的obsidian+anki教程 | 雷神猫 | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/看过的最简单的obsidian+anki教程 - 68dbf839000000000703ad33.md |
| 185 | Bookmarks | 研二上尾巴临港中微半导体软件实习 | 蜗牛大腿 | embedded-career | 方法候选（求职/简历流程） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/研二上尾巴临港中微半导体软件实习 - 6923ea52000000001e0237b8.md |
| 186 | Bookmarks | 科研skill从夯到拉锐评 | 白天研究生 | graduate-research | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/科研skill从夯到拉锐评 - 6a5752ba00000000070247eb.md |
| 187 | Bookmarks | 科研人必备的12个codex Skills | 学术会议前哨 | graduate-research | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/科研人必备的12个codex Skills - 6a470d930000000015027730.md |
| 188 | Bookmarks | 秦昊减肥法！ | 阿婷在减肥 | health-lifestyle | 仅外部参考（正文不足） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/秦昊减肥法！ - 69d2649600000000220268ff.md |
| 189 | Bookmarks | 程序员必装！手机指挥AI写代码太爽了 | AI创意玩家 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/程序员必装！手机指挥AI写代码太爽了 - 6a7555a3000000002500062f.md |
| 190 | Bookmarks | 笔记别再写完就忘了 | 灰灰灰原 | ai-knowledge-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/笔记别再写完就忘了 - 6a37a1820000000011010a09.md |
| 191 | Bookmarks | 第五家嵌入式岗面试，给大家开个上帝视角 | 再吃亿大口 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/第五家嵌入式岗面试，给大家开个上帝视角 - 6a602b54000000001003ebea.md |
| 192 | Bookmarks | 终于把 Mac 桌面那味儿搬过来了🍎 | 佩林可 | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/终于把 Mac 桌面那味儿搬过来了🍎 - 6a4e5ec4000000002101a47c.md |
| 193 | Bookmarks | 给自己做了个Mac的桌面插件... | 我要不断进步 | ai-agent-workflow | 仅外部参考（工具/资讯） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/给自己做了个Mac的桌面插件... - 6966128b000000001a035b5a.md |
| 194 | Bookmarks | 芯火计划 ／ 在纳芯微的每一天都充满电量🔋 | 213 | career-and-employment | 案例/外部参考 | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/芯火计划 在纳芯微的每一天都充满电量🔋 - 6a546c83000000001c024bce.md |
| 195 | Bookmarks | 苹果设备桌面美化套装：iPhone + Mac + iPad | letschips | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/苹果设备桌面美化套装：iPhone + Mac + iPad - 6a37f00c000000001101d0a3.md |
| 196 | Bookmarks | 菲区福利来了，人民币大约 60 多元一个月 | 彝顺讲AI | ai-agent-workflow | 仅外部参考（工具/资讯） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/菲区福利来了，人民币大约 60 多元一个月 - 6a69aa4b000000000301f56a.md |
| 197 | Bookmarks | 被Grapify这波涨幅惊到了！ | 帆帆不加班～ | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/被Grapify这波涨幅惊到了！ - 6a313279000000000f004dba.md |
| 198 | Bookmarks | 装了几十个Skill后我才发现自己装错了方向 | 小西 AI不释手 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/装了几十个Skill后我才发现自己装错了方向 - 6a029cec00000000360032a4.md |
| 199 | Bookmarks | 论文精读skill/自动化精读报告生成 | Jasmineee | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/论文精读skill 自动化精读报告生成 - 6a3a71e200000000210156f8.md |
| 200 | Bookmarks | 试过各种agent，DeepSeek还是接Claude Code好用 | 嘛咪嘛咪哄 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/试过各种agent，DeepSeek还是接Claude Code好用 - 6a477cc50000000007027088.md |
| 201 | Bookmarks | 转行嵌入式linux，c/c++至少学到什么程度？ | 不搭xhs | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/转行嵌入式linux，c c++至少学到什么程度？ - 6a61d8d3000000002201b940.md |
| 202 | Bookmarks | 迈瑞医疗嵌入式软件开发一二面面经它来啦！ | 考研Bboy俏 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/迈瑞医疗嵌入式软件开发一二面面经它来啦！ - 6a701056000000002402c3cd.md |
| 203 | Bookmarks | 这么伟大的Zotero插件这得有人给我颁个奖吧 | W.W | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/这么伟大的Zotero插件这得有人给我颁个奖吧 - 6a57bc1c0000000011011cdd.md |
| 204 | Bookmarks | 那个考研二战的学姐消失在了朋友圈 | 哒哒（碎碎念版） | graduate-research | 仅外部参考（考情/个人经历） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/那个考研二战的学姐消失在了朋友圈 - 6527fb4f000000001a0200ae.md |
| 205 | Bookmarks | 颈椎舒服了 | 猫宁养生记 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/颈椎舒服了 - 652ce8be000000001e02c286.md |
| 206 | Bookmarks | 高通｜软件工程师面经 | 阿泽求职记📓 | embedded-career | 案例/题目清单（外部参考） | E2 | maybe | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/高通｜软件工程师面经 - 6a596656000000001d00dcbb.md |
| 207 | Bookmarks | 高通｜驱动开发工程师面经 | 校招阿橙🍊 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/高通｜驱动开发工程师面经 - 6a55b6bd000000000f01dc13.md |
| 208 | Bookmarks | 🎯一天刷遍LeetCode Hot 100 | 阿朱学长资料 | algorithm-learning | 方法候选（算法学习/复习） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/🎯一天刷遍LeetCode Hot 100 - 6a10582700000000060234f5.md |
| 209 | Bookmarks | 💫用MyDockFinder工具，从Windows变Mac | 你好张同学 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/💫用MyDockFinder工具，从Windows变Mac - 64b6a2760000000012012be7.md |
| 210 | Bookmarks | 📝 10天掉10斤·狠人食谱安排 | 奶思兔米思油 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E1 | no | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/📝 10天掉10斤·狠人食谱安排 - 6a0970e8000000003601ea17.md |
| 211 | Bookmarks | 🔥codex必装的8个skill | 铲屎官阿沐的Ai日常 | ai-agent-workflow | 方法候选（工具工作流） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/🔥codex必装的8个skill - 6a42195c000000002103d6e1.md |
| 212 | Bookmarks | 🔧 你的小红书收藏夹在吃灰吗？ | 陈什么夏 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E2 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/🔧 你的小红书收藏夹在吃灰吗？ - 69cab968000000001f000065.md |
| 213 | Bookmarks | 🤚你已经完全掌握了如何写一份完美简历 | 九九渊 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/🤚你已经完全掌握了如何写一份完美简历 - 6a79a0cc0000000033035229.md |
| 214 | Bookmarks | 🥬嵌入式实习秋招经验分享——八股篇 | 进击的大白菜 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | external-reference | 小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/🥬嵌入式实习秋招经验分享——八股篇 - 6771ff3d0000000014026f7c.md |
| 215 | Likes | 03年 自动化女拿到嵌入式offer心得 | 爱喵喵的小鱼 | embedded-career | 方法候选（求职/简历流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/03年 自动化女拿到嵌入式offer心得 - 6a58b005000000000402abe6.md |
| 216 | Likes | 0831生物医学工程第四轮学科评估结果 | 小张学姐 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/0831生物医学工程第四轮学科评估结果 - 69c3bd82000000001a022536.md |
| 217 | Likes | 0实习双非硕｜备战秋招 | 木兔 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/0实习双非硕｜备战秋招 - 6a76d28f0000000026036444.md |
| 218 | Likes | 200斤→140斤｜男生通用版减脂计划 | 花小锦 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/200斤→140斤｜男生通用版减脂计划 - 6a6762a20000000004028335.md |
| 219 | Likes | 2026年了还在刷hot100？🥹省时间直接看这里 | 阿渡的上岸笔记 | algorithm-learning | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/2026年了还在刷hot100？🥹省时间直接看这里 - 69f227f10000000036030dea.md |
| 220 | Likes | 211本硕 Linux驱动/应用方向 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/211本硕 Linux驱动 应用方向 - 69fd7cf20000000035039e78.md |
| 221 | Likes | 26届 双非机械硕 转嵌入式 秋招总结 | 嘿嘿嘿123 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/26届 双非机械硕 转嵌入式 秋招总结 - 69419cee000000001b024e42.md |
| 222 | Likes | 27届嵌入式，简历没改完能先投吗 | 胜哥-嵌入式面试官 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/27届嵌入式，简历没改完能先投吗 - 6a7c3ed1000000002c003c80.md |
| 223 | Likes | 27秋招day7 | Ankew | career-and-employment | 方法候选（求职/经验复盘） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/27秋招day7 - 6a69e51100000000140048f1.md |
| 224 | Likes | 39岁嵌入式软件工程师现状 | 青春不过一念间 | embedded-career | 案例/经验参考 | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/39岁嵌入式软件工程师现状 - 6a39df50000000001700840e.md |
| 225 | Likes | 3D区作者推荐第十期 | 作者已投喂 | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/3D区作者推荐第十期 - 6a6a0c05000000001400523c.md |
| 226 | Likes | 60分钟让claude从聊天工具变成AI工作流助手 | 不吃淡水鱼 | ai-agent-workflow | 方法候选（工具工作流） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/60分钟让claude从聊天工具变成AI工作流助手 - 6a3b8e2e000000001101aa46.md |
| 227 | Likes | 8天整个人掉了9.4斤！(含食谱) | 🍊橘子小姐的养味日记 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/8天整个人掉了9.4斤！(含食谱) - 6a7ab46a00000000280005cd.md |
| 228 | Likes | 95年大龄的上理的研究生，目前在自学嵌入式，感觉有点来不及了，论文一篇中科院三区 | msw. | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/95年大龄的上理的研究生，目前在自学嵌入式，感觉有点来不及了，论文一篇中科院三区 - 6a76f8fd0000000033013140.md |
| 229 | Likes | A 社的算盘是，Fable 5 太占 GPU 了，他们 GPU 又不够，因此放 | 橘AI | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/A 社的算盘是，Fable 5 太占 GPU 了，他们 GPU 又不够，因此放 - 6a544a79000000001c027e6b.md |
| 230 | Likes | AI 浏览器已经成为主流 | letschips | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/AI 浏览器已经成为主流 - 6a1d354a000000003503a9eb.md |
| 231 | Likes | ChatGPT和Codex合并，预演了下一代工作方式 | 瑞哥那 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/ChatGPT和Codex合并，预演了下一代工作方式 - 6a219f1d0000000038036ddc.md |
| 232 | Likes | Claude千万别裸装，这几个skills必须装上！ | 赛博猫2077 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Claude千万别裸装，这几个skills必须装上！ - 6a255ee8000000001c02788b.md |
| 233 | Likes | Claude被迫转Codex | 0xD800 | ai-agent-workflow | 仅外部参考（工具/资讯） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Claude被迫转Codex - 6a6d980f00000000250095b7.md |
| 234 | Likes | Codex 新功能 | 小爷🤑商业贩卖日记 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Codex 新功能 - 6a358a43000000002100a157.md |
| 235 | Likes | Codex 现在能用国产模型了 | 天哥 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Codex 现在能用国产模型了 - 6a33c61900000000170085a7.md |
| 236 | Likes | Codex+obsidian搭建设计师的自生长知识库 | 浪味仙女爱设计 | ai-knowledge-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Codex+obsidian搭建设计师的自生长知识库 - 6a2e97ef00000000080269be.md |
| 237 | Likes | Codex该如何接入国产大模型？ | 橙知Ai | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Codex该如何接入国产大模型？ - 6a2a245c0000000006035869.md |
| 238 | Likes | M1 Pro 继续记录，M2 Pro 今天建档 | 一点都不机智的江先生 | misc-external | 仅外部参考（观点/资讯/消费内容） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/M1 Pro 继续记录，M2 Pro 今天建档 - 6a700883000000003300feae.md |
| 239 | Likes | Mac Sai：CleanMyMac 免费替代 | 掘金铲子 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Mac Sai：CleanMyMac 免费替代 - 6a31e015000000001503ff09.md |
| 240 | Likes | NuPhy air75 V3避雷贴 | Avaia | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/NuPhy air75 V3避雷贴 - 69df7c4100000000210076af.md |
| 241 | Likes | Obsidian Weave系列插件有官网啦 | 粗言细语 | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Obsidian Weave系列插件有官网啦 - 6a79b9b20000000008012cdb.md |
| 242 | Likes | Obsidian 背景设置超轻松！ | 墨一 | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Obsidian 背景设置超轻松！ - 6a7614560000000022010472.md |
| 243 | Likes | Obsidian+AI，3步搭建你的第二大脑 | 铲屎官阿沐的Ai日常 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Obsidian+AI，3步搭建你的第二大脑 - 6a4e09ee00000000220161cd.md |
| 244 | Likes | Obsidian插件系列：Tasks | 研究型成长笔记 | knowledge-management | 方法候选（知识库/笔记工作流） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Obsidian插件系列：Tasks - 69cb1d60000000001a02e268.md |
| 245 | Likes | VS Code中使用Codex插件教程（实测可用） | 泥车交通人在沪漂 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/VS Code中使用Codex插件教程（实测可用） - 695d4962000000000a03cc46.md |
| 246 | Likes | Zread CLI + Skill，一起发了! | Zread | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/Zread CLI + Skill，一起发了! - 69dcb7de000000001d01e373.md |
| 247 | Likes | gpt有像Voyager一样的插件吗 | 略略略 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/gpt有像Voyager一样的插件吗 - 69eed8080000000022028a57.md |
| 248 | Likes | iPhone16新手验机教程｜产地🆚版本 | Upwatch | apple-digital | 仅外部参考（设备/软件/消费经验） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/iPhone16新手验机教程｜产地🆚版本 - 66eff353000000000c018094.md |
| 249 | Likes | obsidian Task管理时间轴 | 256Danial | misc-external | 仅外部参考（观点/资讯/消费内容） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/obsidian Task管理时间轴 - 67dedd74000000001b027483.md |
| 250 | Likes | obsidian 办公学习 | letschips | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/obsidian 办公学习 - 6a77f8cc000000002c001120.md |
| 251 | Likes | obsidian 搭配任何 Agent 都是最佳的 | letschips | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/obsidian 搭配任何 Agent 都是最佳的 - 6a4488e2000000001102ed64.md |
| 252 | Likes | obsidian+anki：985硕的考研背书王炸软件 | wowotou | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/obsidian+anki：985硕的考研背书王炸软件 - 6836d86f0000000023000577.md |
| 253 | Likes | obsidian无纸化考公刷题 | 多达悉🍏 | algorithm-learning | 方法候选（算法学习/复习） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/obsidian无纸化考公刷题 - 6a6033b9000000001b01ebbe.md |
| 254 | Likes | /teach skill，成为高级程序员的步骤！ | 机器之心 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/teach skill，成为高级程序员的步骤！ - 6a2f9f9600000000150257e6.md |
| 255 | Likes | 【已解决】更新后codex无法连接移动端？ | 金色大鹅 | ai-agent-workflow | 仅外部参考（工具/资讯） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/【已解决】更新后codex无法连接移动端？ - 6a511eaa000000002201bf8f.md |
| 256 | Likes | 一个skill让网页端GPT成为codex的最强助理 | Neo关于AI | ai-agent-workflow | 方法候选（工具配置/用量管理） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/一个skill让网页端GPT成为codex的最强助理 - 6a4e15ab0000000011012f6e.md |
| 257 | Likes | 一周速成LVGL | 嵌入式15年经验带新人 | embedded-technical | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/一周速成LVGL - 6a35e12a00000000080265ef.md |
| 258 | Likes | 一天半内爱上 DeepWiki 程序员必备神器 | AIGC之眼 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/一天半内爱上 DeepWiki 程序员必备神器 - 680f04ff0000000022037dc0.md |
| 259 | Likes | 上师大研究生调档 | bean | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上师大研究生调档 - 69f173030000000022029803.md |
| 260 | Likes | 上海嵌入式相关企业汇总-1 | 幸好有F和弦 | embedded-career | 方法候选（求职/简历流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上海嵌入式相关企业汇总-1 - 6a3b75d3000000001003fac2.md |
| 261 | Likes | 上海嵌入式相关企业汇总-2 | 幸好有F和弦 | embedded-technical | 案例/经验参考 | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上海嵌入式相关企业汇总-2 - 6a4370c3000000000f02b29c.md |
| 262 | Likes | 上海师范大学农艺与种业初试资料 | 颜料蹭到菜叶子了 | graduate-research | 仅外部参考（考情/个人经历） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上海师范大学农艺与种业初试资料 - 69ce8a9f0000000022000487.md |
| 263 | Likes | 上海师范大学农艺与种业初试资料+参考书 | 颜料蹭到菜叶子了 | graduate-research | 仅外部参考（考情/个人经历） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上海师范大学农艺与种业初试资料+参考书 - 69e9f41c0000000020000802.md |
| 264 | Likes | 上海某985 | 诸霁 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上海某985 - 6a54b2a0000000002200848e.md |
| 265 | Likes | 上海电力大学还是上海理工大学？ | 上电球知道（上海电力大学） | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上海电力大学还是上海理工大学？ - 6a1e3a5500000000370353e8.md |
| 266 | Likes | 上理26机械硕士就业地图｜机器人方向 | 上理研学堂 | graduate-research | 仅外部参考（考情/个人经历） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上理26机械硕士就业地图｜机器人方向 - 6a7443a3000000000503043e.md |
| 267 | Likes | 上理867自控硕士就业去向｜岗位与薪资参考 | 上理研学堂 | embedded-career | 方法候选（求职/简历流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上理867自控硕士就业去向｜岗位与薪资参考 - 6a7bf3820000000028004876.md |
| 268 | Likes | 上理最爱思餐厅三楼小炒的人 | 我爱富士大鹅 | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/上理最爱思餐厅三楼小炒的人 - 6a3528ac0000000007029c1c.md |
| 269 | Likes | 个人skill分享…！拯救你的期末周复习 | MohsiChi | ai-knowledge-workflow | 方法候选（文献/研究工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/个人skill分享…！拯救你的期末周复习 - 6a1fb7a0000000003601ce03.md |
| 270 | Likes | 二手 M1 Pro MacBook 蹲价 day24：有降价 | 一点都不机智的江先生 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/二手 M1 Pro MacBook 蹲价 day24：有降价 - 6a6071c90000000009034e22.md |
| 271 | Likes | 他真的把我们当小孩教Codex | AI 梦想家 | algorithm-learning | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/他真的把我们当小孩教Codex - 6a447a580000000022008a95.md |
| 272 | Likes | 以前人帮 AI 找资料， 现 AI 自己去拿资料 | AI科技猎人 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/以前人帮 AI 找资料， 现 AI 自己去拿资料 - 6a606ff9000000000f005d73.md |
| 273 | Likes | 依旧是28届 日常实习面筋集合 | 爱困觉的程序员 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/依旧是28届 日常实习面筋集合 - 6a7474480000000024027736.md |
| 274 | Likes | 六月找到嵌入式实习! | 工科女的答疑日常 | embedded-career | 方法候选（求职/简历流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/六月找到嵌入式实习! - 6a313165000000001603dbee.md |
| 275 | Likes | 关于95新 MacBook Pro M1pro 32+512 成功下车，也是终于 | 小苏 | health-lifestyle | 仅外部参考（个人健康/饮食经验） | E2 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/关于95新 MacBook Pro M1pro 32+512 成功下车，也是终于 - 6a6aed5c000000000f033ed4.md |
| 276 | Likes | 关于我想买 Mac mini m5这件事大概率成不了 | 姜大大不太会 | apple-digital | 仅外部参考（设备/软件/消费经验） | E2 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/关于我想买 Mac mini m5这件事大概率成不了 - 6a1c4c8b000000000702d140.md |
| 277 | Likes | 分享一个自用Obsidian主题 | 星团读博日记 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/分享一个自用Obsidian主题 - 6a7b4c7d00000000280332c1.md |
| 278 | Likes | 分享一期粉丝嵌入式面经(实习版，mcu岗) | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/分享一期粉丝嵌入式面经(实习版，mcu岗) - 6a54698b000000001003ec19.md |
| 279 | Likes | 单2硕 嵌入式全栈选手 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/单2硕 嵌入式全栈选手 - 69a5548e0000000026030618.md |
| 280 | Likes | 即览：手机上看 Markdown、HTML，这么难？ | 歸藏 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/即览：手机上看 Markdown、HTML，这么难？ - 6a20ff730000000036018c28.md |
| 281 | Likes | 双非本985硕嵌入式斩获10+大厂offer | 月色倾城 | embedded-career | 案例/题目清单（外部参考） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/双非本985硕嵌入式斩获10+大厂offer - 6764f8bb000000000900e92d.md |
| 282 | Likes | 双非硕士0基础转嵌入式，3个月拿9个offer | 梦嘉的硬件笔记 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/双非硕士0基础转嵌入式，3个月拿9个offer - 6a00682c000000003502a23d.md |
| 283 | Likes | 双非硕士找嵌入式工作，简历求点评 | momo | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/双非硕士找嵌入式工作，简历求点评 - 6a69a81e000000000f01fd64.md |
| 284 | Likes | 双非硕第25投-小米 | 天若有晴 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/双非硕第25投-小米 - 6a775573000000002403fef8.md |
| 285 | Likes | 双非硕，MCU与Linux双修 | 爱困觉的程序员 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/双非硕，MCU与Linux双修 - 69eafc2a0000000013030802.md |
| 286 | Likes | 同济大学恶性借外套事件 | 蛇蛇一格电（黑化中） | misc-external | 仅外部参考（观点/资讯/消费内容） | E2 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/同济大学恶性借外套事件 - 69f0d076000000001a0349db.md |
| 287 | Likes | 后悔走嵌入式Linux音视频了，找不到实习？ | 工科女的答疑日常 | embedded-career | 方法候选（求职/简历流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/后悔走嵌入式Linux音视频了，找不到实习？ - 69ecaa2f000000003701e4dc.md |
| 288 | Likes | 后续：我姐打电话给我说姐夫已经进去了 | 下一章见 | misc-external | 仅外部参考（观点/资讯/消费内容） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/后续：我姐打电话给我说姐夫已经进去了 - 6a7a873b0000000025005b95.md |
| 289 | Likes | 哪个冤大头涨价才入手MacBook Air M5 | 针尖对麦当劳🥕 | apple-digital | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/哪个冤大头涨价才入手MacBook Air M5 - 6a51082800000000060207a3.md |
| 290 | Likes | 备战秋招｜八股背诵中｜8.6 | 木兔 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/备战秋招｜八股背诵中｜8.6 - 6a736c3d000000002c0009d0.md |
| 291 | Likes | 多年不联系的同学借钱后续1 | 比山高 | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/多年不联系的同学借钱后续1 - 6a614f90000000001b01e69a.md |
| 292 | Likes | 好skill难找？我vibecoding了个skillhot | Sav同学 | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/好skill难找？我vibecoding了个skillhot - 6a3ea4df0000000007012375.md |
| 293 | Likes | 好眼熟她是谁 | king | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/好眼熟她是谁 - 6a3e0f5b00000000210185f0.md |
| 294 | Likes | 好险，几次擦枪走火的瞬间 | 布谷老师Pro | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/好险，几次擦枪走火的瞬间 - 69f87a7b00000000350270d3.md |
| 295 | Likes | 如何7天过完hot100 | 铁血娘子（备战秋招版） | algorithm-learning | 方法候选（算法学习/复习） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如何7天过完hot100 - 69007e340000000003034c0a.md |
| 296 | Likes | 如何做好嵌入式项目，面试通过率90%？ | 工科女的日常 | embedded-career | 案例/题目清单（外部参考） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如何做好嵌入式项目，面试通过率90%？ - 69d38a0d000000002202499a.md |
| 297 | Likes | 如何把桌面端 Agent 接入 DeepSeek V4 🐳 | 艾林AI | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如何把桌面端 Agent 接入 DeepSeek V4 🐳 - 6a31913500000000220181ed.md |
| 298 | Likes | 如何最大限度的节省codex额度 | 精进的程序员 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如何最大限度的节省codex额度 - 6a257465000000002103e554.md |
| 299 | Likes | 如何短时间内完成一个认可度高的嵌入式项目 | 不搭xhs | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如何短时间内完成一个认可度高的嵌入式项目 - 69cb5724000000001d019800.md |
| 300 | Likes | 如果你用过 DeepWiki，会爱上 Code Wiki | AI圈的那些事 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如果你用过 DeepWiki，会爱上 Code Wiki - 691862100000000004010133.md |
| 301 | Likes | 如果我的Obsidian只装5个插件 | 三木 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/如果我的Obsidian只装5个插件 - 6a647106000000000101e9cf.md |
| 302 | Likes | 字节跳动-Camera软件开发-移动OS-实习-一面 | 火锅不能没有芝麻酱 | embedded-career | 案例/题目清单（外部参考） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/字节跳动-Camera软件开发-移动OS-实习-一面 - 69b51783000000002102c37b.md |
| 303 | Likes | 宝宝，不要再抱着文档存记忆了！ | 派派日记📔 | ai-agent-workflow | 方法候选（工具工作流） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/宝宝，不要再抱着文档存记忆了！ - 6a6abb0e0000000013025a31.md |
| 304 | Likes | 实习就月薪过万真的有狠狠爽到了 | 菠萝头 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/实习就月薪过万真的有狠狠爽到了 - 6a78413000000000060063ed.md |
| 305 | Likes | 导师杨昀，在圈内算是彻底 “社死” 了。不 | 幸运李 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/导师杨昀，在圈内算是彻底 “社死” 了。不 - 6a17b53d0000000035022367.md |
| 306 | Likes | 小米手环助你随时随地vibecoding | 不正经设计师LEN | ai-agent-workflow | 方法候选（工具工作流） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/小米手环助你随时随地vibecoding - 6a40f67b000000000f02873d.md |
| 307 | Likes | 小米汽车汽车专项实习 | 啊咧咧 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/小米汽车汽车专项实习 - 6a2fc4ee000000000702497d.md |
| 308 | Likes | 小米面试实录 | 车软开发小学妹 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/小米面试实录 - 67da8a810000000006028d98.md |
| 309 | Likes | 嵌入式linux项目日志调试讲解 | 不搭xhs | embedded-career | 方法候选（学习路线/复习流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式linux项目日志调试讲解 - 6a55fbbb0000000022017cf8.md |
| 310 | Likes | 嵌入式冲机器人，今年行情汇总，关于前景 | 工科女的日常 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式冲机器人，今年行情汇总，关于前景 - 6a68ad1e000000001f01cf47.md |
| 311 | Likes | 嵌入式实习 | 猛嵌 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式实习 - 6a10213600000000060352d1.md |
| 312 | Likes | 嵌入式实习 | 猛嵌 | embedded-career | 方法候选（求职/简历流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式实习 - 6a5430650000000007013642.md |
| 313 | Likes | 嵌入式实习 | 猛嵌 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式实习 - 6a7bbdab000000003300e802.md |
| 314 | Likes | 嵌入式实习三个月了…真的好喜欢我的工作 | 部分活来 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式实习三个月了…真的好喜欢我的工作 - 6a3eb6e70000000007028084.md |
| 315 | Likes | 嵌入式实习生 300元/天，base上海 | HR-小之 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式实习生 300元 天，base上海 - 6a21a980000000002202fd33.md |
| 316 | Likes | 嵌入式找实习焚决 | 爱困觉的程序员 | embedded-career | 方法候选（求职/简历流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式找实习焚决 - 6a52dab8000000000f007864.md |
| 317 | Likes | 嵌入式校招撞车项目总结 | 飞出金陵的烤鸭 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式校招撞车项目总结 - 69ef74560000000036018638.md |
| 318 | Likes | 嵌入式秋招准备，不要只看不做 | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式秋招准备，不要只看不做 - 6a2bc2d700000000220261c3.md |
| 319 | Likes | 嵌入式秋招经验-项目打磨篇 | 哆啦B梦 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式秋招经验-项目打磨篇 - 693963df000000001d03cb48.md |
| 320 | Likes | 嵌入式简历修改 | 爱困觉的程序员 | embedded-career | 方法候选（求职/简历流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式简历修改 - 6a7817490000000033019f1d.md |
| 321 | Likes | 嵌入式项目 | 若云zn | embedded-career | 方法候选（求职/简历流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式项目 - 69ef8b840000000035024a60.md |
| 322 | Likes | 嵌入式项目 简历模版 | 爱困觉的程序员 | embedded-career | 方法候选（求职/简历流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式项目 简历模版 - 6a2635870000000035028f42.md |
| 323 | Likes | 嵌入式项目推荐 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/嵌入式项目推荐 - 69f8188e000000003501c7f9.md |
| 324 | Likes | 已开源!一张看板管住整个嵌入式秋招 | 飞出金陵的烤鸭 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/已开源!一张看板管住整个嵌入式秋招 - 6a53834d000000001503e12b.md |
| 325 | Likes | 建议大家都去做属于自己的秋招工作台 | 陈钱罐up | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/建议大家都去做属于自己的秋招工作台 - 6a6c08a30000000006004442.md |
| 326 | Likes | 开源了一个Hot100速通刷题知识库 | 不吃胡萝卜🥕 | algorithm-learning | 案例/资料参考 | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/开源了一个Hot100速通刷题知识库 - 6a36e8d20000000011013b9b.md |
| 327 | Likes | 强推读项目代码神器！ | LancFr | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/强推读项目代码神器！ - 69d7c0c50000000023016adb.md |
| 328 | Likes | 很享受的一段日子 | 立志做卷王 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/很享受的一段日子 - 6a6df940000000002201731f.md |
| 329 | Likes | 想入行Linux应用层开发 | 椰椰 | embedded-career | 方法候选（学习路线/复习流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/想入行Linux应用层开发 - 6a6f5ccd0000000022014f85.md |
| 330 | Likes | 我做了个阿酥简历skill 绝对够味 | momo | graduate-research | 仅外部参考（考情/个人经历） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/我做了个阿酥简历skill 绝对够味 - 6a7d601f000000002803204e.md |
| 331 | Likes | 我发现很多人都不知道Obsidian插件神器😅 | 来碗金水 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/我发现很多人都不知道Obsidian插件神器😅 - 6a7863060000000028033c3d.md |
| 332 | Likes | 我开源了期末复习skill，欢迎来用！ | 淞潾泉 | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/我开源了期末复习skill，欢迎来用！ - 6a32167f0000000017009d10.md |
| 333 | Likes | 我才不会胖回去，只有经历过的人才知道… | 不是肥羊（变身版 | health-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/我才不会胖回去，只有经历过的人才知道… - 6a12ad74000000003601866d.md |
| 334 | Likes | 我的天，这个工具忒厉害了吧！ | 沐飞的 AI 圈 | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/我的天，这个工具忒厉害了吧！ - 6a771c4e0000000008010193.md |
| 335 | Likes | 手把手带你做高质量嵌入式简历 | 飞出金陵的烤鸭 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/手把手带你做高质量嵌入式简历 - 6a394d83000000001503d11f.md |
| 336 | Likes | 把国产模型优雅的接入全新GPT并保留官方 | 爱打乒乓球的孙同学 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/把国产模型优雅的接入全新GPT并保留官方 - 6a36a636000000002003b89a.md |
| 337 | Likes | 把面试skill升级了  这次你一定要提现！ | 九九渊 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/把面试skill升级了 这次你一定要提现！ - 6a687827000000001302edcc.md |
| 338 | Likes | 拿到一个项目后如何快速复现成可讲清的版本 | 不搭xhs | embedded-career | 方法候选（学习路线/复习流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/拿到一个项目后如何快速复现成可讲清的版本 - 69e36c16000000002200fcde.md |
| 339 | Likes | 推荐一个14天突击力扣hot100刷题库 | momo | algorithm-learning | 案例/资料参考 | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/推荐一个14天突击力扣hot100刷题库 - 6a4bafbc0000000016024160.md |
| 340 | Likes | 推荐大家都去试试看 DeepWiki | 汉松 | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/推荐大家都去试试看 DeepWiki - 680cace4000000001c01e5eb.md |
| 341 | Likes | 收藏≠学会｜把“看过”变成“记住” | 鱼先生的模块化Obsidian | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/收藏≠学会｜把“看过”变成“记住” - 6a1a90eb000000003601ac96.md |
| 342 | Likes | 教师裸辞转行嵌入式Day6｜凌晨12点还在学 | 青色的花 | embedded-technical | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/教师裸辞转行嵌入式Day6｜凌晨12点还在学 - 69ece4d9000000002301f280.md |
| 343 | Likes | 新一代小米SU7曜石黑+红内+20梅花 | 小米汽车｜妲己 | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/新一代小米SU7曜石黑+红内+20梅花 - 6a07bf4e000000000803290a.md |
| 344 | Likes | 新手如何一个月内学会力扣hot100，干货满满 | momo | algorithm-learning | 方法候选（算法学习/复习） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/新手如何一个月内学会力扣hot100，干货满满 - 68edc98f0000000007033e13.md |
| 345 | Likes | 更适合中国宝宝体质的面试复盘skill！ | 上司同事在天堂 | ai-knowledge-workflow | 方法候选（AI辅助求职/面试流程） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/更适合中国宝宝体质的面试复盘skill！ - 6a75bc5b00000000220331cd.md |
| 346 | Likes | 期末考试带一张A4开卷-缩印技巧 | 小冯还没疯 | misc-external | 仅外部参考（观点/资讯/消费内容） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/期末考试带一张A4开卷-缩印技巧 - 6959e666000000001e0223cb.md |
| 347 | Likes | 期末速成/考研/考公/科研 大家有救了！ | 一叶知秋 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/期末速成 考研 考公 科研 大家有救了！ - 6a0824620000000037037b7b.md |
| 348 | Likes | 本人上海理工大学大一学生，目前在智能制造大类，上学期绩点3.71，大类专业排名前 | Echo | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/本人上海理工大学大一学生，目前在智能制造大类，上学期绩点3.71，大类专业排名前 - 69b8afca0000000022002e9a.md |
| 349 | Likes | 机械跑路嵌入式:我的秋招时间线 | 机械人的嵌入式之路 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/机械跑路嵌入式 我的秋招时间线 - 6a75ee150000000024025a3e.md |
| 350 | Likes | 果然大佬对电子信息找工作的理解远在我之上 | 小雨转晴 | career-and-employment | 案例/外部参考 | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/果然大佬对电子信息找工作的理解远在我之上 - 69f6be1b00000000220254e2.md |
| 351 | Likes | 榆林 迎面撞你行车 对方身亡#安全 #安全第一位 #道路千万条安全第一条 | 懂车小叙 | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/榆林 迎面撞你行车 对方身亡#安全 #安全第一位 #道路千万条安全第一条 - 6a748ab100000000220145cf.md |
| 352 | Likes | 求安理工电气合肥能源所联培导师推荐（想轻松一点） | 胡仔球手 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/求安理工电气合肥能源所联培导师推荐（想轻松一点） - 69d08b04000000001f005db1.md |
| 353 | Likes | 没有实习现在还需要找实习吗 | 糯叽唧大王 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/没有实习现在还需要找实习吗 - 6a1e42470000000022025b12.md |
| 354 | Likes | 浙江职业院校招聘大专老师 26届硕士可报 | 予老师高校教师面试 | career-and-employment | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/浙江职业院校招聘大专老师 26届硕士可报 - 69b4c43e000000001a028026.md |
| 355 | Likes | 海康暑期实习面经 | 猛嵌 | embedded-career | 案例/题目清单（外部参考） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/海康暑期实习面经 - 6a03cf880000000008024493.md |
| 356 | Likes | 深空黑 M5 PRO MacBook Pro 评测：工作利器 | 黑貓的野望 | apple-digital | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/深空黑 M5 PRO MacBook Pro 评测：工作利器 - 6a5b8337000000000c01459a.md |
| 357 | Likes | 炸裂更新！Obsidian新出4种同步策略！ | 坚果云云 | knowledge-management | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/炸裂更新！Obsidian新出4种同步策略！ - 6a50aa8a00000000210220b7.md |
| 358 | Likes | 熬过了13年平安无事，这是老天给我最大的眷顾#胶质瘤二级 #左额叶功能区 | 红薯 | health-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/熬过了13年平安无事，这是老天给我最大的眷顾#胶质瘤二级 #左额叶功能区 - 69d6f8d1000000001a026085.md |
| 359 | Likes | 爸爸过生日想送皮鞋有什么好的品牌推荐。在线急[皱眉R][皱眉R][皱眉R][合十 | dreanyee | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/爸爸过生日想送皮鞋有什么好的品牌推荐。在线急[皱眉R][皱眉R][皱眉R][合十 - 68f778c600000000050021aa.md |
| 360 | Likes | 独立完成过裸机和RTOS嵌入式项目，在汽车电子做过OTA应用层开发，现在上海南芯 | 爱困觉的程序员 | embedded-career | 方法候选（学习路线/复习流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/独立完成过裸机和RTOS嵌入式项目，在汽车电子做过OTA应用层开发，现在上海南芯 - 6a03dd970000000035020986.md |
| 361 | Likes | 用 Mac 做嵌入式开发 | 香橙先生 | embedded-technical | 方法候选（项目复现/排错/口述） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/用 Mac 做嵌入式开发 - 6a0fba9d0000000036002d57.md |
| 362 | Likes | 用codex沉淀可复用工作流skill令人沉迷上瘾 | 旅行者的异想日志 | ai-agent-workflow | 仅外部参考（工具/资讯） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/用codex沉淀可复用工作流skill令人沉迷上瘾 - 6a34d9a30000000007012c7e.md |
| 363 | Likes | 真服啦，两次错过高通笔试 | 桃子先生（27秋招版） | graduate-research | 仅外部参考（考情/个人经历） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/真服啦，两次错过高通笔试 - 69e0f59f000000001a03150d.md |
| 364 | Likes | 研零研一实习投递经验分享 | 每天都想睡 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/研零研一实习投递经验分享 - 6a3295650000000011011529.md |
| 365 | Likes | 秋招感悟，写给正在找工作的人 | 小爪星球Pawlentia | career-and-employment | 方法候选（求职/经验复盘） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/秋招感悟，写给正在找工作的人 - 68c28443000000001d00a2f1.md |
| 366 | Likes | 秦昊减肥法！ | 阿婷在减肥 | health-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/秦昊减肥法！ - 69d2649600000000220268ff.md |
| 367 | Likes | 第3集／影石 嵌入式日常 沉淀的魅力 | 爱困觉的程序员 | embedded-technical | 方法候选（项目复现/排错/口述） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/第3集 影石 嵌入式日常 沉淀的魅力 - 6a488f77000000000f014476.md |
| 368 | Likes | 粉丝嵌入式面经反馈分享 | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/粉丝嵌入式面经反馈分享 - 6a4880cd0000000011005289.md |
| 369 | Likes | 终于能把plus订阅当pro用了 | 爱打乒乓球的孙同学 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/终于能把plus订阅当pro用了 - 6a3dff9d0000000022017512.md |
| 370 | Likes | 给你的Mac添加额外的应用商店 | Akring | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/给你的Mac添加额外的应用商店 - 6a78494b0000000022030788.md |
| 371 | Likes | 给天天见的obsidian 换个样子 | Noosx | ai-knowledge-workflow | 方法候选（知识库/笔记工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/给天天见的obsidian 换个样子 - 6a646900000000000101f61c.md |
| 372 | Likes | 考研的心从未如此强烈过 # | 灰调兔 | graduate-research | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/考研的心从未如此强烈过 # - 6a5c4ee500000000010320bf.md |
| 373 | Likes | 苏州嵌入式就业环境调研薪资加班情况及技术 | 嵌入式15年经验带新人 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/苏州嵌入式就业环境调研薪资加班情况及技术 - 6a7ab6880000000028005775.md |
| 374 | Likes | 苹果MacBook Pro M1-M5 Max怎么选？ | 唐尼玩玩数码 | ai-agent-workflow | 方法候选（工具配置/用量管理） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/苹果MacBook Pro M1-M5 Max怎么选？ - 6a5305650000000011004bca.md |
| 375 | Likes | 西门子工业软件开发CPP面经 | 老年社团艺术家 | graduate-research | 方法候选（信息核对/备考流程） | E2 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/西门子工业软件开发CPP面经 - 69e4ce560000000022002d66.md |
| 376 | Likes | 请叫我嵌入式开发心理医生！ | 小学生 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/请叫我嵌入式开发心理医生！ - 6a37b166000000000803e572.md |
| 377 | Likes | 贵一点还是贵一点的好 | 摸鱼狗东西 | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/贵一点还是贵一点的好 - 6a0498830000000037036b96.md |
| 378 | Likes | 走Linux方向，MCU要不要学？ | 糯叽唧大王 | embedded-career | 案例/题目清单（外部参考） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/走Linux方向，MCU要不要学？ - 69b8d2cc000000001d01af9b.md |
| 379 | Likes | 转嵌入式linux没有实习经历如何准备秋招 | 不搭xhs | embedded-career | 案例/题目清单（外部参考） | E3 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/转嵌入式linux没有实习经历如何准备秋招 - 6a7c2f7500000000270207ff.md |
| 380 | Likes | 这一集 讲普通人的坚持 | 爱困觉的程序员 | embedded-career | 方法候选（求职/简历流程） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/这一集 讲普通人的坚持 - 6a6aa2a1000000001102dba2.md |
| 381 | Likes | 这个网站我愿称之为最伟大发明 | 小鹤 | ai-agent-workflow | 方法候选（AI辅助求职/面试流程） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/这个网站我愿称之为最伟大发明 - 6a697115000000000f02b166.md |
| 382 | Likes | 这秘笈确实够劲爆 | 一颗躺平的心 | misc-external | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/这秘笈确实够劲爆 - 6a34f49a000000001101d909.md |
| 383 | Likes | 酷态科10号ultra爆改桌面充电站 | 文小棠 | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/酷态科10号ultra爆改桌面充电站 - 69dc09b90000000022024cc5.md |
| 384 | Likes | 酷态科CP模块模块风扇与USB A风扇对比评测 | Binary Star | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/酷态科CP模块模块风扇与USB A风扇对比评测 - 6a12c5c8000000003502b31a.md |
| 385 | Likes | 非科班转嵌入式linux，建议把精力放在项目 | 不搭xhs | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/非科班转嵌入式linux，建议把精力放在项目 - 6a4cafb2000000000f016264.md |
| 386 | Likes | 靠自己手搓，把AI搬进obsidian | GibsonChan5 | ai-knowledge-workflow | 方法候选（工具配置/用量管理） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/靠自己手搓，把AI搬进obsidian - 6a7c295d0000000028030cc4.md |
| 387 | Likes | 面试官喜欢的嵌入式简历长啥样 | 飞出金陵的烤鸭 | embedded-career | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/面试官喜欢的嵌入式简历长啥样 - 6a185b040000000038020f53.md |
| 388 | Likes | 麦当劳这波活动杀疯啦，直播中 | 爱吃乌冬面 | consumer-lifestyle | 仅外部参考（正文不足） | E1 | no | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/麦当劳这波活动杀疯啦，直播中 - 69bb94f7000000001b021909.md |
| 389 | Likes | （电子信息）控制工程就业 | 爱吃羊肉串2ne | career-and-employment | 方法候选（求职/经验复盘） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/（电子信息）控制工程就业 - 6a34eade0000000016025152.md |
| 390 | Likes | 🔥 Claude Code七种自定义驾驭方式 | 阿尔法灵AI | ai-agent-workflow | 方法候选（工具工作流） | E2 | yes | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/🔥 Claude Code七种自定义驾驭方式 - 6a38ddc30000000007027492.md |
| 391 | Likes | 🔥GitHub本周热榜-AI新skill开始自己干活 | 星探AI | ai-agent-workflow | 仅外部参考（正文不足） | E1 | maybe | needs-review | 小红书（RedNote）/。。。。。。。/点赞（Likes）/🔥GitHub本周热榜-AI新skill开始自己干活 - 6a350b62000000002201abb6.md |
