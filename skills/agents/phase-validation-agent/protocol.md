# Phase Validation Agent Protocol

**Version:** 1.0
**Last Updated:** 2026-02-05

---

## Overview

This document defines the complete input/output protocol for the Phase Validation Agent using JSON Schema. These schemas ensure consistent, type-safe communication between the workflow orchestrator and the agent.

---

## Input Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PhaseValidationAgentInput",
  "type": "object",
  "required": ["working_directory", "changed_files"],
  "additionalProperties": false,
  "properties": {
    "working_directory": {
      "type": "string",
      "description": "Absolute path to the project root directory",
      "minLength": 1,
      "pattern": "^/",
      "examples": [
        "/Users/user/my-project",
        "/home/dev/app"
      ]
    },
    "changed_files": {
      "type": "array",
      "description": "List of changed file paths relative to working_directory",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "examples": [
        ["src/api.ts", "tests/api.test.ts"],
        ["main.py", "tests/test_main.py"]
      ]
    },
    "language": {
      "type": "string",
      "description": "Programming language override (auto-detected if not provided)",
      "enum": [
        "javascript",
        "js",
        "typescript",
        "ts",
        "python",
        "py",
        "go",
        "golang",
        "rust",
        "rs",
        "ruby",
        "rb",
        "java"
      ],
      "examples": ["javascript", "python", "go"]
    },
    "format_command": {
      "type": "string",
      "description": "Override formatter command (language default used if not provided)",
      "minLength": 1,
      "examples": [
        "npm run format",
        "black .",
        "cargo fmt"
      ]
    },
    "lint_command": {
      "type": "string",
      "description": "Override linter command (language default used if not provided)",
      "minLength": 1,
      "examples": [
        "npm run lint",
        "ruff check .",
        "golangci-lint run"
      ]
    },
    "build_command": {
      "type": "string",
      "description": "Override build command (language default used if not provided)",
      "minLength": 1,
      "examples": [
        "npm run build",
        "go build ./...",
        "cargo build"
      ]
    },
    "test_command": {
      "type": "string",
      "description": "Override test command (language default used if not provided)",
      "minLength": 1,
      "examples": [
        "npm test",
        "pytest",
        "go test ./..."
      ]
    },
    "max_retries": {
      "type": "integer",
      "description": "Maximum number of retry attempts for fixable issues",
      "minimum": 0,
      "maximum": 10,
      "default": 3,
      "examples": [3, 5, 1]
    },
    "skip_build": {
      "type": "boolean",
      "description": "Skip the build check entirely",
      "default": false,
      "examples": [false, true]
    },
    "skip_tests": {
      "type": "boolean",
      "description": "Skip the test check entirely",
      "default": false,
      "examples": [false, true]
    }
  }
}
```

---

## Output Schema (JSON Schema)

### Main Output Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PhaseValidationAgentOutput",
  "type": "object",
  "required": ["status", "execution_time_ms", "total_retries", "checks"],
  "additionalProperties": false,
  "properties": {
    "status": {
      "type": "string",
      "enum": ["pass", "fail"],
      "description": "Overall validation status: pass if all checks passed, fail if any check failed"
    },
    "execution_time_ms": {
      "type": "integer",
      "description": "Total execution time in milliseconds",
      "minimum": 0,
      "examples": [12345, 8901, 5678]
    },
    "total_retries": {
      "type": "integer",
      "description": "Sum of all retry counts across all checks",
      "minimum": 0,
      "examples": [0, 3, 5]
    },
    "critical_security_issue": {
      "type": "boolean",
      "description": "True if security-reviewer found a critical vulnerability (only present if true)",
      "examples": [true]
    },
    "checks": {
      "type": "object",
      "required": ["formatter", "linter", "build", "tests", "code_review", "security_review"],
      "additionalProperties": false,
      "properties": {
        "formatter": {
          "$ref": "#/definitions/FormatterCheck"
        },
        "linter": {
          "$ref": "#/definitions/LinterCheck"
        },
        "build": {
          "$ref": "#/definitions/BuildCheck"
        },
        "tests": {
          "$ref": "#/definitions/TestsCheck"
        },
        "code_review": {
          "$ref": "#/definitions/CodeReviewCheck"
        },
        "security_review": {
          "$ref": "#/definitions/SecurityReviewCheck"
        }
      }
    }
  },
  "definitions": {
    "FormatterCheck": {
      "type": "object",
      "required": ["status", "issues", "retry_count", "command", "execution_time_ms"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["pass", "fail"],
          "description": "Formatter check status"
        },
        "issues": {
          "type": "array",
          "description": "List of formatting issues (empty if status is pass)",
          "items": {
            "type": "string"
          },
          "examples": [
            [],
            ["File src/api.ts still has formatting issues after 3 retries"]
          ]
        },
        "retry_count": {
          "type": "integer",
          "description": "Number of retry attempts made",
          "minimum": 0,
          "examples": [0, 1, 3]
        },
        "command": {
          "type": "string",
          "description": "Formatter command that was executed",
          "examples": [
            "npx prettier --write .",
            "black .",
            "cargo fmt"
          ]
        },
        "execution_time_ms": {
          "type": "integer",
          "description": "Execution time for this check in milliseconds",
          "minimum": 0,
          "examples": [1234, 2400, 1100]
        }
      }
    },
    "LinterCheck": {
      "type": "object",
      "required": ["status", "issues", "retry_count", "command", "execution_time_ms"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["pass", "fail"],
          "description": "Linter check status"
        },
        "issues": {
          "type": "array",
          "description": "List of linting issues (empty if status is pass)",
          "items": {
            "type": "string"
          },
          "examples": [
            [],
            ["Unused variable 'x' at src/api.ts:42"]
          ]
        },
        "retry_count": {
          "type": "integer",
          "description": "Number of retry attempts made",
          "minimum": 0,
          "examples": [0, 1, 2]
        },
        "command": {
          "type": "string",
          "description": "Linter command that was executed",
          "examples": [
            "npm run lint",
            "ruff check .",
            "golangci-lint run"
          ]
        },
        "execution_time_ms": {
          "type": "integer",
          "description": "Execution time for this check in milliseconds",
          "minimum": 0,
          "examples": [2345, 1800, 2100]
        }
      }
    },
    "BuildCheck": {
      "type": "object",
      "required": ["status", "errors", "retry_count", "command", "execution_time_ms"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["pass", "fail", "skipped"],
          "description": "Build check status (skipped if skip_build is true or language has no build)"
        },
        "errors": {
          "type": "array",
          "description": "List of build errors (empty if status is pass or skipped)",
          "items": {
            "type": "string"
          },
          "examples": [
            [],
            ["TypeError: Cannot read property 'map' of undefined at src/api.ts:42"]
          ]
        },
        "retry_count": {
          "type": "integer",
          "description": "Number of retry attempts made",
          "minimum": 0,
          "examples": [0, 1]
        },
        "command": {
          "type": "string",
          "description": "Build command that was executed (empty if skipped)",
          "examples": [
            "npm run build",
            "go build ./...",
            ""
          ]
        },
        "execution_time_ms": {
          "type": "integer",
          "description": "Execution time for this check in milliseconds",
          "minimum": 0,
          "examples": [3456, 2800, 0]
        }
      }
    },
    "TestsCheck": {
      "type": "object",
      "required": ["status", "failing_count", "retry_count", "command", "execution_time_ms"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["pass", "fail", "skipped"],
          "description": "Tests check status (skipped if skip_tests is true)"
        },
        "failing_count": {
          "type": "integer",
          "description": "Number of failing tests (0 if status is pass or skipped)",
          "minimum": 0,
          "examples": [0, 2, 5]
        },
        "retry_count": {
          "type": "integer",
          "description": "Number of retry attempts made",
          "minimum": 0,
          "examples": [0, 1]
        },
        "command": {
          "type": "string",
          "description": "Test command that was executed (empty if skipped)",
          "examples": [
            "npm test",
            "pytest",
            "go test ./...",
            ""
          ]
        },
        "execution_time_ms": {
          "type": "integer",
          "description": "Execution time for this check in milliseconds",
          "minimum": 0,
          "examples": [4567, 2400, 0]
        }
      }
    },
    "CodeReviewCheck": {
      "type": "object",
      "required": ["status", "findings", "severity", "execution_time_ms"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["pass", "fail"],
          "description": "Code review check status"
        },
        "findings": {
          "type": "array",
          "description": "List of code review findings (empty if status is pass)",
          "items": {
            "type": "string"
          },
          "examples": [
            [],
            [
              "Function 'processData' lacks error handling",
              "Variable naming 'x' is not descriptive"
            ]
          ]
        },
        "severity": {
          "type": "string",
          "enum": ["none", "low", "medium", "high"],
          "description": "Maximum severity of findings"
        },
        "execution_time_ms": {
          "type": "integer",
          "description": "Execution time for this check in milliseconds",
          "minimum": 0,
          "examples": [890, 500, 300]
        }
      }
    },
    "SecurityReviewCheck": {
      "type": "object",
      "required": ["status", "vulnerabilities", "severity", "execution_time_ms"],
      "additionalProperties": false,
      "properties": {
        "status": {
          "type": "string",
          "enum": ["pass", "fail"],
          "description": "Security review check status"
        },
        "vulnerabilities": {
          "type": "array",
          "description": "List of security vulnerabilities found (empty if status is pass)",
          "items": {
            "type": "string"
          },
          "examples": [
            [],
            [
              "SQL Injection in src/database.ts:156 - User input directly concatenated into SQL query",
              "Hardcoded API key found in src/config.ts:23"
            ]
          ]
        },
        "severity": {
          "type": "string",
          "enum": ["none", "low", "medium", "high", "critical"],
          "description": "Maximum severity of vulnerabilities"
        },
        "execution_time_ms": {
          "type": "integer",
          "description": "Execution time for this check in milliseconds",
          "minimum": 0,
          "examples": [567, 478, 201]
        }
      }
    }
  }
}
```

