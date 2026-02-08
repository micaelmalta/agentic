---
name: developer
description: "Implement code using TDD (Test-Driven Development). Write tests first, then code. Use for features, bug fixes, and refactoring with Red-Green-Refactor cycle."
triggers:
  - "/dev"
  - "/developer"
  - "implement this"
  - "write the code"
  - "code this feature"
  - "TDD"
  - "test-driven"
  - "red green refactor"
---

# Developer Skill

## Core Philosophy

**"Test First, Code Second."** (TDD - Test-Driven Development)

Write tests that define expected behavior BEFORE writing implementation code. This ensures code is testable, requirements are clear, and regressions are prevented.

---

## TDD Principles (MANDATORY)

All code changes follow **Test-Driven Development**:

| Task Type     | TDD Approach                                                       |
| ------------- | ------------------------------------------------------------------ |
| **Bug Fix**   | Write a failing test that reproduces the bug FIRST, then fix       |
| **Feature**   | Write tests that define expected behavior FIRST, then implement    |
| **Refactor**  | Ensure tests exist and pass, refactor, verify tests still pass     |

---

## The Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│  1. RED        →    2. GREEN      →    3. REFACTOR              │
│  Write failing      Write minimum       Clean up code           │
│  test               code to pass        (tests stay green)      │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Red Phase

