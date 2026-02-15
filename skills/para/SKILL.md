---
name: para
description: "Structured workflow for AI-assisted development (Plan → Review → Execute → Summarize → Archive). Use when the user invokes /plan, /execute, /summarize, /archive, /check, /help, /init, /status, or when adding features, fixing non-trivial bugs, refactoring, or doing any task that will result in git changes. Skip for read-only queries, explanations, or quick fixes."
triggers:
  - "/plan"
  - "/execute"
  - "/summarize"
  - "/archive"
  - "/check"
  - "/help"
  - "/init"
  - "/status"
  - "plan before coding"
  - "create a plan"
  - "should I use PARA"
---

# PARA-Programming Methodology

**Purpose:** Structured workflow methodology for AI-assisted development

---

## Overview

PARA-Programming is a structured workflow for AI-assisted software development that ensures:

- Clear planning before execution
- Documented decisions and context
- Reproducible work sessions
- Knowledge preservation across sessions

---

## The PARA Workflow

```
Plan → Review → Execute → Summarize → Archive
```

### 1. Plan Phase (`/plan`)

**Purpose:** Think before you code. Create a detailed plan for the work ahead.

**When to use:**

- Adding features or functionality
- Fixing complex bugs
- Making architectural changes
- Refactoring code
- Any task that will result in git changes

**What happens:**

