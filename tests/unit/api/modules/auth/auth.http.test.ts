import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
  },
}))

describe('authHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('maps password login to backend /system/auth/login contract', async () => {
    post.mockResolvedValue({
      data: {
        userId: 101,
        username: 'admin',
        accessToken: 'backend-token',
      },
    })

    const { authHttpApi } = await import('@/api/modules/auth/auth.http')

    const session = await authHttpApi.loginByPassword({
      account: 'admin',
      password: '123456',
    })

    expect(post).toHaveBeenCalledWith('/system/auth/login', {
      username: 'admin',
      password: '123456',
    })
    expect(session).toEqual({
      token: 'backend-token',
      user: {
        id: '101',
        name: 'admin',
        username: 'admin',
      },
    })
  })

  it('maps the backend profile into the persisted auth user', async () => {
    get.mockResolvedValue({
      data: {
        userId: 1,
        username: 'admin',
        nickname: 'Admin',
        roles: ['super_admin'],
        permissions: ['aidrama:project:read', 'aidrama:project:write'],
      },
    })

    const { authHttpApi } = await import('@/api/modules/auth/auth.http')
    const profile = await authHttpApi.getProfile?.()

    expect(get).toHaveBeenCalledWith('/system/auth/profile')
    expect(profile).toEqual({
      id: '1',
      name: 'Admin',
      username: 'admin',
      nickname: 'Admin',
      roles: ['super_admin'],
      permissions: ['aidrama:project:read', 'aidrama:project:write'],
    })
  })
})
