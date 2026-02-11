<template>
  <div class="panel" style="min-width: 0;">
    <div class="panel-header" data-testid="panel-header">
      <span class="panel-title">Board</span>
      <div class="filter-wrap" ref="filterWrapRef">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          style="font-size: 11px; color: var(--text-muted);"
          data-testid="filter-btn"
          :class="{ active: showMyTicketsOnly }"
          @click="showFilterPopover = !showFilterPopover"
        >
          Filter
        </button>
        <div
          v-if="showFilterPopover"
          class="filter-popover"
          data-testid="filter-popover"
        >
          <label class="filter-option">
            <input
              v-model="showMyTicketsOnly"
              type="checkbox"
              class="filter-checkbox"
            />
            <span>My tickets only</span>
          </label>
        </div>
      </div>
    </div>

    <div class="kanban" data-testid="board-container">
        <!-- Column: To Do -->
        <KanbanColumn
          status="To Do"
          :issues="filteredIssuesByStatus['To Do']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
          @issue-context-menu="handleIssueContextMenu"
        />

        <!-- Column: In Progress -->
        <KanbanColumn
          status="In Progress"
          :issues="filteredIssuesByStatus['In Progress']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
          @issue-context-menu="handleIssueContextMenu"
        />

        <!-- Column: In Code Review -->
        <KanbanColumn
          status="In Code Review"
          :issues="filteredIssuesByStatus['In Code Review']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
          @issue-context-menu="handleIssueContextMenu"
        />

        <KanbanColumn
          status="Done"
          :issues="filteredIssuesByStatus['Done']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
          @issue-context-menu="handleIssueContextMenu"
        />
    </div>
    <!-- Context Menu -->
    <div
      v-if="contextMenu.show"
      data-testid="context-menu"
      class="context-menu"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
    >
      <div class="context-menu-item" @click="handleAssignToAgent">
        <span>Assign to Agent</span>
      </div>
      <div class="context-menu-item" @click="handleUnassignAgent" v-if="contextMenu.issue?.agentId">
        <span>Unassign Agent</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleViewDetails">
        <span>View Details</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted, watch } from 'vue'
import KanbanColumn from '../kanban/KanbanColumn.vue'
import { useIssuesStore } from '../../stores/issues'
import { useAgentsStore } from '../../stores/agents'
import { useToast } from '../../composables/useToast'
import type { Issue } from '../../types/issue'

const BOARD_FILTER_STORAGE_KEY = 'board-filter-my-tickets'

function loadSavedFilter(): boolean {
  try {
    return localStorage.getItem(BOARD_FILTER_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const issuesStore = useIssuesStore()
const agentsStore = useAgentsStore()
const toast = useToast()
const showMyTicketsOnly = ref(loadSavedFilter())
const showFilterPopover = ref(false)
const filterWrapRef = ref<HTMLElement | null>(null)

watch(showMyTicketsOnly, (v) => {
  try {
    localStorage.setItem(BOARD_FILTER_STORAGE_KEY, String(v))
  } catch {
    // ignore
  }
}, { immediate: true })

// Close filter popover when clicking outside
function onDocumentClick(e: MouseEvent) {
  if (filterWrapRef.value && !filterWrapRef.value.contains(e.target as Node)) {
    showFilterPopover.value = false
  }
}

// Context menu state
const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  issue: Issue | null
}>({
  show: false,
  x: 0,
  y: 0,
  issue: null
})

// Computed: Filter issues by current user (Micael Malta)
const filteredIssuesByStatus = computed(() => {
  const allIssues = issuesStore.issuesByStatus

  if (!showMyTicketsOnly.value) {
    return allIssues
  }

  const filtered: Record<string, Issue[]> = {
    'To Do': [],
    'In Progress': [],
    'In Code Review': [],
    'Done': []
  }

  Object.keys(allIssues).forEach(status => {
    filtered[status] = allIssues[status].filter(issue =>
      issue.assignee?.displayName === 'Micael Malta'
    )
  })

  return filtered
})

onMounted(async () => {
  await issuesStore.fetchBoardIssues()
  document.addEventListener('click', closeContextMenu)
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
  document.removeEventListener('click', onDocumentClick)
})

async function handleDrop(issueKey: string, newStatus: string) {
  try {
    await issuesStore.transitionIssue(issueKey, newStatus)
    toast.success(`Moved ${issueKey} to ${newStatus}`)
  } catch (error) {
    console.error('Failed to transition issue:', error)
    toast.error(`Failed to move ${issueKey}. Please try again.`)
  }
}

function handleIssueClick(issue: Issue) {
  issuesStore.selectIssue(issue.key)
  // TODO: Open issue detail slide-over
}

function handleIssueContextMenu(issue: Issue, event: MouseEvent) {
  event.stopPropagation()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    issue
  }
}

function closeContextMenu() {
  contextMenu.value.show = false
}

async function handleAssignToAgent() {
  if (!contextMenu.value.issue) return

  const idleAgents = agentsStore.agents.filter(a => a.status === 'idle')

  if (idleAgents.length === 0) {
    alert('No idle agents available. Please spawn a new agent first.')
    closeContextMenu()
    return
  }

  // For MVP: assign to first idle agent
  // TODO: Show agent selection dialog
  const agent = idleAgents[0]

  try {
    const result = await issuesStore.assignToAgent(contextMenu.value.issue.key, agent.id)
    closeContextMenu()
    await agentsStore.fetchAgents()
    if (result?.startFailed && result?.startError) {
      toast.error(`Assigned to ${agent.id} but could not start: ${result.startError}. Set CLAUDE_CLI_PATH in backend .env if needed.`)
    } else {
      toast.success(`Assigned ${contextMenu.value.issue!.key} to ${agent.id}. Agent is starting.`)
    }
  } catch (error) {
    console.error('Failed to assign to agent:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to assign issue to agent')
  }
}

async function handleUnassignAgent() {
  if (!contextMenu.value.issue) return

  try {
    await issuesStore.unassignAgent(contextMenu.value.issue.key)
    closeContextMenu()
  } catch (error) {
    console.error('Failed to unassign agent:', error)
    alert('Failed to unassign agent')
  }
}

function handleViewDetails() {
  if (!contextMenu.value.issue) return
  handleIssueClick(contextMenu.value.issue)
  closeContextMenu()
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.btn-ghost { border: none; background: none; padding: 6px 8px; }
.btn-sm { padding: 4px 10px; font-size: 11px; }
.btn-sm.active { color: var(--accent); }

.filter-wrap {
  position: relative;
}
.filter-popover {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 180px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-dropdown);
  z-index: 20;
}
.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px 0;
}
.filter-option:hover { color: var(--text-primary); }
.filter-checkbox {
  width: 14px;
  height: 14px;
  accent-color: var(--accent);
  cursor: pointer;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-dropdown);
  padding: 4px 0;
}
.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 13px;
  transition: background 0.15s;
}
.context-menu-item:hover { background: var(--bg-hover); }
.context-menu-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
</style>
