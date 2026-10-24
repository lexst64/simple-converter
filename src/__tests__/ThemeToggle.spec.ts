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
// the popup menu is teleported to <body>, outside the wrapper
const option = (label: string) =>
  Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
    (item) => item.textContent?.trim() === label,
  )
const choose = async (w: ReturnType<typeof mountToggle>, label: string) => {
  option(label)!.querySelector('a')!.click()
  await w.vm.$nextTick()
}

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
    expect(toggleButton(wrapper).find('.pi-desktop').exists()).toBe(true)
    expect(option('Light')).toBeUndefined()
  })

  it('applies the system theme on mount in auto mode', () => {
    systemDark = true
    mountToggle()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('opens the menu with the three options and closes it on a second click', async () => {
    const wrapper = mountToggle()
    await toggleButton(wrapper).trigger('click')
    expect(['Light', 'Dark', 'System'].every((l) => option(l))).toBe(true)

    await toggleButton(wrapper).trigger('click')
    expect(option('Light')).toBeUndefined()
  })

  it('marks the active mode in the menu', async () => {
    const wrapper = mountToggle()
    await toggleButton(wrapper).trigger('click')
    expect(option('System')!.querySelector('.pi-check')).not.toBeNull()
    expect(option('Dark')!.querySelector('.pi-check')).toBeNull()
  })

  it('selecting a mode applies it and closes the menu', async () => {
    const wrapper = mountToggle()
    await toggleButton(wrapper).trigger('click')
    await choose(wrapper, 'Dark')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(toggleButton(wrapper).text()).toBe('dark')
    expect(toggleButton(wrapper).find('.pi-moon').exists()).toBe(true)
    expect(option('Light')).toBeUndefined()

    await toggleButton(wrapper).trigger('click')
    await choose(wrapper, 'Light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(toggleButton(wrapper).text()).toBe('light')
  })
})
