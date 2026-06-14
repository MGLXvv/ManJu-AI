import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'

export const shouldMockStoryboardGenerateFail = (input: { title: string; prompt: string }): boolean => {
  return hasAnyMockFailureToken([input.title, input.prompt], ['#mock-shot-fail'])
}

export const optimizeMockStoryboardPrompt = (prompt: string): string => {
  if (hasAnyMockFailureToken([prompt], ['#mock-optimize-fail'])) {
    throw new Error('STORYBOARD_OPTIMIZE_FAILED')
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

  if (code === 'STORYBOARD_GENERATE_FAILED') {
    return '分镜生成失败，请调整提示词后重试'
  }

  if (code === 'STORYBOARD_OPTIMIZE_FAILED') {
    return 'AI优化失败，请稍后再试'
  }

  return '分镜生成失败，请稍后再试'
}
