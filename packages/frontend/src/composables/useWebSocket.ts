import { ref, onMounted, onUnmounted } from 'vue'
import { useAgentsStore } from '../stores/agents'
import { useIssuesStore } from '../stores/issues'
import { usePlansStore } from '../stores/plans'

interface WebSocketMessage {
  type: string
  payload: any
}

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 2000

  const agentsStore = useAgentsStore()
  const issuesStore = useIssuesStore()
  const plansStore = usePlansStore()

  function connect() {
    // Use the correct WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host.replace(/:\d+/, ':3001') // Backend runs on 3001
    const wsUrl = `${protocol}//${host}/ws`

    console.log('Connecting to WebSocket:', wsUrl)

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket connected')
        isConnected.value = true
        reconnectAttempts.value = 0
      }

      ws.value.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket disconnected')
        isConnected.value = false

        // Attempt to reconnect
        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++
          console.log(`Reconnecting... (attempt ${reconnectAttempts.value}/${maxReconnectAttempts})`)
          setTimeout(connect, reconnectDelay)
        }
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }

  function handleMessage(message: WebSocketMessage) {
    console.log('WebSocket message:', message.type, message.payload)

    switch (message.type) {
      case 'agent:created':
        if (message.payload.agent) {
          agentsStore.addAgent(message.payload.agent)
        }
        break

      case 'agent:update':
        if (message.payload.agent) {
          agentsStore.updateAgent(message.payload.agent.id, message.payload.agent)
        }
        break

      case 'agent:stopped':
        if (message.payload.agent) {
          agentsStore.updateAgent(message.payload.agent.id, message.payload.agent)
        } else if (message.payload.agentId) {
          agentsStore.updateAgent(message.payload.agentId, { status: 'idle' })
        }
        break

      case 'agent:log':
        if (message.payload.agentId && typeof message.payload.line === 'string') {
          agentsStore.addLogLine(message.payload.agentId, message.payload.line)
        }
        break

      case 'issues:updated':
        if (message.payload.issues) {
          // Refresh issues from backend
          issuesStore.fetchBoardIssues()
        }
        break

      case 'issue:update':
        if (message.payload.issueKey && message.payload.updates) {
          issuesStore.updateIssue(message.payload.issueKey, message.payload.updates)
        }
        break

      case 'plan:created':
        if (message.payload.plan) {
          plansStore.addPlan(message.payload.plan)
        }
        break

      case 'plan:reviewed':
        if (message.payload.planId && message.payload.status) {
          plansStore.updatePlanStatus(message.payload.planId, message.payload.status)
        }
        break

      case 'chat:message':
        // Chat messages are handled by the chat store
        // This can be extended later for a dedicated chat store
        console.log('Chat message:', message.payload)
        break

      case 'ack':
        // Acknowledgement from server
        console.log('Server acknowledged:', message.payload)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  function send(type: string, payload: any = {}) {
    if (ws.value && isConnected.value) {
      const message: WebSocketMessage = { type, payload }
      ws.value.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected. Cannot send message:', type)
    }
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    send,
    disconnect,
    connect
  }
}
