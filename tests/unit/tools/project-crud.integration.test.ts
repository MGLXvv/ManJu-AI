import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error The executable Node integration script intentionally ships without TypeScript declarations.
import { runProjectCrudVerification } from '../../../tools/integration/project-crud.mjs'

const successResponse = (data: unknown): Response =>
  new Response(JSON.stringify({ code: 0, msg: 'success', data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': 'request-test',
    },
  })

const failedResponse = (code: number, msg: string): Response =>
  new Response(JSON.stringify({ code, msg, data: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const config = {
  baseUrl: 'http://backend.test/admin-api',
  username: 'fixture-user',
  password: 'fixture-password',
  allowWrite: true,
  timeoutMs: 1000,
}

describe('live project CRUD verifier', () => {
  it('runs create, read, rename, delete and absence verification without exposing credentials', async () => {
    let detailReads = 0
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      const method = init?.method ?? 'GET'

      if (url.pathname.endsWith('/system/auth/login')) return successResponse({ accessToken: 'secret-token' })
      if (url.pathname.endsWith('/system/auth/profile')) return successResponse({ userId: 1, username: 'fixture-user' })
      if (url.pathname.endsWith('/aidrama/projects') && method === 'POST') {
        return successResponse({ id: 91, name: 'frontend-contract-test' })
      }
      if (url.pathname.endsWith('/aidrama/projects/91') && method === 'GET') {
        detailReads += 1
        return successResponse({
          id: 91,
          name: detailReads === 1 ? 'frontend-contract-test' : 'frontend-contract-test-renamed',
        })
      }
      if (url.pathname.endsWith('/aidrama/projects/91') && method === 'PUT') {
        return successResponse({
          id: 91,
          name: 'frontend-contract-test-renamed',
        })
      }
      if (url.pathname.endsWith('/aidrama/projects/91') && method === 'DELETE') return successResponse(null)
      if (url.pathname.endsWith('/aidrama/projects') && method === 'GET') {
        return successResponse({ list: [], total: 0 })
      }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`)
    })

    const report = await runProjectCrudVerification(config, {
      fetchImpl,
      now: () => new Date('2026-07-13T14:00:00.000Z'),
      projectName: 'frontend-contract-test',
    })

    expect(report.success).toBe(true)
    expect(report.steps).toHaveLength(8)
    expect(report.cleanup).toEqual({ attempted: false, succeeded: false })
    expect(JSON.stringify(report)).not.toContain('secret-token')
    expect(JSON.stringify(report)).not.toContain('fixture-password')

    const loginHeaders = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>
    const profileHeaders = fetchImpl.mock.calls[1]?.[1]?.headers as Record<string, string>
    expect(loginHeaders.Authorization).toBeUndefined()
    expect(profileHeaders.Authorization).toBe('Bearer secret-token')
  })

  it('attempts cleanup when a failure occurs after project creation', async () => {
    const requests: string[] = []
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      const method = init?.method ?? 'GET'
      requests.push(`${method} ${url.pathname}`)

      if (url.pathname.endsWith('/system/auth/login')) return successResponse({ accessToken: 'secret-token' })
      if (url.pathname.endsWith('/system/auth/profile')) return successResponse({ userId: 1 })
      if (url.pathname.endsWith('/aidrama/projects') && method === 'POST') return successResponse({ id: 92 })
      if (url.pathname.endsWith('/aidrama/projects/92') && method === 'GET') return successResponse({ id: 92 })
      if (url.pathname.endsWith('/aidrama/projects/92') && method === 'PUT') {
        return failedResponse(400, 'update rejected')
      }
      if (url.pathname.endsWith('/aidrama/projects/92') && method === 'DELETE') return successResponse(null)
      throw new Error(`Unexpected request: ${method} ${url.pathname}`)
    })

    const report = await runProjectCrudVerification(config, {
      fetchImpl,
      now: () => new Date('2026-07-13T14:00:00.000Z'),
      projectName: 'frontend-contract-test',
    })

    expect(report.success).toBe(false)
    expect(report.cleanup).toMatchObject({
      attempted: true,
      succeeded: true,
      code: 0,
    })
    expect(requests.at(-1)).toBe('DELETE /admin-api/aidrama/projects/92')
  })

  it('refuses all network calls without explicit write confirmation', async () => {
    const fetchImpl = vi.fn()
    const report = await runProjectCrudVerification(
      { ...config, allowWrite: false },
      { fetchImpl, now: () => new Date('2026-07-13T14:00:00.000Z') },
    )

    expect(report.success).toBe(false)
    expect(report.error?.name).toBe('WriteConfirmationRequired')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
