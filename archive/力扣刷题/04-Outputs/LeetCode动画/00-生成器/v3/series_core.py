"""Shared trace primitives for the Hot100 V3 series.

Every builder records complete post-action state. Frames only group consecutive
events for teaching navigation; beats remain the deterministic execution log.
"""

from __future__ import annotations

from copy import deepcopy
from math import ceil
from typing import Any, Iterable


class Lines:
    def __init__(self, code: str):
        self.lines = code.splitlines()

    def id(self, *needles: str, occurrence: int = 1) -> str:
        for needle in needles:
            found = 0
            for index, text in enumerate(self.lines, 1):
                if needle in text:
                    found += 1
                    if found == occurrence:
                        return f"L{index}"
        return self.function_line()

    def function_line(self) -> str:
        for index, text in enumerate(self.lines, 1):
            stripped = text.strip()
            if "(" in stripped and stripped.endswith("{") and not stripped.startswith(("if", "for", "while", "switch")):
                return f"L{index}"
        return "L1"

    def return_line(self) -> str:
        for index in range(len(self.lines), 0, -1):
            if "return" in self.lines[index - 1]:
                return f"L{index}"
        return self.function_line()


def complete_state(scene_kind: str, action: str, **state: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "sceneKind": scene_kind,
        "values": [],
        "variables": {},
        "pointers": {},
        "active": [],
        "compared": [],
        "result": [],
        "formula": "",
        "action": action,
        "status": "running",
    }
    base.update(deepcopy(state))
    return base


def event(
    line_ids: str | Iterable[str],
    state: dict[str, Any],
    caption: str,
    *,
    phase: str = "inspect",
    learning: str | None = None,
    review: str | None = None,
    emphasis: Iterable[str] = (),
) -> dict[str, Any]:
    return {
        "lineIds": [line_ids] if isinstance(line_ids, str) else list(line_ids),
        "state": deepcopy(state),
        "caption": caption,
        "phase": phase,
        "learning": learning or caption,
        "review": review or state.get("formula") or state.get("action") or caption,
        "emphasis": list(emphasis),
    }


def _checkpoint(source: dict[str, Any], number: int) -> dict[str, Any]:
    item = deepcopy(source)
    item["phase"] = "inspect"
    item["state"]["action"] = f"不变量检查 {number}"
    item["caption"] = "暂停核对当前完整状态；后续步骤只会在这个状态上增量更新。"
    item["learning"] = "当前所有指针、容器与已确认结果都与代码执行到这里一致。"
    item["review"] = "完整状态检查"
    item["emphasis"] = ["invariant"]
    return item


def frames_from_events(events: list[dict[str, Any]], difficulty: str) -> list[dict[str, Any]]:
    if not events:
        raise ValueError("trace events cannot be empty")
    if events[-1].get("phase") != "return":
        raise ValueError("last event must be return")

    minimum = 16 if difficulty == "Hard" else 12
    maximum = 24 if difficulty == "Hard" else 18
    body, final = deepcopy(events[:-1]), deepcopy(events[-1])
    if not body:
        body.append(deepcopy(final))
        body[-1]["phase"] = "setup"

    checkpoint_number = 1
    while len(body) + 1 < minimum:
        positions = list(range(1, len(body) + 1, 2)) or [1]
        for position in reversed(positions):
            if len(body) + 1 >= minimum:
                break
            body.insert(position, _checkpoint(body[max(0, position - 1)], checkpoint_number))
            checkpoint_number += 1

    target_body_frames = min(maximum - 1, max(minimum - 1, min(len(body), maximum - 1)))
    quotient, remainder = divmod(len(body), target_body_frames)
    chunks = []
    cursor = 0
    for index in range(target_body_frames):
        size = quotient + (1 if index < remainder else 0)
        if size:
            chunks.append(body[cursor:cursor + size])
            cursor += size
    while len(chunks) > maximum - 1:
        chunks[-2].extend(chunks[-1])
        chunks.pop()

    frames: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks, 1):
        last = chunk[-1]
        frames.append({
            "id": f"step-{index:02d}",
            "phase": last.get("phase", "inspect"),
            "durationMs": 1050 + min(900, 130 * len(chunk)),
            "captions": {"learning": last["learning"], "review": last["review"]},
            "beats": [{key: deepcopy(item[key]) for key in ("lineIds", "state", "caption", "emphasis")} for item in chunk],
        })
    frames.append({
        "id": "return",
        "phase": "return",
        "durationMs": 1800,
        "captions": {"learning": final["learning"], "review": final["review"]},
        "beats": [{key: deepcopy(final[key]) for key in ("lineIds", "state", "caption", "emphasis")}],
    })
    return frames


def make_trace(
    item: dict[str, Any],
    scene_kind: str,
    events: list[dict[str, Any]],
    *,
    algorithm: str,
    invariant: str,
    aha: str,
    time: str,
    space: str,
    example_text: str,
    expected_text: str,
    input_data: Any,
    expected: Any,
) -> dict[str, Any]:
    return {
        "meta": {
            "difficulty": item["difficulty"],
            "algorithm": algorithm,
            "sceneKind": scene_kind,
            "input": input_data,
            "expected": expected,
            "exampleText": example_text,
            "expectedText": expected_text,
            "invariant": invariant,
            "aha": aha,
            "time": time,
            "space": space,
        },
        "frames": frames_from_events(events, item["difficulty"]),
    }
