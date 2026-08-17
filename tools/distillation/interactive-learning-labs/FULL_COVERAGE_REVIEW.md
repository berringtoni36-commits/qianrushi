# interactive-learning-labs 全量来源与证据边界复核

审计日期：2026-08-14。当前快照中的原始交互实验保持只读；本文件只在本域记录当前缺失和历史登记的边界。

## 结论与统计

当前 source-inventory-current.tsv 全库为 7,146 条数据行，本域当前条目为 0；真实文件系统和 rg --files 均未发现 archive/项目交互动画/ 下的 HTML、JS、CSS、Canvas 或测试实现。因此当前来源覆盖不是“实验已通过”，而是“历史登记仍在、原始实现已不在当前快照”。

| 口径 | 当前数量 | 解释 |
|---|---:|---|
| 当前 inventory 条目 | 0 | 当前快照没有本域原始交互文件 |
| 当前精确回链 | 0 | 没有可回链的当前 HTML/JS/测试文件 |
| 当前 domain-scoped | 0 | 没有当前来源文件可纳入范围 |
| 当前 indexed-only | 0 | 0 条当前来源；不能把历史登记冒充当前条目 |
| source-register 历史登记 | 226 | 全部逐条检查为当前快照外的 stale/history-only |
| 历史 runnable-learning-lab | 19 | HTML/JS/CSS/测试等可运行候选 |
| 历史 attachment-evidence | 204 | LSTR/LIME/Unet 等图片/附件证据 |
| 历史 knowledge-document | 3 | 三个交互实验说明页 |

source-register.md 的 226 条路径全部不在当前 source-inventory-current.tsv；现有 INDEX.md、BOOK_OVERVIEW.md、DIGEST.md、verified.md 已明确写出代码层缺失。历史 source-register 只能证明过去的派生登记，不能证明当前文件存在、可运行或测试通过。

## 可复用摘要

- 可复用的是 interactive-lab-fact-boundary-audit 的审计方法：对每个曲线、状态机、公式、quiz 和性能数标出来源符号、教学模型、派生样例或实测记录。
- 视觉、RTOS、物理内存实验的图表可以作为概念解释和反例练习；来源标签必须与源码/文档/测量记录分离。
- 旧实验若恢复，应先核对 project-data.js/app-core.js、状态转移、故障模型、测试断言和来源路径，再决定是否重建实验。

## 不能升格的证据

当前没有 HTML/JS/Canvas 实现、DOM 测试或 project-data/app-core 测试可执行。因而不能声称历史 quiz 通过、曲线公式正确、状态机与项目代码一致、性能数字是测量结果，或当前仓库能运行交互实验。

即使历史实现重新出现，页面中的指数、曲线、帧率、阈值、故障注入和动画状态默认也只能算教学模型或派生摘要；没有独立测量记录、输入集、目标机身份和原始日志，不能升格为 Linux 内核、ARM 硬件、摄像头或真实项目运行事实。

## 可复现扫描口径

~~~sh
awk -F '\t' 'NR > 1 && $1 == "interactive-learning-labs" {n++} END {print n}' \
  distillation/source-inventory-current.tsv
rg --files 'archive/项目交互动画' 2>/dev/null | sort
rg -n '文件数：226|当前快照|HTML/JS|测试|缺失|历史' \
  distillation/interactive-learning-labs/{INDEX.md,BOOK_OVERVIEW.md,DIGEST.md,verified.md,source-register.md}
~~~

历史登记分类以 source-register.md 的 226 行和当前 inventory membership 逐条比对；当前代码层不执行 npm/node/browser 测试，也不把 27 条历史测试记录当成当前测试结果。

## 剩余风险与最小补证

若要恢复实验，先恢复并固定 HTML/JS/CSS/测试的来源哈希，再逐项运行静态测试、数据/公式边界测试和浏览器交互测试；随后把每个页面数字标成教学/派生/实测，并回链到真实项目源码或测量日志。恢复前保留当前 226 条为历史失效登记，不删除、不改写为当前来源。
