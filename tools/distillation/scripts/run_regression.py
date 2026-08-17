#!/usr/bin/env python3
"""Run the repeatable, non-destructive distillation regression suite.

The default mode refreshes derived reports below ``distillation/`` and then
checks their cross-report contracts. It never edits the original vault
sources and never installs or overwrites a client Skill. The ZCode-only
synchronizer is called with --dry-run only; existing user directories are
reported as conflicts and are intentionally left untouched.

Use ``--check-only`` when a caller wants to validate the already-generated
reports without refreshing them. This is useful for a heartbeat/resume step
that should not create a second derived snapshot before inspecting the first.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


DISTILLATION = Path(__file__).resolve().parents[1]
SCRIPTS = DISTILLATION / "scripts"
REPORT = DISTILLATION / "audit-report.json"


def report_contract_errors(report: dict[str, Any]) -> list[str]:
    """Return hard failures in the generated report contract.

    The exact Skill count is deliberately not hard-coded: adding a validated
    Skill should make this runner continue to work. Structural sections are
    checked against the current count and each producer's own error list.
    """

    errors: list[str] = []
    skill_audit = report.get("skill_audit", {})
    skill_count = int(skill_audit.get("skill_count", 0) or 0)
    if skill_count <= 0:
        errors.append("audit-report: no canonical Skills were reported")
    if skill_audit.get("errors"):
        errors.extend(f"audit-report.skill_audit: {item}" for item in skill_audit["errors"])

    pressure = report.get("pressure_matrix", {})
    if pressure.get("row_count") != skill_count:
        errors.append(
            "audit-report: pressure-matrix row count "
            f"{pressure.get('row_count')} != Skill count {skill_count}"
        )
    errors.extend(f"audit-report.pressure_matrix: {item}" for item in pressure.get("errors", []))

    index_audit = report.get("skill_indexes", {})
    errors.extend(f"audit-report.skill_indexes: {item}" for item in index_audit.get("errors", []))

    state_audit = report.get("pipeline_state_counts", {})
    errors.extend(f"audit-report.pipeline_state_counts: {item}" for item in state_audit.get("errors", []))

    mixed = report.get("mixed_intent_matrix", {})
    errors.extend(f"audit-report.mixed_intent_matrix: {item}" for item in mixed.get("errors", []))

    trigger = report.get("skill_trigger_index", {})
    errors.extend(f"audit-report.skill_trigger_index: {item}" for item in trigger.get("relation_errors", []))
    if trigger.get("skill_count") != skill_count:
        errors.append(
            "audit-report: trigger-index Skill count "
            f"{trigger.get('skill_count')} != Skill count {skill_count}"
        )

    client_audit = report.get("client_skill_audit", {})
    expected_clients = ["zcode"]
    actual_clients = client_audit.get("active_clients")
    if actual_clients != expected_clients:
        errors.append(
            "audit-report: active Skill scope must be exactly user ZCode "
            f"({expected_clients}), got {actual_clients}"
        )
    expected_client_rows = skill_count * len(expected_clients)
    if client_audit.get("row_count") != expected_client_rows:
        errors.append(
            "audit-report: client Skill audit row count "
            f"{client_audit.get('row_count')} != expected {expected_client_rows}"
        )

    provenance = report.get("provenance_audit", {})
    errors.extend(f"audit-report.provenance_audit: {item}" for item in provenance.get("errors", []))
    if provenance.get("report_count") != 3 or not provenance.get("passed"):
        errors.append("audit-report: the three provenance reports are not complete")

    json_audit = report.get("json_artifact_audit", {})
    errors.extend(f"audit-report.json_artifact_audit: {item}" for item in json_audit.get("errors", []))

    link_audit = report.get("link_audit", {})
    broken_links = int(link_audit.get("broken", 0) or 0)
    if broken_links:
        errors.append(f"audit-report: {broken_links} broken relative Markdown link(s)")

    inventory = report.get("inventory_reports", {})
    if not inventory.get("summary_path") or not inventory.get("artifact_path"):
        errors.append("audit-report: generated inventory report paths are missing")

    coverage = report.get("coverage_review", {})
    if coverage:
        errors.extend(
            f"audit-report.coverage_review: {item}"
            for item in coverage.get("errors", [])
        )
        if coverage.get("record_count") != report.get("record_count"):
            errors.append(
                "audit-report: coverage-review record count "
                f"{coverage.get('record_count')} != vault record count {report.get('record_count')}"
            )
        for domain, summary in (coverage.get("domains", {}) or {}).items():
            if (
                int(summary.get("knowledge_documents", 0) or 0) > 0
                and not summary.get("dedicated_review")
            ):
                errors.append(
                    "audit-report.coverage_review: knowledge domain "
                    f"'{domain}' has no dedicated full-coverage review"
                )

    freshness = report.get("source_freshness", {})
    if int(freshness.get("pending_count", 0) or 0):
        errors.append(
            "audit-report: source freshness has "
            f"{freshness.get('pending_count')} pending review item(s)"
        )

    workbench = report.get("workbench", {})
    for key in ("invalid", "source_missing", "title_missing"):
        if int(workbench.get(key, 0) or 0):
            errors.append(f"audit-report.workbench: {key}={workbench.get(key)}")

    clients = report.get("clients", {})
    if sorted(clients) != ["zcode"]:
        errors.append(
            "audit-report: client summary must contain only 'zcode'; "
            f"got {sorted(clients)}"
        )
    for client in ("zcode",):
        if client not in clients:
            errors.append(f"audit-report: client '{client}' is missing")
        elif int(clients[client].get("missing", 0) or 0):
            errors.append(f"audit-report: client '{client}' has missing Skill directories")

    return errors


def load_and_validate_report(path: Path = REPORT) -> list[str]:
    if not path.is_file():
        return [f"missing report: {path}"]
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot parse {path}: {exc}"]
    if not isinstance(payload, dict):
        return [f"{path} is not a JSON object"]
    return report_contract_errors(payload)


def run_step(name: str, command: list[str], env: dict[str, str]) -> dict[str, Any]:
    started = time.monotonic()
    completed = subprocess.run(
        command,
        cwd=DISTILLATION.parent,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    duration = round(time.monotonic() - started, 3)
    output = (completed.stdout + completed.stderr).strip()
    print(f"\n=== {name} ({duration:.3f}s, exit={completed.returncode}) ===")
    if output:
        if len(output) > 6000:
            print("[output truncated; showing the last 6000 characters]")
            print(output[-6000:])
        else:
            print(output)
    return {
        "name": name,
        "command": command,
        "returncode": completed.returncode,
        "duration_seconds": duration,
        "output_tail": output[-4000:],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="do not refresh audit reports; validate the existing derived reports",
    )
    return parser


def write_latest_report(result: dict[str, Any]) -> None:
    """Persist a compact human-readable checkpoint below distillation/."""

    lines = [
        "# 最近一次蒸馏回归",
        "",
        f"- 时间：{dt.datetime.now().astimezone().isoformat(timespec='seconds')}",
        f"- 模式：{'check-only' if result['check_only'] else 'refresh + check'}",
        f"- 总体：**{'通过' if result['passed'] else '失败'}**",
        "- 真实 ZCode 新会话盲测：未执行；本文件不把静态回归当作客户端命中率。",
        "",
        "## 步骤",
        "",
        "| 步骤 | 退出码 | 耗时（秒） |",
        "|---|---:|---:|",
    ]
    for step in result["steps"]:
        lines.append(
            f"| `{step['name']}` | {step['returncode']} | {step['duration_seconds']:.3f} |"
        )
    lines += [
        "",
        "## 报告合同",
        "",
        f"- 错误数：{len(result['report_contract_errors'])}",
        "- 同名客户端目录只做 dry-run 检查；已存在的目录不会被覆盖。",
    ]
    if result["report_contract_errors"]:
        lines += ["", "### 错误", ""]
        lines.extend(f"- {error}" for error in result["report_contract_errors"])
    (DISTILLATION / "regression-latest.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    python = sys.executable
    env = os.environ.copy()
    env["PYTHONPATH"] = os.pathsep.join(
        [str(SCRIPTS), env.get("PYTHONPATH", "")]
    ).rstrip(os.pathsep)
    steps: list[dict[str, Any]] = []

    if not args.check_only:
        steps.append(run_step(
            "provenance report refresh",
            [python, str(SCRIPTS / "provenance_audit.py")],
            env,
        ))
        steps.append(run_step(
            "vault and Skill audit",
            [python, str(SCRIPTS / "audit_vault.py")],
            env,
        ))
        steps.append(run_step(
            "whole-vault coverage review",
            [python, str(SCRIPTS / "coverage_review.py")],
            env,
        ))
    else:
        steps.append(run_step(
            "whole-vault coverage review",
            [python, str(SCRIPTS / "coverage_review.py"), "--check-only"],
            env,
        ))
    steps.append(run_step(
        "provenance read-only check",
        [python, str(SCRIPTS / "provenance_audit.py"), "--check-only"],
        env,
    ))
    steps.append(run_step(
        "Python regression tests",
        [python, "-m", "unittest", "discover", "-s", str(SCRIPTS), "-p", "test_*.py"],
        env,
    ))
    steps.append(run_step(
        "ZCode user-scope sync dry-run",
        [
            python,
            str(SCRIPTS / "sync_zcode_skills.py"),
            "--dry-run",
            "--allow-conflicts",
        ],
        env,
    ))

    report_errors = load_and_validate_report()
    if report_errors:
        print("\n=== report contract failures ===")
        for error in report_errors:
            print(f"- {error}")

    failed_steps = [step for step in steps if step["returncode"] != 0]
    result = {
        "check_only": args.check_only,
        "steps": steps,
        "report_contract_errors": report_errors,
        "passed": not failed_steps and not report_errors,
        "live_client_blind_test": False,
        "live_client_blind_test_note": "静态/派生回归不等于 ZCode 新会话真实命中率。",
    }
    write_latest_report(result)
    print("\n=== regression summary ===")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
