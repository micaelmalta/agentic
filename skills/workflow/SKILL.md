---
name: workflow
description: "Complete development workflow from planning to GitHub PR using PARA methodology and RLM for large codebases. Use when implementing a feature, fixing a bug, refactoring, or taking work from plan to GitHub PR."
triggers:
  - "/workflow"
  - "implement a feature"
  - "fix this bug"
  - "refactor code"
  - "add functionality"
  - "architecture change"
  - "large codebase work"
  - "complex task"
  - "start development"
  - "plan to github"
---

# Workflow Skill

## Core Philosophy

**"Structure + Execution = Reproducible Results."**

This workflow is a **pure orchestrator** that coordinates specialized skills through phases. It does not implement functionality directly—it delegates to the appropriate skill for each task.

**Orchestration Model:**

```
Plan (para) → Branch → Execute (developer) → Test (testing) → Validate (reviewers) → Commit (git-commits) → PR → Monitor
```

Each phase invokes one or more specialized skills. The workflow ensures proper sequencing, gates, and parallel execution.

**⚠️ ENFORCEMENT:** Phase gates are MANDATORY. Read `skills/workflow/ENFORCEMENT.md` for validation enforcement mechanisms, scripts, and pre-commit hooks to prevent skipping critical phases (especially Phase 5: code review + security review).

---

## Required Skills

This workflow **must use** the **para**, **developer**, **rlm**, **architect**, **testing**, **code-reviewer**, **security-reviewer**, **documentation**, **git-commits**, **refactoring**, **debugging**, **dependencies**, **performance**, **ci-cd**, and **setup** skills. **Invoke them by reading and following** their skill files: e.g. read `skills/para/SKILL.md` for plan/execute/summarize/archive, read `skills/developer/SKILL.md` for TDD implementation, and read `skills/architect/SKILL.md` plus `skills/architect/tech_proposal_template.md` when writing plans that need technical design. Details below.

### Setup skill (MCP: Atlassian, Atlassian Tech, Datadog, Playwright)

