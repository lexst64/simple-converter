import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // the framework and PrimeVue's core (theme engine, config, license check) get their
        // own chunks so no single vendor chunk grows past the size limit
        manualChunks(id) {
          if (/node_modules\/(vue|@vue|vue-router|pinia)\//.test(id)) {
            return 'vendor'
          }
          if (/node_modules\/(@primevue\/core|@primeuix\/(styled|utils|themes)|@primeui|primevue\/config)\//.test(id)) {
            return 'primevue'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
