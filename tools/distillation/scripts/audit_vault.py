#!/usr/bin/env python3
"""Audit the vault distillation without changing source material.

This script deliberately writes only derived files below ``distillation/``.
It is intended to be rerun after new notes, source files, assets, or Skills are
added.  A file being present in a domain is not treated as distilled: the
report distinguishes explicit Skill evidence, domain-level references,
indexed-only material, and non-text evidence.
"""

from __future__ import annotations

import hashlib
import json
import re
import csv
import fnmatch
from zipfile import BadZipFile, ZipFile, is_zipfile
from collections import Counter, defaultdict
from pathlib import Path

import coverage_review


VAULT = Path(__file__).resolve().parents[2]
DISTILLATION = VAULT / "distillation"
CANONICAL_SKILLS = DISTILLATION / "skills"
EXCLUDED_TOP_LEVEL = {"distillation", ".obsidian", ".claude", ".claudian", "__pycache__"}
EXCLUDED_PARTS = {"distillation", ".obsidian", ".claude", ".claudian", "__pycache__", ".git"}
HISTORICAL_INVENTORY = DISTILLATION / "source-inventory.tsv"
DISPOSITION_OVERRIDES = DISTILLATION / "source-disposition-overrides.tsv"
SOURCE_FRESHNESS_REVIEW = DISTILLATION / "source-freshness-review.tsv"
CLIENTS = {
    # Only the user-level ZCode discovery root is an active delivery target.
    "zcode": Path.home() / ".zcode" / "skills",
}

PRESSURE_MATRIX = DISTILLATION / "skill-pressure-test-matrix.md"
MIXED_INTENT_MATRIX = DISTILLATION / "skill-mixed-intent-matrix.json"
MIXED_INTENT_MARKDOWN = DISTILLATION / "skill-mixed-intent-matrix.md"
KNOWN_EXTERNAL_RELATED = {"cangjie-skill", "json-canvas", "skill-creator"}


def rel(path: Path) -> str:
    return path.relative_to(VAULT).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def classify_domain(path: str) -> str:
    if path == "archive/acwing/算法基础课模板大全-C++版本.pdf":
        return "algorithm-pdf"
    if path.startswith("projects/嵌入式八股/"):
        return "embedded-core"
    if path == "archive/糯叽叽八股（完整版）.md":
        return "embedded-core-derived"
    if path.startswith("projects/RTOS项目/"):
        return "rtos-project"
    if path.startswith("projects/Linux物理内存检测项目/"):
        return "linux-memory-ebpf"
    if path.startswith("projects/linux视觉感知项目/"):
        return "linux-vision"
    if path.startswith("archive/大丙Linux教程/"):
        return "linux-systems-tutorial"
    if path.startswith("archive/力扣刷题/"):
        return "leetcode-algorithm-learning"
    if path.startswith("archive/项目交互动画/"):
        return "interactive-learning-labs"
    if path.startswith("archive/思维导图/"):
        return "canvas-mindmaps"
    if path.startswith("tools/"):
        return "vault-methodology-and-tools"
    if path.startswith("工作台/"):
        return "workbench-learning-state"
    if path.startswith("assets/"):
        return "attachments-evidence"
    if path.startswith("小红书（RedNote）/"):
        return "rednote-bookmarks"
    return "vault-root-or-unknown"


def frontmatter_value(text: str, key: str) -> str:
    """Read one simple scalar from a vault note's YAML frontmatter."""
    match = re.search(r"^" + re.escape(key) + r":\s*(.*)$", text, flags=re.MULTILINE)
    if not match:
        return ""
    value = match.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1]
    return value


def source_target_from_wikilink(value: str) -> str:
    """Convert an Obsidian wikilink-ish source value to a vault-relative path."""
    value = value.strip()
    # Do not use a non-greedy ``\[\[.*?\]\]`` expression here.  A source
    # heading may legitimately contain a bracket pair, for example
    # ``delete[]``; the first ``]]`` in that value is then the array's closing
    # bracket plus the first wikilink bracket, not the end of the wikilink.
    # Removing the outer pair first lets the whole target survive intact.
    if value.startswith("[[") and value.endswith("]]" ):
        inner = value[2:-2]
        target = inner.split("|", 1)[0].split("#", 1)[0].strip()
        if target:
            return target
    # Keep a conservative fallback for prose that embeds a wikilink rather
    # than storing the complete value as a wikilink scalar.
    match = re.search(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]", value)
    if match:
        return match.group(1).strip()
    return value.strip().split("#", 1)[0].strip()


def frontmatter_metadata_value(text: str, key: str) -> str:
    """Read a simple scalar from the nested Skill ``metadata`` block."""
    lines = frontmatter_lines(text)
    active = False
    for line in lines:
        stripped = line.strip()
        indent = len(line) - len(line.lstrip(" "))
        if stripped == "metadata:":
            active = True
            continue
        if active and indent == 0 and stripped and stripped != "metadata:":
            active = False
        if active and indent > 0 and stripped.startswith(key + ":"):
            value = stripped.split(":", 1)[1].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
                value = value[1:-1] if value[0] == '"' else value[1:-1].replace("''", "'")
            return value
    return ""


def write_workbench_state() -> dict[str, object]:
    """Materialize the learning-state layer without changing workbench notes."""
    workbench = VAULT / "工作台"
    records_dir = workbench / "条目记录"
    output_dir = DISTILLATION / "workbench-learning-state"
    output_dir.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, str]] = []
    for path in sorted(records_dir.glob("*.md")) if records_dir.is_dir() else []:
        text = path.read_text(encoding="utf-8", errors="replace")
        source_value = frontmatter_value(text, "source")
        source_target = source_target_from_wikilink(source_value)
        rows.append(
            {
                "record_file": rel(path),
                "record_id": frontmatter_value(text, "record_id"),
                "title": frontmatter_value(text, "title"),
                "unit_type": frontmatter_value(text, "unit_type"),
                "track": frontmatter_value(text, "track"),
                "module": frontmatter_value(text, "module"),
                "mastery": frontmatter_value(text, "mastery"),
                "review_flag": frontmatter_value(text, "review_flag"),
                "last_studied": frontmatter_value(text, "last_studied"),
                "source_value": source_value,
                "source_target": source_target,
                "source_exists": "yes" if source_target and (VAULT / source_target).is_file() else "no",
            }
        )

    columns = [
        "record_file", "record_id", "title", "unit_type", "track", "module",
        "mastery", "review_flag", "last_studied", "source_value", "source_target",
        "source_exists",
    ]
    with (output_dir / "records.tsv").open("w", encoding="utf-8", newline="") as handle:
        handle.write("\t".join(columns) + "\n")
        for row in rows:
            handle.write("\t".join(row[column].replace("\t", " ").replace("\n", " ") for column in columns) + "\n")

    by_track = Counter(row["track"] or "(missing)" for row in rows)
    by_mastery = Counter(row["mastery"] or "(missing)" for row in rows)
    by_review = Counter(row["review_flag"] or "(missing)" for row in rows)
    invalid = [
        row for row in rows
        if row["mastery"] not in {"未学", "学过", "掌握"}
        or row["review_flag"] not in {"待回看", "已回看"}
        or not row["source_target"]
        or row["source_exists"] != "yes"
    ]
    title_missing = [row for row in rows if not row["title"]]
    duplicate_record_ids = sorted(
        record_id
        for record_id, count in Counter(row["record_id"] for row in rows if row["record_id"]).items()
        if count > 1
    )
    status_lines = [
        "# 学习工作台状态审计",
        "",
        "> 这是 `工作台/` 的派生审计，不会回写或修改任何学习状态。完整逐条记录见 [`records.tsv`](records.tsv)。",
        "",
        "## 当前快照",
        "",
        f"- 条目记录：{len(rows)} 条",
        f"- 主线：{', '.join(f'{key}={value}' for key, value in sorted(by_track.items()))}",
        f"- 掌握状态：{', '.join(f'{key}={value}' for key, value in sorted(by_mastery.items()))}",
        f"- 回看状态：{', '.join(f'{key}={value}' for key, value in sorted(by_review.items()))}",
        f"- 状态/来源异常：{len(invalid)} 条",
        f"- 元数据异常：标题缺失 {len(title_missing)} 条；重复 record_id {len(duplicate_record_ids)} 组",
        "",
        "## 解释口径",
        "",
        "- `未学`：没有正式处理；`学过`：看过但不能稳定复述；`掌握`：可以脱稿解释并应对基本追问。",
        "- `待回看` 与 `已回看` 独立于掌握状态；掌握的内容也可以待回看。",
        "- 记录中的 `source` 必须能解析到当前 vault 的真实文件；状态层不把来源内容复制为答案。",
        "- 本报告不能证明学习者真实会答，只能证明当前记录的声明、来源链接和字段状态可审计。",
        "",
        "## 继续动作",
        "",
        "1. 优先从 `学过 + 待回看` 中做无提示口述，再决定是否改为 `掌握`。",
        "2. 对 `未学` 条目先回到 `source_target`，完成理解后再更新原记录。",
        "3. 使用 `embedded-learning-state-and-active-recall` 生成复习顺序时，不要把自动排序当成学习事实。",
    ]
    if invalid:
        status_lines += ["", "## 异常条目", ""]
        status_lines.extend(
            f"- `{row['record_file']}`：mastery={row['mastery'] or '(missing)'}；review={row['review_flag'] or '(missing)'}；source={row['source_target'] or '(missing)'}；source_exists={row['source_exists']}"
            for row in invalid
        )
    if title_missing or duplicate_record_ids:
        status_lines += ["", "## 元数据异常", ""]
        if title_missing:
            status_lines.extend(
                f"- `{row['record_file']}`：`title` 缺失；来源仍为 `{row['source_target']}`"
                for row in title_missing
            )
        if duplicate_record_ids:
            status_lines.append(f"- 重复 `record_id`：{', '.join(duplicate_record_ids)}")
    (output_dir / "STATUS_AUDIT.md").write_text("\n".join(status_lines) + "\n", encoding="utf-8")

    source_lines = [
        "# 学习工作台来源映射",
        "",
        "> 每一行把一个状态记录映射到原始学习入口；这是状态层的证据索引，不是对原文内容的复制。",
        "",
        f"- 总记录：{len(rows)} 条",
        f"- 有效来源路径：{sum(row['source_exists'] == 'yes' for row in rows)} 条",
        f"- 缺失/无法解析来源：{sum(row['source_exists'] != 'yes' for row in rows)} 条",
        "",
        "| 记录 | 主线 | 模块 | 掌握状态 | 回看 | 原始来源 | 来源存在 |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in rows:
        source = row["source_target"].replace("|", "\\|") or "(missing)"
        source_lines.append(
            f"| `{row['record_file']}` | {row['track']} | {row['module']} | {row['mastery']} | {row['review_flag']} | `{source}` | {row['source_exists']} |"
        )
    (output_dir / "source-map.md").write_text("\n".join(source_lines) + "\n", encoding="utf-8")

    # This queue is deliberately a recommendation layer.  It never writes
    # back to 工作台 and never invents a study date or mastery result.
    track_weight = {
        "项目八股": 0,
        "150题": 1,
        "小林系统": 2,
        "小林网络": 2,
        "大丙Linux": 2,
        "杂七杂八": 3,
    }
    module_weight = {
        "RTOS/FreeRTOS": 0,
        "项目": 0,
        "C/C++": 1,
        "MCU/STM32": 1,
        "通信协议/网络": 2,
        "Linux/OS": 2,
    }
    def queue_rank(row: dict[str, str]) -> tuple[int, int, str]:
        # Learned-but-unreviewed material is the first truthful default queue;
        # unlearned material follows, with project and core modules first.
        state_rank = {"学过": 0, "未学": 1, "掌握": 2}.get(row["mastery"], 9)
        return (
            state_rank * 100
            + track_weight.get(row["track"], 5) * 10
            + module_weight.get(row["module"], 5),
            int(row["record_id"].split("-")[-1]) if row["record_id"].split("-")[-1].isdigit() else 9999,
            row["record_file"],
        )

    queue_rows = sorted(
        [row for row in rows if row["review_flag"] == "待回看" and row["source_exists"] == "yes"],
        key=queue_rank,
    )
    queue_lines = [
        "# 推荐复习队列",
        "",
        "> 这是根据当前工作台字段生成的建议顺序，不是用户真实掌握度评估，也不会修改 `工作台/`。每次审计会刷新；完成一次真实回忆后，是否更新原记录仍由用户决定。",
        "",
        f"- 候选：{len(queue_rows)} 条（当前全部记录均为 `待回看`）。",
        "- 默认优先级：`学过 + 待回看` → `未学 + 待回看`；同层优先项目八股和核心模块，再按记录号稳定排序。",
        "- 建议动作：只先展示标题/来源定位，完成“是什么—机制—验证—边界”口述；卡住时再给一个最小提示。",
        "",
        "## 前 30 条",
        "",
        "| 序号 | 记录 | 主线 | 模块 | 状态 | 标题 | 原始来源 |",
        "|---:|---|---|---|---|---|---|",
    ]
    for index, row in enumerate(queue_rows[:30], 1):
        title = row["title"].replace("|", "\\|")
        source = row["source_target"].replace("|", "\\|")
        queue_lines.append(
            f"| {index} | `{row['record_file']}` | {row['track']} | {row['module']} | {row['mastery']} | {title} | `{source}` |"
        )
    queue_lines += [
        "",
        "## 复习后记录口径",
        "",
        "- 独立完成：可由用户考虑是否保留 `学过` 或升级 `掌握`。",
        "- 最小提示后完成：保留 `学过`，记录薄弱关键词。",
        "- 仍无法解释：保留 `未学`/`学过`，不要由模型代填 `掌握`。",
        "- 项目题：额外要求给出源码路径、符号和个人贡献证据；没有这些证据时只说设计或仓库事实。",
    ]
    (output_dir / "REVIEW_QUEUE.md").write_text("\n".join(queue_lines) + "\n", encoding="utf-8")
    return {
        "records": len(rows),
        "tracks": dict(by_track),
        "mastery": dict(by_mastery),
        "review": dict(by_review),
        "invalid": len(invalid),
        "source_missing": sum(row["source_exists"] != "yes" for row in rows),
        "title_missing": len(title_missing),
        "duplicate_record_ids": duplicate_record_ids,
        "review_queue": len(queue_rows),
        "review_queue_path": rel(output_dir / "REVIEW_QUEUE.md"),
    }


def classify_file(path: Path, path_string: str) -> str:
    suffix = path.suffix.lower()
    name = path.name.lower()
    path_parts_lower = {part.casefold() for part in Path(path_string).parts}
    if path_parts_lower & {"build", "obj", "out"}:
        return "build-artifact"
    if suffix in {".o", ".a", ".so", ".bin", ".hex", ".crf", ".d", ".lst", ".map", ".elf", ".axf", ".uvguix"}:
        return "build-artifact"
    if suffix == ".canvas":
        return "derived-canvas"
    if "backup" in name or ".bak" in name or ".lzy" in name:
        return "derived-backup"
    if path_string.startswith("archive/项目交互动画/") and suffix in {".html", ".js", ".css", ".cjs"}:
        return "runnable-learning-lab"
    if path_string.startswith("assets/") or suffix in {
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".onnx", ".epub", ".woff",
    }:
        return "attachment-evidence"
    if suffix in {".md", ".txt", ".pdf"}:
        return "knowledge-document"
    if suffix in {".c", ".h", ".cpp", ".cc", ".hpp", ".py", ".sh", ".swift", ".bat", ".cmake", ".pro", ".ini", ".json", ".yaml", ".yml", ".tsv"}:
        return "code-or-config"
    return "other-binary-or-config"


def is_excluded_path(path: Path) -> bool:
    """Exclude generated/cache trees at any depth, not only at vault root."""
    parts = path.relative_to(VAULT).parts
    return any(part in EXCLUDED_PARTS for part in parts)


def inventory() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for path in sorted(VAULT.rglob("*")):
        if not path.is_file():
            continue
        path_string = rel(path)
        if is_excluded_path(path):
            continue
        records.append(
            {
                "domain": classify_domain(path_string),
                "class": classify_file(path, path_string),
                "size_bytes": path.stat().st_size,
                "sha256": sha256(path),
                "sha256_16": sha256(path)[:16],
                "path": path_string,
            }
        )
    return records


def source_files_from_skill(skill_path: Path) -> list[str]:
    text = skill_path.read_text(encoding="utf-8", errors="replace")
    return metadata_list_from_skill(text, "source_files")


def frontmatter_lines(text: str) -> list[str]:
    """Return the YAML frontmatter lines without requiring PyYAML."""
    if not text.startswith("---\n"):
        return []
    parts = text.split("---\n", 2)
    return parts[1].splitlines() if len(parts) == 3 else []


def metadata_list_from_skill(text: str, field: str) -> list[str]:
    """Read a small YAML scalar-list field from top-level or metadata blocks.

    Skill Creator only permits custom frontmatter under ``metadata``.  The
    distillation package keeps source paths and symbols there so the official
    validator can load every Skill, while this dependency-free audit still
    resolves both the old top-level shape and the new nested shape.
    """
    frontmatter = frontmatter_lines(text)
    found, values = _metadata_list_from_lines(frontmatter, field)
    if found:
        # Prefer the official frontmatter metadata.  Some incremental Skills
        # also repeat a human-readable evidence block in the body; combining
        # both would silently double-count or broaden the machine contract.
        return values

    # A few early Skills kept their evidence block in the Markdown body
    # instead of frontmatter.  Preserve that form as a readable fallback, but
    # only after proving the field is absent from frontmatter.
    parts = text.split("---\n", 2) if text.startswith("---\n") else []
    body = parts[2] if len(parts) == 3 else text
    return _metadata_list_from_lines(body.splitlines(), field)[1]


def _metadata_list_from_lines(lines: list[str], field: str) -> tuple[bool, list[str]]:
    """Parse one small YAML-like list and report whether its key was present."""
    values: list[str] = []
    found = False
    active_indent: int | None = None
    in_fence = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(("```", "~~~")):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if not stripped:
            if active_indent is not None:
                continue
            continue
        indent = len(line) - len(line.lstrip(" "))
        # Body-level evidence blocks are intentionally supported as a
        # dependency-free fallback for older Skills.  A Markdown heading (or
        # any other non-list line) at the same/shallower indentation ends the
        # YAML-like list.  Without this guard, a later section such as ``## R``
        # could leave ``active_indent`` open and make unrelated nested bullets
        # look like source symbols.
        if active_indent is not None and indent <= active_indent and not stripped.startswith("-"):
            active_indent = None
        if ":" in stripped:
            key, rest = stripped.split(":", 1)
            if key == field:
                found = True
                active_indent = indent
                rest = rest.strip()
                if rest:
                    values.extend(split_inline_list(rest))
                continue
            if active_indent is not None and indent <= active_indent:
                active_indent = None
        if active_indent is None or indent <= active_indent or not stripped.startswith("-"):
            continue
        value = stripped[1:].strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1] if value[0] == '"' else value[1:-1].replace("''", "'")
        values.append(value)
    return found, values


