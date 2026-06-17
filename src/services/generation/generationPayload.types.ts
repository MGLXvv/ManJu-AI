import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

export interface ScriptGeneratePayload {
  [key: string]: unknown
  sourceText: string
  promptText: string
  modelId: string
}

export interface ScriptOptimizePayload {
  [key: string]: unknown
  scriptText: string
  modelId: string
}

export interface StoryboardGeneratePayload {
  [key: string]: unknown
  shotId: string
  title: string
  prompt: string
  style: string
  ratio: StoryboardShot['ratio']
  characters: StoryboardShot['characters']
  scenes: StoryboardShot['scenes']
  props: StoryboardShot['props']
  referenceImages: StoryboardShot['referenceImages']
  shot: StoryboardShot
}

export interface StoryboardOptimizePayload {
  [key: string]: unknown
  prompt: string
  mode: 'active-shot' | 'insert-shot'
}

export interface StoryboardUpscalePayload {
  [key: string]: unknown
  shotId: string
  title: string
  imageUrl?: string
  prompt: string
  style: string
  ratio: StoryboardShot['ratio']
  shot: StoryboardShot
}

export interface SettingAssetGeneratePayload {
  [key: string]: unknown
  assetId: string
  type: SettingAsset['type']
  name: string
  description: string
  prompt: string
  asset: SettingAsset
}
