---
name: security-reviewer
description: "Review code and design for security vulnerabilities and insecure patterns. Use when the user asks for a security review, security audit, find vulnerabilities, or when assessing auth, crypto, input handling, or exposure of sensitive data."
triggers:
  - "/security"
  - "security review"
  - "security audit"
  - "find vulnerabilities"
  - "is this secure"
  - "check for security issues"
  - "OWASP"
  - "injection"
  - "auth review"
  - "data leak"
  - "information disclosure"
  - "sensitive data exposure"
  - "check for leaks"
---

# Security Reviewer Skill

## Core Philosophy

**"Assume compromise; verify trust boundaries and input handling."**

Focus on exploitable issues and insecure patterns. Prioritize by impact and likelihood.

**Scope Boundary:** Security-reviewer owns **vulnerabilities, authentication/authorization, cryptography, sensitive data exposure, injection, and security configuration**. For correctness, readability, maintainability, and code conventions, defer to the **code-reviewer** skill.

---

## Protocol

### 1. Scope

- Identify trust boundaries (user input, network, filesystem, third-party services, cloud services).
- Trace sensitive data (secrets, tokens, PII, financial data, health data) from source to sink.
- Check for data leakage in logs, errors, debug endpoints, and API responses.
- Review authentication, authorization, and session handling.
- Assess injection points and unsafe deserialization.
- Evaluate file upload/download security.
- Check cryptographic implementations and key management.
- Review API security and rate limiting.
- Assess third-party dependency vulnerabilities.

### 2. Common Vulnerability Classes

| Class                          | Look for                                                                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Injection**                  | SQL, NoSQL, OS command, template, LDAP, XML, XPATH, JSON, CRLF. Use parameterization/safe APIs; avoid concatenating user input into queries or commands.                                                          |
| **XSS**                        | Reflected, stored, DOM. Output encoding, CSP, and safe sinks for user-controlled data. Check `innerHTML`, `dangerouslySetInnerHTML`, template injection.                                                          |
| **Authn/Authz**                | Weak or default credentials, broken logout, IDOR, privilege escalation, missing checks on sensitive actions, JWT vulnerabilities, session fixation, account enumeration.                                          |
| **Data Leak**                  | Logs, errors, stack traces, debug endpoints exposing secrets, PII, tokens, internal paths, or system info. Check console.log, error responses, verbose logging.                                                   |
| **Sensitive Data Exposure**    | Missing encryption in transit (no TLS), weak TLS config, data at rest unencrypted, PII in URLs/query params, sensitive data in localStorage/sessionStorage.                                                       |
| **Cryptography**               | Custom crypto, weak algorithms (MD5, SHA1, DES, RC4), hardcoded keys, weak randomness (`Math.random()`), insecure key storage, missing key rotation.                                                              |
| **Configuration**              | Debug mode in production, permissive CORS, missing security headers (CSP, HSTS, X-Frame-Options), default or guessable secrets, exposed .env files.                                                               |
| **Broken Access Control**      | Missing authorization checks, users accessing other users' data (IDOR), path traversal, horizontal/vertical privilege escalation, forced browsing, missing object-level authorization, tenant isolation failures. |
| **SSRF**                       | Server-Side Request Forgery via user-controlled URLs, webhooks, image fetching, PDF generation. Validate and whitelist destinations.                                                                              |
| **Deserialization**            | Unsafe deserialization of untrusted data (pickle, YAML, JSON with reviver, XML external entities). Prefer safe formats and validation.                                                                            |
| **File Upload**                | Unrestricted file types, missing size limits, executable uploads, path traversal in filenames, no virus scanning, stored in web-accessible directories.                                                           |
| **Rate Limiting & DoS**        | Missing rate limits on auth endpoints, resource-intensive operations, regex DoS (ReDoS), ZIP bombs, XML bombs, algorithmic complexity attacks.                                                                    |
| **Mass Assignment**            | User input directly bound to models without allowlisting fields. Can modify admin flags, prices, roles, internal fields.                                                                                          |
| **Third-Party Dependencies**   | Known CVEs in dependencies, outdated packages, supply chain attacks. Check npm audit, Snyk, Dependabot.                                                                                                           |
| **API Security**               | Missing authentication, broken object-level authorization, excessive data exposure, lack of rate limiting, improper asset management, GraphQL introspection enabled in prod.                                      |
| **Secret Management**          | Hardcoded secrets, API keys in code/configs, secrets in version control, environment variables logged or exposed, no secret rotation.                                                                             |
| **Business Logic**             | Race conditions, price/quantity manipulation, workflow bypasses, discount abuse, referral fraud, time-of-check/time-of-use (TOCTOU) bugs.                                                                         |
| **Client-Side Security**       | Sensitive logic in frontend, client-side security checks only, exposed API keys/secrets in JavaScript, no integrity checks (SRI) on third-party scripts.                                                          |
| **Session Management**         | Session fixation, predictable session IDs, missing HttpOnly/Secure flags on cookies, no session expiration, concurrent session handling, session in URL parameters.                                               |
| **Error Handling**             | Verbose error messages exposing implementation details, stack traces in production, different responses for valid/invalid users (user enumeration), uncaught exceptions.                                          |
| **Logging & Monitoring**       | Insufficient logging of security events (login failures, access violations), logs containing sensitive data, no alerting on suspicious activities, log injection.                                                 |
| **Input Validation**           | Missing validation on all inputs (headers, cookies, query params, body), allowlist vs denylist approach, validation on client only, type coercion vulnerabilities.                                                |
| **Redirect & SSRF**            | Open redirect vulnerabilities, unvalidated redirects, URL injection, Host header attacks, DNS rebinding.                                                                                                          |
| **XML/API Vulnerabilities**    | XXE (XML External Entity), SOAP injection, REST API parameter pollution, GraphQL depth/complexity attacks, missing input validation on API endpoints.                                                             |
| **Mobile-Specific**            | Insecure data storage on device, weak certificate validation, code tampering, reverse engineering protections, biometric auth bypass, deep link vulnerabilities.                                                  |
| **Cloud & Container Security** | Exposed cloud storage (S3 buckets), overly permissive IAM roles, secrets in container images, insecure container registries, missing network segmentation.                                                        |

