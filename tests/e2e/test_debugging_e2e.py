"""E2E tests for the debugging skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestDebuggingE2E:
    """Debug buggy fixture project."""

    def test_debug_buggy_project(self, buggy_project):
        result = invoke_claude(
            buggy_project,
            "There's a bug in src/calculator.js discount function. "
            "Use the debugging skill to find and fix it.",
            timeout=600,
        )
        output = result["stdout"].lower()
        assert "off-by-one" in output or ">=" in output or "boundary" in output or "fix" in output
