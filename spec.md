# Agentic Dashboard

## Overview

A web-based dashboard for orchestrating and monitoring an agentic development system. The system coordinates multiple Claude Code agents working in parallel on Jira issues, following a structured PARA workflow (Plan → Review → Execute → Summarize → Archive). The dashboard provides real-time visibility into agent activity, project status, and a conversational interface to command the system.

## Goals

- **Visibility** — See what every agent is doing at a glance
- **Full control** — Every action is performable from the UI: start/stop agents, assign work, approve plans, trigger transitions, configure the system
- **Autonomy** — Toggle between fully autonomous operation (agents pick up and complete work end-to-end) and manual mode (human approves each step)
- **Integration** — Bidirectional background sync with Jira and Datadog
- **Collaboration** — Chat with the orchestrator to steer work, ask questions, and issue commands

## Layout

Three-panel layout with a global toolbar, resizable with drag handles.

```
┌─────────────────────────────────────────────────────────┐
│  [+ Agent] [Stop All]  Project: [▾ PROJ]  🟢 Autonomous │  ← Toolbar
├──────────────┬─────────────────────┬────────────────────┤
│              │                     │                    │
│   Agents     │   Kanban Board      │   Chat             │
│   (Left)     │   (Center)          │   (Right)          │
│              │                     │                    │
├──────────────┴─────────────────────┴────────────────────┤
│  ▲ 2 plans awaiting review  ·  ▲ 1 Datadog alert       │  ← Status Bar
└─────────────────────────────────────────────────────────┘
```

---

## Global Toolbar

Persistent top bar for system-wide controls.

| Control | Description |
|---------|-------------|
| **+ Agent** | Spawn a new agent (idle, ready to accept work) |
| **Stop All** | Gracefully stop all running agents |
| **Project selector** | Switch Jira project / board |
| **Sprint selector** | Filter Kanban to a specific sprint |
| **Autonomous toggle** | Switch between autonomous and manual mode (see below) |
| **Settings** | Jira credentials, Datadog config, agent pool size, sync intervals |

---

## Autonomous Mode

A global toggle that controls how much the system does without human intervention.

### Autonomous ON (🟢)

- Agents **automatically pick up** the highest-priority unassigned issue from the `To Do` column
- When an agent finishes one issue, it immediately picks up the next
- Plans are **auto-approved** — agents proceed from Plan → Execute without waiting
- Jira transitions happen automatically as agents progress through workflow phases
- Errors still surface as notifications, but agents retry before escalating

### Autonomous OFF (🔴 Manual)

- Agents only work on issues **explicitly assigned** by the user
- Every plan **requires human review and approval** before execution begins (see Plan Review)
- Agents pause at the end of each workflow phase, waiting for the user to advance them
- Jira transitions require explicit user action (drag-and-drop or button click)

### Per-issue override

Even in autonomous mode, individual issues can be pinned to manual mode (e.g., high-risk changes). A 🔒 icon on the Kanban card indicates manual-only.

---

## Agent Pool Management

Controls how many agents can run concurrently and how the pool scales.

### Concurrency limits

| Setting | Default | Description |
|---------|---------|-------------|
| **Max concurrent agents** | 4 | Hard ceiling on simultaneous running agents. "+" Agent" button is disabled when at max. Configurable in Settings → Agents. |
| **Min idle agents** | 1 | Pool keeps N agents spawned and idle for fast assignment. Set to 0 to only spawn on demand. |
| **Auto-scale** | ON | In autonomous mode, automatically spawn agents (up to max) when unassigned issues exist in To Do. |

### How it works

1. **Manual mode**: User spawns agents with "+ Agent". Cannot exceed max. Each agent stays idle until explicitly assigned.
2. **Autonomous mode with auto-scale ON**: The orchestrator monitors the To Do column. If there are unassigned issues and the active agent count is below max, it spawns new agents automatically. When the queue empties, surplus idle agents beyond `min idle` are terminated after a configurable timeout (default: 5 minutes).
3. **Autonomous mode with auto-scale OFF**: Agents are spawned manually but pick up work automatically. Pool size stays fixed.

### Resource awareness

- Each Claude Code agent is a separate OS process consuming memory and API tokens
- The backend tracks system resource usage (CPU, memory) and can pause spawning if resources are constrained
- Token budget limits (Settings → Agents) apply per-agent and globally — agents pause when budgets are hit
- The toolbar shows current pool status: `3/4 agents` (running/max)

### Pool status in toolbar

```
[+ Agent]  3/4 agents  [■ Stop All]
```

- `3/4` = 3 running out of 4 max
- When at max (4/4), the "+ Agent" button shows as disabled with tooltip: "Max agents reached (4). Increase in Settings."
- When auto-scale is active and spawning, shows: `3/4 agents (scaling...)`

---

## Left Panel — Agent Monitor

Shows all Claude Code agent processes running in parallel.

### Each agent card displays

| Field | Description |
|-------|-------------|
| Agent ID | Short identifier (e.g., `agent-01`) |
| Status | `running` · `idle` · `error` · `waiting` |
| Current Issue | Jira key being worked on (e.g., `PROJ-42`) |
| Skill | Active skill (`developer`, `testing`, `debugging`, etc.) |
| Workflow Phase | Current phase (1–8) from the workflow skill |
| Duration | Elapsed time on current task |
| Progress | Brief description of current step |

### Interactions

- **Click** an agent card → expand to show live log output (streaming)
- **Stop** button → terminate the agent process
- **Restart** button → restart with the same task
- **Reassign** → pick a different Jira issue for the agent
- **Bulk actions** — start N new agents, stop all, filter by status

### Agent execution model

Each agent runs the **`/workflow` skill** end-to-end. When assigned a Jira issue, the backend spawns a Claude Code CLI process and instructs it to execute `/workflow` with the issue key. The workflow skill handles the full 8-phase lifecycle:

```
Phase 1: Plan      → Read issue, create implementation plan (PARA /plan)
Phase 2: Branch    → Create feature branch from main
Phase 3: Execute   → Implement using TDD via developer skill (/dev)
Phase 4: Test      → Run test suite via phase-testing-agent (background)
Phase 5: Validate  → Lint, format, build, code review, security review via phase-validation-agent
Phase 6: Commit    → Stage and commit via git-commits skill
Phase 7: PR        → Create GitHub PR + Jira transition via phase-pr-agent
Phase 8: Summarize → Document outcomes via PARA /summarize
```

The dashboard maps each phase to agent status updates via the WebSocket connection.

### Agent lifecycle

```
idle → assigned (Jira issue) → /workflow running (phases 1-8) → done → idle
                                          ↘ error → waiting for user input
```

### Skill availability

Agents have access to the full skill set during `/workflow` execution. The workflow skill internally delegates to specialized skills:

| Phase | Delegated skill(s) |
|-------|-------------------|
| Plan | `para` (/plan), `architect` (if complex) |
| Execute | `developer` (TDD), `refactoring` (if needed) |
| Test | `testing` (via phase-testing-agent) |
| Validate | `code-reviewer`, `security-reviewer` (via phase-validation-agent) |
| Commit | `git-commits` |
| Debug (on error) | `debugging` |

Agents spawned for Datadog error investigation use the `debugging` skill directly instead of the full workflow.

---

## Center Panel — Kanban Board

A Kanban board backed by Jira, showing issues as cards organized by status columns.

### Data source

- Connects to Jira via the Atlassian MCP integration
- Fetches issues from a configurable project and board
- Columns map to Jira statuses (e.g., `To Do`, `In Progress`, `In Code Review`, `Done`)

### Issue cards display

| Field | Description |
|-------|-------------|
| Key | Jira issue key (e.g., `PROJ-42`) |
| Summary | Issue title |
| Assignee | Avatar + name |
| Priority | Icon (Critical / High / Medium / Low) |
| Agent | Badge showing which agent is working on it (if any) |
| Labels | Colored chips |

### Interactions

- **Drag-and-drop** cards between columns → triggers Jira status transition
- **Click** a card → slide-over detail panel with full description, comments, and linked agent activity
- **Assign to agent** — right-click or button to assign an idle agent to work on the issue
- **Filters** — sprint, assignee, priority, label, has-agent / no-agent
- **Refresh** — manual + auto-refresh on interval (configurable, default 30s)

### Autonomous mode behavior

- **Autonomous ON** — `To Do` cards with no agent badge are automatically claimed by idle agents (highest priority first). Cards move across columns as agents progress.
- **Autonomous OFF** — cards stay in place until the user explicitly assigns an agent or drags the card.
- Per-issue 🔒 override is accessible from the card context menu.

### Background Jira Sync

Continuous bidirectional sync keeps the board in sync without manual refresh.

| Direction | What syncs | Trigger |
|-----------|-----------|---------|
| Jira → Dashboard | New issues, status changes, comment updates, priority changes | Jira webhooks (preferred) or polling every 15s |
| Dashboard → Jira | Status transitions (drag-and-drop or agent-driven), comment additions, assignee changes | Immediate on user/agent action |

