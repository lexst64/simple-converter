import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

let pinia: Pinia
let systemDark = false

const mountToggle = () =>
  mount(ThemeToggle, { global: { plugins: [pinia] }, attachTo: document.body })

const toggleButton = (w: ReturnType<typeof mountToggle>) =>
  w.find('button[aria-label="Toggle color theme"]')
const option = (w: ReturnType<typeof mountToggle>, label: string) =>
  w.findAll('button').find((b) => b.text() === label)

describe('ThemeToggle', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    systemDark = false
    // jsdom has no matchMedia
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: systemDark,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
    document.body.innerHTML = ''
  })

  it('shows the current mode and starts closed', () => {
    const wrapper = mountToggle()
    expect(toggleButton(wrapper).text()).toBe('auto')
    expect(toggleButton(wrapper).attributes('aria-expanded')).toBe('false')
    expect(option(wrapper, 'Light')).toBeUndefined()
  })

  it('applies the system theme on mount in auto mode', () => {
    systemDark = true
    mountToggle()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('opens the menu with the three options', async () => {
    const wrapper = mountToggle()
    await toggleButton(wrapper).trigger('click')
    expect(toggleButton(wrapper).attributes('aria-expanded')).toBe('true')
    expect(['Light', 'Dark', 'System'].every((l) => option(wrapper, l))).toBe(true)
  })

  it('selecting a mode applies it and closes the menu', async () => {
    const wrapper = mountToggle()
    await toggleButton(wrapper).trigger('click')
    await option(wrapper, 'Dark')!.trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(toggleButton(wrapper).text()).toBe('dark')
    expect(option(wrapper, 'Light')).toBeUndefined()

    await toggleButton(wrapper).trigger('click')
    await option(wrapper, 'Light')!.trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(toggleButton(wrapper).text()).toBe('light')
  })

  it('closes the menu on an outside click but not on an inside click', async () => {
    const wrapper = mountToggle()
    await toggleButton(wrapper).trigger('click')

    await wrapper.find('div > div').trigger('click')
    expect(toggleButton(wrapper).attributes('aria-expanded')).toBe('true')

    document.body.click()
    await wrapper.vm.$nextTick()
    expect(toggleButton(wrapper).attributes('aria-expanded')).toBe('false')
  })
})
