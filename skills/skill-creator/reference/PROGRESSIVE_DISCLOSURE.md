# Progressive Disclosure Patterns

This document provides detailed patterns and examples for implementing progressive disclosure in skills.

**For overview:** See [SKILL.md - Progressive Disclosure Design Principle](../SKILL.md#progressive-disclosure-design-principle)

---

## Contents

- [Core Concept](#core-concept)
- [Pattern 1: High-level Guide with References](#pattern-1-high-level-guide-with-references)
- [Pattern 2: Domain-specific Organization](#pattern-2-domain-specific-organization)
- [Pattern 3: Conditional Details](#pattern-3-conditional-details)
- [Important Guidelines](#important-guidelines)

---

## Core Concept

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words, <500 lines preferred)
3. **Bundled resources** - As needed by Claude (Unlimited because scripts can be executed without reading into context window)

**Key principle:** When a skill supports multiple variations, frameworks, or options, keep only the core workflow and selection guidance in SKILL.md. Move variant-specific details (patterns, examples, configuration) into separate reference files.

---

## Pattern 1: High-level Guide with References

Keep the essential workflow in SKILL.md, reference detailed guides for advanced features.

**Example: PDF Processing Skill**

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:

\`\`\`python
import pdfplumber
with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
\`\`\`

## Advanced features

- **Form filling**: See [FORMS.md](FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
```

**Result:** Claude loads FORMS.md, REFERENCE.md, or EXAMPLES.md only when the user needs those specific features.

**Benefits:**
- SKILL.md remains focused on common use cases
- Advanced users get full documentation when needed
- Context window not bloated with rarely-used information

---

## Pattern 2: Domain-specific Organization

For skills with multiple domains or frameworks, organize content by domain to avoid loading irrelevant context.

### By Business Domain

**Example: BigQuery Data Skill**

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

**SKILL.md structure:**

```markdown
# BigQuery Data Skill

## Domains

Our data warehouse is organized by business domain:

- **Finance**: Revenue, billing, subscriptions → See [finance.md](reference/finance.md)
- **Sales**: Opportunities, pipeline, CRM data → See [sales.md](reference/sales.md)
- **Product**: API usage, features, adoption → See [product.md](reference/product.md)
- **Marketing**: Campaigns, attribution, funnel → See [marketing.md](reference/marketing.md)

## Basic queries

[Common query patterns that work across all domains]
```

**Result:** When a user asks about sales metrics, Claude only reads sales.md. Finance, product, and marketing schemas stay out of context.

### By Framework or Platform

**Example: Cloud Deployment Skill**

```
cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── reference/
    ├── aws.md (AWS deployment patterns)
    ├── gcp.md (GCP deployment patterns)
    └── azure.md (Azure deployment patterns)
```

**SKILL.md structure:**

```markdown
# Cloud Deploy

## Workflow

1. Choose cloud provider (AWS, GCP, or Azure)
2. Configure environment variables
3. Deploy application
4. Verify deployment

## Provider-specific guides

- **AWS**: See [aws.md](reference/aws.md) for AWS deployment patterns
- **GCP**: See [gcp.md](reference/gcp.md) for GCP deployment patterns
- **Azure**: See [azure.md](reference/azure.md) for Azure deployment patterns

## Common tasks

[Tasks that work across all providers]
```

**Result:** When the user chooses AWS, Claude only reads aws.md. GCP and Azure patterns stay out of context.

**Benefits:**
- Dramatically reduces context usage for multi-domain/multi-framework skills
- Each reference file can be comprehensive without bloating SKILL.md
- Easy to add new domains/frameworks by adding new reference files

---

## Pattern 3: Conditional Details

Show basic functionality in SKILL.md, link to advanced content only when users need it.

**Example: DOCX Processing Skill**

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

**Result:** Claude reads REDLINING.md or OOXML.md only when the user explicitly asks about tracked changes or OOXML internals.

**When to use:**
- Advanced features that only 10-20% of users need
- Complex technical details that require deep understanding
- Alternative approaches or edge cases

**Benefits:**
- Most users get a simple, focused skill experience
- Power users can access deep details when needed
- SKILL.md stays lean and approachable

---

## Important Guidelines

### Keep References One Level Deep

❌ **Bad: Nested references**

```
SKILL.md references → intermediate.md references → detail.md
```

This creates a fragile chain where Claude must load multiple files sequentially.

✅ **Good: Flat reference structure**

```
SKILL.md references → {domain1.md, domain2.md, domain3.md, advanced.md}
```

All reference files link directly from SKILL.md. Claude loads exactly what it needs with one reference jump.

### Structure Longer Reference Files

For reference files longer than 100 lines, include a table of contents at the top so Claude can see the full scope when previewing.

**Example:**

```markdown
# AWS Deployment Patterns

## Contents

- [EC2 Deployment](#ec2-deployment)
- [ECS Deployment](#ecs-deployment)
- [Lambda Deployment](#lambda-deployment)
- [S3 Static Hosting](#s3-static-hosting)

---

## EC2 Deployment

[Detailed EC2 deployment instructions...]

## ECS Deployment

[Detailed ECS deployment instructions...]
```

**Benefits:**
- Claude can quickly scan TOC to find relevant section
- Users understand full scope of reference file
- Easier to navigate and maintain

### Avoid Duplication Between SKILL.md and References

Information should live in **one place only**—either in SKILL.md or in a reference file, never both.

❌ **Bad: Content duplicated**

```markdown
# SKILL.md
## Authentication
OAuth2 requires client_id and client_secret. Set these in .env...
[200 lines of OAuth details]

# reference/AUTH.md
## OAuth2
OAuth2 requires client_id and client_secret. Set these in .env...
[Same 200 lines repeated]
```

✅ **Good: Single source of truth**

```markdown
# SKILL.md
## Authentication
For OAuth2 setup and configuration, see [AUTH.md](reference/AUTH.md).

# reference/AUTH.md
## OAuth2
OAuth2 requires client_id and client_secret. Set these in .env...
[Complete 200-line guide]
```

**Prefer reference files for:**
- Detailed schemas and data models
- Comprehensive API documentation
- Multi-step configuration procedures
- Domain-specific knowledge
- Examples and code samples

**Keep in SKILL.md only:**
- Essential workflow steps
- When to use each approach
- Quick-start examples
- Navigation to reference files

---

## Examples in Practice

### Before Progressive Disclosure

```markdown
# BigQuery Skill (SKILL.md - 2000 lines)

## Finance Schemas
[300 lines of finance tables, columns, relationships]

## Sales Schemas
[300 lines of sales tables, columns, relationships]

## Product Schemas
[300 lines of product tables, columns, relationships]

## Marketing Schemas
[300 lines of marketing tables, columns, relationships]

[More content...]
```

**Problems:**
- 2000 lines always loaded when skill triggers
- Most content irrelevant to any single query
- Difficult to maintain and navigate
- Wastes context window

### After Progressive Disclosure

```markdown
# BigQuery Skill (SKILL.md - 200 lines)

## Domains

- **Finance**: See [finance.md](reference/finance.md)
- **Sales**: See [sales.md](reference/sales.md)
- **Product**: See [product.md](reference/product.md)
- **Marketing**: See [marketing.md](reference/marketing.md)

## Quick start
[Essential query patterns]
```

**Benefits:**
- 200 lines in SKILL.md (10x reduction)
- Claude loads finance.md (300 lines) ONLY when user asks about revenue
- Context usage: 200 + 300 = 500 lines instead of 2000 lines
- 75% context savings

---

## Summary

**Progressive disclosure principle:** Start with the minimum context needed, load more only when required.

**Three patterns:**
1. **High-level guide**: Quick start in SKILL.md, detailed guides in references
2. **Domain-specific**: Organize by domain/framework, load only relevant domain
3. **Conditional details**: Basic functionality in SKILL.md, advanced features in references

**Key guidelines:**
- Keep references one level deep from SKILL.md
- Structure longer files with table of contents
- Avoid duplication between SKILL.md and references
- Prefer references for detailed content, SKILL.md for workflow

**Target:** Keep SKILL.md under 500 lines; detailed content in reference files.
