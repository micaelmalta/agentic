# Agent: Phase Validation Agent

**Purpose:** Execute all Phase 5 validation checks in parallel (formatter, linter, build, tests, code review, security review) with auto-retry for fixable issues.

**Background:** Yes (default mode)

**Phase:** Phase 5 - Validation (Workflow)

---

## Overview

The Phase Validation Agent encapsulates the complete validation phase of the development workflow. It runs 6 critical checks in parallel to ensure code quality, security, and correctness before allowing progression to commit and PR stages.

This agent is designed to be autonomous and operate in background mode by default. It auto-detects the programming language, maps to appropriate tool commands, handles auto-fixable issues (formatting, linting) with retry logic, and immediately escalates security vulnerabilities to the user without retry.

The agent consolidates results from all checks into a single structured JSON output, providing a clear pass/fail status for the entire validation phase and detailed information about each individual check.

---

## Responsibilities

This agent is responsible for:

- [ ] Auto-detect programming language from project structure
- [ ] Run code formatter (language-specific) with auto-fix
- [ ] Run code linter (language-specific) with auto-fix
- [ ] Run build process (if applicable to language)
- [ ] Run test suite to verify tests still pass
- [ ] Spawn code-reviewer subagent to check code quality
- [ ] Spawn security-reviewer subagent to detect vulnerabilities
- [ ] Execute formatter, linter, build, and tests sequentially with retry logic
- [ ] Execute code-reviewer and security-reviewer in parallel
- [ ] Consolidate all results into structured JSON output
- [ ] Auto-retry format/lint issues up to 3 times
- [ ] Stop immediately on security vulnerabilities and escalate to user
- [ ] Track total retries across all checks
- [ ] Measure and report total execution time

---

## Input Schema

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `working_directory` | string | Absolute path to project root | `"/Users/user/project"` |
| `changed_files` | array[string] | List of changed file paths (relative to working_directory) | `["src/api.ts", "tests/api.test.ts"]` |

### Optional Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `language` | string | Auto-detect | Programming language override | `"javascript"` |
| `format_command` | string | Language default | Override formatter command | `"npm run format"` |
| `lint_command` | string | Language default | Override linter command | `"npm run lint"` |
| `build_command` | string | Language default | Override build command | `"npm run build"` |
| `test_command` | string | Language default | Override test command | `"npm test"` |
| `max_retries` | number | 3 | Maximum retry attempts for fixable issues | `3` |
| `skip_build` | boolean | false | Skip build check entirely | `false` |
| `skip_tests` | boolean | false | Skip test check entirely | `false` |

### Input Validation

The agent validates:
- [ ] `working_directory` is present and is an absolute path
- [ ] `changed_files` is present and is an array (can be empty)
- [ ] `working_directory` exists and is accessible
- [ ] If `language` is provided, it must be a supported language
- [ ] `max_retries` must be >= 0 and <= 10
- [ ] All command overrides (if provided) are non-empty strings

**Validation Errors:** Return status "fail" with clear error message listing missing/invalid parameters.

---

## Execution Logic

### Step-by-Step Process

1. **Input Validation**
   - Validate all required parameters are present
   - Check `working_directory` exists and is accessible
   - Apply defaults for optional parameters
   - Return error immediately if validation fails

2. **Language Detection**
   - If `language` parameter provided: Use it
   - Otherwise: Auto-detect from project files:
     - Check for `package.json` → JavaScript/TypeScript
     - Check for `go.mod` → Go
     - Check for `Cargo.toml` → Rust
     - Check for `requirements.txt` or `pyproject.toml` → Python
     - Check for `Gemfile` → Ruby
     - Check for `pom.xml` or `build.gradle` → Java
   - If detection fails: Ask user via AskUserQuestion

3. **Command Mapping**
   - Map language to default commands if not overridden:
     - **JavaScript/TypeScript:**
       - Format: `npx prettier --write .` (or use package.json script)
       - Lint: `npm run lint` (or `npx eslint .`)
       - Build: `npm run build`
       - Test: `npm test`
     - **Python:**
       - Format: `black .`
       - Lint: `ruff check .`
       - Build: `python -m py_compile` (or skip if no build)
       - Test: `pytest`
     - **Go:**
       - Format: `go fmt ./...`
       - Lint: `golangci-lint run`
       - Build: `go build ./...`
       - Test: `go test ./...`
     - **Rust:**
       - Format: `cargo fmt`
       - Lint: `cargo clippy`
       - Build: `cargo build`
       - Test: `cargo test`
     - **Ruby:**
       - Format: `rubocop -a`
       - Lint: `rubocop`
       - Build: N/A (skip)
       - Test: `rspec` or `rake test`
     - **Java:**
       - Format: `mvn spotless:apply` or `./gradlew spotlessApply`
       - Lint: `mvn checkstyle:check` or `./gradlew check`
       - Build: `mvn compile` or `./gradlew build`
       - Test: `mvn test` or `./gradlew test`

