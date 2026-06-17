import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { useResourcesStore } from './resources'

describe('resources store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetLocalState()
  })

  it('hydrates and creates resource assets through the api layer', async () => {
    const store = useResourcesStore()

    await store.hydrate()
    const created = await store.createAsset({
      tab: 'creative',
      type: 'scene',
      source: 'created',
      name: '测试场景',
      prompt: '新的场景',
      imageUrl: 'data:image/png;base64,test',
    })

    expect(store.hydrated).toBe(true)
    expect(store.assets.some((asset) => asset.id === created.id)).toBe(true)
    expect(store.filteredAssets.length).toBeGreaterThan(0)
  })
})
