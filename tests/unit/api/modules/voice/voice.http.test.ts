import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'

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

  it('throws a controlled error when creating voices in http mode', async () => {
    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    const error = await voiceHttpApi.create({
      name: 'Voice A',
      audioUrl: 'mock://voice.wav',
      duration: 12,
    }).catch((reason) => reason)

    expect(post).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.voiceHttpWriteUnsupported,
    })
  })

  it('throws a controlled error when updating voices in http mode', async () => {
    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    const error = await voiceHttpApi.update('voice-1', {
      name: 'Voice B',
    }).catch((reason) => reason)

    expect(patch).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.voiceHttpWriteUnsupported,
    })
  })

  it('throws a controlled error when deleting voices in http mode', async () => {
    const { voiceHttpApi } = await import('@/api/modules/voice/voice.http')

    const error = await voiceHttpApi.remove('voice-1').catch((reason) => reason)

    expect(del).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.voiceHttpWriteUnsupported,
    })
  })
})
