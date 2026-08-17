#!/usr/bin/env python3
"""Regression tests for the non-overwriting Skill synchronizer."""

import tempfile
import unittest
from pathlib import Path

from sync_skills import sync


class SyncSkillsTests(unittest.TestCase):
    def make_skill(self, root: Path, name: str, marker: str) -> None:
        skill = root / name
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: {marker}\n---\n",
            encoding="utf-8",
        )

    def test_conflict_preflight_is_all_or_nothing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "canonical"
            codex = root / "codex"
            source.mkdir()
            codex.mkdir()
            self.make_skill(source, "existing", "canonical")
            self.make_skill(source, "missing", "canonical")
            existing = codex / "existing"
            existing.mkdir()
            (existing / "SKILL.md").write_text("sentinel\n", encoding="utf-8")

            installed, conflicts = sync(
                source,
                {"codex": codex},
                dry_run=False,
                allow_conflicts=False,
            )

            self.assertEqual(installed, [])
            self.assertEqual(conflicts, ["codex:existing"])
            self.assertFalse((codex / "missing").exists())
            self.assertEqual(
                (existing / "SKILL.md").read_text(encoding="utf-8"), "sentinel\n"
            )

    def test_allow_conflicts_only_installs_missing_directories(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "canonical"
            codex = root / "codex"
            source.mkdir()
            codex.mkdir()
            self.make_skill(source, "existing", "canonical")
            self.make_skill(source, "missing", "canonical")
            existing = codex / "existing"
            existing.mkdir()
            (existing / "SKILL.md").write_text("sentinel\n", encoding="utf-8")

            installed, conflicts = sync(
                source,
                {"codex": codex},
                dry_run=False,
                allow_conflicts=True,
            )

            self.assertEqual(installed, ["codex:missing"])
            self.assertEqual(conflicts, ["codex:existing"])
            self.assertTrue((codex / "missing" / "SKILL.md").is_file())
            self.assertEqual(
                (existing / "SKILL.md").read_text(encoding="utf-8"), "sentinel\n"
            )


if __name__ == "__main__":
    unittest.main()
