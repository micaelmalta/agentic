export type IssuePriority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface User {
  accountId: string
  displayName: string
  emailAddress: string
  avatarUrl?: string
}

export interface Issue {
  key: string
  summary: string
  description: string
  status: string
  priority: IssuePriority
  issueType: string
  assignee: User | null
  reporter: User
  labels: string[]
  sprint: string | null
  agentId: string | null
  manualMode: boolean
  updatedAt: Date
}
