#!/usr/bin/env python3
"""Build a conservative whole-vault coverage review.

The inventory and disposition ledgers answer *where a file is and how it is
used*.  They do not prove that a human has understood the file.  This module
keeps those claims separate and produces a small machine-readable checkpoint
plus a human-readable report.  It is intentionally independent of the
content extractors: a later distillation pass can improve the per-domain
reports without changing this accounting contract.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable


DISTILLATION = Path(__file__).resolve().parents[1]
INVENTORY = DISTILLATION / "source-inventory-current.tsv"
DISPOSITION = DISTILLATION / "source-disposition.tsv"
JSON_REPORT = DISTILLATION / "coverage-review.json"
MARKDOWN_REPORT = DISTILLATION / "FULL_COVERAGE_REVIEW.md"

# A report is deliberately not inferred from BOOK_OVERVIEW/DIGEST alone.  A
# domain must explicitly add a coverage review or an equivalent machine table
# before it is described as having received a dedicated full-coverage pass.
REVIEW_NAMES = (
    "FULL_COVERAGE_REVIEW.md",
    "coverage-review.md",
    "unlinked-review.tsv",
    "coverage-supplement.md",
)

LINKED_STATUSES = {"skill-evidence", "domain-referenced"}
SCOPE_ONLY_STATUSES = {"domain-scoped"}
UNLINKED_STATUSES = {"indexed-only", "needs-domain-review"}
EVIDENCE_STATUSES = {"evidence-layer"}


def read_tsv(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        return []
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def relative(path: Path) -> str:
    return path.relative_to(DISTILLATION).as_posix()


def domain_review_files(domain: str) -> list[str]:
    directory = DISTILLATION / domain
    if not directory.is_dir():
        return []
    return [
        relative(directory / name)
        for name in REVIEW_NAMES
        if (directory / name).is_file()
    ]


def _as_int(row: dict[str, str], key: str) -> int:
    try:
        return int(row.get(key, "0") or "0")
    except ValueError:
        return 0


def stale_register_entries(inventory_paths: set[str]) -> list[dict[str, str]]:
    """Find paths retained by derived ledgers but absent from this snapshot.

    A stale register is preserved as historical evidence rather than deleted.
    It must not, however, be counted as a current source.  Only the final
    backtick-delimited cell of Markdown table rows is treated as a path.
    """

    entries: list[dict[str, str]] = []
    row_pattern = re.compile(r"^\|.*\|\s*`([^`]+)`\s*\|?\s*$")
    for register in sorted(DISTILLATION.glob("*/source-register.md")):
        domain = register.parent.name
        text = register.read_text(encoding="utf-8", errors="replace")
        for line_number, line in enumerate(text.splitlines(), start=1):
            match = row_pattern.match(line.strip())
            if not match:
                continue
            path = match.group(1).replace("\\|", "|").strip()
            if "/" not in path or path in inventory_paths:
                continue
            entries.append(
                {
                    "register": relative(register),
                    "domain": domain,
                    "line": str(line_number),
                    "path": path,
                }
            )
    return entries


def summarize_rows(
    rows: Iterable[dict[str, str]],
    *,
    review_file_map: dict[str, list[str]] | None = None,
) -> dict[str, object]:
    """Summarize disposition rows without changing their statuses."""

    materialized = list(rows)
    by_domain: defaultdict[str, list[dict[str, str]]] = defaultdict(list)
    for row in materialized:
        by_domain[row.get("domain", "(missing)")].append(row)

    review_file_map = review_file_map or {}
    domains: dict[str, dict[str, object]] = {}
    for domain in sorted(by_domain):
        domain_rows = by_domain[domain]
        statuses = Counter(row.get("status", "") for row in domain_rows)
        knowledge = [
            row for row in domain_rows if row.get("class") == "knowledge-document"
        ]
        linked_knowledge = sum(
            row.get("status") in LINKED_STATUSES for row in knowledge
        )
        scope_only_knowledge = sum(
            row.get("status") in SCOPE_ONLY_STATUSES for row in knowledge
        )
        unlinked_knowledge_rows = [
            row
            for row in knowledge
            if row.get("status") in UNLINKED_STATUSES
        ]
        review_files = review_file_map.get(domain, [])
        domains[domain] = {
            "files": len(domain_rows),
            "knowledge_documents": len(knowledge),
            "knowledge_linked": linked_knowledge,
            "knowledge_scope_only": scope_only_knowledge,
            "knowledge_unlinked": len(unlinked_knowledge_rows),
            "knowledge_coverage_ratio": round(
                linked_knowledge / len(knowledge), 4
            ) if knowledge else None,
            "status_counts": dict(sorted(statuses.items())),
            "evidence_layer": statuses.get("evidence-layer", 0),
            "review_files": review_files,
            "dedicated_review": bool(review_files),
            # Keep paths in JSON so a continuation worker can pick up the
            # exact queue; the Markdown report only shows a bounded sample.
            "unlinked_knowledge_paths": [
                row.get("path", "") for row in unlinked_knowledge_rows
            ],
        }

    all_paths = [row.get("path", "") for row in materialized]
    path_counts = Counter(path for path in all_paths if path)
    duplicate_paths = sorted(path for path, count in path_counts.items() if count > 1)
    missing_paths = sorted(index for index, path in enumerate(all_paths) if not path)
    status_counts = Counter(row.get("status", "") for row in materialized)
    return {
        "record_count": len(materialized),
        "unique_path_count": len(path_counts),
        "duplicate_paths": duplicate_paths,
        "missing_path_row_indexes": missing_paths,
        "status_counts": dict(sorted(status_counts.items())),
        "domains": domains,
        "contract": {
            "one_row_per_source_path": len(missing_paths) == 0
            and len(duplicate_paths) == 0,
            "evidence_is_not_knowledge": True,
            "linked_statuses": sorted(LINKED_STATUSES),
            "scope_only_statuses": sorted(SCOPE_ONLY_STATUSES),
            "unlinked_statuses": sorted(UNLINKED_STATUSES),
        },
    }


def validate_review_payload(
    payload: dict[str, object],
    *,
    inventory_count: int | None = None,
) -> list[str]:
    """Return hard accounting errors; open content queues are not errors."""

    errors: list[str] = []
    if not isinstance(payload.get("record_count"), int):
        errors.append("record_count is missing or not an integer")
    if inventory_count is not None and payload.get("record_count") != inventory_count:
        errors.append(
            f"record_count={payload.get('record_count')} != inventory_count={inventory_count}"
        )
    if payload.get("unique_path_count") != payload.get("record_count"):
        errors.append("source paths are missing or duplicated")
    contract = payload.get("contract")
    if not isinstance(contract, dict) or not contract.get("one_row_per_source_path"):
        errors.append("one_row_per_source_path contract is not satisfied")
    if not isinstance(payload.get("domains"), dict) or not payload.get("domains"):
        errors.append("no domain coverage summaries were recorded")
    return errors


def build_payload() -> dict[str, object]:
    inventory_rows = read_tsv(INVENTORY)
    disposition_rows = read_tsv(DISPOSITION)
    inventory_paths = {row.get("path", "") for row in inventory_rows}
    disposition_paths = {row.get("path", "") for row in disposition_rows}
    review_map = {
        domain: domain_review_files(domain)
        for domain in sorted(
            row.get("domain", "") for row in disposition_rows if row.get("domain")
        )
    }
    summary = summarize_rows(disposition_rows, review_file_map=review_map)
    stale_entries = stale_register_entries(inventory_paths - {""})
    payload: dict[str, object] = {
        "generated_from": "source-inventory-current.tsv + source-disposition.tsv",
        "inventory_count": len(inventory_rows),
        "inventory_unique_path_count": len(inventory_paths - {""}),
        "disposition_count": len(disposition_rows),
        "disposition_only_paths": sorted(disposition_paths - inventory_paths - {""}),
        "inventory_only_paths": sorted(inventory_paths - disposition_paths - {""}),
        "stale_derived_register_entries": stale_entries,
        "review_name_contract": list(REVIEW_NAMES),
        **summary,
    }
    payload["errors"] = validate_review_payload(
        payload, inventory_count=len(inventory_rows)
    )
    return payload


def write_markdown(payload: dict[str, object]) -> None:
    domains = payload.get("domains", {})
    lines = [
        "# 全仓库全量覆盖复核",
        "",
        "> 这份报告首先证明“每个当前来源路径都有登记”，再单独说明哪些知识文档已经被 Skill/域文档精确回链。文件登记、范围纳入和内容理解是三个不同层级；附件、模型、图片和构建产物不会因为存在于快照中就被宣称已经理解。",
        "",
        f"- 当前来源快照：{payload.get('inventory_count', 0):,} 条",
        f"- 当前 disposition：{payload.get('disposition_count', 0):,} 条",
        f"- 唯一路径：{payload.get('unique_path_count', 0):,} 条",
        f"- 机械合同：{'通过' if not payload.get('errors') else '失败'}",
        "- 机器明细：[`coverage-review.json`](coverage-review.json)",
        "- 逐文件权威明细：[`source-disposition.tsv`](source-disposition.tsv)",
        "",
        "## 域级覆盖",
        "",
        "| 知识域 | 文件 | 知识文档 | 已精确回链 | 仅范围覆盖 | 未回链 | 证据层 | 精确回链率 | 专门复核报告 |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    if isinstance(domains, dict):
        for domain, values in sorted(domains.items()):
            if not isinstance(values, dict):
                continue
            ratio = values.get("knowledge_coverage_ratio")
            ratio_text = "—" if ratio is None else f"{float(ratio) * 100:.1f}%"
            reports = values.get("review_files", [])
            report_text = ", ".join(f"`{item}`" for item in reports) if reports else "缺失"
            lines.append(
                f"| `{domain}` | {values.get('files', 0):,} | {values.get('knowledge_documents', 0):,} | "
                f"{values.get('knowledge_linked', 0):,} | {values.get('knowledge_scope_only', 0):,} | "
                f"{values.get('knowledge_unlinked', 0):,} | {values.get('evidence_layer', 0):,} | {ratio_text} | {report_text} |"
            )
    lines += [
        "",
        "## 解释口径",
        "",
        "- `已精确回链` = `skill-evidence` + `domain-referenced`；它证明产物中出现了保守的来源路径，不等于模型已运行或结论永远正确。",
        "- `仅范围覆盖` = `domain-scoped`；只说明来源边界纳入了目录/变体，仍需逐文件阅读或源码核对。",
        "- `未回链` = `indexed-only` + `needs-domain-review`；这是下一轮蒸馏队列，不能被 DIGEST 或总索引的泛化描述掩盖。",
        "- `证据层` = 图片、模型、压缩包、构建产物和其他附件；它们通过 provenance/disposition 管理，不直接折算为知识文档覆盖。",
        "- “专门复核报告”只表示该域有全量覆盖审计文件；它不会自动把文件状态升级为已理解。",
        "",
        "## 过期派生登记",
        "",
        "> 这些路径曾出现在 `distillation/*/source-register.md`，但不在当前原始快照中。它们保留作历史/派生证据，不计入当前来源，也不应被当作仍存在的原始文件。",
        "",
    ]
    stale_entries = payload.get("stale_derived_register_entries", [])
    if stale_entries:
        lines.append(f"- 发现 {len(stale_entries)} 条过期登记：")
        lines.extend(
            f"  - `{item['register']}:{item['line']}` → `{item['path']}`"
            for item in stale_entries[:80]
        )
        if len(stale_entries) > 80:
            lines.append(f"  - … 其余 {len(stale_entries) - 80} 条见 `coverage-review.json`。")
    else:
        lines.append("- 未发现过期派生登记。")
    lines += [
        "",
        "## 继续队列（每域最多展示 20 条）",
        "",
    ]
    if isinstance(domains, dict):
        for domain, values in sorted(domains.items()):
            if not isinstance(values, dict):
                continue
            paths = values.get("unlinked_knowledge_paths", [])
            if not paths:
                continue
            lines += [f"### `{domain}`（{len(paths)} 条）", ""]
            lines.extend(f"- `{path}`" for path in paths[:20])
            if len(paths) > 20:
                lines.append(f"- … 其余 {len(paths) - 20} 条见 `coverage-review.json`。")
            lines.append("")
    errors = payload.get("errors", [])
    if errors:
        lines += ["## 机械合同错误", ""]
        lines.extend(f"- {error}" for error in errors)
    MARKDOWN_REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run(*, check_only: bool = False) -> int:
    if check_only:
        if not JSON_REPORT.is_file():
            print(f"missing {JSON_REPORT}")
            return 1
        try:
            payload = json.loads(JSON_REPORT.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print(f"cannot parse {JSON_REPORT}: {exc}")
            return 1
        inventory_count = len(read_tsv(INVENTORY))
        errors = validate_review_payload(payload, inventory_count=inventory_count)
        if not MARKDOWN_REPORT.is_file():
            errors.append(f"missing {MARKDOWN_REPORT}")
        if errors:
            for error in errors:
                print(f"- {error}")
            return 1
        print(json.dumps({"status": "passed", "record_count": payload.get("record_count")}, ensure_ascii=False))
        return 0

    payload = build_payload()
    JSON_REPORT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_markdown(payload)
    print(json.dumps({"status": "passed" if not payload.get("errors") else "failed", **{key: payload.get(key) for key in ("inventory_count", "disposition_count", "unique_path_count", "errors")}}, ensure_ascii=False, indent=2))
    return 0 if not payload.get("errors") else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    return run(check_only=args.check_only)


if __name__ == "__main__":
    raise SystemExit(main())
