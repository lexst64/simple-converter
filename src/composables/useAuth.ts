import { ref, computed } from 'vue'
import type { AuthState, AuthContextType } from '@/types/auth'
import { authService } from '@/services/authService'
import type { User } from '@/types/user'

const state = ref<AuthState>({
  user: JSON.parse(localStorage.getItem('user') || '{}') as User,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
})

export function useAuth(): AuthContextType {
  const login = async (token: string) => {
    localStorage.setItem('token', token)
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
