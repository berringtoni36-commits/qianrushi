# ZCode 真实盲测记录模板

规范源：distillation/skills/。此模板只用于 ZCode 新会话中的真实路由观察，不是静态压力测试结果。不要把“模型回答了”自动记为“Skill 命中”。

## 记录规则

每条 prompt 在不知道预期答案的情况下提交，记录 ZCode 版本、会话是否新建、时间、实际加载/引用的 Skill（如界面可见）、回答是否遵守事实边界，以及是否误触发兄弟 Skill。未能观察到内部路由时填 unknown，不要猜。

推荐先做小样本：选 3 个正例、2 个诱饵和 1 个边界；若出现漏触发/误触发，再扩展到完整 336 条矩阵。

## 批次信息

    批次：
    日期/时区：
    ZCode 版本：
    是否新会话：
    规范源版本/审计时间：

## 单条记录

| 字段 | 值 |
|---|---|
| Skill 测试 ID |  |
| Prompt |  |
| 预期类型 | should_trigger / should_not_trigger / edge_case |
| 实际主 Skill | 具体名称 / none / unknown |
| 实际组合 Skill |  |
| 触发判断 | pass / miss / false-positive / ambiguous |
| 事实边界遵守 | pass / fail / unknown |
| 备注 |  |

## 汇总

| 客户端 | 正例命中 | 诱饵不误触发 | 边界可解释 | 事实边界通过 | 备注 |
|---|---:|---:|---:|---:|---|
| ZCode |  |  |  |  |  |

## 判定

- 本记录只覆盖实际提交的 prompts；没有提交的 Skill 不填“通过”。
- 单个 Skill 低于 80% 时，把失败 prompt、实际回答和误路由兄弟 Skill 记入该 Skill 的 test-results.md，再回炉 description/边界，而不是只修改统计数字。
- ZCode 副本若是 different，先记录副本哈希和版本；不要在没有明确授权时覆盖既有同名目录。

