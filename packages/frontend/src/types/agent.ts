export type AgentStatus = 'idle' | 'running' | 'waiting' | 'error'

export interface Agent {
  id: string
  status: AgentStatus
  issueKey: string | null
  phase: number | null
  phaseDescription: string | null
  skill: string | null
  progress: number
  duration: number
  tokenCount: number
  logs: string[]
  createdAt: Date
  updatedAt: Date
}
