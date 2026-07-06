import { API_ERROR_CODES } from '@/types/api-enums'

export const resolveGenerationTaskErrorMessage = (error: unknown): string | null => {
  const code = error instanceof Error ? error.message : String(error ?? '')

  switch (code) {
    case API_ERROR_CODES.generationTaskNotFound:
      return '生成任务不存在，请刷新后重试'
    case API_ERROR_CODES.generationTaskTimeout:
      return '生成任务等待超时，请稍后查看结果或重新生成'
    case API_ERROR_CODES.generationTaskCancelled:
      return '生成任务已取消'
    case API_ERROR_CODES.generationTaskFailed:
      return '生成任务失败，请稍后再试'
    case API_ERROR_CODES.generationTaskHttpPending:
      return '生成任务已提交，结果仍在处理中，请稍后刷新工作区查看结果'
    default:
      return null
  }
}
