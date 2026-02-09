"""Scenario tests for the documentation skill."""

import re

import pytest

from helpers import FIXTURES_DIR, SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "documentation" / "SKILL.md"


class TestDocumentationSkill:
    """Validate documentation skill covers all doc types."""

    def test_skill_covers_readme_api_adr_inline_runbook(self):
        body = read_skill_body(SKILL_PATH)
        for doc_type in ["README", "API", "ADR", "runbook"]:
            assert re.search(doc_type, body, re.IGNORECASE), (
                f"Missing documentation type: {doc_type}"
            )

    def test_skill_adr_follows_standard_format(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"ADR", body)
        # ADRs should have Status, Context, Decision
        adr_fields = ["Status", "Context", "Decision"]
        found = sum(1 for f in adr_fields if re.search(f, body, re.IGNORECASE))
        assert found >= 2, f"Only {found}/3 ADR fields found"

    def test_undocumented_fixture_has_no_readme(self):
        """Verify undocumented-project has no README."""
        readme = FIXTURES_DIR / "undocumented-project" / "README.md"
        assert not readme.exists(), "undocumented-project should not have a README"

    def test_has_checklist(self):
        body = read_skill_body(SKILL_PATH)
        assert "- [ ]" in body
