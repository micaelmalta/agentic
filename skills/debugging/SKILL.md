---
name: debugging
description: Debug failures systematically: reproduce, hypothesize, bisect, and fix. Use when the user reports a bug, asks why something fails, or wants to find the root cause.
triggers:
  - "/debug"
  - "fix this bug"
  - "why does this fail"
  - "root cause"
  - "reproduce the bug"
  - "this is broken"
  - "investigate"
---

# Debugging Skill

## Core Philosophy

**"Reproduce first; then narrow down."**

Get a reliable repro, form a hypothesis, test it, then fix. Avoid changing code until the cause is understood.

---

## Protocol

### 1. Reproduce

- **Steps**: Minimal steps to see the failure (code path, input, env).
- **Environment**: Runtime, OS, versions, config, env vars. Note if it’s intermittent.
- **Output**: Exact error message, stack trace, logs, or observable misbehavior.

If the user didn’t provide steps, ask or infer and state assumptions. If you can’t reproduce, say so and suggest what’s needed (e.g. logs, repro repo).

### 2. Hypothesize

- **Where**: Likely component, file, or function from stack trace, logs, or code flow.
- **Why**: Possible cause (wrong input, bad state, race, wrong assumption, missing check).
- **One at a time**: Test the most likely hypothesis first; use logs, asserts, or a minimal repro.

### 3. Narrow Down

- **Bisect**: If the failure is recent, narrow the change that introduced it (e.g. `git bisect`, or disable/revert changes).
- **Isolate**: Simplify input or code path (smaller test case, unit test) to confirm the cause.
- **Instrument**: Add logging or assertions to verify hypothesis; remove or reduce before final fix.

### 4. Fix and Verify

- **Fix**: Minimal change that addresses the root cause (not only the symptom).
- **Verify**: Reproduce scenario passes; run existing tests; check for regressions.
- **Document**: If the fix is non-obvious, add a short comment or test that captures the bug.

### 5. Commands

| Action                | Examples                                                                       |
| --------------------- | ------------------------------------------------------------------------------ |
| Run failing test/code | `npm test -- --grep "..."`, `pytest path::test_name`, run main with same input |
| Inspect logs/errors   | Read stack trace, stderr, log file                                             |
| Bisect history        | `git bisect start/bad/good/run`                                                |
| Search for usage      | `grep` for the failing symbol or error string                                  |

### 6. MCP (Datadog)

When the failure involves production or staged environments, use the **Datadog MCP** (after **/setup**) to search logs, inspect trace details, and query metrics. Use `search_logs`, `get_log_details`, `query_traces`, and `query_metrics` to correlate errors and narrow down the cause. Ensure **/setup** has been run so Datadog MCP is configured.

---

## Checklist

- [ ] Reproducible (steps and environment clear).
- [ ] Hypothesis tested (log/assert/bisect) before coding the fix.
- [ ] Fix targets root cause; tests or manual check confirm the bug is gone.
- [ ] No unrelated changes in the fix.
