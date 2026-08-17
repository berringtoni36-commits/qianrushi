---
name: linux-virtual-memory-reclaim-path
description: "Use when diagnosing Linux virtual-memory pressure, first-touch page faults, page-cache versus anonymous-page reclaim, kswapd/direct reclaim, watermarks, swap, NUMA reclaim, or reclaim-related latency. Trigger phrases include ‘缺页异常’, ‘页缓存和匿名页’, ‘kswapd’, ‘direct reclaim’, ‘水位线’, ‘pgscand’, and ‘内存回收抖动’. Do not use for high-order contiguous-page/buddy fragmentation or MCU/RTOS allocation-policy design."
metadata:
  source_files:
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.1 为什么要有虚拟内存？.md"
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.2 malloc 是如何分配内存的？.md"
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.3 内存满了，会发生什么？.md"
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.4 在 4GB 物理内存的机器上，申请 8G 内存会怎么样？.md"
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.5 如何避免预读失效和缓存污染的问题？.md"
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.6 深入理解 Linux 虚拟内存管理.md"
    - "projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.7 深入理解 Linux 物理内存管理.md"
    - "projects/嵌入式八股/3. 杂七杂八/7. 嵌入式系统开发，必知的10个内存管理策略.md"
    - "projects/嵌入式八股/FreeRTOS 源码解析.md"
  source_symbols: [Page Fault Handler, brk, mmap, VMA, page cache, Active(anon), Inactive(anon), kswapd, direct reclaim, WMARK_MIN, WMARK_LOW, WMARK_HIGH, min_free_kbytes, watermark_scale_factor, swappiness, struct zone, free_area, struct page, anon_vma]
  audit_targets: [active_list, inactive_list, zone_reclaim_mode]
  related_skills: [linux-buddy-fragmentation-diagnosis, embedded-memory-lifetime-and-pool-design, linux-memory-source-audit]
---

# Linux 虚拟内存回收路径分析

把“申请成功但首次访问变慢”“页缓存/匿名页占满”“kswapd 或 direct reclaim 抖动”“还有空闲内存却 OOM/分配失败”转成一条可验证的分析链。回答中用四类标签区分证据：`[F]` 文档事实，`[V]` 内核/架构/库版本边界，`[D]` 基于事实的推导，`[U]` 尚未用目标机源码、日志或压力测试验证。

## R

- `[F]` 资料描述：malloc 先取得虚拟地址；首次访问尚未映射的页时产生缺页异常，内核再分配物理页并建立映射。
- `[F]` 文件页有对应文件：干净页可丢弃后重读，脏页需先写回；匿名页没有文件载体，通常经 Swap 换出后才能释放。
- `[F]` 资料把回收分成后台 `kswapd` 和申请线程同步执行的 direct reclaim，并用 `pgscank`、`pgscand`、`pgsteal` 及 `/proc/zoneinfo` 观察。
- `[V]` 资料中的 4 KB 页、malloc 128 KB 阈值、watermark 比例、OOM 示例和 `struct zone` 字段不能当成当前机器常数；`4.7` 还混用旧内核冷热页模型与 5.0 结构示例。

## I

不要从 `free` 低直接断言泄漏或碎片。沿六层定位：

1. **虚拟地址**：malloc/mmap 是地址空间动作，首次触摸才可能产生物理页和缺页。
2. **页类型**：分开文件页、脏文件页、匿名页和 Swap；回收成本不同。
3. **冷热与缓存**：预读和一次性扫描可能把冷页带入缓存，挤出热点；active/inactive 是资料提供的解释模型，具体实现须按版本核对。
4. **触发条件**：按 zone 的 `free/min/low/high` 判断压力，区分后台回收和 direct reclaim。
5. **性能代价**：把回收扫描、写回/Swap I/O、缺页和应用延迟放在同一时间窗口。
6. **失败出口**：区分 overcommit/地址空间申请失败、回收无效、Swap 耗尽、OOM，以及 order-N 连续页失败。

稳定的方法不是背某个计数器，而是“页来源 → 回收代价 → 水位线 → 回收线程 → 失败出口”的证据链。`[D]` 例如：匿名页 Swap I/O 可能比干净文件页丢弃更容易拉高延迟；只有目标机时间序列能把它升级为结论。

## A1

1. `4.4` 的实验说明“虚拟申请”和“首次触摸占用物理内存”是两个时点；无 Swap、Swap、overcommit 会改变表现。实验环境结果仅为 `[F]` 教程案例。
2. `4.5` 说明顺序读预读能减少 I/O，但未被访问的预读页和大范围扫描可能造成缓存污染；这是工作负载分析线索，不是命中率实测。
3. `4.3`/`4.7` 将 `pgscank`、`pgscand`、`pgsteal` 与水位线联系起来。`pgscand` 与延迟同时升高可形成 `[D]` direct reclaim 假设，不能单凭一次采样证明因果。
4. FreeRTOS 资料只用于边界对照：静态任务/缓冲区与 `pvPortMalloc` 的容量和确定性取舍，不是 Linux 页回收事实；不得把 MCU/RTOS 方案写成 Linux 机制。

## A2

触发于：

