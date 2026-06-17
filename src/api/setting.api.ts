import { cloneSettingAsset, createDefaultSettingAssets, getDefaultVoiceOptions } from '@/mocks/setting.mock'
import type { SettingAsset, SettingAssetType } from '@/types/settingAsset'
import { delay } from './local'

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

export const settingApi = {
  async listDefaults(): Promise<SettingAsset[]> {
    await delay()
    return createDefaultSettingAssets()
  },

  async createAsset(input: { type: SettingAssetType; title: string; prompt: string }): Promise<SettingAsset> {
    await delay(80)
    return {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: input.type,
      title: input.title,
      roleName: input.type === 'character' ? '角色音色' : undefined,
      prompt: input.prompt,
      imageUrls: [],
      candidateImages: [],
      selectedVoiceId: input.type === 'character' ? 'male-mid-deep' : undefined,
      voiceOptions: input.type === 'character' ? getDefaultVoiceOptions() : undefined,
      status: 'empty',
      favorite: false,
      createdAt: '2026年3月12日 17:16',
    }
  },

  async updateAsset(asset: SettingAsset, patch: Partial<SettingAsset>): Promise<SettingAsset> {
    await delay(60)
    return cloneSettingAsset({ ...asset, ...patch })
  },

  async uploadAssetImage(asset: SettingAsset, imageUrl: string): Promise<SettingAsset> {
    await delay(80)
    return cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
      candidateImages: [imageUrl, ...(asset.candidateImages ?? [])].slice(0, 12),
    })
  },

  async selectCandidateImage(asset: SettingAsset, imageUrl: string): Promise<SettingAsset> {
    await delay(60)
    const rest = asset.imageUrls.filter((item) => item !== imageUrl)
    return cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...rest].slice(0, 6),
    })
  },

  async generateAssetImage(asset: SettingAsset): Promise<{ imageUrl: string; asset: SettingAsset }> {
    await delay(1400)
    const imageUrl = createGeneratedImage(asset.title, asset.type, Math.floor(Math.random() * 1000))
    return {
      imageUrl,
      asset: cloneSettingAsset({
        ...asset,
        status: 'ready',
        imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
      }),
    }
  },
}
