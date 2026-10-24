import { definePreset } from '@primeuix/themes'
// The full Aura preset bundles design tokens for every PrimeVue component (~110 kB),
// so the preset is assembled from its base plus the tokens of the components the app uses.
// When adding a PrimeVue component, add its tokens here or it renders unstyled.
import base from '@primeuix/themes/aura/base'
import accordion from '@primeuix/themes/aura/accordion'
import avatar from '@primeuix/themes/aura/avatar'
import badge from '@primeuix/themes/aura/badge'
import button from '@primeuix/themes/aura/button'
import card from '@primeuix/themes/aura/card'
import checkbox from '@primeuix/themes/aura/checkbox'
import iconfield from '@primeuix/themes/aura/iconfield'
import inputtext from '@primeuix/themes/aura/inputtext'
import menu from '@primeuix/themes/aura/menu'
import menubar from '@primeuix/themes/aura/menubar'
import message from '@primeuix/themes/aura/message'
import progressbar from '@primeuix/themes/aura/progressbar'
import ripple from '@primeuix/themes/aura/ripple'
import select from '@primeuix/themes/aura/select'
import skeleton from '@primeuix/themes/aura/skeleton'
import tag from '@primeuix/themes/aura/tag'
import textarea from '@primeuix/themes/aura/textarea'
import toast from '@primeuix/themes/aura/toast'
import virtualscroller from '@primeuix/themes/aura/virtualscroller'
import type { PrimeVueConfiguration } from 'primevue/config'
import { config } from '@/config'

const Aura = {
  ...base,
  components: {
    accordion,
    avatar,
    badge,
    button,
    card,
    checkbox,
    iconfield,
    inputtext,
    menu,
    menubar,
    message,
    progressbar,
    ripple,
    select,
    skeleton,
    tag,
    textarea,
    toast,
    virtualscroller,
  },
}

const palette = (color: string) =>
  Object.fromEntries(
    [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
      shade,
      shade === 0 ? '#ffffff' : `{${color}.${shade}}`,
    ]),
  )

// Aura with the app's indigo brand colour and slate surfaces in both colour schemes
export const AppPreset = definePreset(Aura, {
  semantic: {
    primary: palette('indigo'),
    colorScheme: {
      light: { surface: palette('slate') },
      dark: { surface: palette('slate') },
    },
  },
})

export const primeVueOptions: PrimeVueConfiguration = {
  license: config.primeuiLicense || undefined,
  theme: {
    preset: AppPreset,
    options: {
      // matches the class toggled by useThemeStore and the Tailwind `dark` variant
      darkModeSelector: '.dark',
      // keeps PrimeVue styles below Tailwind utilities so classes can override them
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
}
