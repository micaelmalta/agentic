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

| Command / trigger                                             | Purpose                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------ |
| `/dev`, `/developer`                                          | Trigger TDD development workflow                             |
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

| Command / trigger                                  | Purpose                                                   |
| -------------------------------------------------- | --------------------------------------------------------- |
| `/debug`                                           | Trigger debugging workflow                                |
| "fix this bug", "why does this fail", "root cause" | Reproduce with test, hypothesize, bisect, fix (uses TDD)  |

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

| MCP                | When to use                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **atlassian**      | Jira: get issue details, search JQL, transitions, link to PR. Confluence: get page, search CQL, spaces. Use in **Phase 1 (Plan)** for ticket context and in **Phase 7 (PR)** to link PR to Jira.                             |
| **atlassian-tech** | Same capabilities as atlassian; use when the context is tech-specific (e.g. engineering Jira/Confluence).                                                                                                                    |
| **Datadog**        | Logs: search_logs, get_log_details. Metrics: query_metrics, list_metrics. Monitors: list_monitors, get_monitor_status. Traces: query_traces. Use in **debugging**, **ci-cd** (monitoring/alerts), and **Phase 8 (Monitor)**. |
| **Playwright**     | Browser automation for UI testing. **MANDATORY for any UI/frontend work.** Use in **Phase 4 (Testing)** for E2E and visual testing.                                                                                          |

Skills that should use these MCPs when the task involves tickets or observability: **workflow** (Jira/Confluence in plan and PR), **ci-cd** (Datadog for monitoring/observability), **debugging** (Datadog logs/traces), **documentation** (Confluence for docs), **testing** (Playwright for UI tests). Use **atlassian** or **atlassian-tech** as appropriate for the context.

---

## Parallel Execution Groups (Subagents)

**CRITICAL:** The following skill groups can and SHOULD run as parallel subagents to maximize efficiency. Launch all subagents in a single message using multiple Task tool calls.

### Group 1: Validation (Phase 5)

These skills are independent and should run as **parallel subagents**:

| Skill                   | Subagent Type     | Why Parallel                                  |
| ----------------------- | ----------------- | --------------------------------------------- |
| **code-reviewer**       | `general-purpose` | Reviews correctness/readability independently |
| **security-reviewer**   | `general-purpose` | Reviews security independently                |
| **testing** (run suite) | `Bash`            | Test execution is independent                 |
| **ci-cd** (lint/build)  | `Bash`            | Lint and build are independent                |

**Example parallel launch:**

```
Task(subagent_type="general-purpose", prompt="Run code-reviewer skill on changed files...")
Task(subagent_type="general-purpose", prompt="Run security-reviewer skill on changed files...")
Task(subagent_type="Bash", prompt="Run test suite: npm test")
Task(subagent_type="Bash", prompt="Run linter and build: npm run lint && npm run build")
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
│        │      Linter?          Review?                     │
│        │         │                 │                       │
│        │         ▼                 ▼                       │
│        │    Auto-fix or      Address                       │
│        │    Manual fix       feedback                      │
│        │         │                 │                       │
│        └─────────┴─────────────────┘                       │
│                                                             │
│   Max retries: Until all pass (no limit)                    │
│   Escalate: If security issue can't be resolved, STOP      │
└─────────────────────────────────────────────────────────────┘
```

**Checks (ALL must pass):**
- [ ] Linter passes (auto-fix allowed)
- [ ] Build succeeds
- [ ] Code review passed
- [ ] Security review passed

**On failure:**
1. **Linter fails:** Run auto-fix, then manual fix remaining
2. **Build fails:** Fix compilation/bundling errors
3. **Code review fails:** Address feedback, improve code
4. **Security review fails:** Fix vulnerability (NEVER skip)
5. Re-run ALL validations
6. Repeat until all pass

### Escalation Rules

| Situation | Action |
|-----------|--------|
| Test fails 3+ times for same reason | Ask user for guidance |
| Security vulnerability found | STOP workflow, require user decision |
| Conflicting requirements | Ask user to clarify |
| External dependency blocking | Document blocker, ask user |
| Flaky test detected | Fix flakiness before proceeding |

