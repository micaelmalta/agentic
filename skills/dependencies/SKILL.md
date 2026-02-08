---
name: dependencies
description: "Upgrade and manage dependencies: resolve conflicts, update lockfiles, and check compatibility. Use when the user asks to upgrade deps, update packages, fix dependency conflict, or update lockfile."
triggers:
  - "/deps"
  - "upgrade dependencies"
  - "update packages"
  - "dependency conflict"
  - "update lockfile"
  - "bump dependency version"
  - "outdated packages"
  - "npm update"
  - "pip install --upgrade"
---

# Dependencies Skill

## Core Philosophy

**"Upgrade deliberately; keep lockfiles in sync."**

Update dependencies in a controlled way: check compatibility, resolve conflicts, run tests, and commit lockfile changes.

---

## Protocol

### 1. Understand Ecosystem

| Ecosystem  | Manifest                              | Lockfile                                             | Update commands                                                         |
| ---------- | ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| **Node**   | `package.json`                        | `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` | `npm update`, `npm install <pkg>@latest`, `yarn upgrade`, `pnpm update` |
| **Python** | `requirements.txt` / `pyproject.toml` | `requirements.lock` / `poetry.lock`                  | `pip install -U <pkg>`, `poetry update`, `uv lock`                      |
| **Go**     | `go.mod`                              | `go.sum`                                             | `go get -u ./...` or `go get module@version`                            |
| **Rust**   | `Cargo.toml`                          | `Cargo.lock`                                         | `cargo update` or edit version then `cargo build`                       |
| **Ruby**   | `Gemfile`                             | `Gemfile.lock`                                       | `bundle update <gem>`                                                   |

Respect project choice: e.g. npm vs yarn vs pnpm, pip vs poetry vs uv.

### 2. Upgrade Workflow

1. **Scope**: All deps, or only named packages (and their dependents if needed).
2. **Update**: Use the ecosystem’s update command; avoid editing lockfile by hand.
3. **Resolve**: If there are version conflicts, relax constraints or pick a compatible version; document why.
4. **Install/build**: Run install and build so lockfile and manifests are in sync.
5. **Test**: Run test suite; fix any breakage from API or behavior changes.
6. **Commit**: Commit manifest + lockfile together (and any fix commits).

### 3. Conflict Resolution

- **Node**: `npm install` or `yarn install` often suggests fixes; use `overrides`/`resolutions` only when necessary and document.
- **Python**: Resolve version ranges in `requirements.txt` or `pyproject.toml`; regenerate lockfile.
- **Go**: `go get` or fix `go.mod`; run `go mod tidy`.
- **Rust**: Adjust version in `Cargo.toml`; `cargo update` or `cargo build`.

### 4. Security / Outdated

- Use ecosystem tools when the user cares about vulnerabilities or outdated deps: `npm audit`, `yarn audit`, `pip audit`, `cargo audit`, `go list -m -u all`, etc.
- Suggest upgrades or patches; don’t auto-fix without user context (e.g. breaking changes).

### 5. Major Version Upgrades

Major version upgrades often include breaking changes. Follow this strategy:

1. **Read the changelog** - Review all breaking changes, deprecations, and migration guides.
2. **Check compatibility** - Verify that other deps and the app are compatible with the new major.
3. **Update incrementally** - Upgrade one major dep at a time, not all at once.
4. **Run the full test suite** after each upgrade; fix breakage before moving on.
5. **Document breaking changes** - Note what changed and why in the commit message or plan.

### 6. Supply Chain Security

- **Audit regularly**: Run `npm audit`, `pip audit`, `cargo audit`, `bundler-audit` in CI.
- **Pin versions** in lockfiles; use exact versions for critical dependencies.
- **Review new deps** before adding: check maintenance status, download stats, and known vulnerabilities.
- **Use lockfiles** - Always commit lockfiles; never delete them to "fix" issues.
- **Verify checksums** - Lockfiles with integrity hashes (npm, yarn) protect against tampered packages.
- **Invoke security-reviewer** for deep supply chain audit when adding new dependencies to security-sensitive areas.

### 7. Downgrade Strategy

Sometimes you need to downgrade:

- **Regression found** - The new version introduces a bug. Pin to the last working version and document.
- **Compatibility conflict** - Two deps require incompatible versions. Pin the conflicting dep lower and document.
- **Always document** why a downgrade was necessary (in commit message or lockfile comment).

### 8. Cross-Skill Integration

| Situation | Skill to invoke |
|-----------|----------------|
| Security vulnerability in dependency | **security-reviewer** skill |
| Dependency upgrade breaks tests | **testing** skill / **debugging** skill |
| Dependency upgrade breaks build/CI | **ci-cd** skill |
| Major version upgrade with API changes | **code-reviewer** skill |

---

## Checklist

- [ ] Manifest and lockfile both updated and committed.
- [ ] Install/build succeeds; tests pass after upgrade.
- [ ] Conflicts resolved with a clear choice (and comment if non-obvious).
- [ ] Major upgrades or breaking changes called out for the user.
- [ ] Supply chain audit run (npm audit, pip audit, etc.) with no critical vulnerabilities.
- [ ] New dependencies reviewed for maintenance status and security.
- [ ] Downgrades documented with rationale.
