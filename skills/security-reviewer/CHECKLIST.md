# Security Review Checklist

This document contains a comprehensive checklist for security reviews. For overview, see [SKILL.md](SKILL.md).

## Contents

- [Input & Trust Boundaries](#input--trust-boundaries)
- [Data Protection](#data-protection)
- [Authentication & Authorization](#authentication--authorization)
- [Injection & Code Execution](#injection--code-execution)
- [API & Network Security](#api--network-security)
- [File Handling](#file-handling)
- [Cryptography](#cryptography)
- [Configuration & Deployment](#configuration--deployment)
- [Dependencies & Supply Chain](#dependencies--supply-chain)
- [Business Logic](#business-logic)
- [Logging & Monitoring](#logging--monitoring)
- [Multi-Tenant Isolation](#multi-tenant-isolation-if-applicable)
- [Output Quality](#output-quality)

---

## Input & Trust Boundaries

- [ ] All user-controlled input identified (query params, body, headers, cookies, file uploads).
- [ ] Trust boundaries mapped (user input, network, filesystem, third-party services, cloud services).
- [ ] Input validation present on server-side (not just client-side).
- [ ] Allowlist approach used for validation (not just denylist).

---

## Data Protection

- [ ] Sensitive data flow traced from source to sink (PII, secrets, tokens, financial data).
- [ ] Data leak risks assessed (logs, error messages, debug endpoints, stack traces).
- [ ] Encryption in transit enforced (TLS 1.2+, no mixed content).
- [ ] Encryption at rest for sensitive data (database, file storage, backups).
- [ ] Sensitive data not in URLs, query parameters, or client-side storage.
- [ ] Secrets not hardcoded in code or configs.

---

## Authentication & Authorization

- [ ] Authentication mechanisms reviewed (password strength, MFA, account lockout).
- [ ] Authorization checks present on all sensitive operations.
- [ ] IDOR and privilege escalation vulnerabilities checked.
- [ ] Session management secure (HttpOnly, Secure flags, expiration, regeneration).
- [ ] JWT vulnerabilities addressed (algorithm confusion, weak secrets, no expiration).

---

## Injection & Code Execution

- [ ] SQL/NoSQL injection prevented (parameterized queries, ORM safety).
- [ ] OS command injection prevented (no shell=True, avoid system calls with user input).
- [ ] XSS prevented (output encoding, CSP, safe DOM manipulation).
- [ ] Template injection checked.
- [ ] LDAP, XML, XPath injection considered.

---

## API & Network Security

- [ ] SSRF vulnerabilities prevented (URL validation, allowlisting).
- [ ] Open redirect prevented.
- [ ] Rate limiting on authentication and resource-intensive endpoints.
- [ ] GraphQL introspection disabled in production.
- [ ] REST API follows least privilege and proper authorization.

---

## File Handling

- [ ] File upload restrictions (type, size, virus scanning).
- [ ] Path traversal prevented (no ../ in filenames).
- [ ] Uploaded files not executable or in web root.
- [ ] File download validation (no arbitrary file access).

---

## Cryptography

- [ ] Strong algorithms used (AES-256, RSA-2048+, SHA-256+).
- [ ] No custom cryptography implementations.
- [ ] Cryptographically secure random for security-sensitive values.
- [ ] Keys properly managed and rotated.
- [ ] No weak algorithms (MD5, SHA1, DES, RC4).

---

## Configuration & Deployment

- [ ] Debug mode disabled in production.
- [ ] Security headers present (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- [ ] CORS configured restrictively (not wildcard \*).
- [ ] Default credentials changed.
- [ ] Error messages non-verbose (no stack traces, internal paths).
- [ ] Environment variables not logged or exposed.

---

## Dependencies & Supply Chain

- [ ] Dependencies scanned for known vulnerabilities (npm audit, Snyk, Dependabot).
- [ ] Outdated packages identified and updated.
- [ ] Lockfiles present and used (package-lock.json, yarn.lock, Pipfile.lock).
- [ ] Third-party scripts use SRI (Subresource Integrity).

---

## Business Logic

- [ ] Race conditions considered (concurrent requests, TOCTOU).
- [ ] Price/quantity manipulation prevented.
- [ ] Workflow bypasses checked.
- [ ] Referral and discount abuse mitigations.

---

## Logging & Monitoring

- [ ] Security events logged (authentication failures, authorization violations).
- [ ] Logs don't contain sensitive data (passwords, tokens, PII, credit cards).
- [ ] Log injection prevented (newlines, control characters).
- [ ] Monitoring and alerting on suspicious activities.

---

## Multi-Tenant Isolation (if applicable)

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

---

## Output Quality

- [ ] Findings include location, severity, and remediation.
- [ ] Severity appropriate (Critical, High, Medium, Low).
- [ ] No unfounded alarm; distinguish theoretical vs practical risk.
- [ ] Positive security practices noted when present.

---

## See Also

- [SKILL.md](SKILL.md) - Security review protocol
- [VULNERABILITIES.md](VULNERABILITIES.md) - Vulnerability classes reference
- [SEARCH_PATTERNS.md](SEARCH_PATTERNS.md) - Code search patterns
- [DATA_LEAKS.md](DATA_LEAKS.md) - Data leak detection guide