| Command  | Purpose                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/setup` | Configure Atlassian (`atlassian`, `atlassian-tech`), Datadog, and Playwright MCP for Claude or Cursor; prompt for keys and write config. |

Run **/setup** before using Jira, Confluence, Datadog, or Playwright in the workflow. After setup, use **Atlassian MCP** (atlassian or atlassian-tech) for tickets and Confluence, **Datadog MCP** for logs, metrics, and monitors, and **Playwright MCP** for UI testing (see MCP integration below).

### PARA skill (planning and execution phases)

| Command        | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `/init`        | Initialize PARA structure in project                               |
| `/plan <task>` | Create a new plan (e.g. `context/plans/YYYY-MM-DD-<task-name>.md`) |
| `/execute`     | Start execution with tracking                                      |
| `/summarize`   | Generate post-work summary                                         |
| `/archive`     | Archive completed work                                             |
| `/status`      | Check current workflow state                                       |
| `/check`       | Decision helper (should I use PARA?)                               |
| `/help`        | Show comprehensive PARA guide                                      |

### RLM skill (large codebase exploration and analysis)

| Command / usage                                     | Purpose                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `/rlm`                                              | Trigger RLM workflow (map-reduce over codebase)                  |
| `python3 skills/rlm/rlm.py peek "query"`            | Index & filter without loading (e.g. imports, class names)       |
| `python3 skills/rlm/rlm.py chunk --pattern "*.ext"` | Split work into chunks for parallel agents                       |
| `background_task`                                   | Spawn parallel subagents; use for map phase, then reduce outputs |

### Architect skill (tech spec and design)

| Command / trigger                                                      | Purpose                                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `/architect`                                                           | Trigger architect workflow                                                    |
| "tech spec", "technical design", "architecture doc", "design document" | Write tech spec: goals, scope, architecture, APIs, data model, risks, rollout |

### Developer skill (TDD implementation) - MANDATORY

| Command / trigger                                               | Purpose                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| `/dev`, `/developer`                                            | Trigger TDD development workflow                            |
| "implement this", "write the code", "TDD", "red green refactor" | Write tests first, then code using Red-Green-Refactor cycle |

**MANDATORY:** All implementation uses TDD. Read `skills/developer/SKILL.md` for the full protocol. The developer skill handles:

- Feature implementation (tests define behavior first)
- Bug fixes (reproduction test first)
- Refactoring (tests as safety net)

### Testing skill (test design and execution) - MANDATORY

| Command / trigger                                            | Purpose                                  |
| ------------------------------------------------------------ | ---------------------------------------- |
| `/test`                                                      | Trigger testing workflow                 |
| "add tests", "write tests", "run tests", "improve coverage"  | Add or run tests                         |
| `npm test` / `pytest` / `go test -race ./...` / `cargo test` | Run test suite (match project ecosystem) |
| **Playwright MCP** (browser_navigate, browser_click, etc.)   | UI/E2E testing (MANDATORY if UI exists)  |

**MANDATORY:** Testing is required before any PR. For UI/frontend work, Playwright MCP must be used for E2E testing.

### Code reviewer skill (review before merge)

| Command / trigger                                  | Purpose                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `/review`                                          | Trigger code review                                               |
| "code review", "review this PR", "review the diff" | Review changed code for correctness, readability, maintainability |

### Security reviewer skill (security audit)

| Command / trigger                                           | Purpose                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `/security`                                                 | Trigger security review                                                   |
| "security review", "security audit", "find vulnerabilities" | Review for injection, XSS, auth, sensitive data, crypto, misconfiguration |

### Documentation skill (docs and ADRs)

| Command / trigger                                         | Purpose                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `/docs`                                                   | Trigger documentation workflow                                |
| "document this", "update README", "write ADR", "API docs" | Write or update README, API docs, ADRs, inline docs, runbooks |

### Git / commits skill (commit messages and changelog)

| Command / trigger                              | Purpose                                              |
| ---------------------------------------------- | ---------------------------------------------------- |
| `/commit`                                      | Trigger commit-message workflow                      |
| "commit message", "changelog", "release notes" | Write conventional commits, changelog, release notes |

### Refactoring skill (safe structure changes)

| Command / trigger                                    | Purpose                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `/refactor`                                          | Trigger refactoring workflow                                 |
| "refactor", "extract function", "rename", "simplify" | Extract, rename, simplify; behavior unchanged, tests passing |

### Debugging skill (repro and fix)

| Command / trigger                                  | Purpose                                                  |
| -------------------------------------------------- | -------------------------------------------------------- |
| `/debug`                                           | Trigger debugging workflow                               |
| "fix this bug", "why does this fail", "root cause" | Reproduce with test, hypothesize, bisect, fix (uses TDD) |

### Dependencies skill (upgrade and lockfile)

| Command / trigger                                                | Purpose                                        |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `/deps`                                                          | Trigger dependency workflow                    |
| "upgrade dependencies", "dependency conflict", "update lockfile" | Upgrade deps, resolve conflicts, sync lockfile |

### Performance skill (profile and optimize)

| Command / trigger                                  | Purpose                                           |
| -------------------------------------------------- | ------------------------------------------------- |
| `/perf`                                            | Trigger performance workflow                      |
| "performance", "bottleneck", "profile", "optimize" | Profile, find hotspots, optimize with measurement |

### CI/CD skill (pipeline and deploy)

| Command / trigger                           | Purpose                                              |
| ------------------------------------------- | ---------------------------------------------------- |
| `/ci`                                       | Trigger CI/CD workflow                               |
| "CI", "pipeline", "fix the build", "deploy" | Configure or fix build, test, lint, deploy pipelines |

Use **PARA** for plan → execute → summarize → archive. Use **developer** (MANDATORY) for all implementation—enforces TDD (tests before code) for features, bug fixes, and refactoring. Use **RLM** when the codebase is large (>100 files) or when you need to find usage/patterns across many files. Use **architect** when writing a tech spec or design document before implementation. Use **testing** (MANDATORY) when adding or running tests—all tests must pass before PR; use **Playwright MCP** for UI/E2E testing. Use **code-reviewer** when reviewing PRs or diffs. Use **security-reviewer** when auditing for vulnerabilities or before release. Use **documentation** when writing or updating docs. Use **git-commits** when writing commit messages or changelogs. Use **refactoring** when changing structure without behavior. Use **debugging** when investigating or fixing bugs (with TDD reproduction test). Use **dependencies** when upgrading or resolving deps. Use **performance** when profiling or optimizing. Use **ci-cd** when configuring or fixing pipelines and deploy. Use **setup** when the user wants to add or reconfigure Atlassian, Datadog, or Playwright MCP for Claude or Cursor.

---

## MCP Integration (Atlassian, Atlassian Tech, Datadog, Playwright)

After **/setup** has been run and MCPs are configured, use these tools when relevant:

| MCP                | When to use                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **atlassian**      | Jira: get issue details, search JQL, transitions, link to PR. Confluence: get page, search CQL, spaces. Use in **Phase 1 (Plan)** for ticket context; in **Phase 2** transition ticket to **In Progress**; in **Phase 7 (PR)** link PR to Jira and transition ticket to **In Code Review**. |
| **atlassian-tech** | Same capabilities as atlassian; use when the context is tech-specific (e.g. engineering Jira/Confluence).                                                                                                                                                                                   |
| **Datadog**        | Logs: search_logs, get_log_details. Metrics: query_metrics, list_metrics. Monitors: list_monitors, get_monitor_status. Traces: query_traces. Use in **debugging**, **ci-cd** (monitoring/alerts), and **Phase 8 (Monitor)**.                                                                |
| **Playwright**     | Browser automation for UI testing. **MANDATORY for any UI/frontend work.** Use in **Phase 4 (Testing)** for E2E and visual testing.                                                                                                                                                         |

Skills that should use these MCPs when the task involves tickets or observability: **workflow** (Jira/Confluence in plan and PR; Jira transitions: In Progress at Phase 2, In Code Review at Phase 7), **ci-cd** (Datadog for monitoring/observability), **debugging** (Datadog logs/traces), **documentation** (Confluence for docs), **testing** (Playwright for UI tests). Use **atlassian** or **atlassian-tech** as appropriate for the context.

---

## Parallel Execution Groups (Subagents)

**CRITICAL:** The following skill groups can and SHOULD run as parallel subagents to maximize efficiency. Launch all subagents in a single message using multiple Task tool calls.

### Group 1: Validation (Phase 5)

These skills are independent and should run as **parallel subagents**:

| Skill                         | Subagent Type     | Why Parallel                                  |
| ----------------------------- | ----------------- | --------------------------------------------- |
| **code-reviewer**             | `general-purpose` | Reviews correctness/readability independently |
| **security-reviewer**         | `general-purpose` | Reviews security independently                |
| **testing** (run suite)       | `Bash`            | Test execution is independent                 |
| **ci-cd** (lint/format/build) | `Bash`            | Lint, format, and build are independent       |

**Example parallel launch:**

```
Task(subagent_type="general-purpose", prompt="Run code-reviewer skill on changed files...")
Task(subagent_type="general-purpose", prompt="Run security-reviewer skill on changed files...")
Task(subagent_type="Bash", prompt="Run test suite: npm test")
Task(subagent_type="Bash", prompt="Run formatter and linter and build: npm run format && npm run lint && npm run build")
```

### Group 2: Exploration (Phase 1)

When exploring the codebase, launch **parallel Explore subagents**:

| Task                    | Subagent Type | Why Parallel       |
| ----------------------- | ------------- | ------------------ |
| Find affected files     | `Explore`     | Independent search |
| Understand architecture | `Explore`     | Independent search |
| Check existing patterns | `Explore`     | Independent search |
| Review git history      | `Bash`        | Independent lookup |

### Group 3: Test Writing (Phase 4)

When writing tests for multiple components:

| Task                             | Subagent Type     | Why Parallel |
| -------------------------------- | ----------------- | ------------ |
| Write unit tests for component A | `general-purpose` | Independent  |
| Write unit tests for component B | `general-purpose` | Independent  |
| Write integration tests          | `general-purpose` | Independent  |
| Run existing test suite          | `Bash`            | Independent  |

### Group 4: Documentation (Phase 8)

After implementation, documentation tasks can parallelize:

| Task                  | Subagent Type     | Why Parallel |
| --------------------- | ----------------- | ------------ |
| Update README         | `general-purpose` | Independent  |
| Write/update API docs | `general-purpose` | Independent  |
| Write ADR (if needed) | `general-purpose` | Independent  |

### Sequential Skills (Do NOT Parallelize)

These skills depend on previous results and must run **sequentially**:

- **debugging** → requires investigation results before fix
- **refactoring** → requires understanding before changing
- **dependencies** → requires conflict analysis before resolution
- **performance** → requires profiling before optimization
- **git-commits** → requires all changes complete before commit

---

## Feedback Loops (MANDATORY)

**⚠️ CRITICAL:** The workflow enforces retry loops at each gate. You MUST NOT proceed until all checks pass.

### Loop 1: TDD Cycle (Phase 3)

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD FEEDBACK LOOP                        │
│                                                             │
│   Write Test ──► Run Test ──► FAIL? ──► Write Code ──┐     │
│       ▲                                              │     │
│       │                                              ▼     │
│       │                                         Run Test   │
│       │                                              │     │
│       │                        ┌─────────────────────┤     │
│       │                        │                     │     │
│       │                     PASS?                 FAIL?    │
│       │                        │                     │     │
│       │                        ▼                     ▼     │
│       │                   Refactor            Fix Code     │
│       │                        │                     │     │
│       │                        ▼                     │     │
│       └──── More behaviors? ◄──┴─────────────────────┘     │
│                    │                                        │
│                   Done                                      │
└─────────────────────────────────────────────────────────────┘
```

