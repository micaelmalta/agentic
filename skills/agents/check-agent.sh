#!/bin/bash
# =============================================================================
# check-agent.sh - Reference/template script for checking agent status
#
# NOTE: This is a REFERENCE SCRIPT / TEMPLATE ONLY. In production, agent status
# checking is done via Claude Code's TaskOutput tool, not by running this script
# directly. This script is provided as an example of how agent output files are
# structured and can be inspected manually for debugging purposes.
#
# See skills/agents/README.md for actual usage instructions.
#
# Configuration:
#   AGENT_LOG_DIR - Directory where agent output files are stored.
#                   Defaults to /tmp/agent-tasks if not set.
#
# Completion marker convention:
#   Agents write "Agent execution complete" as the last line of their output
#   file when they finish. This script checks for that marker to determine
#   whether an agent is still running or has completed.
#
# Usage: check-agent.sh <task-id>
# =============================================================================

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: check-agent.sh <task-id>"
    echo ""
    echo "Environment variables:"
    echo "  AGENT_LOG_DIR  Directory for agent output files (default: /tmp/agent-tasks)"
    echo ""
    echo "Example:"
    echo "  check-agent.sh a1234567"
    echo "  AGENT_LOG_DIR=/var/log/agents check-agent.sh a1234567"
    exit 1
fi

TASK_ID="$1"

# Validate TASK_ID contains only safe characters (prevent path traversal)
if ! echo "$TASK_ID" | grep -qE '^[a-zA-Z0-9_-]+$'; then
    echo "Error: Invalid task ID '$TASK_ID'. Only alphanumeric characters, hyphens, and underscores are allowed."
    exit 1
fi

AGENT_LOG_DIR="${AGENT_LOG_DIR:-/tmp/agent-tasks}"
OUTPUT_FILE="${AGENT_LOG_DIR}/${TASK_ID}.output"

# Validate log directory exists
if [ ! -d "$AGENT_LOG_DIR" ]; then
    echo "Error: Agent log directory not found: $AGENT_LOG_DIR"
    echo "Set AGENT_LOG_DIR to the correct path or create the directory."
    exit 1
fi

echo "=========================================="
echo "Agent Status: $TASK_ID"
echo "=========================================="
echo ""

# Check if output file exists
if [ ! -f "$OUTPUT_FILE" ]; then
    echo "Error: Agent output file not found at $OUTPUT_FILE"
    echo "Agent may not be running or task ID is incorrect."
    exit 1
fi

# Show last 50 lines of output
echo "Recent output (last 50 lines):"
echo "---"
tail -n 50 "$OUTPUT_FILE"
echo "---"
echo ""

# Check if agent completed
if grep -q "Agent execution complete" "$OUTPUT_FILE" 2>/dev/null; then
    echo "Status: COMPLETED"
else
    echo "Status: RUNNING"
    echo ""
    echo "To see full output: cat $OUTPUT_FILE"
    echo "To follow output: tail -f $OUTPUT_FILE"
fi
