import type { DubbingRoleLineDraft } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

export interface ScriptGenerateResult {
  script: string
}

export interface ScriptOptimizeResult {
  script: string
}

export interface StoryboardImageResult {
  shotId: string
  imageUrl: string
  shot: StoryboardShot
}

export interface StoryboardPromptOptimizeResult {
  prompt: string
}

export interface StoryboardPromptOptimizeBatchItem {
  shotId: string
  prompt: string
  success: boolean
  errorMessage?: string
}

export interface StoryboardPromptOptimizeBatchResult {
  items: StoryboardPromptOptimizeBatchItem[]
}

export interface StoryboardUpscaleResult {
  shotId: string
  imageUrl: string
  shot: StoryboardShot
}

export interface SettingAssetImageResult {
  assetId: string
  imageUrl: string
  asset: SettingAsset
}

export interface VideoGenerateResult {
  shotId: string
  videoUrl: string
  shot: StoryboardShot
}

export interface VideoOptimizeResult {
  value: string
}

export interface DubbingGenerateResult {
  cardId: string
  lines: DubbingRoleLineDraft[]
  lineIds: string[]
}
