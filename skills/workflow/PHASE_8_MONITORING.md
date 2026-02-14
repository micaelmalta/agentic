# Phase 8: CI/Bot Monitoring Details

This document contains detailed decision trees, examples, and guidelines for Phase 8 one-pass CI/bot monitoring.

**For Phase 8 overview:** See [PHASES.md - Phase 8](PHASES.md#phase-8-monitor-summarize--cleanup)

---

## Contents

- [One-Pass Monitoring Philosophy](#one-pass-monitoring-philosophy)
- [Decision Tree](#decision-tree)
- [Auto-fix Guidelines](#auto-fix-guidelines)
- [Examples](#examples)
- [Why NOT a Retry Loop](#why-not-a-retry-loop)

---

## One-Pass Monitoring Philosophy

**Philosophy:** Phase 5 validation catches 90%+ of issues BEFORE the PR. Phase 8 does **one pass** of CI/bot monitoring + simple fixes only. Complex issues escalate to user.

**Key Principle:** Make fixes ONCE. If CI still fails after the fixes, escalate to user. **DO NOT loop.**

---

## Decision Tree

```
CI Status? → All green → Skip to Summary
           → Failures → Analyze failures

Bot Comments? → None → Skip to Summary
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

### Example 1: Auto-fix Format Issues

**Scenario:** PR created, CI runs, format check fails

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

### Example 2: User Escalation for Design Feedback

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

### Example 3: Escalation for Complex Failure

**Scenario:** Tests fail in CI but pass locally

```bash
gh pr checks 42

Output:
✓ Lint - passing
✗ Tests - failing (3 tests)
✓ Build - passing

Failed tests:
- test_user_authentication_flow
- test_api_rate_limiting
- test_database_transaction
```

**Decision:** Test failures = complex → Escalate

```
AskUserQuestion(
  questions: [{
    question: "CI tests failed (3 tests: authentication, rate limiting, transactions). These pass locally. This may be an environment difference. How should we proceed?",
    header: "CI Failure",
    options: [
      { label: "Debug CI env", description: "Investigate CI environment differences" },
      { label: "Skip for now", description: "Mark as known issue, handle separately" },
      { label: "Re-run CI", description: "May be transient failure, re-run checks" }
    ]
  }]
)
```

---

### Example 4: Multiple Simple Fixes

**Scenario:** Format + lint + missing import

```bash
gh pr checks 42

Output:
✗ Format - failing
✗ Lint - failing (unused variable)
✓ Tests - passing
✗ Build - failing (missing import)
```

**Decision:** All automatable → Apply all fixes

```bash
# Fix format
npm run format

# Fix lint
eslint --fix src/

# Add missing import (identified from build error)
# Edit file to add: import { UserService } from './services'

# Verify all fixes
git diff

# Commit and push
git add .
git commit -m "chore: apply CI fixes (format, lint, missing import)"
git push

# Report
echo "✓ Applied format, lint, and import fixes. CI should pass on re-run."
```

---

## Why NOT a Retry Loop?

### Problems with Post-PR Loops

1. ❌ **Infinite loop risk** - Complex/contradictory feedback can trap the agent
2. ❌ **Over-correction** - Agent might make unwanted changes without oversight
3. ❌ **Wasted resources** - Multiple CI runs for issues needing human judgment
4. ❌ **Harder debugging** - Tracing through multiple auto-fix iterations is painful
5. ❌ **Loss of transparency** - Code changes on remote without clear review

### Why One-Pass is Better

1. ✅ **Phase 5 catches issues upfront** - PR starts green or near-green
2. ✅ **CI failures are often environment-specific** - Can't loop-fix locally
3. ✅ **Human judgment for complex issues** - Faster and more reliable
4. ✅ **Clear audit trail** - One attempt, clear decision point
5. ✅ **User maintains control** - Explicit choice to continue or take over

### When to Loop vs. When to Escalate

**Loop (within one-pass):**
- Multiple independent simple fixes (format + lint + import)
- Same type of fix across multiple files
- Verification after auto-fix

**Escalate immediately:**
- Second attempt at same fix fails
- Mix of simple + complex issues
- Contradictory feedback
- Security/performance concerns
- Design suggestions

---

## Commands Reference

```bash
# Check CI status
gh pr checks <pr-number>

# Watch CI status (blocking)
gh pr checks <pr-number> --watch

# Read bot comments
gh pr view <pr-number> --comments

# Check specific workflow run
gh run view <run-id>

# Re-run failed checks
gh run rerun <run-id> --failed

# Push changes after fixes
git add .
git commit -m "chore: apply CI fixes"
git push
```
