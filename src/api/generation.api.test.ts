import { describe, expect, it } from 'vitest'
import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { generationApi } from './generation.api'

describe('generation task api', () => {
  it('creates a queued task with backend-ready status fields', async () => {
    const task = await generationApi.create({ projectId: 'p1', type: 'storyboard' })

    expect(task.status).toBe(GENERATION_TASK_STATUSES.queued)
    expect(task.progress).toBe(0)
    expect(task.projectId).toBe('p1')
    expect(task.createdAt).toBeTruthy()
  })

  it('supports task lifecycle actions', async () => {
    const task = await generationApi.create({ projectId: 'p-lifecycle', type: 'video', shotId: 'shot-1' })
    const running = await generationApi.updateStatus(task.id, GENERATION_TASK_STATUSES.running, 40)
    const cancelled = await generationApi.cancel(task.id)
    const retried = await generationApi.retry(task.id)

    expect(running?.status).toBe(GENERATION_TASK_STATUSES.running)
    expect(cancelled?.status).toBe(GENERATION_TASK_STATUSES.cancelled)
    expect(retried?.status).toBe(GENERATION_TASK_STATUSES.queued)
    expect(retried?.progress).toBe(0)
    expect(await generationApi.getById(task.id)).toMatchObject({
      id: task.id,
      projectId: 'p-lifecycle',
      shotId: 'shot-1',
    })
  })
})
