import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Toolbar from '../../../../src/components/layout/Toolbar.vue'
import { useAgentsStore } from '../../../../src/stores/agents'

describe('Toolbar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders toolbar controls', () => {
    const wrapper = mount(Toolbar)

    expect(wrapper.find('[data-testid="add-agent-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="stop-all-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="autonomous-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="settings-btn"]').exists()).toBe(true)
  })

  it('disables add agent button when at max capacity', () => {
    const wrapper = mount(Toolbar)
    const agentsStore = useAgentsStore()

    // Simulate max agents
    agentsStore.maxAgents = 4
    agentsStore.agents = Array(4).fill(null).map((_, i) => ({
      id: `agent-${i}`,
      status: 'running' as const,
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
    }))

    const addBtn = wrapper.find('[data-testid="add-agent-btn"]')
    expect(addBtn.attributes('disabled')).toBeDefined()
  })

  it('calls spawnAgent when add button clicked', async () => {
    const wrapper = mount(Toolbar)
    const agentsStore = useAgentsStore()
    const spawnSpy = vi.spyOn(agentsStore, 'spawnAgent')

    await wrapper.find('[data-testid="add-agent-btn"]').trigger('click')

    expect(spawnSpy).toHaveBeenCalled()
  })

  it('displays agent count correctly', () => {
    const wrapper = mount(Toolbar)
    const agentsStore = useAgentsStore()

    agentsStore.agents = Array(3).fill(null).map((_, i) => ({
      id: `agent-${i}`,
      status: 'running' as const,
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
    }))
    agentsStore.maxAgents = 4

    const countDisplay = wrapper.find('[data-testid="agent-count"]')
    expect(countDisplay.text()).toContain('3/4')
  })

  it('toggles autonomous mode', async () => {
    const wrapper = mount(Toolbar)
    const agentsStore = useAgentsStore()

    expect(agentsStore.autonomousMode).toBe(false)

    await wrapper.find('[data-testid="autonomous-toggle"]').trigger('click')

    expect(agentsStore.autonomousMode).toBe(true)
  })
})
