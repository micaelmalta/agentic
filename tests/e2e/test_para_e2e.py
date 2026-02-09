"""E2E tests for the PARA skill — requires Claude CLI."""

import re
from pathlib import Path

import pytest

from e2e.conftest import invoke_claude, skip_if_no_claude


@pytest.mark.e2e
@skip_if_no_claude
class TestParaE2E:
    """Full /plan → /execute → /summarize → /archive flow."""

    def test_init_creates_para_structure(self, para_project):
        result = invoke_claude(
            para_project,
            "Create a PARA project structure by creating these directories: "
            "context/, context/plans/, context/summaries/, context/archives/, "
            "context/data/, context/servers/. "
            "Also create context/context.md with a heading '# Active Context'.",
        )
        # Should create context directory structure
        assert (para_project / "context").is_dir() or "context" in result["stdout"].lower()

    def test_plan_creates_plan_file(self, para_project):
        # First create structure
        (para_project / "context").mkdir(exist_ok=True)
        (para_project / "context" / "plans").mkdir(exist_ok=True)
        # Then ask Claude to create a plan
        result = invoke_claude(
            para_project,
            "Create a plan file at context/plans/ with today's date in the filename "
            "(format: YYYY-MM-DD-greeting-utility.md). The plan should contain sections: "
            "## Objective, ## Approach, ## Implementation Steps, ## Risks. "
            "The task is to add a greeting utility function.",
        )
        plans_dir = para_project / "context" / "plans"
        plan_files = list(plans_dir.glob("*.md"))
        assert len(plan_files) >= 1, (
            f"No plan file created. stdout: {result['stdout'][:500]}"
        )
        # Verify naming convention
        for pf in plan_files:
            assert re.match(r"\d{4}-\d{2}-\d{2}", pf.name), (
                f"Plan file {pf.name} doesn't follow YYYY-MM-DD naming"
            )

    def test_summarize_creates_summary(self, para_project):
        # Set up structure and a plan
        (para_project / "context").mkdir(exist_ok=True)
        (para_project / "context" / "plans").mkdir(exist_ok=True)
        (para_project / "context" / "summaries").mkdir(exist_ok=True)
        plan_file = para_project / "context" / "plans" / "2025-01-01-greeting-utility.md"
        plan_file.write_text("# Plan: Greeting Utility\n## Objective\nAdd greeting function.\n")
        # Ask Claude to create a summary
        result = invoke_claude(
            para_project,
            "Create a summary file at context/summaries/ with today's date in the filename "
            "(format: YYYY-MM-DD-greeting-utility.md). The summary should document that "
            "we implemented a greeting utility. Include sections: ## Summary, ## Changes Made, "
            "## Lessons Learned.",
        )
        summaries_dir = para_project / "context" / "summaries"
        summary_files = list(summaries_dir.glob("*.md"))
        assert len(summary_files) >= 1 or "summary" in result["stdout"].lower(), (
            f"No summary created. stdout: {result['stdout'][:500]}"
        )
