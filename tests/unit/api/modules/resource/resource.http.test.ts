import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const del = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
    put,
    delete: del,
  },
}))

describe('resourceHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    del.mockReset()
    vi.resetModules()
  })

  it('hydrates default folders and the canonical list envelope', async () => {
    get.mockResolvedValue({ data: { list: [], total: 0 } })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')
    const state = await resourceHttpApi.getLibrary()

    expect(get).toHaveBeenCalledWith('/aidrama/resource-library/assets', {
      params: { pageNo: 1, pageSize: 100 },
    })
    expect(state.folders.length).toBeGreaterThan(0)
    expect(state.assets).toEqual([])
  })

  it('preserves PRIVATE, SYSTEM, SHARED, favorite and PROP semantics', async () => {
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
            assetType: 'PROP',
            name: 'Shared Sword',
            imageUrl: 'https://example.com/sword.png',
            extraJson: JSON.stringify({ prompt: 'sword prompt' }),
            scope: 'SHARED',
          },
          {
            id: 3,
            assetType: 'SCENE',
            name: 'Favorite City',
            extraJson: JSON.stringify({ prompt: 'city prompt', favorite: true }),
            scope: 'PRIVATE',
          },
        ],
      },
    })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')
    const state = await resourceHttpApi.getLibrary()

    expect(state.assets).toEqual([
      expect.objectContaining({ id: '1', source: 'created', type: 'character' }),
      expect.objectContaining({ id: '2', source: 'official', type: 'prop' }),
      expect.objectContaining({ id: '3', source: 'favorite', type: 'scene' }),
    ])
  })

  it('creates resources using assetType, scope and JSON-string extraJson', async () => {
    post.mockResolvedValue({
      data: {
        id: 7,
        assetType: 'PROP',
        name: 'Sword',
        imageUrl: 'https://example.com/sword.png',
        extraJson: JSON.stringify({ prompt: 'silver sword', favorite: false }),
        scope: 'PRIVATE',
      },
    })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')
    const created = await resourceHttpApi.createAsset({
      tab: 'creative',
      type: 'prop',
      source: 'created',
      name: 'Sword',
      prompt: 'silver sword',
      imageUrl: 'https://example.com/sword.png',
    })

    expect(post).toHaveBeenCalledWith('/aidrama/resource-library/assets', {
      assetType: 'PROP',
      name: 'Sword',
      description: '',
      imageUrl: 'https://example.com/sword.png',
      scope: 'PRIVATE',
      extraJson: JSON.stringify({ prompt: 'silver sword', favorite: false }),
    })
    expect(created).toMatchObject({ id: '7', type: 'prop', source: 'created' })
  })

  it('rejects create responses that do not contain a persisted entity', async () => {
    post.mockResolvedValue({ data: null })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')

    await expect(
      resourceHttpApi.createAsset({
        tab: 'creative',
        type: 'scene',
        source: 'created',
        name: 'City',
        prompt: 'city',
        imageUrl: '',
      }),
    ).rejects.toThrow('RESOURCE_CREATE_RESPONSE_INVALID')
  })

  it('updates and deletes resources through the documented paths', async () => {
    put.mockResolvedValue({
      data: {
        asset: {
          id: 7,
          assetType: 'PROP',
          name: 'Updated Sword',
          extraJson: JSON.stringify({ prompt: 'updated', favorite: true }),
          scope: 'PRIVATE',
        },
      },
    })
    del.mockResolvedValue({ data: null })

    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')
    const updated = await resourceHttpApi.updateAsset('7', {
      name: 'Updated Sword',
      prompt: 'updated',
      source: 'favorite',
    })
    await resourceHttpApi.removeAsset('7')

    expect(put).toHaveBeenCalledWith('/aidrama/resource-library/assets/7', {
      name: 'Updated Sword',
      scope: 'PRIVATE',
      extraJson: JSON.stringify({ prompt: 'updated', favorite: true }),
    })
    expect(updated).toMatchObject({ id: '7', name: 'Updated Sword', source: 'favorite' })
    expect(del).toHaveBeenCalledWith('/aidrama/resource-library/assets/7')
  })

  it('rejects partial extraJson updates that could erase unedited metadata', async () => {
    const { resourceHttpApi } = await import('@/api/modules/resource/resource.http')

    await expect(resourceHttpApi.updateAsset('7', { prompt: 'partial' })).rejects.toThrow(
      'RESOURCE_EXTRA_META_UPDATE_INCOMPLETE',
    )
    expect(put).not.toHaveBeenCalled()
  })
})
