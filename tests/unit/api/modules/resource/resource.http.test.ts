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

describe('resourceHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    del.mockReset()
    vi.resetModules()
  })

  it('hydrates default folders and empty assets when resource-library payload is empty', async () => {
    get.mockResolvedValue({
      data: {
        list: [],
        total: 0,
      },
    })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')
    const state = await resourceHttpApi.getLibrary()

    expect(get).toHaveBeenCalledWith('/aidrama/resource-library/assets', {
      params: {
        pageNo: 1,
        pageSize: 100,
      },
    })
    expect(state.folders.length).toBeGreaterThan(0)
    expect(state.assets).toEqual([])
  })

  it('maps official and private library assets into the current resource page model', async () => {
    get.mockResolvedValue({
      data: {
        list: [
          {
            id: 1,
            assetType: 'CHARACTER',
            name: 'Private Hero',
            imageUrl: 'https://example.com/hero.png',
            extraJson: JSON.stringify({ prompt: 'hero prompt' }),
            scope: 'PRIVATE',
          },
          {
            id: 2,
            assetType: 'SCENE',
            name: 'Official City',
            imageUrl: 'https://example.com/city.png',
            extraJson: JSON.stringify({ prompt: 'city prompt' }),
            scope: 'OFFICIAL',
          },
        ],
        total: 2,
      },
    })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')
    const state = await resourceHttpApi.getLibrary()

    expect(state.assets).toEqual([
      expect.objectContaining({
        id: '1',
        tab: 'creative',
        source: 'created',
        type: 'character',
        name: 'Private Hero',
        prompt: 'hero prompt',
      }),
      expect.objectContaining({
        id: '2',
        tab: 'subject',
        source: 'official',
        type: 'scene',
        name: 'Official City',
        prompt: 'city prompt',
      }),
    ])
  })

  it('throws a controlled error when creating resource assets in http mode', async () => {
    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')

    const error = await resourceHttpApi.createAsset({
      tab: 'creative',
      type: 'character',
      source: 'created',
      name: 'Hero',
      prompt: 'prompt',
      imageUrl: 'mock://asset.png',
    }).catch((reason) => reason)

    expect(post).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.resourceHttpWriteUnsupported,
    })
  })

  it('throws a controlled error when updating resource assets in http mode', async () => {
    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')

    const error = await resourceHttpApi.updateAsset('resource-1', {
      name: 'Hero 2',
    }).catch((reason) => reason)

    expect(patch).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.resourceHttpWriteUnsupported,
    })
  })

  it('throws a controlled error when deleting resource assets in http mode', async () => {
    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')

    const error = await resourceHttpApi.removeAsset('resource-1').catch((reason) => reason)

    expect(del).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.resourceHttpWriteUnsupported,
    })
  })
})