**Retry until:** All tests pass for current behavior before moving to next.

### Loop 2: Testing Gate (Phase 4)

```
┌─────────────────────────────────────────────────────────────┐
│                  TESTING FEEDBACK LOOP                      │
│                                                             │
│   Run All Tests ──► All Pass? ──► YES ──► Proceed          │
│        ▲                │                                   │
│        │               NO                                   │
│        │                │                                   │
│        │                ▼                                   │
│        │         Identify Failures                          │
│        │                │                                   │
│        │                ▼                                   │
│        │           Fix Issues                               │
│        │                │                                   │
│        └────────────────┘                                   │
│                                                             │
│   Max retries: Until all pass (no limit)                    │
│   Escalate: If stuck after 3 attempts, ask user            │
└─────────────────────────────────────────────────────────────┘
```

**Checks (ALL must pass):**

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if UI)
- [ ] Build succeeds

**On failure:**

1. Identify which test(s) failed
2. Analyze failure reason
3. Fix the code (not the test, unless test is wrong)
4. Re-run ALL tests
5. Repeat until all pass

### Loop 3: Validation Gate (Phase 5)

```
┌─────────────────────────────────────────────────────────────┐
│                 VALIDATION FEEDBACK LOOP                    │
│                                                             │
│   Run Validations ──► All Pass? ──► YES ──► Proceed        │
│        ▲                  │                                 │
│        │                 NO                                 │
│        │                  │                                 │
│        │                  ▼                                 │
│        │         ┌────────┴────────┐                       │
│        │         │                 │                       │
│        │   Linter/Format?       Review?                    │
│        │         │                 │                       │
│        │         ▼                 ▼                       │
│        │    Run format,       Address                     │
│        │    auto-fix lint,    feedback                    │
│        │         │                 │                       │
│        └─────────┴─────────────────┘                       │
│                                                             │
│   Max retries: Until all pass (no limit)                    │
│   Escalate: If security issue can't be resolved, STOP      │
└─────────────────────────────────────────────────────────────┘
```

**Checks (ALL must pass):**

- [ ] Formatter run and code formatted (project style)
- [ ] Linter passes (auto-fix allowed)
- [ ] Build succeeds
- [ ] Code review passed
- [ ] Security review passed

**On failure:**

1. **Formatting/Linter fails:** Run formatter (e.g. `npm run format`), then linter with auto-fix, then manual fix remaining
2. **Build fails:** Fix compilation/bundling errors
3. **Code review fails:** Address feedback, improve code
4. **Security review fails:** Fix vulnerability (NEVER skip)
5. Re-run ALL validations
6. Repeat until all pass

### Escalation Rules

| Situation                           | Action                               |
| ----------------------------------- | ------------------------------------ |
| Test fails 3+ times for same reason | Ask user for guidance                |
| Security vulnerability found        | STOP workflow, require user decision |
| Conflicting requirements            | Ask user to clarify                  |
| External dependency blocking        | Document blocker, ask user           |
| Flaky test detected                 | Fix flakiness before proceeding      |

### Loop Enforcement

**The workflow MUST:**

1. Track retry count for each gate
2. Log each failure and fix attempt
3. Never proceed with failing checks
4. Ask user if stuck (after reasonable attempts)
5. Document all retries in commit message or summary

---

## Protocol: PARA-Driven Development Workflow

**PHASE SEQUENCING REQUIREMENT:** Phases must execute in order (1→2→3→4→5→6→7→8). Do NOT skip phases. After Phase 1 approval, execute phases 2-8 autonomously without stopping between phases.

**⛔ MANDATORY TESTING:** Testing is NOT optional. The workflow MUST include:

- Writing and passing tests (Phase 4)
- Build verification (Phase 4/5)
- For UI: E2E tests via Playwright MCP
- **NEVER suggest tests as "optional" or "next steps"**
- **STOP and write tests before proceeding to commit**

**⛔ MANDATORY VALIDATION:** Phase 5 validation is NOT optional. The workflow MUST include:

- Code review via code-reviewer subagent (Phase 5)
- Security review via security-reviewer subagent (Phase 5)
- **NEVER skip or suggest reviews as "optional" or "next steps"**
- **STOP and run ALL 5 validations before proceeding to commit**
- **Use validation script to verify:** `python3 skills/workflow/scripts/validate_phase.py --phase 5`

