#!/bin/bash
# check-agent.sh - Check status of a running background agent
# Usage: check-agent.sh <task-id>

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: check-agent.sh <task-id>"
    echo ""
    echo "Example:"
    echo "  check-agent.sh a1234567"
    exit 1
fi

TASK_ID="$1"
OUTPUT_FILE="${AGENT_LOG_DIR:-/tmp/agent-tasks}/${TASK_ID}.output"

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
if tail -n 5 "$OUTPUT_FILE" | grep -q "Agent execution complete"; then
    echo "Status: COMPLETED"
else
    echo "Status: RUNNING"
    echo ""
    echo "To see full output: cat $OUTPUT_FILE"
    echo "To follow output: tail -f $OUTPUT_FILE"
fi
