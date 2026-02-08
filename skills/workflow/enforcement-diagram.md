# Workflow Enforcement Architecture

Visual representation of the multi-layer enforcement system.

## Enforcement Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER/AI WORKFLOW REQUEST                    │
│                         /workflow [task]                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: DOCUMENTATION                        │
│                                                                  │
│  skills/workflow/SKILL.md                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⛔ CRITICAL ENFORCEMENT warnings                          │  │
│  │ ✓ Explicit skill file reading in prompts                 │  │
│  │ ✓ VERIFICATION CHECKLIST before Phase 6                  │  │
│  │ ✓ Phase 6 gate with Phase 5 completion check             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Result: Requirements clearly documented, hard to miss          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│             LAYER 2: INTERACTIVE VALIDATION SCRIPT              │
│                                                                  │
│  skills/workflow/scripts/validate_phase.py                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ $ python3 validate_phase.py --phase 5                    │  │
│  │                                                           │  │
│  │ [Interactive Checklist]                                   │  │
│  │ ✓ Linter? (y/n): _                                        │  │
│  │ ✓ Build? (y/n): _                                         │  │
│  │ ✓ Tests? (y/n): _                                         │  │
│  │ ✓ Code review subagent? (y/n): _                         │  │
│  │ ✓ Security review subagent? (y/n): _                     │  │
│  │                                                           │  │
│  │ Exit code: 0 (pass) | 1 (fail)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Result: Human-in-the-loop verification, explicit confirmation  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 3: PRE-COMMIT HOOK (OPTIONAL)                │
│                                                                  │
│  .git/hooks/pre-commit                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ #!/bin/bash                                               │  │
│  │                                                           │  │
│  │ # Detect PARA workflow                                    │  │
│  │ if [ -d "context/plans" ]; then                           │  │
│  │     # Run validation script                               │  │
│  │     python3 validate_phase.py --phase 5                   │  │
│  │                                                           │  │
│  │     if [ $? -ne 0 ]; then                                 │  │
│  │         echo "⛔ Phase 5 incomplete - blocking commit"    │  │
│  │         exit 1                                            │  │
│  │     fi                                                    │  │
│  │ fi                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Bypass: git commit --no-verify (emergency only)                │
│  Result: Automatic enforcement, prevents accidental skip        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           LAYER 4: CI/CD VALIDATION (FUTURE)                    │
│                                                                  │
│  .github/workflows/validate-workflow.yml                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ name: Validate Workflow Compliance                        │  │
│  │                                                           │  │
│  │ on: pull_request                                          │  │
│  │                                                           │  │
│  │ jobs:                                                     │  │
│  │   validate:                                               │  │
│  │     - Check for context/summaries/YYYY-MM-DD-*.md         │  │
│  │     - Parse summary for review evidence                   │  │
│  │     - Verify both code + security review present          │  │
│  │     - Fail PR if validation missing                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Result: PR merge blocked without proof of validation           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  COMMIT OK   │
                      └──────────────┘
