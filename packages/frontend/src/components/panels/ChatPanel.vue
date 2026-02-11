<template>
  <div class="chat-panel flex flex-col h-full bg-background-secondary border-l border-border-primary">
    <!-- Header -->
    <div data-testid="panel-header" class="panel-header px-4 py-3 border-b border-border-primary flex-shrink-0">
      <h2 class="text-sm font-semibold text-text-primary">Chat</h2>
    </div>

    <!-- Messages Container -->
    <div
      ref="messagesContainer"
      data-testid="messages-container"
      class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
    >
      <!-- Empty State -->
      <div
        v-if="messages.length === 0"
        data-testid="empty-state"
        class="flex flex-col items-center justify-center h-full text-center py-12"
      >
        <MessageSquare :size="48" class="text-text-secondary opacity-50 mb-3" />
        <p class="text-sm font-medium text-text-primary mb-2">Welcome to Agentic</p>
        <p class="text-xs text-text-secondary mb-4 max-w-xs">
          Chat with the orchestrator to control your agents.
        </p>
        <div class="text-xs text-text-secondary space-y-1">
          <p>Try:</p>
          <p class="font-mono text-text-accent">/status — check agent state</p>
          <p class="font-mono text-text-accent">/plan — create a plan</p>
          <p class="font-mono text-text-accent">assign PROJ-42</p>
        </div>
      </div>

      <!-- Messages -->
      <div
        v-for="message in messages"
        :key="message.id"
        data-testid="chat-message"
        :class="[
          'message',
          `message-${message.type}`,
          { 'message-user': message.type === 'user' }
        ]"
      >
        <!-- Message Icon -->
        <div v-if="message.type !== 'user'" class="message-icon">
          <Bot v-if="message.type === 'system'" :size="14" />
          <Bell v-else-if="message.type === 'notification'" :size="14" />
          <AlertTriangle v-else-if="message.type === 'error'" :size="14" />
        </div>

        <!-- Message Content -->
        <div class="message-content">
          <p class="message-text">{{ message.content }}</p>

          <!-- Action Buttons -->
          <div v-if="message.actions && message.actions.length > 0" class="message-actions">
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

          <!-- Timestamp -->
          <span class="message-timestamp">
            {{ formatTime(message.timestamp) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Input Container -->
    <div class="input-container px-4 py-3 border-t border-border-primary flex-shrink-0">
      <!-- Command Autocomplete -->
      <div
        v-if="showAutocomplete"
        data-testid="autocomplete"
        class="autocomplete-popup"
      >
        <div
          v-for="(cmd, index) in filteredCommands"
          :key="cmd.command"
          @click="selectCommand(cmd.command)"
          @mouseenter="autocompleteIndex = index"
          :class="[
            'autocomplete-item',
            { 'autocomplete-item-active': index === autocompleteIndex }
          ]"
        >
          <span class="font-mono text-text-accent">{{ cmd.command }}</span>
          <span class="text-text-secondary ml-2">— {{ cmd.description }}</span>
        </div>
      </div>

      <!-- Input Field -->
      <div class="flex gap-2">
        <input
          v-model="inputText"
          @keydown="handleKeyDown"
          @input="handleInput"
          data-testid="chat-input"
          type="text"
          placeholder="/  Type a message or command..."
          class="chat-input flex-1"
        />
        <button
          @click="sendMessage"
          :disabled="!inputText.trim()"
          data-testid="send-button"
          class="send-button"
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
const messagesContainer = ref<HTMLElement | null>(null)
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

// Send message
async function sendMessage() {
  const content = inputText.value.trim()
  if (!content) return

  // Clear input immediately
  inputText.value = ''
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
.chat-panel {
  min-width: 0;
}

.panel-header {
  flex-shrink: 0;
}

/* Messages */
.message {
  @apply flex gap-2 items-start;
}

.message-user {
  @apply flex-row-reverse;
}

.message-user .message-content {
  @apply bg-transparent border-transparent;
  @apply text-right;
}

.message-icon {
  @apply flex-shrink-0 w-6 h-6 rounded flex items-center justify-center;
  @apply bg-background-elevated text-text-secondary;
}

.message-content {
  @apply flex-1 min-w-0 p-2 rounded-lg;
  @apply bg-background-elevated border border-border-primary;
}

.message-system .message-content {
  @apply border-l-2 border-l-border-accent;
}

.message-notification .message-content {
  @apply border-l-2 border-l-border-accent;
}

.message-error .message-content {
  @apply border-l-2 border-l-status-error;
}

.message-text {
  @apply text-sm text-text-primary whitespace-pre-wrap break-words;
}

.message-actions {
  @apply flex gap-2 mt-2;
}

.action-btn {
  @apply px-2 py-1 text-xs rounded transition-colors;
  @apply border border-border-primary;
}

.action-primary {
  @apply bg-border-accent text-white border-border-accent;
  @apply hover:bg-opacity-80;
}

.action-secondary {
  @apply bg-transparent text-text-secondary;
  @apply hover:bg-background-primary hover:text-text-primary;
}

.action-danger {
  @apply bg-status-error text-white border-status-error;
  @apply hover:bg-opacity-80;
}

.message-timestamp {
  @apply block text-xs text-text-secondary mt-1;
}

/* Input */
.input-container {
  position: relative;
}

.autocomplete-popup {
  @apply absolute bottom-full left-4 right-4 mb-2;
  @apply bg-background-elevated border border-border-primary rounded-lg;
  @apply shadow-lg overflow-hidden;
  max-height: 200px;
  overflow-y: auto;
}

.autocomplete-item {
  @apply px-3 py-2 text-xs cursor-pointer transition-colors;
  @apply hover:bg-background-primary;
}

.autocomplete-item-active {
  @apply bg-background-primary;
}

.chat-input {
  @apply w-full px-3 py-2 text-sm rounded-lg;
  @apply bg-background-elevated border border-border-primary;
  @apply text-text-primary placeholder-text-secondary;
  @apply focus:outline-none focus:ring-2 focus:ring-border-accent focus:border-transparent;
  @apply transition-all;
}

.send-button {
  @apply flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center;
  @apply bg-border-accent text-white;
  @apply hover:bg-opacity-80 transition-colors;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: var(--border-primary) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--border-secondary);
}
</style>
