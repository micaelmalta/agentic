#!/usr/bin/env python3
"""
validate-input.py - Validate agent input against schema
Usage: validate-input.py <agent-name> <input-json-file>
"""

import sys
import json
import os
from pathlib import Path

# Agent schemas (synced with protocol.md definitions)
SCHEMAS = {
    "phase-testing-agent": {
        "required": ["working_directory"],
        "optional": {
            "language": str,
            "test_command": str,
            "build_command": str,
            "run_build": bool,
            "max_retries": int,
            "timeout_seconds": int,
            "retry_backoff_ms": list,
        },
    },
    "phase-validation-agent": {
        "required": ["working_directory", "changed_files"],
        "optional": {
            "language": str,
            "format_command": str,
            "lint_command": str,
            "build_command": str,
            "test_command": str,
            "max_retries": int,
            "skip_build": bool,
            "skip_tests": bool,
        },
    },
    "phase-pr-agent": {
        "required": ["branch", "title", "description", "working_directory"],
        "optional": {
            "base_branch": str,
            "jira_key": str,
            "mark_ready": bool,
            "draft": bool,
        },
    },
}


def validate_input(agent_name: str, input_data: dict) -> tuple[bool, list[str]]:
    """
    Validate input data against agent schema.

    Returns:
        (is_valid, errors)
    """
    if agent_name not in SCHEMAS:
        return False, [f"Unknown agent: {agent_name}"]

    schema = SCHEMAS[agent_name]
    errors = []

    # Check required fields
    for field in schema["required"]:
        if field not in input_data:
            errors.append(f"Missing required field: {field}")
        elif input_data[field] is None or input_data[field] == "":
            errors.append(f"Required field is empty: {field}")

    # Check optional field types
    for field, expected_type in schema["optional"].items():
        if field in input_data and input_data[field] is not None:
            if not isinstance(input_data[field], expected_type):
                actual_type = type(input_data[field]).__name__
                expected_type_name = expected_type.__name__
                errors.append(
                    f"Field '{field}' has wrong type: "
                    f"expected {expected_type_name}, got {actual_type}"
                )

    return len(errors) == 0, errors


def main():
    if len(sys.argv) < 3:
        print("Usage: validate-input.py <agent-name> <input-json-file>")
        print("")
        print("Available agents:")
        for agent in SCHEMAS.keys():
            print(f"  {agent}")
        sys.exit(1)

    agent_name = sys.argv[1]
    input_file = sys.argv[2]

    # Read input JSON
    try:
        with open(input_file, "r") as f:
            input_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file: {e}")
        sys.exit(1)

    # Validate
    is_valid, errors = validate_input(agent_name, input_data)

    if is_valid:
        print(f"✓ Input is valid for {agent_name}")
        print("")
        print("Validated input:")
        print(json.dumps(input_data, indent=2))
        sys.exit(0)
    else:
        print(f"✗ Input validation failed for {agent_name}")
        print("")
        print("Errors:")
        for error in errors:
            print(f"  - {error}")
        print("")
        print("Input received:")
        print(json.dumps(input_data, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
