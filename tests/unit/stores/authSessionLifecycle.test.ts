import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const session = {
  token: 'http-token-1',
  user: { id: 'user-1', name: '测试用户' },
}

describe('auth store session lifecycle', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { resetLocalState } = await import('@/api/local')
    resetLocalState()
    setActivePinia(createPinia())
  })

  it('persists sessions returned by the api implementation', async () => {
    vi.doMock('@/api/auth.api', () => ({
      authApi: {
        loginByPassword: vi.fn().mockResolvedValue(session),
      },
    }))

    const { useAuthStore } = await import('@/stores/auth')
    const { authSessionRepository } = await import('@/services/auth/authSessionRepository')
    const store = useAuthStore()

    await store.loginByPassword({ account: 'admin', password: 'secret' })

    expect(store.isAuthenticated).toBe(true)
    expect(authSessionRepository.load()).toEqual(session)
  })

  it('restores an existing session when the store module loads', async () => {
    const { authSessionRepository } = await import('@/services/auth/authSessionRepository')
    authSessionRepository.save(session)
    vi.doMock('@/api/auth.api', () => ({ authApi: {} }))

    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()

    expect(store.token).toBe(session.token)
    expect(store.user).toEqual(session.user)
    expect(store.isAuthenticated).toBe(true)
  })

  it('clears the local session even when backend logout fails', async () => {
    const { authSessionRepository } = await import('@/services/auth/authSessionRepository')
    authSessionRepository.save(session)
    vi.doMock('@/api/auth.api', () => ({
      authApi: {
        logout: vi.fn().mockRejectedValue(new Error('logout failed')),
      },
    }))

    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()

    await expect(store.logout()).rejects.toThrow('logout failed')
    expect(store.isAuthenticated).toBe(false)
    expect(authSessionRepository.load()).toBeNull()
  })
})
