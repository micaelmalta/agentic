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

### 5. When NOT to Refactor

- **Low-traffic, stable code** - If no one touches it and it works, leave it alone.
- **Before understanding** - Don't refactor code you don't fully understand yet; read and test first.
- **Mixed with features/fixes** - Don't combine refactoring with behavior changes in the same commit.
- **Without tests** - If there are no tests and you can't quickly add them, the risk of silent breakage is high.
- **Under time pressure** - Refactoring under deadline pressure leads to half-done changes that are worse than the original.

### 6. Large-Scale Refactoring

For refactors spanning multiple files or modules:

1. **Map the scope** - Identify all affected files, imports, and call sites before starting.
2. **Plan the sequence** - Order changes to minimize broken intermediate states (e.g., introduce new interface first, then migrate callers, then remove old code).
3. **Feature branch** - Always use a dedicated branch for large refactors.
4. **Incremental commits** - One logical change per commit; each commit should leave tests passing.
5. **Parallel safety** - If using parallel subagents (RLM skill), ensure changes don't conflict across files.

### 7. Performance Implications

- **Measure before and after** if refactoring hot paths (use the **performance** skill for profiling).
- **Extra abstractions** add indirection — acceptable for clarity but watch for overhead in tight loops.
- **Data structure changes** (e.g., array → map) can affect performance positively or negatively; benchmark if critical.

### 8. Cross-Skill Integration

| Situation | Skill to invoke |
|-----------|----------------|
| Need tests before refactoring | **testing** skill |
| Refactoring reveals a security issue | **security-reviewer** skill |
| Refactoring changes API surface | **code-reviewer** skill |
| Refactoring affects performance-critical code | **performance** skill |

---

## Checklist

- [ ] No intentional behavior change; only structure and names.
- [ ] Tests pass (or equivalent verification) after each logical step.
- [ ] Renames and moves are consistent (all references updated).
- [ ] Commits are focused (one refactor type or one area per commit when practical).
- [ ] Large-scale refactors have a clear plan and incremental commits.
- [ ] Performance-sensitive code benchmarked before and after (if applicable).
