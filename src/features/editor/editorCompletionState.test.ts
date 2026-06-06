import { describe, expect, it } from 'vitest'
import { validateEditorAdvance } from './editorCompletionState'

describe('editorCompletionState', () => {
  it('blocks script advance when generated script is empty', () => {
    expect(validateEditorAdvance('scriptToSettings', { generatedScript: '' })).toEqual({
      ok: false,
      message: '请先生成剧本，再进入下一步',
    })
  })

  it('returns next route metadata for storyboard to video', () => {
    expect(
      validateEditorAdvance('storyboardToVideo', {
        shots: [
          {
            id: 'shot-1',
            index: 1,
            title: '镜头 1',
            prompt: '提示词',
            imageUrl: 'mock://image',
            status: 'success',
            characters: [],
            scenes: [],
            props: [],
            style: '国风漫画',
            ratio: '16:9',
            referenceImages: [],
            videoPrompt: '',
            dialogue: '',
            durationSeconds: 10,
            voiceAssignments: [],
            createdAt: '2026年3月12日 17:16',
          },
        ],
      }),
    ).toMatchObject({
      ok: true,
      nextStep: 'video',
      routeName: 'editor-video',
    })
  })
})

