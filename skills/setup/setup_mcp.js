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
const target = (process.env.TARGET || 'both').toLowerCase();
if (!['cursor', 'claude', 'both'].includes(target)) {
  console.error('Error: TARGET must be cursor, claude, or both');
  process.exit(1);
}

const datadogPath = process.env.MCP_DATADOG_PATH || null;
if (datadogPath && !fs.existsSync(datadogPath)) {
  console.warn(`Warning: MCP_DATADOG_PATH points to non-existent file: ${datadogPath}`);
}
const useClaudeDesktop = process.env.CLAUDE_DESKTOP === '1' || process.env.CLAUDE_DESKTOP === 'true';

const atlassian = {
  url: 'https://mcp.atlassian.com/v1/mcp',
  type: 'http',
};

const atlassianTech = {
  url: process.env.ATLASSIAN_TECH_URL || 'https://mcp.atlassian.com/v1/mcp',
  type: 'http',
};

const datadog = datadogPath ? {
  type: 'stdio',
  command: 'node',
  args: [datadogPath],
  env: {
    DATADOG_API_KEY: process.env.DATADOG_API_KEY || '',
    DATADOG_APP_KEY: process.env.DATADOG_APP_KEY || '',
  },
} : null;

if (datadog && (!process.env.DATADOG_API_KEY || !process.env.DATADOG_APP_KEY)) {
  console.warn('Warning: DATADOG_API_KEY and/or DATADOG_APP_KEY not set. Datadog MCP may not authenticate.');
}

function merge(filePath, label) {
  let data = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Warning: Could not read existing config at ${filePath}: ${err.message}`);
    }
    // Start fresh if file missing or unreadable
  }
  data.mcpServers = data.mcpServers || {};

  // Warn if existing entries will be overwritten
  const keysToWrite = ['atlassian', 'atlassian-tech'];
  if (datadog) keysToWrite.push('datadog');
  for (const key of keysToWrite) {
    if (data.mcpServers[key]) {
      console.warn(`Warning: Overwriting existing '${key}' entry in ${label} config (${filePath})`);
    }
  }

  data.mcpServers.atlassian = atlassian;
  data.mcpServers['atlassian-tech'] = atlassianTech;
  if (datadog) {
    data.mcpServers.datadog = datadog;
  }
  // Validate JSON is well-formed before writing
  const jsonContent = JSON.stringify(data, null, 2);
  JSON.parse(jsonContent); // throws if malformed
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, jsonContent, 'utf8');
  // Restrict permissions since config may contain API keys
  fs.chmodSync(filePath, 0o600);
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
