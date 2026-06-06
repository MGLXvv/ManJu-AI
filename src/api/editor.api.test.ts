import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { editorApi } from './editor.api'

describe('editorApi.saveDraft', () => {
  it('fails when a video shot contains the save fail token', async () => {
    const draft = createDefaultEditorDraft('video-project')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        imageUrl: '',
        videoUrl: '',
        videoPrompt: '#mock-save-fail',
        dialogue: '正常对白',
        durationSeconds: 10,
        voiceAssignments: [],
        status: 'idle',
        style: '国风漫画',
        ratio: '16:9',
        isLocked: false,
        isFavorite: false,
        referenceImages: [],
        createdAt: '2026年3月12日 17:16',
      },
    ]

    await expect(editorApi.saveDraft('video-project', draft)).rejects.toThrow('EDITOR_SAVE_FAILED')
  })
})
