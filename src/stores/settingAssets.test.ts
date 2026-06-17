import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from './editor'
import { useGenerationStore } from './generation'
import { useSettingAssetsStore } from './settingAssets'

describe('setting assets store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates a central generation task when generating an asset image', async () => {
    const editorStore = useEditorStore()
    const generationStore = useGenerationStore()
    const store = useSettingAssetsStore()
    editorStore.currentProjectId = 'project-setting-assets'
    await store.loadDefaultAssets()

    const target = store.assets.find((asset) => asset.status === 'ready' || asset.status === 'empty')
    expect(target).toBeTruthy()

    await store.generateAssetImage(target!.id)

    const task = generationStore.tasks.find((item) => item.projectId === 'project-setting-assets')
    expect(task?.type).toBe('setting_asset')
    expect(task?.status).toBe('success')
    expect(store.assets.find((asset) => asset.id === target!.id)?.status).toBe('ready')
  })
})
