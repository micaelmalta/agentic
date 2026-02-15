---
name: performance
description: "Analyze and improve performance: profile, find bottlenecks, optimize, and instrument code with observability for diagnosing performance issues (profiling, bottleneck tracing). Use when the user asks about performance, slow code, bottlenecks, profiling, optimization, or adding performance-specific observability."
triggers:
  - "/perf"
  - "performance"
  - "slow"
  - "bottleneck"
  - "profile"
  - "optimize"
  - "speed up"
  - "benchmark"
  - "add logging"
  - "add metrics"
  - "add tracing"
  - "instrument"
  - "observability"
---

# Performance Skill

## Core Philosophy

**"Measure first; optimize where it matters."**

Find real bottlenecks with profiling or benchmarks, then improve. Avoid premature or speculative optimization.

---

## Protocol

### 1. Measure

- **Profile**: Use language/runtime profilers (e.g. Node: `--inspect` / Chrome DevTools; Python: `cProfile`, `py-spy`; Go: `pprof`; Rust: `cargo flamegraph`).
- **Benchmark**: Add or run benchmarks for the hot path (e.g. `benchmark.js`, `pytest-benchmark`, `go test -bench`, `cargo bench`).
- **Baseline**: Record current metrics (time, memory, throughput) so improvements are verifiable.

### 2. Identify Bottlenecks

- **Hot spots**: Where the profiler shows most time or allocations.
- **N+1 / redundant work**: Repeated queries, duplicate computation, unnecessary allocations.
- **Algorithm/design**: Wrong data structure, O(n²) where O(n) is possible, blocking I/O on hot path.
- **I/O**: Disk, network, or DB; consider caching, batching, or async.

Focus on the top one or two bottlenecks; avoid scattering small optimizations.

### 3. Optimize

- **Algorithm/data structure**: Fix the dominant cost first.
- **Caching**: Add only where there’s measurable gain and clear invalidation.
- **I/O**: Batch, pool, async, or reduce round-trips.
- **Allocations**: Reduce in hot loops (reuse, pool, or avoid unnecessary copies) when the profiler shows pressure.

Preserve correctness and readability; add a short comment or test for non-obvious optimizations.

### 4. Verify

- Re-run profile or benchmarks; confirm improvement and no regression elsewhere.
- Run the full test suite.

### 5. Observability & Instrumentation

Add observability to understand production behavior and diagnose performance issues. Use structured logging, metrics (RED method), and tracing for distributed systems.

**For complete instrumentation guidance:** See [reference/INSTRUMENTATION.md](reference/INSTRUMENTATION.md), which covers:
- Performance-specific observability (logging, metrics, tracing)
- Instrumentation by ecosystem (Node, Python, Go, Rust)
- Profiling commands by ecosystem
- MCP Integration (Datadog) for performance diagnosis
- Best practices (log slow operations, instrument hot paths, track RED metrics)

---

## Checklist

- [ ] Bottleneck identified with data (profile or benchmark), not guess.
- [ ] Change targets the hot path or dominant cost.
- [ ] Improvement measured; tests still pass.
- [ ] Trade-offs (e.g. readability, memory) noted when relevant.
- [ ] Observability added: structured logging, key metrics, tracing for distributed calls.
- [ ] No sensitive data in logs or metrics; correlation IDs propagated.

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Performance issue in production | **Datadog MCP** | Use `query_metrics`, `search_logs`, `query_traces` (after `/setup`) |
| Optimization changes need review | **code-reviewer** skill | Read `skills/code-reviewer/SKILL.md` |
| Optimization reveals security concern | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |
| Need benchmarks in CI | **ci-cd** skill | Read `skills/ci-cd/SKILL.md` |
| Logging/tracing needs tests | **testing** skill | Read `skills/testing/SKILL.md` |
