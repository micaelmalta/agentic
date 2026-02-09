"""Scenario tests for the developer skill (TDD)."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "developer" / "SKILL.md"


class TestDeveloperTDD:
    """Validate TDD protocol requirements in the developer skill."""

    def test_tdd_test_before_code_convention(self):
        """Skill should mandate writing tests before implementation."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"test.*before|test.*first|write.*test.*before", body, re.IGNORECASE)

    def test_red_phase_documented(self):
        """Red phase (failing test) should be documented."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"red", body, re.IGNORECASE)

    def test_green_phase_documented(self):
        """Green phase (passing test) should be documented."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"green", body, re.IGNORECASE)

    def test_refactor_phase_documented(self):
        """Refactor phase should be documented."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"refactor", body, re.IGNORECASE)

    def test_bug_fix_starts_with_reproduction_test(self):
        """Bug fixes should start with a failing reproduction test."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"reproduc|failing.*test.*before|test.*reproduc", body, re.IGNORECASE)

    def test_has_quality_gates(self):
        """Skill should define code quality gates."""
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body, "Missing quality gate checkboxes"
