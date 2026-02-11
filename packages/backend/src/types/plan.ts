export type PlanStatus = 'pending' | 'approved' | 'rejected';

export interface PlanReview {
  id: string;
  issueKey: string;
  agentId: string;
  content: string;
  status: PlanStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export interface PlanReviewCreate {
  issueKey: string;
  agentId: string;
  content: string;
}

export interface PlanReviewUpdate {
  status: PlanStatus;
  reviewedBy?: string;
}
