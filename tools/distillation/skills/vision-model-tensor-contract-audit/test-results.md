# Test results

- 静态检查：6/6 通过。
- 覆盖：3 条 `should_trigger`、2 条 `should_not_trigger`（分别诱饵 `linux-vision-pipeline-and-optimization` 与 `linux-vision-project-storytelling`）、1 条 `edge_case`。
- 通过判定：SKILL.md 的触发描述与六条 prompt 的任务边界一致；正例要求 tensor contract/路径/主链审计，诱饵要求转相邻 Skill，边界例要求区分文档声称与源码/模型/运行时证据。
- 真实客户端盲测：未做。没有把静态检查冒充 Darwin/客户端盲测，也没有虚报运行模型成功。
