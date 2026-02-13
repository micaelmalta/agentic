# AI Development Skills Collection

A curated collection of specialized skills for AI-assisted software development using Claude Code and Cursor. Each skill provides structured workflows, protocols, and best practices for different aspects of software engineering.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash
```

Then in your project:
```bash
/init    # Initialize PARA structure
/help    # See all available skills
```

## Overview

This repository implements the **PARA-Programming methodology** (Plan → Review → Execute → Summarize → Archive), enabling reproducible, well-documented AI-assisted development sessions. Skills cover the full development lifecycle from planning to deployment.

## Installation

### Automated Installation (Recommended)

Install all skills directly from GitHub using a single command:

```bash
# Install to Claude Code (default: ~/.claude/skills)
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash

# Or install to a custom location
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash -s -- --path /custom/path
```

**What the installer does:**
1. ✓ Verifies all prerequisites are installed
2. ✓ Checks installation directory (prompts if exists)
3. ✓ Creates necessary parent directories
4. ✓ Clones the repository from GitHub
5. ✓ Displays next steps and usage instructions

**What gets installed:**
- `~/.claude/skills/skills/` — All 18 specialized skills
- `~/.claude/skills/skills/agents/` — 3 autonomous phase agents
- `~/.claude/skills/CLAUDE.md` — AI assistant guidance
- `~/.claude/skills/README.md` — Documentation (this file)

### Manual Installation

1. **Clone the repository:**

```bash
# Clone to Claude Code skills directory
git clone https://github.com/micaelmalta/agentic.git ~/.claude/skills

# Or clone to a custom location
git clone https://github.com/micaelmalta/agentic.git /path/to/skills
```

2. **Verify prerequisites:**

```bash
# Check Python version (required for RLM, skill-creator, validation scripts)
python3 --version  # Should be 3.10 or higher

# Check Node.js (required for MCP setup)
node --version

# Check Git (required for all version control)
git --version

# Check GitHub CLI (required for PR creation)
gh --version
```

If any prerequisites are missing:
- **Python 3.10+**: [python.org/downloads](https://www.python.org/downloads/)
- **Node.js**: [nodejs.org](https://nodejs.org/)
- **GitHub CLI**: `brew install gh` (macOS) or [cli.github.com](https://cli.github.com)

3. **Initialize PARA in your project:**

```bash
cd /your/project
# From Claude Code, run:
/init
```

### Installation for Cursor

If you're using Cursor instead of Claude Code:

```bash
# Clone to Cursor configuration directory
git clone https://github.com/micaelmalta/agentic.git ~/.cursor/skills

# Or create a symlink from existing installation
ln -s ~/.claude/skills ~/.cursor/skills
```

### Updating Skills

Keep your skills up to date:

```bash
# Navigate to skills directory
cd ~/.claude/skills

# Pull latest changes
git pull origin main

# Or re-run automated installation
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash
```

### Verifying Installation

After installation, verify that skills are available:

1. **Check skills directory:**
```bash
ls -la ~/.claude/skills/skills/
```

2. **In Claude Code or Cursor, test a skill:**
```bash
/help
# You should see all available skills listed
```

3. **Initialize PARA in a test project:**
```bash
cd /path/to/test-project
/init
# Should create context/ directory structure
```

### Uninstallation

To remove the skills:

```bash
# Remove skills directory
rm -rf ~/.claude/skills

# Or for custom installation path
rm -rf /path/to/custom/location

# Clean up PARA structures in projects (optional)
# In each project directory:
rm -rf context/
```

**Note:** Uninstalling does not affect your project's git history or code. Only the skills and PARA context structures are removed.

## Quick Start

### 1. Initialize PARA Structure

```bash
# In your project directory
/init
```

This creates the `context/` directory structure for plans, summaries, and archives.

### 2. Start a New Task

```bash
# Check if you need PARA workflow
/check "add user authentication"

# Create a plan
/plan "add user authentication"

# Execute the plan
/execute

# Summarize when complete
/summarize

