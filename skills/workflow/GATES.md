# Workflow Gates: Enforcement & Retry Loops

This document contains all gate checklists and retry loop protocols for the workflow skill. For phase details, see [PHASES.md](PHASES.md).

## Contents

- [Feedback Loops (MANDATORY)](#feedback-loops-mandatory)
- [Escalation Rules](#escalation-rules)
- [Phase 1: Plan Approval Gate Enforcement](#phase-1-plan-approval-gate-enforcement)
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

## Phase 1: Plan Approval Gate Enforcement

**⛔ PHASE 1 PLAN APPROVAL GATE:**

This is the **FIRST and MOST CRITICAL gate** in the workflow. You MUST NOT proceed to Phase 2 without explicit user approval of the plan.

```
PHASE 1 PLAN APPROVAL GATE CHECKLIST:
✓ [ ] Plan document created in context/plans/YYYY-MM-DD-<task>.md
✓ [ ] Plan presented to user clearly and completely
✓ [ ] User explicitly approved the plan
✓ [ ] User did NOT request changes or clarifications

IF user requests changes:
  → Update the plan based on feedback
  → Re-present the updated plan
  → Wait for approval again
  → DO NOT proceed until explicitly approved

IF user asks questions:
  → Answer the questions clearly
  → Clarify any ambiguities
  → Re-ask for approval after answering
  → DO NOT proceed until explicitly approved

⛔ CRITICAL: DO NOT assume approval
⛔ CRITICAL: DO NOT proceed automatically to Phase 2
⛔ CRITICAL: WAIT for explicit approval (e.g., user says "approved", "looks good", "proceed", "go ahead")
```

**How to enforce this gate:**

1. **Display the plan** - Read and display the complete plan in the conversation:
   - Read the plan file: `context/plans/YYYY-MM-DD-<task-name>.md`
   - Display full contents with clear formatting
   - Highlight: objectives, approach, files to modify, implementation steps, testing strategy, risks

2. **STOP EXECUTION** - Do NOT continue automatically
   - No automatic progression to Phase 2
   - No silent proceeding without user response

3. **Ask for approval explicitly using this pattern:**
   ```
   📋 Plan created and displayed above.

   Please review the plan carefully.

   Reply with one of:
   ✅ "approved" or "looks good" to proceed to Phase 2-8 (autonomous execution)
   ✏️  Request specific changes if you want modifications
   ❓ Ask questions if anything is unclear
   ```

4. **Wait for user response** - Do not proceed until user explicitly approves

5. **Handle responses:**
   - **If approved** ("approved" / "looks good" / "proceed") → Proceed to Phase 2 (all subsequent phases run autonomously)
   - **If changes requested** → Update plan, re-display complete plan, wait for approval again
   - **If questions asked** → Answer questions clearly, then re-ask for approval

**IMPORTANT: Approval of the plan = approval to execute ALL phases 2-8 autonomously**

Once the plan is approved:
- Phases 2-8 execute sequentially without stopping for permission
- No "should I proceed?" questions between phases
- Only stop if: gate failure, critical blocker, or user interrupts

**Post-Approval Actions (Execute BEFORE Phase 2):**

After user approves the plan, complete these actions before proceeding to Phase 2:

```
POST-APPROVAL CHECKLIST:
✓ [ ] User has explicitly approved the plan
✓ [ ] Check if Jira ticket key provided (in task description, branch name, etc.)
✓ [ ] If Jira key exists AND Atlassian MCP configured:
      → Read plan file: context/plans/YYYY-MM-DD-<task-name>.md
      → Add plan as comment to Jira ticket (jira_add_comment)
      → Format: "📋 Implementation Plan\n\n[plan contents]\n\n---\n*Plan created and approved*"
✓ [ ] If Epic/Initiative breakdown was performed:
      → Create Jira tickets (Epics, Stories, Tasks) as outlined in plan
      → Link dependencies using jira_create_issue_link
✓ [ ] Log any Jira integration failures (graceful degradation)
✓ [ ] Proceed to Phase 2 (worktree creation)
```

**Why add plan to Jira:**
- Provides context to team members viewing the ticket
- Creates audit trail of planning decisions
- Links technical plan to project management system
- Enables stakeholders to review approach without accessing code

**⛔ CRITICAL ENFORCEMENT:** DO NOT proceed to Phase 2 until:
1. Plan is complete and clearly presented
2. User has reviewed the plan
3. User explicitly approved the plan (not just silence or implicit approval)
4. Post-approval actions completed (Jira comment added if applicable)

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

---

## Phase 8: One-Pass Monitoring (No Traditional Gate)

**ℹ️ PHASE 8 APPROACH:**

Phase 8 does **NOT** have a traditional blocking gate or retry loop. Instead, it uses a **one-pass monitoring + escalation** pattern.

**Philosophy:** Phase 5 validation catches 90%+ of issues BEFORE the PR. Phase 8 monitors CI/bot feedback and makes simple fixes ONCE, then escalates complex issues to the user.

### One-Pass Monitoring Checklist

```
PHASE 8 ONE-PASS MONITORING:
✓ [ ] Check CI status (gh pr checks <pr-number>)
✓ [ ] Check bot comments (gh pr view <pr-number> --comments)
✓ [ ] Classify issues as simple or complex
✓ [ ] Apply simple fixes if any (format, lint, trivial config)
✓ [ ] Push fixes if applied
✓ [ ] Escalate complex issues to user with AskUserQuestion
```

### Decision Criteria

**✅ Simple/Automatable (fix once, no retry):**
- Format issues (run formatter)
- Lint errors with auto-fix capability
- Missing imports/exports
- Trivial type annotations
- Test timeout config changes
- Dependency lockfile updates

**❌ Complex (escalate to user):**
- Logic errors in implementation
- Failing unit/integration tests
- Security vulnerabilities
- Design feedback from reviewers
- Performance issues
- Breaking API changes
- Contradictory bot comments

### User Escalation Pattern

When complex issues are detected:

```python
AskUserQuestion(
  questions=[{
    question: "PR has [issue type]: [details]. How should we proceed?",
    header: "CI/Bot Feedback",
    options: [
      {
        label: "Continue auto-fixing",
        description: "I'll attempt to resolve the issues"
      },
      {
        label: "Manual control",
        description: "Stop here, I'll handle it manually"
      },
      {
        label: "Skip for now",
        description: "Acceptable for draft PR, address later"
      }
    ]
  }]
)
```

### One-Pass Rule

**⛔ CRITICAL:** Make fixes ONCE. If CI still fails after the one-pass fixes, escalate to user. **DO NOT loop.**

**Why no retry loop:**
1. ❌ Infinite loop risk with complex/contradictory feedback
2. ❌ Over-correction without user oversight
3. ❌ Wasted CI resources for human judgment issues
4. ✅ Phase 5 caught issues upfront - PR starts near-green
5. ✅ Human judgment faster for complex issues
6. ✅ Clear audit trail with one attempt + decision point

### Summary Requirements

After CI/bot monitoring (and after PR merge), create and display summary:

```
PHASE 8 SUMMARY CHECKLIST:
✓ [ ] Run /summarize command
✓ [ ] Document what was built/fixed
✓ [ ] List files modified with impact
✓ [ ] Record key decisions made
✓ [ ] Document Phase 8 fixes applied (if any)
✓ [ ] Note CI/bot issues and how resolved
✓ [ ] List lessons learned
✓ [ ] Identify known limitations
✓ [ ] Suggest future improvements
✓ [ ] Link to merged PR and commits
✓ [ ] Record worktree path used
✓ [ ] **Display complete summary to user** (read file and show in conversation)
```

**⛔ CRITICAL: Display the Summary**

After creating the summary file, you MUST display it to the user in the conversation. This is the final output of the workflow and provides closure with a complete record of what was accomplished.

### Cleanup Requirements

After PR merge and summary complete:

```
PHASE 8 CLEANUP CHECKLIST:
✓ [ ] Return to main repo: cd $(git rev-parse --show-toplevel)
✓ [ ] Verify worktree path: git worktree list
✓ [ ] Remove worktree: git worktree remove <path>
✓ [ ] (Optional) Delete merged branch: git branch -d <branch>
✓ [ ] Verify cleanup: git worktree list (should not show removed path)
```

**Note:** Keep worktree active if follow-up changes needed. Clean up only when completely done.
