export type ChatMessageType = 'user' | 'system' | 'notification' | 'error'

export interface Action {
  label: string
  action: string
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface ChatMessage {
  id: string
  type: ChatMessageType
  content: string
  timestamp: Date
  actions?: Action[]
  metadata?: Record<string, any>
}