# Archive the work
/archive
```

### 3. Configure MCP Servers (Optional)

For Jira, Confluence, and Datadog integration:

```bash
/setup
```

## Core Skills

### Workflow & Planning

| Skill | Command | Purpose |
|-------|---------|---------|
| **para** | `/plan`, `/execute`, `/summarize`, `/archive` | PARA methodology implementation |
| **workflow** | `/workflow` | Complete dev workflow from plan to GitHub PR |
| **developer** | `/dev` | TDD implementation (Red-Green-Refactor cycle) |
| **rlm** | `/rlm` | Handle large codebases (100+ files) with map-reduce |
| **architect** | `/architect` | Technical specifications and design documents |

### Development

| Skill | Command | Purpose |
|-------|---------|---------|
| **testing** | `/test` | Write and run tests (unit, integration, e2e, a11y, i18n) |
| **debugging** | `/debug` | Reproduce, diagnose, and fix bugs (TDD-based) |
| **refactoring** | `/refactor` | Safe structural changes without behavior modification |
| **dependencies** | `/deps` | Manage, upgrade, and audit dependencies |
| **performance** | `/perf` | Profile, benchmark, and optimize performance |

### Quality & Review

| Skill | Command | Purpose |
|-------|---------|---------|
| **code-reviewer** | `/review` | Review for correctness, readability, and maintainability |
| **security-reviewer** | `/security` | Security auditing and vulnerability detection |

### Documentation & Git

| Skill | Command | Purpose |
|-------|---------|---------|
| **documentation** | `/docs` | README, API docs, ADRs, runbooks |
| **git-commits** | `/commit` | Commit messages, changelogs, release notes |

### Infrastructure & Extensibility

| Skill | Command | Purpose |
|-------|---------|---------|
| **ci-cd** | `/ci` | CI/CD pipeline configuration and fixes |
| **setup** | `/setup` | Configure MCP servers (Atlassian, Datadog, Playwright) |
| **skill-creator** | — | Guide for creating new skills |
| **mcp-builder** | — | Guide for building MCP servers |

## Prerequisites

- **Python 3.10+** — Required for RLM (`skills/rlm/rlm.py`), skill-creator scripts, validation scripts, and MCP builder evaluation
- **Node.js** — Required for `skills/setup/setup_mcp.js` (MCP server configuration)
- **GitHub CLI (`gh`)** — Required for PR creation in workflow Phase 7
- **Git** — Required for branch management, commits, and version control operations

## Phase Agent System

The workflow skill uses a **hybrid architecture** combining direct orchestration and autonomous background agents:

| Phase | Handler | Mode |
|-------|---------|------|
| 1-3 | Orchestrator (planning, branching, implementing) | Direct |
| 4 | **phase-testing-agent** — auto-detect language, run tests, retry with backoff | Background |
| 5 | **phase-validation-agent** — 6 checks (format, lint, build, test, code review, security) | Background |
| 6 | Orchestrator (commit & push) | Direct |
| 7 | **phase-pr-agent** — create GitHub PR, link Jira (optional) | Background |
| 8 | Orchestrator (monitor & summarize) | Direct |

Phase agents have structured JSON I/O, exponential retry logic, and escalate to the user after max retries. See `skills/agents/` for full specs.

## PARA Methodology

### When to Use PARA

✅ **Use PARA for:**
- Adding features or functionality
- Fixing complex bugs
- Refactoring code
- Architecture changes
- Any task resulting in git changes

❌ **Skip PARA for:**
- Simple queries ("What does X do?")
- Code navigation ("Show me Y")
- Quick typo fixes
- Read-only informational tasks

### The PARA Workflow

```
1. Plan     → Create detailed implementation plan
2. Review   → Validate approach with stakeholders
3. Execute  → Implement with progress tracking
4. Summarize → Document outcomes and learnings
5. Archive  → Preserve context for future reference
```

### Decision Helper

Not sure if you need PARA? Use the decision helper:

```bash
/check "your task description"
```

## Directory Structure

```
├── skills/                    # Specialized agent skills
│   ├── para/                 # PARA methodology
│   ├── workflow/             # Complete development workflow
│   ├── rlm/                  # Recursive Language Model (large codebases)
│   ├── architect/            # Technical specifications
│   ├── testing/              # Test design and execution
│   ├── code-reviewer/        # Code review
│   ├── security-reviewer/    # Security auditing
│   ├── documentation/        # Documentation generation
│   ├── git-commits/          # Git and version control
│   ├── refactoring/          # Code refactoring
│   ├── debugging/            # Bug fixing
│   ├── dependencies/         # Dependency management
│   ├── developer/            # TDD implementation (Red-Green-Refactor)
│   ├── performance/          # Performance optimization
│   ├── ci-cd/                # CI/CD pipelines
│   ├── setup/                # MCP configuration
│   ├── skill-creator/        # Skill authoring guide
│   ├── mcp-builder/          # MCP server development guide
│   └── agents/               # Autonomous phase agents (testing, validation, PR)
│
├── context/                  # Your project's PARA artifacts
│   ├── context.md           # Active session state
│   ├── plans/               # Implementation plans
│   ├── summaries/           # Post-work documentation
│   ├── archives/            # Historical context
│   ├── data/                # Test data and fixtures
│   └── servers/             # MCP tool wrappers
│
├── CLAUDE.md                # AI assistant guidance (for Claude Code)
└── README.md                # This file (for humans)
```

## Usage Examples

### Example 1: Implement a New Feature

```bash
# 1. Create a plan
/plan "add password reset functionality"

