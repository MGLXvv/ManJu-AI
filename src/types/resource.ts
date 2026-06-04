import type { VoiceOption } from './settingAsset'

export type ResourceLibraryTab = 'creative' | 'subject'
export type ResourceAssetType = 'character' | 'scene'
export type ResourceAssetSource = 'created' | 'favorite' | 'official'
export type ResourceSourceFilter = 'all' | ResourceAssetSource
export type ResourceTypeFilter = 'all' | ResourceAssetType

export interface ResourceFolder {
  id: string
  label: string
  tab: ResourceLibraryTab
  source: ResourceAssetSource
}

export interface ResourceAsset {
  id: string
  tab: ResourceLibraryTab
  type: ResourceAssetType
  source: ResourceAssetSource
  name: string
  prompt: string
  imageUrl: string
  selectedVoiceId?: string
  voiceOptions?: VoiceOption[]
}
