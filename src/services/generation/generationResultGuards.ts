import { API_ERROR_CODES } from '@/types/api-enums'
import type {
  ScriptGenerateResult,
  ScriptOptimizeResult,
  SettingAssetImageResult,
  StoryboardImageResult,
  StoryboardPromptOptimizeResult,
  StoryboardUpscaleResult,
  VideoGenerateResult,
  VideoOptimizeResult,
} from './generationResult.types'

export const assertScriptGenerateResult = (
  result: Partial<ScriptGenerateResult> | undefined,
): ScriptGenerateResult => {
  if (!result?.script) {
    throw new Error(API_ERROR_CODES.scriptGenerateFailed)
  }

  return { script: result.script }
}

export const assertScriptOptimizeResult = (
  result: Partial<ScriptOptimizeResult> | undefined,
): ScriptOptimizeResult => {
  if (!result?.script) {
    throw new Error(API_ERROR_CODES.scriptOptimizeFailed)
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

export const assertVideoGenerateResult = (
  result: Partial<VideoGenerateResult> | undefined,
): VideoGenerateResult => {
  if (!result?.videoUrl || !result?.shot) {
    throw new Error(API_ERROR_CODES.videoGenerateFailed)
  }

  return {
    shotId: result.shotId ?? result.shot.id,
    videoUrl: result.videoUrl,
    shot: result.shot,
  }
}

export const assertVideoOptimizeResult = (
  result: Partial<VideoOptimizeResult> | undefined,
): VideoOptimizeResult => {
  if (!result || typeof result.value !== 'string') {
    throw new Error(API_ERROR_CODES.videoOptimizeFailed)
  }

  return { value: result.value }
}
