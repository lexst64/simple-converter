import type { ComputedRef } from 'vue'
import type { User } from '@/types/user'

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface AuthContextType {
  user: ComputedRef<User | null>
  token: ComputedRef<string | null>
  isAuthenticated: ComputedRef<boolean>
  login: (token: string) => Promise<void>
  logout: () => void
}
