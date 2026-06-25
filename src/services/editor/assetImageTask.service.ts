import { http } from '@/api/http'
import { mapBackendAiTask, type EditorAiTask } from '@/api/modules/editor/aiTask.mapper'
import { isMockMode } from '@/api/shared/apiMode'

export const assetImageTaskService = {
  async createAssetImageTask(assetId: string, prompt?: string): Promise<EditorAiTask | null> {
    if (isMockMode) {
      return null
    }

    const trimmedPrompt = prompt?.trim()
    const request = trimmedPrompt
      ? http.post(`/aidrama/assets/${assetId}/generate-image`, { prompt: trimmedPrompt })
      : http.post(`/aidrama/assets/${assetId}/generate-image`)

    const { data } = await request
    return mapBackendAiTask(data)
  },
}
