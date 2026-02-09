"""Scenario tests for the PARA skill."""

import re
from pathlib import Path

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "para" / "SKILL.md"


class TestParaPlanConventions:
    """Verify plan file naming and structure conventions documented in the skill."""

    def test_plan_file_naming_convention(self):
        """Skill should document YYYY-MM-DD-<task>.md naming pattern."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"YYYY-MM-DD", body), "Plan naming convention not documented"

    def test_plan_required_sections(self):
        """Skill should mention key plan sections."""
        body = read_skill_body(SKILL_PATH)
        for section in ["Objective", "Approach"]:
            assert re.search(section, body, re.IGNORECASE), (
                f"Plan section '{section}' not mentioned in PARA skill"
            )

    def test_summary_file_location(self):
        """Skill should reference context/summaries/ directory."""
        body = read_skill_body(SKILL_PATH)
        assert "summaries" in body

    def test_archive_moves_files(self):
        """Skill should describe archiving to context/archives/."""
        body = read_skill_body(SKILL_PATH)
        assert "archives" in body

    def test_init_creates_para_structure(self):
        """Skill should describe /init creating directory structure."""
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"/init|init", body, re.IGNORECASE)
        assert "context" in body

    def test_context_md_mentioned(self):
        """Skill should reference context.md."""
        body = read_skill_body(SKILL_PATH)
        assert "context.md" in body

    def test_triggers_include_all_commands(self):
        from helpers import parse_skill_frontmatter
        fm = parse_skill_frontmatter(SKILL_PATH)
        triggers = fm.get("triggers", [])
        trigger_text = " ".join(str(t) for t in triggers)
        for cmd in ["/plan", "/execute", "/summarize", "/archive"]:
            assert cmd in trigger_text, f"Missing trigger '{cmd}'"
