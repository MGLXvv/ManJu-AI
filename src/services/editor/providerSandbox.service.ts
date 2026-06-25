import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'

export interface ProviderSandboxSuccessInput {
  taskId: string
  providerTaskId?: string
  resultUrl: string
}

export const providerSandboxService = {
  async markTaskSuccess(input: ProviderSandboxSuccessInput): Promise<void> {
    if (isMockMode) {
      return
    }

    await http.post(`/aidrama/provider-sandbox/tasks/${input.taskId}/success`, {
      providerTaskId: input.providerTaskId ?? '',
      progress: 100,
      resultUrl: input.resultUrl,
    })
  },
}
