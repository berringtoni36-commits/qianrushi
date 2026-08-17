"""Regression checks for non-Skill distillation sidecars.

These reports are deliberately checked separately from the canonical Skill
contract: a page evidence card or an active-recall queue is useful derived
material, but it must not silently become a Skill or a claim of mastery.
"""

from __future__ import annotations

import csv
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DISTILLATION = ROOT / "distillation"


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


class SidecarReportTests(unittest.TestCase):
    def test_algorithm_page_cards_cover_text_pages_once(self) -> None:
        path = DISTILLATION / "algorithm-pdf" / "page-topic-cards.tsv"
        rows = read_tsv(path)
        self.assertEqual(len(rows), 121)
        pages = [int(row["page_start"]) for row in rows]
        self.assertEqual(pages, list(range(1, 122)))
        self.assertTrue(all(row["page_start"] == row["page_end"] for row in rows))
        self.assertTrue(
            {row["evidence_level"] for row in rows}
            <= {"E1-TEXT", "E1-IMAGE", "E1-GAP"}
        )
        self.assertTrue(all(":p" in row["source_ref"] for row in rows))

    def test_algorithm_formula_gap_register_keeps_page_and_boundary_fields(self) -> None:
        path = DISTILLATION / "algorithm-pdf" / "formula-figure-gap-register.tsv"
        rows = read_tsv(path)
        self.assertGreaterEqual(len(rows), 1)
        required = {"page_start", "page_end", "gap_kind", "evidence_level"}
        self.assertTrue(required <= set(rows[0]))
        self.assertTrue(all(row["page_start"] and row["page_end"] for row in rows))
        self.assertTrue(all(row["gap_kind"] for row in rows))

    def test_workbench_queue_matches_record_snapshot(self) -> None:
        queue = read_tsv(
            DISTILLATION / "workbench-learning-state" / "review-queue.tsv"
        )
        records = read_tsv(DISTILLATION / "workbench-learning-state" / "records.tsv")
        self.assertEqual(len(queue), 360)
        self.assertEqual(len(records), 360)
        self.assertEqual(
            {row["record_file"] for row in queue},
            {row["record_file"] for row in records},
        )
        self.assertEqual(
            sorted(int(row["queue_rank"]) for row in queue), list(range(1, 361))
        )
        self.assertTrue(all(row["source_exists"] == "yes" for row in queue))
        self.assertTrue(
            all((ROOT / row["source_target"]).is_file() for row in queue)
        )
        self.assertTrue(
            {row["tier"] for row in queue}
            <= {"T1-project", "T2-150", "T3-studied-supplement", "T4-unlearned"}
        )

    def test_workbench_source_relink_is_conservative(self) -> None:
        text = (
            DISTILLATION
            / "workbench-learning-state"
            / "source-relink-review.md"
        ).read_text(encoding="utf-8")
        self.assertIn("工作台/力扣入口.md", text)
        self.assertIn("工作台/项目快刷.md", text)
        self.assertIn("不修改原始文档", text)
        self.assertIn("不证明", text)

    def test_rednote_index_preserves_collection_and_external_fact_boundaries(self) -> None:
        rows = read_tsv(
            DISTILLATION / "rednote-bookmarks" / "article-index.tsv"
        )
        self.assertEqual(len(rows), 391)
        self.assertEqual(
            {row["collection"] for row in rows},
            {"Bookmarks", "Likes", "Posts", "Albums"},
        )
        self.assertEqual(
            {row["collection"]: sum(r["collection"] == row["collection"] for r in rows)
             for row in rows},
            {"Bookmarks": 202, "Likes": 177, "Posts": 2, "Albums": 10},
        )
        self.assertEqual(len({row["source_path"] for row in rows}), 391)
        self.assertTrue(all((ROOT / row["source_path"]).is_file() for row in rows))
        self.assertTrue(all(row["user_fact_boundary"] for row in rows))
        self.assertTrue(
            {row["evidence_level"] for row in rows}
            <= {"D0", "E1", "E2", "E3"}
        )
        boundary = (
            DISTILLATION / "rednote-bookmarks" / "content-boundary-review.md"
        ).read_text(encoding="utf-8")
        self.assertIn("Likes", boundary)
        self.assertIn("Posts", boundary)
        self.assertIn("用户事实", boundary)

    def test_skill_consistency_sidecar_matches_canonical_baseline(self) -> None:
        rows = read_tsv(DISTILLATION / "skill-consistency-review.tsv")
        self.assertEqual(len(rows), 56)
        self.assertEqual(len({row["skill"] for row in rows}), 56)
        self.assertTrue(all(row["package_files"] == "4/4" for row in rows))
        self.assertTrue(all(row["source_missing"] == "0" for row in rows))
        self.assertTrue(all(row["ria"] == "pass" for row in rows))
        self.assertTrue(all(row["test_counts"] == "3/2/1" for row in rows))
        self.assertTrue(all(row["test_duplicate_ids"] == "0" for row in rows))
        self.assertTrue(all(row["test_results_static"] == "6/6" for row in rows))
        self.assertTrue(all(row["test_results_live_limit"] == "present" for row in rows))
        self.assertTrue(all(row["client_hit_rate"] == "not_measured" for row in rows))
        self.assertTrue(all(row["target_runtime"] == "not_measured" for row in rows))

    def test_unlinked_topic_cards_have_existing_multi_source_evidence(self) -> None:
        required = {
            "domain",
            "topic_slug",
            "title",
            "source_files",
            "v1_cross_source",
            "v2_prediction",
            "v3_unique",
            "relation",
            "classification",
            "disposition",
            "open_question",
        }
        for domain in ("embedded-core", "linux-vision", "rtos-project"):
            path = DISTILLATION / domain / "unlinked-topic-cards.tsv"
            rows = read_tsv(path)
            self.assertGreaterEqual(len(rows), 1)
            self.assertLessEqual(len(rows), 8)
            self.assertTrue(required <= set(rows[0]))
            self.assertEqual({row["domain"] for row in rows}, {domain})
            self.assertEqual(
                len({row["topic_slug"] for row in rows}), len(rows)
            )
            for row in rows:
                sources = row["source_files"].split("|")
                self.assertGreaterEqual(len(sources), 2)
                self.assertTrue(all((ROOT / source).is_file() for source in sources))
                self.assertTrue(all(row[field] for field in required - {"domain"}))
                self.assertIn(
                    row["classification"],
                    {"candidate-review", "term-or-reference", "case-review"},
                )
            markdown = path.with_suffix(".md").read_text(encoding="utf-8")
            self.assertTrue(
                "不是新 Skill" in markdown
                or "不是新的规范 Skill" in markdown
                or "不是新增 Skill" in markdown
            )
            self.assertIn("V1", markdown)
            self.assertIn("V2", markdown)
            self.assertIn("V3", markdown)

    def test_unlinked_topic_triage_keeps_open_queues_and_fact_boundaries(self) -> None:
        embedded = (
            DISTILLATION / "embedded-core" / "candidate-triage.md"
        ).read_text(encoding="utf-8")
        vision = (
            DISTILLATION / "linux-vision" / "coverage-improvement-notes.md"
        ).read_text(encoding="utf-8")
        rtos = (
            DISTILLATION / "rtos-project" / "candidate-triage.md"
        ).read_text(encoding="utf-8")
        self.assertIn("keep-for-review", embedded)
        self.assertIn("不代表任何候选已经通过三重验证", embedded)
        self.assertIn("不能声称", vision)
        self.assertIn("不修改源码", vision)
        self.assertIn("merge-into-existing", rtos)
        self.assertTrue(
            "不改变 RTOS 规范 Skill 数量" in rtos
            or "没有改变 RTOS 规范 Skill 数量" in rtos
        )


if __name__ == "__main__":
    unittest.main()
