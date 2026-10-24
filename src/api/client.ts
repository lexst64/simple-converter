import axios from 'axios'
import { config } from '@/config'
import { useAuth } from '@/composables/useAuth'

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
      // Called lazily: useAuth imports AuthService, which imports this module.
      useAuth().logout()
    }

    return Promise.reject(error)
  },
)
