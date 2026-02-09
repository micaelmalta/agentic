"""E2E tests for the code-reviewer skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestCodeReviewerE2E:
    """Review fixture code and verify findings."""

    def test_review_finds_issues(self, js_project):
        result = invoke_claude(
            js_project,
            "Review the file src/api.js for code quality issues using the code-reviewer skill.",
            timeout=300,
        )
        output = result["stdout"].lower()
        # Should find eval() usage or missing error handling
        assert "eval" in output or "error" in output or "security" in output
