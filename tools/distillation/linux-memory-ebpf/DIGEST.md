# Linux 物理内存碎片检测 — 精华

项目围绕一个容易误判的问题：系统总空闲内存看起来不少，但高阶连续物理页仍可能申请失败。它用 BCC/eBPF 在内核页分配路径采集事件和状态，用户态 Python 读取 Map 并展示。

## 运行链

Python 通过 BCC 加载 `extfraginfo.c` 或 `fraginfo.c`。前者挂 `mm_page_alloc_extfrag` tracepoint，后者挂 `get_page_from_freelist` kprobe。内核程序把 PID、zone、order、free pages 和指标写入 Map，Python 再读取并格式化。排障时要分开验证编译、加载、attach、事件触发、Map 更新和展示。

## 伙伴系统诊断

`order=n` 代表 `2^n` 个连续页。诊断应按 node/zone/order 比较总空闲页、总块数和可满足目标 order 的块。空闲页多而 suitable blocks 少，才更支持外部碎片；空闲页少则还要考虑内存压力和回收。score A/B 是项目计算的提示指标，不能单独下结论。

## 源码审计

项目资料明确指出节流 Map 的时间 key 存在缺陷风险。这个事实很重要：面试中可以说“设计了采样控制并实现了 Map”，但不能无条件说“节流已经正确工作”。同样，读取内核字段的 helper 不能消除结构体布局和内核版本依赖。

## 三句话

1. eBPF 监控链要按阶段验证。
2. 连续性比总空闲量更决定高阶分配。
3. 源码审计决定项目表述的可信边界。
