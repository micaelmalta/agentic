# Database Migrations in CI

This document provides comprehensive guidance for running database migrations in CI/CD pipelines.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Migration Stages

| Stage          | Action                                   | Considerations                                          |
| -------------- | ---------------------------------------- | ------------------------------------------------------- |
| **Test**       | Run migrations against test DB           | Ensure migrations are reversible; test both up and down |
| **Staging**    | Run migrations before code deploy        | Validate with production-like data                      |
| **Production** | Run migrations with appropriate strategy | Zero-downtime for critical systems                      |

---

## Migration Commands by Ecosystem

| Ecosystem        | Migrate                     | Rollback                                     |
| ---------------- | --------------------------- | -------------------------------------------- |
| Node (Prisma)    | `npx prisma migrate deploy` | `npx prisma migrate reset` (dev only)        |
| Node (Knex)      | `npx knex migrate:latest`   | `npx knex migrate:rollback`                  |
| Python (Alembic) | `alembic upgrade head`      | `alembic downgrade -1`                       |
| Python (Django)  | `python manage.py migrate`  | `python manage.py migrate <app> <migration>` |
| Go (goose)       | `goose up`                  | `goose down`                                 |
| Ruby (Rails)     | `rails db:migrate`          | `rails db:rollback`                          |

---

## CI Migration Pattern

### Basic Pattern

1. **Run migrations in a separate job/step before deploy**
   - Isolate migration execution from application deployment
   - Allows for independent retry and monitoring

2. **If migration fails, stop deployment**
   - Never deploy code that depends on schema changes that failed to apply
   - Alert on-call team immediately

3. **For rollback: deploy previous code version, then run down migration**
   - Code rollback first (safer)
   - Then run migration rollback if needed

### Example: GitHub Actions

```yaml
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: migrate  # Only runs if migrate succeeds
    runs-on: ubuntu-latest
    steps:
      - name: Deploy application
        run: ./deploy.sh
```

### Example: GitLab CI

```yaml
migrate:
  stage: migrate
  script:
    - alembic upgrade head
  only:
    - main

deploy:
  stage: deploy
  script:
    - ./deploy.sh
  needs: [migrate]
  only:
    - main
```

---

## Zero-Downtime Migrations

For production systems that cannot afford downtime, use a multi-phase approach:

### Phase 1: Additive Changes (Deploy First)

Add new columns/tables without removing old ones:

```sql
-- Safe: Add new column (nullable or with default)
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Safe: Add new table
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  token VARCHAR(255) NOT NULL
);
```

**Deployment order:**
1. Deploy migration (adds new column/table)
2. Deploy code (reads/writes both old and new)
3. Verify new code works
4. Backfill data if needed

### Phase 2: Dual-Write (Code Change)

Update code to write to both old and new locations:

```javascript
// Write to both old and new columns
await db.user.update({
  where: { id: userId },
  data: {
    is_verified: true,      // Old column (keep for now)
    email_verified: true,   // New column
  }
});
```

### Phase 3: Backfill (Data Migration)

Migrate existing data from old to new:

```sql
-- Backfill in batches to avoid lock contention
UPDATE users
SET email_verified = is_verified
WHERE email_verified IS NULL
LIMIT 1000;
```

### Phase 4: Dual-Read (Code Change)

Update code to read from new location, fallback to old:

```javascript
const verified = user.email_verified ?? user.is_verified;
```

### Phase 5: Remove Old (Deploy Last)

After confirming all reads use new column, remove old:

```sql
-- Safe: Remove old column after all code uses new column
ALTER TABLE users DROP COLUMN is_verified;
```

**Deployment order:**
1. Deploy migration (removes old column)
2. Deploy code (only reads/writes new column)

---

## Testing Migrations

### Test Up Migration

```bash
# Apply migration
npm run migrate:up

# Verify schema
npm run db:verify-schema

# Run tests against new schema
npm test
```

### Test Down Migration (Rollback)

```bash
# Apply migration
npm run migrate:up

# Rollback migration
npm run migrate:down

# Verify schema restored
npm run db:verify-schema

# Ensure old code still works
npm test
```

### Test in CI