- Create `context/plans/YYYY-MM-DD-<task-name>.md` (in a monorepo: use root `context/` for repo-wide work, or the relevant project's `context/` when scoped to that project)
- Document objectives, approach, and implementation steps
- Identify affected files and components
- Consider edge cases and risks
- AI reviews and validates the plan

**Skip PARA for:**

- Simple queries ("What does X do?")
- Code navigation ("Show me X")
- Explanations ("How does X work?")
- Read-only informational tasks

**For decision framework:** See [reference/DECISION_FRAMEWORK.md](reference/DECISION_FRAMEWORK.md) for complete "Should I use PARA?" guidelines.

#### Jira Epic/Initiative Breakdown

When the input to `/plan` is a **Jira Epic** or **Initiative**, break it down into actionable tickets as part of the plan:

**Epic →** User Stories + Tasks (implementation-level)
- Each Story: clear Title, detailed Description (context, scope, acceptance criteria), independently testable, vertically sliced, implementation-ready

**Initiative →** 1 Backend Epic + 1 Frontend Epic → Stories + Tasks each
- Each Epic: clear Title + Description with scope and goals

**Dependencies:**
- Explicitly identify and reference in each ticket description
- Add a dedicated Dependencies section per affected ticket
- Minimize blocking: backend creates API contract + mocks first so frontend can proceed in parallel

**Output format:**
```
Initiative (if applicable)
├── Backend Epic → Stories → Tasks
├── Frontend Epic → Stories → Tasks
└── Dependency Summary (cross-ticket view)
```

All titles and descriptions must be clear, concrete, and ready to create in Jira.

**⚠️ DO NOT create tickets during planning.** Include the breakdown in the plan document for user review. Tickets are created **only after the user approves the plan** — as the first action of the Execute phase, using Atlassian MCP (`jira_create_issue`, `jira_batch_create_issues`, `jira_link_to_epic`, `jira_create_issue_link`).

### 2. Review Phase

**Purpose:** Validate the plan before starting work.

**What happens:**

- AI presents the plan for human review
- Discuss and refine approach
- Confirm understanding of requirements
- Approve or revise before execution

### 3. Execute Phase (`/execute`)

**Purpose:** Implement the plan with tracking and context.

**What happens:**

- Execute ALL steps in the plan autonomously (no stopping between steps)
- Create feature branch (optional but recommended)
- Track todos and progress with TodoWrite
- Reference the plan during implementation
- Document decisions and changes as you work
- Show progress as each step completes: "Step X/N: [description]"

**Autonomous Step Execution:**

When you run `/execute`, ALL steps in the plan execute automatically without stopping between steps:

- Work through steps 1, 2, 3... N sequentially
- Show progress: "Step X/N: [step description]" as each completes
- **Don't ask "should I proceed to next step?"** - just proceed to the next step
- **Make best-choice decisions** without asking (pick the best option and continue)
- **Only escalate to user if:**
  - Genuinely stuck after multiple attempts
  - Critical blocker that requires user decision (e.g., conflicting requirements)
  - Unrecoverable error that prevents continuing

**Decision-Making:**

- When multiple valid approaches exist: **choose the best one and proceed**
- Never ask "which approach should I use?" between steps
- Never ask "should I continue?" between steps
- Only ask user for guidance when genuinely stuck or requirements are unclear/conflicting

**For execution best practices:** See [reference/COMMANDS.md](reference/COMMANDS.md).

### 4. Summarize Phase (`/summarize`)

**Purpose:** Document what was accomplished and learned.

**What happens:**

- Create `context/summaries/YYYY-MM-DD-<task-name>.md` (in a monorepo: same root vs project scope as the plan)
- Document what was built/changed
- Record decisions and trade-offs
- Note lessons learned and future considerations
- Link to related plans and commits

**What to include:**

- Summary of changes
- Files modified
- Key decisions made
- Testing performed
- Known limitations
- Future work identified

### 5. Archive Phase (`/archive`)

**Purpose:** Preserve context for future reference while keeping active context clean.

**What happens:**

- Move completed plans and summaries to `context/archives/` (in a monorepo: under the same root or project context where the plan/summary lived)
- Update `context/context.md` to remove completed work
- Preserve the knowledge chain (plan → summary → archive)

---

## Directory Structure

**Single-repo (default):**

```
project-root/
├── CLAUDE.md              # Project-specific context (tech stack, conventions)
├── context/
│   ├── context.md         # Active session context
│   ├── data/             # Input files, payloads, datasets
│   ├── plans/            # Pre-work planning documents
│   ├── summaries/        # Post-work reports
│   ├── archives/         # Historical context snapshots
│   └── servers/          # MCP tool wrappers
└── ~/.claude/
    └── CLAUDE.md         # This file (global methodology)
```

**Monorepo only:** When the repository is a monorepo (multiple apps or packages in one repo), use a **parent context at the repo root** and **per-project context** under each project:

- **Root (parent):** One `context/` at repo root for cross-cutting plans, summaries, and archives (e.g. shared infra, repo-wide refactors, release coordination). Root `CLAUDE.md` describes the monorepo layout, shared tooling, and conventions.
- **Per project:** Each app or package (e.g. `apps/web/`, `packages/api/`) can have its own `context/` and optional `CLAUDE.md` for that project's plans, summaries, and archives. Use the **project's** `context/` when work is scoped to that project; use the **root** `context/` when work spans multiple projects or is repo-wide.

```
monorepo-root/
├── CLAUDE.md              # Monorepo layout, shared tooling, conventions
├── context/               # Parent: repo-wide plans, summaries, archives
│   ├── context.md
│   ├── plans/
│   ├── summaries/
│   └── archives/
├── apps/
│   ├── web/
│   │   ├── CLAUDE.md      # (optional) App-specific context
│   │   └── context/       # This app's plans, summaries, archives
│   └── api/
│       ├── CLAUDE.md
│       └── context/
└── packages/
    └── shared/
        ├── CLAUDE.md
        └── context/
```

**Rule:** Use the monorepo two-level structure **only if** the repo is actually a monorepo. For a single application or package repo, use the single-repo structure only.

---

## File Purposes

### `CLAUDE.md` (Project Level)

- Project-specific context
- Tech stack and architecture
- Coding conventions and patterns
- Team guidelines
- Common commands and workflows

### `context/context.md`

- Current active work
- Session state
- Links to active plans
- Temporary findings
- **Note:** `context/` is git-ignored. These files are local session artifacts, not version-controlled.

### `context/plans/`

- One file per planned task
- Naming: `YYYY-MM-DD-<task-name>.md`
- Contains detailed implementation plan
- Preserved after execution

### `context/summaries/`

- One file per completed task
- Naming: `YYYY-MM-DD-<task-name>.md`
- Documents what was accomplished
- Links back to plan and commits

### `context/archives/`

- Historical plans and summaries
- Organized by date or milestone
- Searchable knowledge base
- Reference for similar future tasks

### `context/data/`

- Test data and fixtures
- API payloads and responses
- Example datasets
- Input files for processing

### `context/servers/`

- MCP tool wrappers
- Custom command implementations
- Integration helpers

---

## Commands

- `/init` - Initialize PARA structure
- `/plan <task>` - Create plan
- `/execute` - Start execution
- `/summarize` - Document outcomes
- `/archive` - Archive completed work
- `/status` - Check workflow state
- `/check` - Decision helper
- `/help` - Show guide

**For detailed commands and best practices:** See [reference/COMMANDS.md](reference/COMMANDS.md).

---

## Context Management

### Where to put context (monorepo vs single-repo)

- **Single-repo:** One `context/` at project root; all plans, summaries, and archives live there.
- **Monorepo:** Use root `context/` for repo-wide work; use each project's `context/` for work scoped to that app or package. Choose the context directory that matches the scope of the current task.

### Active Context (`context/context.md`)

Keep this file lean and focused:

- Current task summary
- Active plans (links only)
- Temporary findings
- Session state

**Note:** `context/` is git-ignored — context files are local session artifacts, not version-controlled.

### Long-term Knowledge (`CLAUDE.md`)

Project-specific persistent context:

- Architecture decisions
- Tech stack and dependencies
- Coding patterns and conventions
- Common pitfalls and solutions
- Team guidelines

### Historical Context (`context/archives/`)

Completed work for reference:

- Past plans and summaries
- Lessons learned
- Similar problems solved
- Evolution of decisions

---

## Integration with Git

PARA-Programming complements git workflow:

```
/plan → feature branch → /execute → commits → /summarize → merge → /archive
```

- Plans document the "why" before commits show the "what"
- Summaries capture context that commit messages can't
- Archives preserve decision history beyond git log

---

## Philosophy and Tips

**For philosophy, principles, and tips for success:** See [reference/METHODOLOGY.md](reference/METHODOLOGY.md).

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Plan needs technical architecture | **architect** skill | Read `skills/architect/SKILL.md` |
| Execute phase needs TDD | **developer** skill | Read `skills/developer/SKILL.md` |
| Full workflow from plan to PR | **workflow** skill | Read `skills/workflow/SKILL.md` |
| Summarize needs commit info | **git-commits** skill | Read `skills/git-commits/SKILL.md` |
| Large codebase exploration in plan | **rlm** skill | Read `skills/rlm/SKILL.md` |
| Plan includes documentation updates | **documentation** skill | Read `skills/documentation/SKILL.md` |
