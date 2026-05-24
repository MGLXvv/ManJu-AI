import { defineStore } from 'pinia'
import { ref } from 'vue'
import { assetApi } from '@/api/asset.api'
import type { Asset } from '@/types/asset'

export const useAssetStore = defineStore('asset', () => {
  const projectId = ref<string | null>(null)
  const assets = ref<Asset[]>([])
  const loading = ref(false)

  const loadAssets = async (nextProjectId: string): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      projectId.value = nextProjectId
      assets.value = await assetApi.list(nextProjectId)
    } finally {
      loading.value = false
    }
  }

  const saveAssets = async (): Promise<void> => {
    if (!projectId.value) {
      return
    }
    assets.value = await assetApi.save(projectId.value, assets.value)
  }

  return { projectId, assets, loading, loadAssets, saveAssets }
})
