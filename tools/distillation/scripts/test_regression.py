#!/usr/bin/env python3
"""Regression tests for the cross-report contract checker."""

import unittest

from run_regression import report_contract_errors


def valid_report() -> dict:
    return {
        "record_count": 10,
        "skill_audit": {"skill_count": 2, "errors": []},
        "pressure_matrix": {"row_count": 2, "errors": []},
        "skill_indexes": {"errors": []},
        "pipeline_state_counts": {"errors": []},
        "mixed_intent_matrix": {"errors": []},
        "skill_trigger_index": {"skill_count": 2, "relation_errors": []},
        "client_skill_audit": {"active_clients": ["zcode"], "row_count": 2},
        "provenance_audit": {"report_count": 3, "passed": True, "errors": []},
        "json_artifact_audit": {"errors": []},
        "link_audit": {"broken": 0},
        "inventory_reports": {"summary_path": "summary.md", "artifact_path": "artifacts.md"},
        "coverage_review": {
            "record_count": 10,
            "domains": {
                "example-domain": {
                    "knowledge_documents": 1,
                    "dedicated_review": True,
                }
            },
            "errors": [],
        },
        "source_freshness": {"pending_count": 0},
        "workbench": {"invalid": 0, "source_missing": 0, "title_missing": 0},
        "clients": {"zcode": {"missing": 0}},
    }


class ReportContractTests(unittest.TestCase):
    def test_valid_report_has_no_errors(self):
        self.assertEqual(report_contract_errors(valid_report()), [])

    def test_count_drift_is_an_error(self):
        report = valid_report()
        report["pressure_matrix"]["row_count"] = 1
        errors = report_contract_errors(report)
        self.assertTrue(any("row count" in error for error in errors))

    def test_missing_client_and_broken_link_are_errors(self):
        report = valid_report()
        del report["clients"]["zcode"]
        report["link_audit"]["broken"] = 1
        errors = report_contract_errors(report)
        self.assertTrue(any("zcode" in error for error in errors))
        self.assertTrue(any("broken" in error for error in errors))

    def test_client_differences_are_allowed_but_missing_is_not(self):
        report = valid_report()
        report["clients"]["zcode"] = {"same": 0, "different": 2, "missing": 0}
        self.assertEqual(report_contract_errors(report), [])
        report["clients"]["zcode"]["missing"] = 1
        self.assertTrue(any("missing Skill" in error for error in report_contract_errors(report)))

    def test_trigger_index_count_drift_is_an_error(self):
        report = valid_report()
        report["skill_trigger_index"]["skill_count"] = 1
        self.assertTrue(any("trigger-index Skill count" in error for error in report_contract_errors(report)))

    def test_pending_source_review_is_an_error(self):
        report = valid_report()
        report["source_freshness"]["pending_count"] = 2
        self.assertTrue(any("pending review" in error for error in report_contract_errors(report)))

    def test_coverage_review_count_drift_is_an_error(self):
        report = valid_report()
        report["record_count"] = 3
        report["coverage_review"] = {
            "record_count": 2,
            "errors": [],
        }
        errors = report_contract_errors(report)
        self.assertTrue(any("coverage-review record count" in error for error in errors))

    def test_knowledge_domain_without_review_is_an_error(self):
        report = valid_report()
        report["coverage_review"]["domains"]["example-domain"]["dedicated_review"] = False
        errors = report_contract_errors(report)
        self.assertTrue(any("no dedicated full-coverage review" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
