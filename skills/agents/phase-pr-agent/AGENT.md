# Agent: Phase PR Agent

**Purpose:** Create GitHub Pull Requests with automatic Jira integration and status transitions
**Background:** Yes (default mode)
**Phase:** Phase 7 (PR Creation) in workflow skill

---

## Overview

The phase-pr-agent automates the complete Pull Request creation process, including GitHub PR creation, Jira ticket linking, and Jira status transitions. This agent encapsulates the complexity of coordinating between GitHub and Jira, providing graceful degradation when Jira is unavailable or not configured.

The agent operates in background mode by default, allowing the workflow to continue while PR creation and Jira integration happen asynchronously. It handles common edge cases like missing Jira configuration, ambiguous transition states, and permission issues.

Key features:
- Creates GitHub draft PRs via gh CLI
- Automatically links PRs to Jira tickets (if Atlassian MCP configured)
- Transitions Jira tickets to "In Code Review" state
- Supports marking PRs ready for review
- Graceful error handling and user escalation

---

## Responsibilities

This agent is responsible for:

- [ ] Creating GitHub draft Pull Request with title and description
- [ ] Linking PR to Jira ticket by adding PR URL as comment
- [ ] Finding appropriate Jira transition (handles "In Code Review", "Code Review", variations)
- [ ] Transitioning Jira ticket to code review state
- [ ] Optionally marking PR ready for review immediately
- [ ] Graceful degradation if Jira unavailable (PR still created)
- [ ] Returning structured status including PR URL and Jira integration results
- [ ] User escalation if Jira transition fails or is ambiguous

---

## Input Schema

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `branch` | string | Feature branch name | `"feature/add-login"` |
| `title` | string | PR title | `"Add user login feature"` |
| `description` | string | PR body/description | `"## Summary\n- Added login form..."` |
| `working_directory` | string | Absolute path to repository | `"/Users/user/project"` |

### Optional Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `base_branch` | string | `"main"` | Target branch for PR | `"develop"` |
| `jira_key` | string | `null` | Jira ticket key to link | `"PROJ-123"` |
| `mark_ready` | boolean | `false` | Mark PR ready immediately | `true` |
| `draft` | boolean | `true` | Create as draft PR | `false` |

### Input Validation

The agent validates:
- [ ] Required parameters are present
- [ ] branch is not empty and not same as base_branch
- [ ] title is not empty (min 5 chars)
- [ ] description is not empty (min 10 chars)
- [ ] working_directory is valid absolute path
- [ ] jira_key matches pattern (e.g., "PROJ-123") if provided

**Validation Errors:** Return clear error message with missing/invalid parameter details.

---

## Execution Logic

### Step-by-Step Process

1. **Input Validation**
   - Validate required parameters
   - Apply defaults for optional parameters (base_branch="main", draft=true, mark_ready=false)
   - Verify working_directory exists and is a git repository
   - Return error if validation fails

2. **GitHub PR Creation**
   - Change to working_directory
   - Push branch to remote: `git push -u origin <branch>`
   - Create draft PR: `gh pr create --draft --title <title> --body <description> --base <base_branch> --head <branch>`
   - Capture PR URL and PR number from output
   - If PR creation fails: Return error immediately

3. **Jira Integration** (if jira_key provided)
   - Check if Atlassian MCP tools available (mcp__atlassian__ prefix)
   - If MCP not available: Skip Jira steps, note in output
   - If MCP available:
     - Get Jira issue details: `mcp__atlassian__jira_get_issue`
     - Verify issue exists and accessible
     - Add PR URL as comment: `mcp__atlassian__jira_add_comment` with text "Pull Request: <pr_url>"
     - Get available transitions: `mcp__atlassian__jira_get_transitions`
     - Find transition matching "Code Review" or "In Code Review" (case-insensitive, fuzzy match)
     - If multiple matches: Ask user which to use
     - If no matches: Note in output, do not fail
     - Execute transition: `mcp__atlassian__jira_transition_issue`
     - Record current state after transition

4. **Mark PR Ready** (if mark_ready=true)
   - Execute: `gh pr ready <pr_number>`
   - Record result

5. **Result Consolidation**
   - Collect all outputs (PR status, Jira status, errors)
   - Format as structured JSON
   - Return to caller

### Retry Strategy

| Condition | Action | Max Retries |
|-----------|--------|-------------|
| Git push fails (network) | Retry with 5s backoff | 3 |
| PR creation fails (rate limit) | Retry with 10s backoff | 3 |
| Jira API timeout | Retry with 5s backoff | 2 |
| Jira transition fails (permissions) | Ask user, no retry | 0 |
| Ambiguous Jira transition | Ask user, no retry | 0 |

---

## Output Schema

### Success Response

