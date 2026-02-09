"""Structural tests: Required sections in all skill files."""

import re

import pytest

from helpers import ALL_SKILLS, SKILLS_DIR, read_skill_body


@pytest.fixture(params=ALL_SKILLS)
def skill_name(request):
    return request.param


class TestSkillSections:
    """Validate that every SKILL.md has the required structural sections."""

    def test_has_protocol_or_workflow_section(self, skill_name):
        body = read_skill_body(SKILLS_DIR / skill_name / "SKILL.md")
        # Accept various heading patterns that indicate a protocol
        patterns = [
            r"##\s+Protocol",
            r"##\s+Phase\s",
            r"##\s+The\s+\w+\s+(Workflow|Loop)",
            r"##\s+Process",
            r"##\s+/\w+\s+Flow",
            r"##\s+Skill\s+Creation\s+Process",
            r"##\s+Protocol\s+by\s+Task",
            r"##\s+Core\s+Principles",
        ]
        combined = "|".join(patterns)
        assert re.search(combined, body, re.IGNORECASE), (
            f"'{skill_name}' SKILL.md has no Protocol/Workflow/Process section"
        )

    def test_has_checklist(self, skill_name):
        body = read_skill_body(SKILLS_DIR / skill_name / "SKILL.md")
        # Most skills use "- [ ]" checkboxes; para uses bullet-list guidance instead
        has_checkboxes = "- [ ]" in body
        has_checklist_heading = bool(re.search(r"##.*checklist|##.*best\s+practice|##.*tips", body, re.IGNORECASE))
        assert has_checkboxes or has_checklist_heading, (
            f"'{skill_name}' SKILL.md has no checklist items or checklist section"
        )

    def test_has_cross_skill_integration(self, skill_name):
        body = read_skill_body(SKILLS_DIR / skill_name / "SKILL.md")
        # Accept "Cross-Skill Integration", "Related Skills", or similar headings
        assert re.search(
            r"cross.skill\s+integration|related\s+skills|when\s+to\s+invoke\s+related",
            body,
            re.IGNORECASE,
        ), (
            f"'{skill_name}' SKILL.md missing 'Cross-Skill Integration' or 'Related Skills' heading"
        )
