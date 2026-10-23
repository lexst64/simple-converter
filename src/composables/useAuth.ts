import { ref, computed } from 'vue'
import type { AuthState, AuthContextType } from '@/types/auth'
import { AuthService } from '@/services/auth.service'
import type { User } from '@/types/user'
import { useToastStore } from '@/stores/useToastStore'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const readStoredUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

const state = ref<AuthState>({
  user: readStoredUser(),
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
})

// auto-login must run at most once, not on every useAuth() call
let autoLoginAttempted = false

export function useAuth(): AuthContextType {
  const toastStore = useToastStore()

  const login = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    state.value.token = token
    try {
      const user = await AuthService.getUser()
      localStorage.setItem('user', JSON.stringify(user))
      state.value.user = user
      state.value.isAuthenticated = true
    } catch {
      toastStore.error('Failed to fetch user.', 'Authentication Error')
      logout()
    }
  }

  const logout = () => {
    // TODO: revoke token on logout

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.clear()

    // hard navigate using browser api to destroy all JS memory
    window.location.href = '/auth'
  }

  // Auto-login if token exists
  if (!autoLoginAttempted && state.value.token && !state.value.user) {
    autoLoginAttempted = true
    login(state.value.token)
  }

  return {
    user: computed(() => state.value.user),
    token: computed(() => state.value.token),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    login,
    logout,
  }
}
