import { parseBackendAssetMeta } from '@/api/modules/editor/asset.mapper'
import type { BackendAssetDTO, BackendAssetType } from '@/types/api-dto'
import type { Asset } from './asset.types'

const backendTypeToAssetType: Record<BackendAssetType, Asset['type']> = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop',
}

export const mapBackendAssetToAsset = (asset: BackendAssetDTO): Asset => {
  const meta = parseBackendAssetMeta(asset.extraJson)

  return {
    id: String(asset.id),
    type: backendTypeToAssetType[asset.type],
    name: asset.name,
    prompt: meta.prompt,
    imageUrls: asset.imageUrl ? [asset.imageUrl] : [],
    favorite: meta.favorite ?? asset.favorite ?? false,
  }
}
