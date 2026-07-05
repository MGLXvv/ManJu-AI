import { delay } from '@/api/local'
import { mapVoiceAssetsToSettingVoiceOptions } from '@/features/voice/voiceOptionState'
import { cloneSettingAsset, createDefaultSettingAssets } from '@/mocks/setting.mock'
import { mockVoices } from '@/mocks/voice.mock'
import type {
  CreateSettingAssetInput,
  GenerateSettingAssetImageResult,
  SettingApiContract,
  SettingAsset,
  SettingAssetType,
} from './setting.types'

const createGeneratedImage = (title: string, type: SettingAssetType, seed: number): string => {
  const palettes: Record<SettingAssetType, [string, string]> = {
    character: ['#2e3a62', '#684b9a'],
    scene: ['#584226', '#b68652'],
    prop: ['#2f3446', '#6f79a8'],
  }
  const [colorA, colorB] = palettes[type]
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
      <text x="28" y="320" fill="rgba(255,255,255,0.88)" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="28" font-weight="700">${title}</text>
    </svg>`,
  )
  return `data:image/svg+xml;charset=UTF-8,${encoded}`
}

const resolveAssetVoiceFields = (
  input: Pick<SettingAsset, 'type' | 'voiceId' | 'voiceName' | 'selectedVoiceId'>,
): Pick<SettingAsset, 'voiceId' | 'voiceName' | 'selectedVoiceId' | 'voiceOptions'> => {
  if (input.type !== 'character') {
    return {
      voiceId: undefined,
      voiceName: undefined,
      selectedVoiceId: undefined,
      voiceOptions: undefined,
    }
  }

  const voiceOptions = mapVoiceAssetsToSettingVoiceOptions(mockVoices)
  const selectedVoiceId = input.voiceId?.trim() || input.selectedVoiceId?.trim() || ''
  const selectedVoice = mockVoices.find((voice) => voice.id === selectedVoiceId)
  const fallbackVoiceName = input.voiceName?.trim() || undefined

  return {
    voiceId: selectedVoice?.id ?? (selectedVoiceId || undefined),
    voiceName: selectedVoice?.name ?? fallbackVoiceName,
    selectedVoiceId: selectedVoice?.id ?? (selectedVoiceId || undefined),
    voiceOptions,
  }
}

export const settingMockApi: SettingApiContract = {
  async listDefaults() {
    await delay()
    return createDefaultSettingAssets()
  },

  async createAsset(input: CreateSettingAssetInput) {
    await delay(80)
    const voiceFields = resolveAssetVoiceFields({
      type: input.type,
      voiceId: input.voiceId,
      voiceName: input.voiceName,
      selectedVoiceId: input.voiceId,
    })

    return {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: input.type,
      title: input.title,
      roleName: input.type === 'character' ? input.roleName?.trim() || '' : undefined,
      description: input.description,
      prompt: input.prompt,
      imageUrls: [],
      candidateImages: [],
      ...voiceFields,
      status: 'empty',
      favorite: false,
      createdAt: '2026-03-12 17:16',
    }
  },

  async updateAsset(asset: SettingAsset, patch: Partial<SettingAsset>) {
    await delay(60)
    const merged = { ...asset, ...patch }
    const voiceFields = resolveAssetVoiceFields({
      type: merged.type,
      voiceId: merged.voiceId,
      voiceName: merged.voiceName,
      selectedVoiceId: merged.selectedVoiceId,
    })

    return cloneSettingAsset({
      ...merged,
      ...voiceFields,
    })
  },

  async uploadAssetImage(asset: SettingAsset, imageUrl: string) {
    await delay(80)
    return cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
      candidateImages: [imageUrl, ...(asset.candidateImages ?? [])].slice(0, 12),
    })
  },

  async selectCandidateImage(asset: SettingAsset, imageUrl: string) {
    await delay(60)
    const rest = asset.imageUrls.filter((item) => item !== imageUrl)
    return cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...rest].slice(0, 6),
    })
  },

  async generateAssetImage(asset: SettingAsset): Promise<GenerateSettingAssetImageResult> {
    await delay(1400)
    const imageUrl = createGeneratedImage(asset.title, asset.type, Math.floor(Math.random() * 1000))
    return {
      imageUrl,
      asset: cloneSettingAsset({
        ...asset,
        status: 'ready',
        imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
        candidateImages: [...(asset.candidateImages ?? []), imageUrl].slice(-12),
      }),
    }
  },
}
