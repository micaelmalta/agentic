"""E2E tests for the security-reviewer skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestSecurityReviewerE2E:
    """Find vulnerabilities in fixture code."""

    def test_finds_sql_injection(self, py_project):
        result = invoke_claude(
            py_project,
            "Review src/database.py for security vulnerabilities using the security-reviewer skill.",
            timeout=300,
        )
        output = result["stdout"].lower()
        assert "sql" in output or "injection" in output
