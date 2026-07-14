import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { extractBackendEntity, extractBackendList } from '@/api/shared/backendPayload'
import { requireCapability } from '@/features/capabilities/capabilityRegistry'
import { API_ERROR_CODES } from '@/types/api-enums'
import { mapBackendGenerationTask, type BackendGenerationTaskDTO } from './generation.mapper'
import type { CreateGenerationTaskInput, GenerationApiContract, GenerationTask, GenerationTaskStatus } from './generation.types'

const GENERATION_TASKS_PATH = '/generation/tasks'

/**
 * Phase1 exposes list/detail/cancel/retry as real task-control endpoints backed by the existing AI task table.
 * Generic create/update remain controlled rejects: business generation must use the specific Script, Asset,
 * Storyboard, Video or Voice submit endpoint and then return through GenerationTaskGateway.
 */
export const generationHttpApi: GenerationApiContract = {
  async list(projectId: string) {
    const { data } = await http.get(GENERATION_TASKS_PATH, {
      params: { projectId, pageNo: 1, pageSize: 100 },
    })
    return extractBackendList<BackendGenerationTaskDTO>(data, ['tasks']).map(mapBackendGenerationTask)
  },

  async getById(id: string) {
    const { data } = await http.get(`${GENERATION_TASKS_PATH}/${id}`)
    const task = extractBackendEntity<BackendGenerationTaskDTO>(data, ['task'])
    return task ? mapBackendGenerationTask(task) : null
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
    requireCapability('generation.cancel')
    const { data } = await http.post(`${GENERATION_TASKS_PATH}/${id}/cancel`)
    const task = extractBackendEntity<BackendGenerationTaskDTO>(data, ['task'])
    return task ? mapBackendGenerationTask(task) : null
  },

  async retry(id: string) {
    requireCapability('generation.retry')
    const { data } = await http.post(`${GENERATION_TASKS_PATH}/${id}/retry`)
    const task = extractBackendEntity<BackendGenerationTaskDTO>(data, ['task'])
    return task ? mapBackendGenerationTask(task) : null
  },
}
