import { resolveGenerationTaskErrorMessage } from '@/features/editor/generationErrorMessageState'
import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { API_ERROR_CODES } from '@/types/api-enums'

export const shouldMockVideoGenerateFail = (input: {
  title: string
  videoPrompt: string
  dialogue: string
}): boolean => hasAnyMockFailureToken([input.title, input.videoPrompt, input.dialogue], ['#mock-video-fail'])

const appendOptimizeSuffix = (value: string, suffix: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.includes(suffix) ? trimmed : `${trimmed}${suffix}`
}

export const optimizeMockVideoPrompt = async (prompt: string): Promise<string> => {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 420))
  if (prompt.includes('#mock-optimize-fail')) {
    throw new Error(API_ERROR_CODES.videoOptimizeFailed)
  }

  return appendOptimizeSuffix(prompt, ' 镜头运动更明确，主体层次更清晰，氛围光影更聚焦。')
}

export const optimizeMockVideoDialogue = async (dialogue: string): Promise<string> => {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 420))
  if (dialogue.includes('#mock-optimize-fail')) {
    throw new Error(API_ERROR_CODES.videoOptimizeFailed)
  }

  return appendOptimizeSuffix(dialogue, ' 情绪更集中，语气更自然，停顿节奏更适合配音。')
}

export const buildVideoGenerateErrorMessage = (error: unknown): string => {
  const code = error instanceof Error ? error.message : String(error ?? '')
  const taskMessage = resolveGenerationTaskErrorMessage(error)

  if (taskMessage) {
    return taskMessage
  }

  if (code === API_ERROR_CODES.storyboardVideoRequiresPersistedShot) {
    return '请先保存分镜后，再生成视频'
  }

  if (code === API_ERROR_CODES.storyboardVideoImageRequired) {
    return '请先在分镜生成步骤生成该镜头图片'
  }

  if (code === API_ERROR_CODES.storyboardVideoParametersRequired) {
    return '请先补全当前镜头的多参配置：角色、场景、画面描述、图像风格和画面比例'
  }

  if (code === API_ERROR_CODES.videoGenerateFailed) {
    return '视频生成失败，请调整提示词后重试'
  }

  if (code === API_ERROR_CODES.videoOptimizeFailed) {
    return 'AI优化失败，请稍后再试'
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
