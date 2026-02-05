# Agent: Phase Testing Agent

**Purpose:** Run all project tests with automatic retry logic and comprehensive failure reporting
**Background:** Yes (default mode)
**Phase:** Phase 4 (Testing Validation) in workflow skill

---

## Overview

The phase-testing-agent is a specialized autonomous agent responsible for executing project tests during the workflow's testing phase. It automatically detects the project's programming language and stack, executes appropriate test commands, and handles transient test failures through intelligent retry logic.

This agent encapsulates the complexity of running tests across multiple language ecosystems (JavaScript/TypeScript, Python, Go, Ruby, Rust, Java) and provides a consistent interface for the workflow orchestrator. It runs in background mode by default, allowing the workflow to proceed with other tasks while tests execute.

The agent is designed to fail gracefully and escalate to the user only after exhausting retry attempts, making it suitable for CI/CD environments where test flakiness is common.

---

## Responsibilities

This agent is responsible for:

- [ ] Auto-detect programming language and test framework from project structure
- [ ] Execute appropriate test commands based on detected language
- [ ] Run build commands for frontend projects and compiled languages
- [ ] Parse test output to extract pass/fail statistics
- [ ] Implement intelligent retry logic for flaky tests (max 3 retries with exponential backoff)
- [ ] Detect and report specific failing test cases with error messages
- [ ] Return structured JSON output with comprehensive test results
- [ ] Escalate to user via AskUserQuestion when stuck after max retries
- [ ] Track execution time and retry count for monitoring
- [ ] Handle edge cases: missing test scripts, build failures, test timeouts

---

## Input Schema

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `working_directory` | string | Absolute path to project root | `"/Users/user/project"` |

### Optional Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `language` | string | auto-detect | Override language detection (js, python, go, ruby, rust, java) | `"javascript"` |
| `test_command` | string | auto-detect | Override default test command | `"npm run test:ci"` |
| `build_command` | string | auto-detect | Override default build command | `"npm run build"` |
| `max_retries` | number | `3` | Maximum retry attempts on test failure | `5` |
| `retry_backoff_ms` | array | `[5000, 10000, 15000]` | Backoff delays between retries (milliseconds) | `[3000, 6000, 9000]` |
| `run_build` | boolean | auto-detect | Force build step on/off | `true` |
| `timeout_seconds` | number | `300` | Maximum execution time per test run | `600` |

### Input Validation

The agent validates:
- [ ] `working_directory` is present and is an absolute path
- [ ] `working_directory` exists and is a directory
- [ ] `max_retries` is between 0 and 10
- [ ] `timeout_seconds` is positive
- [ ] If `language` is provided, it must be one of: js, javascript, typescript, python, go, ruby, rust, java
- [ ] If `retry_backoff_ms` is provided, array length matches `max_retries`
- [ ] Project files exist (package.json, go.mod, etc.) if language is auto-detected

**Validation Errors:** Return status "fail" with error object containing missing/invalid parameter details.

---

## Execution Logic

### Step-by-Step Process

1. **Input Validation**
   - Validate required parameters (working_directory)
   - Apply defaults for optional parameters
   - Return error if validation fails

2. **Language Detection**
   - If `language` parameter provided, use it
   - Otherwise, scan working_directory for language indicators:
     - `package.json` → JavaScript/TypeScript
     - `pyproject.toml`, `setup.py`, `requirements.txt` → Python
     - `go.mod` → Go
     - `Gemfile`, `*.gemspec` → Ruby
     - `Cargo.toml` → Rust
     - `pom.xml`, `build.gradle` → Java
   - If multiple indicators found, prioritize based on confidence
   - If no indicators found, return error asking user to specify language

3. **Test/Build Command Resolution**
   - If `test_command` provided, use it
   - Otherwise, map detected language to default test command:
     - JavaScript/TypeScript: `npm test` (check for `npm`, `yarn`, `pnpm`)
     - Python: `pytest` (fallback to `python -m pytest`, then `python -m unittest`)
     - Go: `go test -race ./...`
     - Ruby: `bundle exec rspec` (fallback to `rake test`)
     - Rust: `cargo test`
     - Java: `mvn test` (fallback to `gradle test`)
   - If `build_command` provided, use it
   - Otherwise, determine if build is needed:
     - JavaScript with build script in package.json: `npm run build`
     - Go: No build needed (tests build)
     - Rust: No build needed (cargo test builds)
     - Java: Build is implicit in test command

4. **Build Execution (if applicable)**
   - If build step determined necessary:
     - Execute build command via Bash tool
     - Set timeout to `timeout_seconds`
     - If build fails, return fail status immediately (no retry)
     - If build succeeds, proceed to tests

