---
title: eBPF Linux物理内存碎片检测 — 面试复习
tags: [tech, linux-kernel, ebpf, memory, interview]
created: 2026-06-15
type: permanent
summary: 基于BCC/eBPF的Linux物理内存碎片实时监控项目面试复习，含7天学习计划和15道面试题
---
# eBPF 内存碎片监控

# 复习规划与建议

| 天数    | 复习文档        | 对应八股题目                                                                                                                                                                                                                                                                        |  |
| ------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | - |
| 第 1 天 | 阶段 1          | A1：你这个项目是做什么的？能不能用 1 分钟介绍一下？A2：为什么要做物理内存碎片检测？A3：为什么空闲内存够，却分不出大块连续内存？A4：和`/proc/buddyinfo` 有什么区别？A5：`extfraginfo.c` 和 `fraginfo.c` 分别负责什么？A6：`extfrag.py` 和 `extfrag_user.py` 分别负责什么？ |  |
| 第 2 天 | 阶段 2          | **S4：eBPF 是什么？运行流程是什么？****S5：BCC 在项目里起什么作用？****S6：eBPF 如何通过`bpf()` 系统调用进入内核？****S7：BPF map 如何实现内核态和用户态通信？**A7：几个 map 分别干什么？A13：为什么要用 `bpf_probe_read_kernel()`？                                            |  |
| 第 3 天 | 阶段 3          | **S8：伙伴系统、order、zone、node 分别是什么？****S9：外部碎片、内部碎片、SLAB/SLUB 和伙伴系统关系是什么？**A3：为什么空闲内存够，却分不出大块连续内存？                                                                                                                            |  |
| 第 4 天 | 阶段 4          | **S1：tracepoint 和 kprobe 有什么区别？****S2：为什么`mm_page_alloc_extfrag` 用 tracepoint？****S3：为什么 `get_page_from_freelist` 用 kprobe？****S10：两个钩子函数什么时候被调用？作用是什么？**A8：为什么用 `delay_map` 和 `last_time_map` 控制采样？                    |  |
| 第 5 天 | 阶段 5          | A5：`extfraginfo.c` 和 `fraginfo.c` 分别负责什么？A7：几个 map 分别干什么？A9：`ALLOC_ORDER`、`FALLBACK_ORDER`、`PFN`、`COUNT` 是什么？A10：为什么 `counts_map` 按 PID 聚合？A12：为什么按 `zone + order` 统计？A13：为什么要用 `bpf_probe_read_kernel()`？       |  |
| 第 6 天 | 阶段 6          | **S11：`unusable_free_index` 和 `extfrag_index` 怎么计算？区别是什么？**A11：`fill_contig_page_info()` 做什么？为什么遍历所有 order？A12：为什么按 `zone + order` 统计？A15：项目有什么不足？如何优化？                                                                     |  |
| 第 7 天 | 阶段 7 + 总复盘 | **S12：从 Python 执行到 curses 展示，完整链路是什么？**A14：Python 是核心采集层吗？主要做什么？A15：项目有什么不足？如何优化？总复盘：**S1～S12**快速过：A1～A15                                                                                                              |  |

---

阶段 1：先搞清楚项目是什么
==========================

1.1 项目一句话定义
------------------

这个项目是一个 **基于 BCC/eBPF 的 Linux 物理内存碎片实时监控和终端可视化工具**。
它不是在看“内存用了多少”，而是在看：

**系统还能不能顺利分出大块连续物理内存。**
也就是：明明还有空闲页，但高阶连续页可能已经分不出来了。

---

1.2 项目为什么有必要
--------------------

这个项目的背景是：Linux 长时间运行后，物理内存会因为频繁分配和释放而变碎。这样会出现一种非常典型的问题：

* 系统总空闲内存看起来还够
* 但大块连续物理页不够
* 于是高阶分配失败、降级、性能下降
  传统工具如 `/proc/buddyinfo` 主要给静态文本快照，不够直观，也不够实时，所以项目才用 eBPF 做实时采集，再用 Python curses 做终端可视化。

1.3 项目总架构
--------------

项目是标准的 **“内核态采集 + 用户态展示”** 双层结构：

* **内核态**：eBPF 负责采集
* **用户态**：Python 负责加载、读取、展示

四个核心文件分别是：

* `extfraginfo.c`：监控外碎片事件
* `fraginfo.c`：统计整体碎片状态
* `extfrag.py`：桥梁层，负责加载 BPF、读 map、整理数据
* `extfrag_user.py`：命令行入口和 curses UI
  学习计划eBPF 内存碎片监控

1.4 项目最终输出什么
--------------------

项目输出分成四类：

**节点信息**

比如：

* `NODE_ID`
* `Number of Zones`
* `NODE_START_PFN`

**zone 信息**

比如：

* `ZONE_COMM`
* `ZONE_PFN`
* `SUM_PAGES`
* `FACT_PAGES`
* `ORDER`
* `TOTAL`
* `SUITABLE`
* `FREE`
* `extfrag_index`
* `unusable_index`

**外碎片事件信息**

比如：

* `COMM`
* `PID`
* `PFN`
* `ALLOC_ORDER`
* `FALLBACK_ORDER`
* `COUNT`

**curses 可视化**

项目最终用终端表格、条形图、颜色高亮来展示这些数据。

---

阶段 2：eBPF / BCC 基础
=======================

2.1 用户态和内核态
------------------

这个项目必须先分清：

* **Python 在用户态**
* **eBPF 在内核态**

为什么必须这样分？

因为真正的页分配、伙伴系统、zone、order、fallback，这些都发生在内核里。用户态普通 Python 直接看不到，所以必须让 eBPF 进入内核做现场采集，再把结果带回用户态。

---

2.2 系统调用是什么
------------------

系统调用就是：

**用户态程序请求内核帮它做底层事情的正式入口。**

在这个项目里，Python 并不是直接把代码塞进内核，而是借助 BCC，通过 `bpf()` 系统调用把 eBPF 程序加载进去。文档里明确写到：

* `BCC 将 fraginfo.c 编译为 eBPF 字节码`
* `并通过 bpf() 系统调用将其加载到内核`
* `此时 eBPF 程序挂载到目标探针点`

2.3 eBPF 是什么
---------------

eBPF 不是普通应用程序，而是：

**运行在内核里的轻量级小程序。**

它的特点：

* 不主动一直跑
* 是“挂上去，等触发”
* 适合做实时、低侵入的监控
* 不适合做复杂展示逻辑

你的学习计划里要求必须说清楚：eBPF 的运行流程、为什么它是被动触发、为什么适合做监控。

---

2.4 BCC 是什么
--------------

BCC 不是监控目标本身，它是：

**帮助你更容易使用 eBPF 的工具层。**

它负责：

* 编译 eBPF
* 加载 eBPF
* 挂探针
* 管理 map
* 给 Python 提供易用接口

文档里明确把它总结成：简化 eBPF 编写、自动处理编译与加载、提供内核与用户空间的数据传输桥梁。

---

2.5 map 是什么
--------------

map 是：

**内核态 eBPF 和用户态 Python 之间的数据通道。**

在这个项目里，map 分两类：

**结果数据**

* `counts_map`
* `pgdat_map`
* `zone_map`

**控制数据**

* `delay_map`
* `last_time_map`

文档里专门写了 `BPF_HASH` 和 `BPF_ARRAY` 的使用：不仅拿来共享采集结果，还拿来存延迟时间和上次采样时间。

---

2.6 tracepoint 和 kprobe
------------------------

**tracepoint**

* 静态探针
* 内核预定义事件
* 参数可以直接从 `args->field` 取
* 稳定、低开销、适合长期监控

**kprobe**

* 动态探针
* 可挂到具体内核函数
* 更灵活，能深入实现层
* 但更依赖函数名、参数和结构体布局

这个项目两种都用了，所以学习计划里把它列成必须掌握内容。

---

2.7 阶段 2 的关键代码你要会认
-----------------------------

**代码 1：tracepoint 形式**

项目里事件挂点的典型形式就是：

```cpp
TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag) {
    ...
}
```

