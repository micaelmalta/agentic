# Release Management

This document provides comprehensive guidance for tagging releases, automating releases, and release workflows.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Tagging Releases

### Creating Annotated Tags (Preferred)

```bash
# Create annotated tag with message
git tag -a v1.2.3 -m "Release v1.2.3: Brief description"

# Push specific tag to remote
git push origin v1.2.3

# Push all tags to remote
git push --tags
```

**Why annotated tags:**
- Include tagger name, email, date
- Can include release notes
- Can be signed with GPG
- Recommended for releases

### Tag Naming Convention

✅ **GOOD: Use `v` prefix consistently**
```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git tag -a v2.0.0-beta.1 -m "Release v2.0.0-beta.1"
```

❌ **BAD: Inconsistent naming**
```bash
git tag -a 1.2.3 -m "Release 1.2.3"      # Missing v prefix
git tag -a release-1.2.3 -m "Release"     # Custom prefix
```

---

## Automated Release Workflow

### Tool Comparison

| Tool                 | How It Works                                                                    |
| -------------------- | ------------------------------------------------------------------------------- |
| **semantic-release** | Analyzes commits, determines version, creates tag, publishes, updates changelog |
| **release-please**   | Creates release PR with changelog; merge to release                             |
| **standard-version** | Bumps version, updates changelog, creates tag                                   |

### semantic-release

**Setup:**
```bash
npm install --save-dev semantic-release
```

**Configuration (`.releaserc.json`):**
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/git"
  ]
}
```

**GitHub Actions:**
```yaml
- name: Release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: npx semantic-release
```

**What it does:**
1. Analyzes commits since last release
2. Determines version bump (MAJOR/MINOR/PATCH)
3. Generates changelog from commits
4. Updates version in `package.json`
5. Creates git tag
6. Publishes to npm
7. Creates GitHub Release

### release-please

**GitHub Actions:**
```yaml
- uses: google-github-actions/release-please-action@v3
  with:
    release-type: node
    package-name: my-package
```

**What it does:**
1. Creates release PR with:
   - Version bump in `package.json`
   - Updated CHANGELOG.md
2. When PR merged:
   - Creates git tag
   - Creates GitHub Release

### standard-version

**Setup:**
```bash
npm install --save-dev standard-version
```

**Usage:**
```bash
# Bump version, update CHANGELOG, create tag
npm run release

# Dry run
npm run release -- --dry-run

# Pre-release
npm run release -- --prerelease alpha
```

**package.json:**
```json
{
  "scripts": {
    "release": "standard-version"
  }
}
```

---

## Manual Release Workflow

### Step-by-Step

1. **Update version in manifest**
   ```bash
   # Node.js
   npm version patch  # or minor, major

   # Python
   poetry version patch

   # Go (update in code or VERSION file)
   echo "1.2.3" > VERSION
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [1.2.3] - 2025-02-14

   ### Added
   - New feature X
   - New feature Y

   ### Fixed
   - Bug in component Z
   ```

3. **Commit version bump**
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore(release): bump version to v1.2.3"
   ```

