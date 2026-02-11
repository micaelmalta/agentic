import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Agent } from '../types/agent'

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([])
  const selectedAgentId = ref<string | null>(null)
  const maxAgents = ref(4)
  const autonomousMode = ref(false)

  const runningAgents = computed(() =>
    agents.value.filter(a => a.status === 'running')
  )

  const idleAgents = computed(() =>
    agents.value.filter(a => a.status === 'idle')
  )

  const canSpawnMore = computed(() =>
    agents.value.length < maxAgents.value
  )

  async function fetchAgents() {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()
      agents.value = data.map((agent: any) => ({
        ...agent,
        createdAt: new Date(agent.createdAt),
        updatedAt: new Date(agent.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  async function spawnAgent() {
    if (!canSpawnMore.value) return

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const newAgent = await response.json()
      agents.value.push({
        ...newAgent,
        createdAt: new Date(newAgent.createdAt),
        updatedAt: new Date(newAgent.updatedAt)
      })
    } catch (error) {
      console.error('Failed to spawn agent:', error)
    }
  }

  async function stopAgent(agentId: string) {
    try {
      await fetch(`/api/agents/${agentId}/stop`, {
        method: 'POST'
      })
      const agent = agents.value.find(a => a.id === agentId)
      if (agent) {
        agent.status = 'idle'
      }
    } catch (error) {
      console.error('Failed to stop agent:', error)
    }
  }

  async function stopAllAgents() {
    await Promise.all(
      agents.value
        .filter(a => a.status === 'running')
        .map(a => stopAgent(a.id))
    )
  }

  async function assignIssue(agentId: string, issueKey: string) {
    try {
      await fetch(`/api/agents/${agentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueKey })
      })
      const agent = agents.value.find(a => a.id === agentId)
      if (agent) {
        agent.issueKey = issueKey
        agent.status = 'running'
      }
    } catch (error) {
      console.error('Failed to assign issue:', error)
    }
  }

  function selectAgent(agentId: string | null) {
    selectedAgentId.value = agentId
  }

  function updateAgent(agentId: string, updates: Partial<Agent>) {
    const agent = agents.value.find(a => a.id === agentId)
    if (agent) {
      Object.assign(agent, updates, { updatedAt: new Date() })
    }
  }

  function addLogLine(agentId: string, line: string) {
    const agent = agents.value.find(a => a.id === agentId)
    if (agent) {
      agent.logs.push(line)
      // Keep only last 1000 lines
      if (agent.logs.length > 1000) {
        agent.logs = agent.logs.slice(-1000)
      }
    }
  }

  return {
    agents,
    selectedAgentId,
    maxAgents,
    autonomousMode,
    runningAgents,
    idleAgents,
    canSpawnMore,
    fetchAgents,
    spawnAgent,
    stopAgent,
    stopAllAgents,
    assignIssue,
    selectAgent,
    updateAgent,
    addLogLine
  }
})
