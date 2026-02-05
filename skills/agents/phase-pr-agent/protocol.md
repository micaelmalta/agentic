# Phase PR Agent - Protocol Specification

**Version:** 1.0
**Last Updated:** 2026-02-05

---

## Overview

This document defines the input/output protocol for the phase-pr-agent. All inputs and outputs follow strict JSON schemas to ensure type safety and clear contracts.

---

## Input Schema (JSON)

### Full Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["branch", "title", "description", "working_directory"],
  "properties": {
    "branch": {
      "type": "string",
      "minLength": 1,
      "description": "Feature branch name to create PR from",
      "example": "feature/add-login"
    },
    "base_branch": {
      "type": "string",
      "default": "main",
      "description": "Target branch for the pull request",
      "example": "develop"
    },
    "title": {
      "type": "string",
      "minLength": 5,
      "description": "Pull request title",
      "example": "feat: Add user login feature"
    },
    "description": {
      "type": "string",
      "minLength": 10,
      "description": "Pull request body/description (supports Markdown)",
      "example": "## Summary\n- Added login form\n- Implemented authentication\n\n## Test Plan\n- Tested login flow"
    },
    "jira_key": {
      "type": ["string", "null"],
      "default": null,
      "pattern": "^[A-Z]+-[0-9]+$",
      "description": "Jira issue key to link (e.g., PROJ-123)",
      "example": "PROJ-123"
    },
    "mark_ready": {
      "type": "boolean",
      "default": false,
      "description": "Whether to mark PR ready for review immediately",
      "example": false
    },
    "draft": {
      "type": "boolean",
      "default": true,
      "description": "Whether to create PR as draft",
      "example": true
    },
    "working_directory": {
      "type": "string",
      "minLength": 1,
      "description": "Absolute path to git repository",
      "example": "/Users/user/project"
    }
  }
}
```

### Input Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| `branch` | Non-empty string, not equal to base_branch | "Branch name is required and must differ from base branch" |
| `base_branch` | Non-empty string | "Base branch name is required" |
| `title` | Min 5 characters | "PR title must be at least 5 characters" |
| `description` | Min 10 characters | "PR description must be at least 10 characters" |
| `jira_key` | Match pattern or null | "Jira key must match format: PROJECT-123" |
| `mark_ready` | Boolean | "mark_ready must be true or false" |
| `draft` | Boolean | "draft must be true or false" |
| `working_directory` | Absolute path, directory exists | "Working directory must be valid absolute path" |

### Input Examples

#### Minimal Input (No Jira)

```json
{
  "branch": "feature/add-api-endpoint",
  "title": "feat: Add new API endpoint for user data",
  "description": "## Summary\nAdded /api/users endpoint\n\n## Changes\n- New endpoint\n- Tests added",
  "working_directory": "/Users/user/myproject"
}
```

#### Full Input (With Jira)

```json
{
  "branch": "feature/PROJ-456-refactor-auth",
  "base_branch": "develop",
  "title": "refactor(PROJ-456): Improve authentication flow",
  "description": "## Summary\nImplements PROJ-456\n\n## Changes\n- Refactored auth service\n- Added token refresh\n- Updated tests\n\n## Test Plan\n- Unit tests pass\n- Integration tests pass\n- Manual testing complete",
  "jira_key": "PROJ-456",
  "mark_ready": true,
  "draft": false,
  "working_directory": "/Users/user/myproject"
}
```

#### Edge Case: Long Description

```json
{
  "branch": "feature/comprehensive-feature",
  "title": "feat: Implement comprehensive user management",
  "description": "## Summary\n\nThis PR implements a complete user management system with the following features:\n\n### Features\n- User registration\n- Email verification\n- Password reset\n- Profile management\n- Role-based access control\n\n### Technical Details\n- Uses bcrypt for password hashing\n- JWT for authentication\n- Redis for session management\n\n### Test Coverage\n- Unit tests: 95%\n- Integration tests: 85%\n- E2E tests: 70%\n\n### Screenshots\n![Login](./screenshots/login.png)\n![Dashboard](./screenshots/dashboard.png)\n\n### Breaking Changes\nNone\n\n### Migration Notes\nRun migrations before deploying:\n```bash\nnpm run migrate\n```",
  "working_directory": "/Users/user/myproject"
}
```

---

## Output Schema (JSON)

### Full Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["status", "execution_time_ms", "pr_url", "pr_number", "jira_status", "marked_ready", "errors"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "failed"],
      "description": "Overall operation status"
    },
    "execution_time_ms": {
      "type": "number",
      "minimum": 0,
      "description": "Total execution time in milliseconds"
    },
    "pr_url": {
      "type": ["string", "null"],
      "format": "uri",
      "description": "GitHub pull request URL (null if creation failed)"
    },
    "pr_number": {
      "type": ["number", "null"],
      "minimum": 1,
      "description": "GitHub pull request number (null if creation failed)"
    },
    "jira_status": {
      "type": "object",
      "required": ["linked", "transitioned", "current_state"],
      "properties": {
        "linked": {
          "type": "boolean",
          "description": "Whether PR was successfully linked to Jira issue"
        },
        "transitioned": {
          "type": "boolean",
          "description": "Whether Jira issue was transitioned to code review state"
        },
        "current_state": {
          "type": ["string", "null"],
          "description": "Current Jira issue status after transition"
        },
        "error": {
          "type": "string",
          "description": "Error message if Jira integration failed (optional)"
        }
      }
    },
    "marked_ready": {
      "type": "boolean",
      "description": "Whether PR was marked ready for review"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "message"],
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "validation_error",
              "branch_not_found",
              "pr_creation_failed",
              "jira_not_configured",
              "jira_authentication_failed",
              "jira_issue_not_found",
              "jira_link_failed",
              "jira_transition_failed",
              "jira_transition_ambiguous",
              "mark_ready_failed",
              "git_push_failed",
              "unknown_error"
            ],
            "description": "Error type category"
          },
          "message": {
            "type": "string",
            "description": "Human-readable error message"
          },
          "context": {
            "type": "object",
            "description": "Additional error context (optional)",
            "properties": {
              "branch": {"type": "string"},
              "jira_key": {"type": "string"},
              "available_transitions": {"type": "array"},
              "error_output": {"type": "string"}
            }
          }
        }
      },
      "description": "List of errors or warnings (empty if no issues)"
    }
  }
}
```

