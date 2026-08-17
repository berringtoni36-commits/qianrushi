#!/usr/bin/env python3
"""Regression tests for the dependency-free Skill metadata parser."""

import unittest

from audit_vault import (
    json_object_reject_duplicates,
    load_disposition_overrides,
    metadata_list_from_skill,
    path_is_referenced_in_domain_text,
    related_skills_from_skill,
    split_inline_list,
)


class MetadataParserTests(unittest.TestCase):
    def test_tab_separated_disposition_overrides_are_loaded(self):
        overrides = load_disposition_overrides()
        self.assertGreaterEqual(len(overrides), 7)
        self.assertTrue(any(row["pattern"] == "测试.md" for row in overrides))
        self.assertTrue(any(row["pattern"] == "小红书（RedNote）/。。。。。。。/收藏（Bookmarks）/" for row in overrides))

    def test_directory_prefix_is_scope_not_file_level_reference(self):
        path = "projects/demo/notes/topic.md"
        text = "目录：`projects/demo/notes/`"
        self.assertFalse(path_is_referenced_in_domain_text(path, text))
        self.assertTrue(path_is_referenced_in_domain_text(path, text, allow_directory_prefix=True))
        self.assertTrue(path_is_referenced_in_domain_text(path, f"`{path}`"))

    def test_nested_frontmatter_lists_stop_at_next_key(self):
        text = """---
name: example
metadata:
  source_files:
    - projects/example.md
  source_symbols:
    - foo
    - bar
---
"""
        self.assertEqual(metadata_list_from_skill(text, "source_files"), ["projects/example.md"])
        self.assertEqual(metadata_list_from_skill(text, "source_symbols"), ["foo", "bar"])

    def test_body_fallback_stops_at_markdown_heading(self):
        text = """---
name: example
description: example
---

source_symbols:
  - foo
  - bar

## R

- this is an evidence excerpt, not a symbol

## I

- this is interpretation, not a symbol
"""
        self.assertEqual(metadata_list_from_skill(text, "source_symbols"), ["foo", "bar"])

    def test_body_fallback_stops_at_same_level_non_list_line(self):
        text = """---
name: example
---
source_symbols:
  - foo
notes: do not collect the following list
  - unrelated
"""
        self.assertEqual(metadata_list_from_skill(text, "source_symbols"), ["foo"])

    def test_frontmatter_wins_over_repeated_body_evidence(self):
        text = """---
name: example
metadata:
  source_symbols:
    - canonical_symbol
---
source_symbols:
  - repeated_symbol
"""
        self.assertEqual(metadata_list_from_skill(text, "source_symbols"), ["canonical_symbol"])

    def test_body_code_fence_is_not_metadata(self):
        text = """---
name: example
---
```yaml
source_symbols:
  - example_inside_code
```
source_symbols:
  - canonical_body_symbol
"""
        self.assertEqual(metadata_list_from_skill(text, "source_symbols"), ["canonical_body_symbol"])

    def test_inline_list_keeps_parenthesized_commas(self):
        self.assertEqual(
            split_inline_list("[TRACEPOINT_PROBE(kmem, mm_page_alloc), foo, 'bar']"),
            ["TRACEPOINT_PROBE(kmem, mm_page_alloc)", "foo", "bar"],
        )

    def test_json_object_rejects_duplicate_keys(self):
        with self.assertRaisesRegex(ValueError, r"duplicate JSON key\(s\): version"):
            import json

            json.loads(
                '{"version":"0.1.0","version":"0.2.0"}',
                object_pairs_hook=json_object_reject_duplicates,
            )

    def test_related_skills_partition_canonical_and_external(self):
        from pathlib import Path

        skill = (
            Path(__file__).resolve().parents[1]
            / "skills/vault-source-boundary-and-derived-artifact-audit/SKILL.md"
        )
        canonical, external, status = related_skills_from_skill(
            skill,
            {
                "vault-source-boundary-and-derived-artifact-audit",
                "interactive-lab-fact-boundary-audit",
            },
        )
        self.assertEqual(canonical, ["interactive-lab-fact-boundary-audit"])
        self.assertEqual(external, ["json-canvas", "cangjie-skill"])
        self.assertEqual(status["interactive-lab-fact-boundary-audit"], "canonical")
        self.assertEqual(status["json-canvas"], "external")
        self.assertEqual(status["cangjie-skill"], "external")


if __name__ == "__main__":
    unittest.main()
