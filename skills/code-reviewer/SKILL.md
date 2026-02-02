---
name: code-reviewer
description: Review code for correctness, readability, maintainability, accessibility, i18n, and alignment with project conventions. Use when the user asks for a code review, review this PR, review my code, or when examining diffs, pull requests, or patches.
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

## Protocol

### 1. Scope

- Read the full diff or changed files.
- Consider context: ticket/PR description, related tests, and project structure.

### 2. Review Dimensions

| Dimension           | Focus                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Correctness**     | Logic, edge cases, off-by-one, null/empty handling, error paths.                                                           |
| **Security**        | Input validation, injection risks, sensitive data handling (only high-signal items; use security-reviewer for deep audit). |
| **Readability**     | Names, structure, comments where needed, no dead or misleading code.                                                       |
| **Maintainability** | Duplication, coupling, testability, size/complexity of functions and modules.                                              |
| **Conventions**     | Style, patterns, and practices used in the rest of the project.                                                            |
| **Accessibility**   | Alt text, ARIA labels, keyboard navigation, color contrast, semantic HTML (for UI changes).                                |
| **i18n**            | No hardcoded user-facing strings, locale-aware formatting, RTL support (for UI changes).                                   |
| **Migrations**      | Reversible, zero-downtime safe, data integrity preserved, tested (for database changes).                                   |

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

## Critical

- [Item] – [Brief explanation and, if possible, fix or reference]

## Suggestions

- [Item] – [Explanation]

## Nits

- [Item]

## Positive notes (optional)

- [What was done well]
```

### 5. Commands

- No special commands. Review the code the user points at (file, diff, or PR).
- If the repo has a review checklist or CONTRIBUTING.md, align with it.

---

## Checklist

- [ ] All changed files and main code paths considered.
- [ ] Feedback is specific (file/line or snippet when helpful).
- [ ] Severity is consistent (critical vs suggestion vs nit).
- [ ] No pile-on: limit to the most important points unless asked for depth.
- [ ] Accessibility checked for UI changes (alt text, keyboard, ARIA).
- [ ] i18n checked for UI changes (no hardcoded strings, locale formatting).
- [ ] Migration safety checked for DB changes (reversible, zero-downtime).
