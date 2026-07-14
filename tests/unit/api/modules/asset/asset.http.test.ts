import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'

const get = vi.fn()
const put = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    put,
  },
}))

describe('assetHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
    vi.resetModules()
  })

  it('reads project assets from the Integration Pack path and maps PROP', async () => {
    get.mockResolvedValue({
      data: {
        list: [
          {
            id: 4,
            type: 'PROP',
            name: 'Sword',
            imageUrl: 'https://example.com/sword.png',
            extraJson: JSON.stringify({ prompt: 'silver sword', favorite: true }),
          },
        ],
      },
    })

    const { assetHttpApi } = await import('@/api/modules/asset/asset.http')
    const assets = await assetHttpApi.list('project-1')

    expect(get).toHaveBeenCalledWith('/aidrama/projects/project-1/assets')
    expect(assets).toEqual([
      {
        id: '4',
        type: 'prop',
        name: 'Sword',
        prompt: 'silver sword',
        imageUrls: ['https://example.com/sword.png'],
        favorite: true,
      },
    ])
  })

  it('rejects the obsolete aggregate save contract without sending a request', async () => {
    const { assetHttpApi } = await import('@/api/modules/asset/asset.http')

    await expect(assetHttpApi.save('project-1', [])).rejects.toMatchObject({
      code: API_ERROR_CODES.assetAggregateSaveUnsupported,
    })
    expect(put).not.toHaveBeenCalled()
  })
})
