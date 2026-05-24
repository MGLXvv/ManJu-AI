export type SettingAssetType = 'character' | 'scene' | 'prop'
export type SettingAssetTypeFilter = 'all' | SettingAssetType
export type SettingAssetStatus = 'ready' | 'generating' | 'empty'
export type AssetPanelMode = 'prompt' | 'voice'

export interface SettingAssetAudio {
  title: string
  currentTime: string
  duration: string
  waveform?: number[]
}

export interface VoiceOption {
  id: string
  name: string
  description?: string
  duration?: string
  audioUrl?: string
}

export interface SettingAsset {
  id: string
  type: SettingAssetType
  title: string
  roleName?: string
  prompt: string
  imageUrls: string[]
  candidateImages?: string[]
  activePanel?: AssetPanelMode
  selectedVoiceId?: string
  voiceOptions?: VoiceOption[]
  audio?: SettingAssetAudio
  status: SettingAssetStatus
  favorite?: boolean
  createdAt: string
}
