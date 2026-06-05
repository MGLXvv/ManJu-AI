import type { EditorDraft, PropSetting } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'

const cloneVoiceOptions = (asset: SettingAsset): SettingAsset['voiceOptions'] =>
  asset.voiceOptions?.map((option) => ({ ...option }))

const cloneAudio = (asset: SettingAsset): SettingAsset['audio'] =>
  asset.audio
    ? {
        ...asset.audio,
        waveform: asset.audio.waveform ? [...asset.audio.waveform] : undefined,
      }
    : undefined

const cloneAsset = (asset: SettingAsset): SettingAsset => ({
  ...asset,
  imageUrls: [...asset.imageUrls],
  candidateImages: asset.candidateImages ? [...asset.candidateImages] : undefined,
  voiceOptions: cloneVoiceOptions(asset),
  audio: cloneAudio(asset),
})

const buildSummary = (assets: SettingAsset[], type: SettingAsset['type']): PropSetting[] =>
  assets
    .filter((asset) => asset.type === type)
    .map((asset) => ({
      id: asset.id,
      name: asset.title,
      description: asset.prompt,
    }))

export const resolveSettingAssets = (draft: EditorDraft | null, fallbackAssets: SettingAsset[]): SettingAsset[] => {
  const source = draft?.settingAssets?.length ? draft.settingAssets : fallbackAssets
  return source.map(cloneAsset)
}

export const buildSettingDraftPatch = (
  assets: SettingAsset[],
): Pick<EditorDraft, 'settingAssets' | 'characters' | 'scenes' | 'props'> => {
  const clonedAssets = assets.map(cloneAsset)
  return {
    settingAssets: clonedAssets,
    characters: buildSummary(clonedAssets, 'character'),
    scenes: buildSummary(clonedAssets, 'scene'),
    props: buildSummary(clonedAssets, 'prop'),
  }
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
