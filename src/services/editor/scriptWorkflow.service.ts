import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'

export const scriptWorkflowService = {
  async confirmScript(projectId: string): Promise<void> {
    if (isMockMode) {
      return
    }

    await http.post(`/aidrama/projects/${projectId}/script/confirm`)
  },
}
