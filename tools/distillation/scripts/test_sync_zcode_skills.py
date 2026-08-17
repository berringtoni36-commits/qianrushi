#!/usr/bin/env python3
"""Regression tests for the ZCode-only sync entry point."""

import tempfile
import unittest
from pathlib import Path

from sync_zcode_skills import main


class ZCodeSyncTests(unittest.TestCase):
    def make_skill(self, root: Path, name: str) -> None:
        skill = root / name
        skill.mkdir(parents=True)
        (skill / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: test\n---\n",
            encoding="utf-8",
        )

    def test_wrapper_targets_only_the_explicit_zcode_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "canonical"
            target = root / "zcode" / "skills"
            source.mkdir()
            self.make_skill(source, "existing")
            self.make_skill(source, "missing")
            (target / "existing").mkdir(parents=True)
            (target / "existing" / "SKILL.md").write_text("sentinel\n", encoding="utf-8")

            exit_code = main(
                [
                    "--source",
                    str(source),
                    "--target",
                    str(target),
                    "--allow-conflicts",
                ]
            )

            self.assertEqual(exit_code, 0)
            self.assertEqual(
                (target / "existing" / "SKILL.md").read_text(encoding="utf-8"),
                "sentinel\n",
            )
            self.assertTrue((target / "missing" / "SKILL.md").is_file())


if __name__ == "__main__":
    unittest.main()
