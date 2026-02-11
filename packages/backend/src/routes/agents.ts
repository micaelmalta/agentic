import { Router } from 'express';
import type { AgentManager } from '../services/agent-manager.js';
import type { WSServer } from '../websocket/server.js';
import type { JiraService } from '../services/jira-service.js';

export function createAgentRoutes(agentManager: AgentManager, wsServer: WSServer, jiraService: JiraService): Router {
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

  // GET /api/agents - List all agents (serialized with processAlive/pid)
  router.get('/', (req, res) => {
    const agents = agentManager.listAgents();
    res.json(agents.map((a) => agentManager.serializeAgent(a)));
  });

  // GET /api/agents/:id/logs - Get agent logs (must be before GET /:id)
  router.get('/:id/logs', (req, res) => {
    const agent = agentManager.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ logs: agent.logs });
  });

  // GET /api/agents/:id - Get specific agent (serialized with processAlive/pid)
  router.get('/:id', (req, res) => {
    const agent = agentManager.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agentManager.serializeAgent(agent));
  });

  // POST /api/agents/:id/assign - Assign issue to agent and auto-start if idle
  router.post('/:id/assign', async (req, res) => {
    try {
      const { issueKey } = req.body;

      if (!issueKey) {
        return res.status(400).json({ error: 'issueKey is required' });
      }

      await agentManager.assignIssue(req.params.id, issueKey);
      const agent = agentManager.getAgent(req.params.id);

      if (agent) {
        // Update the issue with the agentId (in-memory cache)
        await jiraService.updateIssueAgentId(issueKey, req.params.id);

        // Auto-start agent so it actually runs the workflow (uses CLAUDE_CLI_PATH)
        let startError: string | undefined;
        if (agent.status === 'idle') {
          try {
            await agentManager.startAgent(req.params.id);
          } catch (startErr: any) {
            startError = startErr.message || String(startErr);
            console.error(`Failed to start agent ${req.params.id} after assign:`, startError);
          }
        }

        const updatedAgent = agentManager.getAgent(req.params.id);
        if (updatedAgent) {
          wsServer.broadcastAgentUpdate(updatedAgent);
        }
        wsServer.broadcastIssueUpdate(issueKey, { agentId: req.params.id });

        return res.json({
          success: true,
          ...(startError && { startFailed: true, startError })
        });
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

  // POST /api/agents/:id/approve - Continue a waiting agent via --resume
  router.post('/:id/approve', async (req, res) => {
    try {
      const { message } = req.body || {};
      await agentManager.approveAndContinue(
        req.params.id,
        typeof message === 'string' && message.trim().length > 0
          ? message.trim()
          : undefined
      );
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
      const agent = agentManager.getAgent(req.params.id);
      if (agent) {
        wsServer.broadcastAgentStopped(agent);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
