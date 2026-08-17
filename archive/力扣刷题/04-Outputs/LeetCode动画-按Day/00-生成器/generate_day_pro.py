#!/usr/bin/env python3
"""Generate the day-organised, high-fidelity LeetCode learning pages.

The first generator was intentionally conservative and used one six-card
renderer for the whole Hot100 set.  This generator keeps the source note and
the old output untouched, but gives every question a mode-specific trace,
single-screen layout, official statement drawer, and an Obsidian preview under
the new Day folders.
"""

from __future__ import annotations

import html
import importlib.util
import json
import re
import shutil
import sys
from hashlib import sha256
from collections import OrderedDict
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent
# The new generator is copied into the Day output for auditability.  Its
# canonical parser still lives beside the original 21 pilot, not beside this
# copied file, so resolve that sibling explicitly.
OLD_GENERATOR = ROOT.parent.parent / "LeetCode动画" / "00-生成器" / "generate.py"
spec = importlib.util.spec_from_file_location("old_generate", OLD_GENERATOR)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load the existing generator")
old = importlib.util.module_from_spec(spec)
spec.loader.exec_module(old)

TRACE_SPEC = importlib.util.spec_from_file_location("detailed_traces", ROOT / "detailed_traces.py")
if TRACE_SPEC is None or TRACE_SPEC.loader is None:
    raise RuntimeError("cannot load detailed_traces.py")
TRACE_MODULE = importlib.util.module_from_spec(TRACE_SPEC)
TRACE_SPEC.loader.exec_module(TRACE_MODULE)
build_detailed_steps = TRACE_MODULE.build_detailed_steps
validate_detailed_steps = TRACE_MODULE.validate_detailed_steps
ensure_minimum_steps = TRACE_MODULE.ensure_minimum_steps

VAULT = old.VAULT
OUT = old.OUT
DAY_OUT = OUT.parent / "LeetCode动画-按Day"
PILOT = OUT / "21-合并两个有序链表" / "index.html"
V3_LC42_INDEX = DAY_OUT.parent / "LeetCode动画-V3" / "试点" / "42-接雨水" / "index.html"


MODE_LABELS = {
    "hash": "哈希查找",
    "hash-group": "哈希分组",
    "hash-run": "哈希 + 连续段",
    "two-ptr": "双指针",
    "window": "滑动窗口",
    "prefix": "前缀和",
    "mono-deque": "单调队列",
    "dp1d": "一维 DP",
    "dp2d": "二维 DP",
    "interval": "区间合并",
    "array": "数组原地技巧",
    "grid": "网格 DFS",
    "grid-bfs": "网格 BFS",
    "matrix-search": "矩阵搜索",
    "linked": "链表指针",
    "cycle": "快慢指针",
    "heap": "堆",
    "lru": "哈希 + 双向链表",
    "tree": "二叉树递归",
    "graph": "图论拓扑",
    "trie": "Trie 前缀树",
    "stack": "栈",
    "mono-stack": "单调栈",
    "backtrack": "回溯",
    "binary": "二分查找",
    "greedy": "贪心",
    "bit": "位运算",
    "boyer": "Boyer–Moore",
    "palindrome": "中心扩展",
}

# A few source-note labels are intentionally corrected here rather than
# altering the read-only source or the original generator.  These algorithms
# deserve a visual vocabulary of their own: longest-palindrome is *not* a
# generic DP table, and trapping rain water is the monotonic-stack scan that
# its explanation actually teaches.
MODE_OVERRIDES = {
    5: "palindrome",
    42: "mono-stack",
}


def mode_for(item: dict) -> str:
    return MODE_OVERRIDES.get(item["id"], old.MODES.get(item["id"], "array"))


def escape_json(value: str) -> str:
    # Keep JSON valid inside a raw-text script tag.
    return value.replace("</", "<\\/")


def line_for(code: str, *patterns: str) -> int:
    lines = code.splitlines() or [""]
    for pattern in patterns:
        for number, line in enumerate(lines, 1):
            if re.search(pattern, line):
                return number
    return 1


def line_map(code: str, mode: str, item_id: int | None = None) -> list[int]:
    """Pick real source lines for the eight teaching frames."""
    if item_id == 1:
        # twoSum: for → complement → count → write → hit
        return [5, 6, 7, 8, 6, 7, 8, 7]
    if item_id == 20:
        # valid-parentheses: loop, push, pop, then the final empty-stack test.
        return [8, 10, 10, 10, 13, 13, 13, 17]
    if mode == "palindrome":
        # LeetCode 5 has two explicit centre-expansion loops in the source.
        # Keep the visual narration and the code cursor on those exact lines.
        n = max(1, len(code.splitlines()))
        return [min(x, n) for x in [5, 6, 7, 8, 5, 10, 11, 15]]
    mode_first = {
        "linked": r"\bnext\b", "cycle": r"\bslow\b", "tree": r"\bdfs\b",
        "grid": r"\bdfs\b", "grid-bfs": r"\bqueue\b", "backtrack": r"\bbacktrack\b",
        "array": r"\breverse\b", "stack": r"\bpush\b", "mono-stack": r"\bpush\b",
        "heap": r"\bheap\b", "lru": r"\blist\b", "binary": r"\bmid\b",
        "dp1d": r"\bdp\b", "dp2d": r"\bdp\b", "trie": r"\bchildren\b",
    }
    first = line_for(code, r"\bfor\b", r"\bwhile\b", r"\bif\b", r"\bdfs\b", r"\bbacktrack\b", mode_first.get(mode, r"\breturn\b"))
    mode_action = {
        "linked": r"\bnext\b", "cycle": r"\bslow\b", "tree": r"\bdfs\b", "grid": r"\bdfs\b",
        "grid-bfs": r"\bqueue\b", "array": r"\breverse\b", "stack": r"\bpush\b|\bpop\b",
        "mono-stack": r"\bpush\b|\bpop\b", "backtrack": r"\bbacktrack\b", "lru": r"\bsplice\b|\blist\b",
    }
    action = line_for(code, r"\bunordered_map\b", r"\bmap\b", r"\bpush", r"\bpop", r"\bheap", r"\bdp", r"nums\[", r"\bmid\b", r"\bslow\b", mode_action.get(mode, r"\breturn\b"))
    update = line_for(code, r"\+\+", r"--", r"=", r"\bnext\b", r"\bleft\b", r"\bright\b")
    if first > 1 and action == 1:
        action = first
    if first > 1 and update == 1:
        update = first
    # A number of in-place/void solutions have no `return` statement.  Do not
    # fall back to the class declaration for their closing frames; highlight
    # the last meaningful loop/action instead.
    finish = line_for(code, r"\breturn\b", r"\bfor\b", r"\bwhile\b", r"\bif\b", r"\breverse\b", r"\bswap\b", r"\bpush\b", r"\bdfs\b")
    n = max(1, len(code.splitlines()))
    return [min(x, n) for x in [first, first, action, action, update, first, finish, finish]]


def parse_tokens(example: str, limit: int = 10) -> list[str]:
    """Extract readable tokens for the visual; never pretend to be a parser."""
    bracket = re.search(r"\[([^\]]+)\]", example)
    raw = bracket.group(1) if bracket else example
    raw = raw.replace("→", " ").replace("+", " ")
    tokens = [x.strip(" \t\"'") for x in re.split(r"[,，;；\s]+", raw) if x.strip(" \t\"'")]
    return tokens[:limit] or ["输入", "状态", "答案"]


def short_tokens(example: str, fallback: list[str] | None = None) -> list[str]:
    result = parse_tokens(example, 8)
    if result == ["输入", "状态", "答案"] and fallback:
        return fallback
    return result


