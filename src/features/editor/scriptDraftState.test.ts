import { describe, expect, it } from 'vitest'
import { buildScriptDraftSnapshot, clearScriptPromptFields, hasUnsavedScriptChanges } from '@/features/editor/scriptDraftState'

describe('scriptDraftState', () => {
  it('builds a stable snapshot from script fields', () => {
    expect(
      buildScriptDraftSnapshot({
        sourceText: '原始文案',
        promptText: '提示词',
        generatedScript: '生成结果',
      }),
    ).toBe('{"sourceText":"原始文案","promptText":"提示词","generatedScript":"生成结果"}')
  })

  it('detects whether current fields differ from last saved snapshot', () => {
    const saved = buildScriptDraftSnapshot({
      sourceText: 'A',
      promptText: 'B',
      generatedScript: 'C',
    })

    expect(
      hasUnsavedScriptChanges(saved, {
        sourceText: 'A',
        promptText: 'B',
        generatedScript: 'C',
      }),
    ).toBe(false)

    expect(
      hasUnsavedScriptChanges(saved, {
        sourceText: 'A changed',
        promptText: 'B',
        generatedScript: 'C',
      }),
    ).toBe(true)
  })

  it('clears only the prompt text while preserving source text and generated script', () => {
    expect(
      clearScriptPromptFields({
        sourceText: '原始文案',
        promptText: '提示词',
        generatedScript: '已生成剧本',
      }),
    ).toEqual({
      sourceText: '原始文案',
      promptText: '',
      generatedScript: '已生成剧本',
    })
  })
})
