import { generationApi } from './generation.api'

export const taskApi = {
  create: generationApi.create,
  getById: generationApi.getById,
  listByProject: generationApi.list,
  cancel: generationApi.cancel,
  retry: generationApi.retry,
  updateStatus: generationApi.updateStatus,
}
