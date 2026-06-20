import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { API_ERROR_CODES } from '@/types/api-enums'
import { editorApi } from '@/api/modules/editor/editor.api'

describe('editor module api', () => {
  it('returns a normalized draft payload shape', async () => {
    const draft = await editorApi.getDraft('editor-project')

    expect(draft.projectId).toBe('editor-project')
    expect(draft.script).toBeDefined()
    expect(Array.isArray(draft.shots)).toBe(true)
  })

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
        status: 'pending-review',
        style: '国风漫画',
        ratio: '16:9',
        isLocked: false,
        isFavorite: false,
        referenceImages: [],
        createdAt: '2026年3月12日 17:16',
      },
    ]

    await expect(editorApi.saveDraft('video-project', draft)).rejects.toHaveProperty(
      'code',
      API_ERROR_CODES.editorSaveFailed,
    )
  })
})
