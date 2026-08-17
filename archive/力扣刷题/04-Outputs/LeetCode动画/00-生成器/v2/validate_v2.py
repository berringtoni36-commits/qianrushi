#!/usr/bin/env python3
"""Validate source fidelity, complete-state traces, and YXC sample execution."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from build_v2 import OUTPUT_ROOT, PILOTS, TRACE_ROOT, extract_source, semantic_hash


BASE_INCLUDES = """#include <algorithm>
#include <iostream>
#include <stack>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;
"""

HARNESS = {
    1: """
int main() { vector<int> nums{2,7,11,15}; Solution s; auto r=s.twoSum(nums,9); cout<<r[0]<<','<<r[1]; }
""",
    42: """
int main() { vector<int> h{0,1,0,2,1,0,1,3,2,1,2,1}; Solution s; cout<<s.trap(h); }
""",
    76: """
int main() { Solution s; cout<<s.minWindow("ADOBECODEBANC","ABC"); }
""",
    206: """
int main() { ListNode *h=new ListNode(1), *p=h; for(int v=2;v<=5;v++){p->next=new ListNode(v);p=p->next;} Solution s; p=s.reverseList(h); bool first=true; while(p){if(!first)cout<<',';cout<<p->val;first=false;p=p->next;} }
""",
    146: """
int main() { LRUCache c(2); c.put(1,1); c.put(2,2); cout<<c.get(1)<<','; c.put(3,3); cout<<c.get(2); }
""",
    322: """
