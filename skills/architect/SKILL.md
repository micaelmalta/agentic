---
name: architect
description: "Write technical specifications (tech specs): goals, scope, architecture, components, APIs, data models, database migrations, feature flags, risks, and rollout. Use when the user asks for a tech spec, technical design, architecture doc, design document, or when planning database changes or rollout strategies."
triggers:
  - "/architect"
  - "tech spec"
  - "technical spec"
  - "technical design"
  - "architecture doc"
  - "design document"
  - "write a tech spec"
  - "system design"
  - "design the solution"
  - "database migration"
  - "schema change"
  - "feature flag"
  - "rollout strategy"
---

# Architect Skill

## Core Philosophy

**"Spec before build: align stakeholders and unblock implementation."**

A tech spec captures what will be built, how it fits together, and what the team will deliver. It is written before or alongside implementation and is the single reference for scope and design.

---

## Protocol

### 1. Gather Context

- **Goals**: Why are we doing this? Success criteria and non-goals.
- **Constraints**: Timeline, team, existing systems, compliance, performance.
- **Current state**: Relevant parts of the codebase or system (use RLM or exploration when the codebase is large).

### 2. Use the Tech Proposal Template

**Always use the template** when writing a tech spec. Read it first, then fill it in:

- **Template path**: `skills/architect/tech_proposal_template.md`
- **When**: At the start of writing a tech spec, read the template and use its structure and section headings.
- **How**: Copy the template into the output doc (or create the output from it), then fill each section with the proposal content. Omit sections that don't apply only if the project doesn't use them; otherwise leave placeholders or "TBD" with a short note.

The template covers: metadata (PRD link, priority, timing, owner, status), architecture considerations and expected flow, API changes (new/edit endpoints, OpenAPI, Spectral), data models, domain architecture, additional considerations (actors, permissions, unknowns, risks), and estimation & implementation plan (effort, teams, rollout, metrics, impact). Align your tech spec with these sections; add or rename subsections only to match project conventions.

### 3. Database Migrations

When the feature involves schema changes, include a **Database Migration Plan**:

| Aspect                | Document                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Schema changes**    | New tables, columns, indexes, constraints; use migration tool syntax (e.g., Prisma, Alembic, Flyway, goose) |
| **Data migrations**   | Backfills, transformations, default values for existing rows                                                |
| **Rollback strategy** | How to reverse the migration if deployment fails; what data loss is acceptable                              |
| **Deployment order**  | Whether migration runs before, during, or after code deploy; zero-downtime considerations                   |
| **Testing**           | How to test migration locally and in staging; seed data requirements                                        |

**Zero-downtime migrations**: For high-availability systems, plan migrations in phases:

1. Add new column/table (nullable or with default)
2. Deploy code that writes to both old and new
3. Backfill existing data
4. Deploy code that reads from new
5. Remove old column/table (separate migration)

### 4. Feature Flags & Rollout Strategy

When gradual rollout is needed, include a **Feature Flag Plan**:

| Aspect             | Document                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| **Flag name**      | Descriptive, consistent with project naming (e.g., `enable_new_checkout_flow`) |
| **Flag type**      | Boolean, percentage, user segment, or variant (A/B)                            |
| **Default state**  | Off in production initially; on in dev/staging                                 |
| **Rollout stages** | Internal → beta users → percentage ramp → 100%                                 |
| **Kill switch**    | How to disable quickly if issues arise                                         |
| **Cleanup**        | When and how to remove the flag after full rollout                             |

**Flag placement**: Identify where in code the flag check goes (API layer, service layer, UI) and what behavior changes per state.

### 5. Output Location

- **Default**: `docs/tech-specs/YYYY-MM-DD-<feature-or-epic>.md` or `context/tech-specs/`.
- Follow project convention if one exists (e.g. Notion, Confluence, or a different path).
- **Structure**: Use the sections and headings from `skills/architect/tech_proposal_template.md` in the output document.

### 6. Commands

No mandatory commands. Use **RLM** or codebase search when you need to describe current architecture or affected components. Use **para** `/plan` for the implementation plan; the tech spec is the design document the plan implements.

### 7. Relationship to Other Skills

- **Tech spec** (architect): What we're building and how it fits together; audience is eng + stakeholders.
- **Implementation plan** (para `/plan`): Ordered steps and tasks to build it; audience is eng.
- **ADR** (documentation): Single decision and rationale; referenced from tech spec when relevant.

---

## Checklist

- [ ] Goals and non-goals are explicit.
- [ ] Components and boundaries are clear; APIs/contracts are specified.
- [ ] Data model and key flows are described.
- [ ] Database migrations planned with rollback strategy (if schema changes).
- [ ] Feature flag strategy defined (if gradual rollout needed).
- [ ] Risks and rollout are addressed.
- [ ] Open questions are listed so they can be resolved before or during implementation.