4. **Sequential Checks with Retry** (Step 1-4)
   - Execute formatter, linter, build, tests in sequence
   - Each check has independent retry logic
   - Track retry count per check
   - If check fails after max retries: Mark as fail, continue to next check
   - If check passes: Continue to next check

5. **Parallel Review Checks** (Step 5-6)
   - Spawn code-reviewer subagent with changed files
   - Spawn security-reviewer subagent with changed files
   - Both run in parallel
   - Wait for both to complete
   - If security-reviewer finds critical vulnerability: STOP immediately, set status to fail, escalate to user
   - Code-reviewer failures are informational (don't block PR, but report findings)

6. **Result Consolidation**
   - Collect results from all 6 checks
   - Determine overall status:
     - **Pass:** All checks pass (formatter, linter, build, tests, security)
     - **Fail:** Any check fails OR security vulnerability found
   - Calculate total retries across all checks
   - Calculate total execution time
   - Format as structured JSON (see Output Schema)

### Retry Strategy

| Condition | Action | Max Retries |
|-----------|--------|-------------|
| Formatter issues (exit code != 0) | Auto-fix with `--write` or equivalent, retry check | 3 |
| Linter issues (exit code != 0) | Auto-fix with `--fix` or equivalent if available, retry check | 3 |
| Build failure | No auto-fix, retry once in case of transient failure | 1 |
| Test failure | No auto-fix, retry once in case of flaky test | 1 |
| Security vulnerability (critical) | STOP immediately, escalate to user | 0 |

**Retry Backoff:** Wait 2 seconds between retries to allow filesystem changes to propagate.

---

## Output Schema

### Success Response

```json
{
  "status": "pass",
  "execution_time_ms": 12345,
  "total_retries": 2,
  "checks": {
    "formatter": {
      "status": "pass",
      "issues": [],
      "retry_count": 1,
      "command": "npx prettier --write .",
      "execution_time_ms": 1234
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 1,
      "command": "npm run lint",
      "execution_time_ms": 2345
    },
    "build": {
      "status": "pass",
      "errors": [],
      "retry_count": 0,
      "command": "npm run build",
      "execution_time_ms": 3456
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 4567
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 890
    },
    "security_review": {
      "status": "pass",
      "vulnerabilities": [],
      "severity": "none",
      "execution_time_ms": 567
    }
  }
}
```

### Failure Response

```json
{
  "status": "fail",
  "execution_time_ms": 8901,
  "total_retries": 5,
  "checks": {
    "formatter": {
      "status": "fail",
      "issues": [
        "File src/api.ts still has formatting issues after 3 retries"
      ],
      "retry_count": 3,
      "command": "npx prettier --write .",
      "execution_time_ms": 1500
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 2,
      "command": "npm run lint",
      "execution_time_ms": 2000
    },
    "build": {
      "status": "fail",
      "errors": [
        "TypeError: Cannot read property 'map' of undefined at src/api.ts:42"
      ],
      "retry_count": 1,
      "command": "npm run build",
      "execution_time_ms": 3000
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 4000
    },
    "code_review": {
      "status": "fail",
      "findings": [
        "Function 'processData' lacks error handling",
        "Variable naming 'x' is not descriptive"
      ],
      "severity": "medium",
      "execution_time_ms": 800
    },
    "security_review": {
      "status": "pass",
      "vulnerabilities": [],
      "severity": "none",
      "execution_time_ms": 601
    }
  }
}
```

### Critical Security Failure Response

```json
{
  "status": "fail",
  "execution_time_ms": 4567,
  "total_retries": 0,
  "critical_security_issue": true,
  "checks": {
    "formatter": {
      "status": "pass",
      "issues": [],
      "retry_count": 0,
      "command": "npx prettier --write .",
      "execution_time_ms": 1000
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 0,
      "command": "npm run lint",
      "execution_time_ms": 1500
    },
    "build": {
      "status": "pass",
      "errors": [],
      "retry_count": 0,
      "command": "npm run build",
      "execution_time_ms": 2000
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 3000
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 500
    },
    "security_review": {
      "status": "fail",
      "vulnerabilities": [
        "SQL Injection vulnerability in src/database.ts:156 - User input directly interpolated into query",
        "Hardcoded API key found in src/config.ts:23"
      ],
      "severity": "critical",
      "execution_time_ms": 567
    }
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall status: `"pass"` or `"fail"` |
| `execution_time_ms` | integer | Total execution time in milliseconds |
| `total_retries` | integer | Sum of retry counts across all checks |
| `critical_security_issue` | boolean | True if security-reviewer found critical vulnerability |
| `checks` | object | Results for each of the 6 checks (see sub-objects below) |
| `checks.*.status` | string | Check status: `"pass"` or `"fail"` |
| `checks.*.retry_count` | number | Number of retries for this check |
| `checks.*.command` | string | Command executed for this check |
| `checks.*.execution_time_ms` | number | Execution time for this check |

---

## Error Handling

### Recoverable Errors (Retry)

Errors that trigger retry logic:
- **Formatter issues:** Exit code != 0, auto-fix with format command, retry check
- **Linter issues:** Exit code != 0, auto-fix with lint --fix, retry check
- **Build transient failure:** Exit code != 0, retry once (could be filesystem lag)
- **Flaky test failure:** Exit code != 0, retry once (test might be flaky)

### Non-Recoverable Errors (Stop Immediately)

Errors that stop immediately:
- **Security vulnerability (critical):** Return fail, set `critical_security_issue: true`, escalate to user
- **Language detection failure:** Cannot determine project language, ask user
- **Working directory not found:** Invalid path, return fail with error
- **Command not found:** Tool not installed (e.g., prettier not found), return fail with error

### User Escalation

Escalate to user when:
- **Language detection fails:** Ask user to specify language
- **Security vulnerability found:** Present vulnerabilities, ask user how to proceed (fix now, skip, abort)
- **Command not found:** Ask user to install tool or provide override command
- **Max retries exceeded on critical check:** Ask user if they want to proceed despite failures

**Escalation Method:** Use clear console output describing issue and options. For security issues, format vulnerabilities clearly and ask for explicit user decision.

---

## Usage Examples

### Example 1: All Checks Pass

```yaml
# Input
working_directory: "/Users/user/my-project"
changed_files:
  - "src/api.ts"
  - "src/utils.ts"
  - "tests/api.test.ts"
language: "javascript"
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 8901,
  "total_retries": 0,
  "checks": {
    "formatter": {
      "status": "pass",
      "issues": [],
      "retry_count": 0,
      "command": "npx prettier --write .",
      "execution_time_ms": 1200
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 0,
      "command": "npm run lint",
      "execution_time_ms": 1800
    },
    "build": {
      "status": "pass",
      "errors": [],
      "retry_count": 0,
      "command": "npm run build",
      "execution_time_ms": 3000
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 2400
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 300
    },
    "security_review": {
      "status": "pass",
      "vulnerabilities": [],
      "severity": "none",
      "execution_time_ms": 201
    }
  }
}
```

### Example 2: Format/Lint Auto-Fixed with Retry

```yaml
# Input
working_directory: "/Users/user/my-project"
changed_files:
  - "src/api.ts"
