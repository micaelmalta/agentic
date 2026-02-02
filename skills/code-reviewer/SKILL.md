---
name: code-reviewer
description: "Review code for correctness, readability, maintainability, accessibility, i18n, and alignment with project conventions. Use when the user asks for a code review, review this PR, review my code, or when examining diffs, pull requests, or patches."
triggers:
  - "/review"
  - "code review"
  - "review this"
  - "review my code"
  - "review this PR"
  - "review the diff"
  - "feedback on this code"
---

# Code Reviewer Skill

## Core Philosophy

**"Review for the author and the future maintainer."**

Feedback should be clear, actionable, and prioritized. Explain the "why" for non-obvious suggestions.

---

## Related Skills

Code review should work alongside these skills. **Invoke them when their domain is relevant:**

| Skill                 | When to Invoke                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **security-reviewer** | Deep security audit for auth, crypto, injection, sensitive data. Always invoke for security-critical changes. |
| **testing**           | Verify tests exist and pass. If tests are missing, **STOP** and require tests before approving.               |
| **performance**       | Profile hotspots, query patterns, algorithmic complexity. Invoke when performance is a concern.               |

**IMPORTANT:** Code review should **NOT** approve code that lacks tests. If the change has no tests, flag it as **Critical** and require tests before merge.

---

## Protocol

### 1. Scope

- Read the full diff or changed files.
- Consider context: ticket/PR description, related tests, and project structure.
- **Verify tests exist** for new/changed code. If missing, mark as Critical.

### 2. Review Dimensions

| Dimension           | Focus                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Correctness**     | Logic, edge cases, off-by-one, null/empty handling, error paths.                                                        |
| **Testing**         | ⛔ **Tests MUST exist.** New code must have tests. No tests = Critical blocker. Invoke **testing** skill if needed.     |
| **Security**        | Input validation, injection risks, sensitive data. **Invoke security-reviewer** for auth, crypto, or sensitive changes. |
| **Performance**     | N+1 queries, algorithmic complexity, memory leaks. **Invoke performance** skill for hotspots or optimization.           |
| **Readability**     | Names, structure, comments where needed, no dead or misleading code.                                                    |
| **Maintainability** | Duplication, coupling, testability, size/complexity of functions and modules.                                           |
| **Conventions**     | Style, patterns, and practices used in the rest of the project.                                                         |
| **Accessibility**   | Alt text, ARIA labels, keyboard navigation, color contrast, semantic HTML (for UI changes).                             |
| **i18n**            | No hardcoded user-facing strings, locale-aware formatting, RTL support (for UI changes).                                |
| **Migrations**      | Reversible, zero-downtime safe, data integrity preserved, tested (for database changes).                                |

### 3. Severity Levels

Format feedback with severity so the author can triage:

- **Critical** – Bug or clear correctness/security issue; should fix before merge.
- **Suggestion** – Improvement that would help readability, performance, or maintainability.
- **Nit** – Minor style or preference; optional.

### 4. Output Format

Structure the review as:

```markdown
## Summary

[1–2 sentences on what the change does and overall assessment]

## Gate Status

- [ ] Tests: [Pass/Fail/Missing] – If missing, mark Critical
- [ ] Build: [Pass/Fail/N/A]
- [ ] Security: [OK/Needs deep audit via security-reviewer]

## Critical

- [Item] – [Brief explanation and, if possible, fix or reference]
- ⛔ **No tests for [component]** – Tests are mandatory. Add tests before merge.

## Suggestions

- [Item] – [Explanation]

## Nits

- [Item]

## Positive notes (optional)

- [What was done well]

## Related Skill Invocations (if needed)

- [ ] Invoke **security-reviewer** for: [reason]
- [ ] Invoke **performance** for: [reason]
- [ ] Invoke **testing** to add tests for: [components]
```

### 5. Commands

- No special commands. Review the code the user points at (file, diff, or PR).
- If the repo has a review checklist or CONTRIBUTING.md, align with it.

### 6. When to Invoke Related Skills

| Situation                                     | Action                                                       |
| --------------------------------------------- | ------------------------------------------------------------ |
| **No tests for new code**                     | ⛔ Mark Critical. Invoke **testing** skill to add tests.     |
| **Auth, crypto, or sensitive data**           | Invoke **security-reviewer** for deep audit.                 |
| **Performance concerns (N+1, loops, memory)** | Invoke **performance** skill to profile.                     |
| **UI changes without a11y/i18n**              | Flag in review; may need **testing** for a11y tests.         |
| **Database migrations**                       | Ensure migration tests exist; invoke **testing** if missing. |

**In workflow context (Phase 5):** Code-reviewer and security-reviewer run in parallel. If issues are found, the workflow MUST stop and fix before proceeding.

---

## Checklist

**⛔ BLOCKING (must pass before approval):**

- [ ] **Tests exist** for new/changed code (invoke **testing** skill if missing)
- [ ] **No security vulnerabilities** (invoke **security-reviewer** for deep audit)
- [ ] **Build passes** (for frontend/compiled languages)

**Review quality:**

- [ ] All changed files and main code paths considered.
- [ ] Feedback is specific (file/line or snippet when helpful).
- [ ] Severity is consistent (critical vs suggestion vs nit).
- [ ] No pile-on: limit to the most important points unless asked for depth.
- [ ] Performance concerns flagged (invoke **performance** skill if needed).
- [ ] Accessibility checked for UI changes (alt text, keyboard, ARIA).
- [ ] i18n checked for UI changes (no hardcoded strings, locale formatting).
- [ ] Migration safety checked for DB changes (reversible, zero-downtime).

**⚠️ Do NOT approve code without tests. Mark as Critical and require tests first.**