```yaml
- name: Test migrations
  run: |
    # Apply all migrations
    npm run migrate:up

    # Run tests
    npm test

    # Test rollback
    npm run migrate:down
    npm run migrate:up
```

---

## Common Migration Issues

### Issue: Migration Fails with Lock Timeout

**Symptom:**
```
ERROR: could not obtain lock on relation "users"
```

**Cause:** Long-running migration blocks reads/writes

**Fix:**
- Use `CONCURRENTLY` for index creation (Postgres)
- Break large migrations into smaller batches
- Run migrations during low-traffic periods

**Example: Concurrent index creation**
```sql
-- Bad: Blocks table
CREATE INDEX idx_users_email ON users(email);

-- Good: Non-blocking
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### Issue: Migration Fails with Constraint Violation

**Symptom:**
```
ERROR: column "email" contains null values
```

**Cause:** Adding NOT NULL to column with existing nulls

**Fix:**
1. Add column as nullable first
2. Backfill null values
3. Add NOT NULL constraint

**Example:**
```sql
-- Step 1: Add nullable column
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- Step 2: Backfill data
UPDATE users SET email = username || '@example.com' WHERE email IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

### Issue: Migration Dependencies Missing

**Symptom:**
```
ERROR: relation "user_sessions" does not exist
```

**Cause:** Migrations run out of order or incomplete

**Fix:**
- Ensure migration order is deterministic (timestamp-based naming)
- Check for missing migrations in production
- Use migration version tracking

---

## Migration Rollback Strategy

### When to Rollback

- Migration fails to apply
- Post-deployment smoke tests fail
- Critical bug discovered after deployment
- Data corruption detected

### Rollback Steps

1. **Stop new deployments**
   ```bash
   # Prevent concurrent deployments
   git tag -a rollback-$(date +%s) -m "Rollback in progress"
   ```

2. **Deploy previous code version**
   ```bash
   # Redeploy last known good version
   git checkout <previous-release-tag>
   ./deploy.sh
   ```

3. **Run down migration (if needed)**
   ```bash
   # Only if schema change breaks old code
   npm run migrate:down
   ```

4. **Verify system health**
   ```bash
   # Check logs, metrics, smoke tests
   curl https://api.example.com/health
   ```

5. **Document incident**
   - What went wrong
   - Impact (users affected, duration)
   - Root cause
   - Prevention steps

---

## Best Practices

### Do

✅ **Test migrations in staging first**
- Use production-like data volume
- Measure migration duration
- Verify rollback works

✅ **Make migrations reversible**
- Always provide down migration
- Test rollback before deploying

✅ **Use idempotent migrations**
- Check if change already exists
- Safe to run multiple times

✅ **Monitor migration execution**
- Alert on failures
- Track migration duration
- Log migration output

✅ **Document breaking changes**
- Update CHANGELOG
- Notify team of schema changes
- Update API documentation

### Don't

❌ **Don't rename columns directly**
- Use additive changes (add new, backfill, remove old)

❌ **Don't delete data in migrations**
- Archive instead of delete
- Require explicit confirmation

❌ **Don't run long migrations during peak traffic**
- Schedule during maintenance window
- Use low-traffic periods

❌ **Don't skip migration testing**
- Always test in staging
- Always test rollback

❌ **Don't hardcode sensitive data**
- Use environment variables
- Never commit credentials

---

## Troubleshooting Checklist

When migrations fail in CI:

- [ ] Check migration syntax and SQL errors
- [ ] Verify database connection string is correct
- [ ] Ensure migration user has sufficient permissions
- [ ] Check for locked tables (long-running queries)
- [ ] Verify migration dependencies are met
- [ ] Check for constraint violations (NOT NULL, FOREIGN KEY)
- [ ] Confirm target schema matches migration expectations
- [ ] Review migration logs for detailed error messages
- [ ] Test migration locally with production data dump
- [ ] Verify rollback migration works correctly

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Migration failures in CI | **debugging** skill | Investigate locked tables, constraint violations |
| Testing migrations | **testing** skill | See Section 8: Database Migration Testing |
| Schema changes need documentation | **documentation** skill | Update API docs, CHANGELOG |
| Migration security review | **security-reviewer** skill | Review SQL injection risks, permission handling |
