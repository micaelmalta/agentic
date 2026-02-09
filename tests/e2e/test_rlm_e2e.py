"""E2E tests for the RLM skill — requires Claude CLI."""

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestRLME2E:
    """Full RLM workflow on fixture project."""

    def test_full_rlm_workflow(self, py_project):
        result = invoke_claude(
            py_project,
            "Use the RLM skill to analyze this codebase. "
            "Scan all files, peek for function definitions, then chunk for analysis.",
            timeout=600,
        )
        output = result["stdout"].lower()
        assert any(
            kw in output
            for kw in ("loaded", "scan", "chunk", "indexed", "analysis", "files", "codebase")
        ), f"RLM output missing expected keywords: {output[:500]}"