---

## TypeScript Type Definitions

For TypeScript implementations or integrations, here are the equivalent type definitions:

```typescript
// Input Types
export interface PhaseValidationAgentInput {
  working_directory: string;
  changed_files: string[];
  language?: 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'ruby' | 'java';
  format_command?: string;
  lint_command?: string;
  build_command?: string;
  test_command?: string;
  max_retries?: number;
  skip_build?: boolean;
  skip_tests?: boolean;
}

// Output Types
export interface PhaseValidationAgentOutput {
  status: 'pass' | 'fail';
  execution_time_ms: number;
  total_retries: number;
  critical_security_issue?: boolean;
  checks: ValidationChecks;
}

export interface ValidationChecks {
  formatter: FormatterCheck;
  linter: LinterCheck;
  build: BuildCheck;
  tests: TestsCheck;
  code_review: CodeReviewCheck;
  security_review: SecurityReviewCheck;
}

export interface FormatterCheck {
  status: 'pass' | 'fail';
  issues: string[];
  retry_count: number;
  command: string;
  execution_time_ms: number;
}

export interface LinterCheck {
  status: 'pass' | 'fail';
  issues: string[];
  retry_count: number;
  command: string;
  execution_time_ms: number;
}

export interface BuildCheck {
  status: 'pass' | 'fail' | 'skipped';
  errors: string[];
  retry_count: number;
  command: string;
  execution_time_ms: number;
}

export interface TestsCheck {
  status: 'pass' | 'fail' | 'skipped';
  failing_count: number;
  retry_count: number;
  command: string;
  execution_time_ms: number;
}

export interface CodeReviewCheck {
  status: 'pass' | 'fail';
  findings: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  execution_time_ms: number;
}

export interface SecurityReviewCheck {
  status: 'pass' | 'fail';
  vulnerabilities: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  execution_time_ms: number;
}
```

