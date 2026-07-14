import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
    patch,
    delete: del,
  },
}))

describe('voiceHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    del.mockReset()
    vi.resetModules()
  })

  it('maps the canonical list envelope and pagination request', async () => {
    get.mockResolvedValue({
      data: {
        list: [
          {
            id: 12,
            name: 'Voice A',
            audioUrl: 'https://example.com/a.wav',
            duration: 12,
            createTime: '2026-07-02T00:00:00.000Z',
          },
        ],
        total: 1,
      },
    })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')
    const voices = await voiceHttpApi.list()

    expect(get).toHaveBeenCalledWith('/voices', {
      params: { pageNo: 1, pageSize: 100 },
    })
    expect(voices).toEqual([
      {
        id: '12',
        name: 'Voice A',
        audioUrl: 'https://example.com/a.wav',
        duration: 12,
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    ])
  })

  it('keeps the legacy voices wrapper compatible', async () => {
    get.mockResolvedValue({ data: { voices: [{ id: 13, name: 'Legacy Voice' }] } })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    await expect(voiceHttpApi.list()).resolves.toEqual([
      {
        id: '13',
        name: 'Legacy Voice',
        audioUrl: '',
        duration: 0,
        createdAt: '',
      },
    ])
  })

  it('creates voices from a direct backend entity', async () => {
    post.mockResolvedValue({
      data: {
        id: 12,
        name: 'Voice A',
        audioUrl: 'https://example.com/a.wav',
        duration: 12,
        createdAt: '2026-07-02T00:00:00.000Z',
      },
    })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    const voice = await voiceHttpApi.create({
      name: 'Voice A',
      audioUrl: 'https://example.com/a.wav',
      duration: 12,
    })

    expect(post).toHaveBeenCalledWith('/voices', {
      name: 'Voice A',
      audioUrl: 'https://example.com/a.wav',
      duration: 12,
    })
    expect(voice.id).toBe('12')
  })

  it('rejects create responses without a persisted voice entity', async () => {
    post.mockResolvedValue({ data: null })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    await expect(
      voiceHttpApi.create({
        name: 'Voice A',
        audioUrl: 'https://example.com/a.wav',
        duration: 12,
      }),
    ).rejects.toThrow('VOICE_CREATE_RESPONSE_INVALID')
  })

  it('updates voices through the legacy named wrapper', async () => {
    patch.mockResolvedValue({
      data: {
        voice: {
          id: 12,
          name: 'Voice B',
          audioUrl: 'https://example.com/b.wav',
          duration: 15,
          createdAt: '2026-07-02T00:00:00.000Z',
        },
      },
    })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    const voice = await voiceHttpApi.update('voice-1', {
      name: 'Voice B',
      audioUrl: 'https://example.com/b.wav',
      duration: 15,
    })

    expect(patch).toHaveBeenCalledWith('/voices/voice-1', {
      name: 'Voice B',
      audioUrl: 'https://example.com/b.wav',
      duration: 15,
    })
    expect(voice?.name).toBe('Voice B')
  })

  it('deletes voices through the http api', async () => {
    del.mockResolvedValue({ data: {} })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    await voiceHttpApi.remove('voice-1')

    expect(del).toHaveBeenCalledWith('/voices/voice-1')
  })
})
