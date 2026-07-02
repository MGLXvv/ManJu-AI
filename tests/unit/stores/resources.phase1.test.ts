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
})
