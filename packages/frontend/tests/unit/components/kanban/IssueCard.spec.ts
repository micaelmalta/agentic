import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IssueCard from '../../../../src/components/kanban/IssueCard.vue'
import type { Issue } from '../../../../src/types/issue'

describe('IssueCard', () => {
  const mockIssue: Issue = {
    key: 'PROJ-42',
    summary: 'Implement user authentication',
    description: 'Add JWT-based auth',
    status: 'To Do',
    priority: 'High',
    issueType: 'Story',
    assignee: {
      accountId: 'user1',
      displayName: 'John Doe',
      emailAddress: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.jpg'
    },
    reporter: {
      accountId: 'user2',
      displayName: 'Jane Smith',
      emailAddress: 'jane@example.com'
    },
    labels: ['frontend', 'auth'],
    sprint: 'Sprint 12',
    agentId: 'agent-01',
    manualMode: false,
    updatedAt: new Date()
  }

  it('displays issue key', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    expect(wrapper.text()).toContain('PROJ-42')
  })

  it('displays issue summary', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    expect(wrapper.text()).toContain('Implement user authentication')
  })

  it('displays priority icon for High priority', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    // Should have a priority indicator
    const priorityEl = wrapper.find('[data-testid="priority-icon"]')
    expect(priorityEl.exists()).toBe(true)
  })

  it('shows assignee avatar and name when assignee exists', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    expect(wrapper.text()).toContain('John Doe')
    const avatar = wrapper.find('[data-testid="assignee-avatar"]')
    expect(avatar.exists()).toBe(true)
  })

  it('does not show assignee when assignee is null', () => {
    const issueWithoutAssignee = { ...mockIssue, assignee: null }
    const wrapper = mount(IssueCard, {
      props: { issue: issueWithoutAssignee }
    })

    const avatar = wrapper.find('[data-testid="assignee-avatar"]')
    expect(avatar.exists()).toBe(false)
  })

  it('displays labels as tags', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    expect(wrapper.text()).toContain('frontend')
    expect(wrapper.text()).toContain('auth')
  })

  it('shows agent badge when agent is assigned', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    const agentBadge = wrapper.find('[data-testid="agent-badge"]')
    expect(agentBadge.exists()).toBe(true)
    expect(agentBadge.text()).toContain('agent-01')
  })

  it('does not show agent badge when no agent assigned', () => {
    const issueWithoutAgent = { ...mockIssue, agentId: null }
    const wrapper = mount(IssueCard, {
      props: { issue: issueWithoutAgent }
    })

    const agentBadge = wrapper.find('[data-testid="agent-badge"]')
    expect(agentBadge.exists()).toBe(false)
  })

  it('has draggable attribute set to true', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    const card = wrapper.find('[data-testid="issue-card"]')
    expect(card.attributes('draggable')).toBe('true')
  })

  it('shows manual mode lock icon when manualMode is true', () => {
    const manualIssue = { ...mockIssue, manualMode: true }
    const wrapper = mount(IssueCard, {
      props: { issue: manualIssue }
    })

    const lockIcon = wrapper.find('[data-testid="manual-lock"]')
    expect(lockIcon.exists()).toBe(true)
  })

  it('emits click event when card is clicked', async () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockIssue])
  })

  it('applies priority border color based on priority level', () => {
    const wrapper = mount(IssueCard, {
      props: { issue: mockIssue }
    })

    const card = wrapper.find('[data-testid="issue-card"]')
    const classes = card.classes().join(' ')

    // High priority should have warning/orange border
    expect(classes).toContain('border-l-')
  })
})
