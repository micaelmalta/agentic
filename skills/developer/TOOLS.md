# Developer Tool Usage

This document describes correct tool usage for code modifications when implementing features with TDD. For TDD cycle details, see [TDD_CYCLE.md](TDD_CYCLE.md).

---

## Core Tool Usage Rules

**⛔ CRITICAL: NEVER create temporary bash scripts for file modifications**

When implementing code using TDD, you MUST use the correct tools for each operation. This ensures:
- Explicit, reviewable changes
- No temporary artifacts in repository
- Clear git history
- Atomic operations

**For complete tool usage guidelines:** See [../workflow/TOOLS.md](../workflow/TOOLS.md) for the full tool selection matrix, examples, and enforcement mechanisms.

---

## Quick Reference for TDD

| TDD Phase | Operation | Tool |
|-----------|-----------|------|
| **RED** (Write failing test) | Create test file | **Write tool** |
| **RED** (Write failing test) | Modify existing test file | **Edit tool** |
| **GREEN** (Implement feature) | Add new function/class | **Edit tool** (append to existing file) |
| **GREEN** (Implement feature) | Modify existing code | **Edit tool** |
| **GREEN** (Implement feature) | Create new source file | **Write tool** |
| **REFACTOR** (Clean up) | Rename variables, extract functions | **Edit tool** |
| **Run tests** | Execute test suite | **Bash tool** |
| **Check status** | Git status, diff | **Bash tool** |

---

## TDD-Specific Examples

### Example 1: RED Phase - Write Failing Test

**✅ CORRECT:**
```javascript
// First, read the existing test file (if it exists)
Read(file_path="tests/calculator.test.js")

// Then, use Edit tool to add the new test
Edit(
  file_path="tests/calculator.test.js",
  old_string="// End of tests",
  new_string=`describe('discount calculation', () => {
  it('should apply 10% discount', () => {
    expect(calculateDiscount(100)).toBe(10);
  });
});

// End of tests`
)
```

### Example 2: GREEN Phase - Implement Feature

**✅ CORRECT:**
```javascript
// Read the source file
Read(file_path="src/calculator.js")

// Add the function using Edit tool
Edit(
  file_path="src/calculator.js",
  old_string="// End of file",
  new_string=`export function calculateDiscount(price) {
  return price * 0.1;
}

// End of file`
)
```

### Example 3: REFACTOR Phase - Improve Code Quality

**✅ CORRECT:**
```javascript
// Read the file
Read(file_path="src/calculator.js")

// Use Edit tool for explicit refactoring
Edit(
  file_path="src/calculator.js",
  old_string=`export function calculateDiscount(price) {
  return price * 0.1;
}`,
  new_string=`export function calculateDiscount(price, rate = 0.1) {
  if (price < 0) throw new Error('Price cannot be negative');
  return price * rate;
}`
)
```

---

## Why This Matters for TDD

### Explicit Changes Make Review Easy

When you use Edit tool, your changes show up clearly in git diffs:
```diff
- export function calculateDiscount(price) {
-   return price * 0.1;
+ export function calculateDiscount(price, rate = 0.1) {
+   if (price < 0) throw new Error('Price cannot be negative');
+   return price * rate;
```

### Atomic Operations Prevent Partial Commits

If you create a bash script and it fails halfway through, you end up with partially modified files. Edit tool changes are atomic — either the whole edit succeeds or it fails cleanly.

### No Artifacts in Repository

Temporary scripts (`fix.sh`, `add_function.sh`) often get accidentally committed. Edit/Write tools never create artifacts.

---

## Enforcement

Tool usage is enforced through:
1. **Pre-commit validation** - Checks for temporary scripts before allowing commit
2. **Code review** - Reviewers check for proper tool usage
3. **Test suite** - Structural tests verify no temporary scripts exist

**For full enforcement details:** See [../workflow/TOOLS.md](../workflow/TOOLS.md#enforcement).

---

## Related

- [TDD_CYCLE.md](TDD_CYCLE.md) - Red-Green-Refactor cycle details
- [EXAMPLES.md](EXAMPLES.md) - Complete TDD implementation examples
- [../workflow/TOOLS.md](../workflow/TOOLS.md) - Complete tool usage guidelines
