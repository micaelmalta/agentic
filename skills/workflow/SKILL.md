---
name: workflow
description: "Complete development workflow from planning to GitHub PR using PARA methodology and RLM for large codebases. Use when implementing a feature, fixing a bug, refactoring, or taking work from plan to GitHub PR."
triggers:
  - "/workflow"
  - "implement a feature"
  - "fix bug end to end"
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
| `Task`                                              | Spawn parallel subagents; use for map phase, then reduce outputs |

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

**CRITICAL:** Launch independent subagents in parallel using multiple Task tool calls. See **[PARALLEL.md](PARALLEL.md)** for full details: execution groups by phase, subagent types, patterns, and RLM integration.

**Key rules:** Independent tasks within a phase run in parallel. Sequential skills (debugging, refactoring, dependencies, performance, git-commits) must NOT be parallelized.

---

## Feedback Loops (MANDATORY)

**⚠️ CRITICAL:** The workflow enforces retry loops at each gate. You MUST NOT proceed until all checks pass.

**Loop 1 -- TDD (Phase 3):** Write Test -> Run (FAIL) -> Write Code -> Run (PASS) -> Refactor -> Repeat for next behavior.

**Loop 2 -- Testing (Phase 4):** Run all tests -> if any fail, identify failure, fix code (not test unless test is wrong), re-run ALL tests. Escalate after 3 failed attempts.

**Loop 3 -- Validation (Phase 5):** Run 6 checks -> if any fail, auto-fix format/lint, fix build/test errors, address review feedback, fix vulnerabilities (NEVER skip security). Re-run all validations. Escalate if security issue cannot be resolved.

**Escalation Rules:**

| Situation                           | Action                               |
| ----------------------------------- | ------------------------------------ |
| Test fails 3+ times for same reason | Ask user for guidance                |
| Security vulnerability found        | STOP workflow, require user decision |
| Conflicting requirements            | Ask user to clarify                  |
| External dependency blocking        | Document blocker, ask user           |
| Flaky test detected                 | Fix flakiness before proceeding      |

**Enforcement:** Track retry count for each gate. Log each failure and fix attempt. Never proceed with failing checks. Document retries in commit message or summary.

---

## Protocol: PARA-Driven Development Workflow

**PHASE SEQUENCING REQUIREMENT:** Phases must execute in order (1→2→3→4→5→6→7→8). Do NOT skip phases. After Phase 1 approval, execute phases 2-8 autonomously without stopping between phases.

**⛔ MANDATORY GATES:** Testing (Phase 4) and validation (Phase 5) are NOT optional. All tests must pass and all 6 validation checks (formatter, linter, build, tests, code-reviewer, security-reviewer) must pass before commit. Use `python3 skills/workflow/scripts/validate_phase.py --phase 5` to verify.

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

Launch parallel subagents for independent tasks within a phase. All subagents must complete Phase N before starting Phase N+1. Use TodoWrite to track progress. See **[PARALLEL.md](PARALLEL.md)** for subagent types and execution patterns.

---

## Hybrid Architecture: Workflow Skill + Phase Agents

This workflow uses a hybrid architecture with direct orchestration (Phases 1-3, 6, 8) and autonomous **phase agents** (Phases 4, 5, 7). See **[AGENTS.md](AGENTS.md)** for full details: agent specs, I/O schemas, invocation patterns, and benefits.

**Phase agents:** `phase-testing-agent` (Phase 4), `phase-validation-agent` (Phase 5), `phase-pr-agent` (Phase 7). Each runs in background, auto-detects context, retries on failure, and returns structured JSON.

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

**Note:** The `context/` directory is git-ignored. Plans are local session artifacts and are not committed to git.

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

**⛔ PHASE 3 TDD GATE ENFORCEMENT:**

Each behavior/requirement MUST complete the full TDD cycle before proceeding:

```
TDD CYCLE GATE (per behavior):
✓ [ ] RED: Test written and FAILS (proves requirement not yet met)
✓ [ ] GREEN: Minimum code written and test now PASSES
✓ [ ] REFACTOR: Code cleaned up, tests still PASS
✓ [ ] All tests PASS (not just the new one)
✓ [ ] Code follows project conventions
✓ [ ] No security vulnerabilities introduced

IF any gate fails:
  → Do NOT move to next behavior
  → Complete current TDD cycle first
  → Verify all tests pass
  → Then proceed to next behavior

⛔ CRITICAL: TDD is NON-NEGOTIABLE - tests MUST come before implementation
⛔ CRITICAL: Each behavior gets its own TDD cycle (don't batch)
```

