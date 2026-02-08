# Workflow Phase Enforcement Guide

This document explains how to ensure all mandatory workflow phases are executed, with special focus on preventing the skip of Phase 5 validation (code review and security review).

## Problem Statement

In a past workflow execution, **Phase 5 validation was incomplete**:

- ✅ Formatter and linter ran
- ✅ Build ran
- ✅ Tests ran
- ❌ **Code review subagent was NOT launched**
- ❌ **Security review subagent was NOT launched**

This violated the workflow's MANDATORY requirements and allowed a security-sensitive authentication change to proceed without security audit.

## Root Cause

The workflow skill (see Phase 5 section) requires launching **6 validation checks**, but execution only ran 3 bash commands and skipped the 2 general-purpose subagents for reviews.

## Solutions

### 1. Enhanced Workflow Skill with Explicit Enforcement

**What changed:**

- Added `⛔ CRITICAL ENFORCEMENT` warning before Phase 5 subagent launch
- Added explicit instruction to read skill files: `Read skills/code-reviewer/SKILL.md`
- Added VERIFICATION CHECKLIST that must be completed before Phase 6
- Added Phase 6 gate with explicit Phase 5 completion check

**Location:** `skills/workflow/SKILL.md` (see Phase 5 and Phase 6 sections)

**How it helps:**

- Makes requirements impossible to miss
- Forces explicit verification
- Blocks Phase 6 until checklist complete

### 2. Validation Script

**Location:** `skills/workflow/scripts/validate_phase.py`

**Usage:**

```bash
# Before committing (Phase 6), validate Phase 5 completion
python3 skills/workflow/scripts/validate_phase.py --phase 5

# Before pushing, validate Phase 6 readiness
python3 skills/workflow/scripts/validate_phase.py --phase 6
```

**Features:**

- Interactive checklist for each validation requirement
- Fails if any requirement unchecked
- Provides remediation steps
- Can be integrated into CI/CD

**Example output:**

```
============================================================
PHASE 5 VALIDATION CHECKLIST
============================================================

Verify that ALL of the following were completed:

✓ Linter execution and pass? (y/n): y
  ✅ PASSED: Linter execution and pass

✓ Build execution and pass? (y/n): y
  ✅ PASSED: Build execution and pass

✓ Test execution and pass? (y/n): y
  ✅ PASSED: Test execution and pass

✓ Code review subagent execution? (y/n): n
  ❌ FAILED: Code review subagent execution

✓ Security review subagent execution? (y/n): n
  ❌ FAILED: Security review subagent execution

============================================================

⛔ PHASE 5 INCOMPLETE - Cannot proceed to Phase 6

Missing requirements:
  • MISSING: Code review subagent execution
  • MISSING: Security review subagent execution

🔄 Action Required:
  1. Complete all missing validations
  2. Launch code-reviewer and security-reviewer subagents
  3. Address all findings
  4. Re-run this validation
```

### 3. Pre-Commit Hook (Git Integration)

**Location:** `skills/workflow/scripts/pre-commit-validation.sh`

**Installation:**

```bash
# Copy to git hooks directory
cp skills/workflow/scripts/pre-commit-validation.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**How it works:**

- Runs automatically before every `git commit`
- Detects PARA workflow by checking for `context/plans/` or `context/summaries/`
- Runs validation script to verify Phase 5 completion
- **Blocks commit** if validation fails
- Can be bypassed with `git commit --no-verify` (emergency only)

**Why this helps:**

- Prevents accidental commits without validation
- Forces conscious decision to skip (--no-verify)
- Works in any environment (AI or human commits)

### 4. Updated Workflow Protocol

**Key additions to `SKILL.md`:**

1. **Protocol section:** Added mandatory validation section with validation script usage
2. **Phase 5 section:** Enhanced Phase 5 with critical enforcement and verification checklist
3. **Phase 6 section:** Added Phase 6 gate enforcement with explicit Phase 5 check

## Implementation Checklist

To ensure proper enforcement in your projects:

- [ ] **Review updated workflow skill**: Read `skills/workflow/SKILL.md` sections on Phase 5 and 6
- [ ] **Install validation script**: Ensure `validate_phase.py` is executable
- [ ] **Install pre-commit hook** (recommended): Copy to `.git/hooks/pre-commit`
- [ ] **Update AI prompts**: Reference validation requirements when invoking `/workflow`
- [ ] **Train team**: Share this guide with all developers and AI operators

## Enforcement Levels

### Level 1: Documentation (Current)

- ✅ **Status:** Implemented
- Updated SKILL.md with explicit requirements
- Clear language: "⛔ MANDATORY", "DO NOT proceed"
- Verification checklist before each phase gate

### Level 2: Interactive Validation (Current)

- ✅ **Status:** Implemented
- Validation script with interactive checklist
- Can be run manually: `python3 skills/workflow/scripts/validate_phase.py --phase 5`
- Exit code enforcement (0=pass, 1=fail)

### Level 3: Git Hook Enforcement (Optional)

- ✅ **Status:** Available (user must install)
- Pre-commit hook blocks commits without validation
- Requires manual installation per repository
- Can be bypassed with `--no-verify` for emergencies

### Level 4: CI/CD Enforcement (Future Enhancement)

- ⏳ **Status:** Not yet implemented
- GitHub Actions workflow validation
- PR status check that verifies context/summaries/ contains validation evidence
- Blocks PR merge without both code and security review evidence

## Usage Examples

### Correct Phase 5 Execution

```python
# At Phase 5 start, launch ALL 6 checks:

# Bash subagents
Task(subagent_type="Bash",
     prompt="Run formatter and linter: npm run format && npm run lint")
