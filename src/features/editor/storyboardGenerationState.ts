import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'

export const shouldMockStoryboardGenerateFail = (input: { title: string; prompt: string }): boolean => {
  return hasAnyMockFailureToken([input.title, input.prompt], ['#mock-shot-fail'])
}

export const buildStoryboardGenerateErrorMessage = (error: unknown): string => {
  const code = error instanceof Error ? error.message : String(error ?? '')

  if (code === 'STORYBOARD_GENERATE_FAILED') {
    return '分镜生成失败，请调整提示词后重试'
  }

  return '分镜生成失败，请稍后再试'
}
