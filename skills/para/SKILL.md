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

**Version:** 1.0
**Purpose:** Global workflow methodology for AI-assisted development

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

- Create `context/plans/YYYY-MM-DD-<task-name>.md` (in a monorepo: use root `context/` for repo-wide work, or the relevant project’s `context/` when scoped to that project)
- Document objectives, approach, and implementation steps
- Identify affected files and components
- Consider edge cases and risks
- AI reviews and validates the plan

**Skip PARA for:**

- Simple queries ("What does X do?")
- Code navigation ("Show me X")
- Explanations ("How does X work?")
- Read-only informational tasks

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

**Best practices:**

- Follow the plan but adapt as needed
- Document deviations from the plan in execution notes
- Keep commits focused and atomic
- Update the plan if scope changes significantly
- Use TodoWrite to track step completion visibly

### 4. Summarize Phase (`/summarize`)

**Purpose:** Document what was accomplished and learned.

**What happens:**

- Create `context/summaries/YYYY-MM-DD-<task-name>.md` (in a monorepo: same root vs project scope as the plan)
- Document what was built/changed
- Record decisions and trade-offs
- Note lessons learned and future considerations
- Link to related plans and commits
- **Commit the summary to git:** `git add context/summaries/<summary-file>.md && git commit -m "docs: add summary for <task>"`

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
- **Commit the archive changes to git:** `git add context/archives/ context/context.md && git commit -m "docs: archive completed work for <task>"`

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
- **Per project:** Each app or package (e.g. `apps/web/`, `packages/api/`) can have its own `context/` and optional `CLAUDE.md` for that project’s plans, summaries, and archives. Use the **project’s** `context/` when work is scoped to that project; use the **root** `context/` when work spans multiple projects or is repo-wide.

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
│   │   └── context/       # This app’s plans, summaries, archives
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
- Temporary notes and findings
- **Commit to git when updated:** Changes to this file should be committed regularly to track workflow state

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

## Decision Framework: Should I Use PARA?

### ✅ Use PARA Workflow When:

| Scenario                  | Reason                                          |
| ------------------------- | ----------------------------------------------- |
| Adding new features       | Needs planning and documentation                |
| Fixing bugs (non-trivial) | Requires investigation and approach             |
| Refactoring code          | Must document before/after and rationale        |
| Architecture changes      | Critical to plan and record decisions           |
| Performance optimization  | Need baseline, approach, and results            |
| Security fixes            | Must document vulnerability and fix             |
| API changes               | Breaking changes need careful planning          |
| Database migrations       | Requires careful planning and rollback strategy |
| Dependency updates        | Potential for breaking changes                  |
| Config changes (complex)  | Need to understand impact                       |

**Rule of thumb:** If it results in git changes, use PARA workflow.

### ❌ Skip PARA Workflow For:

| Scenario                     | Alternative           |
| ---------------------------- | --------------------- |
| "What does function X do?"   | Direct conversation   |
| "Show me where Y is defined" | Use search/navigation |
| "How does Z work?"           | Ask for explanation   |
| "List all API endpoints"     | Direct query          |
| "Explain this error message" | Direct conversation   |
| Quick typo fixes             | Just fix it           |
| Documentation reading        | Direct conversation   |
| Code review comments         | Direct conversation   |

**Rule of thumb:** If it's read-only or informational, skip PARA.

---

## Commands Reference

- **`/init`** - Initialize PARA structure in project. In a **monorepo**, initialize `context/` at repo root (parent) and optionally `context/` under each app or package that will use PARA. When setting up a new project, suggest **/setup** if the user will need Atlassian or Datadog MCP (Jira, Confluence, logs, metrics).
- **`/plan <task>`** - Create a new plan
- **`/execute`** - Start execution with tracking
- **`/summarize`** - Generate post-work summary
- **`/archive`** - Archive completed work
- **`/status`** - Check current workflow state
- **`/check`** - Decision helper (should I use PARA?)
- **`/help`** - Show comprehensive guide

---

## Best Practices

### Planning

- Be specific about objectives
- List all affected files
- Consider edge cases upfront
- Identify risks and unknowns
- Keep plans focused (single responsibility)
- **Commit the plan to git immediately after creation**

### Execution

- Create feature branches for complex work
- Reference plan file during implementation
- Document deviations from plan
- Keep commits atomic and well-described
- Update plan if scope changes significantly

### Summarizing

- Write summaries while context is fresh
- Be honest about what worked/didn't work
- Document trade-offs and alternatives considered
- Link to relevant commits and PRs
- Note future work and tech debt
- **Commit the summary to git immediately after creation**

### Archiving

- Archive regularly to keep context clean
- Organize archives by date or milestone
- Maintain searchable structure
- Don't delete - archives are knowledge base
- **Commit archive changes to git immediately after archiving**

---

## Context Management

### Where to put context (monorepo vs single-repo)

- **Single-repo:** One `context/` at project root; all plans, summaries, and archives live there.
- **Monorepo:** Use root `context/` for repo-wide work; use each project’s `context/` for work scoped to that app or package. Choose the context directory that matches the scope of the current task.

### Active Context (`context/context.md`)

Keep this file lean and focused:

- Current task summary
- Active plans (links only)
- Temporary findings
- Session state

**Git tracking:** Commit updates to `context.md` when starting new work or completing phases to preserve workflow state history.

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

## Tips for Success

1. **Start small** - Use PARA for one task to learn the workflow
2. **Use `/check`** - When unsure if you need PARA, ask
3. **Keep plans focused** - One task per plan
4. **Write summaries promptly** - Don't wait, context fades fast
5. **Archive regularly** - Keep active context manageable
6. **Reference archives** - They're your project knowledge base
7. **Adapt the workflow** - PARA is a framework, not a prison

---

## Philosophy

PARA-Programming is built on these principles:

- **Planning reduces rework** - Think before you code
- **Documentation compounds** - Future you will thank present you
- **Context is currency** - Preserve it, don't lose it
- **Async-first** - Enable handoffs and resumption
- **Human-AI collaboration** - Structure helps both humans and AI work better

---

## Getting Help

- Run `/help` in any project for comprehensive guide
- Run `/check <task>` to decide if you need PARA
- Run `/status` to see where you are in the workflow
- See `CLAUDE.md` in your project for project-specific context

---

**Remember:** PARA is a tool to help you work better with AI, not a bureaucratic requirement. Use it when it adds value, skip it when it doesn't.