这表示：把 eBPF 挂到 `kmem:mm_page_alloc_extfrag` 这个官方事件点上。项目代码里还配了 `counts_map`、`last_time_map`、`delay_map`，并在触发时读取 `args->pfn`、`args->alloc_order`、`args->fallback_order`。

exfrag

**代码 2：BCC 加载**

文档里给了典型加载逻辑：

```cpp
self.b = BPF(src_file="./bpf/fraginfo.c")
self.b["delay_map"][delay_key] = ctypes.c_int(interval)
```

这两句背后的意思是：

* 用 BCC 加载 eBPF 程序
* 再通过 `delay_map` 把采样间隔传进内核态 eBPF。

---

阶段 3：Linux 内存管理基础
==========================

3.1 页、页框、PFN
-----------------

Linux 按“页”管理物理内存，不是按字节管理。
PFN（Page Frame Number）就是：

**第几个物理页框的编号。**

项目里 PFN 相关字段很多，因为它关注的是物理内存位置：

* `PFN`：单次事件分配到的物理页位置
* `ZONE_PFN`：zone 起始页框号
* `NODE_START_PFN`：节点起始页框号

3.2 order
---------

order 表示连续页块大小，关系是：

**`2^order` 页**

比如：

* `order=0` → 1 页
* `order=1` → 2 页
* `order=2` → 4 页
* `order=3` → 8 页

高阶分配更依赖大块连续物理页，所以更容易暴露碎片问题。

---

3.3 zone 和 node
----------------

**node**

更大一级的内存节点，特别是在 NUMA 机器上

**zone**

node 里面再按用途划分的区域，比如：

* `DMA`
* `NORMAL`
* `DMA32`

项目里：

* `pgdat_info` 表示节点信息
* `zone_info` 表示区域信息

这也是为什么界面里会显示 `NODE_ID`、`ZONE_COMM`、`ZONE_PFN` 这些字段。

---

3.4 伙伴系统（Buddy System）
----------------------------

伙伴系统是 Linux 物理页分配的核心算法。它的核心思路是：

* 把空闲内存按 `2^order` 页组织成不同大小的块
* 分配时，先找当前阶
* 找不到，就往更高阶找，再拆大块
* 释放时，如果 buddy 也空闲，就尝试合并回更大的块er

这个项目几乎所有关键概念都和伙伴系统有关：

* `order`
* `free_area[order]`
* `alloc_order`
* `fallbaeck_order`
* `free_blocks_total`
* `free_blocks_suitable`

3.5 外部碎片和内部碎片
----------------------

**外部碎片**

空闲页还在，但被打散了，拼不出大块连续页

**内部碎片**

已经分出去的块内部没用满

这个项目主要盯的是：

**外部碎片**

因为它关心的是：

* 高阶连续页还能不能拿到
* 有没有 fallback
* suitable block 够不够
* extfrag\_index / unusable\_index 高不高。
  学习计划eBPF 内存碎片监控

3.6 alloc\_pages / 快速路径 / 慢速路径
--------------------------------------

Linux 页分配的主线可以先记成：

```cpp
alloc_pages(gfp_mask, order)
    ↓
__alloc_pages(...)
    ↓
get_page_from_freelist(...)
```

文档里明确写到：快速路径里最关键的核心函数就是 `get_page_from_freelist()`，成功则直接返回，失败才进入慢速路径，做回收、压缩等更重动作。

**代码地标**

```cpp
page = get_page_from_freelist(alloc_mask, order, alloc_flags, &ac);
if (likely(page))
    goto out; // 分配成功
```

这段代码最值得记，因为它直接说明了：

**`get_page_from_freelist` 就是快速路径里的核心执行点。**

---

3.7 SLAB / SLUB 在哪一层
------------------------

这一步很多人容易漏。

**伙伴系统**

管“页”和“连续页块”

**SLAB / SLUB**

管“小对象”

关系是：

* SLAB/SLUB 建在伙伴系统之上
* 它向下还是要找伙伴系统拿页
* 它主要优化小对象分配和内部碎片
* 伙伴系统主要处理外部碎片和页级分配

文档里已经非常直接地总结过：

**“SLAB 分配器：伙伴系统解决外部碎片问题，SLAB 优化内部碎片管理。”**

---

3.8 阶段 3 的关键代码和结构你要会认
-----------------------------------

**结构 1：`pgdat_info`**

节点信息：

```cpp
struct pgdat_info {
  u64 pgdat_ptr;
  int nr_zones;
  int node_id;
};
```

**结构 2：`zone_info`**

区域信息：

```cpp
struct zone_info {
  u64 zone_ptr;
  u64 zone_start_pfn;
  u64 spanned_pages;
  u64 present_pages;
  unsigned long free_pages;
  unsigned long free_blocks_total;
  unsigned long free_blocks_suitable;
  char name[32];
  int order;
  int score_a;
  int score_b;
  int node_id;
};
```

**结构 3：`contig_page_info`**

连续页信息：

```cpp
struct contig_page_info {
  unsigned long free_pages;
  unsigned long free_blocks_total;
  unsigned long free_blocks_suitable;
};
```

这些结构在文档里都明确给出来了，它们分别对应节点信息、zone 信息和连续页块统计。

---

阶段 4：两个关键内核挂点
========================

4.1 第一个挂点：`mm_page_alloc_extfrag`
----------------

这是一个 **tracepoint**。
它在什么情况下触发？

**当分配因为碎片化需要 fallback / 降级时触发。**

文档里给的解释很明确：

* 如果请求某个连续页块
* 但对应阶空闲链表不足
* 内核只好从更高阶拆分
* 这时会触发 `mm_page_alloc_extfrag`
* 说明存在碎片问题。

**你要怎么理解它**

它不是“普通分配成功事件”，
它是：

**“碎片已经影响到真实分配行为”的事件。**

---

4.2 `mm_page_alloc_extfrag` 采什么
-----------

它采的是事件型数据：

* `COMM`
* `PID`
* `PFN`
* `ALLOC_ORDER`
* `FALLBACK_ORDER`
* `COUNT`

这套字段回答的是：

* 谁触发的
* 当时申请多大
* 最后退成什么
* 这种事发生了多少次

所以它是：

**故障事件视角 / 症状视角**。

---

4.3 `mm_page_alloc_extfrag` 的关键代码地标
-------------------

项目代码里最关键的这一段你一定要能看懂：

```cpp
struct data_t {
  u64 pfn;
  int alloc_order;
  int fallback_order;
  pid_t pid;
  u64 count;
  char pcomm[32];
};

BPF_HASH(counts_map, pid_t, struct data_t);
BPF_HASH(last_time_map, u64, u64);
BPF_ARRAY(delay_map, int, 1);

TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag) {
  ...
  pid_t pid = bpf_get_current_pid_tgid() >> 32;
  ...
  zero.pfn = args->pfn;
  zero.alloc_order = args->alloc_order;
  zero.fallback_order = args->fallback_order;
  ...
}
```

这段代码最值得记的点有四个：

1. `data_t` 是事件记录结构
2. `counts_map` 用 PID 聚合
3. `last_time_map` / `delay_map` 控制采样频率
4. `args->pfn / alloc_order / fallback_order` 是 tracepoint 直接给你的核心字段。

---

4.4 第二个挂点：`get_page_from_freelist`
----------------

这是一个 **kprobe 挂点**，对应伙伴系统快速路径核心函数。
它什么时候被调用？

**当内核进行页分配、优先尝试快速路径时，它会被调用。**

文档里写得很清楚：

* 它是伙伴系统核心函数
* 负责 fast path 中尝试从空闲链表分配连续物理页
* 成功直接返回，失败才进慢速路径。

**你要怎么理解它**

它不是事件报警点，
它是：

**真实分配现场的体检点。**

---

4.5 `get_page_from_freelist` 采什么
-----------

它采的是状态型数据，分成三层：

**1\. 节点信息**

* `NODE_ID`
* `Number of Zones`
* `NODE_START_PFN`

**2\. zone 信息**

* `ZONE_COMM`
* `ZONE_PFN`
* `SUM_PAGES`
* `FACT_PAGES`

**3\. order 维度状态**

* `ORDER`
* `TOTAL`
* `SUITABLE`
* `FREE`
* `extfrag_index`
* `unusable_index`

