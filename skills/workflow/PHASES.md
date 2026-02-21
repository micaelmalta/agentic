# Workflow Phases: Detailed Protocol

This document contains the detailed protocol for all 8 phases of the workflow skill. For overview and quick reference, see [SKILL.md](SKILL.md).

## Contents

- [Phase 1: Plan](#phase-1-plan)
- [Phase 2: Create Git Worktree](#phase-2-create-git-worktree)
- [Phase 3: Execute Implementation](#phase-3-execute-implementation)
- [Phase 4: Testing Validation](#phase-4-testing-validation-mandatory)
- [Phase 5: Validation](#phase-5-validation-mandatory)
- [Phase 5.5: Diff Review Gate](#phase-55-diff-review-gate)
- [Phase 6: Commit & Push](#phase-6-commit--push)
- [Phase 7: Create GitHub PR](#phase-7-create-github-pr)
- [Phase 8: Monitor, Summarize & Cleanup](#phase-8-monitor-summarize--cleanup)

---

## Phase 1: Plan

**Goal:** Create detailed implementation plan before writing code.

**PARA command:** Use `/plan <task>` to create the plan. **Follow the para skill** (`skills/para/SKILL.md`) for plan creation, file location (`context/plans/YYYY-MM-DD-<task-name>.md`), and Review phase (present plan for approval).

**Plan skills and tech proposal:** When the plan involves technical design, architecture, new features, or system changes:

- **Read and follow the architect skill** (`skills/architect/SKILL.md`).
- **Use the tech proposal template** (`skills/architect/tech_proposal_template.md`): read it first, then structure the plan (or a separate tech spec) using its sections (Metadata, Architecture Considerations, API Changes, Data Models, Domain Architecture, Additional Considerations, Estimation & Implementation Plan). Output a tech spec to `docs/tech-specs/YYYY-MM-DD-<feature>.md` or `context/tech-specs/` when appropriate, and reference it from the plan.

**Skills:** Use **para** skill for planning; use **architect** skill and **tech_proposal_template.md** when the plan requires technical design or a tech spec.

**Actions:**

1. **If a Jira ticket key is provided:** Transition it to **In Progress** immediately — planning has started.
   - Call `jira_get_transitions` with the issue key, find the transition matching "In Progress" (names vary by project), then call `jira_transition_issue` with that transition ID.
   - If Atlassian MCP is not configured: skip (graceful degradation).
2. Understand the requirements and task scope
3. Explore affected code sections using parallel subagents
4. Identify implementation approach and files to modify
5. If tech design is needed: read architect skill and tech_proposal_template.md; produce structured plan or tech spec using the template
6. Create plan via PARA `/plan`: document in `context/plans/YYYY-MM-DD-<task-name>.md`

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

### Design Ownership

The primary control mechanism is a Phase 1 plan detailed enough to **constrain implementation**. When the plan defines interfaces, test scenarios, error strategies, and module boundaries, Phase 3 becomes mechanical translation — there are few decisions left for the AI to make autonomously. A shallow plan (listing files and vague testing strategies) leaves the AI to make dozens of implementation decisions you never approved. A constraining plan minimizes autonomous decisions.

**For examples of shallow vs constraining plans:** See [context/data/DRIVERS_SEAT.md](DRIVERS_SEAT.md).

Before approving a plan, verify it constrains implementation:

```
DESIGN OWNERSHIP CHECKLIST:
[ ] Module boundaries defined (what goes where)
[ ] Interfaces/types specified (function signatures, data shapes)
[ ] Key design decisions documented (token format, error strategy, security model)
[ ] Test scenarios specified (Given/When/Then for each behavior)
[ ] Edge cases and error handling strategy defined
[ ] Migration/schema defined (if applicable)
```

**Checklist depth scales with scope:** Simple bug fixes need less detail than new features. A typo fix doesn't need interface definitions. A new service needs all items. Use judgment — the goal is to ensure all significant design decisions are made by the human, not to generate paperwork.

### Readiness Requirements

Design ownership controls the implementation. Readiness requirements ensure you've thought through everything _around_ the implementation — support, operations, impact, monitoring. These sections must be present in the Phase 1 plan. Depth scales with scope, but they cannot be omitted.

#### 1. Support

```
## Support

- Troubleshooting: [what to check when things go wrong]
- Known limitations: [what this doesn't handle]
- User-facing docs: [what needs updating — help docs, FAQ, tooltips]
- Escalation: [who to contact beyond the troubleshooting guide]
```

**Go deeper for:** User-facing features, new integrations, behavior changes.
**Keep light for:** Internal tooling, refactors with no behavior change.

#### 2. Operations

```
## Operations

- Failure modes: [what can go wrong, how the system behaves]
- Recovery: [how to recover from each failure mode]
- Rollback: [how to revert safely]
- Runbook: [what operational docs need updating]
```

**Go deeper for:** New services, infrastructure changes, data migrations.
**Keep light for:** Feature additions to existing stable services.

#### 3. Release Communication

```
## Release Communication

- Changelog entry: [one-line description for release notes]
- Who needs to know: [product, marketing, support, customers]
- Announcement: [yes/no, and where — blog, email, in-app]
```

**Go deeper for:** New features, breaking changes, pricing-related changes.
**Keep light for:** Bug fixes, performance improvements, internal changes.

#### 4. Success Metrics

```
## Success Metrics

- Primary metric: [what number tells us this worked]
- Baseline: [current value]
- Target: [expected value after rollout]
- How to measure: [dashboard, query, tool]
- When to check: [1 day, 1 week, 1 month]
```

**Go deeper for:** New features, optimization work, anything with a business case.
**Keep light for:** Bug fixes (metric = bug gone), refactors (metric = no regression).

#### 5. Monitoring & Alerting

```
## Monitoring & Alerting

- Metrics: [latency, error rate, throughput, etc.]
- Dashboards: [which to update or create]
- Alerts: [conditions, thresholds, who gets paged]
- Log queries: [key searches for debugging]
```

**Go deeper for:** New services, new integrations, critical path changes.
**Keep light for:** Non-critical code with existing monitoring.

#### Readiness Checklist

```
READINESS CHECKLIST:
[ ] Support plan documented (or N/A with reason)
[ ] Operations plan documented (or N/A with reason)
[ ] Release communication documented (or N/A with reason)
[ ] Success metrics defined (or N/A with reason)
[ ] Monitoring & alerting defined (or N/A with reason)
```

Sections can be marked N/A with a brief reason (e.g., "N/A — internal refactor, no behavior change"). The point is to force the question, not generate paperwork.

### Collaborative Design

When you can't design up front — unfamiliar codebase, unclear requirements, exploratory work — use **collaborative design** to discover the right design before committing to implementation.

**Protocol:**

1. AI explores the codebase and presents findings (existing patterns, relevant modules, dependencies, constraints)
2. Together, iterate on the design (AI proposes interface options → you choose; AI identifies edge cases → you decide handling strategy; AI suggests module boundaries → you approve or adjust)
3. Once the design is solid, write it into the plan (interfaces, types, test scenarios, module structure — back to the standard deep Phase 1)
4. Implementation runs autonomously within the agreed design

**When to use which approach:**

| Signal                                   | Approach                                    |
| ---------------------------------------- | ------------------------------------------- |
| You know the domain and patterns         | Deep Phase 1 directly                       |
| You know the domain but not the codebase | AI explores, you design based on findings   |
| You don't know the domain well           | Collaborative design — iterate together     |
| Pure exploration / spike                 | Skip workflow, use ad-hoc exploration first |

### Product Proposal Validation

When the input to Phase 1 is a **product proposal** (high-level feature description without concrete user stories), apply the **Product Proposal Validation Protocol** before creating the implementation plan.

**See [PRODUCT_PROPOSALS.md](PRODUCT_PROPOSALS.md) for the complete protocol,** which covers:

- User Stories Validation (identify all implied stories, generate missing stories with clear Title/Description/Acceptance Criteria)
- E2E Test Coverage (MANDATORY - at least one E2E test per story, using Playwright MCP for UI)
- Structured Output (proposal summary, stories with E2E tests, coverage gaps, dependencies)
- Quality Standards and Approval Gate

**After approval:** If using Atlassian MCP, create Jira tickets from validated stories, then proceed with creating the implementation plan.

### Jira Epic/Initiative Breakdown

When the input to Phase 1 is a **Jira Epic** or **Initiative**, break it down into actionable tickets following these rules before creating the implementation plan.

#### If the input is an Epic

Break the Epic into **User Stories** and **Tasks** (implementation-level):

- Each Story must include:
  - A **clear, concise Title**
  - A **detailed Description** with: Context, Scope, and Acceptance Criteria (when applicable)
- Stories must be:
  - **Independently testable**
  - **Vertically sliced** as much as possible
  - **Actionable and implementation-ready** (no vague items)

#### If the input is an Initiative

Create:

- **1 Backend Epic** — with clear Title and Description (scope and goals)
- **1 Frontend Epic** — with clear Title and Description (scope and goals)

Then break each Epic into Stories and Tasks following the same quality rules above.

#### Dependencies

Explicitly identify dependencies between tickets:

- Reference dependencies **directly in each Jira ticket description**
- Add a dedicated **Dependencies section** for each affected ticket
- Design work to **minimize blocking**

**Frontend/Backend dependency pattern:** If frontend depends on backend, create a backend story to:

1. Define the API contract
2. Provide mock responses
3. Publish schema/documentation

This allows frontend to proceed using mocks. Prefer enabling **parallel work** over tightly coupled tickets.

#### Output Format

Structure the breakdown clearly:

```
Initiative (if applicable)
├── Backend Epic (Title + Description)
│   ├── Story 1 (Title + Description + Acceptance Criteria)
│   │   └── Task 1.1, Task 1.2, ...
│   └── Story 2
│       └── Task 2.1, Task 2.2, ...
├── Frontend Epic (Title + Description)
│   ├── Story 1
│   │   └── Task 1.1, Task 1.2, ...
│   └── Story 2
│       └── Task 2.1, Task 2.2, ...
└── Dependency Summary (cross-ticket view)
```

All titles and descriptions must be **clear, concrete, and ready to create in Jira** (via `jira_create_issue` or `jira_batch_create_issues`).

#### Creating Tickets in Jira

**⚠️ DO NOT create tickets during planning.** The breakdown is part of the plan document presented for user review. Tickets are created **only after the user approves the plan** — as the first action when execution begins (between plan approval and Phase 2 worktree creation).

**After plan approval, create tickets using Atlassian MCP:**

1. Create Epics first (if Initiative): `jira_create_issue` with `issue_type: "Epic"`
2. Create Stories under each Epic: `jira_create_issue` with `issue_type: "Story"` and link to Epic via `jira_link_to_epic`
3. Create Tasks as subtasks: `jira_create_issue` with `issue_type: "Subtask"` and `additional_fields: {"parent": "STORY-KEY"}`
4. Add dependencies: `jira_create_issue_link` with `link_type: "Blocks"` for blocking dependencies
5. Batch creation: Use `jira_batch_create_issues` for efficiency when creating multiple stories/tasks

**Approval Gate (ONE-TIME APPROVAL) ⛔ BLOCKING GATE:**

**⛔ CRITICAL: This is a MANDATORY BLOCKING GATE. You MUST stop here and wait for user approval.**

**How to enforce this gate:**

1. **Display the plan** - Read the plan file and display its full contents in the conversation
   - Read: `context/plans/YYYY-MM-DD-<task-name>.md`
   - Display the complete plan with clear formatting
   - Include: objectives, approach, affected files, implementation steps, testing strategy, risks

2. **STOP EXECUTION** - Do NOT continue to Phase 2 automatically
   - No automatic progression after displaying the plan
   - No silent proceeding without user response

3. **Ask for explicit approval** - Use this exact pattern:

   ```
   📋 Plan created and displayed above.

   Please review the plan carefully.

   Reply with one of:
   ✅ "approved" or "looks good" to proceed to Phase 2-8 (autonomous execution)
   ✏️  Request specific changes if you want modifications
   ❓ Ask questions if anything is unclear
   ```

4. **Wait for user response** - Do NOT proceed until user explicitly responds

**What happens at this gate:**

- User says **"approved"** / "looks good" / "proceed" → Proceed to Phase 2
- User **requests changes** → Modify plan, re-display, wait for approval again
- User **asks questions** → Answer clearly, then re-ask for approval

**IMPORTANT: Approval of the plan = approval to execute ALL phases 2-8 autonomously**

- Do NOT proceed to Phase 2 without this one-time approval
- After approval, phases 2-8 run autonomously (no stopping between phases)
- Only stop if: gate failure, critical blocker, or user interrupts

**Post-Approval Actions (Before Phase 2):**

After the user approves the plan, perform these actions BEFORE starting Phase 2:

1. **Add FULL plan to Jira ticket (if Jira key provided):**
   - Check if a Jira ticket key was provided (e.g., in task description, branch name, or explicit parameter)
   - If Jira key exists and Atlassian MCP is configured:
     - Read the **COMPLETE** plan file from `context/plans/YYYY-MM-DD-<task-name>.md`
     - Add the **ENTIRE** plan contents as a comment to the Jira ticket using `jira_add_comment`
     - **⛔ CRITICAL:** Post the FULL plan, not a summary - include all sections (objectives, approach, affected files, implementation steps, testing strategy, risks, edge cases)
     - Comment format:

       ```
       📋 Implementation Plan

       [COMPLETE plan contents - all sections verbatim]

       ---
       *Plan created on [date] and approved*
       ```

   - If no Jira key or MCP not configured: Skip (graceful degradation)

2. **Create Jira tickets from plan (if Epic/Initiative breakdown was performed):**
   - Only if Phase 1 included Epic/Initiative breakdown (see [Jira Epic/Initiative Breakdown](#jira-epicinitiative-breakdown))
   - Create Epics, Stories, and Tasks in Jira as outlined in the breakdown
   - Link dependencies using `jira_create_issue_link`

**Autonomous Execution After Approval:**

Once the plan is approved AND post-approval actions complete, phases 2-8 execute **fully autonomously** without stopping to ask permission between phases:

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

## Phase 2: Create Git Worktree

**Goal:** Set up isolated work environment using git worktree for parallel development.

**Why worktrees:** Git worktrees allow multiple branches to be active simultaneously in separate directories, enabling parallel Claude Code sessions without context switching. Each worktree has isolated file state while sharing the same Git history.

**Actions:**

1. **Determine main branch name:**
   - Auto-detect: `git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`
   - Or use common convention: `main` or `master`
2. **Fetch latest changes from remote:**
   ```bash
   git fetch origin main  # or master
   ```
   This ensures your new branch will be based on the absolute latest code.
3. **Determine repo and branch names:**
   - Get current repo directory name: `REPO_NAME=$(basename $(git rev-parse --show-toplevel))`
   - Create branch name: `feature/<description>` or `fix/<description>`
4. **Create unified worktrees directory (if it doesn't exist):**

   ```bash
   # Create hidden directory for all worktrees (shared across all repos)
   mkdir -p ../.worktrees
   ```

   This one-time setup creates a single unified directory to contain worktrees for ALL repositories in the parent directory. The dot-prefix keeps it hidden and clean.

   **Example:** Creates `../.worktrees/` which will contain subdirectories for each repo

5. **Create worktree inside unified directory based on latest remote main:**

   ```bash
   # IMPORTANT: Use origin/main (not just HEAD) to ensure up-to-date base
   git worktree add ../.worktrees/${REPO_NAME}/feature-implement-auth -b feature/implement-auth origin/main
   ```

   **Concrete example:**
   - Repo: `agentic`
   - Branch: `feature/implement-auth`
   - Worktree path: `../.worktrees/agentic/feature-implement-auth/`
   - Full path: `/Users/mmalta/projects/poc/.worktrees/agentic/feature-implement-auth/`

6. **Navigate to worktree directory:**
   ```bash
   cd ../.worktrees/${REPO_NAME}/feature-implement-auth
   ```
7. **Initialize development environment** (if needed):
   - JavaScript/TypeScript: `npm install` or `yarn`
   - Python: Setup virtual environment or run package manager
   - Other languages: Follow project setup process
8. **Confirm worktree setup:**
   ```bash
   git worktree list  # Shows all worktrees
   git status         # Confirms current branch
   pwd                # Confirms working directory
   ```
9. **Record worktree path** for cleanup in Phase 8

**Note:** All subsequent phases (3-8) operate within this worktree directory. The main repo remains untouched.

---

## Phase 3: Execute Implementation

**Goal:** Implement according to approved plan.

**PARA command:** Use `/execute` to implement with tracking and context.

**Skill:** Use the **developer** skill (`skills/developer/SKILL.md`) for all implementation. The developer skill enforces TDD (Test-Driven Development).

**⛔ PHASE 3 TDD GATE ENFORCEMENT:**

Each behavior/requirement MUST complete the full TDD cycle (RED → GREEN → REFACTOR) before proceeding.

**For complete TDD gate checklist:** See [GATES.md - Phase 3: TDD Gate Enforcement](GATES.md#phase-3-tdd-gate-enforcement).

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

**⛔ CRITICAL: Tool Usage for File Modifications**

See [TOOLS.md](TOOLS.md) for complete file modification guidelines. Key rules:

- ✅ ALWAYS use Edit tool for modifying existing files
- ✅ ALWAYS use Write tool for creating new files
- ❌ NEVER create temporary bash scripts for file modifications
- ❌ NEVER commit temporary scripts or intermediate files

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

**Agent:** Use the **phase-testing-agent** to auto-detect language, run tests, and retry on failures. See [GATES.md](GATES.md) for the Phase 4 gate enforcement checklist.

**⛔ CRITICAL: DO NOT BYPASS THIS GATE**

You MUST use the **phase-testing-agent**. DO NOT manually run test commands:

- ❌ DO NOT manually run `npm test`, `pytest`, `go test`, `cargo test`, etc.
- ❌ DO NOT manually run build commands
- ❌ DO NOT manually check test output and assume it's okay
- ❌ DO NOT skip tests "because TDD was followed in Phase 3"

✅ ALWAYS spawn phase-testing-agent and wait for structured JSON results.

The agent provides automatic language detection, retry logic for flaky tests, structured failure reporting, and consistent execution. Manual test runs are error-prone and cannot provide the structured output needed for gate validation.

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

- **If status = "pass":** Verify checklist in GATES.md, then proceed to Phase 5
- **If status = "fail":** Review `failing_tests` array, identify root cause, fix issues, re-run agent. Do NOT proceed until status = "pass".
- **If build fails:** Review `build_status` and error messages, fix compilation/bundling errors, re-run agent.
- **If UI exists:** Also run E2E tests via Playwright MCP. If E2E fails, fix UI issues and re-run.

**Retry Loop:** See [GATES.md](GATES.md) for the mandatory retry loop protocol.

---

## Phase 5: Validation (MANDATORY)

**Goal:** Ensure quality and security.

**⚠️ BLOCKING REQUIREMENT:** All validation checks are MANDATORY. Do NOT proceed to Phase 6 until all checks pass.

**Agent:** Use the **phase-validation-agent** to run 6 validation checks with auto-fix and retry. See [GATES.md](GATES.md) for the Phase 5 gate enforcement checklist.

**⛔ CRITICAL: DO NOT BYPASS THIS GATE**

You MUST use the **phase-validation-agent**. DO NOT manually run validation commands:

- ❌ DO NOT manually run formatter (prettier, gofumpt, black, etc.)
- ❌ DO NOT manually run linter (eslint, golangci-lint, pylint, etc.)
- ❌ DO NOT manually run build (npm run build, go build, etc.)
- ❌ DO NOT manually run tests (npm test, pytest, go test, etc.)
- ❌ DO NOT manually invoke code-reviewer or security-reviewer skills

✅ ALWAYS spawn phase-validation-agent and wait for structured JSON results.

The agent provides consistent validation, retry logic, structured output, and audit trail. Manual validation is non-reproducible and easy to skip or shortcut.

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

- **If status = "pass" AND critical_security_issue = false:** Verify all checks in GATES.md, then proceed to Phase 6
- **If critical_security_issue = true:** STOP IMMEDIATELY. Present vulnerabilities to user. Fix vulnerabilities. Re-run agent. Do NOT proceed until security review passes.
- **If any check fails:** Identify which check failed. Fix issues by check type (format, lint, build, tests, code review, security). Re-run agent. Verify ALL checks pass before proceeding.

**Retry Loop:** See [GATES.md](GATES.md) for the mandatory retry loop protocol.

**Optional skip parameters:** `skip_build: true`, `skip_tests: true`. **⛔ NEVER skip security review or code review.**

---

## Phase 5.5: Diff Review Gate

**Goal:** Human approval of the implementation before commit. This is a BLOCKING gate — cannot commit without human sign-off.

**Why:** Even with deep design ownership, a diff review before commit serves as a safety net. It catches scope violations, not design decisions. When the plan is deep enough, this review is fast — you're checking translation accuracy, not reverse-engineering intent.

**For rationale and examples:** See [context/data/DRIVERS_SEAT.md](DRIVERS_SEAT.md#part-3-the-diff-review-gate).

**Actions:**

1. **Generate diff summary** from the worktree:

   ```bash
   # Files changed with line counts
   git diff --stat origin/main
   # New dependencies (package.json, go.mod, requirements.txt, etc.)
   git diff origin/main -- package.json go.mod requirements.txt Cargo.toml pyproject.toml
   ```

2. **Present diff summary to user:**

   ```
   ── Diff Review ──────────────────────────────────

   Files changed:
     <file>    (+N lines)
     ...

   New dependencies: [list or "none"]
   Deviations from plan: [list or "none"]
   Test coverage: [X/Y planned scenarios covered]

   → approve / see specific file / request changes
   ```

3. **Compare against plan:** Check files changed vs plan's module boundaries, identify any deviations from the approved design.

4. **Wait for human approval** using AskUserQuestion:
   - **Approve** → proceed to Phase 6
   - **See specific file** → show the requested file diff, then re-ask
   - **Request changes** → make changes, re-run validation (Phase 5), then re-present diff

**What to look for:**

- **Unexpected files** — touches something outside the plan's module boundaries
- **Unexpected scale** — significantly more or fewer lines than the design implies
- **New dependencies** — packages or services not in the plan
- **Missing coverage** — fewer test scenarios than specified
- **Plan deviations** — any structural departure from the approved design

**Gate enforcement:** See [GATES.md](GATES.md#phase-55-diff-review-gate-enforcement) for the complete gate checklist.

---

## Phase 6: Commit & Push

**Goal:** Stage work for PR creation.

**Skill:** Use **git-commits** skill for commit message conventions.

**Actions:**

1. **FIRST:** Verify Phase 5 gate checklist AND Diff Review Gate in [GATES.md](GATES.md) are complete
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

**Agent:** Use the **phase-pr-agent** to create PR and integrate with Jira (if configured). See [GATES.md](GATES.md) for the Phase 7 gate enforcement checklist.

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

- **If status = "success" AND pr_url is present:** PR created successfully, verify checklist in GATES.md, proceed to Phase 8
- **If status = "fail":** PR creation failed. Review error message. Check prerequisites:
  - `gh` CLI installed and authenticated (`gh auth status`)
  - Remote repository configured (`git remote -v`)
  - Branch pushed to remote (`git push`)
  - Fix issue and re-run agent
- **If Jira integration fails but PR succeeds:** Acceptable (graceful degradation). Log for manual follow-up.

**Graceful degradation:** If Atlassian MCP is not configured, the PR is still created and Jira steps are skipped.

**After PR creation:** Mark ready when all commits are pushed: `gh pr ready <pr-number>`

---

## Phase 8: Monitor, Summarize & Cleanup

**Goal:** Monitor CI/bot feedback with one-pass fixes, document outcomes, and clean up worktree.

**Philosophy:** Phase 5 validation catches 90%+ of issues BEFORE the PR. Phase 8 does **one pass** of CI/bot monitoring + simple fixes only. Complex issues escalate to user.

**PARA command:** Use `/summarize` once work is complete (e.g. after PR merge).

**Skills:** Use **para** skill for summary, **documentation** skill if docs need updating.

---

### Step 1: CI Checks + Automated PR Reviews

**Two sub-steps after PR creation:**

#### Sub-step A: Wait for CI checks to pass

```bash
# Block until all checks complete
gh pr checks <pr-number> --watch
```

- **All green:** proceed to Sub-step B.
- **Any failing:** fetch GitHub Actions logs, analyze, fix, push, re-run. Repeat up to **3 attempts**, then escalate to user.

```bash
# Fetch logs for failing run
gh run list --branch <branch-name> --limit 5
gh run view <run-id> --log-failed
```

#### Sub-step B: Check automated PR reviews (one pass)

After CI passes (or in parallel), check **once** for automated review comments from Claude Code, Copilot, or other bots:

```bash
gh pr view <pr-number> --comments
gh pr reviews <pr-number>
```

- Address **actionable/simple** bot comments (concrete bugs, null checks, missing validations).
- Escalate **design/complex** bot comments to user via AskUserQuestion.
- **Do NOT wait for more reviews to appear.** Check once, address what's present, move on.
- Human reviews are for the human to handle; only automated bot reviews are addressed here.

**For detailed decision trees, log fetching, auto-fix guidelines, and examples:** See [PHASE_8_MONITORING.md](PHASE_8_MONITORING.md)

---

### Step 2: Summarize

Once work is complete (after PR merge), run `/summarize`:

```
/summarize
```

Creates `context/summaries/YYYY-MM-DD-<task-name>.md` documenting:

- What was built/fixed and files modified
- Key decisions and Phase 8 fixes applied
- CI/bot issues encountered and resolution
- Lessons learned, limitations, future improvements
- Link to PR, commits, and worktree path

**⛔ CRITICAL: Display the Summary to User**

After creating the summary file, you MUST display it to the user:

1. **Read the summary file:** `context/summaries/YYYY-MM-DD-<task-name>.md`
2. **Display the complete summary** in the conversation with clear formatting
3. **Present as final output** of the workflow

**Why display the summary:**

- User sees complete record of what was accomplished
- Provides closure to the workflow
- Highlights key decisions and learnings
- Shows PR link and next steps
- Ensures user is aware of any Phase 8 fixes applied

**Example presentation:**

```
✅ Workflow Complete!

[Display full summary contents here]

📎 Pull Request: [URL]
📂 Summary saved to: context/summaries/YYYY-MM-DD-<task-name>.md
🧹 Worktree path for cleanup: [path]
```

---

### Step 3: Update Documentation (if needed)

**⚡ PARALLEL SUBAGENTS** (only if docs need updating):

```
Task(subagent_type="general-purpose", prompt="Update README.md with new feature/change following documentation skill")
Task(subagent_type="general-purpose", prompt="Update API docs for new/changed endpoints following documentation skill")
Task(subagent_type="general-purpose", prompt="Write ADR for architectural decision made, following documentation skill ADR format")
```

---

### Step 4: Clean Up Worktree

**After PR merge and all follow-ups complete:**

```bash
# Return to main repo
cd $(git rev-parse --show-toplevel)

# Remove the worktree (use path from Phase 2)
git worktree remove ../.worktrees/$(basename $(git rev-parse --show-toplevel))/feature-name

# Optionally delete the merged branch
git branch -d feature/feature-name
```

**Note:** Keep worktree active if you need follow-up changes. Clean up only when completely done.

---

**Note:** The `context/` directory is git-ignored. Summaries are local session artifacts and are not committed to git.
