import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Issue } from '../types/issue'

export const useIssuesStore = defineStore('issues', () => {
  const issues = ref<Issue[]>([])
  const selectedIssueKey = ref<string | null>(null)

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

  // Fetch all board issues
  async function fetchBoardIssues() {
    try {
      const response = await fetch('/api/jira/board')
      const data = await response.json()
      issues.value = data.map((issue: any) => ({
        ...issue,
        updatedAt: new Date(issue.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to fetch board issues:', error)
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
      await fetch(`/api/jira/issues/${issueKey}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Failed to transition issue:', error)
      // Revert on failure
      issue.status = oldStatus
    }
  }

  // Handle WebSocket updates
  function handleIssueUpdate(payload: { issueKey: string; updates: Partial<Issue> }) {
    updateIssue(payload.issueKey, payload.updates)
  }

  function selectIssue(issueKey: string | null) {
    selectedIssueKey.value = issueKey
  }

  return {
    issues,
    selectedIssueKey,
    issuesByStatus,
    fetchBoardIssues,
    updateIssue,
    transitionIssue,
    handleIssueUpdate,
    selectIssue
  }
})