5. **Test Execution Loop**
   - Attempt 1: Run test command via Bash tool
   - Parse output to detect pass/fail and extract failing tests
   - If all tests pass: Proceed to step 6
   - If tests fail:
     - Increment retry_count
     - If retry_count < max_retries:
       - Wait for retry_backoff_ms[retry_count]
       - Analyze failure (flaky vs deterministic)
       - Retry test execution
     - If retry_count >= max_retries:
       - Escalate to user via AskUserQuestion
       - Options: "Retry again", "Skip tests (not recommended)", "Abort workflow"
       - If user chooses "Retry again", reset retry_count and continue
       - If user chooses "Skip tests", return fail status with user override flag
       - If user chooses "Abort", return fail status

6. **Result Consolidation**
   - Collect test statistics (run, passed, failed)
   - Extract failing test names and error messages
   - Calculate total execution time
   - Format as structured JSON
   - Return to caller

### Retry Strategy

| Condition | Action | Max Retries | Backoff |
|-----------|--------|-------------|---------|
| Tests fail with exit code 1 | Retry with exponential backoff | 3 | 5s, 10s, 15s |
| Tests timeout | Increase timeout by 50%, retry | 3 | 5s, 10s, 15s |
| Build fails | Stop immediately, no retry | 0 | N/A |
| Command not found | Stop immediately, report missing tool | 0 | N/A |
| Working directory not found | Stop immediately, validation error | 0 | N/A |

---

## Output Schema

### Success Response

```json
{
  "status": "pass",
  "execution_time_ms": 12340,
  "retry_count": 0,
  "tests_run": 42,
  "tests_passed": 42,
  "tests_failed": 0,
  "build_status": "pass",
  "failing_tests": [],
  "language": "javascript",
  "test_command": "npm test",
  "build_command": "npm run build"
}
```

### Failure Response

```json
{
  "status": "fail",
  "execution_time_ms": 45678,
  "retry_count": 3,
  "tests_run": 42,
  "tests_passed": 38,
  "tests_failed": 4,
  "build_status": "pass",
  "failing_tests": [
    {
      "name": "UserService.createUser should validate email format",
      "file": "test/services/user.test.js",
      "error": "AssertionError: expected false to be true"
    },
    {
      "name": "AuthController.login should return 401 for invalid credentials",
      "file": "test/controllers/auth.test.js",
      "error": "Timeout: test exceeded 5000ms"
    },
    {
      "name": "PaymentService.processPayment should handle declined cards",
      "file": "test/services/payment.test.js",
      "error": "TypeError: Cannot read property 'status' of undefined"
    },
    {
      "name": "OrderModel.calculateTotal should sum line items",
      "file": "test/models/order.test.js",
      "error": "AssertionError: expected 99.97 to equal 99.99"
    }
  ],
  "language": "javascript",
  "test_command": "npm test",
  "build_command": "npm run build",
  "errors": [
    {
      "type": "test_failure",
      "message": "4 tests failed after 3 retry attempts",
      "context": {
        "failed_count": 4,
        "retry_count": 3
      }
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"pass"` if all tests passed, `"fail"` if any tests failed or build failed |
| `execution_time_ms` | number | Total execution time in milliseconds (including all retries) |
| `retry_count` | number | Number of retry attempts made (0 if tests passed on first try) |
| `tests_run` | number | Total number of tests executed |
| `tests_passed` | number | Number of tests that passed |
| `tests_failed` | number | Number of tests that failed |
| `build_status` | string | `"pass"`, `"fail"`, or `"skipped"` (if no build step) |
| `failing_tests` | array | List of failing test objects (name, file, error) |
| `language` | string | Detected or specified programming language |
| `test_command` | string | Test command that was executed |
| `build_command` | string | Build command that was executed (if applicable) |
| `errors` | array | List of error objects (only present if status is fail) |

---

## Error Handling

### Recoverable Errors

Errors that trigger retry logic:
- **Test failures (exit code 1)**: Retry with exponential backoff. Tests may be flaky due to timing, race conditions, or external dependencies.
- **Test timeouts**: Increase timeout by 50% and retry. First timeout may indicate slow system, subsequent runs may succeed.
- **Network-related test failures**: Retry with backoff. External API calls in tests may be temporarily unavailable.

### Non-Recoverable Errors

