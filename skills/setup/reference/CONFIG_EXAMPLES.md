# MCP Configuration Examples

This document provides complete configuration examples for all supported MCP servers.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol-setup-flow)

---

## Contents

- [Atlassian (HTTP)](#atlassian-http)
- [Datadog (stdio)](#datadog-stdio)
- [Playwright (stdio)](#playwright-stdio)
- [Configuration File Locations](#configuration-file-locations)

---

## Atlassian (HTTP)

Atlassian MCP provides two separate servers for different use cases:

- **atlassian:** General Jira and Confluence integration
- **atlassian-tech:** Technical/engineering-specific Jira and Confluence operations

### Configuration

```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    },
    "atlassian-tech": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    }
  }
}
```

### Custom Tech Endpoint

Override **atlassian-tech** URL with `ATLASSIAN_TECH_URL` environment variable when running the setup script if your tech endpoint differs:

```bash
export ATLASSIAN_TECH_URL="https://custom-tech-endpoint.atlassian.com/v1/mcp"
./skills/setup/setup_mcp.js
```

### Authentication

Atlassian MCP uses OAuth authentication. You'll be prompted to authenticate via browser when first using the MCP tools.

### Available Tools

**Jira tools (via atlassian or atlassian-tech):**
- `jira_search`: Search issues with JQL
- `jira_get_issue`: Get issue details
- `jira_create_issue`: Create new issue
- `jira_update_issue`: Update existing issue
- `jira_transition_issue`: Change issue status
- `jira_add_comment`: Add comment to issue
- And many more...

**Confluence tools (via atlassian or atlassian-tech):**
- `confluence_search`: Search content
- `confluence_get_page`: Get page content
- `confluence_create_page`: Create new page
- `confluence_update_page`: Update existing page
- And many more...

### When to Use Each Server

| Server | Use Case |
|--------|----------|
| **atlassian** | General product management, user story creation, documentation |
| **atlassian-tech** | Engineering tasks, technical specs, code-related tickets |

---

## Datadog (stdio)

Datadog MCP provides access to Datadog's monitoring and observability platform.

### Configuration

```json
{
  "mcpServers": {
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["<YOUR_MCP_DATADOG_PATH>/src/index.js"],
      "env": {
        "DATADOG_API_KEY": "<from-user>",
        "DATADOG_APP_KEY": "<from-user>"
      }
    }
  }
}
```

### Setup Steps

1. **Clone Datadog MCP repository:**
   ```bash
   git clone https://github.com/yourusername/mcp-datadog.git
   cd mcp-datadog
   npm install
   ```

2. **Get API keys from Datadog:**
   - Log in to Datadog
   - Navigate to Organization Settings → API Keys
   - Create API Key and Application Key
   - Save keys securely (use environment variables or password manager)

3. **Update configuration:**
   - Replace `<YOUR_MCP_DATADOG_PATH>` with absolute path to cloned repo
   - Replace `<from-user>` with your actual API keys
   - **NEVER commit real keys to version control**

4. **Test configuration:**
   ```bash
   # In IDE, test a Datadog MCP tool
   mcp__datadog__list_monitors
   ```

### Environment Variable Alternative

Instead of hardcoding keys in config, use environment variables:

```json
{
  "mcpServers": {
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-datadog/src/index.js"],
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}"
      }
    }
  }
}
```

Then set environment variables:

```bash
# Add to ~/.zshrc or ~/.bashrc
export DATADOG_API_KEY="your-api-key"
export DATADOG_APP_KEY="your-app-key"
```

### Available Tools

- `list_monitors`: List all monitors, filter by status/tags
- `get_monitor_status`: Get detailed status for specific monitor
- `query_metrics`: Query time-series metrics data
- `list_metrics`: Discover available metrics in your environment
- `get_metric_metadata`: Get units, description, and tags for a metric
- `search_logs`: Search logs with filters and time ranges
- `query_traces`: Query APM traces for a service
- `get_service_health`: Get latency, error rate, and throughput for a service

### Use Cases

- Monitor deployment impact (error rates, latency)
- Debug production issues (search logs, traces)
- Validate alerts are firing correctly
- Query metrics for performance analysis
- Check service health post-deployment

---

## Playwright (stdio)

Playwright MCP provides browser automation for UI testing and end-to-end testing.

### Basic Configuration

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Headless Mode (Recommended for CI)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless"]
    }
  }
}
```

### Advanced Configuration Options

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--headless",
        "--browser", "chrome",
        "--viewport-size", "1280x720"
      ]
    }
  }
}
```

### Available Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--browser <name>` | Specify browser | `--browser chrome` (chrome, firefox, webkit, msedge) |
| `--headless` | Run without GUI | `--headless` |
| `--viewport-size <WxH>` | Set viewport dimensions | `--viewport-size 1280x720` |
| `--user-data-dir <path>` | Persistent browser profile | `--user-data-dir ~/.playwright/profile` |
| `--isolated` | Ephemeral session mode | `--isolated` |
| `--storage-state <path>` | Load auth cookies/localStorage | `--storage-state ./auth.json` |
| `--config <path>` | JSON config file | `--config ./playwright.config.json` |

### Browser-specific Configuration

**Chrome:**
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--browser", "chrome"]
  }
}
```

**Firefox:**
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--browser", "firefox"]
  }
}
```