Write a test that:
- Defines the expected behavior clearly
- Fails when run (because code doesn't exist yet)
- Fails for the RIGHT reason (not syntax error, missing import, etc.)

### 2. Green Phase

Write the MINIMUM code to make the test pass:
- Don't over-engineer
- Don't add features not covered by tests
- Focus only on making the current test pass

### 3. Refactor Phase

Clean up while keeping tests green:
- Remove duplication
- Improve naming
- Simplify logic
- Run tests after each change

---

## Protocol by Task Type

### Feature Implementation (TDD)

**Execution Order:**

```
1. Write test (expect failure)
2. Run test (verify it fails for right reason)
3. Write minimum code
4. Run test (verify it passes)
5. Refactor
6. Run test (verify still passes)
7. Repeat for next behavior
```

**Actions:**

1. Break feature into small, testable behaviors
2. For each behavior:
   - Write a failing test that describes the behavior
   - Run test, confirm it fails
   - Write the simplest code to make it pass
   - Run test, confirm it passes
   - Refactor if needed, keeping tests green
3. Continue until all behaviors are implemented

**Example Flow:**

```
Feature: User login

Behavior 1: Valid credentials return success
  → Write test: expect login("user", "pass") to return { success: true }
  → Run test: FAILS (function doesn't exist)
  → Write code: implement login function
  → Run test: PASSES
  → Refactor: extract validation logic

Behavior 2: Invalid password returns error
  → Write test: expect login("user", "wrong") to return { error: "invalid" }
  → Run test: FAILS (always returns success)
  → Write code: add password validation
  → Run test: PASSES
  → Refactor: none needed
```

### Bug Fix (TDD)

**Execution Order:**

```
1. Understand the bug (symptoms, reproduction steps)
2. Write a failing test that reproduces the bug
3. Run test (verify it fails, confirming the bug)
4. Fix the code
5. Run test (verify it passes, confirming the fix)
6. Run all tests (verify no regressions)
```

**Actions:**

1. Understand the bug:
   - What is the expected behavior?
   - What is the actual behavior?
   - What inputs/conditions trigger it?

2. Write reproduction test:
   - Create test that exercises the buggy code path
   - Assert the EXPECTED (correct) behavior
   - Test should FAIL (proving the bug exists)

3. Fix the bug:
   - Make minimal change to fix root cause
   - Don't fix symptoms; fix the cause

4. Verify:
   - Reproduction test now passes
   - All other tests still pass
   - Add comment in test explaining what bug it prevents

**Example Flow:**

```
Bug: User discount not applied for orders over $100

1. Write test:
   test("applies 10% discount for orders over $100", () => {
     const order = createOrder({ total: 150 });
     applyDiscounts(order);
     expect(order.total).toBe(135); // 10% off
   });

2. Run test: FAILS (order.total is still 150)
   → Bug confirmed!

3. Fix code:
   // Found: discount check was > 100 instead of >= 100
   if (order.subtotal >= 100) { ... }

4. Run test: PASSES
   → Bug fixed!

5. Run all tests: ALL PASS
   → No regressions
```

### Refactoring (with TDD Safety Net)

**Execution Order:**

```
1. Ensure tests exist for code being refactored
2. Run tests (verify all pass - baseline)
3. Make ONE refactoring change
4. Run tests (verify still pass)
5. Repeat steps 3-4
6. Final test run to confirm no regressions
```

**Actions:**

1. Before refactoring:
   - Verify adequate test coverage exists
   - If tests are missing, write them FIRST
   - Establish passing baseline

2. During refactoring:
   - Make small, incremental changes
   - Run tests after EACH change
   - If tests fail, undo and try smaller step

3. Common refactoring patterns:
   - Extract function/method
   - Rename for clarity
   - Remove duplication
   - Simplify conditionals
   - Break up large functions

**Golden Rule:** Tests must pass before AND after. Behavior unchanged.

---

## Code Quality Gates

Before considering implementation complete:

- [ ] Tests written BEFORE implementation code (TDD)
- [ ] All tests pass
- [ ] Code follows project conventions
- [ ] No security vulnerabilities introduced
- [ ] Changes are minimal and focused
- [ ] No over-engineering (YAGNI)
- [ ] Comments only on non-obvious logic

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Instead |
|--------------|---------|---------|
| Write code first, tests later | Tests become afterthought, coverage gaps | Always write test first |
| Test implementation details | Brittle tests that break on refactor | Test behavior/outcomes |
| Large test-code cycles | Lose focus, harder to debug | Small incremental cycles |
| Skip the red phase | Don't know if test actually works | Always see test fail first |
| Over-engineer in green phase | Wasted effort, complexity | Minimum code to pass |
| Skip refactor phase | Technical debt accumulates | Clean up while context fresh |

---

## Test Writing Guidelines

### Good Tests Are:

- **Fast**: Run quickly, encourage frequent execution
- **Isolated**: Don't depend on other tests or external state
- **Repeatable**: Same result every time
- **Self-validating**: Pass or fail, no manual inspection
- **Timely**: Written before the code (TDD)

### Test Structure (Arrange-Act-Assert):

```
test("description of expected behavior", () => {
  // Arrange: Set up test data and conditions
  const input = createTestData();

  // Act: Execute the code under test
  const result = functionUnderTest(input);

  // Assert: Verify the expected outcome
  expect(result).toEqual(expectedValue);
});
```

### What to Test:

| Test Type | What to Cover |
|-----------|---------------|
| Happy path | Primary use case works correctly |
| Edge cases | Boundary conditions, empty/null inputs |
| Error handling | Invalid inputs, failure scenarios |
| Integration points | Interactions between components |

---

## Language-Specific Commands

| Stack | Test Command | Watch Mode |
|-------|--------------|------------|
| **JavaScript/TypeScript** | `npm test` | `npm test -- --watch` |
| **Python** | `pytest` | `pytest --watch` or `ptw` |
| **Go** | `go test ./...` | `gotestsum --watch` |
| **Ruby** | `bundle exec rspec` | `guard` |
| **Rust** | `cargo test` | `cargo watch -x test` |
| **Java** | `mvn test` | IDE integration |

---

## Checklist

Before marking implementation complete:

- [ ] **TDD followed**: Tests written before code
- [ ] **Red phase verified**: Saw tests fail first
- [ ] **Green phase minimal**: No over-engineering
- [ ] **Refactor phase done**: Code is clean
- [ ] **All tests pass**: No failures
- [ ] **No regressions**: Existing tests still pass
- [ ] **Quality gates met**: Conventions, security, minimal changes

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to design before implementing | **architect** skill | Read `skills/architect/SKILL.md` |
| Tests reveal security concern | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |
| Implementation needs code review | **code-reviewer** skill | Read `skills/code-reviewer/SKILL.md` |
| Bug discovered during TDD | **debugging** skill | Read `skills/debugging/SKILL.md` |
| Need to refactor after Green phase | **refactoring** skill | Read `skills/refactoring/SKILL.md` |
| UI implementation needs e2e tests | **testing** skill + Playwright MCP | Read `skills/testing/SKILL.md` |
