import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { resourceApi } from '@/api/resource.api'

describe('resource api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('hydrates default resource library state', async () => {
    const state = await resourceApi.getLibrary()

    expect(state.folders.length).toBeGreaterThan(0)
    expect(state.assets.length).toBeGreaterThan(0)
  })

  it('creates, updates, and removes a resource asset', async () => {
    const created = await resourceApi.createAsset({
      tab: 'creative',
      type: 'character',
      source: 'created',
      name: '测试角色',
      prompt: '测试提示词',
      imageUrl: 'data:image/png;base64,test',
      selectedVoiceId: 'female-soft',
    })

    const updated = await resourceApi.updateAsset(created.id, {
      name: '测试角色-更新',
      prompt: '更新提示词',
    })
    const hydrated = await resourceApi.getLibrary()

    expect(updated?.name).toBe('测试角色-更新')
    expect(hydrated.assets.some((asset) => asset.id === created.id)).toBe(true)

    await resourceApi.removeAsset(created.id)
    const afterDelete = await resourceApi.getLibrary()

    expect(afterDelete.assets.some((asset) => asset.id === created.id)).toBe(false)
  })
})
