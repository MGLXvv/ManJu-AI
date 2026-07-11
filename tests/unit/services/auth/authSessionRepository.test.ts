import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { authSessionRepository } from '@/services/auth/authSessionRepository'

describe('authSessionRepository', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('persists and restores a complete session', () => {
    authSessionRepository.save({
      token: 'token-1',
      user: { id: 'user-1', name: '测试用户' },
    })

    expect(authSessionRepository.load()).toEqual({
      token: 'token-1',
      user: { id: 'user-1', name: '测试用户' },
    })
  })

  it('returns null for incomplete session data', () => {
    expect(authSessionRepository.load()).toBeNull()
  })

  it('clears persisted session data', () => {
    authSessionRepository.save({
      token: 'token-1',
      user: { id: 'user-1', name: '测试用户' },
    })

    authSessionRepository.clear()

    expect(authSessionRepository.load()).toBeNull()
  })
})
