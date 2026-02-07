#!/bin/bash
# run-agent.sh - Reference/template script for spawning phase agents
# NOTE: This is a REFERENCE SCRIPT ONLY. Actual agent spawning is done
# via Claude Code's Task tool, not by running this script directly.
# See skills/agents/README.md for usage instructions.
#
# Usage: run-agent.sh <agent-name> <input-json-file>

set -e

if [ "$#" -lt 2 ]; then
    echo "Usage: run-agent.sh <agent-name> <input-json-file>"
    echo ""
    echo "Available agents:"
    echo "  phase-testing-agent"
    echo "  phase-validation-agent"
    echo "  phase-pr-agent"
    echo ""
    echo "Example:"
    echo "  run-agent.sh phase-testing-agent input.json"
    exit 1
fi

AGENT_NAME="$1"
INPUT_FILE="$2"
AGENT_DIR="skills/agents/${AGENT_NAME}"

# Validate agent exists
if [ ! -d "$AGENT_DIR" ]; then
    echo "Error: Agent '$AGENT_NAME' not found in $AGENT_DIR"
    exit 1
fi

# Validate input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found"
    exit 1
fi

# Read input JSON
INPUT_JSON=$(cat "$INPUT_FILE")

echo "=========================================="
echo "Running Agent: $AGENT_NAME"
echo "=========================================="
echo ""
echo "Input:"
echo "$INPUT_JSON" | jq '.' 2>/dev/null || echo "$INPUT_JSON"
echo ""
echo "Agent executing..."
echo ""

# Build agent prompt
AGENT_PROMPT="Read ${AGENT_DIR}/AGENT.md and execute the agent with the following input:

${INPUT_JSON}

Follow the agent protocol exactly as specified in the AGENT.md file. Return the structured JSON output as defined in the protocol."

# Execute via Task tool (this script is meant to be used by Claude Code)
# In practice, this would be invoked through Claude Code's Task tool
# This is a placeholder for the actual integration

echo "Note: This script is a template. Actual agent spawning is done via Claude Code Task tool."
echo "Agent: $AGENT_NAME"
echo "Input file: $INPUT_FILE"
echo ""
echo "To run manually, use Claude Code with:"
echo "Task(subagent_type=\"general-purpose\", prompt=\"$AGENT_PROMPT\")"
