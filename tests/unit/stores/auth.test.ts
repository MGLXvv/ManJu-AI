import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authSessionBridge, useAuthStore } from '@/stores/auth'
import { isGuestOnly, requiresAuth } from '@/router/routeMeta'

describe('auth and route meta helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    authSessionBridge.clear()
  })

  it('detects protected routes', () => {
    expect(requiresAuth({ meta: { requiresAuth: true } })).toBe(true)
    expect(isGuestOnly({ meta: { guestOnly: true } })).toBe(true)
  })

  it('clears auth session through the bridge', () => {
    const store = useAuthStore()
    store.token = 'token-1'
    store.user = { id: 'user-1', name: 'Tester' }

    authSessionBridge.clear()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.forbidden).toBe(false)
  })
})
