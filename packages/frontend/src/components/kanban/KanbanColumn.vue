<template>
  <div class="kanban-column flex flex-col w-[280px] flex-shrink-0">
    <!-- Column Header -->
    <div
      data-testid="column-header"
      class="sticky top-0 z-10 bg-background-elevated px-4 py-3 border-b border-border-primary flex items-center justify-between"
    >
      <h3 class="text-sm font-semibold text-text-secondary">
        {{ status }}
      </h3>
      <span
        data-testid="issue-count"
        class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-background-primary text-xs text-text-secondary"
      >
        {{ issues.length }}
      </span>
    </div>

    <!-- Drop Zone -->
    <div
      data-testid="drop-zone"
      class="p-4"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Issue Cards -->
      <div v-if="issues.length > 0">
        <IssueCard
          v-for="issue in issues"
          :key="issue.key"
          :issue="issue"
          @click="handleIssueClick"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        data-testid="empty-column"
        class="flex flex-col items-center justify-center h-full text-center py-8"
      >
        <p class="text-sm text-text-muted mb-2">No issues</p>
        <p class="text-xs text-text-muted">in this column</p>
        <div class="mt-4 w-full max-w-[180px] border-2 border-dashed border-border-primary rounded-lg p-4">
          <p class="text-xs text-text-muted">Drop card here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IssueCard from './IssueCard.vue'
import type { Issue } from '../../types/issue'

const props = defineProps<{
  status: string
  issues: Issue[]
}>()

const emit = defineEmits<{
  drop: [issueKey: string, newStatus: string]
  issueClick: [issue: Issue]
}>()

const isDragOver = ref(false)

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  // Only set to false if leaving the drop zone entirely
  const target = event.target as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement

  if (!target.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false

  if (!event.dataTransfer) return

  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    const { issueKey, sourceStatus } = data

    // Don't emit if dropping in the same column
    if (sourceStatus === props.status) {
      return
    }

    emit('drop', issueKey, props.status)
  } catch (error) {
    console.error('Failed to parse drag data:', error)
  }
}

function handleIssueClick(issue: Issue) {
  emit('issueClick', issue)
}

function handleDragStart() {
  // Visual feedback can be handled here if needed
}

function handleDragEnd() {
  // Clean up drag state if needed
  isDragOver.value = false
}

// Expose isDragOver for testing
defineExpose({
  isDragOver
})
</script>

<style scoped>
.drag-over {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(88, 166, 255, 0.05),
    transparent
  );
  border: 2px dashed rgba(88, 166, 255, 0.3);
  border-radius: 8px;
}

.kanban-column {
  background-color: var(--bg-primary);
}

/* Smooth scrolling for column */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: var(--border-primary) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--border-secondary);
}
</style>