### Loop Enforcement

**The workflow MUST:**
1. Track retry count for each gate
2. Log each failure and fix attempt
3. Never proceed with failing checks
4. Ask user if stuck (after reasonable attempts)
5. Document all retries in commit message or summary

---

## Protocol: PARA-Driven Development Workflow

**BLOCKING REQUIREMENT:** Follow phases in order. Do NOT skip phases or make assumptions about what needs to be done.

**⛔ MANDATORY TESTING:** Testing is NOT optional. The workflow MUST include:

- Writing and passing tests (Phase 4)
- Build verification (Phase 4/5)
- For UI: E2E tests via Playwright MCP
- **NEVER suggest tests as "optional" or "next steps"**
- **STOP and write tests before proceeding to commit**

**OUTCOME FOCUS:** Work continues until PR is merged or explicitly stopped by user. Track progress visibly at each phase.

**PARALLEL EXECUTION:** Launch multiple subagents simultaneously for independent tasks within the same phase. Track all parallel work with TodoWrite tool.

**PARA SKILL INVOCATION:** This workflow **must** use the **para** skill. At the start of any workflow run, **read** `skills/para/SKILL.md` and follow it for:

- **Plan phase:** Use PARA's `/plan` semantics: create `context/plans/YYYY-MM-DD-<task-name>.md`, document objectives/approach/steps, and follow PARA's Plan and Review phases.
- **Execute phase:** Use PARA's `/execute` semantics: track progress, reference the plan, document deviations.
- **Summarize phase:** Use PARA's `/summarize` semantics: create `context/summaries/YYYY-MM-DD-<task-name>.md` with outcomes and learnings.
- **Archive phase:** Use PARA's `/archive` when work is complete to move plans/summaries to `context/archives/`.

Do not implement a custom plan/execute/summarize flow; use the para skill's structure and commands.

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

**Approval Gate:**

- Present plan to user for review
- User can approve, request changes, or provide clarification
- Do NOT proceed to execution without approval

---

## Phase 2: Create Feature Branch

**Goal:** Set up isolated work environment.

**Actions:**

1. Create feature branch: `git checkout -b feature/<description>` or `fix/<description>`
2. Confirm branch creation with `git status`

---

## Phase 3: Execute Implementation

**Goal:** Implement according to approved plan.

**PARA command:** Use `/execute` to implement with tracking and context.

**Skill:** Use the **developer** skill (`skills/developer/SKILL.md`) for all implementation. The developer skill enforces TDD (Test-Driven Development).

**Actions:**

1. Start execution with `/execute`; track progress with TodoWrite tool
2. **Read and follow the developer skill** for implementation:
   - **Features:** Red-Green-Refactor cycle (tests first)
   - **Bug fixes:** Write reproduction test first, then fix
   - **Refactoring:** Tests as safety net
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

**Skills:** Use the **testing** skill for test execution and the **developer** skill for TDD validation. **For UI/frontend work, Playwright MCP is MANDATORY.**

**NOTE:** If following the developer skill (TDD) correctly, tests should already exist from Phase 3. This phase validates and extends coverage.

**Language-Specific Requirements:**

| Stack                | Mandatory Checks                              | Commands                           |
| -------------------- | --------------------------------------------- | ---------------------------------- |
| **Frontend (JS/TS)** | Tests pass AND build succeeds                 | `npm test && npm run build`        |
| **Node.js**          | Tests pass AND build succeeds (if applicable) | `npm test` / `npm run build`       |
| **Python**           | Tests pass                                    | `pytest` or `python -m pytest`     |
| **Go**               | Tests pass                                    | `go test -race ./...`              |
| **Ruby**             | Tests pass                                    | `bundle exec rspec` or `rake test` |
| **Rust**             | Tests pass                                    | `cargo test`                       |
| **Java**             | Tests pass AND build succeeds                 | `mvn test` / `gradle test`         |

**Actions:**

