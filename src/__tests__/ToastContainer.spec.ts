import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useToastStore } from '@/stores/useToastStore'

let pinia: Pinia

const mountContainer = () => mount(ToastContainer, { global: { plugins: [pinia] } })
const clearAllButton = (w: ReturnType<typeof mountContainer>) =>
  w.findAll('button').find((b) => b.text().startsWith('Clear all'))

describe('ToastContainer', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a toast for each one in the store', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0)

    store.success('Saved', 'Done')
    store.error('Broken')
    await wrapper.vm.$nextTick()

    const alerts = wrapper.findAll('[role="alert"]')
    expect(alerts).toHaveLength(2)
    expect(alerts[0]!.find('h4').text()).toBe('Done')
    expect(alerts[0]!.text()).toContain('Saved')
    expect(alerts[1]!.text()).toBe('Broken')
  })

  it('shows "Clear all" only with two or more toasts, and it clears them', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()

    store.info('one')
    await wrapper.vm.$nextTick()
    expect(clearAllButton(wrapper)).toBeUndefined()

    store.info('two')
    await wrapper.vm.$nextTick()
    expect(clearAllButton(wrapper)!.text()).toBe('Clear all (2)')

    await clearAllButton(wrapper)!.trigger('click')
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0)
    expect(clearAllButton(wrapper)).toBeUndefined()
  })

  it('removes a toast when its close button is clicked', async () => {
    const store = useToastStore()
    store.info('keep')
    store.info('drop')
    const wrapper = mountContainer()

    await wrapper.findAll('button[aria-label="Dismiss toast"]')[1]!.trigger('click')

    expect(wrapper.findAll('[role="alert"]').map((a) => a.text())).toEqual(['keep'])
  })

  it('auto-dismisses toasts after their duration', async () => {
    vi.useFakeTimers()
    const store = useToastStore()
    const wrapper = mountContainer()
    store.info('short', undefined, 500)
    store.info('long', undefined, 2000)
    await wrapper.vm.$nextTick()

    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.findAll('[role="alert"]').map((a) => a.text())).toEqual(['long'])

    await vi.advanceTimersByTimeAsync(1500)
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0)
    expect(store.toasts).toEqual([])
  })
})
