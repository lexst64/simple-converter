import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import AuthView from '@/views/AuthView.vue'
import { AuthService } from '@/services/auth.service'
import { useToastStore } from '@/stores/useToastStore'

const mocks = vi.hoisted(() => ({ login: vi.fn(), push: vi.fn() }))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ login: mocks.login, logout: vi.fn(), user: null, token: null }),
}))

vi.mock('@/services/auth.service', () => ({
  AuthService: { loginWithGoogle: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

const loginWithGoogle = vi.mocked(AuthService.loginWithGoogle)

type InitConfig = { client_id: string; callback: (r: { credential: string }) => Promise<void> }

const stubGoogle = () => {
  const id = {
    initialize: vi.fn<(config: InitConfig) => void>(),
    renderButton: vi.fn((el: HTMLElement) => {
      el.innerHTML = '<button>Sign in with Google</button>'
    }),
  }
  vi.stubGlobal('google', { accounts: { id } })
  return id
}

const SDK_ERROR = {
  type: 'error',
  title: 'Authentication Error',
  message: 'Google Identity Services script failed to load.',
}

let pinia: Pinia

const mountView = () => mount(AuthView, { global: { plugins: [pinia] } })

describe('AuthView', () => {
  enableAutoUnmount(afterEach)

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    mocks.login.mockResolvedValue(undefined)
    loginWithGoogle.mockResolvedValue({ token: 'jwt', user: {} as never })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the Google sign-in button when the SDK is already loaded', () => {
    const id = stubGoogle()
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Please, sign in to your Google account')
    expect(id.initialize).toHaveBeenCalledOnce()
    expect(id.renderButton).toHaveBeenCalledOnce()
    expect(id.renderButton.mock.calls[0]![0]).toBe(wrapper.find('[style*="color-scheme"]').element)
    expect(wrapper.find('button').text()).toBe('Sign in with Google')
    expect(useToastStore().toasts).toEqual([])
  })

  it('logs in with the Google credential and navigates home', async () => {
    const id = stubGoogle()
    mountView()

    await id.initialize.mock.calls[0]![0].callback({ credential: 'google-cred' })

    expect(loginWithGoogle).toHaveBeenCalledExactlyOnceWith('google-cred')
    expect(mocks.login).toHaveBeenCalledExactlyOnceWith('jwt')
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('shows an error toast and stays on the page when the backend login fails', async () => {
    loginWithGoogle.mockRejectedValue(new Error('down'))
    const id = stubGoogle()
    mountView()

    await id.initialize.mock.calls[0]![0].callback({ credential: 'google-cred' })

    expect(mocks.login).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', message: 'Error connecting to backend server.' },
    ])
  })

  it('renders the button once the SDK reports it has loaded', async () => {
    mountView()
    const id = stubGoogle()
    window.dispatchEvent(new Event('google-sdk-loaded'))
    await flushPromises()

    expect(id.renderButton).toHaveBeenCalledOnce()
  })

  it('shows an error toast when the SDK reports a load failure', () => {
    mountView()
    window.dispatchEvent(new Event('google-sdk-error'))
    expect(useToastStore().toasts).toMatchObject([SDK_ERROR])
  })

  it('shows an error toast when the SDK has not loaded after 5s', () => {
    vi.useFakeTimers()
    mountView()

    vi.advanceTimersByTime(4999)
    expect(useToastStore().toasts).toEqual([])
    vi.advanceTimersByTime(1)
    expect(useToastStore().toasts).toMatchObject([SDK_ERROR])
  })

  it('renders the button if the SDK appears by the 5s timeout without firing an event', () => {
    vi.useFakeTimers()
    mountView()
    const id = stubGoogle()
    vi.advanceTimersByTime(5000)

    expect(id.renderButton).toHaveBeenCalledOnce()
    expect(useToastStore().toasts).toEqual([])
  })

  it('stops waiting for the SDK after unmount', () => {
    vi.useFakeTimers()
    const wrapper = mountView()
    wrapper.unmount()

    window.dispatchEvent(new Event('google-sdk-error'))
    vi.advanceTimersByTime(5000)
    expect(useToastStore().toasts).toEqual([])
  })
})
