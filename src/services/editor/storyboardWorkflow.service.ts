import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'

export const storyboardWorkflowService = {
  async confirmStoryboard(projectId: string): Promise<void> {
    if (isMockMode) {
      return
    }

    await http.post(`/aidrama/projects/${projectId}/storyboard/confirm`)
  },
}
