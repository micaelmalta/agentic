# PARA Decision Framework

## Should I Use PARA?

### Use PARA Workflow When:

| Scenario                  | Reason                                          |
| ------------------------- | ----------------------------------------------- |
| Adding new features       | Needs planning and documentation                |
| Fixing bugs (non-trivial) | Requires investigation and approach             |
| Refactoring code          | Must document before/after and rationale        |
| Architecture changes      | Critical to plan and record decisions           |
| Performance optimization  | Need baseline, approach, and results            |
| Security fixes            | Must document vulnerability and fix             |
| API changes               | Breaking changes need careful planning          |
| Database migrations       | Requires careful planning and rollback strategy |
| Dependency updates        | Potential for breaking changes                  |
| Config changes (complex)  | Need to understand impact                       |

**Rule of thumb:** If it results in git changes, use PARA workflow.

### Skip PARA Workflow For:

| Scenario                     | Alternative           |
| ---------------------------- | --------------------- |
| "What does function X do?"   | Direct conversation   |
| "Show me where Y is defined" | Use search/navigation |
| "How does Z work?"           | Ask for explanation   |
| "List all API endpoints"     | Direct query          |
| "Explain this error message" | Direct conversation   |
| Quick typo fixes             | Just fix it           |
| Documentation reading        | Direct conversation   |
| Code review comments         | Direct conversation   |

**Rule of thumb:** If it's read-only or informational, skip PARA.
