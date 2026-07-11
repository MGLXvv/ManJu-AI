import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { GenerationTask } from '@/types/generation'

const { generationApiMock } = vi.hoisted(() => ({
  generationApiMock: {
    create: vi.fn(),
    getById: vi.fn(),
  },
}))

vi.mock('@/api/modules/generation', () => ({
  generationApi: generationApiMock,
}))

import { createAndWaitGenerationTask, waitForGenerationTask } from '@/services/generation/generationTaskRunner'

const makeTask = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
  id: 'task-1',
  projectId: 'project-1',
  type: 'script',
  status: GENERATION_TASK_STATUSES.queued,
  progress: 0,
  createdAt: '2026-06-19T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
  ...overrides,
})

describe('generationTaskRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a task and waits for the latest success result', async () => {
    generationApiMock.create.mockResolvedValue(makeTask({ id: 'task-1' }))
    generationApiMock.getById
      .mockResolvedValueOnce(makeTask({ status: GENERATION_TASK_STATUSES.running, progress: 50 }))
      .mockResolvedValueOnce(
        makeTask({
          status: GENERATION_TASK_STATUSES.success,
          progress: 100,
          result: { script: '第一幕：角色出场' },
        }),
      )

    const task = await createAndWaitGenerationTask(
      {
        projectId: 'project-1',
        type: 'script',
        payload: { sourceText: 'source', promptText: 'prompt', modelId: 'gpt-4.0' },
      },
      { interval: 1, timeout: 50 },
    )

    expect(generationApiMock.create).toHaveBeenCalledTimes(1)
    expect(generationApiMock.create.mock.calls[0]?.[0].requestId).toMatch(/^generation-project-1-script-/)
    expect(task.status).toBe(GENERATION_TASK_STATUSES.success)
    expect(task.result).toEqual({ script: '第一幕：角色出场' })
  })

  it('preserves an explicit request id', async () => {
    generationApiMock.create.mockResolvedValue(makeTask({ id: 'task-1', requestId: 'request-1' }))
    generationApiMock.getById.mockResolvedValue(
      makeTask({ status: GENERATION_TASK_STATUSES.success, requestId: 'request-1' }),
    )

    await createAndWaitGenerationTask(
      {
        projectId: 'project-1',
        type: 'script',
        requestId: 'request-1',
      },
      { interval: 1, timeout: 50 },
    )

    expect(generationApiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'request-1' }),
    )
  })

  it('propagates adapter task creation errors without falling back to mock', async () => {
    generationApiMock.create.mockRejectedValue(
      new Error(API_ERROR_CODES.generationTaskHttpCreateUnsupported),
    )

    await expect(
      createAndWaitGenerationTask({
        projectId: 'project-1',
        type: 'script',
        payload: { sourceText: 'source' },
      }),
    ).rejects.toThrow(API_ERROR_CODES.generationTaskHttpCreateUnsupported)

    expect(generationApiMock.create).toHaveBeenCalledTimes(1)
    expect(generationApiMock.getById).not.toHaveBeenCalled()
  })

  it('throws generationTaskNotFound when the task cannot be fetched', async () => {
    generationApiMock.getById.mockResolvedValue(null)

    await expect(waitForGenerationTask('task-1')).rejects.toThrow(API_ERROR_CODES.generationTaskNotFound)
  })

  it('preserves task failure errorMessage when present', async () => {
    generationApiMock.getById.mockResolvedValue(
      makeTask({
        status: GENERATION_TASK_STATUSES.failed,
        errorMessage: API_ERROR_CODES.storyboardGenerateFailed,
      }),
    )

    await expect(waitForGenerationTask('task-1')).rejects.toThrow(API_ERROR_CODES.storyboardGenerateFailed)
  })

  it('falls back to generationTaskFailed when the task fails without errorMessage', async () => {
    generationApiMock.getById.mockResolvedValue(
      makeTask({
        status: GENERATION_TASK_STATUSES.failed,
        errorMessage: '',
      }),
    )

    await expect(waitForGenerationTask('task-1')).rejects.toThrow(API_ERROR_CODES.generationTaskFailed)
  })

  it('throws generationTaskCancelled when the task is cancelled', async () => {
    generationApiMock.getById.mockResolvedValue(
      makeTask({
        status: GENERATION_TASK_STATUSES.cancelled,
      }),
    )

    await expect(waitForGenerationTask('task-1')).rejects.toThrow(API_ERROR_CODES.generationTaskCancelled)
  })

  it('throws generationTaskTimeout when polling exceeds the timeout window', async () => {
    vi.useFakeTimers()
    generationApiMock.getById.mockResolvedValue(
      makeTask({
        status: GENERATION_TASK_STATUSES.running,
        progress: 45,
      }),
    )

    const taskPromise = waitForGenerationTask('task-1', { interval: 5, timeout: 10 })
    const assertion = expect(taskPromise).rejects.toThrow(API_ERROR_CODES.generationTaskTimeout)
    await vi.advanceTimersByTimeAsync(15)

    await assertion
  })
})
