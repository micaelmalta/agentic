# Driver's Seat: Design Ownership Protocol

This document defines how the workflow keeps humans in control of what gets built, shipped, and operated — without sacrificing the speed of AI-assisted development.

## The Problem

After Phase 1 plan approval, Phases 2-8 run autonomously. The AI drives and navigates alone, then hands you a finished PR you weren't present for. You approved *what* to build, but not *how* it was built. You can end up committing code you don't fully understand.

Staying in the driver's seat means being able to answer these questions at any point:

1. **How are we building it, and do we know what we built?**
2. **How will we support it?**
3. **How will we operate it?**
4. **How will we sell it?**
5. **How will we measure its impact?**
6. **How will we monitor and alert on it?**

---

## The Principle: Own the Boundaries, Delegate the Interior

Adding review gates to watch AI write code is the wrong instinct. It fights the speed benefit with friction and turns you into an auditor instead of an owner.

The driver's seat is not about seeing every line of code. It's about making the decisions that matter so the rest is constrained to follow.

This is the same model that works in engineering teams: a lead doesn't review every line their team writes. They own the architecture, define the interfaces, specify the expected behaviors, and trust the implementation within those boundaries.

**The responsibility split:**

| Requires Judgment (Human) | Requires Effort (AI) |
|---|---|
| Architecture and module boundaries | File creation, boilerplate |
| Interface and type definitions | Implementation within interfaces |
| Test scenarios and edge cases | Writing the actual test code |
| Error handling strategy | Wiring up error handlers |
| Security model decisions | Applying the model consistently |
| What to build and why | How to build it mechanically |

Control comes from **what you define up front**, not from **what you review after the fact**.

---

## Part 1: Deep Phase 1 — Design Before Code

The primary control mechanism is a Phase 1 plan detailed enough to constrain implementation. When the plan defines interfaces, test scenarios, error strategies, and module boundaries, Phase 3 becomes mechanical translation — there are few decisions left for the AI to make autonomously.

### What a Constraining Plan Looks Like

**Shallow plan (current — leaves too many decisions to Phase 3):**

```markdown
## Approach
Build password reset with token-based approach.

## Files to modify
- src/auth/ (new reset module)
- src/routes/auth.ts (new endpoint)
- migrations/ (new table)

## Testing strategy
Unit tests for reset service. Integration test for the endpoint.
```

With this plan, the AI makes dozens of implementation decisions you never approved: interface shape, token format, error handling, rate limiting strategy, module structure. You discover these decisions in the diff — after the fact.

**Constraining plan (design ownership — minimizes autonomous decisions):**

```markdown
## Module Structure

New module: src/auth/reset/
  - service.ts    — ResetService (business logic)
  - repository.ts — TokenRepository (data access)
  - routes.ts     — HTTP handlers
  - types.ts      — Shared types

## Interface Definitions

ResetService:
  - requestReset(email: string): Promise<ResetResult>
  - validateToken(token: string): Promise<User | null>
  - resetPassword(token: string, newPassword: string): Promise<ResetResult>

ResetResult: { status: 'sent' | 'not_found' | 'expired' | 'invalid_password' | 'rate_limited' }

TokenRepository:
  - save(token: ResetToken): Promise<void>
  - findByHash(hash: string): Promise<ResetToken | null>
  - deleteByUserId(userId: string): Promise<void>

## Key Design Decisions

- Token: 32-byte crypto random, SHA-256 hashed before storage, 24hr TTL
- Rate limit: 3 requests per email per hour, return 'rate_limited' status (not HTTP 429 at service level — let the route handler map to 429)
- Security: Never leak whether an email exists. requestReset returns 'sent' even for unknown emails.
- Error strategy: Return typed ResetResult, never throw for expected cases. Throw only for infrastructure failures.

## Test Scenarios

1. Given a registered email, when requestReset is called, then a hashed token is stored and an email is sent
2. Given an unregistered email, when requestReset is called, then no token is created, no email is sent, but 'sent' is still returned (no user enumeration)
3. Given a valid token within TTL, when validateToken is called, then the associated user is returned
4. Given an expired token, when validateToken is called, then null is returned and the token is deleted
5. Given a valid token and a strong password, when resetPassword is called, then the password is updated and the token is deleted
6. Given a valid token and a weak password, when resetPassword is called, then 'invalid_password' is returned and nothing changes
7. Given 3 reset requests in the past hour, when a 4th is attempted, then 'rate_limited' is returned

## Migration

Table: password_reset_tokens
  - id: UUID PK
  - user_id: UUID FK → users.id (indexed)
  - token_hash: VARCHAR(64) (unique index)
  - expires_at: TIMESTAMP
  - created_at: TIMESTAMP
```

