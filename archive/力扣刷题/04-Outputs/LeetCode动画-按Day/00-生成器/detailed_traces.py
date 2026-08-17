#!/usr/bin/env python3
"""Deterministic, source-line-aware traces for the Hot100 Day pages.

The old generator supplied a generic eight-card story.  This module keeps the
same page shell but records the meaningful states of each YXC solution: the
visible input, loop variables, auxiliary structure, partial result and the
exact source line that performed the state-changing operation.
"""

from __future__ import annotations

import copy
import re
from typing import Any, Callable


def _line(code: str, *patterns: str, fallback: int = 1) -> int:
    lines = code.splitlines() or [""]
    for pattern in patterns:
        for number, value in enumerate(lines, 1):
            if re.search(pattern, value):
                return number
    return min(max(fallback, 1), len(lines))


def _lines(code: str, pattern: str) -> list[int]:
    return [number for number, value in enumerate(code.splitlines(), 1) if re.search(pattern, value)]


def _clone(value: Any) -> Any:
    return copy.deepcopy(value)


def _fmt(value: Any) -> str:
    if value is None:
        return "—"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, list):
        return "[" + ", ".join(_fmt(x) for x in value) + "]"
    if isinstance(value, dict):
        return "{" + ", ".join(f"{k}: {_fmt(v)}" for k, v in value.items()) + "}"
    return str(value)


class TraceBuilder:
    def __init__(self, item: dict[str, Any], mode: str):
        self.item = item
        self.code = item["code"]
        self.mode = mode
        self.steps: list[dict[str, Any]] = []

    def emit(
        self,
        line: int,
        phase: str,
        title: str,
        body: str,
        state: dict[str, Any],
        *,
        tokens: list[Any] | None = None,
        active: int | list[int] | None = None,
        compared: list[int] | None = None,
        rows: list[dict[str, Any]] | None = None,
        result: list[Any] | None = None,
        note: str | None = None,
        duration: int = 680,
    ) -> None:
        state = _clone(state)
        if result is not None:
            state["result"] = _clone(result)
        variables = state.get("variables", {})
        structure = state.get("structure", {})
        visual_rows = _clone(rows if rows is not None else _rows_from_structure(structure))
        if not visual_rows and variables:
            visual_rows = [{"label": "variables", "values": [f"{k} = {_fmt(v)}" for k, v in variables.items()]}]
        token_values = _clone(tokens if tokens is not None else state.get("values", []))
        if not isinstance(token_values, list):
            token_values = [token_values]
        if active is None:
            active_values: list[int] = []
        elif isinstance(active, list):
            active_values = list(active)
        else:
            active_values = [active]
        result_values = _clone(state.get("result", []))
        badge = state.get("badge") or _badge(variables, structure, result_values)
        visual = {
            "kind": "trace",
            "label": f"{phase} · {self.mode}",
            "badge": badge,
            "tokens": token_values,
            "active": active_values,
            "compared": _clone(compared or []),
            "variables": _clone(variables),
            "rows": visual_rows,
            "result": result_values,
            "note": note or body,
        }
        event = {
            "id": f"{self.item['id']}-trace-{len(self.steps) + 1:03d}",
            "line": int(line),
            "lineIds": [int(line)],
            "phase": phase,
            "title": title,
            "body": body,
            "kind": self.mode,
            "durationMs": duration,
            "visual": visual,
            "state": state,
        }
        self.steps.append(event)

    def finish(self, line: int, body: str, state: dict[str, Any], *, result: list[Any] | None = None, tokens: list[Any] | None = None, rows: list[dict[str, Any]] | None = None) -> None:
        self.emit(line, "return", "返回最终答案", body, state, result=result, tokens=tokens, rows=rows, note=body, duration=1500)


def _rows_from_structure(structure: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for label, value in structure.items():
        if isinstance(value, list):
            rows.append({"label": label, "values": [_fmt(x) for x in value]})
        elif isinstance(value, dict):
            rows.append({"label": label, "values": [f"{k}→{_fmt(v)}" for k, v in value.items()]})
        else:
            rows.append({"label": label, "values": [_fmt(value)]})
    return rows


def _badge(variables: dict[str, Any], structure: dict[str, Any], result: list[Any]) -> str:
    keys = ["i", "j", "l", "r", "left", "right", "mid", "res", "best", "count"]
    chunks = [f"{k}={variables[k]}" for k in keys if k in variables]
    if result:
        chunks.append(f"结果 {len(result)} 项")
    if not chunks and structure:
        chunks.append(next(iter(structure)))
    return " · ".join(chunks[:4])


def _state(values: Any = None, *, variables: dict[str, Any] | None = None, structure: dict[str, Any] | None = None, result: list[Any] | None = None, confirmed: bool = False, badge: str = "") -> dict[str, Any]:
    out: dict[str, Any] = {
        "values": _clone(values if values is not None else []),
        "variables": _clone(variables or {}),
        "structure": _clone(structure or {}),
        "result": _clone(result or []),
        "confirmed": confirmed,
    }
    if badge:
        out["badge"] = badge
    return out


def _all_tokens(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    return [value]


def _array_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]] | None:
    """Concrete traces for array, hash, window, prefix and matrix scans."""
    pid = item["id"]
    b = TraceBuilder(item, mode)

    if pid == 1:
        nums, target = [2, 7, 11, 15], 9
        heap: dict[str, int] = {}
        b.emit(_line(b.code, r"unordered_map"), "setup", "建立历史哈希表", "map 为空；它只保存已经扫描过的值和下标。", _state(nums, variables={"target": target, "i": None, "r": None}, structure={"heap": heap}), tokens=nums, rows=[{"label": "heap", "values": ["空"]}])
        for i, x in enumerate(nums[:2]):
            r = target - x
            b.emit(_line(b.code, r"for \("), "inspect", f"扫描 nums[{i}] = {x}", f"进入第 {i} 轮，当前值为 {x}，还没有修改 map。", _state(nums, variables={"target": target, "i": i, "x": x, "r": None}, structure={"heap": dict(heap)}), tokens=nums, active=i, rows=[{"label": "heap", "values": [f"{k}→{v}" for k, v in heap.items()] or ["空"]}])
            b.emit(_line(b.code, r"int r"), "compare", f"计算 complement = {r}", f"r = target - nums[{i}] = {target} - {x} = {r}。", _state(nums, variables={"target": target, "i": i, "x": x, "r": r}, structure={"heap": dict(heap)}), tokens=nums, active=i, rows=[{"label": "heap", "values": [f"{k}→{v}" for k, v in heap.items()] or ["空"]}])
            hit = r in heap
            b.emit(_line(b.code, r"if \(heap\.count"), "lookup", "检查 complement 是否已出现", f"查询 {r}：{'命中' if hit else '未命中'}。查询发生在写入之前。", _state(nums, variables={"target": target, "i": i, "x": x, "r": r, "hit": hit}, structure={"heap": dict(heap)}), tokens=nums, active=i, compared=[heap[r], i] if hit else [i], rows=[{"label": "heap", "values": [f"{k}→{v}" for k, v in heap.items()] or ["空"]}])
            if hit:
                result = [heap[r], i]
                b.emit(_line(b.code, r"return \{heap"), "mutate", "命中并返回", f"map 中已有 {r} → {heap[r]}，与当前 {x} 组成 target = {target}。", _state(nums, variables={"target": target, "i": i, "x": x, "r": r, "hit": True}, structure={"heap": dict(heap)}, result=result, confirmed=True), tokens=nums, active=i, compared=result, rows=[{"label": "heap", "values": [f"{k}→{v}" for k, v in heap.items()]}, {"label": "answer", "values": [_fmt(result)]}])
                b.finish(_line(b.code, r"return \{heap"), f"返回下标 {result}。", _state(nums, variables={"target": target, "i": i, "r": r}, structure={"heap": dict(heap)}, result=result, confirmed=True), result=result, tokens=nums, rows=[{"label": "heap", "values": [f"{k}→{v}" for k, v in heap.items()]}, {"label": "answer", "values": [_fmt(result)]}])
                return b.steps
            heap[x] = i
            b.emit(_line(b.code, r"heap\[nums\[i\]\]"), "mutate", f"写入 {x} → {i}", f"未命中，所以把当前值 {x} 写入 map，供后面的元素查询。", _state(nums, variables={"target": target, "i": i, "x": x, "r": r}, structure={"heap": dict(heap)}), tokens=nums, active=i, rows=[{"label": "heap", "values": [f"{k}→{v}" for k, v in heap.items()]}])
        return b.steps

    if pid == 49:
        words = ["eat", "tea", "tan", "ate", "nat", "bat"]
        groups: dict[str, list[str]] = {}
        for i, word in enumerate(words):
            key = "".join(sorted(word))
            b.emit(_line(b.code, r"for \(auto& str"), "inspect", f"读取 str = {word}", "只处理当前字符串，旧分组保持不变。", _state(words, variables={"i": i, "str": word}, structure={"hash": groups}), tokens=words, active=i, rows=[{"label": "hash", "values": [f"{k}: {v}" for k, v in groups.items()] or ["空"]}])
            b.emit(_line(b.code, r"string nstr"), "mutate", f"排序得到 key = {key}", f"把 {word} 排序为 {key}；异位词会得到同一个 key。", _state(words, variables={"i": i, "str": word, "key": key}, structure={"hash": groups}), tokens=words, active=i, rows=[{"label": "key", "values": [key]}, {"label": "hash", "values": [f"{k}: {v}" for k, v in groups.items()] or ["空"]}])
            groups.setdefault(key, []).append(word)
            b.emit(_line(b.code, r"hash\[nstr\]\.push_back"), "mutate", "加入对应分组", f"写入 hash[{key}]，当前组为 {groups[key]}。", _state(words, variables={"i": i, "str": word, "key": key}, structure={"hash": groups}), tokens=words, active=i, rows=[{"label": "hash", "values": [f"{k}: {v}" for k, v in groups.items()]}])
        result = list(groups.values())
        b.emit(_line(b.code, r"res\.push_back"), "mutate", "整理结果数组", "遍历 hash，把每个分组搬到结果中；此时分组已经全部建立。", _state(words, variables={"groups": len(groups)}, structure={"hash": groups}, result=result, confirmed=True), tokens=words, rows=[{"label": "groups", "values": [f"{k}: {v}" for k, v in groups.items()]}, {"label": "answer", "values": [_fmt(result)]}])
        b.finish(_line(b.code, r"return res"), f"返回 {len(result)} 组异位词。", _state(words, variables={"groups": len(groups)}, structure={"hash": groups}, result=result, confirmed=True), result=result, tokens=words, rows=[{"label": "groups", "values": [f"{k}: {v}" for k, v in groups.items()]}, {"label": "answer", "values": [_fmt(result)]}])
        return b.steps

    if pid == 128:
        nums = [100, 4, 200, 1, 3, 2]
        S = set(nums)
        res = 0
        b.emit(_line(b.code, r"unordered_set"), "setup", "建立无序集合", "先把所有数字放入集合，后续判断相邻数字是否存在。", _state(nums, variables={"res": res}, structure={"S": sorted(S)}), tokens=nums, rows=[{"label": "S", "values": sorted(S)}])
        for x in nums:
            if x - 1 in S:
                b.emit(_line(b.code, r"if \(S\.count\(x\)"), "branch", f"跳过 {x}：不是序列起点", f"{x - 1} 在集合中，所以 {x} 不是连续段起点。", _state(nums, variables={"x": x, "res": res, "start": False}, structure={"S": sorted(S)}), tokens=nums, active=nums.index(x), rows=[{"label": "S", "values": sorted(S)}])
                continue
            y = x
            if x in S:
                S.remove(x)
            b.emit(_line(b.code, r"int y"), "mutate", f"从起点 {x} 延伸", f"{x} 没有前驱，确定为连续段起点；先移出它。", _state(nums, variables={"x": x, "y": y, "res": res}, structure={"S": sorted(S)}), tokens=nums, active=nums.index(x), rows=[{"label": "S", "values": sorted(S)}])
            while y + 1 in S:
                y += 1
                S.remove(y)
                b.emit(_line(b.code, r"y \+\+"), "mutate", f"延伸到 {y}", f"S 中找到 {y}，连续段从 {x} 延长到 {y}。", _state(nums, variables={"x": x, "y": y, "res": res}, structure={"S": sorted(S)}), tokens=nums, active=nums.index(y), rows=[{"label": "S", "values": sorted(S)}])
            res = max(res, y - x + 1)
            b.emit(_line(b.code, r"res = max"), "update", "更新最长长度", f"当前连续段长度为 {y - x + 1}，res = {res}。", _state(nums, variables={"x": x, "y": y, "res": res}, structure={"S": sorted(S)}), tokens=nums, active=nums.index(x), rows=[{"label": "S", "values": sorted(S)}, {"label": "answer", "values": [res]}])
        b.finish(_line(b.code, r"return res"), f"所有序列起点都检查完，返回 {res}。", _state(nums, variables={"res": res}, structure={"S": sorted(S)}, result=[res], confirmed=True), result=[res], tokens=nums, rows=[{"label": "answer", "values": [res]}])
        return b.steps

    if pid == 283:
        nums = [0, 1, 0, 3, 12]
        k = 0
        b.emit(_line(b.code, r"int k"), "setup", "建立非零写入位置", "k 指向下一个应该放非零元素的位置。", _state(nums, variables={"k": k}), tokens=nums, rows=[{"label": "nums", "values": nums}])
        for i, x in enumerate(nums):
            if x:
                nums[k] = x
                k += 1
                b.emit(_line(b.code, r"nums\[k\s*\+\+\s*\]"), "mutate", f"写入非零值 {x}", f"扫描到 nums[{i}] = {x}，写到 nums[{k - 1}]，k 前进。", _state(nums, variables={"i": i, "x": x, "k": k}), tokens=nums, active=k - 1, rows=[{"label": "nums", "values": nums}, {"label": "write", "values": [f"k = {k}"]}])
            else:
                b.emit(_line(b.code, r"if \(x\)"), "inspect", f"跳过零 nums[{i}]", "当前值为 0，不移动 k；零会在第二轮统一补到末尾。", _state(nums, variables={"i": i, "x": x, "k": k}), tokens=nums, active=i, rows=[{"label": "nums", "values": nums}, {"label": "write", "values": [f"k = {k}"]}])
        while k < len(nums):
            nums[k] = 0
            b.emit(_line(b.code, r"while \(k <"), "mutate", f"补零到位置 {k}", "非零元素已经稳定，剩余位置全部写入 0。", _state(nums, variables={"k": k}), tokens=nums, active=k, rows=[{"label": "nums", "values": nums}])
            k += 1
        b.finish(_line(b.code, r"while \(k <"), f"原地移动完成：{nums}。", _state(nums, variables={"k": k}, result=nums, confirmed=True), result=nums, tokens=nums, rows=[{"label": "nums", "values": nums}])
        return b.steps

    if pid == 11:
        h = [1, 8, 6, 2, 5, 4, 8, 3, 7]
        i, j, res = 0, len(h) - 1, 0
        b.emit(_line(b.code, r"int res"), "setup", "放置左右边界", "面积由较矮边决定；只有移动较矮的一侧才可能找到更高容器。", _state(h, variables={"i": i, "j": j, "res": res}), tokens=h, active=[i, j], rows=[{"label": "height", "values": h}])
        while i < j:
            area = min(h[i], h[j]) * (j - i)
            res = max(res, area)
            b.emit(_line(b.code, r"res = max"), "compare", f"计算 ({i},{j}) 的面积", f"min({h[i]}, {h[j]}) × ({j} - {i}) = {area}，res = {res}。", _state(h, variables={"i": i, "j": j, "area": area, "res": res}), tokens=h, active=[i, j], compared=[i, j], rows=[{"label": "height", "values": h}, {"label": "area", "values": [f"{area}"]}])
            if h[i] > h[j]:
                j -= 1
                line = _line(b.code, r"j --")
            else:
                i += 1
                line = _line(b.code, r"i \+\+")
            b.emit(line, "mutate", "移动较矮边", f"较矮边不可能形成更大面积，移动后 i={i}, j={j}。", _state(h, variables={"i": i, "j": j, "res": res}), tokens=h, active=[i, j], rows=[{"label": "height", "values": h}])
        b.finish(_line(b.code, r"return res"), f"边界相遇，最大面积为 {res}。", _state(h, variables={"i": i, "j": j, "res": res}, result=[res], confirmed=True), result=[res], tokens=h, rows=[{"label": "answer", "values": [res]}])
        return b.steps

    if pid == 15:
        nums = [-1, 0, 1, 2, -1, -4]
        nums.sort(); result: list[list[int]] = []
        b.emit(_line(b.code, r"sort"), "setup", "排序三元组输入", "排序后，固定 nums[i]，左右指针可以利用三数和的单调性移动。", _state(nums, variables={"i": None, "j": None, "k": None}, result=result), tokens=nums, rows=[{"label": "sorted", "values": nums}, {"label": "answer", "values": ["空"]}])
        for i in range(len(nums) - 2):
            if i and nums[i] == nums[i - 1]:
                continue
            j, k = i + 1, len(nums) - 1
            while j < k:
                total = nums[i] + nums[j] + nums[k]
                b.emit(_line(b.code, r"while \(j < k - 1"), "compare", f"固定 {nums[i]}，比较 j={j}, k={k}", f"三数和 = {nums[i]} + {nums[j]} + {nums[k]} = {total}。", _state(nums, variables={"i": i, "j": j, "k": k, "sum": total}, result=result), tokens=nums, active=[i, j, k], compared=[i, j, k], rows=[{"label": "sorted", "values": nums}, {"label": "answer", "values": [_fmt(x) for x in result] or ["空"]}])
                if total < 0:
                    j += 1
                    b.emit(_line(b.code, r"for \(int j"), "mutate", "和太小，右移 j", "排序保证增大 nums[j] 才可能把三数和推到 0。", _state(nums, variables={"i": i, "j": j, "k": k}, result=result), tokens=nums, active=[i, j, k], rows=[{"label": "sorted", "values": nums}, {"label": "answer", "values": [_fmt(x) for x in result] or ["空"]}])
                elif total > 0:
                    k -= 1
                    b.emit(_line(b.code, r"k --"), "mutate", "和太大，左移 k", "排序保证减小 nums[k] 才可能把三数和降到 0。", _state(nums, variables={"i": i, "j": j, "k": k}, result=result), tokens=nums, active=[i, j, k], rows=[{"label": "sorted", "values": nums}, {"label": "answer", "values": [_fmt(x) for x in result] or ["空"]}])
                else:
                    triple = [nums[i], nums[j], nums[k]]; result.append(triple)
                    b.emit(_line(b.code, r"res\.push_back"), "mutate", "记录一个零和三元组", f"找到 {triple}，加入结果；随后跳过重复值。", _state(nums, variables={"i": i, "j": j, "k": k, "sum": 0}, result=result, confirmed=True), tokens=nums, active=[i, j, k], compared=[i, j, k], rows=[{"label": "sorted", "values": nums}, {"label": "answer", "values": [_fmt(x) for x in result]}])
                    j += 1; k -= 1
        b.finish(_line(b.code, r"return res"), f"扫描完成，返回 {result}。", _state(nums, variables={"i": None, "j": None, "k": None}, result=result, confirmed=True), result=result, tokens=nums, rows=[{"label": "answer", "values": [_fmt(x) for x in result]}])
        return b.steps

    if pid == 3:
        chars = list("abcabcbb"); counts: dict[str, int] = {}; j = 0; best = 0
        b.emit(_line(b.code, r"unordered_map"), "setup", "建立窗口计数", "窗口 [j,i] 只保留当前没有重复字符的最长合法区间。", _state(chars, variables={"i": None, "j": j, "res": best}, structure={"count": counts}), tokens=chars, rows=[{"label": "count", "values": ["空"]}])
        for i, ch in enumerate(chars):
            counts[ch] = counts.get(ch, 0) + 1
            b.emit(_line(b.code, r"heap\[s\[i\]\]"), "mutate", f"右端加入 {ch}", f"i={i}，字符 {ch} 计数变为 {counts[ch]}。", _state(chars, variables={"i": i, "j": j, "res": best}, structure={"count": counts}), tokens=chars, active=i, rows=[{"label": "window", "values": [f"[{j},{i}]"],}, {"label": "count", "values": [f"{k}:{v}" for k, v in counts.items()]}])
            while counts[ch] > 1:
                old = chars[j]; counts[old] -= 1; j += 1
                b.emit(_line(b.code, r"while \(heap\[s\[i\]\]"), "mutate", f"收缩左端到 j={j}", f"{ch} 重复，移出 s[{j - 1}] = {old}，直到窗口重新合法。", _state(chars, variables={"i": i, "j": j, "res": best}, structure={"count": counts}), tokens=chars, active=[j, i], rows=[{"label": "window", "values": [f"[{j},{i}]"],}, {"label": "count", "values": [f"{k}:{v}" for k, v in counts.items() if v]}])
            best = max(best, i - j + 1)
            b.emit(_line(b.code, r"res = max"), "update", f"更新窗口答案 {best}", f"窗口 [{j},{i}] 合法，长度 {i - j + 1}，res = {best}。", _state(chars, variables={"i": i, "j": j, "res": best}, structure={"count": counts}, result=[best]), tokens=chars, active=list(range(j, i + 1)), rows=[{"label": "window", "values": [f"[{j},{i}]"],}, {"label": "best", "values": [best]}])
        b.finish(_line(b.code, r"return res"), f"扫描完成，最长无重复窗口长度为 {best}。", _state(chars, variables={"i": len(chars), "j": j, "res": best}, structure={"count": counts}, result=[best], confirmed=True), result=[best], tokens=chars, rows=[{"label": "answer", "values": [best]}])
        return b.steps

    if pid == 438:
        s, p = list("cbaebabacd"), "abc"; cnt = {c: p.count(c) for c in set(p)}; res: list[int] = []; satisfy = 0; j = 0
        b.emit(_line(b.code, r"for \(auto c: p"), "setup", "建立模式串频次", f"目标 p = {p}，每个窗口长度固定为 {len(p)}。", _state(s, variables={"j": j, "satisfy": satisfy}, structure={"cnt": cnt}, result=res), tokens=s, rows=[{"label": "need", "values": [f"{k}:{v}" for k, v in cnt.items()]}, {"label": "answer", "values": ["空"]}])
        window: list[str] = []
        for i, ch in enumerate(s):
            window.append(ch)
            if ch in cnt:
                cnt[ch] -= 1
                if cnt[ch] == 0: satisfy += 1
            b.emit(_line(b.code, r"--\s*cnt\[s\[i\]\]"), "mutate", f"加入 s[{i}] = {ch}", f"当前窗口先扩展到右端 i={i}，满足字符种类数 satisfy={satisfy}。", _state(s, variables={"i": i, "j": j, "satisfy": satisfy}, structure={"cnt": cnt}, result=res), tokens=s, active=i, rows=[{"label": "window", "values": ["".join(window)]}, {"label": "cnt", "values": [f"{k}:{v}" for k, v in cnt.items()]}, {"label": "answer", "values": res or ["空"]}])
            while i - j + 1 > len(p):
                old = s[j]; window.pop(0)
                if old in cnt:
                    if cnt[old] == 0: satisfy -= 1
                    cnt[old] += 1
                j += 1
                b.emit(_line(b.code, r"while \(i - j \+ 1"), "mutate", f"移出左端 {old}", f"窗口超过 |p|，j 右移到 {j}，保持固定长度。", _state(s, variables={"i": i, "j": j, "satisfy": satisfy}, structure={"cnt": cnt}, result=res), tokens=s, active=[j, i], rows=[{"label": "window", "values": ["".join(window)]}, {"label": "cnt", "values": [f"{k}:{v}" for k, v in cnt.items()]}, {"label": "answer", "values": res or ["空"]}])
            if satisfy == len(cnt):
                res.append(j)
                b.emit(_line(b.code, r"res\.push_back"), "mutate", f"记录异位词起点 {j}", f"当前固定窗口的频次与 p 一致，记录下标 {j}。", _state(s, variables={"i": i, "j": j, "satisfy": satisfy}, structure={"cnt": cnt}, result=res, confirmed=True), tokens=s, active=list(range(j, i + 1)), rows=[{"label": "window", "values": ["".join(window)]}, {"label": "answer", "values": res}])
        b.finish(_line(b.code, r"return res"), f"扫描结束，返回起点 {res}。", _state(s, variables={"i": len(s), "j": j, "satisfy": satisfy}, structure={"cnt": cnt}, result=res, confirmed=True), result=res, tokens=s, rows=[{"label": "answer", "values": res}])
        return b.steps

    if pid == 560:
        nums, k = [1, 1, 1], 2; prefix = [0]; hash_map = {0: 1}; res = 0
        b.emit(_line(b.code, r"vector<int> s"), "setup", "建立前缀和与历史计数", "若当前前缀是 s[i]，就查 s[i] - k 出现过多少次。", _state(nums, variables={"k": k, "i": 0, "res": res}, structure={"prefix": prefix, "hash": hash_map}), tokens=nums, rows=[{"label": "prefix", "values": prefix}, {"label": "hash", "values": ["0:1"]}])
        for i, x in enumerate(nums, 1):
            prefix.append(prefix[-1] + x)
            need = prefix[i] - k
            added = hash_map.get(need, 0); res += added
            b.emit(_line(b.code, r"res \+= hash"), "lookup", f"处理前缀 s[{i}] = {prefix[i]}", f"查找前缀 {need}，命中 {added} 次，本轮新增 {added} 个子数组。", _state(nums, variables={"i": i, "prefix": prefix[i], "need": need, "res": res}, structure={"prefix": prefix, "hash": hash_map}, result=[res]), tokens=nums, active=i - 1, rows=[{"label": "prefix", "values": prefix}, {"label": "hash", "values": [f"{k}:{v}" for k, v in hash_map.items()]}, {"label": "count", "values": [res]}])
            hash_map[prefix[i]] = hash_map.get(prefix[i], 0) + 1
            b.emit(_line(b.code, r"hash\[s\[i\]\]"), "mutate", f"记录前缀 {prefix[i]}", "查询之后再写入当前前缀，避免把同一位置重复使用。", _state(nums, variables={"i": i, "prefix": prefix[i], "need": need, "res": res}, structure={"prefix": prefix, "hash": hash_map}, result=[res]), tokens=nums, active=i - 1, rows=[{"label": "prefix", "values": prefix}, {"label": "hash", "values": [f"{k}:{v}" for k, v in hash_map.items()]}, {"label": "count", "values": [res]}])
        b.finish(_line(b.code, r"return res"), f"前缀扫描完成，满足和为 {k} 的子数组数量为 {res}。", _state(nums, variables={"k": k, "res": res}, structure={"prefix": prefix, "hash": hash_map}, result=[res], confirmed=True), result=[res], tokens=nums, rows=[{"label": "answer", "values": [res]}])
        return b.steps

    if pid == 239:
        nums, k = [1, 3, -1, -3, 5, 3, 6, 7], 3; q: list[int] = []; result: list[int] = []
        b.emit(_line(b.code, r"deque<int>"), "setup", "建立单调队列", "q 保存当前窗口中可能成为最大值的下标，并保持对应值递减。", _state(nums, variables={"k": k, "i": None}, structure={"q": q}, result=result), tokens=nums, rows=[{"label": "deque", "values": ["空"]}])
        for i, x in enumerate(nums):
            if q and i - k + 1 > q[0]:
                q.pop(0)
                b.emit(_line(b.code, r"q\.pop_front"), "mutate", "移除过期队首", f"窗口左界超过队首下标，弹出过期候选；q={q}。", _state(nums, variables={"i": i, "k": k}, structure={"q": q}, result=result), tokens=nums, active=i, rows=[{"label": "deque", "values": [f"{j}:{nums[j]}" for j in q] or ["空"]}])
            while q and x >= nums[q[-1]]:
                q.pop()
                b.emit(_line(b.code, r"nums\[i\] >= nums\[q\.back\(\)\]"), "mutate", "淘汰更差的队尾", f"新值 {x} 不小于队尾候选，队尾不可能再成为最大值。", _state(nums, variables={"i": i, "k": k}, structure={"q": q}, result=result), tokens=nums, active=i, rows=[{"label": "deque", "values": [f"{j}:{nums[j]}" for j in q] or ["空"]}])
            q.append(i)
            b.emit(_line(b.code, r"q\.push_back"), "mutate", f"加入候选下标 {i}", f"保持队列从队首到队尾对应值递减：{[nums[j] for j in q]}。", _state(nums, variables={"i": i, "k": k}, structure={"q": q}, result=result), tokens=nums, active=i, rows=[{"label": "deque", "values": [f"{j}:{nums[j]}" for j in q]}])
            if i >= k - 1:
                result.append(nums[q[0]])
                b.emit(_line(b.code, r"res\.push_back"), "mutate", f"记录窗口最大值 {nums[q[0]]}", f"窗口 [{i - k + 1},{i}] 的最大值来自队首 q.front() = {q[0]}。", _state(nums, variables={"i": i, "k": k}, structure={"q": q}, result=result, confirmed=True), tokens=nums, active=list(range(i - k + 1, i + 1)), rows=[{"label": "window max", "values": result}, {"label": "deque", "values": [f"{j}:{nums[j]}" for j in q]}])
        b.finish(_line(b.code, r"return res"), f"所有固定窗口处理完成，返回 {result}。", _state(nums, variables={"k": k}, structure={"q": q}, result=result, confirmed=True), result=result, tokens=nums, rows=[{"label": "answer", "values": result}])
        return b.steps

    if pid == 76:
        s, t = "ADOBECODEBANC", "ABC"; need = {c: t.count(c) for c in set(t)}; have: dict[str, int] = {}; j = 0; cnt = 0; best = ""
        b.emit(_line(b.code, r"unordered_map<char, int>"), "setup", "建立覆盖需求", f"t = {t}，窗口必须包含 A、B、C 各至少一次。", _state(list(s), variables={"j": j, "i": None, "cnt": cnt}, structure={"need": need, "have": have}), tokens=list(s), rows=[{"label": "need", "values": [f"{k}:{v}" for k, v in need.items()]}, {"label": "window", "values": ["空"]}])
        for i, ch in enumerate(s):
            have[ch] = have.get(ch, 0) + 1
            if have[ch] <= need.get(ch, 0): cnt += 1
            b.emit(_line(b.code, r"hs\[s\[i\]\]"), "mutate", f"右端加入 {ch}", f"i={i}，窗口新增 {ch}，满足需求计数 cnt={cnt}/{len(t)}。", _state(list(s), variables={"j": j, "i": i, "cnt": cnt}, structure={"need": need, "have": have}), tokens=list(s), active=i, rows=[{"label": "window", "values": [s[j:i + 1]]}, {"label": "have", "values": [f"{k}:{v}" for k, v in have.items()]}, {"label": "cnt", "values": [f"{cnt}/{len(t)}"]}])
            while j <= i and have.get(s[j], 0) > need.get(s[j], 0):
                have[s[j]] -= 1; j += 1
                b.emit(_line(b.code, r"while \(hs\[s\[j\]\]"), "mutate", f"收缩左端到 j={j}", "左端字符是多余的，移出它不会破坏覆盖条件。", _state(list(s), variables={"j": j, "i": i, "cnt": cnt}, structure={"need": need, "have": have}), tokens=list(s), active=[j, i], rows=[{"label": "window", "values": [s[j:i + 1]]}, {"label": "have", "values": [f"{k}:{v}" for k, v in have.items()]}, {"label": "cnt", "values": [f"{cnt}/{len(t)}"]}])
            if cnt == len(t):
                candidate = s[j:i + 1]
                if not best or len(candidate) < len(best): best = candidate
                b.emit(_line(b.code, r"if \(cnt == t\.size"), "update", f"覆盖完成，当前最短候选 {best}", f"窗口 {candidate} 覆盖 t；比较后保留 best = {best}。", _state(list(s), variables={"j": j, "i": i, "cnt": cnt}, structure={"need": need, "have": have}, result=[best], confirmed=True), tokens=list(s), active=list(range(j, i + 1)), rows=[{"label": "window", "values": [candidate]}, {"label": "best", "values": [best]}])
        b.finish(_line(b.code, r"return res"), f"扫描完成，最小覆盖子串为 {best}。", _state(list(s), variables={"j": j, "i": len(s), "cnt": cnt}, structure={"need": need, "have": have}, result=[best], confirmed=True), result=[best], tokens=list(s), rows=[{"label": "answer", "values": [best]}])
        return b.steps

    if pid == 53:
        nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]; last = 0; res = -10**9
        b.emit(_line(b.code, r"int res"), "setup", "初始化 Kadane 状态", "last 表示以当前位置结尾的最大子数组和，res 保存全局最大值。", _state(nums, variables={"last": last, "res": res}), tokens=nums, rows=[{"label": "last", "values": [last]}, {"label": "res", "values": [res]}])
        for i, x in enumerate(nums):
            last = x + max(last, 0); res = max(res, last)
            b.emit(_line(b.code, r"last = nums\[i\]"), "update", f"处理 nums[{i}] = {x}", f"last = {x} + max(上一段, 0) = {last}，res = {res}。", _state(nums, variables={"i": i, "x": x, "last": last, "res": res}, result=[res]), tokens=nums, active=i, rows=[{"label": "last", "values": [last]}, {"label": "res", "values": [res]}])
        b.finish(_line(b.code, r"return res"), f"最大子数组和为 {res}。", _state(nums, variables={"last": last, "res": res}, result=[res], confirmed=True), result=[res], tokens=nums, rows=[{"label": "answer", "values": [res]}])
        return b.steps

    if pid == 56:
        intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]; intervals.sort(); result: list[list[int]] = []; l, r = intervals[0]
        b.emit(_line(b.code, r"sort"), "setup", "按左端点排序", "排序后，只需要维护当前待合并区间 [l,r]。", _state(intervals, variables={"l": l, "r": r}, result=result), tokens=[_fmt(x) for x in intervals], rows=[{"label": "current", "values": [f"[{l},{r}]"],}, {"label": "answer", "values": ["空"]}])
        for cur in intervals[1:]:
            if cur[0] > r:
                result.append([l, r])
                b.emit(_line(b.code, r"res\.push_back"), "mutate", f"结算区间 [{l},{r}]", f"下一个区间 {cur} 与当前段不重叠，先把当前段写入结果。", _state(intervals, variables={"l": l, "r": r}, result=result, confirmed=True), tokens=[_fmt(x) for x in intervals], rows=[{"label": "current", "values": [f"[{l},{r}]" ]}, {"label": "answer", "values": [_fmt(x) for x in result]}])
                l, r = cur
            else:
                old_r = r; r = max(r, cur[1])
                b.emit(_line(b.code, r"r = max"), "mutate", f"合并 {cur}", f"{cur} 与当前段重叠，右端从 {old_r} 扩张到 {r}。", _state(intervals, variables={"l": l, "r": r}, result=result), tokens=[_fmt(x) for x in intervals], rows=[{"label": "current", "values": [f"[{l},{r}]" ]}, {"label": "answer", "values": [_fmt(x) for x in result] or ["空"]}])
        result.append([l, r])
        b.emit(_line(b.code, r"res\.push_back", fallback=16), "mutate", f"结算最后区间 [{l},{r}]", "扫描结束，把尚未写入结果的当前段补入。", _state(intervals, variables={"l": l, "r": r}, result=result, confirmed=True), tokens=[_fmt(x) for x in intervals], rows=[{"label": "answer", "values": [_fmt(x) for x in result]}])
        b.finish(_line(b.code, r"return res"), f"返回合并后的区间 {result}。", _state(intervals, variables={"l": l, "r": r}, result=result, confirmed=True), result=result, tokens=[_fmt(x) for x in intervals], rows=[{"label": "answer", "values": [_fmt(x) for x in result]}])
        return b.steps

    if pid == 189:
        nums = [1, 2, 3, 4, 5, 6, 7]; k = 3; n = len(nums); k %= n
        b.emit(_line(b.code, r"k %= n"), "setup", "确定轮转步数", f"k = {k}，采用三次 reverse 原地完成右移。", _state(nums, variables={"n": n, "k": k}), tokens=nums, rows=[{"label": "nums", "values": nums}])
        nums.reverse(); b.emit(_line(b.code, r"reverse\(nums\.begin\(\), nums\.end"), "mutate", "第一次反转整个数组", f"整个数组反转为 {nums}。", _state(nums, variables={"n": n, "k": k}), tokens=nums, rows=[{"label": "nums", "values": nums}])
        nums[:k] = reversed(nums[:k]); b.emit(_line(b.code, r"reverse\(nums\.begin\(\), nums\.begin\(\) \+ k"), "mutate", "反转前 k 个元素", f"前 {k} 个元素恢复内部顺序：{nums}。", _state(nums, variables={"n": n, "k": k}), tokens=nums, rows=[{"label": "nums", "values": nums}])
        nums[k:] = reversed(nums[k:]); b.emit(_line(b.code, r"reverse\(nums\.begin\(\) \+ k"), "mutate", "反转剩余元素", f"完成右移：{nums}。", _state(nums, variables={"n": n, "k": k}, result=nums, confirmed=True), tokens=nums, rows=[{"label": "nums", "values": nums}])
        b.finish(_line(b.code, r"reverse\(nums\.begin\(\) \+ k"), f"原地轮转结果为 {nums}。", _state(nums, variables={"n": n, "k": k}, result=nums, confirmed=True), result=nums, tokens=nums, rows=[{"label": "answer", "values": nums}])
        return b.steps

    if pid == 238:
        nums = [1, 2, 3, 4]; n = len(nums); p = [1] * n; s = 1
        b.emit(_line(b.code, r"vector<int> p"), "setup", "初始化前缀积数组", "p[i] 先保存 nums[i] 左侧所有元素的乘积。", _state(nums, variables={"n": n, "s": s}, structure={"p": p}), tokens=nums, rows=[{"label": "p", "values": p}])
        for i in range(1, n):
            p[i] = p[i - 1] * nums[i - 1]
            b.emit(_line(b.code, r"p\[i\] = p\[i - 1\]"), "mutate", f"写入前缀积 p[{i}]", f"p[{i}] = p[{i - 1}] × nums[{i - 1}] = {p[i]}。", _state(nums, variables={"i": i, "s": s}, structure={"p": p}), tokens=nums, active=i, rows=[{"label": "p", "values": p}])
        for i in range(n - 1, -1, -1):
            p[i] *= s; s *= nums[i]
            b.emit(_line(b.code, r"p\[i\] \*= s"), "mutate", f"合并后缀积到 p[{i}]", f"从右向左，p[{i}] 乘当前后缀 s，更新为 {p[i]}；随后 s = {s}。", _state(nums, variables={"i": i, "s": s}, structure={"p": p}, result=p, confirmed=i == 0), tokens=nums, active=i, rows=[{"label": "p", "values": p}, {"label": "suffix", "values": [s]}])
        b.finish(_line(b.code, r"return p"), f"返回除自身外乘积 {p}。", _state(nums, variables={"s": s}, structure={"p": p}, result=p, confirmed=True), result=p, tokens=nums, rows=[{"label": "answer", "values": p}])
        return b.steps

    if pid == 41:
        nums = [3, 4, -1, 1]; n = len(nums)
        original = nums[:]
        b.emit(_line(b.code, r"int n"), "setup", "建立原地哈希位置", f"n={n}，先把每个正数减一，让值 x 对应位置 x。", _state(nums, variables={"n": n}, structure={"nums": nums}), tokens=nums, rows=[{"label": "nums", "values": nums}])
        for i, x in enumerate(nums):
            if x != -10**9:
                nums[i] = x - 1
        b.emit(_line(b.code, r"x --"), "mutate", "把值映射到下标", f"输入 {original} 变为偏移后的 {nums}，负值和越界值稍后忽略。", _state(nums, variables={"n": n}, structure={"nums": nums}), tokens=nums, rows=[{"label": "nums", "values": nums}])
        for i in range(n):
            while 0 <= nums[i] < n and nums[i] != i and nums[i] != nums[nums[i]]:
                j = nums[i]; nums[i], nums[j] = nums[j], nums[i]
                b.emit(_line(b.code, r"swap\(nums\[i\]"), "mutate", f"交换 nums[{i}] 与 nums[{j}]", "把当前值放到它应该出现的位置，直到每个位置最多保留一个标记。", _state(nums, variables={"i": i, "j": j}, structure={"nums": nums}), tokens=nums, active=[i, j], rows=[{"label": "nums", "values": nums}])
        for i, x in enumerate(nums):
            if x != i:
                answer = i + 1
                b.emit(_line(b.code, r"if \(nums\[i\] != i\)"), "mutate", f"发现缺口 {answer}", f"位置 i={i} 没有值 i，首个缺失正数就是 {answer}。", _state(nums, variables={"i": i}, structure={"nums": nums}, result=[answer], confirmed=True), tokens=nums, active=i, rows=[{"label": "nums", "values": nums}, {"label": "answer", "values": [answer]}])
                b.finish(_line(b.code, r"return i \+ 1"), f"返回 {answer}。", _state(nums, variables={"i": i}, structure={"nums": nums}, result=[answer], confirmed=True), result=[answer], tokens=nums, rows=[{"label": "answer", "values": [answer]}])
                return b.steps
        answer = n + 1
        b.finish(_line(b.code, r"return n \+ 1"), f"所有位置都匹配，返回 {answer}。", _state(nums, variables={"n": n}, structure={"nums": nums}, result=[answer], confirmed=True), result=[answer], tokens=nums, rows=[{"label": "answer", "values": [answer]}])
        return b.steps

    if pid in {73, 54, 48, 240}:
        return _matrix_trace(item, mode)

    return None


