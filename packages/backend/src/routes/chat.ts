import { Router, Request, Response } from 'express'

const router = Router()

/**
 * POST /api/chat
 * Handle chat messages from the frontend orchestrator interface
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { agentId, content } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' })
    }

    // Log the received message
    console.log(`[Chat] Received message${agentId ? ` for agent ${agentId}` : ''}: ${content}`)

    // Parse commands (basic command routing)
    const command = content.trim().toLowerCase()

    let response: any = {
      id: `msg-${Date.now()}`,
      type: 'system',
      content: '',
      timestamp: new Date()
    }

    // Handle different commands
    if (command === '/status') {
      response.content = 'System status: All services operational\n• Agents: 0 active\n• Issues: Connected to Jira\n• WebSocket: Connected'
    } else if (command === '/plan') {
      response.content = 'To create a plan, use: /plan <issue-key>\nExample: /plan PROJ-42'
    } else if (command === '/execute') {
      response.content = 'Execution requires an active plan. Create a plan first with /plan.'
    } else if (command === '/summarize') {
      response.content = 'No completed work to summarize yet.'
    } else if (command === '/archive') {
      response.content = 'No completed work to archive yet.'
    } else if (command.startsWith('/help')) {
      response.content = `Available commands:
• /status — Check system state
• /plan <issue-key> — Create implementation plan
• /execute — Start execution
• /summarize — Generate summary
• /archive — Archive completed work
• /help — Show this help

You can also use natural language to:
• Ask about agent status
• Assign issues to agents
• Get summaries of work`
    } else if (command.startsWith('assign ')) {
      // Parse: assign PROJ-42 or assign PROJ-42 to agent-01
      const parts = content.split(' ').filter(p => p)
      if (parts.length >= 2) {
        const issueKey = parts[1]
        const agentSpec = parts.length > 3 ? parts[3] : 'next available agent'
        response.content = `To assign ${issueKey} to ${agentSpec}, use the "+ Agent" button first to spawn an agent, then right-click the Kanban card to assign it.`
      } else {
        response.content = 'Usage: assign <issue-key> [to <agent-id>]\nExample: assign PROJ-42\nExample: assign PROJ-42 to agent-01'
      }
    } else {
      // General response for unrecognized input
      response.content = `I received: "${content}"\n\nI'm the orchestrator assistant. Try /help to see available commands, or ask me about agents and issues.`
    }

    res.json(response)
  } catch (error) {
    console.error('[Chat] Error processing message:', error)
    res.status(500).json({ error: 'Failed to process chat message' })
  }
})

export default router
