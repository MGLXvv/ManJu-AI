import { afterEach, describe, expect, it, vi } from 'vitest'

describe.sequential('runtimeConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('defaults to mock mode in non-strict local development', async () => {
    vi.stubEnv('VITE_STRICT_RUNTIME_CONFIG', 'false')
    vi.stubEnv('VITE_API_MODE', '')

    const { runtimeConfig } = await import('@/config/runtimeConfig')

    expect(runtimeConfig.apiMode).toBe('mock')
    expect(runtimeConfig.apiBaseUrl).toBe('/admin-api')
  })

  it('normalizes the configured api base url', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:48080/admin-api///')

    const { runtimeConfig } = await import('@/config/runtimeConfig')

    expect(runtimeConfig.apiMode).toBe('http')
    expect(runtimeConfig.apiBaseUrl).toBe('http://localhost:48080/admin-api')
  })

  it('rejects missing or invalid api mode in strict configuration', async () => {
    vi.stubEnv('VITE_STRICT_RUNTIME_CONFIG', 'true')
    vi.stubEnv('VITE_API_MODE', 'invalid')

    await expect(import('@/config/runtimeConfig')).rejects.toThrow('RUNTIME_CONFIG_INVALID_API_MODE')
  })
})
