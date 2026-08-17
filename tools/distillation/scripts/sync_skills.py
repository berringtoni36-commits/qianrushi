#!/usr/bin/env python3
"""Generic non-overwriting copy primitive used by the ZCode-only wrapper.

The public command in this file is intentionally disabled. The vault now uses
sync_zcode_skills.py so a maintenance command cannot silently reinstall
these Skills into global Codex, Claude, or ZCode roots. The sync function
remains a small, tested copy primitive for the scoped wrapper and unit tests.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


def canonical_skills(source: Path) -> list[Path]:
    if not source.is_dir():
        raise FileNotFoundError(f"canonical source does not exist: {source}")
    return sorted(
        path for path in source.iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    )


def sync(
    source: Path,
    clients: dict[str, Path],
    dry_run: bool,
    allow_conflicts: bool,
) -> tuple[list[str], list[str]]:
    installed: list[str] = []
    conflicts: list[str] = []
    skills = canonical_skills(source)

    # Preflight the complete operation before creating any target directory.
    # In conservative mode, a conflict must make the run a no-op; otherwise a
    # later missing Skill could be copied before the caller sees the failure.
    targets: list[tuple[str, Path, Path]] = []
    for client, root in clients.items():
        for skill in skills:
            target = root / skill.name
            label = f"{client}:{skill.name}"
            targets.append((label, skill, target))
            if target.exists():
                conflicts.append(label)
                print(f"CONFLICT {label} -> {target}")

    if conflicts and not allow_conflicts and not dry_run:
        print(
            "Existing directories found; conservative mode made no changes. "
            "Use --allow-conflicts to install only missing directories.",
            file=sys.stderr,
        )
        return installed, conflicts

    for label, skill, target in targets:
        if target.exists():
            continue
        print(f"{'DRY-RUN ' if dry_run else ''}INSTALL {label} -> {target}")
        installed.append(label)
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(skill, target)
    return installed, conflicts


def main() -> int:
    print(
        "ERROR global Skill synchronization is disabled for this vault; "
        "use sync_zcode_skills.py for ~/.zcode/skills only.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
