# PARA Commands Reference

## Available Commands

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

### Archiving

- Archive regularly to keep context clean
- Organize archives by date or milestone
- Maintain searchable structure
- Don't delete - archives are knowledge base
