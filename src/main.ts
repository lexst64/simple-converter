import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import { primeVueOptions } from '@/theme'

const pinia = createPinia()
pinia.use(
  createPersistedState({
    debug: import.meta.env.DEV,
  }),
)

const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(PrimeVue, primeVueOptions)

app.mount('#app')
