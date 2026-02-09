"""Scenario tests for the performance skill."""

import re

import pytest

from helpers import FIXTURES_DIR, SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "performance" / "SKILL.md"


class TestPerformanceSkill:
    """Validate performance skill profiling and measurement requirements."""

    def test_skill_requires_measurement_before_optimization(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"measure|baseline|before.*optim|benchmark", body, re.IGNORECASE)

    def test_skill_references_profiling(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"profil", body, re.IGNORECASE)

    def test_perf_fixture_has_bottleneck(self):
        """Verify perf-project has O(n^2) code."""
        slow = FIXTURES_DIR / "perf-project" / "src" / "slow.js"
        content = slow.read_text(encoding="utf-8")
        assert re.search(r"O\(n.*2\)|nested.*loop|n\^2", content, re.IGNORECASE), (
            "perf-project should document O(n^2) bottleneck"
        )

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
