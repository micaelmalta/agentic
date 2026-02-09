"""Scenario tests for the git-commits skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "git-commits" / "SKILL.md"


class TestGitCommitsSkill:
    """Validate conventional commit format and versioning references."""

    def test_conventional_commit_types(self):
        body = read_skill_body(SKILL_PATH)
        for commit_type in ["feat", "fix", "docs"]:
            assert re.search(rf"\b{commit_type}\b", body), (
                f"Missing conventional commit type: {commit_type}"
            )

    def test_skill_references_semver(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"semver|semantic\s+version", body, re.IGNORECASE)

    def test_skill_references_changelog(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"changelog", body, re.IGNORECASE)

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