# Claude creates context/plans/2026-02-02-password-reset.md
# Review and approve the plan

# 2. Execute with full workflow
/workflow

# Claude follows 8-phase protocol:
# - Plan → Branch → Execute → Testing → Validation → Commit → PR → Monitor

# 3. After PR merge, summarize
/summarize

# Claude creates context/summaries/2026-02-02-password-reset.md

# 4. Archive when ready
/archive

# Moves completed work to context/archives/
```

### Example 2: Review Code Changes

```bash
# Review specific files
/review src/auth/login.ts src/auth/register.ts

# Or review entire PR
/review
```

### Example 3: Security Audit

```bash
# Audit changed files for vulnerabilities
/security

# Claude checks for:
# - Injection vulnerabilities (SQL, command, XSS)
# - Authentication/authorization issues
# - Sensitive data exposure
# - Crypto misuse
```

### Example 4: Large Codebase Analysis

```bash
# For repositories with 100+ files
/rlm

# Claude uses map-reduce pattern:
# - Parallel file analysis
# - Prevents context overflow
# - Maintains reasoning quality
```

## MCP Integration

### Supported MCP Servers

- **Atlassian** (atlassian, atlassian-tech) - Jira and Confluence integration
- **Datadog** - Logs, metrics, monitors, traces
- **Playwright** - Browser automation for UI/E2E testing

### Setup MCP

```bash
/setup
```

Follow prompts to configure:
1. Choose target (Cursor, Claude Code, or both)
2. Provide API keys (stored securely in config files)
3. Restart your IDE

### Configuration Files

- **Cursor**: `~/.cursor/mcp.json`
- **Claude Code**: `~/.claude.json`
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Advanced Features

### Parallel Execution

Skills can launch multiple subagents simultaneously for efficiency:

**Exploration Phase:**
```
- Find affected files (parallel)
- Check existing patterns (parallel)
- Review git history (parallel)
```

**Validation Phase:**
```
- Code review (parallel)
- Security audit (parallel)
- Run tests (parallel)
- Run linter (parallel)
```

### RLM for Large Codebases

When working with large repositories (100+ files):

1. **Map**: Parallel file search and analysis
2. **Reduce**: Consolidate findings
3. **Implement**: Execute changes

```bash
# Use RLM skill
/rlm

# Or use RLM tools directly
python3 skills/rlm/rlm.py peek "query"
python3 skills/rlm/rlm.py chunk --pattern "*.py"
```

### Technical Design Documents

For architectural changes, use the architect skill with structured templates:

```bash
/architect

# Claude reads skills/architect/tech_proposal_template.md
# Generates structured design document with:
# - Architecture Considerations
# - API Changes
# - Data Models
# - Implementation Plan
```

## Context Management

### Active Context (`context/context.md`)

Keep lean and current:
- Current task summary
- Links to active plans
- Temporary findings
- Session state

### Historical Context (`context/archives/`)

Searchable knowledge base:
- Completed plans and summaries
- Lessons learned
- Decision history
- Similar problems solved

## Best Practices

### Planning
- Be specific about objectives
- List all affected files
- Consider edge cases upfront
- Identify risks and unknowns

### Execution
- Create feature branches for complex work
- Reference plan during implementation
- Document deviations from plan
- Keep commits atomic

### Summarizing
- Write summaries while context is fresh
- Document what worked and what didn't
- Record trade-offs and alternatives
- Link to commits and PRs

### Archiving
- Archive regularly to keep context clean
- Organize by date or milestone
- Maintain searchable structure
- Don't delete—archives are your knowledge base

## Skill Development

### Creating a New Skill

1. Create `skills/<name>/SKILL.md`
2. Add YAML frontmatter:
```yaml
---
name: skill-name
description: What this skill does and when to use it
triggers:
  - "/command"
  - "natural language trigger"
