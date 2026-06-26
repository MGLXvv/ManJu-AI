import { http } from '@/api/http'
import { mapBackendAiTask, type EditorAiTask } from '@/api/modules/editor/aiTask.mapper'
import { isMockMode } from '@/api/shared/apiMode'

export const assetImageTaskService = {
  async createAssetImageTask(assetId: string, prompt?: string): Promise<EditorAiTask | null> {
    if (isMockMode) {
      return null
    }

    const trimmedPrompt = prompt?.trim()
    const payload = trimmedPrompt ? { prompt: trimmedPrompt } : {}
    const { data } = await http.post(`/aidrama/assets/${assetId}/generate-image`, payload)
    return mapBackendAiTask(data)
  },
}