Errors that stop immediately and return fail:
- **Build failures**: Build errors are deterministic. Return fail with build error details. User must fix code before retrying.
- **Test command not found**: Missing test framework or incorrect command. Return fail asking user to install dependencies or provide correct command.
- **Working directory not found**: Invalid path provided. Return fail with validation error.
- **Language detection failed**: No language indicators found and no explicit language provided. Return fail asking user to specify language parameter.
- **Permission errors**: Cannot read/write files in working directory. Return fail with permission error details.
- **Out of memory errors**: System resource exhaustion. Return fail immediately, no retry will help.

### User Escalation

Escalate to user when:
- Max retries exceeded (3 attempts by default)
- Test failures persist across all retry attempts
- Ambiguous situation: Cannot determine if failure is flaky or deterministic
- User input required: Need to know whether to continue despite test failures

**Escalation Method:** Use AskUserQuestion tool with these options:

```
"Tests failed after 3 retry attempts. What would you like to do?

Failing tests (4):
1. UserService.createUser should validate email format
2. AuthController.login should return 401 for invalid credentials
3. PaymentService.processPayment should handle declined cards
4. OrderModel.calculateTotal should sum line items

Options:
A) Retry again (will attempt 3 more times)
B) Skip tests and continue workflow (NOT RECOMMENDED - may merge broken code)
C) Abort workflow and fix tests manually

Your choice (A/B/C):"
```

---

## Usage Examples

### Example 1: JavaScript Project - All Tests Pass

```yaml
# Input
working_directory: "/Users/user/my-app"
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 8234,
  "retry_count": 0,
  "tests_run": 127,
  "tests_passed": 127,
  "tests_failed": 0,
  "build_status": "pass",
  "failing_tests": [],
  "language": "javascript",
  "test_command": "npm test",
  "build_command": "npm run build"
}
```

### Example 2: Python Project - Tests Pass After Retry

```yaml
# Input
working_directory: "/Users/user/python-api"
language: "python"
test_command: "pytest -v"
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 15678,
  "retry_count": 1,
  "tests_run": 89,
  "tests_passed": 89,
  "tests_failed": 0,
  "build_status": "skipped",
  "failing_tests": [],
  "language": "python",
  "test_command": "pytest -v",
  "build_command": null
}
```

### Example 3: Go Project - Tests Fail After Max Retries

```yaml
# Input
working_directory: "/Users/user/go-service"
max_retries: 2
```

```json
// Output
{
  "status": "fail",
  "execution_time_ms": 23456,
  "retry_count": 2,
  "tests_run": 54,
  "tests_passed": 52,
  "tests_failed": 2,
  "build_status": "skipped",
  "failing_tests": [
    {
      "name": "TestUserRepository_Create",
      "file": "internal/repository/user_test.go",
      "error": "Error: database connection refused"
    },
    {
      "name": "TestAuthService_ValidateToken",
      "file": "internal/service/auth_test.go",
      "error": "Error: context deadline exceeded"
    }
  ],
  "language": "go",
  "test_command": "go test -race ./...",
  "build_command": null,
  "errors": [
    {
      "type": "test_failure",
      "message": "2 tests failed after 2 retry attempts",
      "context": {
        "failed_count": 2,
        "retry_count": 2
      }
    }
  ]
}
```

### Example 4: Build Failure (Immediate Fail)

```yaml
# Input
working_directory: "/Users/user/ts-app"
```

```json
// Output
{
  "status": "fail",
  "execution_time_ms": 3456,
  "retry_count": 0,
  "tests_run": 0,
  "tests_passed": 0,
  "tests_failed": 0,
  "build_status": "fail",
  "failing_tests": [],
  "language": "typescript",
  "test_command": "npm test",
  "build_command": "npm run build",
  "errors": [
    {
      "type": "build_failure",
      "message": "Build failed, tests not run",
      "context": {
        "exit_code": 2,
        "stderr": "ERROR in src/services/user.ts:42:15\nTS2322: Type 'string' is not assignable to type 'number'."
      }
    }
  ]
}
```

---

## Integration with Workflow

### When Agent is Invoked

The workflow skill spawns this agent at:
- **Phase 4: Testing Validation** (after code execution, before validation phase)
- Condition: After developer skill completes implementation
- Mode: Background (default)

### Expected Workflow

```
1. Workflow Phase 4 starts
2. Workflow spawns phase-testing-agent in background with working_directory
3. Agent auto-detects language and test framework
4. Agent runs build (if needed) and tests
5. If tests fail, agent retries up to 3 times with backoff
6. Agent completes and returns structured JSON result
7. Workflow validates agent output
8. If status = "pass": Proceed to Phase 5 (Validation)
9. If status = "fail":
   - Workflow presents failing tests to user
   - User decides: fix tests, retry, or skip (not recommended)
   - If fix: Return to Phase 3 (Execute)
   - If retry: Spawn agent again
   - If skip: Continue to Phase 5 with warning
```

