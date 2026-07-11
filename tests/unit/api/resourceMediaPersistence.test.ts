import { beforeEach, describe, expect, it } from 'vitest'
import { readLocal, resetLocalState } from '@/api/local'
import { resourceMockApi } from '@/api/modules/resource/resource.mock'
import type { ResourceLibraryState } from '@/types/resource'

const RESOURCE_LIBRARY_KEY = 'amd.resources.library'

const isTransientUrl = (value: string): boolean => value.startsWith('data:') || value.startsWith('blob:')

describe('resource media persistence', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('captures resource Data URLs as media ids and restores their previews', async () => {
    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    )}`
    const created = await resourceMockApi.createAsset({
      tab: 'creative',
      type: 'character',
      source: 'created',
      name: '本地角色',
      prompt: '本地角色提示词',
      imageUrl: dataUrl,
    })

    expect(created.imageMediaId).toMatch(/^media-/)
    expect(isTransientUrl(created.imageUrl)).toBe(false)

    const stored = readLocal<ResourceLibraryState>(RESOURCE_LIBRARY_KEY, { folders: [], assets: [] })
    const storedAsset = stored.assets.find((asset) => asset.id === created.id)
    expect(storedAsset?.imageMediaId).toBe(created.imageMediaId)
    expect(storedAsset?.imageUrl).toBe('')
    expect(stored.assets.every((asset) => !isTransientUrl(asset.imageUrl))).toBe(true)

    const restored = await resourceMockApi.getLibrary()
    expect(restored.assets.find((asset) => asset.id === created.id)?.imageUrl).toBe(created.imageUrl)
  })
})