**OUTCOME FOCUS:** Work continues autonomously until PR is merged or explicitly stopped by user. Track progress visibly with "Phase X/8" headers and TodoWrite tool. Only escalate on gate failures after retries.

**PARALLEL EXECUTION:** Launch multiple subagents simultaneously for independent tasks within the same phase. Track all parallel work with TodoWrite tool.

**PARA SKILL INVOCATION:** This workflow **must** use the **para** skill. At the start of any workflow run, **read** `skills/para/SKILL.md` and follow it for:

- **Plan phase:** Use PARA's `/plan` semantics: create `context/plans/YYYY-MM-DD-<task-name>.md`, document objectives/approach/steps, and follow PARA's Plan and Review phases.
- **Execute phase:** Use PARA's `/execute` semantics: **execute ALL plan steps autonomously** without stopping between steps, track progress with TodoWrite, reference the plan, document deviations.
- **Summarize phase:** Use PARA's `/summarize` semantics: create `context/summaries/YYYY-MM-DD-<task-name>.md` with outcomes and learnings.
- **Archive phase:** Use PARA's `/archive` when work is complete to move plans/summaries to `context/archives/`.

Do not implement a custom plan/execute/summarize flow; use the para skill's structure and commands. **CRITICAL:** The para skill now executes all plan steps autonomously - review its updated Execute Phase section for autonomous execution guidance.

---

## Multi-Subagent Coordination

This workflow uses multiple specialized subagents working in parallel:

1. **Launch parallel subagents** when tasks are independent
2. **Use TodoWrite** to track all parallel tasks
3. **Wait for completion** before moving to next phase
4. **Consolidate results** from all subagents
5. **Proceed to next phase** only after all subagents complete

**Key Rules:**

- All subagents must complete Phase N before any start Phase N+1
- Independent tasks within a phase can run in parallel
- Dependent tasks must run sequentially
- Use terminal/shell with background execution for long-running tasks (builds, tests)

---

## Hybrid Architecture: Workflow Skill + Phase Agents

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

**Orchestrator responsibilities:**
- Overall workflow coordination
- User communication and decision-making
- Plan validation and approval
- Branch management (Phase 2)
- Implementation guidance (Phase 3)
- Commit operations (Phase 6)
- Monitoring and summarization (Phase 8)

**Phase agent responsibilities:**
- Autonomous execution within specific phases
- Language/context auto-detection
- Retry logic with exponential backoff
- User escalation when stuck
- Structured JSON output for workflow parsing

**Phase Agents:**

1. **phase-testing-agent** (`skills/agents/phase-testing-agent/`)
   - **Phase:** 4 (Testing Validation)
   - **Mode:** Background (default)
   - **Responsibilities:** Auto-detect language, run build (if needed), execute tests, retry up to 3 times with backoff, escalate to user after max retries
   - **Input:** `working_directory`
   - **Output:** `status`, `tests_run`, `tests_passed`, `tests_failed`, `build_status`, `failing_tests[]`, `retry_count`

2. **phase-validation-agent** (`skills/agents/phase-validation-agent/`)
   - **Phase:** 5 (Validation)
   - **Mode:** Background (default)
   - **Responsibilities:** Run 5 checks (formatter, linter, build, tests, code-reviewer, security-reviewer), auto-fix format/lint issues with retry, STOP on critical security issues, return consolidated results
   - **Input:** `working_directory`, `changed_files`
   - **Output:** `status`, `checks{formatter, linter, build, tests, code_review, security_review}`, `total_retries`, `critical_security_issue`

3. **phase-pr-agent** (`skills/agents/phase-pr-agent/`)
   - **Phase:** 7 (PR Creation)
   - **Mode:** Background (default)
   - **Responsibilities:** Create GitHub draft PR via gh CLI, link to Jira (if configured), transition Jira to "In Code Review", graceful degradation if Jira unavailable
   - **Input:** `branch`, `title`, `description`, `jira_key` (optional), `mark_ready` (optional)
   - **Output:** `status`, `pr_url`, `pr_number`, `jira_status{linked, transitioned, current_state}`, `marked_ready`

**Benefits of hybrid approach:**
- **Modularity:** Phase agents are reusable and testable independently
- **Parallelism:** Agents run in background while workflow continues (where applicable)
- **Autonomy:** Agents handle retry logic and error recovery internally
- **Graceful degradation:** Agents adapt to missing tools (e.g., Jira MCP)
- **Structured communication:** JSON schemas enable programmatic validation
- **User control:** Workflow orchestrator retains decision-making and communication

**Agent invocation pattern:**

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

For detailed specifications, see:
- `skills/agents/README.md` - Agent system overview
- `skills/agents/phase-testing-agent/AGENT.md` - Testing agent spec
- `skills/agents/phase-validation-agent/AGENT.md` - Validation agent spec
- `skills/agents/phase-pr-agent/AGENT.md` - PR agent spec

---

## Phase 1: Plan

**Goal:** Create detailed implementation plan before writing code.

**PARA command:** Use `/plan <task>` to create the plan. **Follow the para skill** (`skills/para/SKILL.md`) for plan creation, file location (`context/plans/YYYY-MM-DD-<task-name>.md`), and Review phase (present plan for approval).

**Plan skills and tech proposal:** When the plan involves technical design, architecture, new features, or system changes:

- **Read and follow the architect skill** (`skills/architect/SKILL.md`).
- **Use the tech proposal template** (`skills/architect/tech_proposal_template.md`): read it first, then structure the plan (or a separate tech spec) using its sections (Metadata, Architecture Considerations, API Changes, Data Models, Domain Architecture, Additional Considerations, Estimation & Implementation Plan). Output a tech spec to `docs/tech-specs/YYYY-MM-DD-<feature>.md` or `context/tech-specs/` when appropriate, and reference it from the plan.

**Skills:** Use **para** skill for planning; use **architect** skill and **tech_proposal_template.md** when the plan requires technical design or a tech spec.

**Actions:**