language: "javascript"
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 10234,
  "total_retries": 3,
  "checks": {
    "formatter": {
      "status": "pass",
      "issues": [],
      "retry_count": 2,
      "command": "npx prettier --write .",
      "execution_time_ms": 2400
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 1,
      "command": "npm run lint -- --fix",
      "execution_time_ms": 2100
    },
    "build": {
      "status": "pass",
      "errors": [],
      "retry_count": 0,
      "command": "npm run build",
      "execution_time_ms": 3000
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 2400
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 200
    },
    "security_review": {
      "status": "pass",
      "vulnerabilities": [],
      "severity": "none",
      "execution_time_ms": 134
    }
  }
}
```

### Example 3: Critical Security Vulnerability Found

```yaml
# Input
working_directory: "/Users/user/my-project"
changed_files:
  - "src/database.ts"
language: "javascript"
```

```json
// Output
{
  "status": "fail",
  "execution_time_ms": 5678,
  "total_retries": 0,
  "critical_security_issue": true,
  "checks": {
    "formatter": {
      "status": "pass",
      "issues": [],
      "retry_count": 0,
      "command": "npx prettier --write .",
      "execution_time_ms": 1100
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 0,
      "command": "npm run lint",
      "execution_time_ms": 1600
    },
    "build": {
      "status": "pass",
      "errors": [],
      "retry_count": 0,
      "command": "npm run build",
      "execution_time_ms": 2800
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "npm test",
      "execution_time_ms": 2400
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 300
    },
    "security_review": {
      "status": "fail",
      "vulnerabilities": [
        "SQL Injection in src/database.ts:156 - User input directly concatenated into SQL query without parameterization"
      ],
      "severity": "critical",
      "execution_time_ms": 478
    }
  }
}
```

---

## Integration with Workflow

### When Agent is Invoked

The workflow skill spawns this agent at:
- **Phase 5: Validation**
- Condition: After Phase 4 (Testing) passes and before Phase 6 (Commit)
- Mode: Background (default)

### Expected Workflow

```
1. Workflow Phase 4 (Testing) completes successfully
2. Workflow spawns phase-validation-agent in background
3. Agent runs all 6 validation checks
4. Agent completes and returns structured JSON result
5. Workflow validates agent output:
   - If status = "pass": Proceed to Phase 6 (Commit)
   - If status = "fail" with critical_security_issue = true:
     * STOP workflow
     * Present security vulnerabilities to user
     * Ask user to fix vulnerabilities before continuing
   - If status = "fail" with non-critical issues:
     * Present issues to user
     * Ask user if they want to proceed or fix issues
