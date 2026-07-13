import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getProfile = vi.fn()
const loginByPassword = vi.fn()

vi.mock('@/config/runtimeConfig', () => ({
  runtimeConfig: {
    apiMode: 'http',
    apiBaseUrl: '/admin-api',
    strict: true,
    enabledCapabilities: [],
    disabledCapabilities: [],
  },
}))

vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    loginByPassword,
    loginByCode: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    requestCode: vi.fn(),
    loginWithThirdParty: vi.fn(),
    getProfile,
    logout: vi.fn(),
  },
}))

describe('auth HTTP session restoration', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())

    const { authSessionBridge } = await import('@/services/auth/authSessionBridge')
    authSessionBridge.clear()
  })

  it('enriches a password login with the backend profile', async () => {
    loginByPassword.mockResolvedValue({
      token: 'opaque-session-token',
      user: { id: '1', name: 'admin', username: 'admin' },
    })
    getProfile.mockResolvedValue({
      id: '1',
      name: 'Admin',
      username: 'admin',
      nickname: 'Admin',
      roles: ['super_admin'],
      permissions: ['aidrama:project:read', 'aidrama:project:write'],
    })

    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()

    await store.loginByPassword({ account: 'admin', password: 'not-persisted' })

    expect(getProfile).toHaveBeenCalledTimes(1)
    expect(store.sessionValidated).toBe(true)
    expect(store.token).toBe('opaque-session-token')
    expect(store.user).toMatchObject({
      id: '1',
      name: 'Admin',
      roles: ['super_admin'],
      permissions: ['aidrama:project:read', 'aidrama:project:write'],
    })
  })

  it('validates an existing opaque token through the profile endpoint', async () => {
    getProfile.mockResolvedValue({
      id: '1',
      name: 'Admin',
      username: 'admin',
      roles: ['super_admin'],
      permissions: [],
    })

    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.token = 'persisted-opaque-token'
    store.user = { id: '1', name: 'stale-user' }

    await expect(store.restoreSession()).resolves.toBe(true)
    expect(getProfile).toHaveBeenCalledTimes(1)
    expect(store.sessionValidated).toBe(true)
    expect(store.user?.name).toBe('Admin')
  })

  it('returns false and preserves the expiration reason when profile 401 clears the session', async () => {
    const { authSessionBridge } = await import('@/services/auth/authSessionBridge')
    getProfile.mockImplementation(async () => {
      authSessionBridge.expire()
      throw new Error('UNAUTHORIZED')
    })

    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.token = 'expired-token'
    store.user = { id: '1', name: 'Admin' }

    await expect(store.restoreSession()).resolves.toBe(false)
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.sessionValidated).toBe(false)
    expect(store.sessionIssue).toBe('expired')
    expect(store.consumeSessionIssue()).toBe('expired')
    expect(store.sessionIssue).toBeNull()
  })
})