---

## Testing

### Unit Tests

Test cases to implement:

1. **Happy Path - JavaScript**
   - Input: Valid working_directory with package.json, all tests pass
   - Expected: status = "pass", tests_run > 0, retry_count = 0

2. **Happy Path - Python**
   - Input: Valid working_directory with pytest, all tests pass
   - Expected: status = "pass", tests_run > 0, retry_count = 0

3. **Happy Path - Go**
   - Input: Valid working_directory with go.mod, all tests pass
   - Expected: status = "pass", tests_run > 0, retry_count = 0

4. **Retry Path - Flaky Test**
   - Input: Valid parameters, simulate flaky test that fails first time, passes second time
   - Expected: status = "pass", retry_count = 1

5. **Retry Path - Timeout Then Success**
   - Input: Valid parameters, simulate test timeout on first run, success on retry
   - Expected: status = "pass", retry_count = 1

6. **Failure Path - Persistent Test Failures**
   - Input: Valid parameters, simulate deterministic test failures
   - Expected: status = "fail", retry_count = 3, failing_tests array populated

7. **Failure Path - Build Failure**
   - Input: Valid parameters with TypeScript, simulate build error
   - Expected: status = "fail", retry_count = 0, build_status = "fail", tests_run = 0

8. **Validation Errors - Missing Directory**
   - Input: working_directory = "/nonexistent/path"
   - Expected: status = "fail", validation error

9. **Validation Errors - Invalid Max Retries**
   - Input: max_retries = -1
   - Expected: status = "fail", validation error

10. **Edge Case - Multiple Languages**
    - Input: working_directory with both package.json and go.mod
    - Expected: Detect primary language based on confidence, return appropriate command

11. **Edge Case - No Test Command**
    - Input: Language detected but no test script in package.json
    - Expected: status = "fail", error indicating missing test command

12. **Edge Case - User Override**
    - Input: language = "python", test_command = "make test"
    - Expected: Use provided commands instead of auto-detection

### Integration Tests

Test with real projects:

1. Run agent standalone with sample JavaScript project (create-react-app)
2. Run agent standalone with sample Python project (Flask app)
3. Run agent standalone with sample Go project (gin server)
4. Run agent as part of full workflow (Phase 4)
5. Test background execution mode (workflow continues during test run)
6. Test error handling: Kill test process mid-execution
7. Test retry logic: Use artificially flaky test suite
8. Test user escalation: Trigger max retry scenario and verify AskUserQuestion

---

## Performance Considerations

- **Execution Time:** Expected range 10-300 seconds (depends on test suite size)
- **Background Mode:** Recommended (default) for all test runs > 5 seconds
- **Resource Usage:**
  - Memory: Depends on test framework and project size (typically 100-500 MB)
  - CPU: Can spike to 100% during test execution
  - Network: May be used if tests call external APIs
- **Timeout:** Default 300 seconds (5 minutes), configurable via timeout_seconds parameter
- **Backoff Strategy:** Exponential (5s, 10s, 15s) prevents rapid retry loops

---

## Dependencies

### Required Tools

- [ ] Bash tool (for executing test and build commands)
- [ ] Read tool (for reading project files to detect language)
- [ ] AskUserQuestion tool (for user escalation after max retries)

### Required Skills

None. This agent is self-contained.

### External Dependencies

Language-specific test frameworks and tools must be installed in the project:

- [ ] **JavaScript/TypeScript:** npm, yarn, or pnpm + test framework (Jest, Mocha, Vitest, etc.)
- [ ] **Python:** pytest or unittest
- [ ] **Go:** Go toolchain (go test)
- [ ] **Ruby:** bundle + rspec or minitest
- [ ] **Rust:** cargo
- [ ] **Java:** Maven or Gradle

---

## Configuration

### Environment Variables

No environment variables required. Agent operates based on input parameters only.

### Project Files

Agent reads these files for language detection and configuration:

- `package.json` - JavaScript/TypeScript detection, test/build script discovery
- `pyproject.toml`, `setup.py`, `requirements.txt` - Python detection
- `go.mod` - Go detection
- `Gemfile`, `*.gemspec` - Ruby detection
- `Cargo.toml` - Rust detection
- `pom.xml`, `build.gradle` - Java detection

---

## Troubleshooting

### Common Issues

