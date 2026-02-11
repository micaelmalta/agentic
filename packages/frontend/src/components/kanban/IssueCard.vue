<template>
  <div
    data-testid="issue-card"
    :data-issue-key="issue.key"
    :class="['issue-card', priorityClass, { 'active-issue': active }]"
    draggable="true"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="issue-top-row">
      <span :class="['issue-type-dot', issueTypeClass]" />
      <span class="issue-key">{{ issue.key }}</span>
    </div>

    <div class="issue-title">{{ issue.summary }}</div>

    <div class="issue-bottom">
      <template v-if="issue.assignee">
        <div :class="['avatar-sm', avatarVariant]">
          <img
            v-if="issue.assignee.avatarUrl"
            :src="issue.assignee.avatarUrl"
            :alt="issue.assignee.displayName"
            class="w-full h-full object-cover rounded-full"
          />
          <span v-else>{{ (issue.assignee.displayName || '?').slice(0, 2).toUpperCase() }}</span>
        </div>
      </template>
      <span v-else class="issue-extra">Unassigned</span>

      <span v-if="issue.agentId" :class="['agent-chip', agentChipStatus]">
        <Bot :size="12" />
        {{ issue.agentId }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bot } from 'lucide-vue-next'
import type { Issue } from '../../types/issue'

const props = defineProps<{
  issue: Issue
  active?: boolean
}>()

const emit = defineEmits<{
  click: [issue: Issue]
  contextmenu: [issue: Issue, event: MouseEvent]
  dragstart: [event: DragEvent, issue: Issue]
  dragend: [event: DragEvent]
}>()

const priorityClass = computed(() => {
  switch (props.issue.priority) {
    case 'Critical': return 'p-critical'
    case 'High': return 'p-high'
    case 'Medium': return 'p-medium'
    case 'Low': return 'p-low'
    default: return 'p-low'
  }
})

const issueTypeClass = computed(() => {
  const t = (props.issue.issueType || '').toLowerCase()
  if (t.includes('bug')) return 'bug'
  if (t.includes('story')) return 'story'
  return 'task'
})

const avatarVariant = computed(() => {
  const n = (props.issue.assignee?.displayName || '').length % 5
  return `v${(n % 5) + 1}` as 'v1' | 'v2' | 'v3' | 'v4' | 'v5'
})

const agentChipStatus = computed(() => {
  return 'running' // could come from store later
})

function handleClick() {
  emit('click', props.issue)
}

function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', props.issue, event)
}

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({
      issueKey: props.issue.key,
      sourceStatus: props.issue.status
    }))
  }
  ;(event.target as HTMLElement).classList.add('dragging')
  emit('dragstart', event, props.issue)
}

function handleDragEnd(event: DragEvent) {
  ;(event.target as HTMLElement).classList.remove('dragging')
  emit('dragend', event)
}
</script>

<style scoped>
.issue-card.dragging {
  opacity: 0.5;
}
.avatar-sm span {
  line-height: 1;
}
</style>
