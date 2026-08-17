# 全仓库蒸馏覆盖矩阵

处理日期：2026-08-14

> 原始 vault、项目源码、附件和构建目录保持只读。这里的“覆盖”表示已建立来源边界、全局理解、候选验证或证据索引，不表示每个文件都被复制进 Skill。

| 知识域 | 来源边界 | 盘点规模 | 人类交付 | 规范 Skills | 当前状态 | 主要限制 |
|---|---|---:|---|---|---|---|
| embedded-core | `projects/嵌入式八股/` 核心八股、FreeRTOS 源码解析、高频 150 题 | 132 文件 | BOOK_OVERVIEW/INDEX/GLOSSARY/DIGEST/verified/source-map | 17 个，详见 [embedded-core/INDEX.md](tools/distillation/embedded-core/INDEX.md) | 核心增量已完成静态审计 | 小林图解、C/OS/网络/STM32 剩余主题仍有 indexed-only；Linux 版本差异和内核参数需现场验证；Linux 驱动为教程边界；UDP 应用可靠性候选暂不升格 |
| rtos-project | `projects/RTOS项目/文档`、源码、复习文档和配置 | 460 文件 | 同上 | `rtos-freertos-config-and-boot`、`rtos-task-and-isr-design`、`rtos-communication-debugging`、`rtos-runtime-fault-diagnosis`、`rtos-sensor-acquisition-and-fusion`、`rtos-key-event-state-machine`、`rtos-motor-pid-control`、`rtos-auto-mode-state-machine`、`rtos-iap-firmware-upgrade`、`rtos-software-timer-periodic-design`、`rtos-display-buzzer-feedback`、`rtos-build-flash-runtime-provenance`、`rtos-project-storytelling` | 第二轮和构建—烧录—运行 provenance 增量已完成静态审计 | IAP/CRC/Flash、个人贡献和硬件结果需实测/确认 |
| linux-memory-ebpf | `projects/Linux物理内存检测项目/文档`、源码、复习版 | 47 文件 | 同上 | `linux-memory-ebpf-pipeline`、`linux-buddy-fragmentation-diagnosis`、`linux-memory-source-audit`、`linux-memory-fastpath-observation-contract`、`linux-ebpf-map-counter-contract` | 首轮与 Round 3 增量已完成静态审计 | BCC/内核兼容、节流、Map 聚合和源码路径风险；快速路径和计数合同尚无目标内核运行实测 |
| linux-vision | `projects/linux视觉感知项目` 文档/源码/模型/构建资料 | 959 文件 | 同上 | 9 个：`linux-vision-pipeline-and-optimization`、`linux-vision-file-ipc-lifecycle-audit`、`linux-vision-build-provenance-audit`、`linux-vision-project-storytelling`、`vision-model-tensor-contract-audit`、`qt-event-loop-signal-slot-audit`、`cmake-source-discovery-incremental-build-audit`、`linux-vision-qt-image-buffer-adapter-audit`、`linux-vision-resource-telemetry-contract-audit` | 首轮、文件 IPC、构建 provenance、模型契约、Qt/CMake 和 Round 3 增量已完成静态审计 | 模型/构建产物多，摄像头链路、NEON/OpenMP、性能、Qt/OpenCV 运行行为和个人贡献需核对 |
| linux-systems-tutorial | `archive/大丙Linux教程/` 分章稿；合并稿作派生核对 | 47 文件 | 同上 | `linux-build-debug-chain`、`linux-fd-process-io-debugging`、`linux-socket-multiplexing-design`、`linux-thread-sync-deadlock-diagnosis`、`linux-process-signal-daemon-lifecycle`、`linux-rx-napi-path-diagnosis` | 首轮、进程/线程生命周期和 RX/NAPI 增量已完成静态审计 | 教程 API/平台语义需按目标系统验证 |
| leetcode-algorithm-learning | `archive/力扣刷题/` 配置、专题、题解、14 天笔记 | 141 文件 | 同上 | `algorithm-problem-framework-selection`、`algorithm-state-and-invariant-derivation`、`algorithm-active-recall-loop` | 已完成首轮静态测试 | 题解是案例；不推断用户真实掌握状态 |
| interactive-learning-labs | 历史 `archive/项目交互动画/` HTML/JS/测试/说明、Canvas 关系 | 当前快照不含历史 HTML/JS 源文件 | BOOK_OVERVIEW/INDEX/GLOSSARY/DIGEST/verified/source-map | `interactive-lab-fact-boundary-audit` | Skill 保留为历史交互审计方法；当前来源改由项目审计文档支撑 | 教学模型不等于内核/硬件实测；历史交互实现和测试不可在当前快照直接复现 |
| canvas-mindmaps | `archive/思维导图/` Canvas 和关系索引 | 6 文件 | source-inventory、CANVAS_RELATIONS、各域来源映射 | 不生成重复 Skill | 已登记为派生关系层 | Canvas 是关系/导航派生物，不能替代正文、源码或实测证据 |
| embedded-core-derived | `archive/糯叽叽八股（完整版）.md` | 历史登记 1；当前快照 0 | 来源登记和重复/派生审计 | 不生成重复 Skill | 已标记为派生合并稿 | 当前文件不在快照中；历史登记仅用于说明去重边界，不重复计入知识结论 |
| algorithm-pdf | `acwing/算法基础课模板大全-C++版本.pdf` 及本地抽取稿 | 1 原始 PDF | BOOK_OVERVIEW/INDEX/GLOSSARY/DIGEST/verified/source-map/失败记录 | 不另造重复 Skill | 证据域完成；OCR 待复核 | OCR 凭证 401；公式、图片、版面不完整 |
| vault-methodology-and-tools | `tools/` 规则、索引、排序配置、拆分脚本、图片清单 | 8 主/派生文件 | 同上 | `vault-source-boundary-and-derived-artifact-audit` | 已完成首轮静态测试 | 根目录 ZIP/.skill 来源待单独确认 |
| rednote-bookmarks | `小红书（RedNote）/` 收藏正文、专辑、媒体和 `.base` | 1,952 文件 | BOOK_OVERVIEW/INDEX/GLOSSARY/DIGEST/verified/source-map | 不生成规范 Skill | 外部参考域已分层 | 第三方观点不等于用户事实；部分内容待人工复核 |
| attachments-evidence | `assets/`、项目附件、图片、模型、SVG 等 | 3,026 文件（该登记域） | source-inventory、artifact-inventory、引用边界 | 不整体复制 | 作为证据索引 | 全仓库按文件类别统计的附件/媒体证据共 5,042 个；二进制不自动转换为知识结论 |
| build-artifacts | `OBJ/`、`build/`、`.o/.bin/.hex/.crf` 等 | 439 文件 | artifact-inventory、各域边界记录 | 不生成 | 已识别并排除正文 | 可作为构建证据，但不能替代源码/测量 |
| vault-root-or-unknown | 根目录临时/未知文件 | 6 文件 | artifact-inventory、待审计清单 | 不生成 | 待人工检查 | `.DS_Store`、未知压缩资产和其他根目录文件需确认；缓存目录不进入当前快照 |

## 总量盘点

- 全仓库盘点文件和类别计数：以当前 `audit-report.json` 为准；仓库新增资料后不要手工沿用旧快照。
- `distillation/`、`.obsidian/`、`.claudian/` 和 `tools/__pycache__/` 不进入原始来源统计。
- 当前快照为 7,146 个路径、2,981,072,292 bytes、12 个来源域；可复现汇总见 [`source-inventory-summary.md`](source-inventory-summary.md)，分类细目见 [`artifact-inventory.md`](artifact-inventory.md)。
- `canvas-mindmaps` 与 `interactive-learning-labs` 仍保留历史审计产物，但当前快照没有相应原始实现；它们不计入当前总量。

## 交付策略

方法论只进入 `distillation/skills/` 的 56 个规范源目录；各知识域内的旧 `skills/` 文件夹是阶段审计快照，不计为额外 Skill。没有通过验证的内容保留在候选、术语、案例或 rejected 审计中。
