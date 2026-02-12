# Workflow Gates: Enforcement & Retry Loops

This document contains all gate checklists and retry loop protocols for the workflow skill. For phase details, see [PHASES.md](PHASES.md).

## Contents

- [Feedback Loops (MANDATORY)](#feedback-loops-mandatory)
- [Escalation Rules](#escalation-rules)
- [Phase 3: TDD Gate Enforcement](#phase-3-tdd-gate-enforcement)
- [Phase 4: Testing Gate Enforcement](#phase-4-testing-gate-enforcement)
- [Phase 5: Validation Gate Enforcement](#phase-5-validation-gate-enforcement)
- [Phase 6: Commit Gate Enforcement](#phase-6-commit-gate-enforcement)
- [Phase 7: PR Creation Gate Enforcement](#phase-7-pr-creation-gate-enforcement)

---

## Feedback Loops (MANDATORY)

**⚠️ CRITICAL:** The workflow enforces retry loops at each gate. You MUST NOT proceed until all checks pass.

**Loop 1 -- TDD (Phase 3):** Write Test -> Run (FAIL) -> Write Code -> Run (PASS) -> Refactor -> Repeat for next behavior.

**Loop 2 -- Testing (Phase 4):** Run all tests -> if any fail, identify failure, fix code (not test unless test is wrong), re-run ALL tests. Escalate after 3 failed attempts.

**Loop 3 -- Validation (Phase 5):** Run 6 checks -> if any fail, auto-fix format/lint, fix build/test errors, address review feedback, fix vulnerabilities (NEVER skip security). Re-run all validations. Escalate if security issue cannot be resolved.

---

## Escalation Rules

| Situation                           | Action                               |
| ----------------------------------- | ------------------------------------ |
| Test fails 3+ times for same reason | Ask user for guidance                |
| Security vulnerability found        | STOP workflow, require user decision |
| Conflicting requirements            | Ask user to clarify                  |
| External dependency blocking        | Document blocker, ask user           |
| Flaky test detected                 | Fix flakiness before proceeding      |

**Enforcement:** Track retry count for each gate. Log each failure and fix attempt. Never proceed with failing checks. Document retries in commit message or summary.

---

## Phase 3: TDD Gate Enforcement

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

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 4 until:
1. All behaviors completed with full TDD cycle (RED → GREEN → REFACTOR)
2. All tests pass (verify manually if needed)
3. All quality gates verified
4. All code is committed with clear messages

---

## Phase 4: Testing Gate Enforcement

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

## Phase 5: Validation Gate Enforcement

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

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 6 until:
1. phase-validation-agent returns status "pass"
2. critical_security_issue = false (or not present)
3. All 6 checks show status "pass" in agent output
4. All items in the checklist above are verified

---

## Phase 6: Commit Gate Enforcement

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

---

## Phase 7: PR Creation Gate Enforcement

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

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 8 until:
1. phase-pr-agent returns status "success"
2. pr_url is present and valid
3. PR is confirmed created on GitHub
4. All items in the checklist above are verified (or gracefully degraded for Jira)
