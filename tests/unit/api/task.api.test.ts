import { describe, expect, it } from 'vitest'
import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { taskApi } from '@/api/task.api'

describe('task api', () => {
  it('proxies task lifecycle operations through the task boundary', async () => {
    const created = await taskApi.create({ projectId: 'task-api-project', type: 'storyboard', shotId: 'shot-1' })
    expect(created.status).toBe(GENERATION_TASK_STATUSES.queued)

    const listed = await taskApi.listByProject('task-api-project')
    expect(listed.some((task) => task.id === created.id)).toBe(true)

    const updated = await taskApi.updateStatus(created.id, GENERATION_TASK_STATUSES.running, 55)
    expect(updated?.status).toBe(GENERATION_TASK_STATUSES.running)

    const cancelled = await taskApi.cancel(created.id)
    expect(cancelled?.status).toBe(GENERATION_TASK_STATUSES.cancelled)

    const retried = await taskApi.retry(created.id)
    expect(retried?.status).toBe(GENERATION_TASK_STATUSES.queued)
  })
})
