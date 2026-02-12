# Security Search Patterns

This document contains grep/search patterns to find security-relevant code across the codebase. For overview, see [SKILL.md](SKILL.md).

## Contents

- [Secrets & Credentials](#secrets--credentials)
- [Data Leakage](#data-leakage)
- [Injection Vectors](#injection-vectors)
- [XSS & Unsafe Output](#xss--unsafe-output)
- [Deserialization](#deserialization)
- [File Operations](#file-operations)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Cryptography](#cryptography)
- [Network Requests](#network-requests)
- [Standards Reference](#standards-reference)

---

## Secrets & Credentials

Search for hardcoded secrets, API keys, and credentials:

```bash
# Keywords to search
grep -ri "password\|secret\|api_key\|token\|credentials\|private_key" .
grep -ri "aws_access\|Bearer\|Authorization" .
grep -ri "AKIA\|sk_live\|sk_test\|-----BEGIN" .
```

**Common patterns:**
- `password = "hardcoded"`
- `api_key = "sk_live_..."`
- `AWS_ACCESS_KEY = "AKIA..."`
- `Authorization: Bearer hardcoded-token`

---

## Data Leakage

Search for logging and error output that may leak sensitive data:

```bash
# Logging patterns
grep -ri "console.log\|console.error\|console.debug" .
grep -ri "print(\|println\|printf\|System.out" .
grep -ri "logger.debug\|logger.info\|Log.d\|Log.e" .
grep -ri "printStackTrace\|error.stack\|error.message" .
```

**Check for:**
- Secrets in logs: `console.log(user.password)`
- PII in logs: `logger.info("User email: " + email)`
- Stack traces in production: `console.error(error.stack)`
- Debug endpoints: `/debug`, `/admin/logs`

---

## Injection Vectors

Search for potential SQL, NoSQL, and command injection:

```bash
# SQL Injection
grep -ri "execute\|query\|SQL\|WHERE\|SELECT\|INSERT\|UPDATE\|DELETE" .
grep -ri "\${\|`\${" .  # Template literals with potential user input

# Command Injection
grep -ri "Runtime.exec\|os.system\|subprocess\|child_process" .
grep -ri "shell=True\|exec(\|eval(" .
```

**Look for:**
- String concatenation in queries: `"SELECT * FROM users WHERE id=" + userId`
- Template literals: `` `SELECT * FROM ${table}` ``
- Command execution: `exec("rm " + filename)`
- Shell=True: `subprocess.call(cmd, shell=True)`

---

## XSS & Unsafe Output

Search for unsafe HTML rendering and DOM manipulation:

```bash
# XSS vectors
grep -ri "innerHTML\|dangerouslySetInnerHTML\|document.write" .
grep -ri "v-html\|\[innerHTML\]\|createContextualFragment" .
grep -ri "eval\|Function(" .
```

**Check for:**
- Direct HTML assignment: `element.innerHTML = userInput`
- React unsafe: `<div dangerouslySetInnerHTML={{__html: data}} />`
- Vue unsafe: `<div v-html="userContent"></div>`
- Angular unsafe: `<div [innerHTML]="data"></div>`

---

## Deserialization

Search for unsafe deserialization of untrusted data:

```bash
# Deserialization patterns
grep -ri "pickle.loads\|yaml.load\|yaml.unsafe_load" .
grep -ri "unserialize\|JSON.parse.*reviver" .
grep -ri "XMLDecoder\|readObject\|ObjectInputStream" .
```

**Look for:**
- Python pickle: `pickle.loads(user_data)`
- YAML unsafe: `yaml.load(input)` (should use `yaml.safe_load`)
- PHP: `unserialize($_POST['data'])`
- Java: `ObjectInputStream.readObject()`

---

## File Operations

Search for file upload, path traversal, and filesystem operations:

```bash
# File upload and operations
grep -ri "multer\|formidable\|express-fileupload" .
grep -ri "fs.readFile\|fs.writeFile\|path.join" .
grep -ri "\.\./\|__dirname\|process.cwd()" .
```

**Check for:**
- Path traversal: `fs.readFile(path.join(__dirname, userPath))`
- Unrestricted uploads: No file type validation
- Executable uploads: `.php`, `.jsp`, `.asp` files accepted
- Directory traversal: `../../../etc/passwd`

---

## Authentication

Search for authentication logic and potential weaknesses:

```bash
# Auth patterns
grep -ri "login\|authenticate\|verify\|jwt.sign" .
grep -ri "bcrypt\|password\|session\|cookie" .
grep -ri "OAuth\|SAML\|passport" .
```

**Look for:**
- Weak password hashing: `md5(password)`, `sha1(password)`
- Missing bcrypt salt rounds: `bcrypt.hash(password, 1)`
- Insecure JWT: `jwt.sign(payload, 'hardcoded-secret')`
- Session fixation: Session ID in URL
- Missing HttpOnly/Secure flags: `res.cookie('session', id)`

---

## Authorization

Search for authorization checks and access control:

```bash
# Authorization patterns
grep -ri "authorize\|permission\|role\|admin\|isAdmin" .
grep -ri "canAccess\|checkPermission\|requireAuth" .
grep -ri "user_id\|userId\|owner_id\|ownerId\|tenant_id" .
```

**Look for:**
- Missing authorization: Endpoints that fetch by ID without ownership check
- IDOR vulnerabilities: `/api/users/:id` without validating user owns resource
- Horizontal privilege escalation: User A can access User B's data
- Vertical privilege escalation: Regular user can perform admin actions
- GraphQL missing auth: Resolvers without user context validation

**Example vulnerable code:**
```javascript
// ❌ VULNERABLE - No ownership check
app.get('/api/documents/:id', (req, res) => {
  const doc = db.documents.findById(req.params.id);
  res.json(doc);  // Any user can access any document!
});

// ✅ SECURE - Ownership validated
app.get('/api/documents/:id', (req, res) => {
  const doc = db.documents.findById(req.params.id);
  if (doc.userId !== req.user.id) {
    return res.status(403).json({error: 'Forbidden'});
  }
  res.json(doc);
});
```

---

## Cryptography

Search for cryptographic operations and potential weaknesses:

```bash
# Crypto patterns
grep -ri "crypto\|cipher\|encrypt\|decrypt\|hash" .
grep -ri "MD5\|SHA1\|DES\|RC4\|Math.random()" .
grep -ri "Random()\|SecureRandom" .
```

**Look for:**
- Weak algorithms: `MD5`, `SHA1`, `DES`, `RC4`
- Weak randomness: `Math.random()` for security purposes
- Hardcoded keys: `const key = "0123456789abcdef"`
- Missing salt: `hash(password)` without salt
- ECB mode: `cipher = AES.new(key, AES.MODE_ECB)`

---

## Network Requests

Search for HTTP requests and SSRF vulnerabilities:

```bash
# Network patterns
grep -ri "fetch\|axios\|request\|http.get\|urllib" .
grep -ri "requests.get\|curl\|wget\|webhook\|callback" .
```

**Look for:**
- User-controlled URLs: `fetch(userProvidedUrl)`
- SSRF via webhooks: No URL whitelist validation
- Internal network access: Requests to `localhost`, `127.0.0.1`, `169.254.169.254`
- Cloud metadata: `http://169.254.169.254/latest/meta-data/`

---

## Standards Reference

Use these standards as checklists:

- **OWASP Top 10 2021**
  1. Broken Access Control
  2. Cryptographic Failures
  3. Injection
  4. Insecure Design
  5. Security Misconfiguration
  6. Vulnerable and Outdated Components
  7. Identification and Authentication Failures
  8. Software and Data Integrity Failures
  9. Security Logging and Monitoring Failures
  10. Server-Side Request Forgery (SSRF)

- **OWASP API Security Top 10**
  1. Broken Object Level Authorization
  2. Broken Authentication
  3. Broken Object Property Level Authorization
  4. Unrestricted Resource Consumption
  5. Broken Function Level Authorization
  6. Unrestricted Access to Sensitive Business Flows
  7. Server Side Request Forgery
  8. Security Misconfiguration
  9. Improper Inventory Management
  10. Unsafe Consumption of APIs

- **CWE Top 25 Most Dangerous Software Weaknesses**
  - Out-of-bounds Write (CWE-787)
  - Improper Neutralization of Input (CWE-79, CWE-89)
  - Improper Authentication (CWE-287)
  - Use After Free (CWE-416)
  - Improper Restriction of Operations (CWE-269)

---

## Quick Search Commands

### Find All Security-Relevant Files

```bash
# Find authentication files
find . -type f -name "*auth*" -o -name "*login*" -o -name "*session*"

# Find crypto files
find . -type f -name "*crypt*" -o -name "*hash*" -o -name "*cipher*"

# Find API/route files
find . -type f -name "*route*" -o -name "*api*" -o -name "*endpoint*"
```

### Search for Common Vulnerabilities

```bash
# SQL Injection
grep -rn "execute.*+\|query.*+" --include="*.js" --include="*.py" .

# XSS
grep -rn "innerHTML\|dangerouslySetInnerHTML" --include="*.js" --include="*.jsx" .

# Command Injection
grep -rn "exec\|system\|shell=True" --include="*.py" --include="*.js" .

# Hardcoded Secrets
grep -rn "password.*=.*['\"].*['\"]" --include="*.js" --include="*.py" .
```

---

## See Also

- [SKILL.md](SKILL.md) - Security review protocol
- [VULNERABILITIES.md](VULNERABILITIES.md) - Vulnerability classes reference
- [DATA_LEAKS.md](DATA_LEAKS.md) - Data leak detection guide
- [CHECKLIST.md](CHECKLIST.md) - Complete security review checklist
