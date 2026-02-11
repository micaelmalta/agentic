<template>
  <div class="kanban-col" data-testid="column-header">
    <div class="col-header">
      <span class="col-title">{{ status }}</span>
      <span class="col-count" data-testid="issue-count">{{ issues.length }}</span>
    </div>

    <div
      class="col-body"
      data-testid="drop-zone"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <IssueCard
        v-for="issue in issues"
        :key="issue.key"
        :issue="issue"
        :active="issuesStore.selectedIssueKey === issue.key"
        @click="handleIssueClick"
        @contextmenu="handleIssueContextMenu"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
      />

      <div v-if="issues.length === 0" data-testid="empty-column" class="empty-col">
        <p class="text-sm" style="color: var(--text-muted); margin-bottom: 4px;">No issues</p>
        <p class="text-xs" style="color: var(--text-muted);">in this column</p>
        <div class="drop-hint">
          <p class="text-xs" style="color: var(--text-muted);">Drop card here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IssueCard from './IssueCard.vue'
import { useIssuesStore } from '../../stores/issues'
import type { Issue } from '../../types/issue'

const props = defineProps<{
  status: string
  issues: Issue[]
}>()

const emit = defineEmits<{
  drop: [issueKey: string, newStatus: string]
  issueClick: [issue: Issue]
  issueContextMenu: [issue: Issue, event: MouseEvent]
}>()

const issuesStore = useIssuesStore()
const isDragOver = ref(false)

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement
  const target = event.target as HTMLElement
  if (!target.contains(relatedTarget)) isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  if (!event.dataTransfer) return
  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    if (data.sourceStatus === props.status) return
    emit('drop', data.issueKey, props.status)
  } catch (_) {}
}

function handleIssueClick(issue: Issue) {
  emit('issueClick', issue)
}

function handleIssueContextMenu(issue: Issue, event: MouseEvent) {
  emit('issueContextMenu', issue, event)
}

function handleDragStart() {}
function handleDragEnd() {
  isDragOver.value = false
}

defineExpose({ isDragOver })
</script>

<style scoped>
.empty-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem 0;
}
.drop-hint {
  margin-top: 1rem;
  width: 100%;
  max-width: 180px;
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 1rem;
}
.drag-over .drop-hint,
.col-body.drag-over {
  border-color: var(--accent);
  background: var(--accent-dim);
}
</style>