这套字段回答的是：

* 当前是哪个 node / zone
* 当前总空闲页多少
* 总空闲块多少
* 真正适合当前请求的连续块多少
* 当前碎片压力多大

所以它是：

**整体状态视角 / 体检报告视角**。

---

4.6 `get_page_from_freelist` 的关键代码地标
-------------------

这个挂点最关键的逻辑是：

**函数签名**

```cpp
int kprobe__get_page_from_freelist(struct pt_regs *ctx, gfp_t gfp_mask,
                                   unsigned int order, int alloc_flags,
                                   const struct alloc_context *ac)
```

这里最值得记的是：

* `order`：请求多大的连续页块
* `ac`：当前分配上下文，里面有 node / zone 线索。
  linux物理内存检测工具：

**统计 zone + order 数据**

```cpp
for (a_order = 0; a_order <= MAX_ORDER; ++a_order) {
  zone_data.order = a_order;
  fill_contig_page_info(z, a_order, &ctg_info);
  zone_data.free_blocks_suitable = ctg_info.free_blocks_suitable;
  zone_data.free_blocks_total = ctg_info.free_blocks_total;
  zone_data.free_pages = ctg_info.free_pages;
  tmp = unusable_free_index(a_order, &ctg_info);
  zone_data.score_b = tmp;
  index = __fragmentation_index(a_order, &ctg_info);
  zone_data.score_a = index;
  zone_map.update(&zone_key, &zone_data);
}
```

这段代码最重要，因为它直接说明：

* 项目不是只看一个总值
* 它是按 **每个 zone、每个 order** 去统计
* 然后再计算两个碎片指标。

4.7 为什么一个用 tracepoint，一个用 kprobe
------------------------------------------

这不是随便选的，而是设计上的互补。

**`mm_page_alloc_extfrag` 用 tracepoint**

因为这里是官方预定义事件：

* 稳定
* 语义明确
* 参数直接拿
* 适合长期监控事件。

**`get_page_from_freelist` 用 kprobe**

因为项目要深入到伙伴系统函数内部：

* 看 `alloc_context`
* 看 `zone`
* 看 `free_area[order]`
* 看各阶块分布

这些高层事件不给，所以必须挂函数。

---

4.8 两个挂点的关系：不是重复，是互补
------------------------------------

这个一定要记死。

`mm_page_alloc_extfrag`

看的是：

**问题已经发生给谁了。**

`get_page_from_freelist`

看的是：

**系统为什么会出这个问题。**

所以：

* 一个是**事件层**
* 一个是**状态层**

你以后最好的复述方式就是：

> `mm_page_alloc_extfrag` 像故障单，`get_page_from_freelist` 像体检报告。
> 一个看已经发生的碎片化事件，一个看当前伙伴系统整体健康度。

---

4.9 时间采样控制：`delay_map` / `last_time_map`
---------------------

这两个 map 很关键，但很多人容易当细枝末节。

`delay_map`

存“采样间隔配置”

`last_time_map`

存“上一次真正采样的时间”

工作逻辑

每次探针被触发后：

1. 先用 `bpf_ktime_get_ns()` 取当前时间
2. 再取上次采样时间
3. 再看 delay 设定
4. 如果间隔还没到，就直接返回，不采

这套设计是为了：

* 防止高频函数路径采样过重
* 控制 map 更新频率
* 让项目更适合长期、低开销运行在生产环境。

关键代码地标

```cpp
current_time = bpf_ktime_get_ns();
last_time = last_time_map.lookup(&current_time);
int *delay_ptr = delay_map.lookup(&key);
if (last_time && (current_time - *last_time < delay * 1000000000)) {
    return 0;
}
```

这一段的本质就是：

**“虽然这次触发了，但不到采样窗口，就先不干活。”**

---

阶段 5：精读内核态 eBPF 源码
============================

5.1 这一阶段到底要达到什么目标
------------------------------

第 5 阶段不是“知道有两个 C 文件”就算学完，而是要做到：**不看文档，也能自己把 `extfraginfo.c` 和 `fraginfo.c` 的职责、挂载点、执行流程、数据结构、map、以及它们和用户态的关系讲清楚。** 学习计划里对这一阶段写得很明确：要掌握 `data_t`、`counts_map`、`last_time_map`、`delay_map`、`TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)` 的流程；还要掌握 `pgdat_info`、`zone_info`、`contig_page_info`、`pgdat_map`、`zone_map`、zonelist 遍历、`zone->free_area[order].nr_free` 的安全读取、以及“每个 zone + order 一条记录”的统计方式。

你可以把阶段 5 的目标压成一句话：

**这一阶段的目的，是把“两个挂点做什么”真正落到代码层面，搞清楚每一段 eBPF 程序到底在采什么、为什么这么采、采完放到哪里。**

---

5.2 `extfraginfo.c` 的总体定位
---------------

`extfraginfo.c` 的定位一定要记牢：**它不是看“系统整体碎片状态”，它是专门看“因为碎片而发生的降级分配事件”。** 也就是说，它回答的问题不是“当前各个 zone 的指数是多少”，而是“刚才到底是谁因为碎片问题触发了一次 fallback 分配、申请多大、最后退成了多大、总共发生了多少次”。项目说明里把它定义成“监控内存碎片化分配”，挂点是 `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)`；学习计划也把它列成“外碎片事件视角”的核心文件。

你复习时一定要把它和 `fraginfo.c` 分开记：

* `extfraginfo.c`：**事件型探针**
* `fraginfo.c`：**状态型探针**

最好的记忆方法就是：

> `extfraginfo.c` 像“故障单”，记录“问题已经发生给谁了”；
> `fraginfo.c` 像“体检报告”，记录“当前整体状态为什么会变成这样”。

---

5.3 `extfraginfo.c` 的核心数据结构和 map
-------------------------

你以后复习 `extfraginfo.c`，先背这一小段代码骨架：

```cpp
struct data_t {
  u64 pfn;
  int alloc_order;
  int fallback_order;
  pid_t pid;
  u64 count;
  char pcomm[32];
};

BPF_HASH(counts_map, pid_t, struct data_t);
BPF_HASH(last_time_map, u64, u64);
BPF_ARRAY(delay_map, int, 1);
```

这套结构和 map 的作用，你必须能逐个解释。项目文档对这几个字段和 map 的语义已经写得很清楚：`COMM / PID / PFN / ALLOC_ORDER / FALLBACK_ORDER / COUNT` 构成事件输出；`counts_map` 用 PID 作为 key 做聚合；`delay_map` 和 `last_time_map` 负责采样间隔控制。

`struct data_t`

这是**单条“进程级碎片化事件统计记录”**，不是完整历史日志。字段含义如下：

* `pfn`：这次分配涉及的物理页帧号。它回答“落在了哪个物理页附近”。
* `alloc_order`：最初请求的连续页块阶数。
* `fallback_order`：实际退化到的阶数。它越能体现“这次碎片化对分配行为影响有多明显”。
* `pid`：触发事件的进程号。
* `count`：这个进程累计触发这类事件多少次。
* `pcomm`：进程名，方便用户态展示时不只看到 PID。

`counts_map`

它的本质是：**按 PID 聚合“碎片化降级分配事件”的统计结果。**
这里一个很重要的理解点是：它不是每次事件都单独留一条日志，而是把“这个进程累计发生多少次 + 最近一次事件细节”放到一条记录里。这样做的好处是更适合在界面上做排行榜：哪个进程最频繁触发问题。

`delay_map`

它是长度为 1 的数组，本质上是一个**用户态写给内核态的配置项**。用户态 Python 会把 `interval` 写到 `delay_map[0]`，让 eBPF 程序知道“最短多久采一次”。`extfrag.py` 的初始化代码就是这么做的。

`last_time_map`

它记录上一次真正采样的时间戳，用于与 `delay_map` 配合做节流。也就是说，即使探针被频繁触发，也不会每次都完整执行采集逻辑。这样能显著降低高频路径上的性能影响。

---

5.4 `TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag)` 的完整执行流程
-------------------

这是 `extfraginfo.c` 的灵魂。你以后复习时，最好把这段骨架直接过一遍：

