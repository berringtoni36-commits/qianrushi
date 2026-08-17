# 下一轮开放队列

这份清单用于断点续跑。当前静态蒸馏和来源审计已经通过；下面的事项需要真实客户端、目标硬件/环境或用户选择，不能靠继续扫描原始 vault 自动完成。

## A. 需要真实环境或明确授权

1. **ZCode 新会话盲测**
   - 在 ZCode 开一个新会话。
   - 使用 [`CLIENT_BLIND_TEST_TEMPLATE.md`](CLIENT_BLIND_TEST_TEMPLATE.md) 中的正例、诱饵和边界 prompt。
   - 记录真实命中/漏触发；当前 56/56 是静态结构门槛，不是客户端命中率。

2. **ZCode 副本升级**
   - 当前 ZCode 有 56 个活动目录，与规范源一致：`same=56`、`different=0`、`missing=0`。
   - 规范源在 [`skills/`](skills/)；同步器默认不覆盖既有目录。
   - 若规范源未来变化，只有在明确允许替换后，才先备份并更新 ZCode 同名目录；其他客户端不再安装这批 Skill。

3. **目标环境验证**
   - RTOS：Keil/ARM 工具链、J-Link/SWD、串口和实际板卡。
   - Linux memory/eBPF：目标内核、BCC/libbpf、权限、探针运行和 Map 计数实测。
   - Linux vision：ARM/Qt/OpenCV/ONNX/NCNN/OpenMP 环境、摄像头输入、模型推理和性能原始日志。
   - 当前 provenance 报告已登记阻断点，但没有伪造运行结果。

## B. 资料侧开放队列

| 域 | 当前队列 | 下一动作 |
|---|---:|---|
| embedded-core | 8 条未回链主题卡；其中 eBPF/C 合同/内存主题与现有 Skill 有重叠 | 先按 `embedded-core/unlinked-topic-cards.md` 逐条补正文段落、代码符号和平台边界；通过三重验证后再决定合并还是新增 |
| linux-vision | 8 条未回链主题卡；主链、IPC、模型和优化仍有静态风险 | 先按 `linux-vision/coverage-improvement-notes.md` 补路径、构建身份、模型调用和性能证据；不要把历史 build 或文档数字当实测 |
| rtos-project | 6 条未回链主题卡；16 个当前 target 源文件仍只有域级登记 | 先按 `rtos-project/coverage-improvement-notes.md` 核对工程文件组、ISR/任务调用者和变体；不按库文件数量新增 Skill |
| RedNote | 345 条知识文档待精确回链 | 先确认 Likes 是否允许作为外部参考、Posts 是否允许按个人资料转述；再按主题挑选，不把 345 条批量升格 |
| 工作台 | 2 条来源未回链，360 条复习记录仍待主动回忆 | 补 `工作台/力扣入口.md`、`工作台/项目快刷.md` 的精确来源；主动回答后再更新掌握状态 |
| 算法 PDF | 1 个 PDF；文本层 121 页，OCR/版面仍有缺口 | 提供 OCR/人工校对凭证后再升级公式、图片和版面结论 |
| 根目录未知 | 2 条知识文档待确认 | 确认 `测试.md` 是否纳入；确认 archive 翻译是否只作存档 |
| 交互实验/Canvas | 当前原始对象为 0，历史登记已标 stale | 若重新导入原始 HTML/JS/Canvas，先做来源边界审计，不直接复活旧测试结果 |

## C. 已完成且无需重复做

- 7,146/7,146 当前来源路径登记一致。
- 56 个规范 Skill 已完成 R/I/A1/A2/E/B、静态压力矩阵和官方格式校验。
- 12 个当前来源域均有独立覆盖报告；其中 `attachments-evidence` 是证据层而非知识域，Canvas/交互实验的历史派生物、根目录未知项也有单独审计。
- 原始 vault 未改写；未复制二进制、未解包 ZIP、未执行硬件烧录或目标机运行。

每次新增资料后运行：

```bash
python3 distillation/scripts/run_regression.py
```
