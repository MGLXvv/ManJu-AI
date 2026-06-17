import type { EditorDraft } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
import { buildSettingDraftPatch as buildSharedSettingDraftPatch, cloneSettingAssetDraft } from './editorDraftMapper'

const cloneAsset = (asset: SettingAsset): SettingAsset => cloneSettingAssetDraft(asset)

export const resolveSettingAssets = (draft: EditorDraft | null, fallbackAssets: SettingAsset[]): SettingAsset[] => {
  const source = draft?.settingAssets?.length ? draft.settingAssets : fallbackAssets
  return source.map(cloneAsset)
}

export const buildSettingDraftPatch = (
  assets: SettingAsset[],
): Pick<EditorDraft, 'settingAssets' | 'characters' | 'scenes' | 'props'> => {
  return buildSharedSettingDraftPatch(assets)
}

export const buildSettingAssetsSnapshot = (assets: SettingAsset[]): string => {
  return JSON.stringify(
    assets.map((asset) => ({
      ...asset,
      imageUrls: [...asset.imageUrls],
      candidateImages: asset.candidateImages ? [...asset.candidateImages] : [],
      voiceOptions: asset.voiceOptions?.map((option) => ({ ...option })) ?? [],
      audio: asset.audio
        ? {
            ...asset.audio,
            waveform: asset.audio.waveform ? [...asset.audio.waveform] : [],
          }
        : null,
    })),
  )
}