1. Verify tests from Phase 3 (developer skill TDD) are passing
2. Add additional test coverage using parallel subagents:
   - **Bash agent:** Run test suite, execute build commands
   - **General-purpose agent:** Write additional edge case tests
   - **Explore agent:** Find existing test patterns and files to emulate
   - **Playwright MCP:** For UI testing (mandatory if frontend)
3. Test coverage requirements:
   - Happy path (primary use case)
   - Edge cases (boundary conditions, empty data)
   - Error handling (invalid inputs)
   - Regression tests (existing scenarios still work)
4. Parallel test execution:
   - Run unit tests
   - Run integration tests (if applicable)
   - Run E2E tests via Playwright MCP (if UI exists)
5. **For frontend/UI projects:** Verify build succeeds
6. Fix any test failures or regressions
7. Validate test coverage is reasonable

**Required Coverage (ALL must pass to proceed):**

- [ ] New code is tested
- [ ] Edge cases covered
- [ ] No regressions in existing tests
- [ ] Tests are deterministic (not flaky)
- [ ] **Frontend: Build succeeds** (mandatory for JS/TS/Node projects)

**⚠️ RETRY LOOP (MANDATORY):**

```
WHILE any test fails:
    1. Identify failed test(s)
    2. Analyze failure reason
    3. Fix code (or test if test is wrong)
    4. Re-run ALL tests
    5. IF same failure 3+ times: Ask user for guidance
END WHILE
→ Only proceed when ALL tests pass
```

**DO NOT proceed to Phase 5 until this loop completes successfully.**
- [ ] **UI: E2E tests via Playwright MCP** (mandatory if UI exists)

**⚡ PARALLEL SUBAGENTS (launch in single message):**

```
Task(subagent_type="Bash", prompt="Run existing test suite to establish baseline")
Task(subagent_type="Bash", prompt="Run build to verify compilation: npm run build (or equivalent)")
Task(subagent_type="general-purpose", prompt="Write unit tests for [component A] following testing skill")
Task(subagent_type="general-purpose", prompt="Write unit tests for [component B] following testing skill")
Task(subagent_type="Explore", prompt="Find existing test patterns in codebase to emulate")
```

**For UI projects, also use Playwright MCP:**

```
Use Playwright MCP tools (browser_navigate, browser_click, browser_type, browser_screenshot) for E2E testing
```

Wait for all subagents to complete, then consolidate and fix any failures. **Do NOT proceed until ALL tests pass and build succeeds.**

---

## Phase 5: Validation (MANDATORY)

**Goal:** Ensure quality and security.

**⚠️ BLOCKING REQUIREMENT:** All validation checks are MANDATORY. Do NOT proceed to Phase 6 until all checks pass.

**Skills:** Use **code-reviewer**, **security-reviewer**, and **ci-cd** skills.

**Language-Specific Validation:**

| Stack                | Mandatory Validation                 | Commands                                                     |
| -------------------- | ------------------------------------ | ------------------------------------------------------------ |
| **Frontend (JS/TS)** | Lint + Build + Tests                 | `npm run lint && npm run build && npm test`                  |
| **Node.js**          | Lint + Build (if applicable) + Tests | `npm run lint && npm run build && npm test`                  |
| **Python**           | Lint + Tests                         | `ruff check . && pytest` or `flake8 && pytest`               |
| **Go**               | Lint + Build + Tests                 | `golangci-lint run && go build ./... && go test -race ./...` |
| **Ruby**             | Lint + Tests                         | `rubocop && bundle exec rspec`                               |
| **Rust**             | Lint + Build + Tests                 | `cargo clippy && cargo build && cargo test`                  |
| **Java**             | Lint + Build + Tests                 | `mvn checkstyle:check && mvn compile && mvn test`            |

**Actions:**

1. Run linter/formatter: `npm run lint` or equivalent
2. Run build: `npm run build` or equivalent (MANDATORY for compiled languages and frontend)
3. Run tests: Verify all tests still pass after any fixes
4. Security review (security-reviewer skill):
   - No hardcoded secrets or credentials
   - No expanded data access
   - No common vulnerabilities (injection, XSS, etc.)
5. Code review (code-reviewer skill):
   - Clear variable names
   - Logical flow is obvious
   - Tests are meaningful
