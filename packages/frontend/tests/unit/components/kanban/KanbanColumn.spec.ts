import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanColumn from '../../../../src/components/kanban/KanbanColumn.vue'
import IssueCard from '../../../../src/components/kanban/IssueCard.vue'
import type { Issue } from '../../../../src/types/issue'

describe('KanbanColumn', () => {
  const mockIssues: Issue[] = [
    {
      key: 'PROJ-1',
      summary: 'First issue',
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
      summary: 'Second issue',
      description: '',
      status: 'To Do',
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

  it('renders column header with status name', () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'To Do',
        issues: mockIssues
      }
    })

    expect(wrapper.find('[data-testid="column-header"]').text()).toContain('To Do')
  })

  it('displays issue count badge', () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'To Do',
        issues: mockIssues
      }
    })

    const badge = wrapper.find('[data-testid="issue-count"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('2')
  })

  it('renders issue cards for all issues', () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'To Do',
        issues: mockIssues
      }
    })

    const cards = wrapper.findAllComponents(IssueCard)
    expect(cards).toHaveLength(2)
  })

  it('shows empty state when no issues', () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'To Do',
        issues: []
      }
    })

    const emptyState = wrapper.find('[data-testid="empty-column"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('No issues')
  })

  it('handles dragover event and shows drop zone', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'In Progress',
        issues: []
      }
    })

    const dropZone = wrapper.find('[data-testid="drop-zone"]')

    await dropZone.trigger('dragover')

    // Should prevent default to allow drop
    expect(wrapper.vm.isDragOver).toBe(true)
  })

  it('handles dragleave event and hides drop zone', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'In Progress',
        issues: []
      }
    })

    const dropZone = wrapper.find('[data-testid="drop-zone"]')

    await dropZone.trigger('dragover')
    expect(wrapper.vm.isDragOver).toBe(true)

    await dropZone.trigger('dragleave')
    expect(wrapper.vm.isDragOver).toBe(false)
  })

  it('emits drop event with issue key and new status', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'In Progress',
        issues: []
      }
    })

    const dropZone = wrapper.find('[data-testid="drop-zone"]')
    const dragData = JSON.stringify({
      issueKey: 'PROJ-42',
      sourceStatus: 'To Do'
    })

    // Create a proper DataTransfer mock
    const dataTransfer = {
      getData: vi.fn(() => dragData),
      setData: vi.fn(),
      effectAllowed: 'move',
      dropEffect: 'move'
    }

    await dropZone.trigger('drop', {
      dataTransfer
    })

    expect(wrapper.emitted('drop')).toBeTruthy()
    expect(wrapper.emitted('drop')?.[0]).toEqual(['PROJ-42', 'In Progress'])
  })

  it('does not emit drop event when dropping in same column', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'To Do',
        issues: mockIssues
      }
    })

    const dropZone = wrapper.find('[data-testid="drop-zone"]')
    const dragData = JSON.stringify({
      issueKey: 'PROJ-1',
      sourceStatus: 'To Do'
    })

    const dataTransfer = {
      getData: vi.fn(() => dragData),
      setData: vi.fn(),
      effectAllowed: 'move',
      dropEffect: 'move'
    }

    await dropZone.trigger('drop', {
      dataTransfer
    })

    // Should not emit when source and target are the same
    expect(wrapper.emitted('drop')).toBeFalsy()
  })

  it('applies drag-over styling when dragging over', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        status: 'In Progress',
        issues: []
      }
    })

    const dropZone = wrapper.find('[data-testid="drop-zone"]')

    await dropZone.trigger('dragover')

    // Check for drag-over class
    expect(dropZone.classes()).toContain('drag-over')
  })
})
