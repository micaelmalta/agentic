# Plan: Implement Hybrid Workflow Architecture with Phase Agents

**Date:** 2026-02-05
**Status:** Complete
**Type:** Architecture Change

---

## Objective

Transform the workflow skill from a pure orchestrator into a **hybrid architecture** where:
- The workflow skill remains the high-level coordinator
- Complex, autonomous phases are extracted into dedicated phase agents
- Phase agents can run in background with clear boundaries and return values
- User interaction and state management remain at the orchestrator level

---

## Current Architecture Analysis

### Current Design (Pure Orchestrator)

```
Workflow Skill (Orchestrator)
├── Phase 1: Plan (para skill)
├── Phase 2: Branch (git operations)
├── Phase 3: Execute (developer skill)
├── Phase 4: Testing (testing skill + subagents)
├── Phase 5: Validation (multiple parallel subagents)
├── Phase 6: Commit (git-commits skill)
├── Phase 7: PR (GitHub operations + Jira)
└── Phase 8: Monitor & Summarize (para skill)
```

**Characteristics:**
- Workflow skill directly coordinates all phases
- Spawns ad-hoc subagents during phases
- State tracked in conversation context
- User interaction throughout

**Problems:**
1. Phase 5 validation is complex (6 parallel subagents) but repeated verbatim
2. Testing phase has retry loops that could be encapsulated
3. PR creation has multiple steps that could be atomic
4. No clear phase boundaries for reusability

---

## Proposed Hybrid Architecture

### New Design

```
Workflow Skill (Orchestrator)
├── Phase 1: Plan (para skill) [KEEP AS IS]
├── Phase 2: Branch (git operations) [KEEP AS IS]
├── Phase 3: Execute (developer skill) [KEEP AS IS]
├── Phase 4: Testing → phase-testing-agent
├── Phase 5: Validation → phase-validation-agent
├── Phase 6: Commit (git-commits skill) [KEEP AS IS]
├── Phase 7: PR → phase-pr-agent
└── Phase 8: Monitor & Summarize (para skill) [KEEP AS IS]
```

### Phase Agents to Create

| Agent | Phase | Purpose | Inputs | Outputs |
|-------|-------|---------|--------|---------|
| **phase-testing-agent** | 4 | Run all tests with retry loop | Language/stack, test commands | Pass/fail, coverage, retry count |
| **phase-validation-agent** | 5 | Run all 6 validations in parallel | Changed files, language/stack | Pass/fail for each check, issues found |
| **phase-pr-agent** | 7 | Create PR, link Jira, mark ready | Branch, base, title, description, Jira key | PR URL, Jira transition status |

---

## Implementation Approach

### Phase 1: Create Agent Infrastructure

**Goal:** Establish reusable agent structure

**Actions:**
1. Create `skills/agents/` directory for phase agents
2. Define agent protocol/interface standard
3. Create agent template with:
   - Input validation
   - Execution logic
   - Retry loop handling
   - Structured output (JSON or markdown)
   - Error handling and escalation

**Files to create:**
- `skills/agents/README.md` - Agent system documentation
- `skills/agents/AGENT_TEMPLATE.md` - Template for new agents
- `skills/agents/phase-testing-agent/AGENT.md` - Testing agent spec
- `skills/agents/phase-validation-agent/AGENT.md` - Validation agent spec
- `skills/agents/phase-pr-agent/AGENT.md` - PR agent spec

### Phase 2: Implement phase-testing-agent

**Goal:** Extract Phase 4 (Testing) into autonomous agent

**Responsibilities:**
- Detect language/stack (JS/TS, Python, Go, Ruby, Rust, Java)
- Run appropriate test command(s)
- For frontend: Also run build
- For UI: Check if Playwright tests exist and run them
- Retry loop: If tests fail, report failure and retry up to 3 times
- Return structured result: pass/fail, failing tests, retry count

