import { describe, expect, it } from 'vitest'
import { buildStoryboardGenerateErrorMessage, shouldMockStoryboardGenerateFail } from './storyboardGenerationState'

describe('storyboardGenerationState', () => {
  it('triggers mock failure when title or prompt contains the fail token', () => {
    expect(shouldMockStoryboardGenerateFail({ title: '#mock-shot-fail', prompt: '正常提示词' })).toBe(true)
    expect(shouldMockStoryboardGenerateFail({ title: '镜头 1', prompt: '#mock-shot-fail' })).toBe(true)
    expect(shouldMockStoryboardGenerateFail({ title: '镜头 1', prompt: '正常提示词' })).toBe(false)
  })

  it('maps stable generate errors to user-facing copy', () => {
    expect(buildStoryboardGenerateErrorMessage('STORYBOARD_GENERATE_FAILED')).toBe('分镜生成失败，请调整提示词后重试')
    expect(buildStoryboardGenerateErrorMessage('UNKNOWN_ERROR')).toBe('分镜生成失败，请稍后再试')
  })
})
