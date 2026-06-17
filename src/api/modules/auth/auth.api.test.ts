import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { AUTH_ERROR, authApi, authStorageKeys } from './auth.api'

describe('auth module api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('logs in with password and persists a mock session', async () => {
    const session = await authApi.loginByPassword({
      account: 'admin11',
      password: '123456',
    })

    expect(session.token).toMatch(/^mock-token-/)
    expect(session.user).toMatchObject({
      id: 'user-1',
      name: 'admin11',
    })
    expect(authStorageKeys.token).toBe('amd.auth.token')
    expect(authStorageKeys.user).toBe('amd.auth.user')
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

  it('logs out after a successful login', async () => {
    await authApi.loginByPassword({
      account: 'admin11',
      password: '123456',
    })

    await expect(authApi.logout()).resolves.toBeUndefined()
  })
})
