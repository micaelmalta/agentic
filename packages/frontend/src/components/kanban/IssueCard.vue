<template>
  <div
    data-testid="issue-card"
    draggable="true"
    class="kanban-issue-card bg-background-surface border border-border-primary rounded-lg p-3 mb-3 cursor-pointer hover:border-accent transition-colors min-h-[80px]"
    :class="priorityBorderClass"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- Header: Priority + Key + Manual Lock -->
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-center gap-2">
        <div
          data-testid="priority-icon"
          class="flex-shrink-0"
          :class="priorityIconClass"
          :title="issue.priority"
        >
          <component :is="priorityIcon" :size="16" />
        </div>
        <span class="text-xs font-medium text-text-secondary">
          {{ issue.key }}
        </span>
      </div>
      <div v-if="issue.manualMode" data-testid="manual-lock" class="flex-shrink-0">
        <Lock :size="14" class="text-text-muted" />
      </div>
    </div>

    <!-- Summary -->
    <p class="text-sm text-text-primary mb-3 line-clamp-2">
      {{ issue.summary }}
    </p>

    <!-- Labels -->
    <div v-if="issue.labels.length > 0" class="flex flex-wrap gap-1 mb-3">
      <span
        v-for="label in issue.labels"
        :key="label"
        class="inline-block px-2 py-0.5 text-xs rounded-full bg-background-elevated text-text-secondary"
      >
        {{ label }}
      </span>
    </div>

    <!-- Footer: Assignee + Agent Badge -->
    <div class="flex items-center justify-between">
      <div v-if="issue.assignee" data-testid="assignee-avatar" class="flex items-center gap-1.5">
        <div class="w-5 h-5 rounded-full bg-background-elevated flex items-center justify-center overflow-hidden">
          <img
            v-if="issue.assignee.avatarUrl"
            :src="issue.assignee.avatarUrl"
            :alt="issue.assignee.displayName"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-xs text-text-secondary">
            {{ issue.assignee.displayName.charAt(0) }}
          </span>
        </div>
        <span class="text-xs text-text-secondary truncate max-w-[80px]">
          {{ issue.assignee.displayName }}
        </span>
      </div>
      <div v-else class="flex-1"></div>

      <div
        v-if="issue.agentId"
        data-testid="agent-badge"
        class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs"
      >
        <Bot :size="12" />
        <span>{{ issue.agentId }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronsUp, ChevronUp, Minus, ChevronDown, Lock, Bot } from 'lucide-vue-next'
import type { Issue } from '../../types/issue'

const props = defineProps<{
  issue: Issue
}>()

const emit = defineEmits<{
  click: [issue: Issue]
  dragstart: [event: DragEvent, issue: Issue]
  dragend: [event: DragEvent]
}>()

// Priority icon mapping
const priorityIcon = computed(() => {
  switch (props.issue.priority) {
    case 'Critical':
      return ChevronsUp
    case 'High':
      return ChevronUp
    case 'Medium':
      return Minus
    case 'Low':
      return ChevronDown
    default:
      return Minus
  }
})

// Priority icon color
const priorityIconClass = computed(() => {
  switch (props.issue.priority) {
    case 'Critical':
      return 'text-danger'
    case 'High':
      return 'text-warning'
    case 'Medium':
      return 'text-accent'
    case 'Low':
      return 'text-text-muted'
    default:
      return 'text-text-muted'
  }
})

// Priority left border color
const priorityBorderClass = computed(() => {
  switch (props.issue.priority) {
    case 'Critical':
      return 'border-l-4 border-l-danger'
    case 'High':
      return 'border-l-4 border-l-warning'
    case 'Medium':
      return 'border-l-4 border-l-accent'
    case 'Low':
      return 'border-l-4 border-l-text-muted'
    default:
      return 'border-l-4 border-l-text-muted'
  }
})

function handleClick() {
  emit('click', props.issue)
}

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({
      issueKey: props.issue.key,
      sourceStatus: props.issue.status
    }))
  }
  emit('dragstart', event, props.issue)
}

function handleDragEnd(event: DragEvent) {
  emit('dragend', event)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kanban-issue-card:active {
  cursor: grabbing;
}

.kanban-issue-card.dragging {
  opacity: 0.5;
}
</style>
