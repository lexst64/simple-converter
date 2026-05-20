import axios from 'axios'
import type { User } from '@/types/user'
import { api } from '@/main'

export const authService = {
  async getUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
  async loginWithGoogle(token: string): Promise<{ token: string; user: User }> {
    const response = await api.post<{ token: string; user: User }>('/auth/google', { token })
    return response.data
  },
}
