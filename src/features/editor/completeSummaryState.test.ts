import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { buildCompleteSummary } from './completeSummaryState'

describe('completeSummaryState', () => {
  it('returns zero counts when draft is missing', () => {
    expect(buildCompleteSummary(null)).toEqual({
      shotCount: 0,
      playableVideoCount: 0,
      generatedAudioCount: 0,
    })
  })

  it('counts only visible shots and visible dubbing card audio lines', () => {
    const draft = createDefaultEditorDraft('project-complete')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '描述 1',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        videoUrl: 'mock-video://1',
        status: 'success',
        isHidden: false,
      },
      {
        id: 'shot-2',
        index: 2,
        title: '镜头 2',
        description: '描述 2',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        videoUrl: 'mock-video://2',
        status: 'success',
        isHidden: true,
      },
      {
        id: 'shot-3',
        index: 3,
        title: '镜头 3',
        description: '描述 3',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        videoUrl: '',
        status: 'pending-review',
        isHidden: false,
      },
    ]
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [
          {
            id: 'line-1',
            shotId: 'shot-1',
            shotLabel: '镜头 1',
            text: '第一句',
            audioUrl: 'data:audio/wav;base64,1',
            status: 'success',
          },
          {
            id: 'line-2',
            shotId: 'shot-3',
            shotLabel: '镜头 3',
            text: '第二句',
            status: 'failed',
          },
        ],
      },
      {
        id: 'card-2',
        selectedVoiceId: 'voice-2',
        hidden: true,
        lines: [
          {
            id: 'line-3',
            shotId: 'shot-2',
            shotLabel: '镜头 2',
            text: '隐藏句子',
            audioUrl: 'data:audio/wav;base64,2',
            status: 'success',
          },
        ],
      },
    ]

    expect(buildCompleteSummary(draft)).toEqual({
      shotCount: 2,
      playableVideoCount: 1,
      generatedAudioCount: 1,
    })
  })
})
