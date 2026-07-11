import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import {
  hydrateEditorDraftMedia,
  MediaUploadService,
  sanitizeEditorDraftMedia,
} from '@/services/media/mediaUpload.service'
import { mediaBlobRepository } from '@/services/media/mediaBlobRepository'
import { API_ERROR_CODES } from '@/types/api-enums'

describe('MediaUploadService', () => {
  it('captures a Data URL as a stable media id and retains its original URL alias', async () => {
    const service = new MediaUploadService('mock')
    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    )}`

    const result = await service.captureUrl(
      dataUrl,
      { targetType: 'storyboard-image', targetId: 'shot-1', kind: 'image' },
      'shot-1.svg',
    )

    expect(result).toMatchObject({
      mediaId: expect.stringMatching(/^media-/),
      kind: 'image',
      fileName: 'shot-1.svg',
    })
    expect(result?.url).not.toContain('data:image')
    expect(mediaBlobRepository.findIdByUrl(dataUrl)).toBe(result?.mediaId)
    expect(await service.restore(result?.mediaId ?? '')).toBe(result?.url)
  })

  it('removes transient URLs from persistent drafts and restores them from media ids', async () => {
    const service = new MediaUploadService('mock')
    const media = await service.upload(
      new Blob(['image'], { type: 'image/png' }),
      { projectId: 'project-media', targetType: 'storyboard-image', targetId: 'shot-1', kind: 'image' },
      'shot-1.png',
    )
    const draft = createDefaultEditorDraft('project-media')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '测试镜头',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        imageUrl: media.url,
        imageMediaId: media.mediaId,
        status: 'success',
        referenceImages: [
          {
            id: 'ref-1',
            url: media.url,
            mediaId: media.mediaId,
          },
        ],
      },
    ]

    const sanitized = sanitizeEditorDraftMedia(draft)
    expect(sanitized.shots[0]?.imageUrl).toBe('')
    expect(sanitized.shots[0]?.imageMediaId).toBe(media.mediaId)
    expect(sanitized.shots[0]?.referenceImages?.[0]?.url).toBe('')

    const hydrated = await hydrateEditorDraftMedia(sanitized)
    expect(hydrated.shots[0]?.imageUrl).toBe(media.url)
    expect(hydrated.shots[0]?.referenceImages?.[0]?.url).toBe(media.url)
  })

  it('fails explicitly in HTTP mode until an upload endpoint is configured', async () => {
    const service = new MediaUploadService('http')

    await expect(
      service.upload(
        new Blob(['video'], { type: 'video/mp4' }),
        { targetType: 'storyboard-video', targetId: 'shot-1', kind: 'video' },
        'shot-1.mp4',
      ),
    ).rejects.toMatchObject({
      code: API_ERROR_CODES.mediaUploadHttpUnsupported,
      status: 501,
    })
  })
})
