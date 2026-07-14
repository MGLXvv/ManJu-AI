import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error The executable Node integration script intentionally ships without TypeScript declarations.
import { runScriptWorkspaceVerification } from '../../../tools/integration/script-workspace.mjs'

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

const markers = {
  source: 'script-source-test',
  prompt: 'script-prompt-test',
  generated: 'script-generated-test',
}

describe('live Script Workspace verifier', () => {
  it('verifies draft, generated content, confirmation and cleanup without exposing credentials', async () => {
    const workspace = {
      rawText: '',
      prompt: '',
      content: '',
      scriptStatus: 'DRAFT',
      canEnterStoryboard: false,
    }

    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      const method = init?.method ?? 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : undefined

      if (url.pathname.endsWith('/system/auth/login')) return successResponse({ accessToken: 'secret-token' })
      if (url.pathname.endsWith('/system/auth/profile')) return successResponse({ userId: 1 })
      if (url.pathname.endsWith('/aidrama/projects') && method === 'POST') return successResponse({ id: 201 })
      if (url.pathname.endsWith('/aidrama/projects/201/script/workspace') && method === 'GET') {
        return successResponse({ ...workspace })
      }
      if (url.pathname.endsWith('/aidrama/projects/201/script/draft') && method === 'PUT') {
        workspace.rawText = body.rawText
        workspace.prompt = body.prompt
        return successResponse(null)
      }
      if (url.pathname.endsWith('/aidrama/projects/201/script/content') && method === 'PUT') {
        workspace.content = body.content
        return successResponse(null)
      }
      if (url.pathname.endsWith('/aidrama/projects/201/script/confirm') && method === 'POST') {
        workspace.scriptStatus = 'CONFIRMED'
        workspace.canEnterStoryboard = true
        return successResponse(null)
      }
      if (url.pathname.endsWith('/aidrama/projects/201') && method === 'DELETE') return successResponse(null)
      if (url.pathname.endsWith('/aidrama/projects') && method === 'GET') {
        return successResponse({ list: [], total: 0 })
      }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`)
    })

    const report = await runScriptWorkspaceVerification(config, {
      fetchImpl,
      now: () => new Date('2026-07-14T03:00:00.000Z'),
      projectName: 'frontend-script-workspace-test',
      markers,
    })

    expect(report.success).toBe(true)
    expect(report.steps).toHaveLength(12)
    expect(report.workspace).toMatchObject({
      initialStatus: 'DRAFT',
      confirmedStatus: 'CONFIRMED',
      canEnterStoryboard: true,
    })
    expect(report.cleanup).toEqual({ attempted: false, succeeded: false })
    expect(JSON.stringify(report)).not.toContain('secret-token')
    expect(JSON.stringify(report)).not.toContain('fixture-password')

    const loginHeaders = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>
    const profileHeaders = fetchImpl.mock.calls[1]?.[1]?.headers as Record<string, string>
    expect(loginHeaders.Authorization).toBeUndefined()
    expect(profileHeaders.Authorization).toBe('Bearer secret-token')
  })

  it('attempts project cleanup when a Script Workspace write fails', async () => {
    const requests: string[] = []
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      const method = init?.method ?? 'GET'
      requests.push(`${method} ${url.pathname}`)

      if (url.pathname.endsWith('/system/auth/login')) return successResponse({ accessToken: 'secret-token' })
      if (url.pathname.endsWith('/system/auth/profile')) return successResponse({ userId: 1 })
      if (url.pathname.endsWith('/aidrama/projects') && method === 'POST') return successResponse({ id: 202 })
      if (url.pathname.endsWith('/aidrama/projects/202/script/workspace')) return successResponse({})
      if (url.pathname.endsWith('/aidrama/projects/202/script/draft') && method === 'PUT') {
        return failedResponse(400, 'draft rejected')
      }
      if (url.pathname.endsWith('/aidrama/projects/202') && method === 'DELETE') return successResponse(null)
      throw new Error(`Unexpected request: ${method} ${url.pathname}`)
    })

    const report = await runScriptWorkspaceVerification(config, {
      fetchImpl,
      now: () => new Date('2026-07-14T03:00:00.000Z'),
      projectName: 'frontend-script-workspace-test',
      markers,
    })

    expect(report.success).toBe(false)
    expect(report.cleanup).toMatchObject({ attempted: true, succeeded: true, code: 0 })
    expect(requests.at(-1)).toBe('DELETE /admin-api/aidrama/projects/202')
  })

  it('refuses all network calls without explicit write confirmation', async () => {
    const fetchImpl = vi.fn()
    const report = await runScriptWorkspaceVerification(
      { ...config, allowWrite: false },
      {
        fetchImpl,
        now: () => new Date('2026-07-14T03:00:00.000Z'),
        projectName: 'frontend-script-workspace-test',
        markers,
      },
    )

    expect(report.success).toBe(false)
    expect(report.error?.name).toBe('WriteConfirmationRequired')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
