export type PlanStatus = 'pending' | 'approved' | 'rejected'

export interface PlanReview {
  id: string
  agentId: string
  issueKey: string
  planPath: string
  planContent: string
  createdAt: Date
  status: PlanStatus
}
