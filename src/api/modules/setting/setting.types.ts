import type { SettingAsset, SettingAssetType } from '@/types/settingAsset'

export type { SettingAsset, SettingAssetType } from '@/types/settingAsset'

export interface CreateSettingAssetInput {
  type: SettingAssetType
  title: string
  roleName?: string
  description: string
  prompt: string
  voiceId?: string
  voiceName?: string
}

export interface GenerateSettingAssetImageResult {
  imageUrl: string
  asset: SettingAsset
}

export interface SettingApiContract {
  listDefaults(): Promise<SettingAsset[]>
  createAsset(input: CreateSettingAssetInput): Promise<SettingAsset>
  updateAsset(asset: SettingAsset, patch: Partial<SettingAsset>): Promise<SettingAsset>
  uploadAssetImage(asset: SettingAsset, imageUrl: string): Promise<SettingAsset>
  selectCandidateImage(asset: SettingAsset, imageUrl: string): Promise<SettingAsset>
  generateAssetImage(asset: SettingAsset): Promise<GenerateSettingAssetImageResult>
}
