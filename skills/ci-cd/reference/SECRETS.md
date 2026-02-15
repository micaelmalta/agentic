# Secrets Safety in CI/CD

This document provides comprehensive guidance for handling secrets securely in CI/CD pipelines.

**For overview:** See [SKILL.md - Protocol](../SKILL.md#protocol)

---

## Core Principles

1. **Never hardcode secrets** - Always use secret stores
2. **Never log secrets** - Mask sensitive values in output
3. **Never commit secrets** - Use `.gitignore` and secret scanning
4. **Rotate regularly** - Change secrets periodically
5. **Principle of least privilege** - Grant minimum necessary permissions

---

## BAD Practices (Never Do This)

### ❌ Hardcoded Secret in Workflow

```yaml
# BAD: Secret exposed in workflow file
env:
  API_KEY: "sk-1234567890abcdef"
  DATABASE_PASSWORD: "mypassword123"
```

**Why bad:**
- Visible in version control history
- Accessible to anyone with repo access
- Cannot be rotated without code change

### ❌ Secret Printed in Logs

```yaml
# BAD: Secret appears in CI logs
- run: echo "Using API key ${{ secrets.API_KEY }}"
- run: curl -H "Authorization: Bearer ${{ secrets.TOKEN }}" https://api.example.com
```

**Why bad:**
- Logs are often accessible to broader audience than secrets
- Logs may be retained longer than intended
- Cannot be redacted from historical logs

### ❌ Secret in Code

```javascript
// BAD: Secret hardcoded in application code
const API_KEY = "sk-1234567890abcdef";
const DATABASE_URL = "postgresql://user:password@localhost:5432/db";
```

**Why bad:**
- Committed to version control
- Deployed to all environments (dev, staging, prod)
- Difficult to rotate

### ❌ Secret in Commit Message

```bash
# BAD: Secret exposed in commit history
git commit -m "Add API key: sk-1234567890abcdef"
```

**Why bad:**
- Commit history is public (if repo is public)
- Cannot be removed without rewriting history

### ❌ Secret in URL Parameters

```bash
# BAD: Secret in query string
curl "https://api.example.com/data?api_key=sk-1234567890abcdef"
```

**Why bad:**
- URLs logged by proxies, load balancers, CDNs
- URLs appear in browser history
- URLs can be leaked via Referer header

---

## GOOD Practices (Always Do This)

### ✅ Reference from Secret Store

```yaml
# GOOD: Reference from GitHub Secrets
env:
  API_KEY: ${{ secrets.API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Why good:**
- Secret stored encrypted at rest
- Access controlled by RBAC
- Audit log of secret access

### ✅ Mask Secrets in Output

```yaml
# GOOD: Explicitly mask secret values
- run: echo "::add-mask::${{ secrets.API_KEY }}"
- run: echo "Using API key (masked)"
```

**GitHub Actions automatically masks secrets referenced via `${{ secrets.* }}`, but explicit masking is safer for computed values.**

### ✅ Secret from Environment Variable

```javascript
// GOOD: Read from environment variable
const API_KEY = process.env.API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is required');
}
```

**Why good:**
- Secret injected at runtime
- Different per environment
- Easy to rotate

### ✅ Secret in Request Headers (Not URL)

```bash
# GOOD: Secret in Authorization header
curl -H "Authorization: Bearer ${API_KEY}" https://api.example.com/data
```

**Why good:**
- Headers not logged by default in most systems
- Standard authentication pattern
- Can be encrypted with TLS

### ✅ Validate Secret Format

```javascript
// GOOD: Validate secret format before use
const API_KEY = process.env.API_KEY;

if (!API_KEY || !API_KEY.startsWith('sk-')) {
  throw new Error('Invalid API key format');
}

