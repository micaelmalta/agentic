# Phase Testing Agent Protocol

**Version:** 1.0
**Last Updated:** 2026-02-05

---

## Overview

This document defines the input/output protocol for the phase-testing-agent. The agent accepts structured JSON input and returns structured JSON output, enabling programmatic invocation and result parsing by the workflow orchestrator.

---

## Input Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["working_directory"],
  "properties": {
    "working_directory": {
      "type": "string",
      "description": "Absolute path to project root directory",
      "pattern": "^/",
      "examples": [
        "/Users/user/my-project",
        "/home/developer/app",
        "/workspace/service"
      ]
    },
    "language": {
      "type": "string",
      "enum": [
        "javascript",
        "js",
        "typescript",
        "ts",
        "python",
        "py",
        "go",
        "golang",
        "ruby",
        "rb",
        "rust",
        "rs",
        "java"
      ],
      "description": "Programming language (auto-detected if not provided)",
      "examples": ["javascript", "python", "go"]
    },
    "test_command": {
      "type": "string",
      "description": "Override default test command",
      "examples": [
        "npm run test:ci",
        "pytest -v --cov",
        "go test -race -v ./...",
        "bundle exec rspec --format documentation",
        "cargo test --all-features",
        "mvn test -DskipITs=false"
      ]
    },
    "build_command": {
      "type": "string",
      "description": "Override default build command (set to null to skip build)",
      "examples": [
        "npm run build",
        "yarn build",
        "go build ./...",
        "cargo build --release",
        "mvn clean package"
      ]
    },
    "max_retries": {
      "type": "integer",
      "minimum": 0,
      "maximum": 10,
      "default": 3,
      "description": "Maximum retry attempts on test failure",
      "examples": [3, 5, 0]
    },
    "retry_backoff_ms": {
      "type": "array",
      "items": {
        "type": "integer",
        "minimum": 0
      },
      "description": "Backoff delays between retries in milliseconds (length should match max_retries)",
      "default": [5000, 10000, 15000],
      "examples": [
        [5000, 10000, 15000],
        [3000, 6000, 9000, 12000, 15000],
        [10000, 20000, 30000]
      ]
    },
    "run_build": {
      "type": "boolean",
      "description": "Force build step on (true) or off (false). If omitted, auto-detected based on language/project",
      "examples": [true, false]
    },
    "timeout_seconds": {
      "type": "integer",
      "minimum": 1,
      "default": 300,
      "description": "Maximum execution time per test run (5 minutes default)",
      "examples": [300, 600, 1800]
    }
  },
  "additionalProperties": false
}
```

---

## Input Examples

### Minimal Input (Auto-detect Everything)

```json
{
  "working_directory": "/Users/user/my-app"
}
```

### JavaScript Project with Custom Commands

```json
{
  "working_directory": "/Users/user/react-app",
  "language": "javascript",
  "test_command": "npm run test:ci",
  "build_command": "npm run build:production",
  "max_retries": 5,
  "timeout_seconds": 600
}
```

### Python Project with No Build

```json
{
  "working_directory": "/Users/user/flask-api",
  "language": "python",
  "test_command": "pytest -v --cov=app --cov-report=html",
  "run_build": false,
  "max_retries": 2
}
```

### Go Project with Custom Retry Strategy

```json
{
  "working_directory": "/Users/user/go-service",
  "language": "go",
  "test_command": "go test -race -coverprofile=coverage.out ./...",
  "max_retries": 4,
  "retry_backoff_ms": [3000, 6000, 9000, 12000],
  "timeout_seconds": 900
}
```

---

## Output Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "status",
    "execution_time_ms",
    "retry_count",
    "tests_run",
    "tests_passed",
    "tests_failed",
    "build_status",
    "failing_tests",
    "language",
    "test_command"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["pass", "fail"],
      "description": "Overall test status (pass if all tests passed, fail otherwise)"
    },
    "execution_time_ms": {
      "type": "integer",
      "minimum": 0,
      "description": "Total execution time in milliseconds (including all retries)"
    },
    "retry_count": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of retry attempts made (0 if tests passed on first try)"
    },
    "tests_run": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of tests executed"
    },
    "tests_passed": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of tests that passed"
    },
    "tests_failed": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of tests that failed"
    },
    "build_status": {
      "type": "string",
      "enum": ["pass", "fail", "skipped"],
      "description": "Build step status (skipped if no build step)"
    },
    "failing_tests": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "error"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Full test name or description"
          },
          "file": {
            "type": "string",
            "description": "File path where test is defined (may be null if not parseable)"
          },
          "error": {
            "type": "string",
            "description": "Error message or assertion failure"
          }
        }
      },
      "description": "List of failing test objects (empty array if all tests passed)"
    },
    "language": {
      "type": "string",
      "description": "Detected or specified programming language"
    },
    "test_command": {
      "type": "string",
      "description": "Test command that was executed"
    },
    "build_command": {
      "type": ["string", "null"],
      "description": "Build command that was executed (null if no build step)"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "message"],
        "properties": {
          "type": {
            "type": "string",
            "description": "Error type (e.g., test_failure, build_failure, validation_error)"
          },
          "message": {
            "type": "string",
            "description": "Human-readable error message"
          },
          "context": {
            "type": "object",
            "description": "Additional error context (structure varies by error type)"
          }
        }
      },
      "description": "List of error objects (only present if status is fail)"
    }
  },
  "additionalProperties": false
}
```

