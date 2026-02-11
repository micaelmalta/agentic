<template>
  <div class="kanban-panel flex flex-col h-full bg-background-primary">
    <!-- Panel Header -->
    <div data-testid="panel-header" class="panel-header px-4 py-3 border-b border-border-primary">
      <h2 class="text-sm font-semibold text-text-primary">Kanban Board</h2>
    </div>

    <!-- Board Container -->
    <div
      data-testid="board-container"
      class="flex-1 overflow-x-auto overflow-y-hidden"
    >
      <div class="flex h-full min-w-max gap-4 p-4">
        <!-- Column: To Do -->
        <KanbanColumn
          status="To Do"
          :issues="issuesStore.issuesByStatus['To Do']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
        />

        <!-- Column: In Progress -->
        <KanbanColumn
          status="In Progress"
          :issues="issuesStore.issuesByStatus['In Progress']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
        />

        <!-- Column: In Code Review -->
        <KanbanColumn
          status="In Code Review"
          :issues="issuesStore.issuesByStatus['In Code Review']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
        />

        <!-- Column: Done -->
        <KanbanColumn
          status="Done"
          :issues="issuesStore.issuesByStatus['Done']"
          @drop="handleDrop"
          @issue-click="handleIssueClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import KanbanColumn from '../kanban/KanbanColumn.vue'
import { useIssuesStore } from '../../stores/issues'
import type { Issue } from '../../types/issue'

const issuesStore = useIssuesStore()

onMounted(async () => {
  await issuesStore.fetchBoardIssues()
})

async function handleDrop(issueKey: string, newStatus: string) {
  await issuesStore.transitionIssue(issueKey, newStatus)
}

function handleIssueClick(issue: Issue) {
  issuesStore.selectIssue(issue.key)
  // TODO: Open issue detail slide-over
}
</script>

<style scoped>
.kanban-panel {
  min-width: 0; /* Allow flex child to shrink */
}

/* Horizontal scrolling for board */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: var(--border-primary) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: var(--border-secondary);
}
</style>
