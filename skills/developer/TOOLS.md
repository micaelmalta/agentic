# Developer Tool Usage

This document describes correct tool usage for code modifications when implementing features with TDD. For TDD cycle details, see [TDD_CYCLE.md](TDD_CYCLE.md).

## Contents

- [Overview](#overview)
- [File Modification Rules](#file-modification-rules)
- [Tool Selection Matrix](#tool-selection-matrix)
- [Why This Matters](#why-this-matters)
- [Enforcement](#enforcement)
- [Examples](#examples)

---

## Overview

**⛔ CRITICAL: NEVER create temporary bash scripts for file modifications**

When implementing code using TDD, you MUST use the correct tools for each operation. This ensures:
- Explicit, reviewable changes
- No temporary artifacts in repository
- Clear git history
- Atomic operations

---

## File Modification Rules

### ✅ CORRECT - ALWAYS DO THIS:

```
# Use Edit tool directly for modifying existing files
Edit(
  file_path="src/component.js",
  old_string="const value = 'old';",
  new_string="const value = 'new';"
)

# Use Write tool for creating new files
Write(
  file_path="src/new_component.js",
  content="export function newComponent() { ... }"
)

# Use Read tool before editing (required by Edit tool)
Read(file_path="src/component.js")
```

### ❌ WRONG - DO NOT DO THIS:

```
❌ WRONG - Creating temporary bash scripts:
echo '#!/bin/bash' > fix_lines.sh
echo 'sed -i "s/old/new/g" src/component.js' >> fix_lines.sh
chmod +x fix_lines.sh
./fix_lines.sh
# ← WRONG: Creates temporary file that might get committed!

❌ WRONG - Using Bash with sed/awk/perl:
sed -i 's/old/new/g' src/component.js
# ← WRONG: Not explicit, not reviewable, hard to verify

❌ WRONG - Using echo/heredoc to overwrite files:
cat > src/component.js <<'EOF'
... entire file content ...
EOF
# ← WRONG: Risk of data loss, not explicit about changes
```

---

## Tool Selection Matrix

| Task | Correct Tool | WRONG Tool |
|------|--------------|------------|
| Modify existing file | **Edit tool** | ❌ sed, awk, perl, bash scripts |
| Create new file | **Write tool** | ❌ echo >, cat <<EOF |
| Read file content | **Read tool** | ❌ cat, head, tail |
| Search files | **Grep tool** | ❌ grep command |
| Find files | **Glob tool** | ❌ find, ls |
| Git operations | **Bash tool** | ✅ Correct usage |
| Run tests | **Bash tool** | ✅ Correct usage |
| Build commands | **Bash tool** | ✅ Correct usage |
| Install dependencies | **Bash tool** | ✅ Correct usage |

---

## Why This Matters

### ✅ Using Edit Tool:

- Changes are explicit and reviewable (old → new)
- No temporary files or artifacts
- Atomic operations with clear intent
- Works across all encodings and file types
- Integrated with permission system
- Changes appear in git diff clearly

### ❌ Using Bash Scripts for File Modifications:

- Creates temporary files that might get committed
- Changes are implicit and hard to review
- Risk of leaving artifacts in worktree
- Not integrated with permission system
- Hard to verify correctness
- Pollutes git history with temporary files

---

## Enforcement

**MANDATORY Rules:**

- **ALWAYS** use Edit tool for modifying source code files
- **ALWAYS** use Write tool for creating new source files
- **ALWAYS** use Read tool before editing (required by Edit tool)
- **NEVER** create temporary bash scripts for sed/awk/perl operations
- **NEVER** commit temporary scripts, intermediate files, or build artifacts
- **NEVER** leave uncommitted temporary files in the worktree
- **NEVER** use Bash tool with sed/awk/perl for source code modifications

**When to Use Bash Tool:**

- Git operations (`git add`, `git commit`, `git push`)
- Running tests (`npm test`, `pytest`, `go test`)
- Build commands (`npm run build`, `cargo build`, `make`)
- Installing dependencies (`npm install`, `pip install`, `go mod download`)
- **NOT for modifying source code files**

---

## Examples

### Example 1: TDD Cycle - Green Phase

After writing a failing test (RED phase), implement the feature:

**❌ WRONG:**
```bash
# Creating a bash script to add the function
cat > add_function.sh <<'EOF'
#!/bin/bash
echo 'export function calculateDiscount(price) {' >> src/utils.js
echo '  return price * 0.1;' >> src/utils.js
echo '}' >> src/utils.js
EOF
chmod +x add_function.sh
./add_function.sh
```

**✅ CORRECT:**
```javascript
// First, read the file
Read(file_path="src/utils.js")

// Then, use Edit tool to add the function
Edit(
  file_path="src/utils.js",
  old_string="// End of file",
  new_string=`export function calculateDiscount(price) {
  return price * 0.1;
}

// End of file`
)
```

---

### Example 2: Refactor Phase

After tests pass (GREEN phase), clean up the code:

**❌ WRONG:**
```bash
# Using sed to rename variables
sed -i 's/oldVariableName/newVariableName/g' src/calculator.js
```

**✅ CORRECT:**
```javascript
// Read the file first
Read(file_path="src/calculator.js")

// Use Edit tool with explicit old → new
Edit(
  file_path="src/calculator.js",
  old_string="const oldVariableName = getValue();",
  new_string="const newVariableName = getValue();"
)

// Multiple edits if needed
Edit(
  file_path="src/calculator.js",
  old_string="return oldVariableName * 2;",
  new_string="return newVariableName * 2;"
)
```

---

### Example 3: Creating Test File

**❌ WRONG:**
```bash
# Using echo to create test file
cat > tests/calculator.test.js <<'EOF'
import { calculate } from '../src/calculator.js';

test('calculates correctly', () => {
  expect(calculate(5)).toBe(10);
});
EOF
```

**✅ CORRECT:**
```javascript
// Use Write tool for new files
Write(
  file_path="tests/calculator.test.js",
  content=`import { calculate } from '../src/calculator.js';

test('calculates correctly', () => {
  expect(calculate(5)).toBe(10);
});`
)
```

---

### Example 4: Bug Fix - Code Modification

After writing reproduction test, fix the bug:

**❌ WRONG:**
```bash
# Using sed to fix the bug
sed -i 's/if (total > 100)/if (total >= 100)/g' src/discount.js
```

**✅ CORRECT:**
```javascript
// Read the file
Read(file_path="src/discount.js")

// Use Edit tool with explicit fix
Edit(
  file_path="src/discount.js",
  old_string="if (total > 100) {",
  new_string="if (total >= 100) {"
)
```

---

## TDD Workflow Integration

### RED Phase (Write Failing Test)

```
# Create new test file
Write(file_path="tests/feature.test.js", content="[test code]")

# Or add test to existing file
Read(file_path="tests/feature.test.js")
Edit(
  file_path="tests/feature.test.js",
  old_string="// End of tests",
  new_string="test('new behavior', () => { ... })\n\n// End of tests"
)
```

### GREEN Phase (Implement Feature)

```
# Modify existing source file
Read(file_path="src/feature.js")
Edit(
  file_path="src/feature.js",
  old_string="[current code]",
  new_string="[new code that passes test]"
)

# Or create new source file
Write(file_path="src/feature.js", content="[implementation]")
```

### REFACTOR Phase (Clean Up)

```
# Improve code structure
Read(file_path="src/feature.js")
Edit(
  file_path="src/feature.js",
  old_string="[complex code]",
  new_string="[cleaner code]"
)

# Extract to new file if needed
Write(file_path="src/helpers.js", content="[extracted code]")
Edit(
  file_path="src/feature.js",
  old_string="[code to extract]",
  new_string="import { helper } from './helpers.js';"
)
```

---

## Common Patterns

### Pattern 1: Adding a Function

```
Read(file_path="src/utils.js")

Edit(
  file_path="src/utils.js",
  old_string="export { existingFunction };",
  new_string=`export function newFunction(param) {
  return param * 2;
}

export { existingFunction, newFunction };`
)
```

### Pattern 2: Modifying Multiple Lines

```
Read(file_path="src/config.js")

// Make changes one at a time
Edit(
  file_path="src/config.js",
  old_string="const API_URL = 'old-url';",
  new_string="const API_URL = 'new-url';"
)

Edit(
  file_path="src/config.js",
  old_string="const TIMEOUT = 5000;",
  new_string="const TIMEOUT = 10000;"
)
```

### Pattern 3: Extracting Function

```
# Read original file
Read(file_path="src/large-file.js")

# Create new file with extracted function
Write(
  file_path="src/extracted.js",
  content="export function extracted() { ... }"
)

# Update original file to use extracted function
Edit(
  file_path="src/large-file.js",
  old_string="import { other } from './other.js';",
  new_string="import { other } from './other.js';\nimport { extracted } from './extracted.js';"
)

Edit(
  file_path="src/large-file.js",
  old_string="[inline code to extract]",
  new_string="extracted()"
)
```

---

## Verification Before Commit

Before committing, verify:

- [ ] No temporary scripts in worktree (`*.sh`, `fix_*.py`, `update_*.js`)
- [ ] No intermediate files (`*.tmp`, `*.bak`, `*.orig`)
- [ ] All file modifications used Edit or Write tools
- [ ] Bash tool only used for git/test/build operations
- [ ] Git diff shows explicit changes (not artifacts)
- [ ] All tests pass (TDD cycle complete)

---

## Quick Reference

**TDD + Tool Usage:**

1. **RED:** Write test using Write or Edit tool
2. **Run test:** Use Bash tool (`npm test`)
3. **GREEN:** Implement using Edit or Write tool
4. **Run test:** Use Bash tool (`npm test`)
5. **REFACTOR:** Clean up using Edit tool
6. **Run test:** Use Bash tool (`npm test`)
7. **Commit:** Use Bash tool (`git add`, `git commit`)

**Golden Rule:** Use the right tool for the right job - Edit/Write for code, Bash for commands.

---

## See Also

- [SKILL.md](SKILL.md) - TDD overview and principles
- [TDD_CYCLE.md](TDD_CYCLE.md) - Detailed Red-Green-Refactor cycle
- [EXAMPLES.md](EXAMPLES.md) - Language-specific patterns
