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

// Initialize services
const agentManager = new AgentManager({
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_AGENTS || '4'),
  cliPath: process.env.CLAUDE_CLI_PATH || 'claude'
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
app.use('/api/agents', createAgentRoutes(agentManager, wsServer));
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
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received, shutting down gracefully...`);

  // Overall timeout of 10 seconds
  const shutdownTimeout = setTimeout(() => {
    console.error('⚠️  Graceful shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10000);

  try {
    // Sequential shutdown: Jira → Agents → WebSocket → HTTP Server

    // 1. Stop Jira polling and abort requests
    await jiraService.shutdown();

    // 2. Stop all running agents
    await agentManager.shutdown();

    // 3. Close WebSocket connections gracefully
    await wsServer.gracefulClose();

    // 4. Close HTTP server
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('Error closing HTTP server:', err);
        } else {
          console.log('✅ HTTP server closed');
        }
        resolve();
      });
    });

    clearTimeout(shutdownTimeout);
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, agentManager, jiraService, wsServer };
