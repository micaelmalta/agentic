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

| Stage          | Action                                   | Considerations                                          |
| -------------- | ---------------------------------------- | ------------------------------------------------------- |
| **Test**       | Run migrations against test DB           | Ensure migrations are reversible; test both up and down |
| **Staging**    | Run migrations before code deploy        | Validate with production-like data                      |
| **Production** | Run migrations with appropriate strategy | Zero-downtime for critical systems                      |

**Migration commands by ecosystem:**

| Ecosystem        | Migrate                     | Rollback                                     |
| ---------------- | --------------------------- | -------------------------------------------- |
| Node (Prisma)    | `npx prisma migrate deploy` | `npx prisma migrate reset` (dev only)        |
| Node (Knex)      | `npx knex migrate:latest`   | `npx knex migrate:rollback`                  |
| Python (Alembic) | `alembic upgrade head`      | `alembic downgrade -1`                       |
| Python (Django)  | `python manage.py migrate`  | `python manage.py migrate <app> <migration>` |
| Go (goose)       | `goose up`                  | `goose down`                                 |
| Ruby (Rails)     | `rails db:migrate`          | `rails db:rollback`                          |

**CI migration pattern:**

1. Run migrations in a separate job/step before deploy
2. If migration fails, stop deployment
3. For rollback: deploy previous code version, then run down migration

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

Set up observability in the pipeline and deployed application:

| Layer       | What to Configure                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| **Logging** | Structured logs (JSON), log levels, correlation IDs; ship to central system (Datadog, CloudWatch, ELK) |
| **Metrics** | Application metrics (request count, latency, error rate); infrastructure metrics (CPU, memory)         |
| **Tracing** | Distributed tracing for multi-service systems (OpenTelemetry, Jaeger, Datadog APM)                     |
| **Alerts**  | Alert on error rate spikes, latency p99, failed deployments; route to on-call                          |

**CI observability steps:**

- Add deployment events/markers to monitoring system
- Run smoke tests post-deploy and alert on failure
- Track deployment frequency and failure rate as metrics

**Health checks**: Add `/health` or `/ready` endpoints; CI can verify after deploy.

**MCP (Datadog):** When monitoring or observability is in scope, use the **Datadog MCP** (after **/setup**) to inspect monitors, query metrics, search logs, and check service health. Use tools such as `list_monitors`, `get_monitor_status`, `query_metrics`, `search_logs`, and `get_service_health` to validate alerts and deployment impact. Ensure **/setup** has been run so Datadog MCP is configured.

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

**BAD - Never do this:**

```yaml
# BAD: Hardcoded secret in workflow
env:
  API_KEY: "sk-1234567890abcdef"

# BAD: Secret printed in logs
- run: echo "Using key ${{ secrets.API_KEY }}"

# BAD: Secret in code
const API_KEY = "sk-1234567890abcdef";
```

**GOOD - Always do this:**

```yaml
# GOOD: Reference from secret store
env:
  API_KEY: ${{ secrets.API_KEY }}

# GOOD: Mask secrets in output
- run: echo "::add-mask::${{ secrets.API_KEY }}"

# GOOD: Secret from environment variable
const API_KEY = process.env.API_KEY;
```

For deep security analysis of secrets handling, invoke the **security-reviewer** skill.

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
| Release needs commit messages/changelog | **git-commits** skill | Read `skills/git-commits/SKILL.md` |
| CI tests failing | **testing** / **debugging** skill | Read respective SKILL.md files |
| Database migration in pipeline | Also check **testing** skill | Section 8: Database Migration Testing |
