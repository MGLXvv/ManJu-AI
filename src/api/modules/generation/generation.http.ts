import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { API_ERROR_CODES } from '@/types/api-enums'
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

  async create(_input: CreateGenerationTaskInput) {
    throw createApiError({
      message: API_ERROR_CODES.generationTaskHttpCreateUnsupported,
      code: API_ERROR_CODES.generationTaskHttpCreateUnsupported,
    })
  },

  async updateStatus(
    _id: string,
    _status: GenerationTaskStatus,
    _progress: number,
    _extras?: Pick<GenerationTask, 'result' | 'errorMessage'>,
  ) {
    throw createApiError({
      message: API_ERROR_CODES.generationTaskHttpUpdateUnsupported,
      code: API_ERROR_CODES.generationTaskHttpUpdateUnsupported,
    })
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