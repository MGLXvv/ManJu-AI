import type { SettingAsset, SettingAssetType, VoiceOption } from '@/types/settingAsset'
import { mockVoices } from './voice.mock'
import { mapVoiceAssetsToSettingVoiceOptions } from '@/features/voice/voiceOptionState'

const createImage = (_label: string, colorA: string, colorB: string, seed: number): string => {
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#g)" />
      <circle cx="${80 + (seed % 7) * 70}" cy="${58 + (seed % 5) * 48}" r="${28 + (seed % 4) * 8}" fill="rgba(255,255,255,0.2)" />
    </svg>`,
  )
  return `data:image/svg+xml;charset=UTF-8,${encoded}`
}

const now = (): string => '2026-03-12 17:16'

export const getDefaultVoiceOptions = (): VoiceOption[] => mapVoiceAssetsToSettingVoiceOptions(mockVoices)

const defaultCharacterVoice = mockVoices[0]

export const cloneSettingAsset = (asset: SettingAsset): SettingAsset => ({
  ...asset,
  imageUrls: [...asset.imageUrls],
  candidateImages: asset.candidateImages ? [...asset.candidateImages] : undefined,
  voiceOptions: asset.voiceOptions?.map((item) => ({ ...item })),
  audio: asset.audio
    ? {
        ...asset.audio,
        waveform: asset.audio.waveform ? [...asset.audio.waveform] : undefined,
      }
    : undefined,
})

const buildDescription = (type: SettingAssetType, title: string): string => {
  if (type === 'character') {
    return `${title}的角色设定，包含基础性格和外观描述。`
  }

  if (type === 'scene') {
    return `${title}的空间设定，用于分镜场景引用。`
  }

  return `${title}的道具设定，用于镜头内关键物件引用。`
}

const createSeedAsset = (index: number, type: SettingAssetType, title: string, status: SettingAsset['status']): SettingAsset => {
  const palettes: Record<SettingAssetType, [string, string]> = {
    character: ['#2e3a62', '#684b9a'],
    scene: ['#584226', '#b68652'],
    prop: ['#2f3446', '#6f79a8'],
  }
  const [a, b] = palettes[type]

  const imageUrls =
    status === 'ready'
      ? [
          createImage(`${title}-1`, a, b, index * 3 + 1),
          createImage(`${title}-2`, b, a, index * 3 + 2),
          createImage(`${title}-3`, '#3f4f65', '#8863c5', index * 3 + 3),
          createImage(`${title}-4`, '#614133', '#d2a571', index * 3 + 4),
        ]
      : []

  return {
    id: `asset-${index + 1}`,
    type,
    title,
    roleName: type === 'character' ? '角色设定' : undefined,
    description: buildDescription(type, title),
    prompt:
      'masterpiece, best quality, 1girl, long hair, beautiful girl, cinematic lighting, detailed outfit',
    imageUrls,
    candidateImages: [...imageUrls],
    voiceId: type === 'character' ? defaultCharacterVoice?.id : undefined,
    voiceName: type === 'character' ? defaultCharacterVoice?.name : undefined,
    selectedVoiceId: type === 'character' ? defaultCharacterVoice?.id : undefined,
    voiceOptions: type === 'character' ? getDefaultVoiceOptions() : undefined,
    status,
    favorite: index % 3 === 0,
    createdAt: now(),
  }
}

export const createDefaultSettingAssets = (): SettingAsset[] =>
  [
    createSeedAsset(0, 'character', '角色-男主', 'ready'),
    createSeedAsset(1, 'character', '角色-女主', 'generating'),
    createSeedAsset(2, 'character', '角色-反派', 'ready'),
    createSeedAsset(3, 'scene', '场景-沙地', 'ready'),
    createSeedAsset(4, 'prop', '道具-武器', 'ready'),
    createSeedAsset(5, 'character', '角色-男主', 'ready'),
    createSeedAsset(6, 'character', '角色-女主', 'generating'),
    createSeedAsset(7, 'character', '角色-护卫', 'ready'),
    createSeedAsset(8, 'scene', '场景-夜街', 'ready'),
    createSeedAsset(9, 'prop', '道具-古镜', 'ready'),
  ].map(cloneSettingAsset)
