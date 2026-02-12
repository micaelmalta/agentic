# Workflow Tool Usage Guidelines

This document describes correct tool usage for file operations in the workflow. For phase details, see [PHASES.md](PHASES.md).

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

When implementing features or making changes, you MUST use the correct tools for each operation. This ensures explicit, reviewable changes and prevents temporary files from being committed.

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

### Example 1: Modifying a JavaScript File

**❌ WRONG:**
```bash
# Creating a bash script to modify the file
cat > fix.sh <<'EOF'
#!/bin/bash
sed -i 's/const oldValue = 5;/const newValue = 10;/g' src/config.js
EOF
chmod +x fix.sh
./fix.sh
```

**✅ CORRECT:**
```javascript
// First, read the file
Read(file_path="src/config.js")

// Then, use Edit tool
Edit(
  file_path="src/config.js",
  old_string="const oldValue = 5;",
  new_string="const newValue = 10;"
)
```

---

### Example 2: Creating a New File

**❌ WRONG:**
```bash
# Using echo or cat
echo 'export const API_URL = "https://api.example.com";' > src/config.js
```

**✅ CORRECT:**
```javascript
// Use Write tool
Write(
  file_path="src/config.js",
  content='export const API_URL = "https://api.example.com";'
)
```

---

### Example 3: Multiple Changes to Same File

**❌ WRONG:**
```bash
# Creating a bash script with multiple sed commands
cat > update_file.sh <<'EOF'
#!/bin/bash
sed -i 's/oldFunction/newFunction/g' src/utils.js
sed -i 's/oldConstant/newConstant/g' src/utils.js
sed -i '/console.log/d' src/utils.js
EOF
chmod +x update_file.sh
./update_file.sh
```

**✅ CORRECT:**
```javascript
// Read the file once
Read(file_path="src/utils.js")

// Make changes one at a time with Edit tool
Edit(
  file_path="src/utils.js",
  old_string="oldFunction",
  new_string="newFunction"
)

Edit(
  file_path="src/utils.js",
  old_string="oldConstant",
  new_string="newConstant"
)

Edit(
  file_path="src/utils.js",
  old_string="  console.log(debug);\n",
  new_string=""
)
```

---

### Example 4: Valid Bash Tool Usage

**✅ CORRECT (Git operations):**
```bash
# Git operations are CORRECT usage of Bash tool
git add src/config.js
git commit -m "feat: update API configuration"
git push origin feature/update-config
```

**✅ CORRECT (Running tests):**
```bash
# Test execution is CORRECT usage of Bash tool
npm test
# or
pytest tests/
# or
go test ./...
```

**✅ CORRECT (Build operations):**
```bash
# Build commands are CORRECT usage of Bash tool
npm run build
# or
cargo build --release
# or
make all
```

---

## Common Patterns That Cause Issues

### Pattern 1: Batch File Modifications

**Problem:** Creating a script to modify multiple files

**Wrong approach:**
```bash
#!/bin/bash
for file in src/**/*.js; do
  sed -i 's/old/new/g' "$file"
done
```

**Correct approach:**
- Use Glob tool to find files: `Glob(pattern="src/**/*.js")`
- Use Edit tool for each file individually
- Or use Task tool with RLM skill for parallel processing

---

### Pattern 2: Complex Text Transformations

**Problem:** Using sed/awk/perl for complex replacements

**Wrong approach:**
```bash
sed -i 's/function \(.*\)(/const \1 = (/g' src/utils.js
```

**Correct approach:**
- Read the file with Read tool
- Identify each specific transformation needed
- Use Edit tool with explicit old_string and new_string
- Multiple Edit calls if needed

---

### Pattern 3: Temporary Files for Intermediate Steps

**Problem:** Creating temporary files during refactoring

**Wrong approach:**
```bash
# Create temp file with transformations
cat src/original.js | sed 's/old/new/g' > /tmp/temp.js
mv /tmp/temp.js src/original.js
```

**Correct approach:**
- Read the original file
- Use Edit tool to make changes directly
- No intermediate files needed

---

## Root Cause: Why Scripts Get Created

The pattern of creating bash scripts often comes from:

1. **Habit:** Traditional shell scripting approach
2. **Complexity:** Multiple changes seem easier in a script
3. **Batch operations:** Wanting to modify many files at once

**Solutions:**

1. **Use Edit tool directly:** More explicit, reviewable, no artifacts
2. **Use RLM skill:** For batch operations across many files
3. **Use Task tool:** For parallel processing when needed
4. **Read first:** Always read files before editing (required by Edit tool)

---

## Verification Checklist

Before committing, verify:

- [ ] No temporary scripts in worktree (`*.sh`, `fix_*.py`, `update_*.js`)
- [ ] No intermediate files (`*.tmp`, `*.bak`, `*.orig`)
- [ ] All file modifications used Edit or Write tools
- [ ] Bash tool only used for git/test/build operations
- [ ] Git diff shows explicit changes (not artifacts)

---

## Recovery: If You Created Temporary Files

If you accidentally created temporary files:

1. **Remove them:**
   ```bash
   rm fix_lines.sh replace.sh update.py  # or whatever temporary files exist
   ```

2. **Check git status:**
   ```bash
   git status
   ```

3. **Unstage if accidentally added:**
   ```bash
   git reset HEAD fix_lines.sh  # if it was staged
   ```

4. **Verify clean state:**
   ```bash
   git status  # Should show clean or only intended files
   ```

5. **Redo changes using Edit tool** (if the temp script was executed)

---

## Summary

**Golden Rule:** Use the right tool for the right job.

- **Edit tool:** Modify existing files
- **Write tool:** Create new files
- **Read tool:** Read file contents
- **Bash tool:** Git, tests, builds, dependencies
- **NEVER:** Temporary scripts, sed/awk/perl on source files

This ensures code changes are explicit, reviewable, and artifact-free.
