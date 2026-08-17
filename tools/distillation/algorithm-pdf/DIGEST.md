# 算法 PDF — 精华与使用边界

这份 PDF 最适合当作 C++ 模板速查表，而不是从头到尾背诵的课程。真正使用时，先从题目约束和输入结构选择候选范式，再用状态、不变量、边界和反例确认模板是否成立；最后用编译器和样例验证整数类型、初始化和复杂度。

本轮只完成了本地文本抽取。文字段落可帮助定位主题，但公式、图片中的推导、表格布局和代码排版存在丢失风险。凡是需要精确引用的页码、公式或图片结论，都必须回到原始 PDF 人工复核；不能因为抽取稿有内容就把它升级成已验证事实。

与 LeetCode 域的关系是“PDF 提供模板证据，LeetCode 域提供可迁移方法”。重复主题统一归并到 `algorithm-problem-framework-selection`、`algorithm-state-and-invariant-derivation` 和 `algorithm-active-recall-loop`，避免同一算法在两个域中出现互相漂移的 Skill。
