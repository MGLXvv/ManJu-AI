import { describe, expect, it } from 'vitest'
import { MOCK_FAILURE_RULES, getMockFailureRulesByScope, hasAnyMockFailureToken } from '@/features/shared/mockFailureState'

describe('mockFailureState', () => {
  it('exposes the registered failure tokens by scope', () => {
    expect(getMockFailureRulesByScope('video-generate')).toEqual([
      { token: '#mock-video-fail', scope: 'video-generate', description: '触发视频生成失败' },
    ])
  })

  it('detects when any input includes a registered token', () => {
    expect(hasAnyMockFailureToken(['正常内容', '包含 #mock-save-fail 的文本'], ['#mock-save-fail'])).toBe(true)
  })

  it('keeps the registry focused on supported mock flows', () => {
    expect(MOCK_FAILURE_RULES.map((rule) => rule.token)).toEqual([
      '#mock-generate-fail',
      '#mock-optimize-fail',
      '#mock-save-fail',
      '#mock-image-fail',
      '#mock-shot-fail',
      '#mock-video-fail',
      '#mock-dubbing-fail',
    ])
  })
})
