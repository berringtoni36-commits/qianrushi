# 全仓库全量覆盖复核

> 这份报告首先证明“每个当前来源路径都有登记”，再单独说明哪些知识文档已经被 Skill/域文档精确回链。文件登记、范围纳入和内容理解是三个不同层级；附件、模型、图片和构建产物不会因为存在于快照中就被宣称已经理解。

- 当前来源快照：7,146 条
- 当前 disposition：7,146 条
- 唯一路径：7,146 条
- 机械合同：通过
- 机器明细：[`coverage-review.json`](coverage-review.json)
- 逐文件权威明细：[`source-disposition.tsv`](source-disposition.tsv)

## 域级覆盖

| 知识域 | 文件 | 知识文档 | 已精确回链 | 仅范围覆盖 | 未回链 | 证据层 | 精确回链率 | 专门复核报告 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `algorithm-pdf` | 1 | 1 | 1 | 0 | 0 | 0 | 100.0% | `algorithm-pdf/FULL_COVERAGE_REVIEW.md` |
| `attachments-evidence` | 3,026 | 0 | 0 | 0 | 0 | 3,026 | — | `attachments-evidence/FULL_COVERAGE_REVIEW.md` |
| `embedded-core` | 132 | 127 | 46 | 81 | 0 | 5 | 36.2% | `embedded-core/FULL_COVERAGE_REVIEW.md`, `embedded-core/unlinked-review.tsv`, `embedded-core/coverage-supplement.md` |
| `leetcode-algorithm-learning` | 141 | 140 | 24 | 116 | 0 | 0 | 17.1% | `leetcode-algorithm-learning/FULL_COVERAGE_REVIEW.md` |
| `linux-memory-ebpf` | 47 | 30 | 21 | 9 | 0 | 9 | 70.0% | `linux-memory-ebpf/FULL_COVERAGE_REVIEW.md` |
| `linux-systems-tutorial` | 47 | 47 | 26 | 21 | 0 | 0 | 55.3% | `linux-systems-tutorial/FULL_COVERAGE_REVIEW.md` |
| `linux-vision` | 959 | 49 | 34 | 15 | 0 | 599 | 69.4% | `linux-vision/FULL_COVERAGE_REVIEW.md` |
| `rednote-bookmarks` | 1,952 | 391 | 391 | 0 | 0 | 1,560 | 100.0% | `rednote-bookmarks/FULL_COVERAGE_REVIEW.md` |
| `rtos-project` | 460 | 35 | 27 | 8 | 0 | 266 | 77.1% | `rtos-project/FULL_COVERAGE_REVIEW.md`, `rtos-project/unlinked-review.tsv`, `rtos-project/coverage-supplement.md` |
| `vault-methodology-and-tools` | 8 | 5 | 5 | 0 | 0 | 0 | 100.0% | `vault-methodology-and-tools/FULL_COVERAGE_REVIEW.md` |
| `vault-root-or-unknown` | 6 | 2 | 0 | 0 | 2 | 0 | 0.0% | `vault-root-or-unknown/FULL_COVERAGE_REVIEW.md` |
| `workbench-learning-state` | 367 | 366 | 366 | 0 | 0 | 0 | 100.0% | `workbench-learning-state/FULL_COVERAGE_REVIEW.md` |

## 解释口径

- `已精确回链` = `skill-evidence` + `domain-referenced`；它证明产物中出现了保守的来源路径，不等于模型已运行或结论永远正确。
- `仅范围覆盖` = `domain-scoped`；只说明来源边界纳入了目录/变体，仍需逐文件阅读或源码核对。
- `未回链` = `indexed-only` + `needs-domain-review`；这是下一轮蒸馏队列，不能被 DIGEST 或总索引的泛化描述掩盖。
- `证据层` = 图片、模型、压缩包、构建产物和其他附件；它们通过 provenance/disposition 管理，不直接折算为知识文档覆盖。
- “专门复核报告”只表示该域有全量覆盖审计文件；它不会自动把文件状态升级为已理解。

## 过期派生登记

> 这些路径曾出现在 `distillation/*/source-register.md`，但不在当前原始快照中。它们保留作历史/派生证据，不计入当前来源，也不应被当作仍存在的原始文件。

