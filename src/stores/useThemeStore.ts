import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const useThemeStore = defineStore(
  'theme',
  () => {
    const themeMode = ref<ThemeMode>('auto')

    const systemIsDark = computed(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    const effectiveTheme = computed<'light' | 'dark'>(() => {
      if (themeMode.value === 'auto') {
        return systemIsDark.value ? 'dark' : 'light'
      }
      return themeMode.value
    })

    const isDark = computed(() => effectiveTheme.value === 'dark')

    let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null

    function applyTheme() {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      const isDarkTheme = effectiveTheme.value === 'dark'

      if (isDarkTheme) {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }

      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDarkTheme ? '#0f172a' : '#ffffff')
      }
    }

    function setThemeMode(mode: ThemeMode) {
      themeMode.value = mode
      applyTheme()
    }

    function initTheme() {
      applyTheme()

      if (typeof window === 'undefined') return

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (mediaQueryListener) {
        mediaQuery.removeEventListener('change', mediaQueryListener)
      }

      mediaQueryListener = () => {
        if (themeMode.value === 'auto') {
          applyTheme()
        }
      }

      mediaQuery.addEventListener('change', mediaQueryListener)
    }

    return {
      themeMode,
      systemIsDark,
      effectiveTheme,
      isDark,
      setThemeMode,
      initTheme,
      applyTheme,
    }
  },
  {
    persist: {
      key: 'theme-store',
      pick: ['themeMode'],
    },
  },
)
