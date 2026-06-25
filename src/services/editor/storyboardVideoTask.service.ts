import { http } from '@/api/http'
import { mapBackendAiTask, type EditorAiTask } from '@/api/modules/editor/aiTask.mapper'
import { isMockMode } from '@/api/shared/apiMode'

export const storyboardVideoTaskService = {
  async createStoryboardVideoTask(storyboardId: string): Promise<EditorAiTask | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.post(`/aidrama/storyboards/${storyboardId}/generate-video`)
    return mapBackendAiTask(data)
  },
}