```cpp
TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag) {
  u64 *last_time, current_time;
  current_time = bpf_ktime_get_ns();
  last_time = last_time_map.lookup(&current_time);
  int key = 0;
  int *delay_ptr = delay_map.lookup(&key);
  int delay;
  if (delay_ptr) {
    delay = *delay_ptr;
  }
  if (last_time && (current_time - *last_time < delay * 1000000000)) {
    return 0;
  }

  struct data_t *data, zero = {};
  pid_t pid = bpf_get_current_pid_tgid() >> 32;

  data = counts_map.lookup(&pid);
  if (!data) {
    zero.pid = pid;
    zero.pfn = args->pfn;
    zero.alloc_order = args->alloc_order;
    zero.fallback_order = args->fallback_order;
    zero.count = 1;
    bpf_get_current_comm(&zero.pcomm, sizeof(zero.pcomm));
    counts_map.update(&pid, &zero);
  } else {
    data->count += 1;
    data->pfn = args->pfn;
    data->alloc_order = args->alloc_order;
    data->fallback_order = args->fallback_order;
    bpf_get_current_comm(&data->pcomm, sizeof(data->pcomm));
    counts_map.update(&pid, data);
  }

  return 0;
}
```

项目文档和简述都说明了：这个 tracepoint 在“因为碎片需要 fallback”时触发，代码会从 `args` 里直接取 `pfn / alloc_order / fallback_order`，再通过 `bpf_get_current_pid_tgid()` 和 `bpf_get_current_comm()` 绑定到具体进程。

**第一步：先做时间过滤**

```cpp
current_time = bpf_ktime_get_ns();
last_time = last_time_map.lookup(&current_time);
int key = 0;
int *delay_ptr = delay_map.lookup(&key);
...
if (last_time && (current_time - *last_time < delay * 1000000000)) {
    return 0;
}
```

这一段的目的不是“采数据”，而是**先判断这次要不要采**。核心思想是：

1. 用 `bpf_ktime_get_ns()` 拿到纳秒级时间戳。
2. 从 `delay_map[0]` 取出用户设置的采样间隔。
3. 如果离上次采样还没到 `delay` 秒，就直接返回。

这里你复习时一定要记住：**采样控制不是无关紧要的小细节，而是让这个工具能长期低开销运行的关键设计。** 文档里专门把 `delay_map / last_time_map / bpf_ktime_get_ns()` 作为关键点说明。

**第二步：获取当前进程上下文**

```cpp
pid_t pid = bpf_get_current_pid_tgid() >> 32;
bpf_get_current_comm(&zero.pcomm, sizeof(zero.pcomm));
```

这两句分别做了两件事：

* 从内核 helper `bpf_get_current_pid_tgid()` 里取出当前进程 PID。
* 用 `bpf_get_current_comm()` 读出当前进程名。

这个设计很关键，因为 tracepoint 原生参数里并没有直接给你进程名，所以必须通过 eBPF helper 再补一层进程上下文，最终才能把事件绑定到“哪个进程在制造碎片压力”。

**第三步：从 tracepoint `args` 里直接取事件字段**

```cpp
zero.pfn = args->pfn;
zero.alloc_order = args->alloc_order;
zero.fallback_order = args->fallback_order;
```

这正是 tracepoint 的优势：**参数是内核预定义好的，结构稳定，而且可以直接 `args->field` 访问。**这里你以后一定要会讲这三个字段：

* `args->pfn`：实际分配落点的页帧号。
* `args->alloc_order`：原始请求阶数。
* `args->fallback_order`：实际退到的阶数。

当 `alloc_order` 比 `fallback_order` 大，或者本来需要高阶块却只能退到低阶块时，这类信息就能直接体现外部碎片已经影响到了真实分配行为。

**第四步：按 PID 聚合**

```cpp
data = counts_map.lookup(&pid);
if (!data) {
    ...
    zero.count = 1;
    counts_map.update(&pid, &zero);
} else {
    data->count += 1;
    ...
    counts_map.update(&pid, data);
}
```

这段一定要会解释：
**不是每来一次事件就打印一条，而是按 PID 聚合。**

原因有两个：

1. 这个项目要找的是“哪个进程最频繁触发外碎片事件”，按 PID 聚合最符合这个目标。
2. map 空间有限，直接做过程内聚合比保存全量事件日志更实用。

所以 `count` 的意义是：**这个进程截至当前已经累计触发多少次这类事件。**

---

5.5 `extfraginfo.c` 复习时最容易卡住的难点
---------------------------

**难点 1：为什么它不算指数**

因为它的职责根本不是“体检”，而是“报事件”。
指数那一套在 `fraginfo.c`。`extfraginfo.c` 只负责把“碎片已经影响分配了”这件事记下来。

**难点 2：为什么按 PID 聚合，而不是按 PFN、按 order 聚合**

因为项目关注的是**责任定位**。
PFN 和 order 是事件细节，但运维/分析时更关心“到底哪个进程频繁触发问题”。这就是 `counts_map` 用 PID 当 key 的原因。

**难点 3：tracepoint 为什么适合这里**

因为 `mm_page_alloc_extfrag` 本身就是内核官方定义好的稳定事件，语义非常明确：**分配因为碎片化发生 fallback。** 所以它天然适合做“长期、稳定、低开销”的事件监控。

---

5.6 `fraginfo.c` 的总体定位
---------------

如果说 `extfraginfo.c` 记录的是“问题已经发生给谁了”，那 `fraginfo.c` 记录的就是：**当前系统整体为什么会变成这样。**
它挂在 `get_page_from_freelist` 入口，通过遍历 node 和 zone，再对每个 `order` 统计空闲块情况和两个指数，最后写入 `pgdat_map` 和 `zone_map`，让用户态看到的是一张“系统当前碎片健康报告”。项目说明和你的学习计划都明确把 `fraginfo.c` 定义成“统计系统中所有内存节点中的所有 zone 对不同 order 的碎片化程度”的核心文件。

你复习时最好这样记它：

> `fraginfo.c` 不是看“某一次分配”，而是看“当前所有相关 zone 在不同 order 下的整体状态”。
> 它是状态型、巡检型、体检报告型的 eBPF 程序。

---

5.7 `fraginfo.c` 的关键结构体和 map
-----------------------

`fraginfo.c` 的骨架代码你以后必须反复看这一段：

```cpp
#define MAX_ORDER 10

struct pgdat_info {
  u64 pgdat_ptr;
  int nr_zones;
  int node_id;
};

struct zone_info {
  u64 zone_ptr;
  u64 zone_start_pfn;
  u64 spanned_pages;
  u64 present_pages;
  unsigned long free_pages;
  unsigned long free_blocks_total;
  unsigned long free_blocks_suitable;
  char name[32];
  int order;
  int score_a;
  int score_b;
  int node_id;
};

struct alloc_context {
  struct zonelist *zonelist;
  nodemask_t *nodemask;
  struct zoneref *preferred_zoneref;
  int migratetype;
  enum zone_type highest_zoneidx;
  bool spread_dirty_pages;
};

struct contig_page_info {
  unsigned long free_pages;
  unsigned long free_blocks_total;
  unsigned long free_blocks_suitable;
};

BPF_HASH(pgdat_map, u64, struct pgdat_info);
BPF_HASH(zone_map, u64, struct zone_info);
BPF_HASH(last_time_map, u64, u64);
BPF_ARRAY(delay_map, int, 1);
```

这段代码在你确认正确的 `fraginfo.c` 里有完整实现，文档也对这些结构和 map 的用途做了解释。

`pgdat_info`

这是**节点级信息**。它记录：

* `pgdat_ptr`：这里代码里实际存的是 `node_start_pfn` 这类节点起始信息。
* `nr_zones`：这个 node 下有几个 zone。
* `node_id`：节点编号。

也就是说，它给用户态提供的是“node 头信息”。

`zone_info`

这是**zone + order 级信息**，是整个项目里最重要的展示结构之一。
它记录的不是“某个 zone 的一个总分”，而是“某个 zone 在某个 order 下的一条完整记录”。这也是为什么它里面既有 `zone_start_pfn`、`spanned_pages` 这类静态属性，也有 `free_pages`、`free_blocks_total`、`free_blocks_suitable`、`score_a`、`score_b` 这类动态统计值。

