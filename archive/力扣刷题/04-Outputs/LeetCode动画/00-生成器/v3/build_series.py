#!/usr/bin/env python3
"""Build and track the full Hot100 V3 animation series."""

from __future__ import annotations

import hashlib
import html
import importlib.util
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote


V3_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = V3_ROOT.parents[3]
SOURCE_MD = PROJECT_ROOT / "01-Raw" / "04-Hot100两周速通-yxc简洁代码.md"
V2_ROOT = V3_ROOT.parent / "v2"
V2_TRACE_ROOT = V2_ROOT / "traces"
OUTPUT_ROOT = PROJECT_ROOT / "04-Outputs" / "LeetCode动画-V3" / "Hot100"
TEMPLATE = V3_ROOT / "template.html"
ENGINE_CSS = V3_ROOT / "engine.css"
ENGINE_JS = V3_ROOT / "engine.js"
TRACE_ROOT = V3_ROOT / "traces"

READY_TRACE_IDS = {1, 42, 76, 146, 206, 322}

MODE_TO_SCENE = {
    "hash": "hash-array", "hash-group": "hash-array", "hash-run": "hash-array", "prefix": "hash-array",
    "boyer": "hash-array", "bit": "hash-array", "window": "sliding-window", "mono-deque": "sliding-window",
    "linked": "linked-list", "cycle": "linked-list", "lru": "lru-cache", "dp1d": "dp-table", "dp2d": "dp-table",
    "tree": "tree-graph", "graph": "tree-graph", "trie": "trie", "grid": "matrix-grid", "grid-bfs": "matrix-grid",
    "stack": "stack-sequence", "mono-stack": "stack-sequence", "heap": "heap", "backtrack": "backtracking",
    "binary": "binary-search", "matrix-search": "binary-search", "interval": "interval", "greedy": "interval",
    "two-ptr": "array-pointers", "array": "generic-array", "palindrome": "array-pointers",
}


