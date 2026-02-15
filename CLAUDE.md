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
│   └── [reference/]      # Optional reference files
context/                  # PARA workflow artifacts (git-ignored)
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

#### Skill Reference Pattern (Progressive Disclosure)

Skills use a **reference-based structure** following Claude's best practices:
- **SKILL.md** (<500 lines): Overview, quick start, when to use, references to detailed docs
- **Reference files** (one level deep): Detailed protocols, examples, tool usage
- **Progressive disclosure**: Claude loads SKILL.md first (fast), then references as needed

**Example structure:**
```
skills/workflow/
├── SKILL.md              # Overview + references
├── PHASES.md             # Detailed 8-phase protocol
├── GATES.md              # Gate checklists and retry loops
├── MCP.md                # MCP integration details
├── TOOLS.md              # Tool usage guidelines
└── [other references...]
```

**Benefits:**
- Faster skill loading and selection
- Token-efficient (details load only when needed)
- Easier maintenance and updates
- Clear separation of overview vs details

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

**Phase agents** are autonomous workers used by the workflow skill for testing (Phase 4), validation (Phase 5), and PR creation (Phase 7). They have structured JSON I/O, retry logic, and run in background mode.

**For details:** See `skills/agents/README.md` for agent system overview and `skills/agents/<agent-name>/AGENT.md` for individual agent specifications.

## Prerequisites

- **Python 3.10+** — Required for `skills/rlm/rlm.py`, skill-creator scripts, validation scripts, and MCP builder evaluation
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

**For full PARA methodology:** See `skills/para/SKILL.md` or the global `~/.claude/CLAUDE.md`.

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

### When Writing Plans

For features or architectural changes:
1. Read `skills/architect/SKILL.md`
2. Read `skills/architect/tech_proposal_template.md`
3. Structure plan using template sections

### Parallel Execution

Launch **independent subagents in parallel** for efficiency when tasks don't depend on each other.

**For details:** See `skills/workflow/PARALLEL.md` for complete parallel execution patterns.

**Sequential Skills** (DO NOT parallelize):
- debugging (investigation → fix)
- refactoring (understand → change)
- dependencies (analyze → resolve)
- performance (profile → optimize)
- git-commits (changes complete → commit)

## MCP Integration

### Setup (`/setup`)

Configure MCP servers for Claude Code or Cursor:
- **Atlassian:atlassian** / **Atlassian:atlassian-tech** - Jira, Confluence
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

### Git Worktree Usage (Default)

All skills use **git worktree** for isolated, parallel development.

**Quick pattern:**
```bash
mkdir -p ../.worktrees
git fetch origin main
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
git worktree add ../.worktrees/${REPO_NAME}/feature-name -b feature/name origin/main
cd ../.worktrees/${REPO_NAME}/feature-name
```

**For complete worktree documentation:** See `skills/workflow/PHASES.md` (Phase 2).

### Tool Usage for File Modifications (CRITICAL)

**⛔ NEVER create temporary bash scripts for file modifications**

| Operation | Correct Tool | WRONG Approach |
|-----------|--------------|----------------|
| Modify existing file | **Edit tool** | ❌ sed, awk, bash scripts |
| Create new file | **Write tool** | ❌ echo >, cat <<EOF |
| Read file | **Read tool** | ❌ cat, head, tail |
| Search content | **Grep tool** | ❌ grep command |
| Find files | **Glob tool** | ❌ find, ls |
| Git operations | **Bash tool** | ✅ Correct |
| Run tests | **Bash tool** | ✅ Correct |
| Build commands | **Bash tool** | ✅ Correct |

**Why this matters:**
- Edit tool provides explicit, reviewable changes (old → new)
- No temporary files or artifacts left in repository
- Atomic operations with clear intent
- Prevents accidental commits of temporary scripts

**For complete tool usage guidelines:** See `skills/workflow/TOOLS.md` and `skills/developer/TOOLS.md`.

### Starting New Work

1. Check if PARA needed: `/check <task>`
2. Create plan: `/plan <task>`
3. Review and approve plan
4. Execute: `/execute` (creates worktree in Phase 2)
5. After completion: `/summarize`
6. Archive when done: `/archive`
7. Clean up worktree: `git worktree remove <path>`

### Product Proposal Validation

When starting with a **product proposal** (high-level feature description without concrete user stories):

1. Read workflow skill: `skills/workflow/SKILL.md`
2. Read product proposal validation protocol: `skills/workflow/PRODUCT_PROPOSALS.md`
3. Apply validation in Phase 1 (Plan) to generate user stories and E2E test coverage
4. Present validation output for user approval
5. Continue with standard workflow (Phase 2-8)

### Large Codebase Work

1. Use RLM skill for exploration: `/rlm`
2. Parallel file analysis via map-reduce
3. Consolidate findings
4. Implement changes

### Feature Implementation

1. Read workflow skill: `skills/workflow/SKILL.md`
2. Follow 8-phase protocol (Plan → Worktree → Execute → Test → Validate → Commit → PR → Monitor)
3. Phases 4, 5, 7 use autonomous phase agents

**For detailed phase documentation:** See `skills/workflow/PHASES.md`.

### Code Review

1. Read code-reviewer skill: `skills/code-reviewer/SKILL.md`
2. Review for: correctness, readability, maintainability, conventions
3. Check accessibility (a11y) and i18n if applicable

### Security Audit

1. Read security-reviewer skill: `skills/security-reviewer/SKILL.md`
2. Check for: injection, XSS, auth issues, sensitive data exposure, crypto

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
