import { resolveGenerationTaskErrorMessage } from '@/features/editor/generationErrorMessageState'
import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { API_ERROR_CODES } from '@/types/api-enums'

export const shouldMockDubbingGenerateFail = (input: { title: string; lines: string[] }): boolean => {
  return hasAnyMockFailureToken([input.title, ...input.lines], ['#mock-dubbing-fail'])
}

export const buildDubbingGenerateErrorMessage = (error: unknown): string => {
  const code = error instanceof Error ? error.message : String(error ?? '')
  const taskMessage = resolveGenerationTaskErrorMessage(error)

  if (taskMessage) {
    return taskMessage
  }

  if (code === API_ERROR_CODES.dubbingGenerateFailed) {
    return '配音生成失败，请调整对白后重试'
  }

  return '配音生成失败，请稍后再试'
}

export const buildDubbingBatchGenerateMessage = (input: { successCount: number; failedCount: number }): string => {
  if (input.successCount > 0 && input.failedCount === 0) {
    return `已完成 ${input.successCount} 个角色的批量配音`
  }

  if (input.successCount === 0) {
    return '批量配音失败，请调整对白后重试'
  }

  return `批量配音完成：成功 ${input.successCount} 个，失败 ${input.failedCount} 个`
}
