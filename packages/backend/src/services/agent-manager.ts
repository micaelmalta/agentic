import { spawn, ChildProcess, execSync } from 'child_process';
import type {
  Agent,
  AgentStatus,
  AgentCreateOptions,
  AgentUpdate
} from '../types/agent.js';

const isWindows = typeof process !== 'undefined' && process.platform === 'win32';
const APPROVAL_PROMPT_REGEX = /(do you approve this plan|approve this plan\?|awaiting approval|needs approval)/i;

let ptyModule: typeof import('node-pty') | null | undefined = undefined;
async function getPty(): Promise<typeof import('node-pty') | null> {
  if (ptyModule !== undefined) return ptyModule;
  try {
    ptyModule = await import('node-pty');
  } catch {
    ptyModule = null;
  }
  return ptyModule;
}

/** Resolve CLI to absolute path so PTY/spawn can find it. */
function resolveCliPath(cliPath: string): string {
  const cleaned = cliPath.trim().replace(/^['"]|['"]$/g, '');
  if (cleaned.includes('/') || (isWindows && cleaned.includes('\\'))) return cleaned;
  try {
    const cmd = isWindows ? `where ${cleaned}` : `which ${cleaned}`;
    const out = execSync(cmd, { encoding: 'utf8', timeout: 2000 }).split(/\r?\n/)[0]?.trim();
    return out || cleaned;
  } catch {
    return cleaned;
  }
}

export interface AgentManagerConfig {
  maxConcurrent: number;
  /** Path to Claude CLI executable (e.g. 'claude' or '/usr/local/bin/claude') */
  cliPath: string;
  /** Optional directories for Claude CLI --add-dir (extra working dirs) */
  addDir?: string[];
}

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private nextAgentId: number = 1;
  private config: AgentManagerConfig;
  private onLogLine: ((agentId: string, line: string) => void) | null = null;

  constructor(config: AgentManagerConfig) {
    this.config = config;
  }

  setLogListener(listener: ((agentId: string, line: string) => void) | null): void {
    this.onLogLine = listener;
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
      sessionId: null,
      awaitingApproval: false,
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

  /** Serialize agent for API/WS: strip process, add processAlive and pid for verification */
  serializeAgent(agent: Agent): Record<string, unknown> {
    const { process: proc, ...rest } = agent;
    const serializable = { ...rest } as Record<string, unknown>;
    const cp = proc as ChildProcess | undefined;
    serializable.processAlive = !!(proc && (cp?.exitCode == null) && !(cp?.killed));
    serializable.pid = proc?.pid ?? null;
    return serializable;
  }

  async assignIssue(agentId: string, issueKey: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    agent.issueKey = issueKey;
    agent.updatedAt = new Date();
  }

  private buildClaudeArgs(prompt: string, resumeSessionId?: string): string[] {
    const addDir = this.config.addDir?.length ? this.config.addDir : undefined;
    return [
      ...(addDir ? ['--add-dir', ...addDir] : []),
      ...(resumeSessionId ? ['--resume', resumeSessionId] : []),
      '-p', prompt,
      '--output-format', 'stream-json',
      '--include-partial-messages',
      '--verbose',
      '--permission-mode', 'bypassPermissions'
    ];
  }

  private parseClaudeLogLine(agent: Agent, line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return;
    }

    if (typeof parsed?.session_id === 'string') {
      agent.sessionId = parsed.session_id;
    }

    let candidateText = '';
    if (parsed?.type === 'assistant') {
      const content = Array.isArray(parsed?.message?.content) ? parsed.message.content : [];
      candidateText = content
        .filter((c: any) => c?.type === 'text' && typeof c?.text === 'string')
        .map((c: any) => c.text)
        .join('\n');
    } else if (parsed?.type === 'result' && typeof parsed?.result === 'string') {
      candidateText = parsed.result;
    }

    if (candidateText && APPROVAL_PROMPT_REGEX.test(candidateText)) {
      agent.awaitingApproval = true;
      agent.status = 'waiting';
      agent.phaseDescription = 'Awaiting approval';
      agent.updatedAt = new Date();
    }
  }

  private applyExitState(agentId: string, code: number | null, signal?: string | number): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    const cleanExit = code === 0 || code === 143 || code === 130 || signal === 'SIGTERM' || signal === 'SIGINT' || signal === 15 || signal === 2;
    if (cleanExit) {
      agent.status = agent.awaitingApproval ? 'waiting' : 'idle';
    } else {
      agent.status = 'error';
    }
    agent.process = null;
    agent.updatedAt = new Date();

    const sig = signal !== undefined ? ` (${String(signal)})` : '';
    const suffix = agent.awaitingApproval ? ' — awaiting approval.' : ' — agent stopped.';
    this.addLog(agentId, `Process exited with code ${code}${sig}${cleanExit ? suffix : ''}`);
  }

  private async runClaude(agentId: string, prompt: string, resumeSessionId?: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    if (agent.process) {
      throw new Error('Agent is already running');
    }

    const rawCliPath = this.config.cliPath || 'claude';
    const cliPath = resolveCliPath(rawCliPath);
    const cliArgs = this.buildClaudeArgs(prompt, resumeSessionId);
    this.addLog(agentId, `[${new Date().toISOString()}] Starting: ${prompt}${resumeSessionId ? ` (resume ${resumeSessionId})` : ''}`);

    const setupPipeChild = (child: ChildProcess) => {
      this.addLog(agentId, `[${new Date().toISOString()}] Process started (PID ${child.pid ?? '?'}). Claude Code output below…`);
      child.stdout?.on('data', (data) => this.addLog(agentId, data.toString()));
      child.stderr?.on('data', (data) => this.addLog(agentId, data.toString()));
      child.on('exit', (code, signal) => this.applyExitState(agentId, code, signal ?? undefined));
      child.on('error', (err) => {
        this.addLog(agentId, `Process error: ${err.message}`);
        const a = this.agents.get(agentId);
        if (a) { a.status = 'error'; a.process = null; a.updatedAt = new Date(); }
      });
      agent.process = child;
    };

    const pty = await getPty();
    let useSpawn = true;
    if (pty) {
      try {
        const ptyProcess = pty.spawn(cliPath, cliArgs, {
          name: 'xterm-256color',
          cols: 120,
          rows: 30,
          cwd: process.cwd(),
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            FORCE_COLOR: '0',
            PYTHONUNBUFFERED: '1'
          }
        });
        this.addLog(agentId, `[${new Date().toISOString()}] Process started (PID ${ptyProcess.pid}). Claude Code output below…`);
        ptyProcess.onData((data: string) => this.addLog(agentId, data));
        ptyProcess.onExit(({ exitCode, signal }) => this.applyExitState(agentId, exitCode, signal));
        agent.process = ptyProcess;
        useSpawn = false;
      } catch (ptyErr: any) {
        this.addLog(agentId, `[${new Date().toISOString()}] PTY spawn failed (${ptyErr?.message ?? ptyErr}). Falling back to direct spawn.`);
      }
    }

    if (useSpawn) {
      const child = spawn(cliPath, cliArgs, {
        // Print mode can hang/suppress output with open stdin in non-TTY daemons.
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: isWindows,
        cwd: process.cwd(),
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });
      setupPipeChild(child);
    }

    agent.status = 'running';
    agent.phaseDescription = null;
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

    const prompt = `/workflow work on Jira issue ${agent.issueKey}`;
    agent.awaitingApproval = false;
    agent.phaseDescription = null;
    await this.runClaude(agentId, prompt);
  }

  async approveAndContinue(agentId: string, approvalMessage = 'Approved. Continue with phases 2-8.'): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }
    if (!agent.sessionId) {
      throw new Error('Cannot continue: missing Claude session id');
    }
    if (agent.process) {
      throw new Error('Agent is already running');
    }

    agent.awaitingApproval = false;
    agent.phaseDescription = null;
    await this.runClaude(agentId, approvalMessage, agent.sessionId);
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

    agent.awaitingApproval = false;
    agent.phaseDescription = null;
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

    for (const line of String(message).split(/\r?\n/)) {
      this.parseClaudeLogLine(agent, line);
    }

    agent.logs.push(message);
    agent.updatedAt = new Date();
    try {
      this.onLogLine?.(agentId, String(message));
    } catch {
      // Never break runtime flow due to log listener errors.
    }

    // Keep only last 1000 log entries to prevent memory issues
    if (agent.logs.length > 1000) {
      agent.logs = agent.logs.slice(-1000);
    }
  }
}
