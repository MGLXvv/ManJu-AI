import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'
import { mapBackendAssetWorkspaceToSettingAssets, isLocalAssetId } from '@/api/modules/editor/asset.mapper'
import type { BackendResourceLibraryItemDTO } from '@/types/api-dto'
import type { SettingAsset } from '@/types/settingAsset'

export const resourceLibraryService = {
  async saveAssetToLibrary(assetId: string): Promise<BackendResourceLibraryItemDTO | null> {
    if (isMockMode || isLocalAssetId(assetId)) {
      return null
    }

    const { data } = await http.post(`/aidrama/assets/${assetId}/save-to-library`)
    return data
  },

  async importAssetsToProject(projectId: string, resourceAssetIds: string[]): Promise<SettingAsset[] | null> {
    if (isMockMode || resourceAssetIds.length === 0) {
      return null
    }

    const { data } = await http.post(`/aidrama/projects/${projectId}/assets/import-from-library`, {
      resourceAssetIds: resourceAssetIds.map((id) => Number.isNaN(Number(id)) ? id : Number(id)),
    })

    return mapBackendAssetWorkspaceToSettingAssets({
      characters: (data ?? []).filter((item: { type?: string }) => item.type === 'CHARACTER'),
      scenes: (data ?? []).filter((item: { type?: string }) => item.type === 'SCENE'),
      props: (data ?? []).filter((item: { type?: string }) => item.type === 'PROP'),
    })
  },
}
