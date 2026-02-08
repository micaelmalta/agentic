# Hybrid Architecture: Workflow Skill + Phase Agents

The workflow skill uses a **hybrid architecture** combining orchestration and autonomous phase agents:

```
Workflow Skill (Orchestrator)
├── Phase 1-3: Direct orchestration (planning, branching, implementing)
├── Phase 4: Testing → phase-testing-agent (background)
├── Phase 5: Validation → phase-validation-agent (background)
├── Phase 6: Commit & Push (direct orchestration)
├── Phase 7: PR Creation → phase-pr-agent (background)
└── Phase 8: Monitor & Summarize (direct orchestration)
```

## Orchestrator Responsibilities

- Overall workflow coordination
- User communication and decision-making
- Plan validation and approval
- Branch management (Phase 2)
- Implementation guidance (Phase 3)
- Commit operations (Phase 6)
- Monitoring and summarization (Phase 8)

## Phase Agent Responsibilities

- Autonomous execution within specific phases
- Language/context auto-detection
- Retry logic with exponential backoff
- User escalation when stuck
- Structured JSON output for workflow parsing

## Phase Agents

### 1. phase-testing-agent (`skills/agents/phase-testing-agent/`)

- **Phase:** 4 (Testing Validation)
- **Mode:** Background (default)
- **Responsibilities:** Auto-detect language, run build (if needed), execute tests, retry up to 3 times with backoff, escalate to user after max retries
- **Input:** `working_directory`
- **Output:** `status`, `tests_run`, `tests_passed`, `tests_failed`, `build_status`, `failing_tests[]`, `retry_count`

### 2. phase-validation-agent (`skills/agents/phase-validation-agent/`)

- **Phase:** 5 (Validation)
- **Mode:** Background (default)
- **Responsibilities:** Run 6 checks (formatter, linter, build, tests, code-reviewer, security-reviewer), auto-fix format/lint issues with retry, STOP on critical security issues, return consolidated results
- **Input:** `working_directory`, `changed_files`
- **Output:** `status`, `checks{formatter, linter, build, tests, code_review, security_review}`, `total_retries`, `critical_security_issue`

### 3. phase-pr-agent (`skills/agents/phase-pr-agent/`)

- **Phase:** 7 (PR Creation)
- **Mode:** Background (default)
- **Responsibilities:** Create GitHub draft PR via gh CLI, link to Jira (if configured), transition Jira to "In Code Review", graceful degradation if Jira unavailable
- **Input:** `branch`, `title`, `description`, `jira_key` (optional), `mark_ready` (optional)
- **Output:** `status`, `pr_url`, `pr_number`, `jira_status{linked, transitioned, current_state}`, `marked_ready`

## Benefits of Hybrid Approach

- **Modularity:** Phase agents are reusable and testable independently
- **Parallelism:** Agents run in background while workflow continues (where applicable)
- **Autonomy:** Agents handle retry logic and error recovery internally
- **Graceful degradation:** Agents adapt to missing tools (e.g., Jira MCP)
- **Structured communication:** JSON schemas enable programmatic validation
- **User control:** Workflow orchestrator retains decision-making and communication

## Agent Invocation Pattern

```python
# Workflow spawns agent in background
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/<agent-name>/AGENT.md and execute with input: {JSON}"
)

# Wait for agent completion
agent_output = wait_for_completion()

# Parse structured output
result = parse_json(agent_output)

# Validate and proceed
if result["status"] == "pass":
    proceed_to_next_phase()
else:
    handle_errors(result["errors"])
```

## Detailed Specifications

- `skills/agents/README.md` - Agent system overview
- `skills/agents/phase-testing-agent/AGENT.md` - Testing agent spec
- `skills/agents/phase-validation-agent/AGENT.md` - Validation agent spec
- `skills/agents/phase-pr-agent/AGENT.md` - PR agent spec
