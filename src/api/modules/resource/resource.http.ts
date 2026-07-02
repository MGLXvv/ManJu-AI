import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { parseBackendAssetMeta } from '@/api/modules/editor/asset.mapper'
import { resourceFolders } from '@/mocks/resource.mock'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { BackendAssetType, BackendResourceLibraryItemDTO, BackendResourceLibraryPageDTO } from '@/types/api-dto'
import type { ResourceAssetSource } from '@/types/resource'
import type {
  CreateResourceAssetInput,
  ResourceApiContract,
  ResourceAsset,
  ResourceLibraryState,
  UpdateResourceAssetInput,
} from './resource.types'

const mapBackendTypeToResourceType = (type?: BackendAssetType): ResourceAsset['type'] =>
  type === 'CHARACTER' ? 'character' : 'scene'

const mapBackendScopeToSource = (scope?: string | null): ResourceAssetSource =>
  scope === 'OFFICIAL' ? 'official' : 'created'

const mapLibraryItemToResourceAsset = (
  item: BackendResourceLibraryItemDTO,
): ResourceAsset => {
  const parsedMeta = parseBackendAssetMeta(item.extraJson)
  const source = mapBackendScopeToSource(item.scope)

  return {
    id: String(item.id),
    tab: source === 'official' ? 'subject' : 'creative',
    type: mapBackendTypeToResourceType(item.assetType ?? item.type),
    source,
    name: item.name,
    prompt: parsedMeta.prompt,
    imageUrl: item.imageUrl || '',
  }
}

const createEmptyLibraryState = (): ResourceLibraryState => ({
  folders: resourceFolders.map((folder) => ({ ...folder })),
  assets: [],
})

export const resourceHttpApi: ResourceApiContract = {
  async getLibrary() {
    const { data } = await http.get<BackendResourceLibraryPageDTO>('/aidrama/resource-library/assets', {
      params: {
        pageNo: 1,
        pageSize: 100,
      },
    })

    const list = Array.isArray(data?.list) ? data.list : []
    return {
      ...createEmptyLibraryState(),
      assets: list.map(mapLibraryItemToResourceAsset),
    }
  },

  async createAsset(_input: CreateResourceAssetInput) {
    throw createApiError({
      code: API_ERROR_CODES.resourceHttpWriteUnsupported,
      message: 'Resource library write operations are not available in the current HTTP phase.',
    })
  },

  async updateAsset(_assetId: string, _input: UpdateResourceAssetInput) {
    throw createApiError({
      code: API_ERROR_CODES.resourceHttpWriteUnsupported,
      message: 'Resource library write operations are not available in the current HTTP phase.',
    })
  },

  async removeAsset(_assetId: string) {
    throw createApiError({
      code: API_ERROR_CODES.resourceHttpWriteUnsupported,
      message: 'Resource library write operations are not available in the current HTTP phase.',
    })
  },
}
