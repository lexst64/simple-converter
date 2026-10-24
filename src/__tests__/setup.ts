import { config } from '@vue/test-utils'
import PrimeVue from 'primevue/config'

// components import PrimeVue widgets directly, which need the plugin's configuration;
// the theme is skipped since jsdom does not render styles
config.global.plugins.push([PrimeVue, { theme: 'none' }])

// jsdom has no matchMedia, which PrimeVue overlays use; specs can still stub their own
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