- Linux 进程 malloc/mmap 成功，但第一次 memset、顺序扫描或随机访问出现缺页、RSS 增长或长尾延迟。
- 需要区分页缓存、文件页、脏页、匿名页、Swap、active/inactive、预读失效和缓存污染。
- 出现 `kswapd` 忙、`pgscand` 高、direct reclaim 阻塞、Swap 抖动或 OOM。
- NUMA 机器总内存仍多，但本地 zone 分配/回收异常。

若核心问题是高阶连续物理页、`order`、buddyinfo、extfrag 或 compaction，转 `linux-buddy-fragmentation-diagnosis`；它负责伙伴系统和高阶物理连续页。本 Skill 不替代 `embedded-memory-lifetime-and-pool-design`，后者负责 MCU/RTOS 的静态、栈、堆、内存池、所有权和长期分配策略。项目源码实现是否真实则组合 `linux-memory-source-audit`。

## E

### 1. 固定环境和窗口

记录 `uname -a`、架构、页大小、NUMA/cgroup、Swap、工作负载和故障时间。只读采集：

```sh
getconf PAGESIZE
cat /proc/meminfo
cat /proc/zoneinfo
cat /proc/sys/vm/{overcommit_memory,swappiness,min_free_kbytes,watermark_scale_factor,zone_reclaim_mode}
swapon --show
```

缺少文件或权限受限时标 `[U]`，不要用默认值补齐。

### 2. 从申请走到缺页

1. 对比 `/proc/<pid>/maps`、`smaps_rollup` 中 heap、匿名 mmap、文件映射及 RSS/PSS 在申请前后的变化。
2. 用 `perf stat -e page-faults,minor-faults,major-faults -p <pid>` 或目标平台等价工具，和首次触摸、顺序读、随机读的时间戳对齐。
3. 申请阶段失败先查 overcommit、地址空间限制；申请成功而首次触摸后被杀，再查物理压力、Swap 和 OOM 日志，不能统称为 malloc 分配失败。

### 3. 拆页类型和冷热状态

1. 对照 `Active(anon)`/`Inactive(anon)`、`Active(file)`/`Inactive(file)` 与 `zoneinfo` 的 `nr_zone_*`，固定 node/zone。
2. 干净文件页可丢弃，脏文件页需写回；匿名页通常需写入 Swap 后释放，回访会换入。
3. 遇到顺序读/大扫描，检查预读页是否再次访问、热点页命中率是否下降；cache 变大不等于泄漏。

### 4. 区分后台回收和直接回收

1. 用 `sar -B 1` 记录 `pgscank`（kswapd 扫描）、`pgscand`（申请线程扫描）、`pgsteal`（实际偷取），同时记录应用 p99、磁盘/Swap I/O。
2. 按目标版本核对 `zoneinfo` 的 `free/min/low/high`：低于 low 通常促使后台回收，低于 min 可能进入同步 direct reclaim；zone、保留页、watermark boost、NUMA 和版本都会影响边界。
3. 回收后仍无法满足请求时，查 OOM 日志、`oom_score_adj`、Swap 是否耗尽，并确认是否实际转入伙伴系统的高阶连续页问题。

### 5. 调参只做可回滚对照

`swappiness` 是匿名页/文件页回收倾向，不是“设 0 就绝不 Swap”；`min_free_kbytes` 和 `watermark_scale_factor` 会改变保留空间/水位线间距，可能减少 direct reclaim，也可能减少应用可用内存。NUMA 下先核对本地/远端分配和 `zone_reclaim_mode`。一次只改一个参数，保留原值，比较吞吐、p99、`pgscand`、Swap/writeback I/O、OOM 和可用内存；没有对照只能标 `[U]`。

## B

- 不替代 `linux-buddy-fragmentation-diagnosis`：本 Skill 讲虚拟内存、缺页、页缓存/匿名页与回收；伙伴 Skill 讲高阶物理连续页、buddy、extfrag 和 compaction。
- 不替代 `embedded-memory-lifetime-and-pool-design`：本 Skill 不是 MCU/RTOS 静态分配、堆、栈、内存池或所有权决策器。
- 资料中的 4 KB、128 KB、默认参数、watermark 公式和 OOM 计算都有版本/架构/库/配置边界；目标版本源码优先于教程模型。
- `free`、`Cached`、RSS 或一次 `sar -B` 快照不能独立证明泄漏、缓存污染、direct reclaim 或 OOM 根因；本仓库没有目标机日志、内核配置或压力测试，因此具体阈值、因果和性能收益默认 `[U]`。

## 相关 Skills

- `linux-buddy-fragmentation-diagnosis`：伙伴系统、高阶连续页、extfrag/compaction。
- `embedded-memory-lifetime-and-pool-design`：MCU/RTOS 分配策略与生命周期。
- `linux-memory-source-audit`：文档、源码和运行状态的事实分级。

## 审计信息

- V1：4.1–4.7 交叉覆盖虚拟地址、缺页、页类型、回收、水位线和物理页；策略文章与 FreeRTOS 仅作边界对照。
- V2：可从首次触摸延迟、`pgscand`、OOM 或 NUMA 症状反推采集路径。
- V3：把虚拟承诺、页类型、冷热保护、回收触发、失败出口和版本边界合成独立流程。
- 测试：静态路由审查 6/6；不宣称真实客户端盲测命中率。
