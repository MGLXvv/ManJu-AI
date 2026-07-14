import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error The executable Node integration helper intentionally ships without TypeScript declarations.
import { createScriptContentRequestAdapter } from '../../../tools/integration/script-workspace-cli.mjs'

const successResponse = (): Response =>
  new Response(JSON.stringify({ code: 0, msg: 'success', data: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('Script Workspace CLI request adapter', () => {
  it('rewrites the generated-content payload to the real backend scriptContent field', async () => {
    const fetchImpl = vi.fn(async () => successResponse())
    const adaptedFetch = createScriptContentRequestAdapter(fetchImpl)

    await adaptedFetch('http://backend.test/admin-api/aidrama/projects/1/script/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'generated marker' }),
    })

    const [, init] = fetchImpl.mock.calls[0] ?? []
    expect(JSON.parse(String(init?.body))).toEqual({ scriptContent: 'generated marker' })
  })

  it('passes unrelated requests through without changing their body', async () => {
    const fetchImpl = vi.fn(async () => successResponse())
    const adaptedFetch = createScriptContentRequestAdapter(fetchImpl)
    const init = {
      method: 'PUT',
      body: JSON.stringify({ rawText: 'source', prompt: 'prompt' }),
    }

    await adaptedFetch('http://backend.test/admin-api/aidrama/projects/1/script/draft', init)

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://backend.test/admin-api/aidrama/projects/1/script/draft',
      init,
    )
  })
})
