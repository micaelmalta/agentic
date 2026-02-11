import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Agent } from '../types/agent'
import type { ChatMessage } from '../types/chat'

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([])
  const selectedAgentId = ref<string | null>(null)
  const maxAgents = ref(4)
  const autonomousMode = ref((() => {
    try {
      return localStorage.getItem('toolbar-autonomous') === 'true'
    } catch {
      return false
    }
  })())
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

      if (!response.ok) {
        throw new Error('Failed to spawn agent')
      }

      // Agent will be added via WebSocket event (agent:created)
      // No need to manually add it here to avoid duplication
    } catch (error) {
      console.error('Failed to spawn agent:', error)
    }
  }

  async function stopAgent(agentId: string) {
    try {
      const response = await fetch(`/api/agents/${agentId}/stop`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || 'Failed to stop agent')
      }

      // Optimistic update so UI shows idle immediately; WebSocket may also send agent:stopped
      updateAgent(agentId, { status: 'idle' })
    } catch (error) {
      console.error('Failed to stop agent:', error)
      throw error
    }
  }

  async function approveAgent(agentId: string, message?: string) {
    try {
      const response = await fetch(`/api/agents/${agentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message ? { message } : {})
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || 'Failed to approve agent')
      }
      updateAgent(agentId, { status: 'running', awaitingApproval: false, phaseDescription: null })
    } catch (error) {
      console.error('Failed to approve agent:', error)
      throw error
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
      const response = await fetch(`/api/agents/${agentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueKey })
      })

      if (!response.ok) {
        throw new Error('Failed to assign issue')
      }

      // Agent update will be broadcast via WebSocket (agent:update)
      // No need to manually update here to avoid race conditions
    } catch (error) {
      console.error('Failed to assign issue:', error)
      throw error
    }
  }

  function selectAgent(agentId: string | null) {
    selectedAgentId.value = agentId
  }

  function addAgent(agent: Agent) {
    // Convert date strings to Date objects if needed
    const processedAgent = {
      ...agent,
      createdAt: agent.createdAt instanceof Date ? agent.createdAt : new Date(agent.createdAt),
      updatedAt: agent.updatedAt instanceof Date ? agent.updatedAt : new Date(agent.updatedAt)
    }
    agents.value.push(processedAgent)
  }

  function removeAgent(agentId: string) {
    const index = agents.value.findIndex(a => a.id === agentId)
    if (index !== -1) {
      agents.value.splice(index, 1)
    }
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

  /** Replace agent logs (e.g. after fetching from API). Use when polling logs. */
  function setAgentLogs(agentId: string, logs: string[]) {
    const agent = agents.value.find(a => a.id === agentId)
    if (agent) {
      agent.logs = Array.isArray(logs) ? [...logs] : []
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

      // Parse and add the backend response to chat
      const responseData = await response.json()
      const responseMessage: ChatMessage = {
        id: responseData.id || crypto.randomUUID(),
        type: responseData.type || 'system',
        content: responseData.content,
        timestamp: responseData.timestamp ? new Date(responseData.timestamp) : new Date()
      }
      chatMessages.value.push(responseMessage)
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
    approveAgent,
    stopAllAgents,
    assignIssue,
    selectAgent,
    addAgent,
    removeAgent,
    updateAgent,
    addLogLine,
    setAgentLogs,
    sendChatMessage,
    addChatMessage,
    clearChatMessages
  }
})
