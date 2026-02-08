# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **skills collection** for AI-assisted development (Claude Code/Cursor). Each skill provides specialized capabilities for different aspects of software development, following a structured PARA (Plan → Review → Execute → Summarize → Archive) methodology.

## Architecture

### Directory Structure

```
skills/                    # Specialized agent skills
├── <skill-name>/
│   ├── SKILL.md          # Skill definition, protocol, and usage
│   └── [assets/]         # Optional supporting files
context/                  # PARA workflow artifacts
├── context.md            # Active session state
├── plans/                # Implementation plans (YYYY-MM-DD-<task>.md)
├── summaries/            # Post-work documentation
├── archives/             # Historical context
├── data/                 # Test data, fixtures, payloads
└── servers/              # MCP tool wrappers
```

### Skill System

Each skill lives in `skills/<name>/SKILL.md` with YAML frontmatter defining:
- **name**: Skill identifier
- **description**: Purpose and when to use
- **triggers**: Commands and phrases that activate the skill

**Core Skills:**
- **para** - PARA methodology (`/plan`, `/execute`, `/summarize`, `/archive`, `/check`, `/status`, `/help`, `/init`)
- **developer** - TDD implementation (`/dev`) - write tests first, Red-Green-Refactor cycle
- **workflow** - Complete development workflow from planning to GitHub PR (`/workflow`)
- **rlm** - Recursive Language Model for large codebases (100+ files)
- **architect** - Technical specifications and design documents
- **testing** - Test design and execution (unit, integration, e2e via Playwright MCP, a11y, i18n)
- **code-reviewer** - Code review for correctness, readability, maintainability
- **security-reviewer** - Security auditing and vulnerability detection
- **documentation** - README, API docs, ADRs, runbooks
- **git-commits** - Commit messages, changelogs, release notes
- **refactoring** - Safe structural changes without behavior modification
- **debugging** - Bug reproduction with test, diagnosis, and fixing (TDD)
- **dependencies** - Dependency management and conflict resolution
- **performance** - Profiling and optimization
- **ci-cd** - CI/CD pipeline configuration and fixes
- **setup** - MCP server configuration (Atlassian, Datadog, Playwright)
- **skill-creator** - Guide for creating new skills
- **mcp-builder** - Guide for creating MCP servers

### Phase Agent System

**Phase agents** are autonomous, encapsulated workers used by the workflow skill for specific phases. They run in background mode by default and have structured JSON input/output for programmatic integration.

**Architecture:**
```
Workflow Skill (Orchestrator)
├── Phase 1-3: Direct orchestration (planning, branching, implementing)
├── Phase 4: Testing → phase-testing-agent (background)
├── Phase 5: Validation → phase-validation-agent (background)
├── Phase 6: Commit & Push (direct orchestration)
├── Phase 7: PR Creation → phase-pr-agent (background)
└── Phase 8: Monitor & Summarize (direct orchestration)
```

**Phase Agents:**

1. **phase-testing-agent** (`skills/agents/phase-testing-agent/`)
   - Auto-detects language (JS/TS, Python, Go, Rust, Ruby, Java)
   - Runs tests with build step if needed
   - Retry logic: 5s, 10s, 15s backoff (max 3 attempts)
   - Returns structured JSON with failing test details
   - User escalation after max retries

2. **phase-validation-agent** (`skills/agents/phase-validation-agent/`)
   - Runs 6 checks: formatter, linter, build, tests, code-reviewer, security-reviewer
   - Auto-fixes format/lint issues with retry
   - **Critical security handling:** Stops immediately on vulnerabilities
   - Returns consolidated JSON with all check results
   - Language-specific command mapping

3. **phase-pr-agent** (`skills/agents/phase-pr-agent/`)
   - Creates GitHub draft PR via `gh` CLI
   - Automatic Jira integration (links PR, transitions to "In Code Review")
   - Graceful degradation if Atlassian MCP not configured
   - Fuzzy matching for Jira transition names
   - Optional immediate mark-ready parameter

**Key Characteristics:**
- **Background Execution:** Non-blocking by default using Task tool
- **Auto-Detection:** Language, test commands, build requirements
- **Retry Logic:** Exponential backoff for recoverable errors
- **User Escalation:** AskUserQuestion when stuck after retries
- **Structured I/O:** JSON schemas in `protocol.md` files
- **Graceful Degradation:** Continue with partial success (e.g., PR without Jira)

**Agent vs Skill:**
- **Skills:** Interactive, conversation-based, flexible workflows
- **Agents:** Autonomous, structured I/O, encapsulated logic, background mode
- **Usage:** Workflow orchestrates overall flow, agents execute specific phases

**Documentation:**
- Agent specs: `skills/agents/<agent-name>/AGENT.md`
- I/O protocols: `skills/agents/<agent-name>/protocol.md`
- Agent system: `skills/agents/README.md`
- Template: `skills/agents/AGENT_TEMPLATE.md`

## Prerequisites

- **Python 3.10+** — Required for `skills/rlm/rlm.py`, skill-creator scripts (`init_skill.py`, `package_skill.py`, `quick_validate.py`), validation scripts (`validate-input.py`), and MCP builder evaluation (`evaluation.py`)
- **Node.js** — Required for `skills/setup/setup_mcp.js`
- **GitHub CLI (`gh`)** — Required for Phase 7 (PR creation) in workflow skill
- **Git** — Required for branch management, commits, and all version control operations

## Workflow Methodology

### PARA-Programming

**Use PARA for tasks that result in git changes:**
1. **Plan** (`/plan`) - Create detailed implementation plan before coding
2. **Review** - Validate and approve plan with user
3. **Execute** (`/execute`) - Implement with progress tracking
4. **Summarize** (`/summarize`) - Document outcomes and learnings
5. **Archive** (`/archive`) - Preserve completed work for future reference

