import { describe, expect, it, vi } from 'vitest'
import { runAuthSessionVerification } from '../../../tools/integration/auth-session.mjs'

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const config = {
  baseUrl: 'http://integration.test/admin-api',
  username: 'admin',
  password: 'not-persisted',
  timeoutMs: 1000,
}

describe('live auth session verifier', () => {
  it('accepts a valid session and records an invalid-token 401 without leaking secrets', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          code: 0,
          msg: 'success',
          data: { accessToken: 'opaque-secret-token', userId: 1 },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          code: 0,
          msg: 'success',
          data: { userId: 1, username: 'admin', roles: ['super_admin'], permissions: [] },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ code: 401, msg: 'Unauthorized', data: null }))

    const report = await runAuthSessionVerification(config, {
      fetchImpl,
      now: () => new Date('2026-07-14T00:00:00.000Z'),
    })

    expect(report.success).toBe(true)
    expect(report.steps).toHaveLength(3)
    expect(report.steps.at(-1)).toMatchObject({
      name: 'profile-invalid-token',
      ok: true,
      httpStatus: 200,
      code: 401,
    })

    const serialized = JSON.stringify(report)
    expect(serialized).not.toContain('opaque-secret-token')
    expect(serialized).not.toContain('not-persisted')
    expect(serialized.toLowerCase()).not.toContain('authorization')
  })

  it('fails when the backend accepts the intentionally invalid token', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ code: 0, msg: 'success', data: { token: 'opaque-token' } }))
      .mockResolvedValueOnce(jsonResponse({ code: 0, msg: 'success', data: { userId: 1 } }))
      .mockResolvedValueOnce(jsonResponse({ code: 0, msg: 'success', data: { userId: 1 } }))

    const report = await runAuthSessionVerification(config, { fetchImpl })

    expect(report.success).toBe(false)
    expect(report.error?.message).toContain('did not return an unauthorized result')
  })
})
