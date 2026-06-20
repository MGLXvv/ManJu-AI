import { describe, expect, it } from 'vitest'
import {
  canEnterStoryboard,
  generateMockScript,
  optimizeMockScript,
} from '@/features/editor/scriptGenerationState'

describe('scriptGenerationState', () => {
  it('treats non-empty generated script as ready for storyboard', () => {
    expect(canEnterStoryboard('  第一幕内容  ')).toBe(true)
    expect(canEnterStoryboard('   ')).toBe(false)
  })

  it('builds a deterministic script from source text and prompt', () => {
    const result = generateMockScript({
      sourceText: '八戒减肥记讲述八戒在伙伴帮助下逐渐战胜惰性，最终完成蜕变。',
      promptText: '请压缩到三幕结构，突出成长转折。',
    })

    expect(result).toContain('第一幕')
    expect(result).toContain('八戒减肥记讲述八戒在伙伴帮助下逐渐战胜惰性')
    expect(result).toContain('请压缩到三幕结构，突出成长转折')
  })

  it('optimizes an existing generated script instead of returning it unchanged', () => {
    const original = '第一幕：角色陷入困境。\n\n第二幕：冲突升级。\n\n第三幕：完成成长。'

    const optimized = optimizeMockScript(original)

    expect(optimized).not.toBe(original)
    expect(optimized).toContain('优化版')
    expect(optimized).toContain('情绪推进')
  })

  it('throws a stable error code when mocked generation should fail', () => {
    expect(() =>
      generateMockScript({
        sourceText: '#mock-generate-fail',
        promptText: '正常提示词',
      }),
    ).toThrowError('SCRIPT_GENERATE_FAILED')
  })

  it('throws a stable error code when mocked optimization should fail', () => {
    expect(() => optimizeMockScript('第一幕内容\n\n#mock-optimize-fail')).toThrowError('SCRIPT_OPTIMIZE_FAILED')
  })
})
