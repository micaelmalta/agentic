"""Structural tests: YAML frontmatter format for all skills."""

import pytest
import yaml

from helpers import ALL_SKILLS, SKILLS_DIR, parse_skill_frontmatter


@pytest.fixture(params=ALL_SKILLS)
def skill_name(request):
    return request.param


class TestSkillFormat:
    """Validate that every skill has a well-formed SKILL.md with YAML frontmatter."""

    def test_skill_md_exists(self, skill_name):
        path = SKILLS_DIR / skill_name / "SKILL.md"
        assert path.exists(), f"SKILL.md missing for skill '{skill_name}'"

    def test_has_yaml_frontmatter(self, skill_name):
        path = SKILLS_DIR / skill_name / "SKILL.md"
        content = path.read_text(encoding="utf-8")
        assert content.startswith("---"), (
            f"SKILL.md for '{skill_name}' does not start with YAML frontmatter delimiter '---'"
        )
        # Ensure the closing delimiter exists
        second_delim = content.find("---", 3)
        assert second_delim > 3, (
            f"SKILL.md for '{skill_name}' missing closing '---' for frontmatter"
        )

    def test_frontmatter_is_valid_yaml(self, skill_name):
        fm = parse_skill_frontmatter(SKILLS_DIR / skill_name / "SKILL.md")
        assert isinstance(fm, dict) and len(fm) > 0, (
            f"Failed to parse YAML frontmatter for '{skill_name}'"
        )

    def test_frontmatter_has_name(self, skill_name):
        fm = parse_skill_frontmatter(SKILLS_DIR / skill_name / "SKILL.md")
        assert "name" in fm, f"Missing 'name' field in frontmatter for '{skill_name}'"
        assert isinstance(fm["name"], str), f"'name' must be a string for '{skill_name}'"

    def test_frontmatter_has_description(self, skill_name):
        fm = parse_skill_frontmatter(SKILLS_DIR / skill_name / "SKILL.md")
        assert "description" in fm, f"Missing 'description' in frontmatter for '{skill_name}'"
        desc = fm["description"]
        assert isinstance(desc, str), f"'description' must be a string for '{skill_name}'"
        assert len(desc) > 20, (
            f"'description' for '{skill_name}' is too short ({len(desc)} chars, expected >20)"
        )

    def test_frontmatter_name_matches_directory(self, skill_name):
        fm = parse_skill_frontmatter(SKILLS_DIR / skill_name / "SKILL.md")
        assert fm.get("name") == skill_name, (
            f"Frontmatter name '{fm.get('name')}' does not match directory '{skill_name}'"
        )
