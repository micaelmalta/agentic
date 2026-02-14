# Workflow Phases: Detailed Protocol

This document contains the detailed protocol for all 8 phases of the workflow skill. For overview and quick reference, see [SKILL.md](SKILL.md).

## Contents

- [Phase 1: Plan](#phase-1-plan)
- [Phase 2: Create Git Worktree](#phase-2-create-git-worktree)
- [Phase 3: Execute Implementation](#phase-3-execute-implementation)
- [Phase 4: Testing Validation](#phase-4-testing-validation-mandatory)
- [Phase 5: Validation](#phase-5-validation-mandatory)
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

### Product Proposal Validation

When the input to Phase 1 is a **product proposal** (high-level feature description without concrete user stories), apply the **Product Proposal Validation Protocol** before creating the implementation plan.

**See [PRODUCT_PROPOSALS.md](PRODUCT_PROPOSALS.md) for the complete protocol.**

**Core requirements:**

1. **User Stories Validation**
   - Identify ALL implied user stories from the proposal
   - Generate missing stories with: clear Title, detailed Description (context, scope, workflow), Acceptance Criteria
   - Ensure stories are: independently testable, vertically sliced, actionable/implementation-ready
   - Do NOT leave high-level features without concrete implementation stories

2. **E2E Test Coverage (MANDATORY)**
   - For EVERY user story, ensure at least one corresponding E2E test exists
   - Generate missing E2E tests if needed
   - Each E2E test must: state user journey, reference related story, define expected outcomes, cover critical happy path, include key edge cases
   - Use Playwright MCP for UI features (MANDATORY)

3. **Structured Output**
   - Product Proposal Summary (brief overview + key objectives)
   - User Stories (with Title, Description, Acceptance Criteria, Related E2E Tests)
   - E2E Test Coverage Summary (table showing all stories and their E2E tests)
   - Coverage Gaps (if any were found and how they were resolved)
   - Dependencies (cross-story dependencies and parallel work opportunities)
   - Implementation Readiness Checklist

**Quality Standards:**
- Be concrete, implementation-ready, and avoid vague language
- Every story must be independently testable
- No user-facing functionality without E2E coverage
- All gaps must be resolved or escalated to user (via AskUserQuestion) before proceeding

**Output Location:** Create validation document in `context/plans/YYYY-MM-DD-<proposal-name>-validation.md`

**Approval Gate:** Present validation output to user for review and approval before creating implementation plan or Jira tickets.

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

## Phase 2: Create Git Worktree

**Goal:** Set up isolated work environment using git worktree for parallel development.

**Why worktrees:** Git worktrees allow multiple branches to be active simultaneously in separate directories, enabling parallel Claude Code sessions without context switching. Each worktree has isolated file state while sharing the same Git history.

**Actions:**

1. **If a Jira ticket key is provided:** Use **Atlassian MCP** to transition the issue to **In Progress**. Call `jira_get_transitions` with the issue key, find the transition whose name matches "In Progress" (or "In progress"; names vary by project), then call `jira_transition_issue` with that transition ID. This marks the ticket as in progress before implementation starts.
2. **Determine main branch name:**
   - Auto-detect: `git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'`
   - Or use common convention: `main` or `master`
3. **Fetch latest changes from remote:**
   ```bash
   git fetch origin main  # or master
   ```
   This ensures your new branch will be based on the absolute latest code.
4. **Determine repo and branch names:**
   - Get current repo directory name: `REPO_NAME=$(basename $(git rev-parse --show-toplevel))`
   - Create branch name: `feature/<description>` or `fix/<description>`
5. **Create unified worktrees directory (if it doesn't exist):**
   ```bash
   # Create hidden directory for all worktrees (shared across all repos)
   mkdir -p ../.worktrees
   ```
   This one-time setup creates a single unified directory to contain worktrees for ALL repositories in the parent directory. The dot-prefix keeps it hidden and clean.

   **Example:** Creates `../.worktrees/` which will contain subdirectories for each repo

6. **Create worktree inside unified directory based on latest remote main:**
   ```bash
   # IMPORTANT: Use origin/main (not just HEAD) to ensure up-to-date base
   git worktree add ../.worktrees/${REPO_NAME}/feature-implement-auth -b feature/implement-auth origin/main
   ```

   **Concrete example:**
   - Repo: `agentic`
   - Branch: `feature/implement-auth`
   - Worktree path: `../.worktrees/agentic/feature-implement-auth/`
   - Full path: `/Users/mmalta/projects/poc/.worktrees/agentic/feature-implement-auth/`

7. **Navigate to worktree directory:**
   ```bash
   cd ../.worktrees/${REPO_NAME}/feature-implement-auth
   ```
8. **Initialize development environment** (if needed):
   - JavaScript/TypeScript: `npm install` or `yarn`
   - Python: Setup virtual environment or run package manager
   - Other languages: Follow project setup process
9. **Confirm worktree setup:**
   ```bash
   git worktree list  # Shows all worktrees
   git status         # Confirms current branch
   pwd                # Confirms working directory
   ```
10. **Record worktree path** for cleanup in Phase 8

**Note:** All subsequent phases (3-8) operate within this worktree directory. The main repo remains untouched.

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

## Phase 6: Commit & Push

**Goal:** Stage work for PR creation.

**Skill:** Use **git-commits** skill for commit message conventions.

**Actions:**

1. **FIRST:** Verify Phase 5 gate checklist in [GATES.md](GATES.md) is complete
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

### Step 1: One-Pass CI/Bot Monitoring

**Execute ONCE after PR creation:**

```bash
# 1. Check CI status
gh pr checks <pr-number> --watch

# 2. Read bot comments (if any)
gh pr view <pr-number> --comments
```

**Decision Tree:**

```
CI Status? → All green → Skip to Step 2 (Summary)
           → Failures → Analyze failures

Bot Comments? → None → Skip to Step 2
              → Present → Analyze comments

Analysis:
├─ Simple/Automatable (format, lint, trivial test fix)?
│  ├─ YES → Auto-fix locally
│  │       Push changes
│  │       Report what was fixed
│  └─ NO → Go to User Escalation
│
└─ Complex (logic errors, design issues, contradictory feedback)?
   └─ Report to user + AskUserQuestion:
      - "CI failed with: [details]"
      - "Bot suggests: [feedback]"
      - Options:
        [1] Continue auto-fixing (I'll attempt to resolve)
        [2] Manual control (stop here, I'll handle it)
        [3] Skip and proceed (acceptable for draft PR)
```

**What qualifies as "simple/automatable":**

✅ **Auto-fix these:**
- Format issues (`npm run format`, `black`, `gofmt`, etc.)
- Lint errors with auto-fix (`eslint --fix`, `rubocop -a`)
- Missing imports/exports
- Trivial type errors (add explicit type annotation)
- Test timeouts (increase timeout in test config)
- Dependency conflicts (update lockfile)

❌ **DO NOT auto-fix (escalate to user):**
- Logic errors in implementation
- Failing unit/integration tests (need code changes)
- Security vulnerabilities
- Design feedback ("this should use pattern X")
- Performance issues
- Breaking API changes
- Contradictory bot comments

**One-Pass Rule:** Make fixes ONCE. If CI still fails after the fixes, escalate to user. **DO NOT loop.**

---

### Step 2: Summarize

Once work is complete (after PR merge or user closes the loop), run `/summarize`:

```
/summarize
```

Creates `context/summaries/YYYY-MM-DD-<task-name>.md`

**Summary Document Contents:**

- What was built/fixed
- Files modified (with impact)
- Key decisions made
- Phase 8 fixes applied (if any)
- CI/bot issues encountered and resolution
- Lessons learned
- Known limitations
- Future improvements
- Link to merged PR and commits
- Worktree path used (for reference)

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

# List worktrees to confirm path
git worktree list

# Remove the worktree (use path from Phase 2)
git worktree remove ../.worktrees/$(basename $(git rev-parse --show-toplevel))/feature-name

# Optionally delete the merged branch
git branch -d feature/feature-name
```

**Note:** Keep worktree active if you need to make follow-up changes. Clean up only when completely done.

---

### Why NOT a Retry Loop?

**Problems with post-PR loops:**
1. ❌ **Infinite loop risk** - Complex/contradictory feedback can trap the agent
2. ❌ **Over-correction** - Agent might make unwanted changes without oversight
3. ❌ **Wasted resources** - Multiple CI runs for issues needing human judgment
4. ❌ **Harder debugging** - Tracing through multiple auto-fix iterations is painful
5. ❌ **Loss of transparency** - Code changes on remote without clear review

**Why one-pass is better:**
1. ✅ **Phase 5 catches issues upfront** - PR starts green or near-green
2. ✅ **CI failures are often environment-specific** - Can't loop-fix locally
3. ✅ **Human judgment for complex issues** - Faster and more reliable
4. ✅ **Clear audit trail** - One attempt, clear decision point
5. ✅ **User maintains control** - Explicit choice to continue or take over

---

### Example: Phase 8 One-Pass Monitoring

**Scenario:** PR created, CI runs, bot comments

```bash
# Check CI status
gh pr checks 42

Output:
✓ Lint - passing
✓ Tests - passing
✗ Format - failing (2 files need formatting)
✓ Build - passing
```

**Decision:** Format is automatable → Auto-fix

```bash
# Fix locally
npm run format

# Verify
git diff

# Commit and push
git add .
git commit -m "chore: apply format fixes from CI"
git push

# Report
echo "✓ Applied format fixes. CI should pass on re-run."
```

**If CI still fails after this:** Escalate to user with details.

---

### Example: Phase 8 User Escalation

**Scenario:** Bot comments suggest design changes

```bash
gh pr view 42 --comments

Output:
@bot-reviewer: "Consider using the Repository pattern here instead of direct DB calls."
@bot-reviewer: "This function has cyclomatic complexity of 15. Refactor?"
```

**Decision:** Design feedback = complex → Escalate

```
AskUserQuestion(
  questions: [{
    question: "PR has bot feedback suggesting design improvements (Repository pattern, refactor complex function). How should we proceed?",
    header: "Bot Feedback",
    options: [
      { label: "Address feedback", description: "I'll make the suggested design changes" },
      { label: "Discuss in PR", description: "Leave as-is, discuss with team in PR" },
      { label: "Create follow-up", description: "Accept for now, create issue for future refactor" }
    ]
  }]
)
```

---

**Note:** The `context/` directory is git-ignored. Summaries are local session artifacts and are not committed to git.
