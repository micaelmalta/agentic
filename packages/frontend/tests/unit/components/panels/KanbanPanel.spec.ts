import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import KanbanPanel from '../../../../src/components/panels/KanbanPanel.vue'
import KanbanColumn from '../../../../src/components/kanban/KanbanColumn.vue'
import { useIssuesStore } from '../../../../src/stores/issues'

describe('KanbanPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.fetch = vi.fn()
  })

  it('renders panel header with title', () => {
    const wrapper = mount(KanbanPanel)

    expect(wrapper.find('[data-testid="panel-header"]').text()).toContain('Kanban Board')
  })

  it('renders four status columns', () => {
    const wrapper = mount(KanbanPanel)

    const columns = wrapper.findAllComponents(KanbanColumn)
    expect(columns).toHaveLength(4)

    // Check column statuses
    expect(columns[0].props('status')).toBe('To Do')
    expect(columns[1].props('status')).toBe('In Progress')
    expect(columns[2].props('status')).toBe('In Code Review')
    expect(columns[3].props('status')).toBe('Done')
  })

  it('fetches board issues on mount', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    mount(KanbanPanel)

    // Allow component to mount and call onMounted
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(fetch).toHaveBeenCalledWith('/api/jira/board')
  })

  it('distributes issues to correct columns by status', () => {
    const store = useIssuesStore()
    store.issues = [
      {
        key: 'PROJ-1',
        summary: 'Issue 1',
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
        summary: 'Issue 2',
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
      }
    ]

    const wrapper = mount(KanbanPanel)
    const columns = wrapper.findAllComponents(KanbanColumn)

    expect(columns[0].props('issues')).toHaveLength(1)
    expect(columns[1].props('issues')).toHaveLength(1)
    expect(columns[2].props('issues')).toHaveLength(0)
    expect(columns[3].props('issues')).toHaveLength(0)
  })

  it('calls transitionIssue when card is dropped in new column', async () => {
    const store = useIssuesStore()
    const transitionSpy = vi.spyOn(store, 'transitionIssue')

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    const wrapper = mount(KanbanPanel)
    const columns = wrapper.findAllComponents(KanbanColumn)

    // Simulate drop event on second column (In Progress)
    await columns[1].vm.$emit('drop', 'PROJ-42', 'In Progress')

    expect(transitionSpy).toHaveBeenCalledWith('PROJ-42', 'In Progress')
  })

  it('handles transition errors gracefully', async () => {
    const store = useIssuesStore()

    // Mock initial fetch to succeed
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        key: 'PROJ-1',
        summary: 'Issue 1',
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
        updatedAt: new Date().toISOString()
      }]
    } as Response)

    const wrapper = mount(KanbanPanel)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Now mock the transition API to fail
    vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'))

    const columns = wrapper.findAllComponents(KanbanColumn)

    // Trigger drop - should not throw
    await columns[1].vm.$emit('drop', 'PROJ-1', 'In Progress')

    // Wait for the transition to complete
    await new Promise(resolve => setTimeout(resolve, 0))

    // Issue should remain in original status (optimistic update reverted)
    expect(store.issues[0].status).toBe('To Do')
  })

  it('has horizontal scrollable layout', () => {
    const wrapper = mount(KanbanPanel)

    const boardContainer = wrapper.find('[data-testid="board-container"]')
    expect(boardContainer.exists()).toBe(true)
    expect(boardContainer.classes()).toContain('overflow-x-auto')
  })
})
