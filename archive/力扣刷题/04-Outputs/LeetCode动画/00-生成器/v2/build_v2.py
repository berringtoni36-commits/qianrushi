#!/usr/bin/env python3
"""Build the six trace-driven standalone HTML pilot animations."""

from __future__ import annotations

import hashlib
import html
import json
import re
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote

from traces import build_problem_trace


V2_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = V2_ROOT.parents[3]
SOURCE_MD = PROJECT_ROOT / "01-Raw" / "04-Hot100两周速通-yxc简洁代码.md"
OUTPUT_ROOT = PROJECT_ROOT / "04-Outputs" / "LeetCode动画-V2" / "试点"
TRACE_ROOT = V2_ROOT / "traces"
TEMPLATE = V2_ROOT / "template.html"
ENGINE_CSS = V2_ROOT / "engine.css"
ENGINE_JS = V2_ROOT / "engine.js"

PILOTS = {
    1: "两数之和",
    42: "接雨水",
    76: "最小覆盖子串",
    206: "反转链表",
    146: "LRU缓存",
    322: "零钱兑换",
}


@dataclass(frozen=True)
class SourceCode:
    problem_id: int
    title: str
    heading: str
    code: str
    source_start_line: int
    source_sha256: str
    semantic_token_hash: str

    @property
    def lines(self) -> list[dict]:
        return [
            {"id": f"L{index}", "sourceLine": self.source_start_line + index - 1, "text": text}
            for index, text in enumerate(self.code.splitlines(), 1)
        ]


def semantic_cpp_tokens(code: str) -> list[str]:
    without_comments = re.sub(r"/\*.*?\*/|//[^\n]*", "", code, flags=re.S)
    pattern = re.compile(
        r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|'
        r"[A-Za-z_]\w*|\d+(?:\.\d+)?|"
        r"::|->|<<|>>|<=|>=|==|!=|\+\+|--|&&|\|\||\+=|-=|\*=|/=|%=|"
        r"[^\s]"
    )
    return pattern.findall(without_comments)


def semantic_hash(code: str) -> str:
    payload = "\x1f".join(semantic_cpp_tokens(code)).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def extract_source(problem_id: int, title: str) -> SourceCode:
    document = SOURCE_MD.read_text(encoding="utf-8")
    heading_pattern = re.compile(
        rf"^###\s+[^\n]*LeetCode\s+{problem_id}\b[^\n]*$",
        re.M,
    )
    heading_match = heading_pattern.search(document)
    if not heading_match:
        raise ValueError(f"找不到 LeetCode {problem_id} {title} 的标题")

    next_heading = re.search(r"^###\s+", document[heading_match.end():], re.M)
    end = heading_match.end() + (next_heading.start() if next_heading else len(document))
    section = document[heading_match.start():end]
    code_match = re.search(r"####\s+YXC 最终代码\s*\n```cpp\n(.*?)\n```", section, re.S)
    if not code_match:
        raise ValueError(f"找不到 LeetCode {problem_id} 的 YXC 最终代码块")

    code = code_match.group(1)
    absolute_code_start = heading_match.start() + code_match.start(1)
    source_start_line = document.count("\n", 0, absolute_code_start) + 1
    return SourceCode(
        problem_id=problem_id,
        title=title,
        heading=heading_match.group(0).removeprefix("### "),
        code=code,
        source_start_line=source_start_line,
        source_sha256=hashlib.sha256(code.encode("utf-8")).hexdigest(),
        semantic_token_hash=semantic_hash(code),
    )


def enrich_trace(source: SourceCode) -> dict:
    trace = build_problem_trace(source.problem_id, source.code)
    trace["meta"].update(
        {
            "problemId": source.problem_id,
            "title": source.title,
            "sourceHeading": source.heading,
            "sourcePath": str(SOURCE_MD),
            "sourceSha256": source.source_sha256,
            "semanticTokenHash": source.semantic_token_hash,
        }
    )
    trace["code"] = {
        "language": "cpp",
        "text": source.code,
        "lines": source.lines,
    }
    return trace


def build_html(trace: dict) -> str:
    template = TEMPLATE.read_text(encoding="utf-8")
    payload = json.dumps(trace, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return (
        template.replace("__TITLE__", html.escape(f"LeetCode {trace['meta']['problemId']} · {trace['meta']['title']} · V2"))
        .replace("__ENGINE_CSS__", ENGINE_CSS.read_text(encoding="utf-8"))
        .replace("__TRACE_JSON__", payload)
        .replace("__ENGINE_JS__", ENGINE_JS.read_text(encoding="utf-8"))
    )


def main() -> None:
    TRACE_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    index_rows = ["# LeetCode 动画 V2 · 六题试点", ""]

    for problem_id, title in PILOTS.items():
        source = extract_source(problem_id, title)
        trace = enrich_trace(source)
        trace_path = TRACE_ROOT / f"lc{problem_id}.json"
        trace_path.write_text(json.dumps(trace, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        problem_dir = OUTPUT_ROOT / f"{problem_id}-{title}"
        problem_dir.mkdir(parents=True, exist_ok=True)
        page_path = problem_dir / "index.html"
        page_path.write_text(build_html(trace), encoding="utf-8")
        page_uri = "file://" + quote(page_path.as_posix(), safe="/") + "#theme=auto"
        preview = f"""# LeetCode {problem_id} {title} · YXC 动画 V2

> 源代码由 YXC 总题解锁定；学习/复习密度、明暗主题和播放速度均可切换。

<iframe title="LeetCode {problem_id} {title} YXC 动画 V2" src="{page_uri}" style="width:100%;height:1000px;border:0;border-radius:8px;display:block;" loading="eager"></iframe>

[在浏览器中打开独立 HTML]({page_uri})
"""
        (problem_dir / "Obsidian预览.md").write_text(preview, encoding="utf-8")
        index_rows.append(f"- [{problem_id}. {title}]({problem_id}-{title}/index.html)")

    index_rows.extend(["", "- [质量审查报告](00-质量审查/quality-report.md)"])
    (OUTPUT_ROOT / "README.md").write_text("\n".join(index_rows) + "\n", encoding="utf-8")
    print(f"Built {len(PILOTS)} animations in {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