**Actions:**

1. Start execution with `/execute`; track progress with TodoWrite tool
2. **Read and follow the developer skill** for implementation using TDD (Red-Green-Refactor):
   - **RED:** Write a failing test that defines the expected behavior
     - Test MUST fail initially (proves requirement not yet implemented)
     - If test passes immediately, test is wrong or feature already exists
   - **GREEN:** Write the minimum code to make the test pass
     - Write ONLY enough code to pass the test
     - Don't add extra features or functionality
   - **REFACTOR:** Clean up code while keeping tests green
     - Improve structure, naming, readability
     - Tests MUST remain green throughout refactoring
   - **Repeat for each behavior/requirement**
   - **Bug fixes:** Write reproduction test first (RED), then fix (GREEN), then refactor
   - **Refactoring existing code:** Ensure existing tests pass as safety net before and after changes
3. Use parallel subagents for efficient execution:
   - **Bash agent:** Git operations, command execution, builds
   - **Explore agent:** Code navigation, pattern discovery
   - **General-purpose agent:** Research, complex analysis, test writing
   - **RLM skill:** Parallel implementation on multiple independent files/components
4. Reference plan document during execution
5. Commit changes atomically with clear messages (one commit per behavior or logical unit)
6. Document deviations from plan in commit messages

**Parallel Execution Strategy:**

- Break independent tasks into subtasks for parallel processing
- Use RLM for map-reduce style implementation across many files
- Different agents can work on different components simultaneously
- Merge results after all subtasks complete
- **IMPORTANT:** Each parallel track MUST follow TDD independently

**TDD Cycle Enforcement (per behavior):**

```
FOR each behavior in plan:
  1. RED phase:
     → Write failing test
     → Run test (MUST fail)
     → IF test passes: Test is wrong or feature exists

  2. GREEN phase:
     → Write minimum code to pass test
     → Run test (MUST pass)
     → Run ALL tests (MUST all pass)
     → IF any test fails: Fix code, retry

  3. REFACTOR phase:
     → Clean up code structure
     → Run ALL tests (MUST all pass)
     → IF tests fail: Undo refactor or fix issue

  4. Verify quality gates:
     → All tests pass
     → Code follows conventions
     → No security issues

  5. ONLY THEN proceed to next behavior
END FOR
```

**Quality Gates (from developer skill):**

These gates MUST be met before proceeding to Phase 4:

- [ ] **TDD followed (tests before code)** - MANDATORY for all features
- [ ] **All tests pass** - No failing tests allowed
- [ ] **Code follows project conventions** - Linting, formatting, naming
- [ ] **No security vulnerabilities** - No SQL injection, XSS, auth issues, etc.
- [ ] **Changes are minimal and focused** - Only what's needed for the requirement
- [ ] **Each behavior has test coverage** - No untested code paths
- [ ] **Commits are atomic** - One commit per behavior or logical unit

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 4 until:
1. All behaviors completed with full TDD cycle (RED → GREEN → REFACTOR)
2. All tests pass (verify manually if needed)
3. All quality gates above are verified
4. All code is committed with clear messages

---

## Phase 4: Testing Validation (MANDATORY)

**Goal:** Verify all tests pass and coverage is adequate.

**⚠️ BLOCKING REQUIREMENT:** Testing is MANDATORY. Do NOT proceed to Phase 5 until all tests pass.

**⛔ PHASE 4 GATE ENFORCEMENT:**

Before proceeding to Phase 5, you MUST verify ALL testing gates pass:

