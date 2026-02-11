import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AgentManager } from '../src/services/agent-manager.js';
import type { Agent, AgentStatus } from '../src/types/agent.js';

describe('AgentManager', () => {
  let manager: AgentManager;

  beforeEach(() => {
    manager = new AgentManager({ maxConcurrent: 2, cliPath: 'claude' });
  });

  describe('spawn', () => {
    it('should create a new agent with idle status', async () => {
      const agent = await manager.spawn();

      expect(agent).toBeDefined();
      expect(agent.id).toMatch(/^agent-\d+$/);
      expect(agent.status).toBe('idle');
      expect(agent.issueKey).toBeNull();
      expect(agent.phase).toBeNull();
      expect(agent.progress).toBe(0);
      expect(agent.logs).toEqual([]);
      expect(agent.createdAt).toBeInstanceOf(Date);
    });

    it('should create agent with issue assignment', async () => {
      const agent = await manager.spawn({ issueKey: 'PROJ-123' });

      expect(agent.issueKey).toBe('PROJ-123');
      expect(agent.status).toBe('idle');
    });

    it('should respect max concurrent limit', async () => {
      await manager.spawn({ issueKey: 'PROJ-1', autoStart: true });
      await manager.spawn({ issueKey: 'PROJ-2', autoStart: true });

      await expect(
        manager.spawn({ issueKey: 'PROJ-3', autoStart: true })
      ).rejects.toThrow('Max concurrent agents reached');
    });

    it('should auto-start agent if autoStart is true', async () => {
      const agent = await manager.spawn({
        issueKey: 'PROJ-123',
        autoStart: true
      });

      expect(agent.status).toBe('running');
      expect(agent.process).toBeDefined();
    });
  });

  describe('getAgent', () => {
    it('should return agent by id', async () => {
      const created = await manager.spawn();
      const found = manager.getAgent(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent agent', () => {
      const found = manager.getAgent('agent-999');
      expect(found).toBeUndefined();
    });
  });

  describe('listAgents', () => {
    it('should return all agents', async () => {
      await manager.spawn();
      await manager.spawn();

      const agents = manager.listAgents();
      expect(agents).toHaveLength(2);
    });

    it('should return empty array when no agents', () => {
      const agents = manager.listAgents();
      expect(agents).toEqual([]);
    });
  });

  describe('assignIssue', () => {
    it('should assign issue to agent', async () => {
      const agent = await manager.spawn();
      await manager.assignIssue(agent.id, 'PROJ-456');

      const updated = manager.getAgent(agent.id);
      expect(updated?.issueKey).toBe('PROJ-456');
    });

    it('should throw error for non-existent agent', async () => {
      await expect(
        manager.assignIssue('agent-999', 'PROJ-456')
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('startAgent', () => {
    it('should start agent and spawn process', async () => {
      const agent = await manager.spawn({ issueKey: 'PROJ-123' });
      await manager.startAgent(agent.id);

      const updated = manager.getAgent(agent.id);
      expect(updated?.status).toBe('running');
      expect(updated?.process).toBeDefined();
    });

    it('should throw if no issue assigned', async () => {
      const agent = await manager.spawn();

      await expect(manager.startAgent(agent.id)).rejects.toThrow(
        'Cannot start agent without assigned issue'
      );
    });
  });

  describe('stopAgent', () => {
    it('should stop agent and kill process', async () => {
      const agent = await manager.spawn({
        issueKey: 'PROJ-123',
        autoStart: true
      });
      await manager.stopAgent(agent.id);

      const updated = manager.getAgent(agent.id);
      expect(updated?.status).toBe('idle');
      expect(updated?.process).toBeNull();
    });

    it('should throw error for non-existent agent', async () => {
      await expect(manager.stopAgent('agent-999')).rejects.toThrow(
        'Agent not found'
      );
    });
  });

  describe('updateAgentStatus', () => {
    it('should update agent status and metadata', async () => {
      const agent = await manager.spawn();

      manager.updateAgentStatus(agent.id, {
        status: 'running',
        phase: 3,
        phaseDescription: 'Implementing feature',
        progress: 50,
        skill: 'developer'
      });

      const updated = manager.getAgent(agent.id);
      expect(updated?.status).toBe('running');
      expect(updated?.phase).toBe(3);
      expect(updated?.phaseDescription).toBe('Implementing feature');
      expect(updated?.progress).toBe(50);
      expect(updated?.skill).toBe('developer');
    });
  });

  describe('addLog', () => {
    it('should append log to agent logs', async () => {
      const agent = await manager.spawn();

      manager.addLog(agent.id, 'Test log entry');
      manager.addLog(agent.id, 'Another entry');

      const updated = manager.getAgent(agent.id);
      expect(updated?.logs).toHaveLength(2);
      expect(updated?.logs[0]).toBe('Test log entry');
      expect(updated?.logs[1]).toBe('Another entry');
    });
  });
});
