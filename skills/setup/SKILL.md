---
name: setup
description: "Configure MCP (Model Context Protocol) servers for Claude or Cursor. Use when the user runs /setup, wants to add Atlassian, Datadog, or Playwright MCP, or set up API keys for MCP connections."
triggers:
  - "/setup"
  - "setup MCP"
  - "configure Atlassian MCP"
  - "configure Datadog MCP"
  - "configure Playwright MCP"
  - "add MCP servers"
  - "connect to Atlassian"
  - "connect to Datadog"
  - "setup Playwright"
---

# Setup Skill (MCP Configuration)

## Core Philosophy

Configure **Atlassian** (two servers: `atlassian`, `atlassian-tech`), **Datadog**, and **Playwright** MCP servers for **Claude** or **Cursor** so the agent can use Jira, Confluence, Datadog (logs, metrics, monitors), and browser automation for UI testing during workflows.

## Official MCP docs

For full MCP management (add, remove, list, auth, scopes), use the official docs:

| Client                   | Docs                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Claude** (Claude Code) | [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) — `claude mcp add/list/remove`, HTTP/stdio/SSE, scopes (local/project/user), OAuth via `/mcp`.                 |
| **Cursor**               | [Model Context Protocol (MCP)](https://cursor.com/docs/context/mcp) — `mcp.json` (project: `.cursor/mcp.json`, global: `~/.cursor/mcp.json`), stdio/HTTP/SSE, config interpolation, OAuth. |

Refer to these when the user asks how to manage MCP in general, add other servers, or troubleshoot.

---

## Protocol: /setup Flow

### 1. Initialize PARA (`/init`)

Before MCP configuration, **run /init** for PARA so the project has a consistent workflow context:

- Ensure the project has a **PARA structure**: `context/` with `context.md`, `plans/`, `summaries/`, `archives/`, `data/`, `servers/` (create any missing dirs and `context/context.md`). Note: `context/` is git-ignored so `.gitkeep` files are not needed.
- Ensure a project-level **`CLAUDE.md`** exists (create a minimal one if missing).

If the structure already exists, skip or only add missing pieces. Then proceed with MCP setup below.

### 2. Ask Target

Ask the user which client(s) to configure. Use the **official config locations**:

| Option                       | Config location                                                           | Notes                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Cursor**                   | `~/.cursor/mcp.json`                                                      | [Cursor MCP docs](https://cursor.com/docs/context/mcp)                                                    |
| **Claude** (Claude Code CLI) | `~/.claude.json`                                                          | [Claude Code MCP docs](https://code.claude.com/docs/en/mcp); use `claude mcp add` or merge into this file |
| **Claude Desktop** (app)     | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) | Set `CLAUDE_DESKTOP=1` when running the setup script                                                      |
| **Both**                     | Cursor + Claude Code paths                                                | Write to both `~/.cursor/mcp.json` and `~/.claude.json`                                                   |

If the user doesn’t specify, offer **Cursor** and **Claude** and default to **both** (Cursor + Claude Code) unless they say otherwise.

### 3. Ask for Keys (Do Not Store in Repo)

Prompt for credentials. Prefer environment variables for security; accept one-time input if the user prefers.

**Datadog (required for Datadog MCP):**

- **DATADOG_API_KEY** – from [Datadog API Keys](https://app.datadoghq.com/organization-settings/api-keys)
- **DATADOG_APP_KEY** – from [Datadog Application Keys](https://app.datadoghq.com/organization-settings/application-keys)

**Atlassian (optional):**

- **ATLASSIAN_API_TOKEN** – from [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens) (for API-token auth; some setups use OAuth in browser instead)
- **ATLASSIAN_EMAIL** – Atlassian account email (if using API token)

**Playwright (no keys required):**

- No API keys needed – Playwright MCP runs locally via npx
- Optional: `--headless` flag for headless mode (useful in CI)
- Optional: `--browser` flag to specify browser (chrome, firefox, webkit, msedge)

If the user already has Cursor MCP configured (e.g. OAuth for Atlassian), keep existing `mcpServers` and only add or update **atlassian**, **datadog**, and **playwright** entries.

### 4. Paths to Use

- **Datadog MCP (stdio):** Use the user's local path for the Node server. Default from snippet:
  - `command`: `node`
  - `args`: `["<YOUR_MCP_DATADOG_PATH>/src/index.js"]`
    If the user has a different path (e.g. `MCP_DATADOG_PATH`), use that in `args`.
- **Atlassian MCP (HTTP)** – two servers:
  - **atlassian:** `url`: `https://mcp.atlassian.com/v1/mcp`, `type`: `http`
  - **atlassian-tech:** same URL by default; override with `ATLASSIAN_TECH_URL` in env when running the setup script if the tech endpoint differs
    Add `env` (e.g. `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`) only if the user provides them and the client supports env-based auth for HTTP MCP.
- **Playwright MCP (stdio):** Uses npx to run the latest version:
  - `command`: `npx`
  - `args`: `["@playwright/mcp@latest"]`
    Optional args: `--headless`, `--browser <browser>`, `--viewport-size <WxH>`, `--config <path>`

### 5. Write Config

**Cursor (`~/.cursor/mcp.json`):**

- Read existing file if present.
- Ensure top-level key `mcpServers` exists.
- Set or merge:
  - `mcpServers.atlassian`: `{ "url": "https://mcp.atlassian.com/v1/mcp", "type": "http" }` (and optional `env` if provided).
  - `mcpServers["atlassian-tech"]`: same structure; URL from `ATLASSIAN_TECH_URL` if set.
  - `mcpServers.datadog`: `{ "type": "stdio", "command": "node", "args": ["<path-to-mcp_datadog/src/index.js>"], "env": { "DATADOG_API_KEY": "<user-key>", "DATADOG_APP_KEY": "<user-app-key>" } }`.
  - `mcpServers.playwright`: `{ "command": "npx", "args": ["@playwright/mcp@latest"] }` (add `--headless` to args for CI environments).
- Write back valid JSON; preserve any other servers (e.g. `atlas`, `cursor-ide-browser`).

**Claude Code (`~/.claude.json`):**

- Same structure under `mcpServers`: add or update **atlassian**, **datadog**, and **playwright**. This is the correct config for the **Claude Code CLI** (`claude`). Preserve existing `mcpServers` and other top-level keys.

**Claude Desktop** (optional; `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

- Same structure under `mcpServers`. Use only when the user targets the **Claude Desktop app**; the setup script uses this path when `CLAUDE_DESKTOP=1` is set.

### 6. Post-Setup

- Tell the user to **restart** the client (Cursor or Claude Desktop) so MCP changes load.
- Remind them not to commit real keys to the repo; use env vars or the setup script.

---

## Setup Script (Optional)

The skill includes `skills/setup/setup_mcp.sh` and `skills/setup/setup_mcp.js`, which use the **official config locations**:

1. Read from env: `DATADOG_API_KEY`, `DATADOG_APP_KEY`, optional `MCP_DATADOG_PATH`, optional `TARGET` (cursor|claude|both), optional `CLAUDE_DESKTOP=1` for Claude Desktop app.
2. **Cursor:** merge into `~/.cursor/mcp.json` (per [Cursor MCP docs](https://cursor.com/docs/context/mcp)).
3. **Claude:** merge into `~/.claude.json` (Claude Code CLI) by default, or into `~/Library/Application Support/Claude/claude_desktop_config.json` when `CLAUDE_DESKTOP=1` (per [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)).
4. Preserve existing `mcpServers`; never log keys (keys come from env only).

**Usage:**

```bash
export DATADOG_API_KEY="your-api-key"
export DATADOG_APP_KEY="your-app-key"
export TARGET="both"   # or "cursor" or "claude"
# Optional: export CLAUDE_DESKTOP=1   # use Claude Desktop app config instead of Claude Code
./skills/setup/setup_mcp.sh
```

Run from the project root so the path to the script is correct (e.g. `./skills/setup/setup_mcp.sh` or `bash skills/setup/setup_mcp.sh`).

---

## Config Snippets (Reference)

**Quick reference:**
- **Atlassian (HTTP):** Two servers (`atlassian`, `atlassian-tech`) for Jira/Confluence
- **Datadog (stdio):** Node.js with API keys for monitoring/observability
- **Playwright (stdio):** `npx @playwright/mcp@latest` for UI testing, optional `--headless` for CI

**For complete configuration examples:** See [reference/CONFIG_EXAMPLES.md](reference/CONFIG_EXAMPLES.md), which covers:
- Full JSON configuration for each MCP server (Atlassian, Datadog, Playwright)
- Config file locations (Cursor, Claude Code, Claude Desktop)
- Advanced options (browser selection, viewport size, persistent sessions, environment variables)
- Merging with existing config (preserve existing `mcpServers` entries)
- Security best practices (use environment variables, never commit secrets)
- Troubleshooting common issues

---

## When to Use This Skill

- User runs **/setup** or asks to set up MCP.
- User wants to **add** or **reconfigure** Atlassian (atlassian, atlassian-tech), Datadog, or Playwright MCP for Claude or Cursor.
- User asks to **connect to Atlassian**, **connect to Datadog**, or **setup Playwright** in the IDE.

After setup, the **workflow**, **ci-cd**, **debugging**, **documentation**, and **testing** skills can use these MCPs (see those skills for when to call Atlassian/Datadog/Playwright tools). Use **atlassian** or **atlassian-tech** tools as appropriate (e.g. atlassian-tech for tech-specific Jira/Confluence use). Use **playwright** for UI testing and browser automation.

---

## Checklist

- [ ] Target client(s) identified (Cursor, Claude Code, Claude Desktop, or both).
- [ ] PARA structure initialized (`/init`) before MCP configuration.
- [ ] API keys collected securely (env vars preferred; never committed to repo).
- [ ] Atlassian MCP configured (atlassian and atlassian-tech servers).
- [ ] Datadog MCP configured with valid API key and app key.
- [ ] Playwright MCP configured (npx @playwright/mcp@latest).
- [ ] Existing `mcpServers` entries preserved (not overwritten).
- [ ] Config written to correct location for target client(s).
- [ ] User reminded to restart client after config changes.

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Atlassian MCP configured → use in workflow | **workflow** skill | Read `skills/workflow/SKILL.md` |
| Datadog MCP configured → use for monitoring | **ci-cd** / **debugging** skill | Read `skills/ci-cd/SKILL.md` or `skills/debugging/SKILL.md` |
| Playwright MCP configured → use for testing | **testing** skill | Read `skills/testing/SKILL.md` |
| Need to build a custom MCP server | **mcp-builder** skill | Read `skills/mcp-builder/SKILL.md` |
| MCP config needs documentation | **documentation** skill | Read `skills/documentation/SKILL.md` |