---

## Python Type Definitions

For Python implementations, here are Pydantic models:

```python
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

# Input Model
class PhaseValidationAgentInput(BaseModel):
    working_directory: str = Field(..., min_length=1, pattern=r"^/")
    changed_files: List[str] = Field(...)
    language: Optional[Literal['javascript', 'typescript', 'python', 'go', 'rust', 'ruby', 'java']] = None
    format_command: Optional[str] = Field(None, min_length=1)
    lint_command: Optional[str] = Field(None, min_length=1)
    build_command: Optional[str] = Field(None, min_length=1)
    test_command: Optional[str] = Field(None, min_length=1)
    max_retries: int = Field(3, ge=0, le=10)
    skip_build: bool = False
    skip_tests: bool = False

    @field_validator('changed_files')
    @classmethod
    def validate_changed_files(cls, v):
        if not isinstance(v, list):
            raise ValueError('changed_files must be a list')
        return v

# Output Models
class FormatterCheck(BaseModel):
    status: Literal['pass', 'fail']
    issues: List[str]
    retry_count: int = Field(..., ge=0)
    command: str
    execution_time_ms: int = Field(..., ge=0)

class LinterCheck(BaseModel):
    status: Literal['pass', 'fail']
    issues: List[str]
    retry_count: int = Field(..., ge=0)
    command: str
    execution_time_ms: int = Field(..., ge=0)

class BuildCheck(BaseModel):
    status: Literal['pass', 'fail', 'skipped']
    errors: List[str]
    retry_count: int = Field(..., ge=0)
    command: str
    execution_time_ms: int = Field(..., ge=0)

class TestsCheck(BaseModel):
    status: Literal['pass', 'fail', 'skipped']
    failing_count: int = Field(..., ge=0)
    retry_count: int = Field(..., ge=0)
    command: str
    execution_time_ms: int = Field(..., ge=0)

class CodeReviewCheck(BaseModel):
    status: Literal['pass', 'fail']
    findings: List[str]
    severity: Literal['none', 'low', 'medium', 'high']
    execution_time_ms: int = Field(..., ge=0)

class SecurityReviewCheck(BaseModel):
    status: Literal['pass', 'fail']
    vulnerabilities: List[str]
    severity: Literal['none', 'low', 'medium', 'high', 'critical']
    execution_time_ms: int = Field(..., ge=0)

class ValidationChecks(BaseModel):
    formatter: FormatterCheck
    linter: LinterCheck
    build: BuildCheck
    tests: TestsCheck
    code_review: CodeReviewCheck
    security_review: SecurityReviewCheck

class PhaseValidationAgentOutput(BaseModel):
    status: Literal['pass', 'fail']
    execution_time_ms: int = Field(..., ge=0)
    total_retries: int = Field(..., ge=0)
    critical_security_issue: Optional[bool] = None
    checks: ValidationChecks
```

