# Parallel Execution & Subagents

## Parallel Execution Groups

**CRITICAL:** The following skill groups can and SHOULD run as parallel subagents to maximize efficiency. Launch all subagents in a single message using multiple Task tool calls.

### Group 1: Validation (Phase 5)

These skills are independent and should run as **parallel subagents**:

| Skill                         | Subagent Type     | Why Parallel                                  |
| ----------------------------- | ----------------- | --------------------------------------------- |
| **code-reviewer**             | `general-purpose` | Reviews correctness/readability independently |
| **security-reviewer**         | `general-purpose` | Reviews security independently                |
| **testing** (run suite)       | `Bash`            | Test execution is independent                 |
| **ci-cd** (lint/format/build) | `Bash`            | Lint, format, and build are independent       |

**Example parallel launch:**

```
Task(subagent_type="general-purpose", prompt="Run code-reviewer skill on changed files...")
Task(subagent_type="general-purpose", prompt="Run security-reviewer skill on changed files...")
Task(subagent_type="Bash", prompt="Run test suite: npm test")
Task(subagent_type="Bash", prompt="Run formatter and linter and build: npm run format && npm run lint && npm run build")
```

### Group 2: Exploration (Phase 1)

When exploring the codebase, launch **parallel Explore subagents**:

| Task                    | Subagent Type | Why Parallel       |
| ----------------------- | ------------- | ------------------ |
| Find affected files     | `Explore`     | Independent search |
| Understand architecture | `Explore`     | Independent search |
| Check existing patterns | `Explore`     | Independent search |
| Review git history      | `Bash`        | Independent lookup |

### Group 3: Test Writing (Phase 3)

When writing tests for multiple components:

| Task                             | Subagent Type     | Why Parallel |
| -------------------------------- | ----------------- | ------------ |
| Write unit tests for component A | `general-purpose` | Independent  |
| Write unit tests for component B | `general-purpose` | Independent  |
| Write integration tests          | `general-purpose` | Independent  |
| Run existing test suite          | `Bash`            | Independent  |

### Group 4: Documentation (Phase 8)

After implementation, documentation tasks can parallelize:

| Task                  | Subagent Type     | Why Parallel |
| --------------------- | ----------------- | ------------ |
| Update README         | `general-purpose` | Independent  |
| Write/update API docs | `general-purpose` | Independent  |
| Write ADR (if needed) | `general-purpose` | Independent  |

### Sequential Skills (Do NOT Parallelize)

These skills depend on previous results and must run **sequentially**:

- **debugging** - requires investigation results before fix
- **refactoring** - requires understanding before changing
- **dependencies** - requires conflict analysis before resolution
- **performance** - requires profiling before optimization
- **git-commits** - requires all changes complete before commit

### Cross-Skill Delegation Pattern

When one skill needs to invoke another during execution:

1. **Read the target skill** - `Read skills/<skill-name>/SKILL.md`
2. **Follow its protocol** - Execute the target skill's protocol steps
3. **Return to the calling skill** - Continue where you left off
4. **Document the delegation** - Note in the summary which skills were invoked and why

**Example:** Code-reviewer finds a security issue → reads `skills/security-reviewer/SKILL.md` → follows security review protocol → returns findings to code review output.

---

## Subagent Types & Capabilities

| Agent Type          | Best For                                               | Triggers                                                     |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Explore**         | Code navigation, pattern discovery, codebase structure | Finding files, understanding architecture, locating patterns |
| **Bash**            | Git operations, builds, test runs, command execution   | Build, test, commit, push operations                         |
| **General-purpose** | Complex analysis, research, multi-step tasks           | Writing code, designing solutions, investigating issues      |
| **RLM**             | Large codebases (100+ files), map-reduce tasks         | Parallel file analysis, cross-system changes                 |
| **Plan**            | Design and architecture planning                       | Designing implementation approach                            |

### Parallel Execution Patterns

**Pattern 1: Explore + Write in Parallel**

```
- Explore agent: Scan for existing test patterns
- General-purpose agent: Write new tests
- Results: Consolidate findings and update tests
```

**Pattern 2: Build + Test + Validation Parallel**

```
- Bash agent: Run build command
- Bash agent: Run test suite
- General-purpose agent: Code review
- Results: Consolidate status and fix failures
```

**Pattern 3: RLM Map-Reduce**

```
- RLM: Parallel analysis of 100+ files
- Multiple agents: Process different subsystems
- Consolidate: Merge results and implement
```

### When to Use Multiple Subagents

Launch multiple subagents in parallel when:

- Tasks are independent (one doesn't depend on another's result)
- Same overall phase (e.g., multiple Test subtasks in Phase 4)
- Time savings justify context overhead
- Tasks are naturally divisible

---

## RLM Integration for Large Codebases

When working with large repositories (100+ files):

1. **Use RLM Skill:** Use the RLM skill for parallel exploration when the codebase has 100+ files
2. **Map-Reduce Pattern:** Break complex tasks into parallel subtasks:
   - Map: Parallel file search and analysis by multiple agents
   - Reduce: Consolidate findings and implement
3. **Context Efficiency:** RLM prevents context overflow in large projects
4. **Dependency Analysis:** Use RLM to understand file relationships before editing

**When to activate RLM:**

- Codebase has 100+ files
- Task touches multiple subsystems
- Need to understand cross-file dependencies
- Search space is too large for sequential exploration

**Parallel Agent Strategy with RLM:**

- RLM coordinates parallel subagents for different code sections
- Each subagent analyzes its assigned portion
- Results consolidated for coherent implementation
- Prevents context rot on massive projects
