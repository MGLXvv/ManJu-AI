import { delay } from '@/api/local'
import { mapVoiceAssetsToSettingVoiceOptions } from '@/features/voice/voiceOptionState'
import { MOCK_MEDIA_IMAGE_URL } from '@/mocks/mockMedia'
import { cloneSettingAsset, createDefaultSettingAssets } from '@/mocks/setting.mock'
import { mockVoices } from '@/mocks/voice.mock'
import { mediaUploadService } from '@/services/media'
import type {
  CreateSettingAssetInput,
  GenerateSettingAssetImageResult,
  SettingApiContract,
  SettingAsset,
} from './setting.types'

const createGeneratedImage = (asset: SettingAsset): string =>
  `${MOCK_MEDIA_IMAGE_URL}?kind=setting-api&type=${encodeURIComponent(asset.type)}&asset=${encodeURIComponent(asset.id)}&v=${Date.now()}`

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
      imageMediaIds: [],
      candidateImages: [],
      candidateMediaIds: [],
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
    const media = await mediaUploadService.captureUrl(
      imageUrl,
      { targetType: 'setting-asset', targetId: asset.id, kind: 'image' },
      `${asset.id}-upload`,
    )
    const nextUrl = media?.url ?? imageUrl
    const nextMediaId = media?.mediaId ?? ''
    return cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [nextUrl, ...asset.imageUrls].slice(0, 6),
      imageMediaIds: [nextMediaId, ...(asset.imageMediaIds ?? [])].slice(0, 6),
      candidateImages: [nextUrl, ...(asset.candidateImages ?? [])].slice(0, 12),
      candidateMediaIds: [nextMediaId, ...(asset.candidateMediaIds ?? [])].slice(0, 12),
    })
  },

  async selectCandidateImage(asset: SettingAsset, imageUrl: string) {
    await delay(60)
    const currentIndex = asset.imageUrls.findIndex((item) => item === imageUrl)
    const candidateIndex = (asset.candidateImages ?? []).findIndex((item) => item === imageUrl)
    const selectedMediaId =
      (currentIndex >= 0 ? asset.imageMediaIds?.[currentIndex] : undefined) ??
      (candidateIndex >= 0 ? asset.candidateMediaIds?.[candidateIndex] : undefined) ??
      ''
    const restUrls = asset.imageUrls.filter((item) => item !== imageUrl)
    const restMediaIds = asset.imageUrls
      .map((_, index) => asset.imageMediaIds?.[index] ?? '')
      .filter((_, index) => index !== currentIndex)
    return cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...restUrls].slice(0, 6),
      imageMediaIds: [selectedMediaId, ...restMediaIds].slice(0, 6),
    })
  },

  async generateAssetImage(asset: SettingAsset): Promise<GenerateSettingAssetImageResult> {
    await delay(1400)
    const imageUrl = createGeneratedImage(asset)
    return {
      imageUrl,
      asset: cloneSettingAsset({
        ...asset,
        status: 'ready',
        imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
        imageMediaIds: ['', ...(asset.imageMediaIds ?? [])].slice(0, 6),
        candidateImages: [...(asset.candidateImages ?? []), imageUrl].slice(-12),
        candidateMediaIds: [...(asset.candidateMediaIds ?? []), ''].slice(-12),
      }),
    }
  },
}
