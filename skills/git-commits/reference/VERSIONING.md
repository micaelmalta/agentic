# Semantic Versioning

This document provides comprehensive guidance for versioning software releases using Semantic Versioning (SemVer).

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## SemVer Format

Use **SemVer** (`MAJOR.MINOR.PATCH`) unless the project specifies otherwise:

| Version Bump | When                                | Example           |
| ------------ | ----------------------------------- | ----------------- |
| **MAJOR**    | Breaking changes (API incompatible) | `1.2.3` → `2.0.0` |
| **MINOR**    | New features (backward compatible)  | `1.2.3` → `1.3.0` |
| **PATCH**    | Bug fixes (backward compatible)     | `1.2.3` → `1.2.4` |

---

## Pre-release Versions

Format: `MAJOR.MINOR.PATCH-prerelease.number`

**Examples:**
- `1.0.0-alpha.1` - Alpha release (early testing)
- `1.0.0-beta.2` - Beta release (feature-complete, testing)
- `1.0.0-rc.1` - Release candidate (final testing before release)

**Progression:**
```
1.0.0-alpha.1 → 1.0.0-alpha.2 → 1.0.0-beta.1 → 1.0.0-rc.1 → 1.0.0
```

---

## Determining Version from Conventional Commits

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat(<scope>)!:` or `BREAKING CHANGE:` footer | **MAJOR** | `1.2.3` → `2.0.0` |
| `feat(<scope>):` | **MINOR** | `1.2.3` → `1.3.0` |
| `fix(<scope>):`, `perf(<scope>):` | **PATCH** | `1.2.3` → `1.2.4` |
| `docs(<scope>):`, `style(<scope>):`, `test(<scope>):`, `chore(<scope>):`, `refactor(<scope>):` | No bump | (or PATCH if releasing) |

**Note:** Any commit with `!` after scope or `BREAKING CHANGE:` footer triggers MAJOR bump, regardless of type.

---

## Examples

### MAJOR Bump (Breaking Changes)

```
# Example 1: Using ! after scope
refactor(api)!: remove deprecated endpoints

BREAKING CHANGE: Removed /api/v1/users endpoint. Use /api/v2/users instead.
```

```
# Example 2: Using BREAKING CHANGE footer
feat(auth): migrate to OAuth2

BREAKING CHANGE: API keys no longer supported. All clients must use OAuth2.
```

Version: `1.2.3` → `2.0.0`

### MINOR Bump (New Features)

```
feat(search): add fuzzy matching

Added fuzzy matching to search API using Levenshtein distance algorithm.
```

Version: `1.2.3` → `1.3.0`

### PATCH Bump (Bug Fixes)

```
fix(auth): prevent race condition in token refresh

Token refresh now uses mutex to prevent concurrent refresh attempts.
```

Version: `1.2.3` → `1.2.4`

---

## Best Practices

### Do

✅ **Follow SemVer strictly**
- MAJOR for breaking changes
- MINOR for new features
- PATCH for bug fixes

✅ **Start at 0.1.0 for initial development**
- Pre-1.0.0 versions indicate API instability
- Breaking changes allowed without MAJOR bump

✅ **Release 1.0.0 when API is stable**
- Signals production readiness
- Commits to backward compatibility

✅ **Use pre-release versions for testing**
- Alpha: Early testing, unstable
- Beta: Feature-complete, testing
- RC: Final testing, stable

✅ **Document breaking changes clearly**
- List all breaking changes in CHANGELOG
- Provide migration guide
- Deprecate features before removing

### Don't

❌ **Don't skip versions**
- Always increment by 1
- Bad: `1.2.3` → `1.2.5` (skips 1.2.4)

❌ **Don't reuse version numbers**
- Once released, version is immutable
- Fix mistakes with new version

❌ **Don't make breaking changes in MINOR/PATCH**
- Breaking changes ALWAYS require MAJOR bump
- Even "small" breaking changes

❌ **Don't use build metadata for versioning**
- Build metadata (`+build.123`) ignored in precedence
- Use for informational purposes only

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to create release | **git-commits** skill | See RELEASES.md for tagging and release workflow |
| Need to automate versioning | **ci-cd** skill | Set up semantic-release or release-please in CI |
| Need to document version changes | **documentation** skill | Update CHANGELOG and migration guides |
