import { beforeEach, describe, expect, it } from 'vitest'
import { readLocal, resetLocalState } from '@/api/local'
import { AUTH_ERROR, AUTH_STORAGE_KEYS, authApi } from '@/api/modules/auth/auth.api'

describe('auth module api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('returns a mock session without persisting it inside the api layer', async () => {
    const session = await authApi.loginByPassword({
      account: 'admin11',
      password: '123456',
    })

    expect(session.token).toMatch(/^mock-token-/)
    expect(session.user).toMatchObject({
      id: 'user-1',
      name: 'admin11',
    })
    expect(readLocal<string | null>(AUTH_STORAGE_KEYS.token, null)).toBeNull()
    expect(readLocal(AUTH_STORAGE_KEYS.user, null)).toBeNull()
  })

  it('supports code login after requesting a verification code', async () => {
    const requested = await authApi.requestCode('admin11')
    const session = await authApi.loginByCode({
      account: 'admin11',
      code: requested.code,
    })

    expect(requested.code).toBe('123456')
    expect(session.user.name).toBe('admin11')
  })

  it('rejects duplicate account registration', async () => {
    await expect(
      authApi.register({
        username: 'admin11',
        account: 'admin11',
        code: '123456',
        password: '123456',
      }),
    ).rejects.toThrow(AUTH_ERROR.ACCOUNT_EXISTS)
  })

  it('logs out without owning session persistence', async () => {
    await expect(authApi.logout()).resolves.toBeUndefined()
  })
})