1. Understand the requirements and task scope
2. Explore affected code sections using parallel subagents
3. Identify implementation approach and files to modify
4. If tech design is needed: read architect skill and tech_proposal_template.md; produce structured plan or tech spec using the template
5. Create plan via PARA `/plan`: document in `context/plans/YYYY-MM-DD-<task-name>.md`

**⚡ PARALLEL SUBAGENTS for exploration (launch in single message):**

```
Task(subagent_type="Explore", prompt="Find all files related to [feature area]. Identify components, patterns, and dependencies.")
Task(subagent_type="Explore", prompt="Search for existing patterns for [similar functionality] in codebase.")
Task(subagent_type="Bash", prompt="Check git history for recent changes to [affected area]: git log --oneline -20 -- path/")
Task(subagent_type="Explore", prompt="Find test files and patterns for [feature area] to understand testing approach.")
```

For large codebases (100+ files), use **RLM skill** instead of multiple Explore agents.

**Plan Document Contents:**

- Objective (1-2 sentences)
- Approach (how you'll solve it)
- Affected files and components
- Implementation steps (numbered)
- Edge cases and risks
- Testing strategy

When the plan involves architecture or tech design, also structure content using **tech_proposal_template.md** (Metadata, Architecture Considerations, API Changes, Data Models, Domain Architecture, Additional Considerations, Estimation & Implementation Plan)—either inline in the plan or in a separate tech spec file referenced from the plan.

**Approval Gate (ONE-TIME APPROVAL):**

- Present plan to user for **one-time review and approval**
- User can approve, request changes, or provide clarification
- **IMPORTANT: Approval of the plan = approval to execute ALL phases 2-8 autonomously**
- Do NOT proceed to execution without this one-time approval
- After approval, do NOT stop between phases to ask permission

**Autonomous Execution After Approval:**

Once the plan is approved, phases 2-8 execute **fully autonomously** without stopping to ask permission between phases:

- **Phases run sequentially:** 2 → 3 → 4 → 5 → 6 → 7 → 8
- **No "should I proceed?" questions** between phases
- **Show progress:** Display "Phase X/8: [Phase Name]" as each phase starts
- **Track progress:** Use TodoWrite to show phase completion
- **Only stop if:**
  - Gate failure (tests fail, security issue, build fails) - retry then escalate if stuck
  - User explicitly interrupts (Ctrl+C equivalent)
  - Critical blocker requiring user decision

**Decision-Making:**

- **Pick the best option and proceed** - don't ask "which option should I use?"
- **Make implementation decisions autonomously** based on context and best practices
- **Only escalate decisions if:**
  - Genuinely stuck after retry attempts (e.g., gate failed 3+ times)
  - Critical security vulnerability found
  - Requirements are unclear or conflicting

**Commit Plan to Git:**

After plan approval, commit it to git:

```bash
git add context/plans/<plan-file>.md
git commit -m "docs: add plan for <task>"
```

---

## Phase 2: Create Feature Branch

**Goal:** Set up isolated work environment.

**Actions:**

1. **If a Jira ticket key is provided:** Use **Atlassian MCP** to transition the issue to **In Progress**. Call `jira_get_transitions` with the issue key, find the transition whose name matches "In Progress" (or "In progress"; names vary by project), then call `jira_transition_issue` with that transition ID. This marks the ticket as in progress before implementation starts.
2. Create feature branch: `git checkout -b feature/<description>` or `fix/<description>`
3. Confirm branch creation with `git status`

---

## Phase 3: Execute Implementation

**Goal:** Implement according to approved plan.

**PARA command:** Use `/execute` to implement with tracking and context.

**Skill:** Use the **developer** skill (`skills/developer/SKILL.md`) for all implementation. The developer skill enforces TDD (Test-Driven Development).

**Actions:**

1. Start execution with `/execute`; track progress with TodoWrite tool
2. **Read and follow the developer skill** for implementation using TDD (Red-Green-Refactor):
   - **RED:** Write a failing test that defines the expected behavior
   - **GREEN:** Write the minimum code to make the test pass
   - **REFACTOR:** Clean up code while keeping tests green
   - Repeat for each behavior/requirement
   - **Bug fixes:** Write reproduction test first (RED), then fix (GREEN), then refactor
   - **Refactoring:** Ensure existing tests pass as safety net before and after changes
3. Use parallel subagents for efficient execution:
   - **Bash agent:** Git operations, command execution, builds
   - **Explore agent:** Code navigation, pattern discovery
   - **General-purpose agent:** Research, complex analysis, test writing
   - **RLM skill:** Parallel implementation on multiple independent files/components
4. Reference plan document during execution
5. Commit changes atomically with clear messages
6. Document deviations from plan in commit messages

**Parallel Execution Strategy:**

- Break independent tasks into subtasks for parallel processing
- Use RLM for map-reduce style implementation across many files
- Different agents can work on different components simultaneously
- Merge results after all subtasks complete

**Quality Gates (from developer skill):**

- [ ] TDD followed (tests before code)
- [ ] All tests pass
- [ ] Code follows project conventions
- [ ] No security vulnerabilities
- [ ] Changes are minimal and focused

---

## Phase 4: Testing Validation (MANDATORY)

**Goal:** Verify all tests pass and coverage is adequate.

**⚠️ BLOCKING REQUIREMENT:** Testing is MANDATORY. Do NOT proceed to Phase 5 until all tests pass.

**Agent:** Use the **phase-testing-agent** to auto-detect language, run tests, and retry on failures.

**NOTE:** If following the developer skill (TDD) correctly, tests should already exist from Phase 3. This phase validates execution.

**Execution:**

Spawn the **phase-testing-agent** in background to execute tests:

```
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/phase-testing-agent/AGENT.md and execute with input: {\"working_directory\": \"$(pwd)\"}"
)
```

The agent will:
1. **Auto-detect language** from project files (package.json, go.mod, etc.)
2. **Auto-detect test command** (npm test, pytest, go test, etc.)
3. **Auto-detect build requirements** (for frontend/compiled languages)
4. **Execute build** (if needed) then **execute tests**
5. **Retry up to 3 times** with exponential backoff (5s, 10s, 15s) on test failures
6. **Escalate to user** via AskUserQuestion after max retries if stuck
7. Return structured JSON output with results

**Agent Output:**

```json
{
  "status": "pass",              // or "fail"
  "tests_run": 127,
  "tests_passed": 127,
  "tests_failed": 0,
  "build_status": "pass",        // or "fail", "skipped"
  "retry_count": 0,
  "failing_tests": [],           // Array of {name, file, error}
  "execution_time_ms": 12340,
  "language": "javascript",
  "test_command": "npm test",
  "build_command": "npm run build"
}
```

**Handling Agent Results:**

- **If status = "pass":** Proceed to Phase 5
- **If status = "fail":**
  - Review `failing_tests` array for specific failures
  - Check `build_status` - if "fail", fix build errors first
  - Check `retry_count` - if 3, agent already retried max times
  - Fix failing tests or code issues
  - Re-run agent until all tests pass

**Manual Test Writing (if needed):**

If the agent reports insufficient test coverage or you need to add tests for new functionality:

1. Use **developer skill** for TDD approach (write tests first)
2. Use **testing skill** for test design and implementation
3. Use parallel subagents for additional coverage:
   - **General-purpose agent:** Write unit tests for specific components
   - **Explore agent:** Find existing test patterns to emulate
   - **Playwright MCP:** For UI E2E testing (mandatory if frontend)

**UI Testing with Playwright MCP:**

For UI/frontend projects, after tests pass, run E2E tests:

```
Use Playwright MCP tools: browser_navigate, browser_click, browser_type, browser_snapshot, browser_screenshot
```

**Required Coverage (ALL must pass to proceed):**

- [ ] Phase-testing-agent executed and returned status "pass"
- [ ] Build succeeded (for frontend/compiled languages)
- [ ] All tests passed (no failures in failing_tests array)
- [ ] Tests are deterministic (retry_count = 0 or low)
- [ ] **UI: E2E tests via Playwright MCP** (mandatory if frontend exists)

**DO NOT proceed to Phase 5 until phase-testing-agent returns status "pass".**

---

## Phase 5: Validation (MANDATORY)

**Goal:** Ensure quality and security.

**⚠️ BLOCKING REQUIREMENT:** All validation checks are MANDATORY. Do NOT proceed to Phase 6 until all checks pass.

**Agent:** Use the **phase-validation-agent** to run 5 validation checks in parallel with auto-fix and retry.

**Execution:**

Spawn the **phase-validation-agent** in background to execute all validation checks:

```
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/phase-validation-agent/AGENT.md and execute with input: {\"working_directory\": \"$(pwd)\", \"changed_files\": [list of changed files from git diff]}"
)
```

The agent will run **5 checks in parallel** (formatter, linter, build, tests running in sequence; code-reviewer and security-reviewer in parallel):
1. **Formatter:** Auto-format code, retry up to 3 times if issues persist
2. **Linter:** Run linter with auto-fix, retry up to 3 times
3. **Build:** Execute build command (skip if not needed), retry once on transient failures
4. **Tests:** Run test suite, retry once on failures
5. **Code Reviewer:** Launch code-reviewer subagent for quality review
6. **Security Reviewer:** Launch security-reviewer subagent for vulnerability detection

**Critical Security Handling:**
- **If critical vulnerability found:** Agent STOPS immediately, does NOT retry
- **Agent sets `critical_security_issue: true`** in output
- **Workflow MUST escalate to user** - do NOT proceed until vulnerability is fixed

**Agent Output:**

```json
{
  "status": "pass",              // or "fail"
  "execution_time_ms": 8901,
  "total_retries": 3,            // Sum of all retry counts
  "critical_security_issue": false,
  "checks": {
    "formatter": {
      "status": "pass",          // or "fail"
      "issues": [],
      "retry_count": 2,
      "command": "npx prettier --write .",
      "execution_time_ms": 1200
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 1,
      "command": "npm run lint",
      "execution_time_ms": 1800
    },
    "build": {
      "status": "pass",          // or "fail", "skipped"
      "errors": [],
      "retry_count": 0,
      "command": "npm run build",
      "execution_time_ms": 3000
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 2400
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",        // or "low", "medium", "high"
      "execution_time_ms": 300
    },
    "security_review": {
      "status": "pass",
      "vulnerabilities": [],
      "severity": "none",        // or "low", "medium", "high", "critical"
      "execution_time_ms": 201
    }
  }
}
```

**Handling Agent Results:**

- **If status = "pass" AND critical_security_issue = false:** Proceed to Phase 6
- **If critical_security_issue = true:**
  - **STOP IMMEDIATELY - DO NOT PROCEED**
  - Review `checks.security_review.vulnerabilities` array
  - Fix critical vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.)
  - Re-run agent until security_review.severity != "critical"
