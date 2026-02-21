# Agentic — AI Development Skills Collection

A curated collection of 20 specialized skills for AI-assisted software development using Claude Code and Cursor. Each skill provides structured workflows and protocols for a different aspect of the development lifecycle, built on the **PARA methodology** (Plan → Review → Execute → Summarize → Archive).

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash

# In your project
/init        # Initialize PARA structure
/help        # See available skills
```

See [INSTALL.md](INSTALL.md) for custom paths, Cursor setup, manual installation, and prerequisites.

## Skills

### Workflow & Planning

| Skill | Command | Purpose |
|-------|---------|---------|
| **para** | `/plan`, `/execute`, `/summarize`, `/archive` | PARA methodology — structured planning through archival |
| **workflow** | `/workflow` | Complete 8-phase dev workflow from plan to GitHub PR |
| **developer** | `/dev` | TDD implementation with Red-Green-Refactor cycle |
| **architect** | `/architect` | Technical specifications and design documents |
| **rlm** | `/rlm` | Map-reduce pattern for large codebases (100+ files) |

### Development

| Skill | Command | Purpose |
|-------|---------|---------|
| **testing** | `/test` | Write and run tests (unit, integration, e2e, a11y, i18n) |
| **debugging** | `/debug` | Reproduce, diagnose, and fix bugs using TDD |
| **refactoring** | `/refactor` | Safe structural changes without behavior modification |
| **dependencies** | `/deps` | Manage, upgrade, and audit dependencies |
| **performance** | `/perf` | Profile, benchmark, and optimize |

### Quality & Review

| Skill | Command | Purpose |
|-------|---------|---------|
| **code-reviewer** | `/review` | Review for correctness, readability, maintainability |
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

## How It Works

### PARA Workflow

Use PARA for any task that results in git changes. Skip it for read-only queries, code navigation, and quick typo fixes.

```
/check "add auth"   →  Decides if PARA is needed
/plan "add auth"    →  Creates context/plans/2026-02-21-add-auth.md
                    →  Review and approve the plan
/execute            →  Implement with progress tracking
/summarize          →  Document outcomes in context/summaries/
/archive            →  Move completed work to context/archives/
```

### 8-Phase Workflow

The `/workflow` command orchestrates the full development cycle:

| Phase | What Happens | Handler |
|-------|-------------|---------|
| 1. Plan | Create implementation plan | Orchestrator |
| 2. Branch | Set up git worktree | Orchestrator |
| 3. Execute | Implement changes | Orchestrator |
| 4. Test | Auto-detect language, run tests, retry with backoff | **Phase agent** |
| 5. Validate | Format, lint, build, test, code review, security | **Phase agent** |
| 6. Commit | Commit and push | Orchestrator |
| 7. PR | Create GitHub PR, link Jira | **Phase agent** |
| 8. Monitor | CI checks and summarize | Orchestrator |

Phase agents are autonomous background workers with structured JSON I/O, exponential retry logic, and user escalation after max retries. See `skills/agents/` for specs.

### MCP Integration

Configure external service integrations with `/setup`:

- **Atlassian** — Jira and Confluence (used in planning and PR phases)
- **Datadog** — Logs, metrics, monitors, traces (used in debugging and CI/CD)
- **Playwright** — Browser automation for UI/E2E testing (mandatory for UI work)

## Prerequisites

- **Python 3.10+** — RLM engine, validation scripts, skill-creator
- **Node.js** — MCP server setup
- **Git** — Branch management and worktrees
- **GitHub CLI (`gh`)** — PR creation in workflow Phase 7

## Project Structure

```
skills/              # 20 specialized skills (each has SKILL.md + optional reference/)
  agents/            # 3 autonomous phase agents (testing, validation, PR)
context/             # PARA artifacts — plans, summaries, archives (git-ignored)
tests/               # 348 tests (scenario, structural, agent protocol, E2E)
.github/workflows/   # CI pipeline (5 quality checks)
```

Each skill follows **progressive disclosure**: SKILL.md stays under 500 lines with an overview and core protocol; detailed content lives in reference files loaded on demand.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Quick version:

```bash
git clone https://github.com/micaelmalta/agentic.git && cd agentic
pip install -r requirements-dev.txt
pytest tests/ --ignore=tests/e2e/     # Verify setup
```

New skills need: YAML frontmatter (`name`, `description`, `triggers`), a protocol section, a cross-skill integration table, and passing CI checks.

## License

MIT