### 3. Severity

- **Critical** – Direct path to compromise or data breach; fix before release.
- **High** – Significant risk; should be fixed or explicitly accepted with mitigation.
- **Medium** – Defensible controls missing or weak; plan to fix.
- **Low / Info** – Hardening or best practice; optional.

### 4. Output Format

Structure the security review as:

```markdown
## Summary

[Scope reviewed and overall risk level]

## Critical

- **[Issue]** – [Location and brief description]. [Remediation or reference.]

## High

- **[Issue]** – [Description]. [Remediation.]

## Medium

- **[Issue]** – [Description]. [Remediation.]

## Low / Info

- **[Item]** – [Description.]

## Positive notes (optional)

- [Good security practices observed]
```

### 5. Search Patterns

Use grep/search to find security-relevant patterns across the codebase:

**Secrets & Credentials:**

- `password`, `secret`, `api_key`, `token`, `credentials`, `private_key`, `aws_access`, `Bearer`, `Authorization`

**Data Leakage:**

- `console.log`, `console.error`, `print(`, `System.out`, `Log.d`, `Log.e`, `logger.debug`, `printStackTrace`, `error.stack`

**Injection Vectors:**

- `execute`, `eval`, `exec`, `query`, `SQL`, `WHERE`, `SELECT`, `INSERT`, `${}`, template literals with user input
- `Runtime.exec`, `os.system`, `subprocess`, `child_process`, `shell=True`

**XSS & Unsafe Output:**

- `innerHTML`, `dangerouslySetInnerHTML`, `document.write`, `eval`, `v-html`, `[innerHTML]`, `createContextualFragment`

**Deserialization:**

- `pickle.loads`, `yaml.load`, `unserialize`, `JSON.parse` with reviver, `XMLDecoder`, `readObject`

**File Operations:**

- `multer`, `formidable`, `fs.readFile`, `path.join`, `../`, file upload endpoints, `__dirname`, `process.cwd()`

**Authentication:**

- `login`, `authenticate`, `verify`, `jwt.sign`, `bcrypt`, `password`, `session`, `cookie`, `OAuth`, `SAML`

**Authorization:**