```json
{
  "status": "pass",
  "execution_time_ms": 2500,
  "retry_count": 0,
  "pr_url": "https://github.com/org/repo/pull/42",
  "pr_number": 42,
  "jira_status": {
    "linked": true,
    "transitioned": true,
    "current_state": "In Code Review"
  },
  "marked_ready": false,
  "errors": []
}
```

### Partial Success Response (PR created, Jira failed)

```json
{
  "status": "pass",
  "execution_time_ms": 3000,
  "retry_count": 0,
  "pr_url": "https://github.com/org/repo/pull/42",
  "pr_number": 42,
  "jira_status": {
    "linked": true,
    "transitioned": false,
    "current_state": "In Progress",
    "error": "No transition found matching 'Code Review'"
  },
  "marked_ready": false,
  "errors": [
    {
      "type": "jira_transition_failed",
      "message": "Could not transition to Code Review state",
      "context": {
        "jira_key": "PROJ-123",
        "available_transitions": ["Done", "In Progress"]
      }
    }
  ]
}
```

### Failure Response

```json
{
  "status": "fail",
  "execution_time_ms": 1000,
  "retry_count": 0,
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
      "message": "Failed to create PR: branch not found",
      "context": {
        "branch": "feature/missing",
        "error_output": "error: pathspec 'feature/missing' did not match any file(s) known to git"
      }
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"pass"` or `"fail"` |
| `execution_time_ms` | integer | Total execution time in milliseconds |
| `retry_count` | integer | Number of retry attempts made (0 if all operations succeeded on first try) |
| `pr_url` | string/null | GitHub PR URL (null if creation failed) |
| `pr_number` | number/null | PR number (null if creation failed) |
| `jira_status` | object | Jira integration status |
| `jira_status.linked` | boolean | Whether PR was linked to Jira |
| `jira_status.transitioned` | boolean | Whether Jira ticket was transitioned |
| `jira_status.current_state` | string/null | Current Jira issue status |
| `jira_status.error` | string | Error message if Jira failed (optional) |
| `marked_ready` | boolean | Whether PR was marked ready for review |
| `errors` | array | List of errors/warnings (empty if no issues) |

---

## Error Handling

### Recoverable Errors

Errors that trigger retry logic:
- **Git push network failure**: Retry with 5s backoff, max 3 attempts
- **PR creation rate limit**: Retry with 10s backoff, max 3 attempts
- **Jira API timeout**: Retry with 5s backoff, max 2 attempts

### Non-Recoverable Errors

Errors that stop immediately (but may still return partial success):
- **Branch does not exist**: Return fail with clear message
- **GitHub authentication failure**: Return fail with instructions
- **Jira authentication failure**: Skip Jira, return success with PR only
- **Invalid Jira key format**: Skip Jira, return success with PR only

### User Escalation

Escalate to user when:
- Multiple Jira transitions match "Code Review" pattern
- Jira transition fails due to workflow permissions
- Unclear error from GitHub or Jira APIs
- Max retries exceeded for recoverable errors

**Escalation Method:** Present clear question with options:
- For ambiguous transitions: Show available transitions, ask user to select
- For permission issues: Explain error, ask if should skip Jira integration
- For other failures: Present error, ask retry or continue without Jira

---

## Usage Examples

### Example 1: Basic PR Creation (No Jira)

```yaml
# Input
branch: "feature/add-login"
base_branch: "main"
title: "feat: Add user login feature"
description: |
  ## Summary
  - Added login form component
  - Implemented authentication flow
  - Added unit tests

  ## Test Plan
  - Tested login with valid credentials
  - Tested error handling
working_directory: "/Users/user/project"
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 1500,
  "pr_url": "https://github.com/org/repo/pull/42",
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

### Example 2: PR with Jira Integration

```yaml
# Input
branch: "feature/PROJ-123-add-login"
base_branch: "main"
title: "feat(PROJ-123): Add user login feature"
description: |
  ## Summary
  Implements PROJ-123
  - Added login form component
  - Implemented authentication flow

  ## Test Plan
  - Manual testing complete
  - Unit tests passing
jira_key: "PROJ-123"
mark_ready: true
working_directory: "/Users/user/project"
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 3200,
  "pr_url": "https://github.com/org/repo/pull/43",
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

### Example 3: Failure Case (Branch Not Found)

```yaml
# Input
branch: "feature/nonexistent"
base_branch: "main"
title: "Test PR"
description: "Test description"
working_directory: "/Users/user/project"
```

```json
// Output
{
  "status": "fail",
  "execution_time_ms": 500,
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
        "git_error": "error: pathspec 'feature/nonexistent' did not match any file(s) known to git"
      }
    }
  ]
}
```

### Example 4: Jira Transition Ambiguous (User Escalation)

