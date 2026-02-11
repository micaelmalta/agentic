import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StatusBar from '../../../../src/components/layout/StatusBar.vue'
import { usePlansStore } from '../../../../src/stores/plans'

describe('StatusBar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders status bar', () => {
    const wrapper = mount(StatusBar)
    expect(wrapper.find('.status-bar').exists()).toBe(true)
  })

  it('displays pending plan review count', async () => {
    const plansStore = usePlansStore()

    plansStore.plans = [
      {
        id: '1',
        agentId: 'agent-01',
        issueKey: 'PROJ-42',
        planPath: 'context/plans/test.md',
        planContent: '# Test plan',
        createdAt: new Date(),
        status: 'pending'
      },
      {
        id: '2',
        agentId: 'agent-02',
        issueKey: 'PROJ-43',
        planPath: 'context/plans/test2.md',
        planContent: '# Test plan 2',
        createdAt: new Date(),
        status: 'pending'
      }
    ]

    const wrapper = mount(StatusBar)
    await wrapper.vm.$nextTick()

    const badge = wrapper.find('[data-testid="plans-badge"]')
    expect(badge.text()).toContain('2')
    expect(badge.text()).toContain('plans')
  })

  it('hides plan badge when no pending plans', async () => {
    const plansStore = usePlansStore()

    plansStore.plans = []

    const wrapper = mount(StatusBar)
    await wrapper.vm.$nextTick()

    const badge = wrapper.find('[data-testid="plans-badge"]')
    expect(badge.exists()).toBe(false)
  })
})
