import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AgentPanel from '../../../../src/components/panels/AgentPanel.vue'
import { useAgentsStore } from '../../../../src/stores/agents'

describe('AgentPanel.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders panel header', () => {
    const wrapper = mount(AgentPanel)
    expect(wrapper.find('[data-testid="panel-header"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Agents')
  })

  it('displays empty state when no agents', () => {
    const wrapper = mount(AgentPanel)
    const agentsStore = useAgentsStore()
    agentsStore.agents = []

    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('renders agent cards for each agent', async () => {
    const agentsStore = useAgentsStore()

    agentsStore.agents = [
      {
        id: 'agent-01',
        status: 'running',
        issueKey: 'PROJ-42',
        phase: 3,
        phaseDescription: 'Phase 3 · Execute',
        skill: 'developer',
        progress: 37,
        duration: 120000,
        tokenCount: 5000,
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'agent-02',
        status: 'idle',
        issueKey: null,
        phase: null,
        phaseDescription: null,
        skill: null,
        progress: 0,
        duration: 0,
        tokenCount: 0,
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const wrapper = mount(AgentPanel)
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('[data-testid="agent-card"]')
    expect(cards).toHaveLength(2)
  })

  it('filters agents by status', async () => {
    const wrapper = mount(AgentPanel)
    const agentsStore = useAgentsStore()

    agentsStore.agents = [
      {
        id: 'agent-01',
        status: 'running',
        issueKey: 'PROJ-42',
        phase: 3,
        phaseDescription: 'Phase 3 · Execute',
        skill: 'developer',
        progress: 37,
        duration: 120000,
        tokenCount: 5000,
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'agent-02',
        status: 'idle',
        issueKey: null,
        phase: null,
        phaseDescription: null,
        skill: null,
        progress: 0,
        duration: 0,
        tokenCount: 0,
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Select running filter
    await wrapper.find('[data-testid="filter-running"]').trigger('click')

    const cards = wrapper.findAll('[data-testid="agent-card"]')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('agent-01')
  })
})