---

## Example Requests and Responses

### Example 1: Minimal Valid Input (JavaScript Auto-Detect)

**Request:**
```json
{
  "working_directory": "/Users/user/my-app",
  "changed_files": [
    "src/api.ts",
    "tests/api.test.ts"
  ]
}
```

**Response (Success):**
```json
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

### Example 2: Python with Custom Commands

**Request:**
```json
{
  "working_directory": "/home/dev/app",
  "changed_files": [
    "main.py",
    "tests/test_main.py"
  ],
  "language": "python",
  "format_command": "black . --check",
  "lint_command": "ruff check . --fix",
  "test_command": "pytest -v",
  "max_retries": 5
}
```

**Response (With Retries):**
```json
{
  "status": "pass",
  "execution_time_ms": 10234,
  "total_retries": 3,
  "checks": {
    "formatter": {
      "status": "pass",
      "issues": [],
      "retry_count": 2,
      "command": "black . --check",
      "execution_time_ms": 2400
    },
    "linter": {
      "status": "pass",
      "issues": [],
      "retry_count": 1,
      "command": "ruff check . --fix",
      "execution_time_ms": 2100
    },
    "build": {
      "status": "skipped",
      "errors": [],
      "retry_count": 0,
      "command": "",
      "execution_time_ms": 0
    },
    "tests": {
      "status": "pass",
      "failing_count": 0,
      "retry_count": 0,
      "command": "pytest -v",
      "execution_time_ms": 3400
    },
    "code_review": {
      "status": "pass",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 1200
    },
    "security_review": {
      "status": "pass",
      "vulnerabilities": [],
      "severity": "none",
      "execution_time_ms": 1134
    }
  }
}
```

### Example 3: Critical Security Failure

**Request:**
```json
{
  "working_directory": "/Users/user/vulnerable-app",
  "changed_files": [
    "src/database.ts"
  ],
  "language": "javascript"
}
```

**Response (Critical Security Issue):**
```json
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

