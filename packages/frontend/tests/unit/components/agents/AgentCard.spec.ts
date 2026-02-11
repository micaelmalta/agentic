import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AgentCard from '../../../../src/components/agents/AgentCard.vue'
import type { Agent } from '../../../../src/types/agent'

describe('AgentCard.vue', () => {
  const mockAgent: Agent = {
    id: 'agent-01',
    status: 'running',
    issueKey: 'PROJ-42',
    phase: 3,
    phaseDescription: 'Phase 3 · Execute',
    skill: 'developer',
    progress: 37,
    duration: 120000,
    tokenCount: 5000,
    logs: ['Starting execution', 'Running tests'],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('renders agent ID', () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('agent-01')
  })

  it('displays status indicator with correct color', () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    const statusDot = wrapper.find('[data-testid="status-dot"]')
    expect(statusDot.exists()).toBe(true)
    expect(statusDot.classes()).toContain('status-running')
  })

  it('shows issue key when agent is working on an issue', () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('PROJ-42')
  })

  it('displays phase and progress', () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('Phase 3 · Execute')
    expect(wrapper.find('[data-testid="progress-bar"]').exists()).toBe(true)
  })

  it('shows idle state when no issue assigned', () => {
    const idleAgent: Agent = {
      ...mockAgent,
      status: 'idle',
      issueKey: null,
      phase: null,
      phaseDescription: null,
      skill: null,
      progress: 0
    }

    const wrapper = mount(AgentCard, {
      props: { agent: idleAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('Idle')
  })

  it('expands to show logs when clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.find('[data-testid="logs-container"]').exists()).toBe(false)

    await wrapper.find('[data-testid="agent-card"]').trigger('click')

    expect(wrapper.find('[data-testid="logs-container"]').exists()).toBe(true)
  })

  it('displays duration timer', () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
      global: {
        plugins: [createPinia()]
      }
    })

    const duration = wrapper.find('[data-testid="duration"]')
    expect(duration.exists()).toBe(true)
    expect(duration.text()).toMatch(/\d+:\d+/)
  })
})