**Issue 1: Language detection fails with "No language indicators found"**
- Symptoms: Agent returns fail status with error "Cannot detect language"
- Cause: Working directory missing standard language files (package.json, go.mod, etc.)
- Solution: Provide explicit `language` parameter in agent input

**Issue 2: Test command not found (e.g., "pytest: command not found")**
- Symptoms: Agent returns fail status with "command not found" error
- Cause: Test framework not installed or not in PATH
- Solution: Install test dependencies (`npm install`, `pip install pytest`, etc.) or provide explicit `test_command` parameter

**Issue 3: Tests timeout repeatedly**
- Symptoms: Agent retries all 3 times with timeout errors
- Cause: Test suite is slower than default timeout (300s) or system is under heavy load
- Solution: Increase `timeout_seconds` parameter (e.g., 600 for 10 minutes)

**Issue 4: Build passes but tests not found**
- Symptoms: status = "fail", tests_run = 0, build_status = "pass"
- Cause: Test command incorrect or test files not in expected location
- Solution: Check test command in package.json or provide explicit `test_command` parameter

**Issue 5: Flaky tests cause retries on every run**
- Symptoms: Agent always uses 1-2 retries but eventually passes
- Cause: Tests have timing issues or race conditions
- Solution: Fix flaky tests in code. In meantime, increase `max_retries` or disable specific flaky tests

**Issue 6: Agent succeeds but GitHub Actions fails**
- Symptoms: Agent reports "pass" but CI fails on same code
- Cause: Different test environment (Node version, dependencies, etc.)
- Solution: Ensure local environment matches CI environment, or run tests in Docker container

### Debug Mode

Enable verbose logging by examining Bash tool output:

```yaml
# Input
working_directory: "/Users/user/project"
# No explicit debug flag, check Bash tool output in conversation for details
```

To debug language detection:
1. Check Read tool calls for project files (package.json, etc.)
2. Verify language detection logic in agent output
3. Override with explicit `language` parameter if detection is wrong

To debug test failures:
1. Examine `failing_tests` array for specific test names and errors
2. Run test command manually in terminal: `cd working_directory && <test_command>`
3. Check if test failures are consistent or flaky
4. Review test logs for stack traces and assertion errors

---

## Changelog

### Version 1.0 (2026-02-05)
- Initial implementation
- Support for JavaScript, Python, Go, Ruby, Rust, Java
- Auto-detection of language and test framework
- Retry logic with exponential backoff (max 3 retries)
- Build step for frontend and compiled languages
- Structured JSON output with failing test details
- User escalation via AskUserQuestion after max retries
- Background execution mode (default)

### Future Enhancements

Planned improvements:
- [ ] Support for additional languages (PHP, C#, Swift, Kotlin)
- [ ] Parallel test execution across multiple test suites
- [ ] Test coverage reporting (coverage percentage, uncovered lines)
- [ ] Integration with code coverage tools (Istanbul, coverage.py, etc.)
- [ ] Automatic test categorization (unit, integration, e2e)
- [ ] Selective test execution (only run tests for changed files)
- [ ] Test impact analysis (which tests cover which code)
- [ ] Smart retry (only retry flaky tests, not deterministic failures)
- [ ] Test result caching (skip tests if code unchanged)
- [ ] Integration with CI/CD platforms (CircleCI, GitHub Actions) for test history

---

## See Also

- **Agent System:** `skills/agents/README.md` - Overview of all phase agents
- **Workflow Skill:** `skills/workflow/SKILL.md` - Orchestrator that spawns this agent
- **Testing Skill:** `skills/testing/SKILL.md` - Manual test design and execution
- **Developer Skill:** `skills/developer/SKILL.md` - TDD implementation that creates tests
- **CI/CD Skill:** `skills/ci-cd/SKILL.md` - CI/CD pipeline configuration

---

## Agent Checklist

Before marking agent complete, verify:

- [x] Input schema documented with examples
- [x] Output schema documented with examples
- [x] Execution logic clearly described (6-step process)
- [x] Retry strategy defined (exponential backoff, max 3 retries)
- [x] Error handling comprehensive (recoverable vs non-recoverable)
- [x] User escalation implemented (AskUserQuestion after max retries)
- [x] Usage examples provided (4 examples: success, retry, failure, build fail)
- [x] Integration with workflow documented (Phase 4)
- [x] Test cases defined (12 unit tests, 8 integration tests)
- [x] Dependencies listed (Bash, Read, AskUserQuestion tools)
- [x] Troubleshooting guide included (6 common issues)
- [x] Performance considerations documented (execution time, resources, timeout)

---

**Agent Version:** 1.0
**Last Updated:** 2026-02-05