### Example 4: Validation Error (Invalid Input)

**Request:**
```json
{
  "changed_files": [
    "src/api.ts"
  ]
}
```

**Response (Validation Error):**
```json
{
  "status": "fail",
  "execution_time_ms": 0,
  "total_retries": 0,
  "checks": {
    "formatter": {
      "status": "fail",
      "issues": ["Validation failed: missing required parameter 'working_directory'"],
      "retry_count": 0,
      "command": "",
      "execution_time_ms": 0
    },
    "linter": {
      "status": "fail",
      "issues": [],
      "retry_count": 0,
      "command": "",
      "execution_time_ms": 0
    },
    "build": {
      "status": "fail",
      "errors": [],
      "retry_count": 0,
      "command": "",
      "execution_time_ms": 0
    },
    "tests": {
      "status": "fail",
      "failing_count": 0,
      "retry_count": 0,
      "command": "",
      "execution_time_ms": 0
    },
    "code_review": {
      "status": "fail",
      "findings": [],
      "severity": "none",
      "execution_time_ms": 0
    },
    "security_review": {
      "status": "fail",
      "vulnerabilities": [],
      "severity": "none",
      "execution_time_ms": 0
    }
  }
}
```

---

## Validation Rules Summary

### Input Validation

1. **Required Fields:**
   - `working_directory` MUST be present
   - `changed_files` MUST be present

2. **Path Validation:**
   - `working_directory` MUST be an absolute path (start with `/`)
   - `working_directory` MUST exist and be accessible

3. **Type Validation:**
   - `changed_files` MUST be an array of strings
   - `max_retries` MUST be an integer between 0 and 10
   - Boolean flags MUST be true or false

4. **Enum Validation:**
   - `language` (if provided) MUST be one of the supported languages

### Output Guarantees

1. **Always Present:**
   - `status` (always "pass" or "fail")
   - `execution_time_ms` (always >= 0)
   - `total_retries` (always >= 0)
   - `checks` object with all 6 checks

2. **Conditional Fields:**
   - `critical_security_issue` only present when true

3. **Check Status:**
   - Each check MUST have a status ("pass", "fail", or "skipped")
   - "skipped" only valid for build and tests checks

4. **Retry Counts:**
   - All retry counts MUST be >= 0
   - `total_retries` MUST equal sum of individual retry counts

5. **Execution Times:**
   - All execution times MUST be >= 0
   - Individual check times should sum to approximately total execution time

---

## Protocol Version History

### Version 1.0 (2026-02-05)
- Initial protocol definition
- JSON Schema for input/output
- TypeScript and Python type definitions
- Example requests and responses
- Validation rules

---

## See Also

- **Agent Specification:** `skills/agents/phase-validation-agent/AGENT.md`
- **Workflow Integration:** `skills/workflow/SKILL.md`

---

**Protocol Version:** 1.0
**Last Updated:** 2026-02-05
