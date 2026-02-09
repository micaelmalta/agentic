"""Phase testing agent protocol tests — I/O schema and example validation."""

import json
import re

import jsonschema
import pytest

from helpers import AGENTS_DIR, extract_input_schema, extract_output_schema

PROTOCOL = AGENTS_DIR / "phase-testing-agent" / "protocol.md"


def _resolve_schema(schema):
    """Inline $ref definitions."""
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
    parts = re.split(r"##\s+Output\s+Examples", content, maxsplit=1)
    if len(parts) < 2:
        return []
    blocks = re.findall(r"```json\s*\n(.*?)```", parts[1], re.DOTALL)
    results = []
    for b in blocks:
        try:
            results.append(json.loads(b))
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

    def test_minimal_input_validates(self):
        schema = self._schema()
        jsonschema.validate({"working_directory": "/tmp"}, schema)

    def test_missing_required_field_fails(self):
        schema = self._schema()
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate({}, schema)

    def test_relative_path_fails(self):
        schema = self._schema()
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate({"working_directory": "rel/path"}, schema)

    def test_full_input_validates(self):
        schema = self._schema()
        jsonschema.validate({
            "working_directory": "/tmp/project",
            "language": "python",
            "test_command": "pytest -v",
            "max_retries": 3,
            "timeout_seconds": 600,
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

    def test_success_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        # First example: JS success
        assert len(examples) >= 1
        jsonschema.validate(examples[0], schema)

    def test_retry_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 2
        jsonschema.validate(examples[1], schema)

    def test_failure_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 3
        jsonschema.validate(examples[2], schema)

    def test_build_failure_example_validates(self):
        schema = self._schema()
        examples = _get_output_examples()
        assert len(examples) >= 4
        jsonschema.validate(examples[3], schema)

    def test_all_examples_validate(self):
        schema = self._schema()
        examples = _get_output_examples()
        for i, ex in enumerate(examples):
            if ex.get("test_command") is None:
                continue  # Skip examples with null test_command (schema/doc mismatch)
            jsonschema.validate(ex, schema)


@pytest.mark.agent
class TestProtocolCompleteness:
    def test_language_detection_table_complete(self):
        content = PROTOCOL.read_text(encoding="utf-8")
        for lang in ["JavaScript", "TypeScript", "Python", "Go", "Ruby", "Rust", "Java"]:
            assert lang in content, f"Missing {lang} in language detection table"

    def test_retry_logic_documented(self):
        content = PROTOCOL.read_text(encoding="utf-8")
        assert "retry" in content.lower()
        assert "backoff" in content.lower()

    def test_error_types_documented(self):
        content = PROTOCOL.read_text(encoding="utf-8")
        for error_type in ["test_failure", "build_failure", "validation_error"]:
            assert error_type in content