With this plan, the AI's job is to translate your design into code. You understand everything that gets built because **you designed it**. The diff review becomes a formality — you're verifying translation accuracy, not discovering decisions.

### Plan Depth Checklist

Before approving a plan, verify it constrains implementation:

```
DESIGN OWNERSHIP CHECKLIST:
[ ] Module boundaries defined (what goes where)
[ ] Interfaces/types specified (function signatures, data shapes)
[ ] Key design decisions documented (token format, error strategy, security model)
[ ] Test scenarios specified (Given/When/Then for each behavior)
[ ] Edge cases and error handling strategy defined
[ ] Migration/schema defined (if applicable)
```

If the plan leaves significant design decisions to the AI, it's too shallow. Push the decision-making into the plan before approving.

---

## Part 2: Readiness Requirements

Design ownership controls the implementation. Readiness requirements ensure you've thought through everything *around* the implementation before writing code — support, operations, impact, monitoring.

These sections must be present in the Phase 1 plan. Depth scales with scope, but they cannot be omitted.

### 1. How will we support it?

```
## Support

- Troubleshooting: [what to check when things go wrong]
- Known limitations: [what this doesn't handle]
- User-facing docs: [what needs updating — help docs, FAQ, tooltips]
- Escalation: [who to contact beyond the troubleshooting guide]
```

**Go deeper for:** User-facing features, new integrations, behavior changes.
**Keep light for:** Internal tooling, refactors with no behavior change.

### 2. How will we operate it?

```
## Operations

- Failure modes: [what can go wrong, how the system behaves]
- Recovery: [how to recover from each failure mode]
- Rollback: [how to revert safely]
- Runbook: [what operational docs need updating]
```

**Go deeper for:** New services, infrastructure changes, data migrations.
**Keep light for:** Feature additions to existing stable services.

### 3. How will we sell it?

```
## Release Communication

- Changelog entry: [one-line description for release notes]
- Who needs to know: [product, marketing, support, customers]
- Announcement: [yes/no, and where — blog, email, in-app]
```

**Go deeper for:** New features, breaking changes, pricing-related changes.
**Keep light for:** Bug fixes, performance improvements, internal changes.

### 4. How will we measure its impact?

```
## Success Metrics

- Primary metric: [what number tells us this worked]
- Baseline: [current value]
- Target: [expected value after rollout]
- How to measure: [dashboard, query, tool]
- When to check: [1 day, 1 week, 1 month]
```

**Go deeper for:** New features, optimization work, anything with a business case.
**Keep light for:** Bug fixes (metric = bug gone), refactors (metric = no regression).

### 5. How will we monitor and alert on it?

```
## Monitoring & Alerting

- Metrics: [latency, error rate, throughput, etc.]
- Dashboards: [which to update or create]
- Alerts: [conditions, thresholds, who gets paged]
- Log queries: [key searches for debugging]
```

**Go deeper for:** New services, new integrations, critical path changes.
**Keep light for:** Non-critical code with existing monitoring.

### Readiness Checklist

```
READINESS CHECKLIST:
[ ] Support plan documented (or N/A with reason)
[ ] Operations plan documented (or N/A with reason)
[ ] Release communication documented (or N/A with reason)
[ ] Success metrics defined (or N/A with reason)
[ ] Monitoring & alerting defined (or N/A with reason)
```

Sections can be marked N/A with a brief reason (e.g., "N/A — internal refactor, no behavior change"). The point is to force the question, not generate paperwork.

