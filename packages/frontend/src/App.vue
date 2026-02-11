<template>
  <div class="app h-screen flex flex-col bg-background-primary">
    <Toolbar data-testid="toolbar" />

    <div
      data-testid="grid-container"
      class="grid flex-1 overflow-hidden"
      style="grid-template-columns: 280px 1fr 360px;"
    >
      <AgentPanel data-testid="agent-panel" />
      <KanbanPanel data-testid="kanban-panel" />
      <ChatPanel data-testid="chat-panel" />
    </div>

    <StatusBar data-testid="status-bar" />
  </div>
</template>

<script setup lang="ts">
import Toolbar from './components/layout/Toolbar.vue'
import StatusBar from './components/layout/StatusBar.vue'
import AgentPanel from './components/panels/AgentPanel.vue'
import KanbanPanel from './components/panels/KanbanPanel.vue'
import ChatPanel from './components/panels/ChatPanel.vue'
import { useWebSocket } from './composables/useWebSocket'

// Establish WebSocket connection for real-time updates
const { isConnected } = useWebSocket()

// Log connection status (can be removed in production)
console.log('WebSocket connection initiated')
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