`alloc_context`

它不是你自己“发明”的业务结构，而是为了在 kprobe 里正确解析 `get_page_from_freelist` 的参数。最关键的字段是：

* `preferred_zoneref`

因为主函数正是从这里出发找到当前相关 node 和 zone 的。

`contig_page_info`

这个结构体只有三个字段，但非常关键：

* `free_pages`
* `free_blocks_total`
* `free_blocks_suitable`

它是**两个指数函数的输入**。
你以后要把它看成“中间统计结果盒子”，不是最终界面结构。

`pgdat_map` / `zone_map`

* `pgdat_map`：存 node 级数据。
* `zone_map`：存 zone + order 级数据。

用户态大多数展示，最终都是从这两个 map 里读出来的。

---

5.8 `fill_contig_page_info()` 在阶段 5 里先怎么理解
--------------------------

虽然它会在阶段 6 详细展开，但在阶段 5 你先要知道：
**`fill_contig_page_info()` 的职责不是直接给分，而是先把“原材料”统计好。**

代码如下：

```cpp
static void fill_contig_page_info(struct zone *zone,
                                  unsigned int suitable_order,
                                  struct contig_page_info *info) {
  unsigned int order;
  info->free_pages = 0;
  info->free_blocks_total = 0;
  info->free_blocks_suitable = 0;
  for (order = 0; order <= MAX_ORDER; order++) {
    unsigned long blocks;
    unsigned long nr_free;
    bpf_probe_read_kernel(&nr_free, sizeof(nr_free),
                          &zone->free_area[order].nr_free);
    blocks = nr_free;
    info->free_blocks_total += blocks;
    info->free_pages += blocks << order;
    if (order >= suitable_order)
      info->free_blocks_suitable += blocks << (order - suitable_order);
  }
}
```

这一段你在阶段 5 先抓住三点：

1. 它**遍历所有阶**，不是只看目标阶。
2. 它算出的是三个中间量：`free_pages`、`free_blocks_total`、`free_blocks_suitable`。
3. 后面的 `unusable_free_index()` 和 `__fragmentation_index()` 都是吃这三个量来算分的。

---

5.9 `kprobe__get_page_from_freelist` 完整展开
-------------

这部分是第 5 阶段最难、也最值钱的地方。
你以后复习时，主函数一定要按“段落”理解，而不要把它看成一大坨代码。

函数签名是：

```cpp
int kprobe__get_page_from_freelist(struct pt_regs *ctx, gfp_t gfp_mask,
                                   unsigned int order, int alloc_flags,
                                   const struct alloc_context *ac)
```

文档对这个签名的解释也很明确：`ctx` 是寄存器上下文，`gfp_mask` 是分配标志，`order` 是请求阶数，`alloc_flags` 是分配控制标志，`ac` 是分配上下文，里面带着当前 node/zone 的线索。

---

**5.9.1 第一段：时间过滤**

```cpp
u64 *last_time, current_time;
current_time = bpf_ktime_get_ns();
last_time = last_time_map.lookup(&current_time);
int key = 0;
int *delay_ptr = delay_map.lookup(&key);
int delay;
if (delay_ptr) {
  delay = *delay_ptr;
}
if (last_time && (current_time - *last_time < delay * 1000000000)) {
  return 0;
}
```

这段逻辑和 `extfraginfo.c` 是同一类思路：
**高频路径先做采样节流。**

你复习时要记住两个层次：

* 设计目的：避免每次 fast path 分配都完整巡检，降低开销。
* 技术手段：`bpf_ktime_get_ns()` 取时间，`delay_map[0]` 取间隔，`last_time_map` 保存上次采样时间。

所以这段不是“多余代码”，而是让这个工具能在生产环境长期跑的关键一环。

---

**5.9.2 第二段：从 `alloc_context` 找到当前相关 node**

```cpp
struct pglist_data *pgdat;
...
pgdat = ac->preferred_zoneref->zone->zone_pgdat;
```

这句是整个主函数的“起点”。
它的意思是：

**从当前分配上下文的首选 zone 出发，找到它所属的 NUMA 节点描述符。**

你以后要会把它翻译成人话：

> 这次页分配优先想从哪个 zone 找页，我就先从那个 zone 反推出它属于哪个 node，然后围绕这个 node 开始巡检。

---

**5.9.3 第三段：遍历 zonelist**

```cpp
for (i = 0; i < MAX_NR_ZONES; i++) {
    struct zone_info zone_data = {};
    struct pgdat_info pgdat_data = {};
    struct pgdat_info *a_pgdat;
    struct pglist_data *pgdata;
    u64 node_key, zone_key;
    zref = &pgdat->node_zonelists[ZONELIST_FALLBACK]._zonerefs[i];
    z = zref->zone;
    if (!z)
      continue;
```

这段代码的含义是：

**沿着当前 node 的 fallback zonelist，一个 zone 一个 zone 地看。**

你一定要记住几点：

1. `zone_data = {}` 表示每进入一个 zone，先准备一份空白的 zone 记录。
2. `pgdat_data = {}` 表示如果这是第一次见到某个 node，就准备把 node 信息写进去。
3. `zref = ... _zonerefs[i]` 再 `z = zref->zone`，表示 zonelist 里先是“zone 引用”，再从引用拿真正的 `zone`。
4. `if (!z) continue;` 表示空项跳过。

所以这段不是“随便遍历”，而是在**顺着内核真正的 zone 备选顺序做巡检**。

---

**5.9.4 第四段：更新 `pgdat_map` 节点信息**

```cpp
pgdata = z->zone_pgdat;
if (!pgdata)
  continue;
node_key = (u64)pgdata;
a_pgdat = pgdat_map.lookup(&node_key);
if (!a_pgdat) {
  pgdat_data.pgdat_ptr = (u64)pgdata->node_start_pfn;
  pgdat_data.nr_zones = pgdata->nr_zones;
  pgdat_data.node_id = pgdata->node_id;
  pgdat_map.update(&node_key, &pgdat_data);
}
```

这段逻辑的关键点是：

* 先从当前 zone 反查它所属的 node。
* 再用这个 node 的地址作为 `pgdat_map` 的 key。
* 如果之前没记录过这个 node，就初始化一条 `pgdat_info`。

你以后讲这段时，可以直接说：

**`pgdat_map` 负责存 node 头信息，而且通常是首次见到某个 node 时才写一次。**
因为 node 的基础属性不会像 zone + order 那样在每个循环里变化很大。

---

**5.9.5 第五段：填充 `zone_data` 的静态字段**

```cpp
zone_data.zone_ptr = (u64)z;
zone_data.zone_start_pfn = z->zone_start_pfn;
zone_data.spanned_pages = z->spanned_pages;
zone_data.present_pages = z->present_pages;
zone_data.node_id = z->zone_pgdat->node_id;
bpf_probe_read_kernel_str(&zone_data.name, sizeof(zone_data.name), z->name);
```

这段的作用是：
**先把“这个 zone 自己是谁”这部分信息填好。**

必须会讲的字段有：

* `zone_ptr`：zone 本身的唯一标识。
* `zone_start_pfn`：zone 从哪个 PFN 开始。
* `spanned_pages`：这个 zone 跨度覆盖多少页。
* `present_pages`：这个 zone 实际存在多少页。
* `node_id`：它属于哪个 node。
* `name`：zone 名称，比如 DMA / NORMAL / DMA32。

其中 `bpf_probe_read_kernel_str()` 这一句要特别记：
**字符串不能直接乱解引用，要用 eBPF 的安全读取 helper。** 这正是 kprobe 里读复杂内核结构体时最容易出错的地方。

---

**5.9.6 第六段：对每个 `order` 计算一条 `zone_info`**

```cpp
for (a_order = 0; a_order <= MAX_ORDER; ++a_order) {
  zone_data.order = a_order;
  zone_key = zone_data.zone_ptr + zone_data.order;

  struct contig_page_info ctg_info;
  fill_contig_page_info(z, a_order, &ctg_info);
  zone_data.free_blocks_suitable = ctg_info.free_blocks_suitable;
  zone_data.free_blocks_total = ctg_info.free_blocks_total;
  zone_data.free_pages = ctg_info.free_pages;

  tmp = unusable_free_index(a_order, &ctg_info);
  zone_data.score_b = tmp;
  index = __fragmentation_index(a_order, &ctg_info);
  zone_data.score_a = index;

  zone_map.update(&zone_key, &zone_data);
  zone_key++;
}
```

