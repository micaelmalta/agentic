import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { AgentManager } from './services/agent-manager.js';
import { JiraService } from './services/jira-service.js';
import { WSServer } from './websocket/server.js';
import { createAgentRoutes } from './routes/agents.js';
import { createJiraRoutes } from './routes/jira.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Parse CLAUDE_ADD_DIR: comma- or space-separated list of directories for --add-dir
const addDirRaw = process.env.CLAUDE_ADD_DIR || '';
const addDir = addDirRaw
  ? addDirRaw.split(/[,\s]+/).map((d) => d.trim()).filter(Boolean)
  : undefined;

// Initialize services
const agentManager = new AgentManager({
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_AGENTS || '4'),
  cliPath: process.env.CLAUDE_CLI_PATH || 'claude',
  addDir: addDir?.length ? addDir : undefined
});

const jiraService = new JiraService({
  host: process.env.JIRA_HOST || '',
  username: process.env.JIRA_USERNAME || '',
  password: process.env.JIRA_API_TOKEN || '',
  boardId: process.env.JIRA_BOARD_ID || ''
});

// Create Express app
const app = express();
const server = createServer(app);

// Initialize WebSocket server
const wsServer = new WSServer(server);
agentManager.setLogListener((agentId, line) => wsServer.broadcastAgentLog(agentId, line));

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agents: agentManager.listAgents().length,
    wsClients: wsServer.getClientCount()
  });
});

// API routes
app.use('/api/agents', createAgentRoutes(agentManager, wsServer, jiraService));
app.use('/api/jira', createJiraRoutes(jiraService, wsServer));
app.use('/api/chat', chatRoutes);

// Start Jira polling
jiraService.startPolling((issues) => {
  wsServer.broadcastIssuesUpdated(issues);
}, parseInt(process.env.JIRA_POLL_INTERVAL || '15000'));

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Agentic Dashboard Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}/ws`);
  console.log(`👥 Max concurrent agents: ${process.env.MAX_CONCURRENT_AGENTS || '4'}`);
  console.log(`🔄 Jira polling interval: ${process.env.JIRA_POLL_INTERVAL || '15000'}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  jiraService.stopPolling();
  wsServer.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, agentManager, jiraService, wsServer };
