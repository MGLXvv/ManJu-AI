import { describe, expect, it } from 'vitest'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import type { EditorDraft } from '@/types/editor'

describe('editorCompletionState', () => {
  it('blocks script advance when generated script is empty', () => {
    const result = validateEditorAdvance('scriptToSettings', { generatedScript: '' })

    expect(result.ok).toBe(false)
  })

  it('returns next route metadata for storyboard to video', () => {
    const result = validateEditorAdvance('storyboardToVideo', {
      shots: [
        {
          id: 'shot-1',
          index: 1,
          title: 'shot 1',
          prompt: 'prompt',
          imageUrl: 'mock://image',
          status: 'success',
          characters: [],
          scenes: [],
          props: [],
          style: 'style',
          ratio: '16:9',
          referenceImages: [],
          videoPrompt: '',
          dialogue: '',
          durationSeconds: 10,
          voiceAssignments: [],
          storyboardReviewed: true,
          createdAt: '2026-03-12 17:16',
        },
      ],
      storyboardMode: 'image',
    })

    expect(result).toMatchObject({
      ok: true,
      nextStep: 'video',
      routeName: 'editor-video',
    })
  })

  it('blocks storyboard to video when generation mode is not selected', () => {
    const result = validateEditorAdvance('storyboardToVideo', {
      shots: [
        {
          id: 'shot-1',
          index: 1,
          title: 'shot 1',
          prompt: 'prompt',
          imageUrl: '',
          status: 'pending-review',
          characters: [],
          scenes: [],
          props: [],
          style: 'style',
          ratio: '16:9',
          referenceImages: [],
          videoPrompt: '',
          dialogue: '',
          durationSeconds: 10,
          voiceAssignments: [],
          storyboardReviewed: true,
          createdAt: '2026-03-12 17:16',
        },
      ],
    })

    expect(result.ok).toBe(false)
  })

  it('blocks storyboard to video when visible shots are not all reviewed', () => {
    const result = validateEditorAdvance('storyboardToVideo', {
      shots: [
        {
          id: 'shot-1',
          index: 1,
          title: 'shot 1',
          prompt: 'prompt',
          imageUrl: 'mock://image',
          status: 'success',
          characters: [],
          scenes: [],
          props: [],
          style: 'style',
          ratio: '16:9',
          referenceImages: [],
          videoPrompt: '',
          dialogue: '',
          durationSeconds: 10,
          voiceAssignments: [],
          storyboardReviewed: false,
          createdAt: '2026-03-12 17:16',
        },
      ],
      storyboardMode: 'image',
    })

    expect(result.ok).toBe(false)
  })

  it('ignores hidden dubbing cards when validating complete-step entry', () => {
    const result = validateEditorAdvance('dubbingToComplete', {
      cards: [
        {
          id: 'card-1',
          title: 'role A',
          imageUrl: 'image-1',
          selectedVoiceId: 'voice-1',
          voiceOptions: [{ id: 'voice-1', name: 'voice 1' }],
          createdAt: '2026-03-12 17:16',
          hidden: true,
          lines: [
            {
              id: 'line-1',
              shotId: 'shot-1',
              shotLabel: 'shot 1',
              text: 'line 1',
              status: 'failed',
            },
          ],
        },
        {
          id: 'card-2',
          title: 'role B',
          imageUrl: 'image-2',
          selectedVoiceId: 'voice-2',
          voiceOptions: [{ id: 'voice-2', name: 'voice 2' }],
          createdAt: '2026-03-12 17:16',
          hidden: false,
          lines: [
            {
              id: 'line-2',
              shotId: 'shot-2',
              shotLabel: 'shot 2',
              text: 'line 2',
              audioUrl: 'data:audio/wav;base64,mock',
              status: 'success',
            },
          ],
        },
      ],
    })

    expect(result).toMatchObject({
      ok: true,
      nextStep: 'complete',
      routeName: 'editor-complete',
    })
  })

  it('maps legacy storyboard shots before validating storyboard to video', () => {
    const draft: EditorDraft = {
      projectId: 'project-1',
      script: {
        content: '',
        prompt: '',
        outline: '',
        generated: '',
        storyboard: '',
        updatedAt: '',
      },
      characters: [{ id: 'ch-1', name: 'character A', description: 'hero' }],
      scenes: [{ id: 'sc-1', name: 'scene A', description: 'rainy street' }],
      props: [],
      settingAssets: [
        {
          id: 'ch-1',
          type: 'character',
          title: 'character A',
          roleName: 'hero',
          description: 'hero',
          prompt: 'hero',
          imageUrls: [],
          candidateImages: [],
          voiceOptions: [],
          status: 'ready',
          favorite: false,
          createdAt: '2026-03-12 17:16',
        },
      ],
      storyboardGenerationMode: 'multi-param',
      shots: [
        {
          id: 'shot-legacy-1',
          index: 1,
          title: 'shot 1',
          description: 'character looks back in the rain',
          characterIds: ['ch-1'],
          sceneIds: ['sc-1'],
          propIds: [],
          status: 'pending-review',
          style: 'style',
          ratio: '16:9',
          storyboardReviewed: true,
          videoReviewed: true,
          referenceImages: [],
          editHistory: [],
          createdAt: '2026-03-12 17:16',
        },
      ],
      dubbing: {
        modelId: 'index-tts',
        cards: [],
      },
    }

    expect(
      validateEditorAdvance({
        from: 'storyboard',
        to: 'video',
        draft,
      }),
    ).toEqual({
      canAdvance: true,
    })
  })
})