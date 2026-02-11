<template>
  <div class="panel" style="min-width: 0;">
    <div class="panel-header" data-testid="panel-header">
      <span class="panel-title">Chat</span>
    </div>

    <div ref="messagesContainer" data-testid="messages-container" class="chat-body">
      <div
        v-if="messages.length === 0"
        data-testid="empty-state"
        class="empty-chat"
      >
        <MessageSquare :size="48" style="opacity: 0.5; margin-bottom: 12px; color: var(--text-secondary);" />
        <p style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px;">Welcome to Agentic</p>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; max-width: 240px;">
          Chat with the orchestrator to control your agents.
        </p>
        <div style="font-size: 12px; color: var(--text-secondary);">
          <p>Try:</p>
          <p style="font-family: 'JetBrains Mono', monospace; color: var(--accent);">/status — check agent state</p>
          <p style="font-family: 'JetBrains Mono', monospace; color: var(--accent);">/plan — create a plan</p>
          <p style="font-family: 'JetBrains Mono', monospace; color: var(--accent);">assign PROJ-42</p>
        </div>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        data-testid="chat-message"
        :class="[
          'msg',
          message.type === 'user' ? 'msg-user' : 'msg-system',
          message.type === 'system' && 'info',
          message.type === 'notification' && 'success',
          message.type === 'error' && 'error'
        ]"
      >
        <div class="msg-body">
          <p>{{ message.content }}</p>

          <div v-if="message.actions && message.actions.length > 0" class="msg-actions">
            <button
              v-for="action in message.actions"
              :key="action.label"
              @click="handleAction(action)"
              :class="[
                'action-btn',
                `action-${action.variant || 'secondary'}`
              ]"
            >
              {{ action.label }}
            </button>
          </div>

          <span style="display: block; font-size: 11px; color: var(--text-muted); margin-top: 6px;">
            {{ formatTime(message.timestamp) }}
          </span>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div v-if="showAutocomplete" data-testid="autocomplete" class="autocomplete-popup">
        <div
          v-for="(cmd, index) in filteredCommands"
          :key="cmd.command"
          @click="selectCommand(cmd.command)"
          @mouseenter="autocompleteIndex = index"
          :class="['autocomplete-item', { 'autocomplete-item-active': index === autocompleteIndex }]"
        >
          <span style="font-family: 'JetBrains Mono', monospace; color: var(--accent);">{{ cmd.command }}</span>
          <span style="color: var(--text-secondary); margin-left: 8px;">— {{ cmd.description }}</span>
        </div>
      </div>

      <div class="chat-input-box">
        <input
          ref="inputRef"
          v-model="inputText"
          @keydown="handleKeyDown"
          @input="handleInput"
          data-testid="chat-input"
          type="text"
          placeholder="/  Type a message or command..."
          class="chat-input"
        />
        <button
          @click="sendMessage"
          data-testid="send-button"
          class="send-btn"
          :class="{ 'opacity-50': !canSend }"
          :aria-disabled="!canSend"
          title="Send message"
        >
          <Send :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { MessageSquare, Bot, Bell, AlertTriangle, Send } from 'lucide-vue-next'
import type { ChatMessage, Action } from '../../types/chat'
import { useAgentsStore } from '../../stores/agents'

// Store
const agentsStore = useAgentsStore()

// State - use store's chat messages
const messages = computed(() => agentsStore.chatMessages)
const inputText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

const canSend = computed(() => inputText.value.trim().length > 0)
const showAutocomplete = ref(false)
const autocompleteIndex = ref(0)

// Available commands
const commands = [
  { command: '/status', description: 'Check workflow state' },
  { command: '/plan', description: 'Create a new plan' },
  { command: '/execute', description: 'Start execution' },
  { command: '/summarize', description: 'Generate summary' },
  { command: '/archive', description: 'Archive completed work' }
]

// Filtered commands based on input
const filteredCommands = computed(() => {
  if (!inputText.value.startsWith('/')) {
    return []
  }
  const query = inputText.value.toLowerCase()
  return commands.filter(cmd => cmd.command.toLowerCase().startsWith(query))
})

// Watch for autocomplete visibility
watch(filteredCommands, (newCommands) => {
  showAutocomplete.value = newCommands.length > 0 && inputText.value.startsWith('/')
  if (showAutocomplete.value) {
    autocompleteIndex.value = 0
  }
})

// Watch for new messages and auto-scroll
watch(messages, async () => {
  await nextTick()
  await scrollToBottom()
}, { deep: true })

// Format timestamp
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Handle input changes
function handleInput() {
  // Autocomplete is handled by the watcher
}

// Handle keyboard events
function handleKeyDown(e: KeyboardEvent) {
  if (showAutocomplete.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      autocompleteIndex.value = (autocompleteIndex.value + 1) % filteredCommands.value.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      autocompleteIndex.value =
        (autocompleteIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
    } else if (e.key === 'Tab' || (e.key === 'Enter' && showAutocomplete.value)) {
      e.preventDefault()
      if (filteredCommands.value[autocompleteIndex.value]) {
        selectCommand(filteredCommands.value[autocompleteIndex.value].command)
      }
    } else if (e.key === 'Escape') {
      showAutocomplete.value = false
    }
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// Select command from autocomplete
function selectCommand(command: string) {
  inputText.value = command + ' '
  showAutocomplete.value = false
  nextTick(() => {
    const input = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement
    input?.focus()
  })
}

// Send message (read from input ref so programmatic fill in e2e works)
async function sendMessage() {
  const raw = inputRef.value?.value ?? inputText.value
  const content = (typeof raw === 'string' ? raw : '').trim()
  if (!content) return

  // Clear input immediately
  inputText.value = ''
  if (inputRef.value) inputRef.value.value = ''
  showAutocomplete.value = false

  // Send to backend via agents store
  await agentsStore.sendChatMessage(content)

  // Scroll to bottom after message is added to store
  await nextTick()
  await scrollToBottom()
}

// Handle action button clicks
function handleAction(action: Action) {
  console.log('Action triggered:', action)
  // TODO: Implement action handlers
}

// Scroll to bottom of messages
async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Add welcome message on mount
onMounted(() => {
  // Optional: Add a welcome message
  // messages.value.push({
  //   id: 'welcome',
  //   type: 'system',
  //   content: 'Welcome! Type /status to check agent state or assign issues to agents.',
  //   timestamp: new Date()
  //   })
})
</script>

<style scoped>
.autocomplete-popup {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  margin-bottom: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-dropdown);
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}
.autocomplete-item {
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.autocomplete-item:hover,
.autocomplete-item-active {
  background: var(--bg-hover);
}
.chat-input-area {
  position: relative;
}
.action-btn {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
