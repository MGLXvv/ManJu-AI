import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'
import { isLocalAssetId } from '@/api/modules/editor/asset.mapper'
import {
  mapBackendResourceLibraryPage,
  mapResourceLibraryTypeQuery,
  type ResourceLibraryQueryType,
} from '@/api/modules/editor/resourceLibrary.mapper'
import { assetWorkflowService } from '@/services/editor/assetWorkflow.service'
import type { BackendResourceLibraryItemDTO, BackendResourceLibraryPageDTO } from '@/types/api-dto'
import type { SettingAsset } from '@/types/settingAsset'

export interface ResourceLibraryListQuery {
  type?: ResourceLibraryQueryType
  keyword?: string
  scope?: string
  page?: number
  pageSize?: number
}

export const resourceLibraryService = {
  async saveAssetToLibrary(assetId: string): Promise<BackendResourceLibraryItemDTO | null> {
    if (isMockMode || isLocalAssetId(assetId)) {
      return null
    }

    const { data } = await http.post(`/aidrama/assets/${assetId}/save-to-library`)
    return data
  },

  async listLibraryItems(
    query: ResourceLibraryListQuery = {},
  ): Promise<{ items: SettingAsset[]; total: number }> {
    if (isMockMode) {
      return { items: [], total: 0 }
    }

    const { data } = await http.get<BackendResourceLibraryPageDTO | BackendResourceLibraryItemDTO[]>(
      '/aidrama/resource-library/assets',
      {
        params: {
          pageNo: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
          type: mapResourceLibraryTypeQuery(query.type),
          keyword: query.keyword || undefined,
          scope: query.scope || undefined,
        },
      },
    )

    return mapBackendResourceLibraryPage(data)
  },

  async importFromLibrary(projectId: string, resourceAssetIds: string[]): Promise<SettingAsset[] | null> {
    if (isMockMode || resourceAssetIds.length === 0) {
      return null
    }

    await http.post(`/aidrama/projects/${projectId}/assets/import-from-library`, {
      resourceAssetIds: resourceAssetIds.map((id) => Number.isNaN(Number(id)) ? id : Number(id)),
    })

    return assetWorkflowService.loadAssetWorkspace(projectId)
  },
}
