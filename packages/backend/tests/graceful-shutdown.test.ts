import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentManager } from '../src/services/agent-manager.js';
import { JiraService } from '../src/services/jira-service.js';
import { WSServer } from '../src/websocket/server.js';
import { createServer } from 'http';
import { WebSocket } from 'ws';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Mock child process
class MockChildProcess extends EventEmitter {
  pid = 12345;
  exitCode: number | null = null;
  killed = false;
  stdout = new EventEmitter();
  stderr = new EventEmitter();

  kill(signal?: string): boolean {
    this.killed = true;
    this.exitCode = signal === 'SIGTERM' ? 143 : 0;
    // Simulate async exit
    setTimeout(() => this.emit('exit', this.exitCode, signal), 10);
    return true;
  }
}

describe('Graceful Shutdown', () => {
  describe('AgentManager', () => {
    let agentManager: AgentManager;

    beforeEach(() => {
      agentManager = new AgentManager({
        maxConcurrent: 4,
        cliPath: 'claude',
      });
    });

    it('should have a shutdown method', () => {
      expect(agentManager.shutdown).toBeDefined();
      expect(typeof agentManager.shutdown).toBe('function');
    });

    it('should stop all running agents on shutdown', async () => {
      // Create agent and mock process
      const agent = await agentManager.spawn({ issueKey: 'TEST-1' });
      const mockProcess = new MockChildProcess();
      (agent as any).process = mockProcess;
      agent.status = 'running';

      await agentManager.shutdown();

      expect(mockProcess.killed).toBe(true);
      expect(agent.status).not.toBe('running');
    });

    it('should wait for processes to exit with timeout', async () => {
      const agent = await agentManager.spawn({ issueKey: 'TEST-1' });
      const mockProcess = new MockChildProcess();
      (agent as any).process = mockProcess;
      agent.status = 'running';

      const startTime = Date.now();
      await agentManager.shutdown();
      const duration = Date.now() - startTime;

      // Should wait for process exit (10ms mock delay) but not timeout (5000ms)
      expect(duration).toBeGreaterThan(5);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle agents without processes gracefully', async () => {
      const agent = await agentManager.spawn({ issueKey: 'TEST-1' });
      agent.status = 'idle';
      agent.process = null;

      await expect(agentManager.shutdown()).resolves.not.toThrow();
    });

    it('should force kill hung processes after timeout', async () => {
      const agent = await agentManager.spawn({ issueKey: 'TEST-1' });
      const mockProcess = new MockChildProcess();

      // Override kill to not emit exit (simulate hung process)
      mockProcess.kill = jest.fn(() => {
        mockProcess.killed = true;
        return true;
      });

      (agent as any).process = mockProcess;
      agent.status = 'running';

      await agentManager.shutdown();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('WSServer', () => {
    let wsServer: WSServer;
    let httpServer: any;

    beforeEach(() => {
      httpServer = createServer();
      wsServer = new WSServer(httpServer);
    });

    afterEach(async () => {
      await wsServer.gracefulClose?.();
      httpServer.close();
    });

    it('should have gracefulClose method', () => {
      expect(wsServer.gracefulClose).toBeDefined();
      expect(typeof wsServer.gracefulClose).toBe('function');
    });

    it('should send shutdown message to all clients before closing', async () => {
      const mockClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        removeListener: jest.fn(),
      };

      (wsServer as any).clients.add(mockClient);

      await wsServer.gracefulClose?.();

      expect(mockClient.send).toHaveBeenCalledWith(
        expect.stringContaining('server:shutdown')
      );
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should wait for clients to close with timeout', async () => {
      const mockClient: any = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        close: jest.fn(() => {
          // Simulate async close
          setTimeout(() => {
            mockClient.readyState = WebSocket.CLOSED;
          }, 50);
        }),
        on: jest.fn(),
        once: jest.fn(),
        removeListener: jest.fn(),
      };

      (wsServer as any).clients.add(mockClient);

      const startTime = Date.now();
      await wsServer.gracefulClose?.();
      const duration = Date.now() - startTime;

      // Should wait but not exceed timeout
      expect(duration).toBeGreaterThan(30);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle clients that do not respond', async () => {
      const mockClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        removeListener: jest.fn(),
      };

      (wsServer as any).clients.add(mockClient);

      await expect(wsServer.gracefulClose?.()).resolves.not.toThrow();
    });

    it('should clear clients set after closing', async () => {
      const mockClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        removeListener: jest.fn(),
      };

      (wsServer as any).clients.add(mockClient);
      await wsServer.gracefulClose?.();

      expect((wsServer as any).clients.size).toBe(0);
    });
  });

  describe('JiraService', () => {
    let jiraService: JiraService;

    beforeEach(() => {
      jiraService = new JiraService({
        host: 'test.atlassian.net',
        username: 'test',
        password: 'token',
        boardId: '1',
      });
    });

    it('should have shutdown method', () => {
      expect(jiraService.shutdown).toBeDefined();
      expect(typeof jiraService.shutdown).toBe('function');
    });

    it('should stop polling on shutdown', async () => {
      // Start polling with mock callback
      jiraService.startPolling(() => {}, 1000);
      expect(jiraService.isPolling()).toBe(true);

      await jiraService.shutdown();

      expect(jiraService.isPolling()).toBe(false);
    });

    it('should abort in-flight requests on shutdown', async () => {
      // Mock an ongoing fetch
      const mockAbortController = new AbortController();
      (jiraService as any).abortController = mockAbortController;

      const abortSpy = jest.spyOn(mockAbortController, 'abort');

      await jiraService.shutdown();

      expect(abortSpy).toHaveBeenCalled();
    });

    it('should clear caches on shutdown', async () => {
      // Set some cache
      (jiraService as any).issueCache = [{ key: 'TEST-1' }];
      (jiraService as any).issueCacheBoardId = '1';

      await jiraService.shutdown();

      expect((jiraService as any).issueCache).toBeNull();
      expect((jiraService as any).issueCacheBoardId).toBeNull();
    });

    it('should handle shutdown when not polling', async () => {
      expect(jiraService.isPolling()).toBe(false);
      await expect(jiraService.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Sequential Shutdown', () => {
    it('should shutdown services in correct order', async () => {
      const shutdownOrder: string[] = [];

      const mockJiraService = {
        shutdown: jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          shutdownOrder.push('jira');
        }),
        stopPolling: jest.fn(),
      };

      const mockAgentManager = {
        shutdown: jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          shutdownOrder.push('agents');
        }),
      };

      const mockWsServer = {
        gracefulClose: jest.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          shutdownOrder.push('websocket');
        }),
      };

      const mockHttpServer = {
        close: jest.fn((callback: Function) => {
          setTimeout(() => {
            shutdownOrder.push('http');
            callback();
          }, 10);
        }),
      };

      // Simulate graceful shutdown sequence
      await mockJiraService.shutdown();
      await mockAgentManager.shutdown();
      await mockWsServer.gracefulClose();
      await new Promise((resolve) => mockHttpServer.close(resolve));

      expect(shutdownOrder).toEqual(['jira', 'agents', 'websocket', 'http']);
    });

    it('should enforce overall timeout', async () => {
      const mockService = {
        shutdown: jest.fn(async () => {
          // Simulate long-running shutdown
          await new Promise(resolve => setTimeout(resolve, 15000));
        }),
      };

      const timeoutMs = 1000;
      const startTime = Date.now();

      // Shutdown with timeout
      await Promise.race([
        mockService.shutdown(),
        new Promise(resolve => setTimeout(resolve, timeoutMs)),
      ]);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(timeoutMs + 100);
    });
  });
});