- `authorize`, `permission`, `role`, `admin`, `isAdmin`, `canAccess`, `checkPermission`, middleware guards
- `user_id`, `userId`, `owner_id`, `ownerId`, `tenant_id`, `WHERE`, database queries with user context
- Look for endpoints that fetch by ID without ownership checks
- GraphQL resolvers that don't validate user can access the requested resource

**Cryptography:**

- `crypto`, `cipher`, `encrypt`, `decrypt`, `hash`, `MD5`, `SHA1`, `DES`, `RC4`, `Math.random()`, `Random()`

**Network Requests:**

- `fetch`, `axios`, `request`, `http.get`, `urllib`, `requests.get`, `curl`, `wget`, webhooks, callbacks

**Standards Reference:**

- OWASP Top 10 2021
- SANS Top 25 CWE
- CWE/SANS Top 25 Most Dangerous Software Errors
- Project-specific security documentation or threat model

---

## Data Leak Detection Guide

Data leaks are one of the most common and impactful security issues. They expose sensitive information through unintended channels.

### Common Data Leak Vectors

**1. Unauthorized Data Access (Broken Access Control)**

**Single-User Context:**

- Users accessing other users' data by changing IDs in URLs or API calls (IDOR)
- Horizontal privilege escalation: User A viewing User B's profile, orders, messages, documents
- Vertical privilege escalation: Regular user accessing admin-only data
- Missing object-level authorization checks on API endpoints
- Predictable or sequential IDs allowing enumeration of resources
- GraphQL/REST APIs returning data without ownership verification
- Direct database record access without user context validation
- Batch endpoints returning data for multiple users without filtering
- Search/filter endpoints exposing data across user boundaries
- Pagination endpoints leaking data from other users
- Export/download features not scoped to current user
- Shared resources (links, files) without proper access token validation

**Multi-Tenant Isolation Failures (Critical in SaaS/B2B):**

- **Tenant A accessing Tenant B's data** - Most critical data leak in multi-tenant systems
- Missing `tenant_id` filters in database queries (ALL queries must include tenant context)
- Shared database tables without tenant scoping on every query
- Background jobs/cron tasks processing data across tenant boundaries
- Search indices (Elasticsearch, Algolia) mixing data from multiple tenants
- Cache keys not scoped to tenant (Redis, Memcached) causing cross-tenant data leaks
- File storage paths without tenant isolation (S3, Azure Blob, GCS)
- Webhooks/callbacks sending Tenant A's events to Tenant B's endpoint
- Admin endpoints showing data from all tenants without proper filtering
- Reporting/analytics dashboards aggregating across tenant boundaries
- API batch operations returning data from multiple tenants
- Database migrations not preserving tenant isolation
- Shared secrets/API keys across tenants instead of per-tenant credentials
- Queue systems (RabbitMQ, SQS) mixing messages from different tenants
- Subdomain/domain-based tenant identification with bypassable routing

**Examples:**

- `GET /api/users/123/profile` - Can User A access User B's profile by changing ID to 456?
- `GET /api/orders?userId=123` - Are server-side filters enforced or can userId be modified?
- `GET /api/documents/abc123` - Is ownership verified before returning document?
- GraphQL query fetching user by ID - Does it check if requester has permission?
- File download endpoint - Can you download files by guessing/incrementing file IDs?

**Multi-Tenant Examples:**

- `SELECT * FROM orders WHERE id = ?` ❌ Missing tenant_id filter - returns orders from ANY tenant!
- `SELECT * FROM orders WHERE id = ? AND tenant_id = ?` ✅ Properly scoped to tenant
- Cache key: `user:123` ❌ Could retrieve user from wrong tenant
- Cache key: `tenant:abc:user:123` ✅ Tenant-scoped cache key
- Background job processes all pending orders ❌ Mixes tenants
- Background job: `WHERE status = 'pending' AND tenant_id = ?` ✅ Tenant-isolated
- S3 path: `uploads/invoice-123.pdf` ❌ Any tenant could guess path
- S3 path: `uploads/tenant-abc/invoice-123.pdf` ✅ Tenant-isolated storage
- Webhook URL stored per user ❌ Could receive other tenant's events
- Webhook URL validated and scoped per tenant ✅ Isolated webhooks

**2. Logging & Error Messages**

