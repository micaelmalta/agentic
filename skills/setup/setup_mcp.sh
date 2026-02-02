#!/usr/bin/env bash
# Setup MCP servers (Atlassian, Datadog) for Cursor and/or Claude.
# Uses the official config locations:
#   Cursor:  ~/.cursor/mcp.json
#   Claude:  ~/.claude.json (Claude Code CLI). Set CLAUDE_DESKTOP=1 for Claude Desktop app.
#
# Usage:
#   export DATADOG_API_KEY="your-api-key"
#   export DATADOG_APP_KEY="your-app-key"
#   export TARGET="cursor"   # or "claude" or "both"
#   export MCP_DATADOG_PATH="/path/to/mcp_datadog/src/index.js"  # optional
#   export CLAUDE_DESKTOP=1  # optional: use Claude Desktop app config instead of Claude Code
#   ./skills/setup/setup_mcp.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_DATADOG_PATH="${HOME:-$USERPROFILE}/projects/poc/mcp_datadog/src/index.js"
export MCP_DATADOG_PATH="${MCP_DATADOG_PATH:-$DEFAULT_DATADOG_PATH}"
export TARGET="${TARGET:-both}"

if [[ -z "$DATADOG_API_KEY" || -z "$DATADOG_APP_KEY" ]]; then
  echo "Error: Set DATADOG_API_KEY and DATADOG_APP_KEY before running this script."
  echo "Example: export DATADOG_API_KEY=xxx; export DATADOG_APP_KEY=xxx"
  exit 1
fi

node "$SCRIPT_DIR/setup_mcp.js"
echo "Done. Restart Cursor and/or Claude for changes to take effect."
