# Product Proposal Validation Protocol

This document defines the mandatory validation process for product proposals in Phase 1 (Planning) of the workflow.

## When to Use This Protocol

Use this protocol when the input to Phase 1 is a **product proposal** rather than a specific implementation task or Jira ticket. Product proposals are high-level feature descriptions that need to be broken down into concrete, testable user stories with corresponding E2E tests.

**Triggers:**
- User provides a product proposal document
- User describes a feature without specific implementation details
- Input lacks concrete user stories or acceptance criteria
- Work involves user-facing functionality that needs validation

---

## Core Requirements

### 1. User Stories Validation

**Every product proposal MUST be broken down into concrete user stories.**

#### Identify Implied Stories

- Analyze the proposal to extract ALL user-facing functionality
- Identify different user roles and their interactions
- Break down complex features into independent, vertical slices
- Do NOT leave high-level features without implementation stories

#### User Story Quality Standards

Each user story MUST have:

1. **Clear, Concise Title**
   - Format: "As a [role], I can [action] so that [benefit]"
   - Example: "As a user, I can reset my password so that I can regain access to my account"
   - Keep under 70 characters when possible

2. **Detailed Description**
   - **Context:** Why this story exists, business justification
   - **Scope:** What is included and explicitly NOT included
   - **User workflow:** Step-by-step user journey
   - **Edge cases:** Known scenarios to handle

3. **Clear Acceptance Criteria**
   - Format: "Given [context], when [action], then [outcome]"
   - Each criterion is independently testable
   - Covers both happy path and key edge cases
   - Defines "done" unambiguously

4. **Independence**
   - Story can be developed and tested without waiting for other stories (minimize dependencies)
   - Has clear boundaries and interfaces
   - Can be demoed independently

5. **Vertical Slice**
   - Includes all layers: UI, API, business logic, data access
   - Delivers end-to-end value to the user
   - Not just "build the API" or "build the UI" separately

**Example of a complete user story:**

```markdown
### Story: User Password Reset

**Title:** As a user, I can reset my password so that I can regain access to my account

**Description:**
- **Context:** Users sometimes forget passwords and need a secure way to reset them without contacting support
- **Scope:** Includes password reset request, email delivery, token validation, and password update. Does NOT include account recovery via SMS or security questions (future work)
- **User workflow:**
  1. User clicks "Forgot Password" on login page
  2. User enters email address
  3. System sends reset link via email
  4. User clicks link (opens password reset page)
  5. User enters new password (with confirmation)
  6. User is logged in with new password

**Acceptance Criteria:**
- Given a valid registered email, when I request password reset, then I receive an email with a reset link within 1 minute
- Given a password reset link, when I click it within 24 hours, then I can set a new password
- Given an expired reset link (>24 hours), when I click it, then I see an error message and option to request a new link
- Given a new password entry, when it meets complexity requirements (8+ chars, 1 uppercase, 1 number), then it is accepted
- Given a weak password, when I submit it, then I see specific validation errors
- Given a successful password reset, when I log in with the new password, then I gain access to my account
```

#### Missing Stories = Generate Them

If the proposal lacks complete user stories:

1. **Identify gaps:** What user-facing functionality is implied but not documented?
2. **Generate stories:** Create missing stories following the quality standards above
3. **Validate completeness:** Ensure every user action, screen, and workflow has a corresponding story
4. **Present for approval:** Show generated stories to user before proceeding

---

### 2. End-to-End (E2E) Test Coverage

**Every user story MUST have at least one corresponding E2E test.**

#### E2E Test Requirements

Each E2E test MUST:

1. **Clearly State the User Journey**
   - Describe the complete workflow being validated
   - Reference the related user story explicitly
   - Use human-readable test names

2. **Define Expected Outcomes**
   - What the user sees/experiences at each step
   - Success criteria (visual elements, state changes, navigation)
   - Error scenarios and their handling

3. **Cover Critical Happy Path**
   - Primary user workflow from start to finish
   - Most common user actions
   - Expected success scenario

4. **Include Key Edge Cases**
   - Validation errors
   - Timeout scenarios
   - Permission/auth boundaries
   - Empty states, error states

**Example E2E test specification:**

```markdown
### E2E Test: Password Reset Flow

**Related Story:** User Password Reset

**User Journey:**
1. Navigate to login page
2. Click "Forgot Password" link
3. Enter valid email address
4. Submit form
5. Check email inbox (via email testing tool)
6. Click password reset link from email
7. Enter new password
8. Confirm new password
9. Submit password reset form
10. Verify redirect to dashboard (logged in)

**Expected Outcomes:**
- Step 4: Success message "Check your email for reset link"
- Step 6: Password reset page loads with token in URL
- Step 8: Password strength indicator shows "Strong" (if password is strong)
- Step 10: User sees dashboard with their name displayed

**Edge Cases Covered:**
- Invalid email: Shows "No account found" error
- Expired token: Shows "Link expired, request new one" error
- Weak password: Shows validation errors before submission
- Mismatched passwords: Shows "Passwords do not match" error
```

