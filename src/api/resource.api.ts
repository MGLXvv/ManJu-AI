import { mockResourceAssets, resourceFolders, resourceVoiceOptions } from '@/mocks/resource.mock'
import type {
  CreateResourceAssetInput,
  ResourceAsset,
  ResourceLibraryState,
  UpdateResourceAssetInput,
} from '@/types/resource'
import { delay, readLocal, writeLocal } from './local'

const RESOURCE_LIBRARY_KEY = 'amd.resources.library'

const cloneAsset = (asset: ResourceAsset): ResourceAsset => ({
  ...asset,
  voiceOptions: asset.voiceOptions?.map((item) => ({ ...item })),
})

const cloneState = (state: ResourceLibraryState): ResourceLibraryState => ({
  folders: state.folders.map((folder) => ({ ...folder })),
  assets: state.assets.map(cloneAsset),
})

const getDefaultState = (): ResourceLibraryState => ({
  folders: resourceFolders.map((folder) => ({ ...folder })),
  assets: mockResourceAssets.map(cloneAsset),
})

const getLibraryState = (): ResourceLibraryState => {
  const stored = readLocal<ResourceLibraryState | null>(RESOURCE_LIBRARY_KEY, null)
  if (!stored?.folders?.length || !stored.assets?.length) {
    return getDefaultState()
  }

  return {
    folders: stored.folders.map((folder) => ({ ...folder })),
    assets: stored.assets.map((asset) => ({
      ...asset,
      voiceOptions: asset.voiceOptions?.length
        ? asset.voiceOptions.map((item) => ({ ...item }))
        : asset.type === 'character'
          ? resourceVoiceOptions.map((item) => ({ ...item }))
          : undefined,
    })),
  }
}

const setLibraryState = (state: ResourceLibraryState): void => writeLocal(RESOURCE_LIBRARY_KEY, state)

export const resourceApi = {
  async getLibrary(): Promise<ResourceLibraryState> {
    await delay()
    const state = getLibraryState()
    setLibraryState(state)
    return cloneState(state)
  },

  async createAsset(input: CreateResourceAssetInput): Promise<ResourceAsset> {
    await delay(80)
    const state = getLibraryState()
    const nextAsset: ResourceAsset = {
      id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      voiceOptions: input.type === 'character' ? resourceVoiceOptions.map((item) => ({ ...item })) : undefined,
    }
    state.assets.unshift(nextAsset)
    setLibraryState(state)
    return cloneAsset(nextAsset)
  },

  async updateAsset(assetId: string, input: UpdateResourceAssetInput): Promise<ResourceAsset | null> {
    await delay(80)
    const state = getLibraryState()
    const targetIndex = state.assets.findIndex((asset) => asset.id === assetId)
    if (targetIndex < 0) {
      return null
    }

    const current = state.assets[targetIndex]
    const nextType = input.type ?? current.type
    const nextAsset: ResourceAsset = {
      ...current,
      ...input,
      type: nextType,
      voiceOptions: nextType === 'character' ? current.voiceOptions ?? resourceVoiceOptions.map((item) => ({ ...item })) : undefined,
    }
    state.assets.splice(targetIndex, 1, nextAsset)
    setLibraryState(state)
    return cloneAsset(nextAsset)
  },

  async removeAsset(assetId: string): Promise<void> {
    await delay(80)
    const state = getLibraryState()
    state.assets = state.assets.filter((asset) => asset.id !== assetId)
    setLibraryState(state)
  },
}