- 发现 233 条过期登记：
  - `canvas-mindmaps/source-register.md:13` → `archive/思维导图/Linux物理内存碎片检测-复习版.canvas`
  - `canvas-mindmaps/source-register.md:14` → `archive/思维导图/Linux物理内存碎片检测-复习版.md`
  - `canvas-mindmaps/source-register.md:15` → `archive/思维导图/Linux物理内存碎片检测-思维导图.canvas`
  - `canvas-mindmaps/source-register.md:16` → `archive/思维导图/Linux视觉感知项目复习-思维导图.canvas`
  - `canvas-mindmaps/source-register.md:17` → `archive/思维导图/RTOS项目复习-思维导图.canvas`
  - `canvas-mindmaps/source-register.md:18` → `archive/思维导图/index.md`
  - `embedded-core-derived/source-register.md:13` → `archive/糯叽叽八股（完整版）.md`
  - `interactive-learning-labs/source-register.md:13` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室.md`
  - `interactive-learning-labs/source-register.md:14` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/app-core.js`
  - `interactive-learning-labs/source-register.md:15` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/app.js`
  - `interactive-learning-labs/source-register.md:16` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/index.html`
  - `interactive-learning-labs/source-register.md:17` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/project-data.js`
  - `interactive-learning-labs/source-register.md:18` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/styles.css`
  - `interactive-learning-labs/source-register.md:19` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/tests/app-core.test.cjs`
  - `interactive-learning-labs/source-register.md:20` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/tests/project-data.test.cjs`
  - `interactive-learning-labs/source-register.md:21` → `archive/项目交互动画/Linux物理内存碎片检测交互学习实验室/tests/static.test.cjs`
  - `interactive-learning-labs/source-register.md:22` → `archive/项目交互动画/Linux视觉感知交互学习实验室.md`
  - `interactive-learning-labs/source-register.md:23` → `archive/项目交互动画/Linux视觉感知性能证据页.html`
  - `interactive-learning-labs/source-register.md:24` → `archive/项目交互动画/RTOS项目交互学习动画.html`
  - `interactive-learning-labs/source-register.md:25` → `archive/项目交互动画/RTOS项目交互学习动画.md`
  - `interactive-learning-labs/source-register.md:26` → `archive/项目交互动画/app-core.js`
  - `interactive-learning-labs/source-register.md:27` → `archive/项目交互动画/app.js`
  - `interactive-learning-labs/source-register.md:28` → `archive/项目交互动画/assets/lime/input.jpg`
  - `interactive-learning-labs/source-register.md:29` → `archive/项目交互动画/assets/lime/output.jpg`
  - `interactive-learning-labs/source-register.md:30` → `archive/项目交互动画/assets/lstr/input/001.jpg`
  - `interactive-learning-labs/source-register.md:31` → `archive/项目交互动画/assets/lstr/input/002.jpg`
  - `interactive-learning-labs/source-register.md:32` → `archive/项目交互动画/assets/lstr/input/003.jpg`
  - `interactive-learning-labs/source-register.md:33` → `archive/项目交互动画/assets/lstr/input/004.jpg`
  - `interactive-learning-labs/source-register.md:34` → `archive/项目交互动画/assets/lstr/input/005.jpg`
  - `interactive-learning-labs/source-register.md:35` → `archive/项目交互动画/assets/lstr/input/006.jpg`
  - `interactive-learning-labs/source-register.md:36` → `archive/项目交互动画/assets/lstr/input/007.jpg`
  - `interactive-learning-labs/source-register.md:37` → `archive/项目交互动画/assets/lstr/input/008.jpg`
  - `interactive-learning-labs/source-register.md:38` → `archive/项目交互动画/assets/lstr/input/009.jpg`
  - `interactive-learning-labs/source-register.md:39` → `archive/项目交互动画/assets/lstr/input/010.jpg`
  - `interactive-learning-labs/source-register.md:40` → `archive/项目交互动画/assets/lstr/input/011.jpg`
  - `interactive-learning-labs/source-register.md:41` → `archive/项目交互动画/assets/lstr/input/012.jpg`
  - `interactive-learning-labs/source-register.md:42` → `archive/项目交互动画/assets/lstr/input/013.jpg`
  - `interactive-learning-labs/source-register.md:43` → `archive/项目交互动画/assets/lstr/input/014.jpg`
  - `interactive-learning-labs/source-register.md:44` → `archive/项目交互动画/assets/lstr/input/015.jpg`
  - `interactive-learning-labs/source-register.md:45` → `archive/项目交互动画/assets/lstr/input/016.jpg`
  - `interactive-learning-labs/source-register.md:46` → `archive/项目交互动画/assets/lstr/input/017.jpg`
  - `interactive-learning-labs/source-register.md:47` → `archive/项目交互动画/assets/lstr/input/018.jpg`
  - `interactive-learning-labs/source-register.md:48` → `archive/项目交互动画/assets/lstr/input/019.jpg`
  - `interactive-learning-labs/source-register.md:49` → `archive/项目交互动画/assets/lstr/input/020.jpg`
  - `interactive-learning-labs/source-register.md:50` → `archive/项目交互动画/assets/lstr/input/021.jpg`
  - `interactive-learning-labs/source-register.md:51` → `archive/项目交互动画/assets/lstr/input/022.jpg`
  - `interactive-learning-labs/source-register.md:52` → `archive/项目交互动画/assets/lstr/input/023.jpg`
  - `interactive-learning-labs/source-register.md:53` → `archive/项目交互动画/assets/lstr/input/024.jpg`
  - `interactive-learning-labs/source-register.md:54` → `archive/项目交互动画/assets/lstr/input/025.jpg`
  - `interactive-learning-labs/source-register.md:55` → `archive/项目交互动画/assets/lstr/input/026.jpg`
  - `interactive-learning-labs/source-register.md:56` → `archive/项目交互动画/assets/lstr/input/027.jpg`
  - `interactive-learning-labs/source-register.md:57` → `archive/项目交互动画/assets/lstr/input/028.jpg`
  - `interactive-learning-labs/source-register.md:58` → `archive/项目交互动画/assets/lstr/input/029.jpg`
  - `interactive-learning-labs/source-register.md:59` → `archive/项目交互动画/assets/lstr/input/030.jpg`
  - `interactive-learning-labs/source-register.md:60` → `archive/项目交互动画/assets/lstr/input/031.jpg`
  - `interactive-learning-labs/source-register.md:61` → `archive/项目交互动画/assets/lstr/input/032.jpg`
  - `interactive-learning-labs/source-register.md:62` → `archive/项目交互动画/assets/lstr/input/033.jpg`
  - `interactive-learning-labs/source-register.md:63` → `archive/项目交互动画/assets/lstr/input/034.jpg`
  - `interactive-learning-labs/source-register.md:64` → `archive/项目交互动画/assets/lstr/input/035.jpg`
  - `interactive-learning-labs/source-register.md:65` → `archive/项目交互动画/assets/lstr/input/036.jpg`
  - `interactive-learning-labs/source-register.md:66` → `archive/项目交互动画/assets/lstr/input/037.jpg`
  - `interactive-learning-labs/source-register.md:67` → `archive/项目交互动画/assets/lstr/input/038.jpg`
  - `interactive-learning-labs/source-register.md:68` → `archive/项目交互动画/assets/lstr/input/039.jpg`
  - `interactive-learning-labs/source-register.md:69` → `archive/项目交互动画/assets/lstr/input/040.jpg`
  - `interactive-learning-labs/source-register.md:70` → `archive/项目交互动画/assets/lstr/input/041.jpg`
  - `interactive-learning-labs/source-register.md:71` → `archive/项目交互动画/assets/lstr/input/042.jpg`
  - `interactive-learning-labs/source-register.md:72` → `archive/项目交互动画/assets/lstr/input/043.jpg`
  - `interactive-learning-labs/source-register.md:73` → `archive/项目交互动画/assets/lstr/input/044.jpg`
  - `interactive-learning-labs/source-register.md:74` → `archive/项目交互动画/assets/lstr/input/045.jpg`
  - `interactive-learning-labs/source-register.md:75` → `archive/项目交互动画/assets/lstr/input/046.jpg`
  - `interactive-learning-labs/source-register.md:76` → `archive/项目交互动画/assets/lstr/input/047.jpg`
  - `interactive-learning-labs/source-register.md:77` → `archive/项目交互动画/assets/lstr/input/048.jpg`
  - `interactive-learning-labs/source-register.md:78` → `archive/项目交互动画/assets/lstr/input/049.jpg`
  - `interactive-learning-labs/source-register.md:79` → `archive/项目交互动画/assets/lstr/input/050.jpg`
  - `interactive-learning-labs/source-register.md:80` → `archive/项目交互动画/assets/lstr/input/051.jpg`
  - `interactive-learning-labs/source-register.md:81` → `archive/项目交互动画/assets/lstr/input/052.jpg`
  - `interactive-learning-labs/source-register.md:82` → `archive/项目交互动画/assets/lstr/input/053.jpg`
  - `interactive-learning-labs/source-register.md:83` → `archive/项目交互动画/assets/lstr/input/054.jpg`
  - `interactive-learning-labs/source-register.md:84` → `archive/项目交互动画/assets/lstr/input/055.jpg`
  - `interactive-learning-labs/source-register.md:85` → `archive/项目交互动画/assets/lstr/input/056.jpg`
  - … 其余 153 条见 `coverage-review.json`。

## 继续队列（每域最多展示 20 条）

### `vault-root-or-unknown`（2 条）

- `archive/dan_koe_如何在一天内修复你的人生_中文完整翻译.md`
- `测试.md`

