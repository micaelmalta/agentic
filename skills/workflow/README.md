# Workflow Skill - Complete Development Workflow

A structured, enforceable workflow from planning to GitHub PR with mandatory quality gates.

## Quick Start

```bash
# Start workflow for a task
/workflow work on [task description]

# Or explicitly plan first
/plan [task description]
/execute
```

## Files

| File                               | Purpose                                                          |
| ---------------------------------- | ---------------------------------------------------------------- |
| `SKILL.md`                         | Complete workflow specification (8 phases, skill integration)    |
| `WORKFLOW.md`                      | Detailed workflow guide and examples                             |
| `ENFORCEMENT.md`                   | **Phase gate enforcement guide** (how to prevent skipped phases) |
| `PHASE5-CHECKLIST.md`              | Copy-paste checklist for Phase 5 validation                      |
| `scripts/validate_phase.py`        | Validation script for phase completion verification              |
| `scripts/pre-commit-validation.sh` | Git pre-commit hook for automatic enforcement                    |

## Why Enforcement Matters

In a past workflow execution, Phase 5 validation was incomplete:

- ✅ Linter, build, tests ran
- ❌ **Code review subagent skipped**
- ❌ **Security review subagent skipped**

This allowed a security-sensitive authentication change (S2S token migration) to proceed without security audit, violating the workflow's mandatory requirements.

## Enforcement Solutions

### 1. Enhanced SKILL.md (Documentation)

**Location:** `SKILL.md` Phase 5 and Phase 6 sections

**What changed:**

- Added `⛔ CRITICAL ENFORCEMENT` warnings
- Added VERIFICATION CHECKLIST before Phase 6
- Added Phase 6 gate with explicit Phase 5 check
- Made skill file reading explicit in subagent prompts

**Impact:** Makes requirements impossible to miss in skill file

### 2. Validation Script (Interactive)

**Location:** `scripts/validate_phase.py`

**Usage:**

```bash
# Before committing
python3 skills/workflow/scripts/validate_phase.py --phase 5

# Before pushing
python3 skills/workflow/scripts/validate_phase.py --phase 6
```

**Features:**

- Interactive checklist for each requirement
- Fails if any item unchecked
- Provides remediation steps
- Exit code enforcement (0=pass, 1=fail)

**Impact:** Human-in-the-loop verification

### 3. Pre-Commit Hook (Automated)

**Location:** `scripts/pre-commit-validation.sh`

**Installation:**

```bash
cp skills/workflow/scripts/pre-commit-validation.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**How it works:**

- Runs automatically before every `git commit`
- Detects PARA workflow presence
- Runs validation script
- **Blocks commit** if Phase 5 incomplete
- Bypassable with `git commit --no-verify` (emergency only)

**Impact:** Prevents accidental commits without validation

### 4. Enforcement Guide (Knowledge)

**Location:** `ENFORCEMENT.md`

**Contents:**

- Problem statement and root cause analysis
- All enforcement mechanisms explained
- Usage examples and templates
- FAQ and special cases
- Continuous improvement plan

**Impact:** Complete reference for enforcement best practices

### 5. Quick Checklist (Process)

**Location:** `PHASE5-CHECKLIST.md`

**Usage:** Copy into work notes and fill out during Phase 5

**Contents:**

- All 6 validation requirements
- Space for findings and status
- Re-validation section
- Sign-off area

**Impact:** Structured process ensures nothing is missed

## Phase 5 Requirements (MANDATORY)

Before Phase 6 (Commit), ALL 6 checks must complete:

1. ✅ **Formatter** - Run and format code (project style)
2. ✅ **Linter** - Run and pass (auto-fix allowed)
3. ✅ **Build** - Compile/bundle successfully
4. ✅ **Tests** - All tests pass (unit + integration + e2e)
5. ✅ **Code Review** - Launch `code-reviewer` subagent, address findings
6. ✅ **Security Review** - Launch `security-reviewer` subagent, fix vulnerabilities

**How to verify:**

```bash
# Quick verification
python3 skills/workflow/scripts/validate_phase.py --phase 5

# Or use checklist
cat skills/workflow/PHASE5-CHECKLIST.md
```

## Correct Phase 5 Execution

```python
# Launch ALL 6 checks (single message):

Task(subagent_type="Bash",
     prompt="Run linter: npm run lint")
Task(subagent_type="Bash",
     prompt="Run build: npm run build")
Task(subagent_type="Bash",
     prompt="Run tests: npm test")