Task(subagent_type="Bash",
     prompt="Run build: npm run build")
Task(subagent_type="Bash",
     prompt="Run tests: npm test")

# General-purpose subagents (DO NOT SKIP THESE)
Task(subagent_type="general-purpose",
     prompt="Read skills/code-reviewer/SKILL.md and run code review on all changed files. Review for correctness, readability, maintainability.")
Task(subagent_type="general-purpose",
     prompt="Read skills/security-reviewer/SKILL.md and run security review on all changed files. Check for injection, XSS, auth issues, sensitive data exposure.")

# Wait for ALL 6 to complete before Phase 6
```

### Manual Validation Before Commit

```bash
# Before git commit, verify Phase 5 completion
$ python3 skills/workflow/scripts/validate_phase.py --phase 5

# If any requirement is missing, script will fail with exit code 1
# Fix issues and re-run until it passes
```

### With Pre-Commit Hook Installed

```bash
# Attempt to commit
$ git commit -m "feat: add S2S auth support"

# Hook automatically runs validation
======================================
Workflow Phase 5 Validation Gate
======================================

✓ PARA workflow detected - enforcing validation gate

Running Phase 5 validation check...

[... interactive checklist ...]

⛔ Phase 5 validation FAILED

Required actions before commit:
  1. Launch code-reviewer subagent
  2. Launch security-reviewer subagent
  3. Address all findings
  4. Re-run validation

# Commit is blocked until validation passes
```

## Review Checklist Template

Copy this into your Phase 5 notes:

```markdown
## Phase 5 Validation Checklist

Before proceeding to Phase 6 (Commit):

### Automated Checks

- [ ] Formatter run and code formatted: `npm run format` (or equivalent: black ., gofmt -w ., etc.)
- [ ] Linter passed: `npm run lint` (or equivalent)
- [ ] Build passed: `npm run build` (or equivalent)
- [ ] Tests passed: `npm test` (or equivalent)

### Review Subagents (MANDATORY - DO NOT SKIP)

- [ ] Code review subagent launched
  - [ ] Read `skills/code-reviewer/SKILL.md`
  - [ ] Reviewed all changed files
  - [ ] Findings documented
  - [ ] All findings addressed
- [ ] Security review subagent launched
  - [ ] Read `skills/security-reviewer/SKILL.md`
  - [ ] Reviewed all changed files for vulnerabilities
  - [ ] Findings documented
  - [ ] All vulnerabilities fixed

### Validation Script

- [ ] Ran: `python3 skills/workflow/scripts/validate_phase.py --phase 5`
- [ ] Result: PASS

### Gate Decision

- [ ] ALL items above checked
- [ ] Cleared to proceed to Phase 6
```

## Special Cases

### Emergency Bypass

If you must commit without full validation (production incident, critical hotfix):

1. **Document the reason** in commit message
2. **Create a follow-up task** to complete validation
3. **Use `--no-verify`** to bypass pre-commit hook:
   ```bash
   git commit --no-verify -m "hotfix: critical security patch"
   ```
4. **Complete validation ASAP** and create follow-up commit with fixes

### Iterative Development

During rapid iteration, you may want to commit frequently:

- **Use feature branches** - validate before merging to main
- **Mark commits as WIP** - `git commit -m "wip: working on feature"`
- **Full validation required** before PR creation
- **Run validation script** before `gh pr create`
- **Create PR as draft** with `gh pr create --draft`; run `gh pr ready` only after all commits are pushed

## FAQ

### Q: Why is this so strict?

**A:** Security and code quality issues are expensive to fix later. A historical incident showed that skipping security review on auth changes is dangerous. Enforcement prevents human error and AI oversight.

### Q: Can I skip reviews for trivial changes?

**A:** The workflow is for non-trivial changes. For typo fixes, don't use `/workflow`. For anything that modifies code logic, reviews are mandatory.

### Q: What if AI skips reviews again?

**A:**

1. Stop immediately and point to SKILL.md Phase 5 requirements
2. Run validation script to document missing steps
3. Launch missing review subagents before proceeding
4. Consider installing pre-commit hook for automatic enforcement

### Q: How do I know reviews were actually done?

**A:** Look for evidence:

- Subagent launch commands in chat history
- Review findings documented in summary
- Changes made based on review feedback
- Validation script passing

### Q: Should I install pre-commit hook?

**A:**

- **YES** if working on production/security-critical code
- **YES** if team members sometimes skip validation
- **OPTIONAL** for personal/experimental projects
- Can always bypass with `--no-verify` if needed

## Continuous Improvement

This enforcement system will evolve. Suggest improvements:

1. **More automation** - CI/CD integration
2. **Better detection** - Parse summaries for review evidence
3. **Metrics** - Track validation compliance rate
4. **Templates** - Pre-filled review checklists

## Summary

**Key Takeaways:**

1. **Phase 5 has 6 checks** - Formatter, Linter, Build, Tests, Code Review, Security Review
2. **ALL are mandatory** - No exceptions for security-sensitive changes
3. **Verification required** - Use checklist or validation script
4. **Phase 6 gate** - Cannot commit without Phase 5 complete
5. **Multiple enforcement layers** - Documentation → Script → Hook → CI/CD

**To ensure compliance:**

- Read SKILL.md Phase 5 and 6 sections carefully
- Use validation script before committing
- Install pre-commit hook for automatic enforcement
- Never skip security review on auth/crypto/data access changes

**If you see Phase 5 being skipped:**

1. **STOP** the workflow immediately
2. Point to SKILL.md enforcement requirements
3. Run validation script to document gaps
4. Complete missing reviews before proceeding
5. Update this guide with lessons learned
