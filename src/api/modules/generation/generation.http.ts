import { http } from '@/api/http'
import type { CreateGenerationTaskInput, GenerationApiContract, GenerationTask, GenerationTaskStatus } from './generation.types'

export const generationHttpApi: GenerationApiContract = {
  async list(projectId: string) {
    const { data } = await http.get('/generation/tasks', { params: { projectId } })
    return data.tasks
  },

  async getById(id: string) {
    const { data } = await http.get(`/generation/tasks/${id}`)
    return data.task
  },

  async create(input: CreateGenerationTaskInput) {
    const { data } = await http.post('/generation/tasks', input)
    return data.task
  },

  async updateStatus(
    id: string,
    status: GenerationTaskStatus,
    progress: number,
    extras?: Pick<GenerationTask, 'result' | 'errorMessage'>,
  ) {
    const { data } = await http.patch(`/generation/tasks/${id}`, {
      status,
      progress,
      extras,
    })
    return data.task
  },

  async cancel(id: string) {
    const { data } = await http.post(`/generation/tasks/${id}/cancel`)
    return data.task
  },

  async retry(id: string) {
    const { data } = await http.post(`/generation/tasks/${id}/retry`)
    return data.task
  },
}