- Application logs containing passwords, tokens, API keys, session IDs
- Stack traces in production exposing internal paths, code structure, library versions
- Debug logs with PII (emails, names, addresses, phone numbers)
- Database query logs with sensitive WHERE clauses
- HTTP request/response logs with Authorization headers or cookies
- Exception messages revealing database schema or business logic

**3. API Responses**

- Over-fetching: APIs returning more data than necessary (e.g., user object with password hash)
- Internal fields exposed (internal IDs, flags, timestamps, audit fields)
- Verbose error responses with implementation details
- Different response times or messages revealing information (user enumeration)
- GraphQL introspection queries in production
- Debug endpoints left enabled (`/debug`, `/admin`, `/metrics`, `/health` with details)

**4. Frontend & Client-Side**

- Secrets or API keys in JavaScript bundles
- Sensitive data in localStorage/sessionStorage
- Comments in HTML/JS with credentials or internal documentation
- Source maps in production revealing original code
- Console.log statements with sensitive data
- Error boundaries showing stack traces to users

**5. URLs & Headers**

- Sensitive data in query parameters (tokens, PII, session IDs)
- Referer header leaking sensitive URL parameters to third parties
- Server headers revealing technology stack and versions
- CORS misconfiguration exposing internal APIs
- Cache headers allowing sensitive data to be cached

**6. Files & Configuration**

- `.env` files accessible via web server
- Backup files (`.bak`, `.old`, `.backup`) in web root
- `.git` directory exposed
- Config files with hardcoded credentials
- Private keys in version control
- Docker images with secrets in layers

**7. Third-Party Services**

- Analytics/monitoring tools receiving sensitive data
- Error tracking services (Sentry, Bugsnag) with PII or secrets
- Cloud storage (S3, GCS) with public read access
- CDN logs with access tokens
- Webhooks sending sensitive data to unverified destinations

**8. Database & Storage**

- SQL error messages exposing table structure
- MongoDB/NoSQL error messages with query details
- Redis keys visible through INFO command
- Elasticsearch indices publicly accessible
- Database backups stored unencrypted
- Temporary files with sensitive data not cleaned up

**9. Network & Infrastructure**

- TLS certificates with organization info (acceptable, but verify)
- DNS records revealing internal structure
- Open ports and services (Shodan, Censys)
- Cloud metadata endpoints accessible (169.254.169.254)
- Internal IP addresses in responses
- SSRF vulnerabilities exposing internal services

### Detection Strategy

1. **Test authorization boundaries:**

   - Change user IDs in URLs/API calls to access other users' data
   - Test IDOR vulnerabilities: `/api/users/123` → `/api/users/456`
   - Verify object-level authorization on all endpoints
   - Check if GraphQL queries validate ownership before returning data
   - Test batch/bulk endpoints for cross-user data leakage

   **Multi-Tenant Specific Tests:**

   - Verify ALL database queries include `tenant_id` filter (grep for SELECT/UPDATE/DELETE without tenant)
   - Test if Tenant A can access Tenant B's data by manipulating tenant identifiers
   - Check if switching tenant context in UI/API exposes other tenant's data
   - Verify background jobs filter by tenant_id
   - Test cache isolation: can cached data leak between tenants?
   - Check file storage paths are tenant-scoped
   - Verify search indices don't return results from other tenants
   - Test admin endpoints properly filter by tenant
   - Verify webhooks/callbacks can't be hijacked cross-tenant
   - Check database connection pooling doesn't leak tenant context
   - Test subdomain/domain routing can't be bypassed to access other tenants

2. **Search for logging patterns:** `console.log`, `logger`, `print`, `System.out`, `Log`, `error`, `printStackTrace`

3. **Check error handling:** Overly verbose error messages, stack traces, different responses for valid/invalid input

4. **Review API endpoints:** Use tools to inspect full responses, check for over-fetching, verify authorization checks

5. **Examine frontend code:** Search for hardcoded secrets, API keys, console statements

6. **Test file access:** Try accessing `.env`, `.git`, backup files, source maps

7. **Inspect HTTP headers:** Server, X-Powered-By, technology-revealing headers

8. **Check third-party integrations:** What data is sent to analytics, error tracking, webhooks?

9. **Review configuration:** Are debug endpoints disabled? Is introspection off in production?

10. **Audit database queries:** Are WHERE clauses properly scoped to current user? Is Row-Level Security (RLS) enabled?

### Remediation Patterns

