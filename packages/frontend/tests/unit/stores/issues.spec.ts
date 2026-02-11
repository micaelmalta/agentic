import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIssuesStore } from '../../../src/stores/issues'
import type { Issue } from '../../../src/types/issue'

describe('Issues Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock fetch globally
    global.fetch = vi.fn()
  })

  describe('fetchBoardIssues', () => {
    it('should fetch issues from API and populate store', async () => {
      const mockIssues = [
        {
          key: 'PROJ-1',
          summary: 'Test Issue',
          description: 'Description',
          status: 'To Do',
          priority: 'High',
          issueType: 'Story',
          assignee: null,
          reporter: {
            accountId: 'user1',
            displayName: 'John Doe',
            emailAddress: 'john@example.com'
          },
          labels: ['backend'],
          sprint: null,
          agentId: null,
          manualMode: false,
          updatedAt: '2026-02-10T12:00:00Z'
        }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues
      } as Response)

      const store = useIssuesStore()
      await store.fetchBoardIssues()

      expect(fetch).toHaveBeenCalledWith('/api/jira/board')
      expect(store.issues).toHaveLength(1)
      expect(store.issues[0].key).toBe('PROJ-1')
      expect(store.issues[0].updatedAt).toBeInstanceOf(Date)
    })

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const store = useIssuesStore()
      await store.fetchBoardIssues()

      expect(store.issues).toHaveLength(0)
    })
  })

  describe('updateIssue', () => {
    it('should update issue in store', () => {
      const store = useIssuesStore()
      const issue: Issue = {
        key: 'PROJ-1',
        summary: 'Test',
        description: '',
        status: 'To Do',
        priority: 'High',
        issueType: 'Story',
        assignee: null,
        reporter: {
          accountId: 'user1',
          displayName: 'John',
          emailAddress: 'john@example.com'
        },
        labels: [],
        sprint: null,
        agentId: null,
        manualMode: false,
        updatedAt: new Date()
      }
      store.issues.push(issue)

      store.updateIssue('PROJ-1', { status: 'In Progress' })

      expect(store.issues[0].status).toBe('In Progress')
    })

    it('should not error if issue not found', () => {
      const store = useIssuesStore()
      expect(() => {
        store.updateIssue('PROJ-999', { status: 'Done' })
      }).not.toThrow()
    })
  })

  describe('transitionIssue', () => {
    it('should call API to transition issue status', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const store = useIssuesStore()
      const issue: Issue = {
        key: 'PROJ-1',
        summary: 'Test',
        description: '',
        status: 'To Do',
        priority: 'High',
        issueType: 'Story',
        assignee: null,
        reporter: {
          accountId: 'user1',
          displayName: 'John',
          emailAddress: 'john@example.com'
        },
        labels: [],
        sprint: null,
        agentId: null,
        manualMode: false,
        updatedAt: new Date()
      }
      store.issues.push(issue)

      await store.transitionIssue('PROJ-1', 'In Progress')

      expect(fetch).toHaveBeenCalledWith('/api/jira/issues/PROJ-1/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress' })
      })
      expect(store.issues[0].status).toBe('In Progress')
    })

    it('should revert status on API failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('API error'))

      const store = useIssuesStore()
      const issue: Issue = {
        key: 'PROJ-1',
        summary: 'Test',
        description: '',
        status: 'To Do',
        priority: 'High',
        issueType: 'Story',
        assignee: null,
        reporter: {
          accountId: 'user1',
          displayName: 'John',
          emailAddress: 'john@example.com'
        },
        labels: [],
        sprint: null,
        agentId: null,
        manualMode: false,
        updatedAt: new Date()
      }
      store.issues.push(issue)

      await store.transitionIssue('PROJ-1', 'In Progress')

      // Should stay in original status
      expect(store.issues[0].status).toBe('To Do')
    })
  })

  describe('computed properties', () => {
    it('should filter issues by status column', () => {
      const store = useIssuesStore()
      const issues: Issue[] = [
        {
          key: 'PROJ-1',
          summary: 'Test 1',
          description: '',
          status: 'To Do',
          priority: 'High',
          issueType: 'Story',
          assignee: null,
          reporter: {
            accountId: 'user1',
            displayName: 'John',
            emailAddress: 'john@example.com'
          },
          labels: [],
          sprint: null,
          agentId: null,
          manualMode: false,
          updatedAt: new Date()
        },
        {
          key: 'PROJ-2',
          summary: 'Test 2',
          description: '',
          status: 'In Progress',
          priority: 'Medium',
          issueType: 'Bug',
          assignee: null,
          reporter: {
            accountId: 'user1',
            displayName: 'John',
            emailAddress: 'john@example.com'
          },
          labels: [],
          sprint: null,
          agentId: null,
          manualMode: false,
          updatedAt: new Date()
        },
        {
          key: 'PROJ-3',
          summary: 'Test 3',
          description: '',
          status: 'To Do',
          priority: 'Low',
          issueType: 'Story',
          assignee: null,
          reporter: {
            accountId: 'user1',
            displayName: 'John',
            emailAddress: 'john@example.com'
          },
          labels: [],
          sprint: null,
          agentId: null,
          manualMode: false,
          updatedAt: new Date()
        }
      ]
      store.issues.push(...issues)

      expect(store.issuesByStatus['To Do']).toHaveLength(2)
      expect(store.issuesByStatus['In Progress']).toHaveLength(1)
      expect(store.issuesByStatus['Done']).toHaveLength(0)
    })
  })
})
