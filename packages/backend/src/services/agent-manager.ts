import { spawn, ChildProcess } from 'child_process';
import type {
  Agent,
  AgentStatus,
  AgentCreateOptions,
  AgentUpdate
} from '../types/agent.js';

export interface AgentManagerConfig {
  maxConcurrent: number;
}

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private nextAgentId: number = 1;
  private config: AgentManagerConfig;

  constructor(config: AgentManagerConfig) {
    this.config = config;
  }

  async spawn(options: AgentCreateOptions = {}): Promise<Agent> {
    // Check max concurrent limit
    const runningCount = Array.from(this.agents.values()).filter(
      a => a.status === 'running' || a.status === 'waiting'
    ).length;

    if (runningCount >= this.config.maxConcurrent) {
      throw new Error('Max concurrent agents reached');
    }

    const id = `agent-${this.nextAgentId++}`;
    const agent: Agent = {
      id,
      status: 'idle',
      issueKey: options.issueKey || null,
      phase: null,
      phaseDescription: null,
      skill: null,
      progress: 0,
      duration: 0,
      tokenCount: 0,
      process: null,
      logs: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.agents.set(id, agent);

    // Auto-start if requested
    if (options.autoStart && options.issueKey) {
      await this.startAgent(id);
    }

    return agent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async assignIssue(agentId: string, issueKey: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    agent.issueKey = issueKey;
    agent.updatedAt = new Date();
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (!agent.issueKey) {
      throw new Error('Cannot start agent without assigned issue');
    }

    // Spawn Claude CLI process
    const process = spawn('claude', [
      '--skill',
      '/workflow',
      '--issue',
      agent.issueKey
    ]);

    // Set up log streaming
    process.stdout?.on('data', (data) => {
      this.addLog(agentId, data.toString());
    });

    process.stderr?.on('data', (data) => {
      this.addLog(agentId, `ERROR: ${data.toString()}`);
    });

    process.on('exit', (code) => {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = code === 0 ? 'idle' : 'error';
        agent.process = null;
        agent.updatedAt = new Date();
        this.addLog(agentId, `Process exited with code ${code}`);
      }
    });

    agent.process = process;
    agent.status = 'running';
    agent.updatedAt = new Date();
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.process) {
      agent.process.kill('SIGTERM');
      agent.process = null;
    }

    agent.status = 'idle';
    agent.updatedAt = new Date();
  }

  updateAgentStatus(agentId: string, update: AgentUpdate): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    Object.assign(agent, update, { updatedAt: new Date() });
  }

  addLog(agentId: string, message: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return;
    }

    agent.logs.push(message);
    agent.updatedAt = new Date();

    // Keep only last 1000 log entries to prevent memory issues
    if (agent.logs.length > 1000) {
      agent.logs = agent.logs.slice(-1000);
    }
  }
}