- **If any check status = "fail":**
  - Review specific check results (issues, errors, findings)
  - Check retry_count - if maxed out (3), agent already retried
  - Fix issues based on check type:
    - **Formatter:** Manually fix remaining format issues
    - **Linter:** Fix linter errors that auto-fix couldn't resolve
    - **Build:** Fix compilation/type errors
    - **Tests:** Fix failing tests (see failing_count)
    - **Code review:** Address quality findings
    - **Security review:** Fix vulnerabilities
  - Re-run agent until all checks pass

**Manual Override (NOT RECOMMENDED):**

You can skip specific checks using optional parameters:
- `skip_build: true` - Skip build check
- `skip_tests: true` - Skip test check

**DO NOT skip security review or code review checks.**

**Required Validation (ALL must pass to proceed):**

- [ ] Phase-validation-agent executed and returned status "pass"
- [ ] critical_security_issue is false (or not present)
- [ ] checks.formatter.status = "pass"
- [ ] checks.linter.status = "pass"
- [ ] checks.build.status = "pass" or "skipped"
- [ ] checks.tests.status = "pass"
- [ ] checks.code_review.status = "pass" (severity: low/medium acceptable)
- [ ] checks.security_review.status = "pass" (severity: low/medium acceptable, NOT critical/high)
- [ ] **UI E2E tests via Playwright MCP pass** (BLOCKING if frontend exists)

