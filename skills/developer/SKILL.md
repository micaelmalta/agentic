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

**Detailed cycle protocols:** See [TDD_CYCLE.md](TDD_CYCLE.md) for complete Red-Green-Refactor workflows by task type.

---

## Quick Start

### 1. Write a Failing Test (RED)

```javascript
test("calculates discount correctly", () => {
  const result = calculateDiscount(100);
  expect(result).toBe(10); // 10% discount
});
```

Run test → **FAILS** (function doesn't exist)

### 2. Write Minimum Code (GREEN)

```javascript
function calculateDiscount(amount) {
  return amount * 0.1;
}
```

Run test → **PASSES**

### 3. Refactor (Keep Tests Green)

```javascript
const DISCOUNT_RATE = 0.1;

function calculateDiscount(amount) {
  return amount * DISCOUNT_RATE;
}
```

Run test → **PASSES**

---

## Tool Usage (CRITICAL)

**⛔ NEVER create temporary bash scripts for file modifications**

- ✅ **ALWAYS** use **Edit tool** for modifying existing files
- ✅ **ALWAYS** use **Write tool** for creating new files
- ✅ **ALWAYS** use **Read tool** before editing
- ❌ **NEVER** create temporary scripts (fix.sh, replace.sh, etc.)
- ❌ **NEVER** use sed/awk/perl for source code modifications

**See [TOOLS.md](TOOLS.md) for:**
- Complete tool usage guidelines
- File modification rules
- Examples for RED/GREEN/REFACTOR phases
- Anti-patterns to avoid

---

## Reference Documents

For detailed information, see:

- **[TDD_CYCLE.md](TDD_CYCLE.md)** - Detailed Red-Green-Refactor cycle, feature implementation, bug fixes, refactoring protocols
- **[TOOLS.md](TOOLS.md)** - Tool usage for file modifications (Edit/Write/Read)
- **[EXAMPLES.md](EXAMPLES.md)** - Language-specific test commands and patterns

---

## Protocol by Task Type

### Feature Implementation

1. Write failing test (RED)
2. Run test → verify it fails
3. Write minimum code (GREEN)
4. Run test → verify it passes
5. Refactor → verify tests still pass
6. Repeat for next behavior

See [TDD_CYCLE.md](TDD_CYCLE.md#feature-implementation-tdd) for detailed protocol.

### Bug Fix

1. Write failing test that reproduces bug (RED)
2. Run test → verify it fails (confirms bug exists)
3. Fix the code (GREEN)
4. Run test → verify it passes (confirms fix)
5. Run all tests → verify no regressions

See [TDD_CYCLE.md](TDD_CYCLE.md#bug-fix-tdd) for detailed protocol.

### Refactoring

1. Ensure tests exist and pass (baseline)
2. Make ONE refactoring change
3. Run tests → verify still pass
4. Repeat steps 2-3
5. Final test run → confirm no regressions

See [TDD_CYCLE.md](TDD_CYCLE.md#refactoring-with-tdd-safety-net) for detailed protocol.

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

See [EXAMPLES.md](EXAMPLES.md) for complete language-specific patterns.

---

## Code Quality Gates

Before considering implementation complete:

- [ ] **TDD followed**: Tests written before code
- [ ] **All tests pass**: No failures
- [ ] **Code follows project conventions**: Linting, formatting, naming
- [ ] **No security vulnerabilities**: No SQL injection, XSS, auth issues, etc.
- [ ] **Changes are minimal and focused**: Only what's needed
- [ ] **No over-engineering**: YAGNI (You Aren't Gonna Need It)
- [ ] **Comments only on non-obvious logic**: Code should be self-documenting

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

**Good Tests Are:**
- **Fast** - Run quickly, encourage frequent execution
- **Isolated** - Don't depend on other tests or external state
- **Repeatable** - Same result every time
- **Self-validating** - Pass or fail, no manual inspection
- **Timely** - Written before the code (TDD)

**Test Structure (Arrange-Act-Assert):**
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

See [TDD_CYCLE.md](TDD_CYCLE.md#test-writing-guidelines) for complete guidelines.

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
