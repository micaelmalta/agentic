# Performance Instrumentation

This document provides guidance for instrumenting code with observability for diagnosing performance issues.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

**Note:** For complete observability setup (logging, metrics, tracing), see [../../ci-cd/reference/OBSERVABILITY.md](../../ci-cd/reference/OBSERVABILITY.md). This file focuses on performance-specific instrumentation concerns.

---

## Performance-Specific Observability

Add observability to understand production behavior and diagnose performance issues.

### Logging

| Principle           | Implementation                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Structured logs** | Use JSON format with consistent fields (`timestamp`, `level`, `message`, `context`)    |
| **Log levels**      | ERROR (failures), WARN (degraded), INFO (business events), DEBUG (troubleshooting)     |
| **Correlation IDs** | Pass request ID through all services; include in every log line                        |
| **What to log**     | Request/response summaries, errors with stack traces, business events, slow operations |
| **What NOT to log** | Secrets, PII, full payloads (unless debug), high-volume low-value events               |

**Example:**
```javascript
// Good: Structured, contextual
logger.info(
  { requestId, userId, action: "checkout", itemCount: 3, duration_ms: 234 },
  "Checkout started"
);

// Bad: Unstructured, no context
console.log("checkout started");
```

### Metrics for Performance

| Metric Type   | Use For                       | Examples                                               |
| ------------- | ----------------------------- | ------------------------------------------------------ |
| **Counter**   | Events that only increase     | `http_requests_total`, `errors_total`, `orders_placed` |
| **Gauge**     | Values that go up/down        | `active_connections`, `queue_depth`, `cache_size`      |
| **Histogram** | Distributions (latency, size) | `request_duration_seconds`, `response_size_bytes`      |

**Key performance metrics to instrument:**

- Request rate, error rate, duration (RED method)
- Saturation (queue depth, connection pool usage)
- Business metrics (signups, purchases, API calls by endpoint)
- Database query duration
- Cache hit/miss rates
- Background job processing time

### Tracing for Performance Bottlenecks

For distributed systems, add tracing to identify performance bottlenecks:

| Concept                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| **Trace**               | End-to-end journey of a request                                 |
| **Span**                | Single operation within a trace (DB query, HTTP call, function) |
| **Context propagation** | Pass trace ID in headers between services                       |

**When to add spans for performance diagnosis:**

- External calls (HTTP, gRPC, DB, cache, queue) - measure network/IO time
- Significant internal operations (batch processing, complex calculations) - measure CPU time
- Entry points (API handlers, queue consumers) - measure total request time
- Database queries - identify slow queries
- Cache operations - measure cache performance

---

## Instrumentation by Ecosystem

| Ecosystem | Logging                | Metrics                    | Tracing                    |
| --------- | ---------------------- | -------------------------- | -------------------------- |
| Node      | `pino`, `winston`      | `prom-client`              | `@opentelemetry/sdk-node`  |
| Python    | `structlog`, `logging` | `prometheus_client`        | `opentelemetry-sdk`        |
| Go        | `zap`, `zerolog`       | `prometheus/client_golang` | `go.opentelemetry.io/otel` |
| Rust      | `tracing`, `slog`      | `prometheus` crate         | `opentelemetry` crate      |

---

## Profiling Commands by Ecosystem

| Ecosystem | Profile                           | Benchmark                          |
| --------- | --------------------------------- | ---------------------------------- |
| Node      | `node --inspect`, Chrome DevTools | `benchmark`, built-in `perf_hooks` |
| Python    | `python -m cProfile`, `py-spy`    | `pytest-benchmark`, `timeit`       |
| Go        | `go test -cpuprofile`, `pprof`    | `go test -bench`                   |
| Rust      | `cargo flamegraph`, `perf`        | `cargo bench`, `criterion`         |

---

## MCP Integration (Datadog)

When monitoring or validating instrumentation in production, use the **Datadog MCP** (after `/setup`) to inspect real metrics, logs, and traces.

### Key Tools for Performance Diagnosis

- `query_metrics` - Query time-series metrics data (latency, throughput, error rate)
- `list_metrics` - Discover available metrics in your environment
- `get_metric_metadata` - Get units, description, and tags for a metric
- `search_logs` - Search logs for slow operations, errors
- `list_monitors` - List monitors for performance alerts
- `get_monitor_status` - Get detailed status for latency/error monitors
- `query_traces` - Query APM traces to identify bottlenecks
- `get_service_health` - Get latency, error rate, and throughput for a service

**Ensure `/setup` has been run so Datadog MCP is configured.**

---

## Best Practices

### Do

✅ **Log slow operations with duration**
```javascript
const start = Date.now();
await processOrder(order);
const duration = Date.now() - start;
if (duration > 1000) {
  logger.warn({ orderId: order.id, duration_ms: duration }, "Slow order processing");
}
```

✅ **Instrument hot paths**
- Focus on frequently-executed code
- Measure database queries, API calls, complex calculations

✅ **Use structured logging**
- Machine-parseable (JSON)
- Include context (requestId, userId, etc.)

✅ **Track RED metrics**
- Rate (requests per second)
- Errors (error rate)
- Duration (latency percentiles: p50, p95, p99)

✅ **Add tracing to distributed systems**
- Follow requests across services
- Identify bottlenecks in microservices

### Don't

❌ **Don't log sensitive data**
- Never log passwords, API keys, tokens
- Redact PII (emails, SSNs, credit cards)

❌ **Don't over-instrument**
- Avoid logging every function call
- Focus on entry/exit points and slow operations

❌ **Don't sample critical performance logs**
- Always log slow operations (>1s)
- Always log errors and failures

❌ **Don't ignore production metrics**
- Monitor metrics in staging and production
- Alert on performance degradation

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need complete observability setup | **ci-cd** skill | See `skills/ci-cd/reference/OBSERVABILITY.md` |
| Need to profile performance | **performance** skill (this skill) | Use protocol: Measure → Identify → Optimize → Verify |
| Need to debug slow requests | **debugging** skill | Use logs, metrics, traces to investigate |
| Need to set up Datadog MCP | **setup** skill | Run `/setup`, configure Datadog with API keys |
