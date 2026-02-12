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
2. **Determine repo and branch names:**
   - Get current repo directory name: `basename $(git rev-parse --show-toplevel)`
   - Create branch name: `feature/<description>` or `fix/<description>`
3. **Create worktree as sibling directory:**
   ```bash
   # Pattern: ../repo-name-branch-name
   git worktree add ../$(basename $(git rev-parse --show-toplevel))-feature-description -b feature/description
   ```
   Example: If repo is `agentic` and branch is `feature/add-auth`, worktree path is `../agentic-feature-add-auth`
4. **Navigate to worktree directory:**
   ```bash
   cd ../agentic-feature-add-auth
   ```
5. **Initialize development environment** (if needed):
   - JavaScript/TypeScript: `npm install` or `yarn`
   - Python: Setup virtual environment or run package manager
   - Other languages: Follow project setup process
6. **Confirm worktree setup:**
   ```bash
   git worktree list  # Shows all worktrees
   git status         # Confirms current branch
   pwd                # Confirms working directory
   ```
7. **Record worktree path** for cleanup in Phase 8

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

**Goal:** Document outcomes, capture learnings, and clean up worktree.

**PARA command:** Use `/summarize` once work is complete (e.g. after PR merge).

**Skills:** Use **para** skill for summary, **documentation** skill if docs need updating.

**Actions:**

1. Monitor PR feedback and CI checks
2. Address review comments
3. Once merged, run `/summarize` to document in `context/summaries/YYYY-MM-DD-<task-name>.md`
4. Update documentation if needed (README, API docs, ADRs)
5. **Clean up worktree after PR merge:**
   ```bash
   # Return to main repo
   cd $(git rev-parse --show-toplevel)

   # List worktrees to confirm path
   git worktree list

   # Remove the worktree (use path from Phase 2)
   git worktree remove ../agentic-feature-add-auth

   # Optionally delete the merged branch
   git branch -d feature/add-auth
   ```
   **Note:** Keep worktree active if you need to make follow-up changes. Clean up only when completely done.

**Summary Document Contents:**

- What was built/fixed
- Files modified (with impact)
- Key decisions made
- Lessons learned
- Known limitations
- Future improvements
- Link to merged PR and commits
- Worktree path used (for reference)

**Note:** The `context/` directory is git-ignored. Summaries are local session artifacts and are not committed to git.

**⚡ PARALLEL SUBAGENTS for documentation (if docs need updating):**

```
Task(subagent_type="general-purpose", prompt="Update README.md with new feature/change following documentation skill")
Task(subagent_type="general-purpose", prompt="Update API docs for new/changed endpoints following documentation skill")
Task(subagent_type="general-purpose", prompt="Write ADR for architectural decision made, following documentation skill ADR format")
```

Only launch doc subagents if documentation updates are needed for this change.
