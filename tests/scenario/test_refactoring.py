"""Scenario tests for the refactoring skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "refactoring" / "SKILL.md"


class TestRefactoringSkill:
    """Validate refactoring skill safety requirements."""

    def test_skill_requires_tests_before_refactor(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"test.*before|safety\s*net|existing\s*test", body, re.IGNORECASE)

    def test_skill_requires_behavior_unchanged(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(
            r"behavior.*unchanged|preserv.*behavior|same.*behavior|behavior\s+stays\s+the\s+same|no.*behavior\s+change",
            body,
            re.IGNORECASE,
        )

    def test_skill_incremental_steps(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"incremental|one.*at.*a.*time|small.*step", body, re.IGNORECASE)

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
