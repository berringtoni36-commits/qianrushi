"""Problem-specific deterministic traces for the six V2 pilot lessons.

Each builder mirrors the exact YXC control flow. The generated JSON is the
authoritative render input; the browser renderer never executes an algorithm.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any


class Lines:
    def __init__(self, code: str):
        self.lines = code.splitlines()

    def id(self, needle: str, occurrence: int = 1) -> str:
        found = 0
        for index, text in enumerate(self.lines, 1):
            if needle in text:
                found += 1
                if found == occurrence:
                    return f"L{index}"
        raise ValueError(f"代码中找不到第 {occurrence} 个片段: {needle}")


def beat(line_ids: str | list[str], state: dict, caption: str, *emphasis: str) -> dict:
    return {
        "lineIds": [line_ids] if isinstance(line_ids, str) else line_ids,
        "state": deepcopy(state),
        "caption": caption,
        "emphasis": list(emphasis),
    }


def frame(
    frame_id: str,
    phase: str,
    learning: str,
    review: str,
    beats: list[dict],
    duration_ms: int = 1100,
) -> dict:
    return {
        "id": frame_id,
        "phase": phase,
        "durationMs": duration_ms,
        "captions": {"learning": learning, "review": review},
        "beats": beats,
    }


def common_meta(**kwargs: Any) -> dict:
    return {
        "difficulty": kwargs.pop("difficulty"),
        "algorithm": kwargs.pop("algorithm"),
        "sceneKind": kwargs.pop("scene_kind"),
        "input": kwargs.pop("input_data"),
        "expected": kwargs.pop("expected"),
        "exampleText": kwargs.pop("example_text"),
        "expectedText": kwargs.pop("expected_text"),
        "invariant": kwargs.pop("invariant"),
        "aha": kwargs.pop("aha"),
        "time": kwargs.pop("time"),
        "space": kwargs.pop("space"),
        **kwargs,
    }


def build_two_sum(code: str) -> dict:
    line = Lines(code)
    values = [2, 7, 11, 15]

    def state(i: int | None, r: int | None, heap: dict[int, int], **extra: Any) -> dict:
        return {
            "sceneKind": "hash-array",
            "values": values,
            "hash": {str(k): v for k, v in heap.items()},
            "variables": {"target": 9, "i": i, "r": r},
            "active": [] if i is None else [i],
            "compared": extra.get("compared", []),
            "result": extra.get("result", []),
            "formula": extra.get("formula", ""),
            "status": extra.get("status", "ready"),
            "action": extra.get("action", "准备一遍哈希"),
        }

    frames = [
        frame("hash-init", "setup", "先建立空表。它只保存已经走过的位置，因此永远不会把当前元素使用两次。", "heap = {}", [
            beat(line.id("unordered_map<int, int> heap"), state(None, None, {}, action="建立空哈希表"), "建立 heap，尚未保存任何下标。", "heap")
        ]),
        frame("i0-enter", "inspect", "第一次进入循环，当前只观察 nums[0]，表中还没有历史元素。", "i = 0, nums[i] = 2", [
            beat(line.id("for (int i = 0"), state(0, None, {}, action="检查下标 0"), "i 指向数值 2。", "i")
        ]),
        frame("i0-complement", "compare", "目标是 9，所以当前真正要查询的是补数 7，而不是当前值 2。", "r = 9 - 2 = 7", [
            beat(line.id("int r = target - nums[i]"), state(0, 7, {}, formula="r = 9 - 2 = 7", action="计算补数 7"), "算出 r = 7。", "r")
        ]),
        frame("i0-miss", "lookup", "heap 只含历史元素；7 不在表中，当前还不能组成答案。", "heap.count(7) = 0", [
            beat(line.id("if (heap.count(r))"), state(0, 7, {}, formula="heap.count(7) = 0", status="miss", action="查询 7：未找到"), "查询补数 7，结果未命中。", "lookup")
        ]),
        frame("i0-insert", "mutate", "查询必须发生在写入之前。现在把 2 的下标 0 留给后面的元素使用。", "heap[2] = 0", [
            beat(line.id("heap[nums[i]] = i"), state(0, 7, {2: 0}, formula="heap[2] = 0", status="insert", action="写入 2 → 0"), "把当前值 2 和下标 0 写入 heap。", "heap")
        ]),
        frame("invariant-check", "inspect", "此刻不变量成立：heap 中每个下标都严格小于下一轮的 i。", "heap 保存 i 左侧元素", [
            beat(line.id("for (int i = 0"), state(0, 7, {2: 0}, status="settled", action="核对一遍哈希不变量"), "heap 只保存已遍历元素。", "invariant")
        ]),
        frame("i1-enter", "inspect", "进入 i=1，当前值变成 7；此前的 2 已经安全地留在表中。", "i = 1, nums[i] = 7", [
            beat(line.id("for (int i = 0"), state(1, None, {2: 0}, action="检查下标 1"), "i 移到数值 7。", "i")
        ]),
        frame("i1-complement", "compare", "7 距离目标 9 还差 2，恰好对应表中的历史值。", "r = 9 - 7 = 2", [
            beat(line.id("int r = target - nums[i]"), state(1, 2, {2: 0}, formula="r = 9 - 7 = 2", compared=[0, 1], action="计算补数 2"), "算出 r = 2。", "r")
        ]),
        frame("i1-hit", "accept", "补数 2 命中，heap[2] 给出它的下标 0；当前下标是 1。", "heap.count(2) = 1", [
            beat(line.id("if (heap.count(r))"), state(1, 2, {2: 0}, formula="heap.count(2) = 1", compared=[0, 1], status="hit", action="查询 2：命中下标 0"), "查询命中，两个下标已经确定。", "lookup", "result")
        ]),
        frame("pair-proof", "aha", "这正是先查后存的价值：下标 0 一定来自过去，下标 1 一定是当前，两个元素不会重复。", "nums[0] + nums[1] = 9", [
            beat(line.id("if (heap.count(r))"), state(1, 2, {2: 0}, formula="nums[0] + nums[1] = 2 + 7 = 9", compared=[0, 1], result=[0, 1], status="hit", action="确认 2 + 7 = 9"), "确认数值和、下标和不变量同时成立。", "result")
        ], 1400),
        frame("construct-result", "accept", "代码直接构造 {heap[r], i}，顺序就是历史下标在前、当前下标在后。", "{heap[2], 1} = {0, 1}", [
            beat(line.id("return {heap[r], i}"), state(1, 2, {2: 0}, formula="{heap[2], 1} = {0, 1}", result=[0, 1], status="result", action="构造答案 [0, 1]"), "构造返回数组 [0, 1]。", "result")
        ]),
        frame("return", "return", "找到唯一答案后立即返回，不再扫描 11 和 15。", "return [0, 1]", [
            beat(line.id("return {heap[r], i}"), state(1, 2, {2: 0}, formula="return [0, 1]", result=[0, 1], status="return", action="返回 [0, 1]"), "函数返回下标 [0, 1]。", "result")
        ], 1800),
    ]
    return {
        "meta": common_meta(
            difficulty="Easy", algorithm="一遍哈希", scene_kind="hash-array",
            input_data={"nums": values, "target": 9}, expected=[0, 1],
            example_text="nums=[2,7,11,15], target=9", expected_text="下标 [0,1]",
            invariant="heap 只保存当前下标 i 之前的元素", aha="先查询补数，再写入当前元素",
            time="O(n)", space="O(n)",
        ),
        "frames": frames,
    }


def build_trap(code: str) -> dict:
    line = Lines(code)
    height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
    stack: list[int] = []
    water = [0] * len(height)
    res = 0

    def snapshot(i: int | None, last: int, action: str, formula: str = "", compared: list[int] | None = None) -> dict:
        return {
            "sceneKind": "water-stack",
            "values": height,
            "water": water.copy(),
            "stack": stack.copy(),
            "variables": {"i": i, "last": last, "res": res, "top": stack[-1] if stack else None},
            "active": [] if i is None else [i],
            "compared": compared or [],
            "result": [],
            "formula": formula,
            "action": action,
        }

    frames = [
        frame("init", "setup", "栈保存还没有找到右边界的柱子，res 只累计已经被左右边界封住的水层。", "stk = [], res = 0", [
            beat([line.id("stack<int> stk"), line.id("int res = 0")], snapshot(None, 0, "建立空栈，res=0"), "初始化单调栈和答案。", "stack", "res")
        ])
    ]

    for i, current in enumerate(height):
        before = res
        current_beats: list[dict] = []
        last = 0
        current_beats.append(beat(
            line.id("int last = 0"), snapshot(i, last, f"i={i}，本轮 last 从 0 开始"),
            f"扫描高度 {current}，本轮尚未结算任何高度层。", "i", "last"
        ))

        while stack and height[stack[-1]] <= current:
            top = stack[-1]
            current_beats.append(beat(
                line.id("while (stk.size()"), snapshot(i, last, f"{height[top]} ≤ {current}，右边界出现", f"height[{top}] ≤ height[{i}]", [top, i]),
                f"栈顶 {top} 的高度不高于当前柱，开始结算这一层。", "compare"
            ))
            delta = height[top] - last
            width = i - top - 1
            addition = delta * width
            res += addition
            if delta:
                for k in range(top + 1, i):
                    water[k] += delta
            current_beats.append(beat(
                line.id("res += (height[stk.top()] - last)"), snapshot(i, last, f"结算 {addition} 单位水", f"({height[top]}-{last})×({i}-{top}-1)={addition}", [top, i]),
                f"高度层 {last}→{height[top]}，宽度 {width}，res 变为 {res}。", "formula", "res"
            ))
            last = height[top]
            current_beats.append(beat(
                line.id("last = height[stk.top()]"), snapshot(i, last, f"last 更新为 {last}", f"last = height[{top}] = {last}", [top, i]),
                "last 记住刚结算到的高度，避免下一层重复计算。", "last"
            ))
            stack.pop()
            current_beats.append(beat(
                line.id("stk.pop()"), snapshot(i, last, f"弹出下标 {top}", compared=[top, i]),
                f"下标 {top} 的右边界已经确定，移出栈。", "stack"
            ))

        if stack:
            left = stack[-1]
            current_beats.append(beat(
                line.id("while (stk.size()"), snapshot(i, last, f"{height[left]} > {current}，停止弹栈", f"height[{left}] > height[{i}]", [left, i]),
                "新的栈顶更高，while 结束。", "compare"
            ))
            delta = current - last
            width = i - left - 1
            addition = width * delta
            res += addition
            if delta:
                for k in range(left + 1, i):
                    water[k] += delta
            current_beats.append(beat(
                line.id("if (stk.size()) res +="), snapshot(i, last, f"左边界 {left} 再封住 {addition} 单位", f"({i}-{left}-1)×({current}-{last})={addition}", [left, i]),
                f"左边界仍存在，补齐到当前高度 {current}，res={res}。", "formula", "res"
            ))
        else:
            current_beats.append(beat(
                line.id("if (stk.size()) res +="), snapshot(i, last, "栈为空，没有左边界", "stk.empty()", []),
                "栈为空时无法形成凹槽，这一段不再加水。", "boundary"
            ))

        stack.append(i)
        current_beats.append(beat(
            line.id("stk.push(i)"), snapshot(i, last, f"下标 {i} 入栈"),
            f"把当前柱 {i}:{current} 压栈，等待未来右边界。", "stack"
        ))
        gained = res - before
        learning = (
            f"i={i} 的柱高为 {current}。本轮按高度层结算 {gained} 单位，累计 res={res}。"
            if gained
            else f"i={i} 的柱高为 {current}。当前还没有新增可确认的水层，累计 res={res}。"
        )
        frames.append(frame(f"scan-{i}", "mutate" if gained else "inspect", learning, f"i={i}, +{gained}, res={res}", current_beats, 1050 + 180 * min(len(current_beats), 5)))

    final_state = snapshot(len(height) - 1, 0, "扫描完成，返回 6", "return res = 6")
    final_state["result"] = list(range(len(height)))
    frames.append(frame("return", "return", "所有能被左右边界确认的高度层都已累计，最终接水总量为 6。", "return 6", [
        beat(line.id("return res"), final_state, "返回 res = 6。", "result")
    ], 1900))

    return {
        "meta": common_meta(
            difficulty="Hard", algorithm="单调栈按高度层结算", scene_kind="water-stack",
            input_data={"height": height}, expected=6,
            example_text="height=[0,1,0,2,1,0,1,3,2,1,2,1]", expected_text="接水总量 6",
            invariant="栈底到栈顶高度递减；res 只包含已确认右边界的水层",
            aha="弹栈不是按柱计算，而是用 last 把凹槽分层结算",
            time="O(n)", space="O(n)",
        ),
        "frames": frames,
    }


def build_min_window(code: str) -> dict:
    line = Lines(code)
    s, t = "ADOBECODEBANC", "ABC"
    ht: dict[str, int] = {}
    hs: dict[str, int] = {}
    cnt, j, result = 0, 0, ""
    best_range: list[int] = []

    def snapshot(i: int | None, action: str, formula: str = "", compared: list[int] | None = None) -> dict:
        return {
            "sceneKind": "sliding-window",
            "values": list(s),
            "need": dict(sorted(ht.items())),
            "window": dict(sorted(hs.items())),
            "variables": {"i": i, "j": j, "cnt": cnt, "res": result or "∅", "required": len(t)},
            "range": [] if i is None else [j, i],
            "bestRange": best_range.copy(),
            "active": [] if i is None else [i],
            "compared": compared or [],
            "result": best_range.copy(),
            "formula": formula,
            "action": action,
        }

    init_beats = []
    for c in t:
        ht[c] = ht.get(c, 0) + 1
        init_beats.append(beat(
            line.id("for (auto c: t) ht[c]"), snapshot(None, f"记录需求 {c}:{ht[c]}", f"ht['{c}'] = {ht[c]}"),
            f"把字符 {c} 的需求数写入 ht。", "need"
        ))
    frames = [frame(
        "need-table", "setup",
        "先统计 t 的需求。YXC 的 cnt 记录已经满足的字符总数，因此目标值是 t.size()=3。",
        "ht={A:1,B:1,C:1}, cnt=0", init_beats,
    )]

    for i, ch in enumerate(s):
        current_beats: list[dict] = []
        hs[ch] = hs.get(ch, 0) + 1
        current_beats.append(beat(
            line.id("hs[s[i]] ++"), snapshot(i, f"右端纳入 {ch}", f"hs['{ch}'] = {hs[ch]}"),
            f"窗口右端 i={i} 纳入字符 {ch}。", "window", "i"
        ))

        ht.setdefault(ch, 0)
        qualifies = hs[ch] <= ht[ch]
        if qualifies:
            cnt += 1
        current_beats.append(beat(
            line.id("if (hs[s[i]] <= ht[s[i]]) cnt"), snapshot(i, "有效字符，cnt+1" if qualifies else "多余字符，cnt 不变", f"{hs[ch]} ≤ {ht[ch]} → {'true' if qualifies else 'false'}"),
            f"{ch} {'补上了一份真实需求' if qualifies else '超过需求或不在 t 中'}，cnt={cnt}。", "cnt"
        ))

        while True:
            left_ch = s[j]
            ht.setdefault(left_ch, 0)
            surplus = hs.get(left_ch, 0) > ht[left_ch]
            current_beats.append(beat(
                line.id("while (hs[s[j]] > ht[s[j]])"), snapshot(i, f"检查左端 {left_ch}：{'多余' if surplus else '不能删除'}", f"hs['{left_ch}']={hs.get(left_ch, 0)}, ht['{left_ch}']={ht[left_ch]}", [j, i]),
                f"左端字符 {left_ch} {'是多余副本，可以收缩' if surplus else '不是多余副本，收缩停止'}。", "j", "compare"
            ))
            if not surplus:
                break
            hs[left_ch] -= 1
            old_j = j
            j += 1
            current_beats.append(beat(
                line.id("while (hs[s[j]] > ht[s[j]])"), snapshot(i, f"删除多余的 {left_ch}，j→{j}", f"hs['{left_ch}']--, j={j}", [old_j, i]),
                "只删除多余字符，所以 cnt 无需减少。", "window", "j"
            ))

        covered = cnt == len(t)
        current_beats.append(beat(
            line.id("if (cnt == t.size())"), snapshot(i, "窗口已覆盖 t" if covered else "窗口尚未覆盖 t", f"cnt={cnt}, t.size()={len(t)}"),
            f"cnt={cnt}，窗口{'已经' if covered else '尚未'}覆盖 ABC。", "cnt"
        ))
        if covered:
            candidate = s[j:i + 1]
            shorter = not result or len(candidate) < len(result)
            current_beats.append(beat(
                line.id("if (res.empty() || i - j + 1 < res.size())"), snapshot(i, "比较当前窗口与最优答案", f"len('{candidate}')={len(candidate)} {'<' if shorter else '≥'} len(res)"),
                f"候选窗口 {candidate} {'更短' if shorter else '不比当前答案更短'}。", "compare"
            ))
            if shorter:
                result = candidate
                best_range = [j, i]
                current_beats.append(beat(
                    line.id("res = s.substr"), snapshot(i, f"更新 res = {result}", f"res = s.substr({j}, {i-j+1})"),
                    f"记录新的最短覆盖串 {result}。", "result"
                ))

        frames.append(frame(
            f"scan-{i}", "accept" if covered else "inspect",
            f"i={i} 纳入 {ch}。窗口左端最终停在 j={j}，cnt={cnt}，当前最优为 {result or '空'}。",
            f"i={i}, j={j}, cnt={cnt}, res={result or '∅'}",
            current_beats, 1050 + min(len(current_beats), 8) * 140,
        ))

    final = snapshot(len(s) - 1, "扫描完成，返回 BANC", "return res = \"BANC\"")
    frames.append(frame("return", "return", "最终窗口 [9,12] 对应 BANC；它覆盖 A、B、C，且比此前的 ADOBEC 更短。", "return \"BANC\"", [
        beat(line.id("return res"), final, "返回最小覆盖子串 BANC。", "result")
    ], 1900))
    return {
        "meta": common_meta(
            difficulty="Hard", algorithm="滑动窗口 + 双哈希表", scene_kind="sliding-window",
            input_data={"s": s, "t": t}, expected="BANC",
            example_text='s="ADOBECODEBANC", t="ABC"', expected_text='最小覆盖串 "BANC"',
            invariant="收缩只删除 hs[x] > ht[x] 的多余字符，所以 cnt 永远代表仍被窗口满足的需求总数",
            aha="cnt 不按字符种类计数，也不在收缩时减少，因为需要字符从未被删除",
            time="O(n)", space="O(|Σ|)",
        ),
        "frames": frames,
    }


def build_reverse_list(code: str) -> dict:
    line = Lines(code)
    node_ids = [f"n{i}" for i in range(1, 6)]
    values = {f"n{i}": i for i in range(1, 6)}
    next_map: dict[str, str | None] = {f"n{i}": (f"n{i+1}" if i < 5 else None) for i in range(1, 6)}
    pointers: dict[str, str | None] = {"head": "n1", "a": None, "b": None, "c": None}

    def snapshot(action: str, active_edges: list[tuple[str, str]] | None = None) -> dict:
        active_edges = active_edges or []
        edges = []
        for source, target in next_map.items():
            if target is not None:
                edges.append({
                    "from": source,
                    "to": target,
                    "status": "active" if (source, target) in active_edges else "normal",
                })
        return {
            "sceneKind": "linked-list",
            "nodes": [{"id": node_id, "value": values[node_id]} for node_id in node_ids],
            "edges": edges,
            "pointers": deepcopy(pointers),
            "variables": {},
            "active": [p for p in pointers.values() if p],
            "compared": [],
            "result": [],
            "formula": "",
            "action": action,
        }

    frames = [
        frame("non-empty", "inspect", "示例链表非空，所以不会走 return NULL；原始 next 方向仍是 1→2→3→4→5。", "head != NULL", [
            beat(line.id("if (!head) return NULL"), snapshot("检查 head：非空"), "确认进入迭代反转。", "head")
        ]),
    ]
    pointers["a"], pointers["b"] = "n1", "n2"
    frames.append(frame("init-pointers", "setup", "a 指向已处理部分的头，b 指向下一颗待反转节点。", "a=1, b=2", [
        beat(line.id("auto a = head, b = a->next"), snapshot("建立 a=1、b=2"), "初始化两个移动指针。", "a", "b")
    ]))

    iteration = 0
    while pointers["b"] is not None:
        iteration += 1
        b_node = pointers["b"]
        c_node = next_map[b_node]
        pointers["c"] = c_node
        frames.append(frame(
            f"save-{iteration}", "inspect",
            f"第 {iteration} 轮先让 c 保存 b 的原后继。改边之前先留住剩余链，节点才不会丢失。",
            f"c = {values[c_node] if c_node else 'NULL'}",
            [beat(line.id("auto c = b->next"), snapshot(f"c 保存 {values[c_node] if c_node else 'NULL'}"), "先保存原来的 b->next。", "c")],
        ))

        old_a = pointers["a"]
        next_map[b_node] = old_a
        rewiring = [beat(
            line.id("b->next = a"), snapshot(f"把 {values[b_node]} 的 next 改指向 {values[old_a]}", [(b_node, old_a)]),
            f"执行 b->next=a，反转边 {values[b_node]}→{values[old_a]}。", "edge"
        )]
        pointers["a"] = b_node
        rewiring.append(beat(
            line.id("a = b"), snapshot(f"a 移到 {values[b_node]}"),
            "a 跟到新的已反转部分头节点。", "a"
        ))
        pointers["b"] = c_node
        rewiring.append(beat(
            line.id("b = c"), snapshot(f"b 移到 {values[c_node] if c_node else 'NULL'}"),
            "b 接回刚才保存的剩余链。", "b"
        ))
        pointers["c"] = None
        rewiring.append(beat(
            line.id("while (b)"), snapshot("本轮结束，c 离开作用域"),
            "一轮结束；下一轮继续检查 b。", "invariant"
        ))
        frames.append(frame(
            f"rewire-{iteration}", "mutate",
            f"第 {iteration} 轮按固定顺序完成：反转 b 的边，再移动 a，最后移动 b。",
            f"b->next=a; a=b; b=c",
            rewiring, 1800,
        ))

    next_map["n1"] = None
    frames.append(frame("cut-old-head", "aha", "循环中原头节点 1 的旧边一直保留，所以中途会出现局部回环；最后必须显式断开它。", "head->next = NULL", [
        beat(line.id("head->next = NULL"), snapshot("断开原头节点 1 的旧 next"), "把原头节点变成新尾节点。", "edge", "head")
    ], 1600))
    final = snapshot("反转完成，a 指向新头 5")
    final["result"] = node_ids[::-1]
    frames.append(frame("return", "return", "a 始终指向已反转部分的头；循环结束时它就是新链表头 5。", "return a = 5", [
        beat(line.id("return a"), final, "返回 5→4→3→2→1。", "result")
    ], 1900))
    return {
        "meta": common_meta(
            difficulty="Easy", algorithm="迭代指针反转", scene_kind="linked-list",
            input_data={"head": [1, 2, 3, 4, 5]}, expected=[5, 4, 3, 2, 1],
            example_text="head=[1,2,3,4,5]", expected_text="5→4→3→2→1",
            invariant="a 指向已反转部分的头，b 指向下一颗待处理节点",
            aha="先用 c 保存后继，再改 b->next；最后单独断开原 head 的旧边",
            time="O(n)", space="O(1)",
        ),
        "frames": frames,
    }


def build_lru(code: str) -> dict:
    line = Lines(code)
    nodes: dict[str, dict[str, Any]] = {}
    hash_map: dict[int, str] = {}
    variables: dict[str, Any] = {"n": None, "operation": "构造", "p": None, "return": None}

    def add_node(node_id: str, key: int, value: int) -> None:
        nodes[node_id] = {"id": node_id, "key": key, "value": value, "left": None, "right": None}

    def order_from_l() -> list[str]:
        order, seen = [], set()
        current = "L" if "L" in nodes else None
        while current and current not in seen and current in nodes:
            order.append(current)
            seen.add(current)
            current = nodes[current]["right"]
        return order

    def snapshot(action: str, changed: list[str] | None = None) -> dict:
        edges = []
        for node_id, node in nodes.items():
            if node["right"] in nodes:
                edges.append({"from": node_id, "to": node["right"], "kind": "right", "status": "active" if node_id in (changed or []) else "normal"})
            if node["left"] in nodes:
                edges.append({"from": node_id, "to": node["left"], "kind": "left", "status": "active" if node_id in (changed or []) else "normal"})
        return {
            "sceneKind": "lru-cache",
            "nodes": [deepcopy(nodes[k]) for k in sorted(nodes)],
            "edges": edges,
            "order": order_from_l(),
            "hash": {str(key): node_id for key, node_id in sorted(hash_map.items())},
            "variables": deepcopy(variables),
            "active": changed or [],
            "compared": [],
            "result": [],
            "formula": "",
            "action": action,
        }

    def insert_beats(node_id: str, call_line: str) -> list[dict]:
        beats: list[dict] = []
        old_first = nodes["L"]["right"]
        nodes[node_id]["right"] = old_first
        beats.append(beat(line.id("p->right = L->right"), snapshot(f"{node_id}.right = {old_first}", [node_id]), "新节点先记住原来的首节点。", "right"))
        nodes[node_id]["left"] = "L"
        beats.append(beat(line.id("p->left = L"), snapshot(f"{node_id}.left = L", [node_id]), "新节点左侧接到虚拟头 L。", "left"))
        nodes[old_first]["left"] = node_id
        beats.append(beat(line.id("L->right->left = p"), snapshot(f"{old_first}.left = {node_id}", [old_first]), "原首节点的 left 回指新节点。", "left"))
        nodes["L"]["right"] = node_id
        beats.append(beat(line.id("L->right = p"), snapshot(f"L.right = {node_id}", ["L"]), "最后让 L 指向新首节点，插入完成。", "right"))
        return beats

    def remove_beats(node_id: str) -> list[dict]:
        left_id, right_id = nodes[node_id]["left"], nodes[node_id]["right"]
        nodes[right_id]["left"] = left_id
        first = beat(line.id("p->right->left = p->left"), snapshot(f"{right_id}.left = {left_id}", [right_id]), "右邻居越过 p，先接向 p 的左邻居。", "left")
        nodes[left_id]["right"] = right_id
        second = beat(line.id("p->left->right = p->right"), snapshot(f"{left_id}.right = {right_id}", [left_id]), "左邻居再越过 p，主链恢复连通。", "right")
        return [first, second]

    frames: list[dict] = []
    variables["n"] = 2
    frames.append(frame("capacity", "setup", "容量 n=2。哈希表负责定位节点，双向链表负责维护最近使用顺序。", "n = 2", [
        beat(line.id("n = capacity"), snapshot("记录容量 2"), "保存容量上限。", "n")
    ]))
    add_node("L", -1, -1)
    add_node("R", -1, -1)
    frames.append(frame("sentinels", "setup", "L 和 R 是虚拟边界，不存真实缓存数据；它们让插入删除不需要判空。", "new L, new R", [
        beat(line.id("L = new Node"), snapshot("创建虚拟头 L 和虚拟尾 R", ["L", "R"]), "创建两个哨兵节点。", "sentinel")
    ]))
    nodes["L"]["right"] = "R"
    first_link = beat(line.id("L->right = R, R->left = L"), snapshot("L.right = R", ["L"]), "先从 L 指向 R。", "right")
    nodes["R"]["left"] = "L"
    second_link = beat(line.id("L->right = R, R->left = L"), snapshot("R.left = L", ["R"]), "再从 R 回指 L，空链建立完成。", "left")
    frames.append(frame("empty-list", "setup", "空缓存也保持 L⇄R 的完整双向关系。", "L ⇄ R", [first_link, second_link]))

    variables["operation"] = "put(1,1)"
    add_node("k1", 1, 1)
    hash_map[1] = "k1"
    variables["p"] = "k1"
    frames.append(frame("put1-create", "mutate", "key 1 不存在，创建节点并先登记到 hash。此时节点还未接入主链。", "hash[1] = k1", [
        beat([line.id("auto p = new Node(key, value)"), line.id("hash[key] = p")], snapshot("创建 k1，并写入 hash", ["k1"]), "创建缓存节点 (1,1)。", "hash", "k1")
    ]))
    frames.append(frame("put1-insert", "mutate", "insert 的四次指针赋值按固定顺序完成，k1 成为最近使用节点。", "L ⇄ k1 ⇄ R", insert_beats("k1", line.id("insert(p)", 3)), 1900))

    variables["operation"] = "put(2,2)"
    add_node("k2", 2, 2)
    hash_map[2] = "k2"
    variables["p"] = "k2"
    frames.append(frame("put2-create", "mutate", "缓存尚未满，创建 k2 并登记哈希映射。", "hash[2] = k2", [
        beat([line.id("auto p = new Node(key, value)"), line.id("hash[key] = p")], snapshot("创建 k2，并写入 hash", ["k2"]), "创建缓存节点 (2,2)。", "hash", "k2")
    ]))
    frames.append(frame("put2-insert", "mutate", "新插入的 k2 放在 L 后面，因此顺序是最近 k2、其次 k1。", "L ⇄ k2 ⇄ k1 ⇄ R", insert_beats("k2", line.id("insert(p)", 3)), 1900))

    variables["operation"] = "get(1)"
    variables["p"] = "k1"
    frames.append(frame("get1-hit", "accept", "hash 命中 key 1，O(1) 得到节点 k1；访问后必须把它移动到最前。", "p = hash[1]", [
        beat([line.id("if (hash.count(key) == 0)"), line.id("auto p = hash[key]")], snapshot("get(1) 命中 k1", ["k1"]), "哈希表直接定位 k1。", "hash", "k1")
    ]))
    frames.append(frame("get1-remove", "mutate", "移动节点不是复制：先从旧位置摘掉 k1，主链仍保持完整。", "remove(k1)", remove_beats("k1"), 1700))
    frames.append(frame("get1-insert", "aha", "再把同一个 k1 插到 L 后面；哈希指针不需要修改，因为节点地址没有变。", "insert(k1)", insert_beats("k1", line.id("insert(p)", 1)), 2000))
    variables["return"] = 1
    frames.append(frame("get1-return", "accept", "k1 已经成为最近使用节点，get(1) 返回它的值 1。", "return 1", [
        beat(line.id("return p->val"), snapshot("get(1) 返回 1", ["k1"]), "返回命中值 1。", "result")
    ]))

    variables["operation"] = "put(3,3)"
    variables["return"] = None
    variables["p"] = "k2"
    frames.append(frame("put3-full", "compare", "hash.size()==n，容量已满。R->left 指向当前最久未使用的 k2。", "p = R->left = k2", [
        beat([line.id("if (hash.size() == n)"), line.id("auto p = R->left")], snapshot("选择尾部真实节点 k2 淘汰", ["k2", "R"]), "容量满，锁定 LRU 节点 k2。", "compare", "k2")
    ]))
    frames.append(frame("evict-remove", "mutate", "先从双向链表摘掉 k2；这一步只改变链表，还没有删除哈希映射。", "remove(k2)", remove_beats("k2"), 1700))
    del hash_map[2]
    erased = beat(line.id("hash.erase(p->key)"), snapshot("从 hash 删除 key 2", ["k2"]), "同步删除哈希映射。", "hash")
    del nodes["k2"]
    variables["p"] = None
    deleted = beat(line.id("delete p"), snapshot("释放 k2 节点"), "释放被淘汰节点，两个结构重新一致。", "delete")
    frames.append(frame("evict-delete", "mutate", "淘汰必须同时处理 hash 和链表，最后释放节点；少一步都会留下错误状态。", "erase(2); delete k2", [erased, deleted], 1700))

    add_node("k3", 3, 3)
    hash_map[3] = "k3"
    variables["p"] = "k3"
    frames.append(frame("put3-create", "mutate", "腾出容量后创建 k3，并写入 hash[3]。", "hash[3] = k3", [
        beat([line.id("auto p = new Node(key, value)"), line.id("hash[key] = p")], snapshot("创建 k3，并写入 hash", ["k3"]), "创建缓存节点 (3,3)。", "hash", "k3")
    ]))
    frames.append(frame("put3-insert", "mutate", "k3 插到 L 后面，最终最近使用顺序为 3、1。", "L ⇄ k3 ⇄ k1 ⇄ R", insert_beats("k3", line.id("insert(p)", 3)), 1900))

    variables["operation"] = "get(2)"
    variables["p"] = None
    variables["return"] = -1
    final = snapshot("get(2) 未命中，返回 -1")
    final["result"] = ["-1"]
    frames.append(frame("return", "return", "key 2 已在容量淘汰时从链表和 hash 同步删除，因此 get(2) 稳定返回 -1。", "return -1", [
        beat(line.id("if (hash.count(key) == 0) return -1"), final, "哈希表中没有 key 2，返回 -1。", "result")
    ], 1900))
    return {
        "meta": common_meta(
            difficulty="Medium", algorithm="哈希表 + 双向链表", scene_kind="lru-cache",
            input_data={"capacity": 2, "operations": ["put(1,1)", "put(2,2)", "get(1)", "put(3,3)", "get(2)"]},
            expected=[1, -1], example_text="capacity=2; put1, put2, get1, put3, get2", expected_text="get 结果 [1,-1]",
            invariant="hash 中的每个节点都恰好位于 L 与 R 之间；越靠近 L 越新，越靠近 R 越旧",
            aha="访问节点时先 remove 再 insert，同一节点地址移动，hash 无需重建",
            time="get/put 均摊 O(1)", space="O(capacity)",
        ),
        "frames": frames,
    }


def build_coin_change(code: str) -> dict:
    line = Lines(code)
    coins, m, inf = [1, 2, 5], 11, 100000000
    values = [inf] * (m + 1)
    current_v: int | None = None
    current_j: int | None = None

    def snapshot(action: str, formula: str = "", compared: list[int] | None = None) -> dict:
        return {
            "sceneKind": "dp-table",
            "values": values.copy(),
            "variables": {"v": current_v, "j": current_j, "m": m},
            "active": [] if current_j is None else [current_j],
            "compared": compared or [],
            "result": [],
            "formula": formula,
            "action": action,
        }

    frames = [frame("allocate", "setup", "f[j] 表示凑出金额 j 的最少硬币数。先把所有状态设成真正的 YXC 哨兵 1e8。", "f[0..11] = 1e8", [
        beat(line.id("vector<int> f(m + 1, 1e8)"), snapshot("创建 12 格 DP 表，全部为 1e8"), "初始化不可达状态。", "dp")
    ])]
    values[0] = 0
    frames.append(frame("base", "setup", "金额 0 不需要硬币，所以 f[0]=0；所有转移都从已经可达的左侧状态出发。", "f[0] = 0", [
        beat(line.id("f[0] = 0"), snapshot("写入基础状态 f[0]=0", "f[0]=0", [0]), "建立唯一基础状态。", "base")
    ]))

    groups = {
        1: [(1, 4), (5, 8), (9, 11)],
        2: [(2, 4), (5, 8), (9, 11)],
        5: [(5, 7), (8, 11)],
    }
    for coin in coins:
        current_v = coin
        for start, end in groups[coin]:
            group_beats: list[dict] = []
            for j in range(start, end + 1):
                current_j = j
                old = values[j]
                candidate = values[j - coin] + 1
                values[j] = min(old, candidate)
                old_text = "1e8" if old == inf else str(old)
                candidate_text = "1e8+1" if candidate > inf else str(candidate)
                formula = f"f[{j}] = min({old_text}, f[{j-coin}] + 1 = {candidate_text}) = {values[j]}"
                group_beats.append(beat(
                    line.id("f[j] = min(f[j], f[j - v] + 1)"), snapshot(f"用硬币 {coin} 更新金额 {j}", formula, [j - coin, j]),
                    f"比较旧值与使用一枚 {coin} 元硬币的候选值。", "dependency", "formula"
                ))
            frames.append(frame(
                f"coin-{coin}-{start}-{end}", "mutate",
                f"固定硬币 v={coin}，正序更新金额 {start} 到 {end}。正序让同一枚硬币在本轮继续被重复使用。",
                f"v={coin}, j={start}..{end}", group_beats, 1200 + len(group_beats) * 260,
            ))

    current_v, current_j = 5, 11
    check_state = snapshot("检查 f[11] 是否仍为 1e8", f"f[11] = {values[11]} ≠ 1e8", [11])
    frames.append(frame("reachable", "compare", "f[11]=3，不等于 1e8，说明金额 11 可达，不走 return -1。", "f[11] != 1e8", [
        beat(line.id("if (f[m] == 1e8) return -1"), check_state, "确认目标金额可达。", "compare")
    ]))
    final = snapshot("返回 f[11]=3", "return f[11] = 3", [11])
    final["result"] = [11]
    frames.append(frame("return", "return", "最终 f[11]=3，对应 5+5+1；所有候选都经过 min 比较，因此这是最少硬币数。", "return 3", [
        beat(line.id("return f[m]"), final, "返回最少硬币数 3。", "result")
    ], 1900))
    return {
        "meta": common_meta(
            difficulty="Medium", algorithm="完全背包一维 DP", scene_kind="dp-table",
            input_data={"coins": coins, "amount": m}, expected=3,
            example_text="coins=[1,2,5], amount=11", expected_text="最少硬币数 3",
            invariant="处理完当前硬币 v 后，f[j] 是仅使用已处理硬币凑出 j 的最少数量",
            aha="金额 j 正序遍历，使 f[j-v] 可以包含当前硬币，从而表达每种硬币可无限使用",
            time="O(n·m)", space="O(m)",
        ),
        "frames": frames,
    }


BUILDERS = {
    1: build_two_sum,
    42: build_trap,
    76: build_min_window,
    206: build_reverse_list,
    146: build_lru,
    322: build_coin_change,
}


def build_problem_trace(problem_id: int, code: str) -> dict:
    try:
        return BUILDERS[problem_id](code)
    except KeyError as exc:
        raise ValueError(f"没有 LeetCode {problem_id} 的 V2 trace builder") from exc
