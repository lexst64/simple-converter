import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { User } from '@/types/user'

const mocks = vi.hoisted(() => ({ getUser: vi.fn() }))

// Never import the real service: it imports `api` from `@/main`, which mounts the app.
vi.mock('@/services/auth.service', () => ({
  AuthService: { getUser: mocks.getUser },
}))

const USER: User = {
  googleId: '1',
  name: 'Alice',
  email: 'alice@example.com',
  picture: 'https://img/a.png',
}

/**
 * useAuth keeps its state in module scope, initialised from localStorage at import time,
 * so each test resets the module registry and imports fresh copies. Pinia is re-imported
 * too, so the fresh toast store sees the active pinia.
 */
async function loadAuth() {
  vi.resetModules()
  const { createPinia, setActivePinia } = await import('pinia')
  setActivePinia(createPinia())
  const { useAuth } = await import('@/composables/useAuth')
  const { useToastStore } = await import('@/stores/useToastStore')
  return { useAuth, toasts: () => useToastStore().toasts }
}

/** Replaces window.location with a plain object so redirects can be observed. */
function stubLocation(pathname = '/') {
  const location = { pathname, href: `http://localhost${pathname}` }
  vi.spyOn(window, 'location', 'get').mockReturnValue(location as Location)
  return location
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mocks.getUser.mockReset()
    mocks.getUser.mockResolvedValue(USER)
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('initial state', () => {
    it('is signed out when nothing is stored', async () => {
      const { useAuth } = await loadAuth()
      const auth = useAuth()

      expect(auth.user.value).toBeNull()
      expect(auth.token.value).toBeNull()
      expect(auth.isAuthenticated.value).toBe(false)
      expect(mocks.getUser).not.toHaveBeenCalled()
    })

    it('restores the stored token and user without refetching', async () => {
      localStorage.setItem('token', 'tok')
      localStorage.setItem('user', JSON.stringify(USER))
      const { useAuth } = await loadAuth()
      const auth = useAuth()

      expect(auth.token.value).toBe('tok')
      expect(auth.user.value).toEqual(USER)
      expect(auth.isAuthenticated.value).toBe(true)
      expect(mocks.getUser).not.toHaveBeenCalled()
    })

    it('treats a corrupt stored user as missing and fetches it again', async () => {
      localStorage.setItem('token', 'tok')
      localStorage.setItem('user', '{not json')
      const { useAuth } = await loadAuth()
      const auth = useAuth()
      await flushPromises()

      expect(mocks.getUser).toHaveBeenCalledOnce()
      expect(auth.user.value).toEqual(USER)
    })
  })

  describe('auto-login', () => {
    it('fetches the user once when a token is stored without a user', async () => {
      localStorage.setItem('token', 'tok')
      const { useAuth } = await loadAuth()

      const auth = useAuth()
      useAuth()
      useAuth()
      await flushPromises()

      expect(mocks.getUser).toHaveBeenCalledOnce()
      expect(auth.user.value).toEqual(USER)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(USER))
    })
  })

  describe('login', () => {
    it('stores the token, fetches the user and marks the session authenticated', async () => {
      const { useAuth, toasts } = await loadAuth()
      const auth = useAuth()

      await auth.login('new-tok')

      expect(localStorage.getItem('token')).toBe('new-tok')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(USER))
      expect(auth.token.value).toBe('new-tok')
      expect(auth.user.value).toEqual(USER)
      expect(auth.isAuthenticated.value).toBe(true)
      expect(toasts()).toEqual([])
    })

    it('shares state between useAuth() callers', async () => {
      const { useAuth } = await loadAuth()
      const first = useAuth()
      const second = useAuth()

      await first.login('new-tok')

      expect(second.user.value).toEqual(USER)
      expect(second.isAuthenticated.value).toBe(true)
    })

    it('shows a toast and logs out when fetching the user fails', async () => {
      mocks.getUser.mockRejectedValue(new Error('500'))
      const location = stubLocation('/')
      const { useAuth, toasts } = await loadAuth()
      const auth = useAuth()

      await auth.login('bad-tok')

      expect(toasts()).toMatchObject([
        { type: 'error', title: 'Authentication Error', message: 'Failed to fetch user.' },
      ])
      expect(localStorage.getItem('token')).toBeNull()
      expect(auth.token.value).toBeNull()
      expect(auth.isAuthenticated.value).toBe(false)
      expect(location.href).toBe('/auth')
    })
  })

  describe('logout', () => {
    const signIn = async () => {
      const loaded = await loadAuth()
      const auth = loaded.useAuth()
      await auth.login('tok')
      sessionStorage.setItem('draft', 'x')
      return auth
    }

    it('clears storage and state and redirects to /auth', async () => {
      const location = stubLocation('/history')
      const auth = await signIn()

      auth.logout()

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(sessionStorage.length).toBe(0)
      expect(auth.user.value).toBeNull()
      expect(auth.token.value).toBeNull()
      expect(auth.isAuthenticated.value).toBe(false)
      expect(location.href).toBe('/auth')
    })

    it('clears state but does not navigate when already on /auth', async () => {
      const location = stubLocation('/auth')
      const auth = await signIn()

      auth.logout()

      expect(auth.isAuthenticated.value).toBe(false)
      expect(localStorage.getItem('token')).toBeNull()
      expect(location.href).toBe('http://localhost/auth')
    })
  })
})
