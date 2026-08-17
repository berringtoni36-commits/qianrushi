# 嵌入式核心蒸馏状态

处理日期：2026-08-14

当前主域 Skill 数量：14（INDEX 另保留 3 个来自 `linux-systems-tutorial` 的跨域 UDP 相关入口）。

- [x] 阶段 0：八股来源边界、主题骨架、术语和事实限制。
- [x] 阶段 1：框架、原则、案例、反例、术语候选池。
- [x] 阶段 1.5：14 个主域候选通过 V1 跨文档、V2 预测力、V3 独特性验证；3 个 UDP 合同作为跨域入口维护。
- [x] 阶段 2–3：14 个主域规范 Skill、INDEX、GLOSSARY、DIGEST、verified 和 source-map。
- [x] 阶段 4：14 个主域 Skill 均有 6 条静态压力测试；真实客户端盲测仍待执行。
- [x] 阶段 5：14 个主域 Skill 已纳入全局规范源；ZCode 副本状态见 `../CLIENT_INSTALL.md`。

## 本轮新增

- `embedded-memory-lifetime-and-pool-design`
- `embedded-cpp-resource-lifetime`
- `stm32-clock-and-sampling-timing`
- `linux-driver-device-tree-boundary`
- `embedded-c-storage-linkage-audit`
- `linux-tcp-loss-path-diagnosis`
- `linux-virtual-memory-reclaim-path`
- `linux-udp-datagram-endpoint-routing`
- `linux-udp-broadcast-reachability-contract`
- `linux-udp-multicast-interface-membership-contract`
- `linux-file-persistence-crash-consistency`
- `linux-userspace-timer-drift-audit`
- `embedded-c-struct-binary-contract-audit`
- `embedded-numeric-contract-audit`

## 范围与限制

范围：`projects/嵌入式八股/` 核心八股、FreeRTOS 源码解析和高频题；重复合并稿按派生证据处理。C 存储/链接 Skill 使用语言笔记、启动汇编、scatter 文件和 Map 快照；TCP Skill 使用网络文章和命令/参数方法论，不把教程实验数字当成目标机实测。Linux 驱动 Skill 仅使用教程和架构文档，不能写成用户已有完整驱动项目。

当前仍有大量 C/OS/网络/STM32 和小林图解文档处于 `indexed-only`，后续按已建立的生命周期、时序、通信和系统边界继续去重与蒸馏。原始文档和源码保持只读。

## Round 3 候选与处理

- [ ] `embedded-udp-reliability-contract-audit`：V1/V2/V3 通过，但当前没有对应 UDP 业务实现、抓包或故障注入证据；暂不升格，保留在候选审计记录中。
- [x] `embedded-numeric-contract-audit`：已完成 RIA++、来源存在性核验、3 正例/2 诱饵/1 边界静态测试，并安全同步到 ZCode。
- [ ] 数值候选没有目标平台数值日志或标定实验；Skill 只能输出审计方法，不能写成 STM32/PLC 项目实测。

## 未回链主题候选（2026-08-14 11:24）

- [x] 登记 8 条主题卡，均有至少两个现有来源路径、V1/V2/V3 初判和现有 Skill 关系：见 [`unlinked-topic-cards.md`](tools/distillation/embedded-core/unlinked-topic-cards.md)。
- [x] 候选分流已完成；没有新增规范 Skill，eBPF、内存和 C/C++ 合同优先并入现有 Skill：见 [`candidate-triage.md`](tools/distillation/embedded-core/candidate-triage.md)。
- [ ] 逐条补正文段落/源码符号、平台边界和预测力例题；通过用户确认和三重验证后再进入 RIA++。
