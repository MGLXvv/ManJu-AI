import { generationApi } from '@/api/modules/generation'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type {
  CreateGenerationTaskInput,
  GenerationTask,
  GenerationTaskStatus,
} from '@/types/generation'

export interface GenerationTaskWaitOptions {
  interval?: number
  timeout?: number
  signal?: AbortSignal
}

export interface GenerationTaskBatchOptions {
  concurrency?: number
  signal?: AbortSignal
}

export interface GenerationTaskRecoveryOptions extends GenerationTaskWaitOptions {
  concurrency?: number
}

export type GenerationTaskBatchResult<TItem, TValue> =
  | {
      index: number
      item: TItem
      status: 'fulfilled'
      value: TValue
    }
  | {
      index: number
      item: TItem
      status: 'rejected'
      reason: unknown
    }

export interface GenerationTaskGateway {
  listByProject(projectId: string): Promise<GenerationTask[]>
  getById(taskId: string): Promise<GenerationTask | null>
  create(input: CreateGenerationTaskInput): Promise<GenerationTask>
  cancel(taskId: string): Promise<GenerationTask | null>
  retry(taskId: string): Promise<GenerationTask | null>
  waitForTask(taskId: string, options?: GenerationTaskWaitOptions): Promise<GenerationTask>
  createAndWait(
    input: CreateGenerationTaskInput,
    options?: GenerationTaskWaitOptions,
  ): Promise<GenerationTask>
  listRecoverableByProject(projectId: string): Promise<GenerationTask[]>
  recoverProjectTasks(
    projectId: string,
    options?: GenerationTaskRecoveryOptions,
  ): Promise<GenerationTaskBatchResult<GenerationTask, GenerationTask>[]>
}

const DEFAULT_POLL_INTERVAL = 600
const DEFAULT_TIMEOUT = 30000
const DEFAULT_BATCH_CONCURRENCY = 3

const RECOVERABLE_TASK_STATUSES = new Set<GenerationTaskStatus>([
  GENERATION_TASK_STATUSES.queued,
  GENERATION_TASK_STATUSES.running,
])

const createAbortError = (): Error => new Error(API_ERROR_CODES.generationTaskAborted)

const assertNotAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    assertNotAborted(signal)

    let timer: ReturnType<typeof globalThis.setTimeout>

    const onAbort = (): void => {
      globalThis.clearTimeout(timer)
      reject(createAbortError())
    }

    timer = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })
  })

const createRequestId = (input: CreateGenerationTaskInput): string =>
  [
    'generation',
    input.projectId,
    input.type,
    input.shotId ?? 'project',
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 8),
  ].join('-')

const normalizeConcurrency = (concurrency: number | undefined, itemCount: number): number => {
  if (itemCount === 0) {
    return 0
  }

  const normalized = Number.isFinite(concurrency)
    ? Math.floor(concurrency as number)
    : DEFAULT_BATCH_CONCURRENCY

  return Math.min(itemCount, Math.max(1, normalized))
}

export const runGenerationTaskBatch = async <TItem, TValue>(
  items: readonly TItem[],
  worker: (item: TItem, index: number) => Promise<TValue>,
  options: GenerationTaskBatchOptions = {},
): Promise<GenerationTaskBatchResult<TItem, TValue>[]> => {
  assertNotAborted(options.signal)

  const results = new Array<GenerationTaskBatchResult<TItem, TValue>>(items.length)
  const workerCount = normalizeConcurrency(options.concurrency, items.length)
  let cursor = 0

  const runWorker = async (): Promise<void> => {
    while (true) {
      assertNotAborted(options.signal)

      const index = cursor
      cursor += 1

      if (index >= items.length) {
        return
      }

      const item = items[index]

      try {
        const value = await worker(item, index)
        results[index] = {
          index,
          item,
          status: 'fulfilled',
          value,
        }
      } catch (reason) {
        results[index] = {
          index,
          item,
          status: 'rejected',
          reason,
        }
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))
  return results
}

const listByProject = (projectId: string): Promise<GenerationTask[]> => generationApi.list(projectId)

const getById = (taskId: string): Promise<GenerationTask | null> => generationApi.getById(taskId)

const create = (input: CreateGenerationTaskInput): Promise<GenerationTask> =>
  generationApi.create({
    ...input,
    requestId: input.requestId ?? createRequestId(input),
  })

const cancel = (taskId: string): Promise<GenerationTask | null> => generationApi.cancel(taskId)

const retry = (taskId: string): Promise<GenerationTask | null> => generationApi.retry(taskId)

const waitForTask = async (
  taskId: string,
  options: GenerationTaskWaitOptions = {},
): Promise<GenerationTask> => {
  const interval = options.interval ?? DEFAULT_POLL_INTERVAL
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    assertNotAborted(options.signal)

    const latest = await generationApi.getById(taskId)

    if (!latest) {
      throw new Error(API_ERROR_CODES.generationTaskNotFound)
    }

    if (latest.status === GENERATION_TASK_STATUSES.success) {
      return latest
    }

    if (latest.status === GENERATION_TASK_STATUSES.failed) {
      throw new Error(latest.errorMessage || API_ERROR_CODES.generationTaskFailed)
    }

    if (latest.status === GENERATION_TASK_STATUSES.cancelled) {
      throw new Error(API_ERROR_CODES.generationTaskCancelled)
    }

    await sleep(interval, options.signal)
  }

  throw new Error(API_ERROR_CODES.generationTaskTimeout)
}

const createAndWait = async (
  input: CreateGenerationTaskInput,
  options: GenerationTaskWaitOptions = {},
): Promise<GenerationTask> => {
  assertNotAborted(options.signal)
  const created = await create(input)
  return waitForTask(created.id, options)
}

const listRecoverableByProject = async (projectId: string): Promise<GenerationTask[]> => {
  const tasks = await listByProject(projectId)
  return tasks.filter((task) => RECOVERABLE_TASK_STATUSES.has(task.status))
}

const recoverProjectTasks = async (
  projectId: string,
  options: GenerationTaskRecoveryOptions = {},
): Promise<GenerationTaskBatchResult<GenerationTask, GenerationTask>[]> => {
  const tasks = await listRecoverableByProject(projectId)

  return runGenerationTaskBatch(
    tasks,
    (task) => waitForTask(task.id, options),
    {
      concurrency: options.concurrency,
      signal: options.signal,
    },
  )
}

export const generationTaskGateway: GenerationTaskGateway = {
  listByProject,
  getById,
  create,
  cancel,
  retry,
  waitForTask,
  createAndWait,
  listRecoverableByProject,
  recoverProjectTasks,
}
