"""Scenario tests for the security-reviewer skill."""

import re

import pytest

from helpers import FIXTURES_DIR, SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "security-reviewer" / "SKILL.md"


class TestSecurityReviewerSkill:
    """Validate security review skill covers OWASP categories and severity."""

    def test_skill_defines_4_severity_levels(self):
        body = read_skill_body(SKILL_PATH)
        for level in ["Critical", "High", "Medium", "Low"]:
            assert re.search(rf"\b{level}\b", body, re.IGNORECASE), (
                f"Missing severity level: {level}"
            )

    def test_skill_covers_owasp_categories(self):
        body = read_skill_body(SKILL_PATH)
        categories = ["injection", "xss", "auth"]
        found = sum(1 for c in categories if re.search(c, body, re.IGNORECASE))
        assert found >= 2, f"Only {found}/3 OWASP categories found"

    def test_skill_has_search_patterns(self):
        """Skill should contain grep-able search patterns for vulnerability classes."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"grep|search|pattern|regex", body, re.IGNORECASE)

    def test_skill_data_leak_detection(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"data\s*leak|sensitive\s*data|multi.tenant|IDOR", body, re.IGNORECASE)

    def test_fixture_has_sql_injection(self):
        """Verify the py-project fixture contains SQL injection for testing."""
        db_file = FIXTURES_DIR / "py-project" / "src" / "database.py"
        content = db_file.read_text(encoding="utf-8")
        assert 'f"SELECT' in content or "f'SELECT" in content, (
            "py-project/src/database.py should contain SQL injection via f-string"
        )

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