### Output Examples

#### Success - PR Only (No Jira)

```json
{
  "status": "success",
  "execution_time_ms": 1823,
  "pr_url": "https://github.com/myorg/myrepo/pull/42",
  "pr_number": 42,
  "jira_status": {
    "linked": false,
    "transitioned": false,
    "current_state": null
  },
  "marked_ready": false,
  "errors": []
}
```

#### Success - PR with Jira Integration

```json
{
  "status": "success",
  "execution_time_ms": 3542,
  "pr_url": "https://github.com/myorg/myrepo/pull/43",
  "pr_number": 43,
  "jira_status": {
    "linked": true,
    "transitioned": true,
    "current_state": "In Code Review"
  },
  "marked_ready": true,
  "errors": []
}
```

#### Partial Success - Jira Transition Failed

```json
{
  "status": "success",
  "execution_time_ms": 2934,
  "pr_url": "https://github.com/myorg/myrepo/pull/44",
  "pr_number": 44,
  "jira_status": {
    "linked": true,
    "transitioned": false,
    "current_state": "In Progress",
    "error": "No transition found matching 'Code Review' pattern"
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "jira_transition_failed",
      "message": "Could not transition PROJ-123 to Code Review state",
      "context": {
        "jira_key": "PROJ-123",
        "available_transitions": ["Done", "In Progress", "Blocked"]
      }
    }
  ]
}
```

