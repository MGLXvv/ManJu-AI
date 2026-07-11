import { describe, expect, it } from 'vitest'
import { generationApi } from '@/api/generation.api'


describe('generation task idempotency', () => {
  it('returns the existing project task when requestId is reused', async () => {
    const projectId = 'p-idempotency'
    const requestId = 'request-idempotency-1'
    const input = {
      projectId,
      requestId,
      type: 'script' as const,
      payload: { sourceText: 'source' },
    }

    const first = await generationApi.create(input)
    const second = await generationApi.create(input)
    const projectTasks = await generationApi.list(projectId)

    expect(second.id).toBe(first.id)
    expect(second.requestId).toBe(requestId)
    expect(projectTasks.filter((task) => task.requestId === requestId)).toHaveLength(1)
  })
})
