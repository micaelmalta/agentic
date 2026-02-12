# Common Vulnerability Classes

This document contains a comprehensive reference of vulnerability classes to check during security reviews. For overview, see [SKILL.md](SKILL.md).

## Contents

- [Vulnerability Classes Table](#vulnerability-classes-table)
- [Quick Reference](#quick-reference)

---

## Vulnerability Classes Table

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

---

## Quick Reference

### Top 10 Most Critical

1. **Injection** - SQL, NoSQL, command injection
2. **Broken Authentication** - Weak credentials, session issues
3. **Sensitive Data Exposure** - Unencrypted data, leaks in logs
4. **Broken Access Control** - IDOR, missing authorization
5. **Security Misconfiguration** - Debug mode, permissive CORS
6. **XSS** - Cross-Site Scripting attacks
7. **Insecure Deserialization** - Unsafe pickle, YAML
8. **Using Components with Known Vulnerabilities** - Outdated dependencies
9. **Insufficient Logging & Monitoring** - No security event tracking
10. **SSRF** - Server-Side Request Forgery

### By OWASP API Security Top 10

1. Broken Object Level Authorization (BOLA/IDOR)
2. Broken Authentication
3. Broken Object Property Level Authorization
4. Unrestricted Resource Consumption
5. Broken Function Level Authorization
6. Unrestricted Access to Sensitive Business Flows
7. Server Side Request Forgery (SSRF)
8. Security Misconfiguration
9. Improper Inventory Management
10. Unsafe Consumption of APIs

---

## See Also

- [SKILL.md](SKILL.md) - Security review protocol and severity
- [SEARCH_PATTERNS.md](SEARCH_PATTERNS.md) - Code patterns to search for
- [DATA_LEAKS.md](DATA_LEAKS.md) - Data leak detection guide
- [CHECKLIST.md](CHECKLIST.md) - Complete security review checklist
