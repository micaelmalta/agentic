"""Scenario tests for the workflow skill — the only skill that orchestrates others."""

import re

import pytest

from helpers import SKILLS_DIR, read_skill_body


SKILL_PATH = SKILLS_DIR / "workflow" / "SKILL.md"
WORKFLOW_DIR = SKILLS_DIR / "workflow"


class TestWorkflowPhaseOrdering:
    """Validate 8-phase workflow structure."""

    def test_workflow_phase_ordering(self):
        body = read_skill_body(SKILL_PATH)
        # Workflow uses a table format, check for phase entries in the table
        positions = []
        for i in range(1, 9):
            # Match table entries like "| **1. Plan** |" or "| **2. Worktree** |"
            match = re.search(rf"\|\s+\*\*{i}\.", body, re.MULTILINE)
            assert match, f"Phase {i} table entry not found in workflow SKILL.md"
            positions.append(match.start())
        # Verify phases appear in sequential order
        assert positions == sorted(positions), "Phase table entries are not in sequential order"


class TestWorkflowDelegation:
    """Validate workflow delegates to the correct skills/agents."""

    def test_phase_1_delegates_to_para(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"para", body, re.IGNORECASE)

    def test_phase_3_delegates_to_developer(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"developer", body, re.IGNORECASE)

    def test_phase_4_uses_testing_agent(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"phase.testing.agent", body, re.IGNORECASE)

    def test_phase_5_uses_validation_agent(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"phase.validation.agent", body, re.IGNORECASE)

    def test_phase_7_uses_pr_agent(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"phase.pr.agent", body, re.IGNORECASE)


class TestWorkflowReferencesAllSkills:
    """Workflow should reference all required skills."""

    def test_references_required_skills(self):
        body = read_skill_body(SKILL_PATH)
        required = [
            "para", "developer", "testing", "code-reviewer",
            "security-reviewer", "git-commits",
        ]
        for skill in required:
            assert re.search(skill, body, re.IGNORECASE), (
                f"Workflow SKILL.md should reference '{skill}'"
            )


class TestWorkflowGates:
    """Validate enforcement and gate mechanisms."""

    def test_phase_5_gate_enforcement(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"validation|gate|enforce", body, re.IGNORECASE)

    def test_security_stops_workflow(self):
        body = read_skill_body(SKILL_PATH)
        assert re.search(r"critical.*security|security.*stop|security.*halt", body, re.IGNORECASE)


class TestWorkflowSupportingDocs:
    """Validate supporting Markdown files exist."""

    def test_enforcement_md_exists(self):
        assert (WORKFLOW_DIR / "ENFORCEMENT.md").exists()

    def test_parallel_md_exists(self):
        assert (WORKFLOW_DIR / "PARALLEL.md").exists()

    def test_agents_md_exists(self):
        assert (WORKFLOW_DIR / "AGENTS.md").exists()
