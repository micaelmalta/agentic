<template>
  <div class="status-bar flex items-center gap-4 px-4 py-2 bg-background-secondary border-t border-border-primary text-sm">
    <button
      v-if="plansStore.pendingPlans.length > 0"
      data-testid="plans-badge"
      @click="openFirstPlan"
      class="status-badge status-badge-warning"
    >
      <AlertTriangle :size="14" />
      <span>{{ plansStore.pendingPlans.length }} plans awaiting review</span>
    </button>

    <button
      v-if="datadogAlertCount > 0"
      data-testid="datadog-badge"
      @click="openDatadogAlerts"
      class="status-badge status-badge-error"
    >
      <AlertCircle :size="14" />
      <span>{{ datadogAlertCount }} Datadog alerts</span>
    </button>

    <div class="flex-1"></div>

    <span class="text-text-secondary">
      {{ agentsStore.runningAgents.length }} agents active
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, AlertCircle } from 'lucide-vue-next'
import { usePlansStore } from '../../stores/plans'
import { useAgentsStore } from '../../stores/agents'

const plansStore = usePlansStore()
const agentsStore = useAgentsStore()
const datadogAlertCount = ref(0) // TODO: Connect to Datadog store

function openFirstPlan() {
  const firstPlan = plansStore.pendingPlans[0]
  if (firstPlan) {
    plansStore.selectPlan(firstPlan.id)
    // TODO: Open plan review slide-over
  }
}

function openDatadogAlerts() {
  // TODO: Open Datadog alerts panel
  console.log('Open Datadog alerts')
}
</script>

<style scoped>
.status-badge {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer;
}

.status-badge-warning {
  @apply bg-status-waiting/10 text-status-waiting border border-status-waiting/20;
  @apply hover:bg-status-waiting/20;
}

.status-badge-error {
  @apply bg-status-error/10 text-status-error border border-status-error/20;
  @apply hover:bg-status-error/20;
}
</style>