```yaml
# Input
branch: "feature/PROJ-456-refactor"
base_branch: "main"
title: "refactor: Improve API structure"
description: "Refactoring API for better maintainability"
jira_key: "PROJ-456"
working_directory: "/Users/user/project"
```

```json
// Agent asks user (before returning output):
// "Multiple transitions match 'Code Review':
// 1. Code Review
// 2. In Code Review
// 3. Ready for Code Review
// Which transition should I use? [1-3]"

// After user selects option 2:
{
  "status": "pass",
  "execution_time_ms": 4000,
  "pr_url": "https://github.com/org/repo/pull/44",
  "pr_number": 44,
  "jira_status": {
    "linked": true,
    "transitioned": true,
    "current_state": "In Code Review"
  },
  "marked_ready": false,
  "errors": []
}
```

---

## Integration with Workflow

### When Agent is Invoked

The workflow skill spawns this agent at:
- **Phase 7: Create GitHub PR**
- Condition: After validation passes (Phase 5) and code is committed (Phase 6)
- Mode: Background (default)

### Expected Workflow

```
1. Workflow Phase 6 (Commit) completes
2. Workflow prepares PR details (title, description, Jira key from plan/context)
3. Workflow spawns phase-pr-agent in background with parameters
4. Agent pushes branch to remote
5. Agent creates draft PR via gh CLI
6. If Jira key provided and MCP available:
   a. Agent links PR to Jira ticket
   b. Agent transitions Jira to "Code Review"
7. If mark_ready=true, agent marks PR ready
8. Agent returns results to workflow
9. Workflow displays PR URL to user
10. If errors in Jira: Workflow notes issues but continues (PR still created)
```

### Workflow Integration Example

```yaml
# Workflow Phase 7: Create PR
phase: 7
phase_name: "Create GitHub PR"
agent: "phase-pr-agent"
mode: "background"

# Workflow prepares inputs
inputs:
  branch: <current_branch_from_git>
  base_branch: "main"
  title: <from_plan_or_user>
  description: <generated_from_changes_and_plan>
  jira_key: <extracted_from_branch_or_plan>
  mark_ready: false  # User decides later
  working_directory: <cwd>

# Workflow spawns agent
agent_task = spawn_agent("phase-pr-agent", inputs)

# Workflow waits for result
result = wait_for_agent(agent_task)

# Workflow handles result
if result.status == "pass":
  display_success(f"PR created: {result.pr_url}")
  if result.jira_status.transitioned:
    display_info(f"Jira {jira_key} moved to {result.jira_status.current_state}")
  else:
    display_warning("PR created but Jira integration failed")
    display_errors(result.errors)

  # Ask user if want to mark ready now
  if not result.marked_ready and ask_user("Mark PR ready for review?"):
    run_gh_pr_ready(result.pr_number)
else:
  display_error("Failed to create PR")
  display_errors(result.errors)
  escalate_to_user()
```

---

## Testing

### Unit Tests

Test cases to implement:

1. **Happy Path - PR Only**
   - Input: Valid parameters without jira_key
   - Expected: Status = success, PR created, jira_status all false

2. **Happy Path - PR with Jira**
   - Input: Valid parameters with jira_key, MCP available
   - Expected: Status = success, PR created, Jira linked and transitioned

3. **Happy Path - Mark Ready**
   - Input: Valid parameters with mark_ready=true
   - Expected: Status = success, PR created and marked ready

4. **Partial Success - Jira Unavailable**
   - Input: Valid parameters with jira_key, MCP not available
   - Expected: Status = success, PR created, jira_status all false, warning in errors

5. **Partial Success - Jira Transition Failed**
   - Input: Valid parameters with jira_key, no matching transition
   - Expected: Status = success, PR created, linked=true, transitioned=false, error noted

6. **Failure - Branch Not Found**
   - Input: Valid parameters with nonexistent branch
   - Expected: Status = failed, no PR, clear error

7. **Failure - Invalid Working Directory**
   - Input: Invalid working_directory path
   - Expected: Status = failed, validation error

8. **Failure - Empty Title**
   - Input: Empty title
   - Expected: Status = failed, validation error

9. **Retry - Git Push Network Failure**
   - Input: Valid parameters, simulate network failure then success
   - Expected: Status = success after retry

10. **User Escalation - Ambiguous Transition**
    - Input: Valid parameters, multiple matching transitions
    - Expected: Agent asks user, then continues based on selection

### Integration Tests

Test with real workflow:

1. Run agent standalone with sample repository
2. Run agent as part of full workflow (Phase 7)
3. Test with Atlassian MCP configured
4. Test without Atlassian MCP configured
5. Test error handling and graceful degradation
6. Test user escalation scenarios
7. Test background execution mode

---

## Performance Considerations

