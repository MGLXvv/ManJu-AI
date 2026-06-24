import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import { attachInterceptors } from '@/api/interceptors'
import { createApiError, isApiError } from '@/api/errors'

describe('api error helpers', () => {
  it('uses /admin-api as the default HTTP base URL fallback', () => {
    expect(http.defaults.baseURL).toBe('/admin-api')
  })

  it('builds a typed api error with code and status', () => {
    const error = createApiError({
      message: 'Unauthorized',
      code: 'AUTH_UNAUTHORIZED',
      status: 401,
    })

    expect(isApiError(error)).toBe(true)
    expect(error.code).toBe('AUTH_UNAUTHORIZED')
    expect(error.status).toBe(401)
  })

  it('injects bearer token when available', async () => {
    const client = axios.create()
    const getToken = vi.fn(() => 'token-123')
    attachInterceptors(client, {
      getToken,
      onUnauthorized: vi.fn(),
      onForbidden: vi.fn(),
    })

    const handler = (client.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (config: { headers: Record<string, string> }) => Promise<{ headers: Record<string, string> }> }>
    }).handlers[0].fulfilled
    const config = await handler({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer token-123')
  })

  it('unwraps CommonResult success responses to body.data', async () => {
    const client = axios.create()
    attachInterceptors(client, {
      getToken: () => null,
      onUnauthorized: vi.fn(),
      onForbidden: vi.fn(),
    })

    const handler = (client.interceptors.response as unknown as {
      handlers: Array<{
        fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
      }>
    }).handlers[0].fulfilled

    const response = await handler({
      status: 200,
      data: {
        code: 0,
        msg: 'ok',
        data: { token: 'abc' },
      },
    })

    expect(response.data).toEqual({ token: 'abc' })
  })

  it('throws ApiError when CommonResult business code is not zero', async () => {
    const client = axios.create()
    attachInterceptors(client, {
      getToken: () => null,
      onUnauthorized: vi.fn(),
      onForbidden: vi.fn(),
    })

    const handler = (client.interceptors.response as unknown as {
      handlers: Array<{
        fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
      }>
    }).handlers[0].fulfilled

    await expect(
      handler({
        status: 200,
        data: {
          code: 40001,
          msg: 'Login failed',
          data: null,
        },
      }),
    ).rejects.toMatchObject({
      message: 'Login failed',
      code: '40001',
      status: 200,
    })
  })

  it('calls onUnauthorized when CommonResult code is 401', async () => {
    const client = axios.create()
    const onUnauthorized = vi.fn()
    attachInterceptors(client, {
      getToken: () => null,
      onUnauthorized,
      onForbidden: vi.fn(),
    })

    const handler = (client.interceptors.response as unknown as {
      handlers: Array<{
        fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
      }>
    }).handlers[0].fulfilled

    await expect(
      handler({
        status: 200,
        data: {
          code: 401,
          msg: 'Unauthorized',
          data: null,
        },
      }),
    ).rejects.toBeTruthy()

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('passes through non-CommonResult responses unchanged', async () => {
    const client = axios.create()
    attachInterceptors(client, {
      getToken: () => null,
      onUnauthorized: vi.fn(),
      onForbidden: vi.fn(),
    })

    const handler = (client.interceptors.response as unknown as {
      handlers: Array<{
        fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
      }>
    }).handlers[0].fulfilled

    const response = await handler({
      status: 200,
      data: { session: { token: 'raw' } },
    })

    expect(response.data).toEqual({ session: { token: 'raw' } })
  })
})
