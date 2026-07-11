import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { taskApi } from '@/api/task.api'
import {
  generationTaskGateway,
  type GenerationTaskRecoveryOptions,
} from '@/services/generation/generationTaskGateway'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { CreateGenerationTaskInput, GenerationTask, GenerationTaskStatus } from '@/types/generation'

export const useGenerationStore = defineStore('generation', () => {
  const projectId = ref<string | null>(null)
  const tasks = ref<GenerationTask[]>([])
  const loading = ref(false)

  const activeTasks = computed(() =>
    tasks.value.filter(
      (task) => task.status === GENERATION_TASK_STATUSES.queued || task.status === GENERATION_TASK_STATUSES.running,
    ),
  )

  const upsertTask = (next: GenerationTask): void => {
    const index = tasks.value.findIndex((task) => task.id === next.id)
    if (index < 0) {
      tasks.value = [next, ...tasks.value]
      return
    }

    tasks.value = tasks.value.map((task) => (task.id === next.id ? next : task))
  }

  const hydrate = async (nextProjectId: string): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      projectId.value = nextProjectId
      tasks.value = await generationTaskGateway.listByProject(nextProjectId)
    } finally {
      loading.value = false
    }
  }

  const loadTasks = hydrate

  const createTask = async (
    input: Omit<CreateGenerationTaskInput, 'projectId'> & { projectId?: string },
  ): Promise<GenerationTask | null> => {
    const resolvedProjectId = input.projectId ?? projectId.value
    if (!resolvedProjectId) {
      return null
    }

    if (projectId.value !== resolvedProjectId) {
      projectId.value = resolvedProjectId
      tasks.value = await generationTaskGateway.listByProject(resolvedProjectId)
    }

    const created = await generationTaskGateway.create({
      ...input,
      projectId: resolvedProjectId,
    })
    upsertTask(created)
    return created
  }

  const syncTask = async (id: string): Promise<GenerationTask | null> => {
    const next = await generationTaskGateway.getById(id)
    if (!next) {
      return null
    }

    upsertTask(next)
    return next
  }

  const setTaskStatus = async (
    id: string,
    status: GenerationTaskStatus,
    progress = 0,
    extras?: Pick<GenerationTask, 'result' | 'errorMessage'>,
  ): Promise<GenerationTask | null> => {
    const next = await taskApi.updateStatus(id, status, progress, extras)
    if (!next) {
      return null
    }

    upsertTask(next)
    return next
  }

  const cancelTask = async (id: string): Promise<GenerationTask | null> => {
    const next = await generationTaskGateway.cancel(id)
    if (!next) {
      return null
    }

    upsertTask(next)
    return next
  }

  const retryTask = async (id: string): Promise<GenerationTask | null> => {
    const next = await generationTaskGateway.retry(id)
    if (!next) {
      return null
    }

    upsertTask(next)
    return next
  }

  const pollTask = async (
    id: string,
    intervalMs?: number,
    signal?: AbortSignal,
  ): Promise<GenerationTask | null> => {
    try {
      const next = await generationTaskGateway.waitForTask(id, {
        interval: intervalMs,
        signal,
      })
      upsertTask(next)
      return next
    } catch (error) {
      if (error instanceof Error && error.message === API_ERROR_CODES.generationTaskNotFound) {
        return null
      }
      throw error
    }
  }

  const recoverActiveTasks = async (options: GenerationTaskRecoveryOptions = {}) => {
    if (!projectId.value) {
      return []
    }

    const results = await generationTaskGateway.recoverProjectTasks(projectId.value, options)

    await Promise.all(
      results.map(async (result) => {
        if (result.status === 'fulfilled') {
          upsertTask(result.value)
          return
        }

        const latest = await generationTaskGateway.getById(result.item.id)
        if (latest) {
          upsertTask(latest)
        }
      }),
    )

    return results
  }

  return {
    projectId,
    tasks,
    activeTasks,
    loading,
    hydrate,
    loadTasks,
    createTask,
    syncTask,
    setTaskStatus,
    cancelTask,
    retryTask,
    pollTask,
    recoverActiveTasks,
  }
})
