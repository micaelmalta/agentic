"""E2E tests for the refactoring skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestRefactoringE2E:
    """Refactor messy fixture project."""

    def test_refactor_messy_project(self, messy_project):
        result = invoke_claude(
            messy_project,
            "Refactor src/monolith.js using the refactoring skill. "
            "Focus on extracting duplicated code and improving naming.",
            timeout=600,
        )
        assert result["returncode"] == 0 or "refactor" in result["stdout"].lower()
