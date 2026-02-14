# TDD Cycle: Detailed Protocol

This document contains the detailed Red-Green-Refactor cycle and protocols for different task types. For overview, see [SKILL.md](SKILL.md).

## Contents

- [The Red-Green-Refactor Cycle](#the-red-green-refactor-cycle)
- [Feature Implementation](#feature-implementation-tdd)
- [Bug Fixes](#bug-fix-tdd)
- [Refactoring](#refactoring-with-tdd-safety-net)
- [Test Writing Guidelines](#test-writing-guidelines)

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

## Feature Implementation (TDD)

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

---

## Bug Fix (TDD)

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

---

## Refactoring (with TDD Safety Net)

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

## TDD Cycle Enforcement

Each behavior/requirement MUST complete the full TDD cycle (RED → GREEN → REFACTOR) before proceeding to the next behavior.

**For complete TDD gate checklist with enforcement rules:** See [../workflow/GATES.md - Phase 3: TDD Gate Enforcement](../workflow/GATES.md#phase-3-tdd-gate-enforcement).

**Quick summary:**
- RED: Write failing test (MUST fail initially)
- GREEN: Write minimum code to pass test (MUST pass)
- REFACTOR: Clean up code (ALL tests MUST still pass)
- Verify quality gates before proceeding to next behavior

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

## Examples by Task Type

### Example 1: New Feature

```
Requirement: Add password strength validation

RED:
test("rejects weak passwords", () => {
  expect(validatePassword("123")).toBe(false);
});

Run: FAILS (function doesn't exist)

GREEN:
function validatePassword(pwd) {
  return pwd.length >= 8;
}

Run: PASSES

REFACTOR:
function validatePassword(pwd) {
  const MIN_LENGTH = 8;
  return pwd.length >= MIN_LENGTH;
}

Run: PASSES
```

### Example 2: Bug Fix

```
Bug: Cart total includes deleted items

RED:
test("excludes deleted items from total", () => {
  const cart = {
    items: [
      { id: 1, price: 10, deleted: false },
      { id: 2, price: 20, deleted: true },
      { id: 3, price: 15, deleted: false }
    ]
  };
  expect(calculateTotal(cart)).toBe(25); // 10 + 15
});

Run: FAILS (returns 45)

GREEN:
function calculateTotal(cart) {
  return cart.items
    .filter(item => !item.deleted)
    .reduce((sum, item) => sum + item.price, 0);
}

Run: PASSES
```

### Example 3: Refactoring

```
Before:
function processOrder(order) {
  if (order.total > 100) {
    order.discount = order.total * 0.1;
    order.total = order.total - order.discount;
  }
  if (order.total > 500) {
    order.shipping = 0;
  } else {
    order.shipping = 10;
  }
  order.finalTotal = order.total + order.shipping;
}

Tests: ALL PASS (baseline established)

After refactoring:
function processOrder(order) {
  applyDiscounts(order);
  calculateShipping(order);
  calculateFinalTotal(order);
}

function applyDiscounts(order) {
  if (order.total > 100) {
    order.discount = order.total * 0.1;
    order.total -= order.discount;
  }
}

function calculateShipping(order) {
  order.shipping = order.total > 500 ? 0 : 10;
}

function calculateFinalTotal(order) {
  order.finalTotal = order.total + order.shipping;
}

Tests: ALL PASS (behavior unchanged)
```

---

## Quick Reference

**TDD Mantra:** Red → Green → Refactor

**Key Rules:**
1. Write test first (always)
2. See test fail (verify it works)
3. Write minimum code to pass
4. Refactor with green tests
5. Repeat for next behavior

**When in Doubt:**
- Smaller is better (tests and changes)
- Run tests frequently
- One thing at a time
- Tests are documentation

---

## See Also

- [SKILL.md](SKILL.md) - Overview and when to use TDD
- [TOOLS.md](TOOLS.md) - Correct tools for file modifications
- [EXAMPLES.md](EXAMPLES.md) - Language-specific test patterns
