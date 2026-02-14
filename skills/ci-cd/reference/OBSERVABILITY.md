# Observability & Monitoring in CI/CD

This document provides comprehensive guidance for setting up observability in CI/CD pipelines and deployed applications.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Observability Layers

Set up observability in both the pipeline and the deployed application:

| Layer       | What to Configure                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| **Logging** | Structured logs (JSON), log levels, correlation IDs; ship to central system (Datadog, CloudWatch, ELK) |
| **Metrics** | Application metrics (request count, latency, error rate); infrastructure metrics (CPU, memory)         |
| **Tracing** | Distributed tracing for multi-service systems (OpenTelemetry, Jaeger, Datadog APM)                     |
| **Alerts**  | Alert on error rate spikes, latency p99, failed deployments; route to on-call                          |

---

## Logging

### Structured Logging

Use JSON format for machine-parseable logs:

**Good: Structured JSON**
```javascript
logger.info({
  event: "user_login",
  userId: "12345",
  ipAddress: "192.168.1.1",
  timestamp: new Date().toISOString(),
  correlationId: req.id
});
```

**Bad: Unstructured text**
```javascript
console.log("User 12345 logged in from 192.168.1.1");
```

### Log Levels

| Level     | When to Use                          | Example                             |
| --------- | ------------------------------------ | ----------------------------------- |
| **ERROR** | Failures that require immediate fix  | Database connection failed          |
| **WARN**  | Degraded state, but still functional | Slow query (>1s), rate limit hit    |
| **INFO**  | Business events, milestones          | User registered, order completed    |
| **DEBUG** | Detailed troubleshooting info        | SQL queries, API request/response   |
| **TRACE** | Very verbose, call stacks            | Function entry/exit, variable values |

### Correlation IDs

Pass request IDs through all services for distributed tracing:

```javascript
// Generate correlation ID at entry point
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuid();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
});

// Include in all logs
logger.info({
  correlationId: req.correlationId,
  event: "api_request",
  path: req.path
});

// Pass to downstream services
await fetch(downstreamUrl, {
  headers: {
    'X-Correlation-ID': req.correlationId
  }
});
```

### Log Shipping

Ship logs to central system for aggregation and search:

**Datadog:**
```yaml
# docker-compose.yml
services:
  app:
    logging:
      driver: "datadog"
      options:
        dd-api-key: "${DD_API_KEY}"
        dd-site: "datadoghq.com"
```

**CloudWatch (AWS):**
```yaml
# GitHub Actions
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
- name: Deploy and stream logs
  run: |
    aws logs tail /aws/lambda/my-function --follow
```

**ELK Stack:**
```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    paths:
      - /var/log/app/*.log
output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

---

## Metrics

### Application Metrics

Track key business and technical metrics:

**RED Method (Requests, Errors, Duration):**
- **Requests:** Total request count per endpoint
- **Errors:** Error rate (4xx, 5xx) per endpoint
- **Duration:** Request latency (p50, p95, p99)

**Example: Node.js with Prometheus**
```javascript
const promClient = require('prom-client');

// Counter: Requests
const requestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Histogram: Latency
const requestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    requestCounter.inc({ method: req.method, route: req.route?.path, status: res.statusCode });
    requestDuration.observe({ method: req.method, route: req.route?.path }, duration);
  });
  next();
});
```

### Infrastructure Metrics

Monitor system resources:

**Key Metrics:**
- **CPU usage:** % utilization per container/instance
- **Memory usage:** MB used, % of available
- **Disk I/O:** Read/write throughput, IOPS
- **Network I/O:** Bytes in/out, packet loss

**Example: Datadog Agent**
```yaml
# datadog.yaml
process_config:
  enabled: true
logs_enabled: true
apm_config:
  enabled: true
```

### Business Metrics

Track domain-specific metrics:

```javascript
// Example: E-commerce metrics
const orderCounter = new promClient.Counter({
  name: 'orders_total',
  help: 'Total orders placed'
});

const revenueGauge = new promClient.Gauge({
  name: 'revenue_total_dollars',
  help: 'Total revenue in dollars'
});

function processOrder(order) {
  orderCounter.inc();
  revenueGauge.inc(order.total);
}
```

---

## Tracing

### Distributed Tracing

For microservices, trace requests across services:

**OpenTelemetry (Node.js):**
```javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});
```

**Jaeger (Python):**
```python
from jaeger_client import Config

config = Config(
    config={'sampler': {'type': 'const', 'param': 1}},
    service_name='my-service',
)
tracer = config.initialize_tracer()

with tracer.start_span('process_request') as span:
    span.set_tag('user_id', user_id)
    # Business logic
```

### Trace Context Propagation

Pass trace context between services:

```javascript
// Service A: Create span and propagate
const span = tracer.startSpan('call_service_b');
const headers = {};
tracer.inject(span.context(), FORMAT_HTTP_HEADERS, headers);

await fetch('http://service-b/api', { headers });
span.finish();

