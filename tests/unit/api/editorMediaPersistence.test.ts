import { beforeEach, describe, expect, it } from 'vitest'
import { editorMockApi } from '@/api/modules/editor/editor.mock'
import { readLocal, resetLocalState } from '@/api/local'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { MediaUploadService } from '@/services/media/mediaUpload.service'
import type { EditorDraft } from '@/types/editor'

const EDITOR_KEY = 'amd.editor.drafts'

describe('editor media persistence', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('stores media ids without persisting Blob or Data URLs and restores previews', async () => {
    const media = await new MediaUploadService('mock').upload(
      new Blob(['video'], { type: 'video/mp4' }),
      { projectId: 'project-media', targetType: 'storyboard-video', targetId: 'shot-1', kind: 'video' },
      'shot-1.mp4',
    )
    const draft = createDefaultEditorDraft('project-media')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '上传视频',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        videoUrl: media.url,
        videoMediaId: media.mediaId,
        status: 'success',
      },
    ]

    await editorMockApi.saveDraft('project-media', draft, { expectedRevision: 0 })

    const stored = readLocal<Record<string, EditorDraft>>(EDITOR_KEY, {})['project-media']
    expect(stored?.shots[0]?.videoMediaId).toBe(media.mediaId)
    expect(stored?.shots[0]?.videoUrl).toBe('')
    expect(JSON.stringify(stored)).not.toContain('blob:')
    expect(JSON.stringify(stored)).not.toContain('data:')

    const restored = await editorMockApi.getDraft('project-media')
    expect(restored.shots[0]?.videoMediaId).toBe(media.mediaId)
    expect(restored.shots[0]?.videoUrl).toBe(media.url)
  })
})
