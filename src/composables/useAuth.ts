import { ref, computed } from 'vue'
import type { AuthState, AuthContextType } from '@/types/auth'
import { authService } from '@/services/authService'
import type { User } from '@/types/user'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const state = ref<AuthState>({
  user: JSON.parse(localStorage.getItem(USER_KEY) || '{}') as User,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
})

export function useAuth(): AuthContextType {
  const login = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    state.value.token = token
    try {
      const user = await authService.getUser()
      localStorage.setItem('user', JSON.stringify(user))
      state.value.user = user
      state.value.isAuthenticated = true
    } catch (error) {
      console.error('Failed to fetch user', error)
      // Handle error, maybe logout
      logout()
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    state.value.user = null
    state.value.token = null
    state.value.isAuthenticated = false
  }

  // Auto-login if token exists
  if (state.value.token && !state.value.user) {
    login(state.value.token)
  }

  return {
    ...state.value,
    user: computed(() => state.value.user).value,
    token: computed(() => state.value.token).value,
    isAuthenticated: computed(() => state.value.isAuthenticated).value,
    login,
    logout,
  }
}
