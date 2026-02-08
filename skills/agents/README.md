# Phase Agents

**Version:** 1.0
**Purpose:** Autonomous agents for workflow phases

---

## Overview

Phase agents are **autonomous workers** that encapsulate complex workflow phases with:
- Clear input/output boundaries
- Built-in retry logic
- Structured error handling
- Background execution capability
- User escalation when needed

They work alongside the **workflow skill** (orchestrator) to implement a hybrid architecture where:
- **Workflow skill** = High-level coordinator (user interaction, gates, progress tracking)
- **Phase agents** = Autonomous workers (execute complex phases, return structured results)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Skill                           │
│                   (Orchestrator)                            │
│                                                             │
│  • User approvals and gates                                 │
│  • Phase transitions                                        │
│  • Progress tracking                                        │
│  • Spawns phase agents                                      │
└──────────────┬──────────────┬──────────────┬───────────────┘
               │              │              │
               ▼              ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   Phase 4   │  │   Phase 5   │  │   Phase 7   │
     │   Testing   │  │ Validation  │  │     PR      │
     │    Agent    │  │    Agent    │  │    Agent    │
     └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Available Phase Agents

### phase-testing-agent (Phase 4)
**Purpose:** Run all tests with retry loop and build verification

**Capabilities:**
- Auto-detect language/stack
- Execute test commands
- Run build for frontend/compiled languages
- UI E2E testing check
- Retry failed tests (up to 3 times)
- Return structured results

**Background:** Yes (default)

**Documentation:** `skills/agents/phase-testing-agent/AGENT.md`

### phase-validation-agent (Phase 5)
**Purpose:** Run all 6 validations (first 4 sequentially, then last 2 in parallel) with retry logic

**Capabilities:**
- Format code (language-specific)
- Lint code (language-specific)
- Build project
- Run tests
- Spawn code-reviewer subagent
- Spawn security-reviewer subagent
- Consolidate all results
- Retry fixable issues (format/lint)
- Return structured results

**Background:** Yes (default)

**Documentation:** `skills/agents/phase-validation-agent/AGENT.md`

### phase-pr-agent (Phase 7)
**Purpose:** Create GitHub PR and integrate with Jira

**Capabilities:**
- Create draft PR via gh CLI
- Link PR to Jira ticket
- Transition Jira to "In Code Review"
- Mark PR ready for review
- Return PR URL and status

**Background:** Yes (default)

**Documentation:** `skills/agents/phase-pr-agent/AGENT.md`

---

## Agent Protocol

All phase agents follow a standard protocol:

### 1. Input Schema
Agents accept structured input (JSON or YAML):
```yaml
# Common fields
working_directory: string
language: string (auto-detected if not provided)
max_retries: number (default: 3)

# Agent-specific fields
# (see individual agent documentation)
```

### 2. Execution
- Validate inputs
- Auto-detect context (language, stack, etc.)
- Execute tasks (with retry loops)
- Handle errors gracefully
- Escalate to user when stuck

### 3. Output Schema
Agents return structured output (JSON):
```json
{
  "status": "pass" | "fail",
  "execution_time_ms": number,
  "retry_count": number,
  // Agent-specific fields
  // (see individual agent documentation)
}
```

### 4. Error Handling
- **Recoverable errors:** Retry with exponential backoff
- **Configuration errors:** Return clear error message
- **Blocked/stuck:** Ask user for guidance (after 3 retries)
- **Critical failures:** Stop and escalate immediately

---

## Using Phase Agents

### From Workflow Skill

The workflow skill automatically spawns phase agents at appropriate phases:

```markdown
## Phase 4: Testing Validation
1. Spawn phase-testing-agent in background
2. Wait for completion or timeout
3. If fail: Review results, fix issues, re-run
4. If pass: Proceed to Phase 5
```

### Standalone Usage

Phase agents can be invoked directly via the Task tool:

```
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/phase-testing-agent/AGENT.md and execute testing agent with inputs: {language: 'javascript', working_directory: '/path/to/project'}",
  run_in_background=true
)
```

### Background Execution

By default, phase agents run in background:
- Non-blocking execution
- Use TaskOutput to check status
- Structured results returned when complete

---

## Agent Lifecycle

```
1. Spawn → 2. Validate Inputs → 3. Execute → 4. Retry (if needed) → 5. Return Results
                                      ↓
                                  Error? → Escalate to User
```

### Retry Strategy

Phase agents implement smart retry logic:

| Attempt | Backoff | Action |
|---------|---------|--------|
| 1 | 5s | Retry after 5 seconds |
| 2 | 10s | Retry after 10 seconds |
| 3 | 15s | Retry after 15 seconds |
| 4+ | - | Ask user for guidance |

**Exceptions:** Security vulnerabilities stop immediately (no retry).

---

## Creating New Phase Agents

To add a new phase agent:

1. **Read the template:** `skills/agents/AGENT_TEMPLATE.md`
2. **Create directory:** `skills/agents/phase-<name>-agent/`
3. **Write specification:** `AGENT.md` with full protocol
4. **Define schemas:** `protocol.md` with input/output formats
5. **Add tests:** `tests/` directory with test cases
6. **Document examples:** Include usage examples
7. **Update this README:** Add to "Available Phase Agents" section

---

## Agent Standards

All phase agents must:

- [ ] Accept structured input (JSON/YAML)
- [ ] Validate inputs before execution
- [ ] Auto-detect context when possible
- [ ] Implement retry logic for recoverable errors
- [ ] Return structured output (JSON)
- [ ] Handle errors gracefully
- [ ] Escalate to user after max retries
- [ ] Support background execution
- [ ] Document input/output schemas
- [ ] Provide usage examples
- [ ] Include test cases

---

## Best Practices

### For Agent Developers

1. **Clear Boundaries:** Each agent should do one thing well
2. **Idempotent:** Safe to run multiple times
3. **Deterministic:** Same inputs = same outputs (when possible)
4. **Fast Feedback:** Return results quickly; long operations in background
5. **Error Context:** Include helpful error messages with recovery steps
6. **Logging:** Log actions for debugging and audit

### For Agent Users

1. **Trust the Agent:** Let agents handle retries automatically
2. **Review Failures:** When agents escalate, review the full context
3. **Background Mode:** Use for long-running tasks (tests, builds)
4. **Validate Inputs:** Ensure required parameters are provided
5. **Check Outputs:** Parse and validate structured results

---

## Troubleshooting

### Agent Hangs/Times Out
- Check if background agent is still running: `TaskOutput(task_id=...)`
- Increase timeout if operation is legitimately slow
- Review agent logs for stuck steps

### Agent Returns Unexpected Results
- Validate input parameters match schema
- Check language auto-detection worked correctly
- Review execution_time_ms for performance issues

### Agent Retry Loop Infinite
- Agent should stop after 3 retries
- If stuck, kill the background task
- Report as bug with reproduction steps

### Agent Escalation Not Working
- Ensure AskUserQuestion tool is available
- Check that agent has permission to interact
- Verify escalation threshold is correct

---

## Known Gaps

The following items are documented in agent specifications but not yet implemented:

- **Test directories:** Each agent's AGENT.md defines test cases (unit and integration), but `tests/` directories have not yet been created. Test implementations are planned for a future iteration.
- **CI/CD enforcement (Layer 4):** Described in workflow enforcement docs but not yet implemented as a GitHub Actions workflow.
- **Agent registry:** A centralized catalog of all agents is planned but does not exist yet.

---

## Future Enhancements

Planned improvements to the agent system:

1. **Agent Registry:** Central catalog of all agents
2. **Agent Composition:** Agents spawn other agents
3. **Agent Monitoring:** Dashboard for agent status
4. **Agent Versioning:** Track agent protocol versions
5. **Agent Marketplace:** Community-contributed agents

---

## Files

```
skills/agents/
├── README.md                           # This file
├── AGENT_TEMPLATE.md                   # Template for new agents
├── run-agent.sh                        # Utility: spawn agent
├── check-agent.sh                      # Utility: check agent status
├── validate-input.py                   # Utility: validate agent inputs
├── phase-testing-agent/
│   ├── AGENT.md                        # Full specification
│   └── protocol.md                     # Input/output schemas
├── phase-validation-agent/
│   ├── AGENT.md
│   └── protocol.md
└── phase-pr-agent/
    ├── AGENT.md
    └── protocol.md
```

---

## See Also

- **Workflow Skill:** `skills/workflow/SKILL.md` - Orchestrator that uses phase agents
- **PARA Methodology:** Global CLAUDE.md - Overall development workflow
- **Agent Template:** `skills/agents/AGENT_TEMPLATE.md` - Create new agents

---

**Remember:** Phase agents are tools to encapsulate complexity and enable reusability. Use them when phases are autonomous and have clear boundaries. Keep orchestration logic in the workflow skill.