---

## Output Examples

### Success - All Tests Pass (JavaScript)

```json
{
  "status": "pass",
  "execution_time_ms": 12340,
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

### Success After Retry (Python)

```json
{
  "status": "pass",
  "execution_time_ms": 18567,
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

### Failure - Tests Failed After Retries (Go)

```json
{
  "status": "fail",
  "execution_time_ms": 45678,
  "retry_count": 3,
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
      "message": "2 tests failed after 3 retry attempts",
      "context": {
        "failed_count": 2,
        "retry_count": 3,
        "flaky": false
      }
    }
  ]
}
```

### Failure - Build Failed (TypeScript)

```json
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
        "stderr": "ERROR in src/services/user.ts:42:15\nTS2322: Type 'string' is not assignable to type 'number'.\n    40 |   const user: User = {\n    41 |     id: userId,\n  > 42 |     age: 'invalid',\n       |               ^\n    43 |     name: username\n    44 |   };"
      }
    }
  ]
}
```

### Failure - Validation Error (Invalid Input)

```json
{
  "status": "fail",
  "execution_time_ms": 0,
  "retry_count": 0,
  "tests_run": 0,
  "tests_passed": 0,
  "tests_failed": 0,
  "build_status": "skipped",
  "failing_tests": [],
  "language": "unknown",
  "test_command": null,
  "build_command": null,
  "errors": [
    {
      "type": "validation_error",
      "message": "working_directory does not exist",
      "context": {
        "working_directory": "/nonexistent/path",
        "checked": true,
        "exists": false
      }
    }
  ]
}
```

### Failure - Language Detection Failed

```json
{
  "status": "fail",
  "execution_time_ms": 234,
  "retry_count": 0,
  "tests_run": 0,
  "tests_passed": 0,
  "tests_failed": 0,
  "build_status": "skipped",
  "failing_tests": [],
  "language": "unknown",
  "test_command": null,
  "build_command": null,
  "errors": [
    {
      "type": "language_detection_failed",
      "message": "Cannot detect programming language. Please provide explicit 'language' parameter.",
      "context": {
        "working_directory": "/Users/user/unknown-project",
        "files_checked": [
          "package.json",
          "pyproject.toml",
          "go.mod",
          "Gemfile",
          "Cargo.toml",
          "pom.xml"
        ],
        "found": []
      }
    }
  ]
}
```

### Failure - Test Command Not Found (Ruby)

```json
{
  "status": "fail",
  "execution_time_ms": 567,
  "retry_count": 0,
  "tests_run": 0,
  "tests_passed": 0,
  "tests_failed": 0,
  "build_status": "skipped",
  "failing_tests": [],
  "language": "ruby",
  "test_command": "bundle exec rspec",
  "build_command": null,
  "errors": [
    {
      "type": "command_not_found",
      "message": "Test command not found: bundle exec rspec",
      "context": {
        "command": "bundle exec rspec",
        "exit_code": 127,
        "stderr": "bash: bundle: command not found",
        "suggestion": "Install dependencies with: gem install bundler && bundle install"
      }
    }
  ]
}
```

---

## Language Detection Logic

The agent uses the following priority order when auto-detecting language:

1. **Check for explicit `language` parameter** → Use if provided
2. **Scan working_directory for indicator files:**

| Language | Indicator Files | Confidence |
|----------|-----------------|------------|
| JavaScript/TypeScript | `package.json` with `"scripts": {"test": ...}` | High |
| JavaScript/TypeScript | `package.json` without test script | Medium |
| TypeScript | `tsconfig.json` | High |
| Python | `pyproject.toml` with `[tool.pytest]` | High |
| Python | `pytest.ini` or `setup.py` | High |
| Python | `requirements.txt` or `setup.cfg` | Medium |
| Go | `go.mod` | High |
| Ruby | `Gemfile` with rspec or minitest | High |
| Ruby | `*.gemspec` | Medium |
| Rust | `Cargo.toml` | High |
| Java | `pom.xml` | High |
| Java | `build.gradle` or `build.gradle.kts` | High |

3. **If multiple indicators found:**
   - Prioritize by confidence level (High > Medium)
   - If same confidence, prioritize by file specificity (pytest.ini > requirements.txt)
   - If still ambiguous, return error asking user to provide explicit `language` parameter

4. **If no indicators found:**
   - Return validation error with list of checked files and suggestion to provide explicit `language` parameter

---

## Test Command Resolution

Default test commands by language (used when `test_command` not provided):

| Language | Default Command | Fallback Commands |
|----------|-----------------|-------------------|
| JavaScript | `npm test` | `yarn test`, `pnpm test` (detect from lockfile) |
| TypeScript | `npm test` | `yarn test`, `pnpm test` (detect from lockfile) |
| Python | `pytest` | `python -m pytest`, `python -m unittest discover` |
| Go | `go test -race ./...` | `go test ./...` (if -race fails) |
| Ruby | `bundle exec rspec` | `rake test`, `ruby -Itest test/test_*.rb` |
| Rust | `cargo test` | `cargo test --all-features` |
| Java (Maven) | `mvn test` | `mvn verify` |
| Java (Gradle) | `gradle test` | `./gradlew test` |

**Command detection logic:**
1. Check for test script in `package.json` (JavaScript/TypeScript)
2. Check for test configuration files (pytest.ini, .rspec, etc.)
3. Use default command for detected language
4. If default fails with "command not found", try fallback commands
5. If all commands fail, return error with suggestion to install dependencies

---

## Build Command Resolution

Build commands are executed **before tests** for these languages:

| Language | Build Required? | Default Build Command |
|----------|-----------------|------------------------|
| JavaScript (with build script) | Yes | `npm run build` |
| TypeScript | Yes | `npm run build` or `tsc` |
| Go | No | Tests compile code automatically |
| Ruby | No | No compilation step |
| Rust | No | `cargo test` compiles automatically |
| Java | Implicit | Maven/Gradle test commands compile first |

**Build detection logic:**
1. If `run_build` parameter is `false`, skip build
2. If `run_build` parameter is `true`, force build with provided or default command
3. If `run_build` omitted (auto-detect):
   - JavaScript/TypeScript: Check for `"build"` script in `package.json`
   - If build script exists, run it before tests
   - If no build script, skip build
4. If build command provided explicitly via `build_command`, use it

---

## Retry Logic Flowchart

```
┌─────────────────┐
│ Run Test Command│
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ Success?│
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │    ┌────▼─────────┐
    │    │ Build Failed?│
    │    └────┬─────────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │   Yes       No
    │    │         │
    │    │    ┌────▼──────────────┐
    │    │    │ Retry Count < Max?│
    │    │    └────┬──────────────┘
    │    │         │
    │    │    ┌────┴────┐
    │    │    │         │
    │    │   Yes       No
    │    │    │         │
    │    │    │    ┌────▼─────────────────┐
    │    │    │    │ Escalate to User     │
    │    │    │    │ (AskUserQuestion)    │
    │    │    │    └────┬─────────────────┘
    │    │    │         │
    │    │    │    ┌────┴────┐
    │    │    │    │  User   │
    │    │    │    │ Choice  │
    │    │    │    └────┬────┘
    │    │    │         │
    │    │    │    ┌────┴────────────────┐
    │    │    │    │ Retry/Skip/Abort    │
    │    │    │    └─────────────────────┘
    │    │    │
    │    │    ▼
    │    │ ┌────────────────┐
    │    │ │ Wait (Backoff) │
    │    │ └────────┬───────┘
    │    │          │
    │    │          ▼
    │    │ ┌──────────────────┐
    │    │ │ Increment Retry  │
    │    │ └────────┬─────────┘
    │    │          │
    │    │          └──────────┐
    │    │                     │
    │    ▼                     ▼
    │ ┌─────────────────────────┐
    │ │ Return Fail Status      │
    │ └─────────────────────────┘
    │
    ▼
┌──────────────────┐
│ Return Pass Status│
└──────────────────┘
```

---

## Error Types Reference

| Error Type | Description | Status | Retry |
|------------|-------------|--------|-------|
| `test_failure` | One or more tests failed | fail | Yes (up to max_retries) |
| `build_failure` | Build step failed | fail | No |
| `validation_error` | Input validation failed | fail | No |
| `language_detection_failed` | Cannot detect language | fail | No |
| `command_not_found` | Test/build command not found | fail | No |
| `timeout` | Test execution exceeded timeout | fail | Yes (with increased timeout) |
| `permission_error` | Cannot read/write files | fail | No |
| `out_of_memory` | System resource exhaustion | fail | No |
| `user_abort` | User chose to abort after escalation | fail | No |

---

## User Escalation Protocol

When max_retries is exceeded, the agent uses AskUserQuestion tool with this format:

**Question Template:**
```
Tests failed after {retry_count} retry attempts. What would you like to do?

Failing tests ({failed_count}):
{list of failing test names}

Options:
A) Retry again (will attempt {max_retries} more times)
B) Skip tests and continue workflow (NOT RECOMMENDED - may merge broken code)
C) Abort workflow and fix tests manually

Your choice (A/B/C):
```

**User Response Handling:**
- **Choice A (Retry):** Reset retry_count to 0 and continue retry loop
- **Choice B (Skip):** Return fail status with special flag `user_override: true`
- **Choice C (Abort):** Return fail status with error type `user_abort`

---

## Integration Example

### Spawning Agent from Workflow

```python
# Workflow skill spawns agent in background
agent_input = {
    "working_directory": "/Users/user/my-app",
    "max_retries": 3,
    "timeout_seconds": 600
}

# Spawn agent using Task tool
task_id = spawn_task(
    "general-purpose",
    f"Run phase-testing-agent with input: {json.dumps(agent_input)}"
)

# Wait for completion or continue workflow
agent_output = wait_for_task(task_id, timeout=900)

# Parse output
result = json.loads(agent_output)

if result["status"] == "pass":
    print(f"✅ All {result['tests_passed']} tests passed!")
    proceed_to_phase_5()
elif result["status"] == "fail":
    if result["build_status"] == "fail":
        print(f"❌ Build failed, tests not run")
        abort_workflow()
    else:
        print(f"❌ {result['tests_failed']} tests failed after {result['retry_count']} retries")
        present_failing_tests_to_user(result["failing_tests"])
        user_decision = ask_user_next_step()
        handle_user_decision(user_decision)
```

---

## Version History

### 1.0 (2026-02-05)
- Initial protocol definition
- Input/output JSON schemas
- Language detection logic
- Test/build command resolution
- Retry logic flowchart
- Error types reference
- User escalation protocol

---

## See Also

- **AGENT.md:** Full agent specification and usage guide
- **skills/workflow/SKILL.md:** Workflow orchestrator that spawns this agent
- **skills/agents/README.md:** Agent system overview
