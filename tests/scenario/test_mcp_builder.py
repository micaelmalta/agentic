"""Scenario tests for the mcp-builder skill."""

import pytest

from helpers import SKILLS_DIR


MCP_DIR = SKILLS_DIR / "mcp-builder"


class TestMCPBuilderSkill:
    """Validate MCP builder reference docs and scripts exist."""

    def test_reference_docs_exist(self):
        for doc in ["node_mcp_server.md", "python_mcp_server.md"]:
            path = MCP_DIR / "reference" / doc
            assert path.exists(), f"Missing reference doc: {doc}"

    def test_evaluation_script_exists(self):
        assert (MCP_DIR / "scripts" / "evaluation.py").exists()

    def test_connections_script_exists(self):
        assert (MCP_DIR / "scripts" / "connections.py").exists()

    def test_best_practices_reference_exists(self):
        assert (MCP_DIR / "reference" / "mcp_best_practices.md").exists()
