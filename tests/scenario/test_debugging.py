"""Scenario tests for the debugging skill."""

import re

import pytest

from helpers import FIXTURES_DIR, SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "debugging" / "SKILL.md"


class TestDebuggingSkill:
    """Validate debugging skill TDD approach and reproduction requirement."""

    def test_skill_mandates_reproduction_test(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(
            r"reproduc.*test|failing.*test.*before|mandatory.*fail", body, re.IGNORECASE
        )

    def test_skill_follows_tdd(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"TDD|test.driven", body, re.IGNORECASE)

    def test_buggy_fixture_has_known_bug(self):
        """Verify the buggy-project fixture has the off-by-one bug."""
        calc = FIXTURES_DIR / "buggy-project" / "src" / "calculator.js"
        content = calc.read_text(encoding="utf-8")
        # The bug is using > 100 instead of >= 100
        assert "pct > 100" in content or "pct> 100" in content, (
            "buggy-project calculator.js should have off-by-one bug (> instead of >=)"
        )

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