这是整个 `fraginfo.c` 最值钱的一段代码。它要表达的核心思想你必须背熟：

> **同一个 zone 的碎片化情况，不是一个总值能概括的，而是要看“对哪个 order 的请求而言”。**

所以代码才会：

1. 外层先遍历 zone。
2. 内层再从 `a_order = 0` 一直到 `MAX_ORDER`。
3. 对每个 `zone + order` 组合都生成一条记录。

这就是为什么项目输出不是“每个 zone 一个分数”，而是可以看到某个 zone 在 `order=0 / 1 / 2 / ...` 下的完整状态。

你这里一定要把 4 个关键动作记牢：

**动作 1：`fill_contig_page_info(z, a_order, &ctg_info);`**

先把当前 zone 在当前目标阶 `a_order` 下的原材料统计出来。它给出的不是最终分数，而是：

* `free_pages`
* `free_blocks_total`
* `free_blocks_suitable`

**动作 2：把原材料拷到 `zone_data`**

```cpp
zone_data.free_blocks_suitable = ctg_info.free_blocks_suitable;
zone_data.free_blocks_total = ctg_info.free_blocks_total;
zone_data.free_pages = ctg_info.free_pages;
```

这一步让中间统计结果进入最终展示结构。

**动作 3：算两个指数**

```cpp
tmp = unusable_free_index(a_order, &ctg_info);
zone_data.score_b = tmp;
index = __fragmentation_index(a_order, &ctg_info);
zone_data.score_a = index;
```

也就是说：

* `score_b` = `unusable_free_index`
* `score_a` = `extfrag_index`

这两个字段会直接被用户态读取并显示。

**动作 4：写入 `zone_map`**

```cpp
zone_map.update(&zone_key, &zone_data);
```

这意味着：**最终用户态看到的 zone 表，本质上就是 `zone_map` 里每条 `zone + order` 记录。**

---

**5.9.7 第七段：更新时间并返回**

```cpp
last_time_map.update(&current_time, &current_time);
return 0;
```

收尾就两件事：

1. 把这次采样时间记下来，供下次节流判断。
2. 正常返回 `0`，表示这只是监控，不改变内核原本分配逻辑。

这一点你以后讲项目时可以顺手带一句：

**这个工具是低侵入观察型工具，不会改写内核页分配行为。**

---

5.10 第 5 阶段最容易混淆的 6 个点
---------------------------------

**1）为什么一个用 tracepoint，一个用 kprobe**

因为两者职责不同：

* `mm_page_alloc_extfrag` 本身就是内核官方预定义事件，语义明确，适合 tracepoint。
* `get_page_from_freelist` 是伙伴系统内部关键函数，想深入看 `alloc_context`、`zone`、`free_area[order]`，就必须上 kprobe。

所以这不是随便选的，而是**设计上的互补**。

**2）为什么两个挂点不是重复**

不是两个都在“看碎片”，而是：

* `mm_page_alloc_extfrag`：看**问题发生了没有**
* `get_page_from_freelist`：看**当前整体状态为什么会这样**

一个偏事件，一个偏状态。

**3）为什么 `fraginfo.c` 要按 `zone + order` 记录**

因为碎片化不是一个 zone 一个总值能讲清楚。
同一个 zone 对 `order=0` 可能很好，对 `order=8` 可能已经非常差。

**4）为什么要遍历所有阶**

因为更高阶块也能拆成目标阶块。
如果你只看 `free_area[suitable_order]`，就会漏掉大量“其实还能服务当前请求”的高阶块。

**5）为什么 `bpf_probe_read_kernel()` / `_str()` 很关键**

因为 eBPF 不能像普通内核代码那样随便直接读复杂内核结构。kprobe 里读取：

* `zone->free_area[order].nr_free`
* `z->name`

都必须走安全 helper。

**6）为什么采样控制不是细枝末节**

因为两个挂点都在高频路径上。
如果每次都完整执行，开销会很大。`delay_map + last_time_map` 正是保证“低侵入、可长期运行”的关键。

---

阶段 6：掌握碎片化指标怎么计算
==============================

6.1 这一阶段到底在学什么
------------------------

第 6 阶段的本质不是“背两个公式”，而是要做到：

1. 先理解 `fill_contig_page_info()` 给了哪些原材料。
2. 再理解 `unusable_free_index()` 和 `__fragmentation_index()` 到底分别在衡量什么。
3. 最后知道：**这两个指标为什么比只看 `/proc/buddyinfo` 更有价值。**

学习计划里明确写了这一阶段的 5 个点：

* `fill_contig_page_info()`
* `unusable_free_index()`
* `__fragmentation_index() / extfrag_index`
* 两个指标的区别
* 阈值和调优意义

6.2 `fill_contig_page_info()` 完整展开
-------------

代码如下：

```cpp
static void fill_contig_page_info(struct zone *zone,
                                  unsigned int suitable_order,
                                  struct contig_page_info *info) {
  unsigned int order;
  info->free_pages = 0;
  info->free_blocks_total = 0;
  info->free_blocks_suitable = 0;
  for (order = 0; order <= MAX_ORDER; order++) {
    unsigned long blocks;
    unsigned long nr_free;
    bpf_probe_read_kernel(&nr_free, sizeof(nr_free),
                          &zone->free_area[order].nr_free);
    blocks = nr_free;
    info->free_blocks_total += blocks;
    info->free_pages += blocks << order;
    if (order >= suitable_order)
      info->free_blocks_suitable += blocks << (order - suitable_order);
  }
}
```

这段代码在正确的 `fraginfo.c` 里完整存在，文档也对它的语义做了逐步说明。

**先看参数**

* `zone`：当前分析哪个 zone。
* `suitable_order`：当前关心的目标请求阶数。
* `info`：输出参数，用来装统计结果。

也就是说，这个函数不是“全系统扫描”，而是：**一次只分析一个 zone，且是从“当前我要判断哪种请求”这个角度去看。**

**三个初始化**

```cpp
info->free_pages = 0;
info->free_blocks_total = 0;
info->free_blocks_suitable = 0;
```

这是把中间统计结构清零。
你复习时要知道：**它不是累计历史结果，而是每次重新统计当前 zone 在当前目标阶下的状态。**

**为什么 `for (order = 0; order <= MAX_ORDER; order++)`**

这是整个函数最关键的思想：
**不能只看当前目标阶，而必须把所有阶都扫一遍。**

原因是：

* 目标阶块当然能满足请求。
* 更高阶块也能拆成目标阶块。

比如你要的是 `suitable_order = 2`（4 页块）：

* `order = 2` 的块能直接用
* `order = 3` 的块可以拆成 2 个 4 页块
* `order = 4` 的块可以拆成 4 个 4 页块

所以“只看 `free_area[2]`”是不够的。学习计划里专门把“为什么要遍历所有阶”列成必须掌握点。

**读取当前阶空闲块数**

```cpp
bpf_probe_read_kernel(&nr_free, sizeof(nr_free),
                      &zone->free_area[order].nr_free);
blocks = nr_free;
```

这里的关键是：
**读出来的是“当前阶有多少个空闲块”，不是页数。**

例如：

* `order=2`，`nr_free=3`
* 表示有 3 个“4 页块”
* 不是只有 3 页

`free_blocks_total`

```cpp
info->free_blocks_total += blocks;
```

表示：**所有阶空闲块数量的总和。**
不管块大小，都是“一块算一块”。

`free_pages`

```cpp
info->free_pages += blocks << order;
```

表示：**把当前阶的块数换成页数，再累加。**
因为一个 `order` 阶块大小就是 `2^order` 页，所以左移 `order` 位就是乘以 `2^order`。

例如：

* `order=0, blocks=10` → `10 << 0 = 10` 页
* `order=2, blocks=3` → `3 << 2 = 12` 页

`free_blocks_suitable`

