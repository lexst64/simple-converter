import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  {
    ...viteConfig,
    // vite-plugin-vue-devtools is dev-server only and not needed under test
    plugins: (viteConfig.plugins ?? []).filter(
      (p) => !(p && 'name' in p && String(p.name).startsWith('vite-plugin-vue-devtools')),
    ),
  },
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/__tests__/**/*.spec.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      restoreMocks: true,
      unstubGlobals: true,
    },
  }),
)
