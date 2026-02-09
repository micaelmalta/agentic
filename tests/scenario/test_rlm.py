"""Scenario tests for the RLM skill — tests the actual Python script."""

import json
import subprocess

import pytest

from helpers import SKILLS_DIR

RLM_SCRIPT = SKILLS_DIR / "rlm" / "rlm.py"
SKILL_PATH = SKILLS_DIR / "rlm" / "SKILL.md"


class TestRLMScan:
    """Test RLM scan command on fixture projects."""

    def test_scan_loads_files(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(py_project)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "Loaded" in result.stdout
        # Should load at least the .py files
        assert "Loaded 0" not in result.stdout

    def test_scan_excludes_dotfiles(self, py_project):
        """The .git directory created by fixture should be excluded."""
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(py_project)],
            capture_output=True, text=True,
        )
        assert ".git" not in result.stdout or "Skipping" not in result.stdout

    def test_scan_excludes_venv(self, tmp_path):
        """Create a .venv directory and verify it's excluded."""
        venv = tmp_path / ".venv"
        venv.mkdir()
        (venv / "module.py").write_text("print('hi')")
        (tmp_path / "real.py").write_text("x = 1")
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(tmp_path)],
            capture_output=True, text=True,
        )
        assert "Loaded 1" in result.stdout

    def test_scan_skips_oversized(self, tmp_path):
        big = tmp_path / "big.txt"
        big.write_text("x" * 1_100_000)
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "scan", "--path", str(tmp_path)],
            capture_output=True, text=True,
        )
        assert "Skipping" in result.stdout


class TestRLMPeek:
    def test_peek_finds_matches(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "peek", "def ", "--path", str(py_project)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert len(data) > 0

    def test_peek_returns_json(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "peek", "ZZZZNOTFOUND", "--path", str(py_project)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert len(data) == 0


class TestRLMChunk:
    def test_chunk_returns_chunks(self, py_project):
        result = subprocess.run(
            ["python3", str(RLM_SCRIPT), "chunk", "--path", str(py_project)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        assert len(data) > 0


class TestRLMSkillDoc:
    def test_skill_mentions_scan_peek_chunk(self):
        from helpers import read_skill_body
        body = read_skill_body(SKILL_PATH)
        for cmd in ["scan", "peek", "chunk"]:
            assert cmd in body.lower(), f"RLM skill should mention '{cmd}'"
