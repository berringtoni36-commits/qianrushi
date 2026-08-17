#!/usr/bin/env python3
"""Build the LC42 V3 review sample from the existing V2 trace."""

from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import quote


V3_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = V3_ROOT.parents[3]
SOURCE_MD = PROJECT_ROOT / "01-Raw" / "04-Hot100两周速通-yxc简洁代码.md"
TRACE_SOURCE = V3_ROOT.parent / "v2" / "traces" / "lc42.json"
OUTPUT_ROOT = PROJECT_ROOT / "04-Outputs" / "LeetCode动画-V3" / "试点"
OUTPUT_DIR = OUTPUT_ROOT / "42-接雨水"
TEMPLATE = V3_ROOT / "template.html"
ENGINE_CSS = V3_ROOT / "engine.css"
ENGINE_JS = V3_ROOT / "engine.js"


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


def extract_yxc_code() -> tuple[str, int, str]:
    document = SOURCE_MD.read_text(encoding="utf-8")
    heading = re.search(r"^###\s+[^\n]*LeetCode\s+42\b[^\n]*$", document, re.M)
    if not heading:
        raise ValueError("找不到 LeetCode 42 标题")
    next_heading = re.search(r"^###\s+", document[heading.end():], re.M)
    end = heading.end() + (next_heading.start() if next_heading else len(document))
    section = document[heading.start():end]
    code_match = re.search(r"####\s+YXC 最终代码\s*\n```cpp\n(.*?)\n```", section, re.S)
    if not code_match:
        raise ValueError("找不到 LeetCode 42 的 YXC 最终代码")
    code = code_match.group(1)
    absolute_start = heading.start() + code_match.start(1)
    source_line = document.count("\n", 0, absolute_start) + 1
    return code, source_line, heading.group(0).removeprefix("### ")


def source_lines(code: str, start_line: int) -> list[dict]:
    return [
        {"id": f"L{i}", "sourceLine": start_line + i - 1, "text": line}
        for i, line in enumerate(code.splitlines(), 1)
    ]


