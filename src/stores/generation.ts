import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generationApi } from '@/api/generation.api'
import type { GenerationTask, GenerationTaskStatus, GenerationTaskType } from '@/types/generation'

export const useGenerationStore = defineStore('generation', () => {
  const projectId = ref<string | null>(null)
  const tasks = ref<GenerationTask[]>([])
  const loading = ref(false)

  const loadTasks = async (nextProjectId: string): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      projectId.value = nextProjectId
      tasks.value = await generationApi.list(nextProjectId)
    } finally {
      loading.value = false
    }
  }

  const createTask = async (type: GenerationTaskType, shotId?: string): Promise<void> => {
    if (!projectId.value) {
      return
    }
    const created = await generationApi.create({
      projectId: projectId.value,
      type,
      shotId,
    })
    tasks.value = [created, ...tasks.value]
  }

  const setTaskStatus = async (id: string, status: GenerationTaskStatus, progress = 0): Promise<void> => {
    const next = await generationApi.updateStatus(id, status, progress)
    if (!next) {
      return
    }
    tasks.value = tasks.value.map((task) => (task.id === id ? next : task))
  }

  return { projectId, tasks, loading, loadTasks, createTask, setTaskStatus }
})
