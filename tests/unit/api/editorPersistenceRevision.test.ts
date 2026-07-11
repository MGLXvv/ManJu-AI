import { describe, expect, it } from 'vitest'
import { editorApi } from '@/api/editor.api'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { API_ERROR_CODES } from '@/types/api-enums'
import { EDITOR_PERSISTENCE_PARTITIONS } from '@/types/editor'

describe('editor persistence revision contract', () => {
  it('increments revisions and rejects stale saves', async () => {
    const projectId = `editor-revision-${Date.now()}`
    const firstDraft = createDefaultEditorDraft(projectId)
    firstDraft.script.content = 'first version'

    const first = await editorApi.saveDraft(projectId, firstDraft, {
      expectedRevision: 0,
      partitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
      reason: 'manual',
    })

    expect(first.revision).toBe(1)
    expect(first.draft.revision).toBe(1)

    const staleDraft = createDefaultEditorDraft(projectId)
    staleDraft.script.content = 'stale version'

    await expect(
      editorApi.saveDraft(projectId, staleDraft, {
        expectedRevision: 0,
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
        reason: 'manual',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODES.editorSaveConflict,
      status: 409,
      details: expect.objectContaining({
        currentRevision: 1,
        expectedRevision: 0,
      }),
    })

    const restored = await editorApi.getDraft(projectId)
    expect(restored.revision).toBe(1)
    expect(restored.script.content).toBe('first version')
  })

  it('restores review, hidden, candidate, voice, video and dubbing results', async () => {
    const projectId = `editor-recovery-${Date.now()}`
    const draft = createDefaultEditorDraft(projectId)
    draft.settingAssets = [
      {
        id: 'asset-1',
        type: 'character',
        title: '角色一',
        roleName: '主角',
        description: '角色描述',
        prompt: '角色提示词',
        imageUrls: ['https://example.com/selected.png'],
        candidateImages: [
          'https://example.com/candidate-1.png',
          'https://example.com/candidate-2.png',
        ],
        selectedVoiceId: 'voice-1',
        voiceOptions: [{ id: 'voice-1', name: '温柔女声' }],
        status: 'ready',
        favorite: true,
        createdAt: '2026-07-11T12:00:00.000Z',
      },
    ]
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '雨夜街道',
        characterIds: ['asset-1'],
        sceneIds: [],
        propIds: [],
        imageUrl: 'https://example.com/storyboard.png',
        videoUrl: 'https://example.com/video.mp4',
        videoPrompt: '镜头缓慢推进',
        dialogue: '我们出发吧',
        durationSeconds: 8,
        voiceAssignments: [
          {
            id: 'assignment-1',
            characterId: 'asset-1',
            voiceId: 'voice-1',
            voiceName: '温柔女声',
            voice: '温柔女声',
          },
        ],
        status: 'success',
        isHidden: true,
        isLocked: true,
        storyboardReviewed: true,
        videoReviewed: true,
        referenceImages: [],
      },
    ]
    draft.dubbing = {
      modelId: 'index-tts',
      cards: [
        {
          id: 'asset-1',
          selectedVoiceId: 'voice-1',
          hidden: true,
          lines: [
            {
              id: 'line-1',
              shotId: 'shot-1',
              shotLabel: '镜头 1',
              text: '我们出发吧',
              audioUrl: 'https://example.com/line-1.mp3',
              status: 'success',
            },
          ],
        },
      ],
    }

    await editorApi.saveDraft(projectId, draft, {
      expectedRevision: 0,
      partitions: Object.values(EDITOR_PERSISTENCE_PARTITIONS),
      reason: 'manual',
    })

    const restored = await editorApi.getDraft(projectId)

    expect(restored.settingAssets[0]).toMatchObject({
      candidateImages: [
        'https://example.com/candidate-1.png',
        'https://example.com/candidate-2.png',
      ],
      selectedVoiceId: 'voice-1',
      favorite: true,
    })
    expect(restored.shots[0]).toMatchObject({
      isHidden: true,
      isLocked: true,
      storyboardReviewed: true,
      videoReviewed: true,
      videoUrl: 'https://example.com/video.mp4',
    })
    expect(restored.dubbing.cards[0]).toMatchObject({
      hidden: true,
      selectedVoiceId: 'voice-1',
      lines: [
        expect.objectContaining({
          audioUrl: 'https://example.com/line-1.mp3',
          status: 'success',
        }),
      ],
    })
  })
})
