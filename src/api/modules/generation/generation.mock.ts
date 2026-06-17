import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { generateMockScript, optimizeMockScript } from '@/features/editor/scriptGenerationState'
import type {
  GenerationCancelTaskRequestDTO,
  GenerationCancelTaskResponseDTO,
  GenerationCreateTaskRequestDTO,
  GenerationCreateTaskResponseDTO,
  GenerationGetTaskResponseDTO,
  GenerationListTasksResponseDTO,
  GenerationRetryTaskRequestDTO,
  GenerationRetryTaskResponseDTO,
  GenerationUpdateTaskStatusRequestDTO,
  GenerationUpdateTaskStatusResponseDTO,
} from '@/types/api-dto'
import { delay, readLocal, writeLocal } from '@/api/local'
import type { GenerationApiContract, GenerationTask } from './generation.types'

const GENERATION_KEY = 'amd.generation.tasks'

const getTasks = (): GenerationTask[] => readLocal<GenerationTask[]>(GENERATION_KEY, [])
const setTasks = (tasks: GenerationTask[]): void => writeLocal(GENERATION_KEY, tasks)

const updateTaskInStorage = (id: string, patch: Partial<GenerationTask>): GenerationTask | null => {
  const tasks = getTasks()
  const index = tasks.findIndex((task) => task.id === id)
  if (index < 0) {
    return null
  }

  const next: GenerationTask = {
    ...tasks[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  tasks[index] = next
  setTasks(tasks)
  return next
}

const scheduleScriptTaskSettlement = (task: GenerationTask): void => {
  if (task.type !== 'script' && task.type !== 'script_optimize') {
    return
  }

  globalThis.setTimeout(() => {
    updateTaskInStorage(task.id, {
      status: GENERATION_TASK_STATUSES.running,
      progress: 45,
    })
  }, 20)

  globalThis.setTimeout(() => {
    try {
      const script =
        task.type === 'script'
          ? generateMockScript({
              sourceText: String(task.payload?.sourceText ?? ''),
              promptText: String(task.payload?.promptText ?? ''),
            })
          : optimizeMockScript(String(task.payload?.scriptText ?? ''))

      updateTaskInStorage(task.id, {
        status: GENERATION_TASK_STATUSES.success,
        progress: 100,
        result: { script },
        errorMessage: undefined,
      })
    } catch (error) {
      updateTaskInStorage(task.id, {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: error instanceof Error ? error.message : 'GENERATION_TASK_FAILED',
      })
    }
  }, 60)
}

export const generationMockApi: GenerationApiContract = {
  async list(projectId) {
    await delay()
    const response: GenerationListTasksResponseDTO = {
      tasks: getTasks().filter((task) => task.projectId === projectId),
    }
    return response.tasks
  },

  async getById(id) {
    await delay(60)
    const response: GenerationGetTaskResponseDTO = {
      task: getTasks().find((task) => task.id === id) ?? null,
    }
    return response.task
  },

  async create(input) {
    const request: GenerationCreateTaskRequestDTO = input
    await delay(80)
    const now = new Date().toISOString()
    const task: GenerationTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: request.projectId,
      type: request.type,
      shotId: request.shotId,
      status: GENERATION_TASK_STATUSES.queued,
      progress: 0,
      payload: request.payload,
      createdAt: now,
      updatedAt: now,
    }
    setTasks([task, ...getTasks()])
    scheduleScriptTaskSettlement(task)
    const response: GenerationCreateTaskResponseDTO = { task }
    return response.task
  },

  async updateStatus(id, status, progress, extras) {
    const request: GenerationUpdateTaskStatusRequestDTO = { id, status, progress, extras }
    await delay(60)
    const tasks = getTasks()
    const index = tasks.findIndex((task) => task.id === request.id)
    if (index < 0) {
      return null
    }
    const next: GenerationTask = {
      ...tasks[index],
      status: request.status,
      progress: request.progress,
      result: request.extras?.result ?? tasks[index].result,
      errorMessage: request.extras?.errorMessage ?? tasks[index].errorMessage,
      updatedAt: new Date().toISOString(),
    }
    tasks[index] = next
    setTasks(tasks)
    const response: GenerationUpdateTaskStatusResponseDTO = { task: next }
    return response.task
  },

  async cancel(id) {
    const request: GenerationCancelTaskRequestDTO = { id }
    const task = await this.getById(request.id)
    if (!task) {
      return null
    }

    const response: GenerationCancelTaskResponseDTO = {
      task: await this.updateStatus(request.id, GENERATION_TASK_STATUSES.cancelled, task.progress),
    }
    return response.task
  },

  async retry(id) {
    const request: GenerationRetryTaskRequestDTO = { id }
    await delay(80)
    const tasks = getTasks()
    const index = tasks.findIndex((task) => task.id === request.id)
    if (index < 0) {
      return null
    }

    const now = new Date().toISOString()
    const next: GenerationTask = {
      ...tasks[index],
      status: GENERATION_TASK_STATUSES.queued,
      progress: 0,
      errorMessage: undefined,
      updatedAt: now,
    }

    tasks[index] = next
    setTasks(tasks)
    scheduleScriptTaskSettlement(next)
    const response: GenerationRetryTaskResponseDTO = { task: next }
    return response.task
  },
}
