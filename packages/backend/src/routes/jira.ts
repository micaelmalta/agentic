import { Router } from 'express';
import type { JiraService } from '../services/jira-service.js';
import type { WSServer } from '../websocket/server.js';

export function createJiraRoutes(jiraService: JiraService, wsServer: WSServer): Router {
  const router = Router();

  // GET /api/jira/board - Get board issues
  router.get('/board', async (req, res) => {
    try {
      const issues = await jiraService.getBoardIssues();
      res.json(issues);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/jira/issues/:key - Get specific issue
  router.get('/issues/:key', async (req, res) => {
    try {
      const issue = await jiraService.getIssue(req.params.key);
      res.json(issue);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // GET /api/jira/issues/:key/transitions - Get available transitions
  router.get('/issues/:key/transitions', async (req, res) => {
    try {
      const transitions = await jiraService.getAvailableTransitions(req.params.key);
      res.json(transitions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/jira/issues/:key/transition - Transition issue
  router.post('/issues/:key/transition', async (req, res) => {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      await jiraService.transitionIssue(req.params.key, status);

      // Broadcast update
      const issues = await jiraService.getBoardIssues();
      wsServer.broadcastIssuesUpdated(issues);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/jira/issues/:key/assign - Assign issue
  router.post('/issues/:key/assign', async (req, res) => {
    try {
      const { accountId } = req.body;

      if (!accountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }

      await jiraService.assignIssue(req.params.key, accountId);

      // Broadcast update
      const issues = await jiraService.getBoardIssues();
      wsServer.broadcastIssuesUpdated(issues);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
