---
name: git-commits
description: "Write commit messages, changelogs, release notes, and manage versioning following Conventional Commits v1.0.0 with required scope. Use when the user asks for a commit message, changelog, release notes, versioning, tagging, or how to format commits."
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

Follow **[Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)** when the project does not specify otherwise:

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

Use **SemVer** (`MAJOR.MINOR.PATCH`) unless the project specifies otherwise:

| Version Bump | When                                | Example           |
| ------------ | ----------------------------------- | ----------------- |
| **MAJOR**    | Breaking changes (API incompatible) | `1.2.3` → `2.0.0` |
| **MINOR**    | New features (backward compatible)  | `1.2.3` → `1.3.0` |
| **PATCH**    | Bug fixes (backward compatible)     | `1.2.3` → `1.2.4` |

**Pre-release versions**: `1.0.0-alpha.1`, `1.0.0-beta.2`, `1.0.0-rc.1`

**Determining version from commits** (Conventional Commits v1.0.0):

- `feat(<scope>)!:` or `BREAKING CHANGE:` footer → **MAJOR**
- `feat(<scope>):` → **MINOR**
- `fix(<scope>):`, `perf(<scope>):` → **PATCH**
- `docs(<scope>):`, `style(<scope>):`, `test(<scope>):`, `chore(<scope>):`, `refactor(<scope>):` → no version bump (or PATCH if releasing)

**Note:** Any commit with `!` after scope or `BREAKING CHANGE:` footer triggers MAJOR bump, regardless of type.

### 5. Tagging Releases

```bash
# Create annotated tag (preferred)
git tag -a v1.2.3 -m "Release v1.2.3: Brief description"

# Push tag to remote
git push origin v1.2.3

# Push all tags
git push --tags
```

**Tag naming**: Use `v` prefix consistently (`v1.2.3` not `1.2.3`).

### 6. Automated Release Workflow

For projects using automation (e.g., `semantic-release`, `release-please`):

| Tool                 | How It Works                                                                    |
| -------------------- | ------------------------------------------------------------------------------- |
| **semantic-release** | Analyzes commits, determines version, creates tag, publishes, updates changelog |
| **release-please**   | Creates release PR with changelog; merge to release                             |
| **standard-version** | Bumps version, updates changelog, creates tag                                   |

**Manual release workflow:**

1. Update version in manifest (`package.json`, `pyproject.toml`, etc.)
2. Update CHANGELOG.md with new version header
3. Commit: `chore(release): bump version to v1.2.3`
4. Tag: `git tag -a v1.2.3 -m "Release v1.2.3"`
5. Push: `git push && git push --tags`
6. Create GitHub Release (optional): `gh release create v1.2.3 --notes-file CHANGELOG.md`

**Example commit messages:**
```
chore(release): bump version to v1.2.3
chore(deps): upgrade all dependencies to latest
ci(github): add automated release workflow
docs(changelog): update for v1.2.3 release
```

### 7. Commands

| Action                    | Command                                     |
| ------------------------- | ------------------------------------------- |
| Inspect staged changes    | `git diff --staged`                         |
| Suggest message from diff | Review diff, then output suggested message  |
| View recent messages      | `git log -n 5 --oneline`                    |
| View tags                 | `git tag -l` or `git tag -l "v1.*"`         |
| Create tag                | `git tag -a v1.2.3 -m "Release v1.2.3"`     |
| Push tag                  | `git push origin v1.2.3`                    |
| Create GitHub release     | `gh release create v1.2.3 --generate-notes` |
| Bump version (npm)        | `npm version patch/minor/major`             |

**Project Conventions:**
- Always respect existing project conventions if they differ from this standard
- Check project's CONTRIBUTING.md or git history for established patterns
- If project requires Jira ticket prefixes (e.g., `feat(api): PROJ-123 add endpoint`), include them
- Scope is **required** by this standard; if project allows scope-less commits, follow project rules

**Reference:** [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

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
