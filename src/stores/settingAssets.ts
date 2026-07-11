import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { settingApi } from '@/api/setting.api'
import { cloneSettingAsset, createDefaultSettingAssets } from '@/mocks/setting.mock'
import { settingAssetGenerationService } from '@/services/generation'
import { useEditorStore } from '@/stores/editor'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { MediaUploadResult } from '@/types/media'
import type { SettingAsset, SettingAssetType, SettingAssetTypeFilter } from '@/types/settingAsset'

const normalizeKeyword = (value: string): string => value.trim().toLocaleLowerCase()

export { createDefaultSettingAssets } from '@/mocks/setting.mock'

export const useSettingAssetsStore = defineStore('setting-assets', () => {
  const assets = ref<SettingAsset[]>(createDefaultSettingAssets())
  const keyword = ref('')
  const activeType = ref<SettingAssetTypeFilter>('all')
  const editorStore = useEditorStore()

  const filteredAssets = computed(() => {
    const word = normalizeKeyword(keyword.value)
    return assets.value.filter((asset) => {
      const typeMatch = activeType.value === 'all' || asset.type === activeType.value
      const searchFields = [
        asset.title,
        asset.prompt,
        asset.roleName ?? '',
        ...(asset.voiceOptions?.map((item) => item.name) ?? []),
      ].map(normalizeKeyword)
      const keywordMatch = !word || searchFields.some((field) => field.includes(word))
      return typeMatch && keywordMatch
    })
  })

  const counts = computed(() => {
    const character = assets.value.filter((asset) => asset.type === 'character').length
    const scene = assets.value.filter((asset) => asset.type === 'scene').length
    const prop = assets.value.filter((asset) => asset.type === 'prop').length
    return {
      all: assets.value.length,
      character,
      scene,
      prop,
    }
  })

  const setKeyword = (value: string): void => {
    keyword.value = value
  }

  const setActiveType = (value: SettingAssetTypeFilter): void => {
    activeType.value = value
  }

  const setAssets = (nextAssets: SettingAsset[]): void => {
    assets.value = nextAssets.map(cloneSettingAsset)
  }

  const resetAssets = (): void => {
    assets.value = createDefaultSettingAssets()
  }

  const loadDefaultAssets = async (): Promise<void> => {
    assets.value = await settingApi.listDefaults()
  }

  const createAsset = async (payload: {
    type: SettingAssetType
    title: string
    roleName?: string
    description: string
    prompt: string
    voiceId?: string
    voiceName?: string
  }): Promise<void> => {
    const created = await settingApi.createAsset(payload)
    assets.value.unshift(created)
  }

  const updateAsset = async (id: string, patch: Partial<SettingAsset>): Promise<void> => {
    const target = assets.value.find((asset) => asset.id === id)
    if (!target) {
      return
    }
    const updated = await settingApi.updateAsset(target, patch)
    assets.value = assets.value.map((asset) => (asset.id === id ? updated : asset))
  }

  const deleteAsset = (id: string): void => {
    assets.value = assets.value.filter((asset) => asset.id !== id)
  }

  const toggleFavorite = (id: string): void => {
    assets.value = assets.value.map((asset) => (asset.id === id ? { ...asset, favorite: !asset.favorite } : asset))
  }

  const setFavoriteForAssets = (ids: string[], favorite = true): void => {
    if (ids.length === 0) {
      return
    }

    const idSet = new Set(ids)
    assets.value = assets.value.map((asset) => (idSet.has(asset.id) ? { ...asset, favorite } : asset))
  }

  const uploadAssetImage = async (id: string, media: string | MediaUploadResult): Promise<void> => {
    const target = assets.value.find((asset) => asset.id === id)
    if (!target) {
      return
    }
    const imageUrl = typeof media === 'string' ? media : media.url
    const updated = await settingApi.uploadAssetImage(target, imageUrl)
    const next = typeof media === 'string'
      ? updated
      : {
          ...updated,
          imageMediaIds: [media.mediaId, ...(target.imageMediaIds ?? [])].slice(0, 6),
          candidateMediaIds: [media.mediaId, ...(target.candidateMediaIds ?? [])].slice(0, 12),
        }
    assets.value = assets.value.map((asset) => (asset.id === id ? next : asset))
  }

  const selectCandidateImage = async (id: string, imageUrl: string): Promise<void> => {
    const target = assets.value.find((asset) => asset.id === id)
    if (!target) {
      return
    }
    const updated = await settingApi.selectCandidateImage(target, imageUrl)
    assets.value = assets.value.map((asset) => (asset.id === id ? updated : asset))
  }

  const generateAssetImage = async (id: string): Promise<void> => {
    const target = assets.value.find((asset) => asset.id === id)
    if (!target) {
      return
    }

    assets.value = assets.value.map((asset) => (asset.id === id ? { ...asset, status: 'generating' } : asset))

    try {
      const result = await settingAssetGenerationService.generateAssetImage({
        projectId: editorStore.currentProjectId ?? 'mock-project',
        asset: target,
      })

      assets.value = assets.value.map((asset) => (asset.id === id ? result.asset : asset))
    } catch (error) {
      assets.value = assets.value.map((asset) => (asset.id === id ? { ...asset, status: 'failed' } : asset))
      throw error
    }
  }

  return {
    assets,
    keyword,
    activeType,
    filteredAssets,
    counts,
    setKeyword,
    setActiveType,
    setAssets,
    resetAssets,
    loadDefaultAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    toggleFavorite,
    setFavoriteForAssets,
    uploadAssetImage,
    selectCandidateImage,
    generateAssetImage,
  }
})
