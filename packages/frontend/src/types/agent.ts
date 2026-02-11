export type AgentStatus = 'idle' | 'running' | 'waiting' | 'error'

export interface Agent {
  id: string
  status: AgentStatus
  issueKey: string | null
  sessionId?: string | null
  awaitingApproval?: boolean
  phase: number | null
  phaseDescription: string | null
  skill: string | null
  progress: number
  duration: number
  tokenCount: number
  logs: string[]
  createdAt: Date
  updatedAt: Date
  /** True if the backend process is still alive (from API/WS) */
  processAlive?: boolean
  /** Process ID when running (from API/WS) */
  pid?: number | null
}
