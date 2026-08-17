#!/usr/bin/env python3
"""Regression tests for conservative whole-vault coverage accounting."""

import unittest

from coverage_review import (
    stale_register_entries,
    summarize_rows,
    validate_review_payload,
)


class CoverageReviewTests(unittest.TestCase):
    def test_evidence_does_not_count_as_knowledge(self):
        rows = [
            {"path": "a.md", "domain": "demo", "class": "knowledge-document", "status": "domain-referenced"},
            {"path": "b.png", "domain": "demo", "class": "attachment-evidence", "status": "evidence-layer"},
            {"path": "c.md", "domain": "demo", "class": "knowledge-document", "status": "indexed-only"},
        ]
        payload = summarize_rows(rows, review_file_map={"demo": ["demo/FULL_COVERAGE_REVIEW.md"]})
        domain = payload["domains"]["demo"]
        self.assertEqual(domain["files"], 3)
        self.assertEqual(domain["knowledge_documents"], 2)
        self.assertEqual(domain["knowledge_linked"], 1)
        self.assertEqual(domain["knowledge_unlinked"], 1)
        self.assertEqual(domain["evidence_layer"], 1)
        self.assertTrue(domain["dedicated_review"])

    def test_duplicate_or_missing_paths_fail_contract(self):
        rows = [
            {"path": "a.md", "domain": "demo", "class": "knowledge-document", "status": "domain-referenced"},
            {"path": "a.md", "domain": "demo", "class": "knowledge-document", "status": "domain-referenced"},
        ]
        payload = summarize_rows(rows)
        self.assertTrue(validate_review_payload(payload, inventory_count=2))
        self.assertFalse(payload["contract"]["one_row_per_source_path"])

    def test_valid_accounting_contract(self):
        rows = [
            {"path": "a.md", "domain": "demo", "class": "knowledge-document", "status": "skill-evidence"},
            {"path": "b.md", "domain": "demo", "class": "knowledge-document", "status": "domain-referenced"},
        ]
        payload = summarize_rows(rows)
        self.assertEqual(validate_review_payload(payload, inventory_count=2), [])

    def test_stale_register_is_reported_without_becoming_current_source(self):
        register = """# old

| x | `archive/old/topic.md` |
| x | `archive/current/topic.md` |
"""
        from coverage_review import DISTILLATION

        target = DISTILLATION / "_test-stale-register" / "source-register.md"
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            target.write_text(register, encoding="utf-8")
            entries = [
                item
                for item in stale_register_entries({"archive/current/topic.md"})
                if item["register"] == "_test-stale-register/source-register.md"
            ]
            self.assertEqual(len(entries), 1)
            self.assertEqual(entries[0]["path"], "archive/old/topic.md")
        finally:
            target.unlink(missing_ok=True)
            target.parent.rmdir()


if __name__ == "__main__":
    unittest.main()
