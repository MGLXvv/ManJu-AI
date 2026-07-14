import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { extractBackendList } from '@/api/shared/backendPayload'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { BackendAssetDTO } from '@/types/api-dto'
import { mapBackendAssetToAsset } from './asset.mapper'
import type { Asset, AssetApiContract } from './asset.types'

/**
 * The Integration Pack exposes project assets as a list plus single-asset CRUD.
 * The legacy frontend `save(projectId, assets[])` contract cannot be translated safely into one backend request,
 * so HTTP mode rejects aggregate writes until the store is migrated to create/update/delete operations.
 */
export const assetHttpApi: AssetApiContract = {
  async list(projectId: string) {
    const { data } = await http.get(`/aidrama/projects/${projectId}/assets`)
    return extractBackendList<BackendAssetDTO>(data, ['assets']).map(mapBackendAssetToAsset)
  },

  async save(_projectId: string, _assets: Asset[]) {
    throw createApiError({
      code: API_ERROR_CODES.assetAggregateSaveUnsupported,
      message: 'Project Asset HTTP writes require single-asset create/update/delete operations.',
      details: {
        backendCreate: 'POST /aidrama/projects/{projectId}/assets',
        backendUpdate: 'PUT /aidrama/assets/{assetId}',
        backendDelete: 'DELETE /aidrama/assets/{assetId}',
      },
    })
  },
}
