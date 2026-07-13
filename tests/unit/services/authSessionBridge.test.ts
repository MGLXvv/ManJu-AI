import { beforeEach, describe, expect, it, vi } from 'vitest'

const session = {
  token: 'opaque-session-token',
  user: { id: '1', name: 'Admin' },
}

describe('auth session bridge issues', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { resetLocalState } = await import('@/api/local')
    resetLocalState()
  })

  it('clears persisted session data and records expiration', async () => {
    const { applyAuthSession, authSessionBridge, authSessionState } = await import('@/services/auth/authSessionBridge')
    const { authSessionRepository } = await import('@/services/auth/authSessionRepository')

    applyAuthSession(session)
    authSessionBridge.expire()

    expect(authSessionState.token.value).toBeNull()
    expect(authSessionState.user.value).toBeNull()
    expect(authSessionState.sessionIssue.value).toBe('expired')
    expect(authSessionRepository.load()).toBeNull()
    expect(authSessionBridge.consumeSessionIssue()).toBe('expired')
    expect(authSessionState.sessionIssue.value).toBeNull()
  })

  it('keeps the session for forbidden responses and resets the flag after consumption', async () => {
    const { applyAuthSession, authSessionBridge, authSessionState } = await import('@/services/auth/authSessionBridge')

    applyAuthSession(session)
    authSessionBridge.markForbidden()

    expect(authSessionState.token.value).toBe(session.token)
    expect(authSessionState.forbidden.value).toBe(true)
    expect(authSessionBridge.consumeSessionIssue()).toBe('forbidden')
    expect(authSessionState.forbidden.value).toBe(false)
  })

  it('does not report expiration for an explicit clear', async () => {
    const { applyAuthSession, authSessionBridge, authSessionState } = await import('@/services/auth/authSessionBridge')

    applyAuthSession(session)
    authSessionBridge.clear()

    expect(authSessionState.sessionIssue.value).toBeNull()
  })
})