#### Playwright MCP Integration

For UI features, E2E tests MUST use Playwright MCP (MANDATORY):

**Tools:** `browser_navigate`, `browser_click`, `browser_type`, `browser_snapshot`, `browser_wait_for`, `browser_take_screenshot`

**Example test implementation outline:**

```javascript
describe('Password Reset Flow', () => {
  test('User can reset password via email link', async () => {
    // 1. Navigate to login page
    await browser_navigate({ url: 'https://app.example.com/login' });

    // 2. Click "Forgot Password"
    await browser_click({ ref: '[data-testid="forgot-password-link"]' });

    // 3. Enter email
    await browser_type({ ref: '[data-testid="email-input"]', text: 'user@example.com' });

    // 4. Submit
    await browser_click({ ref: '[data-testid="submit-button"]' });

    // 5. Verify success message
    await browser_wait_for({ text: 'Check your email' });

    // 6. Get reset link from email (via email testing tool)
    const resetLink = await getPasswordResetLink('user@example.com');

    // 7. Navigate to reset link
    await browser_navigate({ url: resetLink });

    // 8. Enter new password
    await browser_type({ ref: '[data-testid="new-password"]', text: 'NewSecure123!' });
    await browser_type({ ref: '[data-testid="confirm-password"]', text: 'NewSecure123!' });

    // 9. Submit
    await browser_click({ ref: '[data-testid="reset-submit"]' });

    // 10. Verify redirect to dashboard
    await browser_wait_for({ text: 'Welcome' });
    const snapshot = await browser_snapshot();
    expect(snapshot).toContain('Dashboard');
  });
});
```

#### Coverage Gap Detection

**No user-facing functionality should exist without E2E coverage.**

If gaps are found:
1. **Identify:** Which stories lack E2E tests?
2. **Generate:** Create missing E2E test specifications
3. **Document:** Add to Coverage Gaps section of output
4. **Escalate if ambiguous:** If user journey is unclear, use AskUserQuestion

---

### 3. Output Format

Structure the validation output as follows:

```markdown
# Product Proposal Validation: [Feature Name]

## Product Proposal Summary

[Brief 2-3 sentence summary of the proposal]

**Key objectives:**
- Objective 1
- Objective 2
- Objective 3

---

## User Stories

### Story 1: [Title]

**Description:**
- **Context:** [Why this exists]
- **Scope:** [What's included/excluded]
- **User workflow:** [Step-by-step]

**Acceptance Criteria:**
- Given [context], when [action], then [outcome]
- Given [context], when [action], then [outcome]
- [Additional criteria...]

**Related E2E Test(s):**
- E2E Test: [Test name and key steps]
- [Additional E2E tests if multiple scenarios]

---

### Story 2: [Title]

[Same structure as Story 1]

---

[Additional stories...]

---

## E2E Test Coverage Summary

| User Story | E2E Test(s) | Status |
|------------|-------------|--------|
| Story 1    | Test 1, Test 2 | ✅ Complete |
| Story 2    | Test 3      | ✅ Complete |
| Story 3    | Test 4      | ✅ Complete |

**Total Stories:** X
**Total E2E Tests:** Y
**Coverage:** 100% (all stories have at least one E2E test)

---

## Coverage Gaps (If Any)

### Gaps Found and Resolved

1. **Gap:** [Description of missing story or E2E test]
   - **Resolution:** [What was added]
   - **Status:** ✅ Resolved

2. **Gap:** [Another gap]
   - **Resolution:** [What was added]
   - **Status:** ✅ Resolved

### Remaining Gaps (Requires User Input)

[ONLY if there are unresolvable gaps due to ambiguity]

1. **Gap:** [Description]
   - **Reason:** [Why it couldn't be resolved automatically]
   - **Action needed:** [What user should clarify]

---

## Dependencies

[If stories have dependencies on each other or external systems]

**Backend dependencies:**
- Story X depends on API contract from Story Y

**Frontend dependencies:**
- Story Z requires completion of authentication story

**External dependencies:**
- Email service integration required for password reset

**Parallel work opportunities:**
- Stories A, B, C can be developed in parallel (no blocking dependencies)

---

## Implementation Readiness Checklist

- [ ] All user stories have clear title, description, and acceptance criteria
- [ ] All user stories are independently testable
- [ ] All user stories represent vertical slices
- [ ] All user stories have at least one E2E test
- [ ] All E2E tests define user journey and expected outcomes
- [ ] All E2E tests cover happy path
- [ ] Key edge cases are covered in E2E tests
- [ ] No coverage gaps remain (or gaps are documented for user review)
- [ ] Dependencies are explicitly identified
- [ ] Parallel work opportunities are identified

---

## Next Steps

1. **Review and approve** this validation output
2. **Create Jira tickets** for approved stories (if using Atlassian MCP)
3. **Proceed to Phase 2** (Git Worktree) to begin implementation
4. **Implement E2E tests** in Phase 3 (Execute) using Playwright MCP
```