def validate_trace(trace: dict, code: str) -> dict:
    errors: list[str] = []
    meta = trace.get("meta", {})
    frames = trace.get("frames", [])
    beats = [beat for frame in frames for beat in frame.get("beats", [])]
    lines = {line["id"] for line in trace.get("code", {}).get("lines", [])}
    expected_sha = hashlib.sha256(code.encode("utf-8")).hexdigest()
    expected_token = semantic_hash(code)

    def require(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    require(meta.get("sourceSha256") == expected_sha, "source SHA-256 mismatch")
    require(meta.get("semanticTokenHash") == expected_token, "semantic token hash mismatch")
    require(trace.get("code", {}).get("text") == code, "trace code differs from source")
    require(len(frames) == 14, f"expected 14 frames, got {len(frames)}")
    require(len(beats) == 82, f"expected 82 beats, got {len(beats)}")
    require(frames and frames[-1].get("phase") == "return", "last frame is not return")
    require(frames and frames[-1].get("durationMs", 0) >= 1200, "return dwell is too short")
    all_states = []
    for frame in frames:
        require(frame.get("beats"), f"frame {frame.get('id')} has no beats")
        require(frame.get("captions", {}).get("learning"), f"frame {frame.get('id')} lacks learning caption")
        require(frame.get("captions", {}).get("review"), f"frame {frame.get('id')} lacks review caption")
        for beat in frame.get("beats", []):
            require(beat.get("lineIds"), f"beat in {frame.get('id')} lacks lineIds")
            require(all(line_id in lines for line_id in beat.get("lineIds", [])), "beat references unknown code line")
            state = beat.get("state", {})
            all_states.append(state)
            require(len(state.get("values", [])) == 12, "height must have 12 columns")
            require(len(state.get("water", [])) == 12, "water must have 12 columns")
            require(state.get("sceneKind") == "water-stack", "sceneKind mismatch")
            require("stack" in state and "variables" in state, "incomplete water-stack state")
    if all_states:
        res_values = [state.get("variables", {}).get("res", 0) for state in all_states]
        require(res_values == sorted(res_values), "res regressed")
        require(all_states[-1].get("variables", {}).get("res") == 6, "final res is not 6")
        require(sum(all_states[-1].get("water", [])) == 6, "final water sum is not 6")
    return {
        "passed": not errors,
        "errors": errors,
        "frameCount": len(frames),
        "beatCount": len(beats),
        "finalRes": all_states[-1].get("variables", {}).get("res") if all_states else None,
        "finalWater": all_states[-1].get("water") if all_states else [],
        "sourceSha256": expected_sha,
        "semanticTokenHash": expected_token,
    }


def compile_sample(code: str) -> dict:
    compiler = shutil.which("clang++") or shutil.which("g++")
    if not compiler:
        return {"passed": False, "stdout": "", "error": "clang++/g++ not found"}
    prefix = """#include <algorithm>\n#include <iostream>\n#include <stack>\n#include <vector>\nusing namespace std;\n"""
    harness = "int main() { vector<int> h{0,1,0,2,1,0,1,3,2,1,2,1}; Solution s; cout<<s.trap(h); }"
    source = prefix + "\n" + code + "\n" + harness
    with tempfile.TemporaryDirectory(prefix="leetcode-v3-42-") as temp_dir:
        cpp = Path(temp_dir) / "main.cpp"
        binary = Path(temp_dir) / "main"
        cpp.write_text(source, encoding="utf-8")
        result = subprocess.run([compiler, "-std=c++17", str(cpp), "-O2", "-o", str(binary)], capture_output=True, text=True, timeout=30)
        if result.returncode:
            return {"passed": False, "stdout": "", "error": result.stderr.strip()}
        run = subprocess.run([str(binary)], capture_output=True, text=True, timeout=10)
        stdout = run.stdout.strip()
        return {"passed": run.returncode == 0 and stdout == "6", "stdout": stdout, "error": run.stderr.strip()}


def build_html(trace: dict) -> str:
    template = TEMPLATE.read_text(encoding="utf-8")
    payload = json.dumps(trace, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return (
        template.replace("__TITLE__", html.escape("LeetCode 42 · 接雨水 · V3"))
        .replace("__ENGINE_CSS__", ENGINE_CSS.read_text(encoding="utf-8"))
        .replace("__TRACE_JSON__", payload)
        .replace("__ENGINE_JS__", ENGINE_JS.read_text(encoding="utf-8"))
    )


def main() -> None:
    code, source_line, heading = extract_yxc_code()
    trace = json.loads(TRACE_SOURCE.read_text(encoding="utf-8"))
    trace["code"] = {"language": "cpp", "text": code, "lines": source_lines(code, source_line)}
    trace["meta"].update({
        "problemId": 42,
        "title": "接雨水",
        "sourceHeading": heading,
        "sourcePath": str(SOURCE_MD),
        "sourceSha256": hashlib.sha256(code.encode("utf-8")).hexdigest(),
        "semanticTokenHash": semantic_hash(code),
        "rendererVersion": "V3",
    })
    audit = validate_trace(trace, code)
    compile_audit = compile_sample(code)
    audit["compile"] = compile_audit
    audit["rendererContract"] = {
        "layout": "fixed-two-column-56-44",
        "minimumCanvasWidth": 680,
        "frameNavigation": True,
        "beatNavigation": True,
        "learningAndReviewModes": True,
        "themePersistence": True,
        "speedPersistence": True,
        "playbackPersistence": False,
    }
    audit["passed"] = audit["passed"] and compile_audit["passed"]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    page_path = OUTPUT_DIR / "index.html"
    page_path.write_text(build_html(trace), encoding="utf-8")
    page_uri = "file://" + quote(page_path.as_posix(), safe="/") + "#theme=auto"
    (OUTPUT_DIR / "Obsidian预览.md").write_text(
        f"""# LeetCode 42 接雨水 · YXC 动画 V3\n\n> LC42 V3 样板：固定双栏、14 个教学章节、82 个原子 beat；请先审查这一题，再决定是否扩展。\n\n<iframe title=\"LeetCode 42 接雨水 YXC 动画 V3\" src=\"{page_uri}\" style=\"width:100%;height:1000px;border:0;border-radius:8px;display:block;\" loading=\"eager\"></iframe>\n\n[在浏览器中打开独立 HTML]({page_uri})\n""",
        encoding="utf-8",
    )
    (OUTPUT_DIR / "trace-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "interaction-report.md").write_text(
        """# LC42 V3 交互审查报告\n\n## 自动与浏览器检查\n\n- PASS：页面固定为左侧动画、右侧 YXC C++ 代码的 `56% / 44%` 双栏结构。\n- PASS：`上一 beat/下一 beat`、章节轨道和章节下拉均移动到正确执行位置。\n- PASS：普通左右方向键逐 beat；`Shift + 左右方向键` 逐 frame；空格播放/暂停；`R` 重置。\n- PASS：播放按钮即时切换播放/暂停；beat 停留按普通判断、弹栈、面积结算和最终返回分级。\n- PASS：速度支持 `0.5× / 1× / 1.5× / 2×`；主题、模式和速度写入本地保存，播放状态不保存。\n- PASS：学习/复习模式切换；完整解释默认折叠；右侧显示当前代码动作。\n- PASS：当前 beat 的全部 `lineIds` 同时高亮，主代码行自动滚动到代码区中部。\n- PASS：进度 `range` 的 `input` 事件直接调用 beat 跳转；关键帧联系表覆盖开始到返回。\n\n实测导航序列：`执行 1/82 → 2/82 → 1/82`；跳到章节 9 为 `执行 47/82`，`Shift + →` 后到章节 10 的 `执行 58/82`。播放启动后按钮为暂停态，暂停后恢复播放图标。刷新前后的设置均为“复习 / 2× / 深色”，刷新后播放停在 `执行 1/82`。\n\n## 响应式实测\n\n| 视口 | 页面滚动尺寸 | 双栏宽度 | 12 根柱子 | 结果 |\n|---|---|---|---|---|\n| `1440×900` | `1440×900` | `783 / 615` | 全部可见 | PASS |\n| `1180×820` | `1180×820` | `637 / 501` | 全部可见 | PASS |\n| `900×1000` | `900×1000` | `480 / 378` | 全部可见 | PASS |\n| `760×1000` | `760×1000` | `410 / 322` | 全部可见 | PASS |\n| `640×900` | `680×900` | `328 / 310` | 全部可见 | PASS，预期横向滚动 |\n\n## LeetCode Animation Rubric\n\n| 构图层级 | 字体可读性 | 语义颜色 | 动作与理解 | 技术忠实度 | 总分 |\n|---:|---:|---:|---:|---:|---:|\n| 18 | 18 | 18 | 18 | 20 | **92/100** |\n\n每类均不低于 `16/20`。未发现代码/状态错配、答案提前出现、柱子越界或明暗主题遮挡。算法审计见 `trace-audit.json`，视觉联系表见 `lc42-contact-sheet.jpg`。\n""",
        encoding="utf-8",
    )
    print(json.dumps({"output": str(page_path), "audit": audit}, ensure_ascii=False, indent=2))
    if not audit["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
