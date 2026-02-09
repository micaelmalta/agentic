"""Shared fixtures, helpers, and constants for the agentic skills test suite."""

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------

ROOT_DIR = Path(__file__).resolve().parent.parent
SKILLS_DIR = ROOT_DIR / "skills"
AGENTS_DIR = SKILLS_DIR / "agents"
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

# ---------------------------------------------------------------------------
# Skill / Agent inventories
# ---------------------------------------------------------------------------

ALL_SKILLS = sorted([
    d.name for d in SKILLS_DIR.iterdir()
    if d.is_dir() and (d / "SKILL.md").exists()
])

ALL_AGENTS = sorted([
    d.name for d in AGENTS_DIR.iterdir()
    if d.is_dir() and (d / "AGENT.md").exists()
])

# ---------------------------------------------------------------------------
# Frontmatter parsing
# ---------------------------------------------------------------------------


def parse_skill_frontmatter(skill_path: Path) -> dict:
    """Parse YAML frontmatter from a SKILL.md file.

    Returns the parsed dict, or an empty dict on failure.
    """
    content = skill_path.read_text(encoding="utf-8")
    if not content.startswith("---"):
        return {}
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}
    try:
        return yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        return {}


def read_skill_body(skill_path: Path) -> str:
    """Return SKILL.md content after the frontmatter."""
    content = skill_path.read_text(encoding="utf-8")
    match = re.match(r"^---\n.*?\n---\n?(.*)", content, re.DOTALL)
    return match.group(1) if match else content


# ---------------------------------------------------------------------------
# JSON‑schema extraction from Markdown
# ---------------------------------------------------------------------------


def extract_json_blocks(md_path: Path) -> list[dict]:
    """Extract all fenced ```json ... ``` blocks from a Markdown file."""
    content = md_path.read_text(encoding="utf-8")
    blocks = re.findall(r"```json\s*\n(.*?)```", content, re.DOTALL)
    results = []
    for block in blocks:
        try:
            results.append(json.loads(block))
        except json.JSONDecodeError:
            continue
    return results


def extract_json_schema(md_path: Path, *, title: str | None = None) -> dict | None:
    """Extract a JSON Schema block from a Markdown file.

    If *title* is given, look for a schema whose ``title`` field matches.
    Otherwise return the first block that looks like a JSON Schema.
    """
    for block in extract_json_blocks(md_path):
        if "$schema" not in block and "type" not in block:
            continue
        if title is None or block.get("title") == title:
            return block
    return None


def extract_input_schema(md_path: Path) -> dict | None:
    """Return the first JSON Schema block that appears under an 'Input' heading."""
    content = md_path.read_text(encoding="utf-8")
    # Find JSON blocks that appear after "Input Schema" heading
    # We split on Input Schema heading and look in that section
    parts = re.split(r"##\s+(?:Input Schema|Input)", content, maxsplit=1)
    if len(parts) < 2:
        return None
    section = parts[1]
    # Only look up to the next ## heading
    next_heading = re.search(r"\n##\s+", section)
    if next_heading:
        section = section[:next_heading.start()]
    blocks = re.findall(r"```json\s*\n(.*?)```", section, re.DOTALL)
    for block_text in blocks:
        try:
            block = json.loads(block_text)
            if "$schema" in block or "type" in block:
                return block
        except json.JSONDecodeError:
            continue
    return None


def extract_output_schema(md_path: Path) -> dict | None:
    """Return the first JSON Schema block that appears under an 'Output' heading."""
    content = md_path.read_text(encoding="utf-8")
    parts = re.split(r"##\s+(?:Output Schema|Output)", content, maxsplit=1)
    if len(parts) < 2:
        return None
    section = parts[1]
    next_heading = re.search(r"\n##\s+", section)
    if next_heading:
        section = section[:next_heading.start()]
    blocks = re.findall(r"```json\s*\n(.*?)```", section, re.DOTALL)
    for block_text in blocks:
        try:
            block = json.loads(block_text)
            if "$schema" in block or "type" in block:
                return block
        except json.JSONDecodeError:
            continue
    return None