- **Enforce object-level authorization:** Verify user owns/has permission for EVERY resource access
  - Check ownership in database queries: `WHERE user_id = current_user AND id = requested_id`
  - Use authorization middleware/decorators on all endpoints
  - Implement Row-Level Security (RLS) in PostgreSQL or similar
  - Never trust client-provided user IDs - always use authenticated session user
- **Use non-sequential, random IDs:** UUIDs instead of auto-incrementing integers to prevent enumeration

- **Implement proper API authorization:**
  - Resource-level checks (does user own this specific resource?)
  - Action-level checks (can user perform this action on this resource?)
  - Attribute-level checks (can user see/edit these specific fields?)
- **Scope all queries to current user:** Add `WHERE user_id = ?` or tenant filters to ALL queries

- **Validate ownership before operations:** Check authorization BEFORE fetching/modifying/deleting resources

- **Multi-Tenant Isolation Best Practices (Critical for SaaS/B2B):**

  - **MANDATORY tenant_id filter on EVERY query:** `WHERE tenant_id = ? AND ...` (no exceptions!)
  - Use database Row-Level Security (RLS) policies with `SET app.current_tenant_id = ?`
  - Implement tenant context middleware that sets tenant for entire request
  - Tenant-scoped cache keys: `tenant:{tenant_id}:resource:{id}`
  - Tenant-isolated file storage: `s3://bucket/tenant-{tenant_id}/...`
  - Database schemas per tenant OR shared schema with tenant_id column (prefer RLS)
  - Background jobs MUST include tenant context: `process_orders(tenant_id=?)`
  - Search indices partitioned by tenant or filtered at query time
  - Separate API keys/secrets per tenant, never shared
  - Webhooks validated against tenant's registered endpoints only
  - Admin endpoints: explicit tenant selection, never "all tenants" by default
  - Audit logging includes tenant_id for forensics
  - Test with multiple test tenants in CI/CD to catch leaks early
  - Consider separate databases per tenant for highest isolation (enterprise tier)

- **Remove or redact sensitive data from logs:** Implement structured logging with automatic redaction

- **Use generic error messages in production:** "An error occurred" vs detailed stack traces

- **Implement response filtering:** Return only fields the client needs (GraphQL field-level authorization, DTOs)

- **Disable debug endpoints in production:** Use environment variables to control availability

- **Never log secrets:** Passwords, tokens, keys, session IDs, credit cards should never be logged

- **Use `.gitignore` properly:** Exclude `.env`, `*.key`, `*.pem`, `config/secrets.*`

- **Enable error monitoring with PII filtering:** Configure Sentry/Bugsnag to scrub sensitive fields

- **Remove technology headers:** Disable `Server` and `X-Powered-By` headers

- **Implement least privilege APIs:** Return minimal data, filter fields based on permissions

- **Use content security policy:** Restrict what can be embedded or executed

- **Audit trails:** Log who accessed what data for compliance and incident response

---

## Checklist

### Input & Trust Boundaries

- [ ] All user-controlled input identified (query params, body, headers, cookies, file uploads).
- [ ] Trust boundaries mapped (user input, network, filesystem, third-party services, cloud services).
- [ ] Input validation present on server-side (not just client-side).
- [ ] Allowlist approach used for validation (not just denylist).

### Data Protection

- [ ] Sensitive data flow traced from source to sink (PII, secrets, tokens, financial data).
- [ ] Data leak risks assessed (logs, error messages, debug endpoints, stack traces).
- [ ] Encryption in transit enforced (TLS 1.2+, no mixed content).
- [ ] Encryption at rest for sensitive data (database, file storage, backups).
- [ ] Sensitive data not in URLs, query parameters, or client-side storage.
- [ ] Secrets not hardcoded in code or configs.

### Authentication & Authorization

- [ ] Authentication mechanisms reviewed (password strength, MFA, account lockout).
- [ ] Authorization checks present on all sensitive operations.
- [ ] IDOR and privilege escalation vulnerabilities checked.
- [ ] Session management secure (HttpOnly, Secure flags, expiration, regeneration).
- [ ] JWT vulnerabilities addressed (algorithm confusion, weak secrets, no expiration).

### Injection & Code Execution

