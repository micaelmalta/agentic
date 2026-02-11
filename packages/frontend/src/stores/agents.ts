import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Agent } from '../types/agent'
import type { ChatMessage } from '../types/chat'

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([])
  const selectedAgentId = ref<string | null>(null)
  const maxAgents = ref(4)
  const autonomousMode = ref(false)
  const chatMessages = ref<ChatMessage[]>([])
  const chatMessagesByAgent = ref<Map<string, ChatMessage[]>>(new Map())

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

  async function sendChatMessage(content: string) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    chatMessages.value.push(message)

    // Store message for selected agent if one is selected
    if (selectedAgentId.value) {
      const agentMessages = chatMessagesByAgent.value.get(selectedAgentId.value) || []
      agentMessages.push(message)
      chatMessagesByAgent.value.set(selectedAgentId.value, agentMessages)
    }

    try {
      // Send to backend via WebSocket or API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId.value,
          content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send chat message')
      }
    } catch (error) {
      console.error('Failed to send chat message:', error)

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'error',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date()
      }
      chatMessages.value.push(errorMessage)
    }
  }

  function addChatMessage(message: ChatMessage) {
    chatMessages.value.push(message)

    // Store message for the associated agent if specified in metadata
    const agentId = message.metadata?.agentId
    if (agentId) {
      const agentMessages = chatMessagesByAgent.value.get(agentId) || []
      agentMessages.push(message)
      chatMessagesByAgent.value.set(agentId, agentMessages)
    }
  }

  function clearChatMessages() {
    chatMessages.value = []
  }

  const selectedAgentMessages = computed(() => {
    if (!selectedAgentId.value) return []
    return chatMessagesByAgent.value.get(selectedAgentId.value) || []
  })

  return {
    agents,
    selectedAgentId,
    maxAgents,
    autonomousMode,
    chatMessages,
    chatMessagesByAgent,
    runningAgents,
    idleAgents,
    canSpawnMore,
    selectedAgentMessages,
    fetchAgents,
    spawnAgent,
    stopAgent,
    stopAllAgents,
    assignIssue,
    selectAgent,
    updateAgent,
    addLogLine,
    sendChatMessage,
    addChatMessage,
    clearChatMessages
  }
})
