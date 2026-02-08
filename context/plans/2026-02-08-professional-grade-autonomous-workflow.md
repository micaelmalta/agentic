# Plan: Professional-Grade Autonomous Dev Workflow

**Date:** 2026-02-08
**Objective:** Review and fix all issues across the entire skills collection to achieve a professional-grade, fully autonomous development workflow.

---

## Approach

Comprehensive review of all 18 skills, 3 phase agents, supporting scripts, and orchestration documents. Findings grouped into actionable fix categories that improve autonomy, consistency, and reliability.

---

## Findings & Implementation Steps

### Category 1: Skill Depth & Quality Gaps (Thin Skills)

Several skills are too thin to provide meaningful autonomous guidance:

| Skill | Lines | Issue |
|-------|-------|-------|
| refactoring | 63 | No depth on large-scale refactoring, when NOT to refactor, or performance implications |
| dependencies | 69 | Missing major version upgrade strategy, breaking change handling, supply chain security |
| documentation | 77 | Missing ADR structure, API versioning docs, no MCP examples |
| debugging | 99 | Missing flaky test handling, production debugging, log analysis patterns |

**Fix:** Expand each skill with missing sections, examples, and integration guidance.

### Category 2: Cross-Skill Consistency Issues

1. **No unified severity model** - code-reviewer uses Critical/Suggestion/Nit; security-reviewer uses Critical/High/Medium/Low; others have none
2. **No cross-skill invocation mechanism** - skills say "invoke security-reviewer" but don't say HOW
3. **MCP integration inconsistencies** - some skills show Datadog/Playwright examples, others just mention them vaguely
4. **Blocking condition enforcement** - testing says "MANDATORY" but no mechanism to enforce at workflow level

**Fix:** Standardize severity model, add invocation instructions, unify MCP patterns.

### Category 3: Tech Proposal Template Gaps

Missing critical sections:
- Backwards compatibility strategy
- Success metrics / measurement plan
- Failure modes & recovery strategies
- Cost implications (infra, licenses, operational)

**Fix:** Add missing sections to template.

### Category 4: Script Quality Issues

| Script | Issue |
|--------|-------|
| `pre-commit-validation.sh` | Silent pass-through when validation script missing; `$NON_INTERACTIVE_FLAG` unquoted |
| `validate-input.py` | No file size limit; no IO error handling beyond FileNotFoundError |
| `check-agent.sh` | No path validation; fragile completion marker check |
| `rlm.py` | `errors='ignore'` silently corrupts; no logging of skipped files; linear search |
| `setup_mcp.js` | Silently ignores read errors; no atomic writes; no JSON validation |
| `connections.py` | Fragile tuple unpacking; generic BaseException catch |
| `evaluation.py` | Generic exception catching; no response size limit |
| `init_skill.py` | Generic exception catching; no max length validation; race condition |
| `package_skill.py` | Generic exception catching; no ZIP integrity validation |
| `quick_validate.py` | Fragile frontmatter parsing; no file size limit |

**Fix:** Harden all scripts with specific exceptions, size limits, validation, and proper error handling.

### Category 5: Agent Documentation Gaps

- Agent invocation examples reference reading AGENT.md at runtime - but no fallback if agent doc changes
- No agent versioning or changelog enforcement
- Protocol.md files have comprehensive schemas but no validation at invocation time (the validate-input.py is separate, not auto-invoked)

**Fix:** Add version fields to protocols, improve invocation patterns.

### Category 6: Workflow Orchestration Gaps

- No unified mechanism for skill-to-skill communication/delegation
- Workflow SKILL.md references enforcement script but doesn't auto-invoke it
- Phase gate verification is manual (Python script) not programmatic
- No guidance on what happens when a skill discovers it needs to delegate to another skill mid-execution

**Fix:** Add cross-skill delegation patterns and programmatic gate verification.

### Category 7: README and CLAUDE.md Alignment

- README.md lacks troubleshooting section
- README.md doesn't mention minimum Python version (3.10+)
- CLAUDE.md is comprehensive but could better reflect the actual skill invocation patterns
- Missing keybindings-help skill from CLAUDE.md skill list

**Fix:** Update README and CLAUDE.md for completeness and accuracy.

---

## Affected Files (Estimated ~35 files)

### Skills to expand:
- `skills/refactoring/SKILL.md`
- `skills/dependencies/SKILL.md`
- `skills/documentation/SKILL.md`
- `skills/debugging/SKILL.md`

### Skills to standardize:
- `skills/code-reviewer/SKILL.md`
- `skills/testing/SKILL.md`
- `skills/architect/tech_proposal_template.md`
- `skills/git-commits/SKILL.md`
- `skills/security-reviewer/SKILL.md`
- `skills/performance/SKILL.md`
- `skills/ci-cd/SKILL.md`
- `skills/rlm/SKILL.md`
- `skills/setup/SKILL.md`
- `skills/skill-creator/SKILL.md`
- `skills/mcp-builder/SKILL.md`

### Scripts to harden:
- `skills/workflow/scripts/pre-commit-validation.sh`
- `skills/agents/validate-input.py`
- `skills/agents/check-agent.sh`
- `skills/rlm/rlm.py`
- `skills/setup/setup_mcp.js`
- `skills/mcp-builder/scripts/connections.py`
- `skills/mcp-builder/scripts/evaluation.py`
- `skills/skill-creator/scripts/init_skill.py`
- `skills/skill-creator/scripts/package_skill.py`
- `skills/skill-creator/scripts/quick_validate.py`

### Orchestration docs:
- `skills/workflow/SKILL.md`
- `skills/workflow/PARALLEL.md`
- `skills/workflow/AGENTS.md`

### Top-level docs:
- `README.md`
- `CLAUDE.md`

### Context:
- `context/context.md`

---

## Edge Cases & Risks

- **Context window limits**: Expanding skills increases token usage. Use progressive disclosure (brief inline + detailed references).
- **Breaking changes**: Changes to skill protocols could affect existing workflows. Keep backwards compatible.
- **Over-engineering**: Add only what's needed for autonomous operation. Don't gold-plate.

---

## Testing Strategy

- Validate all Python scripts parse and run without errors
- Validate shell scripts with `bash -n` syntax check
- Validate all YAML frontmatter parses correctly
- Verify cross-references between skills are valid
- Verify all file paths referenced in docs exist
