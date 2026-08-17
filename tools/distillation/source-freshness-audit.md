# 规范 Skill 来源新鲜度审计

> 这是只读的增量提醒：文件哈希变化不自动等于旧结论失效，也不自动把新文件纳入 Skill。需要人工/下一轮蒸馏逐条复核后，才更新来源与结论。

- 当前规范 Skill：56
- 与历史基线相比发生变化的文件：6
- 其中被规范 Skill 引用的文件：2
- 历史基线之后新增且已被 Skill 引用的文件：8
- 需要高优先级复核的 Skill 引用关系：3
- 已处置变化/新增引用文件：14
- 仍待处置变化/新增引用文件：0

## 变化文件与引用关系

| 文件 | 历史哈希 | 当前哈希 | 复核优先级 | 状态 | 处置结论 | 引用 Skill |
|---|---|---|---|---|---|---|
| `assets/style-context/obsidian-background-mountain.jpg` | `` | `c591e2240c26df12` | context-only | `context-only` | 不影响规范 Skill 的来源结论；保留为样式附件证据，不回炉 | (none) |
| `projects/嵌入式八股/FreeRTOS 源码解析.md` | `f39b3f7b0f3462f1` | `72e6a0511e3d3610` | high | `reviewed-static-boundary` | 保留 linux-virtual-memory-reclaim-path 的引用；仅作为 FreeRTOS/ Linux 内存分配边界对照，不把它升级为 Linux 内核机制事实。若后续内存章节、版本警告或源码边界改变，再复核该 Skill 的 A1/B 与来源字段 | `linux-virtual-memory-reclaim-path` |
| `projects/嵌入式八股/index.md` | `d3b294d3edbe588b` | `88d4f7bf1c0c88e1` | context-only | `context-only` | 仅为目录/索引上下文变化；不承载规范 Skill 的核心事实，不回炉 | (none) |
| `projects/嵌入式八股/图解系统-小林coding-v1.0.epub` | `` | `63677357c59ded1f` | context-only | `context-only` | 附件新增/变化只作为外部证据登记；当前规范 Skill 使用已抽取 Markdown，不自动替换来源链 | (none) |
| `projects/嵌入式八股/糯叽叽八股/08 通讯协议.md` | `dbf0b82126e4486f` | `505ef6164e47c834` | high | `reviewed-static-boundary` | 保留 embedded-bus-selection 与 embedded-c-struct-binary-contract-audit 的引用；当前可见 UART/SPI/CAN、CRC/DLC、结构体/位域内容仍支持既有边界。协议事实依电气层、ABI 和目标实现，暂不改写 Skill；若新增协议或字段合同，再回炉两者测试 | `embedded-bus-selection`, `embedded-c-struct-binary-contract-audit` |
| `测试.md` | `ba1d04542aafac74` | `2a09ae39bb704d2c` | context-only | `context-only` | 独立测试/临时笔记变化不影响规范 Skill 来源；保留清单记录，不回炉 | (none) |

## 历史基线之后新增且已被规范 Skill 引用的文件

- `工作台/八股进度.base`：当前哈希 `c0f3b5c531dd3c3d`；状态 `reviewed-state-boundary`；处置：只定义 Bases 的筛选、公式、分组和展示字段；不承载技术答案。它影响复习排序和统计呈现，不改变 embedded-learning-state-and-active-recall 的状态语义；保留为工作台配置证据；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/学习总账.md`：当前哈希 `cc8cb80b99f17ba2`；状态 `reviewed-state-boundary`；处置：明确未学/学过/掌握、待回看/已回看和 360 条统计口径；属于学习状态合同，不把状态推断成真实掌握。保留来源引用，暂不回炉；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/学习日志.md`：当前哈希 `81741623896ae0be`；状态 `reviewed-state-boundary`；处置：只允许追加真实发生的学习记录；当前模板没有新增技术事实。保留为日志边界证据，暂不回炉；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/嵌入式学习工作台.md`：当前哈希 `918aa34bca04e010`；状态 `reviewed-state-boundary`；处置：仅为 Obsidian dashboard 入口和链接展示；不承载答案、掌握事实或客户端 Skill 路由。保留为派生 UI 证据，暂不回炉；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/条目记录/150题-001.md`：当前哈希 `4f6e4914154773d4`；状态 `reviewed-state-boundary`；处置：单条记录只保存 static 题目的状态与原文链接；不能证明用户已掌握 static。保留为状态层样本，不升级为 C/C++ 技术事实；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/条目记录/小林网络-001.md`：当前哈希 `4fde4f008bab3429`；状态 `reviewed-state-boundary`；处置：单条记录只保存 TCP/IP 网络模型章节的状态与来源；mastery=未学不代表章节内容为空，也不改变网络 Skill 的技术边界；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/条目记录/项目八股-RTOS-A0.md`：当前哈希 `45b9ec0a6817104c`；状态 `reviewed-state-boundary`；处置：单条记录只保存 RTOS 项目开场题的状态与面试原文链接；mastery=学过不等于个人贡献或项目运行已验证；引用 Skill：`embedded-learning-state-and-active-recall`
- `工作台/资料地图.md`：当前哈希 `6418889ac7d85b38`；状态 `reviewed-state-boundary`；处置：只记录主源、工作台统计方式、去重和排除边界；不新增技术结论。保留为 provenance 入口，暂不回炉；引用 Skill：`embedded-learning-state-and-active-recall`

## 处理口径

1. 先读取变化文件的实际 diff，而不是仅凭哈希变化改写答案。
2. 如果事实、符号或代码路径变化，更新对应 Skill 的 `source_files`/正文/测试，并重新运行三重验证与压力测试。
3. 如果只是索引、格式或无关附件变化，保留本报告记录，不把它升级为知识结论。
4. 本报告不修改原始文件，也不自动覆盖任何客户端副本。
5. 人工处置记录见 `source-freshness-review.tsv`；`review_status=pending` 表示尚未完成内容核对。
