import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'
import { createPinia } from 'pinia'

describe('App.vue', () => {
  it('renders the app shell with three-panel layout', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia]
      }
    })

    // Should have toolbar
    expect(wrapper.find('[data-testid="toolbar"]').exists()).toBe(true)

    // Should have three panels
    expect(wrapper.find('[data-testid="agent-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="kanban-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chat-panel"]').exists()).toBe(true)

    // Should have status bar
    expect(wrapper.find('[data-testid="status-bar"]').exists()).toBe(true)
  })

  it('applies grid layout with correct column structure', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia]
      }
    })

    const gridContainer = wrapper.find('[data-testid="grid-container"]')
    expect(gridContainer.exists()).toBe(true)
    expect(gridContainer.classes()).toContain('grid')
  })
})