def extract_examples_from_section(md_path: Path, heading_pattern: str) -> list[dict]:
    """Extract all JSON examples from sections matching *heading_pattern*."""
    content = md_path.read_text(encoding="utf-8")
    parts = re.split(heading_pattern, content)
    if len(parts) < 2:
        return []
    examples_section = parts[1]
    blocks = re.findall(r"```json\s*\n(.*?)```", examples_section, re.DOTALL)
    results = []
    for block_text in blocks:
        try:
            results.append(json.loads(block_text))
        except json.JSONDecodeError:
            continue
    return results


# ---------------------------------------------------------------------------
# Fixture project helpers
# ---------------------------------------------------------------------------


def _copy_fixture(fixture_name: str, tmp_path: Path, git_init: bool = True) -> Path:
    """Copy a fixture project to tmp_path and optionally ``git init``."""
    src = FIXTURES_DIR / fixture_name
    dst = tmp_path / fixture_name
    shutil.copytree(src, dst)
    if git_init:
        subprocess.run(["git", "init"], cwd=dst, capture_output=True, check=True)
        subprocess.run(
            ["git", "add", "."], cwd=dst, capture_output=True, check=True
        )
        subprocess.run(
            ["git", "commit", "-m", "initial"],
            cwd=dst,
            capture_output=True,
            check=True,
            env={**os.environ, "GIT_AUTHOR_NAME": "test", "GIT_AUTHOR_EMAIL": "t@t",
                 "GIT_COMMITTER_NAME": "test", "GIT_COMMITTER_EMAIL": "t@t"},
        )
    return dst


@pytest.fixture()
def js_project(tmp_path):
    return _copy_fixture("js-project", tmp_path)


@pytest.fixture()
def py_project(tmp_path):
    return _copy_fixture("py-project", tmp_path)


@pytest.fixture()
def buggy_project(tmp_path):
    return _copy_fixture("buggy-project", tmp_path)


@pytest.fixture()
def messy_project(tmp_path):
    return _copy_fixture("messy-project", tmp_path)


@pytest.fixture()
def perf_project(tmp_path):
    return _copy_fixture("perf-project", tmp_path)


@pytest.fixture()
def undocumented_project(tmp_path):
    return _copy_fixture("undocumented-project", tmp_path)


@pytest.fixture()
def empty_project(tmp_path):
    dst = tmp_path / "empty-project"
    dst.mkdir()
    return dst


@pytest.fixture()
def para_project(tmp_path):
    """A bare project with git but no PARA structure yet."""
    dst = tmp_path / "para-project"
    dst.mkdir()
    (dst / "README.md").write_text("# Test\n")
    subprocess.run(["git", "init"], cwd=dst, capture_output=True, check=True)
    subprocess.run(["git", "add", "."], cwd=dst, capture_output=True, check=True)
    subprocess.run(
        ["git", "commit", "-m", "initial"],
        cwd=dst,
        capture_output=True,
        check=True,
        env={**os.environ, "GIT_AUTHOR_NAME": "test", "GIT_AUTHOR_EMAIL": "t@t",
             "GIT_COMMITTER_NAME": "test", "GIT_COMMITTER_EMAIL": "t@t"},
    )
    return dst


# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------


def assert_file_contains(path: Path, pattern: str):
    """Assert that *path* contains text matching *pattern* (regex)."""
    content = path.read_text(encoding="utf-8")
    assert re.search(pattern, content, re.IGNORECASE), (
        f"{path.name} does not match pattern: {pattern}"
    )


def git_log(project: Path, n: int = 5) -> str:
    result = subprocess.run(
        ["git", "log", f"-{n}", "--oneline"],
        cwd=project,
        capture_output=True,
        text=True,
    )
    return result.stdout


def run_in(project: Path, cmd: str, **kwargs) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd, shell=True, cwd=project, capture_output=True, text=True, **kwargs,
    )