#### Partial Success - Jira Not Configured

```json
{
  "status": "success",
  "execution_time_ms": 1654,
  "pr_url": "https://github.com/myorg/myrepo/pull/45",
  "pr_number": 45,
  "jira_status": {
    "linked": false,
    "transitioned": false,
    "current_state": null,
    "error": "Atlassian MCP not configured"
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "jira_not_configured",
      "message": "Jira integration skipped: Atlassian MCP tools not available. Configure MCP to enable Jira integration.",
      "context": {}
    }
  ]
}
```

#### Failure - Branch Not Found

```json
{
  "status": "failed",
  "execution_time_ms": 423,
  "pr_url": null,
  "pr_number": null,
  "jira_status": {
    "linked": false,
    "transitioned": false,
    "current_state": null
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "branch_not_found",
      "message": "Branch 'feature/nonexistent' does not exist locally or remotely",
      "context": {
        "branch": "feature/nonexistent",
        "error_output": "error: pathspec 'feature/nonexistent' did not match any file(s) known to git"
      }
    }
  ]
}
```

#### Failure - PR Creation Failed

```json
{
  "status": "failed",
  "execution_time_ms": 1245,
  "pr_url": null,
  "pr_number": null,
  "jira_status": {
    "linked": false,
    "transitioned": false,
    "current_state": null
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "pr_creation_failed",
      "message": "Failed to create pull request: A pull request for branch 'feature/add-login' already exists",
      "context": {
        "branch": "feature/add-login",
        "error_output": "GraphQL: A pull request for branch 'feature/add-login' already exists (createPullRequest)"
      }
    }
  ]
}
```

#### Failure - Validation Error

```json
{
  "status": "failed",
  "execution_time_ms": 12,
  "pr_url": null,
  "pr_number": null,
  "jira_status": {
    "linked": false,
    "transitioned": false,
    "current_state": null
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "validation_error",
      "message": "PR title must be at least 5 characters",
      "context": {
        "field": "title",
        "value": "Fix"
      }
    }
  ]
}
```

#### Failure - Jira Issue Not Found

```json
{
  "status": "success",
  "execution_time_ms": 2123,
  "pr_url": "https://github.com/myorg/myrepo/pull/46",
  "pr_number": 46,
  "jira_status": {
    "linked": false,
    "transitioned": false,
    "current_state": null,
    "error": "Jira issue PROJ-999 not found"
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "jira_issue_not_found",
      "message": "Jira issue PROJ-999 does not exist or you don't have permission to view it",
      "context": {
        "jira_key": "PROJ-999"
      }
    }
  ]
}
```

---

## Error Types Reference

| Error Type | Severity | Recovery | User Action |
|------------|----------|----------|-------------|
| `validation_error` | High | None | Fix input parameters |
| `branch_not_found` | High | None | Verify branch name, ensure branch exists |
| `pr_creation_failed` | High | Retry (3x) | Check GitHub auth, network, branch status |
| `jira_not_configured` | Low | None | Configure Atlassian MCP or ignore |
| `jira_authentication_failed` | Medium | None | Check Jira credentials in MCP config |
| `jira_issue_not_found` | Medium | None | Verify Jira key, check permissions |
| `jira_link_failed` | Low | Retry (2x) | Check Jira API, network connectivity |
| `jira_transition_failed` | Low | None | Check Jira workflow, permissions |
| `jira_transition_ambiguous` | Low | User input | Select correct transition from list |
| `mark_ready_failed` | Low | Retry (2x) | Manually mark ready via GitHub UI |
| `git_push_failed` | Medium | Retry (3x) | Check network, remote repository access |
| `unknown_error` | High | None | Review logs, contact support |

---

## Status Codes