**Input Parameters:**
```yaml
language: string  # "javascript", "python", "go", "ruby", "rust", "java"
test_command: string (optional)  # Override default test command
build_command: string (optional)  # Override default build command
max_retries: number (default: 3)
working_directory: string
```

**Output Format:**
```json
{
  "status": "pass" | "fail",
  "tests_run": number,
  "tests_passed": number,
  "tests_failed": number,
  "build_status": "pass" | "fail" | "skipped",
  "retry_count": number,
  "failing_tests": [
    {
      "name": "test name",
      "error": "error message"
    }
  ],
  "execution_time_ms": number
}
```

**Implementation:**
- Read language from project files (package.json, go.mod, Cargo.toml, etc.)
- Map language to test/build commands
- Execute commands via Bash tool
- Parse test output to extract results
- Implement retry logic with failure analysis
- Return structured JSON result

**Files to create:**
- `skills/agents/phase-testing-agent/AGENT.md` - Full agent specification
- `skills/agents/phase-testing-agent/protocol.md` - Input/output schema

### Phase 3: Implement phase-validation-agent

**Goal:** Extract Phase 5 (Validation) into autonomous agent

**Responsibilities:**
- Run formatter (language-specific)
- Run linter (language-specific)
- Run build (if applicable)
- Run tests (verify still passing)
- Spawn code-reviewer subagent
- Spawn security-reviewer subagent
- Consolidate all results
- Retry loop for fixable issues (format, lint)
- Return structured result with all findings

**Input Parameters:**
```yaml
language: string
changed_files: string[]  # List of files to review
format_command: string (optional)
lint_command: string (optional)
build_command: string (optional)
test_command: string (optional)
max_retries: number (default: 3)
working_directory: string
```

**Output Format:**
```json
{
  "status": "pass" | "fail",
  "checks": {
    "formatter": {
      "status": "pass" | "fail",
      "issues": [],
      "retry_count": number
    },
    "linter": {
      "status": "pass" | "fail",
      "issues": ["issue description"],
      "retry_count": number
    },
    "build": {
      "status": "pass" | "fail" | "skipped",
      "errors": []
    },
    "tests": {
      "status": "pass" | "fail",
      "failing_count": number
    },
    "code_review": {
      "status": "pass" | "fail",
      "findings": ["finding description"],
      "severity": "low" | "medium" | "high"
    },
    "security_review": {
      "status": "pass" | "fail",
      "vulnerabilities": ["vulnerability description"],
      "severity": "low" | "medium" | "high" | "critical"
    }
  },
  "total_retries": number,
  "execution_time_ms": number
}
```

**Implementation:**
- Detect language/stack from project structure
- Map language to format/lint/build commands
- Run format → lint → build → tests sequentially
- Spawn code-reviewer and security-reviewer subagents in parallel
- Wait for all subagents to complete
- Retry loop for format/lint failures (auto-fix where possible)
- Stop on security vulnerabilities (escalate to user)
- Return consolidated structured result

**Files to create:**
- `skills/agents/phase-validation-agent/AGENT.md` - Full agent specification
- `skills/agents/phase-validation-agent/protocol.md` - Input/output schema

### Phase 4: Implement phase-pr-agent

**Goal:** Extract Phase 7 (PR Creation) into autonomous agent

**Responsibilities:**
- Create GitHub PR as draft
- Link PR to Jira ticket (if provided)
- Transition Jira ticket to "In Code Review" (if Atlassian MCP configured)
- Mark PR ready for review
- Return PR URL and status

**Input Parameters:**
```yaml
branch: string
base_branch: string (default: "main")
title: string
description: string
jira_key: string (optional)
mark_ready: boolean (default: false)  # If true, mark ready immediately
working_directory: string
```

**Output Format:**
```json
{
  "status": "success" | "failed",
  "pr_url": string,
  "pr_number": number,
  "jira_status": {
    "linked": boolean,
    "transitioned": boolean,
    "current_state": string
  },
  "marked_ready": boolean,
  "errors": []
}
```