```cpp
if (order >= suitable_order)
    info->free_blocks_suitable += blocks << (order - suitable_order);
```

这句是最难的，也是最值钱的。
它表示：**把当前高阶块折算成等效的目标阶块数量。**

举例：

* `suitable_order = 2`，目标是 4 页块
* 如果当前 `order = 3`，一个 8 页块可以拆成 2 个 4 页块
* 所以折算是 `1 << (3 - 2) = 2`

这就是为什么 `free_blocks_suitable` 不是“同阶块数”，而是**所有 `order >= suitable_order` 块折算后的等效可用块数。**

**最后你一定要会背它输出的 3 个量**

* `free_pages`：总空闲页数
* `free_blocks_total`：总空闲块数
* `free_blocks_suitable`：对当前请求来说可用的等效块数

这 3 个量就是后面两个指数函数的输入。

---

6.3 `unusable_free_index()` 完整展开
-------------

代码如下：

```cpp
static int unusable_free_index(unsigned int order,
                               struct contig_page_info *info) {
  if (info->free_pages == 0)
    return 1000;
  return div_u64(
      (info->free_pages - (info->free_blocks_suitable << order)) * 1000ULL,
      info->free_pages);
}
```

这段代码在正确 `fraginfo.c` 里有完整实现，项目说明和简历描述对它的含义也有明确说明：它表示“当前总空闲内存中，无法满足特定请求的比例”，范围 `0~1000`，空闲页为 0 时返回 `1000`。

**第一句：`if (info->free_pages == 0) return 1000;`**

这一句一定要背熟。含义非常直接：

* 总空闲页为 0
* 那对任何请求来说都完全不可用
* 所以返回 `1000`

也就是“100% 不可用”。

**公式展开**

```cpp
(info->free_pages - (info->free_blocks_suitable << order)) * 1000ULL
------------------------------------------------------------------
                        info->free_pages
```

把它翻译成人话就是：

> **总空闲页数 - 当前请求真正可用的页数**
> 再除以总空闲页数
> 最后乘 1000，变成整数刻度

**`info->free_blocks_suitable << order` 是什么**

这里一定不要卡住。
`free_blocks_suitable` 是“等效目标阶块数”，每个目标阶块大小是 `2^order` 页，所以左移 `order` 位后，得到的是：

**“真正能拿来满足当前请求的页数”**

**这个指标到底在回答什么**

它回答的是：

**当前总空闲页里面，有多少比例其实对这次请求没用。**

所以它更偏：

**“现象强度”**
也就是当前请求难不难、空闲页有没有被“碎成一地鸡毛”。

**例子 1：值接近 0**

假设：

* `free_pages = 20`
* `free_blocks_suitable = 5`
* `order = 2`

那么：

* `free_blocks_suitable << order = 5 << 2 = 20`
* `(20 - 20) / 20 = 0`
* 结果是 `0`

含义是：
**几乎所有空闲页都能服务当前请求。**

**例子 2：值接近 1000**

假设：

* `free_pages = 16`
* `free_blocks_suitable = 0`
* `order = 2`

那么：

* `0 << 2 = 0`
* `(16 - 0) / 16 = 1`
* 结果是 `1000`

含义是：
**虽然空闲页还在，但对 4 页连续请求来说一页都帮不上忙。**

**这个指标最容易讲错的点**

很多人会把它理解成“碎片总评分”。
这是不对的。
它衡量的是：

**“当前空闲页有多少对当前请求不可用”**

它本身不负责区分“是因为碎片，还是因为本来就没多少内存”。
“根因判断”主要交给 `extfrag_index`。

---

6.4 `__fragmentation_index()` / `extfrag_index` 完整展开
----------------

代码如下：

```cpp
static int __fragmentation_index(unsigned int order,
                                 struct contig_page_info *info) {
  unsigned long requested = 1UL << order;
  if (WARN_ON_ONCE(order > MAX_ORDER))
    return 0;
  if (!info->free_blocks_total)
    return 0;
  if (info->free_blocks_suitable)
    return -1000;
  return 1000 -
         div_u64((1000 + (div_u64(info->free_pages * 1000ULL, requested))),
                 info->free_blocks_total);
}
```

项目说明里对它的解释是：**当存在足够大的连续空闲块时，指数为负值，表示情况良好；当缺乏合适块时，指数为正值且越大越严重。** 学习计划也要求你一定要弄懂：为什么负值表示好，为什么正值表示碎片压力大，这个公式大体在衡量什么。

**第一步：`requested = 1UL << order`**

表示这次请求需要多少页。比如：

* `order=0` → 1 页
* `order=2` → 4 页
* `order=3` → 8 页

它后面是所有“理论可分配次数”判断的基准。

fraginfo

**第二步：`if (order > MAX_ORDER) return 0;`**

这是边界保护。
含义是：如果请求阶已经越界，这个输入本身就不合理，直接返回 0。

**第三步：`if (!info->free_blocks_total) return 0;`**

如果一个空闲块都没有，说明当前更像“根本没空闲块”，而不是“有空闲块但被碎坏了”。
所以这里不把它解释成严重外部碎片，而是直接返回 0。

**第四步：`if (info->free_blocks_suitable) return -1000;`**

这是整个函数最关键的一句。
只要当前还存在 suitable block，就说明：

**当前请求并没有被外部碎片真正卡死。**

所以函数直接返回 `-1000`，明确表示“情况好”。也正因为这句存在，所以你以后看到 `extfrag_index` 为负值时，要第一反应就是：

> 当前至少还有可满足请求的连续块，外部碎片压力不成立。

**第五步：真正的公式**

```cpp
1000 -
div_u64((1000 + (div_u64(info->free_pages * 1000ULL, requested))),
        info->free_blocks_total)
```

这段公式你不需要死背长相，但必须知道它在比较什么。

它的大意是：

1. 先看总空闲页 `free_pages`，理论上能支持多少次当前请求。
2. 再结合 `free_blocks_total` 看这些空闲页被分散成了多少块。
3. 如果空闲页不少，但块数很多且没有 suitable block，说明这些页“分散得太厉害”，外部碎片问题更突出。
4. 最终映射到 `0~1000` 的正区间；值越大，越偏向“碎片是主因”。

**例子 1：明显的外部碎片**

假设：

* `order = 2`，请求 4 页
* `free_pages = 16`
* `free_blocks_total = 12`
* `free_blocks_suitable = 0`

说明：

* 总页数看起来不少
* 理论上像是还能分
* 但一个合适块都没有
* 而且块数很多，说明都碎成小块了

这时 `extfrag_index` 会落在正区间，而且通常不低。
含义就是：

**问题更像是外部碎片，而不是纯粹“没内存”。**

**例子 2：更像总量不足**

假设：

* `order = 2`
* `free_pages = 2`
* `free_blocks_total = 2`
* `free_blocks_suitable = 0`

这时虽然也分配不出来，但根因更像“总空闲页本来就不够”，而不是“页很多却碎坏了”。
所以这个值可能是正的，但不会像典型外部碎片那样高。

**你最容易讲错的地方**

`extfrag_index` 不是“空闲页可用比例”，也不是“块数多少”的直接函数。
它更像是一个**根因指数**，告诉你：

**当前失败更像“碎片主导”，还是“内存本来就紧张”。**

---

6.5 两个指数到底怎么配合看
--------------------------

这是第 6 阶段最值钱的地方。
你以后一定要会讲出这两者的分工：

`unusable_free_index`

更偏：

**现象强度**
即：现在这次请求有多难，有多少空闲页其实帮不上忙。

简历描述

`extfrag_index`

更偏：

**根因判断**
即：这次请求困难到底是不是外部碎片主导。

**三种典型场景**

**场景 1：`score_b` 高，`score_a` 也高**

说明：

* 当前请求真的很难
* 而且主因很像碎片
* 这是最典型的“该重视外部碎片”的场景

**场景 2：`score_b` 高，但 `score_a` 不高**

说明：

* 当前请求也很难
* 但更像总空闲页本来就少
* 问题不一定主要在“页被碎坏了”

**场景 3：`score_b` 不高，`score_a = -1000`**

说明：

* 还有 suitable block
* 当前请求整体还比较健康
* 外部碎片压力不成立