def split_inline_list(value: str) -> list[str]:
    """Split the small YAML-like lists used by Skill metadata.

    Skill metadata intentionally stays dependency-free.  A plain ``str.split``
    would incorrectly split symbols such as ``TRACEPOINT_PROBE(kmem, ...)``;
    this scanner only treats commas outside quotes and parentheses as item
    separators.
    """
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        value = value[1:-1]
    values: list[str] = []
    token: list[str] = []
    quote = ""
    escaped = False
    paren_depth = 0
    for char in value:
        if quote:
            token.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = ""
            continue
        if char in {"'", '"'}:
            quote = char
            token.append(char)
        elif char == "(":
            paren_depth += 1
            token.append(char)
        elif char == ")" and paren_depth:
            paren_depth -= 1
            token.append(char)
        elif char == "," and paren_depth == 0:
            item = "".join(token).strip()
            if item:
                values.append(item.strip("\"'"))
            token = []
        else:
            token.append(char)
    item = "".join(token).strip()
    if item:
        values.append(item.strip("\"'"))
    return values


def source_symbols_from_skill(skill_path: Path) -> list[str]:
    """Read inline or block ``source_symbols`` metadata without PyYAML."""
    text = skill_path.read_text(encoding="utf-8", errors="replace")
    return metadata_list_from_skill(text, "source_symbols")


def related_skills_from_skill(
    skill_path: Path, canonical_names: set[str]
) -> tuple[list[str], list[str], dict[str, str]]:
    """Read declared Skill relationships without guessing from body prose.

    Only frontmatter metadata participates.  A non-canonical name in the
    legacy ``related_skills`` field is retained as an external relationship;
    names explicitly placed in ``external_related_skills`` are treated the
    same way.  Unknown names remain visible with ``unknown`` status so a typo
    cannot silently become a valid routing edge.
    """
    text = skill_path.read_text(encoding="utf-8", errors="replace")
    declared = metadata_list_from_skill(text, "related_skills")
    declared_external = metadata_list_from_skill(text, "external_related_skills")
    canonical: list[str] = []
    external: list[str] = []
    status: dict[str, str] = {}

    def add_once(target: list[str], value: str) -> None:
        if value and value not in target:
            target.append(value)

    for value in declared + declared_external:
        if not value:
            continue
        if value in canonical_names:
            add_once(canonical, value)
            status[value] = "canonical"
        else:
            add_once(external, value)
            status[value] = (
                "external" if value in KNOWN_EXTERNAL_RELATED or value in declared_external else "unknown"
            )
    return canonical, external, status


def json_object_reject_duplicates(pairs: list[tuple[object, object]]) -> dict[object, object]:
    """Build a JSON object while rejecting duplicate keys.

    Python's default ``json.loads`` keeps the last value for a repeated key.
    That is convenient for permissive input, but unsafe for auditable derived
    artifacts: a duplicated ``version``/``test_cases`` key can silently hide
    an earlier declaration.  ``object_pairs_hook`` calls this for every JSON
    object, including nested test-case objects.
    """
    result: dict[object, object] = {}
    duplicates: list[str] = []
    for key, value in pairs:
        if key in result:
            duplicates.append(str(key))
        result[key] = value
    if duplicates:
        names = ", ".join(sorted(set(duplicates)))
        raise ValueError(f"duplicate JSON key(s): {names}")
    return result


def json_artifact_audit() -> dict[str, object]:
    """Validate every derived JSON artifact and reject duplicate object keys."""
    files: list[str] = []
    errors: list[str] = []
    duplicate_key_files: list[str] = []
    for path in sorted(DISTILLATION.rglob("*.json")):
        if "__pycache__" in path.parts:
            continue
        relative = rel(path)
        files.append(relative)
        try:
            json.loads(
                path.read_text(encoding="utf-8"),
                object_pairs_hook=json_object_reject_duplicates,
            )
        except json.JSONDecodeError as exc:
            errors.append(f"{relative}: invalid JSON: {exc}")
        except ValueError as exc:
            message = str(exc)
            if message.startswith("duplicate JSON key"):
                duplicate_key_files.append(relative)
            errors.append(f"{relative}: {message}")
        except OSError as exc:
            errors.append(f"{relative}: read error: {exc}")
    return {
        "file_count": len(files),
        "files": files,
        "duplicate_key_files": duplicate_key_files,
        "errors": errors,
    }


def source_symbol_audit(skill_sources: dict[str, set[str]]) -> dict[str, object]:
    """Report whether declared source symbols are literal source anchors.

    A non-literal symbol is not automatically an error: Skills may declare a
    conceptual label such as ``last-known-good-stage`` or a qualified API name
    whose leaf appears in a source file.  The report separates exact matches,
    qualified-name fallbacks, and labels requiring human review so the audit
    never upgrades a semantic label into a false source claim.
    """
    rows: list[dict[str, object]] = []
    totals = Counter()
    for skill_name, paths in sorted(skill_sources.items()):
        skill_file = CANONICAL_SKILLS / skill_name / "SKILL.md"
        symbols = source_symbols_from_skill(skill_file)
        source_texts = {
            path: (VAULT / path).read_text(encoding="utf-8", errors="replace")
            for path in sorted(paths)
            if (VAULT / path).is_file()
        }
        for symbol in symbols:
            exact_paths = [path for path, text in source_texts.items() if symbol in text]
            if exact_paths:
                status = "exact"
                matched = exact_paths
            else:
                leaf = symbol.rsplit("::", 1)[-1] if "::" in symbol else ""
                leaf_paths = [path for path, text in source_texts.items() if leaf and leaf in text]
                if leaf_paths:
                    status = "qualified-leaf"
                    matched = leaf_paths
                else:
                    status = "review-label"
                    matched = []
            totals[status] += 1
            rows.append(
                {
                    "skill": skill_name,
                    "symbol": symbol,
                    "status": status,
                    "matched_source_files": ";".join(matched),
                }
            )

    tsv_path = DISTILLATION / "source-symbol-audit.tsv"
    with tsv_path.open("w", encoding="utf-8", newline="") as handle:
        handle.write("skill\tsymbol\tstatus\tmatched_source_files\n")
        for row in rows:
            handle.write(
                "\t".join(
                    str(row[key]).replace("\t", " ").replace("\n", " ")
                    for key in ("skill", "symbol", "status", "matched_source_files")
                )
                + "\n"
            )

    by_skill: defaultdict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        by_skill[str(row["skill"])].append(row)
    lines = [
        "# Skill 来源符号审计",
        "",
        "> 本报告只审计 `source_symbols` 是否能在该 Skill 声明的 `source_files` 中逐字定位；它不把概念标签、文档术语或带命名空间的 API 名称误判成来源缺失。完整逐符号记录见 [`source-symbol-audit.tsv`](source-symbol-audit.tsv)。",
        "",
        f"- Skill 数：{len(by_skill)}",
        f"- 声明符号：{len(rows)}",
        f"- 逐字命中：{totals.get('exact', 0)}",
        f"- 限定名叶子命中：{totals.get('qualified-leaf', 0)}",
        f"- 需要人工确认的语义标签：{totals.get('review-label', 0)}",
        "",
        "## 按 Skill 汇总",
        "",
        "| Skill | 符号数 | 逐字命中 | 限定名叶子命中 | 语义/待确认 |",
        "|---|---:|---:|---:|---:|",
    ]
    for skill_name in sorted(by_skill):
        counts = Counter(str(row["status"]) for row in by_skill[skill_name])
        lines.append(
            f"| `{skill_name}` | {len(by_skill[skill_name])} | {counts.get('exact', 0)} | {counts.get('qualified-leaf', 0)} | {counts.get('review-label', 0)} |"
        )
    lines += ["", "## 需要人工确认的标签", ""]
    for skill_name in sorted(by_skill):
        pending = [str(row["symbol"]) for row in by_skill[skill_name] if row["status"] == "review-label"]
        if pending:
            lines.append(f"- `{skill_name}`：" + "、".join(f"`{symbol}`" for symbol in pending))
    lines += [
        "",
        "## 判定口径",
        "",
        "- `exact`：符号字符串在至少一个真实来源文件中出现，可直接作为定位提示。",
        "- `qualified-leaf`：完整限定名未出现，但去掉命名空间后的叶子名称出现；回答时仍需人工确认它是否对应同一 API/方法。",
        "- `review-label`：更可能是概念、字段语义、面试标签或来源中的不同写法；不因此判定 Skill 错误，也不把它写成精确源码事实。",
    ]
    (DISTILLATION / "source-symbol-audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {
        "skill_count": len(by_skill),
        "symbol_count": len(rows),
        "exact": totals.get("exact", 0),
        "qualified_leaf": totals.get("qualified-leaf", 0),
        "review_label": totals.get("review-label", 0),
        "path": rel(DISTILLATION / "source-symbol-audit.tsv"),
    }


