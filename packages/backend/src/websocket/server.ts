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

  broadcastAgentStopped(agentId: string): void {
    this.broadcast({
      type: 'agent:stopped',
      payload: { agentId }
    });
  }

  broadcastIssuesUpdated(issues: Issue[]): void {
    this.broadcast({
      type: 'issues:updated',
      payload: { issues }
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
    // Remove process reference for serialization
    const { process, ...serializable } = agent;
    return serializable;
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close(): void {
    this.clients.forEach(client => client.close());
    this.clients.clear();
    this.wss.close();
  }

  /**
   * Gracefully close WebSocket server by notifying clients before disconnecting.
   * Sends shutdown message to all clients and waits up to 2 seconds for them to close.
   */
  async gracefulClose(): Promise<void> {
    if (this.clients.size === 0) {
      this.wss.close();
      return;
    }

    console.log(`🔌 Gracefully closing ${this.clients.size} WebSocket connection(s)...`);

    // Send shutdown notification to all clients
    const shutdownMessage: WebSocketMessage = {
      type: 'server:shutdown',
      payload: {
        message: 'Server is shutting down',
        timestamp: new Date().toISOString()
      }
    };

    this.broadcast(shutdownMessage);

    // Wait for clients to close with 2s timeout
    const closePromises = Array.from(this.clients).map((client) => {
      return new Promise<void>((resolve) => {
        // Close immediately if already closing/closed
        if (client.readyState === WebSocket.CLOSING || client.readyState === WebSocket.CLOSED) {
          resolve();
          return;
        }

        // Set up close listener
        const closeHandler = () => {
          resolve();
        };

        client.once('close', closeHandler);

        // Close the connection
        try {
          client.close();
        } catch (error) {
          // Client may have already disconnected
          resolve();
        }

        // Timeout after 2s
        setTimeout(() => {
          client.removeListener('close', closeHandler);
          resolve();
        }, 2000);
      });
    });

    await Promise.all(closePromises);

    // Clear clients set and close server
    this.clients.clear();
    this.wss.close();

    console.log('✅ WebSocket server closed');
  }
}