4. **Create annotated tag**
   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   ```

5. **Push commits and tags**
   ```bash
   git push && git push --tags
   ```

6. **Create GitHub Release (optional)**
   ```bash
   gh release create v1.2.3 --notes-file CHANGELOG.md

   # Or with auto-generated notes
   gh release create v1.2.3 --generate-notes
   ```

---

## Commands Reference

| Action                    | Command                                     |
| ------------------------- | ------------------------------------------- |
| Inspect staged changes    | `git diff --staged`                         |
| Suggest message from diff | Review diff, then output suggested message  |
| View recent messages      | `git log -n 5 --oneline`                    |
| View all tags             | `git tag -l`                                |
| View tags matching pattern | `git tag -l "v1.*"`                         |
| Create annotated tag      | `git tag -a v1.2.3 -m "Release v1.2.3"`     |
| Delete local tag          | `git tag -d v1.2.3`                         |
| Delete remote tag         | `git push origin :refs/tags/v1.2.3`         |
| Push specific tag         | `git push origin v1.2.3`                    |
| Push all tags             | `git push --tags`                           |
| Create GitHub release     | `gh release create v1.2.3 --generate-notes` |
| List GitHub releases      | `gh release list`                           |
| View release details      | `gh release view v1.2.3`                    |
| Bump version (npm)        | `npm version patch/minor/major`             |
| Bump version (poetry)     | `poetry version patch/minor/major`          |

---

## Release Commit Message Examples

```
chore(release): bump version to v1.2.3
chore(deps): upgrade all dependencies to latest
ci(github): add automated release workflow
docs(changelog): update for v1.2.3 release
```

---

## Project-Specific Conventions

**Always respect existing project conventions:**

- Check `CONTRIBUTING.md` for release guidelines
- Review git history for established patterns: `git log --oneline --grep="release"`
- Follow existing version prefix (`v`, `version-`, or none)
- Match existing changelog format
- Use project's release tool (semantic-release, release-please, etc.)

**Jira ticket prefixes:**

If project requires Jira ticket prefixes:
```
feat(api): PROJ-123 add user endpoint
chore(release): PROJ-456 bump version to v1.2.3
```

**Scope requirements:**

- This standard requires scope: `feat(api): add endpoint`
- If project allows scope-less commits: `feat: add endpoint`
- Follow project rules, not this standard

---

## Troubleshooting

### Issue: Tag already exists

**Error:**
```
fatal: tag 'v1.2.3' already exists
```

**Solution:**
```bash
# View existing tag
git show v1.2.3

# Delete local tag if needed
git tag -d v1.2.3

# Delete remote tag if needed
git push origin :refs/tags/v1.2.3

# Create new tag
git tag -a v1.2.3 -m "Release v1.2.3"
```

### Issue: Pushed wrong tag

**Solution:**
```bash
# Delete remote tag
git push origin :refs/tags/v1.2.3

# Delete local tag
git tag -d v1.2.3

# Create correct tag
git tag -a v1.2.4 -m "Release v1.2.4"
git push origin v1.2.4
```

### Issue: GitHub Release not created

**Solution:**
```bash
# Check gh CLI authentication
gh auth status

# Create release manually
gh release create v1.2.3 --notes "Release notes here"

# Or use --generate-notes for auto-generated notes
gh release create v1.2.3 --generate-notes
```

---

## Best Practices

### Do

✅ **Tag from main/release branch only**
- Never tag from feature branches
- Ensure branch is up to date

✅ **Include meaningful tag message**
```bash
git tag -a v1.2.3 -m "Release v1.2.3: Add user authentication"
```

✅ **Test before tagging**
- All tests pass
- Build succeeds
- Manual smoke tests complete

✅ **Push tags explicitly**
```bash
git push origin v1.2.3  # Explicit, clear
```

✅ **Create GitHub Release with notes**
```bash
gh release create v1.2.3 --notes-file CHANGELOG.md
```

### Don't

❌ **Don't use lightweight tags for releases**
```bash
git tag v1.2.3  # No -a flag, missing metadata
```

❌ **Don't push all tags blindly**
```bash
git push --tags  # May push unintended tags
```

❌ **Don't tag without testing**
- Always verify tests pass first

❌ **Don't delete tags after pushing**
- Tags are immutable once pushed
- Create new version instead

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to determine version | **git-commits** skill | See VERSIONING.md for SemVer rules |
| Need to automate releases | **ci-cd** skill | Set up semantic-release or release-please |
| Need to document release | **documentation** skill | Update CHANGELOG, write release notes |
| Release needs deployment | **ci-cd** skill | Configure deploy on tag push |

---

## Reference

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Semantic Versioning](https://semver.org/)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [release-please](https://github.com/googleapis/release-please)