---

## Language and Style

- **Be concrete:** Use specific, implementation-ready language
- **Avoid vague terms:** No "should", "might", "probably"
- **Be explicit:** If a story isn't clear, generate it rather than leaving it implied
- **Be complete:** Don't skip edge cases or error scenarios
- **Be testable:** Every story should be verifiable through tests

---

## Integration with Workflow Phases

This protocol executes in **Phase 1 (Plan)** before creating the implementation plan:

```
Phase 1 Flow with Product Proposal:
1. Receive product proposal
2. Apply Product Proposal Validation Protocol (THIS DOCUMENT)
   a. Validate/generate user stories
   b. Validate/generate E2E test coverage
   c. Output structured validation results
3. Present validation output to user for approval
4. After approval: Create Jira tickets (if configured)
5. Continue with standard Phase 1: Create implementation plan
6. Proceed to Phase 2 (Git Worktree) after plan approval
```

**Key principle:** Product proposals are transformed into concrete, testable, implementation-ready user stories BEFORE the implementation plan is created.

---

## Examples

### Example 1: Missing User Stories

**Input proposal:** "Add shopping cart functionality"

**Validation identifies gaps:**
- ❌ No story for "Add item to cart"
- ❌ No story for "Remove item from cart"
- ❌ No story for "Update item quantity"
- ❌ No story for "View cart contents"
- ❌ No story for "Checkout from cart"

**Action:** Generate all 5 missing stories with full structure (title, description, acceptance criteria, E2E tests)

---

### Example 2: Missing E2E Tests

**Input proposal has stories but no E2E tests:**

| User Story | E2E Test | Status |
|------------|----------|--------|
| Add to cart | ❌ Missing | Gap |
| Remove from cart | ❌ Missing | Gap |
| Update quantity | ❌ Missing | Gap |

**Action:** Generate E2E test specifications for all 3 stories covering happy path + key edge cases

---

### Example 3: Incomplete Acceptance Criteria

**Input story:** "As a user, I can search for products"

**Problems:**
- ❌ No description (missing context, scope, workflow)
- ❌ No acceptance criteria
- ❌ No E2E test

**Action:** Enhance story with:
- Description (context: why search matters, scope: what's searchable, workflow: how user searches)
- Acceptance criteria (search by keyword, filter by category, sort results, empty results handling)
- E2E test (enter search term, verify results, apply filter, verify filtered results)

---

## Quality Assurance

Before presenting output to user, verify:

1. ✅ Every story has all required fields (title, description, acceptance criteria)
2. ✅ Every story is independently testable
3. ✅ Every story has at least one E2E test
4. ✅ Every E2E test defines user journey and expected outcomes
5. ✅ No vague or ambiguous language
6. ✅ Dependencies are explicitly identified
7. ✅ Output follows the structured format

**If any check fails:** Resolve before presenting to user. DO NOT present incomplete validation.

---

## Escalation to User

Use `AskUserQuestion` when:

1. **Ambiguous requirements:** Proposal doesn't clearly indicate expected behavior
2. **Multiple valid approaches:** More than one way to implement user story
3. **Missing business logic:** Acceptance criteria depend on undocumented business rules
4. **Conflicting requirements:** Proposal has contradictory statements

**Example escalation:**

```javascript
AskUserQuestion({
  questions: [{
    question: "The proposal mentions 'cart expiration' but doesn't specify the timeout duration. What should the cart expiration policy be?",
    header: "Cart Expiration",
    options: [
      { label: "30 minutes", description: "Cart expires after 30 minutes of inactivity" },
      { label: "24 hours", description: "Cart persists for 24 hours" },
      { label: "Never", description: "Cart persists until user manually clears it" },
    ],
    multiSelect: false
  }]
})
```

---

## Success Criteria

Product proposal validation is complete when:

1. ✅ All implied user stories are documented
2. ✅ All user stories meet quality standards
3. ✅ All user stories have E2E test coverage
4. ✅ All E2E tests define user journeys and expected outcomes
5. ✅ All gaps are resolved or documented for user review
6. ✅ Output is structured and ready for implementation
7. ✅ User has approved the validation output

**Only then proceed to creating the implementation plan and subsequent workflow phases.**
