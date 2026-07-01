import { createApiError } from '@/api/errors'
import { generationApi } from '@/api/modules/generation'
import { isMockMode } from '@/api/shared/apiMode'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { CreateGenerationTaskInput, GenerationTask } from '@/types/generation'

export interface WaitForTaskOptions {
  interval?: number
  timeout?: number
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })

export const waitForGenerationTask = async (
  taskId: string,
  options: WaitForTaskOptions = {},
): Promise<GenerationTask> => {
  const interval = options.interval ?? 600
  const timeout = options.timeout ?? 30000
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
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

    await sleep(interval)
  }

  throw new Error(API_ERROR_CODES.generationTaskTimeout)
}

export const createAndWaitGenerationTask = async (
  input: CreateGenerationTaskInput,
  options: WaitForTaskOptions = {},
): Promise<GenerationTask> => {
  if (!isMockMode) {
    throw createApiError({
      message: API_ERROR_CODES.generationTaskHttpCreateUnsupported,
      code: API_ERROR_CODES.generationTaskHttpCreateUnsupported,
    })
  }

  const created = await generationApi.create(input)
  return waitForGenerationTask(created.id, options)
}