---

## Part 3: The Diff Review Gate

Even with deep design ownership, a diff review before commit serves as a safety net. It catches scope violations, not design decisions.

This gate applies between Phase 5 (validation) and Phase 6 (commit), regardless of plan depth.

**What the workflow presents:**

```
── Diff Review ──────────────────────────────────

Files changed:
  src/auth/reset/service.ts       (+62 lines)
  src/auth/reset/repository.ts    (+34 lines)
  src/auth/reset/routes.ts        (+28 lines)
  src/auth/reset/types.ts         (+12 lines)
  src/auth/reset/service.test.ts  (+140 lines)
  migrations/003_reset_tokens.sql (+18 lines)

New dependencies: none
Deviations from plan: none
Test coverage: 7/7 planned scenarios covered

→ approve / see specific file / request changes
```

**What to look for:**

- **Unexpected files** — touches something outside the plan's module boundaries
- **Unexpected scale** — significantly more or fewer lines than the design implies
- **New dependencies** — packages or services not in the plan
- **Missing coverage** — fewer test scenarios than specified
- **Plan deviations** — any structural departure from the approved design

When the plan is deep enough, this review is fast. You're checking translation accuracy, not reverse-engineering intent.

---

## Part 4: When You Can't Design Up Front

There's one case where deep Phase 1 design isn't possible: **when you don't know enough yet**. Unfamiliar codebase, unclear requirements, exploratory work.

For these cases, use **collaborative design** — work with the AI interactively to discover the right design before committing to implementation.

### Collaborative Design Protocol

```
1. AI explores the codebase and presents findings:
   - Existing patterns, relevant modules, dependencies
   - Constraints discovered (tech debt, API limitations, etc.)

2. Together, iterate on the design:
   - AI proposes interface options → you choose
   - AI identifies edge cases → you decide handling strategy
   - AI suggests module boundaries → you approve or adjust

3. Once the design is solid, write it into the plan:
   - Interfaces, types, test scenarios, module structure
   - Now you're back to the standard deep Phase 1

4. Implementation runs autonomously within the agreed design
```

The goal isn't to watch the AI code. It's to reach a point where you've made all the judgment calls and the remaining work is mechanical. Collaborative design is the path to get there when you can't start with a full design.

### When to Use Collaborative Design

| Signal | Approach |
|--------|----------|
| You know the domain and patterns | Deep Phase 1 directly |
| You know the domain but not the codebase | AI explores, you design based on findings |
| You don't know the domain well | Collaborative design — iterate together |
| Pure exploration / spike | Skip workflow, use ad-hoc exploration first |

---

## Integration with Workflow Phases

| Phase | Change |
|-------|--------|
| **Phase 1 (Plan)** | Plan must meet Design Ownership Checklist and Readiness Checklist before approval. Collaborative design used when needed. |
| **Phase 3 (Execute)** | No structural change. Implementation is more constrained because the plan is deeper. |
| **Phase 5→6 (Diff Review Gate)** | New gate. Present diff summary and wait for human approval before commit. |
| **All other phases** | No changes. |

---

## Summary

The driver's seat is not a review process. It's a design ownership model.

| Question | Mechanism | When |
|----------|-----------|------|
| How are we building it? | Deep plan with interfaces, types, module boundaries | Phase 1, before any code |
| Do we know what we built? | You designed it — the code is a translation of your design. Diff review verifies. | Phase 1 (design) + Phase 5→6 (verify) |
| How will we support it? | Support plan in Phase 1 | Before any code |
| How will we operate it? | Operations plan in Phase 1 | Before any code |
| How will we sell it? | Release communication in Phase 1 | Before any code |
| How will we measure impact? | Success metrics in Phase 1 | Before any code |
| How will we monitor it? | Monitoring & alerting plan in Phase 1 | Before any code |

**The shift:** Move decision-making from Phase 3 (autonomous implementation) to Phase 1 (human-owned design). The deeper the plan, the less the AI decides on its own, and the more you understand what was built — because you designed it.
