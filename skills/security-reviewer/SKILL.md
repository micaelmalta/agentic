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
---

# Security Reviewer Skill

## Core Philosophy

**"Assume compromise; verify trust boundaries and input handling."**

Focus on exploitable issues and insecure patterns. Prioritize by impact and likelihood.

---

## Protocol

### 1. Scope

- Identify trust boundaries (user input, network, filesystem, third-party services).
- Trace sensitive data (secrets, tokens, PII) from source to sink.
- Review authentication, authorization, and session handling.

### 2. Common Vulnerability Classes

| Class              | Look for                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Injection**      | SQL, NoSQL, OS command, template, LDAP. Use parameterization/safe APIs; avoid concatenating user input into queries or commands. |
| **XSS**            | Reflected, stored, DOM. Output encoding, CSP, and safe sinks for user-controlled data.                                           |
| **Authn/Authz**    | Weak or default credentials, broken logout, IDOR, privilege escalation, missing checks on sensitive actions.                     |
| **Sensitive data** | Logs, errors, or responses exposing secrets, PII, or tokens; missing encryption in transit/at rest.                              |
| **Cryptography**   | Custom crypto, weak algorithms or modes, hardcoded keys, weak randomness for security-sensitive values.                          |
| **Configuration**  | Debug mode in production, permissive CORS, insecure headers, default or guessable secrets.                                       |

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

### 5. Commands

- No mandatory commands. Use grep/search to find patterns: auth, token, secret, password, execute, query, eval, innerHTML, etc.
- When referencing standards: OWASP Top 10, CWE, or project-specific security docs.

---

## Checklist

- [ ] User-controlled input and trust boundaries identified.
- [ ] Sensitive data flow and exposure considered.
- [ ] Authn/authz and access control checked for changed or new behavior.
- [ ] Findings include location, severity, and remediation.
- [ ] No unfounded alarm; distinguish theoretical vs practical risk.
