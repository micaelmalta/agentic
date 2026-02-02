---
name: git-commits
description: "Write commit messages, changelogs, release notes, and manage versioning following conventional commits or project conventions. Use when the user asks for a commit message, changelog, release notes, versioning, tagging, or how to format commits."
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

Prefer **Conventional Commits** when the project does not specify otherwise:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: Breaking-Change:, Fixes: #123]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`.

- **feat**: User-facing or API change.
- **fix**: Bug fix.
- **docs**: Documentation only.
- **refactor**: No behavior change.
- **test**: Tests only.
- **chore**: Tooling, config, deps (no app code).
- **perf**: Performance improvement.
- **ci** / **build**: CI or build pipeline.

**Rules:** Summary in imperative, lowercase, no period. One logical change per commit. Body when context or rationale is needed.

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

**Determining version from commits** (conventional commits):

- `feat!:` or `BREAKING CHANGE:` → MAJOR
- `feat:` → MINOR
- `fix:`, `perf:`, `refactor:` → PATCH
- `docs:`, `style:`, `test:`, `chore:` → no version bump (or PATCH if releasing)

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
3. Commit: `chore(release): v1.2.3`
4. Tag: `git tag -a v1.2.3 -m "Release v1.2.3"`
5. Push: `git push && git push --tags`
6. Create GitHub Release (optional): `gh release create v1.2.3 --notes-file CHANGELOG.md`

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

Respect project conventions: if the repo uses a different format (e.g. Jira ticket prefix), follow it.

---

## Checklist

- [ ] Type and scope match the change.
- [ ] Summary is imperative and under ~72 chars.
- [ ] Changelog/release notes match what actually changed.
- [ ] Breaking changes called out explicitly.
- [ ] Version bump follows SemVer based on change type.
- [ ] Tag created and pushed for releases.
- [ ] GitHub Release created with release notes (if applicable).
