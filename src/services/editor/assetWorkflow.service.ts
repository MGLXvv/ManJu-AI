import { http } from '@/api/http'
import {
  isLocalAssetId,
  mapBackendAssetWorkspaceToSettingAssets,
  mapSettingAssetToBackendPayload,
} from '@/api/modules/editor/asset.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import type { SettingAsset } from '@/types/settingAsset'

export const assetWorkflowService = {
  async loadAssetWorkspace(projectId: string): Promise<SettingAsset[] | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.get(`/aidrama/projects/${projectId}/assets/workspace`)
    return mapBackendAssetWorkspaceToSettingAssets(data)
  },

  async createAsset(projectId: string, asset: SettingAsset): Promise<void> {
    await http.post(`/aidrama/projects/${projectId}/assets`, mapSettingAssetToBackendPayload(asset))
  },

  async updateAsset(asset: SettingAsset): Promise<void> {
    await http.put(`/aidrama/assets/${asset.id}`, mapSettingAssetToBackendPayload(asset))
  },

  async deleteAsset(assetId: string): Promise<void> {
    await http.delete(`/aidrama/assets/${assetId}`)
  },

  async syncAssets(
    projectId: string,
    input: {
      currentAssets: SettingAsset[]
      persistedIds: string[]
    },
  ): Promise<SettingAsset[] | null> {
    if (isMockMode) {
      return null
    }

    const currentPersistedIds = new Set(
      input.currentAssets.map((asset) => asset.id).filter((id) => !isLocalAssetId(id)),
    )

    const deletedIds = input.persistedIds.filter((id) => !currentPersistedIds.has(id))

    for (const id of deletedIds) {
      await this.deleteAsset(id)
    }

    for (const asset of input.currentAssets) {
      if (isLocalAssetId(asset.id)) {
        await this.createAsset(projectId, asset)
        continue
      }

      await this.updateAsset(asset)
    }

    return this.loadAssetWorkspace(projectId)
  },
}
