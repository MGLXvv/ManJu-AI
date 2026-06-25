import type { BackendAssetType, BackendResourceLibraryItemDTO, BackendResourceLibraryPageDTO } from '@/types/api-dto'
import type { SettingAsset } from '@/types/settingAsset'
import { mapBackendAssetTypeToSettingAssetType, parseBackendAssetMeta } from './asset.mapper'

export type ResourceLibraryQueryType = 'all' | 'character' | 'scene' | 'prop'

const resolveBackendType = (item: BackendResourceLibraryItemDTO): BackendAssetType =>
  item.assetType ?? item.type ?? 'CHARACTER'

export const mapResourceLibraryItemToSettingAsset = (
  item: BackendResourceLibraryItemDTO,
): SettingAsset => {
  const parsedMeta = parseBackendAssetMeta(item.extraJson)

  return {
    id: String(item.id),
    type: mapBackendAssetTypeToSettingAssetType(resolveBackendType(item)),
    title: item.name,
    description: item.description || '',
    prompt: parsedMeta.prompt,
    imageUrls: item.imageUrl ? [item.imageUrl] : [],
    status: item.imageUrl ? 'ready' : 'empty',
    favorite: parsedMeta.favorite ?? false,
    createdAt: item.createTime || item.updateTime || '',
  }
}

export const mapResourceLibraryTypeQuery = (
  type?: ResourceLibraryQueryType,
): BackendAssetType | undefined => {
  if (!type || type === 'all') {
    return undefined
  }
  if (type === 'character') {
    return 'CHARACTER'
  }
  if (type === 'scene') {
    return 'SCENE'
  }
  return 'PROP'
}

export const mapBackendResourceLibraryPage = (
  data: BackendResourceLibraryPageDTO | BackendResourceLibraryItemDTO[],
): { items: SettingAsset[]; total: number } => {
  const list = Array.isArray(data) ? data : data.list ?? []
  return {
    items: list.map(mapResourceLibraryItemToSettingAsset),
    total: Array.isArray(data) ? list.length : data.total ?? list.length,
  }
}
