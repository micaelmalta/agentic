import { Router } from 'express';
import type { AgentManager } from '../services/agent-manager.js';
import type { WSServer } from '../websocket/server.js';

export function createAgentRoutes(agentManager: AgentManager, wsServer: WSServer): Router {
  const router = Router();

  // POST /api/agents - Spawn new agent
  router.post('/', async (req, res) => {
    try {
      const { issueKey, autoStart } = req.body;

      const agent = await agentManager.spawn({ issueKey, autoStart });
      wsServer.broadcastAgentCreated(agent);

      res.status(201).json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/agents - List all agents
  router.get('/', (req, res) => {
    const agents = agentManager.listAgents();
    res.json(agents);
  });

  // GET /api/agents/:id - Get specific agent
  router.get('/:id', (req, res) => {
    const agent = agentManager.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  });

  // POST /api/agents/:id/assign - Assign issue to agent
  router.post('/:id/assign', async (req, res) => {
    try {
      const { issueKey } = req.body;

      if (!issueKey) {
        return res.status(400).json({ error: 'issueKey is required' });
      }

      await agentManager.assignIssue(req.params.id, issueKey);
      const agent = agentManager.getAgent(req.params.id);

      if (agent) {
        wsServer.broadcastAgentUpdate(agent);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/agents/:id/start - Start agent
  router.post('/:id/start', async (req, res) => {
    try {
      await agentManager.startAgent(req.params.id);
      const agent = agentManager.getAgent(req.params.id);

      if (agent) {
        wsServer.broadcastAgentUpdate(agent);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/agents/:id/stop - Stop agent
  router.post('/:id/stop', async (req, res) => {
    try {
      await agentManager.stopAgent(req.params.id);
      wsServer.broadcastAgentStopped(req.params.id);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/agents/:id/logs - Get agent logs
  router.get('/:id/logs', (req, res) => {
    const agent = agentManager.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ logs: agent.logs });
  });

  return router;
}
