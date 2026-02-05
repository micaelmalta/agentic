# Agent Template: [Agent Name]

**Purpose:** [One-sentence description]
**Background:** Yes/No (default mode)
**Phase:** [Which workflow phase, if applicable]

---

## Overview

[2-3 paragraphs describing:
- What this agent does
- When to use it
- How it fits into the broader system]

---

## Responsibilities

This agent is responsible for:

- [ ] Responsibility 1
- [ ] Responsibility 2
- [ ] Responsibility 3
- [ ] [Add more as needed]

---

## Input Schema

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `param1` | string | Description | `"value"` |
| `param2` | number | Description | `42` |

### Optional Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `param3` | string | `null` | Description | `"value"` |
| `param4` | boolean | `false` | Description | `true` |

### Input Validation

The agent validates:
- [ ] Required parameters are present
- [ ] Types match schema
- [ ] Values are within valid ranges
- [ ] [Add more validations]

**Validation Errors:** Return clear error message with missing/invalid parameter details.

---

## Execution Logic

### Step-by-Step Process

1. **Input Validation**
   - Validate required parameters
   - Apply defaults for optional parameters
   - Return error if validation fails

2. **Context Detection**
   - Auto-detect language/stack (if applicable)
   - Discover project structure
   - Identify relevant files

3. **Main Execution**
   - [Describe main execution steps]
   - [Include any parallel operations]
   - [Note any blocking operations]

4. **Retry Logic** (if applicable)
   - On failure: Analyze error
   - Retry if recoverable (max 3 attempts)
   - Escalate if stuck after 3 retries

5. **Result Consolidation**
   - Collect all outputs
   - Format as structured JSON
   - Return to caller

### Retry Strategy

| Condition | Action | Max Retries |
|-----------|--------|-------------|
| [Recoverable error type 1] | Retry with 5s backoff | 3 |
| [Recoverable error type 2] | Retry with 10s backoff | 3 |
| [Critical error] | Stop immediately, escalate | 0 |

---

## Output Schema

### Success Response

```json
{
  "status": "pass",
  "execution_time_ms": 1234,
  "retry_count": 0,
  // Agent-specific fields
  "field1": "value",
  "field2": 42
}
```

### Failure Response

```json
{
  "status": "fail",
  "execution_time_ms": 1234,
  "retry_count": 3,
  "errors": [
    {
      "type": "error_type",
      "message": "Detailed error message",
      "context": {
        "file": "path/to/file",
        "line": 42
      }
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"pass"` or `"fail"` |
| `execution_time_ms` | number | Total execution time in milliseconds |
| `retry_count` | number | Number of retry attempts made |
| `errors` | array | List of errors (only if status is fail) |

---

## Error Handling

### Recoverable Errors

Errors that trigger retry logic:
- [Error type 1]: Retry strategy
- [Error type 2]: Retry strategy
- [Error type 3]: Retry strategy

### Non-Recoverable Errors

Errors that stop immediately:
- [Critical error 1]: Return fail with clear message
- [Critical error 2]: Return fail with clear message
- [Critical error 3]: Return fail with clear message

### User Escalation

Escalate to user when:
- Max retries exceeded (3 attempts)
- Unclear error or ambiguous situation
- User input required to proceed
- Configuration issue detected

**Escalation Method:** Use AskUserQuestion tool to present options and get user decision.

---

## Usage Examples

### Example 1: Basic Usage

```yaml
# Input
param1: "value1"
param2: 42
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 1000,
  "retry_count": 0,
  "result": "success"
}
```

### Example 2: With Optional Parameters

```yaml
# Input
param1: "value1"
param2: 42
param3: "optional_value"
param4: true
```

```json
// Output
{
  "status": "pass",
  "execution_time_ms": 1500,
  "retry_count": 1,
  "result": "success_with_retry"
}
```

### Example 3: Failure Case

```yaml
# Input
param1: "invalid"
param2: -1
```

```json
// Output
{
  "status": "fail",
  "execution_time_ms": 500,
  "retry_count": 3,
  "errors": [
    {
      "type": "validation_error",
      "message": "param2 must be positive",
      "context": {"param": "param2", "value": -1}
    }
  ]
}
```

