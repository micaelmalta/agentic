import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlanReview } from '../types/plan'

export const usePlansStore = defineStore('plans', () => {
  const plans = ref<PlanReview[]>([])
  const selectedPlanId = ref<string | null>(null)

  const pendingPlans = computed(() =>
    plans.value.filter(p => p.status === 'pending')
  )

  async function fetchPlans() {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      plans.value = data.map((plan: any) => ({
        ...plan,
        createdAt: new Date(plan.createdAt)
      }))
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  async function approvePlan(planId: string, feedback?: string) {
    try {
      await fetch(`/api/plans/${planId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      })
      const plan = plans.value.find(p => p.id === planId)
      if (plan) {
        plan.status = 'approved'
      }
    } catch (error) {
      console.error('Failed to approve plan:', error)
    }
  }

  async function rejectPlan(planId: string, reason?: string) {
    try {
      await fetch(`/api/plans/${planId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const plan = plans.value.find(p => p.id === planId)
      if (plan) {
        plan.status = 'rejected'
      }
    } catch (error) {
      console.error('Failed to reject plan:', error)
    }
  }

  function selectPlan(planId: string | null) {
    selectedPlanId.value = planId
  }

  return {
    plans,
    selectedPlanId,
    pendingPlans,
    fetchPlans,
    approvePlan,
    rejectPlan,
    selectPlan
  }
})
