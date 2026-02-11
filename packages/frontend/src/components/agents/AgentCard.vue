<template>
  <div
    data-testid="agent-card"
    :class="['agent-card', { selected }]"
    @click="toggleExpanded"
  >
    <div class="agent-row">
      <span :class="['status-dot', agent.status]" data-testid="status-dot" />
      <span class="agent-name">{{ agent.id }}</span>
      <span v-if="agent.issueKey" class="agent-issue">{{ agent.issueKey }}</span>
      <span v-else class="agent-issue" style="color: var(--text-muted); font-size: 11px;">idle</span>
    </div>
    <div class="agent-last-status">Last: {{ lastStatus }}</div>

    <div v-if="agent.status !== 'idle'" class="agent-detail">
      <span class="phase-tag">{{ phaseLabel }}</span>
      <span v-if="agent.status === 'running' && (agent.processAlive || agent.pid)" class="process-badge" title="Process is running">
        {{ agent.processAlive && agent.pid ? `PID ${agent.pid}` : agent.pid ? `PID ${agent.pid}` : 'Running' }}
      </span>
      <template v-if="agent.status === 'running' && agent.progress > 0">
        <div class="mini-progress">
          <div
            :class="['mini-progress-fill', agent.status]"
            :style="{ width: `${agent.progress}%` }"
          />
        </div>
        <span>{{ formatDuration(agent.duration) }}</span>
      </template>
      <span v-else-if="agent.status === 'waiting'" style="color: var(--warning); font-size: 10px; font-weight: 500;">Needs approval</span>
    </div>

    <div v-if="expanded" class="agent-expanded">
      <div class="agent-expanded-meta">
        <span v-if="agent.skill">🧩 {{ agent.skill }}</span>
        <span v-if="agent.tokenCount">~{{ (agent.tokenCount / 1000).toFixed(1) }}k tokens</span>
      </div>
      <div v-if="agent.progress > 0" class="progress-full">
        <div class="progress-full-fill" :style="{ width: `${agent.progress}%` }" />
      </div>
      <div class="log-mini">
        <template v-for="(line, index) in agent.logs.slice(-15)" :key="index">
          <span v-if="line.includes('✓')" class="ok">{{ line }}</span>
          <span v-else-if="line.includes('⚠') || line.startsWith('ERROR')" class="warn">{{ line }}</span>
          <span v-else>{{ line }}</span>
        </template>
        <span v-if="agent.logs.length === 0" style="color: var(--text-muted);">No logs yet...</span>
      </div>
      <div class="agent-actions-row">
        <button
          v-if="agent.status === 'waiting' || agent.awaitingApproval"
          type="button"
          class="btn"
          style="border-color: rgba(34,197,94,0.35); color: var(--success); font-size: 11px; padding: 4px 10px;"
          @click.stop="handleApprove"
        >
          Approve & Continue
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          style="font-size: 11px; padding: 4px 10px;"
          data-testid="view-logs-btn"
          @click.stop="handleViewLogs"
        >
          View Logs
        </button>
        <button
          type="button"
          class="btn"
          style="border-color: rgba(248,113,113,0.3); color: var(--danger); font-size: 11px; padding: 4px 10px;"
          @click.stop="handleStop"
        >
          Stop
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAgentsStore } from '../../stores/agents'
import { useToast } from '../../composables/useToast'
import type { Agent } from '../../types/agent'

const props = defineProps<{
  agent: Agent
  selected?: boolean
}>()

const emit = defineEmits<{
  viewLogs: []
}>()

const agentsStore = useAgentsStore()
const toast = useToast()
const expanded = ref(false)

const phaseLabel = computed(() => {
  if (props.agent.phaseDescription) return props.agent.phaseDescription
  if (props.agent.status === 'waiting') return 'Plan Review'
  if (props.agent.status === 'idle') return 'Idle'
  if (props.agent.status === 'error') return 'Error'
  return '—'
})

const lastStatus = computed(() => {
  const status = props.agent.status
  if (props.agent.awaitingApproval || status === 'waiting') return 'Needs approval'
  if (props.agent.phaseDescription) return props.agent.phaseDescription
  if (status === 'running') return props.agent.processAlive ? 'Running' : 'Starting'
  if (status === 'error') return 'Error'
  return 'Idle'
})

function toggleExpanded() {
  expanded.value = !expanded.value
  if (expanded.value) agentsStore.selectAgent(props.agent.id)
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m`
}

function handleViewLogs() {
  emit('viewLogs')
}

async function handleApprove() {
  try {
    await agentsStore.approveAgent(props.agent.id)
    toast.success(`${props.agent.id} resumed`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Failed to resume agent')
  }
}

async function handleStop() {
  if (!confirm(`Stop ${props.agent.id}?`)) return
  try {
    await agentsStore.stopAgent(props.agent.id)
    toast.success(`${props.agent.id} stopped`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Failed to stop agent')
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:hover { color: var(--text-primary); border-color: var(--text-muted); background: var(--bg-hover); }
.btn-ghost { border: none; background: none; padding: 6px 8px; }
.btn-ghost:hover { background: var(--bg-hover); }

.process-badge {
  font-size: 10px;
  color: var(--accent);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 2px 6px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

.agent-last-status {
  margin-top: 2px;
  font-size: 10px;
  color: var(--text-muted);
}
</style>
