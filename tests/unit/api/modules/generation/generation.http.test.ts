import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
    patch,
  },
}))

describe('generationHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    vi.resetModules()
  })

  it('rejects generic task creation in http mode', async () => {
    const { generationHttpApi } = await import('@/api/modules/generation/generation.http')

    await expect(
      generationHttpApi.create({
        projectId: 'project-1',
        type: 'script',
        payload: { sourceText: 'hello' },
      }),
    ).rejects.toThrow('GENERATION_TASK_HTTP_CREATE_UNSUPPORTED')

    expect(post).not.toHaveBeenCalled()
  })

  it('rejects direct task status updates in http mode', async () => {
    const { generationHttpApi } = await import('@/api/modules/generation/generation.http')

    await expect(
      generationHttpApi.updateStatus('task-1', 'running', 50, {
        result: { script: 'hello' },
      }),
    ).rejects.toThrow('GENERATION_TASK_HTTP_UPDATE_UNSUPPORTED')

    expect(patch).not.toHaveBeenCalled()
  })

  it('still allows task detail operations in http mode', async () => {
    get.mockResolvedValueOnce({ data: { tasks: [{ id: 'task-1', status: 'queued' }] } })
    get.mockResolvedValueOnce({ data: { task: { id: 'task-1', status: 'running' } } })
    post.mockResolvedValueOnce({ data: { task: { id: 'task-1', status: 'cancelled' } } })
    post.mockResolvedValueOnce({ data: { task: { id: 'task-1', status: 'queued' } } })

    const { generationHttpApi } = await import('@/api/modules/generation/generation.http')

    await expect(generationHttpApi.list('project-1')).resolves.toEqual([{ id: 'task-1', status: 'queued' }])
    await expect(generationHttpApi.getById('task-1')).resolves.toEqual({ id: 'task-1', status: 'running' })
    await expect(generationHttpApi.cancel('task-1')).resolves.toEqual({ id: 'task-1', status: 'cancelled' })
    await expect(generationHttpApi.retry('task-1')).resolves.toEqual({ id: 'task-1', status: 'queued' })

    expect(get).toHaveBeenCalledWith('/generation/tasks', { params: { projectId: 'project-1' } })
    expect(get).toHaveBeenCalledWith('/generation/tasks/task-1')
    expect(post).toHaveBeenCalledWith('/generation/tasks/task-1/cancel')
    expect(post).toHaveBeenCalledWith('/generation/tasks/task-1/retry')
  })
})