---
name: performance
description: "Analyze and improve performance: profile, find bottlenecks, optimize, and instrument code with observability (logging, metrics, tracing). Use when the user asks about performance, slow code, bottlenecks, profiling, optimization, or adding observability."
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

Add observability to understand production behavior and diagnose issues:

#### Logging

| Principle           | Implementation                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Structured logs** | Use JSON format with consistent fields (`timestamp`, `level`, `message`, `context`)    |
| **Log levels**      | ERROR (failures), WARN (degraded), INFO (business events), DEBUG (troubleshooting)     |
| **Correlation IDs** | Pass request ID through all services; include in every log line                        |
| **What to log**     | Request/response summaries, errors with stack traces, business events, slow operations |
| **What NOT to log** | Secrets, PII, full payloads (unless debug), high-volume low-value events               |

```javascript
// Good: Structured, contextual
logger.info(
  { requestId, userId, action: "checkout", itemCount: 3 },
  "Checkout started"
);

// Bad: Unstructured, no context
console.log("checkout started");
```

#### Metrics

| Metric Type   | Use For                       | Examples                                               |
| ------------- | ----------------------------- | ------------------------------------------------------ |
| **Counter**   | Events that only increase     | `http_requests_total`, `errors_total`, `orders_placed` |
| **Gauge**     | Values that go up/down        | `active_connections`, `queue_depth`, `cache_size`      |
| **Histogram** | Distributions (latency, size) | `request_duration_seconds`, `response_size_bytes`      |

**Key metrics to instrument:**

- Request rate, error rate, duration (RED method)
- Saturation (queue depth, connection pool usage)
- Business metrics (signups, purchases, API calls by endpoint)

#### Tracing

For distributed systems, add tracing to follow requests across services:

| Concept                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| **Trace**               | End-to-end journey of a request                                 |
| **Span**                | Single operation within a trace (DB query, HTTP call, function) |
| **Context propagation** | Pass trace ID in headers between services                       |

**When to add spans:**

- External calls (HTTP, gRPC, DB, cache, queue)
- Significant internal operations (batch processing, complex calculations)
- Entry points (API handlers, queue consumers)

#### Instrumentation by Ecosystem

| Ecosystem | Logging                | Metrics                    | Tracing                    |
| --------- | ---------------------- | -------------------------- | -------------------------- |
| Node      | `pino`, `winston`      | `prom-client`              | `@opentelemetry/sdk-node`  |
| Python    | `structlog`, `logging` | `prometheus_client`        | `opentelemetry-sdk`        |
| Go        | `zap`, `zerolog`       | `prometheus/client_golang` | `go.opentelemetry.io/otel` |
| Rust      | `tracing`, `slog`      | `prometheus` crate         | `opentelemetry` crate      |

### 6. Commands (by ecosystem)

| Ecosystem | Profile                           | Benchmark                          |
| --------- | --------------------------------- | ---------------------------------- |
| Node      | `node --inspect`, Chrome DevTools | `benchmark`, built-in `perf_hooks` |
| Python    | `python -m cProfile`, `py-spy`    | `pytest-benchmark`, `timeit`       |
| Go        | `go test -cpuprofile`, `pprof`    | `go test -bench`                   |
| Rust      | `cargo flamegraph`, `perf`        | `cargo bench`, `criterion`         |

### 7. MCP Integration (Datadog)

When monitoring or validating instrumentation in production, use the **Datadog MCP** (after **/setup**) to inspect real metrics, logs, and traces. Key tools:

- `query_metrics` - Query time-series metrics data (e.g., latency, throughput)
- `list_metrics` - Discover available metrics in your environment
- `get_metric_metadata` - Get units, description, and tags for a metric
- `search_logs` - Search logs with filters and time ranges
- `list_monitors` - List monitors, optionally filtered by status or tags
- `get_monitor_status` - Get detailed status for a specific monitor
- `query_traces` - Query APM traces for a service
- `get_service_health` - Get latency, error rate, and throughput for a service

Ensure **/setup** has been run so Datadog MCP is configured.

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
