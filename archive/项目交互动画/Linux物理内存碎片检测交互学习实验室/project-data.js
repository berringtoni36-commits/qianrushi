(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.MemoryLabData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const status = [
    {
      id: 'cli-status', label: '用户选择状态模式', short: '参数决定加载哪份 eBPF 程序',
      detail: 'exfrag_user.py 解析参数并创建 ExtFrag。只要没有 -s/--output_count，就进入 zone/order 状态巡检路线。',
      source: 'exfrag_user.py:167-207', code: 'ExtFrag(output_count=False, interval=delay)',
      data: 'delay / node_id / zone filter / output mode', boundary: '当前参数解析是手写循环，缺少缺值和类型错误的友好处理。'
    },
    {
      id: 'select-fraginfo', label: '选择 fraginfo.c', short: 'Python 选择状态采集程序',
      detail: 'ExtFrag 根据 output_count=False 调用 BPF(src_file="./bpf/fraginfo.c")，然后把采样间隔写入 delay_map[0]。',
      source: 'exfrag.py:17-22', code: 'self.b = BPF(src_file="./bpf/fraginfo.c")\nself.b["delay_map"][0] = interval',
      data: '用户态 → delay_map[0]', boundary: '仓库当前没有 ./bpf 子目录，且 import/file name 也不一致，必须先修复才能真实运行。'
    },
    {
      id: 'bcc-load', label: 'BCC 编译与加载', short: 'C 源码变成经过验证的 BPF 程序',
      detail: 'BCC 调用 Clang/LLVM 编译，使用 bpf() 创建 map 与加载程序；内核验证器检查安全性，启用时再由 JIT 转成本机指令。',
      source: 'BCC/BPF(src_file=...) 目标链路', code: 'C source → LLVM BPF bytecode → bpf() → verifier → JIT',
      data: 'BPF 程序 + pgdat_map + zone_map + delay_map + last_time_map', boundary: '编译、验证或权限任一步失败，后续 map 和探针都不会出现。'
    },
    {
      id: 'attach-kprobe', label: '挂载 kprobe', short: 'BCC 命名约定绑定内核函数入口',
      detail: 'kprobe__get_page_from_freelist 的函数名让 BCC 把程序挂到 get_page_from_freelist 入口。',
      source: 'fraginfo.c:91-93', code: 'int kprobe__get_page_from_freelist(struct pt_regs *ctx, ...)',
      data: 'gfp_mask / order / alloc_flags / alloc_context', boundary: '内部函数签名不是稳定 ABI，内核版本变化可能导致加载或读取失败。'
    },
    {
      id: 'allocation-trigger', label: '页分配触发', short: '内核进入页分配路径时执行探针',
      detail: '伙伴系统尝试从 zonelist 取得页块时调用 get_page_from_freelist，入口 kprobe 先看到分配前状态。',
      source: 'fraginfo.c:91-105', code: 'get_page_from_freelist(gfp_mask, order, alloc_flags, ac)',
      data: '当前分配上下文 ac + requested order', boundary: '这是高频热路径上的观测点，不代表某次分配已经成功，也不等于只触发一次 fast path。'
    },
    {
      id: 'scan-zones', label: '扫描 node/zone/order', short: '沿 alloc_context 找到伙伴系统 freelist',
      detail: '代码从 preferred_zoneref 找到 pgdat 与 fallback zonelist，遍历 zone，再扫描各阶 nr_free，归并三个统计量。',
      source: 'fraginfo.c:107-155', code: 'ac → preferred_zoneref → zone_pgdat → node_zonelists → zone\nfill_contig_page_info(zone, order, &info)',
      data: 'free_pages / free_blocks_total / free_blocks_suitable', boundary: 'MAX_ORDER=10 且循环使用 <=，只在特定内核布局假设下成立。'
    },
    {
      id: 'write-zone-map', label: '计算指数并写 map', short: '内核态生成每个 zone + order 快照',
      detail: '三个统计量进入两个整数公式，结果与 zone 元数据一起写入 zone_map；node 元数据写入 pgdat_map。',
      source: 'fraginfo.c:147-166', code: 'score_b = unusable_free_index(order, &info)\nscore_a = __fragmentation_index(order, &info)\nzone_map.update(&zone_key, &zone_data)',
      data: 'zone_map[zone_ptr + order] / pgdat_map[node_key]', boundary: '当前 last_time_map 使用 current_time 当 key，节流基本不会命中并会膨胀哈希表。'
    },
    {
      id: 'render-status', label: 'Python 读取并渲染', short: 'map 快照变成 curses 表格或条形图',
      detail: 'get_zone_data() 遍历 zone_map，解码名称、组织字段并按 order 排序；curses 根据参数重绘终端。',
      source: 'exfrag.py:35-63；exfrag_user.py:258-411', code: 'for key, value in self.b["zone_map"].items(): ...\nscreen.addstr(row, 0, line)',
      data: 'Python dict → terminal table/bar/view', boundary: 'order>5 且 unusable>0.5 的红色规则是项目自定义展示阈值，不是内核官方阈值。'
    }
  ];

  const event = [
    {
      id: 'cli-event', label: '用户选择事件模式', short: '-s 切换到 fallback 事件统计',
      detail: 'exfrag_user.py 将 -s/--output_count 解析为 True，ExtFrag 因此选择另一份 C 程序。',
      source: 'exfrag_user.py:193-207', code: 'sudo python3 exfrag_user.py -s',
      data: 'output_count=True', boundary: '这是按 PID 聚合的近似快照模式，不是完整事件流。'
    },
    {
      id: 'select-extfrag', label: '选择 extfraginfo.c', short: '加载 tracepoint 事件程序',
      detail: 'ExtFrag 选择 extfraginfo.c，并同样尝试把 interval 写入 delay_map[0]。',
      source: 'exfrag.py:17-22', code: 'self.b = BPF(src_file="./bpf/extfraginfo.c")',
      data: 'counts_map + delay_map + last_time_map', boundary: '当前路径和模块名不一致仍需修复，事件程序还没有更新 last_time_map。'
    },
    {
      id: 'bcc-load-event', label: 'BCC 编译与加载', short: '创建 map 并加载 tracepoint 程序',
      detail: 'BCC 编译程序，通过 bpf() 加载并让验证器检查；map 同时被用户态和内核态访问。',
      source: 'BCC/BPF(src_file=...) 目标链路', code: 'extfraginfo.c → BPF bytecode → verifier → loaded program',
      data: 'counts_map(pid → data_t)', boundary: '需要 root/capabilities、内核头文件和可用的 BCC 环境。'
    },
    {
      id: 'attach-tracepoint', label: '挂载 tracepoint', short: '绑定稳定的内核预定义事件',
      detail: 'TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag) 绑定预定义 tracepoint，字段语义比内部函数 kprobe 更稳定。',
      source: 'extfraginfo.c:20', code: 'TRACEPOINT_PROBE(kmem, mm_page_alloc_extfrag) { ... }',
      data: 'tracepoint args', boundary: '稳定不等于所有内核都存在；部署前仍需枚举事件。'
    },
    {
      id: 'fallback-trigger', label: '迁移类型 fallback 触发', short: '伙伴系统从其他 migratetype freelist 取块',
      detail: '当目标迁移类型缺少合适块，伙伴系统可能借用另一迁移类型的较高阶块并拆分，触发该事件。',
      source: 'mm_page_alloc_extfrag 上游语义', code: 'fallback_order >= alloc_order',
      data: 'pfn / alloc_order / fallback_order / migratetypes', boundary: 'fallback_order 不是“实际退化成更小 order”；最终请求仍是 alloc_order 大小。'
    },
    {
      id: 'enrich-event', label: '补充进程上下文', short: 'eBPF 取得 PID 和 comm',
      detail: '程序读取当前 PID/TGID，取得进程名，并使用 tracepoint 的 PFN 与两个 order 字段构造 data_t。',
      source: 'extfraginfo.c:34-54', code: 'pid = bpf_get_current_pid_tgid() >> 32\nbpf_get_current_comm(&data.pcomm, sizeof(data.pcomm))',
      data: 'pid / pcomm / pfn / alloc_order / fallback_order', boundary: '当前程序没有保存 alloc_migratetype、fallback_migratetype 和 change_ownership。'
    },
    {
      id: 'write-counts', label: '按 PID 更新 counts_map', short: '第一次初始化，之后累计 count 并覆盖最近字段',
      detail: 'PID 作为唯一 key。同一 PID 再次触发时 count 加一，同时 pfn/order/comm 更新为最近一次事件。',
      source: 'extfraginfo.c:37-55', code: 'data = counts_map.lookup(&pid)\nif (!data) counts_map.update(...)\nelse { data->count += 1; counts_map.update(...); }',
      data: 'counts_map[pid] = latest fields + cumulative count', boundary: '它丢失每次事件时间序列、组合分布、PID 复用信息和严格并发计数保证。'
    },
    {
      id: 'render-counts', label: 'Python 排序并渲染', short: '累计快照变成事件排行榜',
      detail: 'get_count_data() 遍历 counts_map，解码 comm，按 count 降序，curses 输出进程级表格。',
      source: 'exfrag.py:126-148；exfrag_user.py:215-242', code: 'count_data_list.sort(key=lambda x: x["count"], reverse=True)',
      data: 'PID event snapshot → sorted terminal rows', boundary: 'count 高不能单独证明该进程制造了全部系统碎片。'
    }
  ];

  const scenarios = [
    { id: 'suitable', name: '仍有合适连续块', description: 'order-3 的一个块可折算为两个 order-2 块，但小块页仍占多数。', targetOrder: 2, nrFree: [8, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0], expected: { unusable: 600, extfrag: -1000 } },
    { id: 'fragmented', name: '空闲不少但全是小块', description: '16 个空闲页分散在 order-0/1，没有任何 order-2 可用块。', targetOrder: 2, nrFree: [8, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0], expected: { unusable: 1000, extfrag: 584 } },
    { id: 'shortage', name: '总量不足', description: '只有两个 order-0 页，连目标请求所需的四页总量都不够。', targetOrder: 2, nrFree: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], expected: { unusable: 1000, extfrag: 250 } }
  ];

  const cliOptions = [
    { short: '-d', long: '--delay', key: 'delay', label: '刷新间隔', type: 'number', value: 2, detail: '单位秒；写入 delay_map[0]' },
    { short: '-n', long: '--node_info', key: 'nodeInfo', label: '节点信息', type: 'check' },
    { short: '-i', long: '--node_id', key: 'nodeId', label: '筛选 Node ID', type: 'number', value: '' },
    { short: '-c', long: '--comm', key: 'comm', label: '筛选 zone 名', type: 'text', value: '' },
    { short: '-e', long: '--extfrag_index', key: 'extfrag', label: '仅 extfrag', type: 'check' },
    { short: '-u', long: '--unusable_index', key: 'unusable', label: '仅 unusable', type: 'check' },
    { short: '-s', long: '--output_count', key: 'count', label: '事件统计', type: 'check' },
    { short: '-b', long: '--bar', key: 'bar', label: '条形图', type: 'check' },
    { short: '-z', long: '--zone_info', key: 'zoneInfo', label: '详细 zone', type: 'check' },
    { short: '-v', long: '--view', key: 'view', label: '分块视图', type: 'check' }
  ];

  const faults = [
    { id: 'time-key', title: '用 current_time 作为 last_time_map 的 key', symptom: '每次触发查找不同 key，节流几乎永不命中，hash 持续增长。', cause: 'key 没有表达“同一份全局状态”。', fix: '使用固定 key=0，并在允许采样后回写最新时间；并发语义需另外说明。', source: 'fraginfo.c:94-104,166' },
    { id: 'no-update', title: '事件程序不更新 last_time', symptom: '即使 lookup 设计正确，每次事件也都会通过。', cause: '读写没有构成状态闭环。', fix: '成功采样后更新固定 key，初始化 delay 并处理 lookup 失败。', source: 'extfraginfo.c:20-58' },
    { id: 'source-path', title: 'Python 加载不存在的 ./bpf 路径', symptom: 'BPF(src_file=...) 在编译前就找不到 C 文件。', cause: '当前快照目录与旧 quick start 不一致。', fix: '统一目录结构或使用基于 __file__ 的绝对定位，再做 py_compile/BCC 验证。', source: 'exfrag.py:17-20' },
    { id: 'import-name', title: 'extfrag / exfrag 与 bpfcc / bcc 名称不一致', symptom: 'Python 启动即 ModuleNotFoundError。', cause: '入口 import、文件名和发行版模块名没有对齐。', fix: '统一本地模块名，并在目标发行版实测 from bcc import BPF。', source: 'exfrag_user.py:6；exfrag.py:2' },
    { id: 'order-hardcode', title: '固定 MAX_ORDER=10 并用 /11 推导 zone 数量', symptom: '新内核 order 范围变化或 map 缺项时，越界或 zone 计数错误。', cause: '把特定内核布局当成稳定接口。', fix: '从目标内核定义取得数组长度，并按 node_id + zone identity 去重。', source: 'fraginfo.c:6,78,147；exfrag.py:116' },
    { id: 'counts-history', title: '把 counts_map 当完整事件日志', symptom: '看不到单次事件时间线和 order/migratetype 分布，可能误判责任进程。', cause: 'PID key 只保留累计 count 与最近字段。', fix: '需要历史时改用 ring buffer/perf buffer，并定义丢数与聚合策略。', source: 'extfraginfo.c:16,37-55' }
  ];

  const quizzes = [
    { id: 'q1', topic: '架构', prompt: '从运行入口到终端显示，正确主链路是哪一条？', options: ['Python → curses → eBPF → map', 'Python/BCC → bpf()加载 → 探针触发 → map → Python/curses', 'tracepoint → Python直接读struct zone'], answer: 1, explanation: 'BCC 负责加载/挂载，eBPF 在内核事件现场执行，map 连接两侧。' },
    { id: 'q2', topic: '伙伴系统', prompt: 'order=3 的物理页请求需要多少连续页？', options: ['3', '8', '4096'], answer: 1, explanation: '页数为 2^order，因此是 8 页；若每页4KB则是32KB。' },
    { id: 'q3', topic: '探针', prompt: '项目为什么用 tracepoint 观察 mm_page_alloc_extfrag？', options: ['因为它是内核预定义事件，字段语义相对稳定', '因为它能修改伙伴系统', '因为它不需要内核支持'], answer: 0, explanation: 'tracepoint 稳定性通常优于内部函数 kprobe，但仍需确认目标内核存在该事件。' },
    { id: 'q4', topic: '探针', prompt: 'fallback_order=4、alloc_order=2 表示什么？', options: ['最终只分到 order-4', '从 order-4 fallback 块拆分来满足 order-2 请求', '请求降级成 order-1'], answer: 1, explanation: 'fallback_order 通常不小于 alloc_order，不能解释成实际分配更小 order。' },
    { id: 'q5', topic: 'BPF map', prompt: 'delay_map 在本项目里的数据方向是什么？', options: ['仅内核写Python读', 'Python写配置，eBPF回调读', 'curses写内核日志'], answer: 1, explanation: 'BPF map 是双向共享容器；delay_map 展示了用户态到内核态的配置方向。' },
    { id: 'q6', topic: '指数', prompt: 'free_blocks_suitable > 0 时，当前源码的 extfrag_index 返回什么？', options: ['1000', '0', '-1000'], answer: 2, explanation: '它表示存在适合目标阶的连续块；是否最终成功还受水位等条件影响。' },
    { id: 'q7', topic: '故障', prompt: '为什么 current_time 不适合作 last_time_map 的查找 key？', options: ['时间太短', '每次 key 都不同，无法命中同一份上次状态', 'BPF map 不支持整数'], answer: 1, explanation: '固定 key 才能表达全局单窗口状态，随后还要回写时间并说明并发语义。' },
    { id: 'q8', topic: 'BPF map', prompt: 'counts_map 能证明某进程制造了全部碎片吗？', options: ['能，count越高责任越大', '不能，它只是按PID聚合的近似快照', '能，因为它保存全部历史'], answer: 1, explanation: '它缺失事件时间线、迁移类型组合、PID复用与严格并发保证。' },
    { id: 'q9', topic: '指数', prompt: 'unusable=1000 但 extfrag 较低，通常更接近哪种情况？', options: ['总空闲页都能直接使用', '总量不足而非主要由碎片造成', '一定是tracepoint故障'], answer: 1, explanation: 'extfrag 趋近0更像内存不足，趋近1000更像外部碎片。' }
  ];

  return { pipelineRoutes: { status, event }, scenarios, cliOptions, faults, quizzes };
});