```
PHASE 4 TESTING GATE CHECKLIST:
✓ [ ] Unit tests executed and ALL pass (no failures)
✓ [ ] Integration tests executed and ALL pass (if applicable)
✓ [ ] E2E tests executed via Playwright MCP and ALL pass (if UI exists)
✓ [ ] Build executed and succeeds (MANDATORY for frontend/compiled languages)
✓ [ ] Agent returned status "pass"
✓ [ ] No failing tests in agent output (failing_count = 0)
✓ [ ] Build status = "pass" (if build was required)

IF ANY check above fails:
  → STOP immediately
  → DO NOT proceed to Phase 5
  → Fix the failing tests or build errors
  → Re-run phase-testing-agent
  → Verify ALL tests pass before continuing

⛔ CRITICAL: All tests MUST pass - no exceptions
⛔ CRITICAL: Build MUST succeed for frontend/compiled languages
```

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

**Individual Test Gates:**

Each test type is a blocking gate that must pass:

1. **Unit Tests Gate:** All unit tests must pass with no failures
   - Retry attempts: Up to 3 (with backoff: 5s, 10s, 15s)
   - If fails after retries: Fix tests or code, re-run agent

2. **Integration Tests Gate:** All integration tests must pass (if applicable)
   - Retry attempts: Up to 3 (with backoff: 5s, 10s, 15s)
   - If fails after retries: Fix integration issues, re-run agent

3. **Build Gate:** Build must succeed with no compilation/bundling errors
   - Retry attempts: Up to 1 (for transient failures)
   - If fails: Fix build errors, re-run agent
   - **MANDATORY for:** JavaScript/TypeScript (with build step), Go, Rust, Java, C#

4. **E2E Tests Gate (UI projects):** All E2E tests must pass via Playwright MCP
   - Required if: Project has UI/frontend
   - Tools: browser_navigate, browser_click, browser_snapshot, etc.
   - If fails: Fix E2E issues, re-run agent

**Handling Agent Results:** Agent returns JSON with `status`, `failing_tests[]`, `build_status`, `retry_count`. See `skills/agents/phase-testing-agent/AGENT.md` for full output schema.

- **If status = "pass":** Verify checklist above, then proceed to Phase 5
- **If status = "fail":** Review `failing_tests` array, identify root cause, fix issues, re-run agent. Do NOT proceed until status = "pass".
- **If build fails:** Review `build_status` and error messages, fix compilation/bundling errors, re-run agent.
- **If UI exists:** Also run E2E tests via Playwright MCP. If E2E fails, fix UI issues and re-run.

**Retry Loop (MANDATORY):**

```
WHILE testing not complete:
  1. Run phase-testing-agent
  2. Check agent output status
  3. IF status = "pass" AND no failing tests:
       → Verify checklist above
       → Proceed to Phase 5
  4. IF status = "fail":
       → Review failing_tests array
       → Identify root cause (test bug vs code bug)
       → Fix the issue (usually code, rarely test)
       → GOTO step 1
  5. IF build fails:
       → Review build errors
       → Fix compilation/bundling issues
       → GOTO step 1
  6. IF same failures 3+ times:
       → Escalate to user via AskUserQuestion
       → Present failing tests and error messages
       → Get user guidance
       → Apply fixes based on user input
       → GOTO step 1
END WHILE
```

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 5 until:
1. phase-testing-agent returns status "pass"
2. No failing tests (failing_count = 0 or empty failing_tests array)
3. Build succeeds (if build was required)
4. All items in the checklist above are verified

---

## Phase 5: Validation (MANDATORY)

**Goal:** Ensure quality and security.

**⚠️ BLOCKING REQUIREMENT:** All validation checks are MANDATORY. Do NOT proceed to Phase 6 until all checks pass.

**⛔ PHASE 5 GATE ENFORCEMENT:**

Before proceeding to Phase 6, you MUST verify ALL validation checks pass:

```
PHASE 5 VALIDATION GATE CHECKLIST:
✓ [ ] Formatter executed and code properly formatted
✓ [ ] Linter executed and ALL linting issues resolved
✓ [ ] Build executed and build succeeds (no compilation errors)
✓ [ ] Tests executed and ALL tests pass (no test failures)
✓ [ ] Code review completed and findings addressed
✓ [ ] Security review completed and NO vulnerabilities found
✓ [ ] Agent returned status "pass"
✓ [ ] Agent returned critical_security_issue = false

IF ANY check above fails:
  → STOP immediately
  → DO NOT proceed to Phase 6
  → Fix the failing check
  → Re-run phase-validation-agent
  → Verify ALL checks pass before continuing

⛔ CRITICAL: Code review and security review are NON-OPTIONAL GATES
⛔ CRITICAL: Security vulnerabilities BLOCK all progress until fixed
```

