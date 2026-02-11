# Agentic Dashboard - Implementation Status

**Last Updated:** 2026-02-11

## ✅ Completed Features

### 1. Agent Management
- ✅ Spawn/stop agents (max 4 concurrent)
- ✅ Agent list with status filtering (All/Running/Idle)
- ✅ Agent persistence across page refresh
- ✅ WebSocket real-time updates
- ✅ Agent assignment to issues
- ✅ Auto-start agent on assignment

### 2. Kanban Board
- ✅ Display all board issues with pagination (332+ issues)
- ✅ Four columns: To Do, In Progress, In Code Review, Done
- ✅ Drag-and-drop cards between columns
- ✅ Status transition API integration
- ✅ Right-click context menu (Assign/Unassign/View Details)
- ✅ Agent badges on assigned cards
- ✅ "My Tickets Only" filter
- ✅ Issue card styling with priority indicators
- ✅ Status mapping from Jira to Kanban columns

### 3. Jira Integration
- ✅ Full board sync with pagination (fetches all 333 issues)
- ✅ Background polling (15s interval)
- ✅ Status transitions
- ✅ Issue assignment
- ✅ Preserve agentId across polling
- ✅ Available transitions API
- ✅ Projects and boards listing endpoints

### 4. UI/UX
- ✅ Toast notifications (success/error)
- ✅ Drag-and-drop visual feedback
- ✅ Context menu on cards
- ✅ Real-time WebSocket updates
- ✅ Agent status badges
- ✅ Responsive layout
- ✅ Dark theme

### 5. Chat Interface
- ✅ Basic message sending
- ✅ Message display
- ✅ Backend chat routes

### 6. Plan Review
- ✅ Slide-over component
- ✅ Plan display UI

## 🚧 In Progress / Known Issues

### Backend
- ⚠️ Agents don't actually execute workflows yet (spawn command stub)
- ⚠️ Agent logs streaming not fully implemented
- ⚠️ CLAUDE_CLI_PATH needs to be configured for agent execution

### Frontend
- ⚠️ Frontend dev server crashed (exit 137 - OOM) - restarting
- ⚠️ Issue detail view not implemented (TODO in handleIssueClick)
- ⚠️ Agent selection dialog not implemented (assigns to first idle agent)

### Testing
- ⚠️ E2E tests with Playwright MCP not yet run
- ⚠️ No automated test suite for UI

## 📋 Next Priority Features (from spec.md MVP)

### 1. Autonomous Mode Implementation (High Priority)
**Status:** Toggle exists but does nothing

**What's needed:**
- Auto-assignment logic: idle agents pick unassigned "To Do" issues
- Priority-based selection (highest priority first)
- Auto-approve plans when autonomous mode is ON
- Background worker to check for work

**Files to modify:**
- `packages/backend/src/services/agent-manager.ts` - Add autonomous assignment logic
- `packages/backend/src/index.ts` - Add autonomous mode background worker
- `packages/frontend/src/stores/agents.ts` - Already has `autonomousMode` ref

### 2. Agent Execution Logic (Critical)
**Status:** Agents spawn but don't execute workflow

**What's needed:**
- Implement actual Claude CLI invocation
- Stream logs from agent process
- Update agent status/phase/progress during execution
- Handle workflow completion
- Error handling and retries

**Files to modify:**
- `packages/backend/src/services/agent-manager.ts` - Implement `startAgent()` with real CLI
- Configure `CLAUDE_CLI_PATH` in `.env`

### 3. Datadog Alerts Integration (Lower Priority)
**Status:** Not started

**What's needed:**
- Background monitoring for errors
- Notifications in status bar
- Alerts in chat
- Link to create Jira from Datadog alert

**Files to create:**
- `packages/backend/src/services/datadog-service.ts`
- `packages/frontend/src/stores/datadog.ts`

### 4. Enhanced UI Features
- Issue detail slide-over (when clicking a card)
- Agent selection dialog (when assigning)
- Chat commands (`/status`, `/help`, etc.)
- Plan review approval workflow
- Agent logs viewer
- Better error messages

## 🐛 Bugs Fixed Today

1. ✅ **Agent duplication** - Agents appeared twice (WebSocket + API response)
2. ✅ **Missing issues (RNA-382)** - Only fetched first 50 issues, now fetches all 332
3. ✅ **Agent assignment not visible** - agentId wasn't persisted or shown on cards
4. ✅ **Status mapping** - "Code Review" now maps to "In Code Review" column
5. ✅ **Drag-and-drop** - Fully implemented with visual feedback and toasts

## 📊 Metrics

- **Total Issues on Board:** 333
- **Max Concurrent Agents:** 4
- **Polling Interval:** 15 seconds
- **Backend Routes:** 14
- **Frontend Components:** ~20
- **WebSocket Events:** 8 types

## 🔧 Configuration

### Backend (.env)
```
PORT=3001
MAX_CONCURRENT_AGENTS=4
JIRA_HOST=justworks-tech.atlassian.net
JIRA_USERNAME=mmalta@justworks.com
JIRA_API_TOKEN=ATATT...
JIRA_BOARD_ID=496
JIRA_POLL_INTERVAL=15000
CLAUDE_CLI_PATH=claude  # ⚠️ Needs valid path for agent execution
```

### Frontend
- Dev server: `http://localhost:5173`
- API: `http://localhost:3001`
- WebSocket: `ws://localhost:3001/ws`

## 🎯 Immediate Next Steps

1. **Fix frontend dev server** (crashed with OOM)
2. **Test with Playwright MCP** - Verify drag-and-drop and context menu work
3. **Implement autonomous mode** - Core MVP feature for auto-assignment
4. **Agent execution** - Make agents actually run workflows
5. **Issue detail view** - Complete the TODO in KanbanPanel

## 📝 Technical Debt

- Frontend store duplication (agents in WebSocket + API)
- No TypeScript strict mode
- Missing error boundaries
- No loading states for async operations
- Agent logs not streaming in real-time
- No retry logic for failed API calls
- Context menu doesn't close on scroll
