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

  it('maps canonical task pages and direct task entities', async () => {
    get.mockResolvedValueOnce({
      data: {
        list: [
          {
            id: 1,
            projectId: 7,
            taskType: 'VIDEO',
            status: 'RUNNING',
            progress: 42,
            createTime: '2026-07-14T01:00:00',
            updateTime: '2026-07-14T01:01:00',
          },
        ],
        total: 1,
      },
    })
    get.mockResolvedValueOnce({
      data: {
        id: 1,
        projectId: 7,
        taskType: 'VIDEO',
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/sandbox-results/tasks/1.mp4',
      },
    })

    const { generationHttpApi } = await import('@/api/modules/generation/generation.http')

    const tasks = await generationHttpApi.list('7')
    const detail = await generationHttpApi.getById('1')

    expect(tasks[0]).toMatchObject({
      id: '1',
      projectId: '7',
      type: 'video',
      status: 'running',
      progress: 42,
    })
    expect(detail).toMatchObject({
      id: '1',
      projectId: '7',
      type: 'video',
      status: 'success',
      progress: 100,
      result: { url: '/sandbox-results/tasks/1.mp4' },
    })
    expect(get).toHaveBeenNthCalledWith(1, '/generation/tasks', {
      params: { projectId: '7', pageNo: 1, pageSize: 100 },
    })
    expect(get).toHaveBeenNthCalledWith(2, '/generation/tasks/1')
  })

  it('rejects unknown task types and statuses instead of treating them as normal work', async () => {
    get.mockResolvedValueOnce({
      data: {
        list: [{ id: 1, projectId: 7, taskType: 'UNREGISTERED', status: 'RUNNING' }],
      },
    })

    const { generationHttpApi } = await import('@/api/modules/generation/generation.http')

    await expect(generationHttpApi.list('7')).rejects.toThrow('GENERATION_TASK_TYPE_UNSUPPORTED')

    get.mockResolvedValueOnce({
      data: {
        list: [{ id: 1, projectId: 7, taskType: 'VIDEO', status: 'PAUSED' }],
      },
    })

    await expect(generationHttpApi.list('7')).rejects.toThrow('GENERATION_TASK_STATUS_UNSUPPORTED')
  })

  it('keeps legacy wrappers compatible for cancel and retry', async () => {
    post.mockResolvedValueOnce({
      data: { task: { id: 'task-1', projectId: 'project-1', type: 'script', status: 'cancelled' } },
    })
    post.mockResolvedValueOnce({
      data: { task: { id: 'task-1', projectId: 'project-1', type: 'script', status: 'queued' } },
    })

    const { generationHttpApi } = await import('@/api/modules/generation/generation.http')

    await expect(generationHttpApi.cancel('task-1')).resolves.toMatchObject({ status: 'cancelled' })
    await expect(generationHttpApi.retry('task-1')).resolves.toMatchObject({ status: 'queued' })

    expect(post).toHaveBeenCalledWith('/generation/tasks/task-1/cancel')
    expect(post).toHaveBeenCalledWith('/generation/tasks/task-1/retry')
  })
})