**Implementation:**
- Use GitHub MCP or `gh` CLI to create draft PR
- If Jira key provided and Atlassian MCP available:
  - Link PR to Jira issue (add PR URL as comment or remote link)
  - Get available transitions
  - Find "In Code Review" or "Code Review" transition
  - Execute transition
- If mark_ready=true, run `gh pr ready`
- Return structured result

**Files to create:**
- `skills/agents/phase-pr-agent/AGENT.md` - Full agent specification
- `skills/agents/phase-pr-agent/protocol.md` - Input/output schema

### Phase 5: Update Workflow Skill

**Goal:** Integrate phase agents into workflow orchestration

**Changes to `skills/workflow/SKILL.md`:**

1. **Update Phase 4 (Testing):**
   ```markdown
   ## Phase 4: Testing Validation (MANDATORY)

   **Agent:** phase-testing-agent

   **Actions:**
   1. Spawn phase-testing-agent with language and commands
   2. Agent runs all tests with retry loop
   3. Wait for agent completion
   4. If agent returns "fail", review failing tests and escalate to user
   5. Only proceed when agent returns "pass"
   ```

2. **Update Phase 5 (Validation):**
   ```markdown
   ## Phase 5: Validation (MANDATORY)

   **Agent:** phase-validation-agent

   **Actions:**
   1. Spawn phase-validation-agent with changed files and language
   2. Agent runs all 6 validations in parallel internally
   3. Wait for agent completion
   4. If agent returns "fail", review findings:
      - Auto-fixable (format/lint): Agent already retried
      - Security issues: STOP and escalate to user
      - Code review issues: Present findings to user for decision
   5. Only proceed when agent returns "pass"
   ```

3. **Update Phase 7 (PR):**
   ```markdown
   ## Phase 7: Create GitHub PR

   **Agent:** phase-pr-agent

   **Actions:**
   1. Prepare PR details (title, description, Jira key)
   2. Spawn phase-pr-agent with parameters
   3. Wait for agent completion
   4. Agent creates draft PR, links Jira, transitions ticket
   5. If user wants PR marked ready now: set mark_ready=true
   6. Display PR URL to user
   ```

4. **Add new section: Agent Coordination**
   ```markdown
   ## Agent Coordination

   Phase agents are autonomous workers that:
   - Take structured inputs
   - Encapsulate complex logic and retry loops
   - Return structured outputs
   - Can run in background (optional)

   The workflow skill remains the orchestrator:
   - Validates phase gates
   - Handles user approvals
   - Tracks overall progress
   - Spawns phase agents when appropriate
   ```

**Files to modify:**
- `skills/workflow/SKILL.md` - Update Phase 4, 5, 7 sections
- `skills/workflow/ENFORCEMENT.md` - Update validation enforcement to reference agent

### Phase 6: Create Agent Runner Utilities

**Goal:** Simplify spawning and tracking phase agents

**Utility Functions/Scripts:**

1. **Agent Runner Helper** (`skills/agents/run-agent.sh`):
   ```bash
   #!/bin/bash
   # Usage: run-agent.sh <agent-name> <input-json>
   # Spawns agent via Task tool and waits for completion
   ```

2. **Agent Status Checker** (`skills/agents/check-agent.sh`):
   ```bash
   #!/bin/bash
   # Usage: check-agent.sh <agent-task-id>
   # Checks status of background agent
   ```

3. **Agent Input Validator** (Python script):
   ```python
   # Validates input JSON against agent schema
   # Returns validated/typed inputs or error
   ```

**Files to create:**
- `skills/agents/run-agent.sh` - Agent spawning helper
- `skills/agents/check-agent.sh` - Agent status checker
- `skills/agents/validate-input.py` - Input validation

---

## Testing Strategy

### Unit Testing Phase Agents

Each agent should have test cases:

1. **phase-testing-agent tests:**
   - Happy path: All tests pass
   - Retry path: Tests fail once, pass on retry
   - Failure path: Tests fail 3 times, return failure
   - Build failure: Build fails, tests not run
   - Unknown language: Graceful error

2. **phase-validation-agent tests:**
   - Happy path: All 6 validations pass
   - Format/lint retry: Auto-fix succeeds
   - Security failure: Critical vulnerability found, stop
   - Code review failure: Issues found, return for review
   - Mixed results: Some pass, some fail

3. **phase-pr-agent tests:**
   - Happy path: PR created, Jira linked and transitioned
   - No Jira: PR created, Jira steps skipped
   - Jira unavailable: PR created, Jira steps failed gracefully
   - Mark ready immediately: PR created and marked ready

**Test Files to Create:**
- `skills/agents/phase-testing-agent/tests/` - Test cases and fixtures
- `skills/agents/phase-validation-agent/tests/` - Test cases and fixtures
- `skills/agents/phase-pr-agent/tests/` - Test cases and fixtures

### Integration Testing

Test workflow skill with phase agents:

1. Run full workflow on sample project (JavaScript)
2. Run full workflow on sample project (Python)
3. Test Phase 4 agent in isolation
4. Test Phase 5 agent in isolation
5. Test Phase 7 agent in isolation
6. Test error handling and escalation
7. Test background execution mode

---

## Edge Cases and Risks

### Edge Cases to Handle

1. **Language Detection Failure:**
   - Multiple languages in project
   - Unknown/unsupported language
   - Conflicting indicators
   - **Mitigation:** Require explicit language parameter as fallback

2. **Test Command Variations:**
   - Non-standard test scripts
   - Custom test runners
   - Monorepo with multiple test commands
   - **Mitigation:** Allow command override in agent input

3. **Jira Transition Variations:**
   - Custom workflow with different state names
   - Multiple transitions available
   - User permissions insufficient
   - **Mitigation:** Fuzzy match state names, graceful failure

4. **Retry Loop Edge Cases:**
   - Flaky tests (pass/fail randomly)
   - Tests timeout on retry
   - Auto-fix breaks tests
   - **Mitigation:** Track retry reasons, exponential backoff, max retry limit

5. **Background Agent Tracking:**
   - Agent times out
   - Agent crashes mid-execution
   - Multiple agents running simultaneously
   - **Mitigation:** TaskOutput with timeout, agent status file, unique agent IDs

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Agent output parsing failure | High | Medium | Strict JSON schema, validation |
| Background agent lost/orphaned | Medium | Low | TaskOutput tracking, timeout |
| User confusion with new abstraction | Medium | Medium | Clear documentation, examples |
| Regression in existing workflow | High | Medium | Comprehensive testing, parallel rollout |
| Language detection incorrect | Medium | Medium | Explicit override parameter |
| Jira integration breaks | Low | Medium | Graceful degradation, optional |

---

## Implementation Steps (Sequenced)

### Step 1: Infrastructure Setup
- [ ] Create `skills/agents/` directory
- [ ] Write `skills/agents/README.md` with agent system overview
- [ ] Create `skills/agents/AGENT_TEMPLATE.md`
- [ ] Define agent input/output schema format (JSON Schema or TypeScript types)

### Step 2: Implement phase-testing-agent
- [ ] Create `skills/agents/phase-testing-agent/AGENT.md`
- [ ] Create `skills/agents/phase-testing-agent/protocol.md`
- [ ] Implement language detection logic
- [ ] Implement test execution with Bash tool
- [ ] Implement retry loop
- [ ] Implement output formatting
- [ ] Add test cases

### Step 3: Implement phase-validation-agent
- [ ] Create `skills/agents/phase-validation-agent/AGENT.md`
- [ ] Create `skills/agents/phase-validation-agent/protocol.md`
- [ ] Implement language detection
- [ ] Implement format/lint/build/test execution
- [ ] Implement parallel code-reviewer + security-reviewer subagent spawning
- [ ] Implement result consolidation
- [ ] Implement retry loop for fixable issues
- [ ] Add test cases