**Skip PARA for:**
- Read-only queries ("What does X do?")
- Code navigation ("Show me Y")
- Explanations ("How does Z work?")
- Quick fixes (typos)

### Decision Helper

- Run `/check <task>` to determine if a task needs PARA workflow
- Run `/status` to see current workflow state

### Large Codebase Handling

For codebases with **100+ files** or complex cross-file analysis:
- Use **RLM skill** (`/rlm`) for map-reduce pattern
- Spawns parallel subagents to analyze different code sections
- Prevents context overflow and maintains reasoning quality
- Tools: `python3 skills/rlm/rlm.py peek|chunk`

## Skill Usage Patterns

### When Writing Plans (architect + tech_proposal_template.md)

For features or architectural changes:
1. Read `skills/architect/SKILL.md`
2. Read `skills/architect/tech_proposal_template.md`
3. Structure plan using template sections:
   - Metadata, Architecture Considerations, API Changes
   - Data Models, Domain Architecture, Implementation Plan

### Parallel Execution

Launch **independent subagents in parallel** for efficiency:

**Phase: Exploration**
```
Task(Explore, "Find affected files...")
Task(Explore, "Check existing patterns...")
Task(Bash, "Review git history...")
```

**Phase: Validation (via phase-validation-agent)**
```
# Phase agents handle parallel execution internally
# Workflow spawns single agent that runs all validations
Task(
  general-purpose,
  "Read skills/agents/phase-validation-agent/AGENT.md and execute with input: {...}"
)
```

**Sequential Skills** (DO NOT parallelize):
- debugging (investigation → fix)
- refactoring (understand → change)
- dependencies (analyze → resolve)
- performance (profile → optimize)
- git-commits (changes complete → commit)

## MCP Integration

### Setup (`/setup`)

Configure MCP servers for Claude Code or Cursor:
- **Atlassian** (atlassian, atlassian-tech) - Jira, Confluence
- **Datadog** - Logs, metrics, monitors, traces
- **Playwright** - Browser automation for UI testing (MANDATORY for UI)

Config locations:
- Cursor: `~/.cursor/mcp.json`
- Claude Code: `~/.claude.json`
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Usage in Skills

- **workflow** - Jira/Confluence in plan and PR phases
- **ci-cd** - Datadog for monitoring/observability
- **debugging** - Datadog logs/traces
- **documentation** - Confluence for docs
- **testing** - Playwright for UI/E2E testing (mandatory if UI exists)

## Common Patterns

### Starting New Work

1. Check if PARA needed: `/check <task>`
2. Create plan: `/plan <task>`
3. Review and approve plan
4. Execute: `/execute`
5. After completion: `/summarize`
6. Archive when done: `/archive`

### Large Codebase Work

1. Use RLM skill for exploration: `/rlm`
2. Parallel file analysis via map-reduce
3. Consolidate findings
4. Implement changes

### Feature Implementation

1. Read workflow skill: `skills/workflow/SKILL.md`
2. Follow 8-phase protocol with hybrid architecture:
   - Phase 1-2: Plan (para) → Branch (git)
   - Phase 3: Execute (developer skill - TDD)
   - Phase 4: Testing → **phase-testing-agent** (background)
   - Phase 5: Validation → **phase-validation-agent** (background)
   - Phase 6: Commit & Push (git-commits skill)
   - Phase 7: PR Creation → **phase-pr-agent** (background)
   - Phase 8: Monitor & Summarize (para)

### Code Review

1. Read code-reviewer skill: `skills/code-reviewer/SKILL.md`
2. Review for: correctness, readability, maintainability, conventions
3. Check accessibility (a11y) and i18n if applicable

### Security Audit

1. Read security-reviewer skill: `skills/security-reviewer/SKILL.md`
2. Check for: injection, XSS, auth issues, sensitive data exposure, crypto

## Context Management

### Active Context (`context/context.md`)

Keep lean and focused:
- Current task summary
- Links to active plans
- Temporary findings
- Session state

### Historical Context (`context/archives/`)

Searchable knowledge base:
- Completed plans and summaries
- Lessons learned
- Similar problems solved
- Decision evolution

## Key Principles

1. **Plan before coding** - PARA workflow prevents rework
2. **Use specialized skills** - Read and follow skill protocols
3. **Parallelize when possible** - Launch independent subagents simultaneously
4. **Document decisions** - Context compounds over time
5. **Scale with RLM** - Use map-reduce for large codebases
6. **Structure technical designs** - Use tech_proposal_template.md for architecture

## Skill Invocation

When a task matches a skill's domain, **read the skill file first** and follow its protocol. Skills are invoked via:
- Commands: `/plan`, `/execute`, `/dev`, `/test`, `/review`, `/security`, `/commit`, etc.
- Natural language triggers: "add tests", "code review", "fix this bug", "implement this", "TDD"
- Explicit requests: "use the testing skill", "use the developer skill"

The skill system provides specialized knowledge and structured approaches for each development activity.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Phase agent fails with retries exhausted | Check structured JSON output for `status`, error details, and `retry_count`; fix root cause and re-run agent |
| Validation agent reports critical security | Workflow stops; address the vulnerability before proceeding (never skip) |
| RLM script encoding errors | Ensure source files are UTF-8; `.venv` and `.env` dirs are auto-excluded |
| MCP server not available | Run `/setup` to configure; check API keys in config file for your IDE |
| Pre-commit validation missing | Run `skills/workflow/scripts/pre-commit-validation.sh` — it validates changed files before commit |
| Cross-skill invocation unclear | Read `skills/<target-skill>/SKILL.md`, follow its protocol, then return to calling context |
