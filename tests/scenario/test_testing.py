"""Scenario tests for the testing skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "testing" / "SKILL.md"


class TestTestingSkill:
    """Validate testing skill covers required patterns and tools."""

    def test_skill_references_test_structure_pattern(self):
        """Skill should reference a test structure pattern (AAA, Given-When-Then, or behavior-focused)."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(
            r"arrange.*act.*assert|AAA|given.*when.*then|behavior|unit.*integration.*e2e",
            body,
            re.IGNORECASE,
        )

    def test_skill_references_playwright(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"playwright", body, re.IGNORECASE)

    def test_skill_references_a11y(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"a11y|accessibility", body, re.IGNORECASE)

    def test_skill_references_i18n(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"i18n|internationalization", body, re.IGNORECASE)

    def test_skill_references_coverage(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"coverage", body, re.IGNORECASE)

    def test_playwright_is_mandatory_for_ui(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"mandatory.*playwright|playwright.*mandatory", body, re.IGNORECASE)
