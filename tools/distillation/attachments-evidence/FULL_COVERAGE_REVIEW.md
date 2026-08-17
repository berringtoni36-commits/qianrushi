# 附件、模型、图片、压缩包、构建产物与派生文件覆盖审计

> 生成日：2026-08-14。数字来自 [`source-inventory-current.tsv`](source-inventory-current.tsv)；本次对目标行逐文件复核真实大小与 SHA-256 前 16 位。报告只写入 `distillation/attachments-evidence/`，不复制任何二进制。

## 结论

- 当前特殊对象覆盖：**5,488 个文件，2,877,206,129 bytes**。
- 覆盖类别：附件/媒体/模型、构建产物、备份/派生物，以及 1 个命名为 Defuddle 的当前正文提取文件；当前 Canvas 为 0 个，见 [`canvas-mindmaps/CANVAS_INDEX.md`](CANVAS_INDEX.md)。
- 文本索引：4,550 个有明确路径引用，938 个没有；“有文本索引”只表示可定位，不表示内容已阅读、核验或蒸馏。扫描了 1,841 个当前源文本文件，排除 `distillation/`、`.obsidian/`、`.claudian/` 和缓存目录。
- `source` 本轮没有安全适用的特殊对象；外部提取稿、媒体、模型和构建物都不能仅凭存在或被引用升格为已蒸馏知识。
- 复核规则：排除 18 个构建文本自身文件名命中；其中 13 个仅有自引用改为 `no`，5 个 `Makefile` 因同目录 `CMakeCache.txt` 的外部命中保留 `yes`，并从引用计数中移除自引用。

## 证据等级 / disposition

| 等级 | 口径 |
|---|---|
| `source` | 直接事实记录且来源边界已明确；本表特殊对象没有自动归入此级。 |
| `evidence` | 图片、外部媒体、模型或可识别的构建/运行输出；可支撑定位或 provenance，不替代正文/源码/实测。 |
| `derived` | Defuddle 提取、合并/备份或 Canvas 关系派生物；可用于转换/关系审计，不重复计数。 |
| `archive` | EPUB 等封装源；需单独解包/阅读/核验，不直接作为 Skill 内容。 |
| `excluded` | OS 元数据、编译中间物、缓存等，不对知识结论提供独立证据。 |
| `needs-review` | provenance 或用途不足以安全归类；本次特殊对象表中若出现，必须人工确认。 |

### 按当前清单类别

| 项目 | 数量 | 大小（bytes） | 文本索引 yes |
|---|---:|---:|---:|
| `attachment-evidence` | 5,042 | 2,743,431,340 | 4,242 |
| `build-artifact` | 439 | 130,272,677 | 308 |
| `derived-backup` | 6 | 3,299,078 | 0 |
| `knowledge-document` | 1 | 203,034 | 0 |

### 按所属域

| 项目 | 数量 | 大小（bytes） | 文本索引 yes |
|---|---:|---:|---:|
| `attachments-evidence` | 3,026 | 2,468,858,172 | 2,682 |
| `embedded-core` | 5 | 39,080,423 | 0 |
| `linux-memory-ebpf` | 9 | 120,182 | 0 |
| `linux-vision` | 619 | 137,681,408 | 78 |
| `rednote-bookmarks` | 1,560 | 169,238,766 | 1,558 |
| `rtos-project` | 269 | 62,227,178 | 232 |

### 按 disposition

| 项目 | 数量 | 大小（bytes） | 文本索引 yes |
|---|---:|---:|---:|
| `archive` | 1 | 35,967,355 | 0 |
| `derived` | 6 | 3,411,240 | 0 |
| `evidence` | 5,051 | 2,757,974,293 | 4,246 |
| `excluded` | 430 | 79,853,241 | 304 |

### 按文件类型

| 项目 | 数量 | 大小（bytes） | 文本索引 yes |
|---|---:|---:|---:|
| `Defuddle-backup` | 2 | 1,529,998 | 0 |
| `Defuddle-extraction` | 1 | 203,034 | 0 |
| `IDE-cache` | 1 | 90,872 | 0 |
| `OS-metadata` | 2 | 18,440 | 0 |
| `archive-EPUB` | 1 | 35,967,355 | 0 |
| `backup-copy` | 3 | 1,678,208 | 0 |
| `build-intermediate` | 411 | 74,618,380 | 296 |
| `build-meta` | 16 | 5,125,549 | 8 |
| `build-output` | 10 | 48,974,170 | 4 |
| `external-media.jpg` | 1,560 | 169,238,766 | 1,558 |
| `generated-image` | 2 | 1,554,578 | 0 |
| `image.bmp` | 26 | 42,681,604 | 0 |
| `image.gif` | 17 | 6,715,756 | 17 |
| `image.jpeg` | 42 | 11,271,396 | 22 |
| `image.jpg` | 1,175 | 960,583,532 | 698 |
| `image.png` | 2,156 | 1,510,459,115 | 1,903 |
| `image.svg` | 59 | 339,372 | 42 |
| `image.webp` | 2 | 6,248 | 0 |
| `model-ONNX` | 2 | 6,149,756 | 2 |

## 重点对象

| 对象 | 当前数量/大小 | 边界 |
|---|---:|---|
| ONNX 模型 | 2 / 6,149,756 bytes | 仅证明模型文件存在；不证明训练、输入预处理、Tensor 合同、推理结果或目标板性能。 |
| EPUB | 1 / 35,967,355 bytes | 封装阅读源，不能与已经抽取、核验并进入 Skill 的知识混同。 |
| Defuddle 提取/备份 | 3 / 1,733,032 bytes | 由抽取/合并/备份动作产生；应回链原网页或合并稿，不作为第二套独立事实。 |
| 构建/运行输出 | 12 / 50,528,748 bytes | 只作 artifact/provenance 或输出观察；没有 Flash、启动、硬件实测链时不能写成运行事实。 |

## 为什么不能等同于已蒸馏

- 二进制、图片和模型没有自动生成可审计的主张—来源—验证链；文件名、扩展名和被 Markdown 引用都不足以证明技术结论。
- 构建中间物记录工具链状态，构建输出最多证明某个历史产物身份；它们不替代源码、配置、测试、烧录、启动和目标环境测量。
- Defuddle/备份/Canvas 记录的是转换或关系；同一事实的副本不得重复计入，Canvas 节点也不替代其链接到的 Markdown、源码或附件。
- RedNote 媒体按 `source-disposition-overrides.tsv` 的媒体前缀保留为外部 evidence；作者观点、数字和经历仍须独立核验。

## 机器可读表

[`disposition.tsv`](tools/distillation/attachments-evidence/disposition.tsv) 逐文件记录路径、所属域、当前清单类别、类型、大小、SHA-256 前 16 位、disposition、文本索引及不能等同于已蒸馏的理由。`text_index_sample` 只列前 3 个匹配的源文本路径，避免把报告本身当成来源。

## 限制

- 本轮只读检查并记录，不解包、安装或复制任何二进制；根目录 ZIP 的内部清单只在 `vault-root-or-unknown/FULL_COVERAGE_REVIEW.md` 中记录。
- 文本索引是可复现的路径解析/同目录精确文件名匹配，不是 OCR、语义阅读、模型验证或硬件实测。
- 当前清单排除 `distillation/` 等派生报告目录，因此历史报告不能反向把对象标记为已索引。
