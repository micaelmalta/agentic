"""Scenario tests for the architect skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "architect" / "SKILL.md"
TEMPLATE_PATH = SKILLS_DIR / "architect" / "tech_proposal_template.md"


class TestArchitectSkill:
    """Validate tech spec template and skill structure."""

    def test_tech_proposal_template_exists(self):
        assert TEMPLATE_PATH.exists()

    def test_template_has_metadata_section(self):
        content = TEMPLATE_PATH.read_text(encoding="utf-8")
        assert re.search(r"metadata", content, re.IGNORECASE)

    def test_template_has_architecture_section(self):
        content = TEMPLATE_PATH.read_text(encoding="utf-8")
        assert re.search(r"architecture", content, re.IGNORECASE)

    def test_template_has_api_changes(self):
        content = TEMPLATE_PATH.read_text(encoding="utf-8")
        assert re.search(r"api\s+changes", content, re.IGNORECASE)

    def test_template_has_data_models(self):
        content = TEMPLATE_PATH.read_text(encoding="utf-8")
        assert re.search(r"data\s+model", content, re.IGNORECASE)

    def test_template_has_implementation_plan(self):
        content = TEMPLATE_PATH.read_text(encoding="utf-8")
        assert re.search(r"implementation\s+plan", content, re.IGNORECASE)

    def test_skill_references_template(self):
        body = read_skill_body(SKILL_PATH)
        assert "tech_proposal_template" in body
