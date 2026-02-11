import { ChildProcess } from 'child_process';
import type { IPty } from 'node-pty';

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'error';

export interface Agent {
  id: string;
  status: AgentStatus;
  issueKey: string | null;
  /** Claude session id from stream-json output, used for --resume */
  sessionId: string | null;
  /** True when agent has asked for human approval and is paused */
  awaitingApproval: boolean;
  phase: number | null;
  phaseDescription: string | null;
  skill: string | null;
  progress: number;
  duration: number;
  tokenCount: number;
  /** Child process (spawn) or PTY (node-pty); null when not running */
  process: ChildProcess | IPty | null;
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
