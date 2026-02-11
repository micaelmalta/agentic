<template>
  <div class="panel" data-testid="agent-panel">
    <div class="panel-header" data-testid="panel-header">
      <span class="panel-title">Agents</span>
      <span class="panel-subtitle" style="font-size: 11px; color: var(--text-muted);">
        {{ activeCount }} active
      </span>
    </div>

    <div class="panel-body agent-list">
      <div
        v-if="filteredAgents.length === 0"
        data-testid="empty-state"
        class="empty-state"
        style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--text-muted); font-size: 12px;"
      >
        <Bot :size="48" style="opacity: 0.5; margin-bottom: 8px;" />
        <p>{{ agentsStore.agents.length === 0 ? 'No agents spawned' : 'No agents match filter' }}</p>
      </div>

      <AgentCard
        v-for="agent in filteredAgents"
        :key="agent.id"
        :agent="agent"
        :selected="agentsStore.selectedAgentId === agent.id"
        data-testid="agent-card"
        @view-logs="openLogsFor(agent.id)"
      />
    </div>

    <AgentLogsModal
      :agent="logsModalAgent"
      @close="logsModalAgentId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Bot } from 'lucide-vue-next'
import { useAgentsStore } from '../../stores/agents'
import AgentCard from '../agents/AgentCard.vue'
import AgentLogsModal from '../modals/AgentLogsModal.vue'
import type { AgentStatus } from '../../types/agent'

const agentsStore = useAgentsStore()
const statusFilter = ref<AgentStatus | null>(null)
const logsModalAgentId = ref<string | null>(null)

const logsModalAgent = computed(() => {
  if (!logsModalAgentId.value) return null
  return agentsStore.agents.find(a => a.id === logsModalAgentId.value) ?? null
})

function openLogsFor(agentId: string) {
  logsModalAgentId.value = agentId
}

const activeCount = computed(() =>
  agentsStore.agents.filter(a => a.status === 'running' || a.status === 'waiting').length
)

const filteredAgents = computed(() => {
  if (!statusFilter.value) return agentsStore.agents
  return agentsStore.agents.filter(a => a.status === statusFilter.value)
})

// When any agent is running, refresh agent list periodically so logs and processAlive stay updated
let refreshInterval: ReturnType<typeof setInterval> | null = null
watch(activeCount, (n) => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  if (n > 0) {
    refreshInterval = setInterval(() => agentsStore.fetchAgents(), 2000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>