def canonical_skill_audit() -> tuple[dict[str, object], dict[str, set[str]]]:
    skill_dirs = sorted(path for path in CANONICAL_SKILLS.iterdir() if path.is_dir())
    errors: list[str] = []
    skill_sources: dict[str, set[str]] = {}
    for directory in skill_dirs:
        name = directory.name
        skill_file = directory / "SKILL.md"
        test_file = directory / "test-prompts.json"
        if not skill_file.is_file():
            errors.append(f"{name}: missing SKILL.md")
            continue
        text = skill_file.read_text(encoding="utf-8", errors="replace")
        if re.search(r"\[TODO:|Structuring This Skill|Delete this entire .*section", text):
            errors.append(f"{name}: SKILL.md still contains generator TODO/template text")
        # Keep the metadata audit dependency-free.  PyYAML is not guaranteed
        # to be available on the machine, but the fields that determine Skill
        # discovery are deliberately simple scalars in the frontmatter.
        if not text.startswith("---\n"):
            errors.append(f"{name}: SKILL.md missing YAML frontmatter")
        else:
            frontmatter_end = text.find("\n---", 4)
            if frontmatter_end < 0:
                errors.append(f"{name}: unterminated YAML frontmatter")
            else:
                frontmatter = text[4:frontmatter_end]
                declared_name = frontmatter_value(frontmatter, "name")
                description = frontmatter_value(frontmatter, "description")
                if declared_name != name:
                    errors.append(f"{name}: frontmatter name mismatch ({declared_name or 'missing'})")
                if not description:
                    errors.append(f"{name}: missing frontmatter description")
                elif len(description) > 1024:
                    errors.append(f"{name}: frontmatter description exceeds 1024 characters")
        for marker in ("## R", "## I", "## A1", "## A2", "## E", "## B"):
            if marker not in text:
                errors.append(f"{name}: missing {marker}")
        paths = set(source_files_from_skill(skill_file))
        skill_sources[name] = paths
        if not paths:
            errors.append(f"{name}: empty source_files")
        for source in sorted(paths):
            if not (VAULT / source).is_file():
                errors.append(f"{name}: missing source_files path {source}")
        symbols = source_symbols_from_skill(skill_file)
        if not symbols:
            errors.append(f"{name}: missing source_symbols metadata")
        openai_file = directory / "agents" / "openai.yaml"
        if not openai_file.is_file():
            errors.append(f"{name}: missing agents/openai.yaml")
        else:
            openai_text = openai_file.read_text(encoding="utf-8", errors="replace")
            if not re.search(r"(?m)^interface:\s*$", openai_text):
                errors.append(f"{name}: agents/openai.yaml missing interface")
            for field in ("display_name", "short_description"):
                if not re.search(r"(?m)^\s+" + re.escape(field) + r":\s*.+$", openai_text):
                    errors.append(f"{name}: agents/openai.yaml missing {field}")
        if not test_file.is_file():
            errors.append(f"{name}: missing test-prompts.json")
        else:
            try:
                data = json.loads(
                    test_file.read_text(encoding="utf-8"),
                    object_pairs_hook=json_object_reject_duplicates,
                )
                if not isinstance(data.get("version"), str) or not data.get("version").strip():
                    errors.append(f"{name}: test-prompts.json missing string version")
                if data.get("darwin_compatible") is not True:
                    errors.append(f"{name}: test-prompts.json must declare darwin_compatible: true")
                cases = data.get("test_cases", [])
                if not isinstance(cases, list):
                    raise ValueError("test_cases must be an array")
                if data.get("skill") != name:
                    errors.append(f"{name}: test skill field mismatch")
                case_ids: list[str] = []
                for index, case in enumerate(cases):
                    if not isinstance(case, dict):
                        errors.append(f"{name}: test case {index} is not an object")
                        continue
                    case_id = case.get("id")
                    if not isinstance(case_id, str) or not case_id.strip():
                        errors.append(f"{name}: test case {index} missing string id")
                    else:
                        case_ids.append(case_id)
                    for field in ("type", "prompt", "expected_behavior"):
                        value = case.get(field)
                        if not isinstance(value, str) or not value.strip():
                            errors.append(f"{name}: test case {index} missing string {field}")
                duplicates = sorted(
                    case_id for case_id, count in Counter(case_ids).items() if count > 1
                )
                if duplicates:
                    errors.append(f"{name}: duplicate test case ids: {', '.join(duplicates)}")
                if len(cases) < 6:
                    errors.append(f"{name}: fewer than six test cases")
                for case_type in ("should_trigger", "should_not_trigger", "edge_case"):
                    if not any(case.get("type") == case_type for case in cases):
                        errors.append(f"{name}: missing test type {case_type}")
                counts = Counter(str(case.get("type", "")) for case in cases)
                if counts.get("should_trigger", 0) < 3:
                    errors.append(f"{name}: fewer than three should_trigger cases")
                if counts.get("should_not_trigger", 0) < 2:
                    errors.append(f"{name}: fewer than two should_not_trigger cases")
                if counts.get("edge_case", 0) < 1:
                    errors.append(f"{name}: missing edge_case")
            except (OSError, json.JSONDecodeError) as exc:
                errors.append(f"{name}: invalid test-prompts.json: {exc}")
            except ValueError as exc:
                errors.append(f"{name}: invalid test-prompts.json: {exc}")
        results_file = directory / "test-results.md"
        if not results_file.is_file():
            errors.append(f"{name}: missing test-results.md")
        else:
            results_text = results_file.read_text(encoding="utf-8", errors="replace")
            if not re.search(r"6\s*[／/]\s*6", results_text):
                errors.append(f"{name}: test-results.md missing static 6/6 result")
            if not re.search(r"静态|结构|路由|盲测|审查|检查", results_text):
                errors.append(f"{name}: test-results.md missing static-audit wording")
            if not re.search(
                r"未进行|尚未|待补|待执行|待完成|不等于|不是.*(?:实测|命中|触发率)|未.*(?:实测|盲测)|真实.*(?:待|未)|独立.*(?:待|未)",
                results_text,
            ):
                errors.append(f"{name}: test-results.md missing real-test limitation")
    return (
        {
            "skill_count": len(skill_dirs),
            "source_path_count": sum(len(paths) for paths in skill_sources.values()),
            "unique_source_path_count": len(set().union(*skill_sources.values())) if skill_sources else 0,
            "errors": errors,
        },
        skill_sources,
    )


def pressure_matrix_audit(skill_names: list[str]) -> dict[str, object]:
    """Ensure the pressure-test matrix has exactly one row per canonical Skill."""
    if not PRESSURE_MATRIX.is_file():
        return {
            "path": rel(PRESSURE_MATRIX),
            "row_count": 0,
            "duplicate_rows": [],
            "missing_skills": sorted(skill_names),
            "extra_rows": [],
            "errors": ["pressure matrix is missing"],
        }
    matrix_text = PRESSURE_MATRIX.read_text(encoding="utf-8", errors="replace")
    matrix_names = re.findall(r"^\|\s*`([^`]+)`\s*\|", matrix_text, flags=re.MULTILINE)
    matrix_counts = Counter(matrix_names)
    duplicate_rows = sorted(name for name, count in matrix_counts.items() if count > 1)
    skill_set = set(skill_names)
    matrix_set = set(matrix_names)
    missing_skills = sorted(skill_set - matrix_set)
    extra_rows = sorted(matrix_set - skill_set)
    errors = []
    if duplicate_rows:
        errors.append("duplicate pressure-matrix rows: " + ", ".join(duplicate_rows))
    if missing_skills:
        errors.append("Skills missing from pressure matrix: " + ", ".join(missing_skills))
    if extra_rows:
        errors.append("pressure-matrix rows without canonical Skill: " + ", ".join(extra_rows))
    return {
        "path": rel(PRESSURE_MATRIX),
        "row_count": len(matrix_names),
        "duplicate_rows": duplicate_rows,
        "missing_skills": missing_skills,
        "extra_rows": extra_rows,
        "errors": errors,
    }


