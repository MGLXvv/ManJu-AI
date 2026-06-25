import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
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

  it('imports resource asset ids into project and maps returned assets', async () => {
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

    const { resourceLibraryService } = await import('@/services/editor/resourceLibrary.service')
    const result = await resourceLibraryService.importAssetsToProject('5', ['1'])

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/5/assets/import-from-library', {
      resourceAssetIds: [1],
    })
    expect(result).toEqual([
      expect.objectContaining({
        id: '22',
        type: 'character',
        title: 'Imported Hero',
        prompt: 'imported prompt',
      }),
    ])
  })
})