**WebKit (Safari):**
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--browser", "webkit"]
  }
}
```

### Persistent Sessions

Save authentication state to avoid re-logging in:

```json
{
  "playwright": {
    "command": "npx",
    "args": [
      "@playwright/mcp@latest",
      "--user-data-dir", "~/.playwright/profile",
      "--storage-state", "~/.playwright/auth.json"
    ]
  }
}
```

### Available Tools

- `browser_navigate`: Navigate to URL
- `browser_click`: Click element
- `browser_type`: Type text into input
- `browser_screenshot`: Capture screenshot
- `browser_snapshot`: Get accessibility tree snapshot
- `browser_wait_for`: Wait for conditions
- `browser_select_option`: Select dropdown option
- `browser_hover`: Hover over element
- `browser_drag`: Drag and drop
- `browser_press_key`: Press keyboard key
- `browser_fill_form`: Fill multiple form fields
- `browser_evaluate`: Run JavaScript on page

### Use Cases

- End-to-end UI testing
- Visual regression testing
- Accessibility testing
- User flow testing (login, checkout, forms)
- Cross-browser testing
- Interactive debugging of UI issues

---

## Configuration File Locations

### Cursor

```
~/.cursor/mcp.json
```

**Example full config:**
```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    },
    "atlassian-tech": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    },
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/username/mcp-datadog/src/index.js"],
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless"]
    }
  }
}
```

### Claude Code

```
~/.claude.json
```

**Example full config:**
```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    },
    "atlassian-tech": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    },
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/username/mcp-datadog/src/index.js"],
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Claude Desktop

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

(macOS only)

**Example full config:**
```json
{
  "mcpServers": {
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/mcp",
      "type": "http"
    },
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/username/mcp-datadog/src/index.js"],
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}"
      }
    }
  }
}
```

---

## Merging with Existing Config

**IMPORTANT:** Always preserve existing `mcpServers` entries when adding new ones.

**Example: Adding Datadog to existing config**

**Before:**
```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "python",
      "args": ["server.py"]
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "python",
      "args": ["server.py"]
    },
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/username/mcp-datadog/src/index.js"],
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}"
      }
    }
  }
}
```

---

## Troubleshooting

### Issue: MCP tools not available

**Solution:**
- Check config file exists at correct location
- Verify JSON syntax is valid (use `jq . < config.json`)
- Restart IDE after config changes

### Issue: Datadog authentication fails

**Solution:**
- Verify API keys are correct
- Check environment variables are set (if using)
- Ensure Datadog API keys have correct permissions

### Issue: Playwright browser fails to launch

**Solution:**
- Run `npx playwright install` to install browsers
- Check browser is specified correctly (`chrome`, `firefox`, `webkit`, `msedge`)
- Try adding `--headless` flag

### Issue: Atlassian authentication fails

**Solution:**
- Clear browser cache and re-authenticate
- Verify Atlassian account has access to Jira/Confluence
- Check network/firewall settings

---

## Security Best Practices

- ✅ **Use environment variables for secrets** (DATADOG_API_KEY, DATADOG_APP_KEY)
- ✅ **Never commit config files with real API keys**
- ✅ **Use secure password manager for API keys**
- ✅ **Rotate API keys regularly** (every 90 days recommended)
- ❌ **Never hardcode secrets in config files**
- ❌ **Never share config files with secrets in Slack/email**

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to use Atlassian MCP | **workflow** / **documentation** skill | Read respective SKILL.md files |
| Need to use Datadog MCP | **ci-cd** / **debugging** / **performance** skill | Read respective SKILL.md files |
| Need to use Playwright MCP | **testing** skill | Read `skills/testing/SKILL.md` |
| Need to build custom MCP | **mcp-builder** skill | Read `skills/mcp-builder/SKILL.md` |
