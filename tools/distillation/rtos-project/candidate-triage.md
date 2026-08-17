# RTOS 项目候选分流审计

## keep-for-review

| 候选 | 处置 |
|---|---|
| `keil-target-membership` | 补现有 build/flash/runtime provenance，不拆成普通构建 Skill |
| `freertos-queue-event-path` | 先核对 target 是否实际调用 queue/event group，再决定作为内核证据补充 |
| `gpio-exti-isr-handoff` | 需要 ISR、NVIC、消抖和任务通信的精确符号，可能补现有任务/通信 Skill |
| `shared-state-consistency-boundary` | 保留文档与源码不一致的反例，优先写入现有运行时故障/任务 Skill |

## merge-into-existing

- `lcd-motor-boundary`：已有 `rtos-display-buzzer-feedback` 与 `rtos-motor-pid-control`，只补来源映射。
- `startup-port-heap-variants`：已有 `rtos-freertos-config-and-boot` 与构建 provenance，不能为每个变体生成包。

## rejected-or-archive

- Defuddle 提取稿、HTML 动画和随附构建产物不单独升格为知识 Skill；它们保留在来源/证据层。
- 备用 port/heap 文件只证明“仓库中存在变体”，不证明当前 Keil target 选择或运行结果。

本轮没有删除原始文件，也没有改变 RTOS 规范 Skill 数量。
