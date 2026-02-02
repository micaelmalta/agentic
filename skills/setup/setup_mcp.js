#!/usr/bin/env node
/**
 * Merge Atlassian and Datadog MCP config into Cursor and/or Claude config.
 * Reads DATADOG_API_KEY, DATADOG_APP_KEY, MCP_DATADOG_PATH, TARGET from env.
 *
 * Config locations (per official docs):
 * - Cursor: ~/.cursor/mcp.json (https://cursor.com/docs/context/mcp)
 * - Claude Code (CLI): ~/.claude.json (https://code.claude.com/docs/en/mcp)
 * - Claude Desktop (app): set CLAUDE_DESKTOP=1 to use ~/Library/Application Support/Claude/claude_desktop_config.json
 */
const fs = require('fs');
const path = require('path');

const home = process.env.HOME || process.env.USERPROFILE || '';
const cursorPath = path.join(home, '.cursor', 'mcp.json');
const claudeCodePath = path.join(home, '.claude.json');
const claudeDesktopPath = path.join(
  home,
  'Library',
  'Application Support',
  'Claude',
  'claude_desktop_config.json'
);
const datadogPath =
  process.env.MCP_DATADOG_PATH ||
  path.join(home, 'projects', 'poc', 'mcp_datadog', 'src', 'index.js');
const target = (process.env.TARGET || 'both').toLowerCase();
const useClaudeDesktop = process.env.CLAUDE_DESKTOP === '1' || process.env.CLAUDE_DESKTOP === 'true';

const atlassian = {
  url: 'https://mcp.atlassian.com/v1/mcp',
  type: 'http',
};

const atlassianTech = {
  url: process.env.ATLASSIAN_TECH_URL || 'https://mcp.atlassian.com/v1/mcp',
  type: 'http',
};

const datadog = {
  type: 'stdio',
  command: 'node',
  args: [datadogPath],
  env: {
    DATADOG_API_KEY: process.env.DATADOG_API_KEY || '',
    DATADOG_APP_KEY: process.env.DATADOG_APP_KEY || '',
  },
};

function merge(filePath, label) {
  let data = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (_) {
    // file missing or invalid
  }
  data.mcpServers = data.mcpServers || {};
  data.mcpServers.atlassian = atlassian;
  data.mcpServers['atlassian-tech'] = atlassianTech;
  data.mcpServers.datadog = datadog;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated', label, 'MCP config:', filePath);
}

if (target === 'cursor' || target === 'both') {
  merge(cursorPath, 'Cursor');
}
if (target === 'claude' || target === 'both') {
  const claudePath = useClaudeDesktop ? claudeDesktopPath : claudeCodePath;
  const claudeLabel = useClaudeDesktop ? 'Claude Desktop' : 'Claude Code';
  merge(claudePath, claudeLabel);
}
if (!['cursor', 'claude', 'both'].includes(target)) {
  console.error('Error: TARGET must be cursor, claude, or both');
  process.exit(1);
}
