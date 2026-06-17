import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { attachInterceptors } from '@/api/interceptors'
import { createApiError, isApiError } from '@/api/errors'

describe('api error helpers', () => {
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
})