**⛔ CRITICAL:** If security_review finds critical or high severity issues, you MUST fix them before proceeding. Do NOT skip or ignore security issues.

**DO NOT proceed to Phase 6 until phase-validation-agent returns status "pass" and no critical security issues.**

---

## Phase 6: Commit & Push

**Goal:** Stage work for PR creation.

**⛔ PHASE 5 GATE ENFORCEMENT:**

Before executing ANY action in Phase 6, you MUST verify Phase 5 completion:

```
PHASE 5 COMPLETION CHECKLIST:
✓ [ ] Formatter executed and code formatted
✓ [ ] Linter executed and passed
✓ [ ] Build executed and passed
✓ [ ] Tests executed and passed
✓ [ ] Code review subagent launched AND completed
✓ [ ] Security review subagent launched AND completed
✓ [ ] All findings from reviews addressed
✓ [ ] Re-validation completed after fixes

IF ANY item above is unchecked:
  → STOP immediately
  → Go back to Phase 5
  → Complete missing steps
  → Do NOT commit until ALL checks pass
```

**Skill:** Use **git-commits** skill for commit message conventions.

**Actions:**

1. **FIRST:** Verify Phase 5 gate (checklist above) is complete
2. Stage all relevant files: `git add <files>`
3. Create commit with clear message (follow git-commits skill / project conventions)
4. Push to remote: `git push -u origin <branch-name>`

**Commit Message Format (Conventional Commits):**

- First line: `<type>(<scope>): <summary>` (50 chars max)
- Blank line
- Detailed explanation of why change was made
- Reference issue/ticket if applicable

**Note:** This phase is **sequential** - must complete after validation passes.

---

## Phase 7: Create GitHub PR

**Goal:** Submit work for team review.

**Agent:** Use the **phase-pr-agent** to create PR and integrate with Jira (if configured).

**Execution:**

Spawn the **phase-pr-agent** in background to create the PR:

```
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/phase-pr-agent/AGENT.md and execute with input: {\"branch\": \"$(git branch --show-current)\", \"title\": \"[generated PR title]\", \"description\": \"[generated PR description]\", \"jira_key\": \"[extracted from branch or plan]\", \"working_directory\": \"$(pwd)\"}"
)
```

**Preparing Inputs:**

1. **Branch:** Current git branch name (auto-detected: `git branch --show-current`)
2. **Title:** Generate from commit messages or plan summary
   - Format: `<type>(<scope>): <summary>` (e.g., "feat(api): Add user endpoint")
   - Keep under 70 characters
3. **Description:** Generate from plan and changes
   - Use template below
   - Include summary, changes, test plan, risks
4. **Jira Key:** Extract from branch name (e.g., "PROJ-123" from "feature/PROJ-123-add-login") or plan context
5. **Optional:** `mark_ready: false` (default) to create as draft, `mark_ready: true` to mark ready immediately

**PR Description Template:**

