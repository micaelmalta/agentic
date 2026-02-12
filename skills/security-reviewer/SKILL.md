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

See **[VULNERABILITIES.md](VULNERABILITIES.md)** for comprehensive reference of 27 vulnerability classes including:
- Injection (SQL, NoSQL, Command, XSS)
- Authentication/Authorization (IDOR, privilege escalation)
- Data Leaks (logs, errors, stack traces)
- Cryptography (weak algorithms, hardcoded keys)
- Configuration (debug mode, CORS, security headers)
- API Security (missing auth, over-fetching)
- And 21 more classes...

### 3. Severity

- **Critical** – Direct path to compromise or data breach; fix before release.
- **High** – Significant risk; should be fixed or explicitly accepted with mitigation.
- **Medium** – Moderate risk; should be addressed but may be deferred with mitigation.
- **Low / Info** – Minor risk or informational; good to fix but not blocking.

### 4. Output Format

```markdown
## Summary
[Brief overview of findings]

## Critical
- **[Title]** - [Location] - [Description and remediation]

## High
- **[Title]** - [Location] - [Description and remediation]

## Medium
- **[Title]** - [Location] - [Description and remediation]

## Low / Info
- **[Title]** - [Location] - [Description and remediation]

## Positive notes (optional)
- [Security practices done well]
```

---

## Reference Documents

For detailed information, see:

- **[VULNERABILITIES.md](VULNERABILITIES.md)** - 27 vulnerability classes with detection patterns
- **[SEARCH_PATTERNS.md](SEARCH_PATTERNS.md)** - Grep/search patterns for security-relevant code
- **[DATA_LEAKS.md](DATA_LEAKS.md)** - Comprehensive data leak detection guide (IDOR, multi-tenant, logging, API responses)
- **[CHECKLIST.md](CHECKLIST.md)** - Complete security review checklist (13 categories)

---

## Quick Start

### 1. Identify Trust Boundaries

Map where untrusted data enters the system:
- User input (forms, APIs, query params, headers)
- File uploads
- Network requests
- Third-party integrations

### 2. Trace Sensitive Data

Follow secrets, PII, tokens from source to sink:
- Are they logged?
- Exposed in errors?
- Stored securely?
- Encrypted in transit/at rest?

### 3. Check Authorization

Test access control:
- Can User A access User B's data (IDOR)?
- Are admin endpoints protected?
- Do GraphQL resolvers validate ownership?

**Multi-tenant systems:** Verify ALL queries include `tenant_id` filter.

See [DATA_LEAKS.md](DATA_LEAKS.md) for complete testing strategy.

### 4. Search for Patterns

Use grep/ripgrep to find security-relevant code:
```bash
# Secrets
grep -ri "password\|secret\|api_key\|token" .

# Injection
grep -ri "execute\|query\|SQL\|WHERE\|SELECT" .

# XSS
grep -ri "innerHTML\|dangerouslySetInnerHTML" .
```

See [SEARCH_PATTERNS.md](SEARCH_PATTERNS.md) for complete search commands.

### 5. Review Findings Against Checklist

Use [CHECKLIST.md](CHECKLIST.md) to ensure comprehensive coverage:
- Input & trust boundaries
- Data protection
- Authentication & authorization
- Injection & code execution
- API & network security
- Cryptography
- Configuration
- Dependencies
- Multi-tenant isolation (if applicable)

---

## Common Vulnerability Classes (Quick Reference)

| Class | Look For |
|-------|----------|
| **Injection** | SQL, NoSQL, command, template injection |
| **XSS** | innerHTML, dangerouslySetInnerHTML, unsafe DOM |
| **Auth/Authz** | Weak credentials, IDOR, missing checks |
| **Data Leak** | Logs, errors, stack traces with secrets/PII |
| **Crypto** | MD5, SHA1, DES, RC4, hardcoded keys |
| **SSRF** | User-controlled URLs, webhooks |
| **File Upload** | No type/size limits, path traversal |

See [VULNERABILITIES.md](VULNERABILITIES.md) for complete reference (27 classes).

---

## Data Leak Detection (Critical)

Data leaks are the most common security issue. Check:

1. **Unauthorized access** - IDOR vulnerabilities
2. **Multi-tenant isolation** - Tenant A accessing Tenant B's data
3. **Logging** - Secrets, PII in logs
4. **API responses** - Over-fetching, internal fields
5. **Error messages** - Stack traces, verbose errors
6. **Frontend** - Secrets in JS bundles, console.log

See [DATA_LEAKS.md](DATA_LEAKS.md) for:
- 9 data leak vectors
- Detection strategy (10-step process)
- Remediation patterns
- Multi-tenant isolation best practices

---

## Search Patterns (Quick Reference)

```bash
# Secrets
grep -ri "password\|secret\|api_key\|token\|credentials" .

# Data leaks
grep -ri "console.log\|printStackTrace\|error.stack" .

# Injection
grep -ri "execute\|eval\|exec\|query\|SQL" .

# XSS
grep -ri "innerHTML\|dangerouslySetInnerHTML\|v-html" .

# Authorization
grep -ri "user_id\|userId\|owner_id\|tenant_id" .
```

See [SEARCH_PATTERNS.md](SEARCH_PATTERNS.md) for complete patterns by category.

---

## Standards Reference

- **OWASP Top 10 2021**
- **OWASP API Security Top 10**
- **CWE Top 25 Most Dangerous Software Weaknesses**
- **Project-specific security documentation or threat model**

---

## Checklist

Before completing security review, verify:

- [ ] Trust boundaries identified and validated
- [ ] Sensitive data flow traced (no leaks in logs/errors)
- [ ] Authorization enforced on all operations (IDOR checked)
- [ ] Injection vulnerabilities prevented
- [ ] API security reviewed (rate limiting, SSRF)
- [ ] Cryptography uses strong algorithms
- [ ] Configuration secure (no debug mode in prod)
- [ ] Dependencies scanned for vulnerabilities
- [ ] Multi-tenant isolation verified (if applicable)
- [ ] Findings include severity and remediation

See [CHECKLIST.md](CHECKLIST.md) for complete 13-category checklist.

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need code review (non-security) | **code-reviewer** skill | Read `skills/code-reviewer/SKILL.md` |
| Need to fix identified issues | **developer** skill | Read `skills/developer/SKILL.md` |
| Testing security fixes | **testing** skill | Read `skills/testing/SKILL.md` |
| Security in architecture phase | **architect** skill | Read `skills/architect/SKILL.md` |
| CI/CD security checks | **ci-cd** skill | Read `skills/ci-cd/SKILL.md` |
| Dependency vulnerabilities | **dependencies** skill | Read `skills/dependencies/SKILL.md` |
