---
name: documentation
description: "Write and update documentation: README, API docs, ADRs, inline docs, and runbooks. Use when the user asks to document this, update README, write API docs, write ADR, or add inline documentation."
triggers:
  - "/docs"
  - "document this"
  - "update README"
  - "write README"
  - "API docs"
  - "write ADR"
  - "architecture decision"
  - "add comments"
  - "inline docs"
  - "runbook"
---

# Documentation Skill

## Core Philosophy

**"Docs that stay in sync with code and intent."**

Write documentation that is accurate, scannable, and updated when behavior changes. Prefer living docs over one-off writeups.

---

## Protocol

### 1. Identify Type

| Type         | Use for                              | Location / format                 |
| ------------ | ------------------------------------ | --------------------------------- |
| **README**   | Project overview, setup, usage       | Root `README.md`                  |
| **API docs** | Endpoints, params, responses         | OpenAPI/Swagger, or `docs/api.md` |
| **ADR**      | Architecture decisions and rationale | `docs/adr/` or `context/adr/`     |
| **Inline**   | Public APIs, non-obvious logic       | Code comments, docstrings         |
| **Runbook**  | Operational procedures               | `docs/runbooks/` or `docs/ops/`   |

### 2. Conventions

- **README**: Quick start, prerequisites, install, run, test, contribute. Keep under ~200 lines; link to detailed docs.
- **API docs**: Method/path, request/response shape, errors, examples. Prefer OpenAPI when the project uses it.
- **ADR**: Context, decision, consequences. One file per decision; number and date in filename.
- **Inline**: Explain why, not what. Docstrings for public functions/classes; avoid noise on trivial code.
- **Runbook**: Steps, checks, rollback, contacts. Assume someone unfamiliar can follow.

### 3. Commands

No mandatory commands. Use project structure: if `docs/` or `CONTRIBUTING.md` exists, follow existing layout and style.

### 4. MCP (Atlassian Confluence)

When documentation lives in Confluence or the user wants to sync with Confluence, use the **Atlassian MCP** (after **/setup**) to fetch pages, search with CQL, and create/update content. Key tools:

- `confluence_search` - Search Confluence content using simple terms or CQL
- `confluence_get_page` - Get content of a specific page by ID or title+space
- `confluence_create_page` - Create a new page in a space (supports Markdown)
- `confluence_update_page` - Update an existing page
- `confluence_get_page_children` - Get child pages for navigation
- `confluence_get_comments` - Get comments on a page
- `confluence_add_comment` - Add a comment to a page

Ensure **/setup** has been run so Atlassian MCP is configured.

### 5. Output

When adding or updating docs, provide the content and say what was created/updated. If the project has a docs style guide, follow it.

### 6. ADR (Architecture Decision Record) Structure

When writing ADRs, follow this structure:

```markdown
# ADR-NNN: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN

## Context

[What is the issue or situation that motivates this decision?]

## Decision

[What is the decision that was made?]

## Consequences

**Positive:**
- [Benefits of this decision]

**Negative:**
- [Trade-offs and costs]

**Neutral:**
- [Other implications]
```

Number ADRs sequentially. Store in `docs/adr/` or `context/adr/`. Reference from plans and summaries when relevant.

### 7. API Versioning Documentation

When documenting APIs with versioning:

- **Document the versioning strategy** (URL path `/v1/`, header `Accept-Version`, query param).
- **Mark deprecated endpoints** clearly with sunset dates.
- **Provide migration guides** when upgrading between API versions.
- **Include changelog per version** showing what changed.

### 8. Documentation During Refactoring

When code is refactored, update affected documentation:

- **README** - Update if installation, usage, or API examples changed.
- **API docs** - Regenerate or update if endpoints/models changed.
- **Inline comments** - Remove or update stale comments; don't leave misleading docs.
- **ADR** - Write a new ADR if the refactoring represents an architectural decision.

### 9. Cross-Skill Integration

| Situation | Skill to invoke |
|-----------|----------------|
| Documenting API changes | **architect** skill (for tech spec) |
| Writing architectural decisions | Use ADR format above |
| Syncing docs to Confluence | Use **Atlassian MCP** tools (after `/setup`) |
| Code needs inline documentation | **code-reviewer** can flag gaps |

---

## Checklist

- [ ] Matches current behavior (no outdated steps or APIs).
- [ ] Scannable (headings, lists, code blocks where useful).
- [ ] Links to related docs or code when helpful.
- [ ] No duplicate info across README and other docs; cross-reference instead.
- [ ] ADRs follow standard structure (Context, Decision, Consequences).
- [ ] Deprecated APIs marked with sunset dates and migration guides.
- [ ] Documentation updated alongside code refactoring.