// Service B: Extract span context
const spanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
const span = tracer.startSpan('handle_request', { childOf: spanContext });
```

---

## Alerts

### Alert Rules

Define alerts for critical conditions:

**Error Rate Spike:**
```yaml
# Prometheus AlertManager
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
```

**Latency P99:**
```yaml
- alert: HighLatency
  expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 10m
  annotations:
    summary: "P99 latency above 2s"
```

**Failed Deployments:**
```yaml
- alert: DeploymentFailed
  expr: increase(deployment_failures_total[15m]) > 0
  annotations:
    summary: "Deployment failed in last 15 minutes"
```

### Alert Routing

Route alerts to appropriate channels:

**PagerDuty (Critical):**
```yaml
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_KEY}'
```

**Slack (Warning):**
```yaml
receivers:
  - name: 'slack-warnings'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#alerts'
```

---

## CI Observability

### Deployment Events

Mark deployments in monitoring system:

**Datadog Events:**
```bash
# GitHub Actions
- name: Send deployment event
  run: |
    curl -X POST https://api.datadoghq.com/api/v1/events \
      -H "DD-API-KEY: ${DD_API_KEY}" \
      -d '{
        "title": "Deployment: ${{ github.sha }}",
        "text": "Deployed to production",
        "tags": ["env:production", "version:${{ github.sha }}"]
      }'
```

### Smoke Tests

Run smoke tests post-deploy:

```yaml
- name: Smoke tests
  run: |
    # Wait for deployment
    sleep 30

    # Test critical endpoints
    curl -f https://api.example.com/health || exit 1
    curl -f https://api.example.com/api/users/me || exit 1

    # Alert on failure
    if [ $? -ne 0 ]; then
      curl -X POST ${SLACK_WEBHOOK} -d '{"text":"Smoke tests failed!"}'
      exit 1
    fi
```

### Deployment Metrics

Track deployment frequency and success rate:

```javascript
// Increment on deployment start
deploymentAttempts.inc({ environment: 'production' });

// Increment on success/failure
deploymentSuccess.inc({ environment: 'production' });
deploymentFailures.inc({ environment: 'production' });

// Track duration
const end = deploymentDuration.startTimer();
// ... deploy ...
end({ environment: 'production' });
```

---

## Health Checks

### Liveness and Readiness

**Liveness:** Is the service running?
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});
```

**Readiness:** Can the service handle traffic?
```javascript
app.get('/ready', async (req, res) => {
  try {
    await db.ping();
    await redis.ping();
    res.status(200).json({ status: 'READY' });
  } catch (error) {
    res.status(503).json({ status: 'NOT_READY', error: error.message });
  }
});
```

### CI Health Check Verification

```yaml
- name: Verify health
  run: |
    # Wait for app to be ready
    for i in {1..30}; do
      if curl -f https://api.example.com/ready; then
        echo "App is ready"
        exit 0
      fi
      sleep 2
    done
    echo "App failed to become ready"
    exit 1
```

---

## MCP Integration (Datadog)

When monitoring or observability is in scope, use the **Datadog MCP** (after `/setup`) to interact with your monitoring system programmatically.

### Available Tools

| Tool                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `list_monitors`       | List all monitors, filter by status/tags   |
| `get_monitor_status`  | Get detailed status for specific monitor   |
| `query_metrics`       | Query time-series metrics                  |
| `search_logs`         | Search logs with filters and time ranges   |
| `get_service_health`  | Get latency, error rate, throughput        |

### Example: Query Deployment Impact

```javascript
// After deployment, check error rate
const metrics = await query_metrics({
  query: 'rate(http_requests_total{status="500"}[5m])',
  from: deploymentTime,
  to: Date.now()
});

// Check for alert triggers
const monitors = await list_monitors({
  tags: ['service:api', 'env:production']
});
```

### Setup

Ensure `/setup` has been run and Datadog MCP is configured with API keys before using these tools.

---

## Best Practices

### Do

✅ **Use structured logging (JSON)**
- Machine-parseable
- Enables powerful search and filtering

✅ **Include correlation IDs**
- Trace requests across services
- Debug distributed systems

✅ **Monitor the four golden signals**
- Latency, traffic, errors, saturation

✅ **Set up alerts with clear actions**
- Every alert should have a runbook
- Route to appropriate team

✅ **Test observability in staging**
- Verify logs ship correctly
- Validate metrics are collected
- Test alert firing

### Don't

❌ **Don't log sensitive data**
- Never log passwords, API keys, tokens
- Redact PII (emails, SSNs, credit cards)

❌ **Don't ignore logs/metrics in development**
- Use same observability stack locally
- Catch issues before production

❌ **Don't alert on non-actionable conditions**
- Avoid alert fatigue
- Only alert on issues requiring immediate action

❌ **Don't sample critical error logs**
- Always ship 100% of errors
- Can sample info/debug logs

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to set up observability | **ci-cd** skill (this skill) | Follow observability protocol above |
| Need to instrument code for performance | **performance** skill | See Section 5: Observability & Instrumentation |
| Need to debug production issues | **debugging** skill | Use logs, metrics, traces to investigate |
| Need to document monitoring setup | **documentation** skill | Create runbooks, alert documentation |
