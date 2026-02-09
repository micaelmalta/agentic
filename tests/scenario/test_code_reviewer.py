"""Scenario tests for the code-reviewer skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "code-reviewer" / "SKILL.md"


class TestCodeReviewerSkill:
    """Validate code review skill structure and severity system."""

    def test_skill_defines_severity_tiers(self):
        body = read_skill_body(SKILL_PATH)
        for tier in ["Critical", "Suggestion", "Nit"]:
            assert re.search(tier, body, re.IGNORECASE), f"Missing severity tier: {tier}"

    def test_skill_output_format_has_gate_status(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"gate\s*status", body, re.IGNORECASE)

    def test_skill_blocks_on_missing_tests(self):
        """Code review should enforce that tests exist."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"test.*must|must.*test|no.*test.*block", body, re.IGNORECASE)

    def test_review_dimensions_present(self):
        """Skill should cover multiple review dimensions."""
        body = read_skill_body(SKILL_PATH)
        dimensions = ["correctness", "readability", "maintainability"]
        found = sum(1 for d in dimensions if re.search(d, body, re.IGNORECASE))
        assert found >= 2, f"Only {found}/3 core dimensions found"

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