### Step 4: Implement phase-pr-agent
- [ ] Create `skills/agents/phase-pr-agent/AGENT.md`
- [ ] Create `skills/agents/phase-pr-agent/protocol.md`
- [ ] Implement GitHub PR creation via `gh` CLI
- [ ] Implement Jira linking and transition (if Atlassian MCP available)
- [ ] Implement mark ready functionality
- [ ] Implement error handling
- [ ] Add test cases

### Step 5: Update Workflow Skill
- [ ] Update `skills/workflow/SKILL.md` Phase 4 to use phase-testing-agent
- [ ] Update `skills/workflow/SKILL.md` Phase 5 to use phase-validation-agent
- [ ] Update `skills/workflow/SKILL.md` Phase 7 to use phase-pr-agent
- [ ] Add "Agent Coordination" section to workflow skill
- [ ] Update `skills/workflow/ENFORCEMENT.md` to reference agents

### Step 6: Create Utilities
- [ ] Create `skills/agents/run-agent.sh`
- [ ] Create `skills/agents/check-agent.sh`
- [ ] Create `skills/agents/validate-input.py`

### Step 7: Integration Testing
- [ ] Test phase-testing-agent standalone
- [ ] Test phase-validation-agent standalone
- [ ] Test phase-pr-agent standalone
- [ ] Test full workflow with JavaScript project
- [ ] Test full workflow with Python project
- [ ] Test error handling and escalation

### Step 8: Documentation
- [ ] Update `CLAUDE.md` to mention phase agents
- [ ] Update workflow skill documentation
- [ ] Create examples for each phase agent
- [ ] Document troubleshooting common issues

---

## Success Criteria

### Functional Requirements
- [x] phase-testing-agent successfully runs tests for JS, Python, Go, Ruby, Rust, Java
- [x] phase-validation-agent runs all 6 validations and returns structured results
- [x] phase-pr-agent creates PR, links Jira, transitions ticket
- [x] Workflow skill successfully coordinates all phase agents
- [x] All agents can run in background mode
- [x] Agent outputs are properly parsed and validated

### Quality Requirements
- [x] All phase agents have test coverage
- [x] All edge cases documented and handled
- [x] Error messages are clear and actionable
- [x] Agents fail gracefully with helpful error messages
- [x] Retry loops work correctly and terminate

### Documentation Requirements
- [x] Each agent has complete AGENT.md specification
- [x] Input/output schemas documented
- [x] Workflow skill updated with agent integration
- [x] Examples provided for common use cases
- [x] Troubleshooting guide created

---

## Future Enhancements (Out of Scope)

1. **Additional Phase Agents:**
   - phase-exploration-agent (Phase 1 codebase analysis)
   - phase-implementation-agent (Phase 3 TDD implementation)
   - phase-documentation-agent (Phase 8 doc updates)

2. **Agent Registry:**
   - Central registry of all available agents
   - Version management
   - Dependency tracking

3. **Agent Composition:**
   - Agents can spawn other agents
   - Agent pipelines and DAGs
   - Conditional agent execution

4. **Agent Monitoring:**
   - Real-time agent status dashboard
   - Agent performance metrics
   - Agent failure alerts

5. **Agent Marketplace:**
   - Community-contributed agents
   - Agent templates and examples
   - Agent testing framework

---

## Files to Create/Modify

### New Files (13)
1. `skills/agents/README.md`
2. `skills/agents/AGENT_TEMPLATE.md`
3. `skills/agents/phase-testing-agent/AGENT.md`
4. `skills/agents/phase-testing-agent/protocol.md`
5. `skills/agents/phase-validation-agent/AGENT.md`
6. `skills/agents/phase-validation-agent/protocol.md`
7. `skills/agents/phase-pr-agent/AGENT.md`
8. `skills/agents/phase-pr-agent/protocol.md`
9. `skills/agents/run-agent.sh`
10. `skills/agents/check-agent.sh`
11. `skills/agents/validate-input.py`
12. Test directories and files (TBD based on testing approach)
13. Example files for each agent

