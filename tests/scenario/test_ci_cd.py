"""Scenario tests for the ci-cd skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "ci-cd" / "SKILL.md"


class TestCICDSkill:
    """Validate CI/CD skill covers pipeline stages and security."""

    def test_skill_references_github_actions(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"github\s*action", body, re.IGNORECASE)

    def test_skill_covers_build_test_lint_deploy(self):
        body = read_skill_body(SKILL_PATH)
        for stage in ["build", "test", "lint", "deploy"]:
            assert re.search(rf"\b{stage}\b", body, re.IGNORECASE), (
                f"Missing pipeline stage: {stage}"
            )

    def test_skill_references_secrets_management(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"secret", body, re.IGNORECASE)

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
