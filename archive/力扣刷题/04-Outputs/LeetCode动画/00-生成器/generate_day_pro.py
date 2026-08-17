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
from collections import OrderedDict
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent
OLD_GENERATOR = ROOT / "generate.py"
spec = importlib.util.spec_from_file_location("old_generate", OLD_GENERATOR)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load the existing generator")
old = importlib.util.module_from_spec(spec)
spec.loader.exec_module(old)

VAULT = old.VAULT
OUT = old.OUT
DAY_OUT = OUT.parent / "LeetCode动画-按Day"
PILOT = OUT / "21-合并两个有序链表" / "index.html"


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
}


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


def line_map(code: str, mode: str) -> list[int]:
    """Pick real source lines for the eight teaching frames."""
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
    finish = line_for(code, r"\breturn\b")
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


def build_problem(item: dict) -> dict:
    mode = old.MODES.get(item["id"], "array")
    if item["id"] not in old.EXAMPLES:
        raise RuntimeError(f"missing example for LeetCode {item['id']}")
    example, expected = old.EXAMPLES[item["id"]]
    enriched = {**item, "mode": mode, "example": example, "expected": expected}
    total = 8
    lines = line_map(item["code"], mode)
    steps = []
    for frame in range(total):
        title, body, kind = step_copy(enriched, mode, frame)
        phase = ["读题", "建立不变量", "观察状态", "核心动作", "状态更新", "边界检查", "结果收束", "返回"][frame]
        steps.append({
            "id": f"{mode}-{frame + 1}",
            "line": lines[frame],
            "phase": phase,
            "title": title,
            "body": body,
            "kind": kind,
            "visual": visual_for(enriched, mode, frame, total),
        })
    return {
        **enriched,
        "modeLabel": MODE_LABELS.get(mode, mode),
        "modeCopy": old.MODE_COPY.get(mode, "先建立状态，再保持不变量直到循环结束。"),
        "steps": steps,
    }


