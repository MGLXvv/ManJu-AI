import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { GenerationTask } from '@/types/generation'

const { generationApiMock } = vi.hoisted(() => ({
  generationApiMock: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    cancel: vi.fn(),
    retry: vi.fn(),
  },
}))

vi.mock('@/api/modules/generation', () => ({
  generationApi: generationApiMock,
}))

import {
  generationTaskGateway,
  runGenerationTaskBatch,
} from '@/services/generation/generationTaskGateway'

const makeTask = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
  id: 'task-1',
  projectId: 'project-1',
  type: 'script',
  status: GENERATION_TASK_STATUSES.queued,
  progress: 0,
  createdAt: '2026-07-11T00:00:00.000Z',
  updatedAt: '2026-07-11T00:00:00.000Z',
  ...overrides,
})

describe('generationTaskGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates task lookup and lifecycle actions to the active adapter', async () => {
    const task = makeTask()
    generationApiMock.list.mockResolvedValue([task])
    generationApiMock.getById.mockResolvedValue(task)
    generationApiMock.cancel.mockResolvedValue(
      makeTask({ status: GENERATION_TASK_STATUSES.cancelled }),
    )
    generationApiMock.retry.mockResolvedValue(task)

    await expect(generationTaskGateway.listByProject('project-1')).resolves.toEqual([task])
    await expect(generationTaskGateway.getById('task-1')).resolves.toEqual(task)
    await expect(generationTaskGateway.cancel('task-1')).resolves.toMatchObject({
      status: GENERATION_TASK_STATUSES.cancelled,
    })
    await expect(generationTaskGateway.retry('task-1')).resolves.toEqual(task)

    expect(generationApiMock.list).toHaveBeenCalledWith('project-1')
    expect(generationApiMock.getById).toHaveBeenCalledWith('task-1')
    expect(generationApiMock.cancel).toHaveBeenCalledWith('task-1')
    expect(generationApiMock.retry).toHaveBeenCalledWith('task-1')
  })

  it('supports aborting an in-flight poll', async () => {
    const controller = new AbortController()
    generationApiMock.getById.mockResolvedValue(
      makeTask({ status: GENERATION_TASK_STATUSES.running, progress: 45 }),
    )

    const taskPromise = generationTaskGateway.waitForTask('task-1', {
      interval: 1000,
      timeout: 5000,
      signal: controller.signal,
    })

    await Promise.resolve()
    controller.abort()

    await expect(taskPromise).rejects.toThrow(API_ERROR_CODES.generationTaskAborted)
  })

  it('limits createAndWait execution to three active tasks', async () => {
    let activeCount = 0
    let maxActiveCount = 0

    generationApiMock.create.mockImplementation(async (input) => {
      activeCount += 1
      maxActiveCount = Math.max(maxActiveCount, activeCount)
      return makeTask({
        id: input.requestId,
        requestId: input.requestId,
      })
    })
    generationApiMock.getById.mockImplementation(async (taskId: string) => {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 2))
      activeCount -= 1
      return makeTask({
        id: taskId,
        requestId: taskId,
        status: GENERATION_TASK_STATUSES.success,
        progress: 100,
      })
    })

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        generationTaskGateway.createAndWait(
          {
            projectId: 'project-1',
            type: 'script',
            requestId: `request-${index}`,
          },
          { interval: 1, timeout: 100 },
        ),
      ),
    )

    expect(results).toHaveLength(5)
    expect(maxActiveCount).toBe(3)
  })

  it('limits batch concurrency and isolates individual failures', async () => {
    let activeCount = 0
    let maxActiveCount = 0

    const results = await runGenerationTaskBatch(
      [1, 2, 3, 4, 5],
      async (item) => {
        activeCount += 1
        maxActiveCount = Math.max(maxActiveCount, activeCount)

        await new Promise((resolve) => globalThis.setTimeout(resolve, 2))
        activeCount -= 1

        if (item === 3) {
          throw new Error('ITEM_3_FAILED')
        }

        return item * 2
      },
      { concurrency: 2 },
    )

    expect(maxActiveCount).toBe(2)
    expect(results).toHaveLength(5)
    expect(results[0]).toMatchObject({ status: 'fulfilled', value: 2 })
    expect(results[2]).toMatchObject({ status: 'rejected' })
    expect(results[4]).toMatchObject({ status: 'fulfilled', value: 10 })
  })

  it('recovers only queued and running project tasks and preserves partial failures', async () => {
    generationApiMock.list.mockResolvedValue([
      makeTask({ id: 'task-queued', status: GENERATION_TASK_STATUSES.queued }),
      makeTask({ id: 'task-running', status: GENERATION_TASK_STATUSES.running }),
      makeTask({ id: 'task-complete', status: GENERATION_TASK_STATUSES.success }),
    ])
    generationApiMock.getById.mockImplementation(async (taskId: string) => {
      if (taskId === 'task-running') {
        return makeTask({
          id: taskId,
          status: GENERATION_TASK_STATUSES.failed,
          errorMessage: 'RECOVER_FAILED',
        })
      }

      return makeTask({
        id: taskId,
        status: GENERATION_TASK_STATUSES.success,
        progress: 100,
      })
    })

    const results = await generationTaskGateway.recoverProjectTasks('project-1', {
      interval: 1,
      timeout: 20,
      concurrency: 1,
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      item: expect.objectContaining({ id: 'task-queued' }),
      status: 'fulfilled',
    })
    expect(results[1]).toMatchObject({
      item: expect.objectContaining({ id: 'task-running' }),
      status: 'rejected',
    })
    expect(generationApiMock.getById).not.toHaveBeenCalledWith('task-complete')
  })
})
