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

  it('normalizes lightweight voice payloads to an empty list', async () => {
    get.mockResolvedValue({
      data: {},
    })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')
    const voices = await voiceHttpApi.list()

    expect(get).toHaveBeenCalledWith('/voices')
    expect(voices).toEqual([])
  })

  it('creates voices through the http api', async () => {
    post.mockResolvedValue({
      data: {
        voice: {
          id: 12,
          name: 'Voice A',
          audioUrl: 'https://example.com/a.wav',
          duration: 12,
          createdAt: '2026-07-02T00:00:00.000Z',
        },
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
    expect(voice).toEqual({
      id: '12',
      name: 'Voice A',
      audioUrl: 'https://example.com/a.wav',
      duration: 12,
      createdAt: '2026-07-02T00:00:00.000Z',
    })
  })

  it('updates voices through the http api', async () => {
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
    expect(voice).toEqual({
      id: '12',
      name: 'Voice B',
      audioUrl: 'https://example.com/b.wav',
      duration: 15,
      createdAt: '2026-07-02T00:00:00.000Z',
    })
  })

  it('deletes voices through the http api', async () => {
    del.mockResolvedValue({
      data: {},
    })

    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    await voiceHttpApi.remove('voice-1')

    expect(del).toHaveBeenCalledWith('/voices/voice-1')
  })
})
