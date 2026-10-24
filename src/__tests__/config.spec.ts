import { beforeEach, describe, expect, it, vi } from 'vitest'

// config.ts reads import.meta.env at module load, so each test stubs the env,
// resets the module registry and imports a fresh copy.
async function loadConfig() {
  vi.resetModules()
  return (await import('@/config')).default
}

describe('config', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads values from import.meta.env', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com')
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id')
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', 'access-key')
    vi.stubEnv('VITE_PRIMEUI_LICENSE', 'license-key')

    const config = await loadConfig()

    expect(config).toMatchObject({
      apiUrl: 'https://api.example.com',
      googleClientId: 'client-id',
      web3formsAccessKey: 'access-key',
      primeuiLicense: 'license-key',
    })
  })

  it('falls back to empty strings when variables are not set', async () => {
    vi.stubEnv('VITE_API_URL', undefined)
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', undefined)
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', undefined)
    vi.stubEnv('VITE_PRIMEUI_LICENSE', undefined)

    const config = await loadConfig()

    expect(config.apiUrl).toBe('')
    expect(config.googleClientId).toBe('')
    expect(config.web3formsAccessKey).toBe('')
    expect(config.primeuiLicense).toBe('')
  })

  it('exposes the mode flags', async () => {
    vi.stubEnv('MODE', 'staging')
    vi.stubEnv('DEV', false)
    vi.stubEnv('PROD', true)

    const config = await loadConfig()

    expect(config.mode).toBe('staging')
    expect(config.isDev).toBe(false)
    expect(config.isProd).toBe(true)
  })

  it('exports the same object as named and default export', async () => {
    vi.resetModules()
    const mod = await import('@/config')
    expect(mod.config).toBe(mod.default)
  })
})
