import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { resourceApiMock } = vi.hoisted(() => ({
  resourceApiMock: {
    getLibrary: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    removeAsset: vi.fn(),
  },
}))

vi.mock('@/api/resource.api', () => ({
  resourceApi: resourceApiMock,
}))

describe('resources store phase1 compat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(resourceApiMock).forEach((fn) => fn.mockReset())
    vi.resetModules()
  })

  it('hydrates safely when http mode returns folders with no assets', async () => {
    resourceApiMock.getLibrary.mockResolvedValue({
      folders: [
        { id: 'creative-created', label: '我的创建', tab: 'creative', source: 'created' },
      ],
      assets: [],
    })

    const { useResourcesStore } = await import('@/stores/resources')
    const store = useResourcesStore()
    await store.hydrate()

    expect(store.hydrated).toBe(true)
    expect(store.assets).toEqual([])
    expect(store.visibleFolders).toHaveLength(1)
    expect(store.activeFolderId).toBe('creative-created')
  })

  it('merges partial edits with the current resource before calling the http contract', async () => {
    const existing = {
      id: 'asset-1',
      tab: 'creative' as const,
      type: 'character' as const,
      source: 'favorite' as const,
      name: 'Original',
      prompt: 'keep prompt',
      imageUrl: 'https://example.com/original.png',
      selectedVoiceId: 'voice-1',
    }
    resourceApiMock.getLibrary.mockResolvedValue({
      folders: [
        { id: 'creative-favorite', label: '我的收藏', tab: 'creative', source: 'favorite' },
      ],
      assets: [existing],
    })
    resourceApiMock.updateAsset.mockImplementation(async (_id, input) => ({
      ...existing,
      ...input,
      id: existing.id,
    }))

    const { useResourcesStore } = await import('@/stores/resources')
    const store = useResourcesStore()
    await store.hydrate()
    await store.updateAsset('asset-1', { name: 'Renamed' })

    expect(resourceApiMock.updateAsset).toHaveBeenCalledWith('asset-1', {
      tab: 'creative',
      type: 'character',
      source: 'favorite',
      name: 'Renamed',
      prompt: 'keep prompt',
      imageUrl: 'https://example.com/original.png',
      imageMediaId: undefined,
      selectedVoiceId: 'voice-1',
    })
  })
})
