import { http } from '@/api/http'
import { extractBackendEntity, extractBackendList } from '@/api/shared/backendPayload'
import { resourceFolders } from '@/features/resource/resourceLibraryDefaults'
import type { BackendResourceLibraryItemDTO, BackendResourceLibraryPageDTO } from '@/types/api-dto'
import {
  mapBackendResourceAsset,
  mapCreateResourceInputToBackendPayload,
  mapUpdateResourceInputToBackendPayload,
} from './resource.mapper'
import type { ResourceApiContract, ResourceLibraryState } from './resource.types'

const RESOURCE_ASSETS_PATH = '/aidrama/resource-library/assets'

const createEmptyLibraryState = (): ResourceLibraryState => ({
  folders: resourceFolders.map((folder) => ({ ...folder })),
  assets: [],
})

/**
 * Resource Library is marked READY in the Integration Pack. Its backend `assetType` and Project Asset `type`
 * are intentionally different contracts; all translation stays in resource.mapper.ts.
 */
export const resourceHttpApi: ResourceApiContract = {
  async getLibrary() {
    const { data } = await http.get<BackendResourceLibraryPageDTO>(RESOURCE_ASSETS_PATH, {
      params: {
        pageNo: 1,
        pageSize: 100,
      },
    })

    return {
      ...createEmptyLibraryState(),
      assets: extractBackendList<BackendResourceLibraryItemDTO>(data).map(mapBackendResourceAsset),
    }
  },

  async createAsset(input) {
    const { data } = await http.post(RESOURCE_ASSETS_PATH, mapCreateResourceInputToBackendPayload(input))
    const asset = extractBackendEntity<BackendResourceLibraryItemDTO>(data, ['asset'])
    return mapBackendResourceAsset(asset ?? {
      id: '',
      name: input.name,
      assetType: mapCreateResourceInputToBackendPayload(input).assetType,
    })
  },

  async updateAsset(assetId, input) {
    const { data } = await http.put(
      `${RESOURCE_ASSETS_PATH}/${assetId}`,
      mapUpdateResourceInputToBackendPayload(input),
    )
    const asset = extractBackendEntity<BackendResourceLibraryItemDTO>(data, ['asset'])
    return asset ? mapBackendResourceAsset(asset) : null
  },

  async removeAsset(assetId) {
    await http.delete(`${RESOURCE_ASSETS_PATH}/${assetId}`)
  },
}
