import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastItem from '@/components/common/ToastItem.vue'
import type { ToastNotification } from '@/types/toast'

const makeToast = (overrides: Partial<ToastNotification> = {}): ToastNotification => ({
  id: 't1',
  type: 'info',
  message: 'Hello there',
  duration: 1000,
  ...overrides,
})

const progressWidth = (w: ReturnType<typeof mount>) =>
  (w.find('[style*="width"]').element as HTMLElement).style.width

describe('ToastItem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the title and message as an alert', () => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast({ title: 'Heads up' }) } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.find('h4').text()).toBe('Heads up')
    expect(wrapper.text()).toContain('Hello there')
  })

  it('omits the title element when there is no title', () => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast() } })
    expect(wrapper.find('h4').exists()).toBe(false)
  })

  it.each([
    ['success', 'bg-emerald-500'],
    ['error', 'bg-rose-500'],
    ['warning', 'bg-amber-500'],
    ['info', 'bg-sky-500'],
  ] as const)('uses the %s colour for the progress bar', (type, cls) => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast({ type }) } })
    expect(wrapper.find('[style*="width"]').classes()).toContain(cls)
  })

  it('auto-dismisses after its duration and shrinks the progress bar meanwhile', async () => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast({ duration: 1000 }) } })
    expect(progressWidth(wrapper)).toBe('100%')

    await vi.advanceTimersByTimeAsync(500)
    expect(progressWidth(wrapper)).toBe('50%')
    expect(wrapper.emitted('dismiss')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.emitted('dismiss')).toEqual([['t1']])

    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('defaults to 4000ms when no duration is given', async () => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast({ duration: undefined }) } })
    await vi.advanceTimersByTimeAsync(3950)
    expect(wrapper.emitted('dismiss')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(50)
    expect(wrapper.emitted('dismiss')).toEqual([['t1']])
  })

  it('pauses the countdown while hovered', async () => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast({ duration: 1000 }) } })
    await vi.advanceTimersByTimeAsync(400)
    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.emitted('dismiss')).toBeUndefined()
    expect(progressWidth(wrapper)).toBe('60%')

    await wrapper.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.emitted('dismiss')).toEqual([['t1']])
  })

  it('dismisses immediately via the close button and stops the timer', async () => {
    const wrapper = mount(ToastItem, { props: { toast: makeToast({ duration: 1000 }) } })
    await wrapper.find('button[aria-label="Dismiss toast"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toEqual([['t1']])

    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