6. User makes decision, workflow continues or stops accordingly
```

---

## Testing

### Unit Tests

Test cases to implement:

1. **Happy Path: All Checks Pass**
   - Input: Valid project with clean code
   - Expected: Status = pass, all checks pass, no retries

2. **Retry Path: Format/Lint Auto-Fixed**
   - Input: Valid project with formatting and linting issues
   - Expected: Status = pass, formatter and linter retry > 0

3. **Failure Path: Build Fails**
   - Input: Valid project with TypeScript compilation error
   - Expected: Status = fail, build check fails, other checks pass

4. **Critical Security Path: Vulnerability Found**
   - Input: Project with SQL injection vulnerability
   - Expected: Status = fail, critical_security_issue = true, security_review fails

5. **Mixed Results Path: Some Pass, Some Fail**
   - Input: Project with linting issues and test failures
   - Expected: Status = fail, specific checks fail, others pass

6. **Language Detection: Auto-Detect JavaScript**
   - Input: No language parameter, project has package.json
   - Expected: Language detected as javascript, appropriate commands used

7. **Language Detection: Auto-Detect Python**
   - Input: No language parameter, project has pyproject.toml
   - Expected: Language detected as python, appropriate commands used

8. **Validation Error: Missing Working Directory**
   - Input: No working_directory parameter
   - Expected: Status = fail, validation error

9. **Command Override: Custom Test Command**
   - Input: test_command override provided
   - Expected: Custom command used instead of default

10. **Max Retries Exceeded: Format Fails 3 Times**
    - Input: Project with persistent formatting issues
    - Expected: Status = fail, formatter retry_count = 3

### Integration Tests

Test with real workflow:

1. Run agent standalone with sample JavaScript project
2. Run agent standalone with sample Python project
3. Run agent as part of full workflow (Phase 5)
4. Test background execution mode with TaskOutput
5. Test error handling and user escalation
6. Test retry logic with simulated flaky checks
7. Test security escalation path with injected vulnerability
8. Test parallel review checks (code-reviewer + security-reviewer)

---

## Performance Considerations

- **Execution Time:** Expected range 5-30 seconds (depends on project size)
- **Background Mode:** Recommended (default) - Phase 5 can be slow
- **Resource Usage:**
  - Memory: Low-medium (depends on subagents)
  - CPU: Medium (formatter, linter, build)
  - Disk: Low (reading/writing formatted files)
- **Timeout:** Default 300 seconds (5 minutes), configurable
- **Parallel Execution:** code-reviewer and security-reviewer run in parallel to save time

---

## Dependencies

### Required Tools

- [ ] Bash (for executing commands)
- [ ] Read (for reading project files)
- [ ] Grep (for detecting project structure)
- [ ] Task (for spawning subagents)

### Required Skills

- [ ] code-reviewer skill (for code quality check)
- [ ] security-reviewer skill (for security check)

### External Dependencies (Language-Specific)

**JavaScript/TypeScript:**
- [ ] Node.js and npm
- [ ] prettier (formatter)
- [ ] eslint (linter)
- [ ] TypeScript compiler (if TypeScript project)

**Python:**
- [ ] Python 3.x
- [ ] black (formatter)
- [ ] ruff or flake8 (linter)
- [ ] pytest (test runner)

**Go:**
- [ ] Go toolchain
- [ ] golangci-lint (linter)

**Rust:**
- [ ] Rust toolchain (rustc, cargo)
- [ ] clippy (linter)

**Ruby:**
- [ ] Ruby runtime
- [ ] rubocop (formatter + linter)
- [ ] rspec or minitest (test runner)

**Java:**
- [ ] JDK
- [ ] Maven or Gradle
- [ ] spotless or google-java-format (formatter)
- [ ] checkstyle or spotbugs (linter)

---

## Configuration

### Environment Variables

No environment variables required. All configuration is provided via input parameters.

### Project Files

Agent reads these files for language detection:
- `package.json` - JavaScript/TypeScript indicator
- `go.mod` - Go indicator
- `Cargo.toml` - Rust indicator
- `requirements.txt`, `pyproject.toml` - Python indicator
- `Gemfile` - Ruby indicator
- `pom.xml`, `build.gradle` - Java indicator

---

## Troubleshooting

### Common Issues

**Issue 1: Language Detection Fails**
- Symptoms: Agent asks user to specify language
- Cause: Project structure doesn't match any known language patterns
- Solution: Provide explicit `language` parameter in input

**Issue 2: Formatter/Linter Command Not Found**
- Symptoms: Status = fail, error "command not found: prettier"
- Cause: Tool not installed in project or globally
- Solution: Install required tools (e.g., `npm install --save-dev prettier eslint`) or provide custom command override

**Issue 3: Max Retries Exceeded on Format/Lint**
- Symptoms: Status = fail, retry_count = 3 for formatter/linter
- Cause: Auto-fix not working correctly, or code has persistent issues
- Solution: Manually review formatting/linting errors, fix manually, or adjust configuration

**Issue 4: Build Fails with No Clear Error**
- Symptoms: Build check fails, errors array is empty or unclear
- Cause: Build command output not captured correctly
- Solution: Check build command logs manually, verify build command is correct

**Issue 5: Tests Fail Intermittently**
- Symptoms: Tests pass sometimes, fail other times
- Cause: Flaky tests (race conditions, timing issues)
- Solution: Fix flaky tests, increase timeout, or disable flaky tests temporarily

**Issue 6: Security Review Takes Too Long**
- Symptoms: Agent times out or takes >5 minutes
- Cause: Large codebase, many files to analyze
- Solution: Limit `changed_files` to only relevant files, or increase timeout

### Debug Mode

Enable verbose logging by inspecting each check's output:
```yaml
# Input (no special debug parameter needed)
# Review individual check results in output JSON
```

Check command outputs manually:
```bash
cd <working_directory>
npx prettier --write .
npm run lint
npm run build
npm test
```

---

## Changelog

### Version 1.0 (2026-02-05)
- Initial implementation
- Support for 6 languages: JavaScript/TypeScript, Python, Go, Rust, Ruby, Java
- Parallel code-reviewer + security-reviewer execution
- Auto-retry logic for formatter and linter
- Critical security escalation
- Structured JSON output

### Future Enhancements

Planned improvements:
- [ ] Support for more languages (C#, PHP, Swift, Kotlin)
- [ ] Configurable retry backoff strategy
- [ ] Parallel execution of all checks (not just reviews)
- [ ] Incremental validation (only changed files)
- [ ] Cache validation results to skip redundant checks
- [ ] Integration with CI/CD systems (GitHub Actions, CircleCI)

---

## See Also

- **Agent System:** `skills/agents/README.md` - Overview of all agents
- **Workflow Skill:** `skills/workflow/SKILL.md` - Orchestrator
- **Code Reviewer Skill:** `skills/code-reviewer/SKILL.md` - Code quality review
- **Security Reviewer Skill:** `skills/security-reviewer/SKILL.md` - Security audit
- **Protocol Documentation:** `skills/agents/phase-validation-agent/protocol.md` - Detailed schemas

---

## Agent Checklist

Before marking agent complete, verify:

- [x] Input schema documented with examples
- [x] Output schema documented with examples (success, failure, critical security)
- [x] Execution logic clearly described (6 steps)
- [x] Retry strategy defined (per check type)
- [x] Error handling comprehensive (recoverable vs. non-recoverable)
- [x] User escalation implemented (language detection, security, command not found)
- [x] Usage examples provided (3 examples: success, retry, security)
- [x] Integration with workflow documented
- [x] Test cases defined (10 unit tests, 8 integration tests)
- [x] Dependencies listed (tools, skills, external)
- [x] Troubleshooting guide included (6 common issues)
- [x] Performance considerations documented

---

**Agent Version:** 1.0
**Last Updated:** 2026-02-05
