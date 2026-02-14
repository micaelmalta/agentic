# GitHub Actions CI Pipeline

This directory contains the Continuous Integration (CI) configuration for the agentic skills collection project.

## CI Workflow

The CI pipeline runs automatically on:
- Push to `main` branch
- Pull requests targeting `main` branch

### Jobs

#### 1. **Test** (Required)
Runs the test suite using pytest.

**What it checks:**
- All unit tests pass
- All structural tests pass (YAML frontmatter, cross-skill integration, etc.)

**Note:** E2E tests are excluded as they require special setup/environments.

**Run locally:**
```bash
pip install -r requirements-dev.txt
pytest tests/ --ignore=tests/e2e/
```

#### 2. **Markdown Lint** (Informational)
Lints all markdown files for style consistency.

**What it checks:**
- Markdown formatting and style
- Consistent heading structure
- Link formatting

**Note:** Currently informational only (warnings don't fail CI).

**Run locally:**
```bash
npm install -g markdownlint-cli
markdownlint '**/*.md' --ignore node_modules
```

#### 3. **Validate YAML** (Required)
Validates YAML frontmatter in all SKILL.md files.

**What it checks:**
- Valid YAML syntax
- Required fields present: `name`, `description`, `triggers`
- `triggers` is a list

**Run locally:**
```bash
python << 'EOF'
import os
import re
import yaml
from pathlib import Path

skill_files = list(Path('skills').rglob('SKILL.md'))
for skill_file in skill_files:
    content = skill_file.read_text(encoding='utf-8')
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if match:
        frontmatter = yaml.safe_load(match.group(1))
        print(f"✓ {skill_file}: {frontmatter.get('name', 'MISSING NAME')}")
EOF
```

#### 4. **Check Cross-References** (Required)
Validates that all internal markdown links point to existing files.

**What it checks:**
- No broken links between markdown files
- All reference files exist
- Cross-skill integration links are valid

**Run locally:**
```bash
# See .github/workflows/ci.yml for the validation script
# Or run: python .github/scripts/check_cross_references.py (if extracted)
```

#### 5. **Quality Checks** (Informational)
Various code quality checks.

**What it checks:**
- Trailing whitespace (⚠️ informational only)
- Files end with newline (⚠️ informational only)
- TODO/FIXME comments (informational only)

**Run locally:**
```bash
# Check trailing whitespace
grep -r --include="*.md" --include="*.py" ' $' .

# Check files end with newline
find . -type f \( -name "*.md" -o -name "*.py" \) -exec sh -c 'tail -c 1 "$1" | wc -l' _ {} \;

# Find TODO/FIXME
grep -r "TODO\|FIXME" --include="*.md" --include="*.py"
```

## Development Setup

### Install Dependencies

```bash
# Python dependencies for testing
pip install -r requirements-dev.txt

# Node.js dependencies for markdown linting (optional)
npm install -g markdownlint-cli
```

### Run Tests Locally

```bash
# Run all unit and structural tests
pytest tests/ --ignore=tests/e2e/

# Run with verbose output
pytest tests/ -v --ignore=tests/e2e/

# Run specific test file
pytest tests/structural/test_skill_structure.py -v

# Run with coverage
pytest tests/ --cov=skills --cov-report=html
```

### Pre-commit Checks

Before committing, you can run the same checks that CI runs:

```bash
# 1. Run tests
pytest tests/ --ignore=tests/e2e/

# 2. Validate YAML frontmatter (see section above)

# 3. Check for quality issues
grep -r --include="*.md" --include="*.py" ' $' . | grep -v ".git"
```

## CI Status Badge

To add a CI status badge to your README:

```markdown
![CI](https://github.com/micaelmalta/agentic/actions/workflows/ci.yml/badge.svg)
```

## Troubleshooting

### Tests Failing Locally But Pass in CI
- Ensure you're using Python 3.10+ (same as CI)
- Check that all dependencies are installed: `pip install -r requirements-dev.txt`
- Make sure you're in the project root directory

### Markdown Linting Failures
- Run `markdownlint '**/*.md' --fix` to auto-fix many issues
- Check `.markdownlint.json` for rules configuration

### YAML Validation Failures
- Ensure YAML frontmatter starts with `---\n` and ends with `\n---\n`
- Validate YAML syntax using an online validator
- Check that all required fields are present

### Cross-Reference Failures
- Ensure all markdown links use relative paths from the file's location
- Check that referenced files exist
- Use `./` prefix for same-directory references

## Modifying CI

To modify the CI workflow:

1. Edit `.github/workflows/ci.yml`
2. Test changes by pushing to a feature branch
3. Review Actions tab in GitHub to see results
4. Update this README if adding new checks

## Contact

For issues with CI or testing, open an issue or see CONTRIBUTING.md.
