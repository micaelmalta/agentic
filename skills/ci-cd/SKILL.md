---
name: ci-cd
description: "Configure and fix CI/CD pipelines: build, test, lint, deploy, database migrations, environment config, observability setup (log shipping, metric collection, alert configuration), and releases. Use when the user asks about CI, pipeline, GitHub Actions, deploy, fix the build, environment variables, monitoring setup, or release process."
triggers:
  - "/ci"
  - "CI"
  - "pipeline"
  - "GitHub Actions"
  - "fix the build"
  - "deploy"
  - "release pipeline"
  - "lint in CI"
  - "run tests in CI"
  - "environment variables"
  - "env config"
  - "secrets management"
  - "monitoring"
  - "observability"
  - "alerts"
  - "release process"
  - "versioning"
  - "database migration CI"
---

# CI/CD Skill

## Core Philosophy

**"Pipeline as code: repeatable, fast, and visible."**

Keep CI config in version control, make steps deterministic, and fail fast on build/test/lint. Deploy only from a defined pipeline when possible.

---

## Protocol

### 1. Identify System

| System             | Config location            | Typical use                        |
| ------------------ | -------------------------- | ---------------------------------- |
| **GitHub Actions** | `.github/workflows/*.yml`  | Build, test, lint, release, deploy |
| **GitLab CI**      | `.gitlab-ci.yml`           | Same                               |
| **Jenkins**        | `Jenkinsfile` or UI        | Same                               |
| **CircleCI**       | `.circleci/config.yml`     | Same                               |
| **Other**          | Repo root or `ci/`, `.ci/` | Check project README or docs       |

Respect existing layout and naming (e.g. `build.yml`, `test.yml`, `deploy.yml`).

### 2. Pipeline Stages

- **Build**: Compile/install; produce artifacts. Cache deps when supported.
- **Test**: Unit and integration; use same commands as local (e.g. `npm test`, `pytest`).
- **Lint**: Linters and formatters; fail on violation or auto-fix and commit, per project policy.
- **Migrate**: Run database migrations before or during deploy (see Database Migrations below).
- **Deploy**: Only from main/release or tags; use secrets for credentials; prefer idempotent steps.

Add or change one job/workflow at a time; run the pipeline to verify.

### 3. Database Migrations in CI

Run database migrations before or during deploy as a separate CI step.

**Quick reference:** Run migrations in test/staging/production stages. Use ecosystem-specific commands (Prisma, Knex, Alembic, Django, goose, Rails). If migration fails, stop deployment.

**For complete database migration guide:** See [reference/DB_MIGRATIONS.md](reference/DB_MIGRATIONS.md), which covers:
- Migration stages and considerations
- Commands by ecosystem (Node, Python, Go, Ruby)
- CI migration patterns
- Zero-downtime migrations (multi-phase approach)
- Testing migrations (up/down, rollback)
- Common issues (lock timeout, constraint violations, dependencies)
- Rollback strategy and troubleshooting

### 4. Environment & Config Management

| Concern           | Approach                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Secrets**       | Use platform secret store (GitHub Secrets, Vault, AWS SSM); never in code or logs. See Secrets Safety below |
| **Env vars**      | Define in workflow YAML or platform settings; document required vars in README             |
| **Config files**  | Use environment-specific files (`.env.production`, `config/prod.json`) or inject at deploy |
| **Feature flags** | Integrate with flag service (LaunchDarkly, Unleash, custom) or env vars for simple cases   |

**Environment parity**: Keep dev/staging/prod as similar as possible. Document differences (e.g. mock services in dev).

**Config by environment:**

```yaml
# Example: GitHub Actions environment-specific deploy
jobs:
  deploy:
    environment: production # Uses production secrets
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      API_KEY: ${{ secrets.API_KEY }}
```

### 5. Observability & Monitoring

Set up observability (logging, metrics, tracing, alerts) in the pipeline and deployed application.

**Quick reference:** Use structured logs (JSON), track RED metrics (Requests, Errors, Duration), implement distributed tracing for microservices, alert on error rate spikes and latency. Add deployment events and smoke tests to CI.

**MCP (Datadog):** Use Datadog MCP (after `/setup`) to query metrics, search logs, check monitors, and validate deployment impact.

