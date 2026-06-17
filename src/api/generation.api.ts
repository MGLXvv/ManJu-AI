import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
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
import type { CreateGenerationTaskInput, GenerationTask, GenerationTaskStatus } from '@/types/generation'
import { delay, readLocal, writeLocal } from './local'

const GENERATION_KEY = 'amd.generation.tasks'

const getTasks = (): GenerationTask[] => readLocal<GenerationTask[]>(GENERATION_KEY, [])
const setTasks = (tasks: GenerationTask[]): void => writeLocal(GENERATION_KEY, tasks)

export const generationApi = {
  async list(projectId: string): Promise<GenerationTask[]> {
    await delay()
    const response: GenerationListTasksResponseDTO = {
      tasks: getTasks().filter((task) => task.projectId === projectId),
    }
    return response.tasks
  },

  async getById(id: string): Promise<GenerationTask | null> {
    await delay(60)
    const response: GenerationGetTaskResponseDTO = {
      task: getTasks().find((task) => task.id === id) ?? null,
    }
    return response.task
  },

  async create(input: CreateGenerationTaskInput): Promise<GenerationTask> {
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
    const response: GenerationCreateTaskResponseDTO = { task }
    return response.task
  },

  async updateStatus(
    id: string,
    status: GenerationTaskStatus,
    progress: number,
    extras?: Pick<GenerationTask, 'result' | 'errorMessage'>,
  ): Promise<GenerationTask | null> {
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

  async cancel(id: string): Promise<GenerationTask | null> {
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

  async retry(id: string): Promise<GenerationTask | null> {
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
    const response: GenerationRetryTaskResponseDTO = { task: next }
    return response.task
  },
}
