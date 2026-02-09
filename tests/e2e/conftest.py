"""E2E test helpers — Claude CLI invocation utilities."""

import os
import shutil
import subprocess
from pathlib import Path

import pytest


def _claude_available() -> bool:
    """Check if the claude CLI is available."""
    return shutil.which("claude") is not None


skip_if_no_claude = pytest.mark.skipif(
    not _claude_available(),
    reason="claude CLI not found in PATH",
)


def invoke_claude(
    project_dir: Path,
    prompt: str,
    timeout: int = 300,
) -> dict:
    """Invoke the claude CLI with a prompt in the given project directory.

    Returns:
        dict with keys: stdout, stderr, returncode, new_files
    """
    # Capture file list before
    before = set(str(p) for p in project_dir.rglob("*") if p.is_file())

    result = subprocess.run(
        [
            "claude",
            "--print",
            "--dangerously-skip-permissions",
            "--strict-mcp-config",
            prompt,
        ],
        cwd=project_dir,
        capture_output=True,
        text=True,
        timeout=timeout,
        env={**os.environ, "CLAUDE_NO_ANALYTICS": "1"},
    )

    # Capture new files
    after = set(str(p) for p in project_dir.rglob("*") if p.is_file())
    new_files = sorted(after - before)

    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode,
        "new_files": new_files,
    }
