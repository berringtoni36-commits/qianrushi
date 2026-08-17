#!/usr/bin/env python3
"""Safely sync canonical Skills into the ZCode user directory only.

The canonical source is the vault's distillation/skills directory and the
only target is the user-level ~/.zcode/skills directory. Existing Skill
directories are reported as conflicts and never overwritten. Use
--allow-conflicts when adding newly created canonical Skills to an existing
ZCode installation.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sync_skills import sync


VAULT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = VAULT / "distillation" / "skills"
DEFAULT_TARGET = Path.home() / ".zcode" / "skills"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help="canonical Skill directory (default: vault/distillation/skills)",
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=DEFAULT_TARGET,
        help="ZCode user Skill directory (default: ~/.zcode/skills)",
    )
    parser.add_argument("--dry-run", action="store_true", help="report actions without writing")
    parser.add_argument(
        "--allow-conflicts",
        action="store_true",
        help="continue past existing directories; never overwrites them",
    )
    args = parser.parse_args(argv)
    try:
        installed, conflicts = sync(
            args.source.resolve(),
            {"zcode": args.target.resolve()},
            args.dry_run,
            args.allow_conflicts,
        )
    except (OSError, FileNotFoundError) as exc:
        print(f"ERROR {exc}", file=sys.stderr)
        return 2
    print(f"SUMMARY zcode_installed_or_planned={len(installed)} conflicts={len(conflicts)}")
    if conflicts and not args.allow_conflicts:
        print(
            "Existing ZCode Skill directories were not changed; "
            "inspect conflicts before retrying.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
