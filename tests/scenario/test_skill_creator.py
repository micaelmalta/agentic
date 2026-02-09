"""Scenario tests for the skill-creator skill — tests actual Python scripts."""

import subprocess

import pytest

from helpers import SKILLS_DIR

INIT_SCRIPT = SKILLS_DIR / "skill-creator" / "scripts" / "init_skill.py"
VALIDATE_SCRIPT = SKILLS_DIR / "skill-creator" / "scripts" / "quick_validate.py"


class TestInitSkill:
    """Test init_skill.py creates valid skill structures."""

    def test_creates_directory_and_file(self, tmp_path):
        result = subprocess.run(
            ["python3", str(INIT_SCRIPT), "my-test-skill", "--path", str(tmp_path)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert (tmp_path / "my-test-skill" / "SKILL.md").exists()

    def test_rejects_invalid_names(self):
        result = subprocess.run(
            ["python3", str(INIT_SCRIPT), "Invalid Name!", "--path", "/tmp"],
            capture_output=True, text=True,
        )
        assert result.returncode != 0

    def test_created_skill_has_yaml_frontmatter(self, tmp_path):
        subprocess.run(
            ["python3", str(INIT_SCRIPT), "fm-test", "--path", str(tmp_path)],
            capture_output=True, text=True,
        )
        content = (tmp_path / "fm-test" / "SKILL.md").read_text(encoding="utf-8")
        assert content.startswith("---")
        assert "name: fm-test" in content


class TestQuickValidate:
    """Test quick_validate.py validation logic."""

    def test_detects_missing_skill_md(self, tmp_path):
        result = subprocess.run(
            ["python3", str(VALIDATE_SCRIPT), str(tmp_path)],
            capture_output=True, text=True,
        )
        assert result.returncode != 0

    def test_passes_existing_skill(self):
        result = subprocess.run(
            ["python3", str(VALIDATE_SCRIPT), str(SKILLS_DIR / "developer")],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
