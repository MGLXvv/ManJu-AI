import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'

export const shouldMockVideoGenerateFail = (input: {
  title: string
  videoPrompt: string
  dialogue: string
}): boolean => hasAnyMockFailureToken([input.title, input.videoPrompt, input.dialogue], ['#mock-video-fail'])

export const buildVideoGenerateErrorMessage = (error: unknown): string => {
  const code = error instanceof Error ? error.message : String(error ?? '')

  if (code === 'VIDEO_GENERATE_FAILED') {
    return '视频生成失败，请调整提示词后重试'
  }

  return '视频生成失败，请稍后再试'
}

export const buildVideoBatchGenerateMessage = (input: { successCount: number; failedCount: number }): string => {
  if (input.successCount > 0 && input.failedCount === 0) {
    return `已完成 ${input.successCount} 个视频镜头的批量生成`
  }

  if (input.successCount === 0) {
    return '视频批量生成失败，请调整提示词后重试'
  }

  return `批量生成完成：成功 ${input.successCount} 个，失败 ${input.failedCount} 个`
}
