import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { API_ERROR_CODES } from '@/types/api-enums'
import { useEditorStore } from './editor'
import { useGenerationStore } from './generation'
import { useSettingAssetsStore } from './settingAssets'

describe('setting assets store', () => {
  beforeEach(() => {
    resetLocalState()
    setActivePinia(createPinia())
  })

  it('replaces the asset when generating a setting image succeeds', async () => {
    const editorStore = useEditorStore()
    const generationStore = useGenerationStore()
    const store = useSettingAssetsStore()
    editorStore.currentProjectId = 'project-setting-assets'
    await store.loadDefaultAssets()

    const target = store.assets.find((asset) => asset.status === 'ready' || asset.status === 'empty')
    expect(target).toBeTruthy()
    const originalImageUrl = target!.imageUrls[0]

    await store.generateAssetImage(target!.id)

    expect(generationStore.tasks).toHaveLength(0)
    expect(store.assets.find((asset) => asset.id === target!.id)?.status).toBe('ready')
    expect(store.assets.find((asset) => asset.id === target!.id)?.imageUrls[0]).not.toBe(originalImageUrl)
  })

  it('marks the asset as failed when generating a setting image fails', async () => {
    const editorStore = useEditorStore()
    const store = useSettingAssetsStore()
    editorStore.currentProjectId = 'project-setting-assets-fail'
    await store.loadDefaultAssets()

    const target = store.assets.find((asset) => asset.status === 'ready' || asset.status === 'empty')
    expect(target).toBeTruthy()

    await store.updateAsset(target!.id, { prompt: '#mock-image-fail' })

    await expect(store.generateAssetImage(target!.id)).rejects.toThrow(API_ERROR_CODES.settingImageGenerateFailed)
    expect(store.assets.find((asset) => asset.id === target!.id)?.status).toBe('failed')
  })
})
