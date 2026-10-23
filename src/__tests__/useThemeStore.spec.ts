import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore, type ThemeMode } from '@/stores/useThemeStore'

type ChangeListener = (e: MediaQueryListEvent) => void

/** Installs a controllable window.matchMedia mock. */
function mockMatchMedia(initialDark: boolean) {
  let matches = initialDark
  const listeners = new Set<ChangeListener>()

  const mql = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_type: string, cb: ChangeListener) => listeners.add(cb)),
    removeEventListener: vi.fn((_type: string, cb: ChangeListener) => listeners.delete(cb)),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  const matchMedia = vi.fn(() => mql as unknown as MediaQueryList)
  vi.stubGlobal('matchMedia', matchMedia)

  return {
    matchMedia,
    mql,
    listeners,
    setSystemDark(value: boolean) {
      matches = value
      listeners.forEach((cb) => cb({ matches: value } as MediaQueryListEvent))
    },
  }
}

function addThemeColorMeta() {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', 'initial')
  document.head.appendChild(meta)
  return meta
}

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.style.colorScheme = ''
    document.head.innerHTML = ''
  })

  it('defaults to auto mode', () => {
    mockMatchMedia(false)
    expect(useThemeStore().themeMode).toBe('auto')
  })

  describe.each<[ThemeMode, boolean, 'light' | 'dark']>([
    ['auto', false, 'light'],
    ['auto', true, 'dark'],
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
  ])('mode=%s, system dark=%s', (mode, systemDark, expected) => {
    it(`effectiveTheme is ${expected}`, () => {
      mockMatchMedia(systemDark)
      const store = useThemeStore()
      store.setThemeMode(mode)

      expect(store.systemIsDark).toBe(systemDark)
      expect(store.effectiveTheme).toBe(expected)
      expect(store.isDark).toBe(expected === 'dark')
    })
  })

  describe('applyTheme', () => {
    it('adds the dark class, sets colorScheme and the theme-color meta in dark mode', () => {
      mockMatchMedia(false)
      const meta = addThemeColorMeta()
      const store = useThemeStore()

      store.setThemeMode('dark')

      const root = document.documentElement
      expect(root.classList.contains('dark')).toBe(true)
      expect(root.style.colorScheme).toBe('dark')
      expect(meta.getAttribute('content')).toBe('#0f172a')
    })

    it('removes the dark class, sets colorScheme and the theme-color meta in light mode', () => {
      mockMatchMedia(true)
      const meta = addThemeColorMeta()
      const root = document.documentElement
      root.classList.add('dark')
      const store = useThemeStore()

      store.setThemeMode('light')

      expect(root.classList.contains('dark')).toBe(false)
      expect(root.style.colorScheme).toBe('light')
      expect(meta.getAttribute('content')).toBe('#ffffff')
    })

    it('toggles back and forth between modes', () => {
      mockMatchMedia(false)
      const meta = addThemeColorMeta()
      const store = useThemeStore()
      const root = document.documentElement

      store.setThemeMode('dark')
      store.setThemeMode('light')
      expect(root.classList.contains('dark')).toBe(false)
      expect(meta.getAttribute('content')).toBe('#ffffff')

      store.setThemeMode('dark')
      expect(root.classList.contains('dark')).toBe(true)
      expect(meta.getAttribute('content')).toBe('#0f172a')
    })

    it('uses the system preference in auto mode', () => {
      mockMatchMedia(true)
      const store = useThemeStore()

      store.applyTheme()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })

    it('works without a theme-color meta tag', () => {
      mockMatchMedia(false)
      const store = useThemeStore()

      expect(() => store.setThemeMode('dark')).not.toThrow()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('initTheme', () => {
    it('applies the theme and subscribes to system changes', () => {
      const media = mockMatchMedia(true)
      const store = useThemeStore()

      store.initTheme()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(media.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(media.mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
      expect(media.listeners.size).toBe(1)
    })

    it('replaces the previous listener when called twice', () => {
      const media = mockMatchMedia(false)
      const store = useThemeStore()

      store.initTheme()
      const first = media.mql.addEventListener.mock.calls[0]![1]
      store.initTheme()

      expect(media.mql.removeEventListener).toHaveBeenCalledWith('change', first)
      expect(media.listeners.size).toBe(1)
    })

    it('ignores system changes when the mode is not auto', () => {
      const media = mockMatchMedia(false)
      const store = useThemeStore()
      store.setThemeMode('light')
      store.initTheme()

      media.setSystemDark(true)

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('follows OS theme changes in auto mode', () => {
      const media = mockMatchMedia(false)
      const store = useThemeStore()
      store.initTheme()
      expect(store.effectiveTheme).toBe('light')

      media.setSystemDark(true)

      expect(store.systemIsDark).toBe(true)
      expect(store.effectiveTheme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})