def mixed_intent_matrix_audit(skill_names: list[str]) -> dict[str, object]:
    """Validate static cross-Skill routing cases without claiming live hits."""
    result: dict[str, object] = {
        "path": rel(MIXED_INTENT_MATRIX),
        "markdown_path": rel(MIXED_INTENT_MARKDOWN),
        "case_count": 0,
        "duplicate_ids": [],
        "errors": [],
        "live_hit_rate_measured": False,
    }
    if not MIXED_INTENT_MATRIX.is_file():
        result["errors"] = ["mixed-intent JSON matrix is missing"]
        return result
    try:
        data = json.loads(
            MIXED_INTENT_MATRIX.read_text(encoding="utf-8"),
            object_pairs_hook=json_object_reject_duplicates,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        result["errors"] = [f"invalid mixed-intent JSON matrix: {exc}"]
        return result
    if not isinstance(data, dict):
        result["errors"] = ["mixed-intent JSON matrix root must be an object"]
        return result
    cases = data.get("cases")
    errors: list[str] = []
    if data.get("not_client_hit_rate") is not True:
        errors.append("mixed-intent matrix must declare not_client_hit_rate: true")
    if not isinstance(cases, list):
        errors.append("mixed-intent matrix cases must be an array")
        result["errors"] = errors
        return result
    canonical = set(skill_names)
    ids: list[str] = []
    markdown_lines = [
        "# 混合意图 Skill 路由对抗矩阵",
        "",
        "> 这是基于 description、边界和相邻 Skill 的静态路由预期，用来检查容易串路由的请求是否有明确主入口。它不是 Codex、Claude 或 ZCode 的真实命中率；真实会话盲测仍需在各客户端新会话中独立执行。",
        "",
        f"- 用例：{len(cases)}",
        "- 证据口径：静态预期，不是客户端实测",
        "",
        "| ID | Prompt | Expected primary Skill | Acceptable helper Skill | Must-not-primary Skill | Reason |",
        "|---|---|---|---|---|---|",
    ]
    for index, case in enumerate(cases):
        if not isinstance(case, dict):
            errors.append(f"case {index}: not an object")
            continue
        case_id = case.get("id")
        prompt = case.get("prompt")
        expected = case.get("expected_primary_skill")
        helpers = case.get("acceptable_helper_skills")
        must_not = case.get("must_not_primary_skills")
        reason = case.get("reason")
        if not isinstance(case_id, str) or not case_id.strip():
            errors.append(f"case {index}: missing id")
            case_id = f"case-{index}"
        ids.append(case_id)
        if not isinstance(prompt, str) or not prompt.strip():
            errors.append(f"{case_id}: missing prompt")
            prompt = "(missing prompt)"
        if not isinstance(expected, str) or expected not in canonical:
            errors.append(f"{case_id}: expected primary is not canonical ({expected!r})")
            expected = str(expected or "missing")
        if not isinstance(helpers, list) or not all(isinstance(item, str) for item in helpers):
            errors.append(f"{case_id}: acceptable_helper_skills must be a string array")
            helpers = []
        else:
            for helper in helpers:
                if helper not in canonical:
                    errors.append(f"{case_id}: unknown helper Skill {helper}")
        if not isinstance(must_not, list) or not all(isinstance(item, str) for item in must_not):
            errors.append(f"{case_id}: must_not_primary_skills must be a string array")
            must_not = []
        else:
            for forbidden in must_not:
                if forbidden not in canonical:
                    errors.append(f"{case_id}: unknown must-not Skill {forbidden}")
            if expected in must_not:
                errors.append(f"{case_id}: expected Skill is also must-not")
        if not isinstance(reason, str) or not reason.strip():
            errors.append(f"{case_id}: missing reason")
            reason = "(missing reason)"
        def cell(value: str) -> str:
            return value.replace("|", "\\|").replace("\n", " ").strip()
        markdown_lines.append(
            "| "
            + " | ".join(
                [
                    f"`{cell(case_id)}`",
                    cell(prompt),
                    f"`{cell(expected)}`",
                    ", ".join(f"`{cell(item)}`" for item in helpers) or "—",
                    ", ".join(f"`{cell(item)}`" for item in must_not) or "—",
                    cell(reason),
                ]
            )
            + " |"
        )
    duplicates = sorted(item for item, count in Counter(ids).items() if count > 1)
    if duplicates:
        errors.append("duplicate mixed-intent case IDs: " + ", ".join(duplicates))
    if len(cases) < 12:
        errors.append(f"mixed-intent matrix has {len(cases)} cases; expected at least 12")
    result.update(
        {
            "case_count": len(cases),
            "duplicate_ids": duplicates,
            "errors": errors,
        }
    )
    MIXED_INTENT_MARKDOWN.write_text("\n".join(markdown_lines) + "\n", encoding="utf-8")
    return result


def skill_index_audit(skill_names: list[str]) -> dict[str, object]:
    """Check that each primary domain index lists each canonical Skill once.

    The pressure matrix is the machine-readable source for a Skill's primary
    domain.  Domain INDEX files are human-facing navigation, so a stale count
    or a duplicated bullet should be caught before it becomes the next
    iteration's misleading entry point.
    """
    result: dict[str, object] = {
        "indexes": {},
        "errors": [],
    }
    if not PRESSURE_MATRIX.is_file():
        result["errors"] = ["pressure matrix is missing; cannot audit domain indexes"]
        return result

    matrix_text = PRESSURE_MATRIX.read_text(encoding="utf-8", errors="replace")
    expected_by_domain: defaultdict[str, set[str]] = defaultdict(set)
    row_pattern = re.compile(r"^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|", flags=re.MULTILINE)
    for name, domain in row_pattern.findall(matrix_text):
        if name in skill_names:
            expected_by_domain[domain.strip()].add(name)

    link_pattern = re.compile(r"\]\(\.\./skills/([^/]+)/SKILL\.md\)")
    errors: list[str] = []
    for domain, expected in sorted(expected_by_domain.items()):
        index_path = DISTILLATION / domain / "INDEX.md"
        if not index_path.is_file():
            errors.append(f"{domain}: missing INDEX.md for {len(expected)} primary Skill(s)")
            result["indexes"][domain] = {
                "expected": len(expected),
                "linked": 0,
                "duplicates": [],
                "missing": sorted(expected),
                "extra": [],
                "unknown": [],
            }
            continue

        text = index_path.read_text(encoding="utf-8", errors="replace")
        linked = link_pattern.findall(text)
        counts = Counter(linked)
        duplicates = sorted(name for name, count in counts.items() if count > 1)
        linked_set = set(linked)
        missing = sorted(expected - linked_set)
        # A domain index may deliberately link a cross-domain Skill as a
        # related entry (for example, embedded-core links UDP Skills that are
        # primarily indexed under linux-systems-tutorial).  Keep those links
        # visible in the report, but only unknown names are errors.
        extra = sorted(linked_set - expected)
        unknown = sorted(linked_set - set(skill_names))
        for name in duplicates:
            errors.append(f"{domain}: duplicate Skill link {name}")
        for name in missing:
            errors.append(f"{domain}: INDEX.md missing primary Skill link {name}")
        for name in unknown:
            errors.append(f"{domain}: INDEX.md lists unknown Skill link {name}")
        result["indexes"][domain] = {
            "expected": len(expected),
            "linked": len(linked),
            "duplicates": duplicates,
            "missing": missing,
            "extra": extra,
            "unknown": unknown,
        }

    result["errors"] = errors
    return result


def pipeline_state_count_audit(skill_names: list[str]) -> dict[str, object]:
    """Check declared pipeline-state counts against the pressure-matrix domains.

    Human-facing state files are useful continuation points, but their counts
    can become stale after a Skill is promoted, merged, or reclassified.  The
    pressure matrix remains the source of truth for primary-domain ownership;
    this check catches drift without treating cross-domain navigation links as
    additional ownership.
    """
    result: dict[str, object] = {
        "baseline": len(skill_names),
        "declared_baseline": None,
        "domains": {},
        "errors": [],
    }
    errors: list[str] = []
    if not PRESSURE_MATRIX.is_file():
        result["errors"] = ["pressure matrix is missing; cannot audit pipeline-state counts"]
        return result

    matrix_text = PRESSURE_MATRIX.read_text(encoding="utf-8", errors="replace")
    expected_by_domain: defaultdict[str, set[str]] = defaultdict(set)
    row_pattern = re.compile(r"^\|\s*([^`|]+?)\s*\|\s*([^|]+?)\s*\|", flags=re.MULTILINE)
    # The first cell is a backtick-wrapped Skill name in the canonical matrix.
    for name, domain in re.findall(r"^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|", matrix_text, flags=re.MULTILINE):
        if name in skill_names:
            expected_by_domain[domain.strip()].add(name)

    root_state = DISTILLATION / "PIPELINE_STATE.md"
    root_text = root_state.read_text(encoding="utf-8", errors="replace") if root_state.is_file() else ""
    baseline_match = re.search(r"当前规范 Skill 基线：\s*(\d+)", root_text)
    if baseline_match:
        declared_baseline = int(baseline_match.group(1))
        result["declared_baseline"] = declared_baseline
        if declared_baseline != len(skill_names):
            errors.append(
                f"root PIPELINE_STATE.md declares {declared_baseline} Skill(s), expected {len(skill_names)}"
            )
    else:
        errors.append("root PIPELINE_STATE.md is missing the declared Skill baseline")

    for domain, expected in sorted(expected_by_domain.items()):
        state_path = DISTILLATION / domain / "PIPELINE_STATE.md"
        state_text = state_path.read_text(encoding="utf-8", errors="replace") if state_path.is_file() else ""
        match = re.search(r"当前主域 Skill 数量：\s*(\d+)", state_text)
        declared = int(match.group(1)) if match else None
        if declared is None:
            errors.append(f"{domain}: PIPELINE_STATE.md is missing the declared primary Skill count")
        elif declared != len(expected):
            errors.append(
                f"{domain}: PIPELINE_STATE.md declares {declared} primary Skill(s), expected {len(expected)}"
            )
        result["domains"][domain] = {
            "expected": len(expected),
            "declared": declared,
            "path": rel(state_path),
        }
    result["errors"] = errors
    return result


def skill_domains(skill_sources: dict[str, set[str]]) -> dict[str, set[str]]:
    result: dict[str, set[str]] = {}
    for skill_name, paths in skill_sources.items():
        result[skill_name] = {
            classify_domain(path)
            for path in paths
            if not path.startswith("distillation/") and (VAULT / path).is_file()
        }
    return result


def domain_text(domain: str, skill_sources: dict[str, set[str]]) -> str:
    pieces: list[str] = []
    domain_dir = DISTILLATION / domain
    if domain_dir.is_dir():
        for path in sorted(domain_dir.rglob("*.md")):
            # Domain-local historical snapshots may contain every Skill. They
            # are intentionally excluded from exact path coverage, otherwise a
            # path from one domain would appear covered by all other domains.
            relative_parts = path.relative_to(domain_dir).parts
            if "skills" in relative_parts or path.name in {
                "source-register.md",
                "source-register.tsv",
                "source-boundary.md",
                # Coverage/audit ledgers may enumerate every source path, but
                # that enumeration is not knowledge evidence.  Counting it
                # here would make an "unlinked" queue disappear merely by
                # naming the same paths in its own audit report.
                "FULL_COVERAGE_REVIEW.md",
                "coverage-review.md",
                "coverage-supplement.md",
                "unlinked-review.md",
            }:
                continue
            pieces.append(path.read_text(encoding="utf-8", errors="replace"))
    domains_by_skill = skill_domains(skill_sources)
    for skill_name in sorted(domains_by_skill):
        if domain not in domains_by_skill[skill_name]:
            continue
        skill_file = CANONICAL_SKILLS / skill_name / "SKILL.md"
        if skill_file.is_file():
            pieces.append(skill_file.read_text(encoding="utf-8", errors="replace"))
    return "\n".join(pieces)


def domain_boundary_text(domain: str) -> str:
    """Read only the human-declared source boundary for a domain.

    Boundary text establishes scope and variant identity.  It is deliberately
    kept separate from exact content references so a whole vendor directory is
    not mistaken for a file-by-file knowledge citation.
    """
    path = DISTILLATION / domain / "source-boundary.md"
    return path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""


def source_path_aliases(path: str) -> set[str]:
    """Return safe repository-relative aliases used by human source maps.

    Domain source maps often shorten ``projects/<domain>/foo`` to ``foo``.
    Treating only the full vault path as a reference made the coverage report
    under-count files that were already named in a domain map.  We keep the
    alias set conservative: only known project/archive roots are removed and
    the basename alone is never considered an alias.
    """
    aliases = {path}
    known_roots = (
        "projects/嵌入式八股/",
        "projects/RTOS项目/",
        "projects/Linux物理内存检测项目/",
        "projects/linux视觉感知项目/",
        "archive/大丙Linux教程/",
        "archive/力扣刷题/",
        "archive/思维导图/",
        "archive/项目交互动画/",
        "tools/",
        "工作台/",
    )
    for root in known_roots:
        if path.startswith(root):
            aliases.add(path[len(root):])
            break
    return {alias for alias in aliases if "/" in alias and len(alias) >= 8}


def path_is_referenced_in_domain_text(
    path: str,
    text: str,
    *,
    allow_directory_prefix: bool = False,
) -> bool:
    """Check a path against domain text without basename guessing.

    An exact path or a deliberate fixed-prefix glob can support a
    ``domain-referenced`` status.  A bare directory prefix is only a scope
    claim; callers must opt in with ``allow_directory_prefix`` so a coverage
    report cannot make an entire directory look like individually reviewed
    knowledge merely by mentioning its parent directory.
    """
    aliases = source_path_aliases(path)
    if any(alias in text for alias in aliases):
        return True

    # A source map may intentionally cite a chapter/directory with a glob,
    # such as ``文档/3.3*``.  Only accept backtick-delimited patterns with a
    # slash and a meaningful fixed prefix; generic ``*.c`` prose must not mark
    # every C file as reviewed.
    for token in re.findall(r"`([^`]*\*[^`]*)`", text):
        pattern = token.strip().replace("\\", "/")
        if "/" not in pattern:
            continue
        fixed_prefix = pattern.split("*", 1)[0]
        if len(fixed_prefix) < 6:
            continue
        if any(fnmatch.fnmatchcase(alias, pattern) for alias in aliases):
            return True
    if allow_directory_prefix:
        for token in re.findall(r"`([^`]+/)`", text):
            prefix = token.strip().replace("\\", "/")
            if len(prefix) < 6:
                continue
            if any(alias.startswith(prefix) for alias in aliases):
                return True
    return False


def coverage(records: list[dict[str, object]], skill_sources: dict[str, set[str]]) -> tuple[list[dict[str, object]], dict[str, object]]:
    canonical = defaultdict(set)
    for skill_name, paths in skill_sources.items():
        for path in paths:
            canonical[path].add(skill_name)
    texts = {domain: domain_text(domain, skill_sources) for domain in sorted({str(r["domain"]) for r in records})}
    boundary_texts = {domain: domain_boundary_text(domain) for domain in texts}
    rows: list[dict[str, object]] = []
    for record in records:
        path = str(record["path"])
        domain = str(record["domain"])
        file_class = str(record["class"])
        if path in canonical:
            status = "skill-evidence"
            reason = "explicitly listed in canonical Skill source_files"
            refs = ",".join(sorted(canonical[path]))
        elif file_class in {"attachment-evidence", "build-artifact", "derived-backup", "derived-canvas", "runnable-learning-lab"}:
            status = "evidence-layer"
            reason = f"{file_class}; not automatically copied into a knowledge Skill"
            refs = ""
        elif path_is_referenced_in_domain_text(path, texts.get(domain, "")):
            status = "domain-referenced"
            reason = "full path, conservative source-map alias, or fixed-prefix glob appears in the domain distillation text"
            refs = domain
        elif domain in {"vault-root-or-unknown", "rednote-bookmarks"}:
            # These domains intentionally retain an explicit manual queue.
            # A category prefix in a source map is not enough to promote a
            # RedNote Like/Post or an unknown root file into reviewed content.
            status = "needs-domain-review"
            reason = "domain requires explicit disposition/review; a directory prefix is not file-level evidence"
            refs = ""
        elif path_is_referenced_in_domain_text(
            path,
            texts.get(domain, ""),
            allow_directory_prefix=True,
        ):
            status = "domain-scoped"
            reason = "a documented directory prefix in the domain text covers the path, but no file-level citation was found"
            refs = domain
        elif path_is_referenced_in_domain_text(
            path,
            boundary_texts.get(domain, ""),
            allow_directory_prefix=True,
        ):
            status = "domain-scoped"
            reason = "path is covered by the domain source boundary, but is not an exact content citation"
            refs = domain
        else:
            status = "indexed-only"
            reason = "included in inventory but no exact path reference found in current outputs"
            refs = domain
        rows.append({**record, "status": status, "reason": reason, "artifact_refs": refs})
    summary: dict[str, object] = {}
    for domain in sorted({str(r["domain"]) for r in records}):
        domain_rows = [r for r in rows if r["domain"] == domain]
        summary[domain] = {
            "files": len(domain_rows),
            "knowledge_documents": sum(r["class"] == "knowledge-document" for r in domain_rows),
            "skill_evidence": sum(r["status"] == "skill-evidence" for r in domain_rows),
            "domain_referenced": sum(r["status"] == "domain-referenced" for r in domain_rows),
            "domain_scoped": sum(r["status"] == "domain-scoped" for r in domain_rows),
            "indexed_only": sum(r["status"] == "indexed-only" for r in domain_rows),
            "needs_domain_review": sum(r["status"] == "needs-domain-review" for r in domain_rows),
            "evidence_layer": sum(r["status"] == "evidence-layer" for r in domain_rows),
        }
    return rows, summary


def write_source_registers(rows: list[dict[str, object]]) -> None:
    """Write a human-readable ledger without treating the ledger as content proof.

    The full TSV is the machine-readable authority. Per-domain Markdown ledgers
    make every path inspectable from Obsidian while retaining the distinction
    between a file being registered and a file having contributed a verified
    knowledge claim.
    """
    by_domain: defaultdict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        by_domain[str(row["domain"])].append(row)

    root_lines = [
        "# 全仓库来源登记簿",
        "",
        "> 这是逐文件身份与处理用途登记，不等于每个文件都已提炼成 Skill。机器可读的完整记录见 `source-disposition.tsv`；内容缺口见 `coverage-gaps.md`。",
        "",
        "## 登记规则",
        "",
        "- `skill-evidence`：被规范 Skill 的 `source_files` 明确引用。",
        "- `domain-reference`：在知识域的人工摘要、来源地图或验证记录中被明确回链；允许有目录前缀的精确别名或带固定前缀的 glob。",
        "- `domain-scoped`：只被域的 `source-boundary.md` 覆盖，说明它属于审计范围或某个变体目录，但不证明内容已逐文件使用。",
        "- `domain-scoped`：被域来源边界纳入范围，但尚未建立逐文件正文/源码回链。",
        "- `case/example`、`evidence-layer`、`build-evidence`、`derived`：保留为案例、附件证据、构建证据或派生关系，不自动升格为方法论。",
        "- `needs-review`：已登记但仍需要人工阅读、外部核验或用户确认。",
        "",
        "## 各域登记簿",
        "",
    ]
    for domain in sorted(by_domain):
        target = DISTILLATION / domain / "source-register.md"
        target.parent.mkdir(parents=True, exist_ok=True)
        domain_rows = sorted(by_domain[domain], key=lambda row: str(row["path"]))
        counts = Counter(str(row.get("disposition", "")) for row in domain_rows)
        lines = [
            f"# `{domain}` 来源登记簿",
            "",
            f"- 文件数：{len(domain_rows)}",
            f"- 知识文档：{sum(str(row['class']) == 'knowledge-document' for row in domain_rows)}",
            f"- 代码/配置：{sum(str(row['class']) == 'code-or-config' for row in domain_rows)}",
            f"- 证据/构建/派生：{sum(str(row['class']) not in {'knowledge-document', 'code-or-config'} for row in domain_rows)}",
            f"- 处理分布：{', '.join(f'{key}={value}' for key, value in sorted(counts.items()))}",
            "",
            "> 本表由当前文件系统生成；哈希用于识别变化和重复，不用于证明技术内容正确。`status` 反映内容回链程度，`disposition` 反映文件用途。",
            "",
            "| 身份 | 类别 | 内容状态 | 用途 | 大小 | SHA-256前16位 | 路径 |",
            "|---|---|---|---|---:|---|---|",
        ]
        for row in domain_rows:
            path = str(row["path"]).replace("|", "\\|")
            lines.append(
                f"| `{row['domain']}` | `{row['class']}` | `{row['status']}` | `{row.get('disposition', '')}` | {row['size_bytes']} | `{row['sha256_16']}` | `{path}` |"
            )
        target.write_text("\n".join(lines) + "\n", encoding="utf-8")
        root_lines.append(f"- [{domain}]({domain}/source-register.md)：{len(domain_rows)} 个文件")

    root_lines += [
        "",
        "## 机器可读记录",
        "",
        "- [source-disposition.tsv](source-disposition.tsv)：逐文件身份、状态、处理用途、哈希和关联产物。",
        "- [source-inventory-current.tsv](source-inventory-current.tsv)：当前原始文件快照。",
        "- [duplicate-hash-groups.tsv](duplicate-hash-groups.tsv)：完整 SHA-256 重复组。",
    ]
    (DISTILLATION / "source-register.md").write_text("\n".join(root_lines) + "\n", encoding="utf-8")


def markdown_link_audit() -> dict[str, object]:
    """Check relative Markdown links in derived documentation."""
    pattern = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]+)\)")
    bad: list[dict[str, str]] = []
    checked = 0
    for source in sorted(DISTILLATION.rglob("*.md")):
        text = source.read_text(encoding="utf-8", errors="replace")
        # Bracketed code expressions such as ``p[1](...)`` are not Markdown
        # links.  Remove fenced and inline code before scanning so the audit
        # reports only links that a reader can actually click.
        scan_text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
        scan_text = re.sub(r"`[^`\n]*`", "", scan_text)
        for match in pattern.finditer(scan_text):
            raw = match.group(1).strip()
            if not raw or raw.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target = raw.split("#", 1)[0]
            if not target:
                continue
            checked += 1
            resolved = (source.parent / target).resolve()
            if not resolved.exists():
                bad.append({"source": str(source.relative_to(VAULT)), "target": raw})
    report_lines = [
        "# 蒸馏文档链接审计",
        "",
        f"- 检查相对链接：{checked}",
        f"- 失效链接：{len(bad)}",
        "",
    ]
    if bad:
        report_lines += ["## 失效链接", ""]
        report_lines.extend(f"- `{row['source']}` → `{row['target']}`" for row in bad)
    else:
        report_lines.append("所有检查到的相对 Markdown 链接均能解析。")
    (DISTILLATION / "link-audit.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    return {"checked": checked, "broken": len(bad), "items": bad}


def load_disposition_overrides() -> list[dict[str, str]]:
    if not DISPOSITION_OVERRIDES.is_file():
        return []
    overrides: list[dict[str, str]] = []
    with DISPOSITION_OVERRIDES.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(
            (line for line in handle if line.strip() and not line.lstrip().startswith("#")),
            delimiter="\t",
        ):
            if row.get("pattern") and row.get("disposition"):
                overrides.append({key: value.strip() for key, value in row.items() if value is not None})
    # Exact rules win; among prefix rules the most specific path wins.
    return sorted(
        overrides,
        key=lambda row: (row.get("match_type") != "exact", -len(row.get("pattern", ""))),
    )


def disposition_for(row: dict[str, object], overrides: list[dict[str, str]]) -> tuple[str, str, str]:
    path = str(row["path"])
    for override in overrides:
        match_type = override.get("match_type", "exact")
        pattern = override.get("pattern", "")
        matched = path == pattern if match_type == "exact" else path.startswith(pattern)
        if matched:
            return (
                override.get("disposition", "needs-review"),
                override.get("confidence", "manual"),
                override.get("reason", "manual disposition override"),
            )

    status = str(row["status"])
    file_class = str(row["class"])
    domain = str(row["domain"])
    if status == "skill-evidence":
        return "skill-evidence", "high", "explicit source_files entry in canonical Skill"
    if file_class == "build-artifact":
        return "build-evidence", "high", "build/output path or binary build suffix"
    if file_class in {"derived-backup", "derived-canvas"} or domain == "embedded-core-derived":
        return "derived", "high", "backup, Canvas, or merged/derived document"
    if file_class == "attachment-evidence":
        return "evidence-layer", "medium", "media/model/attachment retained as evidence, not copied into Skill"
    if file_class == "runnable-learning-lab":
        return "case/example", "medium", "executable teaching/demo asset"
    if domain in {"rednote-bookmarks", "vault-root-or-unknown"}:
        return "needs-review", "low", "domain or provenance has not received a complete review"
    if status == "domain-scoped":
        return "domain-scope", "low", "covered by source-boundary.md but not individually cited"
    if file_class == "knowledge-document":
        if domain == "leetcode-algorithm-learning" and "/题目详解/" in path:
            return "case/example", "medium", "individual problem explanation; retained as a case, not a Skill"
        if status == "domain-referenced":
            return "domain-reference", "medium", "mentioned by the domain distillation package"
        return "needs-review", "low", "knowledge document has no exact reference in current outputs"
    if status == "domain-referenced":
        return "domain-reference", "medium", "mentioned by the domain distillation package"
    return "needs-review", "low", "no exact provenance/disposition rule yet"


def add_dispositions(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    overrides = load_disposition_overrides()
    enriched: list[dict[str, object]] = []
    for row in rows:
        disposition, confidence, disposition_reason = disposition_for(row, overrides)
        enriched.append(
            {
                **row,
                "disposition": disposition,
                "confidence": confidence,
                "disposition_reason": disposition_reason,
            }
        )
    return enriched


def write_tsv(path: Path, rows: list[dict[str, object]]) -> None:
    columns = [
        "domain", "class", "status", "disposition", "confidence", "reason",
        "disposition_reason", "artifact_refs", "path", "size_bytes", "sha256_16",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write("\t".join(columns) + "\n")
        for row in rows:
            handle.write("\t".join(str(row.get(column, "")) for column in columns) + "\n")


def write_inventory_tsv(path: Path, records: list[dict[str, object]]) -> None:
    columns = ["domain", "class", "size_bytes", "sha256_16", "path"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write("\t".join(columns) + "\n")
        for row in records:
            handle.write("\t".join(str(row.get(column, "")) for column in columns) + "\n")


INVENTORY_DOMAIN_STRATEGIES = {
    "algorithm-pdf": "保留本地文本抽取、OCR 和版面证据边界；不把公式缺失当作已验证知识。",
    "attachments-evidence": "按引用关系建资产索引；图片、模型和媒体不整体复制进 Skill。",
    "canvas-mindmaps": "解析 Canvas 节点和边，作为导航/关系派生证据，不替代正文或源码。",
    "embedded-core": "按主题去重，交叉核对八股、项目文档和源码。",
    "embedded-core-derived": "作为合并稿/派生稿保留重复审计，不独立计入知识结论。",
    "interactive-learning-labs": "审计 HTML/JS/测试中的可执行教学模型，并标注其不是硬件或内核实测。",
    "leetcode-algorithm-learning": "以专题总结和学习日志为主；题解作为案例，不为每道题生成 Skill。",
    "linux-memory-ebpf": "核对文档、源码、运行链和指标计算；BCC/目标内核行为单独标注。",
    "linux-systems-tutorial": "按构建、进程线程、文件 IO、Socket 和接收路径提炼可复用排障方法。",
    "linux-vision": "交叉核对文档、源码、模型、构建配置和测试/附件证据。",
    "rednote-bookmarks": "第三方外部参考分层登记；不把帖子观点直接升格为用户事实。",
    "rtos-project": "三角核对 RTOS 文档、STM32 源码和构建配置；构建产物只作证据。",
    "vault-methodology-and-tools": "登记仓库治理、脚本、派生物和安装边界；必要时形成工具方法 Skill。",
    "vault-root-or-unknown": "逐项人工检查根目录未知文件，不默认纳入蒸馏。",
    "workbench-learning-state": "保留学习进度、来源回链和复习状态；不把工作台记录当成独立事实来源。",
}

INVENTORY_CLASS_STRATEGIES = {
    "attachment-evidence": "图片、SVG、模型和媒体按引用/哈希索引，不自动转换为知识结论。",
    "build-artifact": "识别并排除正文；只在 provenance 中记录可证明的构建身份。",
    "code-or-config": "作为项目事实和代码职责证据；不整体复制到 Skill。",
    "derived-backup": "保留用于差异审计，不作为新的知识来源。",
    "knowledge-document": "按知识域读取、去重、提取和回链。",
    "other-binary-or-config": "逐项判断用途和证据边界，不默认解包或安装。",
    "derived-canvas": "解析关系和导航信息，不重复计入正文知识。",
    "runnable-learning-lab": "可运行实验按源码/测试验证，教学模型与生产事实分开。",
}


def _inventory_number(value: int) -> str:
    return f"{value:,}"


def write_inventory_reports(records: list[dict[str, object]]) -> dict[str, object]:
    """Render the two human inventory reports from the current TSV source.

    These reports used to contain hand-maintained counts and became stale when
    the vault gained the workbench and the RedNote export.  Keeping rendering
    beside the inventory scan makes every normal audit refresh the numbers from
    the same records that produce ``source-inventory-current.tsv``.
    """
    domain_counts = Counter(str(row["domain"]) for row in records)
    domain_bytes = Counter({domain: 0 for domain in domain_counts})
    class_counts = Counter(str(row["class"]) for row in records)
    class_bytes = Counter({file_class: 0 for file_class in class_counts})
    for row in records:
        domain = str(row["domain"])
        file_class = str(row["class"])
        size = int(row["size_bytes"])
        domain_bytes[domain] += size
        class_bytes[file_class] += size

    total_bytes = sum(int(row["size_bytes"]) for row in records)
    summary_lines = [
        "# 全仓库来源清单摘要",
        "",
        "> 统计范围：当前 vault 原始内容；排除 `distillation/`、`.obsidian/`、`.claudian/` 及缓存目录。当前权威快照见 [`source-inventory-current.tsv`](source-inventory-current.tsv)；`source-inventory.tsv` 保留为历史基线。",
        "",
        "## 总量",
        "",
        f"- 文件数：{_inventory_number(len(records))}",
        f"- 总大小：{_inventory_number(total_bytes)} bytes（仅用于盘点，不等同于可蒸馏文本量）",
        "",
        "## 按知识域",
        "",
        "| 知识域 | 文件数 | 总大小（bytes） | 主要处理策略 |",
        "|---|---:|---:|---|",
    ]
    for domain in sorted(domain_counts):
        strategy = INVENTORY_DOMAIN_STRATEGIES.get(domain, "按来源边界登记，待补充专门处理策略。")
        summary_lines.append(
            f"| `{domain}` | {domain_counts[domain]:,} | {domain_bytes[domain]:,} | {strategy} |"
        )
    summary_lines += [
        "",
        "## 按文件类别",
        "",
        "| 类别 | 文件数 | 总大小（bytes） |",
        "|---|---:|---:|",
    ]
    for file_class in sorted(class_counts):
        summary_lines.append(
            f"| `{file_class}` | {class_counts[file_class]:,} | {class_bytes[file_class]:,} |"
        )
    summary_lines += [
        "",
        "## 口径说明",
        "",
        "- `attachments-evidence` 是按路径归属的资产域；`attachment-evidence` 是按文件类别统计的全仓库附件类，两者不是同一个维度。",
        "- 工作台记录属于当前 vault 的学习状态层，已登记来源回链，但不自动等同于独立技术事实。",
        "- 本文件由 `scripts/audit_vault.py` 在每次审计时重生成，避免手工沿用旧快照。",
    ]
    (DISTILLATION / "source-inventory-summary.md").write_text(
        "\n".join(summary_lines) + "\n", encoding="utf-8"
    )

    artifact_lines = [
        "# 全仓库 Artifact Inventory",
        "",
        "> 来源：[`source-inventory-current.tsv`](source-inventory-current.tsv)；`source-inventory.tsv` 保留为历史基线。以下分类每次由 `scripts/audit_vault.py` 从当前文件系统重算。",
        "",
        "## 分类摘要",
        "",
        "| 类型 | 文件数 | 总大小（bytes） | 处理策略 |",
        "|---|---:|---:|---|",
    ]
    for file_class in sorted(class_counts):
        strategy = INVENTORY_CLASS_STRATEGIES.get(file_class, "按当前来源边界逐项判断。")
        artifact_lines.append(
            f"| `{file_class}` | {class_counts[file_class]:,} | {class_bytes[file_class]:,} | {strategy} |"
        )
    artifact_lines += [
        "",
        "## 重点资产群",
        "",
        "- `assets/`、项目附件和 RedNote 媒体：保留为证据索引，不整体复制进规范 Skill。",
        "- `OBJ/`、`build/`、`.o/.bin/.hex/.crf` 等：作为构建身份或 provenance 证据，不替代源码和测量。",
        "- `archive/项目交互动画/` 与 `archive/思维导图/`：分别按可运行实验和 Canvas 派生关系审计；当前快照若缺实现则明确记录不可复现。",
        "- 根目录 ZIP、`.skill` 或未知二进制：不自动安装、不解包写回 vault，保留待确认状态。",
        "",
        "## 原始保护",
        "",
        "本轮报告刷新只写入 `distillation/`；原始笔记、源码、附件、工作台记录和客户端已有同名 Skill 不被重命名、移动、删除或覆盖。",
    ]
    (DISTILLATION / "artifact-inventory.md").write_text(
        "\n".join(artifact_lines) + "\n", encoding="utf-8"
    )
    return {
        "summary_path": rel(DISTILLATION / "source-inventory-summary.md"),
        "artifact_path": rel(DISTILLATION / "artifact-inventory.md"),
        "record_count": len(records),
        "total_bytes": total_bytes,
        "domain_count": len(domain_counts),
        "class_count": len(class_counts),
    }


def write_inventory_diff(records: list[dict[str, object]]) -> dict[str, int]:
    current = {str(row["path"]): row for row in records}
    historical: dict[str, dict[str, str]] = {}
    if HISTORICAL_INVENTORY.is_file():
        with HISTORICAL_INVENTORY.open(encoding="utf-8", newline="") as handle:
            historical = {row["path"]: row for row in csv.DictReader(handle, delimiter="\t")}
    current_paths = set(current)
    historical_paths = set(historical)
    added = sorted(current_paths - historical_paths)
    removed = sorted(historical_paths - current_paths)
    changed = sorted(
        path for path in current_paths & historical_paths
        if str(current[path]["sha256_16"]) != historical[path].get("sha256_16", "")
    )
    lines = [
        "# 来源清单历史差异",
        "",
        "> 历史基线保留在 `source-inventory.tsv`；当前权威快照在 `source-inventory-current.tsv`。缓存树不进入当前快照。",
        "",
        "## 摘要",
        "",
        f"- 历史基线：{len(historical_paths)} 个路径",
        f"- 当前快照：{len(current_paths)} 个路径",
        f"- 新增：{len(added)} 个路径",
        f"- 消失：{len(removed)} 个路径",
        f"- 内容哈希变化：{len(changed)} 个路径",
        "",
        "## 差异解释",
        "",
        "当前扫描新增的主要来源是整个 `小红书（RedNote）/` 导出；历史清单中的根目录 `__pycache__` 文件属于缓存，当前不再计入。",
        "",
        "## 新增路径",
        "",
    ]
    lines.extend(f"- `{path}`" for path in added)
    lines += ["", "## 历史中存在、当前消失的路径", ""]
    lines.extend(f"- `{path}`" for path in removed)
    lines += ["", "## 内容哈希变化", ""]
    lines.extend(f"- `{path}`：历史 `{historical[path].get('sha256_16', '')}` → 当前 `{current[path]['sha256_16']}`" for path in changed)
    (DISTILLATION / "inventory-diff.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"historical": len(historical_paths), "current": len(current_paths), "added": len(added), "removed": len(removed), "changed": len(changed)}


def write_source_freshness_report(
    records: list[dict[str, object]],
    skill_sources: dict[str, set[str]],
) -> dict[str, object]:
    """Report changed canonical evidence files without changing their status.

    The historical inventory is an audit baseline, not a claim that every
    changed file invalidates a Skill.  This report narrows the diff to files
    referenced by canonical Skills and asks for targeted review instead of
    silently rebuilding conclusions from an unreviewed edit.
    """
    current = {str(row["path"]): row for row in records}
    historical: dict[str, dict[str, str]] = {}
    if HISTORICAL_INVENTORY.is_file():
        with HISTORICAL_INVENTORY.open(encoding="utf-8", newline="") as handle:
            historical = {row["path"]: row for row in csv.DictReader(handle, delimiter="\t")}
    referenced_by: defaultdict[str, list[str]] = defaultdict(list)
    for skill, paths in skill_sources.items():
        for path in paths:
            referenced_by[path].append(skill)

    freshness_reviews: dict[str, dict[str, str]] = {}
    freshness_review_errors: list[str] = []
    if SOURCE_FRESHNESS_REVIEW.is_file():
        with SOURCE_FRESHNESS_REVIEW.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(
                (line for line in handle if line.strip() and not line.lstrip().startswith("#")),
                delimiter="\t",
            )
            required = {"path", "review_status", "reviewed_at", "decision", "scope"}
            missing_columns = sorted(required - set(reader.fieldnames or []))
            if missing_columns:
                freshness_review_errors.append(
                    "review file missing columns: " + ", ".join(missing_columns)
                )
            for row in reader:
                path = (row.get("path") or "").strip()
                if not path:
                    continue
                if path in freshness_reviews:
                    freshness_review_errors.append(f"duplicate review path: {path}")
                freshness_reviews[path] = {
                    "review_status": (row.get("review_status") or "pending").strip(),
                    "reviewed_at": (row.get("reviewed_at") or "").strip(),
                    "decision": (row.get("decision") or "").strip(),
                    "scope": (row.get("scope") or "").strip(),
                }

    def review_for(path: str) -> dict[str, str]:
        review = freshness_reviews.get(path)
        if review:
            return review
        return {
            "review_status": "pending",
            "reviewed_at": "",
            "decision": "等待读取变化文件后再决定是否回炉",
            "scope": "未处置",
        }

    rows: list[dict[str, object]] = []
    for path in sorted(set(current) & set(historical)):
        before = historical[path].get("sha256_16", "")
        after = str(current[path].get("sha256_16", ""))
        if before == after:
            continue
        rows.append(
            {
                "path": path,
                "historical_sha256_16": before,
                "current_sha256_16": after,
                "referenced_by_skills": sorted(referenced_by.get(path, [])),
                "skill_reference_count": len(referenced_by.get(path, [])),
                "review_priority": "high" if referenced_by.get(path) else "context-only",
                "change_kind": "changed-after-baseline",
                **review_for(path),
            }
        )
    added_referenced = [
        path for path in sorted(set(current) - set(historical)) if referenced_by.get(path)
    ]
    added_rows: list[dict[str, object]] = []
    for path in added_referenced:
        added_rows.append(
            {
                "path": path,
                "historical_sha256_16": "",
                "current_sha256_16": str(current[path].get("sha256_16", "")),
                "referenced_by_skills": sorted(referenced_by[path]),
                "skill_reference_count": len(referenced_by[path]),
                "review_priority": "high",
                "change_kind": "added-after-baseline",
                **review_for(path),
            }
        )
    all_review_rows = rows + added_rows
    lines = [
        "# 规范 Skill 来源新鲜度审计",
        "",
        "> 这是只读的增量提醒：文件哈希变化不自动等于旧结论失效，也不自动把新文件纳入 Skill。需要人工/下一轮蒸馏逐条复核后，才更新来源与结论。",
        "",
        f"- 当前规范 Skill：{len(skill_sources)}",
        f"- 与历史基线相比发生变化的文件：{len(rows)}",
        f"- 其中被规范 Skill 引用的文件：{sum(bool(row['referenced_by_skills']) for row in rows)}",
        f"- 历史基线之后新增且已被 Skill 引用的文件：{len(added_referenced)}",
        f"- 需要高优先级复核的 Skill 引用关系：{sum(int(row['skill_reference_count']) for row in rows)}",
        f"- 已处置变化/新增引用文件：{sum(row['review_status'] not in {'pending', ''} for row in all_review_rows)}",
        f"- 仍待处置变化/新增引用文件：{sum(row['review_status'] in {'pending', ''} for row in all_review_rows)}",
        "",
        "## 变化文件与引用关系",
        "",
        "| 文件 | 历史哈希 | 当前哈希 | 复核优先级 | 状态 | 处置结论 | 引用 Skill |",
        "|---|---|---|---|---|---|---|",
    ]
    if rows:
        for row in rows:
            skills = ", ".join(f"`{skill}`" for skill in row["referenced_by_skills"])
            lines.append(
                f"| `{row['path']}` | `{row['historical_sha256_16']}` | `{row['current_sha256_16']}` | {row['review_priority']} | `{row['review_status']}` | {row['decision'] or '(none)'} | {skills or '(none)'} |"
            )
    else:
        lines.append("| (none) | — | — | — | — | — | — |")
    lines += ["", "## 历史基线之后新增且已被规范 Skill 引用的文件", ""]
    if added_referenced:
        for path in added_referenced:
            review = review_for(path)
            lines.append(
                f"- `{path}`：当前哈希 `{current[path]['sha256_16']}`；状态 `{review['review_status']}`；处置：{review['decision'] or '(none)'}；引用 Skill：{', '.join(f'`{skill}`' for skill in sorted(referenced_by[path]))}"
            )
    else:
        lines.append("- 无")
    lines += [
        "",
        "## 处理口径",
        "",
        "1. 先读取变化文件的实际 diff，而不是仅凭哈希变化改写答案。",
        "2. 如果事实、符号或代码路径变化，更新对应 Skill 的 `source_files`/正文/测试，并重新运行三重验证与压力测试。",
        "3. 如果只是索引、格式或无关附件变化，保留本报告记录，不把它升级为知识结论。",
        "4. 本报告不修改原始文件，也不自动覆盖任何客户端副本。",
        "5. 人工处置记录见 `source-freshness-review.tsv`；`review_status=pending` 表示尚未完成内容核对。",
    ]
    if freshness_review_errors:
        lines += ["", "## 处置表格式错误", ""]
        lines.extend(f"- {error}" for error in freshness_review_errors)
    (DISTILLATION / "source-freshness-audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {
        "path": rel(DISTILLATION / "source-freshness-audit.md"),
        "changed_files": len(rows),
        "changed_referenced_files": sum(bool(row["referenced_by_skills"]) for row in rows),
        "added_referenced_files": len(added_referenced),
        "skill_reference_count": sum(int(row["skill_reference_count"]) for row in rows),
        "review_file": rel(SOURCE_FRESHNESS_REVIEW),
        "reviewed_count": sum(row["review_status"] not in {"pending", ""} for row in all_review_rows),
        "pending_count": sum(row["review_status"] in {"pending", ""} for row in all_review_rows),
        "review_errors": freshness_review_errors,
        "rows": rows,
        "added_rows": added_rows,
    }


def write_duplicate_hash_report(records: list[dict[str, object]]) -> dict[str, int]:
    groups: defaultdict[str, list[dict[str, object]]] = defaultdict(list)
    for row in records:
        groups[str(row["sha256"])].append(row)
    duplicate_groups = {digest: rows for digest, rows in groups.items() if len(rows) > 1}
    rows_out: list[dict[str, object]] = []
    group_no = 0
    for digest, group in sorted(duplicate_groups.items(), key=lambda item: (-len(item[1]), item[0])):
        group_no += 1
        for row in sorted(group, key=lambda item: str(item["path"])):
            rows_out.append(
                {
                    "group": f"D{group_no:04d}",
                    "sha256": digest,
                    "file_count": len(group),
                    "domain_count": len({str(item["domain"]) for item in group}),
                    "domain": row["domain"],
                    "class": row["class"],
                    "path": row["path"],
                }
            )
    duplicate_path = DISTILLATION / "duplicate-hash-groups.tsv"
    columns = ["group", "sha256", "file_count", "domain_count", "domain", "class", "path"]
    with duplicate_path.open("w", encoding="utf-8", newline="") as handle:
        handle.write("\t".join(columns) + "\n")
        for row in rows_out:
            handle.write("\t".join(str(row[column]) for column in columns) + "\n")
    summary = [
        "# 当前文件哈希重复摘要",
        "",
        "> 使用完整 SHA-256 分组；重复只说明字节内容相同，不自动证明文件在知识上可互相替代。",
        "",
        f"- 重复组：{len(duplicate_groups)}",
        f"- 涉及路径：{sum(len(rows) for rows in duplicate_groups.values())}",
        "",
        "详细路径见 [`duplicate-hash-groups.tsv`](./duplicate-hash-groups.tsv)。优先关注跨项目复制的模型、动态库、图片和派生文档；源码/笔记仍需按来源链判断。",
        "",
        "## 最大重复组",
        "",
    ]
    for digest, group in sorted(duplicate_groups.items(), key=lambda item: (-len(item[1]), item[0]))[:30]:
        summary.append(f"- `{digest[:16]}`：{len(group)} 个路径；域：{', '.join(sorted({str(item['domain']) for item in group}))}")
    (DISTILLATION / "duplicate-hash-summary.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    return {"duplicate_groups": len(duplicate_groups), "duplicate_paths": sum(len(rows) for rows in duplicate_groups.values())}


def write_external_archive_report(records: list[dict[str, object]]) -> dict[str, int]:
    archives: list[dict[str, object]] = []
    for row in records:
        path = VAULT / str(row["path"])
        try:
            if not is_zipfile(path):
                continue
            with ZipFile(path) as archive:
                members = {
                    info.filename: hashlib.sha256(archive.read(info)).hexdigest()
                    for info in archive.infolist()
                    if not info.is_dir()
                }
            archives.append({"path": str(row["path"]), "sha256": str(row["sha256"]), "members": members})
        except (OSError, BadZipFile, RuntimeError) as exc:
            archives.append({"path": str(row["path"]), "sha256": str(row["sha256"]), "error": str(exc), "members": {}})
    lines = [
        "# 外部压缩包审计",
        "",
        "> 仅读取压缩包元数据和成员哈希；未解包、未安装、未覆盖任何客户端目录。",
        "",
        f"检测到 ZIP 归档：{len(archives)} 个",
        "",
    ]
    for archive in archives:
        lines += [
            f"## `{archive['path']}`",
            "",
            f"- 外层 SHA-256：`{archive['sha256']}`",
            f"- 成员数：{len(archive.get('members', {}))}",
        ]
        if archive.get("error"):
            lines.append(f"- 读取错误：`{archive['error']}`")
        lines.append("")
    for index, left in enumerate(archives):
        for right in archives[index + 1:]:
            same = left.get("members") == right.get("members") and bool(left.get("members"))
            lines += [
                f"## 比较：`{left['path']}` ↔ `{right['path']}`",
                "",
                f"- 成员集合与成员内容哈希完全一致：`{'是' if same else '否'}`",
                "",
            ]
    (DISTILLATION / "external-archive-audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"zip_archives": len(archives)}


def client_audit_details(skill_names: list[str]) -> dict[str, list[dict[str, str]]]:
    """Return per-client/per-Skill package status for derived delivery reports.

    A package hash includes every regular file, not just SKILL.md.  This keeps
    the audit honest when tests or agents metadata drift independently.
    """
    def package_files(directory: Path) -> dict[str, str]:
        return {
            file.relative_to(directory).as_posix(): sha256(file)
            for file in sorted(path for path in directory.rglob("*") if path.is_file())
        }

    def package_digest(directory: Path) -> str:
        digest = hashlib.sha256()
        for file in sorted(path for path in directory.rglob("*") if path.is_file()):
            digest.update(file.relative_to(directory).as_posix().encode("utf-8"))
            digest.update(b"\0")
            with file.open("rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(chunk)
            digest.update(b"\0")
        return digest.hexdigest()

    result: dict[str, list[dict[str, str]]] = {}
    for client, root in CLIENTS.items():
        rows: list[dict[str, str]] = []
        for name in skill_names:
            source = CANONICAL_SKILLS / name / "SKILL.md"
            source_dir = CANONICAL_SKILLS / name
            target_dir = root / name
            target = target_dir / "SKILL.md"
            canonical_hash = package_digest(source_dir)
            if not target_dir.is_dir() or not target.is_file():
                status = "missing"
                target_hash = ""
                difference_kind = "missing-package"
                missing_files = ",".join(sorted(package_files(source_dir)))
                extra_files = ""
                changed_files = ""
            else:
                target_hash = package_digest(target_dir)
                status = "same" if canonical_hash == target_hash else "different"
                canonical_files = package_files(source_dir)
                client_files = package_files(target_dir)
                missing = sorted(set(canonical_files) - set(client_files))
                extra = sorted(set(client_files) - set(canonical_files))
                changed = sorted(
                    path
                    for path in set(canonical_files) & set(client_files)
                    if canonical_files[path] != client_files[path]
                )
                flags = []
                if missing:
                    flags.append("canonical-files-missing")
                if extra:
                    flags.append("client-extra-files")
                if changed:
                    flags.append("content-changed")
                difference_kind = "+".join(flags) if flags else "same"
                missing_files = ",".join(missing)
                extra_files = ",".join(extra)
                changed_files = ",".join(changed)
            rows.append(
                {
                    "client": client,
                    "skill": name,
                    "status": status,
                    "canonical_sha256_16": canonical_hash[:16],
                    "client_sha256_16": target_hash[:16],
                    "difference_kind": difference_kind,
                    "missing_files": missing_files,
                    "extra_files": extra_files,
                    "changed_files": changed_files,
                    "canonical_path": rel(source),
                    "client_path": str(target),
                }
            )
        result[client] = rows
    return result


def client_audit(skill_names: list[str]) -> dict[str, dict[str, int]]:
    result: dict[str, dict[str, int]] = {}
    for client, rows in client_audit_details(skill_names).items():
        counts = Counter(row["status"] for row in rows)
        result[client] = {
            key: counts.get(key, 0)
            for key in ("same", "different", "missing")
        }
    return result


PROVENANCE_REPORT_SPECS = {
    "rtos": {
        "domain": "rtos-project",
        "json": "artifact-provenance.json",
        "markdown": "artifact-provenance.md",
        "source_key": "source_files",
        "assessment_key": "static_assessment",
        "expected_keys": [
            "C0_target_contract",
            "C1_historical_build_identity",
            "C2_flash_program_verify",
            "C3_reset_boot_observation",
            "C4_serial_runtime_business",
        ],
    },
    "linux_memory": {
        "domain": "linux-memory-ebpf",
        "json": "runtime-validation-matrix.json",
        "markdown": "runtime-validation-matrix.md",
        "source_key": "source_files",
        "matrix_key": "validation_matrix",
        "expected_ids": [f"M{i}" for i in range(9)],
    },
    "linux_vision": {
        "domain": "linux-vision",
        "json": "main-chain-verification-matrix.json",
        "markdown": "main-chain-verification-matrix.md",
        "source_key": "source_files",
        "matrix_key": "validation_matrix",
        "expected_ids": [f"V{i}" for i in range(9)],
    },
}


def provenance_report_audit() -> dict[str, object]:
    """Validate the three generated provenance reports without executing targets.

    This is intentionally a report-integrity check.  It verifies that the
    reports are present, parseable, source-grounded, and internally complete;
    it does not rerun Keil, J-Link, BCC, Qt, OpenCV, or a target kernel.
    """
    result: dict[str, object] = {"reports": {}, "errors": []}
    errors: list[str] = []
    summaries: dict[str, object] = {}

    for name, spec in PROVENANCE_REPORT_SPECS.items():
        domain_dir = DISTILLATION / str(spec["domain"])
        json_path = domain_dir / str(spec["json"])
        markdown_path = domain_dir / str(spec["markdown"])
        report: dict[str, object] = {
            "domain": spec["domain"],
            "json_path": rel(json_path),
            "markdown_path": rel(markdown_path),
            "json_exists": json_path.is_file(),
            "markdown_exists": markdown_path.is_file(),
            "json_parseable": False,
            "source_count": 0,
            "source_missing": [],
            "matrix_ids": [],
            "status_counts": {},
            "errors": [],
        }
        local_errors: list[str] = []
        payload: dict[str, object] = {}
        if not json_path.is_file():
            local_errors.append(f"{name}: missing {rel(json_path)}")
        else:
            try:
                raw = json.loads(json_path.read_text(encoding="utf-8"))
                if not isinstance(raw, dict):
                    local_errors.append(f"{name}: JSON root is not an object")
                else:
                    payload = raw
                    report["json_parseable"] = True
            except (OSError, json.JSONDecodeError) as exc:
                local_errors.append(f"{name}: invalid JSON: {exc}")
        if not markdown_path.is_file():
            local_errors.append(f"{name}: missing {rel(markdown_path)}")

        source_files = payload.get(str(spec["source_key"]), [])
        if not isinstance(source_files, list):
            local_errors.append(f"{name}: source_files is not an array")
            source_files = []
        missing_sources = [
            str(path)
            for path in source_files
            if not isinstance(path, str) or not (VAULT / str(path)).is_file()
        ]
        report["source_count"] = len(source_files)
        report["source_missing"] = missing_sources
        if missing_sources:
            local_errors.append(
                f"{name}: missing source path(s): " + ", ".join(missing_sources)
            )

        if "assessment_key" in spec:
            assessment = payload.get(str(spec["assessment_key"]), {})
            if not isinstance(assessment, dict):
                local_errors.append(f"{name}: static_assessment is not an object")
                assessment = {}
            expected_keys = list(spec["expected_keys"])
            actual_keys = sorted(str(key) for key in assessment)
            report["assessment_keys"] = actual_keys
            missing_keys = sorted(set(expected_keys) - set(actual_keys))
            extra_keys = sorted(set(actual_keys) - set(expected_keys))
            if missing_keys:
                local_errors.append(f"{name}: missing assessment key(s): {', '.join(missing_keys)}")
            if extra_keys:
                local_errors.append(f"{name}: unexpected assessment key(s): {', '.join(extra_keys)}")
            status_counts = Counter(str(value) for value in assessment.values())
            report["status_counts"] = dict(status_counts)
            summaries[name] = assessment
        else:
            matrix = payload.get(str(spec["matrix_key"]), [])
            if not isinstance(matrix, list):
                local_errors.append(f"{name}: validation_matrix is not an array")
                matrix = []
            ids = [str(row.get("id")) for row in matrix if isinstance(row, dict) and row.get("id") is not None]
            report["matrix_ids"] = ids
            expected_ids = list(spec["expected_ids"])
            if sorted(ids) != expected_ids:
                local_errors.append(
                    f"{name}: validation IDs {ids!r} do not equal {expected_ids!r}"
                )
            statuses = Counter(
                str(row.get("status"))
                for row in matrix
                if isinstance(row, dict) and row.get("status")
            )
            report["status_counts"] = dict(statuses)
            summaries[name] = {row_id: row.get("status") for row_id, row in zip(ids, matrix) if isinstance(row, dict)}

            if name == "linux_vision":
                cmake_records = payload.get("cmake", [])
                if not isinstance(cmake_records, list):
                    local_errors.append(f"{name}: cmake is not an array")
                    cmake_records = []
                for cmake_record in cmake_records:
                    if not isinstance(cmake_record, dict):
                        local_errors.append(f"{name}: invalid cmake record")
                        continue
                    cmake_path = VAULT / str(cmake_record.get("path", ""))
                    if not cmake_path.is_file():
                        local_errors.append(f"{name}: missing CMake path {cmake_record.get('path')}")
                        continue
                    for target in cmake_record.get("targets", []):
                        if not isinstance(target, dict):
                            local_errors.append(f"{name}: invalid CMake target record")
                            continue
                        for source in target.get("sources", []):
                            source_path = cmake_path.parent / str(source)
                            if not source_path.is_file():
                                local_errors.append(
                                    f"{name}: CMake source missing from report: {rel(source_path)}"
                                )

        report["errors"] = local_errors
        if local_errors:
            errors.extend(local_errors)
        result["reports"][name] = report

    result["summaries"] = summaries
    result["errors"] = errors
    result["report_count"] = len(PROVENANCE_REPORT_SPECS)
    result["passed"] = not errors
    return result


def matrix_primary_domains(skill_names: list[str]) -> dict[str, str]:
    """Read the canonical primary-domain assignment from the pressure matrix."""
    if not PRESSURE_MATRIX.is_file():
        return {}
    text = PRESSURE_MATRIX.read_text(encoding="utf-8", errors="replace")
    allowed = set(skill_names)
    return {
        name: domain.strip()
        for name, domain in re.findall(
            r"^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|", text, flags=re.MULTILINE
        )
        if name in allowed
    }


def write_client_delivery_audit(
    skill_names: list[str], details: dict[str, list[dict[str, str]]]
) -> dict[str, object]:
    """Materialize a detailed, non-mutating client-copy audit."""
    rows = [row for client in sorted(details) for row in details[client]]
    tsv_path = DISTILLATION / "client-skill-audit.tsv"
    columns = [
        "client", "skill", "status", "canonical_sha256_16", "client_sha256_16",
        "difference_kind", "missing_files", "extra_files", "changed_files",
        "canonical_path", "client_path",
    ]
    with tsv_path.open("w", encoding="utf-8", newline="") as handle:
        handle.write("\t".join(columns) + "\n")
        for row in rows:
            handle.write(
                "\t".join(
                    str(row[column]).replace("\t", " ").replace("\n", " ")
                    for column in columns
                )
                + "\n"
            )

    lines = [
        "# 客户端 Skill 逐项副本审计",
        "",
        "> 这是只读审计：规范源仍是 `distillation/skills/`；唯一活动交付目标是用户级 `~/.zcode/skills/`，供 ZCode 发现。本报告不会写入 Codex、Claude 或 Obsidian Claudian 作用域。哈希覆盖每个 Skill 包内的相对路径和全部普通文件（SKILL.md、agents、测试等）。",
        "",
        f"- 规范 Skill：{len(skill_names)}",
        f"- 活动作用域：{', '.join(sorted(details)) or '(none)'}",
        f"- 明细行：{len(rows)}",
        "",
        "| 客户端 | Skill | 状态 | 规范源哈希前 16 位 | 客户端哈希前 16 位 | 差异类型 |",
        "|---|---|---|---|---|---|",
    ]
    for row in rows:
        target_hash = f"`{row['client_sha256_16']}`" if row["client_sha256_16"] else "(missing)"
        lines.append(
            f"| `{row['client']}` | `{row['skill']}` | **{row['status']}** | `{row['canonical_sha256_16']}` | {target_hash} | `{row['difference_kind']}` |"
        )
    lines += [
        "",
        "## 状态含义",
        "",
        "- `same`：客户端完整 Skill 包与规范源逐文件一致。",
        "- `different`：ZCode 目录存在，但至少一个文件与规范源不同；本轮不自动覆盖。",
        "- `missing`：ZCode 目录没有完整可识别 Skill，可用 `sync_zcode_skills.py --allow-conflicts` 只安装缺失目录。",
        "",
        "## 差异原因摘要",
        "",
    ]
    by_client_kind: defaultdict[str, Counter[str]] = defaultdict(Counter)
    for row in rows:
        by_client_kind[row["client"]][row["difference_kind"]] += 1
    for client in sorted(by_client_kind):
        summary = ", ".join(
            f"{kind}={count}" for kind, count in sorted(by_client_kind[client].items())
        )
        lines.append(f"- `{client}`：{summary}")
    lines += [
        "",
        "`difference_kind` 只描述规范源与客户端副本的文件差异，不判断哪个版本更适合使用；更新同名目录仍需明确授权。",
        "",
        "完整机器记录见 [`client-skill-audit.tsv`](client-skill-audit.tsv)。",
    ]
    (DISTILLATION / "client-skill-audit.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    return {
        "path": rel(tsv_path),
        "markdown_path": rel(DISTILLATION / "client-skill-audit.md"),
        "active_clients": sorted(details),
        "row_count": len(rows),
        "difference_kinds": {
            client: dict(sorted(counter.items()))
            for client, counter in sorted(by_client_kind.items())
        },
    }


def write_skill_trigger_index(
    skill_names: list[str],
    client_details: dict[str, list[dict[str, str]]],
) -> dict[str, object]:
    """Generate a human/machine-readable entry index from canonical metadata."""
    domains = matrix_primary_domains(skill_names)
    canonical_names = set(skill_names)
    detail_by_client = {
        client: {row["skill"]: row["status"] for row in rows}
        for client, rows in client_details.items()
    }
    entries: list[dict[str, object]] = []
    relation_errors: list[str] = []
    relation_edges: list[dict[str, str]] = []
    for name in skill_names:
        skill_path = CANONICAL_SKILLS / name / "SKILL.md"
        text = skill_path.read_text(encoding="utf-8", errors="replace")
        related, external_related, relation_status = related_skills_from_skill(
            skill_path, canonical_names
        )
        for target, status in relation_status.items():
            if status == "unknown":
                relation_errors.append(f"{name}: unknown related Skill {target}")
        for target in related:
            relation_edges.append({"source": name, "target": target, "kind": "canonical"})
        for target in external_related:
            relation_edges.append({"source": name, "target": target, "kind": "external"})
        entries.append(
            {
                "skill": name,
                "domain": domains.get(name, "unassigned"),
                "description": frontmatter_value(text, "description"),
                "canonical_path": rel(skill_path),
                "related_skills": related,
                "external_related_skills": external_related,
                "related_skill_status": relation_status,
                "client_status": {
                    client: detail_by_client.get(client, {}).get(name, "missing")
                    for client in CLIENTS
                },
            }
        )

    json_path = DISTILLATION / "skill-trigger-index.json"
    json_path.write_text(
        json.dumps({"skill_count": len(entries), "skills": entries}, ensure_ascii=False, indent=2)
        + "\n",
        encoding="utf-8",
    )

    related_json_path = DISTILLATION / "skill-related-index.json"
    related_json_path.write_text(
        json.dumps(
            {
                "skill_count": len(entries),
                "canonical_edge_count": sum(edge["kind"] == "canonical" for edge in relation_edges),
                "external_edge_count": sum(edge["kind"] == "external" for edge in relation_edges),
                "edges": relation_edges,
                "errors": relation_errors,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    grouped: defaultdict[str, list[dict[str, object]]] = defaultdict(list)
    for entry in entries:
        grouped[str(entry["domain"])].append(entry)
    lines = [
        "# Skill 触发入口索引",
        "",
        "> 从规范源 `SKILL.md` 的 description、压力矩阵主域和客户端审计自动生成。先按用户要做的动作选择入口，再让客户端决定是否实际加载；本索引不替代真实会话盲测。",
        "",
        f"- 规范 Skill：{len(entries)}",
        f"- 主域：{len(grouped)}",
        "- 机器记录：[`skill-trigger-index.json`](skill-trigger-index.json)",
        "- 相关关系：[`skill-related-index.md`](skill-related-index.md)",
        "",
    ]
    for domain in sorted(grouped):
        lines += [f"## `{domain}`", ""]
        for entry in sorted(grouped[domain], key=lambda value: str(value["skill"])):
            status = ", ".join(
                f"{client}={entry['client_status'][client]}" for client in CLIENTS
            )
            description = str(entry["description"]).replace("\n", " ").strip()
            skill_name = str(entry["skill"])
            lines += [
                f"### `{skill_name}`",
                "",
                f"- 触发描述：{description}",
                f"- 规范源：[`SKILL.md`](skills/{skill_name}/SKILL.md)",
                f"- 相关规范 Skill：{', '.join(f'`{item}`' for item in entry['related_skills']) or '无'}",
                f"- 外部/非规范关系：{', '.join(f'`{item}`' for item in entry['external_related_skills']) or '无'}",
                f"- 客户端副本：{status}",
                "",
            ]
    (DISTILLATION / "skill-trigger-index.md").write_text(
        "\n".join(lines), encoding="utf-8"
    )

    related_lines = [
        "# Skill 相关关系索引",
        "",
        "> 关系只来自 Skill frontmatter 的 `related_skills` / `external_related_skills`；不会从正文偶然出现的函数名或普通技术术语推断边。它描述导航关系，不是客户端实际触发结果。",
        "",
        f"- 规范 Skill：{len(entries)}",
        f"- 规范关系边：{sum(edge['kind'] == 'canonical' for edge in relation_edges)}",
        f"- 外部关系边：{sum(edge['kind'] == 'external' for edge in relation_edges)}",
        f"- 未知关系：{len(relation_errors)}",
        "- 机器记录：[`skill-related-index.json`](skill-related-index.json)",
        "",
        "| 来源 Skill | 关系类型 | 目标 |",
        "|---|---|---|",
    ]
    for edge in relation_edges:
        kind = "规范 Skill" if edge["kind"] == "canonical" else "外部 Skill/工具"
        related_lines.append(f"| `{edge['source']}` | {kind} | `{edge['target']}` |")
    if relation_errors:
        related_lines += ["", "## 未知关系", ""]
        related_lines.extend(f"- {error}" for error in relation_errors)
    (DISTILLATION / "skill-related-index.md").write_text(
        "\n".join(related_lines) + "\n", encoding="utf-8"
    )
    return {
        "path": rel(DISTILLATION / "skill-trigger-index.md"),
        "json_path": rel(json_path),
        "related_path": rel(DISTILLATION / "skill-related-index.md"),
        "related_json_path": rel(related_json_path),
        "skill_count": len(entries),
        "domain_count": len(grouped),
        "canonical_edge_count": sum(edge["kind"] == "canonical" for edge in relation_edges),
        "external_edge_count": sum(edge["kind"] == "external" for edge in relation_edges),
        "relation_errors": relation_errors,
    }


def write_report(
    records: list[dict[str, object]],
    summary: dict[str, object],
    skill_audit: dict[str, object],
    clients: dict[str, dict[str, int]],
    matrix_audit: dict[str, object],
    index_audit: dict[str, object],
    state_audit: dict[str, object],
    symbol_audit: dict[str, object],
    client_delivery_audit: dict[str, object],
    trigger_index_audit: dict[str, object],
    mixed_intent_audit: dict[str, object],
    provenance_audit: dict[str, object],
    source_freshness: dict[str, object],
    json_audit: dict[str, object],
    inventory_reports: dict[str, object],
    coverage_review_audit: dict[str, object],
) -> None:
    workbench = write_workbench_state()
    report = {
        "vault": str(VAULT),
        "generated_from": "current filesystem",
        "skill_delivery_scope": "user/.zcode/skills (ZCode user scope only)",
        "record_count": len(records),
        "class_counts": dict(Counter(str(r["class"]) for r in records)),
        "domain_counts": dict(Counter(str(r["domain"]) for r in records)),
        "skill_audit": skill_audit,
        "pressure_matrix": matrix_audit,
        "skill_indexes": index_audit,
        "pipeline_state_counts": state_audit,
        "source_symbols": symbol_audit,
        "coverage": summary,
        "clients": clients,
        "client_skill_audit": client_delivery_audit,
        "skill_trigger_index": trigger_index_audit,
        "mixed_intent_matrix": mixed_intent_audit,
        "provenance_audit": provenance_audit,
        "source_freshness": source_freshness,
        "json_artifact_audit": json_audit,
        "inventory_reports": inventory_reports,
        "coverage_review": coverage_review_audit,
        "workbench": workbench,
        "disposition_counts": dict(Counter(str(r.get("disposition", "")) for r in records)),
        "link_audit": markdown_link_audit(),
    }
    (DISTILLATION / "audit-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    lines = [
        "# 来源覆盖缺口报告",
        "",
        "> 由 `scripts/audit_vault.py` 根据当前文件系统生成。`domain-scoped` 表示纳入域范围但尚未逐文件回链；`indexed-only` 表示当前连域范围也没有建立。两者都不代表内容无价值。",
        "",
        "## 域级摘要",
        "",
        "| 知识域 | 文件数 | 知识文档 | Skill 证据 | 精确回链 | 范围覆盖 | 仅盘点 | 待建域 | 证据层 |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for domain, values in summary.items():
        lines.append(
            f"| `{domain}` | {values['files']} | {values['knowledge_documents']} | {values['skill_evidence']} | {values['domain_referenced']} | {values['domain_scoped']} | {values['indexed_only']} | {values['needs_domain_review']} | {values['evidence_layer']} |"
        )
    lines += ["", "## 需要优先继续处理的知识文档", ""]
    for row in records:
        if row["class"] == "knowledge-document" and row["status"] in {"indexed-only", "domain-scoped", "needs-domain-review"}:
            lines.append(f"- `{row['status']}` — `{row['path']}`")
    lines += ["", "## 外部参考与人工覆盖", "", "- 人工 disposition 规则见 `source-disposition-overrides.tsv`。", "- `external-reference` 只表示第三方材料可作为观察/复核入口，不表示其观点已被验证。"]
    lines += ["", "## 客户端副本", "", "- 活动作用域仅为用户级 ~/.zcode/skills/，由 ZCode 使用；Codex、Claude 和 Obsidian Claudian 不在交付范围内。"]
    for client, counts in clients.items():
        lines.append(f"- `{client}`：same={counts.get('same', 0)}，different={counts.get('different', 0)}，missing={counts.get('missing', 0)}")
    lines.append("- 逐 Skill 明细：`client-skill-audit.md` / `client-skill-audit.tsv`")
    lines += ["", "## 规范源检查", "", f"- Skill 数量：{skill_audit['skill_count']}", f"- source_files 条目：{skill_audit['source_path_count']}", f"- 去重后来源路径：{skill_audit['unique_source_path_count']}", f"- 错误数：{len(skill_audit['errors'])}"]
    lines += ["", "## 来源符号检查", "", f"- 声明符号：{symbol_audit['symbol_count']}", f"- 逐字命中：{symbol_audit['exact']}", f"- 限定名叶子命中：{symbol_audit['qualified_leaf']}", f"- 语义/待确认标签：{symbol_audit['review_label']}（详情见 `source-symbol-audit.md`）"]
    lines += ["", "## 压力矩阵检查", "", f"- 矩阵行数：{matrix_audit['row_count']}", f"- 缺失 Skill：{len(matrix_audit['missing_skills'])}", f"- 多余行：{len(matrix_audit['extra_rows'])}", f"- 重复行：{len(matrix_audit['duplicate_rows'])}"]
    if matrix_audit["errors"]:
        lines += ["", "### 压力矩阵错误", ""] + [f"- {error}" for error in matrix_audit["errors"]]
    lines += ["", "## 域索引检查", ""]
    for domain, values in sorted(index_audit.get("indexes", {}).items()):
        lines.append(
            f"- `{domain}`：期望 {values['expected']}，链接 {values['linked']}，重复 {len(values['duplicates'])}，缺失 {len(values['missing'])}，多余 {len(values['extra'])}"
        )
    if index_audit["errors"]:
        lines += ["", "### 域索引错误", ""] + [f"- {error}" for error in index_audit["errors"]]
    lines += ["", "## 流水线状态计数检查", "", f"- 根级声明：{state_audit.get('declared_baseline')}；期望：{state_audit.get('baseline')}"]
    for domain, values in sorted(state_audit.get("domains", {}).items()):
        lines.append(f"- `{domain}`：声明 {values['declared']}，期望 {values['expected']}")
    if state_audit["errors"]:
        lines += ["", "### 流水线状态错误", ""] + [f"- {error}" for error in state_audit["errors"]]
    lines += ["", "## 链接检查", "", f"- 失效相对链接：{markdown_link_audit()['broken']}（详情见 `link-audit.md`）"]
    lines += ["", "## 触发入口索引", "", f"- `skill-trigger-index.md`：{trigger_index_audit.get('skill_count', 0)} 个 Skill，{trigger_index_audit.get('domain_count', 0)} 个主域", f"- 关系边：规范 {trigger_index_audit.get('canonical_edge_count', 0)}，外部 {trigger_index_audit.get('external_edge_count', 0)}，未知 {len(trigger_index_audit.get('relation_errors', []))}"]
    if trigger_index_audit.get("relation_errors"):
        lines += ["", "### Skill 关系错误", ""] + [f"- {error}" for error in trigger_index_audit["relation_errors"]]
    lines += ["", "## 混合意图路由矩阵", "", f"- `skill-mixed-intent-matrix.md`：{mixed_intent_audit.get('case_count', 0)} 条静态预期", f"- 真实客户端命中率已测：{'是' if mixed_intent_audit.get('live_hit_rate_measured') else '否'}"]
    if mixed_intent_audit.get("errors"):
        lines += ["", "### 混合意图矩阵错误", ""] + [f"- {error}" for error in mixed_intent_audit["errors"]]
    lines += ["", "## 三域 provenance 报告完整性", "", f"- 报告数：{provenance_audit.get('report_count', 0)}", f"- 完整性通过：{'是' if provenance_audit.get('passed') else '否'}"]
    for name, report in sorted(provenance_audit.get("reports", {}).items()):
        lines.append(
            f"- `{name}`：JSON={'可解析' if report.get('json_parseable') else '缺失/不可解析'}，Markdown={'存在' if report.get('markdown_exists') else '缺失'}，来源缺失={len(report.get('source_missing', []))}，报告错误={len(report.get('errors', []))}"
        )
    if provenance_audit.get("errors"):
        lines += ["", "### provenance 报告错误", ""] + [f"- {error}" for error in provenance_audit["errors"]]
    lines += [
        "",
        "## 来源新鲜度",
        "",
        f"- 变化文件：{source_freshness.get('changed_files', 0)}（其中被规范 Skill 引用 {source_freshness.get('changed_referenced_files', 0)} 个）",
        f"- 历史基线之后新增且已被引用的文件：{source_freshness.get('added_referenced_files', 0)}",
        "- 详细关系：`source-freshness-audit.md`",
    ]
    lines += [
        "",
        "## JSON 派生物审计",
        "",
        f"- JSON 文件：{json_audit.get('file_count', 0)}",
        f"- 重复键文件：{len(json_audit.get('duplicate_key_files', []))}",
        f"- JSON 错误：{len(json_audit.get('errors', []))}",
    ]
    if json_audit.get("errors"):
        lines += ["", "### JSON 错误", ""] + [f"- {error}" for error in json_audit["errors"]]
    lines += [
        "",
        "## 全仓库覆盖复核",
        "",
        f"- 当前来源快照：{coverage_review_audit.get('inventory_count', 0)} 条；disposition：{coverage_review_audit.get('disposition_count', 0)} 条",
        f"- 唯一路径：{coverage_review_audit.get('unique_path_count', 0)} 条",
        f"- 未回链知识文档：{sum(int(values.get('knowledge_unlinked', 0)) for values in coverage_review_audit.get('domains', {}).values() if isinstance(values, dict))}",
        f"- 过期派生登记：{len(coverage_review_audit.get('stale_derived_register_entries', []))}",
        "- 机器明细：`coverage-review.json`；完整解释见 `FULL_COVERAGE_REVIEW.md`。",
    ]
    if coverage_review_audit.get("errors"):
        lines += ["", "### 覆盖合同错误", ""] + [f"- {error}" for error in coverage_review_audit["errors"]]
    if skill_audit["errors"]:
        lines += ["", "### 错误", ""] + [f"- {error}" for error in skill_audit["errors"]]
    (DISTILLATION / "coverage-gaps.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    records = inventory()
    write_inventory_tsv(DISTILLATION / "source-inventory-current.tsv", records)
    inventory_reports = write_inventory_reports(records)
    inventory_diff = write_inventory_diff(records)
    duplicate_hashes = write_duplicate_hash_report(records)
    archive_audit = write_external_archive_report(records)
    skill_audit, skill_sources = canonical_skill_audit()
    workbench = write_workbench_state()
    coverage_rows, summary = coverage(records, skill_sources)
    coverage_rows = add_dispositions(coverage_rows)
    write_source_registers(coverage_rows)
    write_tsv(DISTILLATION / "source-coverage.tsv", coverage_rows)
    write_tsv(DISTILLATION / "source-disposition.tsv", coverage_rows)
    coverage_review_audit = coverage_review.build_payload()
    coverage_review.JSON_REPORT.write_text(
        json.dumps(coverage_review_audit, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    coverage_review.write_markdown(coverage_review_audit)
    skill_names = sorted(skill_sources)
    client_details = client_audit_details(skill_names)
    clients = client_audit(skill_names)
    client_delivery_audit = write_client_delivery_audit(skill_names, client_details)
    trigger_index_audit = write_skill_trigger_index(skill_names, client_details)
    mixed_intent_audit = mixed_intent_matrix_audit(skill_names)
    matrix_audit = pressure_matrix_audit(skill_names)
    index_audit = skill_index_audit(skill_names)
    state_audit = pipeline_state_count_audit(skill_names)
    symbol_audit = source_symbol_audit(skill_sources)
    provenance_audit = provenance_report_audit()
    source_freshness = write_source_freshness_report(records, skill_sources)
    json_audit = json_artifact_audit()
    if matrix_audit["errors"]:
        skill_audit["errors"].extend(f"pressure-matrix: {error}" for error in matrix_audit["errors"])
    if trigger_index_audit["relation_errors"]:
        skill_audit["errors"].extend(f"skill-relation: {error}" for error in trigger_index_audit["relation_errors"])
    if mixed_intent_audit["errors"]:
        skill_audit["errors"].extend(f"mixed-intent-matrix: {error}" for error in mixed_intent_audit["errors"])
    if index_audit["errors"]:
        skill_audit["errors"].extend(f"skill-index: {error}" for error in index_audit["errors"])
    if state_audit["errors"]:
        skill_audit["errors"].extend(f"pipeline-state: {error}" for error in state_audit["errors"])
    if provenance_audit["errors"]:
        skill_audit["errors"].extend(f"provenance-report: {error}" for error in provenance_audit["errors"])
    if json_audit["errors"]:
        skill_audit["errors"].extend(f"json-artifact: {error}" for error in json_audit["errors"])
    write_report(
        coverage_rows,
        summary,
        skill_audit,
        clients,
        matrix_audit,
        index_audit,
        state_audit,
        symbol_audit,
        client_delivery_audit,
        trigger_index_audit,
        mixed_intent_audit,
        provenance_audit,
        source_freshness,
        json_audit,
        inventory_reports,
        coverage_review_audit,
    )
    print(json.dumps({
        "records": len(records),
        "domains": len(summary),
        "skills": skill_audit["skill_count"],
        "source_files": skill_audit["source_path_count"],
        "skill_errors": len(skill_audit["errors"]),
        "pressure_matrix": matrix_audit,
        "skill_indexes": index_audit,
        "pipeline_state_counts": state_audit,
        "source_symbols": symbol_audit,
        "provenance_audit": provenance_audit,
        "inventory_diff": inventory_diff,
        "duplicate_hashes": duplicate_hashes,
        "archive_audit": archive_audit,
        "dispositions": dict(Counter(str(r["disposition"]) for r in coverage_rows)),
        "clients": clients,
        "client_skill_audit": client_delivery_audit,
        "skill_trigger_index": trigger_index_audit,
        "mixed_intent_matrix": mixed_intent_audit,
        "source_freshness": source_freshness,
        "json_artifact_audit": json_audit,
        "inventory_reports": inventory_reports,
        "coverage_review": coverage_review_audit,
        "workbench": workbench,
    }, ensure_ascii=False, indent=2))
    return 1 if skill_audit["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
