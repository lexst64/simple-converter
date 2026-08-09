import type { User } from '@/types/user'

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>
  logout: () => void
}
