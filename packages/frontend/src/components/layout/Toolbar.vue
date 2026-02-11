<template>
  <div class="toolbar flex items-center gap-4 px-4 py-3 bg-background-secondary border-b border-border-primary">
    <button
      data-testid="add-agent-btn"
      :disabled="!agentsStore.canSpawnMore"
      @click="agentsStore.spawnAgent"
      class="btn-primary"
    >
      + Agent
    </button>

    <span
      data-testid="agent-count"
      class="text-sm text-text-secondary"
    >
      {{ agentsStore.agents.length }}/{{ agentsStore.maxAgents }} agents
    </span>

    <button
      data-testid="stop-all-btn"
      @click="handleStopAll"
      :disabled="agentsStore.runningAgents.length === 0"
      class="btn-secondary"
    >
      Stop All
    </button>

    <div class="flex-1"></div>

    <label class="flex items-center gap-2 cursor-pointer">
      <span class="text-sm text-text-secondary">Autonomous</span>
      <button
        data-testid="autonomous-toggle"
        @click="agentsStore.autonomousMode = !agentsStore.autonomousMode"
        :class="[
          'w-10 h-6 rounded-full transition-colors',
          agentsStore.autonomousMode ? 'bg-status-running' : 'bg-border-primary'
        ]"
      >
        <div
          :class="[
            'w-4 h-4 rounded-full bg-white transition-transform',
            agentsStore.autonomousMode ? 'translate-x-5' : 'translate-x-1'
          ]"
        ></div>
      </button>
      <span
        :class="[
          'text-sm font-medium',
          agentsStore.autonomousMode ? 'text-status-running' : 'text-text-secondary'
        ]"
      >
        {{ agentsStore.autonomousMode ? 'ON' : 'OFF' }}
      </span>
    </label>

    <button
      data-testid="settings-btn"
      @click="openSettings"
      class="btn-icon"
    >
      <Settings :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
import { useAgentsStore } from '../../stores/agents'

const agentsStore = useAgentsStore()

function handleStopAll() {
  if (confirm('Are you sure you want to stop all running agents?')) {
    agentsStore.stopAllAgents()
  }
}

function openSettings() {
  // TODO: Implement settings modal
  console.log('Open settings')
}
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-border-accent text-white rounded-md text-sm font-medium;
  @apply hover:bg-text-accent transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply px-4 py-2 bg-background-elevated text-text-primary rounded-md text-sm font-medium;
  @apply hover:bg-border-primary transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-icon {
  @apply p-2 bg-background-elevated text-text-secondary rounded-md;
  @apply hover:bg-border-primary hover:text-text-primary transition-colors;
}
</style>
