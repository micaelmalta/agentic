---
name: workflow
description: "Complete development workflow from planning to GitHub PR using PARA methodology and RLM for large codebases. Use when implementing a feature, fixing a bug, refactoring, or taking work from plan to GitHub PR."
triggers:
  - "/workflow"
  - "implement a feature"
  - "fix bug end to end"
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

**⚠️ ENFORCEMENT:** Phase gates are MANDATORY. See [GATES.md](GATES.md) for all gate checklists and enforcement mechanisms.

---

## When to Use This Workflow

Use the workflow skill when you need to:
- Implement a feature end-to-end (plan → code → test → PR)
- Fix a bug with full TDD cycle
- Refactor code with complete validation
- Take work from concept to merged PR
- Ensure quality gates are enforced (tests, code review, security)

**Skip this workflow for:**
- Read-only queries or explanations
- Quick fixes without tests
- Simple documentation updates

---

## The 8 Phases (Overview)

| Phase | Goal | Skill Used | Details |
|-------|------|------------|---------|
| **1. Plan** | Create implementation plan | para, architect | [PHASES.md](PHASES.md#phase-1-plan) |
| **2. Worktree** | Set up isolated workspace | - | [PHASES.md](PHASES.md#phase-2-create-git-worktree) |
| **3. Execute** | Implement using TDD | developer | [PHASES.md](PHASES.md#phase-3-execute-implementation) |
| **4. Test** | Validate all tests pass | phase-testing-agent | [PHASES.md](PHASES.md#phase-4-testing-validation-mandatory) |
| **5. Validate** | Quality + security review | phase-validation-agent | [PHASES.md](PHASES.md#phase-5-validation-mandatory) |
| **6. Commit** | Stage work for PR | git-commits | [PHASES.md](PHASES.md#phase-6-commit--push) |
| **7. PR** | Create GitHub pull request | phase-pr-agent | [PHASES.md](PHASES.md#phase-7-create-github-pr) |
| **8. Monitor** | Document and clean up | para, documentation | [PHASES.md](PHASES.md#phase-8-monitor-summarize--cleanup) |

**Detailed phase protocols:** See [PHASES.md](PHASES.md) for complete phase-by-phase instructions.

---

## Required Skills

This workflow coordinates these specialized skills:

- **para** - Planning, execution, summarization (`/plan`, `/execute`, `/summarize`)
- **developer** - TDD implementation (MANDATORY for all code)
- **architect** - Technical specifications and design documents
- **testing** - Test design and execution (unit, integration, e2e)
- **code-reviewer** - Code quality review
- **security-reviewer** - Security audit and vulnerability detection
- **git-commits** - Commit message conventions
- **documentation** - README, API docs, ADRs
- **rlm** - Large codebase processing (100+ files)
- **refactoring** - Safe structural changes
- **debugging** - Bug reproduction and fixing
- **dependencies** - Dependency management
- **performance** - Profiling and optimization
- **ci-cd** - Pipeline configuration

**Skills are invoked by reading their SKILL.md files.** Example: Read `skills/developer/SKILL.md` for TDD implementation protocol.

---

## Reference Documents

For detailed information, see these reference files:

- **[PHASES.md](PHASES.md)** - Detailed protocol for all 8 phases
- **[GATES.md](GATES.md)** - Gate checklists and retry loops (MANDATORY enforcement)
- **[MCP.md](MCP.md)** - MCP integration (Atlassian, Datadog, Playwright)
- **[TOOLS.md](TOOLS.md)** - Tool usage for file modifications (Edit/Write/Read)
- **[AGENTS.md](AGENTS.md)** - Phase agent specifications (testing, validation, PR)
- **[PARALLEL.md](PARALLEL.md)** - Parallel execution patterns
- **[ENFORCEMENT.md](ENFORCEMENT.md)** - Gate enforcement mechanisms and scripts

---

## Quick Start

### 1. Plan Your Work

```
/plan <task-description>
```

Creates detailed plan in `context/plans/YYYY-MM-DD-<task>.md`. For technical designs, also use architect skill and tech_proposal_template.md.

### 2. Execute All Phases

After plan approval, phases 2-8 execute **autonomously**:
- No stopping between phases
- Automatic gate enforcement
- Progress tracking with TodoWrite
- Only escalate if gate fails or critical blocker

### 3. Monitor Gates

Watch for these critical gates:
- **Phase 4:** All tests must pass
- **Phase 5:** Code review + security review (MANDATORY)
- **Phase 7:** PR created successfully

See [GATES.md](GATES.md) for complete gate checklists.

---

## Tool Usage (CRITICAL)

**⛔ NEVER create temporary bash scripts for file modifications**

- ✅ **ALWAYS** use **Edit tool** for modifying existing files
- ✅ **ALWAYS** use **Write tool** for creating new files
- ❌ **NEVER** create temporary scripts (fix.sh, replace.sh, etc.)
- ❌ **NEVER** use sed/awk/perl for source code modifications

See [TOOLS.md](TOOLS.md) for complete tool usage guidelines and examples.

---

## MCP Integration

After running `/setup`, use these MCP servers:

- **Atlassian** (atlassian, atlassian-tech) - Jira tickets, Confluence docs
  - Phase 1: Get ticket context
  - Phase 2: Transition to "In Progress"
  - Phase 7: Link PR, transition to "In Code Review"
- **Datadog** - Logs, metrics, monitors, traces
  - Phase 8: Monitor deployment, check for errors
  - debugging/ci-cd: Observability
- **Playwright** - Browser automation (MANDATORY for UI)
  - Phase 4: E2E testing for frontend work

See [MCP.md](MCP.md) for detailed integration instructions and examples.

---

## Feedback Loops (MANDATORY)

The workflow enforces retry loops at each gate:

1. **TDD Loop (Phase 3):** Write test → Run (FAIL) → Write code → Run (PASS) → Refactor
2. **Testing Loop (Phase 4):** Run tests → If fail, fix code → Re-run tests
3. **Validation Loop (Phase 5):** Run 6 checks → If fail, fix issues → Re-run checks

**Escalation Rules:**
- Test fails 3+ times: Ask user for guidance
- Security vulnerability: STOP workflow, require user decision
- Conflicting requirements: Ask user to clarify

See [GATES.md](GATES.md) for complete feedback loop protocols.

---

## Parallel Execution

Launch independent subagents in parallel for efficiency:

**Phase 1 (Exploration):**
```
Task(Explore, "Find affected files...")
Task(Explore, "Check existing patterns...")
Task(Bash, "Review git history...")
```

**Phase 5 (Validation):**
```
# phase-validation-agent runs all checks internally in parallel
Task(general-purpose, "Read skills/agents/phase-validation-agent/AGENT.md...")
```

See [PARALLEL.md](PARALLEL.md) for complete parallel execution patterns.

---

## Workflow Checklist

- [ ] Phase 1: Plan created and approved (para skill)
- [ ] Phase 2: Git worktree created and initialized
- [ ] Phase 3: Implementation complete (developer skill, TDD)
- [ ] Phase 4: Test validation complete (all tests pass, build succeeds)
- [ ] Phase 5: Validation complete (formatter, linter, build, tests, code review, security review)
- [ ] Phase 6: Changes committed and pushed
- [ ] Phase 7: PR created as draft; marked ready after all commits
- [ ] Phase 8: CI/bot monitoring complete (one-pass), summary documented, worktree cleaned up

---

## Output

When complete (ONLY after all gates pass):

- Merged PR URL
- Summary of what was accomplished
- Link to summary document in `context/summaries/`
- Confirmation that all tests pass
- Confirmation that build succeeds

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Phase 1 needs technical architecture | **architect** skill | Read `skills/architect/SKILL.md` |
| Phase 3 implementation uses TDD | **developer** skill | Read `skills/developer/SKILL.md` |
| Phase 4 testing details | **testing** skill | Read `skills/testing/SKILL.md` |
| Phase 5 code review | **code-reviewer** skill | Read `skills/code-reviewer/SKILL.md` |
| Phase 5 security review | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |
| Phase 6 commit messages | **git-commits** skill | Read `skills/git-commits/SKILL.md` |
| Phase 8 documentation | **documentation** skill | Read `skills/documentation/SKILL.md` |
| Large codebase in any phase | **rlm** skill | Read `skills/rlm/SKILL.md` |
