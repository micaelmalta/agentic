# Plan: Make Workflow Fully Autonomous After Plan Approval

**Date:** 2026-02-05
**Status:** Approved

## Objective

Fix the workflow skill so that after plan approval, it executes ALL phases (2-8) autonomously without stopping to ask permission between phases.

## Problem

Currently, the workflow stops between phases and asks "should I proceed to next phase?" This breaks the autonomous execution flow. Users report:

1. After plan approval, agents stop and ask to continue to next step
2. Multiple options are presented instead of automatically proceeding with the best option

## Root Cause

The workflow skill has ambiguous language that causes the AI to:
- Interpret "BLOCKING REQUIREMENT" too broadly
- Present options and wait for user selection
- Ask permission before each phase transition

The ONLY approval gate should be after Phase 1 (Plan). All other phases should execute automatically.

## Approach

### Changes to `skills/para/SKILL.md`

**Problem:** The Execute Phase description is vague and doesn't state that all plan steps execute autonomously.

**Changes needed:**

1. **Update Execute Phase section (lines 80-96)**
   - Replace "What happens:" with clear autonomous execution language
   - Add: "Execute ALL steps in plan autonomously without stopping between steps"
   - Add: "Only stop on: errors after retries, user interrupt, critical blockers"

2. **Add "Autonomous Step Execution" subsection**
   ```markdown
   **Autonomous Step Execution:**

   When you run `/execute`, ALL steps in the plan execute autonomously:
   - Work through steps 1, 2, 3... N sequentially
   - Show progress: "Step X/N: [step description]"
   - Don't ask "should I proceed to next step?" - just proceed
   - Make best-choice decisions without asking
   - Only escalate if: stuck after retries, critical blocker, conflicting requirements
   ```

3. **Add decision-making guidance**
   - "When multiple options exist: pick the best and proceed"
   - "Never ask 'which approach should I use?' between steps"
   - "Only ask user if genuinely stuck or requirements conflict"

### Changes to `skills/workflow/SKILL.md`

1. **Add "Autonomous Execution" section after Phase 1**
   - Make explicit that plan approval = execution approval for ALL phases
   - State that phases 2-8 run WITHOUT interruption
   - Define when to stop (gate failures, user interrupt, technical blockers)

2. **Modify Phase 1 Approval Gate language**
   - Change from "Present plan to user for review"
   - To "Present plan to user for ONE-TIME approval"
   - Add: "Approval of plan = approval to execute ALL phases autonomously"

3. **Add "Decision-Making Protocol" section**
   - When multiple options exist: "Pick the best option and proceed"
   - Never ask "which option should I use?" - make the decision
   - Only escalate to user if: stuck after retries, critical security issue, conflicting requirements

4. **Update "BLOCKING REQUIREMENT" language**
   - Clarify it means "don't skip phases" not "ask permission between phases"
   - Rename to "PHASE SEQUENCING REQUIREMENT" to avoid confusion

5. **Add progress visibility requirements**
   - Show "Phase X/8: [Phase Name]" headers
   - Use TodoWrite to track phase progress
   - Report phase completion, don't ask to continue

## Implementation Steps

### Part 1: Fix Workflow Skill

1. Read current workflow skill
2. Add new "Autonomous Execution" section after Phase 1 description
3. Modify Phase 1 "Approval Gate" section with stronger language
4. Add "Decision-Making Protocol" section before Phase 1
5. Replace "BLOCKING REQUIREMENT" with "PHASE SEQUENCING REQUIREMENT"
6. Add phase progress reporting patterns
7. Update example workflows to show autonomous execution

### Part 2: Fix Para Skill

1. Read current para skill
2. Update "Execute Phase" section (line 80-96) to be explicit:
   - `/execute` means execute ALL steps in plan autonomously
   - Don't stop between plan steps to ask permission
   - Only stop on: errors after retries, user interrupt, critical blockers
3. Add "Autonomous Execution" subsection under Execute Phase
4. Add decision-making guidance (make best choice, don't ask for each decision)
5. Add progress visibility (show "Step X/N" as each step completes)

### Part 3: Testing

1. Test with multi-step plan via workflow
2. Approve plan
3. Verify phases 2-8 execute without asking permission
4. Verify plan steps within execute phase run without asking
5. Verify appropriate escalation on gate failures

## Affected Files

- `skills/workflow/SKILL.md` - Main workflow changes
- `skills/para/SKILL.md` - Para execution phase changes

## Edge Cases

- What if plan needs mid-execution changes? → Document in execution notes, adjust as needed
- What if user wants to pause? → They can interrupt at any time (Ctrl+C equivalent)
- What if gate fails multiple times? → Escalate after 3 attempts per existing retry logic

## Testing Strategy

After changes:
1. Run workflow with multi-step plan
2. Approve plan
3. Verify phases 2-8 execute without asking permission
4. Verify appropriate escalation on gate failures

## Success Criteria

- [ ] Plan approval triggers autonomous execution of phases 2-8
- [ ] No "should I proceed?" questions between phases
- [ ] Agent makes best-choice decisions without asking
- [ ] Only stops on: gate failure, user interrupt, critical blocker
- [ ] Progress is visible with phase headers and TodoWrite tracking
