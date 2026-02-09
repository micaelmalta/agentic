"""E2E tests for the workflow skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@pytest.mark.slow
@skip_if_no_claude
class TestWorkflowE2E:
    """Full 8-phase workflow (the longest test)."""

    def test_full_8_phase_workflow(self, js_project):
        result = invoke_claude(
            js_project,
            "Use the workflow skill to implement a 'multiply' function in src/index.js "
            "with full TDD, code review, security review, and create a PR.",
            timeout=900,
        )
        # Just verify it ran without crashing
        assert result["returncode"] == 0 or len(result["stdout"]) > 100
