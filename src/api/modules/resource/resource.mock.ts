import { delay, readLocal, writeLocal } from '@/api/local'
import { resourceFolders } from '@/features/resource/resourceLibraryDefaults'
import { mockResourceAssets, resourceVoiceOptions } from '@/mocks/resource.mock'
import {
  hydrateResourceAssetMedia,
  mediaUploadService,
  sanitizeResourceAssetMedia,
} from '@/services/media'
import type {
  CreateResourceAssetInput,
  ResourceApiContract,
  ResourceAsset,
  ResourceLibraryState,
  UpdateResourceAssetInput,
} from './resource.types'

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

const setLibraryState = (state: ResourceLibraryState): void =>
  writeLocal(RESOURCE_LIBRARY_KEY, {
    folders: state.folders.map((folder) => ({ ...folder })),
    assets: state.assets.map((asset) => sanitizeResourceAssetMedia(cloneAsset(asset))),
  })

const hydrateState = async (state: ResourceLibraryState): Promise<ResourceLibraryState> => ({
  folders: state.folders.map((folder) => ({ ...folder })),
  assets: await Promise.all(state.assets.map(hydrateResourceAssetMedia)),
})

export const resourceMockApi: ResourceApiContract = {
  async getLibrary() {
    await delay()
    const state = getLibraryState()
    setLibraryState(state)
    return cloneState(await hydrateState(state))
  },

  async createAsset(input: CreateResourceAssetInput) {
    await delay(80)
    const state = getLibraryState()
    const id = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const media = input.imageUrl
      ? await mediaUploadService.captureUrl(
          input.imageUrl,
          { targetType: 'resource-asset', targetId: id, kind: 'image' },
          `${id}-image`,
        )
      : null
    const nextAsset: ResourceAsset = {
      id,
      ...input,
      imageUrl: media?.url ?? input.imageUrl,
      imageMediaId: media?.mediaId ?? input.imageMediaId,
      voiceOptions: input.type === 'character' ? resourceVoiceOptions.map((item) => ({ ...item })) : undefined,
    }
    state.assets.unshift(nextAsset)
    setLibraryState(state)
    return cloneAsset(nextAsset)
  },

  async updateAsset(assetId: string, input: UpdateResourceAssetInput) {
    await delay(80)
    const state = getLibraryState()
    const targetIndex = state.assets.findIndex((asset) => asset.id === assetId)
    if (targetIndex < 0) {
      return null
    }

    const current = await hydrateResourceAssetMedia(state.assets[targetIndex])
    const nextType = input.type ?? current.type
    const media = input.imageUrl
      ? await mediaUploadService.captureUrl(
          input.imageUrl,
          { targetType: 'resource-asset', targetId: assetId, kind: 'image' },
          `${assetId}-image`,
        )
      : null
    const nextAsset: ResourceAsset = {
      ...current,
      ...input,
      imageUrl: media?.url ?? input.imageUrl ?? current.imageUrl,
      imageMediaId: media?.mediaId ?? input.imageMediaId ?? current.imageMediaId,
      type: nextType,
      voiceOptions:
        nextType === 'character'
          ? current.voiceOptions ?? resourceVoiceOptions.map((item) => ({ ...item }))
          : undefined,
    }
    state.assets.splice(targetIndex, 1, nextAsset)
    setLibraryState(state)
    return cloneAsset(nextAsset)
  },

  async removeAsset(assetId: string) {
    await delay(80)
    const state = getLibraryState()
    state.assets = state.assets.filter((asset) => asset.id !== assetId)
    setLibraryState(state)
  },
}