学习计划里也明确把“两者区别”和“为什么它们一起更有价值”列成必须掌握项。

---

6.6 阈值、调优意义、为什么比 `/proc/buddyinfo` 更有用
------------------------------------

这一节是第 6 阶段最后一定要收住的地方。

***为什么这些指标能帮助决定是否需要 compaction***

因为 compaction 的目标不是“增加页数”，而是：

**把分散的小空闲块尽量整理成更连续的大块。**

所以只有当问题更像“外部碎片主导”时，compaction 才更有意义。
如果总空闲页本来就少，那光整理也整理不出多少大块来。项目说明里明确写到：通过 `mm_page_alloc_extfrag` 和 `get_page_from_freelist` 收集的数据，可以帮助判断何时需要 compaction。

**阈值怎么理解**

你的资料里提到 `extfrag_threshold` 之类的调优思路，本质上是在说：

* 指数不是“有一点波动就要处理”
* 而是要过某个阈值，系统才更倾向认为碎片已经成了主要问题

你现在复习时最重要的不是死记数值，而是要记住：

**指数的价值在于给“是否该更积极处理碎片”提供量化依据。**

**为什么比只看 `/proc/buddyinfo` 更有用**

`/proc/buddyinfo` 给你的是：

* 每个 zone
* 每个 order
* 还剩多少空闲块

它是原始库存表。而这个项目进一步做了两件事：

1. 把多阶块分布折算成“对当前请求到底有多少是真有用的”
2. 把“分配失败”进一步解释成“碎片主导还是总量不足”

所以它比 buddyinfo 更适合做：

* 在线诊断
* 实时监控
* 故障解释
* 调优决策

阶段 7：用户态 Python、curses 和整条运行链路
============================================

7.1 这一阶段真正要掌握什么
--------------------------

按你的要求，这一阶段不是学 Python 语法，而是要会讲清楚：

1. Python 在这个项目里扮演什么角色
2. Python 怎么和 eBPF 配合
3. `curses` 是怎么把数据画成终端页面的
4. 整个项目从“用户执行命令”到“终端显示结果”的完整链路是什么

学习计划里对阶段 7 的要求也正是这些：`extfrag.py` 的职责、`extfrag_user.py` 的职责、curses UI、输出模式、以及“Python 启动 → BCC 加载 → 内核触发 → eBPF 收集 → map 共享 → Python 展示”的完整流程。

---

7.2 `extfrag.py` 的职责
-----------

正确版本的 `extfrag.py` 里，`ExtFrag` 类做的事非常清楚：

```cpp
class ExtFrag:
    def __init__(self, interval=2, output_extfrag_index=False,
                 output_unusable_index=False, output_count=False, zone_info=False):
        ...
        if self.output_count:
            self.b = BPF(src_file="./bpf/extfraginfo.c")
        else:
            self.b = BPF(src_file="./bpf/fraginfo.c")
        delay_key = 0
        self.b["delay_map"][delay_key] = ctypes.c_int(interval)
```

还有一组读 map 的方法：

* `get_zone_data()`
* `get_view_data()`
* `get_nr_zones()`
* `get_node_data()`
* `get_count_data()`
  extfrag

所以 `extfrag.py` 的职责，你以后可以直接背成 4 点：

1. **加载正确的 eBPF 程序**
   * 看 count 模式就加载 `extfraginfo.c`
   * 看 zone/index 模式就加载 `fraginfo.c`
2. **把用户态配置写给内核态**
   * 最典型的是 `delay_map[0] = interval`
3. **从 BPF map 读数据**
   * `zone_map`
   * `pgdat_map`
   * `counts_map`
4. **把原始内核结构整理成 Python 数据结构**
   * 字典
   * 列表
   * 排序后的展示用数据

---

7.3 `extfrag.py` 里几个最重要的方法怎么理解
-------------------------------

`get_zone_data()`

它会遍历 `zone_map.items()`，把每条 `zone_info` 记录解码成 Python 字典，然后按 zone 名分组，再按 `order` 排序。这里面最关键的是：

* 把 `value.name` 解码成字符串
* 取出 `zone_start_pfn`、`spanned_pages`、`present_pages`、`free_blocks_total`、`free_blocks_suitable`、`free_pages`、`score_a`、`score_b`
* 用 `calculate_scoreA/B()` 把整数指数转成适合展示的字符串格式

这说明：**`extfrag.py` 的核心不是做算法，而是做“数据适配”。**

`get_node_data()`

它从 `pgdat_map` 里读节点信息，再结合 zone 数据算每个 node 的 zone 数量。
也就是说，用户态 node 视图不是凭空来的，而是内核态 `pgdat_map + zone_map` 共同提供的。

`get_count_data()`

它从 `counts_map` 里取出：

* `pcomm`
* `pid`
* `pfn`
* `alloc_order`
* `fallback_order`
* `count`

然后按 `count` 降序排序。
这会在界面上形成“哪个进程最频繁触发外碎片事件”的排行榜。

---

7.4 Python 和 eBPF 是怎么配合的
-------------------------------

你以后一定要能把这条链路说顺：

**第一步：用户运行 Python**

Python 是用户态入口，不是直接运行 C 文件。

**第二步：Python 通过 BCC 加载 eBPF**

`BPF(src_file=...)` 会触发：

* 编译 eBPF C 程序
* 通过 `bpf()` 系统调用把字节码加载进内核
* 并挂到对应探针点上
  linux物理内存检测工具：

**第三步：Python 写配置到 map**

最典型的是：

```cpp
self.b["delay_map"][delay_key] = ctypes.c_int(interval)
```

也就是说，**map 不只是“内核→用户”的结果通道，也是“用户→内核”的配置通道。**

**第四步：内核执行到目标点时，被动触发 eBPF**

这一点一定要会讲：

**eBPF 程序不会自己主动执行，而是被动等待 `mm_page_alloc_extfrag` 或 `get_page_from_freelist` 被调用。**

**第五步：eBPF 采数据并写 map**

* `extfraginfo.c` → `counts_map`
* `fraginfo.c` → `pgdat_map / zone_map`

**第六步：Python 再从 map 里读回来**

最后由 `extfrag.py` 读 map、整理数据，再交给显示层。

---

7.5 curses UI 你到底要掌握到什么程度
------------------------------------

你不需要会写复杂 curses 语法，但必须知道它的思路：

**curses 把终端当成画布，而不是一直 `print` 往下滚。**

项目资料里说得很明确：它用 curses 做终端动态可视化，支持表格实时刷新、条形图、颜色高亮和多种显示模式。

你以后可以这样讲它的工作方式：

1. 初始化 curses 界面
2. 清屏
3. 读取最新数据
4. 按坐标画标题、表头、数据区
5. 根据风险高低做颜色高亮
6. 刷新屏幕
7. 周期性重复

所以 curses 的价值是：

* 适合服务器 / SSH 环境
* 不需要图形桌面
* 表格、高亮、条形图已经足够表达项目结果
* 终端动态刷新开销低

7.6 整个项目最终运行逻辑
------------------------

这一段你以后一定要能一口气讲出来：

> 用户先运行 Python 程序；Python 通过 BCC 把 `extfraginfo.c` 或 `fraginfo.c` 编译并通过 `bpf()` 系统调用加载进内核；随后 Python 通过 `delay_map` 把采样间隔写给 eBPF；内核在执行到 `mm_page_alloc_extfrag` 或 `get_page_from_freelist` 时，会被动触发对应的 eBPF 程序；`extfraginfo.c` 负责记录外碎片事件，`fraginfo.c` 负责统计各个 node/zone/order 的状态并计算两个指数；这些结果通过 BPF map 共享回用户态；`extfrag.py` 读取 map 并整理成 Python 数据结构；最后 curses 把它画成终端动态表格和高亮视图。

这条链路正是学习计划里要求你“学完后能完整讲出，不再只会背文件名”的那条主线。

---

## 相关笔记

- [[嵌入式八股150题]] — 面试会问到的C/C++基础八股
- [[嵌入式-八股项目结合]] — 项目与面试八股结合学习法
- [[linux视觉感知-面试口述]] — 另一个Linux项目的面试复习

