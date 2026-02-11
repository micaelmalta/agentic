export type PlanStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested'

export interface IssueContext {
  key: string
  summary: string
  description?: string
  acceptanceCriteria?: string
}

export interface PlanScope {
  filesToChange: string[]
  newFiles: string[]
  testCoveragePlan?: string
}

export interface PlanReview {
  id: string
  agentId: string
  issueKey: string
  planPath: string
  planContent: string
  issueContext?: IssueContext
  riskAssessment?: string
  scope?: PlanScope
  createdAt: Date
  status: PlanStatus
}
