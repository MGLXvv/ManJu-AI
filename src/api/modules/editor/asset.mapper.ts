import type { BackendAssetDTO, BackendAssetType, BackendAssetWorkspaceDTO } from '@/types/api-dto'
import type { SettingAsset, SettingAssetType } from '@/types/settingAsset'

export interface BackendAssetSavePayload {
  type: BackendAssetType
  name: string
  description: string
  imageUrl: string
  extraJson: string
}

const backendAssetTypeMap: Record<BackendAssetType, SettingAssetType> = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop',
}

const settingAssetTypeMap: Record<SettingAssetType, BackendAssetType> = {
  character: 'CHARACTER',
  scene: 'SCENE',
  prop: 'PROP',
}

const parseBackendAssetMeta = (
  extraJson?: string | null,
): { prompt: string; favorite: boolean | undefined } => {
  if (!extraJson) {
    return { prompt: '', favorite: undefined }
  }

  try {
    const parsed = JSON.parse(extraJson) as { prompt?: unknown; favorite?: unknown }
    return {
      prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
      favorite: typeof parsed.favorite === 'boolean' ? parsed.favorite : undefined,
    }
  } catch {
    return { prompt: '', favorite: undefined }
  }
}

export const isLocalAssetId = (id: string): boolean =>
  ['asset-', 'character-', 'scene-', 'prop-'].some((prefix) => id.startsWith(prefix))

export const mapBackendAssetToSettingAsset = (asset: BackendAssetDTO): SettingAsset => {
  const parsedMeta = parseBackendAssetMeta(asset.extraJson)

  return {
    id: String(asset.id),
    type: backendAssetTypeMap[asset.type],
    title: asset.name,
    description: asset.description || '',
    prompt: parsedMeta.prompt,
    imageUrls: asset.imageUrl ? [asset.imageUrl] : [],
    status: asset.imageUrl ? 'ready' : 'empty',
    favorite: parsedMeta.favorite ?? (typeof asset.favorite === 'boolean' ? asset.favorite : false),
    createdAt: asset.createTime || asset.updateTime || '',
  }
}

export const mapBackendAssetWorkspaceToSettingAssets = (
  workspace: BackendAssetWorkspaceDTO,
): SettingAsset[] => [
  ...(workspace.characters ?? []).map(mapBackendAssetToSettingAsset),
  ...(workspace.scenes ?? []).map(mapBackendAssetToSettingAsset),
  ...(workspace.props ?? []).map(mapBackendAssetToSettingAsset),
]

export const mapSettingAssetToBackendPayload = (asset: SettingAsset): BackendAssetSavePayload => ({
  type: settingAssetTypeMap[asset.type],
  name: asset.title,
  description: asset.description,
  imageUrl: asset.imageUrls[0] ?? '',
  extraJson: JSON.stringify({
    prompt: asset.prompt,
    favorite: asset.favorite ?? false,
  }),
})