def safe_day_slug(day: str) -> str:
    value = re.sub(r"^Day\s*", "Day ", day.strip())
    value = re.sub(r"[：:/\\]+", "-", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip(" .")


def page_preview(item: dict, page_path: Path) -> str:
    uri = "file://" + quote(page_path.as_posix(), safe="/") + "#theme=auto"
    mode = old.MODES.get(item["id"], "array")
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
  document.body.innerHTML = `<main class="app"><header class="topbar"><div><div class="eyebrow">C++ TRACE LAB · LEETCODE ${esc(data.id)}</div><h1 class="title">${esc(data.title)}</h1><p class="subtitle">每一帧都回答三个问题：当前看谁？哪个变量改变？为什么这一步不会破坏不变量？</p></div><div class="top-meta"><span class="pill accent">${esc(data.difficulty)}</span><span class="pill">${esc(data.modeLabel)}</span><span class="pill">${esc(data.day.replace(/^Day\s*/, 'Day ') || 'Hot100')}</span><button id="theme-toggle" type="button">◌ 自动</button></div></header><details class="problem-drawer" aria-label="力扣官方题目"><summary>力扣官方题目（展开阅读，题面独立滚动，不挤压动画操作） <a class="problem-link" href="${esc(data.leetcodeUrl)}" target="_blank" rel="noreferrer">打开力扣原题 ↗</a></summary><div class="problem-copy">${data.officialHtml || '<p>题面暂未归档，请打开官方链接查看。</p>'}</div></details><section class="workspace"><section class="panel visual-panel" aria-label="解法动画"><div class="panel-head"><span>解法状态 / TRACE</span><small id="phase-label">准备</small></div><div class="visual-scroll"><div class="lesson"><div class="lesson-mark" id="lesson-mark">01</div><div><strong id="lesson-title">先记住这一句</strong><p id="lesson-copy"></p></div></div><div class="visual" id="visual"></div><div class="step-card"><div class="step-top"><span class="phase" id="phase"></span><span class="phase" id="step-number"></span></div><div class="step-title" id="step-title"></div><p class="step-body" id="step-body"></p></div></div><div class="controls"><button id="prev" type="button">← 上一步</button><button id="play" type="button">▶ 播放</button><button id="next" type="button">下一步 →</button><input id="slider" type="range" min="0" max="0" step="1" value="0" aria-label="动画步骤"><span class="counter" id="counter">1 / 1</span><button id="reset" type="button">重置</button></div></section><section class="panel code-panel" aria-label="C++ 代码"><div class="panel-head"><span>YXC FINAL CODE / C++17</span><small>高亮第 <b id="line-number">—</b> 行</small></div><div class="code-toolbar"><span>示例：<strong id="example"></strong></span><span>期望：<strong id="expected"></strong></span></div><div class="code-scroll" id="code"></div><div class="explain"><div class="explain-tag" id="explain-tag">CURRENT ACTION</div><h2 id="explain-title">准备开始</h2><p id="explain-body"></p></div></section></section><p class="footer-note">原始题解只读 · 逐题模式化状态 · 主题可跟随 Obsidian / 系统，也可手动切换</p></main>`;
  const $ = (id) => document.getElementById(id);
  $('lesson-copy').textContent = data.modeCopy || '先建立状态，再保持不变量直到循环结束。';
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
    if (v.kind === 'hash') body = `<div class="hash-layout"><div><div class="box-title">输入序列</div><div class="tokens">${tokenMarkup(v.tokens, v.active)}</div></div><div class="hash-box"><div class="box-title">哈希表 / 历史状态</div>${(v.entries||[]).map(x => `<div class="hash-entry">${esc(x)}</div>`).join('')}</div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'window') body = `<div class="tokens">${tokenMarkup(v.tokens, -1, v.left, v.right)}</div><div class="state-strip"><span class="state-chip">l = ${v.left}</span><span class="state-chip">r = ${v.right}</span>${(v.entries||[]).map(x => `<span class="state-chip">${esc(x)}</span>`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'linked' || v.kind === 'cycle') { const result = v.result || []; body = `<div class="linked-layout"><div class="linked-line"><span class="linked-label">输入链</span>${(v.nodes||[]).map((x,i)=>`<span class="linked-node ${i===v.nodes.indexOf(v.pointers?.left)||i===v.nodes.indexOf(v.pointers?.slow)?'focus':''}"><span class="node-tags">${v.pointers?.left===x?'l1 ':''}${v.pointers?.right===x?'l2 ':''}${v.pointers?.slow===x?'slow ':''}${v.pointers?.fast===x?'fast':''}</span>${esc(x)}</span>${i<v.nodes.length-1?'<span class="arrow">→</span>':''}`).join('')}</div>${v.kind==='cycle'?`<div class="cycle-ring"><div class="pointer-box">${Object.entries(v.pointers||{}).map(([k,x])=>`<span class="pointer-pill">${esc(k)} = ${esc(x)}</span>`).join('')}</div></div>`:`<div class="linked-line"><span class="linked-label">结果链</span>${result.map((x,i)=>`<span class="linked-node result">${esc(x)}</span>${i<result.length-1?'<span class="arrow">→</span>':''}`).join('')}</div><div class="pointer-box">${Object.entries(v.pointers||{}).map(([k,x])=>`<span class="pointer-pill">${esc(k)} = ${esc(x)}</span>`).join('')}</div>`}<p class="micro-note">${esc(v.note)}</p></div>`; }
    else if (v.kind === 'stack') body = `<div class="stack-layout"><div><div class="box-title">输入 / 当前游标</div><div class="tokens">${tokenMarkup(v.tokens, v.active)}</div></div><div class="stack-box"><div class="box-title">栈顶 ↑</div>${(v.stack||[]).slice().reverse().map((x,i)=>`<div class="stack-item ${i===0?'top':''}">${esc(x)}</div>`).join('') || '<div class="stack-item">空</div>'}</div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'grid') body = `<div class="grid-layout">${(v.cells||[]).map((x,i)=>`<span class="grid-cell ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div>${chips((v.queue||[]).length ? ['queue = '+v.queue.join(' → '),'minute 按层推进'] : ['visited 标记','每块只计数一次'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'tree') body = `<div class="tree-layout"><div class="tree-root">${esc(v.root)}</div><div class="tree-branches"><div class="tree-child">${esc(v.children[0])}</div><div class="tree-child">${esc(v.children[1])}</div></div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'graph') body = `<div class="graph-layout">${(v.nodes||[]).map((x,i)=>`<div class="graph-node ${i===v.active?'active':''}">${esc(x)}<br><small>${v.queue?.includes(x)?'入队':'待处理'}</small></div>`).join('')}</div>${chips(['queue = ['+(v.queue||[]).join(', ')+']','入度为 0 → 可处理'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'trie') body = `<div class="trie-path">${(v.letters||[]).map((x,i)=>`<span class="trie-letter ${i===v.active?'active':''}">${esc(x)}</span>`).join('<span class="arrow">→</span>')}</div>${chips(['root = 空前缀','end 标记区分完整单词'])}<p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'dp') body = `<div class="dp-layout">${(v.rows||[]).flat().map((x,i)=>`<span class="dp-cell ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'binary') body = `<div class="tokens">${tokenMarkup(v.tokens,-1)}</div><div class="binary-layout"><div class="binary-line">${v.tokens.map((x,i)=>`<span class="binary-mark ${i===v.lo?'lo':''} ${i===v.mid?'mid':''} ${i===v.hi?'hi':''}" style="left:${v.tokens.length===1?50:(i/(v.tokens.length-1))*100}%">${i===v.lo?'lo ':''}${i===v.mid?'mid ':''}${i===v.hi?'hi':''}</span>`).join('')}</div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'heap') body = `<div class="heap-row">${(v.items||[]).map((x,i)=>`<span class="array-node ${i===v.active?'active':''}">${esc(x)}</span>${i<v.items.length-1?'<span class="arrow">·</span>':''}`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'lru') body = `<div class="lru-line">${(v.items||[]).map((x,i)=>`<span class="lru-node ${i===v.active?'active':''}">${esc(x)}</span>${i<v.items.length-1?'<span class="arrow">↔</span>':''}`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'backtrack') body = `<div class="choice-row"><div class="path-box"><div class="box-title">当前路径</div><div class="tokens">${(v.path||[]).map(x=>`<span class="token active">${esc(x)}</span>`).join('<span class="arrow">→</span>') || '<span class="state-chip">空</span>'}</div></div><div class="path-box"><div class="box-title">本层候选</div><div class="choices">${(v.choices||[]).map((x,i)=>`<span class="choice ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div></div></div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'interval') body = `<div class="interval-row">${(v.items||[]).map((x,i)=>`<span class="array-node ${i===v.active?'active':''}">${esc(x)}</span>`).join('')}</div><p class="micro-note">${esc(v.note)}</p>`;
    else if (v.kind === 'twoptr') body = `<div class="tokens">${tokenMarkup(v.tokens,-1,v.left,v.right)}</div><div class="pointer-box"><span class="pointer-pill">left = ${v.left}</span><span class="pointer-pill">right = ${v.right}</span></div><p class="micro-note">${esc(v.note)}</p>`;
    else body = `<div class="tokens">${tokenMarkup(v.tokens,v.active)}</div><p class="micro-note">${esc(v.note)}</p>`;
    return `<div class="visual-head"><span class="visual-label">${esc(v.label || '状态')}</span><span class="visual-note">${esc(v.note || '')}</span></div>${body}`;
  };
  const steps = data.steps || []; let index = 0; let timer = null;
  const render = () => {
    const s = steps[index] || {phase:'准备',title:'准备开始',body:'',line:1,kind:'info',visual:{kind:'array',label:'状态',tokens:['输入']}};
    $('phase-label').textContent = s.phase; $('lesson-mark').textContent = String(index+1).padStart(2,'0'); $('phase').textContent = s.phase; $('step-number').textContent = `${String(index+1).padStart(2,'0')} / ${steps.length}`; $('lesson-title').textContent = s.title; $('lesson-copy').textContent = data.modeCopy || ''; $('step-title').textContent = s.title; $('step-body').textContent = s.body; $('visual').innerHTML = visual(s.visual); $('counter').textContent = `${index+1} / ${steps.length}`; $('slider').value = String(index); $('slider').max = String(Math.max(steps.length-1,0)); $('prev').disabled = index===0; $('next').disabled = index===steps.length-1; $('play').textContent = timer ? '⏸ 暂停' : '▶ 播放'; $('line-number').textContent = s.line; $('explain-tag').textContent = `${String(s.kind || 'action').toUpperCase()} · LINE ${s.line}`; $('explain-title').textContent = s.title; $('explain-body').textContent = s.body;
    document.querySelectorAll('.code-line').forEach(el => el.classList.toggle('active', Number(el.dataset.line)===Number(s.line))); const active = document.querySelector('.code-line.active'); if (active) active.scrollIntoView({block:'nearest'});
  };
  const stop = () => { if (timer) clearInterval(timer); timer = null; render(); };
  const next = () => { if (index < steps.length-1) { index += 1; render(); } else stop(); };
  $('prev').onclick = () => { stop(); index = Math.max(0,index-1); render(); }; $('next').onclick = () => { stop(); next(); }; $('reset').onclick = () => { stop(); index = 0; render(); }; $('slider').oninput = e => { stop(); index = Number(e.target.value); render(); }; $('play').onclick = () => { if (timer) { stop(); return; } if (index >= steps.length-1) index = 0; timer = setInterval(next, 1250); render(); }; $('theme-toggle').onclick = () => setTheme(themeMode==='auto'?'light':themeMode==='light'?'dark':'auto');
  document.addEventListener('keydown', e => { if (['INPUT','SELECT','BUTTON'].includes(e.target.tagName)) return; if (e.key==='ArrowRight') { e.preventDefault(); stop(); next(); } else if (e.key==='ArrowLeft') { e.preventDefault(); stop(); index=Math.max(0,index-1); render(); } else if (e.key===' ') { e.preventDefault(); $('play').click(); } }); if (media && media.addEventListener) media.addEventListener('change',()=>{ if(themeMode==='auto') setTheme('auto',false); }); setTheme(themeMode,false); render();
  window.__leetcodeAnimation = {data, getState:()=>({id:data.id,index,step:steps[index]}), audit:()=>({id:data.id,stepCount:steps.length,lineRange:steps.every(s=>s.line>=1&&s.line<=codeLines.length),lastPhase:steps.at(-1)?.phase,expected:data.expected})};
})();
'''

# Small post-processing keeps the long, readable raw strings above stable while
# giving the generated pages the last two pilot-level affordances: a speed
# selector and a gentle state-transition cue.  These replacements are applied
# before the standalone CSS/JS assets and all 100 pages are written.
ENGINE_CSS = ENGINE_CSS.replace(
    'grid-template-columns:auto auto auto minmax(90px,1fr) auto auto;',
    'grid-template-columns:auto auto auto minmax(90px,1fr) auto auto auto;'
).replace(
    '.visual-head{',
    '.visual.step-enter{animation:stateIn .25s ease both}@keyframes stateIn{from{opacity:.42;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.visual-head{'
)
ENGINE_JS = ENGINE_JS.replace(
    '<input id="slider" type="range" min="0" max="0" step="1" value="0" aria-label="动画步骤"><span class="counter" id="counter">1 / 1</span><button id="reset" type="button">重置</button>',
    '<input id="slider" type="range" min="0" max="0" step="1" value="0" aria-label="动画步骤"><span class="counter" id="counter">1 / 1</span><select id="speed" aria-label="播放速度"><option value="1600">0.75×</option><option value="1250" selected>1×</option><option value="850">1.5×</option><option value="600">2×</option></select><button id="reset" type="button">重置</button>'
).replace(
    "$('visual').innerHTML = visual(s.visual);",
    "$('visual').classList.remove('step-enter'); void $('visual').offsetWidth; $('visual').innerHTML = visual(s.visual); $('visual').classList.add('step-enter');"
).replace(
    "timer = setInterval(next, 1250);",
    "timer = setInterval(next, Number($('speed').value));"
).replace(
    "$('theme-toggle').onclick = () => setTheme(themeMode==='auto'?'light':themeMode==='light'?'dark':'auto');",
    "$('theme-toggle').onclick = () => setTheme(themeMode==='auto'?'light':themeMode==='light'?'dark':'auto'); $('speed').onchange = () => { if (timer) { stop(); $('play').click(); } };"
).replace(
    "$('slider').value = String(index);",
    "$('slider').value = String(index); $('slider').setAttribute('aria-valuetext', `${s.phase}：${s.title}`);"
)


def write_day_outputs(items: list[dict]) -> None:
    DAY_OUT.mkdir(parents=True, exist_ok=True)
    # Keep the engine source beside the generated pages for inspection and
    # future regeneration, while every HTML remains standalone/offline.
    asset_dir = DAY_OUT / "00-生成器"
    asset_dir.mkdir(parents=True, exist_ok=True)
    (asset_dir / "generate_day_pro.py").write_text(Path(__file__).read_text())
    (asset_dir / "engine.css").write_text(ENGINE_CSS)
    (asset_dir / "engine.js").write_text(ENGINE_JS)

    groups: OrderedDict[str, list[dict]] = OrderedDict()
    for item in items:
        groups.setdefault(item["day"] or "未分组", []).append(item)

    index_lines = [
        "# LeetCode Hot100 动画 · 按学习 Day 分组",
        "",
        "这是新的、按原始题解 Day 1–Day 14 归档的动画入口。每道题包含独立 HTML 和 Obsidian 预览；题面默认折叠，题面区域独立滚动，不抢占动画控制区。",
        "",
        "> 质量基线：LeetCode 21「合并两个有序链表」的逐状态链表样板。其余题目按题型使用对应的数组、窗口、栈、树、DP、二分等状态模型。",
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
            if item["id"] == 21 and PILOT.exists():
                shutil.copy2(PILOT, page_dir / "index.html")
            else:
                payload = json.dumps(build_problem(item), ensure_ascii=False, separators=(",", ":"))
                page = PAGE_TEMPLATE.replace("{id}", str(item["id"])).replace("{title}", item["title"])
                page = page.replace("__CSS__", ENGINE_CSS).replace("__DATA__", escape_json(payload)).replace("__JS__", ENGINE_JS)
                (page_dir / "index.html").write_text(page)
            (page_dir / "Obsidian预览.md").write_text(page_preview(item, page_dir / "index.html"))
            rel = f"{folder}/index.html"
            rel_preview = f"{folder}/Obsidian预览.md"
            day_lines.append(f"| {item['id']} | {item['title']} | {item['difficulty']} | `{MODE_LABELS.get(old.MODES.get(item['id'], 'array'), old.MODES.get(item['id'], 'array'))}` | [{folder}](<{rel}>) | [Obsidian](<{rel_preview}>) |")
        (day_dir / "README.md").write_text("\n".join(day_lines) + "\n")
    (DAY_OUT / "README.md").write_text("\n".join(index_lines) + "\n")


if __name__ == "__main__":
    parsed = old.parse_source()
    write_day_outputs(parsed)
    print(f"generated {len(parsed)} day-organised pages under {DAY_OUT}")
