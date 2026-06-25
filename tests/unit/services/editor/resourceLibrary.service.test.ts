import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('resourceLibraryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null for local asset ids in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const { resourceLibraryService } = await import('@/services/editor/resourceLibrary.service')
    const result = await resourceLibraryService.saveAssetToLibrary('asset-1')

    expect(result).toBeNull()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('posts save-to-library for persisted assets in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        id: 1,
        assetType: 'CHARACTER',
        name: 'Hero',
      },
    })

    const { resourceLibraryService } = await import('@/services/editor/resourceLibrary.service')
    const result = await resourceLibraryService.saveAssetToLibrary('12')

    expect(http.post).toHaveBeenCalledWith('/aidrama/assets/12/save-to-library')
    expect(result).toMatchObject({ id: 1, name: 'Hero' })
  })

  it('loads resource library assets with mapped query params', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.get).mockResolvedValue({
      data: {
        list: [
          {
            id: 3,
            assetType: 'SCENE',
            name: 'Street',
            extraJson: JSON.stringify({ prompt: 'night street' }),
          },
        ],
        total: 7,
      },
    })

    const { resourceLibraryService } = await import('@/services/editor/resourceLibrary.service')
    const result = await resourceLibraryService.listLibraryItems({
      type: 'scene',
      scope: 'PRIVATE',
      keyword: 'street',
      page: 2,
      pageSize: 10,
    })

    expect(http.get).toHaveBeenCalledWith('/aidrama/resource-library/assets', {
      params: {
        pageNo: 2,
        pageSize: 10,
        type: 'SCENE',
        keyword: 'street',
        scope: 'PRIVATE',
      },
    })
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: '3',
          type: 'scene',
          title: 'Street',
        }),
      ],
      total: 7,
    })
  })

  it('imports resource asset ids into project and refreshes asset workspace', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: [
        {
          id: 22,
          projectId: 5,
          type: 'CHARACTER',
          name: 'Imported Hero',
          description: 'from library',
          imageUrl: '',
          extraJson: JSON.stringify({ prompt: 'imported prompt', favorite: false }),
          createTime: '2026-06-25T00:00:00.000Z',
        },
      ],
    })

    const loadAssetWorkspace = vi.fn().mockResolvedValue([
      {
        id: '22',
        type: 'character',
        title: 'Imported Hero',
        description: 'from library',
        prompt: 'imported prompt',
        imageUrls: [],
        status: 'empty',
        favorite: false,
        createdAt: '2026-06-25T00:00:00.000Z',
      },
    ])

    vi.doMock('@/services/editor/assetWorkflow.service', () => ({
      assetWorkflowService: {
        loadAssetWorkspace,
      },
    }))

    const { resourceLibraryService } = await import('@/services/editor/resourceLibrary.service')
    const result = await resourceLibraryService.importFromLibrary('5', ['1'])

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/5/assets/import-from-library', {
      resourceAssetIds: [1],
    })
    expect(loadAssetWorkspace).toHaveBeenCalledWith('5')
    expect(result).toEqual([
      expect.objectContaining({
        id: '22',
        type: 'character',
        title: 'Imported Hero',
      }),
    ])
  })
})