- [ ] SQL/NoSQL injection prevented (parameterized queries, ORM safety).
- [ ] OS command injection prevented (no shell=True, avoid system calls with user input).
- [ ] XSS prevented (output encoding, CSP, safe DOM manipulation).
- [ ] Template injection checked.
- [ ] LDAP, XML, XPath injection considered.

### API & Network Security

- [ ] SSRF vulnerabilities prevented (URL validation, allowlisting).
- [ ] Open redirect prevented.
- [ ] Rate limiting on authentication and resource-intensive endpoints.
- [ ] GraphQL introspection disabled in production.
- [ ] REST API follows least privilege and proper authorization.

### File Handling

- [ ] File upload restrictions (type, size, virus scanning).
- [ ] Path traversal prevented (no ../ in filenames).
- [ ] Uploaded files not executable or in web root.
- [ ] File download validation (no arbitrary file access).

### Cryptography

- [ ] Strong algorithms used (AES-256, RSA-2048+, SHA-256+).
- [ ] No custom cryptography implementations.
- [ ] Cryptographically secure random for security-sensitive values.
- [ ] Keys properly managed and rotated.
- [ ] No weak algorithms (MD5, SHA1, DES, RC4).

### Configuration & Deployment

- [ ] Debug mode disabled in production.
- [ ] Security headers present (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- [ ] CORS configured restrictively (not wildcard \*).
- [ ] Default credentials changed.
- [ ] Error messages non-verbose (no stack traces, internal paths).
- [ ] Environment variables not logged or exposed.

### Dependencies & Supply Chain

- [ ] Dependencies scanned for known vulnerabilities (npm audit, Snyk, Dependabot).
- [ ] Outdated packages identified and updated.
- [ ] Lockfiles present and used (package-lock.json, yarn.lock, Pipfile.lock).
- [ ] Third-party scripts use SRI (Subresource Integrity).

### Business Logic

- [ ] Race conditions considered (concurrent requests, TOCTOU).
- [ ] Price/quantity manipulation prevented.
- [ ] Workflow bypasses checked.
- [ ] Referral and discount abuse mitigations.

### Logging & Monitoring

- [ ] Security events logged (authentication failures, authorization violations).
- [ ] Logs don't contain sensitive data (passwords, tokens, PII, credit cards).
- [ ] Log injection prevented (newlines, control characters).
- [ ] Monitoring and alerting on suspicious activities.

### Multi-Tenant Isolation (if applicable)

- [ ] ALL database queries include tenant_id filter (SELECT, UPDATE, DELETE, INSERT validation).
- [ ] Row-Level Security (RLS) enabled with tenant context.
- [ ] Tenant context middleware ensures tenant is set for entire request.
- [ ] Cache keys scoped to tenant (e.g., `tenant:123:user:456`).
- [ ] File storage paths isolated by tenant.
- [ ] Background jobs/cron tasks include tenant_id filter.
- [ ] Search indices partitioned or filtered by tenant.
- [ ] Webhooks/callbacks validated against tenant-specific endpoints.
- [ ] API keys/secrets isolated per tenant (not shared).
- [ ] Admin endpoints require explicit tenant selection.
- [ ] Cannot switch tenant context to access other tenant's data.
- [ ] Subdomain/domain routing cannot be bypassed.
- [ ] Database migrations preserve tenant isolation.
- [ ] Multiple test tenants used in CI/CD to validate isolation.
- [ ] Audit logs include tenant_id for all operations.

### Output Quality

- [ ] Findings include location, severity, and remediation.
- [ ] Severity appropriate (Critical, High, Medium, Low).
- [ ] No unfounded alarm; distinguish theoretical vs practical risk.
- [ ] Positive security practices noted when present.

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Correctness/readability issues found | **code-reviewer** skill | Read `skills/code-reviewer/SKILL.md` |
| Dependency vulnerabilities found | **dependencies** skill | Read `skills/dependencies/SKILL.md` for upgrade |
| Security fix needs tests | **testing** skill | Read `skills/testing/SKILL.md` |
| Production incident investigation | **Datadog MCP** | Use `search_logs`, `query_traces` (after `/setup`) |
| Security in CI/CD pipeline | **ci-cd** skill | Read `skills/ci-cd/SKILL.md` for secrets safety |
| Large codebase security scan | **rlm** skill | Read `skills/rlm/SKILL.md` for parallel analysis |