// Use validated key
await fetch('https://api.example.com', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

---

## Secret Store Options

### GitHub Secrets

**For GitHub Actions:**

1. Navigate to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add name and value
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

**Organization secrets:**
- Shared across all repos in organization
- Scoped to specific repositories if needed

**Environment secrets:**
- Specific to deployment environments (production, staging)
- Additional protection rules (required reviewers)

### AWS Secrets Manager

```yaml
# GitHub Actions with AWS Secrets Manager
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}

- name: Retrieve secrets
  run: |
    export API_KEY=$(aws secretsmanager get-secret-value \
      --secret-id prod/api-key \
      --query SecretString \
      --output text)
```

### HashiCorp Vault

```yaml
# GitHub Actions with Vault
- name: Import Secrets
  uses: hashicorp/vault-action@v2
  with:
    url: https://vault.example.com
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/data/prod api_key | API_KEY ;
      secret/data/prod db_password | DB_PASSWORD
```

### Azure Key Vault

```yaml
# GitHub Actions with Azure Key Vault
- uses: Azure/get-keyvault-secrets@v1
  with:
    keyvault: "myKeyVault"
    secrets: 'api-key, db-password'
  id: secrets

- run: echo "::add-mask::${{ steps.secrets.outputs.api-key }}"
```

### Google Cloud Secret Manager

```yaml
# GitHub Actions with GCP Secret Manager
- name: Setup Cloud SDK
  uses: google-github-actions/setup-gcloud@v0

- name: Retrieve secrets
  run: |
    export API_KEY=$(gcloud secrets versions access latest \
      --secret="api-key")
```

---

## Secret Scanning

### Pre-commit Hook (git-secrets)

Prevent committing secrets:

```bash
# Install git-secrets
brew install git-secrets  # macOS
apt-get install git-secrets  # Linux

# Initialize in repo
cd your-repo
git secrets --install
git secrets --register-aws  # Add AWS patterns
git secrets --add 'sk-[A-Za-z0-9]{32}'  # Add custom patterns
```

### GitHub Secret Scanning

GitHub automatically scans for exposed secrets:

**When triggered:**
- On push to repository
- When secret pattern detected in public repo
- Partner patterns (AWS, Azure, Stripe, etc.)

**What happens:**
- GitHub notifies repository admin
- Secret provider may be notified
- Secret may be automatically revoked

**Enable for private repos:**
- Settings → Code security and analysis
- Enable "Secret scanning"

### Third-party Tools

- **TruffleHog:** Find secrets in git history
- **Gitleaks:** Detect hardcoded secrets
- **Detect-secrets:** Yelp's secret scanner

```bash
# Scan repo with TruffleHog
trufflehog git https://github.com/org/repo --json

# Scan with Gitleaks
gitleaks detect --source . --verbose
```

---

## Secret Rotation

### When to Rotate

- **Immediately:** Secret exposed (committed, logged, leaked)
- **Regularly:** Every 90 days (industry standard)
- **On departure:** When team member leaves
- **On breach:** When related system compromised

### Rotation Process

1. **Generate new secret**
   ```bash
   # Generate secure random value
   openssl rand -base64 32
   ```

2. **Add new secret alongside old** (for zero-downtime)
   - Update secret store with new value
   - Keep old secret active temporarily

3. **Deploy application with support for both**
   ```javascript
   // Try new key first, fallback to old
   const API_KEY = process.env.API_KEY_NEW || process.env.API_KEY;
   ```

4. **Verify new secret works**
   - Test in staging
   - Monitor production after deploy

5. **Remove old secret**
   - Delete from secret store
   - Update application to only use new

6. **Revoke old secret**
   - Invalidate old key with provider
   - Confirm old key no longer works

---

## Handling Secret Leaks

### If Secret is Exposed

1. **Revoke immediately**
   ```bash
   # Example: Revoke GitHub personal access token
   curl -X DELETE \
     -H "Authorization: token ${OLD_TOKEN}" \
     https://api.github.com/authorizations/${TOKEN_ID}
   ```

2. **Rotate secret**
   - Generate new value
   - Update secret store
   - Deploy updated application

3. **Investigate impact**
   - Check logs for unauthorized access
   - Review audit trails
   - Assess data exposure

4. **Notify stakeholders**
   - Security team
   - Affected users (if applicable)
   - Compliance team (if required)

5. **Post-mortem**
   - Document incident
   - Identify root cause
   - Implement prevention measures

---

## Best Practices by Platform

### GitHub Actions

```yaml
# ✅ Good practices
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval for production secrets
    steps:
      - name: Mask secrets
        run: |
          echo "::add-mask::${{ secrets.API_KEY }}"

      - name: Use secret in headers (not URL)
        run: |
          curl -H "Authorization: Bearer ${{ secrets.API_KEY }}" \
            https://api.example.com

      - name: Write to temporary file (not logged)
        run: |
          echo "${{ secrets.SSH_KEY }}" > /tmp/ssh_key
          chmod 600 /tmp/ssh_key
          # Use key
          rm -f /tmp/ssh_key  # Clean up
```

### GitLab CI

```yaml
# ✅ Good practices
deploy:
  script:
    # Secrets from GitLab CI/CD variables
    - echo "$API_KEY" | docker login -u "$DOCKER_USER" --password-stdin

    # Use protected variables for production
    - |
      if [ "$CI_COMMIT_BRANCH" == "main" ]; then
        echo "Using production secrets"
      fi
  only:
    - main
```

### CircleCI

```yaml
# ✅ Good practices
jobs:
  deploy:
    steps:
      - run:
          name: Deploy with secrets
          command: |
            # Secrets from CircleCI environment variables
            curl -H "Authorization: Bearer ${API_KEY}" \
              https://api.example.com
```

---

## Security Review

For deep security analysis of secrets handling, invoke the **security-reviewer** skill:

```markdown
Read skills/security-reviewer/SKILL.md and review:
- Secret storage mechanism
- Secret access patterns
- Rotation procedures
- Leak detection
```

The security-reviewer will check for:
- Hardcoded credentials
- Secrets in logs
- Insufficient encryption
- Missing rotation policies
- Overly permissive access

---

## Checklist

- [ ] All secrets stored in secret store (GitHub Secrets, Vault, AWS Secrets Manager)
- [ ] No secrets hardcoded in code or configuration files
- [ ] Secrets masked in CI logs (`echo "::add-mask::"` or equivalent)
- [ ] Secrets passed via environment variables, not command-line arguments
- [ ] Secrets used in request headers, not URL parameters
- [ ] Secret scanning enabled (GitHub Secret Scanning, git-secrets, TruffleHog)
- [ ] `.gitignore` includes `.env`, `secrets.yml`, and other secret files
- [ ] Rotation policy defined (90 days recommended)
- [ ] Incident response plan for secret leaks
- [ ] Least privilege: Secrets scoped to minimum necessary permissions

---

## Common Secret Types

| Secret Type         | Storage Location     | Rotation Frequency | Special Considerations              |
| ------------------- | -------------------- | ------------------ | ----------------------------------- |
| API keys            | Secret store         | 90 days            | Use key rotation without downtime   |
| Database passwords  | Secret store         | 90 days            | Coordinate with DB admin            |
| SSH keys            | Secret store         | 1 year             | Use key-based auth, not password    |
| TLS certificates    | Secret store         | Before expiry      | Automate renewal (Let's Encrypt)    |
| OAuth tokens        | Secret store         | On refresh         | Use refresh tokens for long-lived   |
| Encryption keys     | KMS (AWS, Azure, GCP | 1 year             | Use envelope encryption             |
| JWT signing keys    | Secret store         | 6 months           | Support multiple active keys        |
| Webhook secrets     | Secret store         | 1 year             | Validate signatures                 |
| Service account keys | Secret store        | 90 days            | Use workload identity when possible |

---

## Cross-Skill Integration

| Situation | Skill to invoke | How |
|-----------|----------------|-----|
| Need security review of secrets | **security-reviewer** skill | Read `skills/security-reviewer/SKILL.md` |
| Need to document secret management | **documentation** skill | Create runbook for secret rotation |
| Secret leak detected | **debugging** skill | Investigate unauthorized access in logs |
| Need to automate secret rotation | **ci-cd** skill | Add rotation job to CI pipeline |
