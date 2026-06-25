import { http } from '@/api/http'
import { mapBackendAiTask, type EditorAiTask } from '@/api/modules/editor/aiTask.mapper'
import { isMockMode } from '@/api/shared/apiMode'

export const storyboardVoiceTaskService = {
  async createStoryboardVoiceTask(storyboardId: string): Promise<EditorAiTask | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.post(`/aidrama/storyboards/${storyboardId}/generate-voice`)
    return mapBackendAiTask(data)
  },
}
