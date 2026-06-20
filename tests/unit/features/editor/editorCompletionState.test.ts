import { describe, expect, it } from 'vitest'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'

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
        storyboardMode: 'image',
      }),
    ).toMatchObject({
      ok: true,
      nextStep: 'video',
      routeName: 'editor-video',
    })
  })

  it('blocks storyboard to video when generation mode is not selected', () => {
    expect(
      validateEditorAdvance('storyboardToVideo', {
        shots: [
          {
            id: 'shot-1',
            index: 1,
            title: '镜头 1',
            prompt: '提示词',
            imageUrl: '',
            status: 'pending-review',
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
    ).toEqual({
      ok: false,
      message: '请先选择分镜生成模式',
    })
  })

  it('ignores hidden dubbing cards when validating complete-step entry', () => {
    expect(
      validateEditorAdvance('dubbingToComplete', {
        cards: [
          {
            id: 'card-1',
            title: '角色A',
            imageUrl: 'image-1',
            selectedVoiceId: 'voice-1',
            voiceOptions: [{ id: 'voice-1', name: '温柔女声' }],
            createdAt: '2026-03-12 17:16',
            hidden: true,
            lines: [
              {
                id: 'line-1',
                shotId: 'shot-1',
                shotLabel: '镜头 1',
                text: '第一句对白',
                status: 'failed',
              },
            ],
          },
          {
            id: 'card-2',
            title: '角色B',
            imageUrl: 'image-2',
            selectedVoiceId: 'voice-2',
            voiceOptions: [{ id: 'voice-2', name: '沉稳男声' }],
            createdAt: '2026-03-12 17:16',
            hidden: false,
            lines: [
              {
                id: 'line-2',
                shotId: 'shot-2',
                shotLabel: '镜头 2',
                text: '第二句对白',
                audioUrl: 'data:audio/wav;base64,mock',
                status: 'success',
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      ok: true,
      nextStep: 'complete',
      routeName: 'editor-complete',
    })
  })
})