int main() { vector<int> coins{1,2,5}; Solution s; cout<<s.coinChange(coins,11); }
""",
}

EXPECTED_STDOUT = {1: "0,1", 42: "6", 76: "BANC", 206: "5,4,3,2,1", 146: "1,-1", 322: "3"}


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def validate_trace(problem_id: int, trace: dict) -> list[str]:
    errors: list[str] = []
    source = extract_source(problem_id, PILOTS[problem_id])
    meta, code, frames = trace.get("meta", {}), trace.get("code", {}), trace.get("frames", [])
    line_ids = {line["id"] for line in code.get("lines", [])}
    scene_kind = meta.get("sceneKind")

    require(meta.get("sourceSha256") == source.source_sha256, "原始代码 SHA-256 不匹配", errors)
    require(meta.get("semanticTokenHash") == source.semantic_token_hash, "语义 token 哈希不匹配", errors)
    require(code.get("text") == source.code, "展示代码不是 YXC 原始代码", errors)
    require(semantic_hash(code.get("text", "")) == source.semantic_token_hash, "展示代码 token 流被修改", errors)
    require(12 <= len(frames) <= 18, f"教学帧数量应为 12-18，实际 {len(frames)}", errors)
    require(bool(frames), "frames 为空", errors)
    if frames:
        require(frames[-1].get("phase") == "return", "最后一帧 phase 必须是 return", errors)
        require(frames[-1].get("durationMs", 0) >= 1000, "最后一帧停留不足 1000ms", errors)

    seen_frames, seen_beats = set(), set()
    all_states = []
    for frame_index, item in enumerate(frames):
        frame_id = item.get("id")
        require(frame_id not in seen_frames, f"重复 frame id: {frame_id}", errors)
        seen_frames.add(frame_id)
        require(item.get("durationMs", 0) > 0, f"{frame_id} durationMs 无效", errors)
        captions = item.get("captions", {})
        require(bool(captions.get("learning")), f"{frame_id} 缺少学习模式字幕", errors)
        require(bool(captions.get("review")), f"{frame_id} 缺少复习模式字幕", errors)
        beats = item.get("beats", [])
        require(bool(beats), f"{frame_id} 没有 beat", errors)
        for beat_index, current in enumerate(beats):
            beat_key = (frame_id, beat_index)
            require(beat_key not in seen_beats, f"重复 beat: {beat_key}", errors)
            seen_beats.add(beat_key)
            ids = current.get("lineIds", [])
            require(bool(ids), f"{frame_id}/{beat_index} 缺少代码行", errors)
            require(all(line_id in line_ids for line_id in ids), f"{frame_id}/{beat_index} 引用了无效代码行 {ids}", errors)
            require(bool(current.get("caption")), f"{frame_id}/{beat_index} 缺少动作字幕", errors)
            state = current.get("state", {})
            all_states.append(state)
            require(state.get("sceneKind") == scene_kind, f"{frame_id}/{beat_index} sceneKind 不一致", errors)
            require("action" in state, f"{frame_id}/{beat_index} 缺少 action", errors)
            require("variables" in state, f"{frame_id}/{beat_index} 缺少完整 variables", errors)

            if scene_kind == "hash-array":
                require(all(key in state for key in ("values", "hash", "active", "result")), f"{frame_id}/{beat_index} 哈希场景状态不完整", errors)
            elif scene_kind == "water-stack":
                require(len(state.get("values", [])) == len(state.get("water", [])) == 12, f"{frame_id}/{beat_index} 柱高/水层长度错误", errors)
                require("stack" in state and "res" in state.get("variables", {}), f"{frame_id}/{beat_index} 单调栈状态不完整", errors)
            elif scene_kind == "sliding-window":
                require(all(key in state for key in ("values", "need", "window", "range", "bestRange")), f"{frame_id}/{beat_index} 滑窗状态不完整", errors)
            elif scene_kind in ("linked-list", "lru-cache"):
                node_ids_now = {node.get("id") for node in state.get("nodes", [])}
                allow_preallocation = scene_kind == "lru-cache" and frame_id == "capacity"
                require(bool(node_ids_now) or allow_preallocation, f"{frame_id}/{beat_index} 节点集合为空", errors)
                for edge in state.get("edges", []):
                    require(edge.get("from") in node_ids_now and edge.get("to") in node_ids_now, f"{frame_id}/{beat_index} 边引用不存在节点", errors)
                for target in state.get("pointers", {}).values():
                    require(target is None or target in node_ids_now, f"{frame_id}/{beat_index} 指针引用不存在节点 {target}", errors)
            elif scene_kind == "dp-table":
                require(len(state.get("values", [])) == 12, f"{frame_id}/{beat_index} DP 表长度不是 12", errors)
                require("formula" in state, f"{frame_id}/{beat_index} DP 缺少公式字段", errors)

    if all_states:
        final = all_states[-1]
        if problem_id == 1:
            require(final.get("result") == [0, 1], "LC1 最终下标错误", errors)
        elif problem_id == 42:
            totals = [state.get("variables", {}).get("res", 0) for state in all_states]
            require(totals == sorted(totals), "LC42 res 出现回退", errors)
            require(final.get("variables", {}).get("res") == 6, "LC42 最终 res 不是 6", errors)
            require(sum(final.get("water", [])) == 6, "LC42 可视水层总和不是 6", errors)
        elif problem_id == 76:
            counts = [state.get("variables", {}).get("cnt", 0) for state in all_states]
            require(counts == sorted(counts), "LC76 cnt 不应在 YXC 收缩中减少", errors)
            require(final.get("variables", {}).get("res") == "BANC", "LC76 最终 res 不是 BANC", errors)
            require(final.get("bestRange") == [9, 12], "LC76 最优区间错误", errors)
        elif problem_id == 206:
            edge_pairs = {(edge["from"], edge["to"]) for edge in final.get("edges", [])}
            require(edge_pairs == {("n5", "n4"), ("n4", "n3"), ("n3", "n2"), ("n2", "n1")}, "LC206 最终链表边错误", errors)
            require(final.get("pointers", {}).get("a") == "n5", "LC206 返回指针 a 不是 n5", errors)
        elif problem_id == 146:
            require(final.get("hash") == {"1": "k1", "3": "k3"}, "LC146 最终 hash 错误", errors)
            require(final.get("order") == ["L", "k3", "k1", "R"], "LC146 最终 LRU 顺序错误", errors)
            require(final.get("variables", {}).get("return") == -1, "LC146 get(2) 未返回 -1", errors)
        elif problem_id == 322:
            require(final.get("values", [None] * 12)[11] == 3, "LC322 f[11] 不是 3", errors)

    html_path = OUTPUT_ROOT / f"{problem_id}-{PILOTS[problem_id]}" / "index.html"
    require(html_path.exists() and html_path.stat().st_size > 20000, "独立 HTML 未生成或内容异常", errors)
    return errors


def compile_and_run(problem_id: int, code: str) -> str:
    compiler = shutil.which("clang++") or shutil.which("g++")
    if not compiler:
        raise RuntimeError("找不到 clang++ 或 g++")
    prefix = BASE_INCLUDES
    if problem_id == 206:
        prefix += "struct ListNode { int val; ListNode *next; ListNode(int x): val(x), next(NULL) {} };\n"
    source = prefix + "\n" + code + "\n" + HARNESS[problem_id]
    with tempfile.TemporaryDirectory(prefix=f"leetcode-v2-{problem_id}-") as temp_dir:
        cpp = Path(temp_dir) / "main.cpp"
        binary = Path(temp_dir) / "main"
        cpp.write_text(source, encoding="utf-8")
        compile_result = subprocess.run([compiler, "-std=c++17", str(cpp), "-O2", "-o", str(binary)], capture_output=True, text=True, timeout=30)
        if compile_result.returncode:
            raise RuntimeError(compile_result.stderr.strip())
        run_result = subprocess.run([str(binary)], capture_output=True, text=True, timeout=10)
        if run_result.returncode:
            raise RuntimeError(run_result.stderr.strip())
        return run_result.stdout.strip()


def main() -> None:
    report = {"passed": True, "problems": {}}
    for problem_id, title in PILOTS.items():
        trace_path = TRACE_ROOT / f"lc{problem_id}.json"
        trace = json.loads(trace_path.read_text(encoding="utf-8"))
        errors = validate_trace(problem_id, trace)
        try:
            stdout = compile_and_run(problem_id, trace["code"]["text"])
            if stdout != EXPECTED_STDOUT[problem_id]:
                errors.append(f"C++ 示例输出错误：{stdout!r}，期望 {EXPECTED_STDOUT[problem_id]!r}")
        except Exception as exc:  # validation should report all problems in one run
            stdout = ""
            errors.append(f"C++ 编译/运行失败：{exc}")

        report["problems"][str(problem_id)] = {
            "title": title,
            "passed": not errors,
            "errors": errors,
            "frameCount": len(trace.get("frames", [])),
            "beatCount": sum(len(item.get("beats", [])) for item in trace.get("frames", [])),
            "cppStdout": stdout,
        }
        report["passed"] = report["passed"] and not errors

    report_path = TRACE_ROOT / "validation-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for problem_id, result in report["problems"].items():
        status = "PASS" if result["passed"] else "FAIL"
        print(f"[{status}] LC{problem_id} {result['title']} · {result['frameCount']} frames / {result['beatCount']} beats · C++ {result['cppStdout']}")
        for error in result["errors"]:
            print(f"  - {error}")
    if not report["passed"]:
        raise SystemExit(1)
    print(f"Validation report: {report_path}")


if __name__ == "__main__":
    main()
