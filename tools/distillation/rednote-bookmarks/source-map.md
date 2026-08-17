# RedNote 来源映射

## 当前审计基线

- 当前快照：`source-inventory-current.tsv` 中 `rednote-bookmarks=1,952`；其中 `knowledge-document=391`、媒体附件 `1,560`、`.base=1`。
- 知识文档分布：专辑 10、收藏 202、点赞 177、我的发布 2；这些数字来自路径类别，不等于正文已理解。
- 根级机器 status（2026-08-14 10:22 CST 当前快照）：`domain-referenced=47`（专辑 4 + 收藏 42 + Base 1）、`needs-domain-review=345`（专辑 6 + 收藏 160 + 点赞 177 + 我的发布 2）、`evidence-layer=1,560`。当前快照已包含本文件声明的类别边界；目录前缀回链也不等于逐篇理解。
- 当前机器 disposition：`derived-index=11`、`external-reference=202`、`needs-review=179`、`evidence-layer=1,560`。其中 Likes 177 和 Posts 2 虽已获得路径回链，仍保留 `needs-review` 用途。
- 逐文件路径和哈希见 [`source-register.md`](tools/distillation/rednote-bookmarks/source-register.md)；证据等级见 [`evidence-levels.md`](evidence-levels.md)。

## 来源身份与统计口径

| 来源层 | 路径 | 用途 |
|---|---|---|
| 收藏正文 | `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/` 下全部 Markdown | 第三方原文、作者、发布时间、标签和外部链接 |
| 专辑索引 | `小红书（RedNote）/。。。。。。。/专辑（Albums）/` 下全部 `专辑索引.md` | 收藏关系和主题导航；派生索引 |
| 媒体 | `小红书（RedNote）/。。。。。。。/媒体（Media）/` | 帖子图片/视频证据；不直接抽象成事实 |
| Obsidian Base | `小红书（RedNote）/。。。。。。。/小红书内容总览.base` | 视图配置；不是知识正文 |

## 已纳入路径边界但仍待用途确认的来源

当前映射已声明以下两类目录前缀，因此它们在机器 `status` 中属于 `domain-referenced`；但人工 disposition 规则没有把它们升级为 `external-reference`：

- `小红书（RedNote）/。。。。。。。/点赞（Likes）/`：177 个 Markdown，保留 `needs-review`，不擅自等同于收藏外部参考。
- `小红书（RedNote）/。。。。。。。/我的发布（Posts）/`：2 个 Markdown，账户元数据与作者字段一致但仍需用户确认，不转成个人事实。

## 附件与重复关系

- `媒体（Media）/` 共 1,560 行，96 个 SHA-256 重复组（192 行、96 行冗余），去重后 1,464 个媒体哈希。
- 381 个帖子 Markdown 含 1,558 个媒体路径引用；2 个无后缀 `image-1/2.jpg` 路径没有被正文直接引用，正文使用了同 resourceId 下的 `Multi Source Sync` 文件名变体。
- 专辑索引共 10 个文件、76 条列表行，抽到 56 个唯一收藏路径和 56 个原文 URL；这些链接是派生关系，不应再次计作 56 条知识文档。

## 主题—来源映射

### 嵌入式学习、八股与求职

- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/0实习双非硕｜备战秋招 - 6a76d28f0000000026036444.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/27届嵌入式，简历没改完能先投吗 - 6a7c3ed1000000002c003c80.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/27岁嵌入式每周3场面试，上岸后真感受 - 6a7a7d3d0000000026034950.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式冲机器人，今年行情汇总，关于前景 - 6a68ad1e000000001f01cf47.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式实习 - 6a7bbdab000000003300e802.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式常见算法题总结 - 6a7865ea0000000022014ab4.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式开发 - 6a720c4400000000250084db.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式找实习 秋招八股要背到什么程度？ - 6a7b137c0000000035016851.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式找实习焚决 - 6a52dab8000000000f007864.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式校招AI面经总结（下） - 6a2e9d62000000001603ce89.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式秋招备考，八股面试题到底怎么背？ - 6a3ff7e7000000000f02a3f2.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/已获某头部芯片原厂暑期实习认证 - 6a6a0900000000001002679e.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/多线程在嵌入式Linux项目中解决什么问题？ - 6a6eee480000000029032ddc.md`

### 面试、简历和表达复盘

- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/AI版面试自救指南（二）项目篇 - 6a536bc4000000001603d051.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/ai面试辅助工具自救指南 - 6a21491e000000003601fe52.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/一个把简历项目真正吃透的AI面试Prompt - 6a7869240000000022030e4a.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/屡战屡胜SSP候选人如何用录音转文字复盘！ - 6a60e001000000000f01ed8a.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/建立表达力（面试）训练知识库，变化可追踪 - 6a73315d000000000502007d.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/分享自己写的秋招面试Agents和skills - 6a7740ac0000000021022013.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/🤚你已经完全掌握了如何写一份完美简历 - 6a79a0cc0000000033035229.md`

### AI、Skill、Obsidian 和开发工具

- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/8月份第一周skill红黑榜（第六期） - 6a79d52a000000003301d4b8.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/GitHub一周飙升榜，第一名狂涨 7,554 Star - 6a73f448000000002500b3ab.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Github最热门的100个Skill（整理版） - 69d3102f000000001a0309d1.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/从夯到拉｜锐评各类热门简历skill - 6a79b5690000000032031459.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我实际开发中的五个skills推荐 - 6a6de9170000000033031709.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/如果说最推荐的一个Skill，那么我会推荐它 - 6a7a8bf9000000002500784d.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/省钱近一半，专治GPT5.6代码防御skill - 6a759604000000002202f0a5.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/我的天，这个工具忒厉害了吧！ - 6a771c4e0000000008010193.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/程序员必装！手机指挥AI写代码太爽了 - 6a7555a3000000002500062f.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Obsidian插件推荐！点一下鼠标，内容乖乖落盘 - 6a6a1c840000000011015677.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/分享一个自用Obsidian主题 - 6a7b4c7d00000000280332c1.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/用obsidian做导图也不错诶 - 6a6aecc0000000000a0382c7.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Codex一个月两篇2区 - 6a6dcb6d00000000350156fd.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/实时监控28款AI工具用量 额度、记录订阅信息 - 6a7461250000000002003c00.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/ChatGPT 新功能 Health，每周生成健康周报 - 6a677f9f000000000100cec8.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Mac快捷启动器 - 6a75ba1d000000002403dc75.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/Mac苹果电脑如何查看电池健康 - 67d84390000000001c002742.md`

### 行情、薪资和普通收藏

- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/小米2026薪资情报~平均年薪30w+ - 6a7c2715000000002701da62.md`
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/嵌入式开发 - 6a720c4400000000250084db.md`（岗位广告也属于外部线索）
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/ChatGPT 新功能 Health，每周生成健康周报 - 6a677f9f000000000100cec8.md`（非嵌入式）
- `小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/关于95新 MacBook Pro M1pro 32+512 成功下车，也是终于 - 6a6aed5c000000000f033ed4.md`

## 索引和附件

- `小红书（RedNote）/。。。。。。。/专辑（Albums）/skills/专辑索引.md`
- `小红书（RedNote）/。。。。。。。/专辑（Albums）/好玩的 ai/专辑索引.md`
- `小红书（RedNote）/。。。。。。。/专辑（Albums）/嵌入式学习经验/专辑索引.md`
- `小红书（RedNote）/。。。。。。。/专辑（Albums）/嵌入式面经/专辑索引.md`
- `小红书（RedNote）/。。。。。。。/小红书内容总览.base`
- `小红书（RedNote）/。。。。。。。/媒体（Media）/` 下全部图片与视频：按帖子 resourceId 关联，不单独建 Skill。
