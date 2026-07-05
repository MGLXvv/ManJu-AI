import { describe, expect, it } from 'vitest'
import { buildScriptDraftSnapshot, clearScriptPromptFields, hasUnsavedScriptChanges } from '@/features/editor/scriptDraftState'

describe('scriptDraftState', () => {
  it('builds a stable snapshot from script fields', () => {
    expect(
      buildScriptDraftSnapshot({
        sourceText: '原始文案',
        promptText: '提示词',
        outlineText: '文案大纲',
        generatedScript: '生成结果',
        storyboardText: '分镜结果',
      }),
    ).toBe('{"sourceText":"原始文案","promptText":"提示词","outlineText":"文案大纲","generatedScript":"生成结果","storyboardText":"分镜结果"}')
  })

  it('detects whether current fields differ from last saved snapshot', () => {
    const saved = buildScriptDraftSnapshot({
      sourceText: 'A',
      promptText: 'B',
      outlineText: 'C',
      generatedScript: 'D',
      storyboardText: 'E',
    })

    expect(
      hasUnsavedScriptChanges(saved, {
        sourceText: 'A',
        promptText: 'B',
        outlineText: 'C',
        generatedScript: 'D',
        storyboardText: 'E',
      }),
    ).toBe(false)

    expect(
      hasUnsavedScriptChanges(saved, {
        sourceText: 'A',
        promptText: 'B',
        outlineText: 'C changed',
        generatedScript: 'D',
        storyboardText: 'E',
      }),
    ).toBe(true)
  })

  it('clears only the prompt text while preserving source, outline, script and storyboard text', () => {
    expect(
      clearScriptPromptFields({
        sourceText: '原始文案',
        promptText: '提示词',
        outlineText: '已生成大纲',
        generatedScript: '已生成剧本',
        storyboardText: '已生成分镜',
      }),
    ).toEqual({
      sourceText: '原始文案',
      promptText: '',
      outlineText: '已生成大纲',
      generatedScript: '已生成剧本',
      storyboardText: '已生成分镜',
    })
  })
})
