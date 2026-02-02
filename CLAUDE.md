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
- **workflow** - Complete development workflow from planning to GitHub PR
- **rlm** - Recursive Language Model for large codebases (100+ files)
- **architect** - Technical specifications and design documents
- **testing** - Test design and execution (unit, integration, e2e, a11y, i18n)
- **code-reviewer** - Code review for correctness, readability, maintainability
- **security-reviewer** - Security auditing and vulnerability detection
- **documentation** - README, API docs, ADRs, runbooks
- **git-commits** - Commit messages, changelogs, release notes
- **refactoring** - Safe structural changes without behavior modification
- **debugging** - Bug reproduction, diagnosis, and fixing
- **dependencies** - Dependency management and conflict resolution
- **performance** - Profiling and optimization
- **ci-cd** - CI/CD pipeline configuration and fixes
- **setup** - MCP server configuration (Atlassian, Datadog)

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

**Phase: Validation**
```
Task(general-purpose, "Run code-reviewer...")
Task(general-purpose, "Run security-reviewer...")
Task(Bash, "Run test suite: npm test")
Task(Bash, "Run linter and build...")
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

Config locations:
- Cursor: `~/.cursor/mcp.json`
- Claude Code: `~/.claude.json`
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Usage in Skills

- **workflow** - Jira/Confluence in plan and PR phases
- **ci-cd** - Datadog for monitoring/observability
- **debugging** - Datadog logs/traces
- **documentation** - Confluence for docs

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
2. Follow 8-phase protocol:
   - Plan → Branch → Execute → Testing → Validation → Commit → PR → Monitor

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
- Commands: `/plan`, `/execute`, `/test`, `/review`, `/security`, `/commit`, etc.
- Natural language triggers: "add tests", "code review", "fix this bug"
- Explicit requests: "use the testing skill"

The skill system provides specialized knowledge and structured approaches for each development activity.