### Modified Files (3)
1. `skills/workflow/SKILL.md` - Integrate phase agents
2. `skills/workflow/ENFORCEMENT.md` - Update validation enforcement
3. `CLAUDE.md` - Document phase agent architecture

---

## Estimated Effort

| Phase | Effort | Complexity |
|-------|--------|------------|
| Infrastructure Setup | 1 hour | Low |
| phase-testing-agent | 3 hours | Medium |
| phase-validation-agent | 4 hours | High |
| phase-pr-agent | 2 hours | Medium |
| Workflow Integration | 2 hours | Medium |
| Utilities | 1 hour | Low |
| Testing | 3 hours | Medium |
| Documentation | 2 hours | Low |
| **Total** | **18 hours** | **Medium-High** |

---

## Alternatives Considered

### Alternative 1: Keep Current Architecture
- **Pros:** No migration, working today
- **Cons:** Phases not reusable, complex coordination, no clear boundaries
- **Decision:** Rejected - doesn't address core problems

### Alternative 2: Make All Phases Agents
- **Pros:** Maximum modularity, complete separation
- **Cons:** Over-engineered, lose interactive workflow, excessive complexity
- **Decision:** Rejected - hybrid approach is better balance

### Alternative 3: Use Existing Task Tool Subagents
- **Pros:** No new abstraction, use existing patterns
- **Cons:** No standardization, no reusability, ad-hoc coordination
- **Decision:** Rejected - phase agents provide structure

---

## Rollout Plan

### Phase 1: Parallel Development (Week 1)
- Develop phase agents alongside existing workflow
- Test agents in isolation
- No changes to production workflow skill yet

### Phase 2: Opt-In Testing (Week 2)
- Add feature flag to workflow skill: `use_phase_agents=true`
- Users can opt into new architecture
- Collect feedback and iterate

### Phase 3: Default Switchover (Week 3)
- Make phase agents the default
- Old inline implementation available via `use_phase_agents=false`
- Monitor for issues

### Phase 4: Deprecation (Week 4+)
- Remove old inline implementations
- Phase agents are the only path
- Archive old documentation

---

## Questions for User Approval

1. **Scope Confirmation:** Should we implement all 3 phase agents (testing, validation, PR) or start with just one to validate the approach?

2. **Background Execution:** Should phase agents run in background by default, or only when explicitly requested?

3. **Error Escalation:** When a phase agent fails after retries, should it:
   - Return failure and let workflow decide what to do?
   - Automatically ask user for guidance?
   - Expose both modes via parameter?

4. **Language Detection:** Should agents:
   - Auto-detect language from project files?
   - Require explicit language parameter?
   - Try auto-detect with fallback to explicit parameter?

5. **Jira Integration:** For phase-pr-agent, should Jira integration be:
   - Attempted automatically if Atlassian MCP is configured?
   - Only used if explicitly enabled via parameter?
   - Optional with graceful degradation?

---

## Next Steps (After Approval)

1. Review this plan with user
2. Address questions and refine approach
3. Begin implementation with Phase 1 (Infrastructure Setup)
4. Implement phase-testing-agent first (smallest scope, clear boundaries)
5. Test and iterate based on learnings
6. Proceed to phase-validation-agent and phase-pr-agent
7. Integrate into workflow skill
8. Full integration testing
9. Documentation and examples
10. Rollout following phased approach

---

**Plan Status:** ✅ Ready for Review

Please review this plan and let me know:
- Any concerns or questions
- Preferred answers to the "Questions for User Approval"
- Whether to proceed with implementation
