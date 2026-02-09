"""Structural tests: Agent file format for all phase agents."""

import re

import pytest

from helpers import ALL_AGENTS, AGENTS_DIR


@pytest.fixture(params=ALL_AGENTS)
def agent_name(request):
    return request.param


class TestAgentFormat:
    """Validate file presence and structure for each phase agent."""

    def test_agent_md_exists(self, agent_name):
        path = AGENTS_DIR / agent_name / "AGENT.md"
        assert path.exists(), f"AGENT.md missing for agent '{agent_name}'"

    def test_protocol_md_exists(self, agent_name):
        path = AGENTS_DIR / agent_name / "protocol.md"
        assert path.exists(), f"protocol.md missing for agent '{agent_name}'"

    def test_has_input_schema_section(self, agent_name):
        # Check in both AGENT.md and protocol.md
        found = False
        for fname in ("AGENT.md", "protocol.md"):
            path = AGENTS_DIR / agent_name / fname
            if path.exists():
                content = path.read_text(encoding="utf-8")
                if re.search(r"input\s+schema", content, re.IGNORECASE):
                    found = True
                    break
        assert found, f"'{agent_name}' has no 'Input Schema' section"

    def test_has_output_schema_section(self, agent_name):
        found = False
        for fname in ("AGENT.md", "protocol.md"):
            path = AGENTS_DIR / agent_name / fname
            if path.exists():
                content = path.read_text(encoding="utf-8")
                if re.search(r"output\s+schema", content, re.IGNORECASE):
                    found = True
                    break
        assert found, f"'{agent_name}' has no 'Output Schema' section"

    def test_has_execution_logic(self, agent_name):
        path = AGENTS_DIR / agent_name / "AGENT.md"
        content = path.read_text(encoding="utf-8")
        patterns = [
            r"execution",
            r"logic",
            r"algorithm",
            r"flowchart",
            r"retry",
            r"workflow",
        ]
        found = any(re.search(p, content, re.IGNORECASE) for p in patterns)
        assert found, f"'{agent_name}' AGENT.md has no execution/logic section"