- **Conflict resolution** — if both sides changed the same field, Jira wins and the dashboard shows a conflict notification in chat
- **Offline tolerance** — if Jira is unreachable, queue changes locally and replay when reconnected
- **Webhook setup** — backend registers a Jira webhook on first connect; falls back to polling if webhooks aren't available

---

## Right Panel — Chat

A conversational interface to the agentic system orchestrator.

### Capabilities

- Issue PARA commands: `/plan`, `/execute`, `/summarize`, `/archive`, `/status`
- Ask questions about agent status ("What is agent-03 doing?")
- Request actions ("Assign PROJ-42 to a new agent", "Stop all agents working on PROJ-10")
- Get summaries ("Show me what was accomplished today")
- View system notifications (agent completions, errors, PR creations)

### Message types

| Type | Description |
|------|-------------|
| User message | Text input from the operator |
| System response | Orchestrator replies, command output |
| Notification | Agent completed, error occurred, PR created |
| Action confirmation | "Agent-02 assigned to PROJ-42. Proceed?" |

### Interactions

- Standard chat input with markdown support
- Command autocomplete for `/` commands
- Inline links to Jira issues (clickable → highlights card in center panel)
- Inline links to agents (clickable → highlights agent in left panel)
- Notification badge when chat is not focused

---

## Plan Review

When an agent completes the Plan phase (PARA workflow step 1), the plan needs approval before execution begins. The dashboard provides a dedicated review experience.

### How it surfaces

- **Status bar** shows a badge: "▲ 2 plans awaiting review"
- **Agent card** shows status `waiting` with a "Review Plan" button
- **Chat panel** receives a notification with a preview and inline approve/reject buttons
- **Kanban card** shows a 📋 icon indicating a pending plan

### Review panel

Clicking "Review Plan" opens a slide-over (or modal) with:

| Section | Content |
|---------|---------|
| **Issue context** | Jira key, summary, description, acceptance criteria |
| **Plan** | Full plan markdown (objectives, approach, affected files, implementation steps) |
| **Risk assessment** | Identified risks, edge cases, and unknowns |
| **Estimated scope** | Files to change, new files, test coverage plan |
| **Agent** | Which agent produced the plan |

### Actions

| Action | Effect |
|--------|--------|
| **Approve** | Agent proceeds to Execute phase |
| **Approve with comments** | Agent proceeds but incorporates feedback |
| **Request changes** | Agent revises the plan (returns to Plan phase with feedback) |
| **Reject** | Agent stops; issue returns to unassigned |
| **Reassign** | Send the plan to a different agent for re-planning |

### In autonomous mode

Plans are auto-approved. The review panel is still accessible (from agent card or chat history) for post-hoc inspection, but agents don't block.

---

## Datadog Log Monitor

A background service that continuously watches Datadog for log events matching user-configured queries and surfaces them in the dashboard.

### How it works

- Backend polls Datadog Logs API on a configurable interval (default: 60s)
- Executes one or more **log watch queries** defined by the user (see Log Watch Configuration below)
- New matching log entries are matched against recent agent activity where possible (e.g., error appeared after agent-03 deployed a change)

### Log Watch Configuration

Users define **log watches** — saved Datadog log queries that the backend monitors continuously. Each watch is an independent query with its own filters and alert rules.

#### Watch definition

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | Yes | Human-readable label (e.g., "Auth Service Errors", "Payment Timeouts") |
| **Query** | Yes | Datadog log query string (same syntax as Datadog Log Explorer) |
| **Environment** | Yes | Target environment(s): `production`, `staging`, `all` |
| **Severity filter** | No | Minimum level to surface: `error` (default), `warning`, `info`, `debug` |
| **Service filter** | No | Comma-separated service names to scope the query (e.g., `auth-service, payment-service`) |
| **Tags** | No | Additional Datadog tags to filter by (e.g., `team:backend`, `version:2.x`) |
| **Poll interval** | No | Override default interval for this watch (e.g., 15s for critical, 120s for low-priority) |
| **Alert threshold** | No | Number of matching logs in the poll window before surfacing (default: 1) |
| **Enabled** | Yes | Toggle watch on/off without deleting |

#### Query syntax examples

```
# Errors in auth service (production)
service:auth-service status:error env:production

# Payment processing timeouts
service:payment-service @duration:>5000 status:error

# Any 5xx responses across all services
@http.status_code:>=500

# Specific error message pattern
"Connection refused" service:api-gateway

# High memory usage warnings
source:system @memory.usage:>90 status:warn

# Errors tagged to the backend team
team:backend status:error -service:cron-jobs

# Deployment-related logs
@event.type:deployment env:production
```

#### Preset watches

The dashboard ships with sensible defaults that users can customize or remove:

| Preset | Query | Interval |
|--------|-------|----------|
| All Errors | `status:error` | 60s |
| Critical (5xx) | `@http.status_code:>=500` | 30s |
| Slow Requests | `@duration:>5000` | 120s |
| Security Events | `@evt.category:security` | 30s |

Presets are created during onboarding (Step 4: Datadog) and can be modified later in Settings.

#### Management UI

Log watches are managed from **Settings → Datadog → Log Watches** tab:

```
┌──────────────────────────────────────────────────────────────┐
│ Log Watches                                    [+ Add Watch] │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ● Auth Service Errors                              [Edit]  │
│    service:auth-service status:error env:production          │
│    Every 30s · Errors only · 12 matches today               │
│                                                              │
│  ● Payment Timeouts                                 [Edit]  │
│    service:payment-service @duration:>5000                   │
│    Every 60s · Errors only · 3 matches today                │
│                                                              │
│  ● All 5xx Responses                                [Edit]  │
│    @http.status_code:>=500                                   │
│    Every 30s · Errors only · 8 matches today                │
│                                                              │
│  ○ Security Events (paused)                         [Edit]  │
│    @evt.category:security                                    │
│    Every 30s · All levels · Paused                           │
│                                                              │
│──────────────────────────────────────────────────────────────│
│ Total watches: 4 (3 active) · Next poll in 12s              │
└──────────────────────────────────────────────────────────────┘
● = active   ○ = paused
```

#### Add/Edit Watch form

```
┌──────────────────────────────────────────────┐
│ Edit Log Watch                          [✕]  │
│──────────────────────────────────────────────│
│                                              │
│ Name:         [Auth Service Errors       ]   │
│                                              │
│ Query:        [service:auth-service      ]   │
│               [status:error env:production]  │
│               (Datadog log query syntax)     │
│                                              │
│ Environment:  [▾ production          ]       │
│ Services:     [auth-service              ]   │
│ Tags:         [team:backend              ]   │
│                                              │
│ Severity:     [▾ error (default)     ]       │
│ Poll interval:[▾ 30 seconds          ]       │
│ Alert after:  [▾ 1 match             ]       │
│                                              │
│ [Test Query]  → "Found 3 matching logs"      │
│                                              │
│ ☑ Enabled                                    │
│                                              │
│──────────────────────────────────────────────│
│              [Delete]  [Cancel]  [Save]       │
└──────────────────────────────────────────────┘
```

- **Test Query**: runs the query against the last 15 minutes and shows match count + preview of first 3 results
- **Delete**: removes the watch (with confirmation)
- **Validation**: query syntax is validated before save (Datadog API dry-run)

#### How watches feed the dashboard

Each poll cycle, the backend runs all active watches in parallel. New log entries (not previously seen) are:

1. Deduplicated by log ID
2. Enriched with the watch name and severity
3. Run through the correlation engine (match against recent agent file changes)
4. Pushed to the frontend via WebSocket
5. Surfaced in: status bar badge, chat notification, notification center, and correlated agent/kanban cards

### What surfaces in the UI

| Location | What shows |
|----------|-----------|
| **Status bar** | Alert badge: "▲ 1 Datadog alert" with severity color (red = error, yellow = warning) |
| **Chat panel** | Notification with error summary, stack trace snippet, and link to Datadog |
| **Agent card** | If an error correlates to a recent agent commit, the agent card shows a ⚠️ warning |
| **Kanban card** | If an error correlates to an issue, the card gets a 🔴 badge |

### Actions from the UI

- **View details** — expand to see full log entry, stack trace, and Datadog deep link
- **Create Jira issue** — one-click to create a bug from the error (pre-filled with error details, stack trace, and environment)
- **Assign to agent** — spawn or assign an agent to investigate and fix the error using the debugging skill
- **Snooze** — suppress the alert for a configurable duration
- **Mark resolved** — dismiss the alert (does not affect Datadog)

### Correlation logic

The backend attempts to correlate Datadog errors with agent activity:

1. Extract service/file names from the error stack trace
2. Match against files recently modified by agents (from git history)
3. If a match is found, link the error to the agent and Jira issue
4. Confidence level shown: `high` (exact file match) / `medium` (same service) / `low` (time-based only)

