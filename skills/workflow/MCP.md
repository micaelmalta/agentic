# Workflow MCP Integration

This document describes how to use MCP (Model Context Protocol) servers with the workflow skill. For phase details, see [PHASES.md](PHASES.md).

## Contents

- [Setup](#setup)
- [Available MCP Servers](#available-mcp-servers)
- [Integration Points](#integration-points)
- [Atlassian MCP](#atlassian-mcp)
- [Datadog MCP](#datadog-mcp)
- [Playwright MCP](#playwright-mcp)

---

## Setup

Before using MCP servers in the workflow, run `/setup` to configure them:

| Command  | Purpose                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/setup` | Configure Atlassian (`atlassian`, `atlassian-tech`), Datadog, and Playwright MCP for Claude or Cursor; prompt for keys and write config. |

After setup, the MCPs will be available for use in workflow phases.

---

## Available MCP Servers

| MCP                | Purpose | When to use |
| ------------------ | ------- | ----------- |
| **atlassian**      | Jira and Confluence integration | Jira: get issue details, search JQL, transitions, link to PR. Confluence: get page, search CQL, spaces. |
| **atlassian-tech** | Same capabilities as atlassian | Use when the context is tech-specific (e.g. engineering Jira/Confluence). |
| **Datadog**        | Observability (logs, metrics, monitors, traces) | Logs: search_logs, get_log_details. Metrics: query_metrics, list_metrics. Monitors: list_monitors, get_monitor_status. Traces: query_traces. |
| **Playwright**     | Browser automation for UI testing | **MANDATORY for any UI/frontend work.** Browser automation via browser_navigate, browser_click, browser_snapshot, etc. |

---

## Integration Points

### Phase 1: Plan

**Atlassian MCP:**
- Fetch Jira ticket details for context
- Search related Confluence pages for documentation
- Link ticket to plan document

**Example:**
```
# If Jira ticket key is provided (e.g., PROJ-123)
mcp__jira__jira_get_issue(issue_key="PROJ-123")
# Get acceptance criteria, description, comments

# Search Confluence for related docs
mcp__confluence__confluence_search(query="authentication flow", limit=5)
```

---

### Phase 2: Git Worktree Creation

**Atlassian MCP:**
- Transition Jira ticket to "In Progress" when worktree is created
- Marks work as started in project tracking

**Example:**
```
# Get available transitions
transitions = mcp__jira__jira_get_transitions(issue_key="PROJ-123")

# Find "In Progress" transition (name may vary by project)
in_progress_id = find_transition_by_name(transitions, "In Progress")

# Transition the ticket
mcp__jira__jira_transition_issue(
  issue_key="PROJ-123",
  transition_id=in_progress_id
)
```

**Note:** Transition names vary by Jira project. Common variations:
- "In Progress"
- "In progress"
- "Start Progress"
- "Begin Work"

Use fuzzy matching or search for partial matches.

---

### Phase 4: Testing

**Playwright MCP (MANDATORY for UI/frontend):**
- E2E testing via browser automation
- Visual regression testing
- Accessibility testing

**Example:**
```
# Navigate to page
mcp__playwright__browser_navigate(url="http://localhost:3000/login")

# Take snapshot for reference
snapshot = mcp__playwright__browser_snapshot()

# Interact with UI
mcp__playwright__browser_fill_form(fields=[
  {"name": "username", "type": "textbox", "ref": "[ref]", "value": "test@example.com"},
  {"name": "password", "type": "textbox", "ref": "[ref]", "value": "password123"}
])

mcp__playwright__browser_click(ref="[login-button-ref]", element="Login button")

# Verify result
result_snapshot = mcp__playwright__browser_snapshot()
# Check for success indicators
```

**When to use:**
- All UI/frontend work REQUIRES Playwright MCP for E2E tests
- User interaction flows (login, checkout, forms)
- Visual components that need verification
- Accessibility checks (via browser_snapshot showing a11y tree)

---

### Phase 7: PR Creation

**Atlassian MCP:**
- Link PR to Jira ticket
- Transition ticket to "In Code Review"
- Add PR URL to Jira ticket comments

**Example:**
```
# Create remote link from Jira to PR
mcp__jira__jira_create_remote_issue_link(
  issue_key="PROJ-123",
  url="https://github.com/org/repo/pull/456",
  title="PR #456: Add authentication"
)

# Transition to "In Code Review"
transitions = mcp__jira__jira_get_transitions(issue_key="PROJ-123")
code_review_id = find_transition_by_name(transitions, "In Code Review")

mcp__jira__jira_transition_issue(
  issue_key="PROJ-123",
  transition_id=code_review_id
)
```

**Graceful degradation:** If Atlassian MCP is not configured, the PR is still created and Jira steps are skipped.

---

### Phase 8: Monitor & Summarize

**Datadog MCP:**
- Check logs for errors after deployment
- Monitor metrics for performance regressions
- Verify alerts are not triggered

**Example:**
```
# Search for errors in logs
logs = mcp__datadog__search_logs(
  query="service:api status:error @deployment_version:latest",
  from_time="-1h"
)

# Check key metrics
metrics = mcp__datadog__query_metrics(
  query="avg:api.request.duration{service:api}",
  from_time="-1h"
)

# Check monitor status
monitors = mcp__datadog__list_monitors(
  query="tag:service:api",
  group_states=["alert", "warn"]
)
```

**Documentation skill with Confluence:**
- Update Confluence pages with new features
- Add runbooks for operational procedures
- Document architecture decisions

**Example:**
```
# Get page to update
page = mcp__confluence__confluence_get_page(
  title="API Documentation",
  space_key="ENG"
)

# Update with new endpoint docs
mcp__confluence__confluence_update_page(
  page_id=page["id"],
  title="API Documentation",
  content="[Updated markdown content with new endpoints]"
)
```

---

## Atlassian MCP

### Server Names

- **atlassian**: General Jira and Confluence access
- **atlassian-tech**: Tech-specific Jira and Confluence (use for engineering contexts)

### Common Tools

**Jira:**
- `mcp__jira__jira_get_issue` - Get issue details
- `mcp__jira__jira_search` - Search issues with JQL
- `mcp__jira__jira_get_transitions` - Get available status transitions
- `mcp__jira__jira_transition_issue` - Change issue status
- `mcp__jira__jira_create_remote_issue_link` - Link external URL (like PR)
- `mcp__jira__jira_add_comment` - Add comment to issue

**Confluence:**
- `mcp__confluence__confluence_get_page` - Get page by ID or title
- `mcp__confluence__confluence_search` - Search pages with CQL
- `mcp__confluence__confluence_update_page` - Update existing page
- `mcp__confluence__confluence_create_page` - Create new page

---

## Datadog MCP

### Common Tools

**Logs:**
- `mcp__datadog__search_logs` - Search logs with query
- `mcp__datadog__get_log_details` - Get detailed log entry

**Metrics:**
- `mcp__datadog__query_metrics` - Query time-series metrics
- `mcp__datadog__list_metrics` - List available metrics

**Monitors:**
- `mcp__datadog__list_monitors` - List monitors with optional filters
- `mcp__datadog__get_monitor_status` - Get monitor status and history

**Traces:**
- `mcp__datadog__query_traces` - Query distributed traces

### Use Cases

- **Debugging (Phase 8):** Search logs for errors, query traces for performance issues
- **CI/CD:** Monitor build and deploy metrics, check for alerts
- **Performance:** Track latency, throughput, error rates after deployment

---

## Playwright MCP

### Common Tools

**Navigation:**
- `mcp__playwright__browser_navigate` - Navigate to URL
- `mcp__playwright__browser_navigate_back` - Go back in history

**Interaction:**
- `mcp__playwright__browser_click` - Click element
- `mcp__playwright__browser_type` - Type text into input
- `mcp__playwright__browser_fill_form` - Fill multiple form fields
- `mcp__playwright__browser_select_option` - Select dropdown option
- `mcp__playwright__browser_hover` - Hover over element

**Inspection:**
- `mcp__playwright__browser_snapshot` - Get accessibility tree snapshot
- `mcp__playwright__browser_take_screenshot` - Take visual screenshot
- `mcp__playwright__browser_console_messages` - Get console logs
- `mcp__playwright__browser_network_requests` - Get network activity

**Waiting:**
- `mcp__playwright__browser_wait_for` - Wait for text or time

### Use Cases

- **E2E Testing (Phase 4):** Test user flows end-to-end
- **Visual Testing:** Take screenshots for comparison
- **Accessibility:** Verify a11y tree structure
- **Integration Testing:** Test UI + API interactions

---

## Skills That Use MCP

| Skill | MCP Integration |
|-------|----------------|
| **workflow** | Jira/Confluence in Phase 1 (plan) and Phase 7 (PR); Jira transitions: In Progress at Phase 2, In Code Review at Phase 7; Playwright MANDATORY for UI testing in Phase 4 |
| **ci-cd** | Datadog for monitoring/observability |
| **debugging** | Datadog logs/traces |
| **documentation** | Confluence for docs |
| **testing** | Playwright for UI tests (MANDATORY if UI exists) |

---

## Troubleshooting

### MCP Server Not Available

**Error:** "MCP server not found" or "Tool not found"

**Solution:**
1. Run `/setup` to configure the MCP server
2. Check API keys are correctly set in config file:
   - Cursor: `~/.cursor/mcp.json`
   - Claude Code: `~/.claude.json`
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Restart Claude Code or Cursor after configuration

### Jira Transition Not Found

**Error:** Transition name doesn't match available transitions

**Solution:**
1. Use `jira_get_transitions` to see all available transitions
2. Transition names vary by project ("In Progress" vs "In progress")
3. Use fuzzy matching or partial matching for common variations

### Playwright Tests Failing

**Error:** Browser automation fails or times out

**Solution:**
1. Ensure browser is installed: Use `mcp__playwright__browser_install`
2. Check if local dev server is running (for localhost URLs)
3. Increase timeout for slow pages
4. Use `browser_wait_for` to wait for page load indicators

---

## Best Practices

1. **Graceful Degradation:** Workflows should continue even if MCP is unavailable (except Playwright for UI projects)
2. **Error Handling:** Catch MCP errors and provide fallback behavior or user notification
3. **Fuzzy Matching:** Use flexible matching for Jira transition names (varies by project)
4. **Playwright for UI:** ALWAYS use Playwright MCP for E2E testing when UI exists
5. **Documentation:** Use Confluence MCP to keep docs in sync with code changes
