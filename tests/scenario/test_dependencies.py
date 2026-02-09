"""Scenario tests for the dependencies skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "dependencies" / "SKILL.md"


class TestDependenciesSkill:
    """Validate dependency management skill requirements."""

    def test_skill_requires_manifest_and_lockfile_together(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"lockfile|lock\s*file|package-lock|yarn\.lock", body, re.IGNORECASE)

    def test_skill_references_supply_chain_audit(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"supply\s*chain|audit|security", body, re.IGNORECASE)

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