**For complete observability guide:** See [reference/OBSERVABILITY.md](reference/OBSERVABILITY.md), which covers:
- Observability layers (Logging, Metrics, Tracing, Alerts)
- Structured logging with correlation IDs
- Application metrics (RED method) and infrastructure metrics
- Distributed tracing with OpenTelemetry/Jaeger
- Alert rules and routing (PagerDuty, Slack)
- CI observability (deployment events, smoke tests)
- Health checks (liveness, readiness)
- Datadog MCP integration and best practices

### 6. Release Management

| Aspect               | Approach                                                                               |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Versioning**       | Semantic versioning (`MAJOR.MINOR.PATCH`); automate with tools like `semantic-release` |
| **Tagging**          | Tag releases in git; deploy from tags for production                                   |
| **Changelog**        | Auto-generate from conventional commits or maintain manually (see git-commits skill)   |
| **Release branches** | Use `release/*` branches for staged releases; or deploy from `main` with tags          |

**Release workflow:**

1. Merge to main (or release branch)
2. CI creates version tag (from commits or manual)
3. CI builds release artifacts
4. Deploy to staging → production (gated)
5. Create GitHub Release with changelog

### 7. Fixing Failures

- **Read logs**: Identify failing step and error message.
- **Reproduce locally**: Run the same command (e.g. install, test, lint) in the same env (version, OS) when possible.
- **Fix**: Fix the code or the pipeline (dependency, env var, path, permission). Prefer fixing the cause over relaxing checks (e.g. don't disable tests to make CI green).
- **Secrets**: Never log or commit secrets; use the platform's secret store and reference by name. See Secrets Safety below.
- **Migration failures**: Check for locked tables, constraint violations, or missing dependencies; test migrations in staging first.

### Secrets Safety

Never log or commit secrets; always use platform secret store (GitHub Secrets, Vault, AWS SSM) and reference by name.

**Quick reference:**
- ❌ BAD: Hardcoded secrets, secrets in logs, secrets in code
- ✅ GOOD: Reference from secret store, mask in output, read from environment variables

**For complete secrets safety guide:** See [reference/SECRETS.md](reference/SECRETS.md), which covers:
- BAD practices (hardcoded, logged, committed secrets)
- GOOD practices (secret stores, masking, environment variables)
- Secret store options (GitHub, AWS, Vault, Azure, GCP)
- Secret scanning (git-secrets, GitHub scanning, TruffleHog)
- Secret rotation (when, how, zero-downtime)
- Handling secret leaks (revoke, rotate, investigate)
- Best practices by platform (GitHub Actions, GitLab, CircleCI)

For deep security analysis, invoke the **security-reviewer** skill.

### 8. Conventions

- Use matrix or parallel jobs for multiple runtimes/versions when relevant.
- Cache dependency installs (e.g. npm, pip, bundler) to speed runs.
- Set explicit versions for runtimes (e.g. `node-version`, `python-version`) so runs are reproducible.
- Document in README or `docs/ci.md` how to run the same steps locally.
- Document required environment variables and how to obtain secrets.

### 9. Commands

- **Trigger/check**: Push branch, open PR, or use "Re-run" in the CI UI.
- **Local parity**: Run the same install/test/lint commands as in the workflow (see workflow YAML).
- **Release**: `npm version patch/minor/major`, `git tag v1.2.3`, or use semantic-release.

---

## Checklist

- [ ] Pipeline config is in repo and under version control.
- [ ] Build and test steps match local commands and versions where practical.
- [ ] Failures are addressed by fixing cause, not by skipping or weakening checks.
- [ ] Secrets are in secret store only; not in logs or code.
- [ ] Deploy steps are gated (branch/tag) and use credentials from secret store.
- [ ] Database migrations run in CI with rollback strategy documented.
- [ ] Environment variables documented; config separated from code.
- [ ] Observability configured: logging, metrics, alerts for deployments.
- [ ] Release process defined: versioning, tagging, changelog generation.

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| CI needs observability/monitoring | **Datadog MCP** | Use `list_monitors`, `query_metrics` (after `/setup`) |
| Pipeline has security concerns | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |
| CI tests failing | **testing** / **debugging** skill | Read respective SKILL.md files |
| Database migration in pipeline | Also check **testing** skill | Section 8: Database Migration Testing |

**See also:** **git-commits** skill for commit messages, changelogs, and versioning in release automation.
