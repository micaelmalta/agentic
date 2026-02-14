---
name: git-commits
description: "Write commit messages, changelogs, release notes, and manage versioning following Conventional Commits with required scope. Use when the user asks for a commit message, changelog, release notes, versioning, tagging, or how to format commits."
triggers:
  - "/commit"
  - "commit message"
  - "write commit message"
  - "changelog"
  - "release notes"
  - "conventional commits"
  - "format my commit"
  - "version bump"
  - "create release"
  - "tag release"
  - "semantic versioning"
---

# Git / Commits Skill

## Core Philosophy

**"Commits tell a story; changelogs tell users what changed."**

Write clear, consistent commit messages and changelogs so history is readable and releases are understandable.

---

## Protocol

### 1. Commit Message Format

Follow **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** when the project does not specify otherwise:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Format Rules:**
- `<type>`: Required, lowercase type from list below
- `(<scope>)`: **Required**, noun describing section of codebase (e.g., `api`, `auth`, `ui`, `db`)
- `<short summary>`: Required, imperative mood, lowercase, no period, ~72 chars max
- Breaking changes: Add `!` after scope: `feat(api)!: drop support for Node 12`

**Scope Naming:**
- Use **lowercase** nouns (e.g., `api`, not `API`)
- Be **specific** but not too granular (e.g., `auth` not `login-form-button`)
- Common scopes: `api`, `auth`, `ui`, `db`, `cli`, `docs`, `config`, `deps`, `tests`, `ci`, `build`
- For components: `user-service`, `payment-flow`, `dashboard`
- For features: `oauth`, `search`, `notifications`
- Be consistent across the project (check `git log --oneline` for existing patterns)

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`.

- **feat**: New feature for the user (triggers MINOR bump)
- **fix**: Bug fix for the user (triggers PATCH bump)
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, whitespace, no logic change)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (deps, tooling, config)
- **perf**: Performance improvement
- **ci**: CI/CD configuration and scripts
- **build**: Build system or external dependencies
- **revert**: Reverts a previous commit

**Breaking Changes:**
- Option 1: Add `!` after scope: `refactor(api)!: drop deprecated endpoints`
- Option 2: Footer: `BREAKING CHANGE: description of what broke`
- Both trigger MAJOR version bump

**Body:** Use when you need to explain "why", context, or side effects. Leave blank line after summary.

**Footers:** `BREAKING CHANGE: <description>`, `Fixes #123`, `Closes #456`, `Refs #789`

**Examples:**
```
feat(auth): add OAuth2 social login
fix(api): prevent race condition in user creation
docs(readme): update installation instructions
refactor(db)!: migrate from MySQL to PostgreSQL

BREAKING CHANGE: Database schema incompatible with v1.x
chore(deps): upgrade TypeScript to v5
test(api): add integration tests for user endpoints
perf(search): optimize query with database index
```

### 2. Changelog

- Group by type (Added, Changed, Fixed, Removed, Security).
- One line per item; link to PR/commit when possible.
- Put newest entries at the top (or follow existing `CHANGELOG` style).

### 3. Release Notes

- User-facing summary of the release.
- Highlights and breaking changes first; then full list or link to changelog.
- Version and date in title or header.

### 4. Versioning (Semantic Versioning)

Use **SemVer** (`MAJOR.MINOR.PATCH`): MAJOR for breaking changes, MINOR for new features, PATCH for bug fixes.

**For complete versioning guide:** See [reference/VERSIONING.md](reference/VERSIONING.md), which covers:
- SemVer format and version bump rules
- Pre-release versions (alpha, beta, rc)
- Determining version from Conventional Commits
- Examples and best practices

### 5. Tagging and Release Management

Create annotated tags (`git tag -a v1.2.3 -m "Release v1.2.3"`) with `v` prefix. Use automated tools (semantic-release, release-please) or manual workflow (update version, CHANGELOG, commit, tag, push).

**For complete release guide:** See [reference/RELEASES.md](reference/RELEASES.md), which covers:
- Tagging releases (annotated tags, naming conventions)
- Automated release workflow (semantic-release, release-please, standard-version)
- Manual release workflow (step-by-step)
- Commands reference (git tag, gh release, npm version)
- Troubleshooting and best practices

**Project Conventions:**
- Always respect existing project conventions if they differ from this standard
- Check project's CONTRIBUTING.md or git history for established patterns
- If project requires Jira ticket prefixes (e.g., `feat(api): PROJ-123 add endpoint`), include them
- Scope is **required** by this standard; if project allows scope-less commits, follow project rules

**Reference:** [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

---

## Checklist

- [ ] Type is lowercase and valid (feat, fix, docs, etc.)
- [ ] **Scope is present** and describes codebase section (api, auth, ui, db, etc.)
- [ ] Summary is imperative mood, lowercase, no period, ~72 chars max
- [ ] Breaking changes use `!` after scope or `BREAKING CHANGE:` footer
- [ ] Body explains "why" when needed (leave blank line after summary)
- [ ] Footers follow format: `BREAKING CHANGE:`, `Fixes #123`, `Closes #456`
- [ ] Changelog/release notes match what actually changed
- [ ] Version bump follows SemVer based on change type
- [ ] Tag created and pushed for releases (annotated tag with `git tag -a`)
- [ ] GitHub Release created with release notes (if applicable)

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need to version based on commit history | Use SemVer rules in Section 4 above | Automated: `semantic-release` / `release-please` |
| Commit includes security fix | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` to verify fix |
| Commit includes breaking API change | **architect** / **documentation** skill | Update API docs and write ADR |
| Release needs CI/CD pipeline | **ci-cd** skill | Read `skills/ci-cd/SKILL.md` for release pipeline |
| Revert commit needed | Use `git revert <SHA>` | Creates new commit that undoes changes (safe; don't use `git reset`) |
