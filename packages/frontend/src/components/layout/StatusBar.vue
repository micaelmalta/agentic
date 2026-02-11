<template>
  <div class="statusbar" data-testid="status-bar">
    <button
      v-if="plansStore.pendingPlans.length > 0"
      data-testid="plans-badge"
      type="button"
      class="status-item"
      @click="openFirstPlan"
    >
      <span class="status-dot-sm" style="background: var(--warning);" />
      <span>{{ plansStore.pendingPlans.length }} plans awaiting review</span>
    </button>

    <button
      v-if="datadogAlertCount > 0"
      data-testid="datadog-badge"
      type="button"
      class="status-item"
      @click="openDatadogAlerts"
    >
      <span class="status-dot-sm" style="background: var(--danger);" />
      <span>{{ datadogAlertCount }} Datadog alerts</span>
    </button>

    <div style="flex: 1" />

    <span class="status-item" style="cursor: default;">
      {{ agentsStore.runningAgents.length }} agents active
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePlansStore } from '../../stores/plans'
import { useAgentsStore } from '../../stores/agents'

const plansStore = usePlansStore()
const agentsStore = useAgentsStore()
const datadogAlertCount = ref(0)

function openFirstPlan() {
  const firstPlan = plansStore.pendingPlans[0]
  if (firstPlan) plansStore.selectPlan(firstPlan.id)
}

function openDatadogAlerts() {
  console.log('Open Datadog alerts')
}
</script>

<style scoped>
.status-dot-sm {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
</style>
