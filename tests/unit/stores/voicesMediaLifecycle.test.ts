// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { voiceApiMock, mediaUploadServiceMock, mediaBlobRepositoryMock } = vi.hoisted(() => ({
  voiceApiMock: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  mediaUploadServiceMock: { uploadFile: vi.fn() },
  mediaBlobRepositoryMock: { resolveUrl: vi.fn(), remove: vi.fn() },
}))

vi.mock('@/api/voice.api', () => ({ voiceApi: voiceApiMock }))
vi.mock('@/services/media', () => ({
  mediaUploadService: mediaUploadServiceMock,
  mediaBlobRepository: mediaBlobRepositoryMock,
}))

describe('voices store media lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    for (const mock of [
      ...Object.values(voiceApiMock),
      ...Object.values(mediaUploadServiceMock),
      ...Object.values(mediaBlobRepositoryMock),
    ]) {
      mock.mockReset()
    }
    voiceApiMock.list.mockResolvedValue([])
    voiceApiMock.remove.mockResolvedValue(undefined)
    mediaBlobRepositoryMock.resolveUrl.mockImplementation(async (mediaId: string) => `blob:restored-${mediaId}`)
  })

  it('transfers files to media storage and releases replaced and deleted records', async () => {
    mediaUploadServiceMock.uploadFile
      .mockResolvedValueOnce({ mediaId: 'media-1', url: 'blob:repository-1' })
      .mockResolvedValueOnce({ mediaId: 'media-2', url: 'blob:repository-2' })
    voiceApiMock.create.mockImplementation(async (input) => ({ id: 'voice-1', createdAt: 'now', ...input }))
    voiceApiMock.update.mockImplementation(async (id, input) => ({ id, createdAt: 'now', ...input }))
    const { useVoicesStore } = await import('@/stores/voices')
    const store = useVoicesStore()

    const firstFile = new File(['first'], 'first.mp3', { type: 'audio/mpeg' })
    const created = await store.createVoice({
      name: 'Voice One',
      audioUrl: 'blob:preview-1',
      duration: 10,
      audioFile: firstFile,
    })

    expect(mediaUploadServiceMock.uploadFile).toHaveBeenCalledWith(
      firstFile,
      expect.objectContaining({ targetType: 'voice-audio', kind: 'audio' }),
    )
    expect(voiceApiMock.create).toHaveBeenCalledWith({
      name: 'Voice One',
      audioUrl: 'blob:repository-1',
      audioMediaId: 'media-1',
      duration: 10,
    })
    expect(created).toMatchObject({ audioMediaId: 'media-1', audioUrl: 'blob:restored-media-1' })

    const secondFile = new File(['second'], 'second.mp3', { type: 'audio/mpeg' })
    const updated = await store.updateVoice('voice-1', {
      name: 'Voice Two',
      audioUrl: 'blob:preview-2',
      duration: 20,
      audioFile: secondFile,
    })

    expect(updated).toMatchObject({ audioMediaId: 'media-2', audioUrl: 'blob:restored-media-2' })
    expect(mediaBlobRepositoryMock.remove).toHaveBeenCalledWith('media-1')

    await store.deleteVoice('voice-1')
    expect(mediaBlobRepositoryMock.remove).toHaveBeenCalledWith('media-2')
  })

  it('releases a newly uploaded record when voice creation fails', async () => {
    mediaUploadServiceMock.uploadFile.mockResolvedValue({ mediaId: 'media-failed', url: 'blob:repository-failed' })
    voiceApiMock.create.mockRejectedValue(new Error('create failed'))
    const { useVoicesStore } = await import('@/stores/voices')
    const store = useVoicesStore()

    await expect(
      store.createVoice({
        name: 'Failed Voice',
        audioUrl: 'blob:preview-failed',
        duration: 1,
        audioFile: new File(['failed'], 'failed.mp3', { type: 'audio/mpeg' }),
      }),
    ).rejects.toThrow('create failed')
    expect(mediaBlobRepositoryMock.remove).toHaveBeenCalledWith('media-failed')
  })
})