**Agent:** Use the **phase-validation-agent** to run 6 validation checks with auto-fix and retry.

**Execution:**

Spawn the **phase-validation-agent** in background to execute all validation checks:

```
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/phase-validation-agent/AGENT.md and execute with input: {\"working_directory\": \"$(pwd)\", \"changed_files\": [list of changed files from git diff], \"skip_tests\": true}"
  # skip_tests: true because tests already passed in Phase 4 (phase-testing-agent)
)
```

The agent runs **6 checks**: formatter, linter, build, tests (sequential); code-reviewer and security-reviewer (parallel). It auto-fixes format/lint issues with retry. See `skills/agents/phase-validation-agent/AGENT.md` for full output schema.

**Individual Check Gates:**

Each check is a blocking gate that must pass:

1. **Formatter Gate:** Code must be properly formatted according to project standards
   - Auto-fix attempts: Up to 3 retries
   - If fails after retries: Manual fix required, re-run agent

2. **Linter Gate:** Code must pass all linting rules with no errors
   - Auto-fix attempts: Up to 3 retries
   - If fails after retries: Manual fix required, re-run agent

3. **Build Gate:** Project must compile/build successfully with no errors
   - Retry attempts: Up to 1 (for transient failures)
   - If fails: Fix compilation errors, re-run agent

4. **Tests Gate:** All tests must pass (redundant check from Phase 4)
   - Retry attempts: Up to 1 (for flaky tests)
   - If fails: Fix test failures, re-run agent

5. **Code Review Gate:** Code must meet quality standards (correctness, readability, maintainability)
   - Severity levels: Critical (blocks), Suggestion (informational), Nit (informational)
   - Critical findings: MUST be addressed before proceeding
   - Suggestions/Nits: Should be addressed, but don't block

6. **Security Review Gate:** Code must have NO security vulnerabilities
   - Severity levels: Critical/High/Medium/Low
   - Critical vulnerabilities: Workflow STOPS immediately, escalate to user
   - High/Medium/Low: Must be reviewed and addressed before proceeding

**Critical Security Handling:** If a critical vulnerability is found, the agent STOPS immediately and sets `critical_security_issue: true`. The workflow MUST escalate to the user -- do NOT proceed until the vulnerability is fixed.

**Handling Agent Results:**

- **If status = "pass" AND critical_security_issue = false:** Verify all checks in checklist above, then proceed to Phase 6
- **If critical_security_issue = true:** STOP IMMEDIATELY. Present vulnerabilities to user. Fix vulnerabilities. Re-run agent. Do NOT proceed until security review passes.
- **If any check fails:** Identify which check failed. Fix issues by check type (format, lint, build, tests, code review, security). Re-run agent. Verify ALL checks pass before proceeding.

**Retry Loop (MANDATORY):**

```
WHILE validation not complete:
  1. Run phase-validation-agent
  2. Check agent output status
  3. IF status = "pass" AND critical_security_issue = false:
       → Verify checklist above
       → Proceed to Phase 6
  4. IF critical_security_issue = true:
       → STOP workflow
       → Present vulnerabilities to user
       → Get user decision (fix now, abort)
       → If fix now: Make fixes, GOTO step 1
       → If abort: End workflow
  5. IF any check fails:
       → Identify failing checks
       → Fix issues (format/lint auto-fixed, others manual)
       → GOTO step 1
  6. IF same failures 3+ times:
       → Escalate to user via AskUserQuestion
       → Get guidance
       → Apply fixes based on user input
       → GOTO step 1
END WHILE
```

**Optional skip parameters:** `skip_build: true`, `skip_tests: true`. **⛔ NEVER skip security review or code review.**

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 6 until:
1. phase-validation-agent returns status "pass"
2. critical_security_issue = false (or not present)
3. All 6 checks show status "pass" in agent output
4. All items in the checklist above are verified

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

**⛔ PHASE 7 GATE ENFORCEMENT:**

Before proceeding to Phase 8, you MUST verify PR creation succeeded:

```
PHASE 7 PR CREATION GATE CHECKLIST:
✓ [ ] PR created successfully on GitHub
✓ [ ] Agent returned status "success"
✓ [ ] PR URL is present and valid in agent output
✓ [ ] PR number is present in agent output
✓ [ ] Jira ticket linked to PR (if Jira integration configured)
✓ [ ] Jira ticket transitioned to "In Code Review" (if Jira integration configured)

IF PR creation fails:
  → STOP immediately
  → Review agent error output
  → Check prerequisites (gh CLI installed, authenticated, remote exists)
  → Fix the issue (auth, permissions, branch not pushed)
  → Re-run phase-pr-agent
  → Verify PR created before continuing

IF Jira integration fails but PR succeeds:
  → PR creation succeeded (proceed)
  → Log Jira integration failure for manual follow-up
  → Document in Phase 8 summary
```

**Agent:** Use the **phase-pr-agent** to create PR and integrate with Jira (if configured).

**Execution:**

Spawn the **phase-pr-agent** in background to create the PR:

```
Task(
  subagent_type="general-purpose",
  prompt="Read skills/agents/phase-pr-agent/AGENT.md and execute with input: {\"branch\": \"$(git branch --show-current)\", \"title\": \"[generated PR title]\", \"description\": \"[generated PR description]\", \"jira_key\": \"[extracted from branch or plan]\", \"working_directory\": \"$(pwd)\"}"
)
```

**Inputs:** branch (auto-detected), title (<70 chars), description (summary, changes, test plan, risks), jira_key (optional from branch/plan), mark_ready (default: false for draft).

**Agent actions:** Creates draft PR via `gh pr create --draft`, links to Jira and transitions to "In Code Review" (if configured), marks ready if requested. Returns JSON with `pr_url`, `pr_number`, `jira_status`. See `skills/agents/phase-pr-agent/AGENT.md` for full output schema.

**Handling Agent Results:**

- **If status = "success" AND pr_url is present:** PR created successfully, verify checklist above, proceed to Phase 8
- **If status = "fail":** PR creation failed. Review error message. Check prerequisites:
  - `gh` CLI installed and authenticated (`gh auth status`)
  - Remote repository configured (`git remote -v`)
  - Branch pushed to remote (`git push`)
  - Fix issue and re-run agent
- **If Jira integration fails but PR succeeds:** Acceptable (graceful degradation). Log for manual follow-up.

**Graceful degradation:** If Atlassian MCP is not configured, the PR is still created and Jira steps are skipped.

**After PR creation:** Mark ready when all commits are pushed: `gh pr ready <pr-number>`

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 8 until:
1. phase-pr-agent returns status "success"
2. pr_url is present and valid
3. PR is confirmed created on GitHub
4. All items in the checklist above are verified (or gracefully degraded for Jira)

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

**Note:** The `context/` directory is git-ignored. Summaries are local session artifacts and are not committed to git.

**⚡ PARALLEL SUBAGENTS for documentation (if docs need updating):**

```
Task(subagent_type="general-purpose", prompt="Update README.md with new feature/change following documentation skill")
Task(subagent_type="general-purpose", prompt="Update API docs for new/changed endpoints following documentation skill")
Task(subagent_type="general-purpose", prompt="Write ADR for architectural decision made, following documentation skill ADR format")
```

Only launch doc subagents if documentation updates are needed for this change.

---

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

## Output

When complete (ONLY after all gates pass):

- Merged PR URL
- Summary of what was accomplished
- Link to summary document in `context/summaries/`
- **Confirmation that all tests pass**
- **Confirmation that build succeeds**

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Phase 1 needs technical architecture | **architect** skill | Read `skills/architect/SKILL.md` |
| Phase 3 implementation uses TDD | **developer** skill | Read `skills/developer/SKILL.md` |
| Phase 4 testing details | **testing** skill | Read `skills/testing/SKILL.md` |
| Phase 5 code review | **code-reviewer** skill | Read `skills/code-reviewer/SKILL.md` |
| Phase 5 security review | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |
| Phase 6 commit messages | **git-commits** skill | Read `skills/git-commits/SKILL.md` |
| Phase 8 documentation | **documentation** skill | Read `skills/documentation/SKILL.md` |
| Large codebase in any phase | **rlm** skill | Read `skills/rlm/SKILL.md` |
