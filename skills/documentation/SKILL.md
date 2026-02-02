---
name: documentation
description: Write and update documentation: README, API docs, ADRs, inline docs, and runbooks. Use when the user asks to document this, update README, write API docs, write ADR, or add inline documentation.
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

When documentation lives in Confluence or the user wants to sync with Confluence, use the **Atlassian MCP** (after **/setup**) to fetch pages, search with CQL, and list spaces. Use tools such as `getConfluencePage`, `searchConfluenceUsingCql`, `getConfluenceSpaces`, and `getPagesInConfluenceSpace` to read or align with existing Confluence docs. Ensure **/setup** has been run so Atlassian MCP is configured.

### 5. Output

When adding or updating docs, provide the content and say what was created/updated. If the project has a docs style guide, follow it.

---

## Checklist

- [ ] Matches current behavior (no outdated steps or APIs).
- [ ] Scannable (headings, lists, code blocks where useful).
- [ ] Links to related docs or code when helpful.
- [ ] No duplicate info across README and other docs; cross-reference instead.