6. Performance check (if applicable):
   - No N+1 queries
   - No significant performance degradation

**Required Validation (ALL must pass to proceed):**

- [ ] Linter passes with no errors
- [ ] Build succeeds (mandatory for frontend, compiled languages)
- [ ] All tests pass
- [ ] Security review complete (no vulnerabilities)
- [ ] Code review complete (acceptable quality)

**⚠️ RETRY LOOP (MANDATORY):**

```
WHILE any validation fails:
    1. Identify which check(s) failed
    2. FOR linter errors:
       - Run auto-fix (e.g., npm run lint --fix)
       - Manually fix remaining issues
    3. FOR build errors:
       - Fix compilation/type errors
    4. FOR security issues:
       - Fix vulnerability (NEVER skip or ignore)
       - If unfixable, STOP and escalate to user
    5. FOR code review issues:
       - Address feedback
       - Improve code quality
    6. Re-run ALL validations
    7. IF same failure 3+ times: Ask user for guidance
END WHILE
→ Only proceed when ALL validations pass
```

**DO NOT proceed to Phase 6 until this loop completes successfully.**

**⚡ PARALLEL SUBAGENTS (launch ALL in single message):**

```
Task(subagent_type="Bash", prompt="Run linter: npm run lint (or project equivalent)")
Task(subagent_type="Bash", prompt="Run build: npm run build (or project equivalent)")
Task(subagent_type="Bash", prompt="Run tests: npm test (or project equivalent)")
Task(subagent_type="general-purpose", prompt="Run code-reviewer skill on all changed files. Review for correctness, readability, maintainability.")
Task(subagent_type="general-purpose", prompt="Run security-reviewer skill on all changed files. Check for injection, XSS, auth issues, sensitive data exposure.")
```

Wait for all 5 subagents to complete, then consolidate findings and fix any issues before proceeding. **Do NOT proceed until ALL validation checks pass.**

---

## Phase 6: Commit & Push

**Goal:** Stage work for PR creation.

**Skill:** Use **git-commits** skill for commit message conventions.

**Actions:**

1. Stage all relevant files: `git add <files>`
2. Create commit with clear message (follow git-commits skill / project conventions)
3. Push to remote: `git push -u origin <branch-name>`

**Commit Message Format (Conventional Commits):**

- First line: `<type>(<scope>): <summary>` (50 chars max)
- Blank line
- Detailed explanation of why change was made
- Reference issue/ticket if applicable

**Note:** This phase is **sequential** - must complete after validation passes.

---

## Phase 7: Create GitHub PR

**Goal:** Submit work for team review.

**Actions:**

1. Create PR with `gh pr create`
2. Include:
   - Clear title summarizing change
   - Description with context and reasoning
   - Link to related issue/ticket
   - Test plan or validation steps
   - Any breaking changes or migration notes

**PR Description Template:**

```
## Summary
[1-3 bullet points of what changed and why]

## Changes
[List of files modified and what changed]

## Test Plan
[Steps to verify the changes work]

## Risks/Notes
[Any concerns or things reviewers should know]
```

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
  - [ ] Linter passes
  - [ ] Build succeeds
  - [ ] All tests pass
  - [ ] Security review passed
  - [ ] Code review passed
- [ ] Phase 6: Changes committed and pushed
- [ ] Phase 7: PR created with clear description
- [ ] Phase 8: Summary documented after merge

---

## ⛔ BLOCKING GATES (Workflow MUST STOP if not met)

**The workflow CANNOT proceed to Phase 6 (Commit) until ALL of these pass:**

| Gate         | Requirement                             | What Happens if Not Met                             |
| ------------ | --------------------------------------- | --------------------------------------------------- |
| **Tests**    | All tests must pass                     | STOP. Write tests. Do not proceed.                  |
| **Build**    | Build must succeed (frontend/compiled)  | STOP. Fix build errors. Do not proceed.             |
| **Lint**     | Linter must pass                        | STOP. Fix lint errors. Do not proceed.              |
| **UI Tests** | Playwright MCP E2E tests (if UI exists) | STOP. Add E2E tests via Playwright. Do not proceed. |

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
