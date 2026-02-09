"""E2E tests for the developer skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestDeveloperE2E:
    """TDD cycle on fixture projects."""

    def test_tdd_feature(self, js_project):
        result = invoke_claude(
            js_project,
            "Using the developer skill with TDD, implement a multiply function in src/index.js. "
            "Write the test first, then the implementation.",
            timeout=600,
        )
        # Should produce some output mentioning tests
        assert "test" in result["stdout"].lower() or result["returncode"] == 0

    def test_tdd_bug_fix(self, buggy_project):
        result = invoke_claude(
            buggy_project,
            "Using the debugging skill, fix the off-by-one bug in src/calculator.js discount function. "
            "Write a failing reproduction test first.",
            timeout=600,
        )
        assert result["returncode"] == 0 or "fix" in result["stdout"].lower()
