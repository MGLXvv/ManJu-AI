import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'
import { isLocalAssetId } from '@/api/modules/editor/asset.mapper'
import {
  mapBackendResourceLibraryPage,
  mapResourceLibraryTypeQuery,
  type ResourceLibraryQueryType,
} from '@/api/modules/editor/resourceLibrary.mapper'
import { assetWorkflowService } from '@/services/editor/assetWorkflow.service'
import { cloneSettingAsset, createDefaultSettingAssets } from '@/mocks/setting.mock'
import type { BackendResourceLibraryItemDTO, BackendResourceLibraryPageDTO } from '@/types/api-dto'
import type { SettingAsset } from '@/types/settingAsset'

export interface ResourceLibraryListQuery {
  type?: ResourceLibraryQueryType
  keyword?: string
  scope?: string
  page?: number
  pageSize?: number
}

const getMockLibraryItems = (query: ResourceLibraryListQuery = {}): { items: SettingAsset[]; total: number } => {
  const keyword = query.keyword?.trim().toLocaleLowerCase() ?? ''
  const type = query.type ?? 'all'
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.max(1, query.pageSize ?? 20)

  const filtered = createDefaultSettingAssets()
    .map((asset, index) =>
      cloneSettingAsset({
        ...asset,
        id: `library-${asset.id}-${index + 1}`,
        title: asset.title.replace(/^角色-|^场景-|^道具-/, (prefix) => `资源库${prefix}`),
        favorite: false,
      }),
    )
    .filter((asset) => type === 'all' || asset.type === type)
    .filter((asset) => !keyword || [asset.title, asset.prompt, asset.description].some((value) => value.toLocaleLowerCase().includes(keyword)))

  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
  }
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
      return getMockLibraryItems(query)
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
    if (resourceAssetIds.length === 0) {
      return null
    }

    if (isMockMode) {
      const idSet = new Set(resourceAssetIds)
      return getMockLibraryItems({ page: 1, pageSize: 100 }).items
        .filter((asset) => idSet.has(asset.id))
        .map((asset, index) =>
          cloneSettingAsset({
            ...asset,
            id: `asset-imported-${Date.now()}-${index + 1}`,
            createdAt: '2026-03-12 17:16',
          }),
        )
    }

    await http.post(`/aidrama/projects/${projectId}/assets/import-from-library`, {
      resourceAssetIds: resourceAssetIds.map((id) => Number.isNaN(Number(id)) ? id : Number(id)),
    })

    return assetWorkflowService.loadAssetWorkspace(projectId)
  },
}
