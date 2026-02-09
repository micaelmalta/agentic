"""Phase validation agent protocol tests — I/O schema and example validation."""

import json
import re

import jsonschema
import pytest

from helpers import AGENTS_DIR, extract_input_schema, extract_output_schema

PROTOCOL = AGENTS_DIR / "phase-validation-agent" / "protocol.md"


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
    """Extract output example JSON blocks from the protocol."""
    content = PROTOCOL.read_text(encoding="utf-8")
    parts = re.split(r"##\s+Example", content)
    examples = []
    for part in parts[1:]:
        blocks = re.findall(r"```json\s*\n(.*?)```", part, re.DOTALL)
        for b in blocks:
            try:
                obj = json.loads(b)
                if "checks" in obj:
                    examples.append(obj)
            except json.JSONDecodeError:
                continue
    return examples


@pytest.mark.agent
class TestInputSchema:
    def _schema(self):
        return extract_input_schema(PROTOCOL)

    def test_is_valid_json_schema(self):
        schema = self._schema()
        assert schema is not None
        jsonschema.Draft7Validator.check_schema(schema)

    def test_minimal_input_requires_workdir_and_changed_files(self):
        schema = self._schema()
        # Missing changed_files
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate({"working_directory": "/tmp"}, schema)
        # Valid
        jsonschema.validate(
            {"working_directory": "/tmp", "changed_files": ["a.py"]}, schema
        )

    def test_relative_path_fails(self):
        schema = self._schema()
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(
                {"working_directory": "relative", "changed_files": ["a.py"]}, schema
            )


@pytest.mark.agent
class TestOutputSchema:
    def _schema(self):
        schema = extract_output_schema(PROTOCOL)
        return _resolve_schema(schema)

    def test_is_valid_json_schema(self):
        schema = self._schema()
        assert schema is not None
        jsonschema.Draft7Validator.check_schema(schema)

    def test_output_has_all_6_checks(self):
        schema = self._schema()
        checks = schema["properties"]["checks"]
        required_checks = {"formatter", "linter", "build", "tests", "code_review", "security_review"}
        assert required_checks == set(checks.get("required", []))

    def test_critical_security_issue_is_boolean(self):
        schema = self._schema()
        csi = schema["properties"].get("critical_security_issue", {})
        assert csi.get("type") == "boolean"

    def test_success_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 1
        jsonschema.validate(examples[0], schema)

    def test_retries_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 2
        jsonschema.validate(examples[1], schema)

    def test_critical_security_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 3
        jsonschema.validate(examples[2], schema)
        assert examples[2].get("critical_security_issue") is True

    def test_validation_error_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 4
        jsonschema.validate(examples[3], schema)
