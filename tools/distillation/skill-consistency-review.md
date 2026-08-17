# 56 个规范 Skill 一致性质量审计

- 审计日期：2026-08-14
- 范围：distillation/skills/*/SKILL.md、agents/openai.yaml、test-prompts.json、test-results.md，以及来源字段、R/I/A1/A2/E/B、description 触发边界、正例/诱饵/边界测试、压力矩阵、主域 INDEX 和相关关系索引。
- 规范源：distillation/skills/；distillation/skills/README.md 不计为 Skill 包。
- 写入边界：本次只新增本报告 .md/.tsv 两个文件；未修改任何 Skill、客户端副本、原始 vault、域索引或其他域文件。

## 结论

| 检查项 | 结果 | 判定 |
|---|---:|---|
| 规范 Skill 覆盖 | 56/56 | 通过 |
| 每包必需文件（4 项） | 56/56 | 缺失文件 0 |
| frontmatter name/description | 56/56 | 通过；description 均 ≤1024 字符 |
| agents/openai.yaml | 56/56 | display_name/short_description 齐全，长度 26–64；default_prompt 23 个 |
| source_files | 434 条；全局唯一 265 | 缺失路径 0；每包重复 0 |
| source_symbols | 765 个 | 逐字命中 705；限定名叶子命中 17；语义标签待确认 43 |
| R/I/A1/A2/E/B | 56/56 | 六段存在、顺序正确且非空；结构问题 0 |
| description 触发 | 56/56 | 均有可执行触发条件；字面 Trigger phrases/触发 标签 48/56 |
| description 排除边界 | 51/56 | 字面 Do not use/trigger 或中文排除句；其余为隐含/替代表述 |
| test-prompts.json | 56/56；336 条 | 每包 3/2/1；重复 ID 0；诱饵含规范 Skill 路由 56/56 |
| test-results.md | 静态 6/6：56/56 | 真实客户端限制 56/56；显式 3/2/1 分解 46/56 |
| 压力矩阵/混合矩阵 | 56/56；12/12 | 矩阵重复行 0；混合矩阵重复 ID 0 |
| 主域 INDEX | 56/56 | 缺失/重复/未知主链接 0；embedded-core 有 3 条跨域导航多余链接 |
| 相关关系索引 | 181 规范边 + 2 外部边 | Skill 计数 56；未知关系 0 |

静态结构没有发现需要阻断交付的缺失字段、重复测试 ID、来源路径不存在、RIA 段落缺失或主域主链接缺失。

> **后续回归补充**：本报告逐 Skill 组件检查时记录的是 28 条 Python 测试；随后新增了算法 PDF、工作台、RedNote 和本报告自身的派生物回归检查。完整 `run_regression.py` 在 2026-08-14 11:05 CST 运行时为 34 条测试并通过；这不改变 56 个规范 Skill 的静态 6/6 结果，也不改变真实客户端/目标环境仍未测的边界。

说明：重复 ID 按单个 Skill 的 test-prompts.json 和混合意图矩阵分别检查；不同 Skill 间重复使用 should-trigger-01 等模板 ID 不计为冲突。

## 事实边界与未测项

- 真实 Codex/Claude/ZCode 新会话命中率：未测。静态 6/6、索引关系和客户端副本哈希都不能换算成真实命中率。
- 目标板、目标 Linux 内核/BCC、目标 Qt/OpenCV、Keil/J-Link、摄像头/模型和其他目标环境运行：未测。本机静态 provenance 只保留源码/配置/历史产物关系；不把 static-pass、static-compatible 或文件存在写成运行成功。
- 现有活动副本快照（只读）：ZCode 56 个目录，`same=56,different=0,missing=0`；ZCode-only 同步 dry-run 发现 56 个同名冲突、计划安装 0 个。Codex、全局 Claude 和 Obsidian Claudian 的蒸馏副本已停用并保留备份。

## 明确问题与建议优先级

### P1：交付前必须补证，但不是本次静态结构缺陷

- 在 ZCode 新会话中隐藏 type、expected_behavior 和路由答案，逐个执行正例/诱饵/边界；记录真实命中、误命中、回答事实边界和客户端版本。当前不能填写命中率。
- 对涉及硬件/目标内核/Qt/OpenCV/构建烧录的 Skill，按项目验证矩阵补目标环境证据；没有证据继续保留“未测”。

### P2：来源符号的精确性复核

- 43 个 source_symbols（分布在 16 个 Skill）不是声明来源中的逐字字符串；限定名叶子命中 17 个，纯语义/标签待确认 43 个。它们不是路径缺失，也不自动构成错误；在回答中不得把语义标签升级成已定位的 API/代码符号。
- 逐 Skill 的数量在 TSV 中给出；完整逐符号记录仍以既有 distillation/source-symbol-audit.tsv 为定位参考，本次没有修改该文件。

### P3：低风险格式一致性建议（本次不改 Skill）

- test-results.md 有 10/56 个没有显式写出“正例 3、诱饵 2、边界 1”，但对应 JSON 和静态 6/6 结构通过。建议只补固定说明行，不改变结论或事实边界。
- 8/56 个 description 没有字面 Trigger phrases/触发 标签，但已有具体 Use when/中文触发条件；建议后续统一标签，不凭空添加短语。
- 5/56 个 description 没有字面 Do not use/trigger 或对应中文排除句；建议从既有 B 段/测试边界提炼，不扩大 claims。
- 本次未执行上述格式补丁，因此除本报告两份文件外没有 Skill 改动。

## 逐域主索引关系

| 主域 | 压力矩阵主 Skill | INDEX 链接 | 缺失 | 重复 | 未知 | 跨域多余链接 |
|---|---:|---:|---:|---:|---:|---|
| embedded-core | 14 | 17 | 0 | 0 | 0 | linux-udp-broadcast-reachability-contract, linux-udp-datagram-endpoint-routing, linux-udp-multicast-interface-membership-contract |
| interactive-learning-labs | 1 | 1 | 0 | 0 | 0 | 无 |
| leetcode-algorithm-learning | 3 | 3 | 0 | 0 | 0 | 无 |
| linux-memory-ebpf | 5 | 5 | 0 | 0 | 0 | 无 |
| linux-systems-tutorial | 9 | 9 | 0 | 0 | 0 | 无 |
| linux-vision | 9 | 9 | 0 | 0 | 0 | 无 |
| rtos-project | 13 | 13 | 0 | 0 | 0 | 无 |
| vault-methodology-and-tools | 1 | 1 | 0 | 0 | 0 | 无 |
| workbench-learning-state | 1 | 1 | 0 | 0 | 0 | 无 |

说明：主域归属以 skill-pressure-test-matrix.md 为准；embedded-core 的 3 条 UDP 链接是跨域导航，UDP 三个 Skill 的主链接仍在 linux-systems-tutorial/INDEX.md，不计为主域重复。

## 只读审计/回归检查

| 检查 | 结果 | 备注 |
|---|---|---|
| coverage_review.py --check-only | 通过 | record_count=7146 |
| provenance_audit.py --check-only | 通过 | wrote_reports=false；目标运行节点仍为 not-evidenced/not-run |
| python -m unittest discover -s distillation/scripts -p test_*.py | 通过 | 37 tests，禁用字节码写入；临时目录测试自动清理 |
| sync_zcode_skills.py --dry-run --allow-conflicts | 通过 | 56 conflicts，0 install；未覆盖 ZCode |
| report_contract_errors(audit-report.json) | 通过 | errors=0；Skill/pressure/trigger/client rows = 56/56/56/56（ZCode-only） |
| run_regression.py --check-only | 未执行 | 该入口仍会写 distillation/regression-latest.md，超出本次只写两份报告边界；已执行其不写入的组件检查 |

## 逐 Skill 结果

完整逐包机器可读结果见 skill-consistency-review.tsv。priority=none 表示没有结构硬缺陷或本次格式建议；P3 只表示低风险文字一致性/来源标签提示，不是事实错误。

| Skill | 主域 | 包文件 | source | symbols | RIA | tests | results | primary INDEX | priority |
|---|---|---:|---|---|---|---|---|---|---|
| algorithm-active-recall-loop | leetcode-algorithm-learning | 4/4 | 7/0 missing | 7 (7/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| algorithm-problem-framework-selection | leetcode-algorithm-learning | 4/4 | 7/0 missing | 7 (3/0/4) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| algorithm-state-and-invariant-derivation | leetcode-algorithm-learning | 4/4 | 6/0 missing | 7 (2/0/5) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| cmake-source-discovery-incremental-build-audit | linux-vision | 4/4 | 27/0 missing | 32 (25/0/7) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| embedded-arm-linux-boot-chain | embedded-core | 4/4 | 2/0 missing | 11 (7/0/4) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| embedded-bus-selection | embedded-core | 4/4 | 8/0 missing | 8 (8/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| embedded-c-storage-linkage-audit | embedded-core | 4/4 | 5/0 missing | 17 (16/0/1) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| embedded-c-struct-binary-contract-audit | embedded-core | 4/4 | 4/0 missing | 12 (9/0/3) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| embedded-cpp-resource-lifetime | embedded-core | 4/4 | 3/0 missing | 10 (8/0/2) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| embedded-interview-layered-answer | embedded-core | 4/4 | 8/0 missing | 6 (5/0/1) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| embedded-learning-state-and-active-recall | workbench-learning-state | 4/4 | 8/0 missing | 6 (6/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| embedded-memory-lifetime-and-pool-design | embedded-core | 4/4 | 7/0 missing | 9 (9/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| embedded-numeric-contract-audit | embedded-core | 4/4 | 2/0 missing | 11 (11/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| interactive-lab-fact-boundary-audit | interactive-learning-labs | 4/4 | 5/0 missing | 8 (6/0/2) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-buddy-fragmentation-diagnosis | linux-memory-ebpf | 4/4 | 6/0 missing | 7 (7/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-build-debug-chain | linux-systems-tutorial | 4/4 | 4/0 missing | 12 (12/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-driver-device-tree-boundary | embedded-core | 4/4 | 3/0 missing | 17 (17/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-ebpf-map-counter-contract | linux-memory-ebpf | 4/4 | 5/0 missing | 8 (8/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-fd-process-io-debugging | linux-systems-tutorial | 4/4 | 7/0 missing | 12 (12/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-file-persistence-crash-consistency | embedded-core | 4/4 | 4/0 missing | 7 (6/0/1) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-memory-ebpf-pipeline | linux-memory-ebpf | 4/4 | 13/0 missing | 6 (6/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-memory-fastpath-observation-contract | linux-memory-ebpf | 4/4 | 4/0 missing | 7 (7/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-memory-source-audit | linux-memory-ebpf | 4/4 | 6/0 missing | 12 (12/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-process-signal-daemon-lifecycle | linux-systems-tutorial | 4/4 | 6/0 missing | 24 (24/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-rx-napi-path-diagnosis | linux-systems-tutorial | 4/4 | 5/0 missing | 29 (26/0/3) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-socket-multiplexing-design | linux-systems-tutorial | 4/4 | 6/0 missing | 11 (11/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-tcp-loss-path-diagnosis | embedded-core | 4/4 | 7/0 missing | 25 (25/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-thread-sync-deadlock-diagnosis | linux-systems-tutorial | 4/4 | 4/0 missing | 34 (33/1/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-udp-broadcast-reachability-contract | linux-systems-tutorial | 4/4 | 5/0 missing | 7 (6/0/1) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-udp-datagram-endpoint-routing | linux-systems-tutorial | 4/4 | 5/0 missing | 8 (8/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-udp-multicast-interface-membership-contract | linux-systems-tutorial | 4/4 | 5/0 missing | 8 (8/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-userspace-timer-drift-audit | embedded-core | 4/4 | 4/0 missing | 10 (9/0/1) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-virtual-memory-reclaim-path | embedded-core | 4/4 | 9/0 missing | 19 (19/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-vision-build-provenance-audit | linux-vision | 4/4 | 11/0 missing | 12 (12/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-vision-file-ipc-lifecycle-audit | linux-vision | 4/4 | 5/0 missing | 11 (11/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-vision-pipeline-and-optimization | linux-vision | 4/4 | 7/0 missing | 16 (15/1/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| linux-vision-project-storytelling | linux-vision | 4/4 | 4/0 missing | 13 (9/0/4) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-vision-qt-image-buffer-adapter-audit | linux-vision | 4/4 | 4/0 missing | 10 (8/2/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| linux-vision-resource-telemetry-contract-audit | linux-vision | 4/4 | 6/0 missing | 9 (7/2/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| qt-event-loop-signal-slot-audit | linux-vision | 4/4 | 7/0 missing | 24 (16/6/2) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| rtos-auto-mode-state-machine | rtos-project | 4/4 | 9/0 missing | 12 (12/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-build-flash-runtime-provenance | rtos-project | 4/4 | 19/0 missing | 21 (21/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| rtos-communication-debugging | rtos-project | 4/4 | 9/0 missing | 7 (7/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-display-buzzer-feedback | rtos-project | 4/4 | 18/0 missing | 29 (29/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-freertos-config-and-boot | rtos-project | 4/4 | 16/0 missing | 16 (16/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-iap-firmware-upgrade | rtos-project | 4/4 | 19/0 missing | 16 (16/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| rtos-key-event-state-machine | rtos-project | 4/4 | 6/0 missing | 9 (9/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-motor-pid-control | rtos-project | 4/4 | 9/0 missing | 17 (17/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-project-storytelling | rtos-project | 4/4 | 4/0 missing | 14 (12/0/2) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| rtos-runtime-fault-diagnosis | rtos-project | 4/4 | 14/0 missing | 17 (17/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-sensor-acquisition-and-fusion | rtos-project | 4/4 | 12/0 missing | 8 (8/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| rtos-software-timer-periodic-design | rtos-project | 4/4 | 8/0 missing | 24 (24/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| rtos-task-and-isr-design | rtos-project | 4/4 | 10/0 missing | 19 (19/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| stm32-clock-and-sampling-timing | embedded-core | 4/4 | 8/0 missing | 11 (11/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |
| vault-source-boundary-and-derived-artifact-audit | vault-methodology-and-tools | 4/4 | 9/0 missing | 7 (7/0/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | none |
| vision-model-tensor-contract-audit | linux-vision | 4/4 | 13/0 missing | 29 (24/5/0) | pass | 3/2/1; dup=0; decoy=pass | 6/6; live-limit=present | pass | P3 |

## 需显式分解的 test-results 清单

以下 10 个包的 JSON 已通过 3/2/1 结构检查，但 test-results.md 未重复列出分解：

- embedded-c-struct-binary-contract-audit
- linux-file-persistence-crash-consistency
- linux-udp-broadcast-reachability-contract
- linux-udp-datagram-endpoint-routing
- linux-udp-multicast-interface-membership-contract
- linux-userspace-timer-drift-audit
- linux-vision-build-provenance-audit
- linux-vision-file-ipc-lifecycle-audit
- linux-vision-qt-image-buffer-adapter-audit
- qt-event-loop-signal-slot-audit

## description 标签一致性清单

### 未使用字面 Trigger phrases/触发标签（已有具体触发条件）

- linux-ebpf-map-counter-contract
- linux-memory-fastpath-observation-contract
- linux-thread-sync-deadlock-diagnosis
- linux-vision-qt-image-buffer-adapter-audit
- linux-vision-resource-telemetry-contract-audit
- qt-event-loop-signal-slot-audit
- rtos-build-flash-runtime-provenance
- vision-model-tensor-contract-audit

### 未使用字面 Do not use/trigger 排除句

- linux-driver-device-tree-boundary
- qt-event-loop-signal-slot-audit
- rtos-iap-firmware-upgrade
- rtos-software-timer-periodic-design
- stm32-clock-and-sampling-timing

## source_symbols 待人工确认分布

这些是定位提示的证据等级提醒，不是来源路径缺失；需要精确源码 claims 时再人工核对。

- algorithm-problem-framework-selection：4 个
- algorithm-state-and-invariant-derivation：5 个
- cmake-source-discovery-incremental-build-audit：7 个
- embedded-arm-linux-boot-chain：4 个
- embedded-c-storage-linkage-audit：1 个
- embedded-c-struct-binary-contract-audit：3 个
- embedded-cpp-resource-lifetime：2 个
- embedded-interview-layered-answer：1 个
- interactive-lab-fact-boundary-audit：2 个
- linux-file-persistence-crash-consistency：1 个
- linux-rx-napi-path-diagnosis：3 个
- linux-udp-broadcast-reachability-contract：1 个
- linux-userspace-timer-drift-audit：1 个
- linux-vision-project-storytelling：4 个
- qt-event-loop-signal-slot-audit：2 个
- rtos-project-storytelling：2 个

## 实际改动文件

- distillation/skill-consistency-review.md（本文件）
- distillation/skill-consistency-review.tsv（逐 Skill 明细）
- 未修改任何其他文件。
