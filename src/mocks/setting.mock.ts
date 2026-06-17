import type { SettingAsset, SettingAssetType, VoiceOption } from '@/types/settingAsset'

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

const now = (): string => '2026年3月12日 17:16'

export const settingVoiceOptions: VoiceOption[] = [
  { id: 'male-mid-deep', name: '浑厚男中音', duration: '00:30' },
  { id: 'male-clear', name: '清亮青年音', duration: '00:28' },
  { id: 'female-soft', name: '温柔女声', duration: '00:32' },
  { id: 'narrator', name: '磁性旁白', duration: '00:35' },
  { id: 'girl-lively', name: '活泼少女音', duration: '00:29' },
]

export const getDefaultVoiceOptions = (): VoiceOption[] => settingVoiceOptions.map((item) => ({ ...item }))

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
    roleName: type === 'character' ? '角色音色' : undefined,
    prompt:
      'masterpiece, best quality, 1girl, long hair, beautiful girl, flipping hair, hand in hair, leaning on car, sleek sports car, urban street background, sunset, golden hour, cinematic lighting, vibrant colors, detailed outfit,',
    imageUrls,
    candidateImages: [...imageUrls],
    selectedVoiceId: type === 'character' ? 'male-mid-deep' : undefined,
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
    createSeedAsset(2, 'character', '角色-男主', 'ready'),
    createSeedAsset(3, 'scene', '场景-沙地', 'ready'),
    createSeedAsset(4, 'prop', '道具-武器', 'ready'),
    createSeedAsset(5, 'character', '角色-男主', 'ready'),
    createSeedAsset(6, 'character', '角色-女主', 'generating'),
    createSeedAsset(7, 'character', '角色-男主', 'ready'),
    createSeedAsset(8, 'scene', '场景-沙地', 'ready'),
    createSeedAsset(9, 'prop', '道具-武器', 'ready'),
  ].map(cloneSettingAsset)
