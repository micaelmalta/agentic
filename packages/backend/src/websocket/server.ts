import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import type { Agent } from '../types/agent.js';
import type { Issue } from '../types/issue.js';
import type { PlanReview } from '../types/plan.js';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WSServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    // Handle incoming messages from clients
    console.log('Received message:', message.type);

    // Echo back for testing
    ws.send(JSON.stringify({
      type: 'ack',
      payload: { original: message.type }
    }));
  }

  // Broadcast events to all connected clients

  broadcastAgentUpdate(agent: Agent): void {
    this.broadcast({
      type: 'agent:update',
      payload: {
        agent: this.serializeAgent(agent)
      }
    });
  }

  broadcastAgentCreated(agent: Agent): void {
    this.broadcast({
      type: 'agent:created',
      payload: {
        agent: this.serializeAgent(agent)
      }
    });
  }

  broadcastAgentStopped(agent: Agent): void {
    this.broadcast({
      type: 'agent:stopped',
      payload: { agent: this.serializeAgent(agent), agentId: agent.id }
    });
  }

  broadcastAgentLog(agentId: string, line: string): void {
    this.broadcast({
      type: 'agent:log',
      payload: {
        agentId,
        line,
        timestamp: new Date().toISOString()
      }
    });
  }

  broadcastIssuesUpdated(issues: Issue[]): void {
    this.broadcast({
      type: 'issues:updated',
      payload: { issues }
    });
  }

  broadcastIssueUpdate(issueKey: string, updates: Partial<Issue>): void {
    this.broadcast({
      type: 'issue:update',
      payload: { issueKey, updates }
    });
  }

  broadcastPlanCreated(plan: PlanReview): void {
    this.broadcast({
      type: 'plan:created',
      payload: { plan }
    });
  }

  broadcastPlanReviewed(planId: string, status: string): void {
    this.broadcast({
      type: 'plan:reviewed',
      payload: { planId, status }
    });
  }

  broadcastChatMessage(agentId: string, message: string, role: 'user' | 'assistant'): void {
    this.broadcast({
      type: 'chat:message',
      payload: { agentId, message, role, timestamp: new Date().toISOString() }
    });
  }

  private broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private serializeAgent(agent: Agent): any {
    // Remove process reference for serialization; add processAlive/pid for verification
    const { process: proc, ...rest } = agent;
    return {
      ...rest,
      processAlive: !!(proc && (proc as any).exitCode == null && !(proc as any).killed),
      pid: proc?.pid ?? null
    };
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    this.clients.forEach(client => client.close());
    this.clients.clear();
    this.wss.close();
  }
}