- **Execution Time:** Expected range 2-5 seconds (without Jira), 3-7 seconds (with Jira)
- **Background Mode:** Recommended (default) since PR creation is IO-bound
- **Resource Usage:**
  - Minimal CPU (mostly waiting on GitHub/Jira APIs)
  - Network: 3-5 HTTP requests (GitHub) + 2-4 requests (Jira)
  - Memory: < 50MB
- **Timeout:** Default 30 seconds, configurable

---

## Dependencies

### Required Tools

- [ ] Bash - For executing git and gh commands
- [ ] Read - For reading git config (optional)

### Required External Tools

- [ ] git - Version control operations
- [ ] gh - GitHub CLI (must be authenticated)

### Optional MCP Tools

- [ ] mcp__atlassian__jira_get_issue - Get Jira issue details
- [ ] mcp__atlassian__jira_add_comment - Add PR link to Jira
- [ ] mcp__atlassian__jira_get_transitions - Get available transitions
- [ ] mcp__atlassian__jira_transition_issue - Transition Jira issue

---

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub authentication token | Yes (gh CLI) | N/A |
| `GH_TOKEN` | Alternative GitHub token | No | N/A |

### Project Files

Agent may read these files:
- `.git/config` - Git remote URLs and branch tracking
- `gh` CLI config - GitHub authentication state

---

## Troubleshooting

### Common Issues

**Issue 1: "gh: command not found"**
- Symptoms: Agent returns error "gh CLI not available"
- Cause: GitHub CLI not installed or not in PATH
- Solution: Install gh CLI via `brew install gh` (macOS) or see https://cli.github.com/

**Issue 2: "gh: authentication required"**
- Symptoms: PR creation fails with auth error
- Cause: gh CLI not authenticated
- Solution: Run `gh auth login` and follow prompts

**Issue 3: "Jira transition failed: No matching transition"**
- Symptoms: PR created but Jira not transitioned, error in output
- Cause: Jira workflow doesn't have "Code Review" state
- Solution: Check available transitions in Jira, update workflow or use custom transition name

**Issue 4: "Branch not found"**
- Symptoms: PR creation fails immediately
- Cause: Branch name incorrect or not pushed to remote
- Solution: Verify branch exists locally with `git branch`, ensure you're on correct branch

**Issue 5: "Multiple transitions found"**
- Symptoms: Agent asks user to select transition
- Cause: Jira workflow has multiple states containing "Code Review"
- Solution: Select the appropriate transition when prompted, or configure Jira workflow

**Issue 6: "Atlassian MCP not configured"**
- Symptoms: Jira integration skipped, warning in errors
- Cause: MCP server not configured or not running
- Solution: Configure Atlassian MCP (see setup skill) or ignore if Jira integration not needed

### Debug Mode

Enable verbose logging by setting environment variable:
```bash
export DEBUG=1
```

Or check gh CLI output:
```bash
gh pr create --help
gh pr status
```

Check Jira integration:
```bash
# Check if Atlassian MCP available
# Look for mcp__atlassian__ tools in Claude Code
```

---

## Changelog

### Version 1.0 (2026-02-05)
- Initial implementation
- GitHub PR creation via gh CLI
- Jira integration with graceful degradation
- Automatic status transition to "Code Review"
- User escalation for ambiguous cases
- Background execution mode
- Comprehensive error handling

### Future Enhancements

Planned improvements:
- [ ] Support for GitHub Enterprise (custom URL)
- [ ] Support for custom Jira transition names (configurable mapping)
- [ ] Auto-detect Jira key from commit messages if not provided
- [ ] Support for PR templates (read from .github/pull_request_template.md)
- [ ] Support for PR reviewers auto-assignment
- [ ] Support for PR labels and milestones
- [ ] Cache Jira transitions to avoid repeated API calls
- [ ] Parallel PR and Jira operations (optimize latency)

---

## See Also

- **Agent System:** `skills/agents/README.md` - Overview of all agents
- **Workflow Skill:** `skills/workflow/SKILL.md` - Phase 7 orchestrator
- **Setup Skill:** `skills/setup/SKILL.md` - Atlassian MCP configuration
- **Git Commits Skill:** `skills/git-commits/SKILL.md` - Commit message generation (Phase 6)

---

## Agent Checklist

Before marking agent complete, verify:

- [x] Input schema documented with examples
- [x] Output schema documented with examples
- [x] Execution logic clearly described
- [x] Retry strategy defined
- [x] Error handling comprehensive
- [x] User escalation implemented
- [x] Usage examples provided (success + failure)
- [x] Integration with workflow documented
- [x] Test cases defined
- [x] Dependencies listed
- [x] Troubleshooting guide included
- [x] Performance considerations documented

---

**Agent Version:** 1.0
**Last Updated:** 2026-02-05
