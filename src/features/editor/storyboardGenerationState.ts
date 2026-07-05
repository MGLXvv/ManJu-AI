import { resolveGenerationTaskErrorMessage } from '@/features/editor/generationErrorMessageState'
import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { API_ERROR_CODES } from '@/types/api-enums'

export const shouldMockStoryboardGenerateFail = (input: { title: string; prompt: string }): boolean => {
  return hasAnyMockFailureToken([input.title, input.prompt], ['#mock-shot-fail'])
}

export const optimizeMockStoryboardPrompt = (prompt: string): string => {
  if (hasAnyMockFailureToken([prompt], ['#mock-optimize-fail'])) {
    throw new Error(API_ERROR_CODES.storyboardOptimizeFailed)
  }

  const normalized = prompt.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return ''
  }

  const withLens = normalized.includes('镜头') ? normalized : `增加镜头调度与主体层次，${normalized}`
  const withLight = withLens.includes('光') ? withLens : `${withLens}，补充环境光影与景深关系`
  const withMood = withLight.includes('情绪') ? withLight : `${withLight}，强化角色情绪与动作指向`

  return withMood
}

export const buildStoryboardGenerateErrorMessage = (error: unknown): string => {
  const code = error instanceof Error ? error.message : String(error ?? '')
  const taskMessage = resolveGenerationTaskErrorMessage(error)

  if (taskMessage) {
    return taskMessage
  }

  if (code === 'STORYBOARD_IMAGE_REQUIRES_CHARACTER_AND_SCENE') {
    return '至少选择一个角色和一个场景'
  }

  if (code === 'STORYBOARD_IMAGE_REQUIRES_PERSISTED_SHOT') {
    return '请先保存分镜后，再生成分镜图'
  }

  if (code === API_ERROR_CODES.storyboardGenerateFailed) {
    return '分镜生成失败，请调整提示词后重试'
  }

  if (code === API_ERROR_CODES.storyboardOptimizeFailed) {
    return 'AI优化失败，请稍后再试'
  }

  if (code === API_ERROR_CODES.storyboardUpscaleFailed) {
    return '分镜放大失败，请稍后再试'
  }

  return '分镜生成失败，请稍后再试'
}
