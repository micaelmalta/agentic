import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Issue } from '../types/issue'
import { useJiraMetaStore } from './jiraMeta'

export const useIssuesStore = defineStore('issues', () => {
  const issues = ref<Issue[]>([])
  const selectedIssueKey = ref<string | null>(null)
  const boardIssuesLoading = ref(false)

  // Computed: Group issues by status
  const issuesByStatus = computed(() => {
    const grouped: Record<string, Issue[]> = {
      'To Do': [],
      'In Progress': [],
      'In Code Review': [],
      'Done': []
    }

    issues.value.forEach(issue => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue)
      }
    })

    return grouped
  })

  // Fetch board issues (uses selected board ID from jiraMeta store when set)
  async function fetchBoardIssues() {
    boardIssuesLoading.value = true
    try {
      const jiraMeta = useJiraMetaStore()
      const boardId = jiraMeta.selectedBoardId
      const url = boardId ? `/api/jira/board?boardId=${encodeURIComponent(boardId)}` : '/api/jira/board'
      const response = await fetch(url)
      const data = await response.json()
      if (!response.ok || !Array.isArray(data)) {
        issues.value = []
        return
      }
      issues.value = data.map((issue: any) => ({
        ...issue,
        updatedAt: new Date(issue.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to fetch board issues:', error)
      issues.value = []
    } finally {
      boardIssuesLoading.value = false
    }
  }

  // Update issue locally
  function updateIssue(issueKey: string, updates: Partial<Issue>) {
    const issue = issues.value.find(i => i.key === issueKey)
    if (issue) {
      Object.assign(issue, updates, { updatedAt: new Date() })
    }
  }

  // Transition issue status (with API call)
  async function transitionIssue(issueKey: string, newStatus: string) {
    const issue = issues.value.find(i => i.key === issueKey)
    if (!issue) return

    const oldStatus = issue.status

    // Optimistically update UI
    issue.status = newStatus
    issue.updatedAt = new Date()

    try {
      const response = await fetch(`/api/jira/issues/${issueKey}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`Failed to transition: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to transition issue:', error)
      // Revert on failure
      issue.status = oldStatus
      issue.updatedAt = new Date()
      throw error
    }
  }

  // Handle WebSocket updates
  function handleIssueUpdate(payload: { issueKey: string; updates: Partial<Issue> }) {
    updateIssue(payload.issueKey, payload.updates)
  }

  function selectIssue(issueKey: string | null) {
    selectedIssueKey.value = issueKey
  }

  // Assign issue to agent. Returns { startFailed?, startError? } when assign succeeded but starting the agent failed.
  async function assignToAgent(issueKey: string, agentId: string): Promise<{ startFailed?: boolean; startError?: string } | void> {
    const issue = issues.value.find(i => i.key === issueKey)
    if (!issue) return

    // Optimistically update UI
    issue.agentId = agentId
    issue.updatedAt = new Date()

    const response = await fetch(`/api/agents/${agentId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueKey })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      issue.agentId = undefined
      throw new Error(err.error || 'Failed to assign')
    }

    const data = await response.json().catch(() => ({}))
    return data
  }

  // Unassign agent from issue
  async function unassignAgent(issueKey: string) {
    const issue = issues.value.find(i => i.key === issueKey)
    if (!issue) return

    const oldAgentId = issue.agentId

    // Optimistically update UI
    issue.agentId = undefined
    issue.updatedAt = new Date()

    try {
      await fetch(`/api/jira/issues/${issueKey}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Failed to unassign agent:', error)
      // Revert on failure
      issue.agentId = oldAgentId
      throw error
    }
  }

  return {
    issues,
    selectedIssueKey,
    boardIssuesLoading,
    issuesByStatus,
    fetchBoardIssues,
    updateIssue,
    transitionIssue,
    handleIssueUpdate,
    selectIssue,
    assignToAgent,
    unassignAgent
  }
})
