# Phase 8: CI/Bot Monitoring Details

This document contains detailed decision trees, examples, and guidelines for Phase 8 CI/bot monitoring.

**For Phase 8 overview:** See [PHASES.md - Phase 8](PHASES.md#phase-8-monitor-summarize--cleanup)

---

## Contents

- [Monitoring Philosophy](#monitoring-philosophy)
- [Step 1: Wait for CI Checks](#step-1-wait-for-ci-checks)
- [Step 2: Check Automated PR Reviews](#step-2-check-automated-pr-reviews)
- [Decision Tree](#decision-tree)
- [Fetching GitHub Actions Logs](#fetching-github-actions-logs)
- [Auto-fix Guidelines](#auto-fix-guidelines)
- [Examples](#examples)

---

## Monitoring Philosophy

**Philosophy:** Phase 5 validation catches 90%+ of issues BEFORE the PR. Phase 8 monitors CI and automated reviews with a **retry loop on checks** (up to 3 fix attempts) and a **single pass on reviews** (check once, address what's present, move on).

**Two distinct sub-steps:**
1. **CI Checks** — Wait for all checks to pass. If any fail, fetch logs, fix, push, repeat (max 3 attempts).
2. **Automated Reviews** — After checks pass (or in parallel), check once for Claude Code / Copilot review comments and address them. Do NOT wait indefinitely.

---

## Step 1: Wait for CI Checks

**Always run this after PR creation:**

```bash
# Watch until all checks complete (blocks until done)
gh pr checks <pr-number> --watch
```

**If all green:** proceed to Step 2.

**If any checks fail:**

1. Identify the failing run(s):
   ```bash
   gh pr checks <pr-number>
   ```

2. Fetch logs for the failing run:
   ```bash
   # Get run ID from the failing check
   gh run list --branch <branch-name> --limit 5

   # View failed step logs only
   gh run view <run-id> --log-failed
   ```

3. Analyze and classify the failure (see [Decision Tree](#decision-tree)).

4. If **fixable**: apply fix locally, push, re-run `gh pr checks <pr-number> --watch`.

5. If **not fixable** or after **3 failed fix attempts**: escalate to user.

**Max retries:** 3 fix attempts. After 3 failures, escalate to user.

---

## Step 2: Check Automated PR Reviews

**Run once after CI checks pass (or in parallel while waiting):**

```bash
# Check for review comments (Claude Code, Copilot, etc.)
gh pr view <pr-number> --comments

# Also check formal PR reviews
gh pr reviews <pr-number>
```

**Key constraint: Do NOT wait longer than the CI checks took.**
- Check once, right after checks complete
- Address whatever automated reviews are already present
- Do NOT poll for new reviews or wait for more to appear
- Human reviews are addressed by the human; only automated bot reviews (Claude Code, Copilot, etc.) are addressed here

**If automated review comments exist:**
- Classify each comment (see [Decision Tree](#decision-tree))
- Address simple/actionable ones, then **mark the thread as resolved**
- Escalate design/complex ones to user; once the user decides, **mark the thread as resolved**

**Marking a review thread as resolved:**

GitHub does not expose a direct `gh` CLI command to resolve review threads. Use the GraphQL API:

```bash
# 1. Get the pull request node ID and review thread IDs
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 50) {
          nodes { id isResolved }
        }
      }
    }
  }
' -f owner=<owner> -f repo=<repo> -F pr=<pr-number>

# 2. Resolve a specific thread by its node ID
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
' -f threadId=<thread-node-id>
```

**Resolve only threads you have addressed.** Do not bulk-resolve all threads — leave threads open if the user needs to act on them or if they require human discussion.

**If no automated reviews yet:** proceed to Step 3 (Summary).

---

## Decision Tree

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: CI Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wait for checks → All green?
├─ YES → Proceed to Step 2
└─ NO  → Fetch logs (gh run view <run-id> --log-failed)
         Analyze failure:
         ├─ Simple/Automatable (format, lint, trivial import)?
         │  └─ Fix locally → Push → Wait for checks again
         │     Attempt > 3? → Escalate to user
         └─ Complex (logic errors, test failures, infra)?
            └─ Escalate to user immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Automated PR Reviews (one pass)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check comments once → Any automated reviews (Claude Code, Copilot)?
├─ NO  → Proceed to Summary
└─ YES → For each comment, classify:
         ├─ Actionable/Simple (clear bug, missing check, style)?
         │  └─ Fix locally → Push → Mark thread resolved (GraphQL API)
         └─ Design/Complex (patterns, refactoring, subjective)?
            └─ Escalate to user → After user decision → Mark thread resolved

Mark only threads you have acted on. Leave open threads that still need human action.
DO NOT wait for more reviews to appear.
```

---

## Fetching GitHub Actions Logs

When CI checks fail, always fetch the logs before attempting a fix:

```bash
# List recent runs on the branch to find the run ID
gh run list --branch <branch-name> --limit 5

# Show only the failed steps (most useful)
gh run view <run-id> --log-failed

# Show full logs for a specific job
gh run view <run-id> --log

# Re-run only the failed jobs (after pushing a fix)
gh run rerun <run-id> --failed
```

**Log analysis approach:**
1. Read the failed step output carefully
2. Identify the root cause (not just the symptom)
3. Classify as simple or complex (see decision tree)
4. Apply targeted fix — do not guess or make broad changes

---

## Auto-fix Guidelines

### ✅ Auto-fix These

**Format issues:**
- `npm run format`, `prettier --write .`
- `black .`, `isort .` (Python)
- `gofmt -w .` (Go)
- `cargo fmt` (Rust)
- `rubocop -a` (Ruby)

**Lint errors with auto-fix:**
- `eslint --fix .` (JavaScript/TypeScript)
- `rubocop -a` (Ruby)
- `autopep8 --in-place --aggressive` (Python)

**Missing imports/exports:**
- Add missing import statements
- Export missing functions/classes

**Trivial type errors:**
- Add explicit type annotations
- Fix obvious type mismatches

**Test timeouts:**
- Increase timeout in test config (e.g., `jest.setTimeout(10000)`)

**Dependency conflicts:**
- Update lockfile: `npm install`, `pip install -r requirements.txt`

### ❌ DO NOT Auto-fix (Escalate to User)

**Logic errors in implementation:**
- Requires understanding business requirements
- May have unintended side effects

**Failing unit/integration tests:**
- Need code changes, not config tweaks
- May indicate regression or incorrect implementation

**Security vulnerabilities:**
- Require careful review and testing
- May have compliance implications

**Design feedback:**
- "This should use pattern X"
- "Consider refactoring to Y"
- Subjective improvements

**Performance issues:**
- Need profiling and measurement
- Trade-offs to consider

**Breaking API changes:**
- Require coordination with consumers
- May need versioning strategy

**Contradictory bot comments:**
- Require human judgment to resolve
- May indicate conflicting requirements

---

## Examples

### Example 1: CI fails with format issues → auto-fix → re-check

**Scenario:** PR created, CI runs, format check fails

```bash
# Wait for checks
gh pr checks 42 --watch

Output:
✓ Lint - passing
✓ Tests - passing
✗ Format - failing (2 files need formatting)
✓ Build - passing

# Fetch logs to confirm root cause
gh run list --branch feature/my-feature --limit 3
gh run view 9876 --log-failed
```

**Decision:** Format failure → automatable → auto-fix

```bash
npm run format
git add .
git commit -m "chore: apply format fixes from CI"
git push

# Wait for checks again
gh pr checks 42 --watch
```

---

### Example 2: CI fails with test failures → fetch logs → escalate

**Scenario:** Tests fail in CI

```bash
gh pr checks 42 --watch

Output:
✓ Lint - passing
✗ Tests - failing
✓ Build - passing

# Fetch failed logs
gh run list --branch feature/my-feature --limit 3
gh run view 9876 --log-failed

Output (relevant lines):
FAIL src/auth/login.test.ts
  ✕ authenticates with valid credentials (timeout after 5000ms)
  ✕ rejects expired tokens (connection refused: db:5432)
```

**Decision:** DB connection failure in CI = environment/infra issue = escalate

```
AskUserQuestion(
  questions: [{
    question: "CI tests failed due to DB connection refused (db:5432). This is likely a CI environment config issue, not a code bug. How should we proceed?",
    header: "CI Test Failure",
    options: [
      { label: "Fix CI config", description: "I'll investigate and fix the CI environment setup" },
      { label: "Re-run CI", description: "May be transient, re-run the checks" },
      { label: "Manual control", description: "Stop here, I'll handle it" }
    ]
  }]
)
```

---

### Example 3: Automated review comments after checks pass

**Scenario:** CI all green, then check for automated reviews

```bash
# CI passed, now check reviews
gh pr view 42 --comments
gh pr reviews 42

Output:
@github-copilot[bot]: "This function exceeds complexity threshold. Consider extracting the validation logic into a helper."
@claude[bot]: "Missing null check on line 47: `user.profile.name` may throw if profile is undefined."
```

**Decision:**
- Copilot comment = design suggestion → escalate to user, then mark resolved
- Claude comment = concrete bug (null check) → auto-fix, then mark resolved

```bash
# Fix the null check (concrete actionable bug)
# Edit src/users/service.ts line 47: user.profile?.name

git add .
git commit -m "fix: add null safety for user.profile.name"
git push

# Get thread IDs to resolve
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 50) {
          nodes { id isResolved comments(first: 1) { nodes { body } } }
        }
      }
    }
  }
' -f owner=<owner> -f repo=<repo> -F pr=42

# Mark the Claude null-check thread as resolved
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
' -f threadId=<claude-thread-node-id>
```

Then escalate the Copilot design suggestion:

```
AskUserQuestion(
  questions: [{
    question: "Copilot suggests extracting validation logic to reduce complexity. Address it now or defer?",
    header: "Review Comment",
    options: [
      { label: "Address now", description: "Extract validation helper before merging" },
      { label: "Create follow-up", description: "Defer to a follow-up issue/PR" },
      { label: "Discuss in PR", description: "Leave comment for team discussion" }
    ]
  }]
)
# After user responds → mark the Copilot thread as resolved
gh api graphql -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' -f t=<copilot-thread-node-id>
```

---

### Example 4: Multiple CI failures → fix all → re-check

**Scenario:** Format + lint + missing import all fail

```bash
gh pr checks 42 --watch
# → multiple failures

gh run view 9876 --log-failed
# → format errors, eslint unused-var, TS cannot find module

# Fix all automatable issues
npm run format
eslint --fix src/
# Add missing import via Edit tool

git add .
git commit -m "chore: apply CI fixes (format, lint, missing import)"
git push

gh pr checks 42 --watch
# → all green
```

---

## Commands Reference

```bash
# Wait for all checks to complete (blocking)
gh pr checks <pr-number> --watch

# Check CI status (non-blocking snapshot)
gh pr checks <pr-number>

# List recent runs on a branch
gh run list --branch <branch-name> --limit 5

# Fetch only the failed step logs (most useful for diagnosis)
gh run view <run-id> --log-failed

# Fetch full run logs
gh run view <run-id> --log

# Re-run only the failed jobs
gh run rerun <run-id> --failed

# Check PR comments (automated bots included)
gh pr view <pr-number> --comments

# Check formal PR reviews
gh pr reviews <pr-number>

# List all review threads with IDs and resolved status
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 50) {
          nodes {
            id
            isResolved
            comments(first: 1) { nodes { body author { login } } }
          }
        }
      }
    }
  }
' -f owner=<owner> -f repo=<repo> -F pr=<pr-number>

# Resolve a specific review thread by node ID
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
' -f threadId=<thread-node-id>

# Push fixes after local changes
git add .
git commit -m "chore: apply CI fixes"
git push
```
