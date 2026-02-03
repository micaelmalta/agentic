# Phase 5 Validation Checklist

**⛔ MANDATORY - DO NOT SKIP**

Copy this checklist into your work notes and verify each item before Phase 6 (Commit).

---

## ✅ Automated Checks (3 items)

- [ ] **Linter passed**

  - Command: `npm run lint` / `golangci-lint run` / `ruff check .` / `rubocop` / etc.
  - Status: PASS / FAIL
  - Notes: **************\_\_**************

- [ ] **Build passed** (if applicable)

  - Command: `npm run build` / `go build ./...` / `cargo build` / `mvn compile` / etc.
  - Status: PASS / FAIL
  - Notes: **************\_\_**************

- [ ] **Tests passed**
  - Command: `npm test` / `go test -race ./...` / `pytest` / `cargo test` / etc.
  - Status: PASS / FAIL
  - Coverage: **\_**%
  - Notes: **************\_\_**************

---

## ✅ Review Subagents (2 items - CRITICAL)

### Code Review

- [ ] **Code review subagent launched**
  - [ ] Read `skills/code-reviewer/SKILL.md`
  - [ ] Launched: `Task(subagent_type="general-purpose", prompt="Read skills/code-reviewer/SKILL.md and run code review...")`
  - [ ] Completed successfully
- [ ] **Code review findings documented**
  - Correctness issues: **************\_\_**************
  - Readability issues: **************\_\_**************
  - Maintainability issues: **************\_\_**************
  - Accessibility issues: **************\_\_**************
  - i18n issues: **************\_\_**************
- [ ] **All code review findings addressed**
  - [ ] Refactored unclear code
  - [ ] Fixed logic errors
  - [ ] Improved naming
  - [ ] Added missing tests
  - [ ] Other: **************\_\_**************

### Security Review

- [ ] **Security review subagent launched**
  - [ ] Read `skills/security-reviewer/SKILL.md`
  - [ ] Launched: `Task(subagent_type="general-purpose", prompt="Read skills/security-reviewer/SKILL.md and run security review...")`
  - [ ] Completed successfully
- [ ] **Security review findings documented**
  - Injection vulnerabilities: **************\_\_**************
  - XSS vulnerabilities: **************\_\_**************
  - Auth/authorization issues: **************\_\_**************
  - Sensitive data exposure: **************\_\_**************
  - Crypto issues: **************\_\_**************
  - Misconfiguration: **************\_\_**************
- [ ] **All security vulnerabilities fixed**
  - [ ] Input validation added
  - [ ] Output sanitization added
  - [ ] Auth checks corrected
  - [ ] Secrets removed from code
  - [ ] Crypto improved
  - [ ] Other: **************\_\_**************

---

## ✅ Re-validation After Fixes

If any findings were addressed, re-run ALL checks:

- [ ] Re-ran linter: PASS / FAIL
- [ ] Re-ran build: PASS / FAIL
- [ ] Re-ran tests: PASS / FAIL
- [ ] Re-ran code review (if code changed): PASS / FAIL
- [ ] Re-ran security review (if security-sensitive code changed): PASS / FAIL

---

## ✅ Validation Script

- [ ] Ran validation script: `python3 skills/workflow/scripts/validate_phase.py --phase 5`
- [ ] Result: **PASS** / FAIL

---

## ✅ Phase Gate Decision

- [ ] **ALL items above are checked**
- [ ] **ALL checks passed**
- [ ] **ALL findings addressed**
- [ ] **Cleared to proceed to Phase 6 (Commit & Push)**

---

## 🚨 If Any Item is Unchecked

**STOP - DO NOT COMMIT**

1. Complete missing checks
2. Launch missing review subagents
3. Address all findings
4. Re-run validations
5. Return to this checklist

---

## 📝 Notes

Additional observations, decisions, or context:

```
[Your notes here]
```

---

## ✍️ Sign-off

- **Validator:** **************\_\_**************
- **Date:** **************\_\_**************
- **Time spent on Phase 5:** **\_\_** minutes
- **Issues found:** **\_\_**
- **Issues fixed:** **\_\_**

---

**Next Step:** Phase 6 - Commit & Push

Command: `git add . && git commit -m "your message"`