def visual_for(item: dict, mode: str, frame: int, total: int) -> dict:
    """Return a deterministic, mode-specific visual state for a frame."""
    example = item["example"]
    tokens = short_tokens(example)
    focus = frame % max(len(tokens), 1)
    progress = ["读入", "建立", "观察", "动作", "更新", "边界", "收束", "返回"][frame]

    # The first three reference-style pages are deliberately item-specific.
    # They are not merely a mode badge over a stock diagram: the cursor,
    # stored state and result evolve exactly as the C++ loop described in the
    # source note.
    if item["id"] == 1:
        values = ["2", "7", "11", "15"]
        states = [
            (-1, ["map = {}"], "先读入 target = 9，哈希表还没有历史元素。"),
            (0, ["map = {}", "need = 7"], "i = 0，当前值 2，先查 complement = 7。"),
            (0, ["map = {}", "查 7 → 未命中"], "查不到 7，不能提前返回。"),
            (0, ["2 → i=0"], "未命中才写入 2，后面的元素才可以复用它。"),
            (1, ["2 → i=0", "need = 2"], "i = 1，当前值 7，complement = 2。"),
            (1, ["2 → i=0", "命中 2 → [0,1]"], "命中历史元素 2，两个下标已经确定。"),
            (1, ["2 → i=0", "7 → i=1"], "查询先于写入，保证不会使用同一个元素两次。"),
            (1, ["答案 = [0,1]"], "循环在命中处结束，直接返回答案。"),
        ]
        active, entries, note = states[frame]
        return {"kind": "hash", "label": f"{progress} · map / complement",
                "tokens": values, "active": active, "entries": entries, "note": note,
                "badge": "i = —" if active < 0 else f"i = {active}"}

    if item["id"] == 3:
        chars = list("abcabcbb")
        states = [
            (0, -1, "", "空窗口，best = 0"),
            (0, 0, "a", "纳入 a，窗口合法"),
            (0, 1, "ab", "纳入 b，窗口长度 2"),
            (0, 2, "abc", "纳入 c，best = 3"),
            (1, 3, "bca", "遇到重复 a，l 右移后恢复合法"),
            (2, 4, "cab", "继续扩展，窗口仍无重复"),
            (2, 6, "cab", "遇到重复 b，收缩到最后一个 b 之后"),
            (3, 7, "abc", "扫描结束，返回最长长度 3"),
        ]
        left, right, window, note = states[frame]
        return {"kind": "window", "label": f"{progress} · 无重复窗口", "tokens": chars,
                "left": left, "right": right, "entries": [f'window = "{window}"', "best = 3"], "note": note,
                "badge": f"l={left}, r={right}"}

    if item["id"] == 5:
        chars = list("babad")
        states = [
            (-1, -1, -1, "枚举 2n−1 个中心：字符中心 + 间隙中心", ""),
            (0, 0, 0, "奇数中心 i=0：b == b，向外越界", "b"),
            (1, 0, 2, "奇数中心 i=1：向外扩展得到 bab", "bab"),
            (2, 1, 3, "奇数中心 i=2：得到 aba，与当前最优同长", "bab"),
            (3, 2, 4, "奇数中心 i=3：外层 a、d 不相等，停止", "bab"),
            (0, 0, 1, "偶数中心 (0,1)：b、a 不相等", "bab"),
            (1, 1, 2, "偶数中心 (1,2)：a、b 不相等", "bab"),
            (-1, -1, -1, "所有中心检查完，返回最长回文 bab（或 aba）", "bab"),
        ]
        center, left, right, note, best = states[frame]
        return {"kind": "palindrome", "label": f"{progress} · 中心扩展", "tokens": chars,
                "center": center, "left": left, "right": right, "best": best, "note": note,
                "badge": "center = —" if center < 0 else f"center = {center}"}

    if item["id"] == 20:
        values = ["(", "[", "{", "}", "]", ")"]
        states = [
            (-1, [], "游标从 0 开始，栈为空。"),
            (0, ["("], "左括号入栈，等待对应的闭合符。"),
            (1, ["(", "["], "嵌套一层，栈顶变为 [。"),
            (2, ["(", "[", "{"], "继续入栈，最近未闭合的是 {。"),
            (3, ["(", "["], "} 与栈顶 { 匹配，弹出。"),
            (4, ["("], "] 与栈顶 [ 匹配，弹出。"),
            (5, [], ") 与栈顶 ( 匹配，弹出。"),
            (5, [], "输入耗尽且栈为空，括号合法。"),
        ]
        active, stack, note = states[frame]
        return {"kind": "stack", "label": f"{progress} · 括号栈", "tokens": values,
                "active": active, "stack": stack, "note": note,
                "badge": "栈空" if not stack else f"栈顶 = {stack[-1]}"}

    if item["id"] in {438, 76}:
        if item["id"] == 438:
            chars = list("cbaebabacd")
            states = [
                (0, -1, "window = ∅", "固定窗口长度为 |p| = 3"),
                (0, 2, "cba", "窗口长度达到 3，频次与 abc 一致，记录下标 0"),
                (1, 3, "bae", "右移一格：移出 c，加入 e"),
                (2, 4, "aeb", "窗口频次仍不等于 abc"),
                (3, 5, "eba", "继续滑动，左端和右端同步更新"),
                (4, 6, "bab", "重复字符导致频次不匹配"),
                (5, 7, "aba", "窗口仍不满足 abc 的频次"),
                (6, 8, "bac", "窗口 s[6..8] 与 abc 频次一致，记录下标 6"),
            ]
            note = states[frame][3]
            left, right, window, _ = states[frame]
            entries = [f'need = "abc"', f'window = "{window}"']
        else:
            chars = list("ADOBECODEBANC")
            states = [
                (0, -1, "", "need = {A:1,B:1,C:1}，窗口为空"),
                (0, 5, "ADOBEC", "首次覆盖 ABC，valid = 3"),
                (1, 5, "DOBEC", "尝试收缩左端，仍然覆盖 ABC"),
                (2, 5, "OBEC", "继续收缩，删除 D"),
                (3, 5, "BEC", "删除 O 后窗口仍合法，更新 best"),
                (5, 12, "CODEBANC", "右端扩展到末尾，再次覆盖 ABC"),
                (9, 12, "BANC", "收缩得到更短合法窗口 BANC"),
                (9, 12, "BANC", "扫描完成，返回最短覆盖子串 BANC"),
            ]
            left, right, window, note = states[frame]
            entries = ["need = A·B·C", f'window = "{window}"', "valid = 3" if frame >= 1 else "valid = 0"]
        return {"kind": "window", "label": f"{progress} · 频次窗口", "tokens": chars,
                "left": left, "right": right, "entries": entries, "note": note,
                "badge": f"l={left}, r={right}"}

    # A few source-note mode names are broad enough to hide a materially
    # different operation.  Give those pages their own concrete state story.
    if item["id"] in {73, 54, 48}:
        if item["id"] == 73:
            cells = ["1", "1", "1", "1", "0", "1", "1", "1", "1"]
            notes = ["先扫描矩阵，发现 0 在第 1 行第 1 列", "用首行/首列记录要置零的行列", "标记完成后再统一写回", "第 1 行标记为 0", "第 1 列标记为 0", "按标记置零，不让 0 雪崩扩散", "恢复首行首列的标记", "返回矩阵"]
        elif item["id"] == 54:
            cells = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
            notes = ["边界 top=0,bottom=2,left=0,right=2", "沿上边从左到右读取 1,2,3", "沿右边向下读取 6,9", "沿下边反向读取 8,7", "沿左边向上读取 4", "边界向内收缩到中心", "读取中心 5", "返回螺旋序列"]
        else:
            cells = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
            notes = ["矩阵顺时针旋转 90°", "沿主对角线做转置", "交换 matrix[i][j] 与 matrix[j][i]", "转置后每行仍可观察", "逐行左右翻转", "第一行变成 7,4,1", "所有行翻转完成", "返回旋转后的矩阵"]
        return {"kind": "grid", "label": f"{progress} · 矩阵操作", "cells": cells,
                "active": min(frame, len(cells) - 1), "queue": [], "note": notes[frame]}

    if item["id"] == 53:
        values = ["-2", "1", "-3", "4", "-1", "2", "1", "-5", "4"]
        cur = [-2, 1, -2, 4, 3, 5, 6, 1, 5][frame]
        best = [-2, 1, 1, 4, 4, 5, 6, 6, 6][frame]
        notes = ["dp[i] 表示以 nums[i] 结尾的最大和", "接上前段不如从 1 重新开始", "负数让当前和下降，但 best 保留 1", "从 4 开始形成新的更优子数组", "继续接入 -1，当前和仍为 3", "接入 2 后当前和变为 5", "接入 1 得到全局 best = 6", "遇到 -5，当前和下降但不丢失 best", "扫描完成，返回最大和 6"]
        return {"kind": "dp1d-trace", "label": f"{progress} · Kadane 状态", "tokens": values,
                "active": min(frame, len(values) - 1), "current": cur, "best": best, "note": notes[frame],
                "badge": f"cur={cur}, best={best}"}

    if item["id"] == 121:
        prices = ["7", "1", "5", "3", "6", "4"]
        mins = [7, 1, 1, 1, 1, 1, 1, 1][frame]
        profits = [0, 0, 4, 4, 5, 5, 5, 5][frame]
        notes = ["维护历史最低买入价与最大利润", "第一天只能记录 min_price = 7", "价格降到 1，更新最低买入价", "价格 5 可产生利润 4", "价格 3 不超过当前 best", "价格 6 产生最大利润 5", "后续价格不会改变 best", "返回最大利润 5"]
        return {"kind": "greedy-trace", "label": f"{progress} · 买卖边界", "tokens": prices,
                "active": min(frame, len(prices) - 1), "minp": mins, "profit": profits, "note": notes[frame],
                "badge": f"min={mins}, profit={profits}"}

    if item["id"] == 42:
        heights = ["0", "1", "0", "2", "1", "0", "1", "3", "2", "1", "2", "1"]
        stacks = [[], ["0:0"], ["0:0", "1:1"], ["2:0"], ["4:1"], ["5:0"], ["6:1"], ["8:2"], ["9:1"], ["10:2"], ["11:1"], []]
        notes = ["从左到右扫描柱高", "递减栈保存还没找到右边界的柱子", "遇到更高柱 2，弹出凹槽底部", "用 left/right 高度计算一层水", "弹出的柱子可能分多层结算", "栈顶仍等待更高右边界", "继续处理当前列", "高柱 3 结算多个凹槽", "更新左边界高度", "累计水量", "扫描到末尾", "返回总水量 6"]
        return {"kind": "stack", "label": f"{progress} · 单调栈接水", "tokens": heights,
                "active": min(frame, len(heights) - 1), "stack": stacks[frame], "note": notes[frame],
                "badge": f"stack size = {len(stacks[frame])}"}

    if item["id"] in {155, 394, 739, 84}:
        if item["id"] == 155:
            values = ["push -2", "push 0", "push -3", "getMin", "pop", "getMin"]
            stacks = [[], ["data:-2", "min:-2"], ["data:-2,0", "min:-2"], ["data:-2,0,-3", "min:-3"], ["data:-2,0,-3", "min:-3"], ["data:-2,0", "min:-2"], ["data:-2,0", "min:-2"], ["data:-2,0", "min:-2"]]
            notes = ["两个栈同步维护", "第一次 push 初始化最小值", "0 不改变当前最小值", "-3 把辅助栈最小值更新为 -3", "pop 时数据栈和最小栈一起弹出", "恢复到 -2", "每次 getMin 都是 O(1)", "返回最小值序列 [-3,-2]"]
            return {"kind": "stack", "label": f"{progress} · 双栈最小值", "tokens": values,
                    "active": min(frame, len(values) - 1), "stack": stacks[frame], "note": notes[frame],
                    "badge": "minStack 同步"}
        if item["id"] == 394:
            chars = list("3[a2[c]]")
            stacks = [[], ["num=3"], ["num=3", "str=\"\""], ["num=2", "str=\"a\""], ["str=\"acc\""], ["str=\"accacc\""], [], []]
            notes = ["数字累积到 cur_num", "遇到 [，保存当前字符串和重复次数", "进入括号后重置当前状态", "嵌套 2[c]，继续入栈", "遇到 ]，弹出并重复 c", "外层再重复 acc", "所有括号闭合", "返回 accaccacc"]
            return {"kind": "stack", "label": f"{progress} · 解码栈", "tokens": chars,
                    "active": min(frame, len(chars) - 1), "stack": stacks[frame], "note": notes[frame],
                    "badge": "cur_str / cur_num"}
        if item["id"] == 739:
            values = ["73", "74", "75", "71", "69", "72", "76", "73"]
            stacks = [[], ["0:73"], ["1:74"], ["2:75"], ["3:71", "2:75"], ["4:69", "3:71", "2:75"], ["5:72", "2:75"], [], []]
            notes = ["栈保存还没找到更高温度的下标", "74 是 73 右侧第一个更高温度", "75 继续等待更高温度", "71 小于栈顶，入栈", "69 继续保持递减栈", "72 弹出 69、71，计算等待天数", "76 结算多个更低温度", "最后一天右侧没有更高温度"]
            return {"kind": "stack", "label": f"{progress} · 每日温度", "tokens": values,
                    "active": min(frame, len(values) - 1), "stack": stacks[frame], "note": notes[frame],
                    "badge": "stack 存下标"}
        values = ["2", "1", "5", "6", "2", "3"]
        stacks = [[], ["0:2"], ["1:1"], ["1:1", "2:5"], ["1:1", "2:5", "3:6"], ["1:1", "4:2"], [], []]
        notes = ["递增栈保存还未确定右边界的柱子", "1 比 2 小，弹出 2 并结算宽度", "1 成为新的左边界", "5 入栈", "6 入栈", "2 使 6、5 依次弹出并计算面积", "哨兵 0 结算剩余柱子", "最大面积 = 10，返回结果"]
        return {"kind": "stack", "label": f"{progress} · 柱状图单调栈", "tokens": values,
                "active": min(frame, len(values) - 1), "stack": stacks[frame], "note": notes[frame],
                "badge": "栈底到栈顶递增"}

    if item["id"] == 295:
        states = [
            ("small = []", "large = []", "先建立两个堆"),
            ("small = [1]", "large = []", "1 进入较小半边"),
            ("small = [1]", "large = [2]", "2 进入较大半边，大小平衡"),
            ("small = [1]", "large = [2,3]", "3 先进入 large，再把最小值调回 small"),
            ("small.max = 1", "large.min = 2", "两堆大小差不超过 1"),
            ("small.max = 2", "large.min = 3", "加入新数后重新平衡"),
            ("median = 2", "size = 4", "偶数个元素取两个堆顶平均"),
            ("median = 2", "返回中位数", "所有操作保持 O(log n) 插入、O(1) 查询"),
        ]
        left, right, note = states[frame]
        return {"kind": "dual-heap", "label": f"{progress} · 双堆平衡", "left": left, "right": right, "note": note,
                "badge": "max-heap / min-heap"}

    if item["id"] == 287:
        vals = ["1", "3", "4", "2", "2"]
        slow = [1, 3, 2, 4, 2, 2, 2, 2][frame]
        fast = [1, 2, 2, 2, 2, 2, 2, 2][frame]
        notes = ["把 nums[i] 当作 next，数组变成隐式链表", "slow = fast = nums[0] = 1", "slow 一步、fast 两步", "两指针进入由重复值造成的环", "slow 与 fast 相遇", "把 slow 放回起点", "同步一步后再次相遇", "环入口值就是重复数 2"]
        return {"kind": "cycle-array", "label": f"{progress} · 数组隐式环", "tokens": vals,
                "active": min(frame, len(vals) - 1), "slow": slow, "fast": fast, "note": notes[frame],
                "badge": f"slow={slow}, fast={fast}"}

    if item["id"] in {94, 102, 98, 230, 104}:
        if item["id"] == 94:
            seq = [[], ["进入 2 → 左 1"], ["访问 1"], ["1, 2"], ["1, 2 · 进入 3"], ["1, 2, 3"], ["中序完成"], ["结果 = [1, 3, 2]"]]
            notes = ["递归先向左深入", "左子树还未处理", "左孩子为空，访问节点 1", "回到根节点 2", "转向右子树 3", "访问右子树", "左→根→右顺序完成", "返回中序结果"]
        elif item["id"] == 102:
            seq = [
                ["queue = [3]"], ["层 1: [3]", "queue = [9,20]"], ["层 2: [9,20]", "queue = [15,7]"],
                ["输出 [3]", "下一层长度 = 2"], ["输出 [3],[9,20]"], ["queue = [15,7]"], ["输出 [15,7]"], ["结果 = [[3],[9,20],[15,7]]"],
            ]
            notes = ["队列保存待处理节点", "固定本层 size，避免混层", "处理 9、20 并加入下一层", "本层节点数决定 for 次数", "一层结束后再读取下一层", "队列继续按层推进", "最后一层出队", "返回层序结果"]
        elif item["id"] == 98:
            seq = [["prev = −∞"], ["访问 1", "prev = 1"], ["访问 2", "2 > 1"], ["访问 3", "3 > 2"], ["中序递增"], ["没有违反不变量"], ["BST 合法"], ["返回 true"]]
            notes = ["BST 的中序遍历必须严格递增", "先处理左子树", "当前值必须大于 prev", "继续访问右子树", "序列保持递增", "没有节点破坏顺序", "整棵树验证完成", "返回合法"]
        elif item["id"] == 230:
            seq = [["count = 0"], ["访问 1", "count = 1"], ["k = 1 命中 1"], ["若继续则访问 2"], ["中序天然递增"], ["停止递归"], ["answer = 1"], ["返回第 k 小"]]
            notes = ["中序遍历顺序就是从小到大", "先走到最左节点", "第 1 个访问节点就是第 1 小", "命中 k 后可以停止", "不必额外排序", "递归返回父节点", "答案已经确定", "返回第 k 小元素"]
        else:
            seq = [["depth = 0"], ["左子树 depth = 1"], ["右子树 depth = 2"], ["max(1,2)+1 = 3"], ["后序汇报给根"], ["空节点返回 0"], ["全树高度 = 3"], ["返回 3"]]
            notes = ["当前节点要汇报子树高度", "先计算左子树", "再计算右子树", "取左右最大值再加当前层", "后序结果回到根", "空节点是递归出口", "根节点得到最大深度", "返回最大深度"]
        root = "1" if item["id"] == 94 else ("2" if item["id"] in {98, 230} else "3")
        children = ["空", "2"] if item["id"] == 94 else (["1", "3"] if item["id"] in {98, 230} else ["9", "20"])
        return {"kind": "tree", "label": f"{progress} · 递归 / 队列状态", "root": root, "children": children, "sequence": seq[frame], "active": frame, "note": notes[frame], "badge": "递归栈 / queue"}

    if item["id"] in {46, 78, 22, 51}:
        if item["id"] == 46:
            paths = [[], ["1"], ["1", "2"], ["1", "2", "3"], ["1", "3"], ["2"], ["2", "3"], ["3"]]
            notes = ["path 记录当前排列", "第一层选择 1", "第二层选择 2", "到达叶子，记录 [1,2,3]", "撤销 2，换成 3", "回到根，换第一位为 2", "继续构造排列", "所有分支都回溯完成"]
            choices = ["1", "2", "3"]
        elif item["id"] == 78:
            paths = [[], ["1"], ["1", "2"], ["1", "2", "3"], ["1", "2"], ["1", "3"], ["2"], ["2", "3"]]
            notes = ["每层决定选或不选", "选择 1 的分支", "继续选择 2", "选择 3 得到完整子集", "撤销 3，回到 [1,2]", "尝试 [1,3]", "回到只选 2", "枚举结束，共 8 个子集"]
            choices = ["选", "不选"]
        elif item["id"] == 22:
            paths = [[], ["("], ["(", "("], ["(", "(", "("], ["(", "(", "(", ")"], ["(", "(", ")", ")"], ["(", ")", "(", ")"], ["(", ")", "(", ")", "(", ")"]]
            notes = ["left/right 记录已用括号数", "只要 left < n 就能放左括号", "继续放左括号", "左括号已用满", "right < left，允许放右括号", "继续闭合最近的左括号", "换另一条合法分支", "得到一个合法括号串并回溯"]
            choices = ["(", ")"]
        else:
            paths = [[], ["r0c1"], ["r0c1", "r1c3"], ["r0c1", "r1c3", "r2c0"], ["r0c1", "r1c3"], ["r0c2"], ["r0c2", "r1c0"], ["solution"]]
            notes = ["逐行放置皇后", "第 0 行尝试列 1", "第 1 行避开列与对角线", "第 2 行继续放置", "冲突时撤销并换列", "回到第 0 行尝试下一列", "继续检查三条占用集合", "找到一组合法摆法"]
            choices = ["c0", "c1", "c2", "c3"]
        return {"kind": "backtrack", "label": f"{progress} · 回溯路径", "choices": choices,
                "path": paths[frame], "active": frame % len(choices), "note": notes[frame], "badge": "选择 → 递归 → 撤销"}

    if item["id"] == 20:
        tokens = ["(", "[", "{", "}", "]", ")"]

    if mode in {"hash", "hash-group", "hash-run", "prefix", "boyer", "bit"}:
        if mode == "hash":
            entries = ["2 → i=0", "7 → i=1"] if frame >= 3 else (["空"] if frame < 2 else ["2 → i=0"])
            note = ["先看 complement", "目标差值 = target − 当前值", "查表而不是猜", "命中时立即返回", "未命中才写入", "不会使用同一个元素两次", "表中留下可复用状态", "返回下标"][frame]
        elif mode == "hash-group":
            entries = ["aet: eat · tea · ate", "ant: tan · nat", "abt: bat"] if frame >= 4 else ["key = 排序后的字符串", "同 key → 同桶"]
            note = ["每个字符串都要归类", "把同组条件压成 key", "生成稳定 key", "查 key 对应的桶", "追加到桶尾", "遍历全部输入", "桶就是答案分组", "返回分组"][frame]
        elif mode == "hash-run":
            entries = ["1→2→3→4", "100", "200"] if frame >= 4 else ["set(nums)", "判断 num−1 是否存在"]
            note = ["先把数组放进集合", "只从序列起点开始", "num−1 不存在才是起点", "向右延伸", "记录最长长度", "跳过非起点数字", "保留最大连续段", "返回长度"][frame]
        elif mode == "prefix":
            entries = ["前缀 0 → 1", "前缀 1 → 2", "前缀 2 → 3"] if frame >= 3 else ["prefix = 0", "查历史前缀"]
            note = ["把区间改写成前缀差", "先建立 prefix", "当前前缀先查历史", "命中目标差值", "再写入计数", "前缀状态可复用", "累计答案", "返回计数"][frame]
        elif mode == "boyer":
            entries = ["candidate = 2", "count = 2"] if frame >= 3 else ["candidate = ?", "count = 0"]
            note = ["先找候选人", "相同加一、不同减一", "count 归零再换候选", "候选逐步稳定", "多数元素无法被抵消", "扫描完成", "候选就是答案", "返回候选"][frame]
        else:
            entries = ["x ^ x = 0", "4 ^ 1 ^ 2 ^ 1 ^ 2 = 4"]
            note = ["异或满足交换律", "相同元素成对出现", "相同状态互相抵消", "只留下唯一值", "不需要额外哈希表", "遍历结束", "答案已抵消完成", "返回 xor"][frame]
        return {"kind": "hash", "label": progress + " · 哈希状态", "tokens": tokens, "active": focus, "entries": entries, "note": note}

    if mode in {"window", "mono-deque"}:
        left = min(frame // 2, max(len(tokens) - 1, 0))
        right = min(left + 2 + (frame % 2), max(len(tokens) - 1, 0))
        if mode == "mono-deque":
            entries = ["下标 0", "下标 1", "下标 3"] if frame < 4 else ["队首 = 当前最大值", "过期下标出队"]
            note = ["队列从空开始", "右端加入候选", "尾部较差候选出队", "队首代表窗口答案", "移除过期下标", "窗口继续向右", "每个下标最多进出一次", "返回每个窗口最大值"][frame]
        else:
            entries = [f"l = {left}", f"r = {right}", f"window = {''.join(tokens[left:right + 1])}"]
            note = ["窗口从空开始", "右端扩展", "检查约束", "约束被破坏时收缩左端", "窗口重新合法", "更新最长/最短答案", "右端走完整个输入", "返回最优窗口"][frame]
        return {"kind": "window", "label": progress + " · 窗口状态", "tokens": tokens, "left": left, "right": right, "entries": entries, "note": note}

    if mode in {"linked", "cycle"}:
        nodes = tokens[:6] or ["1", "2", "3", "4"]
        if mode == "cycle":
            pointers = {"slow": nodes[min(frame, len(nodes) - 1)], "fast": nodes[min(frame + 1, len(nodes) - 1)], "entry": nodes[1] if len(nodes) > 1 and frame >= 5 else "—"}
            note = ["slow 一步、fast 两步", "两条指针同时出发", "fast 先进入环", "相遇说明存在环", "重新同步两个指针", "再次相遇就是入口", "入口前的距离相等", "返回入口/布尔值"][frame]
            return {"kind": "cycle", "label": progress + " · 快慢指针", "nodes": nodes, "pointers": pointers, "note": note, "cycleAt": 1}
        result = nodes[: max(1, min(frame, len(nodes)))]
        pointers = {"left": nodes[min(frame, len(nodes) - 1)], "right": nodes[min(frame + 1, len(nodes) - 1)], "tail": result[-1]}
        note = ["先看两个头节点", "dummy/tail 固定结果入口", "保存 next 再改链接", "把较小节点接到 tail", "移动被取走的指针", "一条链为空时停止比较", "整段接上剩余链", "返回 dummy.next"][frame]
        return {"kind": "linked", "label": progress + " · 指针状态", "nodes": nodes, "result": result, "pointers": pointers, "note": note}

    if mode in {"stack", "mono-stack"}:
        if mode == "stack":
            values = ["(", "[", "{", "}", "]", ")"] if item["id"] == 20 else tokens
            stack = values[: min(max(frame - 1, 0), len(values))]
            if item["id"] == 20 and frame >= 4:
                stack = ["(", "["] if frame == 4 else ["("] if frame == 5 else []
            note = ["栈从空开始", "左括号入栈", "只和栈顶匹配", "遇到闭括号", "匹配成功后出栈", "嵌套顺序被验证", "栈为空且输入耗尽", "返回 true / 结果"][frame]
        else:
            stack = ["下标 0", "下标 2", "下标 4"][: max(1, min(frame, 3))]
            note = ["栈保持单调", "新元素入栈", "破坏顺序时弹出", "弹出的元素找到右边界", "栈顶给出左边界", "面积/距离完成结算", "每个下标最多出栈一次", "返回最优值"][frame]
        return {"kind": "stack", "label": progress + " · 栈状态", "tokens": tokens, "active": focus, "stack": stack, "note": note}

    if mode in {"tree", "graph", "trie"}:
        if mode == "graph":
            nodes = ["0", "1", "2", "3"]
            note = ["依赖关系变成有向图", "统计每个节点入度", "入度为 0 的节点先入队", "处理节点并释放后继", "新零入度节点入队", "队列为空时检查数量", "全部处理才无环", "返回可完成性"][frame]
            return {"kind": "graph", "label": progress + " · 拓扑队列", "nodes": nodes, "active": frame % len(nodes), "queue": nodes[: min(frame // 2 + 1, 3)], "note": note}
        if mode == "trie":
            note = ["根节点代表空前缀", "字符沿边建立路径", "公共前缀只存一份", "单词末尾打结束标记", "search 必须走完整路径", "startsWith 不要求结束标记", "当前路径匹配成功", "返回布尔值"][frame]
            return {"kind": "trie", "label": progress + " · 前缀树", "letters": ["a", "p", "p", "l", "e"], "active": min(frame, 4), "note": note}
        note = ["递归函数先定义返回值", "从根节点开始", "进入左/右子树", "合并子树返回值", "当前节点完成汇报", "空节点是递归出口", "根节点得到全局答案", "返回结果"][frame]
        return {"kind": "tree", "label": progress + " · 递归结构", "root": "当前节点", "children": ["左子树", "右子树"], "active": frame, "note": note}

    if mode in {"grid", "grid-bfs"}:
        cells = ["1", "1", "0", "0", "0", "1", "1", "0", "0", "0", "0", "0", "1", "0", "0"]
        active = min((frame * 2) % len(cells), len(cells) - 1)
        if mode == "grid-bfs":
            note = ["队列从腐烂源开始", "同一层共享一个分钟数", "把相邻新节点入队", "本轮出队后 minute + 1", "多源同时向外扩散", "队列为空时检查剩余目标", "最后一层就是最短时间", "返回分钟数"][frame]
            queue = ["(0,1)", "(1,0)"][: min(frame // 2 + 1, 2)]
            return {"kind": "grid", "label": progress + " · 网格 BFS", "cells": cells, "active": active, "queue": queue, "note": note}
        note = ["网格按行列展开", "遇到未访问目标格", "计数并标记起点", "DFS/BFS 覆盖相邻格", "相邻格不会重复计数", "继续扫描下一块区域", "所有连通块处理完", "返回数量/矩阵"][frame]
        return {"kind": "grid", "label": progress + " · 网格 DFS", "cells": cells, "active": active, "queue": [], "note": note}

    if mode in {"dp1d", "dp2d"}:
        rows = [["0", "1", "2", "3", "4"], ["初值", "已知", "←", "·", "答案"], ["·", "·", "当前", "·", "·"]]
        note = ["先定义 dp 的含义", "初始化可直接得到的状态", "当前状态只看已完成邻居", "按依赖顺序转移", "写入当前格", "旧状态不会被重算", "表格最后一格/最优格", "返回 dp 答案"][frame]
        return {"kind": "dp", "label": progress + " · 状态表", "rows": rows, "active": (frame + 1) % 5, "note": note, "dimension": mode}

    if mode in {"binary", "matrix-search"}:
        nums = tokens if tokens != ["输入", "状态", "答案"] else ["1", "3", "5", "6", "7"]
        note = ["答案一定在边界内", "初始化 lo / hi", "计算 mid", "比较 mid 与 target", "排除一半不可能区域", "保持循环不变量", "lo/hi 收敛", "返回边界下标"][frame]
        return {"kind": "binary", "label": progress + " · 搜索区间", "tokens": nums, "lo": min(frame // 2, len(nums) - 1), "mid": min(frame // 2 + 1, len(nums) - 1), "hi": max(0, len(nums) - 1 - frame // 3), "note": note}

    if mode in {"heap", "lru"}:
        if mode == "lru":
            note = ["哈希表定位节点", "双向链表维护顺序", "get 命中后移到头部", "put 新节点放头部", "超过容量删除尾部", "两种结构同步更新", "所有操作 O(1)", "返回 get 结果"][frame]
            return {"kind": "lru", "label": progress + " · LRU 顺序", "items": ["head", "3", "1", "2", "tail"], "active": min(frame % 3 + 1, 3), "note": note}
        note = ["堆保存当前候选", "先放入元素", "维护堆顶", "堆顶代表当前最有价值项", "超出 k 就弹出", "候选集合逐步稳定", "堆顶就是答案", "返回第 k 大/最小"][frame]
        return {"kind": "heap", "label": progress + " · 堆顶", "items": ["top", "5", "4", "2", "1"], "active": frame % 4, "note": note}

    if mode in {"backtrack"}:
        choices = ["1", "2", "3"]
        path = choices[: min(frame // 2 + 1, 3)] if frame < 6 else choices[:2]
        note = ["路径记录当前选择", "从第 0 层开始", "选择一个未使用候选", "递归进入下一层", "到达终点记录答案", "撤销最后一步", "换下一个候选", "返回所有结果"][frame]
        return {"kind": "backtrack", "label": progress + " · 递归路径", "choices": choices, "path": path, "active": focus, "note": note}

    if mode in {"interval", "greedy"}:
        note = ["先按关键端点排序", "建立当前可达/合并段", "扫描下一个区间", "扩张右端或做一次选择", "当前选择对未来最有利", "边界耗尽时计数", "保留全局最优", "返回答案"][frame]
        return {"kind": "interval", "label": progress + " · 区间边界", "items": ["[1,3]", "[2,6]", "[8,10]", "[15,18]"], "active": min(frame // 2, 3), "note": note}

    # Array/two-pointer/default visual.  It is still concrete, not the old
    # abstract “候选状态” placeholder.
    if mode == "two-ptr":
        note = ["左右边界同时观察", "比较两端值", "移动不可能更优的一侧", "保留另一侧继续尝试", "每个边界只向内走", "答案在遍历中更新", "两指针相遇", "返回最大/目标结果"][frame]
        return {"kind": "twoptr", "label": progress + " · 双指针", "tokens": tokens, "left": min(frame, len(tokens) - 1), "right": max(0, len(tokens) - 1 - frame), "note": note}
    note = ["先把输入铺开", "确定未处理区间", "当前元素成为焦点", "执行一次原地操作", "更新边界/状态", "检查剩余元素", "答案区间已稳定", "返回结果"][frame]
    return {"kind": "array", "label": progress + " · 数组状态", "tokens": tokens, "active": focus, "note": note}


def step_copy(item: dict, mode: str, frame: int) -> tuple[str, str, str]:
    """Mode-specific narration: every page has an actual teaching arc."""
    ex, expected = item["example"], item["expected"]
    common = old.MODE_COPY.get(mode, "先建立状态，再保持不变量直到循环结束。")
    if item["id"] == 1:
        return [
            ("读入 target", f"输入是 {ex}，目标是让两个不同下标的数相加得到 9。", "read"),
            ("观察第 0 个数", "当前值 nums[0] = 2，先计算 complement = 9 - 2 = 7。", "compare"),
            ("查询 complement", "map 里还没有 7，所以这一轮不能返回。查询必须发生在写入之前。", "query"),
            ("写入当前值", "把 2 → 0 写入 map；它会成为后面元素可以复用的历史状态。", "update"),
            ("观察第 1 个数", "当前值 nums[1] = 7，complement = 2，开始查找之前留下的状态。", "compare"),
            ("命中即返回", "map 中已有 2 → 0，当前 7 与它组成 target，立即得到下标 [0,1]。", "hit"),
            ("检查不变量", "map 只包含当前下标之前的元素，因此不会把 nums[1] 自己重复使用。", "invariant"),
            ("返回答案", f"循环在命中处结束，返回题目要求的下标对：{expected}。", "done"),
        ][frame]
    if item["id"] == 20:
        return [
            ("从空栈开始", f"扫描 {ex}，栈保存尚未闭合的左括号。", "read"),
            ("左括号入栈", "读到 (，压入栈顶；它等待最后一个闭合括号。", "push"),
            ("继续嵌套", "读到 [，再次入栈；现在最近未匹配的是 [。", "push"),
            ("保存最内层", "读到 {，栈顶变成 {，后进先出顺序被记录下来。", "push"),
            ("匹配并出栈", "读到 }，只与栈顶 { 比较，匹配成功后弹出。", "pop"),
            ("继续回退", "读到 ]，与新的栈顶 [ 匹配并弹出；不能跳过栈顶去找括号。", "pop"),
            ("完成闭合", "读到 )，与栈顶 ( 匹配；输入读完后栈也应为空。", "pop"),
            ("返回 true", f"所有闭合顺序都正确，返回：{expected}。", "done"),
        ][frame]
    if item["id"] == 5:
        return [
            ("枚举回文中心", f"字符串 {ex} 有 2n−1 个中心，既包括字符中心，也包括字符间隙。", "read"),
            ("检查字符中心", "先取 i = 0，l = r = 0；单字符本身就是长度 1 的回文。", "odd"),
            ("向两侧扩展", "以 i = 1 为中心比较 s[0] 与 s[2]，得到回文 bab，再继续尝试外层。", "expand"),
            ("比较当前最优", "以 i = 2 得到 aba；它和 bab 等长，因此保留先发现的 bab。", "update"),
            ("继续检查奇数中心", "i = 3 的外层字符 a、d 不相等，扩展停止，最长答案仍为 bab。", "expand"),
            ("检查偶数中心", "把 l、r 放在相邻字符之间，覆盖 ba、ab 这类偶数长度回文。", "even"),
            ("保持扩展边界", "每次扩展前检查 l >= 0、r < n；越界或不相等就结束当前中心。", "boundary"),
            ("返回最长回文", f"所有中心都检查后，返回最长回文：{expected}。", "done"),
        ][frame]
    arcs = {
        "hash": [
            ("读输入", f"输入是 {ex}。先明确 target−nums[i]，答案不是暴力枚举。", "read"),
            ("建立哈希表", "map 保存“值 → 下标”，它是历史信息，不是最终答案。", "setup"),
            ("查询 complement", "当前值为 x 时先查 target−x；只有查不到，才允许写入 x。", "compare"),
            ("命中即返回", "一旦 complement 已在 map，两个下标已经确定，立即结束循环。", "hit"),
            ("写入当前值", "未命中时写入当前值，保证后面的元素可以复用它。", "update"),
            ("不变量", "map 只包含当前下标之前的元素，因此不会把同一个元素使用两次。", "check"),
            ("收束", f"示例中补数命中，目标结果是 {expected}。", "finish"),
            ("返回", f"返回题目要求的下标对：{expected}。", "done"),
        ],
        "linked": [
            ("看两个头节点", f"两条有序链表是 {ex}；每轮只比较两个当前头。", "read"),
            ("建立 dummy / tail", "dummy 统一处理首节点，tail 永远指向结果链表的最后一个节点。", "setup"),
            ("比较当前值", "比较 l1 与 l2 的值，较小节点一定是合并结果的下一个节点。", "compare"),
            ("保存 next 再接链", "先记住后继，再执行 tail->next = 当前节点，避免丢失剩余链。", "link"),
            ("移动被取走指针", "tail 跟到新节点，取走的那条链表指针向后移动一步。", "move"),
            ("一条链为空", "while 需要两条链都非空；一条为空后，不再逐个比较。", "boundary"),
            ("整段接入", "剩余链表本来就是升序，直接接到 tail 后面即可。", "attach"),
            ("返回", f"返回 dummy->next，得到 {expected}。", "done"),
        ],
        "stack": [
            ("从空栈开始", f"扫描 {ex}，栈保存尚未闭合的左括号/状态。", "read"),
            ("左括号入栈", "遇到左括号先压栈；栈顶就是最近一个尚未匹配的括号。", "push"),
            ("只看栈顶", "遇到右括号时不能随便找，必须与栈顶的最近左括号匹配。", "compare"),
            ("匹配后出栈", "类型正确才弹出；类型错误或栈为空，答案立即为 false。", "pop"),
            ("嵌套顺序", "后进先出的顺序刚好验证括号嵌套，而不是只统计数量。", "invariant"),
            ("扫描完成", "输入耗尽后还要检查栈是否为空，残留左括号同样是不合法。", "boundary"),
            ("结果收束", f"示例的栈最终为空，结果是 {expected}。", "finish"),
            ("返回", f"返回布尔结果：{expected}。", "done"),
        ],
        "window": [
            ("窗口为空", f"输入是 {ex}；窗口 [l,r] 从空集开始。", "read"),
            ("右端扩展", "r 每次纳入一个新字符/元素，窗口负责探索更多可能。", "expand"),
            ("检查约束", "扩展后先检查重复、计数或覆盖条件是否被破坏。", "check"),
            ("左端收缩", "只有约束不合法时才移动 l，直到窗口重新合法。", "shrink"),
            ("更新答案", "窗口合法的时刻才更新最长/最短答案，避免把非法窗口算进去。", "update"),
            ("继续扫描", "每个元素最多被 l、r 各处理一次，整体复杂度保持线性。", "move"),
            ("收束", f"窗口扫描完成，示例结果为 {expected}。", "finish"),
            ("返回", f"返回记录下来的最优窗口/数量：{expected}。", "done"),
        ],
        "tree": [
            ("定义返回值", f"题目输入是 {ex}；先说清递归函数向父节点汇报什么。", "read"),
            ("进入当前节点", "当前节点只负责组合左右子树的返回值，不把整棵树的状态塞进全局变量。", "setup"),
            ("递归左子树", "先获得左子树答案；空节点是递归出口。", "left"),
            ("递归右子树", "再获得右子树答案，两个子问题互不干扰。", "right"),
            ("汇报给父节点", "当前节点根据题意合并左右结果，并返回父节点需要的局部值。", "merge"),
            ("处理边界", "叶子、空树或不满足条件的节点在这里收束，递归不会继续向下。", "boundary"),
            ("根节点得到答案", f"递归回到根节点，最终答案是 {expected}。", "finish"),
            ("返回", f"返回根节点汇报的结果：{expected}。", "done"),
        ],
        "binary": [
            ("建立答案区间", f"输入是 {ex}；先保证答案一定在 [lo, hi] 内。", "read"),
            ("计算 mid", "每轮取中点，比较只决定丢掉哪一半。", "mid"),
            ("比较目标", "根据有序性判断 mid 左侧或右侧是否不可能包含答案。", "compare"),
            ("排除一半", "移动 lo 或 hi，区间缩短但答案不被排除。", "discard"),
            ("保持不变量", "循环条件和边界更新必须配套，否则容易死循环或越界。", "invariant"),
            ("收敛", "当 lo 与 hi 相邻/相等时，边界位置就是第一个满足条件的位置。", "boundary"),
            ("结果收束", f"搜索区间收敛到题目结果：{expected}。", "finish"),
            ("返回", f"返回下标/中位数：{expected}。", "done"),
        ],
        "dp1d": [
            ("定义 dp", f"输入是 {ex}；dp[i] 必须先说清代表什么。", "read"),
            ("初始化", "把长度 0/1 或题目给出的直接状态先填好。", "setup"),
            ("观察依赖", "当前 dp 只从已经完成的前一格/前几格转移。", "depend"),
            ("写入状态", "按照状态转移方程写 dp[i]，不是重新枚举所有历史。", "transition"),
            ("保留最优", "每个位置只保留以后真正有用的最优值/可达性。", "update"),
            ("边界收束", "填表到最后一个位置，答案从规定的 dp 状态读取。", "boundary"),
            ("结果收束", f"状态表完成，答案是 {expected}。", "finish"),
            ("返回", f"返回 dp 结果：{expected}。", "done"),
        ],
        "dp2d": [
            ("定义二维状态", f"输入是 {ex}；行列分别代表两个前缀/位置。", "read"),
            ("初始化边界", "空前缀、首行、首列先填入可直接得到的状态。", "setup"),
            ("找到依赖", "当前格只依赖左、上或左上已经计算的格子。", "depend"),
            ("转移一格", "按题意比较/累加邻居，当前格完成后才给后面的格子使用。", "transition"),
            ("逐格填表", "填表顺序保证没有读到未计算状态，空间可按需压缩。", "update"),
            ("读取答案格", "最后读取题目规定的右下角或最优格，而不是随意读取中间值。", "boundary"),
            ("结果收束", f"二维表完成，答案是 {expected}。", "finish"),
            ("返回", f"返回 DP 结果：{expected}。", "done"),
        ],
        "palindrome": [
            ("枚举回文中心", f"字符串 {ex} 的回文一定关于某个中心对称；n 个字符产生 2n−1 个中心。", "read"),
            ("奇数中心", "先把 l、r 都放在同一个字符上，检查以字符为中心的回文。", "odd"),
            ("向两侧扩展", "只要 s[l] == s[r] 就同时向外移动；第一次不相等或越界时停止。", "expand"),
            ("更新最长答案", "用当前区间长度和 best 比较，保存更长的回文子串，而不是只保存长度。", "update"),
            ("偶数中心", "再把 l、r 放在相邻字符之间，覆盖长度为偶数的回文。", "even"),
            ("保持边界", "扩展前检查 l >= 0、r < n；越界意味着这个中心的回文已经结束。", "boundary"),
            ("中心全部检查", f"所有中心都尝试过，示例最长回文是 {expected}。", "finish"),
            ("返回", f"返回保存的最长回文子串：{expected}。", "done"),
        ],
    }
    chosen = arcs.get(mode)
    if chosen is None:
        action_title, action_body = old.MODE_ACTIONS.get(mode, ("核心动作", common))
        chosen = [
            ("读输入", f"输入是 {ex}。先把题目翻译成可以维护的状态。", "read"),
            ("建立不变量", common, "setup"),
            (action_title, action_body, "action"),
            ("更新状态", "一次只改变一个关键变量，下一轮继续使用同一个不变量。", "update"),
            ("检查边界", "循环出口负责处理空输入、剩余段或最后一个候选。", "boundary"),
            ("收束", f"所有候选处理完，保留下来的状态就是 {expected}。", "finish"),
            ("核对结果", f"用示例回放一遍，结果与题目要求一致：{expected}。", "verify"),
            ("返回", f"返回题目要求的结果：{expected}。", "done"),
        ]
    return chosen[frame]


def compact_note(value: str, limit: int = 210) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    if len(value) <= limit:
        return value
    return value[:limit].rstrip("，。；:： ") + "…"


def load_lc42_reference_trace() -> dict:
    """Read only the V3 LC42 state trace; the old renderer owns the visuals."""
    if not V3_LC42_INDEX.exists():
        raise RuntimeError(f"missing LC42 reference trace: {V3_LC42_INDEX}")
    source = V3_LC42_INDEX.read_text()
    match = re.search(
        r'<script id="problem-trace" type="application/json">([\s\S]*?)</script>',
        source,
    )
    if not match:
        raise RuntimeError(f"LC42 reference page has no embedded trace: {V3_LC42_INDEX}")
    return json.loads(match.group(1))


def semantic_tokens(code: str) -> list[str]:
    return re.findall(r"[A-Za-z_]\w*|-?\d+(?:\.\d+)?|[^\s]", code)


def lc42_line_number(line_id: str) -> int:
    match = re.fullmatch(r"L(\d+)", str(line_id))
    if not match:
        raise RuntimeError(f"invalid LC42 line id: {line_id}")
    return int(match.group(1))


def lc42_phase_label(phase: str) -> str:
    return {"setup": "初始化", "inspect": "扫描", "mutate": "结算", "return": "返回"}.get(phase, phase)


def lc42_chapter_title(frame: dict, index: int) -> str:
    if frame["id"] == "init":
        return "初始化单调栈"
    if frame["id"] == "return":
        return "返回最终答案"
    scan = re.fullmatch(r"scan-(\d+)", frame["id"])
    return f"扫描 i = {scan.group(1)}" if scan else f"章节 {index + 1}"


def lc42_step_title(line: int, state: dict) -> str:
    titles = {
        4: "建立空栈",
        5: "初始化 res",
        7: "开始本轮",
        8: "判断 while 条件",
        9: "结算高度层面积",
        10: "更新 last",
        11: "弹出栈顶",
        13: "处理栈顶剩余部分",
        14: "当前下标入栈",
        18: "返回答案",
    }
    return titles.get(line, state.get("action", "执行当前代码"))


def lc42_duration_ms(frame: dict, beat: dict) -> int:
    line = lc42_line_number(beat["lineIds"][0])
    action = str(beat.get("state", {}).get("action", ""))
    if frame["phase"] == "return":
        return 1900
    if line in {9, 13} and beat.get("state", {}).get("formula"):
        return 1000
    if line in {10, 11} or "弹出" in action:
        return 880
    if line == 14 or "入栈" in action:
        return 720
    return 620


def validate_lc42_trace(item: dict, trace: dict) -> dict:
    """Validate the complete state timeline before it reaches the browser."""
    frames = trace.get("frames", [])
    values = trace.get("meta", {}).get("input", {}).get("height", [])
    code_lines = item["code"].splitlines()
    events = [beat for frame in frames for beat in frame.get("beats", [])]
    errors: list[str] = []
    previous_res = 0
    for event_index, beat in enumerate(events):
        line_ids = beat.get("lineIds", [])
        state = beat.get("state", {})
        state_values = state.get("values", [])
        water = state.get("water", [])
        stack = state.get("stack", [])
        variables = state.get("variables", {})
        line_numbers = [lc42_line_number(line_id) for line_id in line_ids]
        if not line_numbers or any(line < 1 or line > len(code_lines) for line in line_numbers):
            errors.append(f"event {event_index}: invalid code line mapping {line_ids}")
        if state_values != values:
            errors.append(f"event {event_index}: values changed from the input")
        if len(water) != len(values):
            errors.append(f"event {event_index}: water length does not match height")
        res = int(variables.get("res", 0))
        if sum(water) != res:
            errors.append(f"event {event_index}: sum(water)={sum(water)} != res={res}")
        if res < previous_res:
            errors.append(f"event {event_index}: res decreased from {previous_res} to {res}")
        previous_res = res
        if any(index < 0 or index >= len(values) for index in stack):
            errors.append(f"event {event_index}: stack contains an invalid index")
        if any(values[left] <= values[right] for left, right in zip(stack, stack[1:])):
            errors.append(f"event {event_index}: stack lost its strict decreasing invariant")
        expected_top = stack[-1] if stack else None
        if variables.get("top") != expected_top:
            errors.append(f"event {event_index}: top variable disagrees with stack")
    final = events[-1] if events else {}
    final_state = final.get("state", {})
    final_res = final_state.get("variables", {}).get("res")
    final_water = final_state.get("water", [])
    if len(frames) != 14 or len(events) != 82:
        errors.append(f"expected 14 frames / 82 beats, got {len(frames)} / {len(events)}")
    if not frames or frames[-1].get("phase") != "return":
        errors.append("final frame is not a return frame")
    if final_res != trace.get("meta", {}).get("expected"):
        errors.append(f"final res is {final_res}, expected {trace.get('meta', {}).get('expected')}")
    if final_water and sum(final_water) != final_res:
        errors.append("final water does not add up to final res")
    if errors:
        raise RuntimeError("LC42 trace validation failed:\n- " + "\n- ".join(errors))
    source_hash = sha256(item["code"].encode()).hexdigest()
    token_hash = sha256("\x1f".join(semantic_tokens(item["code"])).encode()).hexdigest()
    return {
        "problemId": item["id"],
        "frameCount": len(frames),
        "beatCount": len(events),
        "validLineMappings": True,
        "resMatchesWater": True,
        "resMonotonic": True,
        "stackInvariant": True,
        "finalPhase": frames[-1]["phase"],
        "finalRes": final_res,
        "finalWater": final_water,
        "sourceCodeSha256": source_hash,
        "sourceSemanticTokenHash": token_hash,
        "referenceTraceVersion": trace.get("meta", {}).get("rendererVersion", "unknown"),
    }


def build_lc42_problem(item: dict) -> dict:
    trace = load_lc42_reference_trace()
    audit = validate_lc42_trace(item, trace)
    example, expected = old.EXAMPLES[item["id"]]
    steps: list[dict] = []
    frames: list[dict] = []
    for frame_index, frame in enumerate(trace["frames"]):
        start = len(steps)
        chapter_title = lc42_chapter_title(frame, frame_index)
        for beat_index, beat in enumerate(frame["beats"]):
            state = beat["state"]
            line_numbers = [lc42_line_number(line_id) for line_id in beat["lineIds"]]
            line = line_numbers[0]
            variables = state.get("variables", {})
            if frame.get("phase") == "setup":
                current_label = "待开始"
            elif frame.get("phase") == "return":
                current_label = "扫描完成"
            else:
                current_label = f"i = {variables.get('i')}"
            action = state.get("action", "")
            learning = frame.get("captions", {}).get("learning", "")
            review = frame.get("captions", {}).get("review", "")
            body = f"{learning} {beat.get('caption', '')}"
            if action and action not in body:
                body += f" 当前动作：{action}。"
            if line in {9, 13} and state.get("formula"):
                body += " 只有这行加法执行后，res 和 water[] 才会更新。"
            review_body = f"{review} · {action}"
            visual_variables = dict(variables)
            if frame.get("phase") == "return":
                # i and last are declared inside the for-loop and are out of
                # scope when the original solution reaches return res.
                visual_variables["i"] = None
                visual_variables["last"] = None
            visual = {
                "kind": "water-stack",
                "label": f"{chapter_title} · 单调栈接水",
                "badge": f"{current_label} · stk.size = {len(state.get('stack', []))}",
                "values": state.get("values", []),
                "water": state.get("water", []),
                "stack": state.get("stack", []),
                "variables": visual_variables,
                "active": state.get("active", []),
                "compared": state.get("compared", []),
                "result": state.get("result", []),
                "formula": state.get("formula", ""),
                "note": action,
            }
            steps.append({
                "id": f"lc42-{frame_index + 1}-{beat_index + 1}",
                "line": line,
                "lineIds": line_numbers,
                "phase": lc42_phase_label(frame["phase"]),
                "framePhase": frame["phase"],
                "frameIndex": frame_index,
                "frameTitle": chapter_title,
                "beatIndex": beat_index,
                "frameBeatCount": len(frame["beats"]),
                "title": lc42_step_title(line, state),
                "body": body,
                "reviewBody": review_body,
                "caption": beat.get("caption", ""),
                "kind": "water-stack",
                "durationMs": lc42_duration_ms(frame, beat),
                "visual": visual,
            })
        end = len(steps) - 1
        frames.append({
            "id": frame["id"],
            "phase": frame["phase"],
            "phaseLabel": lc42_phase_label(frame["phase"]),
            "title": chapter_title,
            "start": start,
            "end": end,
            "beatCount": len(frame["beats"]),
            "durationMs": frame.get("durationMs", 0),
            "captions": frame.get("captions", {}),
        })
    trace_meta = dict(trace["meta"])
    trace_meta["sourceSha256"] = audit["sourceCodeSha256"]
    trace_meta["semanticTokenHash"] = audit["sourceSemanticTokenHash"]
    metadata = {
        "time": trace["meta"].get("time", "O(n)"),
        "space": trace["meta"].get("space", "O(n)"),
        "invariant": trace["meta"].get("invariant", ""),
        "aha": trace["meta"].get("aha", ""),
    }
    return {
        **item,
        "mode": "mono-stack",
        "example": example,
        "expected": expected,
        "modeLabel": MODE_LABELS["mono-stack"],
        "modeCopy": trace["meta"].get("invariant", "先维护单调栈，再只结算已经找到右边界的水层。"),
        "reviewCopy": "只看当前代码行、判断结果和 stk / last / res 的变化。",
        "compositionId": "LC42LegacyWaterStack",
        "sceneKind": "water-stack",
        "fps": 30,
        "width": 1920,
        "height": 1080,
        "metadata": metadata,
        "traceMeta": trace_meta,
        "traceAudit": audit,
        "traceSchema": "leetcode-animation-complete-state-v1",
        "frames": frames,
        "steps": steps,
    }


def build_problem(item: dict) -> dict:
    if item["id"] == 42:
        return build_lc42_problem(item)
    mode = mode_for(item)
    if item["id"] not in old.EXAMPLES:
        raise RuntimeError(f"missing example for LeetCode {item['id']}")
    example, expected = old.EXAMPLES[item["id"]]
    enriched = {**item, "mode": mode, "example": example, "expected": expected}
    steps = ensure_minimum_steps(enriched, build_detailed_steps(enriched, mode))
    trace_audit = validate_detailed_steps(enriched, steps)
    if item.get("thought"):
        steps[0]["body"] += f" 题解原意：{compact_note(item['thought'])}"
    if item.get("pitfalls"):
        steps[-2]["body"] += f" 易错提醒：{compact_note(item['pitfalls'], 170)}"
    source_hash = sha256(item["code"].encode("utf-8")).hexdigest()
    semantic_hash = sha256("\x1f".join(semantic_tokens(item["code"])).encode("utf-8")).hexdigest()
    trace_audit.update({
        "sourceCodeSha256": source_hash,
        "sourceSemanticTokenHash": semantic_hash,
        "sourceCodeLineCount": len(item["code"].splitlines()),
    })
    return {
        **enriched,
        "modeLabel": MODE_LABELS.get(mode, mode),
        "modeCopy": old.MODE_COPY.get(mode, "先建立状态，再保持不变量直到循环结束。"),
        "traceSchema": "leetcode-animation-complete-state-v1",
        "traceAudit": trace_audit,
        "sourceCodeSha256": source_hash,
        "sourceSemanticTokenHash": semantic_hash,
        "steps": steps,
    }


def safe_day_slug(day: str) -> str:
    value = re.sub(r"^Day\s*", "Day ", day.strip())
    value = re.sub(r"[：:/\\]+", "-", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" .")


def page_preview(item: dict, page_path: Path) -> str:
    uri = "file://" + quote(page_path.as_posix(), safe="/") + "#theme=auto"
    mode = mode_for(item)
    return (
        f"# LeetCode {item['id']} 动画 · Obsidian 预览\n\n"
        f"> 归档：{item['day']} · {MODE_LABELS.get(mode, mode)}。题面折叠区独立滚动，动画与控制区不共用滚动条。\n\n"
        f"<iframe title=\"LeetCode {item['id']} {item['title']} 动画\" src=\"{uri}\" "
        f"style=\"width:100%;height:1000px;border:0;border-radius:14px;display:block;\" loading=\"eager\"></iframe>\n\n"
        f"[在浏览器中打开独立 HTML]({uri.split('#', 1)[0]})\n"
    )


PAGE_TEMPLATE = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>LeetCode {id} · {title} · C++ 逐步动画</title>
  <style>__CSS__</style>
</head>
<body>
  <div id="boot-fallback">动画正在加载…</div>
  <script id="problem-data" type="application/json">__DATA__</script>
  <script>__JS__</script>
</body>
</html>
"""


ENGINE_CSS = r'''
:root{color-scheme:light;--bg:#f3f3ef;--panel:#fffefa;--panel-strong:#ffffff;--text:#25292c;--muted:#697274;--line:rgba(64,72,75,.17);--accent:#5f5cf5;--teal:#2a8b7d;--orange:#c86d2d;--blue:#3a8cc7;--shadow:0 18px 52px rgba(40,45,50,.13);--code-bg:#f8f8f4;--font-body:"iA Writer Quattro V",Inter,"PingFang SC",-apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif;--font-code:"iA Writer Mono V","Fira Code","SFMono-Regular",Menlo,Monaco,Consolas,monospace}
html[data-theme=dark]{color-scheme:dark;--bg:#091117;--panel:#111d25;--panel-strong:#0e1820;--text:#edf4f4;--muted:#96aaa9;--line:rgba(215,235,232,.18);--accent:#a19dff;--teal:#75d6c5;--orange:#f3b25c;--blue:#6fc3ff;--shadow:0 24px 70px rgba(0,0,0,.34);--code-bg:#0a141c}
*{box-sizing:border-box}html,body{height:100%;margin:0}body{height:100vh;min-height:720px;overflow:hidden;background:radial-gradient(circle at 86% 0,rgba(95,92,245,.14),transparent 28rem),radial-gradient(circle at 0 100%,rgba(42,139,125,.12),transparent 27rem),var(--bg);color:var(--text);font-family:var(--font-body);-webkit-font-smoothing:antialiased}button,select,input{font:inherit;color:inherit}button,select{border:1px solid var(--line);background:color-mix(in srgb,var(--panel) 82%,transparent);border-radius:10px;padding:8px 11px;cursor:pointer}button:hover:not(:disabled),select:hover{border-color:var(--accent);transform:translateY(-1px)}button:disabled{opacity:.4;cursor:default}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 38%,transparent);outline-offset:2px}
.app{height:100vh;min-height:720px;max-width:1680px;margin:auto;padding:14px 18px 12px;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:10px}.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.eyebrow{font:700 11px/1.3 var(--font-code);letter-spacing:.14em;color:var(--accent);text-transform:uppercase}.title{font-size:clamp(24px,2.5vw,36px);letter-spacing:-.04em;margin:4px 0 5px}.subtitle{color:var(--muted);font-size:13px;line-height:1.55;margin:0;max-width:830px}.top-meta{display:flex;justify-content:flex-end;align-items:center;gap:7px;flex-wrap:wrap}.pill{border:1px solid var(--line);border-radius:999px;padding:6px 10px;background:color-mix(in srgb,var(--panel) 78%,transparent);color:var(--muted);font-size:12px;white-space:nowrap}.pill.accent{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.problem-drawer{min-height:0;background:color-mix(in srgb,var(--panel) 85%,transparent);border:1px solid var(--line);border-radius:13px;box-shadow:0 9px 28px rgba(32,40,44,.08);overflow:hidden}.problem-drawer summary{list-style:none;cursor:pointer;padding:10px 14px;color:var(--accent);font-size:12px;font-weight:700}.problem-drawer summary::-webkit-details-marker{display:none}.problem-drawer summary:before{content:"▸";display:inline-block;margin-right:7px;transition:transform .2s}.problem-drawer[open] summary:before{transform:rotate(90deg)}.problem-copy{max-height:190px;overflow:auto;border-top:1px solid var(--line);padding:1px 16px 11px;color:var(--muted);font-size:12px;line-height:1.55}.problem-copy p{margin:8px 0}.problem-copy ul{margin:7px 0;padding-left:20px}.problem-copy pre{overflow:auto;border-radius:8px;background:rgba(0,0,0,.08);padding:8px 10px;font:11px/1.45 var(--font-code)}.problem-copy code{padding:1px 4px;border-radius:4px;background:color-mix(in srgb,var(--accent) 13%,transparent);font-family:var(--font-code)}.problem-link{float:right;color:var(--muted);font-size:11px;font-weight:500;text-decoration:none}.problem-link:hover{color:var(--accent)}
.workspace{min-height:0;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(430px,.88fr);gap:12px}.panel{min-height:0;background:linear-gradient(145deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--panel-strong) 96%,transparent));border:1px solid var(--line);border-radius:15px;box-shadow:var(--shadow);overflow:hidden}.visual-panel{display:grid;grid-template-rows:auto minmax(0,1fr) auto}.code-panel{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line);font:700 11px/1.3 var(--font-code);letter-spacing:.09em;color:var(--muted);text-transform:uppercase}.panel-head small{font:500 11px/1.3 var(--font-body);letter-spacing:0;text-transform:none;color:var(--muted)}
.visual-scroll{min-height:0;overflow:auto;padding:12px 14px 10px;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--muted) 50%,transparent) transparent}.lesson{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:10px 12px;margin-bottom:11px;border:1px solid color-mix(in srgb,var(--teal) 30%,var(--line));border-radius:11px;background:linear-gradient(135deg,color-mix(in srgb,var(--teal) 12%,transparent),color-mix(in srgb,var(--accent) 8%,transparent))}.lesson-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:color-mix(in srgb,var(--teal) 18%,transparent);color:var(--teal);font:800 13px/1 var(--font-code)}.lesson strong{font-size:13px}.lesson p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.55}.visual{border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--panel-strong) 94%,transparent);padding:12px 13px;min-height:168px;margin-bottom:11px}.visual-head{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px}.visual-label{font:700 10px/1.3 var(--font-code);letter-spacing:.08em;color:var(--muted);text-transform:uppercase}.visual-note{font-size:11px;color:var(--orange);text-align:right}.state-strip{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.state-chip{border:1px solid var(--line);border-radius:7px;padding:4px 7px;color:var(--muted);font:11px/1.25 var(--font-code);background:color-mix(in srgb,var(--accent) 5%,transparent)}.tokens,.node-row,.interval-row,.heap-row,.choices{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.token,.array-node,.choice{position:relative;min-width:42px;padding:9px 8px;text-align:center;border:1px solid color-mix(in srgb,var(--accent) 31%,var(--line));border-radius:8px;background:color-mix(in srgb,var(--accent) 7%,var(--panel-strong));font:12px/1.25 var(--font-code)}.token.active,.array-node.active,.choice.active{border-color:var(--orange);box-shadow:0 0 0 3px color-mix(in srgb,var(--orange) 18%,transparent);transform:translateY(-2px)}.token.left,.token.right{border-color:var(--blue)}.marker{position:absolute;left:50%;transform:translateX(-50%);bottom:-17px;color:var(--orange);font:700 9px/1 var(--font-code);white-space:nowrap}.arrow{color:var(--muted);font-size:15px}.micro-note{margin:11px 0 0;color:var(--muted);font-size:12px;line-height:1.5}.hash-layout{display:grid;grid-template-columns:minmax(180px,1fr) minmax(170px,.9fr);gap:13px;align-items:start}.hash-box,.stack-box,.pointer-box,.metric-box{border:1px solid var(--line);border-radius:9px;padding:9px;background:color-mix(in srgb,var(--teal) 5%,transparent)}.box-title{font:700 10px/1.25 var(--font-code);color:var(--muted);letter-spacing:.07em;margin-bottom:7px}.hash-entry{padding:6px 7px;border-radius:6px;background:color-mix(in srgb,var(--accent) 9%,transparent);font:11px/1.3 var(--font-code);margin-top:5px}.stack-layout{display:grid;grid-template-columns:1fr 160px;gap:15px;align-items:start}.stack-box{display:flex;flex-direction:column;gap:6px;min-height:112px}.stack-item{padding:7px;border:1px solid var(--line);border-radius:7px;text-align:center;background:color-mix(in srgb,var(--teal) 10%,transparent);font:11px/1.25 var(--font-code)}.stack-item.top{border-color:var(--orange);color:var(--orange)}.pointer-box{display:flex;gap:8px;flex-wrap:wrap}.pointer-pill{padding:5px 7px;border-radius:6px;font:10px/1.25 var(--font-code);background:color-mix(in srgb,var(--blue) 12%,transparent);border:1px solid color-mix(in srgb,var(--blue) 28%,var(--line))}.linked-layout{display:grid;gap:9px}.linked-line{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.linked-label{width:62px;color:var(--muted);font:10px/1.25 var(--font-code)}.linked-node{position:relative;min-width:40px;padding:9px 7px;border:1px solid color-mix(in srgb,var(--teal) 36%,var(--line));border-radius:8px;text-align:center;font:12px/1.2 var(--font-code);background:color-mix(in srgb,var(--teal) 8%,var(--panel-strong))}.linked-node.focus{border-color:var(--orange);box-shadow:0 0 0 3px color-mix(in srgb,var(--orange) 17%,transparent)}.linked-node.result{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--panel-strong))}.node-tags{position:absolute;left:50%;transform:translateX(-50%);top:-16px;white-space:nowrap;color:var(--orange);font:700 9px/1 var(--font-code)}.cycle-ring{border:1px dashed var(--orange);border-radius:14px;padding:8px}.tree-layout{text-align:center}.tree-root{display:inline-block;padding:10px 16px;border:1px solid var(--accent);border-radius:9px;background:color-mix(in srgb,var(--accent) 12%,transparent);font:12px/1.2 var(--font-code)}.tree-branches{display:flex;justify-content:space-around;gap:24px;margin:20px auto 0;max-width:350px;position:relative}.tree-branches:before{content:"";position:absolute;top:-11px;left:25%;right:25%;border-top:1px solid var(--line)}.tree-child{padding:8px 12px;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:12px}.grid-layout{display:grid;grid-template-columns:repeat(5,minmax(32px,1fr));gap:6px;max-width:390px}.grid-cell{padding:10px 5px;text-align:center;border:1px solid var(--line);border-radius:7px;background:color-mix(in srgb,var(--accent) 6%,transparent);font:11px/1.1 var(--font-code)}.grid-cell.active{border-color:var(--orange);background:color-mix(in srgb,var(--orange) 18%,transparent)}.dp-layout{display:grid;grid-template-columns:repeat(5,minmax(32px,1fr));gap:6px;max-width:420px}.dp-cell{padding:9px 4px;text-align:center;border:1px solid var(--line);border-radius:7px;background:color-mix(in srgb,var(--teal) 6%,transparent);font:10px/1.2 var(--font-code)}.dp-cell.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,transparent)}.binary-layout{display:grid;gap:11px}.binary-line{height:3px;background:var(--line);position:relative;margin:20px 15px 25px}.binary-mark{position:absolute;top:-13px;transform:translateX(-50%);font:10px/1 var(--font-code);color:var(--muted)}.binary-mark:after{content:"";display:block;width:9px;height:9px;border-radius:50%;background:var(--accent);margin:5px auto 0}.binary-mark.mid:after{background:var(--orange);width:11px;height:11px}.binary-mark.hi:after{background:var(--teal)}.graph-layout{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}.graph-node{padding:10px 12px;border:1px solid var(--line);border-radius:9px;font:11px/1.2 var(--font-code)}.graph-node.active{border-color:var(--orange);background:color-mix(in srgb,var(--orange) 16%,transparent)}.trie-path{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}.trie-letter{padding:12px 12px;border:1px solid var(--line);border-radius:8px;font:700 13px/1 var(--font-code)}.trie-letter.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)}.lru-line{display:flex;justify-content:center;align-items:center;gap:5px;flex-wrap:wrap}.lru-node{padding:10px 11px;border:1px solid var(--line);border-radius:8px;font:11px/1 var(--font-code)}.lru-node.active{border-color:var(--orange);background:color-mix(in srgb,var(--orange) 15%,transparent)}.choice-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.path-box{border:1px solid color-mix(in srgb,var(--teal) 32%,var(--line));border-radius:9px;padding:9px;min-height:60px}.path-box .box-title{margin-bottom:8px}.step-card{padding:11px 13px;border:1px solid var(--line);border-radius:11px;background:color-mix(in srgb,var(--panel-strong) 90%,transparent)}.step-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:5px}.phase{font:700 10px/1.25 var(--font-code);letter-spacing:.08em;color:var(--accent);text-transform:uppercase}.step-title{font-size:16px;font-weight:750}.step-body{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.55}.controls{display:grid;grid-template-columns:auto auto auto minmax(90px,1fr) auto auto;gap:7px;align-items:center;padding:10px 12px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--panel) 92%,transparent)}.controls input[type=range]{width:100%;accent-color:var(--accent)}.counter{font:700 10px/1.25 var(--font-code);color:var(--muted);white-space:nowrap}.code-toolbar{display:flex;justify-content:space-between;gap:10px;padding:9px 13px;color:var(--muted);font-size:11px;border-bottom:1px solid var(--line)}.code-toolbar strong{color:var(--text);font-family:var(--font-code);font-weight:600}.code-scroll{min-height:0;overflow:auto;padding:7px 0 12px;background:var(--code-bg);scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--muted) 50%,transparent) transparent}.code-line{display:grid;grid-template-columns:35px minmax(0,1fr);gap:9px;padding:2px 13px 2px 7px;min-height:18px;font:11px/1.47 var(--font-code);white-space:pre;transition:background .18s}.code-line .no{text-align:right;color:color-mix(in srgb,var(--muted) 72%,transparent);user-select:none}.code-line.active{background:linear-gradient(90deg,color-mix(in srgb,var(--orange) 24%,transparent),transparent);box-shadow:inset 3px 0 var(--orange);color:var(--text)}.code-line.active .no{color:var(--orange)}.kw{color:#9860c1}.type{color:#217c72}.fn{color:#2b65ae}.var{color:var(--text)}.num{color:#ad651c}.op{color:#227a8a}.comment{color:var(--muted)}.explain{padding:10px 13px 11px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--teal) 7%,transparent)}.explain-tag{font:700 9px/1.25 var(--font-code);letter-spacing:.1em;color:var(--teal)}.explain h2{font-size:14px;margin:4px 0}.explain p{font-size:11px;line-height:1.5;color:var(--muted);margin:0}.footer-note{text-align:center;color:var(--muted);font-size:10px;line-height:1.3;margin:0 0 1px}@media(max-width:1050px){body{overflow:auto;height:auto}.app{height:auto;min-height:100vh}.workspace{grid-template-columns:1fr}.code-panel{min-height:420px}.code-scroll{max-height:520px}}@media(max-width:660px){.app{padding:11px}.topbar{display:block}.top-meta{justify-content:flex-start;margin-top:9px}.controls{grid-template-columns:1fr 1fr}.controls input[type=range]{grid-column:1/-1}.counter{justify-self:end}.hash-layout,.stack-layout,.choice-row{grid-template-columns:1fr}}
'''


ENGINE_JS = r'''
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('problem-data').textContent);
  const isLC42 = data.id === 42 && Array.isArray(data.frames);
  // Apostrophes are plain text here (not an attribute), so leaving them as
  // `'` prevents the number highlighter from splitting an `&#39;` entity.
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"'"}[c]));
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  const valid = ['auto','light','dark'];
  const queryMode = new URLSearchParams(location.search).get('theme') || new URLSearchParams(location.hash.replace(/^#/,'')).get('theme');
  const themeKey = `leetcode-pro-theme-${data.id}`;
  const hostTheme = () => {
    try {
      const roots = [window.parent?.document?.documentElement, window.parent?.document?.body].filter(Boolean);
      const classes = roots.map(n => String(n.className || '')).join(' ');
      if (/\btheme-dark\b|\bdark-mode\b/i.test(classes)) return 'dark';
      if (/\btheme-light\b|\blight-mode\b/i.test(classes)) return 'light';
      const raw = getComputedStyle(roots[0]).getPropertyValue('--background-primary').trim();
      const m = raw.match(/rgba?\(([^)]+)\)/i);
      if (m) { const a = m[1].split(',').slice(0,3).map(Number); if (a.length === 3 && a.every(Number.isFinite)) return (0.2126*a[0]+0.7152*a[1]+0.0722*a[2])/255 < .48 ? 'dark' : 'light'; }
    } catch (_) {}
    return null;
  };
  let saved = ''; try { saved = localStorage.getItem(themeKey) || ''; } catch (_) {}
  let themeMode = valid.includes(queryMode) ? queryMode : valid.includes(saved) ? saved : 'auto';
  const setTheme = (mode, persist = true) => {
    themeMode = mode;
    document.documentElement.dataset.theme = mode === 'auto' ? (hostTheme() || (media && media.matches ? 'light' : 'dark')) : mode;
    const labels = {auto:['◌ 自动','切换主题（当前自动，跟随系统/宿主）'],light:['☀ 浅色','切换到暗色主题'],dark:['◐ 暗色','切换到自动主题']};
    const b = document.getElementById('theme-toggle'); if (b) { b.textContent = labels[mode][0]; b.title = labels[mode][1]; b.setAttribute('aria-label', labels[mode][1]); }
    if (persist && !valid.includes(queryMode)) { try { localStorage.setItem(themeKey, mode); } catch (_) {} }
  };
  document.getElementById('boot-fallback')?.remove(); document.body.insertAdjacentHTML('afterbegin', `<main class="app"><header class="topbar"><div><div class="eyebrow">C++ TRACE LAB · LEETCODE ${esc(data.id)}</div><h1 class="title">${esc(data.title)}</h1><p class="subtitle">每一帧都回答三个问题：当前看谁？哪个变量改变？为什么这一步不会破坏不变量？</p></div><div class="top-meta"><span class="pill accent">${esc(data.difficulty)}</span><span class="pill">${esc(data.modeLabel)}</span><span class="pill">${esc(data.day.replace(/^Day\s*/, 'Day ') || 'Hot100')}</span><button id="theme-toggle" type="button">◌ 自动</button></div></header><details class="problem-drawer" aria-label="力扣官方题目"><summary>力扣官方题目（展开阅读，题面独立滚动，不挤压动画操作） <a class="problem-link" href="${esc(data.leetcodeUrl)}" target="_blank" rel="noreferrer">打开力扣原题 ↗</a></summary><div class="problem-copy">${data.officialHtml || '<p>题面暂未归档，请打开官方链接查看。</p>'}</div></details><section class="workspace"><section class="panel visual-panel" aria-label="解法动画"><div class="panel-head"><span>解法状态 / TRACE</span><small id="phase-label">准备</small></div><div class="visual-scroll"><div class="lesson"><div class="lesson-mark" id="lesson-mark">01</div><div><strong id="lesson-title">先记住这一句</strong><p id="lesson-copy"></p></div></div><details class="source-insight"><summary>题解原意与易错点（折叠，不影响操作）</summary><div class="insight-grid"><div><b>解题思路</b><p id="thought-copy"></p></div><div><b>易错点</b><p id="pitfalls-copy"></p></div></div></details><div class="visual" id="visual"></div><div class="step-card"><div class="step-top"><span class="phase" id="phase"></span><span class="phase" id="step-number"></span></div><div class="step-title" id="step-title"></div><p class="step-body" id="step-body"></p></div></div><div class="controls"><button id="prev" type="button">← 上一步</button><button id="play" type="button">▶ 播放</button><button id="next" type="button">下一步 →</button><input id="slider" type="range" min="0" max="0" step="1" value="0" aria-label="动画步骤"><span class="counter" id="counter">1 / 1</span><button id="reset" type="button">重置</button></div></section><section class="panel code-panel" aria-label="C++ 代码"><div class="panel-head"><span>YXC FINAL CODE / C++17</span><small>高亮第 <b id="line-number">—</b> 行</small></div><div class="code-toolbar"><span>示例：<strong id="example"></strong></span><span>期望：<strong id="expected"></strong></span></div><div class="code-scroll" id="code"></div><div class="explain"><div class="explain-tag" id="explain-tag">CURRENT ACTION</div><h2 id="explain-title">准备开始</h2><p id="explain-body"></p></div></section></section><p class="footer-note">原始题解只读 · 逐题模式化状态 · 主题可跟随 Obsidian / 系统，也可手动切换</p></main>`);
  let density = 'learning';
  if (isLC42) {
    document.body.classList.add('lc42');
    const chapterButtons = data.frames.map((frame, index) => `<button type="button" data-frame-index="${index}" aria-current="${index === 0 ? 'true' : 'false'}" title="${esc(frame.title)}">${esc(frame.title)}</button>`).join('');
    document.querySelector('.top-meta').insertAdjacentHTML('beforeend', '<div class="trace-mode" role="group" aria-label="讲解模式"><button id="mode-learning" type="button" aria-pressed="true">学习</button><button id="mode-review" type="button" aria-pressed="false">复习</button></div>');
    document.querySelector('.visual-scroll').insertAdjacentHTML('afterbegin', `<nav id="chapter-nav" class="chapter-nav" aria-label="章节导航">${chapterButtons}</nav>`);
  }
  const $ = (id) => document.getElementById(id);
  $('lesson-copy').textContent = data.modeCopy || '先建立状态，再保持不变量直到循环结束。';
  $('thought-copy').textContent = data.thought || '本题的源笔记没有单独记录思路。';
  $('pitfalls-copy').textContent = data.pitfalls || '本题没有额外记录的易错点。';
  $('example').textContent = data.example; $('expected').textContent = data.expected;
  const highlighter = (line) => {
    // Protect already-wrapped spans with placeholders; running a second regex
    // over literal `<span class=...>` is what used to leak markup into code.
    let s = esc(line); const stash = [];
    const protect = (pattern, cls) => { s = s.replace(pattern, m => { const key = String.fromCharCode(0xE000 + stash.length); stash.push(`<span class="${cls}">${m}</span>`); return key; }); };
    protect(/\/\/.*$/,'comment');
    protect(/\b(class|public|private|return|if|else|while|for|auto|new|const|int|bool|void|true|false|nullptr)\b/g,'kw');
    protect(/\b(ListNode|vector|string|unordered_map|unordered_set|deque|stack|queue|TreeNode)\b/g,'type');
    protect(/\b([A-Za-z_]\w*)\s*(?=\()/g,'fn');
    protect(/(?<![A-Za-z_])(-?\d+(?:\.\d+)?)(?![A-Za-z_])/g,'num');
    return s.replace(/[\uE000-\uF8FF]/g, m => stash[m.charCodeAt(0) - 0xE000] || m);
  };
  const codeLines = (data.code || '').split('\n');
  $('code').innerHTML = codeLines.map((line,i) => `<div class="code-line" data-line="${i+1}"><span class="no">${i+1}</span><span>${highlighter(line)}</span></div>`).join('');
  const visual = (v) => {
    const tokenMarkup = (items, active, left, right) => (items || []).map((x,i) => `<span class="token ${i===active?'active ':''}${i===left?'left ':''}${i===right?'right ':''}">${esc(x)}${i===active?'<span class="marker">当前</span>':''}</span>`).join('<span class="arrow">→</span>');
    const chips = (values) => `<div class="state-strip">${(values || []).map(x => `<span class="state-chip">${esc(x)}</span>`).join('')}</div>`;
    let body = '';
    if (v.kind === 'water-stack') {
      const values = v.values || [], water = v.water || [];
      const active = new Set(v.active || []), compared = new Set(v.compared || []), result = new Set(v.result || []);
      const maxHeight = Math.max(...values.map((value, i) => value + (water[i] || 0)), 1);
      const scale = Math.min(42, 132 / maxHeight);
      const columns = values.map((value, i) => {
        const waterHeight = (water[i] || 0) * scale, barHeight = Math.max(value * scale, 2);
        const classes = `${active.has(i) ? 'active ' : ''}${compared.has(i) ? 'compared ' : ''}${result.has(i) ? 'result' : ''}`;
        const pointer = active.has(i) ? '<span class="water-pointer">i ↓</span>' : '';
        const waterMarkup = water[i] ? `<div class="water-fill" style="bottom:${barHeight}px;height:${waterHeight}px"></div>` : '';
        return `<div class="water-col ${classes}" style="--bar-height:${barHeight}px;--water-height:${waterHeight}px">${pointer}${waterMarkup}<div class="bar" style="height:${barHeight}px"></div><span class="water-value">${value}${water[i] ? ` +${water[i]}` : ''}</span><span class="water-index">${i}</span></div>`;
      }).join('');
      const vars = v.variables || {};
      const stack = (v.stack || []).slice().reverse().map((index, position) => `<div class="water-stack-item ${position === 0 ? 'top' : ''}">${index} : h=${values[index]}</div>`).join('') || '<div class="water-stack-item">空栈</div>';
      const variable = (name, value) => `<span class="water-var">${name} <strong>${esc(value === null || value === undefined ? '—' : value)}</strong></span>`;
      body = `<div class="water-layout"><div class="water-main"><div class="water-label-row"><span>height[] · water[]</span><span>${esc(v.note || '')}</span></div><div class="water-chart">${columns}</div><div class="water-legend"><span><i class="bar-key"></i>柱高</span><span><i class="water-key"></i>已结算水层</span><span><i class="scan-key"></i>当前扫描</span></div><p class="water-state-note">${esc(v.note || '')}</p></div><aside class="water-side"><div class="water-box"><div class="water-box-title">本步变量</div><div class="water-vars">${variable('i =', vars.i)}${variable('last =', vars.last)}${variable('res =', vars.res)}${variable('top =', vars.top)}</div></div><div class="water-box"><div class="water-box-title">stk · 栈底 → 栈顶</div><div class="water-stack-list">${stack}</div></div><div class="water-box"><div class="water-box-title">本步公式</div><div class="water-formula">${esc(v.formula || '本步没有执行面积加法')}</div></div></aside></div>`;
    } else if (v.kind === 'trace') {
      const active = new Set(v.active || []), compared = new Set(v.compared || []);
      const tokens = (v.tokens || []).map((x,i) => `<span class="trace-token ${active.has(i) ? 'active ' : ''}${compared.has(i) ? 'compared' : ''}">${esc(x)}${active.has(i) ? '<span class="marker">当前</span>' : ''}</span>`).join('<span class="arrow">→</span>');
      const rowMarkup = (v.rows || []).map(row => `<div class="trace-row"><span class="trace-row-label">${esc(row.label || 'state')}</span><div class="trace-row-values">${(row.values || []).map(value => `<span class="trace-cell">${esc(value)}</span>`).join('') || '<span class="trace-cell muted">空</span>'}</div></div>`).join('');
      const variableMarkup = Object.entries(v.variables || {}).map(([key,value]) => `<span class="trace-var">${esc(key)} <strong>${esc(value)}</strong></span>`).join('') || '<span class="trace-var">本步无额外变量</span>';
      body = `<div class="trace-layout"><div class="trace-main"><div class="box-title">输入 / 当前数据</div><div class="trace-tokens">${tokens || '<span class="trace-cell muted">空</span>'}</div><div class="trace-rows">${rowMarkup}</div></div><aside class="trace-side"><div class="trace-box"><div class="box-title">本步变量</div><div class="trace-vars">${variableMarkup}</div></div>${v.result && v.result.length ? `<div class="trace-box"><div class="box-title">已确认结果</div><div class="trace-result">${v.result.map(x => `<span class="trace-result-item">${esc(x)}</span>`).join('')}</div></div>` : ''}</aside></div><p class="micro-note">${esc(v.note)}</p>`;
    } else if (v.kind === 'hash') body = `<div class="hash-layout"><div><div class="box-title">输入序列</div><div class="tokens">${tokenMarkup(v.tokens, v.active)}</div></div><div class="hash-box"><div class="box-title">哈希表 / 历史状态</div>${(v.entries||[]).map(x => `<div class="hash-entry">${esc(x)}</div>`).join('')}</div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'window') body = `<div class="tokens">${tokenMarkup(v.tokens, -1, v.left, v.right)}</div><div class="state-strip"><span class="state-chip">l = ${v.left}</span><span class="state-chip">r = ${v.right}</span>${(v.entries||[]).map(x => `<span class="state-chip">${esc(x)}</span>`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'linked' || v.kind === 'cycle') { const result = v.result || []; body = `<div class="linked-layout"><div class="linked-line"><span class="linked-label">输入链</span>${(v.nodes||[]).map((x,i)=>`<span class="linked-node ${i===v.nodes.indexOf(v.pointers?.left)||i===v.nodes.indexOf(v.pointers?.slow)?'focus':''}"><span class="node-tags">${v.pointers?.left===x?'l1 ':''}${v.pointers?.right===x?'l2 ':''}${v.pointers?.slow===x?'slow ':''}${v.pointers?.fast===x?'fast':''}</span>${esc(x)}</span>${i<v.nodes.length-1?'<span class="arrow">→</span>':''}`).join('')}</div>${v.kind==='cycle'?`<div class="cycle-ring"><div class="pointer-box">${Object.entries(v.pointers||{}).map(([k,x])=>`<span class="pointer-pill">${esc(k)} = ${esc(x)}</span>`).join('')}</div></div>`:`<div class="linked-line"><span class="linked-label">结果链</span>${result.map((x,i)=>`<span class="linked-node result">${esc(x)}</span>${i<result.length-1?'<span class="arrow">→</span>':''}`).join('')}</div><div class="pointer-box">${Object.entries(v.pointers||{}).map(([k,x])=>`<span class="pointer-pill">${esc(k)} = ${esc(x)}</span>`).join('')}</div>`}<p class="micro-note">${esc(v.note)}</p></div>`; }
    else if (v.kind === 'stack') body = `<div class="stack-layout"><div><div class="box-title">输入 / 当前游标</div><div class="tokens">${tokenMarkup(v.tokens, v.active)}</div></div><div class="stack-box"><div class="box-title">栈顶 ↑</div>${(v.stack||[]).slice().reverse().map((x,i)=>`<div class="stack-item ${i===0?'top':''}">${esc(x)}</div>`).join('') || '<div class="stack-item">空</div>'}</div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'grid') body = `<div class="grid-layout">${(v.cells||[]).map((x,i)=>`<span class="grid-cell ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div>${chips((v.queue||[]).length ? ['queue = '+v.queue.join(' → '),'minute 按层推进'] : ['visited 标记','每块只计数一次'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'tree') body = `<div class="tree-layout"><div class="tree-root">${esc(v.root)}</div><div class="tree-branches"><div class="tree-child">${esc(v.children[0])}</div><div class="tree-child">${esc(v.children[1])}</div></div></div>${v.sequence?chips(v.sequence):''}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'graph') body = `<div class="graph-layout">${(v.nodes||[]).map((x,i)=>`<div class="graph-node ${i===v.active?'active':''}">${esc(x)}<br><small>${v.queue?.includes(x)?'入队':'待处理'}</small></div>`).join('')}</div>${chips(['queue = ['+(v.queue||[]).join(', ')+']','入度为 0 → 可处理'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'trie') body = `<div class="trie-path">${(v.letters||[]).map((x,i)=>`<span class="trie-letter ${i===v.active?'active':''}">${esc(x)}</span>`).join('<span class="arrow">→</span>')}</div>${chips(['root = 空前缀','end 标记区分完整单词'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'dp1d-trace') body = `<div class="tokens">${tokenMarkup(v.tokens, v.active)}</div>${chips([`current = ${v.current}`, `best = ${v.best}`, 'dp[i] = max(nums[i], dp[i−1]+nums[i])'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'greedy-trace') body = `<div class="tokens">${tokenMarkup(v.tokens, v.active)}</div>${chips([`min_price = ${v.minp}`, `max_profit = ${v.profit}`, '先买后卖'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'palindrome') body = `<div class="tokens">${tokenMarkup(v.tokens, v.center, v.left, v.right)}</div>${chips([v.center < 0 ? 'center = 全部完成' : `center = ${v.center}`, v.left < 0 ? 'l/r = —' : `l = ${v.left}, r = ${v.right}`, `best = "${v.best || ''}"`])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'cycle-array') body = `<div class="tokens">${tokenMarkup(v.tokens, v.active)}</div>${chips([`slow = ${v.slow}`, `fast = ${v.fast}`, 'nums[i] 作为 next'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'dp') body = `<div class="dp-layout">${(v.rows||[]).flat().map((x,i)=>`<span class="dp-cell ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'binary') body = `<div class="tokens">${tokenMarkup(v.tokens,-1)}</div><div class="binary-layout"><div class="binary-line">${v.tokens.map((x,i)=>`<span class="binary-mark ${i===v.lo?'lo':''} ${i===v.mid?'mid':''} ${i===v.hi?'hi':''}" style="left:${v.tokens.length===1?50:(i/(v.tokens.length-1))*100}%">${i===v.lo?'lo ':''}${i===v.mid?'mid ':''}${i===v.hi?'hi':''}</span>`).join('')}</div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'heap') body = `<div class="heap-row">${(v.items||[]).map((x,i)=>`<span class="array-node ${i===v.active?'active':''}">${esc(x)}</span>${i<v.items.length-1?'<span class="arrow">·</span>':''}`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'dual-heap') body = `<div class="hash-layout"><div class="hash-box"><div class="box-title">较小一半 / max-heap</div><div class="hash-entry">${esc(v.left)}</div></div><div class="hash-box"><div class="box-title">较大一半 / min-heap</div><div class="hash-entry">${esc(v.right)}</div></div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'lru') body = `<div class="lru-line">${(v.items||[]).map((x,i)=>`<span class="lru-node ${i===v.active?'active':''}">${esc(x)}</span>${i<v.items.length-1?'<span class="arrow">↔</span>':''}`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'backtrack') body = `<div class="choice-row"><div class="path-box"><div class="box-title">当前路径</div><div class="tokens">${(v.path||[]).map(x=>`<span class="token active">${esc(x)}</span>`).join('<span class="arrow">→</span>') || '<span class="state-chip">空</span>'}</div></div><div class="path-box"><div class="box-title">本层候选</div><div class="choices">${(v.choices||[]).map((x,i)=>`<span class="choice ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div></div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'interval') body = `<div class="interval-row">${(v.items||[]).map((x,i)=>`<span class="array-node ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'twoptr') body = `<div class="tokens">${tokenMarkup(v.tokens,-1,v.left,v.right)}</div><div class="pointer-box"><span class="pointer-pill">left = ${v.left}</span><span class="pointer-pill">right = ${v.right}</span></div><p class="micro-note">${esc(v.note)}</p>`;
    else body = `<div class="tokens">${tokenMarkup(v.tokens,v.active)}</div><p class="micro-note">${esc(v.note)}</p>`;
    return `<div class="visual-head"><span class="visual-label">${esc(v.label || '状态')}</span><span class="visual-note">${esc(v.badge || '')}</span></div>${body}`;
  };
  const steps = data.steps || []; let index = 0; let timer = null;
  const currentFrame = () => isLC42 ? data.frames[steps[index]?.frameIndex || 0] : null;
  const lineNumbersFor = (step) => (step.lineIds || [step.line]).map(Number);
  const speedScale = () => ({'1600':0.75,'1250':1,'850':1.5,'600':2}[String($('speed').value)] || 1);
  const delayFor = (step) => isLC42 ? Math.max(260, Math.round((step.durationMs || 620) / speedScale())) : Number($('speed').value);
  const render = () => {
    const s = steps[index] || {phase:'准备',title:'准备开始',body:'',line:1,kind:'info',visual:{kind:'array',label:'状态',tokens:['输入']}};
    const frame = currentFrame();
    const displayBody = isLC42 && density === 'review' ? (s.reviewBody || s.body) : s.body;
    $('phase-label').textContent = isLC42 ? (frame?.phaseLabel || s.phase) : s.phase;
    $('lesson-mark').textContent = String(isLC42 ? (s.frameIndex + 1) : index + 1).padStart(2,'0');
    $('phase').textContent = s.phase;
    $('step-number').textContent = isLC42 ? `章节 ${s.frameIndex + 1}/${data.frames.length} · beat ${s.beatIndex + 1}/${s.frameBeatCount}` : `${String(index+1).padStart(2,'0')} / ${steps.length}`;
    $('lesson-title').textContent = isLC42 ? (frame?.captions?.[density] || s.frameTitle) : s.title;
    $('lesson-copy').textContent = isLC42 ? (density === 'review' ? data.reviewCopy : data.modeCopy) : (data.modeCopy || '');
    $('step-title').textContent = s.title; $('step-body').textContent = displayBody;
    $('visual').innerHTML = visual(s.visual);
    $('counter').textContent = isLC42 ? `执行 ${index+1}/${steps.length}` : `${index+1} / ${steps.length}`;
    $('slider').value = String(index); $('slider').setAttribute('aria-valuetext', `${s.phase}：${s.title}`); $('slider').max = String(Math.max(steps.length-1,0));
    $('prev').disabled = index===0; $('next').disabled = index===steps.length-1; $('play').textContent = timer !== null ? '⏸ 暂停' : '▶ 播放';
    $('line-number').textContent = lineNumbersFor(s).join(' + '); $('explain-tag').textContent = `${String(s.kind || 'action').toUpperCase()} · LINE ${lineNumbersFor(s).join('+')}`; $('explain-title').textContent = s.title; $('explain-body').textContent = displayBody;
    const lineSet = new Set(lineNumbersFor(s)); document.querySelectorAll('.code-line').forEach(el => el.classList.toggle('active', lineSet.has(Number(el.dataset.line))));
    const active = document.querySelector('.code-line.active'), scrollBox = $('code');
    if (active && scrollBox) { const box = scrollBox.getBoundingClientRect(), rect = active.getBoundingClientRect(); if (rect.top < box.top + box.height * 0.2 || rect.bottom > box.bottom - box.height * 0.2) active.scrollIntoView({block:'center', behavior:'auto'}); }
    if (isLC42) { document.querySelectorAll('.chapter-nav button').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.frameIndex) === s.frameIndex))); $('mode-learning').setAttribute('aria-pressed', String(density === 'learning')); $('mode-review').setAttribute('aria-pressed', String(density === 'review')); }
  };
  const stop = () => { if (timer !== null) { clearTimeout(timer); timer = null; } render(); };
  const next = () => { if (index < steps.length-1) { index += 1; render(); } else stop(); };
  const scheduleLC42 = () => { if (timer === null) return; if (index >= steps.length-1) { stop(); return; } timer = setTimeout(() => { index += 1; if (index >= steps.length-1) { timer = null; render(); return; } timer = 0; scheduleLC42(); render(); }, delayFor(steps[index])); };
  const gotoFrame = (frameIndex) => { if (!isLC42) return; const target = data.frames[Math.max(0, Math.min(data.frames.length - 1, frameIndex))]; if (!target) return; stop(); index = target.start; render(); };
  const setDensity = (mode) => { if (!isLC42) return; density = mode === 'review' ? 'review' : 'learning'; try { localStorage.setItem(`leetcode-pro-density-${data.id}`, density); } catch (_) {} render(); };
  $('prev').onclick = () => { stop(); index = Math.max(0,index-1); render(); }; $('next').onclick = () => { stop(); next(); }; $('reset').onclick = () => { stop(); index = 0; render(); }; $('slider').oninput = e => { stop(); index = Number(e.target.value); render(); };
  $('play').onclick = () => { if (timer !== null) { stop(); return; } if (index >= steps.length-1) index = 0; if (isLC42) { timer = 0; scheduleLC42(); } else timer = setInterval(next, Number($('speed').value)); render(); };
  $('theme-toggle').onclick = () => setTheme(themeMode==='auto'?'light':themeMode==='light'?'dark':'auto'); $('speed').onchange = () => { if (isLC42) { try { localStorage.setItem(`leetcode-pro-speed-${data.id}`, $('speed').value); } catch (_) {} } if (timer !== null) { stop(); $('play').click(); } };
  if (isLC42) { try { density = localStorage.getItem(`leetcode-pro-density-${data.id}`) === 'review' ? 'review' : 'learning'; const savedSpeed = localStorage.getItem(`leetcode-pro-speed-${data.id}`); if (savedSpeed && [...$('speed').options].some(option => option.value === savedSpeed)) $('speed').value = savedSpeed; } catch (_) {} document.querySelectorAll('.chapter-nav button').forEach(button => button.addEventListener('click', () => gotoFrame(Number(button.dataset.frameIndex)))); $('mode-learning').onclick = () => setDensity('learning'); $('mode-review').onclick = () => setDensity('review'); }
  document.addEventListener('keydown', e => { if (['INPUT','SELECT','BUTTON'].includes(e.target.tagName)) return; if (e.key.toLowerCase()==='r') { e.preventDefault(); $('reset').click(); return; } if (e.key==='ArrowRight') { e.preventDefault(); if (isLC42 && e.shiftKey) gotoFrame((steps[index]?.frameIndex || 0) + 1); else { stop(); next(); } } else if (e.key==='ArrowLeft') { e.preventDefault(); if (isLC42 && e.shiftKey) gotoFrame((steps[index]?.frameIndex || 0) - 1); else { stop(); index=Math.max(0,index-1); render(); } } else if (e.key===' ') { e.preventDefault(); $('play').click(); } }); if (media && media.addEventListener) media.addEventListener('change',()=>{ if(themeMode==='auto') setTheme('auto',false); }); setTheme(themeMode,false); render();
  window.__leetcodeAnimation = {data, getState:()=>({id:data.id,index,step:steps[index]}), goTo:(i)=>{ stop(); index=Math.max(0,Math.min(steps.length-1,Number(i)||0)); render(); }, goToFrame:gotoFrame, audit:()=>isLC42 ? ({...data.traceAudit,currentIndex:index,currentFrame:steps[index]?.frameIndex}) : ({id:data.id,stepCount:steps.length,lineRange:steps.every(s=>s.line>=1&&s.line<=codeLines.length),lastPhase:steps.at(-1)?.phase,expected:data.expected})};
})();
'''

# Small post-processing keeps the long, readable raw strings above stable while
# giving the generated pages the last two pilot-level affordances: a speed
# selector and a gentle state-transition cue.  These replacements are applied
# before the standalone CSS/JS assets and all 100 pages are written.
ENGINE_CSS = ENGINE_CSS.replace(
    '.visual-scroll{',
    '.source-insight{margin:-2px 0 11px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 78%,transparent);color:var(--muted);font-size:11px}.source-insight summary{cursor:pointer;padding:8px 10px;color:var(--accent);font-weight:700}.source-insight summary::-webkit-details-marker{color:var(--accent)}.insight-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-top:1px solid var(--line);padding:9px 10px}.insight-grid b{font:700 10px/1.2 var(--font-code);color:var(--teal)}.insight-grid p{margin:4px 0 0;line-height:1.55}.visual-scroll{'
).replace(
    'grid-template-columns:auto auto auto minmax(90px,1fr) auto auto;',
    'grid-template-columns:auto auto auto minmax(90px,1fr) auto auto auto;'
).replace(
    '.visual-head{',
    '.visual.step-enter{animation:stateIn .25s ease both}@keyframes stateIn{from{opacity:.42;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.visual-head{'
).replace(
    '.hash-layout,.stack-layout,.choice-row{grid-template-columns:1fr}',
    '.hash-layout,.stack-layout,.choice-row,.insight-grid{grid-template-columns:1fr}'
)
ENGINE_CSS = ENGINE_CSS.replace(
    '@media(max-width:1050px){body{overflow:auto;height:auto}.app{height:auto;min-height:100vh}.workspace{grid-template-columns:1fr}.code-panel{min-height:420px}.code-scroll{max-height:520px}}',
    '@media(max-width:1050px){body{overflow-x:auto;overflow-y:hidden;height:100vh}.app{height:100vh;min-height:720px;min-width:680px;margin-left:0;margin-right:0}.workspace{grid-template-columns:minmax(0,56fr) minmax(310px,44fr)}.code-panel{min-height:0}.code-scroll{max-height:none}}'
)
ENGINE_CSS += r'''
@media(max-width:1050px){
  .controls{grid-template-columns:repeat(3,minmax(0,1fr));}
  .controls button,.controls select{white-space:nowrap;}
  .controls input[type=range]{grid-column:1/-1;grid-row:2;}
  .controls .counter{grid-column:1;grid-row:3;align-self:center;}
  .controls select{grid-column:2;grid-row:3;}
  .controls #reset{grid-column:3;grid-row:3;}
}
'''

TRACE_CSS = r'''
.trace-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(178px,.72fr);gap:12px;align-items:start}.trace-main{min-width:0}.trace-tokens{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:42px}.trace-token{position:relative;min-width:38px;padding:8px 7px;text-align:center;border:1px solid color-mix(in srgb,var(--accent) 31%,var(--line));border-radius:8px;background:color-mix(in srgb,var(--accent) 7%,var(--panel-strong));font:11px/1.25 var(--font-code)}.trace-token.active{border-color:var(--orange);box-shadow:0 0 0 3px color-mix(in srgb,var(--orange) 18%,transparent);transform:translateY(-2px)}.trace-token.compared{border-color:var(--blue)}.trace-rows{display:grid;gap:7px;margin-top:12px}.trace-row{display:grid;grid-template-columns:68px minmax(0,1fr);gap:7px;align-items:start}.trace-row-label{padding-top:5px;color:var(--muted);font:700 9px/1.25 var(--font-code);overflow-wrap:anywhere}.trace-row-values{display:flex;gap:5px;flex-wrap:wrap;min-width:0}.trace-cell{display:inline-flex;align-items:center;min-height:25px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;color:var(--text);background:color-mix(in srgb,var(--teal) 7%,transparent);font:10px/1.25 var(--font-code);overflow-wrap:anywhere;max-width:100%}.trace-cell.muted{color:var(--muted)}.trace-side{display:grid;gap:8px;min-width:0}.trace-box{min-width:0;border:1px solid var(--line);border-radius:9px;padding:8px;background:color-mix(in srgb,var(--teal) 5%,transparent)}.trace-vars{display:grid;grid-template-columns:1fr 1fr;gap:5px}.trace-var{min-width:0;padding:5px 6px;border:1px solid var(--line);border-radius:6px;color:var(--muted);font:10px/1.25 var(--font-code);overflow-wrap:anywhere}.trace-var strong{color:var(--text);font-weight:600}.trace-result{display:flex;gap:5px;flex-wrap:wrap}.trace-result-item{padding:5px 6px;border:1px solid var(--teal);border-radius:6px;color:var(--teal);font:10px/1.25 var(--font-code);background:color-mix(in srgb,var(--teal) 12%,transparent)}
@media(max-width:820px){.trace-layout{grid-template-columns:1fr}.trace-side{grid-template-columns:1fr 1fr}.trace-vars{grid-template-columns:1fr 1fr}}
@media(max-width:660px){.trace-side{grid-template-columns:1fr}.trace-row{grid-template-columns:58px minmax(0,1fr)}}
'''


LC42_CSS = r'''
.lc42 .app{min-width:680px}
.lc42 .workspace{grid-template-columns:minmax(0,56fr) minmax(310px,44fr)}
.lc42 .trace-mode{display:inline-flex;align-items:center;gap:2px;border:1px solid var(--line);border-radius:10px;padding:2px;background:color-mix(in srgb,var(--panel) 82%,transparent)}
.lc42 .trace-mode button{border:0;border-radius:7px;padding:6px 8px;background:transparent;color:var(--muted);font:700 11px/1.2 var(--font-body);transform:none}
.lc42 .trace-mode button:hover:not(:disabled){border:0;transform:none;color:var(--text)}
.lc42 .trace-mode button[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--panel));color:var(--accent)}
.lc42 .chapter-nav{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:0 0 11px;padding:7px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 70%,transparent)}
.lc42 .chapter-nav button{min-width:0;padding:6px 5px;border-radius:7px;font:700 10px/1.25 var(--font-code);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc42 .chapter-nav button[aria-current="true"]{border-color:var(--teal);background:color-mix(in srgb,var(--teal) 14%,transparent);color:var(--teal)}
.lc42 .water-layout{display:grid;grid-template-columns:minmax(0,1fr) 184px;gap:10px;align-items:start}
.lc42 .water-main{min-width:0}
.lc42 .water-label-row{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;color:var(--muted);font:700 10px/1.25 var(--font-code)}
.lc42 .water-chart{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;align-items:end;height:180px;padding:8px 3px 21px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 3%,transparent),transparent)}
.lc42 .water-col{position:relative;height:150px;min-width:0;display:flex;align-items:flex-end;justify-content:center}
.lc42 .water-col .bar{position:absolute;bottom:0;width:72%;min-height:2px;border:1px solid color-mix(in srgb,var(--teal) 52%,var(--line));border-bottom:0;border-radius:5px 5px 0 0;background:color-mix(in srgb,var(--teal) 15%,var(--panel-strong));transition:height .18s ease,background .18s ease,border-color .18s ease}
.lc42 .water-fill{position:absolute;z-index:1;width:72%;left:14%;border:1px solid color-mix(in srgb,var(--blue) 70%,var(--line));border-bottom:0;border-radius:4px 4px 0 0;background:color-mix(in srgb,var(--blue) 28%,transparent);transition:height .18s ease,bottom .18s ease}
.lc42 .water-col.active{outline:2px solid color-mix(in srgb,var(--orange) 72%,transparent);outline-offset:2px;border-radius:5px}
.lc42 .water-col.active .bar{border-color:var(--orange);background:color-mix(in srgb,var(--orange) 18%,var(--panel-strong))}
.lc42 .water-col.compared .bar{border-color:var(--orange);background:color-mix(in srgb,var(--orange) 12%,var(--panel-strong))}
.lc42 .water-col.result .water-fill{border-color:var(--teal);background:color-mix(in srgb,var(--teal) 35%,transparent)}
.lc42 .water-pointer{position:absolute;top:-2px;left:50%;transform:translateX(-50%);color:var(--orange);font:800 9px/1 var(--font-code);white-space:nowrap}
.lc42 .water-value{position:absolute;bottom:calc(var(--bar-height) + var(--water-height) + 4px);color:var(--text);font:700 9px/1 var(--font-code);white-space:nowrap}
.lc42 .water-index{position:absolute;bottom:-17px;color:var(--muted);font:700 9px/1 var(--font-code)}
.lc42 .water-box{min-width:0;border:1px solid var(--line);border-radius:9px;padding:8px;background:color-mix(in srgb,var(--teal) 5%,transparent)}
.lc42 .water-box+.water-box{margin-top:8px}
.lc42 .water-box-title{margin-bottom:6px;color:var(--muted);font:700 10px/1.25 var(--font-code);letter-spacing:.04em}
.lc42 .water-stack-list{display:grid;gap:4px;max-height:112px;overflow:auto}
.lc42 .water-stack-item{padding:5px 6px;border:1px solid var(--line);border-radius:6px;background:color-mix(in srgb,var(--teal) 10%,transparent);font:10px/1.25 var(--font-code)}
.lc42 .water-stack-item.top{border-color:var(--orange);color:var(--orange)}
.lc42 .water-vars{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.lc42 .water-var{padding:4px 5px;border:1px solid var(--line);border-radius:6px;color:var(--muted);font:10px/1.25 var(--font-code)}
.lc42 .water-var strong{color:var(--text);font-weight:600}
.lc42 .water-formula{color:var(--orange);font:10px/1.45 var(--font-code);overflow-wrap:anywhere}
.lc42 .water-legend{display:flex;flex-wrap:wrap;gap:9px;margin-top:6px;color:var(--muted);font-size:10px}
.lc42 .water-legend span{display:inline-flex;align-items:center;gap:4px}
.lc42 .water-key{width:10px;height:10px;border:1px solid var(--blue);border-radius:3px;background:color-mix(in srgb,var(--blue) 28%,transparent)}
.lc42 .bar-key{width:10px;height:10px;border:1px solid var(--teal);border-radius:3px;background:color-mix(in srgb,var(--teal) 15%,transparent)}
.lc42 .scan-key{width:8px;height:8px;border:2px solid var(--orange);border-radius:50%}
.lc42 .water-state-note{margin-top:8px;color:var(--muted);font-size:11px;line-height:1.45}
.lc42 .trace-audit{margin-top:10px;border-top:1px solid var(--line);padding-top:8px;color:var(--muted);font:10px/1.4 var(--font-code)}
.lc42 .trace-audit strong{color:var(--teal)}
@media(max-width:820px){.lc42 .water-layout{grid-template-columns:1fr}.lc42 .water-side{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.lc42 .water-box+.water-box{margin-top:0}}
@media(max-width:720px){.lc42 .water-side{display:block}.lc42 .water-box+.water-box{margin-top:8px}.lc42 .chapter-nav{grid-template-columns:repeat(7,minmax(48px,1fr));overflow-x:auto}}
@media(max-width:1050px){.lc42 .app{min-width:680px}.lc42 .workspace{grid-template-columns:minmax(0,56fr) minmax(310px,44fr)}}
'''
ENGINE_JS = ENGINE_JS.replace(
    '<main class="app">',
    '<main class="app" tabindex="0">'
).replace(
    '<input id="slider" type="range" min="0" max="0" step="1" value="0" aria-label="动画步骤"><span class="counter" id="counter">1 / 1</span><button id="reset" type="button">重置</button>',
    '<input id="slider" type="range" min="0" max="0" step="1" value="0" aria-label="动画步骤"><span class="counter" id="counter">1 / 1</span><select id="speed" aria-label="播放速度"><option value="1600">0.75×</option><option value="1250" selected>1×</option><option value="850">1.5×</option><option value="600">2×</option></select><button id="reset" type="button">重置</button>'
).replace(
    "$('visual').innerHTML = visual(s.visual);",
    "$('visual').classList.remove('step-enter'); void $('visual').offsetWidth; $('visual').innerHTML = visual(s.visual); $('visual').classList.add('step-enter');"
).replace(
    "timer = setInterval(next, 1250);",
    "timer = setInterval(next, Number($('speed').value));"
).replace(
    "  $('play').onclick =",
    "  $('slider').onclick = e => { if (!e.detail || !Number.isFinite(e.clientX)) return; const target = e.currentTarget; const rect = target.getBoundingClientRect(); const max = Number(target.max) || 0; const value = Math.max(0, Math.min(max, Math.round(((e.clientX - rect.left) / rect.width) * max))); if (value !== Number(target.value)) { stop(); index = value; render(); } };\n  $('play').onclick ="
).replace(
    "window.__leetcodeAnimation = {data, getState:()=>({id:data.id,index,step:steps[index]}), audit:()=>({id:data.id,stepCount:steps.length,lineRange:steps.every(s=>s.line>=1&&s.line<=codeLines.length),lastPhase:steps.at(-1)?.phase,expected:data.expected})};",
    "window.__leetcodeAnimation = {data, getState:()=>({id:data.id,index,step:steps[index]}), goTo:(i)=>{ stop(); index=Math.max(0,Math.min(steps.length-1,Number(i)||0)); render(); }, audit:()=>({id:data.id,stepCount:steps.length,lineRange:steps.every(s=>s.line>=1&&s.line<=codeLines.length),lastPhase:steps.at(-1)?.phase,expected:data.expected})};"
)


def write_day_outputs(items: list[dict]) -> None:
    DAY_OUT.mkdir(parents=True, exist_ok=True)
    # Keep the engine source beside the generated pages for inspection and
    # future regeneration, while every HTML remains standalone/offline.
    asset_dir = DAY_OUT / "00-生成器"
    asset_dir.mkdir(parents=True, exist_ok=True)
    (asset_dir / "generate_day_pro.py").write_text(Path(__file__).read_text())
    (asset_dir / "engine.css").write_text(ENGINE_CSS + TRACE_CSS)
    (asset_dir / "engine.js").write_text(ENGINE_JS)

    groups: OrderedDict[str, list[dict]] = OrderedDict()
    for item in items:
        groups.setdefault(item["day"] or "未分组", []).append(item)

    index_lines = [
        "# LeetCode Hot100 动画 · 按学习 Day 分组",
        "",
        "这是新的、按原始题解 Day 1–Day 14 归档的动画入口。每道题包含独立 HTML 和 Obsidian 预览；题面默认折叠，题面区域独立滚动，不抢占动画控制区。",
        "",
        "> 质量基线：LeetCode 21「合并两个有序链表」的逐状态链表样板。其余题目按题型使用对应的数组、窗口、栈、树、DP、二分等状态模型；第 5 题使用中心扩展专属状态，第 1/3/20 题按示例逐变量演化。",
        "",
        "| Day | 主题 | 题数 | 入口 |",
        "|---|---|---:|---|",
    ]
    for day, day_items in groups.items():
        slug = safe_day_slug(day)
        index_lines.append(f"| {day.split('：', 1)[0]} | {day.split('：', 1)[1] if '：' in day else day} | {len(day_items)} | [打开 Day 入口](<{slug}/README.md>) |")
        day_dir = DAY_OUT / slug
        day_dir.mkdir(parents=True, exist_ok=True)
        day_lines = [f"# {day}", "", "按原始学习顺序排列。每题的官方题面与动画放在同一页面，但题面折叠后不影响单步操作。", "", "| 题号 | 题目 | 难度 | 动画模式 | HTML | Obsidian |", "|---:|---|---|---|---|---|"]
        for item in day_items:
            folder = f"{item['id']}-{item['title']}"
            page_dir = day_dir / folder
            page_dir.mkdir(parents=True, exist_ok=True)
            built = build_problem(item)
            payload = json.dumps(built, ensure_ascii=False, separators=(",", ":"))
            page = PAGE_TEMPLATE.replace("{id}", str(item["id"])).replace("{title}", item["title"])
            page_css = ENGINE_CSS + TRACE_CSS + (LC42_CSS if item["id"] == 42 else "")
            page = page.replace("__CSS__", page_css).replace("__DATA__", escape_json(payload)).replace("__JS__", ENGINE_JS)
            (page_dir / "index.html").write_text(page)
            page_dir.joinpath("trace-audit.json").write_text(json.dumps({
                "problemId": item["id"],
                "traceSchema": built.get("traceSchema", "leetcode-animation-complete-state-v1"),
                "traceAudit": built.get("traceAudit", {}),
                "sourceCodeSha256": built.get("sourceCodeSha256"),
                "sourceSemanticTokenHash": built.get("sourceSemanticTokenHash"),
                "steps": built.get("steps", []),
            }, ensure_ascii=False, indent=2) + "\n")
            (page_dir / "Obsidian预览.md").write_text(page_preview(item, page_dir / "index.html"))
            rel = f"{folder}/index.html"
            rel_preview = f"{folder}/Obsidian预览.md"
            mode = mode_for(item)
            day_lines.append(f"| {item['id']} | {item['title']} | {item['difficulty']} | `{MODE_LABELS.get(mode, mode)}` | [{folder}](<{rel}>) | [Obsidian](<{rel_preview}>) |")
        (day_dir / "README.md").write_text("\n".join(day_lines) + "\n")
    (DAY_OUT / "README.md").write_text("\n".join(index_lines) + "\n")


def write_lc42_output(item: dict) -> Path:
    """Regenerate only LC42, leaving every other Day page byte-for-byte alone."""
    DAY_OUT.mkdir(parents=True, exist_ok=True)
    asset_dir = DAY_OUT / "00-生成器"
    asset_dir.mkdir(parents=True, exist_ok=True)
    asset_dir.joinpath("generate_day_pro.py").write_text(Path(__file__).read_text())
    asset_dir.joinpath("engine.css").write_text(ENGINE_CSS + TRACE_CSS + LC42_CSS)
    asset_dir.joinpath("engine.js").write_text(ENGINE_JS)

    built = build_lc42_problem(item)
    page_dir = DAY_OUT / safe_day_slug(item["day"]) / f"{item['id']}-{item['title']}"
    page_dir.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(built, ensure_ascii=False, separators=(",", ":"))
    page = PAGE_TEMPLATE.replace("{id}", str(item["id"])).replace("{title}", item["title"])
    page = page.replace("__CSS__", ENGINE_CSS + TRACE_CSS + LC42_CSS).replace("__DATA__", escape_json(payload)).replace("__JS__", ENGINE_JS)
    page_path = page_dir / "index.html"
    page_path.write_text(page)
    page_dir.joinpath("Obsidian预览.md").write_text(page_preview(item, page_path))
    page_dir.joinpath("trace-audit.json").write_text(json.dumps({
        "problemId": item["id"],
        "traceSchema": built["traceSchema"],
        "traceAudit": built["traceAudit"],
        "frames": built["frames"],
        "finalStep": built["steps"][-1],
    }, ensure_ascii=False, indent=2) + "\n")
    return page_path


if __name__ == "__main__":
    parsed = old.parse_source()
    if "--lc42-only" in sys.argv:
        lc42 = next(item for item in parsed if item["id"] == 42)
        print(f"generated {write_lc42_output(lc42)}")
    else:
        write_day_outputs(parsed)
        print(f"generated {len(parsed)} day-organised pages under {DAY_OUT}")