```markdown
## Summary
- [Bullet 1: What changed]
- [Bullet 2: Why it changed]
- [Bullet 3: Impact or benefit]

## Changes
- `path/to/file1.ts` - Description of changes
- `path/to/file2.py` - Description of changes

## Test Plan
- [ ] Unit tests pass (phase-testing-agent)
- [ ] Integration tests pass
- [ ] Manual testing: [specific steps]

## Risks/Notes
- [Any concerns, breaking changes, migration notes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Agent Actions:**

The phase-pr-agent will:
1. **Create draft PR** via `gh pr create --draft`
2. **Link to Jira** (if jira_key provided and Atlassian MCP configured):
   - Add PR URL as comment to Jira issue
   - Transition Jira issue to "In Code Review" state (fuzzy match for transition name)
3. **Mark ready** (if mark_ready: true)
4. Return structured JSON with PR URL and Jira status

**Agent Output:**

```json
{
  "status": "pass",             // or "fail"
  "pr_url": "https://github.com/org/repo/pull/42",
  "pr_number": 42,
  "jira_status": {
    "linked": true,             // PR linked to Jira issue
    "transitioned": true,       // Jira transitioned to "In Code Review"
    "current_state": "In Code Review"
  },
  "marked_ready": false,        // Whether PR marked ready for review
  "errors": []                  // Array of errors (empty if success)
}
```

**Handling Agent Results:**

- **If status = "pass":**
  - Display PR URL to user: `pr_url`
  - If jira_status.transitioned = true: Confirm Jira updated
  - If jira_status.linked = true but transitioned = false: Warn user (linked but not transitioned)
  - If errors array not empty: Show warnings (e.g., Jira not configured)
  - Ask user if they want to mark PR ready now (if marked_ready = false)
- **If status = "fail":**
  - Review errors array for specific failures
  - Common errors: branch not found, PR already exists, Jira issue not found
  - Fix issues and re-run agent

**Graceful Degradation:**

The agent handles missing Jira configuration gracefully:
- If Atlassian MCP not configured → PR still created, Jira steps skipped
- If Jira issue not found → PR still created, error noted in output
- If Jira transition fails → PR still created and linked, transition error noted

**Manual PR Marking Ready:**

If mark_ready was false (default), manually mark ready when all commits are pushed:

```bash
gh pr ready <pr-number>
```

**Required Checks (before Phase 8):**

- [ ] Phase-pr-agent executed and returned status "pass"
- [ ] PR URL received and verified
- [ ] Jira linked (if applicable and MCP configured)
- [ ] PR marked ready for review (manually or via mark_ready: true)

---

## Phase 8: Monitor & Summarize

**Goal:** Document outcomes and capture learnings.

**PARA command:** Use `/summarize` once work is complete (e.g. after PR merge).

**Skills:** Use **para** skill for summary, **documentation** skill if docs need updating.

**Actions:**

1. Monitor PR feedback and CI checks
2. Address review comments
3. Once merged, run `/summarize` to document in `context/summaries/YYYY-MM-DD-<task-name>.md`
4. Update documentation if needed (README, API docs, ADRs)

**Summary Document Contents:**

- What was built/fixed
- Files modified (with impact)
- Key decisions made
- Lessons learned
- Known limitations
- Future improvements
- Link to merged PR and commits

**Commit Summary to Git:**

After creating the summary, commit it to git:

```bash
git add context/summaries/<summary-file>.md
git commit -m "docs: add summary for <task>"
```

**⚡ PARALLEL SUBAGENTS for documentation (if docs need updating):**

```
Task(subagent_type="general-purpose", prompt="Update README.md with new feature/change following documentation skill")
Task(subagent_type="general-purpose", prompt="Update API docs for new/changed endpoints following documentation skill")
Task(subagent_type="general-purpose", prompt="Write ADR for architectural decision made, following documentation skill ADR format")
```

Only launch doc subagents if documentation updates are needed for this change.

---

## Subagent Types & Parallel Execution

Use multiple subagents simultaneously to parallelize work across different task types:

### Subagent Capabilities

| Agent Type          | Best For                                               | Triggers                                                     |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Explore**         | Code navigation, pattern discovery, codebase structure | Finding files, understanding architecture, locating patterns |
| **Bash**            | Git operations, builds, test runs, command execution   | Build, test, commit, push operations                         |
| **General-purpose** | Complex analysis, research, multi-step tasks           | Writing code, designing solutions, investigating issues      |
| **RLM**             | Large codebases (100+ files), map-reduce tasks         | Parallel file analysis, cross-system changes                 |
| **Plan**            | Design and architecture planning                       | Designing implementation approach                            |

### Parallel Execution Patterns

**Pattern 1: Explore + Write in Parallel**

```
- Explore agent: Scan for existing test patterns
- General-purpose agent: Write new tests
- Results: Consolidate findings and update tests
```

**Pattern 2: Build + Test + Validation Parallel**

```
- Bash agent: Run build command
- Bash agent: Run test suite
- General-purpose agent: Code review
- Results: Consolidate status and fix failures
```

**Pattern 3: RLM Map-Reduce**

```
- RLM: Parallel analysis of 100+ files
- Multiple agents: Process different subsystems
- Consolidate: Merge results and implement
```

### When to Use Multiple Subagents

Launch multiple subagents in parallel when:

- Tasks are independent (one doesn't depend on another's result)
- Same overall phase (e.g., multiple Test subtasks in Phase 4)
- Time savings justify context overhead
- Tasks are naturally divisible

---

## RLM Integration for Large Codebases

When working with large repositories (100+ files):

1. **Use RLM Skill:** Use the RLM skill for parallel exploration when the codebase has 100+ files
2. **Map-Reduce Pattern:** Break complex tasks into parallel subtasks:
   - Map: Parallel file search and analysis by multiple agents
   - Reduce: Consolidate findings and implement
3. **Context Efficiency:** RLM prevents context overflow in large projects
4. **Dependency Analysis:** Use RLM to understand file relationships before editing

**When to activate RLM:**

- Codebase has 100+ files
- Task touches multiple subsystems
- Need to understand cross-file dependencies
- Search space is too large for sequential exploration

**Parallel Agent Strategy with RLM:**

- RLM coordinates parallel subagents for different code sections
- Each subagent analyzes its assigned portion
- Results consolidated for coherent implementation
- Prevents context rot on massive projects

---

## Workflow Checklist

- [ ] Phase 1: Plan created and approved (para skill)
- [ ] Phase 2: Feature branch created
- [ ] Phase 3: **Implementation complete** (developer skill)
  - [ ] TDD followed (tests before code)
  - [ ] All developer skill quality gates met
- [ ] Phase 4: **Test validation complete** (testing skill)
  - [ ] All tests pass
  - [ ] Additional edge case tests added
  - [ ] Integration tests pass (if applicable)
  - [ ] E2E tests via Playwright MCP pass (if UI exists)
  - [ ] Build succeeds (mandatory for frontend/compiled languages)
- [ ] Phase 5: **Validation complete (MANDATORY)**
  - [ ] Formatter run and code formatted
  - [ ] Linter passes
  - [ ] Build succeeds
  - [ ] All tests pass
  - [ ] Security review passed
  - [ ] Code review passed
- [ ] Phase 6: Changes committed and pushed
- [ ] Phase 7: PR created as draft; marked ready with `gh pr ready` after all commits pushed
- [ ] Phase 8: Summary documented after merge

---

## ⛔ BLOCKING GATES (Workflow MUST STOP if not met)

**The workflow CANNOT proceed to Phase 6 (Commit) until ALL of these pass:**

| Gate         | Requirement                              | What Happens if Not Met                                    |
| ------------ | ---------------------------------------- | ---------------------------------------------------------- |
| **Tests**    | All tests must pass                      | STOP. Write tests. Do not proceed.                         |
| **Build**    | Build must succeed (frontend/compiled)   | STOP. Fix build errors. Do not proceed.                    |
| **Format**   | Formatter must be run and code formatted | STOP. Run formatter (e.g. npm run format). Do not proceed. |
| **Lint**     | Linter must pass                         | STOP. Fix lint errors. Do not proceed.                     |
| **UI Tests** | Playwright MCP E2E tests (if UI exists)  | STOP. Add E2E tests via Playwright. Do not proceed.        |

**NEVER output "Optional next steps" for testing.** Testing is NOT optional. If tests are missing:

1. STOP the workflow
2. Write the required tests
3. Run tests until they pass
4. Only then proceed to commit

**For frontend projects specifically:**

- `npm test` (or equivalent) MUST pass
- `npm run build` MUST succeed
- If UI exists, E2E tests via Playwright MCP MUST pass

**For backend projects (Go, Python, Ruby, Rust, Java):**

- Test command MUST pass (`go test -race ./...`, `pytest`, `rspec`, `cargo test`, `mvn test`)
- Build command MUST succeed (if applicable)

---

## Output

When complete (ONLY after all gates pass):

- Merged PR URL
- Summary of what was accomplished
- Link to summary document in `context/summaries/`
- **Confirmation that all tests pass**
- **Confirmation that build succeeds**
