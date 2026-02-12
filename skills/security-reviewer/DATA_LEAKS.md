# Data Leak Detection Guide

Data leaks are one of the most common and impactful security issues. They expose sensitive information through unintended channels. For overview, see [SKILL.md](SKILL.md).

## Contents

- [Common Data Leak Vectors](#common-data-leak-vectors)
- [Detection Strategy](#detection-strategy)
- [Remediation Patterns](#remediation-patterns)

---

## Common Data Leak Vectors

### 1. Unauthorized Data Access (Broken Access Control)

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

### 2. Logging & Error Messages

- Application logs containing passwords, tokens, API keys, session IDs
- Stack traces in production exposing internal paths, code structure, library versions
- Debug logs with PII (emails, names, addresses, phone numbers)
- Database query logs with sensitive WHERE clauses
- HTTP request/response logs with Authorization headers or cookies
- Exception messages revealing database schema or business logic

### 3. API Responses

- Over-fetching: APIs returning more data than necessary (e.g., user object with password hash)
- Internal fields exposed (internal IDs, flags, timestamps, audit fields)
- Verbose error responses with implementation details
- Different response times or messages revealing information (user enumeration)
- GraphQL introspection queries in production
- Debug endpoints left enabled (`/debug`, `/admin`, `/metrics`, `/health` with details)

### 4. Frontend & Client-Side

- Secrets or API keys in JavaScript bundles
- Sensitive data in localStorage/sessionStorage
- Comments in HTML/JS with credentials or internal documentation
- Source maps in production revealing original code
- Console.log statements with sensitive data
- Error boundaries showing stack traces to users

### 5. URLs & Headers

- Sensitive data in query parameters (tokens, PII, session IDs)
- Referer header leaking sensitive URL parameters to third parties
- Server headers revealing technology stack and versions
- CORS misconfiguration exposing internal APIs
- Cache headers allowing sensitive data to be cached

### 6. Files & Configuration

- `.env` files accessible via web server
- Backup files (`.bak`, `.old`, `.backup`) in web root
- `.git` directory exposed
- Config files with hardcoded credentials
- Private keys in version control
- Docker images with secrets in layers

### 7. Third-Party Services

- Analytics/monitoring tools receiving sensitive data
- Error tracking services (Sentry, Bugsnag) with PII or secrets
- Cloud storage (S3, GCS) with public read access
- CDN logs with access tokens
- Webhooks sending sensitive data to unverified destinations

### 8. Database & Storage

- SQL error messages exposing table structure
- MongoDB/NoSQL error messages with query details
- Redis keys visible through INFO command
- Elasticsearch indices publicly accessible
- Database backups stored unencrypted
- Temporary files with sensitive data not cleaned up

### 9. Network & Infrastructure

- TLS certificates with organization info (acceptable, but verify)
- DNS records revealing internal structure
- Open ports and services (Shodan, Censys)
- Cloud metadata endpoints accessible (169.254.169.254)
- Internal IP addresses in responses
- SSRF vulnerabilities exposing internal services

---

## Detection Strategy

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

---

## Remediation Patterns

### Authorization Fixes

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

### Multi-Tenant Isolation (Critical for SaaS/B2B)

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

### Logging & Error Handling

- **Remove or redact sensitive data from logs:** Implement structured logging with automatic redaction
- **Use generic error messages in production:** "An error occurred" vs detailed stack traces
- **Never log secrets:** Passwords, tokens, keys, session IDs, credit cards should never be logged
- **Enable error monitoring with PII filtering:** Configure Sentry/Bugsnag to scrub sensitive fields

### API & Response Filtering

- **Implement response filtering:** Return only fields the client needs (GraphQL field-level authorization, DTOs)
- **Disable debug endpoints in production:** Use environment variables to control availability
- **Implement least privilege APIs:** Return minimal data, filter fields based on permissions
- **Remove technology headers:** Disable `Server` and `X-Powered-By` headers

### File & Configuration Security

- **Use `.gitignore` properly:** Exclude `.env`, `*.key`, `*.pem`, `config/secrets.*`
- **Use content security policy:** Restrict what can be embedded or executed
- **Audit trails:** Log who accessed what data for compliance and incident response

---

## See Also

- [SKILL.md](SKILL.md) - Security review protocol
- [VULNERABILITIES.md](VULNERABILITIES.md) - Vulnerability classes reference
- [SEARCH_PATTERNS.md](SEARCH_PATTERNS.md) - Code search patterns
- [CHECKLIST.md](CHECKLIST.md) - Complete security review checklist
