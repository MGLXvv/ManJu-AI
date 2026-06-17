import { API_ERROR_CODES } from '@/types/api-enums'
import type {
  ScriptGenerateResult,
  ScriptOptimizeResult,
  SettingAssetImageResult,
  StoryboardImageResult,
  StoryboardPromptOptimizeResult,
  StoryboardUpscaleResult,
} from './generationResult.types'

export const assertScriptGenerateResult = (
  result: Partial<ScriptGenerateResult> | undefined,
): ScriptGenerateResult => {
  if (!result?.script) {
    throw new Error('SCRIPT_GENERATE_FAILED')
  }

  return { script: result.script }
}

export const assertScriptOptimizeResult = (
  result: Partial<ScriptOptimizeResult> | undefined,
): ScriptOptimizeResult => {
  if (!result?.script) {
    throw new Error('SCRIPT_OPTIMIZE_FAILED')
  }

  return { script: result.script }
}

export const assertStoryboardImageResult = (
  result: Partial<StoryboardImageResult> | undefined,
): StoryboardImageResult => {
  if (!result?.imageUrl || !result?.shot) {
    throw new Error(API_ERROR_CODES.storyboardGenerateFailed)
  }

  return {
    shotId: result.shotId ?? result.shot.id,
    imageUrl: result.imageUrl,
    shot: result.shot,
  }
}

export const assertStoryboardPromptResult = (
  result: Partial<StoryboardPromptOptimizeResult> | undefined,
): StoryboardPromptOptimizeResult => {
  if (!result?.prompt) {
    throw new Error(API_ERROR_CODES.storyboardOptimizeFailed)
  }

  return { prompt: result.prompt }
}

export const assertStoryboardUpscaleResult = (
  result: Partial<StoryboardUpscaleResult> | undefined,
): StoryboardUpscaleResult => {
  if (!result?.imageUrl || !result?.shot) {
    throw new Error(API_ERROR_CODES.storyboardUpscaleFailed)
  }

  return {
    shotId: result.shotId ?? result.shot.id,
    imageUrl: result.imageUrl,
    shot: result.shot,
  }
}

export const assertSettingAssetResult = (
  result: Partial<SettingAssetImageResult> | undefined,
): SettingAssetImageResult => {
  if (!result?.imageUrl || !result?.asset) {
    throw new Error(API_ERROR_CODES.settingImageGenerateFailed)
  }

  return {
    assetId: result.assetId ?? result.asset.id,
    imageUrl: result.imageUrl,
    asset: result.asset,
  }
}
