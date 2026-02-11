<template>
  <div class="app h-screen flex flex-col" style="background: var(--bg-primary);">
    <Toolbar data-testid="toolbar" />

    <div data-testid="grid-container" class="panels">
      <AgentPanel data-testid="agent-panel" class="panel" />
      <KanbanPanel data-testid="kanban-panel" class="panel" />
      <ChatPanel data-testid="chat-panel" class="panel" />
    </div>

    <StatusBar data-testid="status-bar" />

    <!-- Plan Review Slide-Over -->
    <PlanReviewSlideOver
      :is-open="isPlanReviewOpen"
      @close="closePlanReview"
    />

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Toolbar from './components/layout/Toolbar.vue'
import StatusBar from './components/layout/StatusBar.vue'
import AgentPanel from './components/panels/AgentPanel.vue'
import KanbanPanel from './components/panels/KanbanPanel.vue'
import ChatPanel from './components/panels/ChatPanel.vue'
import PlanReviewSlideOver from './components/panels/PlanReviewSlideOver.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import { useWebSocket } from './composables/useWebSocket'
import { usePlansStore } from './stores/plans'
import { useAgentsStore } from './stores/agents'
import { useIssuesStore } from './stores/issues'

// Establish WebSocket connection for real-time updates
const { isConnected } = useWebSocket()

// Stores
const plansStore = usePlansStore()
const agentsStore = useAgentsStore()
const issuesStore = useIssuesStore()

// Log connection status (can be removed in production)
console.log('WebSocket connection initiated')

// Plan review state
const isPlanReviewOpen = computed(() => plansStore.selectedPlanId !== null)

function closePlanReview() {
  plansStore.selectPlan(null)
}

// Fetch initial data on mount
onMounted(async () => {
  await Promise.all([
    agentsStore.fetchAgents(),
    issuesStore.fetchBoardIssues()
  ])
})
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
