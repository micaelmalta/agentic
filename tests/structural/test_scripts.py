"""Structural tests: Validate existing Python/bash scripts work correctly."""

import json
import os
import subprocess
import tempfile
from pathlib import Path

import pytest

from helpers import FIXTURES_DIR, ROOT_DIR, SKILLS_DIR

RLM_SCRIPT = SKILLS_DIR / "rlm" / "rlm.py"
VALIDATE_PHASE_SCRIPT = SKILLS_DIR / "workflow" / "scripts" / "validate_phase.py"
INIT_SKILL_SCRIPT = SKILLS_DIR / "skill-creator" / "scripts" / "init_skill.py"
QUICK_VALIDATE_SCRIPT = SKILLS_DIR / "skill-creator" / "scripts" / "quick_validate.py"


# ---------------------------------------------------------------------------
# RLM script tests
# ---------------------------------------------------------------------------


class TestRLMScript:
    """Test the rlm.py scan/peek/chunk commands."""

    def test_scan_loads_files(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(py_project)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "Loaded" in result.stdout

    def test_peek_finds_matches(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "peek", "def ", "--path", str(py_project)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert len(data) > 0

    def test_chunk_returns_chunks(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "chunk", "--path", str(py_project)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert len(data) > 0
        assert "source" in data[0]
        assert "chunk_id" in data[0]
        assert "content" in data[0]

    def test_scan_skips_large_files(self, tmp_path):
        """Create a >1MB file and verify RLM skips it."""
        big_file = tmp_path / "big.txt"
        big_file.write_text("x" * (1_048_577))  # Just over 1MB
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(tmp_path)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "Skipping" in result.stdout or "Loaded 0" in result.stdout

    def test_scan_skips_non_utf8(self, tmp_path):
        """Create a binary file and verify RLM skips it."""
        bin_file = tmp_path / "binary.dat"
        bin_file.write_bytes(b"\x80\x81\x82\x83" * 100)
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(tmp_path)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        # Either skipped explicitly or loaded 0
        assert "Skipping" in result.stdout or "Loaded 0" in result.stdout

    def test_scan_excludes_dotfiles(self, tmp_path):
        """Verify .git directories are excluded."""
        git_dir = tmp_path / ".git"
        git_dir.mkdir()
        (git_dir / "config").write_text("gitconfig")
        (tmp_path / "real.py").write_text("print('hello')")
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(tmp_path)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "Loaded 1" in result.stdout

    def test_peek_returns_json(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "peek", "def ", "--path", str(py_project)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)

    def test_no_command_shows_help(self):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 1


# ---------------------------------------------------------------------------
# validate_phase.py tests
# ---------------------------------------------------------------------------


class TestValidatePhaseScript:
    """Test the validate_phase.py script."""

    def test_help_exits_zero(self):
        result = subprocess.run(
            ["python3", str(VALIDATE_PHASE_SCRIPT), "--help"],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "phase" in result.stdout.lower()

    def test_non_interactive_phase_5_exits_nonzero(self):
        result = subprocess.run(
            ["python3", str(VALIDATE_PHASE_SCRIPT), "--phase", "5", "--non-interactive"],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 1
        assert "non-interactive" in result.stdout.lower() or "Non-interactive" in result.stdout


# ---------------------------------------------------------------------------
# init_skill.py tests
# ---------------------------------------------------------------------------


class TestInitSkillScript:
    """Test the init_skill.py skill initializer."""

    def test_creates_skill(self, tmp_path):
        result = subprocess.run(
            ["python3", str(INIT_SKILL_SCRIPT), "test-skill", "--path", str(tmp_path)],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        skill_dir = tmp_path / "test-skill"
        assert skill_dir.exists()
        assert (skill_dir / "SKILL.md").exists()

    def test_created_skill_has_valid_frontmatter(self, tmp_path):
        subprocess.run(
            ["python3", str(INIT_SKILL_SCRIPT), "valid-skill", "--path", str(tmp_path)],
            capture_output=True,
            text=True,
        )
        skill_md = tmp_path / "valid-skill" / "SKILL.md"
        content = skill_md.read_text(encoding="utf-8")
        assert content.startswith("---")
        # Check name field exists
        assert "name: valid-skill" in content

    def test_rejects_invalid_names(self):
        """Skill names with special chars should be rejected."""
        result = subprocess.run(
            ["python3", str(INIT_SKILL_SCRIPT), "Bad_Name!", "--path", "/tmp"],
            capture_output=True,
            text=True,
        )
        assert result.returncode != 0

    def test_creates_resource_directories(self, tmp_path):
        subprocess.run(
            ["python3", str(INIT_SKILL_SCRIPT), "res-skill", "--path", str(tmp_path)],
            capture_output=True,
            text=True,
        )
        skill_dir = tmp_path / "res-skill"
        assert (skill_dir / "scripts").is_dir()
        assert (skill_dir / "references").is_dir()
        assert (skill_dir / "assets").is_dir()


# ---------------------------------------------------------------------------
# quick_validate.py tests
# ---------------------------------------------------------------------------


class TestQuickValidateScript:
    """Test the quick_validate.py skill validator."""

    def test_passes_valid_skill(self):
        """Run quick_validate on an existing, known-good skill."""
        result = subprocess.run(
            ["python3", str(QUICK_VALIDATE_SCRIPT), str(SKILLS_DIR / "para")],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0
        assert "valid" in result.stdout.lower() or "Valid" in result.stdout

    def test_fails_on_empty_directory(self, tmp_path):
        result = subprocess.run(
            ["python3", str(QUICK_VALIDATE_SCRIPT), str(tmp_path)],
            capture_output=True,
            text=True,
        )
        assert result.returncode != 0

    def test_fails_on_missing_frontmatter(self, tmp_path):
        """A SKILL.md without frontmatter should fail validation."""
        skill_dir = tmp_path / "bad-skill"
        skill_dir.mkdir()
        (skill_dir / "SKILL.md").write_text("# No frontmatter here\n")
        result = subprocess.run(
            ["python3", str(QUICK_VALIDATE_SCRIPT), str(skill_dir)],
            capture_output=True,
            text=True,
        )
        assert result.returncode != 0