---

## Cross-Panel Interactions

The panels are connected, not isolated.

| Action | Effect |
|--------|--------|
| Click Jira card (center) | Left panel highlights assigned agent; right panel shows issue context |
| Click agent (left) | Center panel highlights the issue being worked on |
| Chat mentions issue key | Center panel scrolls to and highlights that card |
| Chat mentions agent ID | Left panel scrolls to and highlights that agent |
| Agent completes work | Jira card moves to next column; notification in chat |
| Agent hits error | Agent card turns red; notification in chat with error details |
| Agent plan ready | Status bar badge increments; agent card shows "Review Plan"; chat notification |
| Datadog alert fires | Status bar badge; chat notification; correlated agent/card get warning icons |
| Toggle autonomous mode | All idle agents start picking up work (ON) or pause after current task (OFF) |
| Approve plan (any panel) | Agent resumes; plan review badge decrements |

---

## Keyboard Shortcuts

Power-user shortcuts for fast navigation and control. Displayed in a help overlay (`?`).

| Shortcut | Action |
|----------|--------|
| `1` / `2` / `3` | Focus left / center / right panel |
| `Cmd+K` / `Ctrl+K` | Open command palette (search issues, agents, commands) |
| `Cmd+Enter` | Send chat message |
| `Cmd+Shift+A` | Spawn new agent |
| `Cmd+Shift+S` | Stop all agents (requires confirmation) |
| `Cmd+Shift+T` | Toggle autonomous mode |
| `Cmd+Z` | Undo last action |
| `Cmd+Shift+Z` | Redo last undone action |
| `Escape` | Close slide-over / modal / autocomplete |
| `R` | Refresh Kanban board (when center panel focused) |
| `N` | Next plan review (when plan badge > 0) |
| `?` | Show keyboard shortcuts overlay |
| `J` / `K` | Navigate between cards / agents in focused panel |
| `Enter` | Open selected card / agent detail |
| `Shift+←` / `Shift+→` | Move selected Kanban card left/right between columns |

### Command Palette

`Cmd+K` opens a centered search bar (similar to VS Code / Linear) that combines:
- **Issue search**: type issue key or title fragment → jump to card
- **Agent actions**: "stop agent-01", "assign PROJ-42"
- **Commands**: all `/` commands accessible without the chat panel
- **Navigation**: "settings", "notifications", "analytics"

Fuzzy search with keyboard navigation (arrow keys + enter). Results grouped by category.

---

## Agent Analytics

Dashboard view for tracking agent performance over time. Accessible from a toolbar icon or the command palette.

### Metrics

| Metric | Description | Visualization |
|--------|-------------|---------------|
| **Throughput** | Issues completed per day/week | Line chart (trend over time) |
| **Avg cycle time** | Mean time from assignment to PR creation | Bar chart (per agent, per issue type) |
| **Success rate** | % of issues completed without error escalation | Percentage + sparkline |
| **Phase breakdown** | Average time spent in each workflow phase (1–8) | Stacked bar chart |
| **Retry rate** | How often agents need retries (testing, validation) | Percentage per phase |
| **Active time** | Total time agents spent running vs idle | Utilization donut chart |
| **Issues in flight** | Current WIP count over time | Area chart |

### Views

- **Summary cards** at the top: total completed (today/week), avg cycle time, success rate, active agents
- **Agent comparison table**: side-by-side performance of each agent
- **Timeline**: Gantt-style view of all agent activity for the day (issue bars colored by phase)
- **Filters**: date range, agent, issue type, project

### Data source

- Derived from agent lifecycle events stored by the backend
- No external service needed — all data captured during normal operation
- Exportable as CSV for external analysis

---

## Notification Center

A dedicated notification history accessible from the toolbar, supplementing the chat panel.

### Access

- **Bell icon** in toolbar with unread count badge
- Click opens a dropdown panel (400px wide, max 500px tall, scrollable)
- Keyboard: `Cmd+Shift+N`

### Notification types

| Type | Icon | Auto-dismiss | Priority |
|------|------|-------------|----------|
| Agent completed issue | `check-circle` | No | Normal |
| Agent hit error | `alert-circle` | No | High |
| Plan awaiting review | `clipboard-check` | No | High |
| PR created | `git-pull-request` | No | Normal |
| Datadog alert | `activity` | No | High (error) / Normal (warning) |
| Jira sync conflict | `alert-triangle` | No | Normal |
| Agent auto-assigned | `user-plus` | 30s | Low |
| Jira webhook connected | `link` | 10s | Low |
| Agent spawned / stopped | `power` | 10s | Low |

### Interactions

- **Mark as read**: click or swipe right on individual notification
- **Mark all read**: button in header
- **Filter**: All / Unread / Errors / Agents / Jira / Datadog
- **Click notification**: navigates to the relevant entity (agent card, Kanban card, plan review, PR link)
- **Clear all**: removes all read notifications (unread stay)
- **Persistent**: notification history survives page refresh (stored in backend or localStorage)

### Relationship to chat

Chat remains the primary conversational interface. The notification center is a **structured, filterable log** — it captures the same events but presents them as discrete items rather than a message stream.

---

## Onboarding & Setup Wizard

First-time experience when the dashboard launches without configuration.

### Detection

Backend checks on startup:
1. Jira credentials configured? → if no, show setup
2. At least one project/board selected? → if no, show project picker
3. GitHub CLI (`gh`) available? → if no, show warning
4. Datadog credentials? → optional, skip with "Set up later"

### Wizard flow

```
Step 1: Welcome          → "Connect your tools to get started"
Step 2: Jira Connection   → Instance URL + API token + test connection
Step 3: Project & Board   → Select from available projects/boards
Step 4: GitHub            → Verify gh CLI auth status
Step 5: Datadog (optional)→ API key + app key + service filter
Step 6: Ready             → "Spawn your first agent" CTA
```

### Design

- Full-screen overlay on first launch (not modal — replaces dashboard content)
- Progress stepper at the top showing current step (1–6)
- Each step validates before allowing "Next"
- "Skip" available on optional steps (Datadog)
- Credentials stored server-side (never in frontend localStorage)
- After completion, redirects to the dashboard with a welcome chat message

### Re-entry

- Accessible any time from Settings → "Re-run setup wizard"
- Individual connections can be reconfigured from Settings tabs without re-running the full wizard

---

## Cost Tracking

Agents consume Claude API tokens. The dashboard provides visibility into spend.

### Token tracking

The backend captures per-agent, per-issue token usage:

| Dimension | Granularity |
|-----------|-------------|
| Per agent | Total input/output tokens for the agent's lifetime |
| Per issue | Total tokens spent across all agents that worked on the issue |
| Per phase | Tokens consumed during each workflow phase |
| Per session | Daily/weekly/monthly aggregation |

### UI surfaces

| Location | What shows |
|----------|-----------|
| **Agent card** | Small token counter: `~12.4k tokens` below the progress bar |
| **Analytics page** | Cost breakdown charts by agent, issue, phase, and time period |
| **Status bar** | Daily token usage: `32.1k tokens today` (click → analytics) |
| **Issue detail slide-over** | Total tokens spent on this issue across all agents |

### Budget controls

- **Daily token budget**: configurable limit; agents pause when reached (notification + chat alert)
- **Per-issue cap**: optional max tokens per issue; agent escalates to user if approaching limit
- **Cost alerts**: notification when spend exceeds configurable thresholds (50%, 80%, 100% of budget)

### Estimation

- Backend estimates cost based on model pricing (configurable $/1k tokens)
- Shows both token count and estimated USD equivalent
- Not a billing system — informational only, based on self-reported usage

---

## Desktop Notifications

Browser and OS-level notifications for critical events when the dashboard tab is not focused.

### When they fire

| Event | Desktop notification | Sound |
|-------|---------------------|-------|
| Agent error (max retries) | Yes | Alert chime |
| Critical Datadog alert | Yes | Alert chime |
| Plan awaiting review | Yes | Soft chime |
| Agent completed issue | Yes | Success chime |
| Daily budget exceeded | Yes | Alert chime |
| Jira connection lost | Yes | None |
| Agent auto-assigned | No | None |

### Implementation

