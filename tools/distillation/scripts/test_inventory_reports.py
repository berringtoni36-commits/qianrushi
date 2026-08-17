#!/usr/bin/env python3
"""Regression checks for the generated inventory summaries."""

import csv
import re
import unittest
from collections import Counter, defaultdict
from pathlib import Path


DISTILLATION = Path(__file__).resolve().parents[1]
INVENTORY = DISTILLATION / "source-inventory-current.tsv"
SUMMARY = DISTILLATION / "source-inventory-summary.md"
ARTIFACTS = DISTILLATION / "artifact-inventory.md"


class InventoryReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with INVENTORY.open(encoding="utf-8", newline="") as handle:
            cls.rows = list(csv.DictReader(handle, delimiter="\t"))
        cls.summary = SUMMARY.read_text(encoding="utf-8")
        cls.artifacts = ARTIFACTS.read_text(encoding="utf-8")

    def test_summary_total_matches_current_snapshot(self):
        total_bytes = sum(int(row["size_bytes"]) for row in self.rows)
        self.assertIn(f"- 文件数：{len(self.rows):,}", self.summary)
        self.assertIn(f"- 总大小：{total_bytes:,} bytes", self.summary)

    def test_summary_domain_rows_match_current_snapshot(self):
        counts = Counter(row["domain"] for row in self.rows)
        sizes = defaultdict(int)
        for row in self.rows:
            sizes[row["domain"]] += int(row["size_bytes"])
        for domain in counts:
            expected = f"| `{domain}` | {counts[domain]:,} | {sizes[domain]:,} |"
            self.assertIn(expected, self.summary)

    def test_artifact_rows_match_current_snapshot(self):
        counts = Counter(row["class"] for row in self.rows)
        sizes = defaultdict(int)
        for row in self.rows:
            sizes[row["class"]] += int(row["size_bytes"])
        for file_class in counts:
            expected = f"| `{file_class}` | {counts[file_class]:,} | {sizes[file_class]:,} |"
            self.assertIn(expected, self.artifacts)

    def test_reports_state_their_generation_contract(self):
        self.assertRegex(self.summary, r"由 `scripts/audit_vault\.py` 在每次审计时重生成")
        self.assertRegex(self.artifacts, r"由 `scripts/audit_vault\.py` 从当前文件系统重算")


if __name__ == "__main__":
    unittest.main()
