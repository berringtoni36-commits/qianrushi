# 持续蒸馏迭代日志

> 这是 `distillation/` 的工作记录，不是对原始 Obsidian 仓库的改写。每一轮都保留来源边界、质量门和未完成队列；“已登记”不等于“已理解”，“静态通过”不等于客户端或硬件实测。

## 2026-08-14 上午轮次

### 当前基线

- 当前来源快照：7,146 条路径、12 个来源域。
- 规范 Skill：56 个，唯一规范源为 `distillation/skills/`。
- 每个规范 Skill 均有 R/I/A1/A2/E/B、`test-prompts.json` 和 `test-results.md`；静态矩阵为 3 条正例、2 条诱饵、1 条边界。
- 最近回归：全仓库覆盖、provenance 只读检查、37 条 Python 测试和 ZCode-only 同步 dry-run 均通过（2026-08-14 11:23 CST）。
- ZCode 目录存在性已核对；既有同名目录未覆盖，Codex、全局 Claude 和 Obsidian Claudian 的蒸馏副本已停用并保留备份，ZCode 新会话命中率仍未测。

### 本轮工作单元

- RedNote：逐文档标题/主题/证据层/事实边界索引；不把第三方帖子升级为用户经历或市场事实。
- 算法 PDF：页码级主题卡、文本证据与公式/图片缺口分离；不把 OCR 失败或图片公式当成已验证内容。
- 工作台：把 360 条记录转换为主动回忆队列；状态仍是记录字段，不是实际掌握率。
- Skill 质量：复核 56 个规范包的 RIA++、来源字段、触发描述、测试 JSON 和客户端边界。

### 处理口径

1. 先登记和回链，再判断是否值得升格为候选。
2. 候选必须经过 V1 跨来源、V2 预测力、V3 独特性；普通定义、重复材料和只有一处证据的内容降级为术语/案例/审计记录。
3. 文档声称、源码事实、历史构建、目标环境运行和硬件实测分层记录。
4. 任何真实客户端盲测、Keil/J-Link、BCC/eBPF、ARM/Qt/OpenCV/摄像头结果都不凭静态文件推断。

### 结束前检查

```bash
python3 distillation/scripts/run_regression.py
```

若出现并发写入，先审查变更文件和报告计数，再运行回归；不要用旧快照覆盖新派生产物。

## 2026-08-14 11:17–11:24 增量轮次

- 为 `embedded-core` 登记 8 条未回链主题卡：Cache/一致性、并发死锁、TCP framing、TCP 控制、epoll、eBPF 入口、Linux 回收、C/C++ 二进制合同。
- 为 `linux-vision` 登记 8 条未回链主题卡：Qt/QProcess、文件 IPC、摄像头主链、LIME/ADMM、双模型、NEON/OpenMP、CMake provenance、Mat→Qt/遥测边界。
- 候选层明确分流为 `keep-for-review`、`term-or-reference` 和待审计队列；没有把教程聚合物直接升格为 Skill，也没有改动原始资料。
- `scripts/test_sidecar_reports.py` 新增候选来源存在性、多来源和事实边界检查；本轮 `36/36` 通过。
- 完整回归结果：[`regression-latest.md`](regression-latest.md)；规范 Skill 仍为 56 个，客户端既有副本仍不覆盖。

## 2026-08-14 11:25–11:28 收尾增量

- RTOS 新增 6 条未回链主题卡，覆盖 Keil target 身份、queue/event group、GPIO/EXTI、共享状态、LCD/电机边界和 startup/port/heap 变体。
- 明确 16 个当前 target 源文件应先补精确符号和工程归属，不按 FreeRTOS/外设库文件拆包；HTML、Defuddle 和构建产物继续留在证据层。
- 新增 RTOS 候选分流与覆盖改进队列；规范 Skill 仍为 56 个，客户端副本未覆盖。
