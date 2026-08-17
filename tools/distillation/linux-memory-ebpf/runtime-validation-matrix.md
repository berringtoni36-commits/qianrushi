# Linux 物理内存/eBPF 可运行性验证矩阵

> 这是源码级执行前检查，不是对目标 Linux 内核/BCC 的运行报告。原始 `projects/Linux物理内存检测项目/源码/` 保持只读。

## 立即暴露的静态阻断

- 用户入口导入：`from extfrag import ExtFrag`；同目录可见的实现文件是 `exfrag.py`，导入目标存在：`否`。
- BCC 源文件路径：`./bpf/extfraginfo.c`, `./bpf/fraginfo.c`；从源码目录解析均存在：`否`。实际代码文件位于 `源码/fraginfo.c` 和 `源码/extfraginfo.c`，不是 `源码/bpf/` 子目录。
- 这两个问题需要在目标环境运行前修复或确认启动目录/模块别名；本轮没有修改原始代码，也没有把它们伪装成已运行。

## 验证矩阵

| ID | 检查 | 状态 | 当前证据/缺口 |
|---|---|---|---|
| M0 | Python source syntax | **pass** | compile() in memory; no .pyc written |
| M1 | user import resolves | **blocked** | from extfrag import ExtFrag |
| M2 | BCC module import | **environment-dependent** | from bpfcc import BPF; package not executed |
| M3 | BPF C source path | **blocked** | BPF(src_file=...) literals resolved from source directory |
| M4 | BCC/Clang compile and verifier | **not-run** | requires target Linux/BCC/kernel headers |
| M5 | probe attach and event trigger | **not-run** | requires target kernel, permissions and workload |
| M6 | Map update/read/display | **not-run** | requires attached probe and curses session |
| M7 | sampling throttle behavior | **static-risk** | current-time key; event path has no update and delay may be unset |
| M8 | counter accuracy under concurrency | **not-run** | PID hash RMW path; no multi-CPU experiment |

## 当前源码合同

- `fraginfo.c`：`kprobe__get_page_from_freelist` 入口采样，读取 `alloc_context`/zone 状态，写 `pgdat_map`/`zone_map`；没有返回点、请求 ID 或最终分配结果。
- `extfraginfo.c`：`mm_page_alloc_extfrag` tracepoint，按 PID 写 `counts_map`；`count` 累计而 PFN/order/comm 覆盖为最近值，不是事件时间线。
- 两个探针都以 `current_time` 作为 `last_time_map` lookup key；事件程序没有 `last_time_map.update()`，且 `delay` 在 map lookup 失败时没有显式默认值。静态上应报告为节流风险，不能报告实际丢失率。
- `exfrag.py` 的 TUI 刷新间隔与内核采样/事件接受频率是不同层次；不能用界面刷新证明探针采样准确。

## 目标机补证顺序

1. 先修复/确认 import 名称、BPF C 文件路径和当前工作目录；记录修复后的变体 hash。
2. 在目标内核执行 BCC 编译、verifier 和 attach；分别记录 tracepoint/kprobe attach 结果。
3. 用受控 workload 验证 Map 是否更新，再分别核对 zone 快照、PID 聚合和 curses 读取。
4. 用独立 tracepoint 计数或内核统计对照 `counts_map`，在多 CPU/并发、PID 复用和读取期间更新的条件下测量合同，而不是默认精确。

## 来源

- `projects/Linux物理内存检测项目/源码/exfrag_user.py`
- `projects/Linux物理内存检测项目/源码/exfrag.py`
- `projects/Linux物理内存检测项目/源码/fraginfo.c`
- `projects/Linux物理内存检测项目/源码/extfraginfo.c`
