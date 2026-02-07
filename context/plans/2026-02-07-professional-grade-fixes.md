# Plan: Professional Grade Codebase Fixes

**Date:** 2026-02-07
**Status:** Executing
**Based on:** `opus-4.6-review.md` findings
**Branch:** `fix/professional-grade-codebase-fixes`

## Objective

Fix all issues identified in the Opus 4.6 review to bring the codebase to professional grade. Address all High, Medium, and Low severity findings systematically.

## Scope

### High Priority (H1-H6) - Schema/Correctness
- [x] 1. Fix `validate-input.py` schema drift (H1, H2, dead code H5->L5)
- [x] 2. Fix "5 checks" -> "6 checks" everywhere (H3)
- [x] 3. Fix `test_command` schema to allow null (H4)
- [x] 4. Normalize `retry_count` naming across agents (H5) — PR agent now has `retry_count`; validation agent keeps `total_retries` (semantically correct as sum of per-check retries)
- [x] 5. Add `retry_count` to PR agent output schema, examples, and field descriptions (H6)

### Medium Priority (M1-M8) - Documentation Gaps
- [ ] 6. Write missing summary for autonomous execution task (M1) — skipped: context.md already documents it
- [ ] 7. Archive completed plans and summaries (M2) — deferred: active context references them
- [x] 8. Fix ghost reference to `skills/agents/protocol.md` (M3)
- [x] 9. Remove phantom `tests/` from agents README (M4)
- [x] 10. Fix hardcoded user path in setup skill (M5)
- [x] 11. Fix absolute path in validation protocol (M6)
- [x] 12. Move PHASE5-ENFORCEMENT-SUMMARY.md to archives (M7)
- [x] 13. Add missing skills to CLAUDE.md (M8)

### Low Priority (L1-L16) - Consistency
- [x] 14. Fix para name mismatch (L1)
- [x] 15. Add triggers to skill-creator and mcp-builder (L2)
- [x] 16. Normalize `reference/` -> `references/` in skill-creator (L3)
- [x] 17. Add language aliases to validation agent (L4)
- [x] 18. Fix dead code in validate-input.py (L5)
- [x] 19. Fix Pydantic @validator -> @field_validator (L6)
- [x] 20. Normalize execution_time_ms to integer (L7)
- [x] 21. Remove emojis from mcp-builder headers (L8)
- [x] 22. Fix retry backoff values in README (L9)
- [x] 23. Update plan statuses and checkboxes (L10, L11)
- [x] 24. Update context.md (L12)
- [x] 25. Document docs/ and llm_review/ (L13) — skipped: both directories are empty
- [x] 26. Fix README missing commands and MCP (L15, L16)

### Additional fixes found during execution
- [x] Fix "5 validations" -> "6 validations" in hybrid workflow summary
- [x] Add agents directory to README directory tree
- [x] Add skill-creator and mcp-builder to README directory tree

## Approach

Parallel execution of independent file edits, grouped by file.
