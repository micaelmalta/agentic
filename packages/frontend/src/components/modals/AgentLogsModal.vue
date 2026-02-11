<template>
  <Teleport to="body">
    <div v-if="agent" class="logs-modal-overlay" @click="$emit('close')">
      <div class="logs-modal" @click.stop data-testid="agent-logs-modal">
        <div class="modal-header">
          <h2>Agent logs — {{ agent.id }}{{ agent.issueKey ? ` (${agent.issueKey})` : '' }}</h2>
          <div class="header-actions">
            <button type="button" class="mode-btn" @click="showRaw = !showRaw">
              {{ showRaw ? 'Formatted' : 'Raw JSON' }}
            </button>
            <button type="button" class="close-btn" @click="$emit('close')" aria-label="Close logs">
              <X :size="20" />
            </button>
          </div>
        </div>
        <div ref="contentRef" class="modal-content">
          <pre class="logs-content">{{ logsText }}</pre>
          <p v-if="agent.status === 'running' && logsText === ''" class="logs-hint">
            Waiting for output… (live stream)
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useAgentsStore } from '../../stores/agents'
import type { Agent } from '../../types/agent'

const props = defineProps<{
  agent: Agent | null
}>()

defineEmits<{
  close: []
}>()

const agentsStore = useAgentsStore()
const showRaw = ref(false)
const contentRef = ref<HTMLElement | null>(null)

const sourceLogs = computed(() => props.agent?.logs ?? [])

function formatAgentLogs(logs: string[]): string {
  const output: string[] = []
  let textBuffer = ''

  const flushText = () => {
    if (textBuffer.length > 0) {
      output.push(textBuffer)
      textBuffer = ''
    }
  }

  for (const logEntry of logs) {
    const lines = String(logEntry).split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      let parsed: any
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        flushText()
        output.push(line)
        continue
      }

      if (parsed?.type === 'system' && parsed?.subtype === 'init') {
        flushText()
        output.push('[claude] session initialized')
        continue
      }

      if (parsed?.type === 'stream_event' && parsed?.event) {
        const evt = parsed.event

        if (
          evt.type === 'content_block_start' &&
          evt.content_block?.type === 'tool_use' &&
          typeof evt.content_block?.name === 'string'
        ) {
          flushText()
          output.push(`[tool] ${evt.content_block.name}`)
          continue
        }

        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          const chunk = typeof evt.delta.text === 'string' ? evt.delta.text : ''
          textBuffer += chunk
          continue
        }

        if (evt.type === 'message_stop' || evt.type === 'content_block_stop') {
          flushText()
          continue
        }

        continue
      }

      // Keep non-stream JSON lines concise in formatted mode.
      if (parsed?.type === 'result') {
        flushText()
        output.push('[claude] result received')
      }
    }
  }

  flushText()
  return output.join('\n')
}

const logsText = computed(() => {
  if (!sourceLogs.value.length) return ''
  return showRaw.value ? sourceLogs.value.join('\n') : formatAgentLogs(sourceLogs.value)
})

async function fetchLogs(agentId: string) {
  try {
    const res = await fetch(`/api/agents/${agentId}/logs`)
    if (!res.ok) return
    const data = await res.json()
    const logs = Array.isArray(data.logs) ? data.logs : []
    agentsStore.setAgentLogs(agentId, logs)
  } catch {
    // keep previous logs from store
  }
}

function scrollToBottom() {
  if (!contentRef.value) return
  contentRef.value.scrollTop = contentRef.value.scrollHeight
}

function startStreaming(agentId: string) {
  showRaw.value = false
  void fetchLogs(agentId)
}

watch(
  () => props.agent?.id,
  (id) => {
    if (id) startStreaming(id)
  },
  { immediate: true }
)

watch(
  () => logsText.value,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)
</script>

<style scoped>
.logs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.logs-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 640px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 250ms ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-btn {
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.mode-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.modal-content {
  flex: 1;
  overflow: auto;
  padding: var(--space-lg);
}

.logs-content {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

.logs-hint {
  margin: 0.5rem 0 0;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