# DO NOT SKIP THESE TWO:
Task(subagent_type="general-purpose",
     prompt="Read skills/code-reviewer/SKILL.md and run code review on all changed files. Review for correctness, readability, maintainability, accessibility, i18n.")
Task(subagent_type="general-purpose",
     prompt="Read skills/security-reviewer/SKILL.md and run security review on all changed files. Check for injection, XSS, auth issues, sensitive data exposure, crypto.")

# Wait for ALL 6 to complete
# Address all findings
# Re-run validations
# Verify with validation script
# Then proceed to Phase 6
```

## 8 Workflow Phases

| Phase | Name           | Skills                                      | Gate                     |
| ----- | -------------- | ------------------------------------------- | ------------------------ |
| 1     | Plan           | para, architect                             | User approval            |
| 2     | Branch         | git                                         | Branch created           |
| 3     | Execute        | developer (TDD)                             | Implementation complete  |
| 4     | Testing        | testing, developer                          | All tests pass           |
| 5     | **Validation** | **code-reviewer, security-reviewer, ci-cd** | **ALL 6 checks pass** ⚠️ |
| 6     | Commit         | git-commits                                 | Changes committed        |
| 7     | PR             | git, documentation                          | PR created               |
| 8     | Monitor        | Datadog, documentation                      | Observability verified   |

**Phase 5 is the critical gate** - most commonly skipped, highest risk.

## When to Use Enforcement

### Always Enforce (Install Hook)

- Production code
- Security-sensitive changes (auth, crypto, data access)
- Team environments
- Public/open-source projects

### Manual Enforcement (Use Script)

- Personal projects
- Experimental code
- Rapid prototyping
- When hook conflicts with other tools

### Optional Enforcement

- Documentation-only changes
- Configuration changes
- Non-code commits (e.g., context/plans)

## Integration with MCP

The workflow integrates with MCP servers:

- **Atlassian / Atlassian-Tech**: Jira tickets, Confluence docs. Phase 1: ticket context; Phase 2: transition ticket to **In Progress**; Phase 7: link PR, transition ticket to **In Code Review**.
- **Datadog**: Logs, metrics, monitors (Phase 5, 8)
- **Playwright**: Browser automation for E2E tests (Phase 4)

Setup: `/setup` or `skills/setup/SKILL.md`

## Troubleshooting

### "Phase 5 was skipped"

1. **STOP immediately** before Phase 6
2. Point to `SKILL.md` Phase 5 requirements (see Phase 5 section)
3. Run validation script: `python3 skills/workflow/scripts/validate_phase.py --phase 5`
4. Launch missing review subagents
5. Address all findings
6. Re-run validation
7. Proceed only when script returns 0

### "Validation script fails"

Check that all requirements are met:

- Linter output shows 0 errors
- Build command succeeded
- Test suite shows all passing
- Code review subagent was launched and completed
- Security review subagent was launched and completed
- All findings from reviews were addressed

### "Pre-commit hook blocks my commit"

Either:

- Complete missing Phase 5 validations (proper solution)
- Bypass for emergency: `git commit --no-verify` (document why)

### "How do I prove reviews were done?"

Evidence to provide:

- Subagent launch commands in chat transcript
- Review findings documented in summary
- Code changes made based on feedback
- Validation script passing: `--phase 5` returns exit code 0

## Best Practices

1. **Read SKILL.md** before starting workflow
2. **Use validation script** at each phase gate
3. **Install pre-commit hook** for important repos
4. **Copy Phase 5 checklist** into work notes
5. **Document review findings** in summaries
6. **Never skip security review** on auth/crypto/data changes
7. **Re-run all checks** after addressing findings
8. **Track enforcement metrics** (compliance rate)

## Contributing

Found an enforcement gap? Suggest improvements:

1. **Documentation** - Clarify requirements
2. **Automation** - Better scripts/hooks
3. **Detection** - Parse summaries for evidence
4. **CI/CD** - GitHub Actions integration
5. **Metrics** - Compliance tracking

## See Also

- `SKILL.md` - Complete workflow specification
- `ENFORCEMENT.md` - Detailed enforcement guide
- `PHASE5-CHECKLIST.md` - Copy-paste checklist
- `skills/code-reviewer/SKILL.md` - Code review protocol
- `skills/security-reviewer/SKILL.md` - Security audit protocol
- `skills/para/SKILL.md` - PARA methodology

---

**Remember:** Phase gates exist to prevent expensive bugs in production. Enforcement is not bureaucracy—it's engineering discipline.
