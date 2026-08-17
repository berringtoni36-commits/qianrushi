# Test Results — rtos-build-flash-runtime-provenance

- 日期：2026-08-14
- 方法：静态路由、来源覆盖、事实边界和 JSON/YAML 结构审查；检查 3 条正例、2 条兄弟 Skill 诱饵和 1 条通用格式边界。
- 静态结果：6/6（100%）。覆盖 target/AXF/HEX/MAP 身份、Keil/J-Link/向量/Reset & Run/串口分层、APP 地址规划边界、FreeRTOS 启动诱饵、IAP/通信诱饵和通用格式边界。
- 真实客户端盲测：未完成；静态 6/6 不等于真实触发率或硬件验证通过率。

## 静态核对项

1. `SKILL.md` 具有合法 frontmatter，description 明确 build→flash→serial/runtime 触发条件和三个兄弟 Skill 边界。
2. 正文包含 `source_files`、`source_symbols`、R/I/A1/A2/E/B、V1/V2/V3、事实标记，并引用工程 XML、MAP、启动/串口/配置源码及四份优先文档。
3. E 流程覆盖 C0 工程合同、C1 AXF/HEX/MAP 身份、C2 J-Link algorithm/program/verify/readback、C3 向量/Reset & Run、C4 串口/runtime 证据。
4. 明确当前 `0x08000000` 主工程与 `0x0800F000` IAP 规划的差异，未把文档预期、历史 MAP、个人贡献或硬件运行夸成已验证事实。
5. `test-prompts.json` 可解析，包含 3 条 `should_trigger`、2 条 `should_not_trigger`、1 条 `edge_case`、`darwin_compatible=true` 和 `minimum_pass_rate=0.8`。
6. `agents/openai.yaml` 含带 `$rtos-build-flash-runtime-provenance` 的 default prompt，且 UI 字符串满足约束；未创建超出用户限定范围的资源文件。

## 限制

没有在当前环境重新运行 Keil、连接 J-Link、回读 Flash 或采集目标板串口，因此本交付验证的是 Skill 的来源与静态结构，不是固件 C2-C4 硬件结果。
