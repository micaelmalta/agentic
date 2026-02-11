import { ChildProcess } from 'child_process';

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'error';

export interface Agent {
  id: string;
  status: AgentStatus;
  issueKey: string | null;
  phase: number | null;
  phaseDescription: string | null;
  skill: string | null;
  progress: number;
  duration: number;
  tokenCount: number;
  process: ChildProcess | null;
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCreateOptions {
  issueKey?: string;
  autoStart?: boolean;
}

export interface AgentUpdate {
  status?: AgentStatus;
  issueKey?: string | null;
  phase?: number | null;
  phaseDescription?: string | null;
  skill?: string | null;
  progress?: number;
  duration?: number;
  tokenCount?: number;
}
