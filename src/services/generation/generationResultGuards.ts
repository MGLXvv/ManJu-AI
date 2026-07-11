import { API_ERROR_CODES } from '@/types/api-enums'
import type {
  DubbingGenerateTaskResult,
  ScriptGenerateResult,
  ScriptOptimizeResult,
  SettingAssetImageTaskResult,
  StoryboardImageTaskResult,
  StoryboardPromptOptimizeResult,
  StoryboardUpscaleTaskResult,
  VideoGenerateTaskResult,
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
  result: Partial<StoryboardImageTaskResult> | undefined,
): StoryboardImageTaskResult => {
  const shotId = result?.shotId ?? result?.shot?.id
  if (!result?.imageUrl || !shotId) {
    throw new Error(API_ERROR_CODES.storyboardGenerateFailed)
  }

  return {
    shotId,
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
  result: Partial<StoryboardUpscaleTaskResult> | undefined,
): StoryboardUpscaleTaskResult => {
  const shotId = result?.shotId ?? result?.shot?.id
  if (!result?.imageUrl || !shotId) {
    throw new Error(API_ERROR_CODES.storyboardUpscaleFailed)
  }

  return {
    shotId,
    imageUrl: result.imageUrl,
    shot: result.shot,
  }
}

export const assertSettingAssetResult = (
  result: Partial<SettingAssetImageTaskResult> | undefined,
): SettingAssetImageTaskResult => {
  const assetId = result?.assetId ?? result?.asset?.id
  if (!result?.imageUrl || !assetId) {
    throw new Error(API_ERROR_CODES.settingImageGenerateFailed)
  }

  return {
    assetId,
    imageUrl: result.imageUrl,
    asset: result.asset,
  }
}

export const assertVideoGenerateResult = (
  result: Partial<VideoGenerateTaskResult> | undefined,
): VideoGenerateTaskResult => {
  const shotId = result?.shotId ?? result?.shot?.id
  if (!result?.videoUrl || !shotId) {
    throw new Error(API_ERROR_CODES.videoGenerateFailed)
  }

  return {
    shotId,
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

export const assertDubbingGenerateResult = (
  result: Partial<DubbingGenerateTaskResult> | undefined,
): DubbingGenerateTaskResult => {
  const lines = Array.isArray(result?.lines) ? result.lines : undefined
  const lineIds = Array.isArray(result?.lineIds)
    ? result.lineIds
    : lines?.map((line) => line.id)
  if (!result?.cardId || !Array.isArray(lineIds)) {
    throw new Error(API_ERROR_CODES.dubbingGenerateFailed)
  }

  return {
    cardId: result.cardId,
    lineIds,
    lines,
    audioByLineId: result.audioByLineId,
  }
}
