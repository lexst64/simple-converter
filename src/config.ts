export interface AppConfig {
  apiUrl: string
  googleClientId: string
  isDev: boolean
  isProd: boolean
  mode: string
}

export const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
}

export default config