- Uses the [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- Permission requested on first critical event (not on page load)
- Clicking the notification focuses the dashboard tab and navigates to the relevant entity
- **Settings**: per-event-type toggle (enable/disable), sound toggle, quiet hours (time range)
- Falls back gracefully: if permission denied, events only appear in notification center + chat

### Sound

- Optional audible alerts for critical events
- Small bundled sound files (< 10KB each)
- Volume control in settings
- Respects system "Do Not Disturb" mode

---

## Undo System

Reversible actions can be undone within a short window.

### Undoable actions

| Action | Undo behavior | Window |
|--------|---------------|--------|
| Drag card to new column | Move card back; revert Jira transition | 10s |
| Assign agent to issue | Unassign agent; return to idle | 10s |
| Stop agent | Restart agent with same task | 10s |
| Remove agent | Re-spawn agent | 10s |
| Approve plan | Revoke approval; agent pauses (if not yet started executing) | 5s |
| Reject plan | Re-open plan for review | 10s |
| Snooze Datadog alert | Un-snooze | 30s |
| Toggle autonomous mode | Toggle back | 10s |

### UX

- Undo appears as a **toast notification** at the bottom-center: `"Moved PROJ-42 to In Progress" [Undo]`
- Toast auto-dismisses after the undo window expires
- Multiple undos stack (most recent on top, max 5 visible)
- `Cmd+Z` triggers undo of the most recent undoable action
- Actions that have already propagated to external systems (Jira transition completed, PR created) show a warning: `"Jira transition already synced — undo may cause conflict"`

### Non-undoable actions

These actions are **not** reversible and require confirmation dialogs instead:
- Stop All agents
- Reject plan (with agent termination)
- Delete agent
- Clear all notifications

---

## Technical Considerations

### Frontend

- Single-page application (Vue.js 3 + Composition API)
- WebSocket connection for real-time agent status updates
- Jira data fetched via backend proxy (to avoid CORS and protect API tokens)
- Resizable panels (CSS grid or a split-pane library)
- Responsive: collapses to tabbed view on narrow screens

### Backend

- Lightweight API server that:
  - Manages agent processes (spawn, monitor, kill, scale)
  - Proxies Jira API calls (using stored credentials)
  - Receives Jira webhooks for real-time sync (falls back to polling)
  - Polls Datadog Logs API for error monitoring
  - Correlates Datadog errors with recent agent activity (git-based matching)
  - Provides WebSocket endpoint for streaming agent logs, status, and notifications
  - Handles chat messages and routes commands to the orchestrator
  - Manages plan review queue (pending approvals, feedback routing)
  - Implements autonomous mode logic (work queue, agent assignment, auto-approval)
- Agent process model: each agent is a Claude Code CLI process managed by the backend
  - On assignment, backend runs: `claude --skill /workflow --issue <JIRA_KEY>`
  - Agent pool respects max concurrent limit; queues assignments when at capacity
  - Auto-scale spawns/terminates agents based on To Do queue depth and pool settings
  - Each agent's stdout/stderr is captured and streamed to the frontend via WebSocket

### Data flow

```
┌──────────┐       WebSocket        ┌──────────────┐
│ Frontend │ ◄────────────────────► │   Backend    │
│ (Vue.js) │   REST (commands)      │   (API)      │
└──────────┘                        └──────┬───────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                  ┌─────▼───┐        ┌─────▼───┐        ┌────▼────┐
                  │ Agent 1 │        │ Agent 2 │        │ Agent N │
                  │ (Claude │        │ (Claude │        │ (Claude │
                  │  Code)  │        │  Code)  │        │  Code)  │
                  └─────────┘        └─────────┘        └─────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
   ┌─────▼───┐    ┌─────▼───┐    ┌────▼─────┐
   │  Jira   │    │ Datadog │    │  GitHub  │
   │  (API + │    │ (Logs   │    │  (API)   │
   │  hooks) │    │  API)   │    │          │
   └─────────┘    └─────────┘    └──────────┘
```

### Background services

| Service | Interval | Purpose |
|---------|----------|---------|
| Jira sync | Webhooks / 15s poll | Bidirectional issue sync |
| Datadog monitor | 60s poll | Error detection and correlation |
| Agent health | 5s | Heartbeat check, restart stalled agents |
| Plan queue | Event-driven | Route plans to review, handle approvals |

### Authentication

- Jira: OAuth or API token, stored server-side
- Dashboard access: basic auth or SSO (out of scope for MVP, localhost-only initially)

---

## MVP Scope

For the first iteration, focus on:

1. **Agent monitor** — list running agents with status, live logs, start/stop controls
2. **Kanban board** — Jira board with background sync, drag-and-drop transitions, agent badges
3. **Chat** — send commands, receive responses and notifications
4. **Autonomous toggle** — global switch with auto-assignment and auto-approval
5. **Plan review** — inline review and approve/reject from chat and agent cards
6. **Datadog alerts** — background error monitoring with notifications in status bar and chat

### Deferred to later iterations

- Per-issue autonomous override (🔒 pin to manual)
- Datadog → Jira auto-creation (one-click bug filing)
- Error-to-agent correlation (git-based matching)
- Multi-project / multi-board support
- Persistent chat history
- User authentication / SSO
- Dashboard settings / preferences panel
- Jira webhook registration (use polling for MVP)

---

## Design

### Design Artifacts (FigJam)

Interactive diagrams created in FigJam — click to view and edit:

| Diagram | Purpose | Link |
|---------|---------|------|
| Agent Lifecycle State Diagram | All agent states and transitions (idle → assigned → planning → executing → done/error) | [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/d3f57d73-4a55-4fa3-912a-0cd7cc0c23b3) |
| Autonomous Workflow Sequence | Sequence diagram showing orchestrator ↔ agent ↔ Jira ↔ GitHub interactions during autonomous work | [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/c91a24f3-cb29-4576-8ba4-85d277a75dc3) |
| Plan Review Flow | Decision flow for plan approval, rejection, revision, and reassignment | [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/b674ab04-6a5d-4127-89ef-694d16e0c181) |
| Dashboard Component Architecture | Vue.js component hierarchy — App shell, toolbar, three panels, sub-components | [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/ab9b40d9-8176-458f-a362-e66cb65dfc8e) |
| Datadog Error Monitoring Flow | Error detection, correlation with agent activity, and UI surfacing | [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/36af2804-6e0f-4104-9866-a0fc34a027df) |
| Manual vs Autonomous Mode | Side-by-side comparison of manual (human checkpoints) vs autonomous (auto-progression) | [View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/e19ea901-9590-4256-b1e7-5e66021c7f09) |

---

### Visual Language

#### Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0D1117` | App background (dark) |
| `--bg-surface` | `#161B22` | Panel backgrounds, cards |
| `--bg-elevated` | `#21262D` | Hover states, modals, dropdowns |
| `--border` | `#30363D` | Panel dividers, card borders |
| `--text-primary` | `#E6EDF3` | Primary text |
| `--text-secondary` | `#8B949E` | Labels, timestamps, metadata |
| `--text-muted` | `#484F58` | Disabled, placeholders |
| `--accent` | `#58A6FF` | Links, active states, selected items |
| `--accent-emphasis` | `#1F6FEB` | Primary buttons, active toggle |
| `--success` | `#3FB950` | Running agents, done status, passed tests |
| `--warning` | `#D29922` | Waiting states, medium-priority alerts |
| `--danger` | `#F85149` | Errors, critical alerts, stop buttons |
| `--info` | `#58A6FF` | Notifications, info badges |

Dark-first theme inspired by GitHub's dark mode. A light mode toggle can be deferred post-MVP.

#### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Panel headers | Inter | 14px | 600 (semibold) |
| Card titles | Inter | 13px | 500 (medium) |
| Body / metadata | Inter | 12px | 400 (regular) |
| Code / logs | JetBrains Mono | 12px | 400 (regular) |
| Status bar | Inter | 11px | 500 (medium) |
| Toolbar controls | Inter | 13px | 500 (medium) |

#### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Inline spacing, icon gaps |
| `--space-sm` | 8px | Card padding, between chips |
| `--space-md` | 12px | Between card sections |
| `--space-lg` | 16px | Panel padding |
| `--space-xl` | 24px | Between major sections |

#### Border Radius

| Element | Radius |
|---------|--------|
| Cards | 8px |
| Buttons | 6px |
| Badges / chips | 12px (pill) |
| Modals / slide-overs | 12px top corners |
| Avatar circles | 50% |

#### Iconography

Use [Lucide Icons](https://lucide.dev/) (MIT, tree-shakeable, Vue component library available).

| Concept | Icon |
|---------|------|
| Agent running | `play-circle` |
| Agent idle | `circle-pause` |
| Agent error | `alert-circle` |
| Agent waiting | `clock` |
| Autonomous ON | `zap` |
| Autonomous OFF | `zap-off` |
| Plan review | `clipboard-check` |
| Manual lock | `lock` |
| Priority Critical | `chevrons-up` (red) |
| Priority High | `chevron-up` (orange) |
| Priority Medium | `minus` (yellow) |
| Priority Low | `chevron-down` (blue) |
| Datadog alert | `activity` |
| Settings | `settings` |
| Stop | `square` |
| Send (chat) | `send` |

---

### Component Specifications

#### Global Toolbar

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ◉ Agentic  │ [+ Agent] [■ Stop All] │ Project: [▾ PROJ-X] Sprint: [▾ Sprint 12] │ ⚡ Autonomous [━━●] │ ⚙ │
└─────────────────────────────────────────────────────────────────────────┘
Height: 48px
Background: --bg-surface
Border-bottom: 1px solid --border
```

- **Logo**: "Agentic" in semibold, accent color
- **Action buttons**: Ghost style with icon + label, 32px height
- **Selectors**: Dropdown with search, 160px min-width
- **Autonomous toggle**: Sliding toggle, green glow when ON, red outline when OFF
- **Settings gear**: Icon-only button, opens modal

#### Agent Card (Left Panel)

```
┌──────────────────────────────────┐
│ ● agent-01          ⏱ 12m 34s   │  ← Status dot + ID + elapsed
│ PROJ-42 · developer              │  ← Issue key + active skill
│ Phase 3/8 · Implementing tests   │  ← Phase progress + description
│ ████████░░░░░ 62%                │  ← Progress bar
│                    [■] [↻] [⋯]  │  ← Stop, Restart, More menu
└──────────────────────────────────┘
Width: 100% of left panel
Padding: --space-md
Border-bottom: 1px solid --border
```

**Status dot colors:**
| Status | Color | Animation |
|--------|-------|-----------|
| `running` | `--success` | Pulsing glow |
| `idle` | `--text-muted` | Static |
| `error` | `--danger` | Static |
| `waiting` | `--warning` | Slow blink |

**Expanded view** (on click): Below the card, expand a log viewer panel (monospace, dark background, auto-scroll, max 200 lines visible, scrollable).

#### Kanban Issue Card (Center Panel)

```
┌──────────────────────────────────────┐
│ ⬆ PROJ-42                   🔒      │  ← Priority icon + key + manual pin
│ Implement user authentication        │  ← Summary (truncate at 2 lines)
│                                      │
│ [frontend] [auth]                    │  ← Label chips
│ 👤 John D.          🤖 agent-01     │  ← Assignee + agent badge
│                              📋     │  ← Plan review indicator (if pending)
└──────────────────────────────────────┘
Width: column width minus 16px margin
Min-height: 80px
Background: --bg-surface
Border: 1px solid --border
Border-left: 3px solid <priority-color>
Hover: border-color transitions to --accent
```

**Priority left-border colors:**
| Priority | Color |
|----------|-------|
| Critical | `#F85149` |
| High | `#D29922` |
| Medium | `#58A6FF` |
| Low | `#8B949E` |

**Agent badge**: Small pill with agent icon + ID, colored by agent status. Appears only when an agent is working on the issue.

**Context menu** (right-click):
- Assign to agent →  (submenu of idle agents)
- Pin to manual mode (🔒)
- View in Jira (external link)
- Copy issue key

#### Kanban Column

```
┌─────────────────────┐
│ To Do          (5)  │  ← Column header + count
│─────────────────────│
│ ┌─────────────────┐ │
│ │ Issue Card      │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Issue Card      │ │
│ └─────────────────┘ │
│         ...         │
│                     │
└─────────────────────┘
```

- **Header**: Sticky, background `--bg-elevated`, text `--text-secondary`
- **Column count**: Badge with issue count
- **Drop zone**: Visual indicator (dashed border, `--accent` at 20% opacity) when dragging a card over
- **Scroll**: Vertical scroll within each column independently
- **Min-width**: 240px per column
- **Default columns**: `To Do` | `In Progress` | `In Code Review` | `Done`

#### Chat Panel (Right Panel)

```
┌──────────────────────────────────┐
│ Chat                        [─]  │  ← Header + minimize
│──────────────────────────────────│
│                                  │
│  🤖 Agent-02 assigned to PROJ-42│  ← System notification
│     Proceed? [Yes] [No]         │  ← Inline action buttons
│                                  │
│  You: /status                    │  ← User message
│                                  │
│  🤖 3 agents running:           │  ← System response
│     agent-01: PROJ-42 (Phase 3) │
│     agent-02: PROJ-15 (Phase 1) │
│     agent-03: idle               │
│                                  │
│  ⚠ Datadog: 2 new errors in     │  ← Datadog notification
│    auth-service [View] [Snooze]  │
│                                  │
│  ✅ PROJ-42 complete → PR #123   │  ← Completion notification
│     [View PR] [View Summary]     │
│                                  │
│──────────────────────────────────│
│ [/] Type a message...    [Send]  │  ← Input with command hint
│ ┌──────────────────────┐         │
│ │ /plan                │         │  ← Command autocomplete popover
│ │ /execute             │         │
│ │ /status              │         │
│ └──────────────────────┘         │
└──────────────────────────────────┘
```

**Message styling:**
| Type | Icon | Background | Border-left |
|------|------|------------|-------------|
| User message | None | transparent | None |
| System response | `bot` | `--bg-elevated` | `--accent` 2px |
| Notification | `bell` | `--bg-elevated` | `--info` 2px |
| Error notification | `alert-triangle` | `--bg-elevated` | `--danger` 2px |
| Success notification | `check-circle` | `--bg-elevated` | `--success` 2px |
| Action confirmation | `help-circle` | `--bg-elevated` | `--warning` 2px |

**Command autocomplete**: Triggered by `/` at start of input. Popover above input, filterable, keyboard navigable (up/down/enter/esc).

#### Plan Review Slide-over

```
┌────────────────────────────────────────────────┐
│ ← Plan Review: PROJ-42                    [✕]  │
│────────────────────────────────────────────────│
│                                                │
│ ISSUE CONTEXT                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ PROJ-42: Implement user authentication     │ │
│ │ Priority: High · Sprint 12 · Story         │ │
│ │ Assignee: John D. · Agent: agent-01        │ │
│ │                                            │ │
│ │ Description...                             │ │
│ │ Acceptance criteria...                     │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ PLAN (by agent-01)                             │
│ ┌────────────────────────────────────────────┐ │
│ │ ## Objectives                              │ │
│ │ - Implement JWT-based auth flow...         │ │
│ │                                            │ │
│ │ ## Approach                                │ │
│ │ 1. Create auth middleware...               │ │
│ │ 2. Add login/register endpoints...         │ │
│ │                                            │ │
│ │ ## Affected Files                          │ │
│ │ - src/middleware/auth.ts (new)             │ │
│ │ - src/routes/auth.ts (new)                │ │
│ │ - src/models/user.ts (modify)             │ │
│ │                                            │ │
│ │ ## Risks                                   │ │
│ │ - Token expiry edge cases...              │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │ Add feedback (optional)...               │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ [Approve] [Approve + Comment] [Request Changes]│
│ [Reject]  [Reassign ▾]                         │
│────────────────────────────────────────────────│
└────────────────────────────────────────────────┘
Width: 560px (slides in from right)
Background: --bg-surface
Overlay: 40% black on rest of app
```

#### Status Bar

```
┌───────────────────────────────────────────────────────────────────────┐
│ ▲ 2 plans awaiting review  ·  ▲ 1 Datadog alert  ·  3 agents active │
└───────────────────────────────────────────────────────────────────────┘
Height: 28px
Background: --bg-elevated
Font: 11px, --text-secondary
```

- **Badges**: Clickable — opens relevant panel/view
- **Plan badge**: Click opens first pending plan review
- **Alert badge**: Click opens alert details in chat
- **Agent count**: Click focuses agent panel

#### Settings Modal

Five tabs: Connections, Agents, Datadog Watches, Sync, Display.

**Tab 1: Connections**

```
┌──────────────────────────────────────────────┐
│ Settings                                [✕]  │
│──────────────────────────────────────────────│
│                                              │
│ [Connections] [Agents] [Watches] [Sync] [Display]│
│                                              │
│ JIRA CONNECTION                              │
│ Instance URL: [________________________]     │
│ API Token:    [________________________]     │
│ Project:      [▾ PROJ-X              ]       │
│ Board:        [▾ Board Name          ]       │
│ [Test Connection]  ✅ Connected              │
│                                              │
│ DATADOG CONNECTION                           │
│ API Key:      [________________________]     │
│ App Key:      [________________________]     │
│ [Test Connection]  ✅ Connected              │
│                                              │
│ GITHUB                                       │
│ Status: ✅ Connected via gh CLI              │
│                                              │
│──────────────────────────────────────────────│
│                           [Cancel] [Save]    │
└──────────────────────────────────────────────┘
Width: 640px
Centered modal with overlay
```

**Tab 2: Agents**

```
┌──────────────────────────────────────────────┐
│ Settings                                [✕]  │
│──────────────────────────────────────────────│
│                                              │
│ [Connections] [Agents] [Watches] [Sync] [Display]│
│                                              │
│ AGENT POOL                                   │
│ Max concurrent agents: [▾ 4             ]    │
│ (Limit how many agents can run at once.      │
│  Set based on your machine resources and     │
│  API rate limits.)                           │
│                                              │
│ Auto-scale:     [━━●] ON                     │
│ (Automatically spawn agents up to max when   │
│  unassigned issues exist in autonomous mode.)│
│                                              │
│ Min idle agents: [▾ 1            ]           │
│ (Keep N agents idle and ready for fast       │
│  assignment. 0 = only spawn on demand.)      │
│                                              │
│ RESOURCE LIMITS                              │
│ Max tokens per agent per issue: [▾ 50k   ]   │
│ Daily token budget:             [▾ 500k  ]   │
│ (Agents pause when limit reached.)           │
│                                              │
│ DEFAULT BEHAVIOR                             │
│ Default skill on assign:  [▾ /workflow   ]   │
│ Auto-restart on error:    [━━●] ON           │
│ Max retries before escalate: [▾ 3        ]   │
│                                              │
│──────────────────────────────────────────────│
│                           [Cancel] [Save]    │
└──────────────────────────────────────────────┘
```

**Tab 3: Watches** (Datadog Log Watches — see Log Watch Configuration section for full spec)

**Tab 4: Sync**

```
│ JIRA SYNC                                    │
│ Sync method:     [▾ Polling (MVP)       ]    │
│ Poll interval:   [▾ 15 seconds          ]    │
│ Conflict policy: [▾ Jira wins (default) ]    │
│                                              │
│ AGENT HEALTH                                 │
│ Heartbeat interval: [▾ 5 seconds        ]   │
│ Stall timeout:      [▾ 120 seconds      ]   │
│ Auto-restart stalled: [━━●] ON               │
```

**Tab 5: Display**

```
│ NOTIFICATIONS                                │
│ Desktop notifications: [━━●] ON              │
│ Sound alerts:          [━━●] ON              │
│ Quiet hours: [▾ OFF ] from [__:__] to [__:__]│
│                                              │
│ KANBAN                                       │
│ Auto-refresh interval: [▾ 30 seconds     ]   │
│ Show completed issues: [━━●] ON              │
│ Card density:          [▾ Comfortable    ]   │
│                                              │
│ THEME                                        │
│ [● Dark]  [○ Light]  [○ System]              │
```

---

### Layout Specifications

#### Panel Grid

```
┌──────────────────────────────────────────────────────────────────┐
│                        Toolbar (48px)                            │
├────────────┬───────────────────────────┬────────────────────────┤
│            │                           │                        │
│ Left Panel │      Center Panel         │     Right Panel        │
│ (280px     │      (flex: 1, min 480px) │     (360px default)    │
│  default,  │                           │                        │
│  min 220px)│                           │                        │
│            │                           │                        │
├────────────┴───────────────────────────┴────────────────────────┤
│                      Status Bar (28px)                          │
└──────────────────────────────────────────────────────────────────┘
```

- **Drag handles**: 4px wide between panels, cursor `col-resize`, `--border` color, `--accent` on hover
- **Collapse**: Double-click handle to collapse panel; shows expand arrow icon
- **Responsive breakpoints**:
  - `>= 1280px`: Three panels side by side (default)
  - `960px–1279px`: Left panel collapses to icon strip (agent status dots), center + right remain
  - `< 960px`: Tabbed view with bottom tab bar (Agents | Board | Chat)

#### Z-Index Layers

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | 0 | Panel content |
| Sticky | 10 | Column headers, panel headers |
| Drag overlay | 20 | Kanban card being dragged |
| Slide-over | 30 | Plan review, issue detail |
| Modal | 40 | Settings, confirmations |
| Toast | 50 | Transient notifications |
| Dropdown | 60 | Selectors, command autocomplete |

---

### Interaction Patterns

#### Drag-and-Drop (Kanban)

1. **Grab**: Mouse down on card → card lifts (scale 1.02, shadow elevation, opacity 0.9)
2. **Drag**: Card follows cursor; source column shows gap placeholder
3. **Hover over column**: Drop zone highlights (dashed border pulse)
4. **Drop**: Card animates to position in new column; triggers Jira transition API call
5. **Error**: If transition fails, card snaps back with shake animation; error toast
6. **Disabled**: Cards with running agents cannot be manually dragged (tooltip explains why)

#### Panel Resize

1. Hover on divider → cursor changes to `col-resize`
2. Mousedown → start drag
3. Mousemove → panels resize live (CSS grid `grid-template-columns` update)
4. Mouseup → persist widths to localStorage
5. Minimum widths enforced (prevents crushing panels)

#### Agent Assignment

1. **From Kanban**: Right-click card → "Assign to agent" → submenu lists idle agents → click agent → assignment starts
2. **From Chat**: Type "assign PROJ-42 to agent-01" → orchestrator confirms → assignment starts
3. **Auto-assign**: In autonomous mode, orchestrator polls for unassigned highest-priority issues every 5s and assigns to idle agents

#### Cross-Panel Highlighting

When selecting an entity in one panel, related entities in other panels pulse-highlight:

| Select | Left Panel | Center Panel | Right Panel |
|--------|-----------|--------------|-------------|
| Agent card | **Selected** | Assigned issue card glows | Scrolls to latest agent message |
| Issue card | Assigned agent glows | **Selected** | Shows issue context |
| Chat mention `PROJ-42` | Assigned agent glows | Card scrolls into view + glows | **Source** |
| Chat mention `agent-01` | Card scrolls + glows | Assigned issue glows | **Source** |

Highlight animation: 2s glow with `--accent` at 30% opacity → fade out.

---

### Animation & Transitions

| Event | Animation | Duration |
|-------|-----------|----------|
| Card enters column | Slide in + fade | 200ms ease-out |
| Card leaves column | Slide out + fade | 150ms ease-in |
| Agent status change | Status dot color crossfade | 300ms |
| Panel collapse/expand | Width tween | 250ms ease-in-out |
| Slide-over open | Slide from right + overlay fade | 250ms ease-out |
| Slide-over close | Slide to right + overlay fade | 200ms ease-in |
| Toast notification | Slide up + fade in / fade out | 200ms / 3s display / 200ms |
| Drag start | Scale 1.02 + shadow lift | 150ms |
| Drop complete | Scale 1.0 + shadow settle | 200ms |
| Error shake | Horizontal shake (3 cycles) | 400ms |
| Progress bar update | Width tween | 500ms ease-out |
| Cross-panel highlight | Glow pulse + fade | 2s |

All animations respect `prefers-reduced-motion: reduce` — replaced with instant transitions.

---

### Responsive Behavior

#### Desktop (>= 1280px)
Three-panel layout as described. Full toolbar. All features available.

#### Tablet (960px–1279px)
- Left panel collapses to a **40px icon strip**: one status-colored dot per agent, vertically stacked
- Click a dot → left panel slides out as overlay (320px wide)
- Center and right panels share remaining space
- Toolbar buttons collapse into a `⋯` overflow menu (keeping only Project selector and Autonomous toggle visible)

#### Mobile (< 960px)
- Panels become full-width **tabs** with bottom navigation:
  - 🤖 Agents | 📋 Board | 💬 Chat
- Toolbar moves to a hamburger menu
- Kanban columns scroll horizontally (swipe between columns)
- Agent cards are full-width
- Plan review opens as full-screen modal instead of slide-over
- Drag-and-drop replaced with "Move to..." action menu on cards

---

### Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements focusable via Tab; Enter/Space to activate |
| Kanban keyboard | Arrow keys move between cards; Enter opens detail; Shift+Arrow moves card between columns |
| Screen reader | ARIA labels on all controls; live regions for status updates and notifications |
| Focus management | Focus trapped in modals/slide-overs; restored on close |
| Color contrast | All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text) |
| Status indicators | Never rely on color alone — always paired with icon and/or text label |
| Reduced motion | `prefers-reduced-motion` disables all animations |
| Drag-and-drop alternative | "Move to..." button on each card for keyboard/screen-reader users |

---

### Empty States

Every panel and view has a designed empty state — not a blank void.

#### No agents

```
┌──────────────────────────────────┐
│           Agents                 │
│──────────────────────────────────│
│                                  │
│         ┌──────────┐             │
│         │  🤖      │             │
│         └──────────┘             │
│                                  │
│    No agents running             │
│                                  │
│    Spawn an agent to start       │
│    working on Jira issues.       │
│                                  │
│       [+ Spawn Agent]            │
│                                  │
└──────────────────────────────────┘
```

#### Empty Kanban column

```
┌─────────────────────┐
│ To Do          (0)  │
│─────────────────────│
│                     │
│    No issues        │
│    in this column   │
│                     │
│    ┈ ┈ ┈ ┈ ┈ ┈ ┈   │  ← dashed outline placeholder
│    Drop card here   │
│    ┈ ┈ ┈ ┈ ┈ ┈ ┈   │
│                     │
└─────────────────────┘
```

#### No Jira connection

```
┌──────────────────────────────────────┐
│              Board                   │
│──────────────────────────────────────│
│                                      │
│          ┌──────────┐                │
│          │  🔗      │                │
│          └──────────┘                │
│                                      │
│    Jira not connected                │
│                                      │
│    Connect your Jira instance to     │
│    see your project board here.      │
│                                      │
│    [Open Settings] [Run Setup]       │
│                                      │
└──────────────────────────────────────┘
```

#### Empty chat (first launch)

```
┌──────────────────────────────────┐
│ Chat                             │
│──────────────────────────────────│
│                                  │
│       ┌──────────┐               │
│       │  💬      │               │
│       └──────────┘               │
│                                  │
│    Welcome to Agentic            │
│                                  │
│    Chat with the orchestrator    │
│    to control your agents.       │
│                                  │
│    Try:                          │
│    • /status — check agent state │
│    • /plan — create a plan       │
│    • "assign PROJ-42"            │
│                                  │
└──────────────────────────────────┘
```

#### Empty analytics

```
┌──────────────────────────────────────────┐
│              Analytics                   │
│──────────────────────────────────────────│
│                                          │
│           ┌──────────┐                   │
│           │  📊      │                   │
│           └──────────┘                   │
│                                          │
│    No data yet                           │
│                                          │
│    Agent analytics will appear here      │
│    once agents start completing work.    │
│                                          │
│    [Spawn First Agent]                   │
│                                          │
└──────────────────────────────────────────┘
```

#### Empty notification center

```
┌──────────────────────────────┐
│ Notifications          [All ▾]│
│──────────────────────────────│
│                              │
│       All caught up          │
│                              │
│   No new notifications.      │
│                              │
└──────────────────────────────┘
```

**Design principles for empty states:**
- Always include an illustration/icon (muted, decorative)
- Explain what belongs here in 1-2 sentences
- Provide a primary CTA to fill the empty state
- Never show raw "No data" or blank panels

---

### Issue Detail Slide-over

Opens when clicking a Kanban card. Shows full issue context, comments, and linked agent activity.

```
┌────────────────────────────────────────────────┐
│ ← PROJ-42                                 [✕]  │
│────────────────────────────────────────────────│
│                                                │
│ Implement user authentication with JWT         │  ← Title (editable)
│                                                │
│ ┌─────────┬──────────┬──────────┬────────────┐ │
│ │ Details │ Comments │ Activity │ Agent Work │ │  ← Tabs
│ └─────────┴──────────┴──────────┴────────────┘ │
│                                                │
│ ┌──── DETAILS TAB ─────────────────────────┐   │
│ │                                          │   │
│ │ Status:     In Progress                  │   │
│ │ Priority:   ⬆ High                       │   │
│ │ Type:       Story                        │   │
│ │ Sprint:     Sprint 12                    │   │
│ │ Assignee:   👤 John D.                   │   │
│ │ Reporter:   👤 Sarah M.                  │   │
│ │ Labels:     [auth] [backend]             │   │
│ │ Created:    Feb 3, 2026                  │   │
│ │ Updated:    Feb 10, 2026                 │   │
│ │                                          │   │
│ │ DESCRIPTION                              │   │
│ │ ──────────                               │   │
│ │ As a user, I want to authenticate via    │   │
│ │ JWT so that I can securely access        │   │
│ │ protected endpoints...                   │   │
│ │                                          │   │
│ │ ACCEPTANCE CRITERIA                      │   │
│ │ ──────────────────                       │   │
│ │ ☐ Login endpoint returns JWT token       │   │
│ │ ☐ Protected routes reject expired tokens │   │
│ │ ☐ Refresh token flow implemented         │   │
│ │ ☐ Unit tests with >90% coverage          │   │
│ │                                          │   │
│ │ LINKED ISSUES                            │   │
│ │ ──────────────                           │   │
│ │ Blocks: PROJ-55 (API documentation)      │   │
│ │ Related: PROJ-10 (XSS fix)              │   │
│ │                                          │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌──── COMMENTS TAB ────────────────────────┐   │
│ │                                          │   │
│ │ Sarah M. — Feb 3                         │   │
│ │ Please use RS256 algorithm for JWT       │   │
│ │ signing, not HS256.                      │   │
│ │                                          │   │
│ │ John D. — Feb 5                          │   │
│ │ Noted, will use RS256 with key rotation. │   │
│ │                                          │   │
│ │ ┌──────────────────────────────────────┐ │   │
│ │ │ Add a comment...                     │ │   │
│ │ └──────────────────────────────────────┘ │   │
│ │                              [Comment]   │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌──── ACTIVITY TAB ────────────────────────┐   │
│ │                                          │   │
│ │ Feb 10, 12:21 PM                         │   │
│ │   Status: To Do → In Progress            │   │
│ │                                          │   │
│ │ Feb 10, 12:21 PM                         │   │
│ │   Assigned to agent-01                   │   │
│ │                                          │   │
│ │ Feb 10, 12:22 PM                         │   │
│ │   agent-01: Plan phase started           │   │
│ │                                          │   │
│ │ Feb 10, 12:24 PM                         │   │
│ │   agent-01: Plan auto-approved           │   │
│ │                                          │   │
│ │ Feb 10, 12:24 PM                         │   │
│ │   agent-01: Execute phase started        │   │
│ │                                          │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌──── AGENT WORK TAB ─────────────────────┐   │
│ │                                          │   │
│ │ 🤖 agent-01 · developer · Phase 3/8     │   │
│ │ ████████░░░░░ 38%                        │   │
│ │                                          │   │
│ │ Plan:  ✅ Approved (auto)                │   │
│ │ Branch: feat/PROJ-42-jwt-auth            │   │
│ │ Files changed: 4                         │   │
│ │ Tests: 6 written, 4 passing              │   │
│ │ Tokens: ~8.2k                            │   │
│ │ Duration: 12m 34s                        │   │
│ │                                          │   │
│ │ [View Plan] [View Logs] [Stop Agent]     │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│────────────────────────────────────────────────│
│ [Open in Jira ↗]  [Assign Agent]  [Move to ▾] │
└────────────────────────────────────────────────┘
Width: 560px (slides in from right, same as Plan Review)
Background: --bg-surface
```

**Tabs:**
| Tab | Content |
|-----|---------|
| **Details** | Jira fields, description, acceptance criteria, linked issues |
| **Comments** | Jira comments (bidirectional — can add from dashboard) |
| **Activity** | Timeline of status changes, agent assignments, phase transitions |
| **Agent Work** | Current agent progress, branch info, plan link, live stats, token usage |

**Footer actions:**
- **Open in Jira**: external link to the issue
- **Assign Agent**: quick-assign from idle agent list
- **Move to**: dropdown of available status transitions (keyboard alternative to drag-and-drop)

---

### Confirmation Dialogs

Destructive or high-impact actions require explicit confirmation.

```
┌──────────────────────────────────────┐
│ Stop All Agents?                [✕]  │
│──────────────────────────────────────│
│                                      │
│ ⚠  This will gracefully terminate   │
│    all 3 running agents.             │
│                                      │
│    • agent-01 — PROJ-42 (Phase 3)   │
│    • agent-02 — PROJ-15 (Phase 4)   │
│    • agent-03 — PROJ-78 (Phase 2)   │
│                                      │
│    In-progress work will be lost.    │
│    Agents can be restarted, but      │
│    will re-plan from scratch.        │
│                                      │
│    ☐ Don't ask me again              │
│                                      │
│──────────────────────────────────────│
│              [Cancel]   [Stop All]   │
└──────────────────────────────────────┘
Width: 440px
Centered modal with overlay
```

**Actions that require confirmation:**

| Action | Dialog title | Destructive button |
|--------|-------------|-------------------|
| Stop All agents | "Stop All Agents?" | "Stop All" (red) |
| Stop single agent | "Stop agent-01?" | "Stop" (red) |
| Remove agent | "Remove agent-04?" | "Remove" (red) |
| Reject plan | "Reject plan for PROJ-78?" | "Reject" (red) |
| Clear all notifications | "Clear all notifications?" | "Clear All" |
| Delete issue assignment | "Unassign agent-01 from PROJ-42?" | "Unassign" |
| Toggle autonomous OFF → ON | "Enable Autonomous Mode?" | "Enable" (primary, not red — it's not destructive but high-impact) |

**Dialog design:**
- **Header**: action question in plain language
- **Body**: explains what will happen, lists affected entities
- **Checkbox**: "Don't ask me again" (per action type, stored in localStorage)
- **Buttons**: Cancel (left, secondary) + Confirm (right, colored by severity)
- **Keyboard**: Enter confirms, Escape cancels
- **Focus**: trapped in dialog; autofocus on Cancel (safe default)

---

### Toast Notifications

Transient messages that appear at the bottom-center of the screen.

```
                  ┌────────────────────────────────────────────┐
                  │ ✓  Moved PROJ-42 to In Progress    [Undo] │
                  └────────────────────────────────────────────┘
                  ┌────────────────────────────────────────────┐
                  │ 🤖 agent-02 assigned to PROJ-15           │
                  └────────────────────────────────────────────┘
Position: fixed, bottom 40px (above status bar), centered horizontally
Max width: 480px
```

**Toast types:**

| Type | Icon | Border-left | Auto-dismiss | Has undo? |
|------|------|-------------|-------------|-----------|
| Success | `check-circle` | `--success` | 5s | Sometimes |
| Info | `info` | `--accent` | 4s | No |
| Warning | `alert-triangle` | `--warning` | 8s | No |
| Error | `alert-circle` | `--danger` | No (manual) | No |
| Undo | `rotate-ccw` | `--accent` | See undo window | Yes |

**Behavior:**
- Stack from bottom up (newest on top)
- Max 5 visible; older toasts collapse into "N more" badge
- Hover pauses auto-dismiss timer
- Click the `[✕]` to dismiss immediately
- Slide-up entrance animation (200ms), fade-out exit (200ms)
- Undo toasts have a countdown progress bar (shrinking bottom border)

**Toast anatomy:**
```
┌─────────────────────────────────────────────────┐
│ ▎ [icon]  Message text here           [Undo] [✕]│
│ ▎ ━━━━━━━━━━━━━━━━░░░░░░░░░░  (countdown bar)  │
└─────────────────────────────────────────────────┘
Height: 44px
Background: --bg-surface
Border: 1px solid --border
Border-left: 3px solid <type-color>
Border-radius: 8px
Box-shadow: 0 4px 16px rgba(0,0,0,0.4)
```

---

### Notification Center Design

Dropdown panel accessible from the bell icon in the toolbar.

```
                                    ┌──────────────────────────────────┐
                                    │ Notifications             [All ▾]│
                                    │──────────────────────────────────│
                                    │                                  │
                                    │ TODAY                            │
                                    │                                  │
                                    │  ● ✓ agent-01 completed PROJ-22 │
                                    │    PR #115 created · 12:33 PM   │
                                    │                                  │
                                    │  ● ⚠ Datadog: TypeError in      │
                                    │    auth-service · 12:31 PM      │
                                    │                                  │
                                    │  ● 📋 Plan ready: PROJ-78       │
                                    │    agent-03 · 12:25 PM          │
                                    │                                  │
                                    │  ○ 🤖 agent-02 auto-assigned    │
                                    │    to PROJ-15 · 12:22 PM        │
                                    │                                  │
                                    │  ○ ⚡ Autonomous mode enabled    │
                                    │    12:20 PM                      │
                                    │                                  │
                                    │──────────────────────────────────│
                                    │ [Mark all read]  [Clear read]    │
                                    └──────────────────────────────────┘
Width: 400px
Max-height: 500px (scrollable)
Position: anchored below bell icon, right-aligned
Background: --bg-surface
Border: 1px solid --border
Border-radius: 8px
Box-shadow: 0 8px 32px rgba(0,0,0,0.4)
```

- **●** = unread (accent dot), **○** = read (muted dot)
- **Filter dropdown**: All / Unread / Errors / Agents / Jira / Datadog
- Group by day (TODAY, YESTERDAY, etc.)
- Click notification → navigate to entity + mark as read
- Keyboard: `J`/`K` to navigate, `Enter` to open, `M` to mark read

---

### Command Palette Design

Opened via `Cmd+K`. Centered overlay search bar.

```
┌──────────────────────────────────────────────────────┐
│ 🔍 Search issues, agents, commands...                │
│──────────────────────────────────────────────────────│
│                                                      │
│ ISSUES                                               │
│   PROJ-42  Implement user authentication    ⬆ High  │
│   PROJ-15  Add pagination to user listing   — Med   │
│   PROJ-78  Refactor payment pipeline        ⬆ High  │
│                                                      │
│ AGENTS                                               │
│   agent-01  running · PROJ-42 · Phase 3             │
│   agent-02  running · PROJ-15 · Phase 4             │
│   agent-04  idle                                     │
│                                                      │
│ COMMANDS                                             │
│   /plan        Create a new plan                     │
│   /status      Check workflow state                  │
│   /execute     Start execution                       │
│                                                      │
│ ACTIONS                                              │
│   Open Settings                                      │
│   Open Analytics                                     │
│   Open Notifications                                 │
│   Toggle Autonomous Mode                             │
│                                                      │
└──────────────────────────────────────────────────────┘
Width: 560px
Position: centered, top 20% of viewport
Background: --bg-surface
Border: 1px solid --border
Border-radius: 12px
Box-shadow: 0 16px 48px rgba(0,0,0,0.5)
Overlay: 40% black behind
```

- Results update as you type (debounced 150ms)
- Arrow keys to navigate, Enter to select, Escape to close
- Results grouped by category with headers
- Max 5 results per category
- Recent searches shown when input is empty

---

### Onboarding Wizard Design

Full-screen flow on first launch.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     ① Jira ──── ② Project ──── ③ GitHub ──── ④ Datadog      │  ← Step indicator
│        ●           ○              ○              ○           │
│                                                              │
│──────────────────────────────────────────────────────────────│
│                                                              │
│                    Connect to Jira                            │
│                                                              │
│        Agentic needs access to your Jira instance            │
│        to manage issues and track work.                      │
│                                                              │
│        ┌──────────────────────────────────────┐              │
│        │ Instance URL                         │              │
│        │ https://yourteam.atlassian.net        │              │
│        └──────────────────────────────────────┘              │
│                                                              │
│        ┌──────────────────────────────────────┐              │
│        │ Email                                │              │
│        │ you@company.com                       │              │
│        └──────────────────────────────────────┘              │
│                                                              │
│        ┌──────────────────────────────────────┐              │
│        │ API Token                            │              │
│        │ ••••••••••••••••                      │              │
│        └──────────────────────────────────────┘              │
│                                                              │
│        [How to get an API token ↗]                           │
│                                                              │
│        ✅ Connection successful!                              │
│                                                              │
│──────────────────────────────────────────────────────────────│
│                                        [Back]  [Next →]      │
└──────────────────────────────────────────────────────────────┘
Background: --bg-primary
Content area: max-width 560px, centered
Step indicator: horizontal stepper with numbered circles
```

- **Step indicator**: filled circle = completed, outlined = current, dimmed = future
- **Validation**: inline errors below fields, green check on success
- **"Test Connection"** button: shows spinner → success/error inline
- **Help links**: external links to API token setup docs
- **Skip**: available on Datadog step → "Set up later"
- **Final step**: celebratory state with "Spawn your first agent" CTA

---

### Analytics Page Design

Full-page view (replaces center panel or opens as overlay/route).

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Analytics                    [Today ▾] [This Week] [Custom]   │
│──────────────────────────────────────────────────────────────────│
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ Completed  │ │ Avg Cycle  │ │ Success    │ │ Tokens     │   │
│  │   12       │ │  18m 42s   │ │  92%       │ │  142.3k    │   │
│  │ this week  │ │ per issue  │ │ no errors  │ │ ~$2.14     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  THROUGHPUT                                          PHASE TIME  │
│  ┌────────────────────────────┐ ┌────────────────────────────┐  │
│  │ 5│     ╭─╮                 │ │  Plan  ███░░░░░░ 3m        │  │
│  │ 4│   ╭─╯ │                 │ │  Exec  █████████░ 8m       │  │
│  │ 3│ ╭─╯   ╰─╮   ╭─        │ │  Test  ████░░░░░ 4m        │  │
│  │ 2│─╯        ╰─╮╭╯         │ │  Valid ██░░░░░░░ 2m        │  │
│  │ 1│             ╰╯          │ │  PR    █░░░░░░░░ 1m        │  │
│  │  └─────────────────────    │ │                            │  │
│  │  Mon Tue Wed Thu Fri Sat   │ │                            │  │
│  └────────────────────────────┘ └────────────────────────────┘  │
│                                                                  │
│  AGENT PERFORMANCE                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Agent     │ Completed │ Avg Time │ Success │ Tokens      │   │
│  │───────────│───────────│──────────│─────────│─────────────│   │
│  │ agent-01  │ 5         │ 16m 20s  │ 100%    │ 48.2k      │   │
│  │ agent-02  │ 4         │ 21m 05s  │ 75%     │ 52.1k      │   │
│  │ agent-03  │ 3         │ 15m 30s  │ 100%    │ 42.0k      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TIMELINE (today)                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ agent-01 │██ PROJ-22 ██│░░│████ PROJ-42 ████████        │   │
│  │ agent-02 │░░░│███ PROJ-18 ███│░│██ PROJ-15 █████        │   │
│  │ agent-03 │░░░░░░│████████ PROJ-78 ████│                  │   │
│  │          12PM       1PM       2PM       3PM              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Summary cards**: top row, key metrics at a glance
- **Throughput chart**: issues completed per day (line/bar)
- **Phase time**: horizontal bar chart, average time per workflow phase
- **Agent table**: sortable comparison table
- **Timeline**: Gantt-style swimlanes per agent, bars colored by phase
- **Date filter**: Today, This Week, This Sprint, Custom range
- **Export**: CSV button for raw data
