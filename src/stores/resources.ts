import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { resourceApi } from '@/api/resource.api'
import type {
  CreateResourceAssetInput,
  ResourceAsset,
  ResourceFolder,
  ResourceSourceFilter,
  ResourceTypeFilter,
  ResourceLibraryTab,
  UpdateResourceAssetInput,
} from '@/types/resource'

export const useResourcesStore = defineStore('resources', () => {
  const folders = ref<ResourceFolder[]>([])
  const assets = ref<ResourceAsset[]>([])
  const activeTab = ref<ResourceLibraryTab>('creative')
  const activeFolderId = ref('creative-created')
  const keyword = ref('')
  const sourceFilter = ref<ResourceSourceFilter>('all')
  const typeFilter = ref<ResourceTypeFilter>('all')
  const loading = ref(false)
  const hydrated = ref(false)

  const visibleFolders = computed(() => folders.value.filter((folder) => folder.tab === activeTab.value))
  const activeFolder = computed(
    () => visibleFolders.value.find((folder) => folder.id === activeFolderId.value) ?? visibleFolders.value[0],
  )

  const folderCounts = computed(() =>
    Object.fromEntries(
      folders.value.map((folder) => [
        folder.id,
        assets.value.filter((asset) => asset.tab === folder.tab && asset.source === folder.source).length,
      ]),
    ) as Record<string, number>,
  )

  const filteredAssets = computed(() => {
    const text = keyword.value.trim().toLocaleLowerCase()
    const folder = activeFolder.value
    return assets.value.filter((asset) => {
      const tabMatch = asset.tab === activeTab.value
      const folderMatch = folder ? asset.source === folder.source : true
      const sourceMatch = sourceFilter.value === 'all' || asset.source === sourceFilter.value
      const typeMatch = typeFilter.value === 'all' || asset.type === typeFilter.value
      const keywordMatch =
        !text ||
        asset.name.toLocaleLowerCase().includes(text) ||
        asset.prompt.toLocaleLowerCase().includes(text)
      return tabMatch && folderMatch && sourceMatch && typeMatch && keywordMatch
    })
  })

  const syncFolderSelection = (): void => {
    if (visibleFolders.value.some((folder) => folder.id === activeFolderId.value)) {
      return
    }
    activeFolderId.value = visibleFolders.value[0]?.id ?? ''
  }

  const hydrate = async (): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      const state = await resourceApi.getLibrary()
      folders.value = state.folders
      assets.value = state.assets
      hydrated.value = true
      syncFolderSelection()
    } finally {
      loading.value = false
    }
  }

  const setActiveTab = (value: ResourceLibraryTab): void => {
    activeTab.value = value
    syncFolderSelection()
  }

  const setActiveFolder = (id: string): void => {
    activeFolderId.value = id
  }

  const createAsset = async (payload: CreateResourceAssetInput): Promise<ResourceAsset> => {
    const created = await resourceApi.createAsset(payload)
    assets.value.unshift(created)
    return created
  }

  const updateAsset = async (id: string, patch: UpdateResourceAssetInput): Promise<ResourceAsset | null> => {
    const updated = await resourceApi.updateAsset(id, patch)
    if (!updated) {
      return null
    }

    assets.value = assets.value.map((asset) => (asset.id === id ? updated : asset))
    return updated
  }

  const deleteAsset = async (id: string): Promise<void> => {
    await resourceApi.removeAsset(id)
    assets.value = assets.value.filter((asset) => asset.id !== id)
  }

  return {
    folders,
    assets,
    activeTab,
    activeFolderId,
    keyword,
    sourceFilter,
    typeFilter,
    loading,
    hydrated,
    visibleFolders,
    folderCounts,
    filteredAssets,
    hydrate,
    setActiveTab,
    setActiveFolder,
    createAsset,
    updateAsset,
    deleteAsset,
  }
})