---
```
3. Document the protocol and usage
4. Add any supporting assets in `skills/<name>/`

### Skill Structure

Each skill should define:
- **Purpose**: What problem it solves
- **When to use**: Specific scenarios
- **Protocol**: Step-by-step workflow
- **Commands**: Available commands/triggers
- **Output**: What the skill produces
- **Dependencies**: Other skills it uses

## Integration with Git

PARA-Programming complements git workflow:

```
/plan → feature branch → /execute → commits → /summarize → merge → /archive
```

- **Plans** document the "why" before commits show the "what"
- **Summaries** capture context that commit messages can't
- **Archives** preserve decision history beyond git log

## Philosophy

This skills collection is built on these principles:

1. **Planning reduces rework** - Think before you code
2. **Documentation compounds** - Future you will thank present you
3. **Context is currency** - Preserve it, don't lose it
4. **Async-first** - Enable handoffs and resumption
5. **Human-AI collaboration** - Structure helps both humans and AI work better
6. **Specialization** - Domain-specific skills provide better results

## Commands Reference

| Command | Description |
|---------|-------------|
| `/init` | Initialize PARA structure in project |
| `/plan <task>` | Create implementation plan |
| `/execute` | Start execution with tracking |
| `/summarize` | Generate post-work summary |
| `/archive` | Archive completed work |
| `/status` | Check current workflow state |
| `/check <task>` | Decide if task needs PARA |
| `/help` | Show comprehensive guide |
| `/workflow` | Run complete dev workflow |
| `/rlm` | Use RLM for large codebases |
| `/test` | Design and run tests |
| `/review` | Code review |
| `/security` | Security audit |
| `/commit` | Generate commit message |
| `/docs` | Update documentation |
| `/refactor` | Safe refactoring |
| `/debug` | Debug and fix bugs |
| `/deps` | Manage dependencies |
| `/perf` | Profile and optimize |
| `/ci` | Configure CI/CD |
| `/setup` | Configure MCP servers |
| `/dev` | TDD implementation (Red-Green-Refactor) |
| `/architect` | Technical specifications and design docs |

## Troubleshooting

### Installation Issues

| Problem | Solution |
|---------|----------|
| Installation script fails | Check prerequisites: `python3 --version`, `node --version`, `git --version`, `gh --version` |
| `curl` command not found | Install curl: `brew install curl` (macOS) or use manual installation method |
| Permission denied during install | Run with `sudo` if needed, or install to user directory (default: `~/.claude/skills`) |
| Directory already exists | Installer will prompt to remove and reinstall, or manually `rm -rf ~/.claude/skills` |
| Skills not appearing in Claude | Verify installation path; check `~/.claude/skills/skills/` directory exists |

### Runtime Issues

| Problem | Solution |
|---------|----------|
| `/workflow` stuck at validation | Check phase agent output; run `skills/agents/check-agent.sh <log-dir>` to inspect |
| RLM script fails | Ensure Python 3.10+; check file encoding (UTF-8 required) |
| MCP setup fails | Run `/setup` again; verify API keys; check config file at the correct path for your IDE |
| `gh` CLI not found | Install GitHub CLI: `brew install gh` (macOS) or see [cli.github.com](https://cli.github.com) |
| Pre-commit validation fails | Run `skills/workflow/scripts/pre-commit-validation.sh` manually to see errors |
| Skill not triggering | Check YAML frontmatter `triggers` list in `skills/<name>/SKILL.md` |
| Large codebase context overflow | Use `/rlm` to enable map-reduce parallel analysis |

## Support

For issues, questions, or contributions, please refer to the individual skill documentation in `skills/*/SKILL.md`.

## License

MIT License

This project is licensed under the MIT License.

---

**Remember:** PARA is a tool to help you work better with AI, not a bureaucratic requirement. Use it when it adds value, skip it when it doesn't.