| Status | Meaning | PR Created | Jira Status | Next Steps |
|--------|---------|------------|-------------|------------|
| `success` | All operations succeeded | Yes | Linked & transitioned (if requested) | Continue workflow |
| `success` | PR created, Jira partially failed | Yes | Linked OR transitioned (partial) | Review errors, continue workflow |
| `success` | PR created, Jira skipped | Yes | Not attempted | Continue workflow |
| `failed` | PR creation failed | No | Not attempted | Fix errors, retry agent |
| `failed` | Validation failed | No | Not attempted | Fix input, retry agent |

---

## Jira Integration Details

### Transition Matching Logic

The agent uses fuzzy matching to find the appropriate Jira transition:

1. **Exact match:** "In Code Review" or "Code Review"
2. **Case-insensitive:** "in code review", "CODE REVIEW"
3. **Partial match:** "Ready for Code Review", "Code Review Started"
4. **Acronym match:** "CR", "ICR" (if configured)

**Priority Order:**
1. Exact match (highest priority)
2. Case-insensitive exact match
3. Contains "code review" (case-insensitive)
4. Contains "review" (case-insensitive)

**Ambiguity Handling:**
- If multiple transitions match, agent asks user to select
- User is shown numbered list of matching transitions
- Agent proceeds with user's selection

### Jira Link Format

The agent adds a comment to the Jira issue:

```markdown
Pull Request: https://github.com/org/repo/pull/42
```

This creates a clickable link in Jira that navigates to the GitHub PR.

**Alternative:** If `mcp__atlassian__jira_create_remote_issue_link` is available, the agent will use that instead for better integration (shows PR in Jira's "Links" section).

---

## Agent Invocation Examples

### Via Workflow Skill

```python
# Pseudo-code showing how workflow skill invokes agent

# Prepare inputs
agent_input = {
    "branch": current_branch,
    "base_branch": "main",
    "title": pr_title,  # Generated or user-provided
    "description": pr_description,  # Generated from plan + changes
    "jira_key": extract_jira_key(branch_name) or plan_jira_key,
    "mark_ready": False,  # User decides after review
    "working_directory": os.getcwd()
}

# Spawn agent in background
result = spawn_agent("phase-pr-agent", agent_input, background=True)

# Wait for completion
output = wait_for_agent(result)

# Handle output
if output["status"] == "success":
    print(f"✅ PR created: {output['pr_url']}")

    if output["jira_status"]["transitioned"]:
        print(f"✅ Jira {agent_input['jira_key']} → {output['jira_status']['current_state']}")
    elif output["jira_status"]["linked"]:
        print(f"⚠️  PR linked to Jira but transition failed")
        print(f"   Error: {output['jira_status']['error']}")

    if output["errors"]:
        print("⚠️  Warnings:")
        for error in output["errors"]:
            print(f"   - {error['message']}")
else:
    print(f"❌ Failed to create PR")
    for error in output["errors"]:
        print(f"   - {error['message']}")
```

### Via Task Tool (Direct Invocation)

```yaml
# Using Claude Code Task tool
task_name: "Create PR for feature branch"
task_type: "general-purpose"
instructions: |
  Use the phase-pr-agent to create a pull request:

  Input:
  {
    "branch": "feature/add-login",
    "title": "feat: Add user login feature",
    "description": "## Summary\n- Login form\n- Auth flow\n\n## Test Plan\n- Manual testing done",
    "jira_key": "PROJ-123",
    "working_directory": "/Users/user/myproject"
  }

  Expected output: JSON with pr_url and jira_status
```

---

## Version History

### v1.0 (2026-02-05)
- Initial protocol specification
- Input/output JSON schemas
- Error type definitions
- Jira integration protocol
- Validation rules
- Usage examples

---

## See Also

- **Agent Specification:** `phase-pr-agent/AGENT.md` - Full agent documentation
- **Workflow Integration:** `skills/workflow/SKILL.md` - Phase 7 details
- **Atlassian MCP Setup:** `skills/setup/SKILL.md` - Jira configuration

---

**Protocol Version:** 1.0
**Schema Compatibility:** JSON Schema Draft 07
