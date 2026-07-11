import type { DubbingRoleLineDraft } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

export interface ScriptGenerateResult {
  script: string
}

export interface ScriptOptimizeResult {
  script: string
}

export interface StoryboardImageTaskResult {
  shotId: string
  imageUrl: string
  shot?: StoryboardShot
}

export interface StoryboardImageResult extends StoryboardImageTaskResult {
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

export interface StoryboardUpscaleTaskResult {
  shotId: string
  imageUrl: string
  shot?: StoryboardShot
}

export interface StoryboardUpscaleResult extends StoryboardUpscaleTaskResult {
  shot: StoryboardShot
}

export interface SettingAssetImageTaskResult {
  assetId: string
  imageUrl: string
  asset?: SettingAsset
}

export interface SettingAssetImageResult extends SettingAssetImageTaskResult {
  asset: SettingAsset
}

export interface VideoGenerateTaskResult {
  shotId: string
  videoUrl: string
  shot?: StoryboardShot
}

export interface VideoGenerateResult extends VideoGenerateTaskResult {
  shot: StoryboardShot
}

export interface VideoOptimizeResult {
  value: string
}

export interface DubbingGenerateTaskResult {
  cardId: string
  lineIds: string[]
  lines?: DubbingRoleLineDraft[]
  audioByLineId?: Record<string, string>
}

export interface DubbingGenerateResult extends DubbingGenerateTaskResult {
  lines: DubbingRoleLineDraft[]
}
