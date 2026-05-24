import type { GenerationTask, GenerationTaskStatus, GenerationTaskType } from '@/types/generation'
import { delay, readLocal, writeLocal } from './local'

const GENERATION_KEY = 'amd.generation.tasks'

const getTasks = (): GenerationTask[] => readLocal<GenerationTask[]>(GENERATION_KEY, [])
const setTasks = (tasks: GenerationTask[]): void => writeLocal(GENERATION_KEY, tasks)

export interface CreateTaskInput {
  projectId: string
  type: GenerationTaskType
  shotId?: string
}

export const generationApi = {
  async list(projectId: string): Promise<GenerationTask[]> {
    await delay()
    return getTasks().filter((task) => task.projectId === projectId)
  },

  async create(input: CreateTaskInput): Promise<GenerationTask> {
    await delay(80)
    const now = new Date().toISOString()
    const task: GenerationTask = {
      id: `task-${Date.now()}`,
      projectId: input.projectId,
      type: input.type,
      shotId: input.shotId,
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }
    setTasks([task, ...getTasks()])
    return task
  },

  async updateStatus(id: string, status: GenerationTaskStatus, progress: number): Promise<GenerationTask | null> {
    await delay(60)
    const tasks = getTasks()
    const index = tasks.findIndex((task) => task.id === id)
    if (index < 0) {
      return null
    }
    const next: GenerationTask = {
      ...tasks[index],
      status,
      progress,
      updatedAt: new Date().toISOString(),
    }
    tasks[index] = next
    setTasks(tasks)
    return next
  },
}
