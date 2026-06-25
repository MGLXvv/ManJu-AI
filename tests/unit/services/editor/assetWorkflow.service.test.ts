import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import type { SettingAsset } from '@/types/settingAsset'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const buildAsset = (overrides: Partial<SettingAsset> = {}): SettingAsset => ({
  id: 'asset-1',
  type: 'character',
  title: 'Hero',
  description: 'Lead character',
  prompt: 'cinematic portrait',
  imageUrls: ['https://example.com/hero.png'],
  status: 'ready',
  favorite: false,
  createdAt: '2026-06-25T00:00:00.000Z',
  ...overrides,
})

describe('assetWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null from loadAssetWorkspace in mock mode without calling backend', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { assetWorkflowService } = await import('@/services/editor/assetWorkflow.service')

    const assets = await assetWorkflowService.loadAssetWorkspace('project-1')

    expect(assets).toBeNull()
    expect(http.get).not.toHaveBeenCalled()
  })

  it('loads asset workspace and maps backend assets in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.get).mockResolvedValue({
      data: {
        characters: [
          {
            id: 1,
            type: 'CHARACTER',
            name: 'Hero',
            description: 'Lead character',
            imageUrl: 'https://example.com/hero.png',
            extraJson: JSON.stringify({ prompt: 'cinematic portrait', favorite: true }),
            createTime: '2026-06-20T00:00:00.000Z',
          },
        ],
        scenes: [
          {
            id: 2,
            type: 'SCENE',
            name: 'Rooftop',
            description: 'Night rooftop',
            imageUrl: '',
            extraJson: JSON.stringify({ prompt: 'city skyline' }),
            updateTime: '2026-06-21T00:00:00.000Z',
          },
        ],
        props: [],
      },
    })

    const { assetWorkflowService } = await import('@/services/editor/assetWorkflow.service')

    const assets = await assetWorkflowService.loadAssetWorkspace('project-1')

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/assets/workspace')
    expect(assets).toEqual([
      expect.objectContaining({
        id: '1',
        type: 'character',
        title: 'Hero',
        prompt: 'cinematic portrait',
        imageUrls: ['https://example.com/hero.png'],
        status: 'ready',
        favorite: true,
      }),
      expect.objectContaining({
        id: '2',
        type: 'scene',
        title: 'Rooftop',
        prompt: 'city skyline',
        imageUrls: [],
        status: 'empty',
        favorite: false,
      }),
    ])
  })

  it('returns null from syncAssets in mock mode without calling backend', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { assetWorkflowService } = await import('@/services/editor/assetWorkflow.service')

    const assets = await assetWorkflowService.syncAssets('project-1', {
      currentAssets: [],
      persistedIds: ['12'],
    })

    expect(assets).toBeNull()
    expect(http.delete).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
    expect(http.get).not.toHaveBeenCalled()
  })

  it('deletes removed persisted assets, creates local assets, updates persisted assets, and refreshes workspace', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.delete).mockResolvedValue({ data: undefined })
    vi.mocked(http.post).mockResolvedValue({ data: { id: 101 } })
    vi.mocked(http.put).mockResolvedValue({ data: undefined })
    vi.mocked(http.get).mockResolvedValue({
      data: {
        characters: [
          {
            id: 101,
            type: 'CHARACTER',
            name: 'New Hero',
            description: 'Created locally',
            imageUrl: 'https://example.com/new-hero.png',
            extraJson: JSON.stringify({ prompt: 'created prompt', favorite: false }),
            createTime: '2026-06-25T00:00:00.000Z',
          },
          {
            id: 12,
            type: 'CHARACTER',
            name: 'Saved Hero',
            description: 'Updated remotely',
            imageUrl: 'https://example.com/saved-hero.png',
            extraJson: JSON.stringify({ prompt: 'updated prompt', favorite: true }),
            createTime: '2026-06-24T00:00:00.000Z',
          },
        ],
        scenes: [],
        props: [],
      },
    })

    const { assetWorkflowService } = await import('@/services/editor/assetWorkflow.service')

    const assets = await assetWorkflowService.syncAssets('project-1', {
      currentAssets: [
        buildAsset({
          id: 'character-local-1',
          title: 'New Hero',
          description: 'Created locally',
          prompt: 'created prompt',
          imageUrls: ['https://example.com/new-hero.png'],
        }),
        buildAsset({
          id: '12',
          title: 'Saved Hero',
          description: 'Updated remotely',
          prompt: 'updated prompt',
          imageUrls: ['https://example.com/saved-hero.png'],
          favorite: true,
        }),
      ],
      persistedIds: ['12', '13'],
    })

    expect(http.delete).toHaveBeenCalledWith('/aidrama/assets/13')
    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/assets', {
      type: 'CHARACTER',
      name: 'New Hero',
      description: 'Created locally',
      imageUrl: 'https://example.com/new-hero.png',
      extraJson: JSON.stringify({
        prompt: 'created prompt',
        favorite: false,
      }),
    })
    expect(http.put).toHaveBeenCalledWith('/aidrama/assets/12', {
      type: 'CHARACTER',
      name: 'Saved Hero',
      description: 'Updated remotely',
      imageUrl: 'https://example.com/saved-hero.png',
      extraJson: JSON.stringify({
        prompt: 'updated prompt',
        favorite: true,
      }),
    })
    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/assets/workspace')
    expect(assets?.map((asset) => asset.id)).toEqual(['101', '12'])
  })
})
