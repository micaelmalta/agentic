---
name: dependencies
description: "Upgrade and manage dependencies: resolve conflicts, update lockfiles, and check compatibility. Use when the user asks to upgrade deps, update packages, fix dependency conflict, or update lockfile."
triggers:
  - "/deps"
  - "upgrade dependencies"
  - "update packages"
  - "dependency conflict"
  - "update lockfile"
  - "bump version"
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

---

## Checklist

- [ ] Manifest and lockfile both updated and committed.
- [ ] Install/build succeeds; tests pass after upgrade.
- [ ] Conflicts resolved with a clear choice (and comment if non-obvious).
- [ ] Major upgrades or breaking changes called out for the user.
