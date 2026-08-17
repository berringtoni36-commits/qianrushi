# RedNote 内容边界复核

处理日期：2026-08-14

## 结论

本轮对 小红书（RedNote）/ 下 391 个 Markdown 文档逐一建立索引：202 个 Bookmarks、177 个 Likes、2 个 Posts、10 个 Albums。四个新文件只写入 distillation/rednote-bookmarks/；源 vault、OPEN_QUEUES、全局报告和既有 disposition 均未修改。

索引中的 source_status_existing、source_disposition_existing、source_confidence_existing 是从既有 distillation/source-disposition.tsv 原样带入的审计字段；index_use、evidence_level、full_distill_recommended 是本轮新增的可用性判断，二者不应混同。

## RIA-TV++ 的本轮适配

| 环节 | 本轮做法 | 边界 |
|---|---|---|
| Adler/Stage 0 | 读取 frontmatter、正文、评论分隔、媒体引用、专辑派生结构，并与既有 source-disposition 对齐 | 不把标题、标签或评论自动当成事实 |
| 并行提取/Stage 1 | 每行登记标题、作者、标签、主题、方法线索、外部参考边界、证据等级和全文建议 | 这是索引级提取，不是规范 Skill 生成 |
| 三重验证/Stage 1.5 | 用“正文是否足够、方法是否可迁移、是否需要外部核验”做保守筛选 | yes 只是值得全文复核，不代表通过事实验证 |
| RIA++/Stage 2 | 将可吸收内容写成方法/检查点的短描述，同时保留原帖案例和不确定性 | 不复制第三方结论为用户事实 |
| Zettelkasten/Stage 3 | 以主题机会地图连接嵌入式、求职、AI/知识管理、算法和研究信息 | 只建立导航，不创建 Skill 或改变 disposition |
| 压力测试/Stage 4 | 做路径、字段、集合计数、重复 resourceId、媒体/正文质量和标记覆盖自检 | 未做运行时、官方事实或工具兼容性验证 |
| 交付/Stage 5 | 只交付 article-index.tsv、article-index.md、topic-opportunity-map.md、content-boundary-review.md | 不写源 vault、OPEN_QUEUES 或全局报告 |

## 证据等级

- D0：专辑/Albums 派生导航，只能证明目录关系。
- E1：正文不足、短文本或媒体主导；只证明有一个导出文档和标题/元数据。
- E2：正文可读的单篇经验、观点、测评或自述；可做外部案例参考，不能证明结论普适。
- E3：正文较足且有步骤、题目、路线、排错或复盘线索；适合优先全文阅读，但仍不是事实真伪等级。

## 身份与用户事实边界

- Bookmarks：路径只说明导出集合标记为收藏；收藏不等于认同、执行或用户经历。
- Likes：路径只说明导出集合标记为点赞；点赞行为、账号身份和意图未核验，原作者内容不转为用户事实。
- Posts：路径只说明导出集合标记为“我的发布”；作者字段/账号归属按导出记录保留，不据此断言用户身份或把正文升格为已验证用户事实。
- Albums：专辑索引是派生目录，不是独立原帖；目录中的作者、标题和链接仍需回到原帖核对。
- 原帖中的“我/本人/我的经历”仍按原作者自述处理；不得因为第一人称、导出位置或评论互动而推断为用户事实。

## 必须保留不确定性的声明

- 本轮标出包含营销/结果性措辞的文档 105 条；其中涉及 offer、薪资、录取或上岸的 56 条，涉及 Star/浏览/点赞等指标的 42 条。它们在索引中仅作为 uncertainty_flags，不是已验证数字。
- 标出时间/版本敏感线索 119 条；不据此断言当前功能、价格、兼容性或市场状态。
- 183 条正文较短且存在图片/视频线索；在没有读媒体内容前，不从标题推导方法。
- 40 行属于 20 个重复 resourceId 组（跨 Likes/Bookmarks）；路径仍逐文档保留，不能将导出集合当作两篇独立原帖，也不在本轮删除或合并。

## 复核统计

| 检查项 | 结果 |
|---|---:|
| Markdown 文档总数 | 391 |
| Bookmarks / Likes / Posts / Albums | 202 / 177 / 2 / 10 |
| 与既有 source-disposition 成功对齐 | 391；缺失 0 |
| 正文可读 prose | 263 |
| 正文不足/媒体主导 | 118 |
| 派生专辑索引 | 10 |
| 全文建议 yes / maybe / no | 152 / 136 / 103 |

## 后续使用规则

1. 先按 full_distill_recommended=yes 和 E3 找全文候选，再回到精确 source_path；不要只看标题。
2. 蒸馏任何方法时，保留“原作者自述/外部参考/待核验”标签；需要用户事实时必须另找用户直接材料或一手证据。
3. 处理 offer、薪资、Star、浏览量、点赞、录取人数、通过率、版本和价格时，把原句作为待核验声明，不写成确定事实。
4. 处理 Likes/Posts 时，继续保留集合身份不确定性；不把本轮新增字段回写到源文件或全局 disposition。
