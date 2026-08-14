import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import axios from 'axios'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { useAuth } from '@/composables/useAuth.ts'

import { config } from '@/config'

const pinia = createPinia()
pinia.use(
  createPersistedState({
    debug: import.meta.env.DEV,
  }),
)

export const API_URL = config.apiUrl

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuth().logout()
    }

    return Promise.reject(error)
  },
)

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')
