# Contributing to Agentic Skills Collection

Thank you for your interest in contributing! This guide will help you create high-quality skills that follow best practices.

## Table of Contents

- [Getting Started](#getting-started)
- [Creating a New Skill](#creating-a-new-skill)
- [Skill Best Practices](#skill-best-practices)
- [Progressive Disclosure Pattern](#progressive-disclosure-pattern)
- [Testing Your Skill](#testing-your-skill)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)

---

## Getting Started

### Prerequisites

- **Python 3.10+** for running tests and validation scripts
- **Node.js** (optional) for markdown linting
- **Git** for version control

### Setup Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/micaelmalta/agentic.git
   cd agentic
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **Run tests to verify setup:**
   ```bash
   pytest tests/ --ignore=tests/e2e/
   ```

---

## Creating a New Skill

### Quick Start

Use the **skill-creator** skill to generate a new skill scaffold:

```bash
# Read the skill-creator documentation
cat skills/skill-creator/SKILL.md

# Use the skill to create a new skill
# (This will guide you through the process)
```

### Manual Creation

If creating manually, follow this structure:

```
skills/your-skill-name/
├── SKILL.md              # Main skill file (<500 lines recommended)
└── reference/            # Optional detailed reference files
    ├── CONCEPT_A.md
    └── CONCEPT_B.md
```

### SKILL.md Template

```markdown
---
name: your-skill-name
description: "Brief description (1-2 sentences). Use when [trigger scenarios]."
triggers:
  - "/command"
  - "keyword phrase"
  - "natural language trigger"
---

# Your Skill Name

## Core Philosophy

**"One sentence philosophy"**

Brief explanation of the skill's approach.

---

## Protocol

### Step 1: First Action

Detailed instructions...

### Step 2: Second Action

Detailed instructions...

---

## Checklist

- [ ] Criterion 1
- [ ] Criterion 2

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need X | **other-skill** | Read `skills/other-skill/SKILL.md` |
```

---

## Skill Best Practices

Follow [Claude's Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices):

### 1. **YAML Frontmatter** (Required)

All SKILL.md files MUST have YAML frontmatter:

```yaml
---
name: skill-name          # Lowercase, hyphenated
description: "Brief description and when to use"
triggers:                 # List of commands and phrases
  - "/command"
  - "natural language"
---
```

**Required fields:**
- `name`: Skill identifier (lowercase, hyphenated)
- `description`: Brief description (1-2 sentences) + when to use
- `triggers`: List of commands/phrases that activate the skill

### 2. **Progressive Disclosure** (Recommended)

Keep SKILL.md concise (<500 lines) by moving detailed content to reference files:

**Structure:**
```
skills/your-skill/
├── SKILL.md (~200-300 lines)
│   - Overview and quick start
│   - Core protocol/workflow
│   - When to use
│   - References to detailed docs
└── reference/
    ├── ADVANCED_TOPIC_A.md
    └── ADVANCED_TOPIC_B.md
```

**Benefits:**
- Faster skill selection (smaller file to load)
- Details loaded only when needed
- Token-efficient
- Easier to maintain

**Example reference pattern:**
```markdown
**For complete X guidance:** See [reference/X.md](reference/X.md), which covers:
- Topic 1
- Topic 2
- Topic 3
```

See [skills/skill-creator/reference/PROGRESSIVE_DISCLOSURE.md](skills/skill-creator/reference/PROGRESSIVE_DISCLOSURE.md) for complete guide.

### 3. **Protocol Section** (Required)

Every SKILL.md must have a clear protocol:

```markdown
## Protocol

### 1. First Step

What to do...

### 2. Second Step

What to do...
```

Or for iterative workflows:

```markdown
## The [Workflow Name] Loop

```
[Diagram or description of loop]
```

1. Step 1
2. Step 2
3. Step 3
```

### 4. **Cross-Skill Integration** (Required)

Include a table showing when to invoke other skills:

```markdown
## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need code review | **code-reviewer** | Read `skills/code-reviewer/SKILL.md` |
| Need tests | **testing** | Read `skills/testing/SKILL.md` |
```

### 5. **Checklist** (Recommended)

Provide an actionable checklist:

```markdown
## Checklist

- [ ] Task 1 complete
- [ ] Task 2 verified
- [ ] Output validated
```

### 6. **Examples** (Recommended)

Include concrete examples:

```markdown
### Good Example

\```language
// Code example
\```

### Bad Example

\```language
// Anti-pattern
\```
```

---

## Progressive Disclosure Pattern

### When to Use

Use progressive disclosure if your skill has:
- Detailed technical content (>500 lines total)
- Multiple specialized topics
- Advanced concepts that aren't always needed

### How to Implement

1. **Keep SKILL.md focused** (~200-300 lines):
   - Overview and philosophy
   - Core protocol/workflow
   - When to use
   - References to detailed docs

2. **Create reference files** for detailed content:
   - One concept per file
   - Name files in SCREAMING_SNAKE_CASE.md
   - Include table of contents for files >100 lines

3. **Link from SKILL.md:**
   ```markdown
   **For complete [topic] guidance:** See [reference/TOPIC.md](reference/TOPIC.md), which covers:
   - Subtopic 1
   - Subtopic 2
   - Subtopic 3
   ```

### Examples

See these skills for progressive disclosure implementation:
- [skills/testing/](skills/testing/) - 3 reference files (UI, A11y, i18n)
- [skills/ci-cd/](skills/ci-cd/) - 3 reference files (DB, observability, secrets)
- [skills/para/](skills/para/) - 3 reference files (methodology, commands, decision framework)

---

## Testing Your Skill

### 1. Validate YAML Frontmatter

```bash
python << 'EOF'
import re
import yaml
from pathlib import Path

skill_file = Path('skills/your-skill/SKILL.md')
content = skill_file.read_text(encoding='utf-8')
match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
if match:
    frontmatter = yaml.safe_load(match.group(1))
    print(f"✓ Valid YAML: {frontmatter}")
else:
    print("✗ Invalid or missing YAML frontmatter")
EOF
```

### 2. Check Structure

Required sections:
- YAML frontmatter (name, description, triggers)
- Core Philosophy section
- Protocol section (or workflow loop)
- Checklist section
- Cross-Skill Integration section

### 3. Run Tests

```bash
# Run structural tests
pytest tests/structural/ -v -k your_skill_name

# Run all tests
pytest tests/ --ignore=tests/e2e/
```

### 4. Check Cross-References

Ensure all markdown links point to existing files:

```bash
# See .github/workflows/ci.yml for validation script
# Or wait for CI to run after push
```

---

## Submitting Changes

### 1. Create Feature Branch

```bash
git checkout -b feature/add-your-skill-name
```

### 2. Make Changes

- Follow skill best practices above
- Keep commits focused and atomic
- Write clear commit messages (Conventional Commits format)

### 3. Test Locally

```bash
# Run tests
pytest tests/ --ignore=tests/e2e/

# Validate YAML
# (See "Testing Your Skill" section above)

# Check for quality issues
grep -r --include="*.md" ' $' skills/your-skill/
```

### 4. Commit Changes

```bash
git add skills/your-skill/
git commit -m "feat(your-skill): add [skill name] for [purpose]"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(skill-name):` for new skills
- `fix(skill-name):` for bug fixes
- `docs(skill-name):` for documentation
- `refactor(skill-name):` for refactoring
- `test(skill-name):` for tests

### 5. Push and Create PR

```bash
git push origin feature/add-your-skill-name
```

Then create a pull request on GitHub.

---

## Code Review Process

### What Reviewers Look For

1. **YAML frontmatter** is valid and complete
2. **Protocol section** is clear and actionable
3. **Progressive disclosure** used if skill >500 lines
4. **Cross-skill integration** table present
5. **Examples** are helpful and correct
6. **Tests** pass (CI runs automatically)
7. **Commit messages** follow Conventional Commits

### Review Timeline

- Initial review: 1-3 days
- Feedback incorporation: As needed
- Final approval: 1-2 days after last changes

### After Approval

Once your PR is approved:
1. Maintainer will merge your PR
2. Your skill will be available in the next release
3. CHANGELOG.md will be updated

---

## Style Guide

### Markdown

- Use ATX-style headers (`#`, `##`, `###`)
- Use fenced code blocks with language identifiers
- Use tables for structured data
- Include table of contents for files >100 lines

### Writing Style

- **Be concise:** Every word should earn its place
- **Be actionable:** Focus on what to do, not just what
- **Be clear:** Avoid jargon; explain when necessary
- **Be consistent:** Follow patterns from existing skills

### File Naming

- Skill directories: `lowercase-with-hyphens`
- Reference files: `SCREAMING_SNAKE_CASE.md`
- Test files: `test_underscore_case.py`

---

## Questions?

- **Skill creation:** Read [skills/skill-creator/SKILL.md](skills/skill-creator/SKILL.md)
- **Progressive disclosure:** See [skills/skill-creator/reference/PROGRESSIVE_DISCLOSURE.md](skills/skill-creator/reference/PROGRESSIVE_DISCLOSURE.md)
- **Best practices:** Review [Claude's official guide](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- **Issues:** Open an issue on GitHub

---

Thank you for contributing! Your skills help make AI-assisted development better for everyone. 🚀
