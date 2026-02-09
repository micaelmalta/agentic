"""Phase PR agent protocol tests — I/O schema and example validation."""

import json
import re

import jsonschema
import pytest

from helpers import AGENTS_DIR, extract_input_schema, extract_output_schema

PROTOCOL = AGENTS_DIR / "phase-pr-agent" / "protocol.md"


def _resolve_schema(schema):
    if "definitions" not in schema:
        return schema
    resolved = json.loads(json.dumps(schema))
    defs = resolved.pop("definitions", {})

    def _walk(obj):
        if isinstance(obj, dict):
            if "$ref" in obj:
                ref_name = obj["$ref"].split("/")[-1]
                if ref_name in defs:
                    obj.clear()
                    obj.update(defs[ref_name])
            for v in obj.values():
                _walk(v)
        elif isinstance(obj, list):
            for item in obj:
                _walk(item)

    _walk(resolved)
    return resolved


def _get_output_examples():
    content = PROTOCOL.read_text(encoding="utf-8")
    parts = re.split(r"###\s+Output\s+Examples|###\s+.*(?:Success|Failure|Partial)", content)
    # Gather all JSON blocks from the Output Examples section onward
    output_section = re.split(r"##\s+Output Schema", content, maxsplit=1)
    if len(output_section) < 2:
        return []
    blocks = re.findall(r"```json\s*\n(.*?)```", output_section[1], re.DOTALL)
    results = []
    for b in blocks:
        try:
            obj = json.loads(b)
            # Output examples have 'jira_status' key (not the schema itself)
            if "jira_status" in obj:
                results.append(obj)
        except json.JSONDecodeError:
            continue
    return results


@pytest.mark.agent
class TestInputSchema:
    def _schema(self):
        return extract_input_schema(PROTOCOL)

    def test_is_valid_json_schema(self):
        schema = self._schema()
        assert schema is not None
        jsonschema.Draft7Validator.check_schema(schema)

    def test_4_required_fields(self):
        schema = self._schema()
        required = set(schema.get("required", []))
        assert {"branch", "title", "description", "working_directory"}.issubset(required)

    def test_jira_key_pattern(self):
        schema = self._schema()
        jira_prop = schema["properties"]["jira_key"]
        assert jira_prop["pattern"] == "^[A-Z]+-[0-9]+$"

    def test_minimal_input_validates(self):
        schema = self._schema()
        jsonschema.validate({
            "branch": "feature/test",
            "title": "feat: test feature",
            "description": "This is a test description for the PR",
            "working_directory": "/tmp/project",
        }, schema)


@pytest.mark.agent
class TestOutputSchema:
    def _schema(self):
        schema = extract_output_schema(PROTOCOL)
        return _resolve_schema(schema)

    def test_is_valid_json_schema(self):
        schema = self._schema()
        assert schema is not None
        jsonschema.Draft7Validator.check_schema(schema)

    def test_jira_status_has_3_required_fields(self):
        schema = self._schema()
        jira_schema = schema["properties"]["jira_status"]
        required = set(jira_schema.get("required", []))
        assert {"linked", "transitioned", "current_state"}.issubset(required)

    def test_success_no_jira_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        # First example: PR only, no Jira
        assert len(examples) >= 1
        jsonschema.validate(examples[0], schema, format_checker=None)

    def test_success_with_jira_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 2
        jsonschema.validate(examples[1], schema, format_checker=None)

    def test_partial_success_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 3
        jsonschema.validate(examples[2], schema, format_checker=None)

    def test_failure_branch_not_found_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 5
        # Find a failure example
        failure_examples = [e for e in examples if e.get("status") == "fail"]
        assert len(failure_examples) >= 1
        jsonschema.validate(failure_examples[0], schema, format_checker=None)

    def test_all_examples_validate(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 4
        for ex in examples:
            jsonschema.validate(ex, schema, format_checker=None)
