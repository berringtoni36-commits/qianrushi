# 最近一次蒸馏回归

- 时间：2026-08-14T12:19:28+08:00
- 模式：refresh + check
- 总体：**通过**
- 真实 ZCode 新会话盲测：未执行；本文件不把静态回归当作客户端命中率。

## 步骤

| 步骤 | 退出码 | 耗时（秒） |
|---|---:|---:|
| `provenance report refresh` | 0 | 0.347 |
| `vault and Skill audit` | 0 | 12.284 |
| `whole-vault coverage review` | 0 | 0.640 |
| `provenance read-only check` | 0 | 0.164 |
| `Python regression tests` | 0 | 0.487 |
| `ZCode user-scope sync dry-run` | 0 | 0.053 |

## 报告合同

- 错误数：0
- 同名客户端目录只做 dry-run 检查；已存在的目录不会被覆盖。
