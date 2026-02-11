<template>
  <div
    data-testid="agent-card"
    @click="toggleExpanded"
    class="agent-card p-3 rounded-lg bg-background-elevated border border-border-primary cursor-pointer transition-all hover:border-border-accent"
    :class="{ 'ring-1 ring-border-accent': expanded }"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div
          data-testid="status-dot"
          :class="['status-dot', `status-${agent.status}`]"
        ></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-text-primary">{{ agent.id }}</span>
            <span v-if="agent.issueKey" class="text-xs text-text-accent">
              {{ agent.issueKey }}
            </span>
          </div>
          <div class="text-xs text-text-secondary mt-0.5">
            <span v-if="agent.phaseDescription">{{ agent.phaseDescription }}</span>
            <span v-else-if="agent.status === 'idle'">Idle</span>
            <span v-else-if="agent.status === 'waiting'">Waiting for approval</span>
            <span v-else-if="agent.status === 'error'">Error</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 ml-2">
        <span
          v-if="agent.status === 'running'"
          data-testid="duration"
          class="text-xs text-text-secondary font-mono"
        >
          {{ formatDuration(agent.duration) }}
        </span>
        <ChevronDown
          :size="16"
          class="text-text-secondary transition-transform"
          :class="{ 'rotate-180': expanded }"
        />
      </div>
    </div>

    <div v-if="agent.status === 'running' && agent.progress > 0" class="mt-2">
      <div data-testid="progress-bar" class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${agent.progress}%` }"
        ></div>
      </div>
      <div class="text-xs text-text-secondary mt-1">
        {{ agent.progress }}%
      </div>
    </div>

    <div
      v-if="expanded"
      data-testid="logs-container"
      class="mt-3 pt-3 border-t border-border-primary"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-text-secondary">Live Logs</span>
        <div class="flex gap-1">
          <button
            @click.stop="handleStop"
            class="action-btn text-status-error"
            title="Stop agent"
          >
            <Square :size="14" />
          </button>
        </div>
      </div>

      <div class="logs-viewer font-mono text-xs">
        <div
          v-for="(log, index) in agent.logs.slice(-20)"
          :key="index"
          class="log-line"
        >
          {{ log }}
        </div>
        <div v-if="agent.logs.length === 0" class="text-text-secondary">
          No logs yet...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Square } from 'lucide-vue-next'
import { useAgentsStore } from '../../stores/agents'
import type { Agent } from '../../types/agent'

const props = defineProps<{
  agent: Agent
}>()

const agentsStore = useAgentsStore()
const expanded = ref(false)

function toggleExpanded() {
  expanded.value = !expanded.value
  if (expanded.value) {
    agentsStore.selectAgent(props.agent.id)
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

async function handleStop() {
  if (confirm(`Stop ${props.agent.id}?`)) {
    await agentsStore.stopAgent(props.agent.id)
  }
}
</script>

<style scoped>
.status-dot {
  @apply w-2.5 h-2.5 rounded-full flex-shrink-0;
}

.status-idle {
  @apply bg-status-idle;
}

.status-running {
  @apply bg-status-running;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-waiting {
  @apply bg-status-waiting;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-error {
  @apply bg-status-error;
}

.progress-bar {
  @apply w-full h-1 bg-background-primary rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-border-accent transition-all duration-300;
}

.logs-viewer {
  @apply max-h-48 overflow-y-auto scrollbar-thin;
  @apply bg-background-primary p-2 rounded border border-border-primary;
}

.log-line {
  @apply text-text-secondary whitespace-pre-wrap break-words;
  @apply py-0.5;
}

.action-btn {
  @apply p-1 rounded hover:bg-background-primary transition-colors;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
