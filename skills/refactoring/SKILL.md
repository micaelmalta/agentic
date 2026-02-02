---
name: refactoring
description: "Refactor code safely: extract, rename, simplify, and reorganize without changing behavior. Use when the user asks to refactor, extract function, rename, simplify, or clean up this code."
triggers:
  - "/refactor"
  - "refactor this"
  - "extract function"
  - "rename"
  - "simplify"
  - "clean up"
  - "reduce duplication"
  - "improve structure"
---

# Refactoring Skill

## Core Philosophy

**"Behavior stays the same; structure improves."**

Change structure and names, not observable behavior. Small steps, with tests (or quick verification) after each step.

---

## Protocol

### 1. Establish Safety

- **Tests**: If tests exist, ensure they pass before and after. Add minimal tests for critical behavior if missing.
- **Scope**: Refactor one concern at a time (e.g. one function, one type, one file). Avoid mixing refactor with new features or bug fixes in the same commit when possible.

### 2. Common Operations

| Operation                     | Approach                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| **Extract function/method**   | Identify cohesive block, extract, name by intent, replace call site(s).                  |
| **Rename**                    | Use IDE rename (symbol/identifier) so all references update; verify tests.               |
| **Move**                      | Move to the right module/class; update imports and references.                           |
| **Simplify conditionals**     | Guard clauses, early returns, replace nested conditionals with clear branches or lookup. |
| **Remove duplication**        | Extract shared logic; parameterize or abstract; avoid over-abstracting too early.        |
| **Split large function/file** | Extract by responsibility; keep public surface clear.                                    |

### 3. Order of Work

1. Understand current behavior (and tests).
2. Pick one refactor; do it; run tests (or smoke-check).
3. Commit or stage; repeat.
4. If tests are missing and refactor is risky, add a minimal test first, then refactor.

### 4. Commands

- Run tests after changes: `npm test`, `pytest`, `go test ./...`, etc., per project.
- Search for references before rename/move: `grep` or IDE "Find references".

---

## Checklist

- [ ] No intentional behavior change; only structure and names.
- [ ] Tests pass (or equivalent verification) after each logical step.
- [ ] Renames and moves are consistent (all references updated).
- [ ] Commits are focused (one refactor type or one area per commit when practical).
