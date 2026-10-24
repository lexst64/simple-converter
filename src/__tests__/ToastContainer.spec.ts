import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useToastStore } from '@/stores/useToastStore'

let pinia: Pinia

const mountContainer = () =>
  mount(ToastContainer, { global: { plugins: [pinia] }, attachTo: document.body })

// PrimeVue renders the toasts in a portal on <body>
const messages = () => Array.from(document.body.querySelectorAll<HTMLElement>('[role="alert"]'))
const texts = () => messages().map((m) => m.querySelector('[data-pc-section="detail"]')!.textContent)

describe('ToastContainer', () => {
  enableAutoUnmount(afterEach)

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a toast for each one added to the store', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()
    expect(messages()).toHaveLength(0)

    store.success('Saved', 'Done')
    store.error('Broken')
    await wrapper.vm.$nextTick()

    expect(messages()).toHaveLength(2)
    expect(messages()[0]!.querySelector('[data-pc-section="summary"]')!.textContent).toBe('Done')
    expect(texts()).toEqual(['Saved', 'Broken'])
    expect(messages().map((m) => m.dataset.p)).toEqual(['success', 'error'])
  })

  it('maps the warning type to the warn severity', async () => {
    const wrapper = mountContainer()
    useToastStore().warning('Careful')
    await wrapper.vm.$nextTick()
    expect(messages()[0]!.dataset.p).toBe('warn')
  })

  it('removes the toast from the store when its close button is clicked', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()
    store.info('keep')
    store.info('drop')
    await wrapper.vm.$nextTick()

    messages()[1]!.querySelector<HTMLElement>('[data-pc-section="closebutton"]')!.click()
    await vi.waitFor(() => expect(store.toasts.map((t) => t.message)).toEqual(['keep']))
  })

  it('removes the rendered toast when the store removes it', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()
    store.info('keep')
    const id = store.info('drop')
    await wrapper.vm.$nextTick()

    store.removeToast(id)
    await wrapper.vm.$nextTick()

    expect(texts()).toEqual(['keep'])
  })

  it('clears every rendered toast with clearAll', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()
    store.info('one')
    store.info('two')
    await wrapper.vm.$nextTick()

    store.clearAll()
    await wrapper.vm.$nextTick()

    expect(messages()).toHaveLength(0)
    expect(store.toasts).toEqual([])
  })

  it('drops the oldest rendered toast once the store cap is reached', async () => {
    const store = useToastStore()
    const wrapper = mountContainer()
    ;['1', '2', '3', '4'].forEach((m) => store.info(m))
    await wrapper.vm.$nextTick()

    expect(texts()).toEqual(['2', '3', '4'])
  })

  it('removes toasts from the store once their duration has passed', async () => {
    vi.useFakeTimers()
    const store = useToastStore()
    const wrapper = mountContainer()
    store.info('short', undefined, 500)
    store.info('long', undefined, 2000)
    await wrapper.vm.$nextTick()

    // PrimeVue closes a toast after its life plus a ~500ms exit animation
    await vi.advanceTimersByTimeAsync(1100)
    expect(store.toasts.map((t) => t.message)).toEqual(['long'])

    await vi.advanceTimersByTimeAsync(2000)
    expect(store.toasts).toEqual([])
  })
})
