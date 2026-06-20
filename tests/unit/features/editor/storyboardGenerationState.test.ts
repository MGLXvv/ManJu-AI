import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'
import {
  buildStoryboardGenerateErrorMessage,
  optimizeMockStoryboardPrompt,
  shouldMockStoryboardGenerateFail,
} from '@/features/editor/storyboardGenerationState'

describe('storyboardGenerationState', () => {
  it('triggers mock failure when title or prompt contains the fail token', () => {
    expect(shouldMockStoryboardGenerateFail({ title: '#mock-shot-fail', prompt: '正常提示词' })).toBe(true)
    expect(shouldMockStoryboardGenerateFail({ title: '镜头 1', prompt: '#mock-shot-fail' })).toBe(true)
    expect(shouldMockStoryboardGenerateFail({ title: '镜头 1', prompt: '正常提示词' })).toBe(false)
  })

  it('maps stable generate errors to user-facing copy', () => {
    expect(buildStoryboardGenerateErrorMessage(API_ERROR_CODES.storyboardGenerateFailed)).toBe('分镜生成失败，请调整提示词后重试')
    expect(buildStoryboardGenerateErrorMessage(API_ERROR_CODES.storyboardOptimizeFailed)).toBe('AI优化失败，请稍后再试')
    expect(buildStoryboardGenerateErrorMessage(API_ERROR_CODES.storyboardUpscaleFailed)).toBe('分镜放大失败，请稍后再试')
    expect(buildStoryboardGenerateErrorMessage('UNKNOWN_ERROR')).toBe('分镜生成失败，请稍后再试')
  })

  it('maps generic task errors before falling back to storyboard copy', () => {
    expect(buildStoryboardGenerateErrorMessage(API_ERROR_CODES.generationTaskTimeout)).toBe(
      '生成任务等待超时，请稍后查看结果或重新生成',
    )
  })

  it('optimizes storyboard prompt into a richer visual description', () => {
    const optimized = optimizeMockStoryboardPrompt('夜晚街道霓虹灯闪烁，角色在雨中停步回头')

    expect(optimized).toContain('镜头')
    expect(optimized).toContain('光')
    expect(optimized).toContain('情绪')
  })

  it('throws a stable error code when mocked optimization should fail', () => {
    expect(() => optimizeMockStoryboardPrompt('#mock-optimize-fail')).toThrowError(API_ERROR_CODES.storyboardOptimizeFailed)
  })
})
