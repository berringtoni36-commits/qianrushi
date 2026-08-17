# Linux 教程蒸馏状态

- 当前主域 Skill 数量：9。

- [x] 阶段 0：结构、术语、批判和适用边界。
- [x] 阶段 1：框架、原则、案例、反例、术语候选池。
- [x] 阶段 1.5：9 个方法论候选通过 V1/V2/V3。
- [x] 阶段 2–3：9 个规范 Skill 源、索引、术语表和 Digest。
- [x] 阶段 4：9 个 Skill 均有 6 条静态结构/触发矩阵测试；真实客户端盲测仍待执行。
- [x] 阶段 5：9 个 Skill 已纳入全局规范源；ZCode 副本状态见 `../CLIENT_INSTALL.md`。

范围：`archive/大丙Linux教程/` 47 文件；分章稿为主，合并稿为派生证据；新增进程/信号/守护化与 pthread 同步/线程池关闭两条主线；原始文件只读。

## 增量记录：`linux-rx-napi-path-diagnosis`

- [x] V1：三份指定小林文档分别覆盖软中断观测、DMA/Ring→NAPI→协议栈→Socket 生命周期和 RX/Socket 指标；糯叽叽驱动/网络资料提供独立交叉来源。
- [x] V2：用“NET_RX 高、overruns 为零、tcpdump 有包但应用超时”的新问题推导继续核对 skb、协议栈、四元组、Socket 和应用读取。
- [x] V3：以 `Δ硬 IRQ→ΔNET_RX→ΔRX/PPS→tcpdump→Recv-Q→recv/read` 为独特接收路径证据链，明确区别于 TCP 端到端与 Socket framing/复用。
- [x] 阶段增量：已生成正式 Skill、agents 元数据、6 条静态测试用例和静态 6/6 结果；不宣称真实客户端命中或用户网卡驱动实测。
- [x] 主线程已将 `linux-rx-napi-path-diagnosis` 安全同步到 ZCode；ZCode 完整副本状态以 `../CLIENT_INSTALL.md` 和根级审计为准，不在本域重复维护快照数字。
