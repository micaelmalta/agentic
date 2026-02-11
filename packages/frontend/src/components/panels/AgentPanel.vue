<template>
  <div class="agent-panel flex flex-col h-full bg-background-secondary border-r border-border-primary">
    <div data-testid="panel-header" class="panel-header flex items-center justify-between px-4 py-3 border-b border-border-primary">
      <h2 class="text-sm font-semibold text-text-primary">Agents</h2>
      <div class="flex gap-1">
        <button
          data-testid="filter-all"
          @click="statusFilter = null"
          :class="['filter-btn', { active: statusFilter === null }]"
        >
          All
        </button>
        <button
          data-testid="filter-running"
          @click="statusFilter = 'running'"
          :class="['filter-btn', { active: statusFilter === 'running' }]"
        >
          Running
        </button>
        <button
          data-testid="filter-idle"
          @click="statusFilter = 'idle'"
          :class="['filter-btn', { active: statusFilter === 'idle' }]"
        >
          Idle
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
      <div
        v-if="filteredAgents.length === 0"
        data-testid="empty-state"
        class="empty-state"
      >
        <Bot :size="48" class="text-text-secondary opacity-50" />
        <p class="text-sm text-text-secondary mt-2">
          {{ agentsStore.agents.length === 0 ? 'No agents spawned' : 'No agents match filter' }}
        </p>
      </div>

      <AgentCard
        v-for="agent in filteredAgents"
        :key="agent.id"
        :agent="agent"
        data-testid="agent-card"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bot } from 'lucide-vue-next'
import { useAgentsStore } from '../../stores/agents'
import AgentCard from '../agents/AgentCard.vue'
import type { AgentStatus } from '../../types/agent'

const agentsStore = useAgentsStore()
const statusFilter = ref<AgentStatus | null>(null)

const filteredAgents = computed(() => {
  if (!statusFilter.value) {
    return agentsStore.agents
  }
  return agentsStore.agents.filter(a => a.status === statusFilter.value)
})
</script>

<style scoped>
.panel-header {
  flex-shrink: 0;
}

.filter-btn {
  @apply px-2 py-1 text-xs rounded transition-colors;
  @apply text-text-secondary bg-transparent;
  @apply hover:bg-background-elevated hover:text-text-primary;
}

.filter-btn.active {
  @apply bg-border-accent text-white;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12;
}
</style>