```

## Phase 5 Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 4 COMPLETE                         │
│                    (All tests pass)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 5: VALIDATION                         │
│                                                                  │
│  Launch 6 Validation Checks (MANDATORY)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Subagent   │  │   Subagent   │  │   Subagent   │          │
│  │   #1 Bash    │  │   #2 Bash    │  │   #3 Bash    │          │
│  │              │  │              │  │              │          │
│  │   Linter     │  │    Build     │  │    Tests     │          │
│  │              │  │              │  │              │          │
│  │ npm run lint │  │ npm run      │  │  npm test    │          │
│  │              │  │ build        │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │    Subagent #4           │  │    Subagent #5           │    │
│  │    General-Purpose       │  │    General-Purpose       │    │
│  │                          │  │                          │    │
│  │  Code Reviewer           │  │  Security Reviewer       │    │
│  │                          │  │                          │    │
│  │  Read skills/code-       │  │  Read skills/security-   │    │
│  │  reviewer/SKILL.md       │  │  reviewer/SKILL.md       │    │
│  │                          │  │                          │    │
│  │  Review all changes:     │  │  Audit all changes:      │    │
│  │  • Correctness           │  │  • Injection             │    │
│  │  • Readability           │  │  • XSS                   │    │
│  │  • Maintainability       │  │  • Auth issues           │    │
│  │  • Accessibility         │  │  • Data exposure         │    │
│  │  • i18n                  │  │  • Crypto                │    │
│  └──────────┬───────────────┘  └──────────┬───────────────┘    │
│             │                             │                     │
│             └──────────────┬──────────────┘                     │
│                            │                                    │
│                            ▼                                    │
│                  ┌────────────────────┐                         │
│                  │  ALL 6 COMPLETE?   │                         │
│                  └─────────┬──────────┘                         │
│                            │                                    │
│              ┌─────────────┼─────────────┐                      │
│              │             │             │                      │
│              NO           YES           NO                      │
│              │             │             │                      │
│              ▼             │             ▼                      │
│      ┌────────────┐        │      ┌────────────┐               │
│      │  FINDINGS  │        │      │  MISSING   │               │
│      │  TO FIX    │        │      │  SUBAGENT  │               │
│      └─────┬──────┘        │      └─────┬──────┘               │
│            │               │            │                       │
│            ▼               │            ▼                       │
│      ┌────────────┐        │      ┌────────────┐               │
│      │ Fix Issues │        │      │  STOP!     │               │
│      └─────┬──────┘        │      │  Go back   │               │
│            │               │      │  Launch it │               │
│            ▼               │      └─────┬──────┘               │
│      ┌────────────┐        │            │                       │
│      │  Re-run    │        │            │                       │
│      │  ALL 6     │◄───────┼────────────┘                       │
│      └─────┬──────┘        │                                    │
│            │               │                                    │
│            └───────────────┘                                    │
│                            │                                    │
│                            ▼                                    │
│                  ┌────────────────────┐                         │
│                  │ Run Validation     │                         │
│                  │ Script (Optional)  │                         │
│                  │                    │                         │
│                  │ validate_phase.py  │                         │
│                  │ --phase 5          │                         │
│                  └─────────┬──────────┘                         │
│                            │                                    │
│                            ▼                                    │
│                  ┌────────────────────┐                         │
│                  │   Exit code 0?     │                         │
│                  └─────────┬──────────┘                         │
│                            │                                    │
│                           YES                                   │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 5 COMPLETE                            │
│                   ✅ CLEARED FOR PHASE 6                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 6: COMMIT & PUSH                         │
│                                                                  │
│  Gate Check:                                                    │
│  ✓ Linter passed                                                │
│  ✓ Build passed                                                 │
│  ✓ Tests passed                                                 │
│  ✓ Code review completed                                        │
│  ✓ Security review completed                                    │
│  ✓ All findings addressed                                       │
│                                                                  │
│  $ git add .                                                    │
│  $ git commit -m "feat: implement feature"                      │
│  $ git push -u origin feature-branch                            │
└─────────────────────────────────────────────────────────────────┘
```

## What Went Wrong (Historical Incident)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 5: VALIDATION                         │
│                    (What should happen)                         │
│                                                                  │
│  Launch 6 Validation Checks:                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Linter  │  │  Build   │  │  Tests   │                      │
│  │    ✅    │  │    ✅    │  │    ✅    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Code Reviewer   │  │ Security Review  │                    │
│  │       ✅         │  │       ✅         │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  Result: ALL 6 complete → Proceed to Phase 6                    │
└─────────────────────────────────────────────────────────────────┘

                            vs.

┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 5: VALIDATION                         │
│                     (What actually happened)                    │
│                                                                  │
│  Only 3 of 6 checks launched:                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Linter  │  │  Build   │  │  Tests   │                      │
│  │    ✅    │  │    ✅    │  │    ✅    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Code Reviewer   │  │ Security Review  │                    │
│  │       ❌         │  │       ❌         │                    │
│  │    SKIPPED!      │  │    SKIPPED!      │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  Result: Incomplete validation → Proceeded to Phase 6 anyway!   │
│                                                                  │
│  Impact: S2S auth migration (security-sensitive) committed      │
│          without security audit or code review                  │
└─────────────────────────────────────────────────────────────────┘
```

## How Enforcement Prevents This

```
┌─────────────────────────────────────────────────────────────────┐
│                  WORKFLOW SKILL (LAYER 1)                       │
│                                                                  │
│  Before Phase 5 execution:                                      │
│  ⛔ CRITICAL ENFORCEMENT: You MUST launch ALL 6 checks          │
│                                                                  │
│  → Clear instruction, hard to misinterpret                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERIFICATION CHECKLIST (LAYER 1)                   │
│                                                                  │
│  Before Phase 6:                                                │
│  1. [ ] Linter subagent completed                               │
│  2. [ ] Build subagent completed                                │
│  3. [ ] Tests subagent completed                                │
│  4. [ ] Code review subagent completed                          │
│  5. [ ] Security review subagent completed                      │
│                                                                  │
│  IF any unchecked: STOP, go back, launch it                     │
│                                                                  │
│  → Explicit gate with checklist                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             VALIDATION SCRIPT (LAYER 2)                         │
│                                                                  │
│  $ python3 validate_phase.py --phase 5                          │
│                                                                  │
│  ✓ Code review subagent? (y/n): n                              │
│  ❌ FAILED: Code review subagent execution                      │
│                                                                  │
│  ⛔ PHASE 5 INCOMPLETE - Cannot proceed to Phase 6              │
│                                                                  │
│  Exit code: 1                                                   │
│                                                                  │
│  → Interactive confirmation, fails if missing                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PRE-COMMIT HOOK (LAYER 3)                          │
│                                                                  │
│  $ git commit -m "feat: add S2S auth"                           │
│                                                                  │
│  Running Phase 5 validation check...                            │
│  [validation script runs automatically]                         │
│                                                                  │
│  ⛔ Phase 5 validation FAILED                                   │
│  Commit blocked.                                                │
│                                                                  │
│  → Automatic enforcement, cannot commit without passing         │
└─────────────────────────────────────────────────────────────────┘
```

## Decision Tree: Should I Commit?

```
                    Ready to commit?
                          │
                          ▼
                 ┌─────────────────┐
                 │ Phase 4 tests   │
                 │ all passing?    │
                 └────────┬────────┘
                          │
                ┌─────────┼─────────┐
                │                   │
               NO                  YES
                │                   │
                ▼                   ▼
         ┌────────────┐    ┌─────────────────┐
         │ Fix tests  │    │ Phase 5 linter  │
         │ first      │    │ passing?        │
         └────────────┘    └────────┬────────┘
                                    │
                          ┌─────────┼─────────┐
                          │                   │
                         NO                  YES
                          │                   │
                          ▼                   ▼
                   ┌────────────┐    ┌─────────────────┐
                   │ Fix lint   │    │ Phase 5 build   │
                   │ errors     │    │ passing?        │
                   └────────────┘    └────────┬────────┘
                                              │
                                    ┌─────────┼─────────┐
                                    │                   │
                                   NO                  YES
                                    │                   │
                                    ▼                   ▼
                             ┌────────────┐    ┌────────────────────┐
                             │ Fix build  │    │ Code review        │
                             │ errors     │    │ subagent launched? │
                             └────────────┘    └─────────┬──────────┘
                                                         │
                                               ┌─────────┼─────────┐
                                               │                   │
                                              NO                  YES
                                               │                   │
                                               ▼                   ▼
                                        ┌─────────────┐   ┌────────────────────┐
                                        │ STOP!       │   │ Security review    │
                                        │ Launch code │   │ subagent launched? │
                                        │ reviewer    │   └─────────┬──────────┘
                                        └─────────────┘             │
                                                          ┌─────────┼─────────┐
                                                          │                   │
                                                         NO                  YES
                                                          │                   │
                                                          ▼                   ▼
                                                   ┌─────────────┐   ┌───────────────┐
                                                   │ STOP!       │   │ All findings  │
                                                   │ Launch      │   │ addressed?    │
                                                   │ security    │   └───────┬───────┘
                                                   │ reviewer    │           │
                                                   └─────────────┘  ┌────────┼────────┐
                                                                    │                 │
                                                                   NO                YES
                                                                    │                 │
                                                                    ▼                 ▼
                                                             ┌──────────────┐  ┌────────────┐
                                                             │ Fix issues   │  │ ✅ COMMIT  │
                                                             │ Re-validate  │  │ ALLOWED    │
                                                             └──────────────┘  └────────────┘
```

## Summary

**Multi-Layer Defense:**

1. **Documentation** - Clear requirements in SKILL.md
2. **Interactive Script** - Human verification with checklist
3. **Git Hook** - Automatic enforcement, blocks bad commits
4. **CI/CD** (future) - Final safety net at PR merge

**Key Insight:** One layer can be missed. Multiple layers ensure compliance.

**Result:** Security-sensitive changes like S2S auth migration cannot proceed without proper validation.