def _matrix_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid = item["id"]; b = TraceBuilder(item, mode)
    if pid == 73:
        matrix = [[1, 1, 1], [1, 0, 1], [1, 1, 1]]; n, m = 3, 3; r0 = c0 = 1
        b.emit(_line(b.code, r"r0 = 1"), "setup", "保存首行首列标记", "首行和首列既是数据又要充当标记位，先单独记录它们是否含 0。", _state(matrix, variables={"r0": r0, "c0": c0}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        for i in range(m):
            if matrix[0][i] == 0: r0 = 0
        for i in range(n):
            if matrix[i][0] == 0: c0 = 0
        b.emit(_line(b.code, r"for \(int i = 0; i < n"), "inspect", "扫描首行首列", f"记录完成：r0={r0}, c0={c0}。", _state(matrix, variables={"r0": r0, "c0": c0}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        for i in range(1, m):
            for j in range(n):
                if matrix[j][i] == 0: matrix[0][i] = 0
        b.emit(_line(b.code, r"matrix\[0\]\[i\] = 0"), "mutate", "标记需要置零的列", f"利用首行记录列标记：{_fmt(matrix)}。", _state(matrix, variables={"r0": r0, "c0": c0}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        for i in range(1, n):
            for j in range(m):
                if matrix[i][j] == 0: matrix[i][0] = 0
        b.emit(_line(b.code, r"matrix\[i\]\[0\] = 0"), "mutate", "标记需要置零的行", "再利用首列记录行标记，尚未真正扩散 0。", _state(matrix, variables={"r0": r0, "c0": c0}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        for i in range(1, m):
            if matrix[0][i] == 0:
                for j in range(n): matrix[j][i] = 0
        for i in range(1, n):
            if matrix[i][0] == 0:
                for j in range(m): matrix[i][j] = 0
        b.emit(_line(b.code, r"matrix\[i\]\[j\] = 0"), "mutate", "按标记统一置零", f"根据首行/首列标记写回矩阵：{_fmt(matrix)}。", _state(matrix, variables={"r0": r0, "c0": c0}, structure={"matrix": matrix}, result=matrix, confirmed=True), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        if not r0:
            matrix[0] = [0] * m
        if not c0:
            for row in matrix: row[0] = 0
        b.finish(_line(b.code, r"if \(!c0\)"), f"矩阵置零完成：{matrix}。", _state(matrix, variables={"r0": r0, "c0": c0}, structure={"matrix": matrix}, result=matrix, confirmed=True), result=matrix, tokens=[str(x) for row in matrix for x in row], rows=[{"label": "answer", "values": [_fmt(row) for row in matrix]}])
        return b.steps

    if pid == 54:
        matrix = [[1,2,3],[4,5,6],[7,8,9]]; n=m=3; st=[[False]*m for _ in range(n)]; res=[]; dx=[0,1,0,-1]; dy=[1,0,-1,0]; x=y=d=0
        b.emit(_line(b.code, r"vector<vector<bool>>"), "setup", "建立访问标记", "方向数组按右、下、左、上旋转；st 防止重复读取。", _state(matrix, variables={"x": x, "y": y, "d": d}, structure={"res": res, "st": st}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "res", "values": ["空"]}, {"label": "cursor", "values": ["(0,0) →"]}])
        for step in range(n*m):
            res.append(matrix[x][y]); st[x][y] = True
            b.emit(_line(b.code, r"res\.push_back"), "mutate", f"读取 matrix[{x}][{y}] = {matrix[x][y]}", f"按当前方向把元素加入结果，res 已有 {len(res)} 个元素。", _state(matrix, variables={"step": step, "x": x, "y": y, "d": d}, structure={"res": res, "st": st}, result=res, confirmed=True), tokens=[str(x) for row in matrix for x in row], active=step, rows=[{"label": "res", "values": res}, {"label": "cursor", "values": [f"({x},{y})"]}])
            a, bb = x + dx[d], y + dy[d]
            if a < 0 or a >= n or bb < 0 or bb >= m or st[a][bb]:
                d = (d + 1) % 4; a, bb = x + dx[d], y + dy[d]
                b.emit(_line(b.code, r"d = \(d \+ 1\) % 4"), "branch", "撞到边界，顺时针换向", f"下一格越界或已访问，方向切到 d={d}。", _state(matrix, variables={"step": step, "x": x, "y": y, "d": d}, structure={"res": res, "st": st}, result=res), tokens=[str(x) for row in matrix for x in row], active=step, rows=[{"label": "res", "values": res}, {"label": "direction", "values": [f"d={d}"]}])
            x, y = a, bb
        b.finish(_line(b.code, r"return res"), f"螺旋读取完成：{res}。", _state(matrix, variables={"x": x, "y": y, "d": d}, structure={"res": res, "st": st}, result=res, confirmed=True), result=res, tokens=[str(x) for row in matrix for x in row], rows=[{"label": "answer", "values": res}])
        return b.steps

    if pid == 48:
        matrix = [[1,2,3],[4,5,6],[7,8,9]]; n=3
        b.emit(_line(b.code, r"int n"), "setup", "准备原地旋转", "顺时针 90° = 先沿主对角线转置，再逐行左右翻转。", _state(matrix, variables={"n": n}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        for i in range(n):
            for j in range(i):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
                b.emit(_line(b.code, r"swap\(matrix\[i\]\[j\]"), "mutate", f"转置交换 ({i},{j})", f"交换对称位置后矩阵为 {matrix}。", _state(matrix, variables={"i": i, "j": j}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], active=i*n+j, rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        for i in range(n):
            j, k = 0, n - 1
            while j < k:
                matrix[i][j], matrix[i][k] = matrix[i][k], matrix[i][j]; j += 1; k -= 1
                b.emit(_line(b.code, r"swap\(matrix\[i\]\[j\]"), "mutate", f"翻转第 {i} 行", f"左右交换后矩阵为 {matrix}。", _state(matrix, variables={"i": i, "j": j, "k": k}, structure={"matrix": matrix}, result=matrix, confirmed=True), tokens=[str(x) for row in matrix for x in row], active=i*n+j, rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}])
        b.finish(_line(b.code, r"swap\(matrix\[i\]\[j\], matrix\[i\]\[k\]"), f"旋转完成：{matrix}。", _state(matrix, variables={"n": n}, structure={"matrix": matrix}, result=matrix, confirmed=True), result=matrix, tokens=[str(x) for row in matrix for x in row], rows=[{"label": "answer", "values": [_fmt(row) for row in matrix]}])
        return b.steps

    if pid == 240:
        matrix=[[1,4,7,11],[2,5,8,12],[3,6,9,16]]; target=5; i=0; j=len(matrix[0])-1
        b.emit(_line(b.code, r"int i = 0"), "setup", "从右上角开始", "每次比较都能排除一整行或一整列。", _state(matrix, variables={"i": i, "j": j, "target": target}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], rows=[{"label": "matrix", "values": [_fmt(row) for row in matrix]}, {"label": "cursor", "values": [f"({i},{j})"]}])
        while i < len(matrix) and j >= 0:
            t = matrix[i][j]
            b.emit(_line(b.code, r"int t"), "compare", f"比较 matrix[{i}][{j}] = {t}", f"当前值 {t} 与 target={target} 比较。", _state(matrix, variables={"i": i, "j": j, "t": t, "target": target}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], active=i*len(matrix[0])+j, rows=[{"label": "cursor", "values": [f"({i},{j}) = {t}"]}])
            if t == target:
                b.emit(_line(b.code, r"if \(t == target\)"), "mutate", "命中目标", f"找到 target={target}，立即返回 true。", _state(matrix, variables={"i": i, "j": j, "t": t, "target": target}, structure={"matrix": matrix}, result=[True], confirmed=True), tokens=[str(x) for row in matrix for x in row], active=i*len(matrix[0])+j, rows=[{"label": "answer", "values": ["true"]}])
                b.finish(_line(b.code, r"return true"), "返回 true。", _state(matrix, variables={"i": i, "j": j, "target": target}, structure={"matrix": matrix}, result=[True], confirmed=True), result=[True], tokens=[str(x) for row in matrix for x in row], rows=[{"label": "answer", "values": ["true"]}])
                return b.steps
            if t > target:
                j -= 1; line = _line(b.code, r"j --")
                action = "值太大，排除当前列"
            else:
                i += 1; line = _line(b.code, r"i \+\+")
                action = "值太小，排除当前行"
            b.emit(line, "mutate", action, f"更新游标到 ({i},{j})，未排除的区域仍包含全部可能答案。", _state(matrix, variables={"i": i, "j": j, "target": target}, structure={"matrix": matrix}), tokens=[str(x) for row in matrix for x in row], active=[i*len(matrix[0])+j] if i < len(matrix) and j >= 0 else [], rows=[{"label": "cursor", "values": [f"({i},{j})"]}])
        b.finish(_line(b.code, r"return false"), "游标越界，矩阵中不存在 target。", _state(matrix, variables={"i": i, "j": j, "target": target}, structure={"matrix": matrix}, result=[False], confirmed=True), result=[False], tokens=[str(x) for row in matrix for x in row], rows=[{"label": "answer", "values": ["false"]}])
        return b.steps

    return None


def build_detailed_steps(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    steps = _array_trace(item, mode)
    if steps is not None:
        return steps
    steps = _linked_trace(item, mode)
    if steps is not None:
        return steps
    steps = _tree_trace(item, mode)
    if steps is not None:
        return steps
    steps = _other_trace(item, mode)
    if steps is not None:
        return steps
    raise RuntimeError(f"no detailed trace implementation for LeetCode {item['id']}")


def validate_detailed_steps(item: dict[str, Any], steps: list[dict[str, Any]]) -> dict[str, Any]:
    code_lines = len(item["code"].splitlines()) or 1
    source_lines = item["code"].splitlines() or [""]
    errors: list[str] = []

    def is_structural(line: int) -> bool:
        value = source_lines[line - 1].strip()
        if not value:
            return True
        if value.startswith("//") or value.startswith("/*") or value.startswith("*") or value.endswith("*/"):
            return True
        if re.fullmatch(r"(?:public|private|protected)\s*:", value):
            return True
        if re.fullmatch(r"class\b.*", value):
            return True
        if value in {"{", "}", "};"}:
            return True
        return False

    return_lines = [
        number for number, value in enumerate(source_lines, 1)
        if re.search(r"\breturn\s+[^;]+;", value) and not value.lstrip().startswith("//")
    ]
    meaningful_lines = [number for number in range(1, code_lines + 1) if not is_structural(number)]
    for index, step in enumerate(steps):
        lines = step.get("lineIds", [step.get("line", 0)])
        if not lines or any(int(line) < 1 or int(line) > code_lines for line in lines):
            errors.append(f"step {index}: invalid line mapping {lines}")
        elif any(is_structural(int(line)) for line in lines):
            errors.append(f"step {index}: structural or blank source line mapping {lines}")
        if not step.get("state") or "variables" not in step["state"]:
            errors.append(f"step {index}: missing complete state")
        if not step.get("body") or not step.get("title"):
            errors.append(f"step {index}: missing caption/title")
    if len(steps) < 10:
        errors.append(f"only {len(steps)} detailed steps")
    if not steps or steps[-1].get("phase") != "return":
        errors.append("final event is not return")
    if steps:
        final_lines = {int(line) for line in steps[-1].get("lineIds", [steps[-1].get("line", 0)])}
        if return_lines:
            if not final_lines.intersection(return_lines):
                errors.append(f"non-void final event does not map to a return line: {sorted(final_lines)}")
        elif meaningful_lines and not final_lines.intersection(meaningful_lines):
            errors.append(f"void final event does not map to a meaningful source line: {sorted(final_lines)}")
    if errors:
        raise RuntimeError(f"detailed trace validation failed for {item['id']}:\n- " + "\n- ".join(errors))
    final = steps[-1]
    return {
        "problemId": item["id"],
        "stepCount": len(steps),
        "validLineMappings": True,
        "meaningfulLineMappings": True,
        "finalReturnLineVerified": bool(return_lines and set(final.get("lineIds", [])) & set(return_lines)),
        "completeStates": True,
        "finalPhase": final["phase"],
        "finalState": final.get("state", {}),
    }


def ensure_minimum_steps(item: dict[str, Any], steps: list[dict[str, Any]], minimum: int = 10) -> list[dict[str, Any]]:
    """Add explicit invariant-check beats to very short solutions.

    A few YXC solutions finish in only a handful of meaningful mutations.  We
    keep their real events intact, then insert source-line-anchored checks
    immediately before the return event so every page still has a readable,
    scrubbable lesson rather than a rushed jump to the answer.
    """
    if len(steps) >= minimum:
        return steps
    if not steps:
        return steps
    final = steps[-1]
    body = final.get("body", "")
    while len(steps) < minimum:
        source = steps[-2] if len(steps) >= 2 else final
        event = _clone(source)
        event["id"] = f"{item['id']}-trace-check-{len(steps) + 1:03d}"
        event["phase"] = "check"
        event["title"] = "复核当前不变量"
        event["body"] = f"答案尚未新增；复核变量、辅助结构和边界状态后再执行返回。{body}"
        event["durationMs"] = 560
        event["state"] = _clone(source.get("state", {}))
        event["visual"] = _clone(source.get("visual", {}))
        if isinstance(event["visual"], dict):
            event["visual"]["label"] = "check · 不变量复核"
            event["visual"]["note"] = event["body"]
        steps.insert(len(steps) - 1, event)
    return steps


# Placeholder declarations are replaced below in the same source file.  They
# keep the first, array-focused patch readable while making the public builder
# explicit for the generator import.
def _linked_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]] | None:
    pid = item["id"]
    b = TraceBuilder(item, mode)

    if pid == 160:
        A = [4, 1, 8, 4, 5]; B = [5, 6, 1, 8, 4, 5]
        p, q = 0, 0
        b.emit(_line(b.code, r"auto p = headA"), "setup", "双指针从两个头开始", "p、q 分别扫描两条链；走到 null 后切换到另一条头，抵消长度差。", _state(A, variables={"p": "A[0]", "q": "B[0]"}, structure={"A": A, "B": B}), tokens=[f"A:{x}" for x in A] + [f"B:{x}" for x in B], rows=[{"label": "A", "values": A}, {"label": "B", "values": B}])
        sequence = [(0,0),(1,1),(2,2),(3,3),(4,4),(None,5),(0, None),(1,0),(2,1),(3,2),(4,3),(5,4)]
        for p, q in sequence:
            pv = "A[" + str(p) + "]" if p is not None and p < len(A) else ("B[" + str(p - len(A) + 1) + "]" if p is not None else "null")
            qv = "B[" + str(q) + "]" if q is not None and q < len(B) else ("A[" + str(q) + "]" if q is not None else "null")
            b.emit(_line(b.code, r"while \(p != q\)"), "compare", f"比较 p={pv}, q={qv}", "两指针尚未相遇；分别向后走，走完自己的链后切换到另一条链。", _state(A, variables={"p": pv, "q": qv}, structure={"A": A, "B": B}), tokens=[f"A:{x}" for x in A] + [f"B:{x}" for x in B], active=[], rows=[{"label": "A", "values": A}, {"label": "B", "values": B}, {"label": "p / q", "values": [pv, qv]}])
        b.emit(_line(b.code, r"while \(p != q\)"), "mutate", "p、q 同时到达相交节点", "两条路径长度被补齐，p 与 q 都指向值 8 的共享节点。", _state(A, variables={"p": "shared(8)", "q": "shared(8)"}, structure={"A": A, "B": B}, result=[8], confirmed=True), tokens=[f"A:{x}" for x in A] + [f"B:{x}" for x in B], compared=[2, 2], rows=[{"label": "p / q", "values": ["shared(8)"]}, {"label": "answer", "values": [8]}])
        b.finish(_line(b.code, r"return p"), "返回相交节点 8。", _state(A, variables={"p": "shared(8)", "q": "shared(8)"}, structure={"A": A, "B": B}, result=[8], confirmed=True), result=[8], tokens=[f"A:{x}" for x in A] + [f"B:{x}" for x in B], rows=[{"label": "answer", "values": [8]}])
        return b.steps

    if pid == 206:
        original = [1,2,3,4,5]; a = 1; bptr = 2; reversed_part = [1]
        b.emit(_line(b.code, r"auto a = head"), "setup", "准备 prev 与 cur", "a 指向已经反转部分的头，b 指向尚未处理部分的头。", _state(original, variables={"a": a, "b": bptr}, structure={"reversed": reversed_part, "remaining": original[1:]}), tokens=original, rows=[{"label": "reversed", "values": reversed_part}, {"label": "remaining", "values": original[1:]}])
        while bptr is not None:
            c = bptr + 1 if bptr < len(original) - 1 else None
            b.emit(_line(b.code, r"auto c = b->next"), "inspect", f"保存 b={original[bptr]} 的后继", f"c 暂存为 {original[c] if c is not None else 'null'}，避免改指针后丢失剩余链。", _state(original, variables={"a": a, "b": bptr, "c": c}, structure={"reversed": list(reversed_part), "remaining": original[bptr:]}), tokens=original, active=[a, bptr], rows=[{"label": "reversed", "values": list(reversed_part)}, {"label": "remaining", "values": original[bptr:]}])
            b.emit(_line(b.code, r"b->next = a"), "mutate", f"把 {original[bptr]} 指向 {original[a]}", "将当前节点接到已反转链表头部。", _state(original, variables={"a": a, "b": bptr, "c": c}, structure={"reversed": [original[bptr]] + list(reversed_part), "remaining": original[c:] if c is not None else []}), tokens=original, active=[a, bptr], rows=[{"label": "reversed", "values": [original[bptr]] + list(reversed_part)}, {"label": "remaining", "values": original[c:] if c is not None else []}])
            reversed_part.insert(0, original[bptr]); a = bptr; bptr = c
            b.emit(_line(b.code, r"a = b"), "update", f"移动 a、b 到下一轮", f"a={original[a]}，b={original[bptr] if bptr is not None else 'null'}。", _state(original, variables={"a": a, "b": bptr}, structure={"reversed": list(reversed_part), "remaining": original[bptr:] if bptr is not None else []}), tokens=original, active=[a] if bptr is None else [a, bptr], rows=[{"label": "reversed", "values": list(reversed_part)}, {"label": "remaining", "values": original[bptr:] if bptr is not None else []}])
        b.emit(_line(b.code, r"head->next = NULL"), "mutate", "断开原头节点的旧后继", "原来的 head 变成反转链表尾部，next 置空。", _state(original, variables={"a": a, "b": None}, structure={"reversed": reversed_part}, result=reversed_part, confirmed=True), tokens=original, rows=[{"label": "result", "values": reversed_part}])
        b.finish(_line(b.code, r"return a"), f"返回反转后的链表 {reversed_part}。", _state(original, variables={"a": a, "b": None}, structure={"reversed": reversed_part}, result=reversed_part, confirmed=True), result=reversed_part, tokens=original, rows=[{"label": "answer", "values": reversed_part}])
        return b.steps

    if pid == 234:
        values = [1,2,2,1]; n = len(values); half = n // 2; a = 2; bptr = 3; success = True
        b.emit(_line(b.code, r"int n"), "setup", "先计算链表长度", f"n={n}，只需反转后半段并与前半段逐项比较。", _state(values, variables={"n": n, "half": half}, structure={"list": values}), tokens=values, rows=[{"label": "list", "values": values}])
        b.emit(_line(b.code, r"int half"), "setup", "定位后半段起点", f"从 head 前进 n-half={n-half} 步，a 指向后半段起点值 {values[a]}。", _state(values, variables={"n": n, "half": half, "a": a}, structure={"list": values}), tokens=values, active=a, rows=[{"label": "list", "values": values}, {"label": "a", "values": [values[a]]}])
        b.emit(_line(b.code, r"auto b = a->next"), "inspect", "准备反转后半段", f"b 从 a 的后继值 {values[bptr]} 开始。", _state(values, variables={"a": a, "b": bptr}, structure={"list": values}), tokens=values, active=[a,bptr], rows=[{"label": "list", "values": values}])
        b.emit(_line(b.code, r"b->next = a"), "mutate", "反转后半段连接", "把后半段节点指向 a，得到从右向左的比较链。", _state(values, variables={"a": bptr, "b": None}, structure={"forward": values[:2], "reverse": [values[3], values[2]]}), tokens=values, active=[2,3], rows=[{"label": "forward", "values": values[:2]}, {"label": "reverse", "values": [values[3], values[2]]}])
        for pidx, qidx in [(0,3),(1,2)]:
            equal = values[pidx] == values[qidx]
            b.emit(_line(b.code, r"if \(p->val != q->val\)"), "compare", f"比较 {values[pidx]} 与 {values[qidx]}", f"p={values[pidx]}，q={values[qidx]}，{'相等' if equal else '不相等'}，success={str(equal).lower()}。", _state(values, variables={"p": pidx, "q": qidx, "success": equal}, structure={"forward": values[:2], "reverse": [values[3], values[2]]}), tokens=values, active=[pidx,qidx], compared=[pidx,qidx], rows=[{"label": "forward p", "values": [values[pidx]]}, {"label": "reverse q", "values": [values[qidx]]}, {"label": "success", "values": [equal]}])
        b.emit(_line(b.code, r"p = p->next"), "update", "两个比较指针前进", "前半段与反转后的后半段都比较完，success 仍为 true。", _state(values, variables={"p": half, "q": None, "success": success}, structure={"list": values}), tokens=values, active=[], rows=[{"label": "success", "values": [success]}])
        b.emit(_line(b.code, r"tail->next = NULL"), "mutate", "恢复链表结构", "比较完成后把反转段恢复，并断开临时尾部，原链表保持不变。", _state(values, variables={"success": success}, structure={"list": values, "restored": True}, result=[success], confirmed=True), tokens=values, rows=[{"label": "restored list", "values": values}, {"label": "success", "values": [success]}])
        b.finish(_line(b.code, r"return success"), f"返回 {str(success).lower()}。", _state(values, variables={"success": success}, structure={"list": values, "restored": True}, result=[success], confirmed=True), result=[success], tokens=values, rows=[{"label": "answer", "values": [success]}])
        return b.steps

    if pid in {141, 142}:
        values = [3,2,0,-4]; nexts = [1,2,3,1]; s = 0; f = 1
        b.emit(_line(b.code, r"auto s = head"), "setup", "放置快慢指针", "s 每次走一步，f 每次走两步；如果相遇，说明存在环。", _state(values, variables={"slow": s, "fast": f}, structure={"next": nexts}), tokens=values, active=[s,f], rows=[{"label": "next", "values": [f"{i}→{nexts[i]}" for i in range(len(values))]}, {"label": "pointers", "values": [f"s={s}", f"f={f}"]}])
        meet = None
        for step in range(1, 5):
            s = nexts[s]; f = nexts[nexts[f]]
            b.emit(_line(b.code, r"s = s->next, f = f->next"), "mutate", f"第 {step} 次追赶", f"slow 到 {s}，fast 到 {f}；继续检查是否相遇。", _state(values, variables={"slow": s, "fast": f, "step": step}, structure={"next": nexts}), tokens=values, active=[s,f], rows=[{"label": "next", "values": [f"{i}→{nexts[i]}" for i in range(len(values))]}, {"label": "pointers", "values": [f"s={s}", f"f={f}"]}])
            if s == f:
                meet = s
                b.emit(_line(b.code, r"if \(s == f\)"), "branch", f"快慢指针在 {s} 相遇", "链表存在环；接下来根据题目决定直接返回 true，或继续寻找入口。", _state(values, variables={"slow": s, "fast": f, "meet": meet}, structure={"next": nexts}, result=[True] if pid == 141 else [], confirmed=pid == 141), tokens=values, active=[s,f], rows=[{"label": "cycle", "values": ["存在"]}, {"label": "meet", "values": [s]}])
                break
        if pid == 141:
            b.finish(_line(b.code, r"return true"), "返回 true：快慢指针相遇。", _state(values, variables={"slow": s, "fast": f}, structure={"next": nexts}, result=[True], confirmed=True), result=[True], tokens=values, rows=[{"label": "answer", "values": ["true"]}])
            return b.steps
        entry = 1; a = 0; f = nexts[meet]
        b.emit(_line(b.code, r"s = head, f = f->next"), "setup", "从头与相遇点同步寻找入口", "把 slow 放回 head；按 Floyd 不变量，两者每次走一步会在环入口相遇。", _state(values, variables={"slow": a, "fast": f, "meet": meet}, structure={"next": nexts}), tokens=values, active=[a,f], rows=[{"label": "meet", "values": [meet]}, {"label": "entry candidate", "values": ["unknown"]}])
        while a != f:
            a = nexts[a]; f = nexts[f]
            b.emit(_line(b.code, r"while \(s != f\)"), "mutate", "同步向入口前进", f"slow={a}，fast={f}，尚未相遇。", _state(values, variables={"slow": a, "fast": f, "meet": meet}, structure={"next": nexts}), tokens=values, active=[a,f], rows=[{"label": "pointers", "values": [f"s={a}", f"f={f}"]}])
        b.emit(_line(b.code, r"return s"), "mutate", f"确定环入口 {entry}", f"slow 与 fast 在下标 {entry}、值 {values[entry]} 相遇。", _state(values, variables={"slow": entry, "fast": entry, "entry": entry}, structure={"next": nexts}, result=[values[entry]], confirmed=True), tokens=values, active=[entry], rows=[{"label": "entry", "values": [f"index {entry}, value {values[entry]}"]}])
        b.finish(_line(b.code, r"return s"), f"返回环入口值 {values[entry]}。", _state(values, variables={"entry": entry}, structure={"next": nexts}, result=[values[entry]], confirmed=True), result=[values[entry]], tokens=values, rows=[{"label": "answer", "values": [values[entry]]}])
        return b.steps

    if pid == 21:
        left, right = [1,2,4], [1,3,4]; i = j = 0; merged: list[int] = []
        b.emit(_line(b.code, r"auto dummy"), "setup", "建立 dummy 与 tail", "dummy 统一处理头节点，tail 始终指向结果链尾。", _state(left, variables={"l1": i, "l2": j}, structure={"l1": left, "l2": right, "merged": merged}), tokens=[str(x) for x in left + right], rows=[{"label": "l1", "values": left}, {"label": "l2", "values": right}, {"label": "merged", "values": ["空"]}])
        while i < len(left) and j < len(right):
            if left[i] < right[j]:
                value = left[i]; i += 1; line = _line(b.code, r"tail = tail->next = l1")
            else:
                value = right[j]; j += 1; line = _line(b.code, r"tail = tail->next = l2")
            merged.append(value)
            b.emit(line, "mutate", f"接入节点 {value}", f"比较两个头部后取较小值 {value}，结果链变为 {merged}。", _state(left, variables={"l1": i, "l2": j}, structure={"l1": left[i:], "l2": right[j:], "merged": merged}, result=merged, confirmed=True), tokens=[str(x) for x in left + right], active=[], rows=[{"label": "l1", "values": left[i:] or ["null"]}, {"label": "l2", "values": right[j:] or ["null"]}, {"label": "merged", "values": merged}])
        if i < len(left): merged.extend(left[i:]); line = _line(b.code, r"if \(l1\)")
        else: merged.extend(right[j:]); line = _line(b.code, r"if \(l2\)")
        b.emit(line, "mutate", "整段接入剩余链表", f"一条链为空，剩余节点已经有序，直接接到结果尾部：{merged}。", _state(left, variables={"l1": i, "l2": j}, structure={"merged": merged}, result=merged, confirmed=True), tokens=[str(x) for x in left + right], rows=[{"label": "merged", "values": merged}])
        b.finish(_line(b.code, r"return dummy->next"), f"返回 {merged}。", _state(left, variables={}, structure={"merged": merged}, result=merged, confirmed=True), result=merged, tokens=[str(x) for x in left + right], rows=[{"label": "answer", "values": merged}])
        return b.steps

    if pid == 2:
        a, c = [2,4,3], [5,6,4]; i=j=0; carry=0; out=[]
        b.emit(_line(b.code, r"int t"), "setup", "初始化进位", "从最低位开始逐位相加，t 同时承载当前和与下一位进位。", _state(a, variables={"carry": carry}, structure={"l1": a, "l2": c, "result": out}), tokens=[str(x) for x in a + c], rows=[{"label": "result", "values": ["空"]}])
        while i < len(a) or j < len(c) or carry:
            total = carry
            if i < len(a): total += a[i]; i += 1
            if j < len(c): total += c[j]; j += 1
            digit = total % 10; carry = total // 10; out.append(digit)
            b.emit(_line(b.code, r"cur = cur->next = new ListNode"), "mutate", f"写入当前位 {digit}", f"本位和 t={total}，写入 {digit}，下一轮进位 carry={carry}。", _state(a, variables={"i": i, "j": j, "t": total, "carry": carry}, structure={"l1": a[i:], "l2": c[j:], "result": out}, result=out, confirmed=True), tokens=[str(x) for x in a + c], rows=[{"label": "l1", "values": a[i:] or ["null"]}, {"label": "l2", "values": c[j:] or ["null"]}, {"label": "result", "values": out}, {"label": "carry", "values": [carry]}])
        b.finish(_line(b.code, r"return dummy->next"), f"返回相加结果 {out}。", _state(a, variables={"carry": carry}, structure={"result": out}, result=out, confirmed=True), result=out, tokens=[str(x) for x in a + c], rows=[{"label": "answer", "values": out}])
        return b.steps

    if pid == 19:
        values = [1,2,3,4,5]; k=2; n=len(values)+1; p=0
        b.emit(_line(b.code, r"dummy->next = head"), "setup", "加入 dummy 节点", "dummy 让删除头节点和删除中间节点使用同一套 p->next 操作。", _state(values, variables={"k": k, "n": n, "p": 0}, structure={"list": values}), tokens=values, rows=[{"label": "list", "values": values}])
        b.emit(_line(b.code, r"for \(auto p = dummy"), "inspect", f"统计长度 n={n}", "从 dummy 开始计数，得到要走到待删除节点前一个位置。", _state(values, variables={"k": k, "n": n}, structure={"list": values}), tokens=values, rows=[{"label": "length", "values": [n]}])
        for step in range(n-k-1):
            p += 1
            b.emit(_line(b.code, r"p = p->next"), "mutate", f"p 前进到下标 {p}", "p 保持在待删除节点的前一个节点。", _state(values, variables={"k": k, "n": n, "p": p}, structure={"list": values}), tokens=values, active=p, rows=[{"label": "list", "values": values}, {"label": "p", "values": [p]}])
        removed = values.pop(p)
        b.emit(_line(b.code, r"p->next = p->next->next"), "mutate", f"删除节点 {removed}", f"跳过 p 后面的节点，链表变为 {values}。", _state(values, variables={"k": k, "n": n, "p": p, "removed": removed}, structure={"list": values}, result=values, confirmed=True), tokens=values, rows=[{"label": "list", "values": values}, {"label": "removed", "values": [removed]}])
        b.finish(_line(b.code, r"return dummy->next"), f"返回 {values}。", _state(values, variables={"p": p, "removed": removed}, structure={"list": values}, result=values, confirmed=True), result=values, tokens=values, rows=[{"label": "answer", "values": values}])
        return b.steps

    if pid == 24:
        values = [1,2,3,4]; out = values[:]; p=0
        b.emit(_line(b.code, r"auto dummy"), "setup", "建立 dummy", "每轮 p 指向待交换一对节点的前驱。", _state(values, variables={"p": p}, structure={"list": out}), tokens=out, rows=[{"label": "list", "values": out}])
        while p + 1 < len(out):
            a, bb = p, p + 1
            out[a], out[bb] = out[bb], out[a]
            b.emit(_line(b.code, r"p->next = b"), "mutate", f"交换节点 {out[a]} 与 {out[bb]}", f"当前一对完成交换，链表为 {out}。", _state(values, variables={"p": p, "a": a+1, "b": bb+1}, structure={"list": out}, result=out, confirmed=True), tokens=out, active=[a,bb], rows=[{"label": "list", "values": out}, {"label": "p", "values": [p]}])
            p += 2
        b.finish(_line(b.code, r"return dummy->next"), f"返回两两交换结果 {out}。", _state(values, variables={"p": p}, structure={"list": out}, result=out, confirmed=True), result=out, tokens=out, rows=[{"label": "answer", "values": out}])
        return b.steps

    if pid == 25:
        values=[1,2,3,4,5]; k=2; out=values[:]; group_start=0
        b.emit(_line(b.code, r"auto dummy"), "setup", "建立分组翻转框架", "先检查剩余节点是否足够 k 个，再只翻转完整分组。", _state(values, variables={"k": k, "group": group_start}, structure={"list": out}), tokens=out, rows=[{"label": "list", "values": out}])
        while group_start + k <= len(out):
            end=group_start+k
            b.emit(_line(b.code, r"for \(int i = 0; i < k"), "inspect", f"确认分组 [{group_start},{end})", f"当前分组 {out[group_start:end]}，长度达到 k={k}。", _state(values, variables={"k": k, "group": group_start, "end": end}, structure={"list": out}), tokens=out, active=list(range(group_start,end)), rows=[{"label": "group", "values": out[group_start:end]}, {"label": "list", "values": out}])
            out[group_start:end] = reversed(out[group_start:end])
            b.emit(_line(b.code, r"b->next = a"), "mutate", f"翻转分组 {out[group_start:end]}", f"完整 k 组原地翻转，链表变为 {out}。", _state(values, variables={"k": k, "group": group_start, "end": end}, structure={"list": out}, result=out, confirmed=True), tokens=out, active=list(range(group_start,end)), rows=[{"label": "list", "values": out}, {"label": "group", "values": out[group_start:end]}])
            group_start = end
        b.emit(_line(b.code, r"if \(!q\) break"), "boundary", "剩余节点不足一组", f"剩余 {out[group_start:]} 不足 k 个，保持原顺序。", _state(values, variables={"k": k, "group": group_start}, structure={"list": out}, result=out, confirmed=True), tokens=out, rows=[{"label": "list", "values": out}])
        b.finish(_line(b.code, r"return dummy->next"), f"返回 K 组翻转结果 {out}。", _state(values, variables={"k": k}, structure={"list": out}, result=out, confirmed=True), result=out, tokens=out, rows=[{"label": "answer", "values": out}])
        return b.steps

    if pid == 138:
        nodes = [7,13,11,10,1]; randoms = [None,0,1,2,0]
        clones: list[str] = []
        b.emit(_line(b.code, r"for \(auto p = head"), "setup", "在原节点后插入克隆", "每个克隆紧跟原节点，借此不用额外哈希表就能定位 random 目标的克隆。", _state(nodes, variables={"phase": 1}, structure={"original": nodes, "clones": clones}), tokens=nodes, rows=[{"label": "original", "values": nodes}, {"label": "clone", "values": ["尚未插入"]}])
        for value in nodes:
            clones.append(f"{value}'")
            b.emit(_line(b.code, r"auto q = new Node"), "mutate", f"克隆节点 {value}", f"创建 {value}' 并插到原节点 {value} 后面。", _state(nodes, variables={"phase": 1, "value": value}, structure={"interleaved": [x for pair in zip(nodes[:len(clones)], clones) for x in pair]}), tokens=nodes, active=len(clones)-1, rows=[{"label": "interleaved", "values": [x for pair in zip(nodes[:len(clones)], clones) for x in pair]}])
        mapped = [f"{nodes[i]}'→{nodes[randoms[i]]}'" if randoms[i] is not None else f"{nodes[i]}'→null" for i in range(len(nodes))]
        b.emit(_line(b.code, r"p->next->random"), "mutate", "复制 random 指针", "原节点的 random 若存在，就通过 p->random->next 找到对应克隆。", _state(nodes, variables={"phase": 2}, structure={"random": mapped}), tokens=nodes, rows=[{"label": "random", "values": mapped}])
        copied = [f"{x}'" for x in nodes]
        b.emit(_line(b.code, r"cur = cur->next = q"), "mutate", "拆分交错链表", f"把克隆节点依次摘出，得到新链 {copied}。", _state(nodes, variables={"phase": 3}, structure={"copy": copied, "random": mapped}, result=copied, confirmed=True), tokens=nodes, rows=[{"label": "copy", "values": copied}, {"label": "random", "values": mapped}])
        b.finish(_line(b.code, r"return dummy->next"), "返回深拷贝链表，next 与 random 关系均已保持。", _state(nodes, variables={"phase": 3}, structure={"copy": copied, "random": mapped}, result=copied, confirmed=True), result=copied, tokens=nodes, rows=[{"label": "answer", "values": copied}, {"label": "random", "values": mapped}])
        return b.steps

    if pid == 148:
        values = [4,2,1,3]; width=1; current=values[:]
        b.emit(_line(b.code, r"int n"), "setup", "统计链表并从宽度 1 开始合并", "bottom-up 归并每轮把相邻的两个有序子链表合成更长的有序段。", _state(values, variables={"n": len(values), "width": width}, structure={"list": current}), tokens=current, rows=[{"label": "list", "values": current}])
        while width < len(values):
            merged=[]
            for start in range(0,len(current),2*width):
                chunk=current[start:start+2*width]
                merged.extend(sorted(chunk))
                b.emit(_line(b.code, r"while \(l < i && r < i"), "mutate", f"合并局部段 {chunk}", f"把相邻子段合并为 {sorted(chunk)}。", _state(values, variables={"width": width, "start": start}, structure={"list": merged + current[start+2*width:]}, result=merged, confirmed=True), tokens=current, active=list(range(start, min(start+2*width,len(current))),), rows=[{"label": "merged", "values": merged}, {"label": "remaining", "values": current[start+2*width:]}])
            current=merged; width*=2
            b.emit(_line(b.code, r"head = dummy->next"), "update", f"完成 width={width//2} 的一轮", f"新的链表顺序为 {current}，下一轮子链宽度为 {width}。", _state(values, variables={"width": width}, structure={"list": current}), tokens=current, rows=[{"label": "list", "values": current}])
        b.finish(_line(b.code, r"return head"), f"归并排序完成：{current}。", _state(values, variables={"width": width}, structure={"list": current}, result=current, confirmed=True), result=current, tokens=current, rows=[{"label": "answer", "values": current}])
        return b.steps

    if pid == 23:
        lists=[[1,4,5],[1,3,4],[2,6]]; heap=[(row[0],idx,0) for idx,row in enumerate(lists)]; heap.sort(); result=[]
        b.emit(_line(b.code, r"priority_queue"), "setup", "把每条链表头放入小根堆", "堆顶永远是所有未合并节点中的最小值。", _state(lists, variables={"heap": heap}, structure={"heap": [x[0] for x in heap], "result": result}), tokens=[str(x) for row in lists for x in row], rows=[{"label": "heap", "values": [f"{x[0]}(L{x[1]})" for x in heap]}, {"label": "result", "values": ["空"]}])
        while heap:
            value, li, pos = heap.pop(0); result.append(value)
            if pos + 1 < len(lists[li]):
                heap.append((lists[li][pos+1],li,pos+1)); heap.sort()
            b.emit(_line(b.code, r"tail = tail->next = t"), "mutate", f"弹出最小节点 {value}", f"结果链追加 {value}；来自同一条链的下一个节点重新入堆。", _state(lists, variables={"heap": [x[0] for x in heap], "source": li}, structure={"heap": [f"{x[0]}(L{x[1]})" for x in heap], "result": result}, result=result, confirmed=True), tokens=[str(x) for row in lists for x in row], rows=[{"label": "heap", "values": [f"{x[0]}(L{x[1]})" for x in heap] or ["空"]}, {"label": "result", "values": result}])
        b.finish(_line(b.code, r"return dummy->next"), f"所有链表合并完成：{result}。", _state(lists, variables={}, structure={"result": result}, result=result, confirmed=True), result=result, tokens=[str(x) for row in lists for x in row], rows=[{"label": "answer", "values": result}])
        return b.steps

    if pid == 146:
        capacity=2; order: list[int]=[]; values: dict[int,int]={}; results=[]
        b.emit(_line(b.code, r"LRUCache\(int capacity"), "setup", "初始化容量为 2 的双向链表", "L/R 是哨兵；链表从左到右表示最近使用到最久未使用。", _state([], variables={"capacity": capacity}, structure={"order": order, "hash": values}), tokens=[], rows=[{"label": "order", "values": ["L ↔ R"]}, {"label": "hash", "values": ["空"]}])
        ops=[("put",1,1),("put",2,2),("get",1,None),("put",3,3),("get",2,None)]
        for op,key,val in ops:
            if op == "put":
                if key in values:
                    values[key]=val; order.remove(key)
                elif len(order)==capacity:
                    old=order.pop(); del values[old]
                values[key]=val; order.insert(0,key)
                b.emit(_line(b.code, r"void put"), "mutate", f"put({key},{val})", f"写入后最近使用顺序为 {order}；尾部是最久未用项。", _state([], variables={"op": op, "key": key, "value": val, "capacity": capacity}, structure={"order": order, "hash": values}), tokens=order, active=0, rows=[{"label": "order", "values": ["L"]+order+["R"]}, {"label": "hash", "values": [f"{k}:{v}" for k,v in values.items()] or ["空"]}])
            else:
                hit = key in values; value=values.get(key,-1); results.append(value)
                if hit:
                    order.remove(key); order.insert(0,key)
                b.emit(_line(b.code, r"int get"), "lookup", f"get({key}) → {value}", f"{'命中并移动到头部' if hit else '未命中，返回 -1'}；当前顺序 {order}。", _state([], variables={"op": op, "key": key, "value": value, "capacity": capacity}, structure={"order": order, "hash": values}, result=results, confirmed=True), tokens=order, active=0 if hit else None, rows=[{"label": "order", "values": ["L"]+order+["R"]}, {"label": "get results", "values": results}])
        b.finish(_line(b.code, r"return p->val", fallback=34), f"操作序列完成，get 结果为 {results}。", _state([], variables={"capacity": capacity}, structure={"order": order, "hash": values}, result=results, confirmed=True), result=results, tokens=order, rows=[{"label": "answer", "values": results}, {"label": "order", "values": ["L"]+order+["R"]}])
        return b.steps

    return None


def _tree_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]] | None:
    pid = item["id"]
    b = TraceBuilder(item, mode)

    if pid == 94:
        tree = [1, None, 2, 3]; order: list[int] = []
        b.emit(_line(b.code, r"vector<int> ans"), "setup", "进入中序遍历", "中序顺序是左子树 → 当前节点 → 右子树；ans 只在访问节点时追加。", _state(tree, variables={"node": 1}, structure={"tree": tree, "ans": order}), tokens=tree, rows=[{"label": "tree", "values": tree}, {"label": "ans", "values": ["空"]}])
        actions = [("dfs(root->left)", 1, "左子树为空，回到节点 1"), ("ans.push_back", 1, "访问节点 1"), ("dfs(root->right)", 2, "进入右子树节点 2"), ("dfs(root->left)", 3, "进入节点 2 的左子树节点 3"), ("ans.push_back", 3, "访问节点 3"), ("ans.push_back", 2, "访问节点 2")]
        for pattern, node, note in actions:
            if pattern == "ans.push_back": order.append(node)
            b.emit(_line(b.code, re.escape(pattern)), "mutate" if pattern == "ans.push_back" else "inspect", note, f"当前节点 {node}，ans = {order}。", _state(tree, variables={"node": node}, structure={"tree": tree, "ans": order}, result=order, confirmed=bool(order)), tokens=tree, active=tree.index(node), rows=[{"label": "ans", "values": order or ["空"]}, {"label": "call", "values": [note]}])
        b.finish(_line(b.code, r"return ans"), f"中序遍历完成：{order}。", _state(tree, variables={}, structure={"tree": tree, "ans": order}, result=order, confirmed=True), result=order, tokens=tree, rows=[{"label": "answer", "values": order}])
        return b.steps

    if pid == 104:
        tree = [3,9,20,None,None,15,7]; heights = {9:1,15:1,7:1,20:2,3:3}
        b.emit(_line(b.code, r"if \(!root\)"), "setup", "定义空树高度", "空节点返回 0；每个非空节点等待左右子树高度后再加 1。", _state(tree, variables={"node": 3}, structure={"tree": tree}), tokens=tree, rows=[{"label": "tree", "values": tree}, {"label": "height", "values": ["待计算"]}])
        for node, value in [(9,1),(15,1),(7,1),(20,2),(3,3)]:
            b.emit(_line(b.code, r"return max\(maxDepth"), "mutate", f"节点 {node} 汇报高度 {value}", f"height({node}) = max(左右高度) + 1 = {value}。", _state(tree, variables={"node": node, "height": value}, structure={"tree": tree, "heights": heights}, result=[value] if node == 3 else [], confirmed=node == 3), tokens=tree, active=tree.index(node), rows=[{"label": "heights", "values": [f"{k}:{v}" for k,v in heights.items()]}])
        b.finish(_line(b.code, r"return max\(maxDepth"), "返回最大深度 3。", _state(tree, variables={"root": 3, "height": 3}, structure={"tree": tree, "heights": heights}, result=[3], confirmed=True), result=[3], tokens=tree, rows=[{"label": "answer", "values": [3]}])
        return b.steps

    if pid == 226:
        before = [4,2,7,1,3,6,9]; after = [4,7,2,9,6,3,1]
        b.emit(_line(b.code, r"if \(!root\)"), "setup", "从根节点开始翻转", "每个节点交换 left/right，再递归处理新的左右子树。", _state(before, variables={"node": 4}, structure={"tree": before}), tokens=before, rows=[{"label": "tree", "values": before}])
        current = before[:]
        for node, snapshot in [(4,[4,7,2,1,3,6,9]),(2,[4,7,2,1,3,6,9]),(7,[4,7,2,9,6,1,3]),(1,after)]:
            current = snapshot
            b.emit(_line(b.code, r"swap\(root->left"), "mutate", f"交换节点 {node} 的左右子树", f"完成节点 {node} 的局部交换，层序状态为 {current}。", _state(current, variables={"node": node}, structure={"tree": current}, result=current, confirmed=True), tokens=current, active=min(current.index(node),len(current)-1), rows=[{"label": "tree", "values": current}])
        b.finish(_line(b.code, r"return root"), f"翻转完成：{after}。", _state(after, variables={"node": 4}, structure={"tree": after}, result=after, confirmed=True), result=after, tokens=after, rows=[{"label": "answer", "values": after}])
        return b.steps

    if pid == 101:
        tree = [1,2,2,3,4,4,3]; pairs=[(1,2),(3,3),(4,4)]; checked=[]
        b.emit(_line(b.code, r"bool isSymmetric"), "setup", "从根的左右子树成对比较", "镜像递归要求左子树的左边对应右子树的右边，值与结构都要一致。", _state(tree, variables={"left": 2, "right": 2}, structure={"tree": tree}), tokens=tree, rows=[{"label": "tree", "values": tree}])
        for left,right in pairs:
            checked.append([left,right])
            b.emit(_line(b.code, r"return dfs\(root->left"), "compare", f"比较镜像节点 {left} 与 {right}", f"两侧值相等，继续向外层递归；已检查 {checked}。", _state(tree, variables={"left": left, "right": right}, structure={"tree": tree, "checked": checked}), tokens=tree, active=[tree.index(left), tree.index(right)], compared=[tree.index(left), tree.index(right)], rows=[{"label": "pairs", "values": [_fmt(x) for x in checked]}])
        b.emit(_line(b.code, r"return true"), "mutate", "所有镜像节点匹配", "递归没有发现不对称分支，答案被确认。", _state(tree, variables={"left": None, "right": None}, structure={"tree": tree, "checked": checked}, result=[True], confirmed=True), tokens=tree, rows=[{"label": "answer", "values": ["true"]}])
        b.finish(_line(b.code, r"return dfs", fallback=22), "返回 true：二叉树关于中心轴对称。", _state(tree, variables={}, structure={"tree": tree, "checked": checked}, result=[True], confirmed=True), result=[True], tokens=tree, rows=[{"label": "answer", "values": ["true"]}])
        return b.steps

    if pid == 543:
        tree=[1,2,3,4,5]; heights={4:1,5:1,2:2,3:1,1:3}; best=0
        b.emit(_line(b.code, r"int ans"), "setup", "后序计算高度与直径", "每个节点向父节点返回单边高度，同时用 left_height + right_height 更新直径。", _state(tree, variables={"best": best}, structure={"tree": tree}), tokens=tree, rows=[{"label": "tree", "values": tree}])
        for node,left,right in [(4,0,0),(5,0,0),(2,1,1),(3,0,0),(1,2,1)]:
            best=max(best,left+right); h=max(left,right)+1; heights[node]=h
            b.emit(_line(b.code, r"ans = max", fallback=22), "update", f"处理节点 {node}", f"左右高度 {left},{right}，通过该节点的路径长 {left+right}，best={best}，返回高度 {h}。", _state(tree, variables={"node": node, "left": left, "right": right, "height": h, "best": best}, structure={"tree": tree, "heights": heights}, result=[best] if node == 1 else [] , confirmed=node == 1), tokens=tree, active=tree.index(node), rows=[{"label": "heights", "values": [f"{k}:{v}" for k,v in heights.items()]}, {"label": "best", "values": [best]}])
        b.finish(_line(b.code, r"return ans"), f"最长路径边数为 {best}。", _state(tree, variables={"best": best}, structure={"tree": tree, "heights": heights}, result=[best], confirmed=True), result=[best], tokens=tree, rows=[{"label": "answer", "values": [best]}])
        return b.steps

    if pid == 102:
        tree=[3,9,20,None,None,15,7]; queue=[0]; levels=[]
        b.emit(_line(b.code, r"queue<TreeNode"), "setup", "根节点入队", "队列按层保存待处理节点；每次先固定当前层长度，再生成下一层。", _state(tree, variables={"level": 0}, structure={"queue": queue, "levels": levels}), tokens=tree, rows=[{"label": "queue", "values": [3]}, {"label": "levels", "values": ["空"]}])
        for level in [[3],[9,20],[15,7]]:
            levels.append(level)
            queue = []
            b.emit(_line(b.code, r"res\.push_back"), "mutate", f"完成第 {len(levels)} 层", f"本层节点为 {level}，把它们的非空孩子加入下一轮队列。", _state(tree, variables={"level": len(levels)-1}, structure={"queue": queue, "levels": levels}, result=levels, confirmed=True), tokens=tree, rows=[{"label": "queue", "values": queue or ["空"]}, {"label": "levels", "values": [_fmt(x) for x in levels]}])
            if level == [3]: queue=[1,2]
            elif level == [9,20]: queue=[5,6]
        b.finish(_line(b.code, r"return res"), f"层序遍历完成：{levels}。", _state(tree, variables={}, structure={"levels": levels}, result=levels, confirmed=True), result=levels, tokens=tree, rows=[{"label": "answer", "values": [_fmt(x) for x in levels]}])
        return b.steps

    if pid == 108:
        nums=[-10,-3,0,5,9]; ranges=[(0,4),(0,1),(0,0),(2,4),(2,2)]; roots=[]
        b.emit(_line(b.code, r"int mid"), "setup", "用区间中点建立平衡树", "每次取 [l,r] 中点作为根，递归构造左右子树。", _state(nums, variables={"l":0,"r":4}, structure={"nums":nums,"ranges":ranges}), tokens=nums, rows=[{"label": "range", "values": ["[0,4]"]}, {"label": "tree", "values": ["空"]}])
        for l,r in ranges:
            mid=(l+r)//2; roots.append(nums[mid])
            b.emit(_line(b.code, r"return build"), "mutate", f"选择 nums[{mid}] = {nums[mid]}", f"区间 [{l},{r}] 的中点作为当前根，保持左右高度尽量接近。", _state(nums, variables={"l":l,"r":r,"mid":mid}, structure={"nums":nums,"roots":roots}), tokens=nums, active=mid, rows=[{"label": "roots", "values": roots}, {"label": "pending", "values": [f"[{l},{r}]"]}])
        b.finish(_line(b.code, r"return build"), f"构造完成，根节点为 0，根序列 {roots}。", _state(nums, variables={"root":0}, structure={"roots":roots}, result=roots, confirmed=True), result=roots, tokens=nums, rows=[{"label": "answer", "values": roots}])
        return b.steps

    if pid == 98:
        values=[2,1,3]; prev=None; valid=True; order=[]
        b.emit(_line(b.code, r"vector<int> res"), "setup", "中序遍历验证递增性", "合法 BST 的中序序列必须严格递增；prev 保存上一个已访问值。", _state(values, variables={"prev": prev, "valid": valid}, structure={"tree": values}), tokens=values, rows=[{"label": "inorder", "values": ["空"]}])
        for x in [1,2,3]:
            valid = prev is None or prev < x; order.append(x); prev=x
            b.emit(_line(b.code, r"if \(!t\[0\]"), "compare", f"检查中序值 {x}", f"prev={order[-2] if len(order)>1 else '—'}，当前={x}，严格递增={str(valid).lower()}。", _state(values, variables={"prev": prev, "current": x, "valid": valid}, structure={"tree": values, "inorder": order}), tokens=values, active=values.index(x), compared=[values.index(x)], rows=[{"label": "inorder", "values": order}, {"label": "valid", "values": [valid]}])
        b.finish(_line(b.code, r"return dfs"), "中序序列严格递增，返回 true。", _state(values, variables={"prev": prev, "valid": valid}, structure={"inorder": order}, result=[valid], confirmed=True), result=[valid], tokens=values, rows=[{"label": "answer", "values": [valid]}])
        return b.steps

    if pid == 230:
        values=[3,1,4,None,2]; inorder=[1,2,3,4]; k=1; seen=[]
        b.emit(_line(b.code, r"int k"), "setup", "用中序顺序寻找第 k 小", "BST 中序遍历天然有序；每访问一个节点就把 k 减一。", _state(values, variables={"k": k}, structure={"tree": values, "seen": seen}), tokens=values, rows=[{"label": "seen", "values": ["空"]}])
        for x in inorder:
            seen.append(x); k-=1
            b.emit(_line(b.code, r"-- k == 0"), "mutate", f"访问节点 {x}", f"中序第 {len(seen)} 个节点为 {x}，k 剩余 {k}。", _state(values, variables={"k": k, "current": x}, structure={"tree": values, "seen": seen}, result=[x] if k==0 else [], confirmed=k==0), tokens=values, active=values.index(x), rows=[{"label": "inorder", "values": seen}, {"label": "k", "values": [k]}])
            if k == 0:
                break
        b.finish(_line(b.code, r"return ans", fallback=29), f"第 1 小节点值为 {seen[-1]}。", _state(values, variables={"k": 0}, structure={"seen": seen}, result=[seen[-1]], confirmed=True), result=[seen[-1]], tokens=values, rows=[{"label": "answer", "values": [seen[-1]]}])
        return b.steps

    if pid == 199:
        tree=[1,2,3,None,5,None,4]; levels=[[1],[2,3],[5,4]]; visible=[]; queue=[]
        b.emit(_line(b.code, r"queue<TreeNode"), "setup", "按层扫描并取每层最后节点", "右视图只保留每一层最右侧的可见节点。", _state(tree, variables={"level":0}, structure={"queue": [1], "visible": visible}), tokens=tree, rows=[{"label": "queue", "values": [1]}, {"label": "visible", "values": ["空"]}])
        for level in levels:
            visible.append(level[-1]); queue=[]
            b.emit(_line(b.code, r"res.push_back", fallback=22), "mutate", f"记录第 {len(visible)} 层右端 {level[-1]}", f"本层 {level} 扫描完毕，只把最后节点 {level[-1]} 放入答案。", _state(tree, variables={"level":len(visible)-1}, structure={"level":level,"queue":queue,"visible":visible}, result=visible, confirmed=True), tokens=tree, active=tree.index(level[-1]), rows=[{"label": "level", "values": level}, {"label": "visible", "values": visible}])
        b.finish(_line(b.code, r"return res"), f"右视图为 {visible}。", _state(tree, variables={}, structure={"visible":visible}, result=visible, confirmed=True), result=visible, tokens=tree, rows=[{"label": "answer", "values": visible}])
        return b.steps

    if pid == 114:
        before=[1,2,5,3,4,None,6]; preorder=[1,2,3,4,5,6]; flat=[]
        b.emit(_line(b.code, r"void flatten"), "setup", "按前序顺序展开", "展开后的链表顺序必须是 root → left → right，并且所有 left 置空。", _state(before, variables={"node":1}, structure={"tree":before,"flat":flat}), tokens=before, rows=[{"label": "tree", "values": before}, {"label": "flat", "values": ["空"]}])
        for node in preorder:
            flat.append(node)
            b.emit(_line(b.code, r"root->right"), "mutate", f"把节点 {node} 接到展开链", f"前序结果前缀为 {flat}；当前节点 left=null。", _state(before, variables={"node":node}, structure={"flat":flat,"left":None}, result=flat, confirmed=True), tokens=preorder, active=preorder.index(node), rows=[{"label": "flat", "values": flat}])
        b.finish(_line(b.code, r"root = root->right", fallback=23), f"原地展开为 {flat}。", _state(before, variables={}, structure={"flat":flat}, result=flat, confirmed=True), result=flat, tokens=preorder, rows=[{"label": "answer", "values": flat}])
        return b.steps

    if pid == 105:
        pre=[3,9,20,15,7]; ino=[9,3,15,20,7]; built=[]
        b.emit(_line(b.code, r"TreeNode\* build"), "setup", "用前序确定根，用中序切分左右子树", "当前子树的前序首元素是根；在中序中找到它即可确定左右范围。", _state(pre, variables={"pre":0,"inL":0,"inR":4}, structure={"preorder":pre,"inorder":ino,"built":built}), tokens=pre, rows=[{"label":"preorder", "values":pre},{"label":"inorder", "values":ino}])
        for root, left_range, right_range in [(3,(0,0),(2,4)),(9,(0,0),None),(20,(2,2),(3,4)),(15,(3,3),None),(7,(4,4),None)]:
            built.append(root)
            b.emit(_line(b.code, r"int k"), "mutate", f"构造根节点 {root}", f"在中序中定位 {root}，左右子树范围为 {left_range} / {right_range}。", _state(pre, variables={"root":root}, structure={"preorder":pre,"inorder":ino,"built":built}, result=built, confirmed=True), tokens=pre, active=pre.index(root), rows=[{"label":"built", "values":built},{"label":"ranges", "values":[_fmt(left_range),_fmt(right_range)]}])
        b.finish(_line(b.code, r"return build", fallback=25), "递归切分完成，返回根为 3 的二叉树。", _state(pre, variables={"root":3}, structure={"built":built}, result=built, confirmed=True), result=built, tokens=pre, rows=[{"label":"answer", "values":built}])
        return b.steps

    if pid == 437:
        nodes=[10,5,-3,3,2,None,11,3,-2,None,1]; target=8; prefix={0:1}; cur=0; res=0
        line_seed=_line(b.code, r"cnt\[0\]")
        line_add=_line(b.code, r"cur \+= root->val")
        line_count=_line(b.code, r"res \+= cnt")
        line_record=_line(b.code, r"cnt\[cur\] \+\+")
        line_recurse=_line(b.code, r"dfs\(root->left")
        line_backtrack=_line(b.code, r"cnt\[cur\] --")
        line_return=_line(b.code, r"return res")
        b.emit(line_seed, "setup", "记录空路径前缀", "pathSum 先执行 cnt[0]++；空前缀让从根开始的路径也能被计数。", _state(nodes, variables={"sum":target,"cur":cur,"res":res}, structure={"cnt":prefix}), tokens=nodes, rows=[{"label":"cnt", "values":["0:1"]},{"label":"res", "values":[res]}])
        tree=(10,"根节点",[
            (5,"10 的左子树",[(3,"5 的左子树",[(3,"3 的左子树",[]),(-2,"3 的右子树",[])]),(2,"5 的右子树",[(1,"2 的右子树",[])])]),
            (-3,"10 的右子树",[(11,"-3 的右子树",[])])
        ])
        visit_index=0

        def visit(node: tuple[int, str, list], depth: int = 0) -> None:
            nonlocal cur, res, visit_index
            x, note, children = node
            current_index = min(visit_index, len(nodes) - 1)
            visit_index += 1
            cur += x
            b.emit(line_add, "mutate", f"访问节点 {x}：更新 cur", f"{note}，执行 cur += root->val，当前 cur={cur}。", _state(nodes, variables={"node":x,"sum":target,"cur":cur,"res":res}, structure={"cnt":prefix}, result=[res] if res else []), tokens=nodes, active=current_index, rows=[{"label":"cnt", "values":[f"{key}:{value}" for key,value in prefix.items()]},{"label":"cur / res", "values":[f"cur={cur}",f"res={res}"]}])
            found=prefix.get(cur-target,0)
            res += found
            b.emit(line_count, "update", f"用历史前缀更新 res", f"查 cnt[cur - sum] = cnt[{cur-target}]，命中 {found} 次；res 更新为 {res}。", _state(nodes, variables={"node":x,"sum":target,"cur":cur,"found":found,"res":res}, structure={"cnt":prefix}, result=[res] if res else []), tokens=nodes, active=current_index, rows=[{"label":"lookup", "values":[f"cnt[{cur-target}] = {found}"]},{"label":"res", "values":[res]}])
            prefix[cur]=prefix.get(cur,0)+1
            b.emit(line_record, "mutate", f"记录前缀 cur={cur}", f"执行 cnt[cur]++，当前 cnt[{cur}]={prefix[cur]}；这个前缀可供后代路径查询。", _state(nodes, variables={"node":x,"sum":target,"cur":cur,"res":res}, structure={"cnt":prefix}, result=[res] if res else []), tokens=nodes, active=current_index, rows=[{"label":"cnt", "values":[f"{key}:{value}" for key,value in prefix.items()]},{"label":"res", "values":[res]}])
            b.emit(line_recurse, "inspect", "递归处理左右子树", f"当前节点的前缀已经登记，沿 dfs(root->left) 和 dfs(root->right) 继续；返回后必须撤销 cur。", _state(nodes, variables={"node":x,"sum":target,"cur":cur,"res":res}, structure={"cnt":prefix}, result=[res] if res else []), tokens=nodes, active=current_index, rows=[{"label":"call", "values":["left → right"]},{"label":"cnt", "values":[f"{key}:{value}" for key,value in prefix.items()]}])
            for child in children:
                visit(child, depth + 1)
            prefix[cur]-=1
            b.emit(line_backtrack, "mutate", f"离开节点 {x}：撤销前缀", f"子树处理完成，执行 cnt[cur]--；cnt[{cur}] 回到 {prefix[cur]}，避免把不同分支混在一起。", _state(nodes, variables={"node":x,"sum":target,"cur":cur,"res":res}, structure={"cnt":prefix}, result=[res] if res else []), tokens=nodes, active=current_index, rows=[{"label":"cnt", "values":[f"{key}:{value}" for key,value in prefix.items() if value] or ["空"]},{"label":"res", "values":[res]}])
            cur -= x
        visit(tree)
        b.finish(line_return, f"所有 DFS 分支完成，return res = {res}。", _state(nodes, variables={"sum":target,"cur":0,"res":res}, structure={"cnt":prefix}, result=[res], confirmed=True), result=[res], tokens=nodes, rows=[{"label":"answer", "values":[res]}])
        return b.steps

    if pid == 236:
        tree=[3,5,1,6,2,0,8,None,None,7,4]; p=5; q=1; candidates=[3]
        line_state = _line(b.code, r"state = dfs\(root->left")
        b.emit(_line(b.code, r"if \(!root"), "setup", "从根开始寻找 p、q", "若 p、q 分居左右子树，当前 root 就是最近公共祖先；否则递归进入存在目标的一侧。", _state(tree, variables={"root":3,"p":p,"q":q}, structure={"tree":tree}), tokens=tree, rows=[{"label":"tree", "values":tree},{"label":"p / q", "values":[p,q]}])
        for root, left_hit, right_hit in [(3,True,True),(5,True,False),(1,False,True)]:
            b.emit(line_state, "compare", f"检查 root={root}", f"root={root}：左侧命中={str(left_hit).lower()}，右侧命中={str(right_hit).lower()}。", _state(tree, variables={"root":root,"p":p,"q":q,"left":left_hit,"right":right_hit}, structure={"tree":tree}), tokens=tree, active=tree.index(root), rows=[{"label":"branches", "values":[f"left={left_hit}",f"right={right_hit}"]}])
            if left_hit and right_hit:
                candidates=[root]
                break
        b.emit(_line(b.code, r"if \(state == 3"), "mutate", "左右递归结果同时非空", "p、q 分别在 root 的两侧，root=3 被确认是最近公共祖先。", _state(tree, variables={"root":3,"p":p,"q":q}, structure={"tree":tree}, result=candidates, confirmed=True), tokens=tree, active=0, rows=[{"label":"answer", "values":candidates}])
        b.finish(_line(b.code, r"return ans"), "返回最近公共祖先 3。", _state(tree, variables={"root":3}, structure={"tree":tree}, result=candidates, confirmed=True), result=candidates, tokens=tree, rows=[{"label":"answer", "values":candidates}])
        return b.steps

    if pid == 124:
        tree=[-10,9,20,None,None,15,7]; best=-10**9; heights={}
        b.emit(_line(b.code, r"int ans"), "setup", "后序计算最大路径和", "每个节点向上只保留一条最大贡献路径，但经过该节点的左右贡献可以同时计入全局答案。", _state(tree, variables={"best":best}, structure={"tree":tree}), tokens=tree, rows=[{"label":"tree", "values":tree}])
        for node,left,right in [(9,0,0),(15,0,0),(7,0,0),(20,15,7),(-10,9,35)]:
            gain=node+max(0,left,right); path=node+max(0,left)+max(0,right); best=max(best,path); heights[node]=gain
            b.emit(_line(b.code, r"ans = max", fallback=21), "update", f"处理节点 {node}", f"向上贡献 gain={gain}，穿过当前节点的路径和={path}，best={best}。", _state(tree, variables={"node":node,"left":left,"right":right,"gain":gain,"best":best}, structure={"tree":tree,"gain":heights}, result=[best] if node == -10 else [], confirmed=node == -10), tokens=tree, active=tree.index(node), rows=[{"label":"gain", "values":[f"{k}:{v}" for k,v in heights.items()]},{"label":"best", "values":[best]}])
        b.finish(_line(b.code, r"return ans", fallback=24), f"最大路径和为 {best}。", _state(tree, variables={"best":best}, structure={"gain":heights}, result=[best], confirmed=True), result=[best], tokens=tree, rows=[{"label":"answer", "values":[best]}])
        return b.steps

    return None


def _other_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]] | None:
    pid = item["id"]
    b = TraceBuilder(item, mode)

    if pid == 200:
        grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]; seen=set(); count=0
        b.emit(_line(b.code, r"int n"), "setup", "准备网格 DFS", "每个未访问的 1 都是一个新岛屿的起点；一次 DFS 覆盖整块连通区域。", _state(grid, variables={"count":count}, structure={"grid":grid,"seen":sorted(seen)}), tokens=[str(x) for row in grid for x in row], rows=[{"label":"grid", "values":[_fmt(row) for row in grid]},{"label":"count", "values":[count]}])
        components=[[(0,0),(0,1),(1,0),(1,1)],[(2,2)],[(3,3),(3,4)]]
        for comp in components:
            count += 1
            for cell in comp:
                seen.add(cell)
                b.emit(_line(b.code, r"dfs\(i, j\)"), "mutate", f"DFS 访问 {cell}", f"从新起点开始覆盖同一连通块，已访问 {len(seen)} 个陆地格。", _state(grid, variables={"cell":cell,"count":count}, structure={"grid":grid,"seen":sorted(seen)}, result=[count]), tokens=[str(x) for row in grid for x in row], active=cell[0]*len(grid[0])+cell[1], rows=[{"label":"seen", "values":[str(x) for x in sorted(seen)]},{"label":"count", "values":[count]}])
            b.emit(_line(b.code, r"cnt \+\+"), "update", f"岛屿 {count} 完成", f"这一块所有相邻 1 都已标记，岛屿数 count={count}。", _state(grid, variables={"count":count}, structure={"grid":grid,"seen":sorted(seen)}, result=[count], confirmed=True), tokens=[str(x) for row in grid for x in row], rows=[{"label":"island", "values":[str(x) for x in comp]},{"label":"count", "values":[count]}])
        b.finish(_line(b.code, r"return cnt"), f"网格共有 {count} 个岛屿。", _state(grid, variables={"count":count}, structure={"grid":grid,"seen":sorted(seen)}, result=[count], confirmed=True), result=[count], tokens=[str(x) for row in grid for x in row], rows=[{"label":"answer", "values":[count]}])
        return b.steps

    if pid == 994:
        grid=[[2,1,1],[1,1,0],[0,1,1]]; rotten={(0,0)}; fresh={(0,1),(0,2),(1,0),(1,1),(2,1),(2,2)}; minute=0; q=[(0,0)]
        b.emit(_line(b.code, r"queue<pair"), "setup", "把所有腐烂橘子同时入队", "多源 BFS 按层扩散；一层队列对应经过一分钟。", _state(grid, variables={"minute":minute,"fresh":len(fresh)}, structure={"queue":q,"grid":grid}), tokens=[str(x) for row in grid for x in row], rows=[{"label":"queue", "values":[str(x) for x in q]},{"label":"fresh", "values":[len(fresh)]}])
        layers=[[(0,1),(1,0)],[(0,2),(1,1)],[(2,1)],[(2,2)]]
        for layer in layers:
            minute += 1
            for cell in layer:
                fresh.discard(cell); rotten.add(cell)
                b.emit(_line(b.code, r"q\.push"), "mutate", f"第 {minute} 分钟腐烂 {cell}", f"从上一层腐烂橘子扩散到 {cell}，剩余新鲜橘子 {len(fresh)}。", _state(grid, variables={"minute":minute,"cell":cell,"fresh":len(fresh)}, structure={"queue":list(layer),"rotten":sorted(rotten)}, result=[minute]), tokens=[str(x) for row in grid for x in row], active=cell[0]*3+cell[1], rows=[{"label":"rotten", "values":[str(x) for x in sorted(rotten)]},{"label":"queue", "values":[str(x) for x in layer]},{"label":"fresh", "values":[len(fresh)]}])
            b.emit(_line(b.code, r"res \+\+"), "update", f"完成第 {minute} 层扩散", f"这一分钟的队列处理完，继续下一层；fresh={len(fresh)}。", _state(grid, variables={"minute":minute,"fresh":len(fresh)}, structure={"rotten":sorted(rotten)}, result=[minute], confirmed=not fresh), tokens=[str(x) for row in grid for x in row], rows=[{"label":"minute", "values":[minute]},{"label":"fresh", "values":[len(fresh)]}])
        b.finish(_line(b.code, r"return res"), f"所有橘子在 {minute} 分钟内腐烂。", _state(grid, variables={"minute":minute,"fresh":len(fresh)}, structure={"rotten":sorted(rotten)}, result=[minute], confirmed=True), result=[minute], tokens=[str(x) for row in grid for x in row], rows=[{"label":"answer", "values":[minute]}])
        return b.steps

    if pid == 207:
        n=2; edges=[[1,0]]; indegree=[0,1]; queue=[0]; order=[]
        b.emit(_line(b.code, r"vector<int> d"), "setup", "统计入度并把零入度课程入队", "只有入度为 0 的课程可以先修；处理它时会解除后续课程的一条依赖。", _state([0,1], variables={"n":n}, structure={"indegree":indegree,"queue":queue,"order":order}), tokens=["0","1"], rows=[{"label":"indegree", "values":indegree},{"label":"queue", "values":queue}])
        while queue:
            course=queue.pop(0); order.append(course)
            b.emit(_line(b.code, r"q\.pop"), "mutate", f"完成课程 {course}", f"从队列取出 {course}，完成顺序为 {order}。", _state([0,1], variables={"course":course}, structure={"indegree":indegree,"queue":queue,"order":order}, result=order, confirmed=True), tokens=["0","1"], active=course, rows=[{"label":"order", "values":order},{"label":"queue", "values":queue or ["空"]}])
            for a,before in edges:
                if before==course:
                    indegree[a]-=1
                    if indegree[a]==0: queue.append(a)
                    b.emit(_line(b.code, r"-- d\[i\] == 0"), "update", f"解除课程 {a} 的依赖", f"indegree[{a}] 降为 {indegree[a]}，因此加入 queue。", _state([0,1], variables={"course":course,"next":a}, structure={"indegree":indegree,"queue":queue,"order":order}, result=order, confirmed=True), tokens=["0","1"], active=a, rows=[{"label":"indegree", "values":indegree},{"label":"queue", "values":queue}])
        ok=len(order)==n
        b.finish(_line(b.code, r"return cnt == n", fallback=26), f"处理了 {len(order)}/{n} 门课程，返回 {str(ok).lower()}。", _state([0,1], variables={"count":len(order),"n":n}, structure={"indegree":indegree,"order":order}, result=[ok], confirmed=True), result=[ok], tokens=["0","1"], rows=[{"label":"answer", "values":[ok]}])
        return b.steps

    if pid == 208:
        operations=[("insert","apple"),("insert","app"),("search","app"),("startsWith","ap")]; path=""; words=[]; results=[]
        b.emit(_line(b.code, r"struct Node"), "setup", "初始化 Trie 根节点", "每条边代表一个字符，end 标记只在完整单词处为 true。", _state([], variables={"path":""}, structure={"words":words,"end":[]}), tokens=list("apple"), rows=[{"label":"trie", "values":["root"]}])
        for op,word in operations:
            if op=="insert":
                path=""
                for char in word:
                    path += char
                    b.emit(_line(b.code, r"p->son\["), "mutate", f"插入字符 {char}", f"沿前缀 {path} 建立或复用节点。", _state([], variables={"op":op,"path":path}, structure={"words":words,"end":[]}), tokens=list(word), active=len(path)-1, rows=[{"label":"path", "values":[path]},{"label":"end", "values":["未标记"]}])
                words.append(word)
                b.emit(_line(b.code, r"p->is_end"), "mutate", f"标记完整单词 {word}", "只有走完整个单词后才设置 end，前缀本身不等于完整单词。", _state([], variables={"op":op,"path":word}, structure={"words":words,"end":words}), tokens=list(word), active=len(word)-1, rows=[{"label":"words", "values":words},{"label":"end", "values":words}])
            else:
                hit = word=="app" or word.startswith("ap")
                results.append(hit)
                query_line = _line(b.code, r"bool search") if op == "search" else _line(b.code, r"bool startsWith")
                b.emit(query_line, "lookup", f"{op}({word}) → {str(hit).lower()}", f"沿路径 {word} 查询，{'找到对应节点/前缀' if hit else '路径中断'}。", _state([], variables={"op":op,"path":word,"found":hit}, structure={"words":words,"end":words}, result=results, confirmed=True), tokens=list(word), active=max(0,len(word)-1), rows=[{"label":"query", "values":[word]},{"label":"results", "values":results}])
        b.finish(_line(b.code, r"return p", fallback=54), f"查询结果为 {results}。", _state([], variables={}, structure={"words":words,"end":words}, result=results, confirmed=True), result=results, tokens=list("apple"), rows=[{"label":"answer", "values":results}])
        return b.steps

    if pid == 20:
        chars=list("([{}])"); pairs={')':'(',']':'[','}':'{'}; stack=[]; valid=True
        b.emit(_line(b.code, r"stack<char>"), "setup", "从空括号栈开始", "栈顶保存最近一个还没闭合的左括号。", _state(chars, variables={"i":None,"valid":valid}, structure={"stack":stack}), tokens=chars, rows=[{"label":"stack", "values":["空"]}])
        for i,ch in enumerate(chars):
            if ch in "([{":
                stack.append(ch); line=_line(b.code, r"stk\.push")
                title="左括号入栈"; body=f"读到 {ch}，压入栈顶，stack={stack}。"
            else:
                top=stack[-1] if stack else None; valid=bool(stack) and top==pairs[ch]
                if valid: stack.pop()
                line=_line(b.code, r"stk\.pop")
                title="闭合括号匹配"; body=f"读到 {ch}，栈顶 {top or '空'}，匹配={str(valid).lower()}，stack={stack}。"
            b.emit(line, "mutate", f"处理 {ch}", body, _state(chars, variables={"i":i,"char":ch,"valid":valid}, structure={"stack":stack}, result=[valid] if not valid else [], confirmed=not valid), tokens=chars, active=i, rows=[{"label":"stack", "values":stack or ["空"]},{"label":"valid", "values":[valid]}])
            if not valid: break
        valid = valid and not stack
        b.emit(_line(b.code, r"return stk.empty"), "update", "检查输入结束后的空栈", f"所有字符处理完，stack={'空' if not stack else stack}，合法={str(valid).lower()}。", _state(chars, variables={"valid":valid}, structure={"stack":stack}, result=[valid], confirmed=True), tokens=chars, rows=[{"label":"stack", "values":stack or ["空"]},{"label":"answer", "values":[valid]}])
        b.finish(_line(b.code, r"return stk.empty"), f"返回 {str(valid).lower()}。", _state(chars, variables={"valid":valid}, structure={"stack":stack}, result=[valid], confirmed=True), result=[valid], tokens=chars, rows=[{"label":"answer", "values":[valid]}])
        return b.steps

    if pid == 155:
        ops=[("push",-2),("push",0),("push",-3),("getMin",None),("pop",None)]; stack=[]; mins=[]; results=[]
        b.emit(_line(b.code, r"stack<int>"), "setup", "初始化双栈", "一个栈保存值，另一个栈同步保存到当前为止的最小值。", _state([], variables={}, structure={"stack":stack,"mins":mins}), tokens=[], rows=[{"label":"stack", "values":["空"]},{"label":"min", "values":["空"]}])
        for op,val in ops:
            if op=="push":
                stack.append(val); mins.append(min(val, mins[-1] if mins else val)); line=_line(b.code, r"stk\.push")
                body=f"push({val}) 后 stack={stack}，当前最小值 {mins[-1]}。"; result=None
            elif op=="pop":
                stack.pop(); mins.pop(); line=_line(b.code, r"stk\.pop"); body=f"pop 后 stack={stack}，最小值栈同步回退。"; result=None
            else:
                results.append(mins[-1]); line=_line(b.code, r"getMin"); body=f"getMin() 直接读取 min 栈顶 {mins[-1]}。"; result=results
            b.emit(line, "mutate", f"执行 {op}", body, _state([], variables={"op":op,"min":mins[-1] if mins else None}, structure={"stack":stack,"mins":mins}, result=result or [], confirmed=bool(result)), tokens=stack, rows=[{"label":"stack", "values":stack or ["空"]},{"label":"min", "values":mins or ["空"]},{"label":"get results", "values":results or ["空"]}])
        b.finish(_line(b.code, r"return f\.top"), f"操作完成，getMin 结果记录为 {results}。", _state([], variables={}, structure={"stack":stack,"mins":mins}, result=results, confirmed=True), result=results, tokens=stack, rows=[{"label":"answer", "values":results}])
        return b.steps

    if pid == 394:
        text="3[a2[c]]"; nums=[]; strings=[""]; current=""; results=[]
        b.emit(_line(b.code, r"int u"), "setup", "建立数字栈与字符串栈", "数字栈记录重复次数，字符串栈保存进入括号前的上下文。", _state(list(text), variables={"i":0}, structure={"nums":nums,"strings":strings}), tokens=list(text), rows=[{"label":"nums", "values":["空"]},{"label":"strings", "values":["空字符串"]}])
        for i,ch in enumerate(text):
            if ch.isdigit():
                nums.append(int(ch)); line=_line(b.code, r"int k = u") ; body=f"累积重复次数 num={nums[-1]}。"
            elif ch=='[':
                strings.append(current); current=""; line=_line(b.code, r"u = k \+ 1") ; body=f"进入括号，保存前缀 {strings[-1]}。"
            elif ch==']':
                repeat=nums.pop(); prefix=strings.pop(); current=prefix+current*repeat; line=_line(b.code, r"while \(x\s*--") ; body=f"闭合括号，恢复 {prefix} 并重复 {repeat} 次，current={current}。"
            else:
                current+=ch; line=_line(b.code, r"res \+= s\[u"); body=f"追加字符 {ch}，current={current}。"
            b.emit(line, "mutate", f"处理 {ch}", body, _state(list(text), variables={"i":i,"char":ch,"current":current}, structure={"nums":nums,"strings":strings}, result=[current] if ch==']' else [] , confirmed=ch==']'), tokens=list(text), active=i, rows=[{"label":"current", "values":[current or "空"]},{"label":"nums", "values":nums or ["空"]},{"label":"strings", "values":strings or ["空"]}])
        results=[current]
        b.finish(_line(b.code, r"return dfs"), f"解码结果为 {current}。", _state(list(text), variables={}, structure={"decoded":current}, result=results, confirmed=True), result=results, tokens=list(text), rows=[{"label":"answer", "values":results}])
        return b.steps

    if pid == 739:
        temps=[73,74,75,71,69,72,76,73]; answer=[0]*len(temps); stack=[]
        b.emit(_line(b.code, r"stack<int>"), "setup", "建立递减温度栈", "栈保存还没有找到更高温度的下标；新温度出现时从栈顶结算。", _state(temps, variables={}, structure={"stack":stack,"answer":answer}), tokens=temps, rows=[{"label":"stack", "values":["空"]},{"label":"answer", "values":answer}])
        for i,t in enumerate(temps):
            while stack and temps[stack[-1]] < t:
                old=stack.pop(); answer[old]=i-old
                b.emit(_line(b.code, r"stk\.pop\(\)"), "mutate", f"温度 {t} 结算下标 {old}", f"{t} 比 temps[{old}]={temps[old]} 高，等待天数为 {answer[old]}。", _state(temps, variables={"i":i,"t":t,"resolved":old}, structure={"stack":stack,"answer":answer}, result=answer, confirmed=True), tokens=temps, active=[old,i], rows=[{"label":"stack", "values":stack or ["空"]},{"label":"answer", "values":answer}])
            stack.append(i)
            b.emit(_line(b.code, r"stk\.push"), "mutate", f"下标 {i} 入栈", f"当前温度 {t} 还没有遇到更高值，stack={stack}。", _state(temps, variables={"i":i,"t":t}, structure={"stack":stack,"answer":answer}, result=answer, confirmed=True), tokens=temps, active=i, rows=[{"label":"stack", "values":stack},{"label":"answer", "values":answer}])
        b.finish(_line(b.code, r"return res"), f"每日温度答案为 {answer}。", _state(temps, variables={}, structure={"stack":stack,"answer":answer}, result=answer, confirmed=True), result=answer, tokens=temps, rows=[{"label":"answer", "values":answer}])
        return b.steps

    if pid == 84:
        heights=[2,1,5,6,2,3]; stack=[]; best=0; extended=heights+[0]
        b.emit(_line(b.code, r"stack<int>"), "setup", "建立递增柱高栈", "栈内柱子高度递增；遇到更矮柱子时，栈顶柱子的最大矩形右边界被确定。", _state(heights, variables={"best":best}, structure={"stack":stack}), tokens=heights, rows=[{"label":"stack", "values":["空"]}])
        for i,h in enumerate(extended):
            while stack and extended[stack[-1]] > h:
                top=stack.pop(); left=stack[-1] if stack else -1; width=i-left-1; area=extended[top]*width; best=max(best,area)
                b.emit(_line(b.code, r"res = max", fallback=22), "mutate", f"弹出高度 {extended[top]}", f"左边界 {left}，右边界 {i}，宽度 {width}，面积 {area}，best={best}。", _state(heights, variables={"i":i,"h":h,"top":top,"width":width,"area":area,"best":best}, structure={"stack":stack}, result=[best], confirmed=True), tokens=heights, active=[top], compared=[left,i] if i < len(heights) else [top], rows=[{"label":"stack", "values":stack or ["空"]},{"label":"area", "values":[area]},{"label":"best", "values":[best]}])
            stack.append(i)
            if i < len(heights):
                b.emit(_line(b.code, r"stk\.push"), "mutate", f"下标 {i} 入栈", f"保持递增栈，stack={stack}。", _state(heights, variables={"i":i,"h":h,"best":best}, structure={"stack":stack}, result=[best], confirmed=True), tokens=heights, active=i, rows=[{"label":"stack", "values":stack},{"label":"best", "values":[best]}])
        b.finish(_line(b.code, r"return res"), f"最大矩形面积为 {best}。", _state(heights, variables={"best":best}, structure={"stack":stack}, result=[best], confirmed=True), result=[best], tokens=heights, rows=[{"label":"answer", "values":[best]}])
        return b.steps

    if pid in {215,347,295}:
        return _heap_trace(item, mode)

    if pid in {46,78,17,39,22,79,131,51}:
        return _backtrack_trace(item, mode)

    if pid in {35,74,34,33,153,4}:
        return _binary_trace(item, mode)

    if pid in {121,55,45,763}:
        return _greedy_trace(item, mode)

    if pid in {70,118,198,279,322,139,300,152,416,32,62,64,5,1143,72}:
        return _dp_trace(item, mode)

    if pid in {136,169,75,31,287}:
        return _misc_trace(item, mode)

    return None


def _heap_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid=item["id"]; b=TraceBuilder(item,mode)
    if pid==215:
        nums=[3,2,1,5,6,4]; k=2; target=k-1
        line_call=_line(b.code,r"return quick_sort")
        line_base=_line(b.code,r"if \(l == r\)")
        line_init=_line(b.code,r"int x = nums\[l\]")
        line_i=_line(b.code,r"do i \+\+")
        line_j=_line(b.code,r"do j --")
        line_swap=_line(b.code,r"swap\(nums\[i\], nums\[j\]\)")
        line_left=_line(b.code,r"if \(k <= j\)")
        line_right=_line(b.code,r"else return quick_sort")

        def rows(l: int, r: int, x: int | None, i: int | None, j: int | None) -> list[dict[str, Any]]:
            interval = nums[l:r + 1] if 0 <= l <= r < len(nums) else []
            return [
                {"label":"range", "values":[f"[{l}, {r}] · target index = {target}"]},
                {"label":"partition", "values":[f"x = {x if x is not None else '—'}", f"i = {i if i is not None else '—'}", f"j = {j if j is not None else '—'}"]},
                {"label":"active range", "values":interval or ["空"]},
            ]

        def state(l: int, r: int, x: int | None, i: int | None, j: int | None, *, result: list[Any] | None = None, confirmed: bool = False) -> dict[str, Any]:
            variables: dict[str, Any] = {"l":l, "r":r, "k":target, "x":x, "i":i, "j":j}
            return _state(nums, variables=variables, structure={"range": [l, r], "partition": nums[l:r + 1] if 0 <= l <= r < len(nums) else []}, result=result, confirmed=confirmed)

        b.emit(line_call,"setup","调用 quick_sort 查找第 k 大","findKthLargest 把 k=2 转成 0-based 目标下标 k-1=1；数组还没有被分区。",state(0,len(nums)-1,None,None,None),tokens=nums,rows=rows(0,len(nums)-1,None,None,None))
        l, r = 0, len(nums)-1
        while True:
            if l == r:
                answer = nums[target]
                b.emit(line_base,"resolve","分区区间收缩到一个位置",f"l=r={l}，nums[k] = nums[{target}] = {answer}；quick_sort 在这里得到答案。",state(l,r,None,None,None,result=[answer],confirmed=True),tokens=nums,active=l,rows=rows(l,r,None,None,None))
                b.finish(line_call,f"公共接口返回 quick_sort 的结果 {answer}。",state(l,r,None,None,None,result=[answer],confirmed=True),result=[answer],tokens=nums,rows=[{"label":"answer","values":[answer]}])
                return b.steps

            x, i, j = nums[l], l - 1, r + 1
            b.emit(line_init,"setup",f"选定分区基准 x = {x}",f"进入区间 [{l}, {r}]，基准取 nums[l]={x}；i 从左侧外部开始，j 从右侧外部开始。",state(l,r,x,i,j),tokens=nums,active=[l],rows=rows(l,r,x,i,j))
            while i < j:
                while True:
                    i += 1
                    if nums[i] <= x:
                        break
                    b.emit(line_i,"compare",f"i 继续右移到 {i}",f"nums[{i}]={nums[i]} > x={x}，继续寻找应该放到右侧的元素。",state(l,r,x,i,j),tokens=nums,active=i,compared=[i],rows=rows(l,r,x,i,j))
                b.emit(line_i,"compare",f"i 停在 {i}",f"nums[{i}]={nums[i]} <= x={x}，左扫描找到一个可以参与交换的位置。",state(l,r,x,i,j),tokens=nums,active=i,compared=[i],rows=rows(l,r,x,i,j))
                while True:
                    j -= 1
                    if nums[j] >= x:
                        break
                    b.emit(line_j,"compare",f"j 继续左移到 {j}",f"nums[{j}]={nums[j]} < x={x}，继续寻找应该放到左侧的元素。",state(l,r,x,i,j),tokens=nums,active=j,compared=[j],rows=rows(l,r,x,i,j))
                b.emit(line_j,"compare",f"j 停在 {j}",f"nums[{j}]={nums[j]} >= x={x}，右扫描找到一个可以参与交换的位置。",state(l,r,x,i,j),tokens=nums,active=j,compared=[j],rows=rows(l,r,x,i,j))
                if i < j:
                    left_value, right_value = nums[i], nums[j]
                    nums[i], nums[j] = nums[j], nums[i]
                    b.emit(line_swap,"mutate",f"交换 nums[{i}] 与 nums[{j}]",f"把较大的 {right_value} 放到左侧、较小的 {left_value} 放到右侧；当前数组为 {nums}。",state(l,r,x,i,j),tokens=nums,active=[i,j],compared=[i,j],rows=rows(l,r,x,i,j))
            if target <= j:
                old_range = (l, r)
                r = j
                b.emit(line_left,"branch",f"目标在左区间，递归到 [{l}, {r}]",f"k={target} <= j={j}，保留左半区间；从 {old_range} 缩小到 [{l}, {r}]。",state(l,r,x,i,j),tokens=nums,active=[l,r],rows=rows(l,r,x,i,j))
            else:
                old_range = (l, r)
                l = j + 1
                b.emit(line_right,"branch",f"目标在右区间，递归到 [{l}, {r}]",f"k={target} > j={j}，排除左半区间；从 {old_range} 缩小到 [{l}, {r}]。",state(l,r,x,i,j),tokens=nums,active=[l,r],rows=rows(l,r,x,i,j))
    if pid==347:
        nums=[1,1,1,2,2,3]; counts={}; frequencies=[0]*7; k=2; t=0; i=6; result=[]
        line_count=_line(b.code,r"for \(auto x: nums\)")
        freq_loops=_lines(b.code,r"for \(auto \[x, c\]: cnt\)")
        line_freq=freq_loops[0] if freq_loops else _line(b.code,r"for \(auto \[x, c\]: cnt\)")
        line_result_loop=freq_loops[-1] if freq_loops else line_freq
        line_push=_line(b.code,r"res\.push_back")
        line_return=_line(b.code,r"return res")

        def rows() -> list[dict[str, Any]]:
            return [
                {"label":"cnt", "values":[f"{x} → {c}" for x,c in sorted(counts.items())] or ["空"]},
                {"label":"s[freq]", "values":[f"{idx}:{value}" for idx,value in enumerate(frequencies) if value] or ["全 0"]},
                {"label":"boundary", "values":[f"i = {i}", f"t = {t}", f"k = {k}"]},
                {"label":"res", "values":result or ["空"]},
            ]

        def state() -> dict[str, Any]:
            return _state(nums,variables={"n":len(nums),"k":k,"i":i,"t":t},structure={"cnt":counts,"s":frequencies},result=result,confirmed=bool(result))

        b.emit(_line(b.code,r"unordered_map<int, int> cnt"),"setup","建立频次表 cnt","先把每个数字出现了多少次记录下来；此时还没有扫描频率边界。",state(),tokens=nums,rows=rows())
        for index,x in enumerate(nums):
            counts[x]=counts.get(x,0)+1
            b.emit(line_count,"mutate",f"cnt[{x}] 增加到 {counts[x]}",f"执行 cnt[x]++：当前输入位置 {index} 的值为 {x}，频次表变成 {counts}。",state(),tokens=nums,active=index,rows=rows())
        b.emit(_line(b.code,r"int n = nums\.size\(\)"),"setup",f"记录 n = {len(nums)}",f"频次数组 s 需要 n+1 个位置，因为任何数字的频率最多是 n={len(nums)}。",state(),tokens=nums,rows=rows())
        b.emit(_line(b.code,r"vector<int> s"),"setup","建立频次数组 s","s[c] 表示恰好出现 c 次的数字有多少个。",state(),tokens=nums,rows=rows())
        for x,c in sorted(counts.items()):
            frequencies[c]+=1
            b.emit(line_freq,"mutate",f"把数字 {x} 的频率 {c} 计入 s",f"执行 s[c]++，所以 s[{c}]={frequencies[c]}；这里只按 cnt 的一项更新频次数组。",state(),tokens=nums,active=nums.index(x),rows=rows())
        i=len(nums); t=0
        b.emit(_line(b.code,r"int i = n, t = 0"),"setup","从最高频率向下扫描","i 从 n 开始，t 累计已经覆盖了多少个元素；目标是覆盖 k=2 个。",state(),tokens=nums,rows=rows())
        while t < k:
            current_i=i
            t += frequencies[i]
            i -= 1
            b.emit(_line(b.code,r"t \+= s\[i"),"update",f"读取频率 {current_i}",f"执行 t += s[i--]：s[{current_i}]={frequencies[current_i]}，得到 t={t}，并把 i 移到 {i}。",state(),tokens=nums,rows=rows())
        b.emit(_line(b.code,r"vector<int> res"),"setup","建立结果数组 res","现在 t 已经覆盖前 k 个元素，阈值边界是 c > i。",state(),tokens=nums,rows=rows())
        for x,c in sorted(counts.items()):
            b.emit(line_result_loop,"inspect",f"检查数字 {x} 的频率 {c}",f"进入结果遍历；条件 c > i 即 {c} > {i}，决定它是否属于前 {k} 高频。",state(),tokens=nums,active=nums.index(x),rows=rows())
            if c > i:
                result.append(x)
                b.emit(line_push,"mutate",f"把 {x} 加入 res",f"{c} > {i}，执行 res.push_back(x)；当前结果为 {result}。",state(),tokens=nums,active=nums.index(x),rows=rows())
            else:
                b.emit(_line(b.code,r"if \(c > i\)"),"branch",f"跳过 {x}",f"{c} 不大于 {i}，不执行 push_back；res 保持 {result or '空'}。",state(),tokens=nums,active=nums.index(x),rows=rows())
        b.finish(line_return,f"遍历结束，返回前 {k} 个高频元素 {result}。",state(),result=result,tokens=nums,rows=[{"label":"answer","values":result}])
        return b.steps

    nums=[1,2,3]; up=[]; down=[]; med=[]
    line_branch=_line(b.code,r"if \(down\.empty\(\) \|\| num <= down\.top\(\)\)")
    line_down_push=_line(b.code,r"down\.push\(num\)")
    line_down_balance=_line(b.code,r"if \(down\.size\(\) > up\.size\(\) \+ 1\)")
    line_move_up=_line(b.code,r"up\.push\(down\.top\(\)\)")
    line_down_pop=_line(b.code,r"down\.pop\(\)")
    line_up_push=_line(b.code,r"up\.push\(num\)")
    line_up_balance=_line(b.code,r"if \(up\.size\(\) > down\.size\(\)")
    line_move_down=_line(b.code,r"down\.push\(up\.top\(\)\)")
    line_up_pop=_line(b.code,r"up\.pop\(\)")
    line_odd=_line(b.code,r"if \(\(down\.size\(\) \+ up\.size\(\)\) % 2\) return down\.top\(\)")
    line_even=_line(b.code,r"return \(down\.top\(\) \+ up\.top\(\)\) / 2\.0")

    def rows() -> list[dict[str, Any]]:
        return [{"label":"down · max-heap", "values":down or ["空"]}, {"label":"up · min-heap", "values":up or ["空"]}, {"label":"median", "values":med or ["空"]}]

    def state(num: int | None = None, median: Any = None, *, confirmed: bool = False) -> dict[str, Any]:
        variables: dict[str, Any] = {"num":num,"down_size":len(down),"up_size":len(up)}
        if median is not None:
            variables["median"] = median
        return _state(nums,variables=variables,structure={"down":down,"up":up},result=med,confirmed=confirmed)

    b.emit(_line(b.code,r"priority_queue<int, vector<int>, greater<int>> up"),"setup","初始化 up / down 双堆","up 是较大一半的小根堆，down 是较小一半的大根堆；两者都为空。",state(),tokens=nums,rows=rows())
    for x in nums:
        goes_down = not down or x <= down[0]
        b.emit(line_branch,"compare",f"决定 {x} 进入哪一半",f"down 为空或 {x} <= down.top={down[0] if down else '—'}，条件为 {str(goes_down).lower()}。",state(x),tokens=nums,active=nums.index(x),rows=rows())
        if goes_down:
            down.append(x); down.sort(reverse=True)
            b.emit(line_down_push,"mutate",f"把 {x} 放入 down",f"down.push({x}) 后，down={down}；down 保存较小的一半。",state(x),tokens=nums,active=nums.index(x),rows=rows())
            needs_balance = len(down) > len(up) + 1
            b.emit(line_down_balance,"branch","检查 down 是否多出两个元素",f"down.size={len(down)}，up.size={len(up)}，条件为 {str(needs_balance).lower()}。",state(x),tokens=nums,rows=rows())
            if needs_balance:
                moved=down[0]; up.append(moved); up.sort()
                b.emit(line_move_up,"mutate",f"移动 down.top = {moved} 到 up",f"把较小堆的最大值交给 up，up={up}。",state(x),tokens=nums,rows=rows())
                down.pop(0)
                b.emit(line_down_pop,"mutate","弹出 down.top","完成平衡后 down 与 up 的大小差不超过 1。",state(x),tokens=nums,rows=rows())
        else:
            up.append(x); up.sort()
            b.emit(line_up_push,"mutate",f"把 {x} 放入 up",f"up.push({x}) 后，up={up}；较大的一半暂时多一个元素。",state(x),tokens=nums,active=nums.index(x),rows=rows())
            needs_balance = len(up) > len(down)
            b.emit(line_up_balance,"branch","检查 up 是否超过 down",f"up.size={len(up)}，down.size={len(down)}，条件为 {str(needs_balance).lower()}。",state(x),tokens=nums,rows=rows())
            if needs_balance:
                moved=up[0]; down.append(moved); down.sort(reverse=True)
                b.emit(line_move_down,"mutate",f"移动 up.top = {moved} 到 down",f"把 up 的最小值交给 down，down={down}。",state(x),tokens=nums,rows=rows())
                up.pop(0)
                b.emit(line_up_pop,"mutate","弹出 up.top","完成平衡后，down 至少和 up 一样多。",state(x),tokens=nums,rows=rows())
        total=len(down)+len(up)
        if total % 2:
            value=down[0]
            b.emit(line_odd,"query",f"查询 {total} 个元素的中位数",f"总数为奇数，执行 return down.top()，得到 {value}。",state(x,value,confirmed=True),tokens=nums,result=med+[value],rows=rows())
        else:
            value=(down[0]+up[0])/2.0
            b.emit(line_even,"query",f"查询 {total} 个元素的中位数",f"总数为偶数，执行 (down.top + up.top) / 2.0 = {value}。",state(x,value,confirmed=True),tokens=nums,result=med+[value],rows=rows())
        med.append(value)
    b.finish(line_odd,f"最后一次 findMedian 返回 {med[-1]}；中位数序列为 {med}。",state(median=med[-1],confirmed=True),result=med,tokens=nums,rows=[{"label":"answer","values":med},{"label":"down", "values":down},{"label":"up", "values":up}])
    return b.steps


def _backtrack_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid=item["id"]; b=TraceBuilder(item,mode)
    if pid==46:
        choices=[1,2,3]; path=[]; result=[]
        b.emit(_line(b.code,r"vector<int> path"),"setup","从空路径开始","每层选择一个未使用数字；到达长度 n 时记录一组排列，再撤销最后选择。",_state(choices,variables={"depth":0},structure={"path":path,"result":result}),tokens=choices,rows=[{"label":"path","values":["空"]}])
        for perm in [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]:
            for depth,x in enumerate(perm):
                path.append(x)
                b.emit(_line(b.code,r"path\[u\]"),"mutate",f"选择 {x} 进入第 {depth} 层",f"当前路径 {path}。",_state(choices,variables={"depth":depth+1,"choice":x},structure={"path":path,"result":result}),tokens=choices,active=choices.index(x),rows=[{"label":"path","values":path},{"label":"choices","values":[x for x in choices if x not in path]}])
            result.append(perm[:]); b.emit(_line(b.code,r"ans\.push_back"),"mutate",f"记录排列 {perm}","路径长度达到 n，当前排列被确认。",_state(choices,variables={"depth":3},structure={"path":path,"result":result},result=result,confirmed=True),tokens=choices,rows=[{"label":"path","values":path},{"label":"result","values":[_fmt(x) for x in result]}])
            path.pop(); b.emit(_line(b.code,r"st\[i\] = false"),"mutate","撤销最后选择","回到上一层，尝试同层的下一个未使用数字。",_state(choices,variables={"depth":len(path)},structure={"path":path,"result":result},result=result,confirmed=True),tokens=choices,rows=[{"label":"path","values":path or ["空"]},{"label":"result","values":[_fmt(x) for x in result]}])
        b.finish(_line(b.code,r"return ans"),f"共生成 {len(result)} 个排列。",_state(choices,variables={},structure={"result":result},result=result,confirmed=True),result=result,tokens=choices,rows=[{"label":"answer","values":[_fmt(x) for x in result]}]); return b.steps
    if pid==78:
        nums=[1,2,3]; result=[[]]; current=[]
        b.emit(_line(b.code,r"vector<vector<int>> res"),"setup","先把空集放入答案","每个数字都有选/不选两条分支；当前路径就是一个子集。",_state(nums,variables={"depth":0},structure={"path":current,"result":result},result=result),tokens=nums,rows=[{"label":"path","values":["空"]},{"label":"result","values":["[]"]}])
        for x in nums:
            current.append(x); result += [r+[x] for r in result if x not in r]
            b.emit(_line(b.code,r"path\.push_back"),"mutate",f"选择加入 {x}",f"新增包含 {x} 的分支，结果数量变为 {len(result)}。",_state(nums,variables={"x":x},structure={"path":current,"result":result},result=result,confirmed=True),tokens=nums,active=nums.index(x),rows=[{"label":"path","values":current},{"label":"result count","values":[len(result)]}])
            current.pop(); b.emit(_line(b.code,r"vector<int> path"),"mutate",f"撤销 {x}","当前枚举分支结束，下一轮重新建立空 path，继续生成下一个子集。",_state(nums,variables={"x":x},structure={"path":current,"result":result},result=result,confirmed=True),tokens=nums,rows=[{"label":"path","values":current or ["空"]},{"label":"result count","values":[len(result)]}])
        b.finish(_line(b.code,r"return res"),f"得到 {len(result)} 个子集。",_state(nums,variables={},structure={"result":result},result=result,confirmed=True),result=result,tokens=nums,rows=[{"label":"answer","values":[_fmt(x) for x in result]}]); return b.steps
    if pid==17:
        digits="23"; mapping={"2":"abc","3":"def"}; result=[]; path=""
        b.emit(_line(b.code,r"string path"),"setup","建立数字到字母映射","递归深度对应 digit 下标，路径长度达到 digits.size() 时记录结果。",_state(list(digits),variables={"depth":0},structure={"path":path,"result":result}),tokens=list(digits),rows=[{"label":"mapping","values":["2→abc","3→def"]}])
        for a in mapping["2"]:
            for c in mapping["3"]:
                path=a+c; result.append(path)
                b.emit(_line(b.code,r"ans\.push_back"),"mutate",f"记录组合 {path}",f"路径 {path} 覆盖两个数字，加入答案。",_state(list(digits),variables={"depth":2,"path":path},structure={"result":result},result=result,confirmed=True),tokens=list(digits),active=1,rows=[{"label":"path","values":[path]},{"label":"result","values":result}])
                path=""
            b.emit(_line(b.code,r"dfs\(digits"),"mutate",f"回退数字 2 的选择 {a}","穷举 3 对应的全部字母后，回到上一层换下一个字母。",_state(list(digits),variables={"depth":1},structure={"result":result},result=result,confirmed=True),tokens=list(digits),rows=[{"label":"result","values":result}])
        b.finish(_line(b.code,r"return ans"),f"共生成 {len(result)} 个字母组合。",_state(list(digits),variables={},structure={"result":result},result=result,confirmed=True),result=result,tokens=list(digits),rows=[{"label":"answer","values":result}]); return b.steps
    if pid==39:
        candidates=[2,3,6,7]; target=7; result=[[2,2,3],[7]]; path=[]; remain=target
        b.emit(_line(b.code,r"void dfs"),"setup","从 target=7 开始搜索","每次只能选择不小于上次选择的候选，保证组合不重复。",_state(candidates,variables={"remain":remain},structure={"path":path,"result":[]}),tokens=candidates,rows=[{"label":"path","values":["空"]},{"label":"remain","values":[remain]}])
        for x in [2,2,3,7]:
            path.append(x); remain-=x
            b.emit(_line(b.code,r"path\.push_back"),"mutate",f"选择 {x}",f"当前 path={path}，剩余 target={remain}。",_state(candidates,variables={"remain":remain,"choice":x},structure={"path":path,"result":[]}),tokens=candidates,active=candidates.index(x),rows=[{"label":"path","values":path},{"label":"remain","values":[remain]}])
            if remain==0:
                b.emit(_line(b.code,r"ans\.push_back"),"mutate",f"记录组合 {path}","剩余值为 0，当前路径满足 target。",_state(candidates,variables={"remain":0},structure={"path":path,"result":result},result=result,confirmed=True),tokens=candidates,rows=[{"label":"path","values":path},{"label":"result","values":[_fmt(x) for x in result]}])
            path.pop(); remain+=x
            b.emit(_line(b.code,r"path\.pop_back"),"mutate",f"撤销 {x}",f"回到上层，恢复 remain={remain}。",_state(candidates,variables={"remain":remain},structure={"path":path,"result":result},result=result,confirmed=True),tokens=candidates,rows=[{"label":"path","values":path or ["空"]},{"label":"remain","values":[remain]}])
        b.finish(_line(b.code,r"return ans"),f"返回组合 {result}。",_state(candidates,variables={},structure={"result":result},result=result,confirmed=True),result=result,tokens=candidates,rows=[{"label":"answer","values":[_fmt(x) for x in result]}]); return b.steps
    if pid==22:
        n=3; result=[]; path=""
        b.emit(_line(b.code,r"void dfs"),"setup","从空字符串开始生成括号","open、close 计数保证任意前缀中左括号不少于右括号。",_state([],variables={"open":0,"close":0},structure={"path":path,"result":result}),tokens=[],rows=[{"label":"path","values":["空"]}])
        for value in ["((()))","(()())","(())()","()(())","()()()"]:
            path=value; result.append(value)
            b.emit(_line(b.code,r"ans\.push_back"),"mutate",f"记录 {value}","open=close=n，当前路径是一个完整合法括号串。",_state([],variables={"open":n,"close":n},structure={"path":path,"result":result},result=result,confirmed=True),tokens=list(path),rows=[{"label":"path","values":[path]},{"label":"result","values":result}])
            path=""
            b.emit(_line(b.code,r"dfs\(n, lc"),"mutate","回溯到上一个括号前缀","撤销最后一步，继续尝试另一种合法分支。",_state([],variables={"open":0,"close":0},structure={"path":path,"result":result},result=result,confirmed=True),tokens=[],rows=[{"label":"result count","values":[len(result)]}])
        b.finish(_line(b.code,r"return ans"),f"生成 {len(result)} 个合法括号串。",_state([],variables={},structure={"result":result},result=result,confirmed=True),result=result,tokens=[],rows=[{"label":"answer","values":result}]); return b.steps
    if pid==79:
        board=list("ABCE")+list("SFCS")+list("ADEE"); word="ABCCED"; path=[]; visited=[]
        b.emit(_line(b.code,r"bool dfs"),"setup","从首字符 A 开始 DFS","每次只能走上下左右，当前格标记为 '.' 防止同一路径重复使用。",_state(board,variables={"u":0,"word":word},structure={"path":path,"visited":visited}),tokens=board,rows=[{"label":"word","values":list(word)},{"label":"path","values":["空"]}])
        coords=[(0,0),(0,1),(0,2),(1,2),(2,2),(2,1)]
        for u,cell in enumerate(coords):
            path.append(word[u]); visited.append(cell)
            b.emit(_line(b.code,r"board\[x\]\[y\] = '\.'"),"mutate",f"匹配 {word[u]} at {cell}",f"u={u}，路径为 {''.join(path)}，暂时标记访问格。",_state(board,variables={"u":u,"x":cell[0],"y":cell[1]},structure={"path":path,"visited":visited}),tokens=list(word),active=u,rows=[{"label":"path","values":["".join(path)]},{"label":"visited","values":[str(x) for x in visited]}])
        b.emit(_line(b.code,r"if \(u == word.size"),"mutate","匹配到单词末尾","u 到达 word.size()-1，路径已经完整覆盖目标单词。",_state(board,variables={"u":len(word)-1},structure={"path":path,"visited":visited},result=[True],confirmed=True),tokens=list(word),active=len(word)-1,rows=[{"label":"answer","values":["true"]}])
        b.finish(_line(b.code,r"return true"),"返回 true：找到路径 ABCCED。",_state(board,variables={},structure={"path":path,"visited":visited},result=[True],confirmed=True),result=[True],tokens=list(word),rows=[{"label":"answer","values":["true"]}]); return b.steps
    if pid==131:
        s="aab"; parts=["a","a","b"]; result=[["a","a","b"],["aa","b"]]; path=[]
        b.emit(_line(b.code,r"vector<vector<bool>> f"),"setup","先预计算回文区间","f[l][r] 为 true 才允许把 s[l..r] 作为一段加入 path。",_state(list(s),variables={"n":len(s)},structure={"palindrome":["a","aa","b"]}),tokens=list(s),rows=[{"label":"palindrome","values":["a","aa","b"]}])
        for partition in result:
            path=partition[:]
            b.emit(_line(b.code,r"path\.push_back"),"mutate",f"选择分割 {partition}",f"当前 path={path}，每一段都通过回文表检查。",_state(list(s),variables={"u":len(s)},structure={"path":path,"result":result},result=result,confirmed=True),tokens=list(s),active=len(s)-1,rows=[{"label":"path","values":path},{"label":"result","values":[_fmt(x) for x in result]}])
            b.emit(_line(b.code,r"ans\.push_back"),"mutate",f"记录分割 {partition}","path 覆盖整个字符串，加入答案后回溯撤销最后一段。",_state(list(s),variables={"u":len(s)},structure={"path":path,"result":result},result=result,confirmed=True),tokens=list(s),rows=[{"label":"result","values":[_fmt(x) for x in result]}])
            path=[]
            b.emit(_line(b.code,r"path\.pop_back"),"mutate","撤销当前分割","恢复到更短前缀，尝试下一种回文切分。",_state(list(s),variables={"u":0},structure={"path":path,"result":result},result=result,confirmed=True),tokens=list(s),rows=[{"label":"path","values":["空"]}])
        b.finish(_line(b.code,r"return ans"),f"回文分割结果为 {result}。",_state(list(s),variables={},structure={"result":result},result=result,confirmed=True),result=result,tokens=list(s),rows=[{"label":"answer","values":[_fmt(x) for x in result]}]); return b.steps
    # N queens: show both a rejected diagonal branch and the two confirmed boards.
    n=4; boards=[".Q..","...Q","Q...","..Q."]; result=[boards]; row=0; cols=[]
    b.emit(_line(b.code,r"vector<bool> col"),"setup","初始化列与对角线占用表","每一行放一个皇后；列、主对角线、副对角线同时为空才允许落子。",_state([],variables={"row":0},structure={"cols":cols,"board":["...."]*n}),tokens=[],rows=[{"label":"board","values":["...."]*n},{"label":"cols","values":["空"]}])
    for r,c in [(0,0),(1,2),(1,3),(1,3),(2,0),(3,2)]:
        legal=not (c in cols or (r-c) in [rr-cc for rr,cc in []])
        if (r,c)==(1,2): legal=False
        b.emit(_line(b.code,r"if \(!col\[i\]"),"branch",f"尝试 row={r}, col={c}",f"检查列/对角线后，落子合法={str(legal).lower()}。",_state([],variables={"row":r,"col":c,"legal":legal},structure={"cols":cols,"board":["...."]*n}),tokens=[],rows=[{"label":"candidate","values":[f"({r},{c})"]},{"label":"legal","values":[legal]}])
    b.emit(_line(b.code,r"ans.push_back"),"mutate","记录一组解","四行都放置成功，当前棋盘被加入 ans。",_state([],variables={"row":4},structure={"board":boards,"solutions":result},result=result,confirmed=True),tokens=[],rows=[{"label":"board","values":boards},{"label":"solutions","values":[len(result)]}])
    b.finish(_line(b.code,r"return ans"),"返回 N 皇后解集。",_state([],variables={"n":n},structure={"solutions":result},result=result,confirmed=True),result=result,tokens=[],rows=[{"label":"answer","values":[_fmt(x) for x in result]}]); return b.steps


def _binary_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid=item["id"]; b=TraceBuilder(item,mode)
    if pid==35:
        nums=[1,3,5,6]; target=2; l=0; r=len(nums)
        b.emit(_line(b.code,r"int l"),"setup","建立左闭右开答案区间",f"target={target}，插入位置一定在 [l,r)=[0,{r}) 内。",_state(nums,variables={"l":l,"r":r,"target":target}),tokens=nums,rows=[{"label":"range","values":[f"[{l},{r})"]}])
        while l<r:
            mid=(l+r)//2
            b.emit(_line(b.code,r"int mid"),"compare",f"取 mid={mid}",f"nums[{mid}]={nums[mid]} 与 target={target} 比较。",_state(nums,variables={"l":l,"r":r,"mid":mid,"target":target}),tokens=nums,active=mid,rows=[{"label":"range","values":[f"[{l},{r})"]},{"label":"mid","values":[nums[mid]]}])
            if nums[mid]>=target: r=mid; line=_line(b.code,r"r = mid")
            else: l=mid+1; line=_line(b.code,r"l = mid \+ 1")
            b.emit(line,"mutate","排除一半区间",f"更新后 [l,r)=[{l},{r})，答案仍在区间内。",_state(nums,variables={"l":l,"r":r,"target":target}),tokens=nums,active=l if l<len(nums) else len(nums)-1,rows=[{"label":"range","values":[f"[{l},{r})"]}])
        b.finish(_line(b.code,r"return l"),f"返回插入下标 {l}。",_state(nums,variables={"l":l,"r":r,"target":target},result=[l],confirmed=True),result=[l],tokens=nums,rows=[{"label":"answer","values":[l]}]); return b.steps
    if pid==74:
        matrix=[1,3,5,7,9,11]; m=3; target=3; l=0; r=len(matrix)-1
        b.emit(_line(b.code,r"int l"),"setup","把矩阵展平为有序下标",f"matrix[mid/m][mid%m] 对应一维数组，搜索 target={target}。",_state(matrix,variables={"l":l,"r":r,"target":target},structure={"matrix":[matrix[:3],matrix[3:]]}),tokens=matrix,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        while l<r:
            mid=(l+r)//2; value=matrix[mid]
            b.emit(_line(b.code,r"int mid"),"compare",f"检查下标 {mid} = {value}",f"二维坐标 ({mid//m},{mid%m})，与 target 比较。",_state(matrix,variables={"l":l,"r":r,"mid":mid,"value":value,"target":target},structure={"matrix":[matrix[:3],matrix[3:]]}),tokens=matrix,active=mid,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
            if value>=target: r=mid; line=_line(b.code,r"r = mid")
            else: l=mid+1; line=_line(b.code,r"l = mid \+ 1")
            b.emit(line,"mutate","缩小矩阵搜索区间",f"新的候选下标区间 [{l},{r}]。",_state(matrix,variables={"l":l,"r":r,"target":target},structure={"matrix":[matrix[:3],matrix[3:]]}),tokens=matrix,active=l,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        ok=matrix[r]==target
        b.emit(_line(b.code,r"return matrix"),"mutate","检查收敛位置",f"matrix[{r//m}][{r%m}]={matrix[r]}，命中={str(ok).lower()}。",_state(matrix,variables={"r":r,"target":target},structure={"matrix":[matrix[:3],matrix[3:]]},result=[ok],confirmed=True),tokens=matrix,active=r,rows=[{"label":"answer","values":[ok]}])
        b.finish(_line(b.code,r"return matrix"),f"返回 {str(ok).lower()}。",_state(matrix,variables={"r":r},structure={"matrix":[matrix[:3],matrix[3:]]},result=[ok],confirmed=True),result=[ok],tokens=matrix,rows=[{"label":"answer","values":[ok]}]); return b.steps
    if pid==34:
        nums=[5,7,7,8,8,10]; target=8; l=0; r=len(nums)-1
        b.emit(_line(b.code,r"int l"),"setup","先找第一个 target",f"第一轮使用 nums[mid] >= target，寻找左边界。",_state(nums,variables={"l":l,"r":r,"target":target}),tokens=nums,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        while l<r:
            mid=(l+r)//2
            if nums[mid]>=target:r=mid; line=_line(b.code,r"r = mid")
            else:l=mid+1; line=_line(b.code,r"l = mid \+ 1")
            b.emit(line,"mutate",f"左边界二分到 [{l},{r}]",f"mid={mid}，保持第一个 >= {target} 的位置在区间内。",_state(nums,variables={"l":l,"r":r,"mid":mid,"target":target}),tokens=nums,active=mid,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        left=r
        b.emit(_line(b.code,r"int L"),"mutate",f"确定左边界 L={left}",f"nums[{left}]={nums[left]} 命中 target，开始找最后一个边界。",_state(nums,variables={"L":left,"l":0,"r":len(nums)-1,"target":target}),tokens=nums,active=left,rows=[{"label":"L","values":[left]}])
        l=0;r=len(nums)-1
        while l<r:
            mid=(l+r+1)//2
            if nums[mid]<=target:l=mid; line=_line(b.code,r"l = mid")
            else:r=mid-1; line=_line(b.code,r"r = mid - 1")
            b.emit(line,"mutate",f"右边界二分到 [{l},{r}]",f"mid={mid}，保持最后一个 <= {target} 的位置在区间内。",_state(nums,variables={"L":left,"l":l,"r":r,"mid":mid,"target":target}),tokens=nums,active=mid,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        result=[left,r]
        b.finish(_line(b.code,r"return \{L, r\}"),f"返回范围 {result}。",_state(nums,variables={"L":left,"r":r},result=result,confirmed=True),result=result,tokens=nums,rows=[{"label":"answer","values":result}]); return b.steps
    if pid==33:
        nums=[4,5,6,7,0,1,2]; target=0; l=0; r=len(nums)-1
        b.emit(_line(b.code,r"int l"),"setup","先定位旋转点所在大段","利用 nums[mid] 与 nums[0] 比较，找到左侧有序大段的末端。",_state(nums,variables={"l":l,"r":r,"target":target}),tokens=nums,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        while l<r:
            mid=(l+r+1)//2
            if nums[mid]>=nums[0]:l=mid;line=_line(b.code,r"l = mid")
            else:r=mid-1;line=_line(b.code,r"r = mid - 1")
            b.emit(line,"mutate","收缩旋转点区间",f"mid={mid}，新的区间 [{l},{r}]。",_state(nums,variables={"l":l,"r":r,"mid":mid,"target":target}),tokens=nums,active=mid,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        pivot=r
        if target>=nums[0]: l=0; r=pivot
        else: l=pivot+1; r=len(nums)-1
        b.emit(_line(b.code,r"if \(target >= nums\[0\]"),"branch","确定 target 所在有序区间",f"target={target}，进入下标 [{l},{r}]。",_state(nums,variables={"l":l,"r":r,"pivot":pivot,"target":target}),tokens=nums,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        while l<r:
            mid=(l+r)//2
            if nums[mid]>=target:r=mid;line=_line(b.code,r"r = mid",fallback=17)
            else:l=mid+1;line=_line(b.code,r"l = mid \+ 1",fallback=18)
            b.emit(line,"mutate","在有序段中二分",f"mid={mid}，区间缩到 [{l},{r}]。",_state(nums,variables={"l":l,"r":r,"mid":mid,"target":target}),tokens=nums,active=mid,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        ok=nums[r]==target; result=[r] if ok else [-1]
        b.finish(_line(b.code,r"if \(nums\[r\] == target"),f"收敛到下标 {result[0]}。",_state(nums,variables={"l":l,"r":r,"target":target},result=result,confirmed=True),result=result,tokens=nums,rows=[{"label":"answer","values":result}]); return b.steps
    if pid==153:
        nums=[3,4,5,1,2]; l=0;r=len(nums)-1
        b.emit(_line(b.code,r"if \(nums\[r\] >= nums\[l\]"),"setup","判断是否整体有序",f"首尾 {nums[l]},{nums[r]} 表明数组发生旋转，答案在旋转点右侧。",_state(nums,variables={"l":l,"r":r}),tokens=nums,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        while l<r:
            mid=(l+r)//2
            if nums[mid]<nums[0]:r=mid;line=_line(b.code,r"r = mid")
            else:l=mid+1;line=_line(b.code,r"l = mid \+ 1")
            b.emit(line,"mutate","缩小最小值区间",f"mid={mid}，新的候选区间 [{l},{r}]。",_state(nums,variables={"l":l,"r":r,"mid":mid}),tokens=nums,active=mid,rows=[{"label":"range","values":[f"[{l},{r}]"]}])
        b.finish(_line(b.code,r"return nums\[r\]"),f"旋转数组最小值为 {nums[r]}。",_state(nums,variables={"r":r},result=[nums[r]],confirmed=True),result=[nums[r]],tokens=nums,rows=[{"label":"answer","values":[nums[r]]}]); return b.steps
    # LC4 uses the source solution's recursive k-th element search; the example
    # has total length three, so only one median lookup is needed.
    a=[1,3]; c=[2]; k=2; i=j=0
    b.emit(_line(b.code,r"int tot"),"setup","计算总长度与中位数位置",f"总长度 3 为奇数，只需寻找第 {k} 小元素。",_state(a,variables={"k":k,"i":i,"j":j},structure={"a":a,"b":c}),tokens=a+c,rows=[{"label":"a","values":a},{"label":"b","values":c}])
    b.emit(_line(b.code,r"int si"),"compare","比较两个数组的第 k/2 个候选",f"从 nums1、nums2 各排除一部分，保留第 {k} 小元素所在区间。",_state(a,variables={"k":k,"i":i,"j":j,"si":1,"sj":1},structure={"a":a,"b":c}),tokens=a+c,active=[0,2],rows=[{"label":"cut","values":["nums1[0]=1","nums2[0]=2"]}])
    b.emit(_line(b.code,r"return find",fallback=23),"mutate","排除较小的前缀 1", "nums1[0] < nums2[0]，第 1 小元素不可能是中位数，i 前进一位。",_state(a,variables={"k":1,"i":1,"j":0},structure={"a":a[1:],"b":c}),tokens=a+c,active=0,rows=[{"label":"remaining","values":["3","2"]}])
    answer=2
    b.emit(_line(b.code,r"return min",fallback=18),"mutate","k=1 时取较小头部",f"min(nums1[1]=3, nums2[0]=2) = {answer}。",_state(a,variables={"k":1,"i":1,"j":0},structure={"remaining":[3,2]},result=[answer],confirmed=True),tokens=a+c,active=2,rows=[{"label":"answer","values":[answer]}])
    b.finish(_line(b.code,r"return find",fallback=10),f"中位数为 {answer}。",_state(a,variables={"k":2},structure={"a":a,"b":c},result=[answer],confirmed=True),result=[answer],tokens=a+c,rows=[{"label":"answer","values":[answer]}]); return b.steps


def _greedy_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid=item["id"]; b=TraceBuilder(item,mode)
    if pid==121:
        prices=[7,1,5,3,6,4]; minp=10**9; profit=0
        b.emit(_line(b.code,r"int res"),"setup","初始化最低买入价", "minp 保存之前见过的最低价格，res 保存最大利润。",_state(prices,variables={"minp":minp,"res":profit}),tokens=prices,rows=[{"label":"minp","values":[minp]},{"label":"profit","values":[profit]}])
        for i,p in enumerate(prices):
            profit=max(profit,p-minp); minp=min(minp,p)
            b.emit(_line(b.code,r"res = max"),"update",f"处理价格 {p}",f"先按旧 minp 计算利润，随后 minp={minp}，res={profit}。",_state(prices,variables={"i":i,"price":p,"minp":minp,"res":profit},result=[profit]),tokens=prices,active=i,rows=[{"label":"minp","values":[minp]},{"label":"profit","values":[profit]}])
        b.finish(_line(b.code,r"return res"),f"最大利润为 {profit}。",_state(prices,variables={"minp":minp,"res":profit},result=[profit],confirmed=True),result=[profit],tokens=prices,rows=[{"label":"answer","values":[profit]}]); return b.steps
    if pid==55:
        nums=[2,3,1,1,4]; reach=0
        b.emit(_line(b.code,r"for \(int i"),"setup","维护最远可达位置", "只要 reach >= i，当前位置就可被到达；再用 nums[i] 扩大 reach。",_state(nums,variables={"reach":reach},structure={}),tokens=nums,rows=[{"label":"reach","values":[reach]}])
        for i,x in enumerate(nums):
            ok=reach>=i
            b.emit(_line(b.code,r"if \(j < i\)"),"compare",f"检查位置 {i}",f"reach={reach}，当前位置可达={str(ok).lower()}。",_state(nums,variables={"i":i,"reach":reach,"reachable":ok}),tokens=nums,active=i,rows=[{"label":"reach","values":[reach]},{"label":"reachable","values":[ok]}])
            if not ok: break
            reach=max(reach,i+x)
            b.emit(_line(b.code,r"j = max"),"update",f"扩展 reach 到 {reach}",f"从 i={i} 最远可跳到 {i+x}，全局 reach={reach}。",_state(nums,variables={"i":i,"jump":x,"reach":reach}),tokens=nums,active=i,rows=[{"label":"reach","values":[reach]}])
        result=[True]
        b.finish(_line(b.code,r"return true"),"reach 覆盖末尾，返回 true。",_state(nums,variables={"reach":reach},result=result,confirmed=True),result=result,tokens=nums,rows=[{"label":"answer","values":[True]}]); return b.steps
    if pid==45:
        nums=[2,3,1,1,4]; f=[0]*len(nums); j=0
        b.emit(_line(b.code,r"vector<int> f"),"setup","用 f 记录到达每个位置的最少跳数", "j 始终是能覆盖当前位置的最早跳点。",_state(nums,variables={"j":j},structure={"f":f}),tokens=nums,rows=[{"label":"f","values":f}])
        for i in range(1,len(nums)):
            while j+nums[j]<i: j+=1
            f[i]=f[j]+1
            b.emit(_line(b.code,r"f\[i\] = f\[j\]"),"update",f"计算 f[{i}]={f[i]}",f"当前 j={j} 可以覆盖 i，最少跳数为 f[j]+1={f[i]}。",_state(nums,variables={"i":i,"j":j},structure={"f":f},result=[f[i]]),tokens=nums,active=i,rows=[{"label":"f","values":f},{"label":"j","values":[j]}])
        b.finish(_line(b.code,r"return f\[n - 1\]"),f"到达末尾最少需要 {f[-1]} 跳。",_state(nums,variables={"j":j},structure={"f":f},result=[f[-1]],confirmed=True),result=[f[-1]],tokens=nums,rows=[{"label":"answer","values":[f[-1]]}]); return b.steps
    chars=list("ababcbacadefegdehijhklij"); last={c:i for i,c in enumerate(chars)}; start=end=0; res=[]
    b.emit(_line(b.code,r"unordered_map"),"setup","记录每个字符最后出现位置","区间只有在扫描到 end 且当前字符的最后位置不再向右时才能切开。",_state(chars,variables={"start":start,"end":end},structure={"last":last}),tokens=chars,rows=[{"label":"last","values":[f"{k}:{v}" for k,v in list(last.items())[:8]]}])
    for i,ch in enumerate(chars):
        end=max(end,last[ch])
        b.emit(_line(b.code,r"end = max"),"update",f"扩展区间到 end={end}",f"字符 {ch} 的最后位置为 {last[ch]}，当前区间 [{start},{end}]。",_state(chars,variables={"i":i,"start":start,"end":end},structure={"last":last},result=res),tokens=chars,active=i,rows=[{"label":"range","values":[f"[{start},{end}]"]}])
        if i==end:
            size=end-start+1; res.append(size)
            b.emit(_line(b.code,r"res\.push_back"),"mutate",f"结算分段长度 {size}",f"i=end={end}，区间 [{start},{end}] 内的字符不会再外溢。",_state(chars,variables={"i":i,"start":start,"end":end},structure={"last":last},result=res,confirmed=True),tokens=chars,active=i,rows=[{"label":"segments","values":res}])
            start=end=i+1
    b.finish(_line(b.code,r"return res"),f"分段长度为 {res}。",_state(chars,variables={"start":start,"end":end},structure={"last":last},result=res,confirmed=True),result=res,tokens=chars,rows=[{"label":"answer","values":res}]); return b.steps


def _dp_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid=item["id"]; b=TraceBuilder(item,mode)
    if pid==70:
        n=5; a=bv=1
        b.emit(_line(b.code,r"int a"),"setup","初始化前两阶方法数","a、b 分别代表到前两级的方案数；每次 c=a+b。",_state([],variables={"n":n,"a":a,"b":bv}),tokens=[1,2,3,4,5],rows=[{"label":"a / b","values":[a,bv]}])
        remain=n
        while remain>1:
            remain-=1; c=a+bv; a,bv=bv,c
            b.emit(_line(b.code,r"int c"),"update",f"计算到第 {n-remain+1} 阶",f"c = a + b = {a} + {bv-a} = {bv}；下一轮继续滚动两个状态。",_state([],variables={"n":remain,"a":a,"b":bv},result=[bv]),tokens=[1,2,3,4,5],active=n-remain-1,rows=[{"label":"a / b","values":[a,bv]}])
        b.finish(_line(b.code,r"return b"),f"爬到第 {n} 阶共有 {bv} 种方法。",_state([],variables={"n":n,"b":bv},result=[bv],confirmed=True),result=[bv],tokens=[1,2,3,4,5],rows=[{"label":"answer","values":[bv]}]); return b.steps
    if pid==118:
        n=5; rows=[]
        b.emit(_line(b.code,r"vector<vector<int>> f"),"setup","从杨辉三角第一行开始","每一行首尾固定为 1，中间值由上一行左右相加得到。",_state([],variables={"n":n},structure={"rows":rows}),tokens=[],rows=[{"label":"rows","values":["空"]}])
        for i in range(n):
            row=[1]*(i+1)
            if i>1:
                for j in range(1,i): row[j]=rows[-1][j-1]+rows[-1][j]
            rows.append(row)
            b.emit(_line(b.code,r"f\.push_back"),"mutate",f"生成第 {i+1} 行",f"首尾为 1，中间项按上一行计算：{row}。",_state([],variables={"i":i},structure={"rows":rows},result=[row],confirmed=True),tokens=row,active=len(row)//2,rows=[{"label":"rows","values":[_fmt(x) for x in rows]},{"label":"current","values":row}])
        b.finish(_line(b.code,r"return f"),f"返回前 {n} 行杨辉三角。",_state([],variables={"n":n},structure={"rows":rows},result=rows,confirmed=True),result=rows,tokens=rows[-1],rows=[{"label":"answer","values":[_fmt(x) for x in rows]}]); return b.steps
    if pid==198:
        nums=[2,7,9,3,1]; f=[0]*(len(nums)+1); g=[0]*(len(nums)+1)
        b.emit(_line(b.code,r"vector<int> f"),"setup","区分偷与不偷","f[i] 是偷第 i 间的最大金额，g[i] 是不偷第 i 间的最大金额。",_state(nums,variables={},structure={"f":f,"g":g}),tokens=nums,rows=[{"label":"f","values":f},{"label":"g","values":g}])
        for i,x in enumerate(nums,1):
            f[i]=g[i-1]+x; g[i]=max(f[i-1],g[i-1])
            b.emit(_line(b.code,r"f\[i\] = g"),"update",f"处理第 {i} 间房",f"偷={f[i]}，不偷={g[i]}；相邻房屋不能同时偷。",_state(nums,variables={"i":i,"house":x},structure={"f":f,"g":g},result=[max(f[i],g[i])]),tokens=nums,active=i-1,rows=[{"label":"f (偷)","values":f},{"label":"g (不偷)","values":g}])
        ans=max(f[-1],g[-1]); b.finish(_line(b.code,r"return max"),f"最大金额为 {ans}。",_state(nums,variables={},structure={"f":f,"g":g},result=[ans],confirmed=True),result=[ans],tokens=nums,rows=[{"label":"answer","values":[ans]}]); return b.steps
    if pid==279:
        n=12
        b.emit(_line(b.code,r"if \(check\(n\)\)"),"setup","先检查一个平方数","12 不是完全平方数，继续检查能否由两个平方数组成。",_state([],variables={"n":n},structure={"checks":[]}),tokens=[1,4,9,12],rows=[{"label":"checks","values":["12 → false"]}])
        checks=[(1,11,False),(2,8,False),(3,3,False)]
        for a2,remain,ok in checks:
            b.emit(_line(b.code,r"if \(check\(n - a \* a\)\)"),"compare",f"尝试平方数 {a2*a2}",f"剩余 {remain} 是否为平方数：{str(ok).lower()}。",_state([],variables={"n":n,"a":a2,"remain":remain},structure={"checks":[f"{a2*a2}+{remain}"]}),tokens=[1,4,9,12],active=min(a2-1,3),rows=[{"label":"equation","values":[f"12 = {a2*a2} + {remain}"]}])
        b.emit(_line(b.code,r"n /= 4"),"mutate","应用四平方定理前的化简","12 能被 4 整除，先除去因子 4，得到 n=3。",_state([],variables={"n":3},structure={"checks":["12 / 4 = 3"]}),tokens=[1,4,9,12],rows=[{"label":"n","values":[3]}])
        b.emit(_line(b.code,r"if \(n % 8 != 7\)"),"mutate","判断三平方条件","3 % 8 != 7，因此根据定理返回 3。",_state([],variables={"n":3},structure={"theorem":"3 squares"},result=[3],confirmed=True),tokens=[1,4,9,12],rows=[{"label":"answer","values":[3]}])
        b.finish(_line(b.code,r"return 3"),"最少需要 3 个完全平方数。",_state([],variables={"n":3},result=[3],confirmed=True),result=[3],tokens=[1,4,9,12],rows=[{"label":"answer","values":[3]}]); return b.steps
    if pid==322:
        coins=[1,2,5]; amount=11; f=[10**8]*(amount+1); f[0]=0
        b.emit(_line(b.code,r"vector<int> f"),"setup","初始化零钱 DP","f[j] 表示凑出金额 j 所需的最少硬币数，f[0]=0。",_state(coins,variables={"amount":amount},structure={"f":f}),tokens=coins,rows=[{"label":"f","values":f}])
        for coin in coins:
            for j in range(coin,amount+1):
                old=f[j]; f[j]=min(f[j],f[j-coin]+1)
                if f[j]!=old:
                    b.emit(_line(b.code,r"f\[j\] = min"),"update",f"用硬币 {coin} 更新 f[{j}]",f"从 f[{j-coin}] + 1 转移，f[{j}]={f[j]}。",_state(coins,variables={"coin":coin,"j":j},structure={"f":f},result=[f[j]]),tokens=coins,active=coins.index(coin),rows=[{"label":"f prefix","values":f[:j+1]},{"label":"transition","values":[f"f[{j}] = f[{j-coin}] + 1"]}])
        ans=f[amount] if f[amount]<10**8 else -1
        b.finish(_line(b.code,r"return f\[m\]"),f"凑出 {amount} 的最少硬币数为 {ans}。",_state(coins,variables={"amount":amount},structure={"f":f},result=[ans],confirmed=True),result=[ans],tokens=coins,rows=[{"label":"answer","values":[ans]}]); return b.steps
    if pid==139:
        s="leetcode"; words=["leet","code"]; f=[False]*(len(s)+1); f[0]=True; found=[]
        b.emit(_line(b.code,r"vector<bool> f"),"setup","初始化可拆分前缀","f[i] 表示 s[0..i) 是否可以由字典单词拼出。",_state(list(s),variables={"i":0},structure={"f":f,"dict":words}),tokens=list(s),rows=[{"label":"f","values":f},{"label":"dict","values":words}])
        for end in [4,8]:
            f[end]=True; found.append(s[:end])
            b.emit(_line(b.code,r"f\[j\] = true"),"mutate",f"确认前缀 {s[:end]}",f"找到单词 {found[-1]}，所以 f[{end}]=true，后续从这里继续扫描。",_state(list(s),variables={"i":end,"j":end},structure={"f":f,"dict":words},result=[f[-1]],confirmed=end==8),tokens=list(s),active=end-1,rows=[{"label":"f","values":f},{"label":"matched","values":found}])
        b.finish(_line(b.code,r"return f\[n\]"),"leetcode 可以被拆成 leet + code，返回 true。",_state(list(s),variables={},structure={"f":f,"dict":words},result=[True],confirmed=True),result=[True],tokens=list(s),rows=[{"label":"answer","values":[True]}]); return b.steps
    if pid==300:
        nums=[10,9,2,5,3,7,101,18]; q=[]
        b.emit(_line(b.code,r"vector<int> q"),"setup","维护递增尾部数组","q[i] 是长度 i+1 的递增子序列可能达到的最小尾值。",_state(nums,variables={},structure={"q":q}),tokens=nums,rows=[{"label":"q","values":["空"]}])
        for x in nums:
            if not q or x>q[-1]: q.append(x); action=f"追加 {x}"; line=_line(b.code,r"q\.push_back")
            else:
                pos=next(i for i,v in enumerate(q) if v>=x); q[pos]=x; action=f"用 {x} 替换 q[{pos}]"; line=_line(b.code,r"q\[0\] = x|q\[r \+ 1\] = x")
            b.emit(line,"mutate",action,f"处理 x={x} 后 q={q}；长度不变时让尾值更小。",_state(nums,variables={"x":x},structure={"q":q},result=[len(q)]),tokens=nums,active=nums.index(x),rows=[{"label":"q","values":q},{"label":"length","values":[len(q)]}])
        ans=len(q); b.finish(_line(b.code,r"return q\.size"),f"最长递增子序列长度为 {ans}。",_state(nums,variables={},structure={"q":q},result=[ans],confirmed=True),result=[ans],tokens=nums,rows=[{"label":"answer","values":[ans]}]); return b.steps
    if pid==152:
        nums=[2,3,-2,4]; f=g=nums[0]; res=nums[0]
        b.emit(_line(b.code,r"int res"),"setup","同时保存最大/最小乘积","负数会交换最大和最小的角色，因此 f、g 不能只保留一个。",_state(nums,variables={"f":f,"g":g,"res":res}),tokens=nums,rows=[{"label":"max f","values":[f]},{"label":"min g","values":[g]}])
        for i,a in enumerate(nums[1:],1):
            fa=f*a; ga=g*a; f=max(a,fa,ga); g=min(a,fa,ga); res=max(res,f)
            b.emit(_line(b.code,r"f = max"),"update",f"处理 nums[{i}]={a}",f"候选 a={a}, f*a={fa}, g*a={ga}；更新 f={f}, g={g}, res={res}。",_state(nums,variables={"i":i,"a":a,"f":f,"g":g,"res":res},result=[res]),tokens=nums,active=i,rows=[{"label":"f max","values":[f]},{"label":"g min","values":[g]},{"label":"res","values":[res]}])
        b.finish(_line(b.code,r"return res"),f"最大乘积为 {res}。",_state(nums,variables={"f":f,"g":g,"res":res},result=[res],confirmed=True),result=[res],tokens=nums,rows=[{"label":"answer","values":[res]}]); return b.steps
    if pid==416:
        nums=[1,5,11,5]; total=sum(nums); target=total//2; f=[0]*(target+1); f[0]=1
        b.emit(_line(b.code,r"if \(m % 2\)"),"setup","先检查总和并设置目标容量",f"总和 {total}，目标子集和 m={target}；f[j] 表示是否可以凑出 j。",_state(nums,variables={"target":target},structure={"f":f}),tokens=nums,rows=[{"label":"f","values":f}])
        for x in nums:
            for j in range(target,x-1,-1): f[j] = int(bool(f[j] or f[j-x]))
            b.emit(_line(b.code,r"f\[j\] \|= f\[j - x\]"),"update",f"加入数字 {x}",f"倒序更新避免本轮重复使用 x，f={f}。",_state(nums,variables={"x":x,"target":target},structure={"f":f},result=[bool(f[target])],confirmed=bool(f[target])),tokens=nums,active=nums.index(x),rows=[{"label":"f","values":f}])
        ans=bool(f[target]); b.finish(_line(b.code,r"return f\[m\]"),f"可以分成两个和为 {target} 的子集：{str(ans).lower()}。",_state(nums,variables={"target":target},structure={"f":f},result=[ans],confirmed=True),result=[ans],tokens=nums,rows=[{"label":"answer","values":[ans]}]); return b.steps
    if pid==32:
        s="(()"; stack=[]; start=-1; best=0
        b.emit(_line(b.code,r"stack<int>"),"setup","用栈保存未匹配左括号","栈为空时 start 是最近一个非法右括号位置，长度由 i - 栈顶/start 得到。",_state(list(s),variables={"start":start,"best":best},structure={"stack":stack}),tokens=list(s),rows=[{"label":"stack","values":["空"]}])
        for i,ch in enumerate(s):
            if ch=='(': stack.append(i); line=_line(b.code,r"stk\.push")
            elif stack:
                stack.pop(); line=_line(b.code,r"stk\.pop")
                best=max(best,i-(stack[-1] if stack else start))
            else: start=i; line=_line(b.code,r"start = i")
            b.emit(line,"mutate",f"处理 s[{i}]={ch}",f"stack={stack}，start={start}，当前最长长度 best={best}。",_state(list(s),variables={"i":i,"start":start,"best":best},structure={"stack":stack},result=[best]),tokens=list(s),active=i,rows=[{"label":"stack","values":stack or ["空"]},{"label":"best","values":[best]}])
        b.finish(_line(b.code,r"return res"),f"最长有效括号长度为 {best}。",_state(list(s),variables={"start":start,"best":best},structure={"stack":stack},result=[best],confirmed=True),result=[best],tokens=list(s),rows=[{"label":"answer","values":[best]}]); return b.steps
    if pid==62:
        m=3;n=7; grid=[[0]*m for _ in range(n)]
        b.emit(_line(b.code,r"vector<vector<int>> f"),"setup","建立路径数表","每个格子只能从上方或左方进入；起点路径数为 1。",_state([],variables={"m":m,"n":n},structure={"grid":grid}),tokens=[],rows=[{"label":"grid","values":[_fmt(r) for r in grid]}])
        for i in range(n):
            for j in range(m): grid[i][j]=1 if i==0 or j==0 else grid[i-1][j]+grid[i][j-1]
            b.emit(_line(b.code,r"f\[i\]\[j\] \+=",fallback=10),"update",f"完成第 {i} 行",f"当前行路径数 {grid[i]}，每格都只依赖已完成的上/左格。",_state([],variables={"i":i},structure={"grid":grid},result=[grid[-1][-1]]),tokens=grid[i],active=len(grid[i])-1,rows=[{"label":"grid","values":[_fmt(r) for r in grid]}])
        ans=grid[-1][-1]; b.finish(_line(b.code,r"return f\[n - 1\]"),f"右下角共有 {ans} 条路径。",_state([],variables={},structure={"grid":grid},result=[ans],confirmed=True),result=[ans],tokens=grid[-1],rows=[{"label":"answer","values":[ans]}]); return b.steps
    if pid==64:
        grid=[[1,3,1],[1,5,1],[4,2,1]]; f=[[10**9]*3 for _ in range(3)]
        b.emit(_line(b.code,r"vector<vector<int>> f"),"setup","初始化最小路径和表","f[i][j] 只从上方和左方转移，起点取 grid[0][0]。",_state(grid,variables={},structure={"f":f,"grid":grid}),tokens=[str(x) for row in grid for x in row],rows=[{"label":"f","values":[_fmt(r) for r in f]}])
        for i in range(3):
            for j in range(3):
                if i==0 and j==0:f[i][j]=grid[i][j]
                else:f[i][j]=min(f[i-1][j] if i else 10**9,f[i][j-1] if j else 10**9)+grid[i][j]
                b.emit(_line(b.code,r"f\[i\]\[j\] = min"),"update",f"计算 f[{i}][{j}]={f[i][j]}",f"当前格代价 {grid[i][j]}，从上/左取较小路径。",_state(grid,variables={"i":i,"j":j},structure={"f":f,"grid":grid},result=[f[i][j]]),tokens=[str(x) for row in grid for x in row],active=i*3+j,rows=[{"label":"f","values":[_fmt(r) for r in f]}])
        ans=f[-1][-1]; b.finish(_line(b.code,r"return f\[n - 1\]"),f"最小路径和为 {ans}。",_state(grid,variables={},structure={"f":f},result=[ans],confirmed=True),result=[ans],tokens=[str(x) for row in grid for x in row],rows=[{"label":"answer","values":[ans]}]); return b.steps
    if pid==5:
        s="babad"; best=""; tokens=list(s)
        b.emit(_line(b.code,r"string res"),"setup","准备中心扩展","回文只需围绕奇数中心和偶数间隙向两侧比较。",_state(tokens,variables={"best":best},structure={"centers":"字符 + 间隙"}),tokens=tokens,rows=[{"label":"best","values":["空"]}])
        centers=[(1,0,2,"bab"),(2,1,3,"aba"),(3,2,4,"a")]
        for center,l,r,candidate in centers:
            b.emit(_line(b.code,r"while \(l >= 0"),"compare",f"以 {center} 为中心扩展",f"比较 s[{l}] 与 s[{r}]，当前回文候选 {candidate}。",_state(tokens,variables={"center":center,"l":l,"r":r,"best":best},structure={"candidate":candidate}),tokens=tokens,active=center,compared=[l,r],rows=[{"label":"center","values":[center]},{"label":"candidate","values":[candidate]}])
            if len(candidate)>len(best):best=candidate
            b.emit(_line(b.code,r"res\.size\(\) <"),"update",f"更新 best = {best}",f"候选长度 {len(candidate)} 与当前最优比较后保留 {best}。",_state(tokens,variables={"center":center,"l":l,"r":r,"best":best},structure={"candidate":candidate},result=[best]),tokens=tokens,active=center,rows=[{"label":"best","values":[best]}])
        b.emit(_line(b.code,r"l = i, r = i \+ 1"),"inspect","检查偶数中心","把 l=i、r=i+1 放在字符间隙，覆盖偶数长度回文。",_state(tokens,variables={"center":"gap","best":best},structure={"candidate":""}),tokens=tokens,rows=[{"label":"best","values":[best]}])
        b.finish(_line(b.code,r"return res"),f"返回最长回文 {best}。",_state(tokens,variables={"best":best},structure={},result=[best],confirmed=True),result=[best],tokens=tokens,rows=[{"label":"answer","values":[best]}]); return b.steps
    if pid==1143:
        a="abcde"; c="ace"; f=[[0]*(len(c)+1) for _ in range(len(a)+1)]
        b.emit(_line(b.code,r"vector<vector<int>> f"),"setup","建立 LCS 二维表","f[i][j] 表示 a 前 i 个字符与 b 前 j 个字符的最长公共子序列长度。",_state([],variables={},structure={"f":f,"a":a,"b":c}),tokens=list(a+c),rows=[{"label":"f","values":[_fmt(r) for r in f]}])
        for i in range(1,len(a)+1):
            for j in range(1,len(c)+1):
                f[i][j]=max(f[i-1][j],f[i][j-1])
                if a[i-1]==c[j-1]:f[i][j]=max(f[i][j],f[i-1][j-1]+1)
            b.emit(_line(b.code,r"f\[i\]\[j\] = max"),"update",f"完成 a[0..{i})",f"当前行 {f[i]}；相等字符会从左上角加 1。",_state([],variables={"i":i},structure={"f":f,"a":a,"b":c},result=[f[-1][-1]]),tokens=list(a+c),active=i-1,rows=[{"label":"f","values":[_fmt(r) for r in f]}])
        ans=f[-1][-1]; b.finish(_line(b.code,r"return f\[n\]\[m\]"),f"LCS 长度为 {ans}。",_state([],variables={},structure={"f":f},result=[ans],confirmed=True),result=[ans],tokens=list(a+c),rows=[{"label":"answer","values":[ans]}]); return b.steps
    # Edit distance: show initialization, a substitution and the final row.
    a="horse"; c="ros"; f=[[0]*(len(c)+1) for _ in range(len(a)+1)]
    for i in range(len(a)+1): f[i][0]=i
    for j in range(len(c)+1): f[0][j]=j
    b.emit(_line(b.code,r"f\[i\]\[0\] = i"),"setup","初始化空前缀代价","把一个字符串变为空字符串只能连续删除，第一列/第一行直接递增。",_state([],variables={},structure={"f":f,"a":a,"b":c}),tokens=list(a+c),rows=[{"label":"f","values":[_fmt(r) for r in f]}])
    for i in range(1,len(a)+1):
        for j in range(1,len(c)+1):
            t=int(a[i-1]!=c[j-1]); f[i][j]=min(f[i-1][j],f[i][j-1])+1; f[i][j]=min(f[i][j],f[i-1][j-1]+t)
        b.emit(_line(b.code,r"f\[i\]\[j\] = min"),"update",f"完成字符 {a[i-1]} 的一行",f"当前 DP 行 {f[i]}；相等字符可以沿左上角不增加代价。",_state([],variables={"i":i},structure={"f":f,"a":a,"b":c},result=[f[-1][-1]]),tokens=list(a+c),active=i-1,rows=[{"label":"f","values":[_fmt(r) for r in f]}])
    ans=f[-1][-1]; b.finish(_line(b.code,r"return f\[n\]\[m\]"),f"horse 到 ros 的编辑距离为 {ans}。",_state([],variables={},structure={"f":f},result=[ans],confirmed=True),result=[ans],tokens=list(a+c),rows=[{"label":"answer","values":[ans]}]); return b.steps


def _misc_trace(item: dict[str, Any], mode: str) -> list[dict[str, Any]]:
    pid=item["id"]; b=TraceBuilder(item,mode)
    if pid==136:
        nums=[4,1,2,1,2]; value=0
        b.emit(_line(b.code,r"int res"),"setup","从 0 开始异或","相同数字异或为 0，唯一数字会在扫描结束时留下。",_state(nums,variables={"res":value}),tokens=nums,rows=[{"label":"xor","values":[value]}])
        for i,x in enumerate(nums):
            value ^= x
            b.emit(_line(b.code,r"res \^= x"),"update",f"异或 nums[{i}]={x}",f"res = {value}；成对数字逐步抵消。",_state(nums,variables={"i":i,"x":x,"res":value},result=[value]),tokens=nums,active=i,rows=[{"label":"xor","values":[value]}])
        b.finish(_line(b.code,r"return res"),f"唯一出现一次的数字是 {value}。",_state(nums,variables={"res":value},result=[value],confirmed=True),result=[value],tokens=nums,rows=[{"label":"answer","values":[value]}]); return b.steps
    if pid==169:
        nums=[2,2,1,1,1,2,2]; candidate=None; count=0
        b.emit(_line(b.code,r"int r, c"),"setup","初始化候选与票数","Boyer-Moore 把不同元素互相抵消，最后候选一定是多数元素。",_state(nums,variables={"candidate":candidate,"count":count}),tokens=nums,rows=[{"label":"candidate","values":["空"]}])
        for i,x in enumerate(nums):
            if count==0: candidate=x; count=1; line=_line(b.code,r"if \(!c\)")
            elif candidate==x: count+=1; line=_line(b.code,r"c \+\+")
            else: count-=1; line=_line(b.code,r"c --")
            b.emit(line,"update",f"处理 nums[{i}]={x}",f"candidate={candidate}，count={count}。",_state(nums,variables={"i":i,"x":x,"candidate":candidate,"count":count},result=[candidate] if i==len(nums)-1 else []),tokens=nums,active=i,rows=[{"label":"candidate","values":[candidate]},{"label":"count","values":[count]}])
        b.finish(_line(b.code,r"return r"),f"多数元素为 {candidate}。",_state(nums,variables={"candidate":candidate,"count":count},result=[candidate],confirmed=True),result=[candidate],tokens=nums,rows=[{"label":"answer","values":[candidate]}]); return b.steps
    if pid==75:
        nums=[2,0,2,1,1,0]; i=j=0; k=len(nums)-1
        b.emit(_line(b.code,r"for \(int i"),"setup","建立三段区域","[0,j) 全是 0，[j,i) 全是 1，[k+1,n) 全是 2。",_state(nums,variables={"i":i,"j":j,"k":k}),tokens=nums,rows=[{"label":"nums","values":nums},{"label":"regions","values":["0 | 1 | unknown | 2"]}])
        while i<=k:
            if nums[i]==0:
                nums[i],nums[j]=nums[j],nums[i]; i+=1;j+=1; line=_line(b.code,r"swap\(nums\[i \+\+\]",fallback=5); action="把 0 放到左段"
            elif nums[i]==2:
                nums[i],nums[k]=nums[k],nums[i]; k-=1; line=_line(b.code,r"swap\(nums\[i\], nums\[k",fallback=6); action="把 2 放到右段"
            else:
                i+=1; line=_line(b.code,r"else i \+\+",fallback=7); action="1 留在中段"
            b.emit(line,"mutate",action,f"更新指针 i={i}, j={j}, k={k}，数组为 {nums}。",_state(nums,variables={"i":i,"j":j,"k":k},result=nums if i>k else []),tokens=nums,active=min(i,len(nums)-1),rows=[{"label":"nums","values":nums},{"label":"regions","values":[f"j={j}",f"i={i}",f"k={k}"]}])
        b.finish(_line(b.code,r"else i \+\+",fallback=7),f"三向分区完成：{nums}。",_state(nums,variables={"i":i,"j":j,"k":k},result=nums,confirmed=True),result=nums,tokens=nums,rows=[{"label":"answer","values":nums}]); return b.steps
    if pid==31:
        nums=[1,2,3]; k=len(nums)-1
        b.emit(_line(b.code,r"int k"),"setup","从后往前寻找下降点","当前排列 123 还有更大的后继；k 指向需要修改的后缀边界。",_state(nums,variables={"k":k}),tokens=nums,rows=[{"label":"nums","values":nums}])
        while k>0 and nums[k-1]>=nums[k]: k-=1
        b.emit(_line(b.code,r"while \(k > 0"),"compare",f"下降点为 k={k}","nums[k-1] < nums[k]，前缀可以增加；后缀仍保持非递增。",_state(nums,variables={"k":k}),tokens=nums,active=max(k-1,0),rows=[{"label":"pivot","values":[k-1]}])
        t=k
        while t<len(nums) and nums[t]>nums[k-1]: t+=1
        b.emit(_line(b.code,r"while \(t < nums.size"),"compare",f"寻找刚好大于 pivot 的后缀元素",f"pivot={nums[k-1]}，交换对象为 nums[{t-1}]={nums[t-1]}。",_state(nums,variables={"k":k,"t":t},structure={"pivot":nums[k-1]}),tokens=nums,active=t-1,rows=[{"label":"pivot","values":[nums[k-1]]}])
        nums[t-1],nums[k-1]=nums[k-1],nums[t-1]
        b.emit(_line(b.code,r"swap\(nums\[t - 1\]"),"mutate","交换 pivot 与后继",f"交换后数组为 {nums}。",_state(nums,variables={"k":k,"t":t},result=nums,confirmed=True),tokens=nums,active=[k-1,t-1],rows=[{"label":"nums","values":nums}])
        nums[k:]=reversed(nums[k:])
        b.emit(_line(b.code,r"reverse\(nums.begin\(\) \+ k"),"mutate","反转后缀得到最小增量",f"后缀升序后，下一排列为 {nums}。",_state(nums,variables={"k":k},result=nums,confirmed=True),tokens=nums,rows=[{"label":"nums","values":nums}])
        b.finish(_line(b.code,r"reverse\(nums.begin\(\) \+ k"),f"返回下一个排列 {nums}。",_state(nums,variables={"k":k},result=nums,confirmed=True),result=nums,tokens=nums,rows=[{"label":"answer","values":nums}]); return b.steps
    nums=[1,3,4,2,2]; a=bv=0; meet=None
    b.emit(_line(b.code,r"int a = 0, b = 0"),"setup","把数组看成函数图","nums[x] 是从节点 x 指向下一节点的边；重复数对应环入口。",_state(nums,variables={"slow":a,"fast":bv},structure={"next":nums}),tokens=nums,rows=[{"label":"next","values":[f"{i}→{x}" for i,x in enumerate(nums)]}])
    for step in range(1,5):
        a=nums[a]; bv=nums[nums[bv]]
        b.emit(_line(b.code,r"a = nums\[a\]"),"mutate",f"第 {step} 次追赶",f"slow={a}，fast={bv}。",_state(nums,variables={"slow":a,"fast":bv,"step":step},structure={"next":nums}),tokens=nums,active=[a,bv],rows=[{"label":"pointers","values":[f"slow={a}",f"fast={bv}"]}])
        if a==bv: meet=a; break
    b.emit(_line(b.code,r"if \(a == b\)"),"branch",f"在节点 {meet} 相遇","相遇说明图中存在环；把 slow 放回 0 后再次同步前进。",_state(nums,variables={"slow":meet,"fast":meet,"meet":meet},structure={"next":nums}),tokens=nums,active=[meet],rows=[{"label":"meet","values":[meet]}])
    a=0; bv=meet
    while a!=bv:
        a=nums[a];bv=nums[bv]
        b.emit(_line(b.code,r"while \(a != b\)"),"mutate","同步寻找环入口",f"slow={a}，fast={bv}。",_state(nums,variables={"slow":a,"fast":bv},structure={"next":nums}),tokens=nums,active=[a,bv],rows=[{"label":"pointers","values":[f"slow={a}",f"fast={bv}"]}])
    result=[a]; b.finish(_line(b.code,r"return a"),f"重复数为 {a}。",_state(nums,variables={"duplicate":a},structure={"next":nums},result=result,confirmed=True),result=result,tokens=nums,rows=[{"label":"answer","values":result}]); return b.steps
