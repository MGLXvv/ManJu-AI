import type { BackendResourceLibraryItemDTO } from '@/types/api-dto'
import type { SettingAsset } from '@/types/settingAsset'
import { mapBackendAssetTypeToSettingAssetType, parseBackendAssetMeta } from './asset.mapper'

export const mapResourceLibraryItemToSettingAsset = (
  item: BackendResourceLibraryItemDTO,
): SettingAsset => {
  const parsedMeta = parseBackendAssetMeta(item.extraJson)

  return {
    id: String(item.id),
    type: mapBackendAssetTypeToSettingAssetType(item.assetType),
    title: item.name,
    description: item.description || '',
    prompt: parsedMeta.prompt,
    imageUrls: item.imageUrl ? [item.imageUrl] : [],
    status: item.imageUrl ? 'ready' : 'empty',
    favorite: parsedMeta.favorite ?? false,
    createdAt: item.createTime || item.updateTime || '',
  }
}