def load_old_generator():
    path = V3_ROOT.parent / "generate.py"
    spec = importlib.util.spec_from_file_location("leetcode_v1_generator", path)
    if not spec or not spec.loader:
        raise RuntimeError(f"cannot import {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_v2_validation():
    sys.path.insert(0, str(V2_ROOT))
    from validate_v2 import EXPECTED_STDOUT, compile_and_run, validate_trace  # type: ignore
    return EXPECTED_STDOUT, compile_and_run, validate_trace


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
    return hashlib.sha256("\x1f".join(semantic_cpp_tokens(code)).encode("utf-8")).hexdigest()


def validate_generated_trace(trace: dict) -> list[str]:
    errors: list[str] = []
    meta, code, frames = trace.get("meta", {}), trace.get("code", {}), trace.get("frames", [])
    line_ids = {line.get("id") for line in code.get("lines", [])}
    minimum = 16 if meta.get("difficulty") == "Hard" else 12
    maximum = 24 if meta.get("difficulty") == "Hard" else 18
    if not minimum <= len(frames) <= maximum:
        errors.append(f"frame count {len(frames)} not in [{minimum},{maximum}]")
    if not frames or frames[-1].get("phase") != "return" or frames[-1].get("durationMs", 0) < 1200:
        errors.append("final frame must be return and hold >=1200ms")
    beat_count = 0
    for frame_index, frame in enumerate(frames):
        if not frame.get("beats"):
            errors.append(f"frame {frame_index} has no beats")
        if not frame.get("captions", {}).get("learning") or not frame.get("captions", {}).get("review"):
            errors.append(f"frame {frame_index} lacks dual captions")
        for beat_index, beat in enumerate(frame.get("beats", [])):
            beat_count += 1
            ids, state = beat.get("lineIds", []), beat.get("state", {})
            if not ids or any(line_id not in line_ids for line_id in ids):
                errors.append(f"frame {frame_index}/beat {beat_index} has invalid line ids {ids}")
            if state.get("sceneKind") != meta.get("sceneKind"):
                errors.append(f"frame {frame_index}/beat {beat_index} scene kind mismatch")
            for key in ("variables", "action", "formula"):
                if key not in state:
                    errors.append(f"frame {frame_index}/beat {beat_index} missing {key}")
            if not beat.get("caption"):
                errors.append(f"frame {frame_index}/beat {beat_index} lacks caption")
    if beat_count < minimum:
        errors.append(f"beat count {beat_count} is below {minimum}")
    if frames:
        final_state = frames[-1]["beats"][-1].get("state", {})
        if final_state.get("status") != "return":
            errors.append("final state status must be return")
        if "output" not in final_state:
            errors.append("final state lacks output")
        elif final_state.get("output") != meta.get("expected"):
            errors.append(f"final output {final_state.get('output')!r} != expected {meta.get('expected')!r}")
    return errors


def source_line_map() -> dict[int, int]:
    text = SOURCE_MD.read_text(encoding="utf-8")
    result: dict[int, int] = {}
    headings = list(re.finditer(r"^###\s+[^\n]*LeetCode\s+(\d+)\b[^\n]*$", text, re.M))
    for i, heading in enumerate(headings):
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        block = text[heading.end():end]
        code = re.search(r"####\s+YXC 最终代码\s*\n```[^\n]*\n(.*?)\n```", block, re.S)
        if code:
            result[int(heading.group(1))] = text.count("\n", 0, heading.end() + code.start(1)) + 1
    return result


def enrich_trace(trace: dict, item: dict, start_line: int) -> dict:
    code = item["code"]
    trace["meta"].update({
        "problemId": item["id"], "title": item["title"], "difficulty": item["difficulty"], "day": item["day"],
        "sourcePath": str(SOURCE_MD), "sourceSha256": hashlib.sha256(code.encode("utf-8")).hexdigest(),
        "semanticTokenHash": semantic_hash(code), "rendererVersion": "V3-series",
    })
    trace["code"] = {
        "language": "cpp", "text": code,
        "lines": [{"id": f"L{i}", "sourceLine": start_line + i - 1, "text": line} for i, line in enumerate(code.splitlines(), 1)],
    }
    return trace


def build_html(trace: dict) -> str:
    payload = json.dumps(trace, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return (
        TEMPLATE.read_text(encoding="utf-8")
        .replace("__TITLE__", html.escape(f"LeetCode {trace['meta']['problemId']} · {trace['meta']['title']} · V3"))
        .replace("__ENGINE_CSS__", ENGINE_CSS.read_text(encoding="utf-8"))
        .replace("__TRACE_JSON__", payload)
        .replace("__ENGINE_JS__", ENGINE_JS.read_text(encoding="utf-8"))
    )


def safe_name(value: str) -> str:
    return re.sub(r"[\\/:*?\"<>|]", "-", value).strip()


def write_problem(item: dict, trace: dict) -> Path:
    folder = OUTPUT_ROOT / f"{item['order']:03d}-{item['id']}-{safe_name(item['title'])}"
    folder.mkdir(parents=True, exist_ok=True)
    page = folder / "index.html"
    page.write_text(build_html(trace), encoding="utf-8")
    uri = "file://" + quote(page.as_posix(), safe="/") + "#theme=auto"
    (folder / "Obsidian预览.md").write_text(
        f"# LeetCode {item['id']} {item['title']} · YXC 动画 V3\n\n"
        f"> {item['day']} · 源代码锁定 · 完整状态 trace。\n\n"
        f"<iframe title=\"LeetCode {item['id']} {item['title']} V3\" src=\"{uri}\" style=\"width:100%;height:1000px;border:0;border-radius:8px;display:block;\" loading=\"eager\"></iframe>\n\n"
        f"[在浏览器中打开独立 HTML]({uri})\n",
        encoding="utf-8",
    )
    return page


def build_collection_index(manifest: list[dict], audit: dict) -> str:
    scenes = sorted({entry["sceneKind"] for entry in manifest})
    days = list(dict.fromkeys(entry["day"] for entry in manifest))
    scene_options = "".join(f'<option value="{html.escape(scene)}">{html.escape(scene)}</option>' for scene in scenes)
    day_options = "".join(f'<option value="{html.escape(day)}">{html.escape(day)}</option>' for day in days)
    rows = []
    for entry in manifest:
        folder = html.escape(entry["folder"], quote=True)
        search = html.escape(f"{entry['id']} {entry['title']} {entry['day']} {entry['sceneKind']}".lower(), quote=True)
        status_label = "已验收" if entry["status"] == "validated-trace" else "待处理"
        rows.append(
            f'<tr data-search="{search}" data-difficulty="{html.escape(entry["difficulty"])}" '
            f'data-scene="{html.escape(entry["sceneKind"])}" data-day="{html.escape(entry["day"], quote=True)}">'
            f'<td class="order">{entry["order"]:02d}</td>'
            f'<td><a class="problem-link" href="./{folder}/index.html"><strong>LC{entry["id"]} · {html.escape(entry["title"])}</strong>'
            f'<span>{html.escape(entry["day"])}</span></a></td>'
            f'<td><span class="difficulty {entry["difficulty"].lower()}">{html.escape(entry["difficulty"])}</span></td>'
            f'<td><code>{html.escape(entry["sceneKind"])}</code></td>'
            f'<td>{entry.get("frameCount", 0)} / {entry.get("beatCount", 0)}</td>'
            f'<td><span class="status">{status_label}</span></td>'
            f'<td><a class="open-link" href="./{folder}/index.html" aria-label="打开 LC{entry["id"]} {html.escape(entry["title"], quote=True)}">打开</a></td>'
            '</tr>'
        )
    total = len(manifest)
    ready = sum(entry["status"] == "validated-trace" for entry in manifest)
    passed = "全部审计通过" if audit.get("passed") else "存在待修问题"
    return f'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hot100 · YXC 动画 V3</title>
  <style>
    :root {{ color-scheme: light dark; --bg:#f5f5f2; --panel:#ffffff; --text:#20211f; --muted:#6b6d68; --line:#d8dad4; --active:#615bd8; --active-soft:#eeedff; --good:#17704a; --code:#f0f1ed; }}
    @media (prefers-color-scheme: dark) {{ :root {{ --bg:#0d1319; --panel:#121b22; --text:#e8ecef; --muted:#9ba6ad; --line:#2a3740; --active:#9993ff; --active-soft:#24254a; --good:#67d7a3; --code:#18232b; }} }}
    * {{ box-sizing:border-box; }}
    html,body {{ margin:0; min-height:100%; background:var(--bg); color:var(--text); font-family:"iA Writer Quattro V","PingFang SC",system-ui,sans-serif; letter-spacing:0; }}
    body {{ padding:20px; }}
    .shell {{ width:min(1500px,100%); margin:0 auto; }}
    .masthead {{ display:flex; align-items:flex-end; justify-content:space-between; gap:24px; padding:4px 0 18px; border-bottom:1px solid var(--line); }}
    .eyebrow {{ color:var(--active); font:700 12px/1.4 "iA Writer Mono V",monospace; text-transform:uppercase; }}
    h1 {{ margin:5px 0 3px; font-size:32px; line-height:1.1; }}
    .subtitle {{ margin:0; color:var(--muted); font-size:14px; }}
    .summary {{ display:flex; gap:20px; align-items:flex-end; white-space:nowrap; }}
    .metric strong {{ display:block; font:700 22px/1 "iA Writer Mono V",monospace; }}
    .metric span {{ color:var(--muted); font-size:12px; }}
    .audit-state {{ color:var(--good); font-weight:700; }}
    .toolbar {{ display:grid; grid-template-columns:minmax(220px,1fr) repeat(3,minmax(145px,190px)) 34px; gap:8px; padding:14px 0; align-items:center; }}
    input,select,button {{ min-height:36px; border:1px solid var(--line); border-radius:6px; background:var(--panel); color:var(--text); font:inherit; }}
    input,select {{ width:100%; padding:0 10px; }}
    input:focus,select:focus,button:focus-visible,a:focus-visible {{ outline:2px solid var(--active); outline-offset:2px; }}
    button {{ cursor:pointer; font-size:20px; line-height:1; }}
    .audit-links {{ display:flex; flex-wrap:wrap; gap:14px; padding:0 0 12px; font-size:13px; }}
    .audit-links a {{ color:var(--active); text-decoration:none; }}
    .result-count {{ margin-left:auto; color:var(--muted); }}
    .table-scroll {{ overflow:auto; border:1px solid var(--line); border-radius:8px; background:var(--panel); max-height:calc(100vh - 240px); }}
    table {{ width:100%; min-width:900px; border-collapse:collapse; }}
    th {{ position:sticky; top:0; z-index:2; padding:10px 12px; background:var(--panel); border-bottom:1px solid var(--line); color:var(--muted); font-size:12px; text-align:left; }}
    td {{ padding:9px 12px; border-bottom:1px solid var(--line); vertical-align:middle; font-size:13px; }}
    tbody tr:last-child td {{ border-bottom:0; }}
    tbody tr:hover {{ background:var(--active-soft); }}
    .order {{ width:52px; color:var(--muted); font-family:"iA Writer Mono V",monospace; }}
    .problem-link {{ display:flex; flex-direction:column; gap:2px; color:var(--text); text-decoration:none; }}
    .problem-link span {{ color:var(--muted); font-size:11px; }}
    code {{ padding:3px 6px; border-radius:4px; background:var(--code); color:var(--text); font-family:"iA Writer Mono V",monospace; }}
    .difficulty,.status {{ display:inline-block; padding:3px 7px; border:1px solid var(--line); border-radius:5px; font-size:11px; font-weight:700; }}
    .difficulty.easy {{ color:var(--good); }} .difficulty.hard {{ color:#c34e49; }}
    .open-link {{ color:var(--active); font-weight:700; text-decoration:none; }}
    .empty {{ display:none; padding:34px; text-align:center; color:var(--muted); }}
    @media (max-width:900px) {{ body {{ padding:12px; }} .masthead {{ align-items:flex-start; }} .summary {{ gap:12px; }} .toolbar {{ grid-template-columns:1fr 1fr; }} .toolbar input {{ grid-column:1 / -1; }} .toolbar button {{ grid-column:2; justify-self:end; width:36px; }} .table-scroll {{ max-height:calc(100vh - 302px); }} }}
    @media (max-width:640px) {{ .masthead {{ flex-direction:column; }} .summary {{ width:100%; justify-content:space-between; }} .toolbar {{ grid-template-columns:1fr; }} .toolbar input,.toolbar button {{ grid-column:auto; }} .toolbar button {{ justify-self:end; }} .table-scroll {{ max-height:none; }} }}
  </style>
</head>
<body>
  <main class="shell">
    <header class="masthead">
      <div><div class="eyebrow">YXC TRACE LAB · V3 SERIES</div><h1>Hot100 动画</h1><p class="subtitle">100 道题共用同一套 trace、双栏视觉与交互标准</p></div>
      <div class="summary"><div class="metric"><strong>{ready}/{total}</strong><span>已完成</span></div><div class="metric"><strong>{sum(entry.get('frameCount', 0) for entry in manifest)}</strong><span>教学帧</span></div><div class="metric"><strong>{sum(entry.get('beatCount', 0) for entry in manifest)}</strong><span>执行 beat</span></div><div class="audit-state">{passed}</div></div>
    </header>
    <section class="toolbar" aria-label="题目筛选">
      <input id="search" type="search" placeholder="搜索题号、题名、Day 或场景" aria-label="搜索题目">
      <select id="difficulty" aria-label="按难度筛选"><option value="">全部难度</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
      <select id="scene" aria-label="按场景筛选"><option value="">全部场景</option>{scene_options}</select>
      <select id="day" aria-label="按 Day 筛选"><option value="">全部 Day</option>{day_options}</select>
      <button id="clear" type="button" title="清除筛选" aria-label="清除筛选">×</button>
    </section>
    <nav class="audit-links" aria-label="验收报告"><a href="./series-audit.json">Trace 审计</a><a href="./cpp-validation.json">C++ 验证</a><a href="./browser-validation.json">浏览器验证</a><a href="./interaction-validation.json">交互验证</a><a href="./viewport-validation.json">视口验证</a><a href="./visual-review/lc42-light-dark-contact-sheet.jpg">LC42 明暗联系表</a><span class="result-count" id="result-count">{total} 道题</span></nav>
    <section class="table-scroll">
      <table><thead><tr><th>#</th><th>题目</th><th>难度</th><th>场景</th><th>帧 / beat</th><th>状态</th><th></th></tr></thead><tbody id="problem-rows">{''.join(rows)}</tbody></table>
      <div class="empty" id="empty">没有符合当前筛选的题目。</div>
    </section>
  </main>
  <script>
    const rows = [...document.querySelectorAll('#problem-rows tr')];
    const controls = {{ search:document.querySelector('#search'), difficulty:document.querySelector('#difficulty'), scene:document.querySelector('#scene'), day:document.querySelector('#day') }};
    function filterRows() {{
      const query = controls.search.value.trim().toLowerCase(); let visible = 0;
      rows.forEach(row => {{ const show = (!query || row.dataset.search.includes(query)) && (!controls.difficulty.value || row.dataset.difficulty === controls.difficulty.value) && (!controls.scene.value || row.dataset.scene === controls.scene.value) && (!controls.day.value || row.dataset.day === controls.day.value); row.hidden = !show; if (show) visible += 1; }});
      document.querySelector('#result-count').textContent = `${{visible}} 道题`; document.querySelector('#empty').style.display = visible ? 'none' : 'block';
    }}
    Object.values(controls).forEach(control => control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', filterRows));
    document.querySelector('#clear').addEventListener('click', () => {{ Object.values(controls).forEach(control => control.value = ''); filterRows(); controls.search.focus(); }});
  </script>
</body>
</html>'''


def main() -> None:
    from builders_linear import BUILDERS as LINEAR_BUILDERS
    from builders_dp import BUILDERS as DP_BUILDERS
    from builders_structures import BUILDERS as STRUCTURE_BUILDERS
    from builders_backtracking import BUILDERS as BACKTRACK_BUILDERS
    from builders_linked import BUILDERS as LINKED_BUILDERS
    from builders_trees import BUILDERS as TREE_BUILDERS

    GENERATED_BUILDERS = {**LINEAR_BUILDERS, **DP_BUILDERS, **STRUCTURE_BUILDERS, **BACKTRACK_BUILDERS, **LINKED_BUILDERS, **TREE_BUILDERS}

    old = load_old_generator()
    items = old.parse_source()
    examples = old.EXAMPLES
    modes = old.MODES
    lines = source_line_map()
    expected_stdout, compile_and_run, validate_v2_trace = load_v2_validation()
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    TRACE_ROOT.mkdir(parents=True, exist_ok=True)

    results: dict[str, dict] = {}
    manifest: list[dict] = []
    for item in items:
        pid = item["id"]
        migrated = pid in READY_TRACE_IDS and (V2_TRACE_ROOT / f"lc{pid}.json").exists()
        generated = pid in GENERATED_BUILDERS
        ready = migrated or generated
        entry = {
            "order": item["order"], "id": pid, "title": item["title"], "difficulty": item["difficulty"], "day": item["day"],
            "folder": f"{item['order']:03d}-{pid}-{safe_name(item['title'])}",
            "mode": modes.get(pid, "array"), "sceneKind": MODE_TO_SCENE.get(modes.get(pid, "array"), "generic-array"),
            "example": examples.get(pid, ["", ""])[0], "expected": examples.get(pid, ["", ""])[1],
            "sourceSha256": hashlib.sha256(item["code"].encode("utf-8")).hexdigest(), "semanticTokenHash": semantic_hash(item["code"]),
            "status": "validated-trace" if ready else "pending-trace",
        }
        if ready:
            if migrated:
                trace = json.loads((V2_TRACE_ROOT / f"lc{pid}.json").read_text(encoding="utf-8"))
            else:
                trace = GENERATED_BUILDERS[pid](item, item["code"], examples[pid])
            trace = enrich_trace(trace, item, lines[pid])
            entry["sceneKind"] = trace["meta"]["sceneKind"]
            errors = validate_v2_trace(pid, trace) if migrated else validate_generated_trace(trace)
            stdout = ""
            if migrated:
                try:
                    stdout = compile_and_run(pid, item["code"])
                    if stdout != expected_stdout[pid]:
                        errors.append(f"stdout {stdout!r} != {expected_stdout[pid]!r}")
                except Exception as exc:
                    errors.append(f"compile/run failed: {exc}")
            (TRACE_ROOT / f"lc{pid}.json").write_text(json.dumps(trace, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            page = write_problem(item, trace)
            entry.update({"frameCount": len(trace["frames"]), "beatCount": sum(len(frame["beats"]) for frame in trace["frames"]), "output": str(page)})
            results[str(pid)] = {"passed": not errors, "errors": errors, "stdout": stdout, "frameCount": entry["frameCount"], "beatCount": entry["beatCount"]}
            if errors:
                entry["status"] = "failed-validation"
        manifest.append(entry)

    ready_count = sum(entry["status"] == "validated-trace" for entry in manifest)
    audit = {"passed": all(result["passed"] for result in results.values()), "totalProblems": len(manifest), "validatedProblems": ready_count, "pendingProblems": len(manifest) - ready_count, "problems": results}
    (V3_ROOT / "series-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_ROOT / "browser-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_ROOT / "series-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_ROOT / "index.html").write_text(build_collection_index(manifest, audit), encoding="utf-8")

    progress_note = "全部题目均已生成并通过严格 trace 校验。" if ready_count == len(manifest) else "其余题目按题型模拟器逐批补齐。"
    rows = ["# Hot100 动画 V3", "", f"> 当前完成 {ready_count}/{len(manifest)} 份严格 trace；{progress_note}", "", "| # | 题目 | 难度 | 场景 | 状态 | 动画 |", "|---:|---|---|---|---|---|"]
    for entry in manifest:
        link = ""
        if entry["status"] == "validated-trace":
            folder = f"{entry['order']:03d}-{entry['id']}-{safe_name(entry['title'])}"
            link = f"[打开]({folder}/index.html)"
        rows.append(f"| {entry['order']} | LC{entry['id']} {entry['title']} | {entry['difficulty']} | `{entry['sceneKind']}` | {entry['status']} | {link} |")
    (OUTPUT_ROOT / "README.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))
    if not audit["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