---

## Integration with Workflow

### When Agent is Invoked

The workflow skill spawns this agent at:
- [Phase/step description]
- Condition: [When this happens]
- Mode: Background (default)

### Expected Workflow

```
1. Workflow Phase X starts
2. Workflow spawns [agent-name] in background
3. Workflow continues or waits (depending on phase)
4. Agent completes and returns results
5. Workflow validates agent output
6. If pass: Proceed to next phase
7. If fail: Present errors to user, decide next steps
```

---

## Testing

### Unit Tests

Test cases to implement:

1. **Happy Path**
   - Input: Valid parameters with all required fields
   - Expected: Status = pass, no errors

2. **Retry Path**
   - Input: Valid parameters, simulate recoverable error
   - Expected: Status = pass after retry, retry_count > 0

3. **Failure Path**
   - Input: Valid parameters, simulate non-recoverable error
   - Expected: Status = fail, clear error message

4. **Validation Errors**
   - Input: Missing required parameter
   - Expected: Status = fail, validation error

5. **Edge Cases**
   - [Edge case 1]
   - [Edge case 2]
   - [Edge case 3]

### Integration Tests

Test with real workflow:

1. Run agent standalone with sample inputs
2. Run agent as part of full workflow
3. Test background execution mode
4. Test error handling and escalation
5. Test retry logic with flaky operations

---

## Performance Considerations

- **Execution Time:** Expected range [X-Y seconds]
- **Background Mode:** Recommended for operations > 30 seconds
- **Resource Usage:** [Memory, CPU, network requirements]
- **Timeout:** Default [N seconds], configurable

---

## Dependencies

### Required Tools

- [ ] Tool 1 (e.g., Bash, Read, Write)
- [ ] Tool 2
- [ ] Tool 3

### Required Skills

- [ ] Skill 1 (e.g., testing skill)
- [ ] Skill 2
- [ ] Skill 3

### External Dependencies

- [ ] External tool 1 (e.g., gh CLI, pytest)
- [ ] External tool 2
- [ ] External tool 3

---

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VAR_1` | Description | Yes | N/A |
| `VAR_2` | Description | No | `"default"` |

### Project Files

Agent may read these files for configuration:
- `.tool-config-file` - Purpose
- `project.config` - Purpose
- [Add more as needed]

---

## Troubleshooting

### Common Issues

**Issue 1: [Problem description]**
- Symptoms: [What user sees]
- Cause: [Why it happens]
- Solution: [How to fix]

**Issue 2: [Problem description]**
- Symptoms: [What user sees]
- Cause: [Why it happens]
- Solution: [How to fix]

**Issue 3: [Problem description]**
- Symptoms: [What user sees]
- Cause: [Why it happens]
- Solution: [How to fix]

### Debug Mode

Enable verbose logging:
```yaml
# Input
debug: true
log_level: "verbose"
```

---

## Changelog

### Version 1.0 (YYYY-MM-DD)
- Initial implementation
- Core functionality
- Basic error handling

### Future Enhancements

Planned improvements:
- [ ] Enhancement 1
- [ ] Enhancement 2
- [ ] Enhancement 3

---

## See Also

- **Agent System:** `skills/agents/README.md` - Overview of all agents
- **Workflow Skill:** `skills/workflow/SKILL.md` - Orchestrator
- **Related Skill:** `skills/[skill-name]/SKILL.md` - Description

---

## Agent Checklist

Before marking agent complete, verify:

- [ ] Input schema documented with examples
- [ ] Output schema documented with examples
- [ ] Execution logic clearly described
- [ ] Retry strategy defined
- [ ] Error handling comprehensive
- [ ] User escalation implemented
- [ ] Usage examples provided (success + failure)
- [ ] Integration with workflow documented
- [ ] Test cases defined
- [ ] Dependencies listed
- [ ] Troubleshooting guide included
- [ ] Performance considerations documented

---

**Template Version:** 1.0
**Last Updated:** 2026-02-05
