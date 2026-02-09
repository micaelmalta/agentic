"""Scenario tests for the setup skill."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "setup" / "SKILL.md"
SETUP_SCRIPT = SKILLS_DIR / "setup" / "setup_mcp.js"


class TestSetupSkill:
    """Validate MCP setup skill and script existence."""

    def test_setup_script_exists(self):
        assert SETUP_SCRIPT.exists(), "setup_mcp.js should exist"

    def test_skill_supports_atlassian_datadog_playwright(self):
        body = read_skill_body(SKILL_PATH)
        for service in ["Atlassian", "Datadog", "Playwright"]:
            assert re.search(service, body, re.IGNORECASE), (
                f"Setup skill should mention {service}"
            )

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
