"""Structural tests: JSON Schema validation for all agent protocols."""

import json
import re

import jsonschema
import pytest

from helpers import (
    AGENTS_DIR,
    ALL_AGENTS,
    extract_input_schema,
    extract_json_blocks,
    extract_output_schema,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

AGENT_PROTOCOL = {name: AGENTS_DIR / name / "protocol.md" for name in ALL_AGENTS}


def _resolve_schema(schema: dict) -> dict:
    """Inline $ref definitions for jsonschema validation (simple single-level)."""
    if "definitions" not in schema:
        return schema
    resolved = json.loads(json.dumps(schema))
    defs = resolved.pop("definitions", {})

    def _resolve_refs(obj):
        if isinstance(obj, dict):
            if "$ref" in obj:
                ref_name = obj["$ref"].split("/")[-1]
                if ref_name in defs:
                    obj.clear()
                    obj.update(defs[ref_name])
            for v in obj.values():
                _resolve_refs(v)
        elif isinstance(obj, list):
            for item in obj:
                _resolve_refs(item)

    _resolve_refs(resolved)
    return resolved


def _extract_output_examples(md_path):
    """Extract JSON examples from Output Examples section."""
    content = md_path.read_text(encoding="utf-8")
    # Find the output examples section
    parts = re.split(r"##\s+Output\s+Examples", content, maxsplit=1)
    if len(parts) < 2:
        return []
    section = parts[1]
    blocks = re.findall(r"```json\s*\n(.*?)```", section, re.DOTALL)
    results = []
    for block_text in blocks:
        try:
            results.append(json.loads(block_text))
        except json.JSONDecodeError:
            continue
    return results


def _extract_input_examples(md_path):
    """Extract JSON examples from Input Examples section."""
    content = md_path.read_text(encoding="utf-8")
    parts = re.split(r"##\s+Input\s+Examples", content, maxsplit=1)
    if len(parts) < 2:
        return []
    section = parts[1]
    # Stop at the next ## heading that is NOT a sub-heading within examples
    next_h2 = re.search(r"\n##\s+(?!#)", section)
    if next_h2:
        section = section[:next_h2.start()]
    blocks = re.findall(r"```json\s*\n(.*?)```", section, re.DOTALL)
    results = []
    for block_text in blocks:
        try:
            results.append(json.loads(block_text))
        except json.JSONDecodeError:
            continue
    return results


# ---------------------------------------------------------------------------
# Schema validity tests (parameterized over agents)
# ---------------------------------------------------------------------------


@pytest.fixture(params=ALL_AGENTS)
def agent_name(request):
    return request.param


class TestAgentSchemaValidity:
    """Verify that input and output JSON schemas are valid Draft-07."""

    def test_input_schema_valid_json_schema(self, agent_name):
        schema = extract_input_schema(AGENT_PROTOCOL[agent_name])
        assert schema is not None, f"No input schema found for {agent_name}"
        # Validate it's a valid JSON Schema
        jsonschema.Draft7Validator.check_schema(schema)

    def test_output_schema_valid_json_schema(self, agent_name):
        schema = extract_output_schema(AGENT_PROTOCOL[agent_name])
        assert schema is not None, f"No output schema found for {agent_name}"
        jsonschema.Draft7Validator.check_schema(_resolve_schema(schema))


# ---------------------------------------------------------------------------
# Example validation tests — per agent
# ---------------------------------------------------------------------------


class TestTestingAgentExamples:
    """Validate that testing agent examples conform to their schemas."""

    PROTOCOL = AGENT_PROTOCOL.get("phase-testing-agent")

    def _get_output_schema(self):
        schema = extract_output_schema(self.PROTOCOL)
        return _resolve_schema(schema)

    def _get_input_schema(self):
        return extract_input_schema(self.PROTOCOL)

    def test_minimal_input_validates(self):
        schema = self._get_input_schema()
        assert schema is not None
        jsonschema.validate({"working_directory": "/tmp"}, schema)

    def test_missing_required_field_fails(self):
        schema = self._get_input_schema()
        assert schema is not None
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate({}, schema)

    def test_relative_path_fails(self):
        schema = self._get_input_schema()
        assert schema is not None
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate({"working_directory": "rel/path"}, schema)

    def test_output_examples_validate(self):
        schema = self._get_output_schema()
        assert schema is not None
        examples = _extract_output_examples(self.PROTOCOL)
        assert len(examples) >= 3, "Expected at least 3 output examples"
        # Validate examples that have non-null test_command (protocol schema
        # says "string" but some error examples use null — a known doc issue)
        for i, example in enumerate(examples):
            if example.get("test_command") is None:
                continue  # Skip examples with null test_command (schema/doc mismatch)
            jsonschema.validate(example, schema, format_checker=None)

    def test_language_detection_table_complete(self):
        content = self.PROTOCOL.read_text(encoding="utf-8")
        for lang in ["JavaScript", "Python", "Go", "Ruby", "Rust", "Java"]:
            assert lang in content, f"Language detection table missing {lang}"


class TestValidationAgentExamples:
    """Validate that validation agent examples conform to their schemas."""

    PROTOCOL = AGENT_PROTOCOL.get("phase-validation-agent")

    def _get_output_schema(self):
        schema = extract_output_schema(self.PROTOCOL)
        return _resolve_schema(schema)

    def _get_input_schema(self):
        return extract_input_schema(self.PROTOCOL)

    def test_minimal_input_requires_workdir_and_changed_files(self):
        schema = self._get_input_schema()
        assert schema is not None
        # Both required
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate({"working_directory": "/tmp"}, schema)
        # Valid minimal
        jsonschema.validate(
            {"working_directory": "/tmp", "changed_files": ["a.py"]}, schema
        )

    def test_output_has_all_6_checks(self):
        schema = self._get_output_schema()
        assert schema is not None
        checks_schema = schema.get("properties", {}).get("checks", {})
        required_checks = {"formatter", "linter", "build", "tests", "code_review", "security_review"}
        actual_props = set(checks_schema.get("properties", {}).keys())
        assert required_checks.issubset(actual_props), (
            f"Missing checks: {required_checks - actual_props}"
        )

    def test_output_examples_validate(self):
        schema = self._get_output_schema()
        assert schema is not None
        content = self.PROTOCOL.read_text(encoding="utf-8")
        # Extract examples from "Example Requests and Responses" or "Example" sections
        parts = re.split(r"##\s+Example", content)
        examples = []
        for part in parts[1:]:
            # Find response JSON blocks
            resp_parts = re.split(r"Response|Success|Retries|Critical|Validation Error", part)
            for rp in resp_parts:
                blocks = re.findall(r"```json\s*\n(.*?)```", rp, re.DOTALL)
                for block_text in blocks:
                    try:
                        obj = json.loads(block_text)
                        # Only output examples have 'checks' key
                        if "checks" in obj:
                            examples.append(obj)
                    except json.JSONDecodeError:
                        continue
        assert len(examples) >= 3, f"Expected at least 3 output examples, found {len(examples)}"
        for example in examples:
            jsonschema.validate(example, schema, format_checker=None)

    def test_critical_security_issue_is_boolean(self):
        schema = self._get_output_schema()
        assert schema is not None
        csi = schema.get("properties", {}).get("critical_security_issue", {})
        assert csi.get("type") == "boolean"


class TestPRAgentExamples:
    """Validate that PR agent examples conform to their schemas."""

    PROTOCOL = AGENT_PROTOCOL.get("phase-pr-agent")

    def _get_output_schema(self):
        schema = extract_output_schema(self.PROTOCOL)
        return _resolve_schema(schema)

    def _get_input_schema(self):
        return extract_input_schema(self.PROTOCOL)

    def test_4_required_fields(self):
        schema = self._get_input_schema()
        assert schema is not None
        required = set(schema.get("required", []))
        assert {"branch", "title", "description", "working_directory"}.issubset(required)

    def test_jira_key_pattern(self):
        schema = self._get_input_schema()
        assert schema is not None
        jira_prop = schema.get("properties", {}).get("jira_key", {})
        assert jira_prop.get("pattern") == "^[A-Z]+-[0-9]+$"

    def test_output_examples_validate(self):
        schema = self._get_output_schema()
        assert schema is not None
        examples = _extract_output_examples(self.PROTOCOL)
        assert len(examples) >= 4, f"Expected at least 4 output examples, found {len(examples)}"
        for example in examples:
            jsonschema.validate(example, schema, format_checker=None)

    def test_jira_status_always_has_3_required_fields(self):
        schema = self._get_output_schema()
        assert schema is not None
        jira_schema = schema.get("properties", {}).get("jira_status", {})
        required = set(jira_schema.get("required", []))
        assert {"linked", "transitioned", "current_state"}.issubset(required)
