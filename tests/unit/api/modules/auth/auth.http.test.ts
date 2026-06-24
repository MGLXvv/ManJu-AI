import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    post,
  },
}))

describe('authHttpApi', () => {
  beforeEach(() => {
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
      },
    })
  })
})
